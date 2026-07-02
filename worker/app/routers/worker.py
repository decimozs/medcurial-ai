import asyncio
import base64
import json
import re
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, status, UploadFile
from fastapi.responses import StreamingResponse
from loguru import logger
from supabase import Client

from app.config import get_settings
from app.dependencies import get_api_base_url, get_supabase_client
from app.exceptions import ExternalAPIError, TooManyFilesError
from app.schemas.worker import (
    SignatureVerificationRequest,
    SignatureVerificationResponse,
    SignatureVerificationResult,
)
from app.services.api_client import (
    get_document,
    get_signature,
    list_signatures,
    patch_document_verification,
    save_to_api,
    save_document_to_api,
    update_document_status,
    update_signature_status,
)
from app.services.roboflow import analyze_document
from app.services.signature_analyzer import SignatureAnalyzer
from app.services.storage import (
    IMAGE_TYPES,
    download_image_bytes,
    upload_base64_image,
    upload_documents,
)
from app.services.utils import (
    validate_image,
    process_single_image,
)

router = APIRouter(prefix="/workers", tags=["workers"])


async def process_single_document(
    idx: int,
    document_url: str,
    filename: str,
    api_url: str,
    supabase_client: Client,
    settings: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    document_id = None
    try:
        viz_urls: dict[str, str] = {}
        filtered_result: dict[str, Any] = {}

        image_urls = {
            "original": document_url,
            "text_extraction": "",
            "signature_extraction": "",
        }

        try:
            document_data = await save_document_to_api(
                api_url, filename, image_urls, "processing"
            )
            document_id = document_data.get("id") if document_data else None
        except ExternalAPIError:
            document_id = None

        result_event = {
            "image_index": idx,
            "document_id": document_id,
            "status": "processing",
            "document_url": document_url,
            "processed_urls": None,
            "result": None,
            "error": None,
        }
        yield result_event

        if document_id:
            result = await analyze_document(
                api_key=settings.roboflow_api_key,
                api_url=settings.roboflow_api_url,
                workspace_name=settings.roboflow_workspace_name,
                workflow_id=settings.roboflow_workspace_id,
                image_url=document_url,
            )

            result_data = result.get("outputs", []) if isinstance(result, dict) else []
            if result_data:
                output = result_data[0]
                if isinstance(output, dict):
                    for key, value in output.items():
                        if key == "signature_visualization":
                            sig_viz = (
                                value.get("value") if isinstance(value, dict) else None
                            )
                            if sig_viz:
                                try:
                                    viz_urls["signature_extraction"] = (
                                        upload_base64_image(supabase_client, sig_viz)
                                    )
                                    original_for_crop = download_image_bytes(
                                        supabase_client, document_url
                                    )
                                    if original_for_crop:
                                        sig_viz_bytes = base64.b64decode(sig_viz)
                                        crop_bytes = _extract_signature_crop(
                                            original_for_crop, sig_viz_bytes
                                        )
                                        if crop_bytes:
                                            crop_b64 = base64.b64encode(
                                                crop_bytes
                                            ).decode("utf-8")
                                            viz_urls["signature_crop"] = (
                                                upload_base64_image(
                                                    supabase_client, crop_b64
                                                )
                                            )
                                except Exception:
                                    pass
                        elif key == "text_visualization":
                            txt_viz = (
                                value.get("value") if isinstance(value, dict) else None
                            )
                            if txt_viz:
                                try:
                                    viz_urls["text_extraction"] = upload_base64_image(
                                        supabase_client, txt_viz
                                    )
                                except Exception:
                                    pass
                        else:
                            filtered_result[key] = value

            image_urls["text_extraction"] = viz_urls.get("text_extraction", "")
            image_urls["signature_extraction"] = viz_urls.get(
                "signature_extraction", ""
            )
            image_urls["signature_crop"] = viz_urls.get("signature_crop", "")

            if document_id:
                try:
                    await update_document_status(
                        api_url,
                        document_id,
                        "completed",
                        image_urls,
                        extracted_text=filtered_result.get("text_extraction"),
                    )
                except Exception:
                    pass

        result_event = {
            "image_index": idx,
            "document_id": document_id,
            "status": "completed",
            "document_url": document_url,
            "processed_urls": viz_urls if viz_urls else None,
            "result": filtered_result,
            "error": None,
        }
        yield result_event

        extracted_sig = image_urls.get("signature_crop") or image_urls.get(
            "signature_extraction"
        )
        if document_id and extracted_sig:
            asyncio.create_task(
                _auto_verify_signature(
                    document_id,
                    extracted_sig,
                    api_url,
                    supabase_client,
                    filtered_result.get("text_extraction"),
                )
            )

    except Exception as e:
        logger.exception("Failed processing document {}: {}", document_url, e)
        if document_id:
            try:
                await update_document_status(api_url, document_id, "failed")
            except ExternalAPIError:
                pass

        result_event = {
            "image_index": idx,
            "document_id": None,
            "status": "failed",
            "document_url": document_url,
            "processed_urls": None,
            "result": None,
            "error": str(e),
        }
        yield result_event


def _find_detection_bbox(
    img_orig: np.ndarray,
    img_viz: np.ndarray,
) -> tuple[int, int, int, int] | None:
    """Find the Roboflow overlay region, ignoring document text/background."""
    if img_viz.shape[:2] != img_orig.shape[:2]:
        img_viz = cv2.resize(img_viz, (img_orig.shape[1], img_orig.shape[0]))

    hsv = cv2.cvtColor(img_viz, cv2.COLOR_BGR2HSV)
    # Roboflow visualizations usually mark detections with saturated colors.
    color_mask = cv2.inRange(hsv, np.array([0, 60, 40]), np.array([179, 255, 255]))

    if int(np.count_nonzero(color_mask)) < 20:
        diff = cv2.absdiff(img_orig, img_viz)
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, color_mask = cv2.threshold(diff_gray, 35, 255, cv2.THRESH_BINARY)

    kernel = np.ones((5, 5), np.uint8)
    color_mask = cv2.dilate(color_mask, kernel, iterations=2)
    color_mask = cv2.morphologyEx(color_mask, cv2.MORPH_CLOSE, kernel, iterations=1)

    contours, _ = cv2.findContours(
        color_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    contours = [c for c in contours if cv2.contourArea(c) > 20]
    if not contours:
        return None

    points = np.vstack(contours)
    x, y, w, h = cv2.boundingRect(points)
    image_area = img_orig.shape[0] * img_orig.shape[1]
    bbox_area = w * h

    # If the overlay covers most of the page, it is not a usable signature crop.
    if bbox_area > image_area * 0.45:
        return None

    return x, y, w, h


def _extract_signature_crop(original_bytes: bytes, viz_bytes: bytes) -> bytes | None:
    """Crop the detected signature region from the original document image."""
    try:
        arr_orig = np.frombuffer(original_bytes, np.uint8)
        img_orig = cv2.imdecode(arr_orig, cv2.IMREAD_COLOR)
        if img_orig is None:
            return None

        arr_viz = np.frombuffer(viz_bytes, np.uint8)
        img_viz = cv2.imdecode(arr_viz, cv2.IMREAD_COLOR)
        if img_viz is None:
            return None

        bbox = _find_detection_bbox(img_orig, img_viz)
        if bbox is None:
            return None

        x, y, w, h = bbox
        if w < 20 or h < 20:
            return None

        pad_x = int(w * 0.05)
        pad_y = int(h * 0.05)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(img_orig.shape[1], x + w + pad_x)
        y2 = min(img_orig.shape[0], y + h + pad_y)

        cropped = img_orig[y1:y2, x1:x2]
        _, buf = cv2.imencode(".png", cropped)
        return buf.tobytes()
    except Exception:
        return None


def _extract_physician_name(extracted_text: str | None) -> str | None:
    """Extract attending physician name from document OCR text."""
    if not extracted_text:
        return None

    patterns = [
        r"Attending\s*(?:Physician|Doctor)?\s*[:：]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
        r"(?:Physician|Doctor)\s*(?:Name)?\s*[:：]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
        r"Provider\s*[:：]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
        r"Name\s*[:：]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
    ]

    for pattern in patterns:
        match = re.search(pattern, extracted_text, re.IGNORECASE | re.MULTILINE)
        if match:
            name = match.group(1).strip()
            name = re.sub(
                r"^(Dr|Doctor|Mr|Mrs|Ms|Miss|Prof|Professor)\.?\s+",
                "",
                name,
                flags=re.IGNORECASE,
            ).strip()
            if len(name) > 3:
                return name

    return None


def _find_signature_by_name(
    physician_name: str | None,
    sigs: list[dict[str, Any]],
    extracted_text: str | None,
) -> dict[str, Any] | None:
    """Find enrolled signature matching physician name."""
    if not sigs:
        return None

    if physician_name:
        name_lower = physician_name.lower()
        for sig in sigs:
            sig_name = sig.get("name", "").lower()
            if (
                name_lower == sig_name
                or name_lower in sig_name
                or sig_name in name_lower
            ):
                return sig

    if extracted_text:
        text_lower = extracted_text.lower()
        for sig in sigs:
            sig_name = sig.get("name", "").lower()
            if len(sig_name) > 3 and sig_name in text_lower:
                return sig

    return None


async def _auto_verify_signature(
    document_id: str,
    extracted_sig_url: str,
    api_url: str,
    supabase_client: Client,
    extracted_text: str | None = None,
) -> None:
    """Background task: compare extracted signature against matched enrolled reference."""
    try:
        sigs = await list_signatures(api_url)
        if not sigs:
            return

        physician_name = _extract_physician_name(extracted_text)
        sig = _find_signature_by_name(physician_name, sigs, extracted_text)

        if sig is None:
            now = datetime.now(timezone.utc).isoformat()
            result = {
                "status": "no_verified_signature",
                "expectedSignatureId": "",
                "expectedSignatoryName": "",
                "comparedAt": now,
                "score": 0,
                "threshold": 0.45,
                "matchedReferenceUrl": "",
                "extractedSignatureUrl": extracted_sig_url,
                "overlayUrl": "",
                "notes": "No enrolled signature matches the attending physician in this document.",
                "error": None,
            }
            await patch_document_verification(api_url, document_id, result)
            return

        sig_id = sig["id"]
        sig_image_urls = sig.get("imageUrls", {})

        sig_siamese = sig_image_urls.get("siamese", [])
        sig_original = sig_image_urls.get("original", [])
        ref_urls = sig_siamese if sig_siamese else sig_original
        if not ref_urls:
            return

        extracted_bytes = download_image_bytes(supabase_client, extracted_sig_url)
        if extracted_bytes is None:
            return

        def _to_siamese(img_bytes: bytes) -> np.ndarray | None:
            try:
                processed = process_single_image(img_bytes)
                siamese_b64 = processed.get("siamese")
                if not siamese_b64:
                    return None
                img_data = base64.b64decode(siamese_b64)
                arr = np.frombuffer(img_data, np.uint8)
                return cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
            except Exception:
                return None

        extracted_siamese = _to_siamese(extracted_bytes)
        if extracted_siamese is None:
            return

        analyzer = SignatureAnalyzer()
        threshold = 0.45

        best_score = 0.0
        best_aligned: np.ndarray | None = None
        best_ref_siamese: np.ndarray | None = None
        best_ref_url = ""

        def _run_alignment(query: np.ndarray, ref: np.ndarray) -> tuple:
            return analyzer.align_signatures(query, ref)

        for ref_url in ref_urls:
            ref_bytes = download_image_bytes(supabase_client, ref_url)
            if ref_bytes is None:
                continue
            ref_siamese = _to_siamese(ref_bytes)
            if ref_siamese is None:
                continue

            aligned_img, match_score = await asyncio.to_thread(
                _run_alignment, extracted_siamese, ref_siamese
            )
            if match_score > best_score:
                best_score = match_score
                best_aligned = aligned_img.copy()
                best_ref_siamese = ref_siamese
                best_ref_url = ref_url

        if best_ref_siamese is None or best_aligned is None:
            return

        status_str = "verified" if best_score >= threshold else "mismatch"

        def _make_overlay(aligned: np.ndarray, ref: np.ndarray) -> str:
            viz = analyzer.get_overlap_viz(aligned, ref)
            _, buffer = cv2.imencode(".png", viz)
            return base64.b64encode(buffer).decode("utf-8")

        viz_b64 = await asyncio.to_thread(_make_overlay, best_aligned, best_ref_siamese)
        overlay_url = upload_base64_image(supabase_client, viz_b64)

        now = datetime.now(timezone.utc).isoformat()
        matched_ref_url = sig_image_urls.get("image_preview", [""])[0] or best_ref_url

        result = {
            "status": status_str,
            "expectedSignatureId": sig_id,
            "expectedSignatoryName": sig.get("name", ""),
            "comparedAt": now,
            "score": round(float(best_score), 4),
            "threshold": threshold,
            "matchedReferenceUrl": matched_ref_url,
            "extractedSignatureUrl": extracted_sig_url,
            "overlayUrl": overlay_url,
            "notes": None,
            "error": None,
        }

        await patch_document_verification(api_url, document_id, result)
    except Exception:
        logger.exception("Auto-verify failed for document {}", document_id)


@router.post(
    "/document-analysis",
    summary="Analyze document using Roboflow",
    status_code=status.HTTP_201_CREATED,
)
async def document_analysis(
    files: list[UploadFile] = File(
        ..., description="The document image files to be analyzed"
    ),
    supabase_client: Client = Depends(get_supabase_client),
    api_url: str = Depends(get_api_base_url),
):
    settings = get_settings()

    if len(files) > settings.max_upload_count:
        raise TooManyFilesError(settings.max_upload_count)

    image_bytes_list: list[bytes] = []
    content_types: list[str] = []
    filenames: list[str] = []

    for file in files:
        image_bytes = await validate_image(file)
        image_bytes_list.append(image_bytes)
        content_types.append(file.content_type or "image/jpeg")
        filenames.append(file.filename or "unnamed")

    document_urls = upload_documents(
        supabase_client,
        image_bytes_list,
        content_types,
    )

    async def generate():
        queue: asyncio.Queue[tuple[int, dict[str, Any]]] = asyncio.Queue()

        async def run_generator(idx: int, gen):
            async for result in gen:
                await queue.put((idx, result))
            await queue.put((idx, {"done": True}))

        tasks = [
            asyncio.create_task(
                run_generator(
                    idx,
                    process_single_document(
                        idx, document_url, filename, api_url, supabase_client, settings
                    ),
                )
            )
            for idx, (document_url, filename) in enumerate(
                zip(document_urls, filenames)
            )
            if document_url
        ]

        completed = 0
        total = len(tasks)

        while completed < total:
            idx, event = await queue.get()
            if event.get("done"):
                completed += 1
            else:
                yield f"data: {json.dumps(event)}\n\n"

        for task in tasks:
            task.cancel()

    return StreamingResponse(generate(), media_type="text/event-stream")


async def process_single_signature(
    idx: int,
    image_bytes: bytes,
    original_url: str,
    signatory_name: str,
    api_url: str,
    supabase_client: Client,
) -> AsyncGenerator[dict[str, Any], None]:
    signature_id = None

    from app.services.storage import upload_processed_images

    empty_image_urls: dict[str, list[str]] = {img_type: [] for img_type in IMAGE_TYPES}
    empty_image_urls["original"] = [original_url]

    try:
        try:
            signature_data = await save_to_api(
                api_url, signatory_name, empty_image_urls, "processing"
            )
            signature_id = signature_data.get("id") if signature_data else None
        except ExternalAPIError:
            signature_id = None

        result_event = {
            "image_index": idx,
            "signature_id": signature_id,
            "status": "processing",
            "original_url": original_url,
            "processed_urls": None,
            "error": None,
        }
        yield result_event

        if signature_id:
            try:
                processed_result = await asyncio.to_thread(
                    process_single_image, image_bytes
                )

                if isinstance(processed_result, Exception):
                    raise processed_result

                uploaded_urls = upload_processed_images(
                    supabase_client, [processed_result], signatory_name
                )

                image_urls: dict[str, list[str]] = {
                    img_type: [] for img_type in IMAGE_TYPES
                }
                image_urls["original"].append(original_url)

                if uploaded_urls:
                    for urls in uploaded_urls:
                        for img_type in [
                            "roi",
                            "normalized",
                            "siamese",
                            "image_preview",
                        ]:
                            if img_type in urls and urls[img_type]:
                                image_urls[img_type].append(urls[img_type])

                try:
                    await update_signature_status(
                        api_url, signature_id, "completed", image_urls
                    )
                except Exception:
                    pass

                result_event = {
                    "image_index": idx,
                    "signature_id": signature_id,
                    "status": "completed",
                    "original_url": original_url,
                    "processed_urls": image_urls,
                    "error": None,
                }
                yield result_event

            except Exception as e:
                if signature_id:
                    try:
                        await update_signature_status(
                            api_url, signature_id, "failed", None
                        )
                    except ExternalAPIError:
                        pass

                result_event = {
                    "image_index": idx,
                    "signature_id": signature_id,
                    "status": "failed",
                    "original_url": original_url,
                    "processed_urls": None,
                    "error": str(e),
                }
                yield result_event

    except Exception as e:
        result_event = {
            "image_index": idx,
            "signature_id": None,
            "status": "failed",
            "original_url": original_url,
            "processed_urls": None,
            "error": str(e),
        }
        yield result_event


@router.post(
    "/enroll-signature",
    summary="Enroll a signature into the system",
    status_code=status.HTTP_201_CREATED,
)
async def enroll_signature(
    signatory_name: str,
    files: list[UploadFile] = File(
        ..., description="The signature image files to be processed"
    ),
    supabase_client: Client = Depends(get_supabase_client),
    api_url: str = Depends(get_api_base_url),
):
    from app.services.storage import upload_original_image

    settings = get_settings()
    if len(files) > settings.max_upload_count:
        raise TooManyFilesError(settings.max_upload_count)

    image_bytes_list: list[bytes] = []
    original_urls: list[str] = []

    for file in files:
        image_bytes = await validate_image(file)
        image_bytes_list.append(image_bytes)

        original_url = upload_original_image(
            supabase_client, image_bytes, signatory_name
        )
        original_urls.append(original_url)

    async def generate():
        queue: asyncio.Queue[tuple[int, dict[str, Any]]] = asyncio.Queue()

        async def run_generator(idx: int, gen):
            async for result in gen:
                await queue.put((idx, result))
            await queue.put((idx, {"done": True}))

        tasks = [
            asyncio.create_task(
                run_generator(
                    idx,
                    process_single_signature(
                        idx,
                        image_bytes,
                        original_url,
                        signatory_name,
                        api_url,
                        supabase_client,
                    ),
                )
            )
            for idx, (image_bytes, original_url) in enumerate(
                zip(image_bytes_list, original_urls)
            )
        ]

        completed = 0
        total = len(tasks)

        while completed < total:
            idx, event = await queue.get()
            if event.get("done"):
                completed += 1
            else:
                yield f"data: {json.dumps(event)}\n\n"

        for task in tasks:
            task.cancel()

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post(
    "/signature-verification",
    summary="Compare extracted document signature against enrolled reference",
    status_code=status.HTTP_200_OK,
)
async def signature_verification(
    request: SignatureVerificationRequest,
    supabase_client: Client = Depends(get_supabase_client),
    api_url: str = Depends(get_api_base_url),
) -> SignatureVerificationResponse:
    document_id = request.document_id
    signature_id = request.signature_id

    try:
        doc_data = await get_document(api_url, document_id)
        sig_data = await get_signature(api_url, signature_id)
    except ExternalAPIError as e:
        return SignatureVerificationResponse(
            success=False, message=f"API fetch failed: {e}", data=None
        )

    doc_image_urls = doc_data.get("imageUrls", {})
    sig_image_urls = sig_data.get("imageUrls", {})
    extracted_sig_url = doc_image_urls.get("signature_crop") or doc_image_urls.get(
        "signature_extraction", ""
    )

    sig_siamese_list = sig_image_urls.get("siamese", [])
    sig_original_list = sig_image_urls.get("original", [])
    ref_url = (
        sig_siamese_list[0]
        if sig_siamese_list
        else (sig_original_list[0] if sig_original_list else "")
    )

    if not extracted_sig_url or not ref_url:
        return SignatureVerificationResponse(
            success=False,
            message="Missing signature images for comparison",
            data=None,
        )

    extracted_bytes = download_image_bytes(supabase_client, extracted_sig_url)
    ref_bytes = download_image_bytes(supabase_client, ref_url)

    if extracted_bytes is None or ref_bytes is None:
        return SignatureVerificationResponse(
            success=False,
            message="Failed to download signature images",
            data=None,
        )

    def _preprocess_to_siamese(img_bytes: bytes) -> np.ndarray | None:
        try:
            processed = process_single_image(img_bytes)
            siamese_b64 = processed.get("siamese")
            if not siamese_b64:
                return None
            img_data = base64.b64decode(siamese_b64)
            arr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
            return img
        except Exception:
            return None

    extracted_siamese, ref_siamese = await asyncio.gather(
        asyncio.to_thread(_preprocess_to_siamese, extracted_bytes),
        asyncio.to_thread(_preprocess_to_siamese, ref_bytes),
    )

    if extracted_siamese is None or ref_siamese is None:
        return SignatureVerificationResponse(
            success=False,
            message="Failed to preprocess signature images for comparison",
            data=None,
        )

    analyzer = SignatureAnalyzer()

    def _run_analysis(query: np.ndarray, ref: np.ndarray) -> tuple[np.ndarray, float]:
        return analyzer.align_signatures(query, ref)

    aligned_img, match_score = await asyncio.to_thread(
        _run_analysis, extracted_siamese, ref_siamese
    )

    threshold = 0.45
    status_str = "verified" if match_score >= threshold else "mismatch"

    def _generate_overlay(aligned: np.ndarray, ref: np.ndarray) -> str:
        viz = analyzer.get_overlap_viz(aligned, ref)
        _, buffer = cv2.imencode(".png", viz)
        return base64.b64encode(buffer).decode("utf-8")

    viz_base64 = await asyncio.to_thread(_generate_overlay, aligned_img, ref_siamese)
    overlay_url = upload_base64_image(supabase_client, viz_base64)

    now = datetime.now(timezone.utc).isoformat()
    signatory_name = sig_data.get("name", "")
    matched_ref_url = sig_image_urls.get("image_preview", [""])[0] or ref_url

    result = {
        "status": status_str,
        "expectedSignatureId": signature_id,
        "expectedSignatoryName": signatory_name,
        "comparedAt": now,
        "score": round(float(match_score), 4),
        "threshold": threshold,
        "matchedReferenceUrl": matched_ref_url,
        "extractedSignatureUrl": extracted_sig_url,
        "overlayUrl": overlay_url,
        "notes": None,
        "error": None,
    }

    try:
        await patch_document_verification(api_url, document_id, result)
    except ExternalAPIError as e:
        return SignatureVerificationResponse(
            success=False,
            message=f"Failed to patch document verification: {e}",
            data=None,
        )

    return SignatureVerificationResponse(
        success=True,
        message=f"Signature verification: {status_str}",
        data=SignatureVerificationResult(**result),
    )


enroll_signature_router = router

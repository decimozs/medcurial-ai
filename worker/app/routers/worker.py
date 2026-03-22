import asyncio
import json
from typing import Any, AsyncGenerator

from fastapi import APIRouter, Depends, File, status, UploadFile
from fastapi.responses import StreamingResponse
from supabase import Client

from app.config import get_settings
from app.dependencies import get_api_url, get_supabase_client
from app.exceptions import ExternalAPIError
from app.services.storage import IMAGE_TYPES, upload_base64_image, upload_documents
from app.services.api_client import (
    save_to_api,
    save_document_to_api,
    update_document_status,
    update_signature_status,
)
from app.services.roboflow import analyze_document
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

    except Exception as e:
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
    api_url: str = Depends(get_api_url),
):
    settings = get_settings()

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
    api_url: str = Depends(get_api_url),
):
    from app.services.storage import upload_original_image

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


enroll_signature_router = router

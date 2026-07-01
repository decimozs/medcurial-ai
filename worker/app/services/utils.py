import asyncio
from typing import Any

import cv2
import numpy as np
from fastapi import UploadFile
from supabase import Client

from app.config import get_settings
from app.exceptions import (
    FileSizeExceededError,
    ImageDimensionsExceededError,
    InvalidFileTypeError,
)
from app.services.signature_processor import SignatureProcessor
from app.services.storage import upload_original_images

MAX_WIDTH = 8000
MAX_HEIGHT = 8000


async def validate_image(file: UploadFile) -> bytes:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise InvalidFileTypeError()

    settings = get_settings()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    data = await file.read()

    if len(data) > max_bytes:
        raise FileSizeExceededError(settings.max_upload_size_mb)

    _validate_image_dimensions(data)

    return data


def _validate_image_dimensions(data: bytes) -> None:
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ImageDimensionsExceededError("Failed to decode image")
    height, width = img.shape[:2]
    if width > MAX_WIDTH or height > MAX_HEIGHT:
        raise ImageDimensionsExceededError(
            f"Image dimensions {width}x{height} exceed max {MAX_WIDTH}x{MAX_HEIGHT}"
        )


async def validate_images(
    files: list[UploadFile],
    supabase_client: Client,
    signatory_name: str,
) -> tuple[list[bytes], list[str]]:
    image_bytes_list: list[bytes] = []
    content_types: list[str] = []

    for file in files:
        image_bytes = await validate_image(file)
        image_bytes_list.append(image_bytes)
        content_types.append(file.content_type or "image/jpeg")

    original_urls = upload_original_images(
        supabase_client, image_bytes_list, signatory_name, content_types
    )

    return image_bytes_list, original_urls


def process_single_image(image_bytes: bytes) -> dict[str, Any]:
    processor = SignatureProcessor(image_bytes)
    return processor.process()


async def process_images_parallel(
    image_bytes_list: list[bytes],
) -> list[dict[str, Any]]:
    tasks = [
        asyncio.to_thread(process_single_image, img_bytes)
        for img_bytes in image_bytes_list
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results  # type: ignore[return-value]

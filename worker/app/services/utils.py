import asyncio
from typing import Any

from fastapi import UploadFile
from supabase import Client

from app.exceptions import InvalidFileTypeError
from app.services.signature_processor import SignatureProcessor
from app.services.storage import upload_original_images


async def validate_image(file: UploadFile) -> bytes:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise InvalidFileTypeError()
    return await file.read()


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

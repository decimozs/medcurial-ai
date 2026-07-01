import base64
from typing import Any

from nanoid import generate as nanoid_generate
from supabase import Client

BUCKET_NAME = "signatures"
DOCUMENTS_BUCKET = "documents"
IMAGE_TYPES = ["original", "roi", "normalized", "siamese", "image_preview"]
PROCESSED_IMAGE_TYPES = ["roi", "normalized", "siamese", "image_preview"]


def _get_sanitized_name(signatory_name: str) -> str:
    return signatory_name.replace(" ", "-").replace("/", "-").lower()


def _upload_image_to_supabase(
    supabase_client: Client,
    image_base64: str,
    signatory_name: str,
    image_type: str,
    content_type: str = "image/png",
) -> str:
    image_bytes = base64.b64decode(image_base64)
    sanitized_name = _get_sanitized_name(signatory_name)
    nanoid = nanoid_generate()

    if image_type == "original":
        file_path = f"reference/{sanitized_name}/{nanoid}.png"
    else:
        file_path = f"processed/{sanitized_name}/{image_type}/{nanoid}.png"

    supabase_client.storage.from_(BUCKET_NAME).upload(
        file_path, image_bytes, {"content-type": content_type}
    )
    public_url = supabase_client.storage.from_(BUCKET_NAME).get_public_url(file_path)
    return public_url


def upload_original_image(
    supabase_client: Client,
    image_bytes: bytes,
    signatory_name: str,
    content_type: str = "image/jpeg",
) -> str:
    sanitized_name = _get_sanitized_name(signatory_name)
    nanoid = nanoid_generate()
    file_path = f"reference/{sanitized_name}/{nanoid}.png"

    supabase_client.storage.from_(BUCKET_NAME).upload(
        file_path, image_bytes, {"content-type": content_type}
    )
    return supabase_client.storage.from_(BUCKET_NAME).get_public_url(file_path)


def upload_original_images(
    supabase_client: Client,
    image_bytes_list: list[bytes],
    signatory_name: str,
    content_types: list[str],
) -> list[str]:
    urls: list[str] = []
    for image_bytes, content_type in zip(image_bytes_list, content_types):
        try:
            url = upload_original_image(
                supabase_client, image_bytes, signatory_name, content_type
            )
            urls.append(url)
        except Exception:
            urls.append("")
    return urls


def upload_processed_images(
    supabase_client: Client,
    processed_data_list: list[dict[str, Any]],
    signatory_name: str,
) -> list[dict[str, str]]:
    uploaded_urls_list: list[dict[str, str]] = []

    for processed_data in processed_data_list:
        uploaded_urls: dict[str, str] = {}
        for image_type in PROCESSED_IMAGE_TYPES:
            if image_type in processed_data and processed_data[image_type]:
                try:
                    url = _upload_image_to_supabase(
                        supabase_client,
                        processed_data[image_type],
                        signatory_name,
                        image_type,
                        "image/png",
                    )
                    uploaded_urls[image_type] = url
                except Exception:
                    uploaded_urls[image_type] = ""
        uploaded_urls_list.append(uploaded_urls)

    return uploaded_urls_list


def upload_document(
    supabase_client: Client,
    image_bytes: bytes,
    content_type: str = "image/jpeg",
) -> str:
    nanoid = nanoid_generate()
    file_path = f"claims/{nanoid}.png"

    supabase_client.storage.from_(DOCUMENTS_BUCKET).upload(
        file_path, image_bytes, {"content-type": content_type}
    )
    return supabase_client.storage.from_(DOCUMENTS_BUCKET).get_public_url(file_path)


def upload_documents(
    supabase_client: Client,
    image_bytes_list: list[bytes],
    content_types: list[str],
) -> list[str]:
    urls: list[str] = []
    for image_bytes, content_type in zip(image_bytes_list, content_types):
        try:
            url = upload_document(supabase_client, image_bytes, content_type)
            urls.append(url)
        except Exception:
            urls.append("")
    return urls


def upload_base64_image(
    supabase_client: Client,
    base64_data: str,
) -> str:
    image_bytes = base64.b64decode(base64_data)
    nanoid = nanoid_generate()
    file_path = f"processed/{nanoid}.png"

    supabase_client.storage.from_(DOCUMENTS_BUCKET).upload(
        file_path, image_bytes, {"content-type": "image/png"}
    )
    return supabase_client.storage.from_(DOCUMENTS_BUCKET).get_public_url(file_path)

import asyncio
import os
from typing import Any

import httpx

from app.exceptions import ExternalAPIError

DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0, write=10.0, pool=10.0)
MAX_RETRIES = 3


def _get_worker_headers() -> dict[str, str]:
    worker_key = os.getenv("WORKER_API_KEY")
    if worker_key:
        return {"X-Worker-Key": worker_key}
    return {}


async def save_to_api(
    api_url: str,
    signatory_name: str,
    image_urls: dict[str, list[str]],
    status: str | None = None,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        payload: dict[str, Any] = {
            "name": signatory_name,
            "imageUrls": image_urls,
        }
        if status is not None:
            payload["status"] = status

        headers = _get_worker_headers()

        for attempt in range(MAX_RETRIES):
            try:
                response = await client.post(
                    f"{api_url}/signatures",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to save signature data after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(
                    f"Failed to save signature data: {e.response.text}"
                )

        raise ExternalAPIError("Failed to save signature data: max retries exceeded")


async def save_document_to_api(
    api_url: str,
    name: str,
    image_urls: dict[str, str],
    status: str = "processing",
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        headers = _get_worker_headers()

        for attempt in range(MAX_RETRIES):
            try:
                response = await client.post(
                    f"{api_url}/documents",
                    json={
                        "name": name,
                        "imageUrls": image_urls,
                        "status": status,
                    },
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to save document after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(f"Failed to save document: {e.response.text}")

        raise ExternalAPIError("Failed to save document: max retries exceeded")


async def update_document_status(
    api_url: str,
    document_id: str,
    status: str,
    image_urls: dict[str, str] | None = None,
    extracted_text: str | None = None,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        payload: dict[str, Any] = {"status": status}
        if image_urls is not None:
            payload["imageUrls"] = image_urls
        if extracted_text is not None:
            payload["extractedText"] = extracted_text

        headers = _get_worker_headers()

        for attempt in range(MAX_RETRIES):
            try:
                response = await client.put(
                    f"{api_url}/documents/{document_id}",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to update document status after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(
                    f"Failed to update document status: {e.response.text}"
                )

        raise ExternalAPIError("Failed to update document status: max retries exceeded")


async def update_signature_status(
    api_url: str,
    signature_id: str,
    status: str,
    image_urls: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        payload: dict[str, Any] = {"status": status}
        if image_urls is not None:
            payload["imageUrls"] = image_urls

        headers = _get_worker_headers()

        for attempt in range(MAX_RETRIES):
            try:
                response = await client.put(
                    f"{api_url}/signatures/{signature_id}",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to update signature status after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(
                    f"Failed to update signature status: {e.response.text}"
                )

        raise ExternalAPIError(
            "Failed to update signature status: max retries exceeded"
        )


async def get_signature(
    api_url: str,
    signature_id: str,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        headers = _get_worker_headers()
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.get(
                    f"{api_url}/signatures/{signature_id}",
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to fetch signature after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(f"Failed to fetch signature: {e.response.text}")

        raise ExternalAPIError("Failed to fetch signature: max retries exceeded")


async def get_document(
    api_url: str,
    document_id: str,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        headers = _get_worker_headers()
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.get(
                    f"{api_url}/documents/{document_id}",
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to fetch document after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(f"Failed to fetch document: {e.response.text}")

        raise ExternalAPIError("Failed to fetch document: max retries exceeded")


async def patch_document_verification(
    api_url: str,
    document_id: str,
    verification_data: dict[str, Any],
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        headers = _get_worker_headers()
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.patch(
                    f"{api_url}/documents/{document_id}/signature-verification",
                    json=verification_data,
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
                if attempt == MAX_RETRIES - 1:
                    raise ExternalAPIError(
                        f"Failed to update verification after {MAX_RETRIES} attempts: {e}"
                    )
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                raise ExternalAPIError(
                    f"Failed to update verification: {e.response.text}"
                )

        raise ExternalAPIError("Failed to update verification: max retries exceeded")


async def list_signatures(api_url: str) -> list[dict[str, Any]]:
    """Fetch all enrolled signatures, most recent first."""
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        headers = _get_worker_headers()
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.get(
                    f"{api_url}/signatures",
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout):
                if attempt == MAX_RETRIES - 1:
                    return []
                await asyncio.sleep(1 * (attempt + 1))
            except httpx.HTTPStatusError:
                return []

        return []

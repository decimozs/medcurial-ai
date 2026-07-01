import os
import httpx
from src.config import WORKER_API_KEY

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api/v1")

DEFAULT_TIMEOUT = 30.0


async def _make_request(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if WORKER_API_KEY:
                headers["X-Worker-Key"] = WORKER_API_KEY

            response = await client.get(url, timeout=DEFAULT_TIMEOUT, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.ConnectError:
            return {"error": "API server unavailable"}
        except httpx.TimeoutException:
            return {"error": "Request timed out"}
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"error": "Not found"}
            return {"error": f"HTTP error: {e.response.status_code}"}
        except Exception:
            return {"error": "Unknown error occurred"}


async def query_documents(limit: int = 10, offset: int = 0) -> dict:
    """Query documents with pagination.

    Args:
        limit: Maximum number of documents to return (default: 10)
        offset: Number of documents to skip (default: 0)
    """
    url = f"{API_BASE_URL}/documents?limit={limit}&offset={offset}"
    return await _make_request(url)


async def query_signatures(limit: int = 10, offset: int = 0) -> dict:
    """Query signatures with pagination.

    Args:
        limit: Maximum number of signatures to return (default: 10)
        offset: Number of signatures to skip (default: 0)
    """
    url = f"{API_BASE_URL}/signatures?limit={limit}&offset={offset}"
    return await _make_request(url)


async def get_fraud_summary() -> dict:
    """Get a summary of fraud analysis from recent documents."""
    url = f"{API_BASE_URL}/documents?limit=20&offset=0"
    result = await _make_request(url)

    if "error" in result:
        return {"error": result["error"]}

    # Extract fraud analysis from documents
    fraud_data = []
    for doc in result if isinstance(result, list) else []:
        if doc.get("fraudAnalysis"):
            fraud_data.append(
                {
                    "id": doc.get("id"),
                    "name": doc.get("name"),
                    "status": doc.get("status"),
                    "fraud_analysis": doc.get("fraudAnalysis"),
                }
            )

    return {
        "total_documents": len(result) if isinstance(result, list) else 0,
        "documents_with_fraud_analysis": len(fraud_data),
        "fraud_data": fraud_data,
    }

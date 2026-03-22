import os

import httpx
from fastmcp import FastMCP

mcp = FastMCP(
    name="Medcurial MCP Server",
    instructions="MCP Server for Medcurial - provides access to documents, signatures, and fraud analysis",
)

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api/v1")

DEFAULT_TIMEOUT = 30.0


async def _make_request(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=DEFAULT_TIMEOUT)
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


@mcp.tool
async def query_documents(
    status: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> dict:
    """Query documents with pagination and optional status filter.

    Args:
        status: Filter by status ('processing', 'completed', 'failed')
        limit: Maximum number of documents to return (default: 10)
        offset: Number of documents to skip (default: 0)
    """
    params = []
    if status:
        params.append(f"status={status}")
    params.append(f"limit={limit}")
    params.append(f"offset={offset}")

    query_string = "&".join(params) if params else ""
    url = f"{API_BASE_URL}/documents"
    if query_string:
        url += f"?{query_string}"

    return await _make_request(url)


@mcp.tool
async def get_document(document_id: str) -> dict:
    """Get a specific document by ID.

    Args:
        document_id: The unique identifier of the document
    """
    url = f"{API_BASE_URL}/documents/{document_id}"
    return await _make_request(url)


@mcp.tool
async def get_fraud_analysis(document_id: str) -> dict:
    """Get fraud analysis details for a document.
    Returns only fraud-related fields.

    Args:
        document_id: The unique identifier of the document
    """
    url = f"{API_BASE_URL}/documents/{document_id}"
    result = await _make_request(url)

    if "error" in result:
        return result

    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "status": result.get("status"),
        "fraud_analysis": result.get("fraudAnalysis"),
        "extracted_text": result.get("extractedText"),
    }


@mcp.tool
async def query_signatures(
    name: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> dict:
    """Query signatures with pagination and optional name filter.

    Args:
        name: Filter by signatory name (case-insensitive partial match)
        limit: Maximum number of signatures to return (default: 10)
        offset: Number of signatures to skip (default: 0)
    """
    params = []
    if name:
        params.append(f"name={name}")
    params.append(f"limit={limit}")
    params.append(f"offset={offset}")

    query_string = "&".join(params) if params else ""
    url = f"{API_BASE_URL}/signatures"
    if query_string:
        url += f"?{query_string}"

    return await _make_request(url)


if __name__ == "__main__":
    mcp.run()

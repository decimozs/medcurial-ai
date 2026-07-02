import os
import sys

import httpx
from dotenv import load_dotenv
from fastmcp import FastMCP
from loguru import logger

load_dotenv()


def configure_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = os.getenv("LOG_FORMAT", "pretty")

    logger.remove()

    if log_format == "pretty":
        logger.add(
            sys.stderr,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level=log_level,
        )
    else:
        logger.add(
            sys.stderr,
            format="{time} | {level} | {name}:{function}:{line} - {message}",
            level=log_level,
            serialize=True,
        )

    logger.info(f"MCP Logging configured: level={log_level}, format={log_format}")


configure_logging()


mcp = FastMCP(
    name="Medcurial MCP Server",
    instructions="MCP Server for Medcurial - provides access to documents, signatures, and fraud analysis",
)

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api/v1")

DEFAULT_TIMEOUT = 30.0


async def _make_request(url: str) -> dict | list:
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            worker_key = os.getenv("WORKER_API_KEY")
            if worker_key:
                headers["X-Worker-Key"] = worker_key

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
    logger.info(
        f"query_documents called: status={status}, limit={limit}, offset={offset}"
    )
    params = []
    if status:
        params.append(f"status={status}")
    params.append(f"limit={limit}")
    params.append(f"offset={offset}")

    query_string = "&".join(params) if params else ""
    url = f"{API_BASE_URL}/documents"
    if query_string:
        url += f"?{query_string}"

    result = await _make_request(url)
    if isinstance(result, list):
        logger.info(f"query_documents returned {len(result)} documents")
        return {"documents": result}
    logger.warning(f"query_documents returned error: {result}")
    return result


@mcp.tool
async def get_document(document_id: str) -> dict:
    """Get a specific document by ID.

    Args:
        document_id: The unique identifier of the document
    """
    logger.info(f"get_document called: document_id={document_id}")
    url = f"{API_BASE_URL}/documents/{document_id}"
    result = await _make_request(url)
    if "error" not in result:
        logger.info(f"get_document returned: {document_id}")
    else:
        logger.warning(f"get_document error: {result}")
    return result


@mcp.tool
async def get_fraud_analysis(document_id: str) -> dict:
    """Get fraud analysis details for a document.
    Returns only fraud-related fields.

    Args:
        document_id: The unique identifier of the document
    """
    logger.info(f"get_fraud_analysis called: document_id={document_id}")
    url = f"{API_BASE_URL}/documents/{document_id}"
    result = await _make_request(url)

    if "error" in result:
        logger.warning(f"get_fraud_analysis error: {result}")
        return result

    logger.info(f"get_fraud_analysis returned for: {document_id}")
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
    logger.info(f"query_signatures called: name={name}, limit={limit}, offset={offset}")
    params = []
    if name:
        params.append(f"name={name}")
    params.append(f"limit={limit}")
    params.append(f"offset={offset}")

    query_string = "&".join(params) if params else ""
    url = f"{API_BASE_URL}/signatures"
    if query_string:
        url += f"?{query_string}"

    result = await _make_request(url)
    if isinstance(result, list):
        logger.info(f"query_signatures returned {len(result)} signatures")
        return {"signatures": result}
    logger.warning(f"query_signatures returned error: {result}")
    return result


@mcp.tool
async def get_signature_verification(document_id: str) -> dict:
    """Get the signature verification result for a document.

    Args:
        document_id: The unique identifier of the document
    """
    logger.info(f"get_signature_verification called: document_id={document_id}")
    url = f"{API_BASE_URL}/documents/{document_id}"
    result = await _make_request(url)

    if "error" in result:
        logger.warning(f"get_signature_verification error: {result}")
        return result

    logger.info(f"get_signature_verification returned for: {document_id}")
    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "status": result.get("status"),
        "signatureVerification": result.get("signatureVerification"),
    }


@mcp.tool
async def get_signature(signature_id: str) -> dict:
    """Get a specific enrolled signature by ID.

    Args:
        signature_id: The unique identifier of the signature
    """
    logger.info(f"get_signature called: signature_id={signature_id}")
    url = f"{API_BASE_URL}/signatures/{signature_id}"
    result = await _make_request(url)

    if "error" in result:
        logger.warning(f"get_signature error: {result}")
        return result

    logger.info(f"get_signature returned: {signature_id}")
    return result


@mcp.tool
async def get_document_findings(document_id: str) -> dict:
    """Get review findings for a document.

    Args:
        document_id: The unique identifier of the document
    """
    logger.info(f"get_document_findings called: document_id={document_id}")
    url = f"{API_BASE_URL}/documents/{document_id}"
    result = await _make_request(url)

    if "error" in result:
        logger.warning(f"get_document_findings error: {result}")
        return result

    findings = result.get("findings", [])
    logger.info(
        f"get_document_findings returned {len(findings)} findings for: {document_id}"
    )
    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "findings": findings,
    }


if __name__ == "__main__":
    import os

    port = int(os.getenv("MCP_PORT", "8002"))
    host = os.getenv("MCP_HOST", "0.0.0.0")
    mcp.run(transport="sse", host=host, port=port)

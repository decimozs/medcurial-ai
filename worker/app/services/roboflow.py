import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


async def analyze_document(
    api_key: str,
    api_url: str,
    workspace_name: str,
    workflow_id: str,
    image_url: str,
) -> dict[str, Any]:
    endpoint = f"{api_url}/{workspace_name}/workflows/{workflow_id}"

    payload = {
        "api_key": api_key,
        "inputs": {"image": {"type": "url", "value": image_url}},
    }

    logger.info(f"Analyzing document with Roboflow: {endpoint}")

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(connect=30.0, read=300.0, write=30.0, pool=30.0)
        ) as client:
            response = await client.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code != 200:
                logger.error(
                    f"Roboflow API error ({response.status_code}): {response.text}"
                )

            response.raise_for_status()

            if not response.text:
                logger.error("Empty response from Roboflow")
                return {"error": "Empty response from Roboflow"}

            logger.info("Successfully received analysis from Roboflow")
            return response.json()
    except Exception as e:
        logger.exception(f"Exception during Roboflow analysis: {e}")
        raise

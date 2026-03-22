from typing import Any

import httpx


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

    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
        response = await client.post(
            endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        response.raise_for_status()

        if not response.text:
            return {"error": "Empty response from Roboflow"}

        return response.json()

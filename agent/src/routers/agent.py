import asyncio
import json
import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pydantic_settings import BaseSettings

from src.graph import agent
from src.state import AgentState

router = APIRouter(prefix="/analyze", tags=["analyze"])

REQUEST_TIMEOUT = 300  # 5 minutes


class Settings(BaseSettings):
    hf_token: Optional[str] = None
    hf_base_url: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


class AnalyzeRequest(BaseModel):
    extracted_text: str


class AnalyzeResponse(BaseModel):
    formatter_response: str
    fraud_detector_response: dict[str, Any]
    ranking_response: dict[str, Any]
    auditor_response: dict[str, Any]


def clean_json_response(text: str) -> str:
    if not text:
        return text
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"```$", "", text)
    text = re.sub(r"<Answer>\s*", "", text)
    text = re.sub(r"</Answer>\s*", "", text)
    return text.strip()


def _parse_json_response(response: str) -> dict[str, Any]:
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response}


async def run_agent(request: AnalyzeRequest) -> AnalyzeResponse:
    if not settings.hf_token or not settings.hf_base_url:
        raise HTTPException(
            status_code=500,
            detail="HF_TOKEN and HF_BASE_URL must be set in the .env file",
        )

    initial_state = AgentState(
        query=request.extracted_text,
        formatter_agent_response="",
        fraud_agent_response="",
        ranking_agent_response="",
        auditor_agent_response="",
    )

    config = {"configurable": {"thread_id": "1"}}

    result = agent.invoke(initial_state, config)

    return AnalyzeResponse(
        formatter_response=result.get("formatter_agent_response", ""),
        fraud_detector_response=_parse_json_response(
            clean_json_response(result.get("fraud_agent_response", ""))
        ),
        ranking_response=_parse_json_response(
            clean_json_response(result.get("ranking_agent_response", ""))
        ),
        auditor_response=_parse_json_response(
            clean_json_response(result.get("auditor_agent_response", ""))
        ),
    )


@router.post("", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    try:
        result = await asyncio.wait_for(run_agent(request), timeout=REQUEST_TIMEOUT)
        return result
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail=f"Analysis timed out after {REQUEST_TIMEOUT} seconds. Please try again or use a faster model.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

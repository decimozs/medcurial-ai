import asyncio
import json
import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from langchain_core.messages import HumanMessage, SystemMessage

from src.graph import agent
from src.state import AgentState
from src.config import create_chat_llm

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


class EnhanceNotesRequest(BaseModel):
    notes: str
    document_context: Optional[str] = None


class EnhanceNotesResponse(BaseModel):
    enhanced_notes: str


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


MAX_RETRIES = 3
CAPACITY_KEYWORDS = (
    "at capacity",
    "temporarily unavailable",
    "overloaded",
    "rate limit",
    "too many requests",
)


def _is_capacity_error(error: Exception) -> bool:
    return any(kw in str(error).lower() for kw in CAPACITY_KEYWORDS)


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

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
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
        except Exception as e:
            last_error = e
            if _is_capacity_error(e) and attempt < MAX_RETRIES - 1:
                wait = 2**attempt  # 1s, 2s, 4s backoff
                await asyncio.sleep(wait)
                continue
            raise

    raise last_error  # type: ignore[misc]


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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance-notes", response_model=EnhanceNotesResponse)
async def enhance_notes(request: EnhanceNotesRequest):
    try:
        llm = create_chat_llm()
        system_prompt = (
            "You are an expert medical fraud investigator. "
            "Rewrite the user's investigation notes to be professional, objective, clear, and concise. "
            "CRITICAL RULES:\n"
            "1. You MUST deeply rely on and maintain the exact factual meaning of the ORIGINAL NOTES provided.\n"
            "2. DO NOT add any fictitious findings or facts not present in the original notes.\n"
            "3. Your response MUST be strictly UNDER 300 CHARACTERS.\n"
            "4. Return ONLY the finalized enhanced notes. Do not include introductory text, conversational padding, or markdown formatting."
        )
        if request.document_context:
            system_prompt += f"\n\nHere is the context of the document being reviewed to help inform your paraphrasing:\n{request.document_context}"

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Notes:\n{request.notes}"),
        ]
        response = await llm.ainvoke(messages)
        content = response.content
        if not isinstance(content, str):
            content = str(content)
        return EnhanceNotesResponse(enhanced_notes=content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

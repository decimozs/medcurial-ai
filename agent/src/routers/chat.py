from typing import Any

from fastapi import APIRouter, Header, HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from loguru import logger
from pydantic import BaseModel

from src.config import (
    AVAILABLE_MODELS,
    DEFAULT_MODEL,
    create_chat_llm,
    create_fraud_llm,
)
from src.mcp_client import get_mcp_tools
from src.prompts import CHATBOT_PROMPT, TITLE_PROMPT

router = APIRouter(prefix="/chat", tags=["chat"])

fraud_llm = create_fraud_llm()


class ChatRequest(BaseModel):
    message: str
    documentId: str | None = None
    documentContext: dict[str, Any] | None = None
    chatHistory: str | None = None


class ChatResponse(BaseModel):
    response: str


MAX_EXTRACTED_TEXT_CHARS = 4000


def _build_document_context_str(doc_context: dict[str, Any] | None) -> str:
    """Build a formatted string from document context."""
    if not doc_context:
        return ""

    parts = ["## Document Context"]

    if doc_context.get("name"):
        parts.append(f"**Document Name:** {doc_context['name']}")

    extracted_text = doc_context.get("extractedText")
    if extracted_text:
        if len(extracted_text) > MAX_EXTRACTED_TEXT_CHARS:
            extracted_text = (
                extracted_text[:MAX_EXTRACTED_TEXT_CHARS] + "\n...[truncated]"
            )
        parts.append(f"**Extracted Text:**\n{extracted_text}")
    else:
        parts.append("**Extracted Text:** No text extracted from this document.")

    fraud_analysis = doc_context.get("fraudAnalysis")
    if fraud_analysis:
        import json

        # Only include the auditor summary, not the full nested JSON
        auditor = (
            fraud_analysis.get("auditor_response", {})
            if isinstance(fraud_analysis, dict)
            else {}
        )
        summary_parts = []
        if auditor.get("is_flagged_for_review") is not None:
            summary_parts.append(f"Flagged: {auditor['is_flagged_for_review']}")
        if auditor.get("analysis_summary"):
            summary_parts.append(f"Summary: {auditor['analysis_summary'][:500]}")
        parts.append(
            f"**Fraud Analysis:** {' | '.join(summary_parts) if summary_parts else json.dumps(fraud_analysis)[:500]}"
        )
    else:
        parts.append(
            "**Fraud Analysis:** No fraud analysis available for this document."
        )

    return "\n".join(parts)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, x_llm_model: str | None = Header(None)):
    try:
        model = (
            x_llm_model
            if x_llm_model and x_llm_model in AVAILABLE_MODELS
            else DEFAULT_MODEL
        )
        llm = create_chat_llm(model)

        context_parts = []

        if request.documentContext:
            doc_context_str = _build_document_context_str(request.documentContext)
            context_parts.append(doc_context_str)

        if request.chatHistory:
            context_parts.append(f"## Conversation History\n{request.chatHistory}")

        full_context = "\n\n".join(context_parts)
        system_prompt = CHATBOT_PROMPT
        if full_context:
            system_prompt += f"\n\n{full_context}"

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=request.message),
        ]

        try:
            async with get_mcp_tools() as tools:
                if tools:
                    llm_with_tools = llm.bind_tools(tools)
                else:
                    llm_with_tools = llm

                # Basic tool-calling loop
                response = await llm_with_tools.ainvoke(messages)
                messages.append(response)

                while response.tool_calls:
                    for tool_call in response.tool_calls:
                        selected_tool = next(
                            (t for t in tools if t.name == tool_call["name"]), None
                        )
                        if selected_tool:
                            tool_msg = await selected_tool.ainvoke(tool_call)
                            messages.append(tool_msg)
                        else:
                            # Fallback if tool not found
                            from langchain_core.messages import ToolMessage

                            messages.append(
                                ToolMessage(
                                    content="Tool not found",
                                    tool_call_id=tool_call["id"],
                                )
                            )

                    response = await llm_with_tools.ainvoke(messages)
                    messages.append(response)

        except Exception as tool_err:
            logger.warning(f"MCP Tool error or connection failed: {tool_err}")
            # Fallback to standard chat without tools
            response = await llm.ainvoke(messages)

        content = response.content
        response_text = (
            content.strip() if isinstance(content, str) else str(content).strip()
        )

        return ChatResponse(response=response_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TitleRequest(BaseModel):
    message: str


class TitleResponse(BaseModel):
    title: str


@router.post("/title", response_model=TitleResponse)
async def generate_title(request: TitleRequest):
    try:
        response = fraud_llm.invoke(
            [
                SystemMessage(content=TITLE_PROMPT),
                HumanMessage(content=request.message),
            ]
        )

        content = response.content
        title = content.strip() if isinstance(content, str) else str(content).strip()
        title = title.strip('"').strip("'")
        if len(title) > 50:
            title = title[:47] + "..."

        return TitleResponse(title=title)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

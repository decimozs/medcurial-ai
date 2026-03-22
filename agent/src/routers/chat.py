from typing import Any

from fastapi import APIRouter, Header, HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from src.config import (
    AVAILABLE_MODELS,
    DEFAULT_MODEL,
    create_chat_llm,
    create_fraud_llm,
)
from src.prompts import CHATBOT_PROMPT, TITLE_PROMPT
from src.tools import query_documents, query_signatures, get_fraud_summary

router = APIRouter(prefix="/chat", tags=["chat"])

fraud_llm = create_fraud_llm()


class ChatRequest(BaseModel):
    message: str
    documentId: str | None = None
    documentContext: dict[str, Any] | None = None
    chatHistory: str | None = None


class ChatResponse(BaseModel):
    response: str


async def _fetch_all_data() -> dict[str, Any]:
    """Fetch all relevant data for the chat."""
    documents = await query_documents(limit=20)
    signatures = await query_signatures(limit=20)
    fraud_summary = await get_fraud_summary()

    return {
        "documents": documents if isinstance(documents, list) else [],
        "signatures": signatures if isinstance(signatures, list) else [],
        "fraud_summary": fraud_summary,
    }


def _build_document_context_str(doc_context: dict[str, Any] | None) -> str:
    """Build a formatted string from document context."""
    if not doc_context:
        return ""

    parts = ["## Document Context"]

    if doc_context.get("name"):
        parts.append(f"**Document Name:** {doc_context['name']}")

    extracted_text = doc_context.get("extractedText")
    if extracted_text:
        parts.append(f"**Extracted Text:**\n{extracted_text}")
    else:
        parts.append("**Extracted Text:** No text extracted from this document.")

    fraud_analysis = doc_context.get("fraudAnalysis")
    if fraud_analysis:
        import json

        parts.append(f"**Fraud Analysis:**\n{json.dumps(fraud_analysis, indent=2)}")
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

        context = await _fetch_all_data()

        context_parts = [f"## Global Context\n{context}"]

        if request.documentContext or request.chatHistory:
            if request.documentContext:
                doc_context_str = _build_document_context_str(request.documentContext)
                context_parts.append(doc_context_str)

            if request.chatHistory:
                context_parts.append(f"## Conversation History\n{request.chatHistory}")

        full_context = "\n\n".join(context_parts)

        response = llm.invoke(
            [
                SystemMessage(content=CHATBOT_PROMPT),
                HumanMessage(content=f"{full_context}\n\nQuestion: {request.message}"),
            ]
        )

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

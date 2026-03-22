import os
from typing import Any

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
OLLAMA_BASE_URL = "https://ollama.com/v1"

HF_TOKEN = os.getenv("HF_TOKEN")
HF_BASE_URL = os.getenv("HF_BASE_URL")
FRAUD_MODEL = "Qwen/Qwen2.5-1.5B-Instruct:featherless-ai"

LLM_TIMEOUT = 120.0

AVAILABLE_MODELS: dict[str, str] = {
    "minimax-2.5": "minimax-m2.5:cloud",
    "minimax-2.7": "minimax-m2.7:cloud",
    "minimax-m2.1": "minimax-m2.1:cloud",
    "cogito-2.1": "cogito-2.1:671b-cloud",
    "gemini-flash": "gemini-3-flash-preview:cloud",
    "kimi-k2.5": "kimi-k2:cloud",
}

DEFAULT_MODEL = "minimax-2.5"

if not OLLAMA_API_KEY:
    raise ValueError("OLLAMA_API_KEY must be set in the .env file")

if not HF_TOKEN or not HF_BASE_URL:
    raise ValueError("HF_TOKEN and HF_BASE_URL must be set in the .env file")


def create_chat_llm(model: str | None = None, **kwargs: Any) -> ChatOpenAI:
    ollama_model = AVAILABLE_MODELS.get(
        model if model and model in AVAILABLE_MODELS else DEFAULT_MODEL
    )
    return ChatOpenAI(
        model=ollama_model,
        api_key=OLLAMA_API_KEY,
        base_url=OLLAMA_BASE_URL,
        streaming=True,
        timeout=LLM_TIMEOUT,
        **kwargs,
    )


def create_fraud_llm(**kwargs: Any) -> ChatOpenAI:
    return ChatOpenAI(
        model=FRAUD_MODEL,
        api_key=HF_TOKEN,
        base_url=HF_BASE_URL,
        streaming=True,
        timeout=LLM_TIMEOUT,
        **kwargs,
    )


fraud_llm = create_fraud_llm()
checkpointer = InMemorySaver()

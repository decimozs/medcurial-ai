import logging

from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import FORMATTER_PROMPT
from src.state import AgentState

logger = logging.getLogger(__name__)


def formatter_agent_node(state: AgentState) -> dict[str, str]:
    try:
        response = fraud_llm.invoke(
            [
                SystemMessage(content=FORMATTER_PROMPT),
                HumanMessage(content=state["query"]),
            ]
        )
        return {"formatter_agent_response": response.content}
    except Exception as e:
        logger.error("formatter_agent_node failed: %s", e, exc_info=True)
        raise

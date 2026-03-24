from loguru import logger

from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import FORMATTER_PROMPT
from src.state import AgentState


def formatter_agent_node(state: AgentState) -> dict[str, str]:
    logger.debug("formatter_agent_node: invoked")
    try:
        response = fraud_llm.invoke(
            [
                SystemMessage(content=FORMATTER_PROMPT),
                HumanMessage(content=state["query"]),
            ]
        )
        logger.debug("formatter_agent_node: completed successfully")
        return {"formatter_agent_response": response.content}
    except Exception as e:
        logger.exception("formatter_agent_node failed: {}", e)
        raise

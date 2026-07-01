from loguru import logger

from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import RANKING_PROMPT
from src.state import AgentState


def ranking_agent_node(state: AgentState) -> dict[str, str]:
    logger.debug("ranking_agent_node: invoked")
    try:
        response = fraud_llm.invoke(
            [
                SystemMessage(content=RANKING_PROMPT),
                HumanMessage(content=state["fraud_agent_response"]),
            ]
        )
        logger.debug("ranking_agent_node: completed successfully")
        return {"ranking_agent_response": response.content}
    except Exception as e:
        logger.exception("ranking_agent_node failed: {}", e)
        raise

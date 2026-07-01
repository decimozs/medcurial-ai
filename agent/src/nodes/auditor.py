from loguru import logger

from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import AUDITOR_PROMPT
from src.state import AgentState


def auditor_agent_node(state: AgentState) -> dict[str, str]:
    logger.debug("auditor_agent_node: invoked")
    try:
        response = fraud_llm.invoke(
            [
                SystemMessage(content=AUDITOR_PROMPT),
                HumanMessage(content=state["ranking_agent_response"]),
            ]
        )
        logger.debug("auditor_agent_node: completed successfully")
        return {"auditor_agent_response": response.content}
    except Exception as e:
        logger.exception("auditor_agent_node failed: {}", e)
        raise

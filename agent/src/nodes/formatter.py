from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import FORMATTER_PROMPT
from src.state import AgentState


def formatter_agent_node(state: AgentState) -> dict[str, str]:
    response = fraud_llm.invoke(
        [
            SystemMessage(content=FORMATTER_PROMPT),
            HumanMessage(content=state["query"]),
        ]
    )
    return {"formatter_agent_response": response.content}

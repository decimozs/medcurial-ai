from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import RANKING_PROMPT
from src.state import AgentState


def ranking_agent_node(state: AgentState) -> dict[str, str]:
    response = fraud_llm.invoke(
        [
            SystemMessage(content=RANKING_PROMPT),
            HumanMessage(content=state["fraud_agent_response"]),
        ]
    )
    return {"ranking_agent_response": response.content}

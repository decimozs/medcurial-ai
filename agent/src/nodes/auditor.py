from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import AUDITOR_PROMPT
from src.state import AgentState


def auditor_agent_node(state: AgentState) -> dict[str, str]:
    response = fraud_llm.invoke(
        [
            SystemMessage(content=AUDITOR_PROMPT),
            HumanMessage(content=state["ranking_agent_response"]),
        ]
    )
    return {"auditor_agent_response": response.content}

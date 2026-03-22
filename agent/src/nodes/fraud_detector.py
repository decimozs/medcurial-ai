from langchain_core.messages import HumanMessage, SystemMessage

from src.config import fraud_llm
from src.prompts import FRAUD_DETECTOR_PROMPT
from src.state import AgentState


def fraud_detector_agent_node(state: AgentState) -> dict[str, str]:
    response = fraud_llm.invoke(
        [
            SystemMessage(content=FRAUD_DETECTOR_PROMPT),
            HumanMessage(content=state["formatter_agent_response"]),
        ]
    )
    return {"fraud_agent_response": response.content}

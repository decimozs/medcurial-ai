from typing import TypedDict


class AgentState(TypedDict):
    query: str
    formatter_agent_response: str
    fraud_agent_response: str
    ranking_agent_response: str
    auditor_agent_response: str

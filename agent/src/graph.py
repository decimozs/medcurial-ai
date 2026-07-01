from langgraph.graph import END, START, StateGraph

from src.config import checkpointer
from src.nodes import (
    auditor_agent_node,
    fraud_detector_agent_node,
    formatter_agent_node,
    ranking_agent_node,
)
from src.state import AgentState

builder = StateGraph(AgentState)
builder.add_node("formatter", formatter_agent_node)
builder.add_node("fraud_detector", fraud_detector_agent_node)
builder.add_node("ranking", ranking_agent_node)
builder.add_node("auditor", auditor_agent_node)

builder.add_edge(START, "formatter")
builder.add_edge("formatter", "fraud_detector")
builder.add_edge("fraud_detector", "ranking")
builder.add_edge("ranking", "auditor")
builder.add_edge("auditor", END)

agent = builder.compile(checkpointer=checkpointer)

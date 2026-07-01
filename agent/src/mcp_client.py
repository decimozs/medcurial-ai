import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient


@asynccontextmanager
async def get_mcp_tools() -> AsyncGenerator[list[BaseTool], None]:
    """Connect to the Medcurial MCP Server via SSE and return its tools."""
    # Default to the port we exposed in mcp/main.py
    mcp_port = os.getenv("MCP_PORT", "8002")
    mcp_host = os.getenv("MCP_HOST", "127.0.0.1")
    mcp_url = f"http://{mcp_host}:{mcp_port}/sse"

    # We use MultiServerMCPClient to handle the SSE connection
    # and adapt the MCP tools to LangChain BaseTools
    client = MultiServerMCPClient(
        {
            "medcurial": {
                "url": mcp_url,
                "transport": "sse",
            }
        }
    )

    async with client.session("medcurial") as session:
        from langchain_mcp_adapters.tools import load_mcp_tools

        yield await load_mcp_tools(session)

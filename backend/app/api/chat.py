from fastapi import APIRouter, Query
from ..models.schemas import AgentChatRequest
from ..database.database import get_chat_history
from ..agents.agent import agent_runner

chat_router = APIRouter(prefix="/api/chat", tags=["chat"])

@chat_router.get("/history")
async def get_history(session_id: str = Query("default")):
    """Returns stored conversation history."""
    return get_chat_history(session_id)

@chat_router.post("/message")
async def send_chat_message(req: AgentChatRequest):
    """Executes the agent turn synchronously/HTTP."""
    result = await agent_runner.run(
        user_prompt=req.prompt,
        session_id=req.session_id or "default",
        active_file=req.active_file,
        open_files=req.open_files
    )
    return result

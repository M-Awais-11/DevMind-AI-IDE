import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..agents.agent import agent_runner
from ..tools.terminal_tools import execute_terminal_command

ws_router = APIRouter(tags=["websockets"])

@ws_router.websocket("/ws/agent")
async def websocket_agent_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time streaming agent interactions.
    Streams thoughts, status updates, tool execution, and results to the UI.
    """
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
            except Exception:
                await websocket.send_json({"type": "error", "data": {"message": "Invalid JSON payload"}})
                continue

            prompt = payload.get("prompt", "")
            session_id = payload.get("session_id", "default")
            active_file = payload.get("active_file")
            open_files = payload.get("open_files", [])

            if not prompt.strip():
                await websocket.send_json({"type": "error", "data": {"message": "Empty prompt provided"}})
                continue

            async def stream_callback(event: dict):
                try:
                    await websocket.send_json(event)
                except Exception:
                    pass

            await agent_runner.run(
                user_prompt=prompt,
                session_id=session_id,
                active_file=active_file,
                open_files=open_files,
                event_callback=stream_callback
            )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "data": {"message": str(e)}})
        except Exception:
            pass

@ws_router.websocket("/ws/terminal")
async def websocket_terminal_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for running terminal commands and receiving streamed output.
    """
    await websocket.accept()
    try:
        while True:
            cmd = await websocket.receive_text()
            if not cmd.strip():
                continue

            await websocket.send_json({"type": "start", "command": cmd})
            
            # Execute command
            res = execute_terminal_command(cmd)
            
            await websocket.send_json({
                "type": "result",
                "command": cmd,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "exit_code": res.exit_code,
                "success": res.success
            })
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

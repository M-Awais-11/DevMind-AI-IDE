from fastapi import APIRouter
from pydantic import BaseModel
from ..models.schemas import CommandRequest, CommandResponse
from ..tools.terminal_tools import execute_terminal_command

terminal_router = APIRouter(prefix="/api/terminal", tags=["terminal"])

@terminal_router.post("/execute", response_model=CommandResponse)
async def run_command(req: CommandRequest):
    """Executes a command in the workspace terminal."""
    return execute_terminal_command(req.command, req.timeout_seconds or 60)


class RunFileRequest(BaseModel):
    path: str  # relative path from workspace root


INSTALL_KEYWORDS = [
    "pip install", "pip3 install",
    "npm install", "npm i ", "npm i\n",
    "yarn add", "poetry add",
    "npm run", "npx "
]

RUNNER_MAP = {
    ".py":   "python",
    ".js":   "node",
    ".ts":   "npx ts-node",
    ".sh":   "bash",
    ".rb":   "ruby",
    ".php":  "php",
    ".go":   "go run",
    ".rs":   "cargo run --",
    ".java": "java",
    ".cs":   "dotnet run",
}

HTML_EXTS = {".html", ".htm"}


@terminal_router.post("/resolve-run")
async def resolve_run(req: RunFileRequest):
    """
    Given a relative file path, returns the command to run it and the panel type.
    Returns:
      { "type": "terminal", "command": "python main.py" }
      or
      { "type": "preview" }
    """
    path = req.path.strip()

    # Normalise separators
    import os
    ext = os.path.splitext(path)[1].lower()

    if ext in HTML_EXTS:
        return {"type": "preview", "command": None}

    runner = RUNNER_MAP.get(ext)
    if runner:
        # Quote path in case it contains spaces
        file_arg = f'"{path}"' if " " in path else path
        command = f"{runner} {file_arg}"
        return {"type": "terminal", "command": command}

    return {"type": "terminal", "command": f'"{path}"' if " " in path else path}

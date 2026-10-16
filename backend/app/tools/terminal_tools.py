import subprocess
import os
import sys
from pathlib import Path
from ..core.security import validate_command
from ..core.config import get_workspace_path
from ..models.schemas import CommandResponse

def execute_terminal_command(command: str, timeout_seconds: int = 60) -> CommandResponse:
    """
    Executes a shell command safely inside the active workspace directory.
    Validates against forbidden destructive commands.
    """
    is_valid, reason = validate_command(command)
    if not is_valid:
        return CommandResponse(
            command=command,
            stdout="",
            stderr=f"Security Guardrail: Execution blocked - {reason}",
            exit_code=1,
            success=False
        )
        
    workspace_dir = get_workspace_path().resolve()
    
    # Run in PowerShell on Windows, bash/sh on Unix
    is_windows = sys.platform.startswith("win")
    
    try:
        process = subprocess.run(
            command,
            cwd=str(workspace_dir),
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            encoding="utf-8",
            errors="replace"
        )
        
        return CommandResponse(
            command=command,
            stdout=process.stdout,
            stderr=process.stderr,
            exit_code=process.returncode,
            success=(process.returncode == 0)
        )
    except subprocess.TimeoutExpired:
        return CommandResponse(
            command=command,
            stdout="",
            stderr=f"Command timed out after {timeout_seconds} seconds.",
            exit_code=124,
            success=False
        )
    except Exception as e:
        return CommandResponse(
            command=command,
            stdout="",
            stderr=f"Execution error: {str(e)}",
            exit_code=1,
            success=False
        )

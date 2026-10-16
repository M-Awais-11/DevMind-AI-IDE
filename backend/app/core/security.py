import os
import re
from pathlib import Path
from .config import get_workspace_path

FORBIDDEN_COMMAND_PATTERNS = [
    r"rm\s+-rf\s+[/~]",
    r"rmdir\s+/[sS]\s+/[qQ]\s+[cC]:\\",
    r"format\s+[a-zA-Z]:",
    r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:", # fork bomb
    r"shutdown\s+",
    r"reg\s+delete\s+",
    r"del\s+/[fF]\s+/[sS]\s+/[qQ]\s+[cC]:\\windows",
]

def sanitize_and_resolve_path(target_path: str) -> Path:
    """
    Resolves target_path against the active workspace root.
    Ensures that path traversal (e.g., ../../) cannot escape the workspace directory.
    Raises PermissionError if path attempts to escape the sandbox.
    """
    workspace_root = get_workspace_path().resolve()
    
    # Clean up input string
    clean_target = target_path.strip().lstrip("/\\")
    
    # If the user passed an absolute path that is inside workspace_root, allow it
    candidate = Path(target_path)
    if candidate.is_absolute():
        resolved = candidate.resolve()
    else:
        resolved = (workspace_root / clean_target).resolve()
        
    # Check that resolved path starts with workspace_root
    try:
        resolved.relative_to(workspace_root)
    except ValueError:
        raise PermissionError(f"Access Denied: Path '{target_path}' is outside the authorized workspace sandbox ({workspace_root})")
        
    return resolved

def validate_command(command: str) -> tuple[bool, str]:
    """
    Validates a command before execution to prevent catastrophic system damage.
    Returns (is_valid, reason).
    """
    command_clean = command.strip()
    if not command_clean:
        return False, "Command is empty"
        
    for pattern in FORBIDDEN_COMMAND_PATTERNS:
        if re.search(pattern, command_clean, re.IGNORECASE):
            return False, f"Dangerous command pattern matched: {pattern}"
            
    return True, "OK"

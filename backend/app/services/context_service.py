from typing import List, Dict, Any, Optional
from pathlib import Path
from ..core.config import get_workspace_path
from ..tools.project_tools import get_project_summary
from ..tools.file_tools import read_file
from .ai_service import SYSTEM_PROMPT, get_tool_descriptions

class ContextService:
    def build_system_context(self, active_file: Optional[str] = None, open_files: Optional[List[str]] = None) -> str:
        workspace_root = get_workspace_path().resolve()
        
        # Get list of files (excluding heavy folders)
        file_tree = []
        ignored = {".git", "node_modules", "__pycache__", ".venv", "venv", ".angular", "dist"}
        for p in sorted(workspace_root.rglob("*")):
            if any(ig in p.parts for ig in ignored):
                continue
            if p.is_file():
                rel = p.relative_to(workspace_root).as_posix()
                file_tree.append(rel)
                
        tree_str = "\n".join(file_tree[:30]) if file_tree else "(Empty workspace)"
        summary = get_project_summary()
        
        context_parts = [
            SYSTEM_PROMPT.format(tool_descriptions=get_tool_descriptions()),
            f"\nCURRENT WORKSPACE CONTEXT:\n{summary}\n",
            f"Workspace Files:\n{tree_str}\n"
        ]
        
        # Add active file content if provided
        if active_file:
            try:
                content = read_file(active_file)
                # Cap content at 4000 chars to avoid token exhaustion on free models
                truncated = content[:4000] + ("\n...[content truncated]" if len(content) > 4000 else "")
                context_parts.append(f"Currently Active File in Editor ({active_file}):\n```\n{truncated}\n```\n")
            except Exception:
                pass
                
        return "\n".join(context_parts)

context_service = ContextService()

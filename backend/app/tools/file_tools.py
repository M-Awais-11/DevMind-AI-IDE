import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..core.security import sanitize_and_resolve_path
from ..core.config import get_workspace_path
from ..models.schemas import FileNode

def read_file(path: str) -> str:
    """Reads the contents of a file inside the workspace."""
    resolved = sanitize_and_resolve_path(path)
    if not resolved.exists():
        raise FileNotFoundError(f"File '{path}' does not exist.")
    if resolved.is_dir():
        raise IsADirectoryError(f"Path '{path}' is a directory, not a file.")
    try:
        return resolved.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        raise IOError(f"Could not read file '{path}': {str(e)}")

def write_file(path: str, content: str) -> str:
    """Writes content to a file inside the workspace. Creates parent directories if needed."""
    resolved = sanitize_and_resolve_path(path)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(content, encoding="utf-8")
    rel_path = resolved.relative_to(get_workspace_path()).as_posix()
    return f"Successfully wrote {len(content)} characters to '{rel_path}'."

def patch_file(path: str, target_content: str, replacement_content: str) -> str:
    """Replaces target_content with replacement_content in the specified file."""
    resolved = sanitize_and_resolve_path(path)
    if not resolved.exists():
        raise FileNotFoundError(f"File '{path}' does not exist.")
    
    current_content = resolved.read_text(encoding="utf-8", errors="replace")
    if target_content not in current_content:
        raise ValueError(f"Target snippet not found in '{path}'. Make sure the target lines match exactly.")
    
    # Replace single occurrence or raise if ambiguous
    count = current_content.count(target_content)
    if count > 1:
        # Replace first occurrence
        new_content = current_content.replace(target_content, replacement_content, 1)
    else:
        new_content = current_content.replace(target_content, replacement_content)
        
    resolved.write_text(new_content, encoding="utf-8")
    rel_path = resolved.relative_to(get_workspace_path()).as_posix()
    return f"Successfully patched '{rel_path}'."

def delete_file(path: str) -> str:
    """Deletes a file or directory inside the workspace."""
    resolved = sanitize_and_resolve_path(path)
    if not resolved.exists():
        raise FileNotFoundError(f"Path '{path}' does not exist.")
    
    # Protect against deleting workspace root
    if resolved == get_workspace_path().resolve():
        raise PermissionError("Cannot delete workspace root directory.")
        
    if resolved.is_dir():
        shutil.rmtree(resolved)
        return f"Successfully deleted directory '{path}'."
    else:
        resolved.unlink()
        return f"Successfully deleted file '{path}'."

def create_directory(path: str) -> str:
    """Creates a directory inside the workspace."""
    resolved = sanitize_and_resolve_path(path)
    resolved.mkdir(parents=True, exist_ok=True)
    rel_path = resolved.relative_to(get_workspace_path()).as_posix()
    return f"Successfully created directory '{rel_path}'."

def list_directory(subpath: str = "") -> List[Dict[str, Any]]:
    """Lists files and directories in a given workspace path."""
    resolved = sanitize_and_resolve_path(subpath)
    if not resolved.is_dir():
        raise NotADirectoryError(f"Path '{subpath}' is not a directory.")
        
    items = []
    workspace_root = get_workspace_path().resolve()
    for item in sorted(resolved.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
        rel = item.relative_to(workspace_root).as_posix()
        items.append({
            "name": item.name,
            "path": rel,
            "is_directory": item.is_dir(),
            "size": item.stat().st_size if item.is_file() else 0,
            "extension": item.suffix.lstrip(".") if item.is_file() else ""
        })
    return items

def get_workspace_tree(subpath: Optional[Path] = None) -> FileNode:
    """Builds a recursive directory tree for the Monaco File Explorer."""
    root = subpath or get_workspace_path().resolve()
    workspace_root = get_workspace_path().resolve()
    
    rel_path = "" if root == workspace_root else root.relative_to(workspace_root).as_posix()
    
    node = FileNode(
        name=root.name if rel_path else "workspace",
        path=rel_path or "/",
        is_directory=root.is_dir(),
        size=root.stat().st_size if root.is_file() else 0,
        extension=root.suffix.lstrip(".") if root.is_file() else "",
        children=[]
    )
    
    if root.is_dir():
        # Filter out heavy or hidden folders like .git, node_modules, __pycache__, .venv
        ignored_names = {".git", "node_modules", "__pycache__", ".venv", "venv", ".angular"}
        try:
            entries = sorted(root.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
            for entry in entries:
                if entry.name in ignored_names:
                    continue
                node.children.append(get_workspace_tree(entry))
        except PermissionError:
            pass
            
    return node

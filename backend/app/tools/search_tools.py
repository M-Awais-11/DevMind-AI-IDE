import re
from pathlib import Path
from typing import List, Dict, Any
from ..core.config import get_workspace_path

def search_files(query: str, is_regex: bool = False, max_results: int = 40) -> List[Dict[str, Any]]:
    """
    Searches for a string or regex across all text files in the workspace.
    """
    workspace_root = get_workspace_path().resolve()
    results = []
    
    pattern = None
    if is_regex:
        try:
            pattern = re.compile(query, re.IGNORECASE)
        except re.error:
            # Fallback to literal
            pattern = None
            
    ignored_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv", ".angular", "dist"}
    text_extensions = {".txt", ".md", ".html", ".css", ".js", ".ts", ".py", ".json", ".xml", ".yaml", ".yml", ".sql", ".sh", ".env"}
    
    for path in workspace_root.rglob("*"):
        if any(part in ignored_dirs for part in path.parts):
            continue
        if not path.is_file() or (path.suffix.lower() not in text_extensions and path.name != "README"):
            continue
            
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
            lines = content.splitlines()
            for line_idx, line in enumerate(lines, 1):
                matched = False
                if pattern:
                    matched = bool(pattern.search(line))
                else:
                    matched = (query.lower() in line.lower())
                    
                if matched:
                    rel_path = path.relative_to(workspace_root).as_posix()
                    results.append({
                        "file": rel_path,
                        "line": line_idx,
                        "content": line.strip()
                    })
                    if len(results) >= max_results:
                        return results
        except Exception:
            continue
            
    return results

def find_files_by_name(pattern: str) -> List[str]:
    """Finds files in workspace matching a glob pattern."""
    workspace_root = get_workspace_path().resolve()
    matches = []
    for p in workspace_root.rglob(pattern):
        if ".git" in p.parts or "node_modules" in p.parts:
            continue
        matches.append(p.relative_to(workspace_root).as_posix())
    return matches

import json
from pathlib import Path
from typing import Dict, Any, List
from ..core.config import get_workspace_path

def detect_project_type() -> Dict[str, Any]:
    """Inspects files in the workspace to determine framework, language, and suggested commands."""
    workspace = get_workspace_path().resolve()
    
    info = {
        "type": "generic",
        "language": "unknown",
        "framework": "none",
        "has_package_json": False,
        "has_requirements": False,
        "build_command": None,
        "test_command": None,
        "dev_command": None,
        "files_count": 0
    }
    
    pkg_json = workspace / "package.json"
    req_txt = workspace / "requirements.txt"
    pyproject = workspace / "pyproject.toml"
    index_html = workspace / "index.html"
    
    if pkg_json.exists():
        info["has_package_json"] = True
        info["language"] = "javascript/typescript"
        try:
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
            scripts = data.get("scripts", {})
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            
            if "angular" in str(deps):
                info["framework"] = "angular"
            elif "react" in str(deps) or "next" in str(deps):
                info["framework"] = "react/next"
            elif "vue" in str(deps):
                info["framework"] = "vue"
            else:
                info["framework"] = "node"
                
            info["build_command"] = "npm run build" if "build" in scripts else None
            info["test_command"] = "npm test" if "test" in scripts else None
            info["dev_command"] = "npm start" if "start" in scripts else (f"npm run dev" if "dev" in scripts else None)
        except Exception:
            pass
            
    elif req_txt.exists() or pyproject.exists():
        info["has_requirements"] = True
        info["language"] = "python"
        info["type"] = "python"
        info["test_command"] = "pytest"
        
    elif index_html.exists():
        info["type"] = "static_web"
        info["language"] = "html/css/js"
        info["framework"] = "vanilla_web"
        
    # Count total files
    count = 0
    for p in workspace.rglob("*"):
        if ".git" not in p.parts and "node_modules" not in p.parts and p.is_file():
            count += 1
    info["files_count"] = count
    
    return info

def get_project_summary() -> str:
    """Returns a readable text summary of the current project context for AI system prompts."""
    p_info = detect_project_type()
    workspace = get_workspace_path().resolve()
    
    # List top level files
    top_files = [f.name for f in workspace.iterdir() if not f.name.startswith(".")]
    
    summary = [
        f"Project Type: {p_info['type']} (Language: {p_info['language']}, Framework: {p_info['framework']})",
        f"Total Files: {p_info['files_count']}",
        f"Root Files: {', '.join(top_files[:15])}"
    ]
    if p_info.get("build_command"):
        summary.append(f"Build Command: {p_info['build_command']}")
    if p_info.get("test_command"):
        summary.append(f"Test Command: {p_info['test_command']}")
        
    return "\n".join(summary)

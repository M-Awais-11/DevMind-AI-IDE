import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..core.config import settings, update_runtime_settings, get_workspace_path
from ..models.schemas import SettingsUpdateRequest, SettingsResponse
from ..tools.project_tools import detect_project_type, get_project_summary

projects_router = APIRouter(prefix="/api/projects", tags=["projects"])

class OpenProjectRequest(BaseModel):
    path: str
    create_if_missing: bool = False

@projects_router.get("/current")
async def get_current_project():
    """Returns metadata and statistics about the currently loaded workspace."""
    workspace = get_workspace_path().resolve()
    info = detect_project_type()
    return {
        "workspace_root": str(workspace),
        "folder_name": workspace.name,
        "type": info["type"],
        "language": info["language"],
        "framework": info["framework"],
        "build_command": info.get("build_command"),
        "test_command": info.get("test_command"),
        "files_count": info["files_count"],
        "summary": get_project_summary()
    }

@projects_router.post("/open")
async def open_project(req: OpenProjectRequest):
    """Switches the active IDE workspace to the specified directory."""
    raw_path = req.path.strip()
    if not raw_path:
        raise HTTPException(status_code=400, detail="Directory path cannot be empty")
        
    target = Path(raw_path).expanduser().resolve()
    if not target.exists():
        if req.create_if_missing:
            target.mkdir(parents=True, exist_ok=True)
        else:
            raise HTTPException(status_code=404, detail=f"Directory '{target}' does not exist on this machine.")
            
    if not target.is_dir():
        raise HTTPException(status_code=400, detail=f"Path '{target}' is not a directory.")
        
    update_runtime_settings(workspace_root=str(target))
    info = detect_project_type()
    return {
        "success": True,
        "workspace_root": str(target),
        "folder_name": target.name,
        "type": info["type"],
        "language": info["language"],
        "framework": info["framework"],
        "files_count": info["files_count"],
        "summary": get_project_summary()
    }

@projects_router.get("/settings", response_model=SettingsResponse)
async def get_ide_settings():
    """Returns active settings (masking the API key for security)."""
    return SettingsResponse(
        openrouter_api_key_set=bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip()),
        openrouter_model=settings.OPENROUTER_MODEL,
        workspace_root=str(get_workspace_path()),
        auto_approve_safe_tools=settings.AUTO_APPROVE_SAFE_TOOLS
    )

@projects_router.post("/settings", response_model=SettingsResponse)
async def update_ide_settings(req: SettingsUpdateRequest):
    """Updates OpenRouter API key, model selection, or workspace root."""
    try:
        if req.workspace_root:
            p = Path(req.workspace_root)
            if not p.exists():
                p.mkdir(parents=True, exist_ok=True)

        update_runtime_settings(
            openrouter_key=req.openrouter_api_key,
            model=req.openrouter_model,
            workspace_root=req.workspace_root
        )

        return SettingsResponse(
            openrouter_api_key_set=bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip()),
            openrouter_model=settings.OPENROUTER_MODEL,
            workspace_root=str(get_workspace_path()),
            auto_approve_safe_tools=settings.AUTO_APPROVE_SAFE_TOOLS
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

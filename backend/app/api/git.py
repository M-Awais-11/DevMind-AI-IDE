from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.schemas import GitStatusResponse, GitCommitRequest
from ..tools.git_tools import git_status, git_diff, git_commit, git_init

git_router = APIRouter(prefix="/api/git", tags=["git"])

@git_router.get("/status", response_model=GitStatusResponse)
async def get_status():
    """Returns working tree status and branch info."""
    return git_status()

@git_router.get("/diff")
async def get_diff(file_path: Optional[str] = Query(None)):
    """Returns diff of modified files."""
    return {"diff": git_diff(file_path)}

@git_router.post("/commit")
async def make_commit(req: GitCommitRequest):
    """Stages files and creates a git commit."""
    try:
        msg = git_commit(req.message, req.stage_all)
        return {"success": True, "message": msg}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@git_router.post("/init")
async def initialize_repo():
    """Initializes git in the workspace."""
    msg = git_init()
    return {"message": msg}

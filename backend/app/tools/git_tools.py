import os
from typing import Dict, Any, List, Optional
from pathlib import Path
from ..core.config import get_workspace_path
from ..models.schemas import GitStatusResponse

try:
    import git
except ImportError:
    git = None

def _get_repo() -> Optional[Any]:
    if not git:
        return None
    workspace = get_workspace_path()
    try:
        return git.Repo(str(workspace), search_parent_directories=False)
    except (git.InvalidGitRepositoryError, git.NoSuchPathError):
        return None

def git_init() -> str:
    """Initializes a new git repository in the workspace."""
    workspace = get_workspace_path()
    if not git:
        return "GitPython is not installed."
    try:
        repo = git.Repo.init(str(workspace))
        return f"Initialized empty Git repository in {workspace}"
    except Exception as e:
        return f"Error initializing git: {str(e)}"

def git_status() -> GitStatusResponse:
    """Returns the current git status of the workspace."""
    repo = _get_repo()
    if not repo:
        return GitStatusResponse(branch="none", is_repo=False, modified=[], untracked=[], staged=[])
        
    try:
        branch = repo.active_branch.name if not repo.head.is_detached else "detached"
    except TypeError:
        branch = "main" # Empty repo before first commit
        
    modified = [item.a_path for item in repo.index.diff(None)]
    untracked = repo.untracked_files
    staged = [item.a_path for item in repo.index.diff("HEAD")] if repo.head.is_valid() else []
    
    return GitStatusResponse(
        branch=branch,
        is_repo=True,
        modified=modified,
        untracked=untracked,
        staged=staged
    )

def git_diff(file_path: Optional[str] = None) -> str:
    """Gets unstaged diff for workspace or specific file."""
    repo = _get_repo()
    if not repo:
        return "Not a git repository."
    try:
        if file_path:
            return repo.git.diff(file_path)
        return repo.git.diff()
    except Exception as e:
        return f"Diff error: {str(e)}"

def git_commit(message: str, stage_all: bool = True) -> str:
    """Stages files and commits changes."""
    repo = _get_repo()
    if not repo:
        repo = git.Repo.init(str(get_workspace_path()))
        
    try:
        if stage_all:
            repo.git.add(A=True)
            
        # Configure author if not set
        with repo.config_writer() as config:
            if not config.has_option("user", "name"):
                config.set_value("user", "name", "AI IDE Developer")
            if not config.has_option("user", "email"):
                config.set_value("user", "email", "developer@ai-ide.local")
                
        commit = repo.index.commit(message)
        return f"Committed: {commit.hexsha[:7]} - {message}"
    except Exception as e:
        return f"Commit failed: {str(e)}"

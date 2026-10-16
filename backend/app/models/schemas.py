from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FileNode(BaseModel):
    name: str
    path: str
    is_directory: bool
    size: Optional[int] = 0
    extension: Optional[str] = ""
    children: Optional[List["FileNode"]] = None

class FileContent(BaseModel):
    path: str
    content: str
    size: int
    read_only: bool = False

class SaveFileRequest(BaseModel):
    path: str
    content: str

class CreateFileRequest(BaseModel):
    path: str
    is_directory: bool = False

class RenameFileRequest(BaseModel):
    old_path: str
    new_path: str

class DeleteFileRequest(BaseModel):
    path: str

class CommandRequest(BaseModel):
    command: str
    timeout_seconds: Optional[int] = 60

class CommandResponse(BaseModel):
    command: str
    stdout: str
    stderr: str
    exit_code: int
    success: bool

class GitFileStatus(BaseModel):
    path: str
    status: str # 'M', 'A', 'D', '?'

class GitStatusResponse(BaseModel):
    branch: str
    is_repo: bool
    modified: List[str] = []
    untracked: List[str] = []
    staged: List[str] = []

class GitCommitRequest(BaseModel):
    message: str
    stage_all: bool = True

class AgentChatRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = "default"
    active_file: Optional[str] = None
    open_files: Optional[List[str]] = []

class SettingsUpdateRequest(BaseModel):
    openrouter_api_key: Optional[str] = None
    openrouter_model: Optional[str] = None
    workspace_root: Optional[str] = None
    auto_approve_safe_tools: Optional[bool] = None

class SettingsResponse(BaseModel):
    openrouter_api_key_set: bool
    openrouter_model: str
    workspace_root: str
    auto_approve_safe_tools: bool

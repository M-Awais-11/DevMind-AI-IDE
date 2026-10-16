from fastapi import APIRouter, HTTPException, Query
from ..models.schemas import FileNode, FileContent, SaveFileRequest, CreateFileRequest, RenameFileRequest, DeleteFileRequest
from ..tools.file_tools import (
    get_workspace_tree, read_file, write_file, delete_file, 
    create_directory, sanitize_and_resolve_path
)

files_router = APIRouter(prefix="/api/files", tags=["files"])

@files_router.get("/tree", response_model=FileNode)
async def get_files_tree():
    """Returns the workspace file and folder tree."""
    return get_workspace_tree()

@files_router.get("/content", response_model=FileContent)
async def get_file_content(path: str = Query(..., description="Relative path to file")):
    """Gets the content of a specific file."""
    try:
        content = read_file(path)
        resolved = sanitize_and_resolve_path(path)
        return FileContent(
            path=path,
            content=content,
            size=len(content)
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File '{path}' not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@files_router.post("/save")
async def save_file(req: SaveFileRequest):
    """Saves file content from the code editor."""
    try:
        msg = write_file(req.path, req.content)
        return {"success": True, "message": msg}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@files_router.post("/create")
async def create_file_or_folder(req: CreateFileRequest):
    """Creates a new file or directory."""
    try:
        if req.is_directory:
            msg = create_directory(req.path)
        else:
            msg = write_file(req.path, "")
        return {"success": True, "message": msg}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@files_router.post("/rename")
async def rename_file_or_folder(req: RenameFileRequest):
    """Renames or moves a file/folder inside workspace."""
    try:
        src = sanitize_and_resolve_path(req.old_path)
        dst = sanitize_and_resolve_path(req.new_path)
        if not src.exists():
            raise HTTPException(status_code=404, detail="Source file not found")
        if dst.exists():
            raise HTTPException(status_code=400, detail="Destination path already exists")
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return {"success": True, "message": f"Renamed {req.old_path} to {req.new_path}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@files_router.delete("/delete")
async def delete_file_or_folder(path: str = Query(...)):
    """Deletes a file or directory."""
    try:
        msg = delete_file(path)
        return {"success": True, "message": msg}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

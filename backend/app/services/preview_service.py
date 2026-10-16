import mimetypes
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from ..core.config import get_workspace_path
from ..core.security import sanitize_and_resolve_path

preview_router = APIRouter(prefix="/api/preview", tags=["preview"])

@preview_router.get("/")
@preview_router.get("/{file_path:path}")
async def serve_preview_file(file_path: str = ""):
    """
    Serves files from the workspace directory for the IDE live preview panel.
    If no file_path is requested, defaults to index.html.
    """
    workspace = get_workspace_path().resolve()
    
    if not file_path or file_path == "/":
        file_path = "index.html"
        
    try:
        resolved = sanitize_and_resolve_path(file_path)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not resolved.exists():
        # If looking for index.html but not found, provide a helpful default preview page
        if file_path == "index.html":
            return HTMLResponse("""
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: sans-serif; background: #0f172a; color: #94a3b8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { text-align: center; border: 1px dashed #334155; padding: 2rem; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="box">
                <h2>No index.html found in workspace</h2>
                <p>Ask the AI Agent on the right to generate your website or create an index.html file.</p>
              </div>
            </body>
            </html>
            """)
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
    if resolved.is_dir():
        # Check if index.html exists inside this directory
        sub_index = resolved / "index.html"
        if sub_index.exists():
            return FileResponse(str(sub_index), media_type="text/html")
        raise HTTPException(status_code=400, detail="Requested path is a directory")
        
    mime_type, _ = mimetypes.guess_type(str(resolved))
    return FileResponse(str(resolved), media_type=mime_type or "application/octet-stream")

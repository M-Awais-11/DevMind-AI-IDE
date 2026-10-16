import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .database.database import init_db
from .api.files import files_router
from .api.projects import projects_router
from .api.terminal import terminal_router
from .api.git import git_router
from .api.chat import chat_router
from .api.websocket import ws_router
from .services.preview_service import preview_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables on startup
    init_db()
    yield

app = FastAPI(
    title="DevMind - AI Coding IDE",
    description="Full-stack AI-Powered IDE Backend with OpenRouter AI Integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers first
app.include_router(files_router)
app.include_router(projects_router)
app.include_router(terminal_router)
app.include_router(git_router)
app.include_router(chat_router)
app.include_router(preview_router)
app.include_router(ws_router)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/info")
async def root_info():
    return {
        "name": "DevMind Backend",
        "status": "online",
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip()),
        "model": settings.OPENROUTER_MODEL,
        "workspace": str(settings.WORKSPACE_ROOT)
    }

# Mount Angular production frontend if built
dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist" / "frontend" / "browser"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")
else:
    @app.get("/")
    async def fallback_root():
        return await root_info()

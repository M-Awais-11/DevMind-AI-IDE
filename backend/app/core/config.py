import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Dedicated OpenRouter AI Configuration
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"
    
    # Workspace & Execution Settings
    WORKSPACE_ROOT: str = str(BASE_DIR / "workspace")
    AUTO_APPROVE_SAFE_TOOLS: bool = True
    DB_PATH: str = str(BASE_DIR / "ide_database.db")
    COMMAND_TIMEOUT_SECONDS: int = 60

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

def get_workspace_path() -> Path:
    """Returns the resolved absolute path of the active workspace."""
    p = Path(settings.WORKSPACE_ROOT)
    if not p.is_absolute():
        p = (BASE_DIR / p).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p

def update_runtime_settings(openrouter_key: Optional[str] = None, model: Optional[str] = None, workspace_root: Optional[str] = None):
    """Updates runtime settings and persists them to .env."""
    if openrouter_key is not None:
        settings.OPENROUTER_API_KEY = openrouter_key
    if model is not None:
        settings.OPENROUTER_MODEL = model
    if workspace_root is not None:
        settings.WORKSPACE_ROOT = workspace_root

    # Persist back to .env
    lines = []
    lines.append(f"OPENROUTER_API_KEY={settings.OPENROUTER_API_KEY}")
    lines.append(f"OPENROUTER_MODEL={settings.OPENROUTER_MODEL}")
    lines.append(f"OPENROUTER_BASE_URL={settings.OPENROUTER_BASE_URL}")
    lines.append(f"HOST={settings.HOST}")
    lines.append(f"PORT={settings.PORT}")
    lines.append(f"WORKSPACE_ROOT={settings.WORKSPACE_ROOT}")
    lines.append(f"AUTO_APPROVE_SAFE_TOOLS={str(settings.AUTO_APPROVE_SAFE_TOOLS).lower()}")
    lines.append(f"DB_PATH={settings.DB_PATH}")
    
    with open(ENV_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

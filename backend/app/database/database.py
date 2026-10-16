import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..core.config import settings

_db_initialized = False

def get_db_connection() -> sqlite3.Connection:
    global _db_initialized
    db_path = Path(settings.DB_PATH).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    if not _db_initialized:
        _ensure_tables(conn)
        _db_initialized = True
    return conn

def _ensure_tables(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        args_json TEXT,
        result_json TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)
    conn.commit()

def init_db():
    conn = get_db_connection()
    conn.close()

def save_chat_message(session_id: str, sender: str, content: str, metadata: Optional[Dict[str, Any]] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ensure session exists
    cursor.execute("INSERT OR IGNORE INTO chat_sessions (id, title) VALUES (?, ?)", (session_id, content[:30] if content else "New Chat"))
    
    cursor.execute(
        "INSERT INTO chat_messages (session_id, sender, content, metadata_json) VALUES (?, ?, ?, ?)",
        (session_id, sender, content, json.dumps(metadata) if metadata else None)
    )
    conn.commit()
    conn.close()

def get_chat_history(session_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, session_id, sender, content, metadata_json, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for r in rows:
        messages.append({
            "id": r["id"],
            "session_id": r["session_id"],
            "sender": r["sender"],
            "content": r["content"],
            "metadata": json.loads(r["metadata_json"]) if r["metadata_json"] else {},
            "created_at": r["created_at"]
        })
    return messages

def log_tool_audit(tool_name: str, args: Dict[str, Any], result: Any, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO audit_logs (tool_name, args_json, result_json, status) VALUES (?, ?, ?, ?)",
        (tool_name, json.dumps(args), json.dumps(result) if not isinstance(result, str) else result, status)
    )
    conn.commit()
    conn.close()

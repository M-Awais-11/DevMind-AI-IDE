"""
AI Coding IDE - Launcher
Run this script to start the backend server and serve the IDE on http://127.0.0.1:8000
"""

import os
import sys
import webbrowser
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def main():
    try:
        import uvicorn
    except ImportError:
        print("[*] Installing required backend packages...")
        os.system(f'"{sys.executable}" -m pip install -r backend/requirements.txt')
        import uvicorn

    print("=" * 60)
    print("  [*] DevMind AI Coding IDE is starting...")
    print("  [*] URL: http://127.0.0.1:8000")
    print("  [*] AI Provider: OpenRouter AI")
    print("  [*] Workspace: backend/workspace")
    print("=" * 60)

    # Open browser automatically
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()

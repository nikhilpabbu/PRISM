import sys
import os

# Add root and backend directories to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, root_dir, current_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.main import app
except ImportError:
    try:
        from main import app
    except Exception as e:
        from fastapi import FastAPI
        app = FastAPI()
        @app.get("/api/health")
        @app.get("/api/user")
        def error_handler():
            return {"status": "error", "message": str(e)}

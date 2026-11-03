# api/index.py
# Vercel Serverless Function entry point for FastAPI backend
import sys
import os

# Add backend directory to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
import db

# Ensure database is initialized in serverless environment
try:
    db.init_db()
except Exception as e:
    print(f"Serverless DB init notice: {e}")

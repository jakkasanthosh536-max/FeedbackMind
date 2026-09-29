import sys
import os
import types

# Ensure sys.path contains current and parent directories
_curr_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_curr_dir)
if _curr_dir not in sys.path:
    sys.path.insert(0, _curr_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

# Register virtual 'backend' package in sys.modules if running directly inside backend/ directory
if 'backend' not in sys.modules and not os.path.exists(os.path.join(_curr_dir, 'backend')):
    backend_pkg = types.ModuleType('backend')
    backend_pkg.__path__ = [_curr_dir]
    sys.modules['backend'] = backend_pkg

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api import router as api_router

app = FastAPI(
    title="FeedbackMind API",
    description="AI Agent for Feedback Synthesis powered by Hindsight Cloud Persistent Memory & Groq",
    version="1.0.0"
)

# CORS configuration allowing React frontend in local & production environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://feedback-mind-delta.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "FeedbackMind Backend API is running.", "docs": "/docs"}

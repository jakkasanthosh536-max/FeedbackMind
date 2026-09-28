from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api import router as api_router

app = FastAPI(
    title="FeedbackMind API",
    description="AI Agent for Feedback Synthesis powered by Hindsight Cloud Persistent Memory & Groq",
    version="1.0.0"
)

# CORS configuration allowing React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "FeedbackMind Backend API is running.", "docs": "/docs"}

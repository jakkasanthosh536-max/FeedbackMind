from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any

from backend.config import settings
from backend.models.schemas import (
    FeedbackInput, FeedbackResponse,
    ProductUpdateInput, ProductUpdateResponse,
    AskInput, AskResponse, MemoryEvidence,
    DashboardStats
)
from backend.services.feedback_service import feedback_service
from backend.services.product_update_service import product_update_service
from backend.services.hindsight_service import hindsight_service
from backend.services.llm_service import llm_service
from backend.services.insight_service import insight_service
from backend.storage import load_feedback, load_updates

router = APIRouter(prefix="/api")

@router.get("/config-status")
@router.get("/health")
def get_health_and_config_status():
    h_configured = bool(settings.HINDSIGHT_API_KEY and not settings.HINDSIGHT_API_KEY.startswith("your_"))
    g_configured = bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_"))
    
    h_connected, h_msg = hindsight_service.check_connection() if h_configured else (False, "Hindsight API key missing in .env")
    g_connected, g_msg = llm_service.check_connection() if g_configured else (False, "Groq API key missing in .env")
    
    return {
        "status": "healthy",
        "hindsight_configured": h_configured,
        "groq_configured": g_configured,
        "hindsight_connected": h_connected,
        "groq_connected": g_connected,
        "hindsight": {
            "configured": h_configured,
            "connected": h_connected,
            "message": h_msg
        },
        "groq": {
            "configured": g_configured,
            "connected": g_connected,
            "message": g_msg
        }
    }

@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(item: FeedbackInput):
    if not item.feedback or not item.feedback.strip():
        raise HTTPException(status_code=400, detail="Feedback content cannot be empty.")
    if not item.customer or not item.customer.strip():
        raise HTTPException(status_code=400, detail="Customer name cannot be empty.")
    return feedback_service.process_feedback(item)

@router.post("/product-updates", response_model=ProductUpdateResponse, status_code=status.HTTP_201_CREATED)
def create_product_update(item: ProductUpdateInput):
    if not item.version or not item.change:
        raise HTTPException(status_code=400, detail="Version and change description are required.")
    return product_update_service.process_update(item)

@router.post("/ask", response_model=AskResponse)
def ask_question(item: AskInput):
    if not item.question or not item.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1. Hindsight RECALL operation
    h_ok, raw_memories, h_msg = hindsight_service.recall(query=item.question)
    
    evidences = [
        MemoryEvidence(
            id=m.get("id"),
            content=m.get("content"),
            score=m.get("score"),
            type=m.get("type"),
            metadata=m.get("metadata")
        )
        for m in raw_memories
    ]

    # 2. LLM Synthesis based on recalled evidence
    answer = llm_service.synthesize_answer(
        question=item.question,
        recalled_memories=raw_memories
    )

    g_ok, _ = llm_service.check_connection()

    return AskResponse(
        question=item.question,
        answer=answer,
        recalled_memories_count=len(evidences),
        memories_used=evidences,
        hindsight_status="Recall Successful" if h_ok else "Recall Failed",
        llm_status="Synthesis Complete" if g_ok else "LLM Warning"
    )

@router.get("/insights", response_model=DashboardStats)
def get_insights():
    return insight_service.get_dashboard_stats()

@router.get("/feedback/recent")
def get_recent_feedback(limit: int = 50):
    all_fb = load_feedback()
    return all_fb[:limit]

@router.get("/product-updates")
def get_product_updates():
    return load_updates()

@router.post("/seed")
def seed_demo_data():
    try:
        try:
            from seed.seed_data import run_seed
        except ImportError:
            from backend.seed.seed_data import run_seed
        run_seed()
        return {"status": "success", "message": "Demo data populated into Hindsight Cloud and database successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed demo data: {str(e)}")

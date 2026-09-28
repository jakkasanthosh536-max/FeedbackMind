from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Feedback Submission Schema
class FeedbackInput(BaseModel):
    customer: str = Field(..., example="Rahul")
    source: str = Field(..., example="Support")
    product_area: str = Field(..., example="Dashboard")
    date: str = Field(..., example="2026-09-01")
    feedback: str = Field(..., example="The dashboard takes too long to load.")

# Feedback AI Extraction Analysis
class FeedbackAnalysis(BaseModel):
    theme: str
    product_area: str
    sentiment: str  # Positive, Neutral, Negative
    issue: str
    summary: str

# Response after Feedback creation
class FeedbackResponse(BaseModel):
    id: str
    customer: str
    source: str
    product_area: str
    date: str
    feedback: str
    analysis: FeedbackAnalysis
    hindsight_status: str  # "Memory Stored" or "Memory Failed"
    hindsight_detail: Optional[str] = None

# Product Update Submission Schema
class ProductUpdateInput(BaseModel):
    version: str = Field(..., example="v2.4")
    product_area: str = Field(..., example="Dashboard")
    date: str = Field(..., example="2026-09-20")
    change: str = Field(..., example="Optimized dashboard loading performance.")

# Product Update Response
class ProductUpdateResponse(BaseModel):
    id: str
    version: str
    product_area: str
    date: str
    change: str
    hindsight_status: str
    hindsight_detail: Optional[str] = None

# Question Request Schema
class AskInput(BaseModel):
    question: str = Field(..., example="Did the latest update improve the dashboard problem?")

# Evidence item retrieved from Hindsight
class MemoryEvidence(BaseModel):
    id: Optional[str] = None
    content: str
    score: Optional[float] = None
    type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# Ask Agent Response
class AskResponse(BaseModel):
    question: str
    answer: str
    recalled_memories_count: int
    memories_used: List[MemoryEvidence]
    hindsight_status: str
    llm_status: str

# Dashboard Statistics Response
class DashboardStats(BaseModel):
    total_feedback: int
    positive: int
    neutral: int
    negative: int
    top_themes: List[Dict[str, Any]]
    top_product_areas: List[Dict[str, Any]]
    emerging_issues: List[Dict[str, Any]]
    hindsight_connected: bool
    groq_connected: bool

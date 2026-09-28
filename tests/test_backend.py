import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "hindsight" in data
    assert "groq" in data

def test_invalid_feedback():
    response = client.post("/api/feedback", json={"customer": "", "source": "Support", "product_area": "Dashboard", "date": "2026-09-01", "feedback": ""})
    assert response.status_code == 400

def test_add_feedback_success():
    payload = {
        "customer": "Test User",
        "source": "Support",
        "product_area": "Dashboard",
        "date": "2026-09-28",
        "feedback": "The dashboard loads fast and smooth."
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["customer"] == "Test User"
    assert "hindsight_status" in data
    assert "analysis" in data

def test_add_product_update_success():
    payload = {
        "version": "v2.6",
        "product_area": "Dashboard",
        "date": "2026-09-28",
        "change": "Added instant search filters."
    }
    response = client.post("/api/product-updates", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["version"] == "v2.6"
    assert "hindsight_status" in data

def test_ask_question():
    payload = {"question": "What customer feedback do we have about the dashboard?"}
    response = client.post("/api/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "recalled_memories_count" in data
    assert "hindsight_status" in data

def test_insights_endpoint():
    response = client.get("/api/insights")
    assert response.status_code == 200
    data = response.json()
    assert "total_feedback" in data
    assert "positive" in data
    assert "negative" in data

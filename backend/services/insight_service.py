from collections import Counter
from typing import Dict, Any, List
from backend.storage import load_feedback, load_updates
from backend.services.hindsight_service import hindsight_service
from backend.services.llm_service import llm_service
from backend.models.schemas import DashboardStats

class InsightService:
    def get_dashboard_stats(self) -> DashboardStats:
        all_feedback = load_feedback()
        
        total = len(all_feedback)
        pos = sum(1 for f in all_feedback if f.get("analysis", {}).get("sentiment") == "Positive")
        neu = sum(1 for f in all_feedback if f.get("analysis", {}).get("sentiment") == "Neutral")
        neg = sum(1 for f in all_feedback if f.get("analysis", {}).get("sentiment") == "Negative")

        themes_counter = Counter([f.get("analysis", {}).get("theme", "General") for f in all_feedback])
        areas_counter = Counter([f.get("product_area", "Dashboard") for f in all_feedback])
        issues = [
            {"issue": f.get("analysis", {}).get("issue", f.get("feedback")[:60]), "count": 1, "product_area": f.get("product_area")}
            for f in all_feedback if f.get("analysis", {}).get("sentiment") == "Negative"
        ][:5]

        top_themes = [{"theme": t, "count": c} for t, c in themes_counter.most_common(5)]
        top_areas = [{"product_area": a, "count": c} for a, c in areas_counter.most_common(5)]

        hindsight_ok, _ = hindsight_service.check_connection()
        groq_ok, _ = llm_service.check_connection()

        return DashboardStats(
            total_feedback=total,
            positive=pos,
            neutral=neu,
            negative=neg,
            top_themes=top_themes,
            top_product_areas=top_areas,
            emerging_issues=issues,
            hindsight_connected=hindsight_ok,
            groq_connected=groq_ok
        )

insight_service = InsightService()

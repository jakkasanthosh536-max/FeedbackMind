import uuid
from typing import Dict, Any
from backend.models.schemas import FeedbackInput, FeedbackResponse
from backend.services.llm_service import llm_service
from backend.services.hindsight_service import hindsight_service
from backend.storage import load_feedback, save_feedback

class FeedbackService:
    def process_feedback(self, item: FeedbackInput) -> FeedbackResponse:
        # Step 1: AI Extraction via Groq
        analysis = llm_service.extract_feedback_attributes(
            feedback_text=item.feedback,
            customer=item.customer,
            product_area=item.product_area
        )

        # Step 2: Format rich semantic content for Hindsight
        semantic_memory = (
            f"Customer Feedback | Date: {item.date} | Customer: {item.customer} | "
            f"Source: {item.source} | Product Area: {analysis.product_area} | "
            f"Theme: {analysis.theme} | Sentiment: {analysis.sentiment} | "
            f"Issue: {analysis.issue} | Summary: {analysis.summary} | "
            f"Raw Feedback: \"{item.feedback}\""
        )

        metadata = {
            "type": "feedback",
            "customer": item.customer,
            "source": item.source,
            "product_area": analysis.product_area,
            "theme": analysis.theme,
            "sentiment": analysis.sentiment,
            "date": item.date
        }

        tags = ["feedback", analysis.theme.lower().replace(" ", "_"), analysis.sentiment.lower(), item.product_area.lower().replace(" ", "_")]

        # Step 3: Retain in Hindsight Cloud
        retained, status_msg = hindsight_service.retain(
            content=semantic_memory,
            metadata=metadata,
            tags=tags
        )

        hindsight_status = "Memory Stored" if retained else "Memory Failed"

        # Step 4: Save local record for instant dashboard statistics
        record = {
            "id": f"fb_{uuid.uuid4().hex[:8]}",
            "customer": item.customer,
            "source": item.source,
            "product_area": analysis.product_area,
            "date": item.date,
            "feedback": item.feedback,
            "analysis": analysis.dict(),
            "hindsight_status": hindsight_status,
            "hindsight_detail": status_msg
        }

        all_feedback = load_feedback()
        all_feedback.insert(0, record)
        save_feedback(all_feedback)

        return FeedbackResponse(
            id=record["id"],
            customer=record["customer"],
            source=record["source"],
            product_area=record["product_area"],
            date=record["date"],
            feedback=record["feedback"],
            analysis=analysis,
            hindsight_status=hindsight_status,
            hindsight_detail=status_msg
        )

feedback_service = FeedbackService()

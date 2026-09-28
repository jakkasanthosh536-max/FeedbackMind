import logging
import json
from typing import Tuple, Dict, Any, List
from groq import Groq
from backend.config import settings
from backend.models.schemas import FeedbackAnalysis

logger = logging.getLogger("llm_service")

class LLMService:
    @property
    def api_key(self) -> str:
        return settings.GROQ_API_KEY

    @property
    def model(self) -> str:
        return settings.GROQ_MODEL

    def _get_client(self) -> Groq:
        return Groq(api_key=self.api_key if self.api_key else None)

    def check_connection(self) -> Tuple[bool, str]:
        """Verify Groq LLM connectivity."""
        if not self.api_key or self.api_key.startswith("your_"):
            return False, "Groq API key not configured in .env"
        try:
            client = self._get_client()
            resp = client.chat.completions.create(
                messages=[{"role": "user", "content": "Ping"}],
                model=self.model,
                max_tokens=5
            )
            return True, f"Connected to Groq ({self.model})"
        except Exception as e:
            return False, f"Groq connection error: {str(e)}"

    def extract_feedback_attributes(self, feedback_text: str, customer: str, product_area: str) -> FeedbackAnalysis:
        """Extract theme, sentiment, issue, summary using Groq LLM."""
        if not self.api_key or self.api_key.startswith("your_"):
            sentiment = "Negative" if any(w in feedback_text.lower() for w in ["slow", "bug", "takes too long", "forever", "horrible", "error", "fail"]) else ("Positive" if any(w in feedback_text.lower() for w in ["faster", "great", "love", "awesome", "good", "improved"]) else "Neutral")
            theme = "Performance" if any(w in feedback_text.lower() for w in ["slow", "load", "open", "faster", "speed"]) else ("UI/UX" if "design" in feedback_text.lower() or "nav" in feedback_text.lower() else "General")
            return FeedbackAnalysis(
                theme=theme,
                product_area=product_area or "General",
                sentiment=sentiment,
                issue=feedback_text[:80],
                summary=f"Feedback from {customer} regarding {product_area}"
            )

        prompt = f"""
You are FeedbackMind AI. Analyze the following customer feedback.

Customer: {customer}
Product Area: {product_area}
Feedback: "{feedback_text}"

Return ONLY a strict JSON object with exact keys:
{{
  "theme": "Primary Theme (e.g. Performance, Pricing, UI/UX, Reliability, Features)",
  "product_area": "Product Area (e.g. Dashboard, Search, Navigation, Reports, Billing)",
  "sentiment": "Positive" or "Neutral" or "Negative",
  "issue": "Brief description of the issue or praise",
  "summary": "1-sentence concise summary of feedback"
}}
Do NOT output markdown fence, extra text, or reasoning. Return valid JSON only.
"""
        try:
            client = self._get_client()
            resp = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.1
            )
            raw = resp.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw.strip())
            return FeedbackAnalysis(
                theme=data.get("theme", "General"),
                product_area=data.get("product_area", product_area or "General"),
                sentiment=data.get("sentiment", "Neutral"),
                issue=data.get("issue", feedback_text[:80]),
                summary=data.get("summary", feedback_text)
            )
        except Exception as e:
            logger.error(f"Groq extraction error: {e}")
            sentiment = "Negative" if any(w in feedback_text.lower() for w in ["slow", "bug", "takes too long", "forever"]) else "Positive"
            return FeedbackAnalysis(
                theme="Performance" if "slow" in feedback_text.lower() or "load" in feedback_text.lower() else "General",
                product_area=product_area or "Dashboard",
                sentiment=sentiment,
                issue=feedback_text[:80],
                summary=feedback_text
            )

    def synthesize_answer(self, question: str, recalled_memories: List[Dict[str, Any]]) -> str:
        """Synthesize answer using recalled Hindsight memories."""
        if not recalled_memories:
            return "I searched Hindsight persistent memory, but found no relevant historical feedback or product updates matching your question."

        memories_text = "\n".join([
            f"- [{m.get('type', 'Memory')}] {m.get('content')}" for m in recalled_memories
        ])

        if not self.api_key or self.api_key.startswith("your_"):
            return f"Based on {len(recalled_memories)} recalled memories from Hindsight persistent memory:\n\n" + \
                   "\n".join([f"• {m.get('content')}" for m in recalled_memories[:5]]) + \
                   "\n\n(Configure GROQ_API_KEY in .env for deep AI synthesis)."

        prompt = f"""
You are FeedbackMind, an AI agent for Product Managers with persistent long-term memory powered by Hindsight Cloud.

The Product Manager asks:
"{question}"

Here are the RECALLED HISTORICAL MEMORIES from Hindsight persistent memory:
{memories_text}

Instructions:
1. Synthesize a direct, professional, clear response to the Product Manager's question.
2. Ground your response STRICTLY on the recalled historical memories provided above.
3. Highlight customer feedback trends over time, sentiment changes, and connect them with relevant product updates (e.g. how a product update like v2.4 resolved earlier complaints).
4. Do NOT make up information not supported by the recalled memories.

Answer:
"""
        try:
            client = self._get_client()
            resp = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq synthesis error: {e}")
            return f"Error connecting to Groq LLM: {str(e)}. However, Hindsight retrieved {len(recalled_memories)} relevant historical memories."

llm_service = LLMService()

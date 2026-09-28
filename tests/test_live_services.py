import os
import sys
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.hindsight_service import hindsight_service
from backend.services.llm_service import llm_service
from backend.models.schemas import FeedbackInput, ProductUpdateInput
from backend.services.feedback_service import feedback_service
from backend.services.product_update_service import product_update_service
from backend.routes.api import ask_question
from backend.models.schemas import AskInput

def run_live_tests():
    print("==================================================")
    print("1. TEST HINDSIGHT CLOUD CONNECTION")
    print("==================================================")
    h_ok, h_msg = hindsight_service.check_connection()
    print(f"Hindsight Status: {'CONNECTED' if h_ok else 'FAILED'} -> {h_msg}")

    print("\n==================================================")
    print("2. TEST GROQ LLM CONNECTION")
    print("==================================================")
    g_ok, g_msg = llm_service.check_connection()
    print(f"Groq Status: {'CONNECTED' if g_ok else 'FAILED'} -> {g_msg}")

    print("\n==================================================")
    print("3. TEST HINDSIGHT RETAIN (Feedback Ingestion)")
    print("==================================================")
    fb_item = FeedbackInput(
        customer="Rahul",
        source="Support",
        product_area="Dashboard",
        date="2026-09-01",
        feedback="The dashboard takes too long to load."
    )
    fb_resp = feedback_service.process_feedback(fb_item)
    print(f"Feedback ID: {fb_resp.id}")
    print(f"Extracted Theme: {fb_resp.analysis.theme}")
    print(f"Extracted Sentiment: {fb_resp.analysis.sentiment}")
    print(f"Hindsight Status: {fb_resp.hindsight_status}")
    print(f"Hindsight Detail: {fb_resp.hindsight_detail}")

    print("\n==================================================")
    print("4. TEST PRODUCT UPDATE RETAIN")
    print("==================================================")
    up_item = ProductUpdateInput(
        version="v2.4",
        product_area="Dashboard",
        date="2026-09-20",
        change="Optimized dashboard loading performance and query latencies."
    )
    up_resp = product_update_service.process_update(up_item)
    print(f"Product Update ID: {up_resp.id}")
    print(f"Hindsight Status: {up_resp.hindsight_status}")
    print(f"Hindsight Detail: {up_resp.hindsight_detail}")

    print("\n==================================================")
    print("5. TEST HINDSIGHT RECALL & GROQ SYNTHESIS (Ask Agent)")
    print("==================================================")
    ask_input = AskInput(question="Did the latest update improve the dashboard problem?")
    ask_resp = ask_question(ask_input)
    print(f"Question: {ask_resp.question}")
    print(f"Hindsight Status: {ask_resp.hindsight_status}")
    print(f"Recalled Memories Count: {ask_resp.recalled_memories_count}")
    print(f"LLM Synthesis Answer:\n{ask_resp.answer}")

if __name__ == "__main__":
    run_live_tests()

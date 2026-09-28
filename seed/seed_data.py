import os
import sys
import logging
from concurrent.futures import ThreadPoolExecutor

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.schemas import FeedbackInput, ProductUpdateInput
from backend.services.feedback_service import feedback_service
from backend.services.product_update_service import product_update_service

logger = logging.getLogger("seed")

PRODUCT_UPDATES_SEED = [
    {
        "version": "v2.2",
        "product_area": "Search",
        "date": "2026-08-25",
        "change": "Improved search relevance and indexing speed for customer records."
    },
    {
        "version": "v2.3",
        "product_area": "Navigation",
        "date": "2026-09-02",
        "change": "Redesigned navigation bar and sidebar layout for cleaner user experience."
    },
    {
        "version": "v2.4",
        "product_area": "Dashboard",
        "date": "2026-09-18",
        "change": "Optimized dashboard loading performance, reduced query latencies, and added caching."
    },
    {
        "version": "v2.5",
        "product_area": "Reports",
        "date": "2026-09-25",
        "change": "Improved report generation speed and added background PDF export worker."
    }
]

FEEDBACK_SEED = [
    {"customer": "Rahul", "source": "Support", "product_area": "Dashboard", "date": "2026-09-01", "feedback": "The dashboard takes too long to load."},
    {"customer": "Sarah", "source": "Survey", "product_area": "Dashboard", "date": "2026-09-02", "feedback": "The dashboard is still extremely slow when rendering charts."},
    {"customer": "Alex", "source": "Review", "product_area": "Reports", "date": "2026-09-03", "feedback": "Reports take forever to open and often crash."},
    {"customer": "Elena", "source": "Email", "product_area": "Navigation", "date": "2026-09-04", "feedback": "Where did the settings menu go? The navigation layout is confusing."},
    {"customer": "Michael", "source": "Support", "product_area": "Pricing", "date": "2026-09-05", "feedback": "The tier pricing is too expensive for small teams."},
    {"customer": "Priya", "source": "Survey", "product_area": "Dashboard", "date": "2026-09-06", "feedback": "Every time I open the dashboard, I see a spinning loader for 15 seconds."},
    {"customer": "David", "source": "Review", "product_area": "Search", "date": "2026-09-07", "feedback": "Search is working well now after the v2.2 update!"},
    {"customer": "Jessica", "source": "Support", "product_area": "Reliability", "date": "2026-09-08", "feedback": "Frequent 504 gateway timeout errors during peak afternoon hours."},
    {"customer": "Carlos", "source": "Email", "product_area": "Dashboard", "date": "2026-09-09", "feedback": "The dashboard is unbearably slow. My team cannot track daily KPIs."},
    {"customer": "Anita", "source": "Survey", "product_area": "Navigation", "date": "2026-09-10", "feedback": "Love the sleek new navigation sidebar from v2.3 release."},
    {"customer": "Vikram", "source": "Support", "product_area": "Dashboard", "date": "2026-09-11", "feedback": "Dashboard load time is over 20 seconds. Fix this ASAP."},
    {"customer": "Hannah", "source": "Review", "product_area": "Features", "date": "2026-09-12", "feedback": "Please add CSV export options for filtered feedback tables."},
    {"customer": "Omar", "source": "Support", "product_area": "Reports", "date": "2026-09-13", "feedback": "Report export keeps failing with internal server error."},
    {"customer": "Sophia", "source": "Survey", "product_area": "Pricing", "date": "2026-09-14", "feedback": "Annual billing plan discount is very attractive and worth it."},
    {"customer": "Lucas", "source": "Email", "product_area": "Dashboard", "date": "2026-09-15", "feedback": "Dashboard is freezing our browser tab when switching date ranges."},
    {"customer": "Kavita", "source": "Support", "product_area": "Reliability", "date": "2026-09-16", "feedback": "System uptime has been unstable this past week."},
    {"customer": "Tom", "source": "Survey", "product_area": "Dashboard", "date": "2026-09-17", "feedback": "Dashboard response times are blocking our morning standup."},
    {"customer": "Rahul", "source": "Support", "product_area": "Dashboard", "date": "2026-09-19", "feedback": "The dashboard is much faster now! Great job on the update."},
    {"customer": "Sarah", "source": "Survey", "product_area": "Dashboard", "date": "2026-09-20", "feedback": "Huge improvement on dashboard speed after v2.4 optimization."},
    {"customer": "Vikram", "source": "Email", "product_area": "Dashboard", "date": "2026-09-21", "feedback": "Dashboard now loads in under 2 seconds. Satisfied!"},
    {"customer": "Chloe", "source": "Review", "product_area": "UI/UX", "date": "2026-09-22", "feedback": "Clean aesthetics and fast data updates on the main feed."},
    {"customer": "Daniel", "source": "Support", "product_area": "Reports", "date": "2026-09-23", "feedback": "Dashboard is fixed, but report generation is still laggy."},
    {"customer": "Maya", "source": "Survey", "product_area": "Dashboard", "date": "2026-09-24", "feedback": "Noticeably snappier dashboard performance since yesterday."},
    {"customer": "Alex", "source": "Support", "product_area": "Reports", "date": "2026-09-26", "feedback": "Reports export rapidly now after the v2.5 patch."},
    {"customer": "Grace", "source": "Review", "product_area": "Features", "date": "2026-09-27", "feedback": "The AI summary feature saves me hours of feedback reading every week."}
]

def _seed_update(up):
    return product_update_service.process_update(ProductUpdateInput(**up))

def _seed_feedback(fb):
    return feedback_service.process_feedback(FeedbackInput(**fb))

def run_seed():
    print("Concurrently seeding Product Updates into Hindsight Cloud & local storage...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        list(executor.map(_seed_update, PRODUCT_UPDATES_SEED))

    print("Concurrently seeding Customer Feedback into Hindsight Cloud & local storage...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(_seed_feedback, FEEDBACK_SEED))

    print("Seed complete!")

if __name__ == "__main__":
    run_seed()

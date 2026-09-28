import os
import json
from typing import List, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FEEDBACK_FILE = os.path.join(DATA_DIR, "feedback.json")
UPDATES_FILE = os.path.join(DATA_DIR, "updates.json")

def _ensure_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def load_feedback() -> List[Dict[str, Any]]:
    _ensure_dir()
    if not os.path.exists(FEEDBACK_FILE):
        return []
    try:
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_feedback(items: List[Dict[str, Any]]):
    _ensure_dir()
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)

def load_updates() -> List[Dict[str, Any]]:
    _ensure_dir()
    if not os.path.exists(UPDATES_FILE):
        return []
    try:
        with open(UPDATES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_updates(items: List[Dict[str, Any]]):
    _ensure_dir()
    with open(UPDATES_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)

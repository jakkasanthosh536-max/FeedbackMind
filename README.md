# FeedbackMind 🧠⚡

> **AI Customer Feedback Synthesizer powered by Hindsight Cloud Persistent Memory & Groq LLMs**

FeedbackMind is an autonomous AI agent designed for Product Managers and Product Teams. It remembers customer feedback over time, discovers recurring themes and sentiment shifts, and explicitly connects customer feedback with product updates to track problem resolution.

---

## 💡 Why Memory Matters

> **"Without memory, the agent has limited historical context. With Hindsight, the agent can recall relevant historical feedback and product changes."**

Traditional RAG systems store static chunks in standard vector databases without contextual reasoning or long-term entity retention across events. 

With **Hindsight Cloud**, FeedbackMind achieves:
1. **Persistent Temporal Memory**: Remembers past complaints (e.g. "Dashboard is slow" in Week 1).
2. **Product Event Correlation**: Stores product updates (e.g. "v2.4 Dashboard performance optimization" in Week 3).
3. **Synthesis & Evidence**: Recalls both historical feedback and product changes to answer questions like *"Did the latest update improve the dashboard problem?"* with explicit memory evidence.

---

## 🏗️ Architecture

```
                                ┌───────────────────────────┐
                                │   React + Vite Frontend   │
                                │ (Dashboard, Add, Ask UI)  │
                                └─────────────┬─────────────┘
                                              │ REST API
                                ┌─────────────▼─────────────┐
                                │      FastAPI Backend      │
                                └──────┬─────────────┬──────┘
                                       │             │
                    ┌──────────────────▼──┐       ┌──▼──────────────────┐
                    │   Hindsight Cloud   │       │      Groq LLM       │
                    │  (Retain & Recall)  │       │ (Analysis & Synthesis│
                    └─────────────────────┘       └─────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic V2
- **Memory Engine**: Official Hindsight Cloud SDK (`hindsight-client`) & REST API
- **LLM Engine**: Groq SDK (`groq`, `llama-3.3-70b-versatile`)
- **Testing**: Pytest & FastAPI TestClient

---

## 🚀 Environment & Setup

### 1. Clone & Configure Environment
Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and insert your secret credentials:

```env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=feedbackmind
HINDSIGHT_API_KEY=your_hindsight_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

> 🔒 **Security Note**: Never commit `.env` to GitHub. The `.env` file is included in `.gitignore`.

---

## 🏃 Running Locally

### Backend (FastAPI)
```bash
# Setup virtual environment & dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Start backend server on port 8000
uvicorn backend.main:app --reload --port 8000
```
Backend API interactive docs: `http://localhost:8000/docs`

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open application in browser: `http://localhost:3000`

---

## 🎬 Main Demonstration Flow (Compulsory Hackathon Demo)

Follow these steps to demonstrate real Hindsight memory retain and recall behavior:

1. **Step 1 (Add Feedback)**: Customer `Rahul` (Support): *"The dashboard takes too long to load."* -> Verify Hindsight RETAIN status: **Memory Stored**.
2. **Step 2 (Add Feedback)**: Customer `Sarah` (Survey): *"The dashboard is still extremely slow."* -> Verify Hindsight RETAIN status: **Memory Stored**.
3. **Step 3 (Add Feedback)**: Customer `Alex` (Review): *"Reports take forever to open."* -> Verify Hindsight RETAIN status: **Memory Stored**.
4. **Step 4 (Add Product Update)**: Version `v2.4` (Dashboard, 2026-09-20): *"Optimized dashboard loading performance."* -> Verify Hindsight RETAIN status: **Memory Stored**.
5. **Step 5 (Add Feedback)**: Customer `Rahul` (Support): *"The dashboard is much faster now."* -> Verify Hindsight RETAIN status: **Memory Stored**.
6. **Step 6 (Ask FeedbackMind)**: Ask: *"Did the latest update improve the dashboard problem?"*
   - **Result**: Hindsight RECALL retrieves memories from Step 1, Step 4, and Step 5. Groq synthesizes a direct answer explaining how v2.4 resolved the earlier performance complaints.

---

## 🧪 Running Automated Tests

```bash
source venv/bin/activate
PYTHONPATH=. pytest tests/test_backend.py
```

---

## 🔍 Secondary Supported Questions

- *"What are our biggest customer problems?"*
- *"What themes are emerging over time?"*
- *"How has customer sentiment shifted?"*
- *"What are customers saying about the dashboard?"*
- *"Which product area has the most negative feedback?"*
- *"Did our latest product update improve customer sentiment?"*

---

## 📜 License
MIT License

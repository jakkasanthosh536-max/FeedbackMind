import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def get_json(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post_json(path, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def test_all():
    print("1. Testing GET /api/health...")
    code, res = get_json("/api/health")
    print(f"   Status: {code} -> hindsight_connected: {res.get('hindsight_connected')}, groq_connected: {res.get('groq_connected')}")

    print("2. Testing GET /api/config-status...")
    code, res = get_json("/api/config-status")
    print(f"   Status: {code} -> hindsight_configured: {res.get('hindsight_configured')}, groq_configured: {res.get('groq_configured')}")

    print("3. Testing GET /api/insights...")
    code, res = get_json("/api/insights")
    print(f"   Status: {code} -> Total feedback: {res.get('total_feedback')}, Positive: {res.get('positive')}, Negative: {res.get('negative')}")

    print("4. Testing GET /api/feedback/recent...")
    code, res = get_json("/api/feedback/recent")
    print(f"   Status: {code} -> Recent items count: {len(res)}")

    print("5. Testing POST /api/feedback...")
    code, res = post_json("/api/feedback", {
        "customer": "Test User Verification",
        "source": "Survey",
        "product_area": "Dashboard",
        "date": "2026-09-28",
        "feedback": "Super fast dashboard experience."
    })
    print(f"   Status: {code} -> ID: {res.get('id')}, Hindsight: {res.get('hindsight_status')}")

    print("6. Testing POST /api/seed...")
    code, res = post_json("/api/seed", {})
    print(f"   Status: {code} -> Message: {res.get('message')}")

    print("\nRe-verifying GET /api/insights after seeding...")
    code, res = get_json("/api/insights")
    print(f"   Status: {code} -> Updated Total feedback: {res.get('total_feedback')}, Positive: {res.get('positive')}, Negative: {res.get('negative')}")

if __name__ == "__main__":
    test_all()

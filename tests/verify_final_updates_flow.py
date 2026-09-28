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

def run_verification():
    print("1. Verifying GET /api/health...")
    code, health = get_json("/api/health")
    assert code == 200, "Health check failed"
    print(f"   Hindsight Connected: {health.get('hindsight_connected')}")
    print(f"   Groq Connected: {health.get('groq_connected')}")
    assert health.get('hindsight_connected') == True
    assert health.get('groq_connected') == True

    print("\n2. Submitting new product update v2.8 (Reports)...")
    payload = {
        "version": "v2.8",
        "product_area": "Reports",
        "date": "2026-09-28",
        "change": "Improved report generation performance."
    }
    code, resp = post_json("/api/product-updates", payload)
    assert code == 201, "Creation failed"
    print(f"   Status: {resp.get('hindsight_status')}")
    assert resp.get('hindsight_status') == 'Memory Stored'

    print("\n3. Verifying update appears at the top of GET /api/product-updates...")
    code, updates = get_json("/api/product-updates")
    assert code == 200
    top_item = updates[0]
    print(f"   Top item: version={top_item.get('version')}, area={top_item.get('product_area')}, date={top_item.get('date')}")
    assert top_item.get('version') == 'v2.8'
    assert top_item.get('product_area') == 'Reports'

    print("\n4. Submitting identical product update again (Testing Idempotency)...")
    code2, resp2 = post_json("/api/product-updates", payload)
    assert code2 == 201

    print("\n5. Verifying product updates count after re-submission...")
    code, updates_after = get_json("/api/product-updates")
    v28_items = [u for u in updates_after if u.get("version") == "v2.8" and u.get("product_area") == "Reports"]
    print(f"   Matches for v2.8: {len(v28_items)} (Expected: 1)")
    assert len(v28_items) == 1, "Duplicate v2.8 was created!"

    print("\n✅ Final Verification PASSED Successfully!")

if __name__ == "__main__":
    run_verification()

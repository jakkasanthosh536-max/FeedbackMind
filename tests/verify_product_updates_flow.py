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

def test_product_updates_flow():
    print("1. Checking connection statuses...")
    code, health = get_json("/api/config-status")
    print(f"   Hindsight Connected: {health.get('hindsight_connected')}")
    print(f"   Groq Connected: {health.get('groq_connected')}")

    print("\n2. Fetching initial product updates...")
    code, initial_updates = get_json("/api/product-updates")
    initial_count = len(initial_updates)
    print(f"   Initial updates count: {initial_count}")

    print("\n3. Creating one new product update (v2.7 Reports Fix)...")
    new_update = {
        "version": "v2.7",
        "product_area": "Reports",
        "date": "2026-09-28",
        "change": "Added instant async PDF report generator."
    }
    code, resp = post_json("/api/product-updates", new_update)
    print(f"   Response Status: {code}")
    print(f"   Hindsight Status: {resp.get('hindsight_status')}")

    print("\n4. Fetching product updates after creation...")
    code, updates_after_1 = get_json("/api/product-updates")
    v27_matches_1 = [u for u in updates_after_1 if u.get("version") == "v2.7" and u.get("product_area") == "Reports"]
    print(f"   Matches for v2.7: {len(v27_matches_1)} (Expected: 1)")

    print("\n5. Submitting identical product update again (Testing Idempotency)...")
    code, resp2 = post_json("/api/product-updates", new_update)
    print(f"   Response Status: {code}")

    print("\n6. Fetching product updates after duplicate attempt (Refresh check)...")
    code, updates_after_2 = get_json("/api/product-updates")
    v27_matches_2 = [u for u in updates_after_2 if u.get("version") == "v2.7" and u.get("product_area") == "Reports"]
    print(f"   Matches for v2.7 after second submission: {len(v27_matches_2)} (Expected: 1)")

    v25_matches = [u for u in updates_after_2 if u.get("version") == "v2.5" and u.get("product_area") == "Reports"]
    print(f"   Matches for v2.5 Reports: {len(v25_matches)} (Expected: 1)")

    assert len(v27_matches_2) == 1, "v2.7 appears more than once!"
    assert len(v25_matches) == 1, "v2.5 Reports appears more than once!"
    assert health.get('hindsight_connected') == True, "Hindsight Cloud disconnected!"
    assert health.get('groq_connected') == True, "Groq LLM disconnected!"
    print("\n✅ All Product Updates flow assertions PASSED successfully!")

if __name__ == "__main__":
    test_product_updates_flow()

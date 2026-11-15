import os
import sys
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

from app import app
import database

def test_routes():
    print("[TEST] Initializing Flask test client with Authentication...")
    client = app.test_client()

    # 1. Test Dashboard Home
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert b"Portfolio Vault" in res.data, "Dashboard title missing in HTML"
    print(" [OK] GET / (Dashboard HTML loaded successfully)")

    # 2. Test Auth Me (Unauthenticated)
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.get_json()["authenticated"] == False
    print(" [OK] GET /api/auth/me (Correctly reports unauthenticated)")

    # 3. Test Unauthenticated Upload Protection (Must return 401)
    res = client.post("/api/items", json={"category": "school", "title": "Test Title"})
    assert res.status_code == 401
    print(" [OK] POST /api/items (Protected by login - returns 401)")

    # 4. Test Login with Default Credentials
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200
    user_data = res.get_json()["user"]
    print(f" [OK] POST /api/auth/login (Logged in as {user_data['name']} / {user_data['username']})")

    # 5. Test Auth Me (Now Authenticated)
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.get_json()["authenticated"] == True
    print(" [OK] GET /api/auth/me (Session verified)")

    # 6. Test Authenticated Upload
    res = client.post("/api/items", json={
        "category": "academic",
        "subcategory": "Test Honor",
        "title": "Automated Test Credential",
        "issuer_or_org": "Test Institute",
        "year": 2024
    })
    assert res.status_code == 201
    created_item = res.get_json()["data"]
    test_item_id = created_item["id"]
    print(f" [OK] POST /api/items (Successfully created test item ID: {test_item_id})")

    # 7. Test Authenticated Delete
    res = client.delete(f"/api/items/{test_item_id}")
    assert res.status_code == 200
    print(f" [OK] DELETE /api/items/{test_item_id} (Successfully cleaned up test item)")

    # 8. Test Logout
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    print(" [OK] POST /api/auth/logout (Logged out successfully)")

    # 9. Test CSV Export
    res = client.get("/api/export/csv")
    assert res.status_code == 200
    print(f" [OK] GET /api/export/csv (CSV generated, size: {len(res.data)} bytes)")

    # 10. Test JSON Backup
    res = client.get("/api/export/json")
    assert res.status_code == 200
    backup_data = res.get_json()
    print(f" [OK] GET /api/export/json (JSON backup generated, {len(backup_data['items'])} items exported)")

    print("\n All Authentication & Security test suites passed flawlessly!")

if __name__ == "__main__":
    test_routes()

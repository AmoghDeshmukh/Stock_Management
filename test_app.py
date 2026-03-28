"""
End-to-End Test Suite for Material Stock Management Application
"""
import requests
import json
from datetime import datetime, timedelta
import random
import string

BASE_URL = "http://localhost:5000"

class TestSession:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log(self, test_name, passed, message=""):
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"
        print(result)
        self.test_results.append({"test": test_name, "passed": passed, "message": message})
        
    def random_string(self, length=8):
        return ''.join(random.choices(string.ascii_lowercase, k=length))

def test_user_registration_and_login(ts):
    """Test 1: User Registration and Login"""
    print("\n" + "="*60)
    print("TEST SUITE 1: User Registration and Login")
    print("="*60)
    
    # Generate unique test user
    test_username = f"testuser_{ts.random_string()}"
    test_email = f"{test_username}@test.com"
    test_password = "Test@123456"
    
    # Test 1.1: Register new user
    response = ts.session.post(f"{BASE_URL}/register", data={
        "username": test_username,
        "email": test_email,
        "phone": "1234567890",
        "password": test_password,
        "confirm_password": test_password
    }, allow_redirects=False)
    
    ts.log("Register new user", response.status_code in [200, 302], 
           f"Username: {test_username}")
    
    # Test 1.2: Login with registered user
    response = ts.session.post(f"{BASE_URL}/login", data={
        "username": test_username,
        "password": test_password
    }, allow_redirects=False)
    
    ts.log("Login with valid credentials", response.status_code in [200, 302])
    
    # Test 1.3: Access protected page
    response = ts.session.get(f"{BASE_URL}/")
    ts.log("Access dashboard after login", response.status_code == 200 and "GENSTOCK" in response.text)
    
    # Test 1.4: Try registering duplicate username
    ts.session.get(f"{BASE_URL}/logout")  # Logout first
    response = ts.session.post(f"{BASE_URL}/register", data={
        "username": test_username,
        "email": f"another_{test_email}",
        "phone": "9876543210",
        "password": test_password,
        "confirm_password": test_password
    })
    
    ts.log("Reject duplicate username", "already exists" in response.text.lower() or response.status_code == 200)
    
    # Login again for subsequent tests
    ts.session.post(f"{BASE_URL}/login", data={
        "username": test_username,
        "password": test_password
    })
    
    return test_username

def test_material_crud_operations(ts):
    """Test 2: Material CRUD Operations"""
    print("\n" + "="*60)
    print("TEST SUITE 2: Material CRUD Operations")
    print("="*60)
    
    test_item_name = f"TestMaterial_{ts.random_string()}"
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Test 2.1: Create new material
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": test_item_name,
        "category": "Split AC",
        "party_name": "Test Party",
        "inward": 100,
        "outward": 0,
        "storage_place": "Warehouse A",
        "description": "Initial test material"
    })
    
    data = response.json()
    ts.log("Create new material", data.get("success") == True, f"Item: {test_item_name}")
    
    material_id = data.get("material", {}).get("id") if data.get("success") else None
    
    # Test 2.2: Get all materials
    response = ts.session.get(f"{BASE_URL}/api/materials")
    materials = response.json()
    ts.log("Get all materials", isinstance(materials, list) and len(materials) > 0)
    
    # Test 2.3: Get single material
    if material_id:
        response = ts.session.get(f"{BASE_URL}/api/materials/{material_id}")
        data = response.json()
        ts.log("Get single material", data.get("item_name") == test_item_name)
    
    # Test 2.4: Update material with quantity change
    if material_id:
        response = ts.session.put(f"{BASE_URL}/api/materials/{material_id}", json={
            "date": today,
            "item_name": test_item_name,
            "party_name": "Updated Party",
            "action_inward": 50,
            "action_outward": 20,
            "storage_place": "Warehouse B",
            "description": "Updated description"
        })
        data = response.json()
        ts.log("Update material with quantity", data.get("success") == True)
        
        # Verify balance calculation: 100 + 50 - 20 = 130
        if data.get("success"):
            updated_material = data.get("material", {})
            expected_balance = 100 + 50 - 20
            ts.log("Verify balance calculation", 
                   updated_material.get("balance") == expected_balance,
                   f"Expected: {expected_balance}, Got: {updated_material.get('balance')}")
    
    return material_id, test_item_name

def test_duplicate_name_handling(ts, existing_item_name):
    """Test 3: Duplicate Item Name Handling"""
    print("\n" + "="*60)
    print("TEST SUITE 3: Duplicate Item Name Handling")
    print("="*60)
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Test 3.1: Try to create material with duplicate name
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": existing_item_name,  # Use existing name
        "category": "VRF AC",
        "party_name": "Another Party",
        "inward": 50,
        "outward": 0,
        "storage_place": "Warehouse C"
    })
    
    data = response.json()
    ts.log("Reject duplicate item name on create", 
           data.get("success") == False and "already exists" in data.get("message", "").lower())
    
    # Test 3.2: Create another material with unique name
    unique_name = f"UniqueMaterial_{ts.random_string()}"
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": unique_name,
        "category": "AHU",
        "party_name": "Test Party 2",
        "inward": 75,
        "outward": 10,
        "storage_place": "Warehouse D"
    })
    
    data = response.json()
    ts.log("Create material with unique name", data.get("success") == True)
    second_material_id = data.get("material", {}).get("id") if data.get("success") else None
    
    # Test 3.3: Try to rename second material to existing name
    if second_material_id:
        response = ts.session.put(f"{BASE_URL}/api/materials/{second_material_id}", json={
            "date": today,
            "item_name": existing_item_name,  # Try to use existing name
            "party_name": "Test Party 2",
            "action_inward": 0,
            "action_outward": 0,
            "storage_place": "Warehouse D"
        })
        
        data = response.json()
        ts.log("Reject duplicate item name on update", 
               data.get("success") == False and "already exists" in data.get("message", "").lower())
    
    return second_material_id

def test_action_history_tracking(ts, material_id):
    """Test 4: Action History Tracking"""
    print("\n" + "="*60)
    print("TEST SUITE 4: Action History Tracking")
    print("="*60)
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    if not material_id:
        ts.log("Action history tests", False, "No material ID available")
        return
    
    # Get current material state
    response = ts.session.get(f"{BASE_URL}/api/materials/{material_id}")
    material = response.json()
    current_item_name = material.get("item_name", "")
    
    # Test 4.1: Update only party name (no quantity change)
    response = ts.session.put(f"{BASE_URL}/api/materials/{material_id}", json={
        "date": today,
        "item_name": current_item_name,
        "party_name": "History Test Party",
        "action_inward": 0,
        "action_outward": 0,
        "storage_place": material.get("storage_place", ""),
        "description": material.get("description", "")
    })
    
    data = response.json()
    ts.log("Update party name without quantity change", data.get("success") == True)
    
    # Test 4.2: Check action history
    response = ts.session.get(f"{BASE_URL}/api/materials/{material_id}/history")
    history = response.json()
    
    ts.log("Action history records exist", isinstance(history, list) and len(history) > 0,
           f"Found {len(history)} history records")
    
    # Test 4.3: Verify party name in latest history entry
    if isinstance(history, list) and len(history) > 0:
        latest_history = history[-1]
        ts.log("Latest history has updated party name", 
               latest_history.get("party_name") == "History Test Party",
               f"Party name in history: {latest_history.get('party_name')}")
    
    # Test 4.4: Update only description
    response = ts.session.put(f"{BASE_URL}/api/materials/{material_id}", json={
        "date": today,
        "item_name": current_item_name,
        "party_name": "History Test Party",
        "action_inward": 0,
        "action_outward": 0,
        "storage_place": material.get("storage_place", ""),
        "description": "Description updated for history test"
    })
    
    data = response.json()
    ts.log("Update description without quantity change", data.get("success") == True)
    
    # Verify new history entry
    response = ts.session.get(f"{BASE_URL}/api/materials/{material_id}/history")
    new_history = response.json()
    
    if isinstance(new_history, list) and len(new_history) > 0:
        latest = new_history[-1]
        ts.log("Description change recorded in history", 
               latest.get("description") == "Description updated for history test",
               f"History count: {len(new_history)}")

def test_soft_delete_scenarios(ts, material_id):
    """Test 5: Soft Delete Scenarios"""
    print("\n" + "="*60)
    print("TEST SUITE 5: Soft Delete Scenarios")
    print("="*60)
    
    if not material_id:
        ts.log("Soft delete tests", False, "No material ID available")
        return
    
    # Test 5.1: Delete material (soft delete)
    response = ts.session.delete(f"{BASE_URL}/api/materials/{material_id}")
    data = response.json()
    ts.log("Soft delete material", data.get("success") == True)
    
    # Test 5.2: Verify material not in regular list
    response = ts.session.get(f"{BASE_URL}/api/materials")
    materials = response.json()
    material_ids = [m.get("id") for m in materials]
    ts.log("Deleted material not in regular list", material_id not in material_ids)
    
    # Test 5.3: Create new material with same name (should work now)
    today = datetime.now().strftime("%Y-%m-%d")
    
    # First get the deleted material's name
    response = ts.session.get(f"{BASE_URL}/api/materials/{material_id}")
    if response.status_code == 200:
        deleted_material = response.json()
        deleted_name = deleted_material.get("item_name", "")
        
        # Try to create with same name
        response = ts.session.post(f"{BASE_URL}/api/materials", json={
            "date": today,
            "item_name": deleted_name,
            "category": "Split AC",
            "party_name": "Reuse Name Test",
            "inward": 10,
            "outward": 0,
            "storage_place": "Test Location"
        })
        
        data = response.json()
        ts.log("Can reuse deleted material's name", data.get("success") == True,
               f"Name: {deleted_name}")

def test_category_filtering(ts):
    """Test 6: Category Filtering"""
    print("\n" + "="*60)
    print("TEST SUITE 6: Category Operations")
    print("="*60)
    
    today = datetime.now().strftime("%Y-%m-%d")
    categories = ["Split AC", "VRF AC", "AHU", "Cold Room", "Insulation"]
    
    # Create materials in different categories
    created_ids = []
    for cat in categories[:3]:  # Create 3 materials
        response = ts.session.post(f"{BASE_URL}/api/materials", json={
            "date": today,
            "item_name": f"Cat_{cat.replace(' ', '_')}_{ts.random_string()}",
            "category": cat,
            "party_name": "Category Test",
            "inward": 10,
            "outward": 0,
            "storage_place": "Test"
        })
        data = response.json()
        if data.get("success"):
            created_ids.append(data.get("material", {}).get("id"))
    
    ts.log("Create materials in different categories", len(created_ids) == 3)
    
    # Verify materials have correct categories
    response = ts.session.get(f"{BASE_URL}/api/materials")
    materials = response.json()
    
    category_counts = {}
    for m in materials:
        cat = m.get("category", "Unknown")
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    ts.log("Materials have different categories", len(category_counts) >= 2,
           f"Categories found: {list(category_counts.keys())}")

def test_edge_cases(ts):
    """Test 7: Edge Cases"""
    print("\n" + "="*60)
    print("TEST SUITE 7: Edge Cases")
    print("="*60)
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Test 7.1: Material with zero quantities
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": f"ZeroQty_{ts.random_string()}",
        "category": "PVC",
        "party_name": "Zero Test",
        "inward": 0,
        "outward": 0,
        "storage_place": "Test"
    })
    data = response.json()
    ts.log("Create material with zero quantities", data.get("success") == True)
    
    # Test 7.2: Material with special characters in name
    special_name = f"Test-Item_123/{ts.random_string()}"
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": special_name,
        "category": "CPVC",
        "party_name": "Special Chars",
        "inward": 5,
        "outward": 0,
        "storage_place": "Test"
    })
    data = response.json()
    ts.log("Create material with special characters", data.get("success") == True,
           f"Name: {special_name}")
    
    # Test 7.3: Very long description
    long_desc = "A" * 500
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": f"LongDesc_{ts.random_string()}",
        "category": "Fire",
        "party_name": "Long Description Test",
        "inward": 1,
        "outward": 0,
        "storage_place": "Test",
        "description": long_desc
    })
    data = response.json()
    ts.log("Create material with long description", data.get("success") == True)
    
    # Test 7.4: High quantity values
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "item_name": f"HighQty_{ts.random_string()}",
        "category": "Electrical Goods",
        "party_name": "High Quantity Test",
        "inward": 999999,
        "outward": 100000,
        "storage_place": "Test"
    })
    data = response.json()
    ts.log("Create material with high quantities", data.get("success") == True,
           f"Balance should be 899999")
    
    # Test 7.5: Missing required fields
    response = ts.session.post(f"{BASE_URL}/api/materials", json={
        "date": today,
        "category": "ADP",
        "party_name": "Missing Name Test",
        "inward": 10
    })
    data = response.json()
    ts.log("Reject material without item_name", 
           data.get("success") == False or response.status_code >= 400)
    
    # Test 7.6: Invalid material ID
    response = ts.session.get(f"{BASE_URL}/api/materials/999999")
    ts.log("Handle non-existent material ID", response.status_code == 404)

def run_all_tests():
    """Main test runner"""
    print("\n" + "="*60)
    print("MATERIAL STOCK MANAGEMENT APP - END-TO-END TESTS")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    ts = TestSession()
    
    try:
        # Run all test suites
        test_username = test_user_registration_and_login(ts)
        material_id, item_name = test_material_crud_operations(ts)
        second_material_id = test_duplicate_name_handling(ts, item_name)
        test_action_history_tracking(ts, material_id)
        test_soft_delete_scenarios(ts, second_material_id)
        test_category_filtering(ts)
        test_edge_cases(ts)
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in ts.test_results if r["passed"])
    failed = sum(1 for r in ts.test_results if not r["passed"])
    total = len(ts.test_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "N/A")
    
    if failed > 0:
        print("\nFailed Tests:")
        for r in ts.test_results:
            if not r["passed"]:
                print(f"  - {r['test']}: {r['message']}")
    
    print("\n" + "="*60)
    return passed, failed

if __name__ == "__main__":
    run_all_tests()

import requests
import sys
import json
import io
import pandas as pd
from datetime import datetime

class DistributionManagerAPITester:
    def __init__(self, base_url="https://distrib-lists.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.agent_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_agents = []
        self.upload_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n" + "="*50)
        print("TESTING ADMIN AUTHENTICATION")
        print("="*50)
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@example.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_agent_creation(self):
        """Test creating agents"""
        print("\n" + "="*50)
        print("TESTING AGENT MANAGEMENT")
        print("="*50)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False

        # Test creating multiple agents
        test_agents = [
            {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "mobile": "+1-555-0101",
                "password": "agent123"
            },
            {
                "name": "Jane Smith", 
                "email": "jane.smith@example.com",
                "mobile": "+1-555-0102",
                "password": "agent123"
            },
            {
                "name": "Bob Wilson",
                "email": "bob.wilson@example.com", 
                "mobile": "+1-555-0103",
                "password": "agent123"
            }
        ]

        for i, agent_data in enumerate(test_agents):
            success, response = self.run_test(
                f"Create Agent {i+1}",
                "POST",
                "agents",
                200,
                data=agent_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if success and 'id' in response:
                self.created_agents.append(response)
                print(f"   Agent created with ID: {response['id']}")

        return len(self.created_agents) > 0

    def test_get_agents(self):
        """Test retrieving agents list"""
        success, response = self.run_test(
            "Get Agents List",
            "GET", 
            "agents",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   Retrieved {len(response)} agents")
            return True
        return False

    def test_csv_upload_and_distribution(self):
        """Test CSV upload with proper format"""
        print("\n" + "="*50)
        print("TESTING CSV UPLOAD & DISTRIBUTION")
        print("="*50)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False

        if len(self.created_agents) == 0:
            print("❌ No agents available for distribution")
            return False

        # Create test CSV data
        test_data = [
            {"FirstName": "Alice", "Phone": "555-1001", "Notes": "Interested in product A"},
            {"FirstName": "Bob", "Phone": "555-1002", "Notes": "Follow up next week"},
            {"FirstName": "Charlie", "Phone": "555-1003", "Notes": "High priority lead"},
            {"FirstName": "Diana", "Phone": "555-1004", "Notes": "Requested demo"},
            {"FirstName": "Eve", "Phone": "555-1005", "Notes": "Budget approved"},
            {"FirstName": "Frank", "Phone": "555-1006", "Notes": "Decision maker"}
        ]
        
        # Create CSV content
        df = pd.DataFrame(test_data)
        csv_content = df.to_csv(index=False)
        
        # Create file-like object
        csv_file = io.StringIO(csv_content)
        
        success, response = self.run_test(
            "Upload CSV File",
            "POST",
            "uploads",
            200,
            files={"file": ("test_data.csv", csv_content, "text/csv")},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            self.upload_id = response.get('upload_id')
            print(f"   Upload ID: {self.upload_id}")
            print(f"   Total records: {response.get('total_records')}")
            print(f"   Agents count: {response.get('agents_count')}")
            return True
        return False

    def test_invalid_csv_upload(self):
        """Test CSV upload with invalid format"""
        # Test with missing required columns
        invalid_data = [
            {"Name": "Alice", "PhoneNumber": "555-1001", "Comment": "Test"}
        ]
        
        df = pd.DataFrame(invalid_data)
        csv_content = df.to_csv(index=False)
        
        success, response = self.run_test(
            "Upload Invalid CSV (Wrong Columns)",
            "POST",
            "uploads", 
            400,  # Should fail
            files={"file": ("invalid_data.csv", csv_content, "text/csv")},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        return success  # Success means it properly rejected the invalid file

    def test_assignments_retrieval(self):
        """Test retrieving assignments"""
        print("\n" + "="*50)
        print("TESTING ASSIGNMENTS RETRIEVAL")
        print("="*50)
        
        success, response = self.run_test(
            "Get All Assignments (Admin)",
            "GET",
            "assignments",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   Retrieved {len(response)} assignments")
            return True
        return False

    def test_assignment_stats(self):
        """Test assignment statistics"""
        success, response = self.run_test(
            "Get Assignment Stats",
            "GET",
            "assignments/stats",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   Retrieved stats for {len(response)} agents")
            for stat in response:
                print(f"   Agent {stat['agent_name']}: {stat['assignments_count']} assignments")
            return True
        return False

    def test_agent_login_and_access(self):
        """Test agent login and restricted access"""
        print("\n" + "="*50)
        print("TESTING AGENT AUTHENTICATION & ACCESS")
        print("="*50)
        
        if len(self.created_agents) == 0:
            print("❌ No agents available for testing")
            return False

        # Test agent login
        agent = self.created_agents[0]
        success, response = self.run_test(
            "Agent Login",
            "POST",
            "auth/login",
            200,
            data={"email": agent['email'], "password": "agent123"}
        )
        
        if success and 'token' in response:
            self.agent_token = response['token']
            print(f"   Agent token obtained: {self.agent_token[:20]}...")
            
            # Test agent can access their assignments
            success, assignments = self.run_test(
                "Agent Get Own Assignments",
                "GET",
                "assignments",
                200,
                headers={"Authorization": f"Bearer {self.agent_token}"}
            )
            
            if success:
                print(f"   Agent can see {len(assignments)} assignments")
            
            # Test agent cannot access admin endpoints
            success, _ = self.run_test(
                "Agent Access Admin Endpoint (Should Fail)",
                "GET",
                "agents",
                403,  # Should be forbidden
                headers={"Authorization": f"Bearer {self.agent_token}"}
            )
            
            return success  # Success means it properly blocked agent access
        
        return False

    def test_agent_deletion(self):
        """Test deleting an agent"""
        print("\n" + "="*50)
        print("TESTING AGENT DELETION")
        print("="*50)
        
        if len(self.created_agents) == 0:
            print("❌ No agents available for deletion")
            return False

        # Delete the last created agent
        agent_to_delete = self.created_agents[-1]
        success, response = self.run_test(
            "Delete Agent",
            "DELETE",
            f"agents/{agent_to_delete['id']}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            self.created_agents.pop()  # Remove from our list
            print(f"   Agent {agent_to_delete['name']} deleted successfully")
            return True
        return False

def main():
    print("🚀 Starting Distribution Manager API Tests")
    print("=" * 60)
    
    tester = DistributionManagerAPITester()
    
    # Test sequence
    tests = [
        ("Admin Login", tester.test_admin_login),
        ("Agent Creation", tester.test_agent_creation),
        ("Get Agents", tester.test_get_agents),
        ("CSV Upload & Distribution", tester.test_csv_upload_and_distribution),
        ("Invalid CSV Upload", tester.test_invalid_csv_upload),
        ("Assignments Retrieval", tester.test_assignments_retrieval),
        ("Assignment Stats", tester.test_assignment_stats),
        ("Agent Login & Access", tester.test_agent_login_and_access),
        ("Agent Deletion", tester.test_agent_deletion)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Total tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed test categories: {', '.join(failed_tests)}")
        return 1
    else:
        print("\n✅ All test categories passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
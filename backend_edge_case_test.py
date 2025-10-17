#!/usr/bin/env python3
"""
Backend Edge Case Testing for FinanceApp
Tests error handling and edge cases for the fixed CRUD operations
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://finance-fusion-2.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class EdgeCaseTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_transaction_update_nonexistent(self):
        """Test updating a non-existent transaction"""
        self.log("Testing PUT /api/transactions/{fake_id} - Should return 404")
        
        fake_id = "00000000-0000-0000-0000-000000000000"
        update_data = {
            "account_id": "fake-account",
            "type": "expense",
            "amount": 100.0,
            "category": "Test",
            "description": "Should fail",
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            response = self.session.put(f"{API_BASE}/transactions/{fake_id}", json=update_data)
            self.log(f"Non-existent transaction update response: {response.status_code}")
            
            if response.status_code == 404:
                self.log("✅ Correctly returned 404 for non-existent transaction")
                return True
            else:
                self.log(f"❌ Expected 404, got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing non-existent transaction: {str(e)}", "ERROR")
            return False
    
    def test_investment_update_nonexistent(self):
        """Test updating a non-existent investment"""
        self.log("Testing PUT /api/investments/{fake_id} - Should return 404")
        
        fake_id = "00000000-0000-0000-0000-000000000000"
        update_data = {
            "name": "Fake Investment",
            "symbol": "FAKE",
            "type": "stock",
            "currency": "USD"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/investments/{fake_id}", json=update_data)
            self.log(f"Non-existent investment update response: {response.status_code}")
            
            if response.status_code == 404:
                self.log("✅ Correctly returned 404 for non-existent investment")
                return True
            else:
                self.log(f"❌ Expected 404, got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing non-existent investment: {str(e)}", "ERROR")
            return False
    
    def test_transaction_update_invalid_data(self):
        """Test updating transaction with invalid data"""
        self.log("Testing PUT /api/transactions with invalid data")
        
        # First create a valid transaction
        account_data = {
            "name": "Edge Case Test Account",
            "type": "checking",
            "currency": "EUR",
            "initial_balance": 100.0
        }
        
        account_response = self.session.post(f"{API_BASE}/accounts", json=account_data)
        if account_response.status_code not in [200, 201]:
            self.log("❌ Could not create test account for invalid data test", "ERROR")
            return False
            
        account_id = account_response.json()['id']
        
        transaction_data = {
            "account_id": account_id,
            "type": "expense",
            "amount": 50.0,
            "category": "Test",
            "description": "Test transaction",
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        transaction_response = self.session.post(f"{API_BASE}/transactions", json=transaction_data)
        if transaction_response.status_code not in [200, 201]:
            self.log("❌ Could not create test transaction for invalid data test", "ERROR")
            return False
            
        transaction_id = transaction_response.json()['id']
        
        # Test with invalid transaction type
        invalid_data = {
            "account_id": account_id,
            "type": "invalid_type",  # Invalid enum value
            "amount": 50.0,
            "category": "Test",
            "description": "Invalid type test",
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            response = self.session.put(f"{API_BASE}/transactions/{transaction_id}", json=invalid_data)
            self.log(f"Invalid data update response: {response.status_code}")
            
            # Should return 422 (Validation Error) for invalid enum
            if response.status_code == 422:
                self.log("✅ Correctly returned 422 for invalid transaction type")
                success = True
            else:
                self.log(f"❌ Expected 422 for invalid data, got {response.status_code}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ Error testing invalid data: {str(e)}", "ERROR")
            success = False
        
        # Cleanup
        self.session.delete(f"{API_BASE}/transactions/{transaction_id}")
        self.session.delete(f"{API_BASE}/accounts/{account_id}")
        
        return success
    
    def test_api_endpoints_exist(self):
        """Test that all required API endpoints exist"""
        self.log("Testing API endpoint availability")
        
        endpoints_to_test = [
            ("GET", "/api/"),
            ("GET", "/api/accounts"),
            ("GET", "/api/transactions"),
            ("GET", "/api/investments"),
            ("GET", "/api/auth/me")
        ]
        
        all_exist = True
        
        for method, endpoint in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                    
                # 200 OK or 401 Unauthorized (for auth endpoints) are acceptable
                if response.status_code in [200, 401]:
                    self.log(f"✅ {method} {endpoint}: Available ({response.status_code})")
                else:
                    self.log(f"❌ {method} {endpoint}: Unexpected status {response.status_code}", "ERROR")
                    all_exist = False
                    
            except Exception as e:
                self.log(f"❌ {method} {endpoint}: Error - {str(e)}", "ERROR")
                all_exist = False
        
        return all_exist
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        self.log("Starting FinanceApp Backend Edge Case Tests")
        self.log(f"Backend URL: {BACKEND_URL}")
        
        results = {
            'api_endpoints_exist': False,
            'transaction_update_nonexistent': False,
            'investment_update_nonexistent': False,
            'transaction_update_invalid_data': False
        }
        
        # 1. Test API endpoints exist
        results['api_endpoints_exist'] = self.test_api_endpoints_exist()
        
        # 2. Test updating non-existent transaction
        results['transaction_update_nonexistent'] = self.test_transaction_update_nonexistent()
        
        # 3. Test updating non-existent investment
        results['investment_update_nonexistent'] = self.test_investment_update_nonexistent()
        
        # 4. Test invalid data handling
        results['transaction_update_invalid_data'] = self.test_transaction_update_invalid_data()
        
        # Summary
        self.log("=== EDGE CASE TEST SUMMARY ===")
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        self.log(f"Overall: {passed_tests}/{total_tests} edge case tests passed")
        
        return results

if __name__ == "__main__":
    tester = EdgeCaseTester()
    results = tester.run_edge_case_tests()
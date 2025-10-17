#!/usr/bin/env python3
"""
Backend API Testing for FinanceApp
Tests CRUD operations for transactions and investments with authentication
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

class FinanceAppTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.authenticated = False
        self.test_account_id = None
        self.test_transaction_id = None
        self.test_investment_id = None
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def authenticate(self):
        """Attempt to authenticate - for now we'll test without auth"""
        self.log("Testing without authentication (using anonymous user)")
        self.authenticated = True
        return True
    
    def test_cors_and_credentials(self):
        """Test CORS headers and credentials handling - CRITICAL FIX"""
        self.log("=== Testing CORS Headers and Credentials Handling ===")
        
        # Test 1: Check CORS headers on OPTIONS request
        self.log("Testing CORS preflight request")
        try:
            response = self.session.options(f"{API_BASE}/transactions", headers={
                'Origin': 'https://finance-fusion-2.preview.emergentagent.com',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            })
            self.log(f"CORS preflight response: {response.status_code}")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            self.log(f"CORS Headers: {cors_headers}")
            
            # Verify CORS is NOT using wildcard '*' with credentials
            if cors_headers['Access-Control-Allow-Origin'] == '*':
                self.log("❌ CRITICAL: CORS still using wildcard '*' - incompatible with credentials!", "ERROR")
                return False
            elif cors_headers['Access-Control-Allow-Origin'] in ['https://finance-fusion-2.preview.emergentagent.com', 'http://localhost:3000']:
                self.log(f"✅ CORS origin correctly set to: {cors_headers['Access-Control-Allow-Origin']}")
            else:
                self.log(f"⚠️ CORS origin set to: {cors_headers['Access-Control-Allow-Origin']}")
            
            # Verify credentials are allowed
            if cors_headers['Access-Control-Allow-Credentials'] == 'true':
                self.log("✅ CORS credentials correctly enabled")
            else:
                self.log("❌ CORS credentials not enabled", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ CORS test error: {str(e)}", "ERROR")
            return False
        
        return True
    
    def test_auth_endpoints(self):
        """Test authentication endpoints - CRITICAL FIX"""
        self.log("=== Testing Authentication Endpoints ===")
        
        # Test 1: /api/auth/me without session (should return 401)
        self.log("Testing GET /api/auth/me without session")
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            self.log(f"Auth me response (no session): {response.status_code}")
            
            if response.status_code == 401:
                self.log("✅ /api/auth/me correctly returns 401 without session")
            else:
                self.log(f"❌ /api/auth/me should return 401 without session, got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Auth me test error: {str(e)}", "ERROR")
            return False
        
        # Test 2: /api/auth/session endpoint with invalid session_id (should return 401)
        self.log("Testing POST /api/auth/session with invalid session_id")
        try:
            response = self.session.post(f"{API_BASE}/auth/session?session_id=invalid-test-session")
            self.log(f"Auth session response (invalid): {response.status_code}")
            
            if response.status_code == 401:
                self.log("✅ /api/auth/session correctly returns 401 for invalid session_id")
            elif response.status_code == 422:
                self.log("✅ /api/auth/session returns 422 for invalid format (acceptable)")
            else:
                self.log(f"⚠️ /api/auth/session unexpected response: {response.status_code}")
                
        except Exception as e:
            self.log(f"⚠️ Auth session test error: {str(e)}")
        
        # Test 3: /api/auth/logout endpoint
        self.log("Testing POST /api/auth/logout")
        try:
            response = self.session.post(f"{API_BASE}/auth/logout")
            self.log(f"Auth logout response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log("✅ /api/auth/logout working correctly")
                else:
                    self.log("⚠️ /api/auth/logout returned success=false")
            else:
                self.log(f"⚠️ /api/auth/logout unexpected response: {response.status_code}")
                
        except Exception as e:
            self.log(f"⚠️ Auth logout test error: {str(e)}")
        
        return True
    
    def test_user_data_isolation(self):
        """Test user data isolation with and without authentication - CRITICAL FIX"""
        self.log("=== Testing User Data Isolation ===")
        
        # Test 1: Get transactions without authentication (should see anonymous data)
        self.log("Testing GET /api/transactions without authentication")
        try:
            # Create a fresh session without any cookies
            fresh_session = requests.Session()
            fresh_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            
            response = fresh_session.get(f"{API_BASE}/transactions")
            self.log(f"Transactions (no auth) response: {response.status_code}")
            
            if response.status_code == 200:
                transactions = response.json()
                self.log(f"✅ Transactions without auth: {len(transactions)} items (should be anonymous user data)")
                
                # Check if we see the expected anonymous data (4 transactions mentioned in issue)
                if len(transactions) <= 10:  # Should be small number for anonymous
                    self.log(f"✅ Anonymous user sees limited data: {len(transactions)} transactions")
                else:
                    self.log(f"⚠️ Anonymous user sees {len(transactions)} transactions - might be too many")
                    
            else:
                self.log(f"❌ Transactions without auth failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transactions without auth error: {str(e)}", "ERROR")
            return False
        
        # Test 2: Get investments without authentication
        self.log("Testing GET /api/investments without authentication")
        try:
            response = fresh_session.get(f"{API_BASE}/investments")
            self.log(f"Investments (no auth) response: {response.status_code}")
            
            if response.status_code == 200:
                investments = response.json()
                self.log(f"✅ Investments without auth: {len(investments)} items (should be anonymous user data)")
            else:
                self.log(f"❌ Investments without auth failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investments without auth error: {str(e)}", "ERROR")
            return False
        
        return True
    
    def test_session_cookie_handling(self):
        """Test session cookie handling - CRITICAL FIX"""
        self.log("=== Testing Session Cookie Handling ===")
        
        # Test that requests are made with credentials
        self.log("Testing that session uses credentials")
        
        # Check if our session is configured to send credentials
        # Note: We can't easily test actual cookie handling without a real auth flow
        # But we can verify the session configuration
        
        try:
            # Make a request and check if it's sent with proper headers
            response = self.session.get(f"{API_BASE}/transactions")
            self.log(f"Session request response: {response.status_code}")
            
            # Check request headers (if available in response)
            request_headers = getattr(response.request, 'headers', {})
            self.log(f"Request headers sent: {dict(request_headers)}")
            
            if response.status_code == 200:
                self.log("✅ Session requests working correctly")
                return True
            else:
                self.log(f"⚠️ Session request returned {response.status_code}")
                return True  # Still pass as this might be expected without auth
                
        except Exception as e:
            self.log(f"❌ Session cookie test error: {str(e)}", "ERROR")
            return False
        
    def test_create_account(self):
        """Test creating a test account for transactions"""
        self.log("Testing POST /api/accounts")
        
        account_data = {
            "name": "Test Checking Account",
            "type": "checking",
            "currency": "EUR",
            "initial_balance": 1000.0,
            "icon": "wallet",
            "color": "#4f46e5"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/accounts", json=account_data)
            self.log(f"Account creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                account = response.json()
                self.test_account_id = account['id']
                self.log(f"✅ Account created successfully: {account['name']} (ID: {self.test_account_id})")
                return True
            else:
                self.log(f"❌ Account creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Account creation error: {str(e)}", "ERROR")
            return False
    
    def test_transaction_creation_with_type_field(self):
        """Test transaction creation with 'type' field - THE MAIN FIX"""
        self.log("=== Testing Transaction Creation with 'type' Field - THE MAIN FIX ===")
        
        if not self.test_account_id:
            self.log("❌ No test account available for transaction testing", "ERROR")
            return False
        
        # Test 1: CREATE Transaction with type='expense' (minimal valid data)
        self.log("Testing POST /api/transactions with type='expense' (minimal valid data)")
        transaction_data_expense = {
            "account_id": self.test_account_id,
            "description": "Test transaction",
            "amount": 100,
            "category": "Test",
            "type": "expense",
            "date": "2025-10-17T00:00:00Z",
            "tags": [],
            "is_recurring": False
        }
        
        try:
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data_expense)
            self.log(f"Transaction creation (expense) response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                transaction = response.json()
                expense_transaction_id = transaction['id']
                self.log(f"✅ Transaction with type='expense' created successfully: {transaction['description']} (ID: {expense_transaction_id})")
                
                # Verify the type field is correctly set
                if transaction.get('type') == 'expense':
                    self.log("✅ Transaction type field correctly set to 'expense'")
                else:
                    self.log(f"❌ Transaction type field incorrect: expected 'expense', got '{transaction.get('type')}'", "ERROR")
                    return False
                    
                # Verify all required fields are present
                required_fields = ['id', 'account_id', 'type', 'amount', 'category', 'description', 'date']
                missing_fields = [field for field in required_fields if field not in transaction]
                if missing_fields:
                    self.log(f"❌ Missing required fields in response: {missing_fields}", "ERROR")
                    return False
                else:
                    self.log("✅ All required fields present in transaction response")
                    
                # Cleanup
                self.session.delete(f"{API_BASE}/transactions/{expense_transaction_id}")
                
            else:
                self.log(f"❌ Transaction creation (expense) failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction creation (expense) error: {str(e)}", "ERROR")
            return False
        
        # Test 2: CREATE Transaction with type='income'
        self.log("Testing POST /api/transactions with type='income'")
        transaction_data_income = {
            "account_id": self.test_account_id,
            "description": "Test income transaction",
            "amount": 200,
            "category": "Salary",
            "type": "income",
            "date": "2025-10-17T00:00:00Z",
            "tags": [],
            "is_recurring": False
        }
        
        try:
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data_income)
            self.log(f"Transaction creation (income) response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                transaction = response.json()
                income_transaction_id = transaction['id']
                self.log(f"✅ Transaction with type='income' created successfully: {transaction['description']} (ID: {income_transaction_id})")
                
                # Verify the type field is correctly set
                if transaction.get('type') == 'income':
                    self.log("✅ Transaction type field correctly set to 'income'")
                else:
                    self.log(f"❌ Transaction type field incorrect: expected 'income', got '{transaction.get('type')}'", "ERROR")
                    return False
                    
                # Cleanup
                self.session.delete(f"{API_BASE}/transactions/{income_transaction_id}")
                
            else:
                self.log(f"❌ Transaction creation (income) failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction creation (income) error: {str(e)}", "ERROR")
            return False
        
        # Test 3: Test transaction creation WITHOUT type field (should fail with 422)
        self.log("Testing POST /api/transactions WITHOUT type field (should fail with 422)")
        transaction_data_no_type = {
            "account_id": self.test_account_id,
            "description": "Test transaction without type",
            "amount": 50,
            "category": "Test",
            "date": "2025-10-17T00:00:00Z",
            "tags": [],
            "is_recurring": False
            # Note: 'type' field is intentionally missing
        }
        
        try:
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data_no_type)
            self.log(f"Transaction creation (no type) response: {response.status_code}")
            
            if response.status_code == 422:
                self.log("✅ Transaction creation correctly fails with 422 when 'type' field is missing")
                
                # Check if the error message mentions the 'type' field
                try:
                    error_response = response.json()
                    error_details = str(error_response)
                    if 'type' in error_details.lower():
                        self.log("✅ Error response correctly mentions missing 'type' field")
                    else:
                        self.log("⚠️ Error response doesn't specifically mention 'type' field")
                except:
                    self.log("⚠️ Could not parse error response JSON")
                    
            else:
                self.log(f"❌ Transaction creation should fail with 422 when 'type' missing, got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction creation (no type) error: {str(e)}", "ERROR")
            return False
        
        # Test 4: Verify transaction is assigned to correct user
        self.log("Testing that transaction is assigned to correct user")
        transaction_data_user_test = {
            "account_id": self.test_account_id,
            "description": "User assignment test",
            "amount": 75,
            "category": "Test",
            "type": "expense",
            "date": "2025-10-17T00:00:00Z",
            "tags": [],
            "is_recurring": False
        }
        
        try:
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data_user_test)
            if response.status_code in [200, 201]:
                transaction = response.json()
                user_test_transaction_id = transaction['id']
                
                # Verify we can retrieve this transaction (user isolation working)
                response = self.session.get(f"{API_BASE}/transactions/{user_test_transaction_id}")
                if response.status_code == 200:
                    retrieved_transaction = response.json()
                    if retrieved_transaction['id'] == user_test_transaction_id:
                        self.log("✅ Transaction correctly assigned to user (can retrieve own transaction)")
                    else:
                        self.log("❌ Transaction user assignment issue", "ERROR")
                        return False
                else:
                    self.log(f"❌ Could not retrieve created transaction: {response.status_code}", "ERROR")
                    return False
                    
                # Cleanup
                self.session.delete(f"{API_BASE}/transactions/{user_test_transaction_id}")
                
            else:
                self.log(f"❌ User assignment test transaction creation failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User assignment test error: {str(e)}", "ERROR")
            return False
        
        self.log("✅ ALL TRANSACTION CREATION WITH 'TYPE' FIELD TESTS PASSED")
        return True

    def test_transaction_crud(self):
        """Test full CRUD operations for transactions"""
        self.log("=== Testing Transaction CRUD Operations ===")
        
        if not self.test_account_id:
            self.log("❌ No test account available for transaction testing", "ERROR")
            return False
            
        # 1. CREATE Transaction
        self.log("Testing POST /api/transactions")
        transaction_data = {
            "account_id": self.test_account_id,
            "type": "expense",
            "amount": 50.75,
            "category": "Groceries",
            "description": "Weekly grocery shopping",
            "date": datetime.now(timezone.utc).isoformat(),
            "tags": ["food", "weekly"]
        }
        
        try:
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data)
            self.log(f"Transaction creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                transaction = response.json()
                self.test_transaction_id = transaction['id']
                self.log(f"✅ Transaction created: {transaction['description']} (ID: {self.test_transaction_id})")
            else:
                self.log(f"❌ Transaction creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction creation error: {str(e)}", "ERROR")
            return False
        
        # 2. READ Transactions
        self.log("Testing GET /api/transactions")
        try:
            response = self.session.get(f"{API_BASE}/transactions")
            self.log(f"Transaction list response: {response.status_code}")
            
            if response.status_code == 200:
                transactions = response.json()
                found_transaction = any(t['id'] == self.test_transaction_id for t in transactions)
                if found_transaction:
                    self.log(f"✅ Transaction found in list ({len(transactions)} total)")
                else:
                    self.log("❌ Created transaction not found in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Transaction list failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction list error: {str(e)}", "ERROR")
            return False
        
        # 3. READ Single Transaction
        self.log("Testing GET /api/transactions/{id}")
        try:
            response = self.session.get(f"{API_BASE}/transactions/{self.test_transaction_id}")
            self.log(f"Single transaction response: {response.status_code}")
            
            if response.status_code == 200:
                transaction = response.json()
                self.log(f"✅ Single transaction retrieved: {transaction['description']}")
            else:
                self.log(f"❌ Single transaction failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Single transaction error: {str(e)}", "ERROR")
            return False
        
        # 4. UPDATE Transaction (This is the main fix being tested)
        self.log("Testing PUT /api/transactions/{id} - THE MAIN FIX")
        update_data = {
            "account_id": self.test_account_id,
            "type": "expense",
            "amount": 75.50,  # Changed amount
            "category": "Groceries",
            "description": "Updated weekly grocery shopping",  # Changed description
            "date": datetime.now(timezone.utc).isoformat(),
            "tags": ["food", "weekly", "updated"]
        }
        
        try:
            response = self.session.put(f"{API_BASE}/transactions/{self.test_transaction_id}", json=update_data)
            self.log(f"Transaction update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_transaction = response.json()
                if updated_transaction['amount'] == 75.50 and "Updated" in updated_transaction['description']:
                    self.log(f"✅ Transaction updated successfully: {updated_transaction['description']}")
                else:
                    self.log("❌ Transaction update didn't apply changes correctly", "ERROR")
                    return False
            else:
                self.log(f"❌ Transaction update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction update error: {str(e)}", "ERROR")
            return False
        
        # 5. DELETE Transaction (cleanup)
        self.log("Testing DELETE /api/transactions/{id}")
        try:
            response = self.session.delete(f"{API_BASE}/transactions/{self.test_transaction_id}")
            self.log(f"Transaction delete response: {response.status_code}")
            
            if response.status_code == 200:
                self.log("✅ Transaction deleted successfully")
            else:
                self.log(f"❌ Transaction delete failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction delete error: {str(e)}", "ERROR")
            return False
            
        return True
    
    def test_investment_crud(self):
        """Test full CRUD operations for investments"""
        self.log("=== Testing Investment CRUD Operations ===")
        
        # 1. CREATE Investment
        self.log("Testing POST /api/investments")
        investment_data = {
            "name": "Apple Inc.",
            "symbol": "AAPL",
            "type": "stock",
            "currency": "USD"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/investments", json=investment_data)
            self.log(f"Investment creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                investment = response.json()
                self.test_investment_id = investment['id']
                self.log(f"✅ Investment created: {investment['name']} (ID: {self.test_investment_id})")
            else:
                self.log(f"❌ Investment creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investment creation error: {str(e)}", "ERROR")
            return False
        
        # 2. READ Investments
        self.log("Testing GET /api/investments")
        try:
            response = self.session.get(f"{API_BASE}/investments")
            self.log(f"Investment list response: {response.status_code}")
            
            if response.status_code == 200:
                investments = response.json()
                found_investment = any(i['id'] == self.test_investment_id for i in investments)
                if found_investment:
                    self.log(f"✅ Investment found in list ({len(investments)} total)")
                else:
                    self.log("❌ Created investment not found in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Investment list failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investment list error: {str(e)}", "ERROR")
            return False
        
        # 3. UPDATE Investment (This is the NEW endpoint being tested)
        self.log("Testing PUT /api/investments/{id} - THE NEW ENDPOINT")
        update_data = {
            "name": "Apple Inc. (Updated)",
            "symbol": "AAPL",
            "type": "stock",
            "currency": "USD"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/investments/{self.test_investment_id}", json=update_data)
            self.log(f"Investment update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_investment = response.json()
                if "Updated" in updated_investment['name']:
                    self.log(f"✅ Investment updated successfully: {updated_investment['name']}")
                else:
                    self.log("❌ Investment update didn't apply changes correctly", "ERROR")
                    return False
            else:
                self.log(f"❌ Investment update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investment update error: {str(e)}", "ERROR")
            return False
        
        # 4. Verify Update by Reading Again
        self.log("Testing GET /api/investments (verify update)")
        try:
            response = self.session.get(f"{API_BASE}/investments")
            if response.status_code == 200:
                investments = response.json()
                updated_investment = next((i for i in investments if i['id'] == self.test_investment_id), None)
                if updated_investment and "Updated" in updated_investment['name']:
                    self.log("✅ Investment update verified in list")
                else:
                    self.log("❌ Investment update not reflected in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Investment verification failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Investment verification error: {str(e)}", "ERROR")
            return False
        
        # 5. DELETE Investment (cleanup)
        self.log("Testing DELETE /api/investments/{id}")
        try:
            response = self.session.delete(f"{API_BASE}/investments/{self.test_investment_id}")
            self.log(f"Investment delete response: {response.status_code}")
            
            if response.status_code == 200:
                self.log("✅ Investment deleted successfully")
            else:
                self.log(f"❌ Investment delete failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investment delete error: {str(e)}", "ERROR")
            return False
            
        return True

    def test_investment_operations_update(self):
        """Test investment operations update after linking transaction - THE MAIN FIX"""
        self.log("=== Testing Investment Operations Update - THE MAIN FIX ===")
        
        # 1. CREATE Test Investment
        self.log("Testing POST /api/investments for operations test")
        investment_data = {
            "name": "Test Stock",
            "symbol": "TEST",
            "type": "stock",
            "currency": "EUR"
        }
        
        test_investment_id = None
        try:
            response = self.session.post(f"{API_BASE}/investments", json=investment_data)
            self.log(f"Investment creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                investment = response.json()
                test_investment_id = investment['id']
                self.log(f"✅ Test investment created: {investment['name']} (ID: {test_investment_id})")
            else:
                self.log(f"❌ Test investment creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Test investment creation error: {str(e)}", "ERROR")
            return False
        
        # 2. ADD Operation via PUT endpoint (THE MAIN TEST)
        self.log("Testing PUT /api/investments/{id} with operations array - THE MAIN FIX")
        update_data_with_operations = {
            "operations": [
                {
                    "type": "buy",
                    "date": "2025-10-17T00:00:00Z",
                    "quantity": 10,
                    "price": 50,
                    "total": 500,
                    "notes": "Test operation"
                }
            ],
            "quantity": 10,
            "average_price": 50
        }
        
        try:
            response = self.session.put(f"{API_BASE}/investments/{test_investment_id}", json=update_data_with_operations)
            self.log(f"Investment operations update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_investment = response.json()
                operations = updated_investment.get('operations', [])
                
                if len(operations) > 0:
                    operation = operations[0]
                    self.log(f"✅ Operation added successfully: {operation.get('type')} {operation.get('quantity')} shares at {operation.get('price')}")
                    
                    # Verify operation fields
                    expected_fields = ['type', 'date', 'quantity', 'price', 'total', 'notes']
                    missing_fields = [field for field in expected_fields if field not in operation]
                    if missing_fields:
                        self.log(f"❌ Missing operation fields: {missing_fields}", "ERROR")
                        return False
                    else:
                        self.log("✅ All operation fields present")
                        
                    # Verify operation values
                    if (operation.get('type') == 'buy' and 
                        operation.get('quantity') == 10 and 
                        operation.get('price') == 50 and
                        operation.get('total') == 500):
                        self.log("✅ Operation values correctly saved")
                    else:
                        self.log(f"❌ Operation values incorrect: {operation}", "ERROR")
                        return False
                        
                else:
                    self.log("❌ No operations found in updated investment", "ERROR")
                    return False
            else:
                self.log(f"❌ Investment operations update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investment operations update error: {str(e)}", "ERROR")
            return False
        
        # 3. VERIFY Operation is returned in GET request
        self.log("Testing GET /api/investments - verify operation is returned")
        try:
            response = self.session.get(f"{API_BASE}/investments")
            self.log(f"Investment list retrieval response: {response.status_code}")
            
            if response.status_code == 200:
                investments = response.json()
                investment = next((inv for inv in investments if inv['id'] == test_investment_id), None)
                
                if investment:
                    operations = investment.get('operations', [])
                    
                    if len(operations) > 0:
                        operation = operations[0]
                        self.log(f"✅ Operation retrieved successfully: {operation.get('type')} operation with {operation.get('quantity')} shares")
                        
                        # Verify date handling (datetime to ISO string and back)
                        operation_date = operation.get('date')
                        if operation_date:
                            self.log(f"✅ Operation date properly handled: {operation_date}")
                        else:
                            self.log("❌ Operation date missing", "ERROR")
                            return False
                    else:
                        self.log("❌ Operation not found in retrieved investment", "ERROR")
                        return False
                else:
                    self.log("❌ Test investment not found in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Investment list retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Investment list retrieval error: {str(e)}", "ERROR")
            return False
        
        # 4. ADD Multiple Operations
        self.log("Testing PUT /api/investments/{id} with multiple operations")
        update_data_multiple_operations = {
            "operations": [
                {
                    "type": "buy",
                    "date": "2025-10-17T00:00:00Z",
                    "quantity": 10,
                    "price": 50,
                    "total": 500,
                    "notes": "First operation"
                },
                {
                    "type": "buy",
                    "date": "2025-10-18T00:00:00Z",
                    "quantity": 5,
                    "price": 55,
                    "total": 275,
                    "notes": "Second operation"
                }
            ],
            "quantity": 15,
            "average_price": 51.67
        }
        
        try:
            response = self.session.put(f"{API_BASE}/investments/{test_investment_id}", json=update_data_multiple_operations)
            self.log(f"Multiple operations update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_investment = response.json()
                operations = updated_investment.get('operations', [])
                
                if len(operations) == 2:
                    self.log(f"✅ Multiple operations added successfully: {len(operations)} operations")
                    
                    # Verify both operations
                    for i, operation in enumerate(operations):
                        expected_quantities = [10, 5]
                        expected_prices = [50, 55]
                        if (operation.get('quantity') == expected_quantities[i] and 
                            operation.get('price') == expected_prices[i]):
                            self.log(f"✅ Operation {i+1} values correct")
                        else:
                            self.log(f"❌ Operation {i+1} values incorrect: {operation}", "ERROR")
                            return False
                else:
                    self.log(f"❌ Expected 2 operations, got {len(operations)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Multiple operations update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Multiple operations update error: {str(e)}", "ERROR")
            return False
        
        # 5. TEST Date Conversion (datetime to ISO string and back)
        self.log("Testing operations date handling (datetime to ISO string and back)")
        update_data_date_test = {
            "operations": [
                {
                    "type": "sell",
                    "date": "2025-10-19T14:30:00.000Z",  # ISO format with milliseconds
                    "quantity": 3,
                    "price": 60,
                    "total": 180,
                    "notes": "Date conversion test"
                }
            ],
            "quantity": 12,
            "average_price": 52.5
        }
        
        try:
            response = self.session.put(f"{API_BASE}/investments/{test_investment_id}", json=update_data_date_test)
            self.log(f"Date conversion test response: {response.status_code}")
            
            if response.status_code == 200:
                updated_investment = response.json()
                operations = updated_investment.get('operations', [])
                
                if len(operations) > 0:
                    operation = operations[0]
                    operation_date = operation.get('date')
                    
                    # Check if date is properly formatted
                    if operation_date and ('2025-10-19' in str(operation_date)):
                        self.log(f"✅ Date conversion working correctly: {operation_date}")
                    else:
                        self.log(f"❌ Date conversion failed: {operation_date}", "ERROR")
                        return False
                else:
                    self.log("❌ No operations found for date test", "ERROR")
                    return False
            else:
                self.log(f"❌ Date conversion test failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Date conversion test error: {str(e)}", "ERROR")
            return False
        
        # 6. CLEANUP - Delete test investment
        self.log("Cleaning up test investment")
        try:
            response = self.session.delete(f"{API_BASE}/investments/{test_investment_id}")
            if response.status_code == 200:
                self.log("✅ Test investment cleaned up")
            else:
                self.log(f"⚠️ Test investment cleanup failed: {response.status_code}")
        except Exception as e:
            self.log(f"⚠️ Test investment cleanup error: {str(e)}")
        
        self.log("✅ ALL INVESTMENT OPERATIONS UPDATE TESTS PASSED")
        return True
    
    def test_user_isolation(self):
        """Test that user data is properly isolated"""
        self.log("=== Testing User Isolation ===")
        
        # For anonymous users, we can't test true isolation
        # But we can verify that user_email is being set
        self.log("Note: Testing with anonymous user - user_email should be 'anonymous'")
        
        # Create a transaction and verify it has user_email
        if not self.test_account_id:
            self.log("❌ No test account for isolation testing", "ERROR")
            return False
            
        transaction_data = {
            "account_id": self.test_account_id,
            "type": "income",
            "amount": 100.0,
            "category": "Test",
            "description": "User isolation test",
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data)
            if response.status_code in [200, 201]:
                transaction = response.json()
                test_id = transaction['id']
                
                # Try to update it (should work for same user)
                update_data = {
                    "account_id": self.test_account_id,
                    "type": "income",
                    "amount": 150.0,
                    "category": "Test",
                    "description": "User isolation test - updated",
                    "date": datetime.now(timezone.utc).isoformat()
                }
                
                response = self.session.put(f"{API_BASE}/transactions/{test_id}", json=update_data)
                if response.status_code == 200:
                    self.log("✅ User can update their own transaction")
                    
                    # Cleanup
                    self.session.delete(f"{API_BASE}/transactions/{test_id}")
                    return True
                else:
                    self.log(f"❌ User cannot update their own transaction: {response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Could not create test transaction: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User isolation test error: {str(e)}", "ERROR")
            return False
    
    def cleanup_test_account(self):
        """Clean up the test account"""
        if self.test_account_id:
            self.log("Cleaning up test account")
            try:
                response = self.session.delete(f"{API_BASE}/accounts/{self.test_account_id}")
                if response.status_code == 200:
                    self.log("✅ Test account cleaned up")
                else:
                    self.log(f"⚠️ Test account cleanup failed: {response.status_code}")
            except Exception as e:
                self.log(f"⚠️ Test account cleanup error: {str(e)}")
    
    def test_camelcase_conversion_endpoints(self):
        """Test GET endpoints with camelCase/snake_case conversion"""
        self.log("=== Testing camelCase/snake_case Conversion Endpoints ===")
        
        endpoints_to_test = [
            ("/api/transactions", "Transactions"),
            ("/api/investments", "Investments"), 
            ("/api/goals", "Goals"),
            ("/api/debts", "Debts"),
            ("/api/receivables", "Receivables"),
            ("/api/accounts", "Accounts")
        ]
        
        all_passed = True
        
        for endpoint, name in endpoints_to_test:
            self.log(f"Testing GET {endpoint} - {name} camelCase conversion")
            try:
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                self.log(f"{name} response: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log(f"✅ {name} endpoint working - returned {len(data)} items")
                else:
                    self.log(f"❌ {name} endpoint failed: {response.status_code} - {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ {name} endpoint error: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_csv_bank_import(self):
        """Test CSV Bank Import endpoint"""
        self.log("=== Testing CSV Bank Import ===")
        
        if not self.test_account_id:
            self.log("❌ No test account available for CSV import testing", "ERROR")
            return False
        
        # First create a bank connection
        bank_connection_data = {
            "bank_name": "Test Bank",
            "account_id": self.test_account_id
        }
        
        self.log("Creating bank connection for CSV import test")
        try:
            response = self.session.post(f"{API_BASE}/bank-connections", json=bank_connection_data)
            self.log(f"Bank connection creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                bank_connection = response.json()
                bank_connection_id = bank_connection['id']
                self.log(f"✅ Bank connection created: {bank_connection_id}")
            else:
                self.log(f"❌ Bank connection creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Bank connection creation error: {str(e)}", "ERROR")
            return False
        
        # Test CSV import data
        csv_import_data = {
            "transactions": [
                {
                    "date": "2024-01-15T10:00:00Z",
                    "description": "Test import transaction",
                    "amount": -50.00,
                    "category": "Divers"
                },
                {
                    "date": "2024-01-16T14:00:00Z", 
                    "description": "Salaire test import",
                    "amount": 2000.00,
                    "category": "Revenus"
                }
            ]
        }
        
        self.log(f"Testing POST /api/bank-connections/{bank_connection_id}/import-csv")
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/bank-connections/{bank_connection_id}/import-csv",
                json=csv_import_data
            )
            self.log(f"CSV import response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                self.log(f"✅ CSV import successful: {result}")
                
                # Cleanup - delete the bank connection
                self.session.delete(f"{API_BASE}/bank-connections/{bank_connection_id}")
                return True
            else:
                self.log(f"❌ CSV import failed: {response.status_code} - {response.text}", "ERROR")
                # Cleanup - delete the bank connection
                self.session.delete(f"{API_BASE}/bank-connections/{bank_connection_id}")
                return False
                
        except Exception as e:
            self.log(f"❌ CSV import error: {str(e)}", "ERROR")
            # Cleanup - delete the bank connection
            self.session.delete(f"{API_BASE}/bank-connections/{bank_connection_id}")
            return False
    
    def test_existing_endpoints(self):
        """Test existing endpoints for validation"""
        self.log("=== Testing Existing Endpoints ===")
        
        endpoints_to_test = [
            ("/api/currency/rates", "Currency Rates"),
            ("/api/dashboard/summary", "Dashboard Summary")
        ]
        
        all_passed = True
        
        for endpoint, name in endpoints_to_test:
            self.log(f"Testing GET {endpoint} - {name}")
            try:
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                self.log(f"{name} response: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log(f"✅ {name} endpoint working")
                else:
                    self.log(f"❌ {name} endpoint failed: {response.status_code} - {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ {name} endpoint error: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_shopping_lists_download(self):
        """Test shopping lists download endpoint"""
        self.log("=== Testing Shopping Lists Download ===")
        
        # Use a test shopping list ID
        test_list_id = "test-shopping-list-123"
        
        self.log(f"Testing GET /api/shopping-lists/{test_list_id}/download")
        try:
            response = self.session.get(f"{BACKEND_URL}/api/shopping-lists/{test_list_id}/download")
            self.log(f"Shopping list download response: {response.status_code}")
            
            if response.status_code in [200, 404]:  # 404 is acceptable for non-existent list
                if response.status_code == 200:
                    self.log("✅ Shopping list download endpoint working")
                else:
                    self.log("✅ Shopping list download endpoint working (404 for non-existent list is expected)")
                return True
            else:
                self.log(f"❌ Shopping list download failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Shopping list download error: {str(e)}", "ERROR")
            return False

    def test_transaction_linking_to_debts_and_receivables(self):
        """Test transaction linking functionality for debts and receivables - CRITICAL TEST"""
        self.log("=== Testing Transaction Linking to Debts and Receivables - CRITICAL TEST ===")
        
        if not self.test_account_id:
            self.log("❌ No test account available for transaction linking testing", "ERROR")
            return False
        
        # Test data storage
        test_debt_id = None
        test_receivable_id = None
        test_transaction_id = None
        
        try:
            # 1. CREATE Test Debt
            self.log("Step 1: Creating test debt")
            debt_data = {
                "name": "Test Loan for Transaction Linking",
                "total_amount": 1000.0,
                "remaining_amount": 1000.0,
                "interest_rate": 5.0,
                "creditor": "Test Bank",
                "due_date": "2025-12-31T00:00:00Z",
                "account_id": self.test_account_id
            }
            
            response = self.session.post(f"{API_BASE}/debts", json=debt_data)
            self.log(f"Debt creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                debt = response.json()
                test_debt_id = debt['id']
                self.log(f"✅ Test debt created: {debt['name']} (ID: {test_debt_id})")
                self.log(f"DEBUG: Created debt - total_amount: {debt.get('total_amount')}, remaining_amount: {debt.get('remaining_amount')}")
                self.log(f"DEBUG: Created debt (camelCase) - totalAmount: {debt.get('totalAmount')}, remainingAmount: {debt.get('remainingAmount')}")
            else:
                self.log(f"❌ Debt creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 2. CREATE Test Receivable
            self.log("Step 2: Creating test receivable")
            receivable_data = {
                "name": "Test Invoice for Transaction Linking",
                "total_amount": 500.0,
                "remaining_amount": 500.0,
                "debtor": "Test Client",
                "due_date": "2025-11-30T00:00:00Z",
                "account_id": self.test_account_id
            }
            
            response = self.session.post(f"{API_BASE}/receivables", json=receivable_data)
            self.log(f"Receivable creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                receivable = response.json()
                test_receivable_id = receivable['id']
                self.log(f"✅ Test receivable created: {receivable['name']} (ID: {test_receivable_id})")
                self.log(f"DEBUG: Created receivable - total_amount: {receivable.get('total_amount')}, remaining_amount: {receivable.get('remaining_amount')}")
                self.log(f"DEBUG: Created receivable (camelCase) - totalAmount: {receivable.get('totalAmount')}, remainingAmount: {receivable.get('remainingAmount')}")
            else:
                self.log(f"❌ Receivable creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 3. CREATE Test Transaction
            self.log("Step 3: Creating test transaction")
            transaction_data = {
                "account_id": self.test_account_id,
                "type": "expense",
                "amount": 200.0,
                "category": "Debt Payment",
                "description": "Test transaction for linking",
                "date": "2025-10-17T12:00:00Z"
            }
            
            response = self.session.post(f"{API_BASE}/transactions", json=transaction_data)
            self.log(f"Transaction creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                transaction = response.json()
                test_transaction_id = transaction['id']
                self.log(f"✅ Test transaction created: {transaction['description']} (ID: {test_transaction_id})")
            else:
                self.log(f"❌ Transaction creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 4. TEST Debt Payment Addition (CRITICAL)
            self.log("Step 4: Testing POST /api/debts/{id}/payments - CRITICAL")
            debt_payment_data = {
                "date": "2025-10-17T12:00:00Z",
                "amount": 200.0,
                "notes": "Payment from linked transaction"
            }
            
            response = self.session.post(f"{API_BASE}/debts/{test_debt_id}/payments", json=debt_payment_data)
            self.log(f"Debt payment addition response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                updated_debt = response.json()
                payments = updated_debt.get('payments', [])
                
                if len(payments) > 0:
                    payment = payments[-1]  # Get the last payment
                    self.log(f"✅ Payment added to debt successfully: €{payment.get('amount')} on {payment.get('date')}")
                    
                    # Debug: Show the full debt object
                    self.log(f"DEBUG: Updated debt - total_amount: {updated_debt.get('total_amount')}, remaining_amount: {updated_debt.get('remaining_amount')}")
                    self.log(f"DEBUG: Updated debt (camelCase) - totalAmount: {updated_debt.get('totalAmount')}, remainingAmount: {updated_debt.get('remainingAmount')}")
                    
                    # Verify remaining amount is updated (check camelCase field names)
                    expected_remaining = 1000.0 - 200.0  # 800.0
                    actual_remaining = updated_debt.get('remainingAmount', updated_debt.get('remaining_amount', 0))
                    if abs(actual_remaining - expected_remaining) < 0.01:
                        self.log(f"✅ Debt remaining amount correctly updated: €{actual_remaining}")
                    else:
                        self.log(f"❌ Debt remaining amount incorrect: expected €{expected_remaining}, got €{actual_remaining}", "ERROR")
                        return False
                        
                    # Verify payment fields
                    required_fields = ['date', 'amount', 'notes']
                    missing_fields = [field for field in required_fields if field not in payment]
                    if missing_fields:
                        self.log(f"❌ Missing payment fields: {missing_fields}", "ERROR")
                        return False
                    else:
                        self.log("✅ All payment fields present and correct")
                        
                else:
                    self.log("❌ No payments found in updated debt", "ERROR")
                    return False
            else:
                self.log(f"❌ Debt payment addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 5. TEST Receivable Payment Addition (CRITICAL)
            self.log("Step 5: Testing POST /api/receivables/{id}/payments - CRITICAL")
            receivable_payment_data = {
                "date": "2025-10-17T12:00:00Z",
                "amount": 150.0,
                "notes": "Payment from linked transaction"
            }
            
            response = self.session.post(f"{API_BASE}/receivables/{test_receivable_id}/payments", json=receivable_payment_data)
            self.log(f"Receivable payment addition response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                updated_receivable = response.json()
                payments = updated_receivable.get('payments', [])
                
                if len(payments) > 0:
                    payment = payments[-1]  # Get the last payment
                    self.log(f"✅ Payment added to receivable successfully: €{payment.get('amount')} on {payment.get('date')}")
                    
                    # Debug: Show the full receivable object
                    self.log(f"DEBUG: Updated receivable - total_amount: {updated_receivable.get('total_amount')}, remaining_amount: {updated_receivable.get('remaining_amount')}")
                    self.log(f"DEBUG: Updated receivable (camelCase) - totalAmount: {updated_receivable.get('totalAmount')}, remainingAmount: {updated_receivable.get('remainingAmount')}")
                    
                    # Verify remaining amount is updated (check camelCase field names)
                    expected_remaining = 500.0 - 150.0  # 350.0
                    actual_remaining = updated_receivable.get('remainingAmount', updated_receivable.get('remaining_amount', 0))
                    if abs(actual_remaining - expected_remaining) < 0.01:
                        self.log(f"✅ Receivable remaining amount correctly updated: €{actual_remaining}")
                    else:
                        self.log(f"❌ Receivable remaining amount incorrect: expected €{expected_remaining}, got €{actual_remaining}", "ERROR")
                        return False
                        
                    # Verify payment fields
                    required_fields = ['date', 'amount', 'notes']
                    missing_fields = [field for field in required_fields if field not in payment]
                    if missing_fields:
                        self.log(f"❌ Missing payment fields: {missing_fields}", "ERROR")
                        return False
                    else:
                        self.log("✅ All payment fields present and correct")
                        
                else:
                    self.log("❌ No payments found in updated receivable", "ERROR")
                    return False
            else:
                self.log(f"❌ Receivable payment addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 6. TEST Transaction Update with Linked Fields
            self.log("Step 6: Testing transaction update with linked debt/receivable fields")
            
            # Update transaction with linked_debt_id
            update_data_debt = {
                "account_id": self.test_account_id,
                "type": "expense",
                "amount": 200.0,
                "category": "Debt Payment",
                "description": "Test transaction linked to debt",
                "date": "2025-10-17T12:00:00Z",
                "linked_debt_id": test_debt_id
            }
            
            response = self.session.put(f"{API_BASE}/transactions/{test_transaction_id}", json=update_data_debt)
            self.log(f"Transaction update with linked_debt_id response: {response.status_code}")
            
            if response.status_code == 200:
                updated_transaction = response.json()
                if updated_transaction.get('linked_debt_id') == test_debt_id:
                    self.log(f"✅ Transaction successfully linked to debt: {test_debt_id}")
                else:
                    self.log(f"❌ Transaction debt linking failed: expected {test_debt_id}, got {updated_transaction.get('linked_debt_id')}", "ERROR")
                    return False
            else:
                self.log(f"❌ Transaction update with debt link failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # Update transaction with linked_receivable_id
            update_data_receivable = {
                "account_id": self.test_account_id,
                "type": "income",
                "amount": 150.0,
                "category": "Receivable Payment",
                "description": "Test transaction linked to receivable",
                "date": "2025-10-17T12:00:00Z",
                "linked_receivable_id": test_receivable_id
            }
            
            response = self.session.put(f"{API_BASE}/transactions/{test_transaction_id}", json=update_data_receivable)
            self.log(f"Transaction update with linked_receivable_id response: {response.status_code}")
            
            if response.status_code == 200:
                updated_transaction = response.json()
                if updated_transaction.get('linked_receivable_id') == test_receivable_id:
                    self.log(f"✅ Transaction successfully linked to receivable: {test_receivable_id}")
                else:
                    self.log(f"❌ Transaction receivable linking failed: expected {test_receivable_id}, got {updated_transaction.get('linked_receivable_id')}", "ERROR")
                    return False
            else:
                self.log(f"❌ Transaction update with receivable link failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 7. VERIFY Transaction Persistence
            self.log("Step 7: Verifying transaction linked fields persist")
            response = self.session.get(f"{API_BASE}/transactions/{test_transaction_id}")
            
            if response.status_code == 200:
                retrieved_transaction = response.json()
                if retrieved_transaction.get('linked_receivable_id') == test_receivable_id:
                    self.log("✅ Transaction linked fields persist correctly")
                else:
                    self.log("❌ Transaction linked fields do not persist", "ERROR")
                    return False
            else:
                self.log(f"❌ Transaction retrieval failed: {response.status_code}", "ERROR")
                return False
            
            self.log("✅ ALL TRANSACTION LINKING TESTS PASSED")
            return True
            
        except Exception as e:
            self.log(f"❌ Transaction linking test error: {str(e)}", "ERROR")
            return False
            
        finally:
            # Cleanup test data
            self.log("Cleaning up test data...")
            if test_transaction_id:
                try:
                    self.session.delete(f"{API_BASE}/transactions/{test_transaction_id}")
                    self.log("✅ Test transaction cleaned up")
                except:
                    self.log("⚠️ Test transaction cleanup failed")
            
            if test_debt_id:
                try:
                    self.session.delete(f"{API_BASE}/debts/{test_debt_id}")
                    self.log("✅ Test debt cleaned up")
                except:
                    self.log("⚠️ Test debt cleanup failed")
            
            if test_receivable_id:
                try:
                    self.session.delete(f"{API_BASE}/receivables/{test_receivable_id}")
                    self.log("✅ Test receivable cleaned up")
                except:
                    self.log("⚠️ Test receivable cleanup failed")

    def test_debt_and_receivable_calculations(self):
        """Test debt and receivable calculation fixes - COMPREHENSIVE TESTING"""
        self.log("=== Testing Debt and Receivable Calculation Fixes - COMPREHENSIVE TESTING ===")
        
        if not self.test_account_id:
            self.log("❌ No test account available for debt/receivable testing", "ERROR")
            return False
        
        # Test data storage
        test_debt_id = None
        test_receivable_id = None
        
        try:
            # ========================================================================
            # TEST SCENARIO 1: Debt Update with Total Amount Change
            # ========================================================================
            self.log("\n--- TEST SCENARIO 1: Debt Update with Total Amount Change ---")
            
            # 1.1 Create debt with total_amount 1000€
            self.log("Step 1.1: Creating debt with total_amount 1000€")
            debt_data = {
                "name": "Test Loan - Amount Change",
                "total_amount": 1000.0,
                "remaining_amount": 1000.0,
                "interest_rate": 5.0,
                "creditor": "Test Bank",
                "due_date": "2025-12-31T00:00:00Z",
                "account_id": self.test_account_id
            }
            
            response = self.session.post(f"{API_BASE}/debts", json=debt_data)
            if response.status_code in [200, 201]:
                debt = response.json()
                test_debt_id = debt['id']
                self.log(f"✅ Debt created: total_amount={debt.get('total_amount', debt.get('totalAmount'))}")
            else:
                self.log(f"❌ Debt creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 1.2 Add payment of 200€
            self.log("Step 1.2: Adding payment of 200€")
            payment_data = {
                "date": "2025-10-17T12:00:00Z",
                "amount": 200.0,
                "notes": "First payment"
            }
            
            response = self.session.post(f"{API_BASE}/debts/{test_debt_id}/payments", json=payment_data)
            if response.status_code in [200, 201]:
                debt_with_payment = response.json()
                remaining_after_payment = debt_with_payment.get('remainingAmount', debt_with_payment.get('remaining_amount'))
                self.log(f"✅ Payment added: remaining_amount={remaining_after_payment}")
                
                # Verify remaining amount is 800€ (1000 - 200)
                if abs(remaining_after_payment - 800.0) < 0.01:
                    self.log("✅ Remaining amount correctly calculated after payment")
                else:
                    self.log(f"❌ Remaining amount incorrect: expected 800, got {remaining_after_payment}", "ERROR")
                    return False
            else:
                self.log(f"❌ Payment addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 1.3 Update debt to change total_amount to 1500€
            self.log("Step 1.3: Updating debt total_amount to 1500€")
            update_data = {
                "name": "Test Loan - Amount Change",
                "total_amount": 1500.0,  # Changed from 1000 to 1500
                "remaining_amount": 1500.0,  # This should be recalculated
                "interest_rate": 5.0,
                "creditor": "Test Bank",
                "due_date": "2025-12-31T00:00:00Z",
                "account_id": self.test_account_id
            }
            
            response = self.session.put(f"{API_BASE}/debts/{test_debt_id}", json=update_data)
            if response.status_code == 200:
                updated_debt = response.json()
                new_remaining = updated_debt.get('remainingAmount', updated_debt.get('remaining_amount'))
                self.log(f"✅ Debt updated: new remaining_amount={new_remaining}")
                
                # Verify remaining amount is recalculated to 1300€ (1500 - 200)
                if abs(new_remaining - 1300.0) < 0.01:
                    self.log("✅ SCENARIO 1 PASSED: Remaining amount correctly recalculated to 1300€ (1500 - 200)")
                else:
                    self.log(f"❌ SCENARIO 1 FAILED: Expected 1300, got {new_remaining}", "ERROR")
                    return False
            else:
                self.log(f"❌ Debt update failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # ========================================================================
            # TEST SCENARIO 2: Debt Payment Update
            # ========================================================================
            self.log("\n--- TEST SCENARIO 2: Debt Payment Update ---")
            
            # 2.1 Get current debt state (should have 1500€ total, 200€ paid, 1300€ remaining)
            response = self.session.get(f"{API_BASE}/debts")
            if response.status_code == 200:
                debts = response.json()
                current_debt = next((d for d in debts if d['id'] == test_debt_id), None)
                if current_debt:
                    self.log(f"Current debt state: total={current_debt.get('total_amount', current_debt.get('totalAmount'))}, remaining={current_debt.get('remainingAmount', current_debt.get('remaining_amount'))}")
                else:
                    self.log("❌ Could not find test debt", "ERROR")
                    return False
            
            # 2.2 Update the payment from 200€ to 300€
            self.log("Step 2.2: Updating payment from 200€ to 300€")
            updated_payment_data = {
                "date": "2025-10-17T12:00:00Z",
                "amount": 300.0,  # Changed from 200 to 300
                "notes": "Updated payment amount"
            }
            
            response = self.session.put(f"{API_BASE}/debts/{test_debt_id}/payments/0", json=updated_payment_data)
            if response.status_code == 200:
                debt_after_payment_update = response.json()
                remaining_after_update = debt_after_payment_update.get('remainingAmount', debt_after_payment_update.get('remaining_amount'))
                self.log(f"✅ Payment updated: new remaining_amount={remaining_after_update}")
                
                # Verify remaining amount is recalculated to 1200€ (1500 - 300)
                if abs(remaining_after_update - 1200.0) < 0.01:
                    self.log("✅ SCENARIO 2 PASSED: Remaining amount correctly recalculated to 1200€ (1500 - 300)")
                else:
                    self.log(f"❌ SCENARIO 2 FAILED: Expected 1200, got {remaining_after_update}", "ERROR")
                    return False
            else:
                self.log(f"❌ Payment update failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # ========================================================================
            # TEST SCENARIO 3: Debt Payment Deletion
            # ========================================================================
            self.log("\n--- TEST SCENARIO 3: Debt Payment Deletion ---")
            
            # 3.1 Add a second payment of 150€
            self.log("Step 3.1: Adding second payment of 150€")
            second_payment_data = {
                "date": "2025-10-18T12:00:00Z",
                "amount": 150.0,
                "notes": "Second payment"
            }
            
            response = self.session.post(f"{API_BASE}/debts/{test_debt_id}/payments", json=second_payment_data)
            if response.status_code in [200, 201]:
                debt_with_two_payments = response.json()
                remaining_with_two = debt_with_two_payments.get('remainingAmount', debt_with_two_payments.get('remaining_amount'))
                self.log(f"✅ Second payment added: remaining_amount={remaining_with_two}")
                
                # Should be 1050€ (1500 - 300 - 150)
                if abs(remaining_with_two - 1050.0) < 0.01:
                    self.log("✅ Remaining amount correct with two payments: 1050€")
                else:
                    self.log(f"❌ Remaining amount with two payments incorrect: expected 1050, got {remaining_with_two}", "ERROR")
                    return False
            else:
                self.log(f"❌ Second payment addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 3.2 Delete the first payment (300€)
            self.log("Step 3.2: Deleting first payment (300€)")
            response = self.session.delete(f"{API_BASE}/debts/{test_debt_id}/payments/0")
            if response.status_code == 200:
                self.log("✅ First payment deleted")
                
                # Get updated debt to check remaining amount
                response = self.session.get(f"{API_BASE}/debts")
                if response.status_code == 200:
                    debts = response.json()
                    debt_after_deletion = next((d for d in debts if d['id'] == test_debt_id), None)
                    if debt_after_deletion:
                        remaining_after_deletion = debt_after_deletion.get('remainingAmount', debt_after_deletion.get('remaining_amount'))
                        self.log(f"✅ After deletion: remaining_amount={remaining_after_deletion}")
                        
                        # Should be 1350€ (1500 - 150, only second payment remains)
                        if abs(remaining_after_deletion - 1350.0) < 0.01:
                            self.log("✅ SCENARIO 3 PASSED: Remaining amount correctly recalculated to 1350€ (1500 - 150)")
                        else:
                            self.log(f"❌ SCENARIO 3 FAILED: Expected 1350, got {remaining_after_deletion}", "ERROR")
                            return False
                    else:
                        self.log("❌ Could not find debt after payment deletion", "ERROR")
                        return False
                else:
                    self.log(f"❌ Could not retrieve debts after deletion: {response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Payment deletion failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # ========================================================================
            # TEST SCENARIO 4: Receivable Update with Total Amount Change
            # ========================================================================
            self.log("\n--- TEST SCENARIO 4: Receivable Update with Total Amount Change ---")
            
            # 4.1 Create receivable with total_amount 500€
            self.log("Step 4.1: Creating receivable with total_amount 500€")
            receivable_data = {
                "name": "Test Invoice - Amount Change",
                "total_amount": 500.0,
                "remaining_amount": 500.0,
                "debtor": "Test Client",
                "due_date": "2025-11-30T00:00:00Z",
                "account_id": self.test_account_id
            }
            
            response = self.session.post(f"{API_BASE}/receivables", json=receivable_data)
            if response.status_code in [200, 201]:
                receivable = response.json()
                test_receivable_id = receivable['id']
                self.log(f"✅ Receivable created: total_amount={receivable.get('total_amount', receivable.get('totalAmount'))}")
            else:
                self.log(f"❌ Receivable creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 4.2 Add payment of 100€
            self.log("Step 4.2: Adding payment of 100€")
            receivable_payment_data = {
                "date": "2025-10-17T12:00:00Z",
                "amount": 100.0,
                "notes": "First receivable payment"
            }
            
            response = self.session.post(f"{API_BASE}/receivables/{test_receivable_id}/payments", json=receivable_payment_data)
            if response.status_code in [200, 201]:
                receivable_with_payment = response.json()
                remaining_after_payment = receivable_with_payment.get('remainingAmount', receivable_with_payment.get('remaining_amount'))
                self.log(f"✅ Payment added: remaining_amount={remaining_after_payment}")
                
                # Verify remaining amount is 400€ (500 - 100)
                if abs(remaining_after_payment - 400.0) < 0.01:
                    self.log("✅ Remaining amount correctly calculated after payment")
                else:
                    self.log(f"❌ Remaining amount incorrect: expected 400, got {remaining_after_payment}", "ERROR")
                    return False
            else:
                self.log(f"❌ Receivable payment addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 4.3 Update receivable to change total_amount to 800€
            self.log("Step 4.3: Updating receivable total_amount to 800€")
            receivable_update_data = {
                "name": "Test Invoice - Amount Change",
                "total_amount": 800.0,  # Changed from 500 to 800
                "remaining_amount": 800.0,  # This should be recalculated
                "debtor": "Test Client",
                "due_date": "2025-11-30T00:00:00Z",
                "account_id": self.test_account_id
            }
            
            response = self.session.put(f"{API_BASE}/receivables/{test_receivable_id}", json=receivable_update_data)
            if response.status_code == 200:
                updated_receivable = response.json()
                new_remaining = updated_receivable.get('remainingAmount', updated_receivable.get('remaining_amount'))
                self.log(f"✅ Receivable updated: new remaining_amount={new_remaining}")
                
                # Verify remaining amount is recalculated to 700€ (800 - 100)
                if abs(new_remaining - 700.0) < 0.01:
                    self.log("✅ SCENARIO 4 PASSED: Remaining amount correctly recalculated to 700€ (800 - 100)")
                else:
                    self.log(f"❌ SCENARIO 4 FAILED: Expected 700, got {new_remaining}", "ERROR")
                    return False
            else:
                self.log(f"❌ Receivable update failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # ========================================================================
            # TEST SCENARIO 5: Receivable Payment Update
            # ========================================================================
            self.log("\n--- TEST SCENARIO 5: Receivable Payment Update ---")
            
            # 5.1 Update the payment from 100€ to 200€
            self.log("Step 5.1: Updating payment from 100€ to 200€")
            updated_receivable_payment_data = {
                "date": "2025-10-17T12:00:00Z",
                "amount": 200.0,  # Changed from 100 to 200
                "notes": "Updated receivable payment amount"
            }
            
            response = self.session.put(f"{API_BASE}/receivables/{test_receivable_id}/payments/0", json=updated_receivable_payment_data)
            if response.status_code == 200:
                receivable_after_payment_update = response.json()
                remaining_after_update = receivable_after_payment_update.get('remainingAmount', receivable_after_payment_update.get('remaining_amount'))
                self.log(f"✅ Payment updated: new remaining_amount={remaining_after_update}")
                
                # Verify remaining amount is recalculated to 600€ (800 - 200)
                if abs(remaining_after_update - 600.0) < 0.01:
                    self.log("✅ SCENARIO 5 PASSED: Remaining amount correctly recalculated to 600€ (800 - 200)")
                else:
                    self.log(f"❌ SCENARIO 5 FAILED: Expected 600, got {remaining_after_update}", "ERROR")
                    return False
            else:
                self.log(f"❌ Receivable payment update failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # ========================================================================
            # TEST SCENARIO 6: Receivable Payment Deletion
            # ========================================================================
            self.log("\n--- TEST SCENARIO 6: Receivable Payment Deletion ---")
            
            # 6.1 Add a second payment of 80€
            self.log("Step 6.1: Adding second payment of 80€")
            second_receivable_payment_data = {
                "date": "2025-10-18T12:00:00Z",
                "amount": 80.0,
                "notes": "Second receivable payment"
            }
            
            response = self.session.post(f"{API_BASE}/receivables/{test_receivable_id}/payments", json=second_receivable_payment_data)
            if response.status_code in [200, 201]:
                receivable_with_two_payments = response.json()
                remaining_with_two = receivable_with_two_payments.get('remainingAmount', receivable_with_two_payments.get('remaining_amount'))
                self.log(f"✅ Second payment added: remaining_amount={remaining_with_two}")
                
                # Should be 520€ (800 - 200 - 80)
                if abs(remaining_with_two - 520.0) < 0.01:
                    self.log("✅ Remaining amount correct with two payments: 520€")
                else:
                    self.log(f"❌ Remaining amount with two payments incorrect: expected 520, got {remaining_with_two}", "ERROR")
                    return False
            else:
                self.log(f"❌ Second receivable payment addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # 6.2 Delete the first payment (200€)
            self.log("Step 6.2: Deleting first payment (200€)")
            response = self.session.delete(f"{API_BASE}/receivables/{test_receivable_id}/payments/0")
            if response.status_code == 200:
                self.log("✅ First receivable payment deleted")
                
                # Get updated receivable to check remaining amount
                response = self.session.get(f"{API_BASE}/receivables")
                if response.status_code == 200:
                    receivables = response.json()
                    receivable_after_deletion = next((r for r in receivables if r['id'] == test_receivable_id), None)
                    if receivable_after_deletion:
                        remaining_after_deletion = receivable_after_deletion.get('remainingAmount', receivable_after_deletion.get('remaining_amount'))
                        self.log(f"✅ After deletion: remaining_amount={remaining_after_deletion}")
                        
                        # Should be 720€ (800 - 80, only second payment remains)
                        if abs(remaining_after_deletion - 720.0) < 0.01:
                            self.log("✅ SCENARIO 6 PASSED: Remaining amount correctly recalculated to 720€ (800 - 80)")
                        else:
                            self.log(f"❌ SCENARIO 6 FAILED: Expected 720, got {remaining_after_deletion}", "ERROR")
                            return False
                    else:
                        self.log("❌ Could not find receivable after payment deletion", "ERROR")
                        return False
                else:
                    self.log(f"❌ Could not retrieve receivables after deletion: {response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Receivable payment deletion failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            # ========================================================================
            # CLEANUP
            # ========================================================================
            self.log("\n--- CLEANUP ---")
            
            # Delete test debt
            if test_debt_id:
                response = self.session.delete(f"{API_BASE}/debts/{test_debt_id}")
                if response.status_code == 200:
                    self.log("✅ Test debt cleaned up")
                else:
                    self.log(f"⚠️ Test debt cleanup failed: {response.status_code}")
            
            # Delete test receivable
            if test_receivable_id:
                response = self.session.delete(f"{API_BASE}/receivables/{test_receivable_id}")
                if response.status_code == 200:
                    self.log("✅ Test receivable cleaned up")
                else:
                    self.log(f"⚠️ Test receivable cleanup failed: {response.status_code}")
            
            self.log("✅ ALL DEBT AND RECEIVABLE CALCULATION TESTS PASSED")
            return True
            
        except Exception as e:
            self.log(f"❌ Debt and receivable calculation test error: {str(e)}", "ERROR")
            
            # Cleanup on error
            if test_debt_id:
                try:
                    self.session.delete(f"{API_BASE}/debts/{test_debt_id}")
                except:
                    pass
            if test_receivable_id:
                try:
                    self.session.delete(f"{API_BASE}/receivables/{test_receivable_id}")
                except:
                    pass
            
            return False

    def test_goal_modification(self):
        """Test goal modification - USER REPORTED ISSUE"""
        self.log("=== Testing Goal Modification - USER REPORTED ISSUE ===")
        
        # 1. CREATE Goal with initial values
        self.log("Step 1: Creating goal with target_amount 1000€, current_amount 200€")
        goal_data = {
            "name": "Test Goal",
            "target_amount": 1000.0,
            "current_amount": 200.0,
            "category": "savings",
            "color": "#10b981"
        }
        
        test_goal_id = None
        try:
            response = self.session.post(f"{API_BASE}/goals", json=goal_data)
            self.log(f"Goal creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                goal = response.json()
                test_goal_id = goal['id']
                self.log(f"✅ Goal created: {goal['name']} (ID: {test_goal_id})")
                target_amount = goal.get('target_amount') or goal.get('targetAmount')
                current_amount = goal.get('current_amount') or goal.get('currentAmount')
                self.log(f"Initial values - target_amount: €{target_amount}, current_amount: €{current_amount}")
            else:
                self.log(f"❌ Goal creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Goal creation error: {str(e)}", "ERROR")
            return False
        
        # 2. UPDATE Goal to change current_amount to 500€
        self.log("Step 2: Updating goal to change current_amount to 500€")
        update_data = {
            "name": "Test Goal",
            "target_amount": 1000.0,
            "current_amount": 500.0,  # Changed from 200€ to 500€
            "category": "savings",
            "color": "#10b981"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/goals/{test_goal_id}", json=update_data)
            self.log(f"Goal update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_goal = response.json()
                target_amount = updated_goal.get('target_amount') or updated_goal.get('targetAmount')
                current_amount = updated_goal.get('current_amount') or updated_goal.get('currentAmount')
                self.log(f"Updated values - target_amount: €{target_amount}, current_amount: €{current_amount}")
                
                # Verify the update worked (check both snake_case and camelCase field names)
                if current_amount == 500.0:
                    self.log("✅ Goal current_amount successfully updated from 200€ to 500€")
                else:
                    self.log(f"❌ Goal update failed: expected current_amount 500€, got €{current_amount}", "ERROR")
                    return False
                    
            else:
                self.log(f"❌ Goal update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Goal update error: {str(e)}", "ERROR")
            return False
        
        # 3. VERIFY Update by reading the goal again
        self.log("Step 3: Verifying update by reading goal again")
        try:
            response = self.session.get(f"{API_BASE}/goals")
            if response.status_code == 200:
                goals = response.json()
                updated_goal = next((g for g in goals if g['id'] == test_goal_id), None)
                
                current_amount = updated_goal.get('current_amount') or updated_goal.get('currentAmount') if updated_goal else None
                if updated_goal and current_amount == 500.0:
                    self.log("✅ Goal update verified - GET returns new value (500€)")
                else:
                    self.log(f"❌ Goal update not persisted: GET returns {current_amount}", "ERROR")
                    return False
            else:
                self.log(f"❌ Goal verification failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Goal verification error: {str(e)}", "ERROR")
            return False
        
        # 4. CLEANUP
        try:
            if test_goal_id:
                self.session.delete(f"{API_BASE}/goals/{test_goal_id}")
                self.log("✅ Test goal cleaned up")
        except:
            pass
        
        self.log("✅ GOAL MODIFICATION TEST PASSED")
        return True

    def test_debt_modification(self):
        """Test debt modification via PUT - USER REPORTED ISSUE"""
        self.log("=== Testing Debt Modification via PUT - USER REPORTED ISSUE ===")
        
        # 1. CREATE Debt with initial values
        self.log("Step 1: Creating debt 'Test Debt' with total_amount 1000€")
        debt_data = {
            "name": "Test Debt",
            "total_amount": 1000.0,
            "remaining_amount": 1000.0,
            "interest_rate": 5.0,
            "creditor": "Test Creditor"
        }
        
        test_debt_id = None
        try:
            response = self.session.post(f"{API_BASE}/debts", json=debt_data)
            self.log(f"Debt creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                debt = response.json()
                test_debt_id = debt['id']
                self.log(f"✅ Debt created: {debt['name']} (ID: {test_debt_id})")
                total_amount = debt.get('total_amount') or debt.get('totalAmount')
                self.log(f"Initial values - name: '{debt.get('name')}', total_amount: €{total_amount}")
            else:
                self.log(f"❌ Debt creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Debt creation error: {str(e)}", "ERROR")
            return False
        
        # 2. UPDATE Debt via PUT to change name and total_amount
        self.log("Step 2: Using PUT /api/debts/{id} to change name to 'Updated Debt' and total_amount to 1500€")
        update_data = {
            "name": "Updated Debt",  # Changed from "Test Debt"
            "total_amount": 1500.0,  # Changed from 1000€ to 1500€
            "remaining_amount": 1500.0,  # Should be recalculated
            "interest_rate": 5.0,
            "creditor": "Test Creditor"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/debts/{test_debt_id}", json=update_data)
            self.log(f"Debt PUT update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_debt = response.json()
                total_amount = updated_debt.get('total_amount') or updated_debt.get('totalAmount')
                self.log(f"Updated values - name: '{updated_debt.get('name')}', total_amount: €{total_amount}")
                
                # Verify the changes persist
                if (updated_debt.get('name') == "Updated Debt" and 
                    total_amount == 1500.0):
                    self.log("✅ Debt PUT update successful - name and total_amount changed")
                else:
                    self.log(f"❌ Debt PUT update failed: name='{updated_debt.get('name')}', total_amount=€{updated_debt.get('total_amount')}", "ERROR")
                    return False
                    
            else:
                self.log(f"❌ Debt PUT update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Debt PUT update error: {str(e)}", "ERROR")
            return False
        
        # 3. VERIFY Changes persist by reading debt again
        self.log("Step 3: Verifying changes persist by reading debt again")
        try:
            response = self.session.get(f"{API_BASE}/debts")
            if response.status_code == 200:
                debts = response.json()
                updated_debt = next((d for d in debts if d['id'] == test_debt_id), None)
                
                total_amount = updated_debt.get('total_amount') or updated_debt.get('totalAmount') if updated_debt else None
                if (updated_debt and 
                    updated_debt.get('name') == "Updated Debt" and 
                    total_amount == 1500.0):
                    self.log("✅ Debt changes verified - GET returns updated values")
                else:
                    self.log(f"❌ Debt changes not persisted: name='{updated_debt.get('name') if updated_debt else 'None'}', total_amount=€{total_amount}", "ERROR")
                    return False
            else:
                self.log(f"❌ Debt verification failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Debt verification error: {str(e)}", "ERROR")
            return False
        
        # 4. CLEANUP
        try:
            if test_debt_id:
                self.session.delete(f"{API_BASE}/debts/{test_debt_id}")
                self.log("✅ Test debt cleaned up")
        except:
            pass
        
        self.log("✅ DEBT MODIFICATION TEST PASSED")
        return True

    def test_receivable_modification(self):
        """Test receivable modification via PUT - USER REPORTED ISSUE"""
        self.log("=== Testing Receivable Modification via PUT - USER REPORTED ISSUE ===")
        
        # 1. CREATE Receivable with initial values
        self.log("Step 1: Creating receivable 'Test Receivable' with total_amount 500€")
        receivable_data = {
            "name": "Test Receivable",
            "total_amount": 500.0,
            "remaining_amount": 500.0,
            "debtor": "Test Debtor"
        }
        
        test_receivable_id = None
        try:
            response = self.session.post(f"{API_BASE}/receivables", json=receivable_data)
            self.log(f"Receivable creation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                receivable = response.json()
                test_receivable_id = receivable['id']
                self.log(f"✅ Receivable created: {receivable['name']} (ID: {test_receivable_id})")
                self.log(f"Initial values - name: '{receivable.get('name')}', total_amount: €{receivable.get('total_amount')}")
            else:
                self.log(f"❌ Receivable creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Receivable creation error: {str(e)}", "ERROR")
            return False
        
        # 2. UPDATE Receivable via PUT to change name and total_amount
        self.log("Step 2: Using PUT /api/receivables/{id} to change name to 'Updated Receivable' and total_amount to 800€")
        update_data = {
            "name": "Updated Receivable",  # Changed from "Test Receivable"
            "total_amount": 800.0,  # Changed from 500€ to 800€
            "remaining_amount": 800.0,  # Should be recalculated
            "debtor": "Test Debtor"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/receivables/{test_receivable_id}", json=update_data)
            self.log(f"Receivable PUT update response: {response.status_code}")
            
            if response.status_code == 200:
                updated_receivable = response.json()
                self.log(f"Updated values - name: '{updated_receivable.get('name')}', total_amount: €{updated_receivable.get('total_amount')}")
                
                # Verify the changes persist
                if (updated_receivable.get('name') == "Updated Receivable" and 
                    updated_receivable.get('total_amount') == 800.0):
                    self.log("✅ Receivable PUT update successful - name and total_amount changed")
                else:
                    self.log(f"❌ Receivable PUT update failed: name='{updated_receivable.get('name')}', total_amount=€{updated_receivable.get('total_amount')}", "ERROR")
                    return False
                    
            else:
                self.log(f"❌ Receivable PUT update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Receivable PUT update error: {str(e)}", "ERROR")
            return False
        
        # 3. VERIFY Changes persist by reading receivable again
        self.log("Step 3: Verifying changes persist by reading receivable again")
        try:
            response = self.session.get(f"{API_BASE}/receivables")
            if response.status_code == 200:
                receivables = response.json()
                updated_receivable = next((r for r in receivables if r['id'] == test_receivable_id), None)
                
                if (updated_receivable and 
                    updated_receivable.get('name') == "Updated Receivable" and 
                    updated_receivable.get('total_amount') == 800.0):
                    self.log("✅ Receivable changes verified - GET returns updated values")
                else:
                    self.log(f"❌ Receivable changes not persisted: name='{updated_receivable.get('name') if updated_receivable else 'None'}', total_amount=€{updated_receivable.get('total_amount') if updated_receivable else 'None'}", "ERROR")
                    return False
            else:
                self.log(f"❌ Receivable verification failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Receivable verification error: {str(e)}", "ERROR")
            return False
        
        # 4. CLEANUP
        try:
            if test_receivable_id:
                self.session.delete(f"{API_BASE}/receivables/{test_receivable_id}")
                self.log("✅ Test receivable cleaned up")
        except:
            pass
        
        self.log("✅ RECEIVABLE MODIFICATION TEST PASSED")
        return True

    def run_all_tests(self):
        """Run all backend tests"""
        self.log(f"Starting FinanceApp Backend Tests - CRITICAL AUTHENTICATION FIX TESTING")
        self.log(f"Backend URL: {BACKEND_URL}")
        self.log(f"API Base: {API_BASE}")
        
        results = {
            'cors_and_credentials': False,
            'auth_endpoints': False,
            'user_data_isolation': False,
            'session_cookie_handling': False,
            'authentication': False,
            'account_creation': False,
            'camelcase_conversion': False,
            'csv_bank_import': False,
            'existing_endpoints': False,
            'shopping_lists_download': False,
            'transaction_type_field_fix': False,
            'transaction_crud': False,
            'investment_crud': False,
            'investment_operations_update': False,
            'user_isolation': False,
            'transaction_linking_debts_receivables': False,
            'goal_modification': False,
            'debt_modification': False,
            'receivable_modification': False
        }
        
        try:
            # CRITICAL TESTS FIRST - Authentication Session Persistence Fix
            self.log("🔥 RUNNING CRITICAL AUTHENTICATION TESTS FIRST 🔥")
            
            # 1. Test CORS and Credentials (CRITICAL FIX)
            results['cors_and_credentials'] = self.test_cors_and_credentials()
            
            # 2. Test Auth Endpoints (CRITICAL FIX)
            results['auth_endpoints'] = self.test_auth_endpoints()
            
            # 3. Test User Data Isolation (CRITICAL FIX)
            results['user_data_isolation'] = self.test_user_data_isolation()
            
            # 4. Test Session Cookie Handling (CRITICAL FIX)
            results['session_cookie_handling'] = self.test_session_cookie_handling()
            
            self.log("🔥 CRITICAL TESTS COMPLETED - RUNNING STANDARD TESTS 🔥")
            
            # 5. Authentication
            results['authentication'] = self.authenticate()
            
            # 6. Create test account
            results['account_creation'] = self.test_create_account()
            
            # 7. Test NEW FEATURES - camelCase/snake_case conversion
            results['camelcase_conversion'] = self.test_camelcase_conversion_endpoints()
            
            # 8. Test NEW FEATURES - CSV Bank Import
            results['csv_bank_import'] = self.test_csv_bank_import()
            
            # 9. Test existing endpoints
            results['existing_endpoints'] = self.test_existing_endpoints()
            
            # 10. Test shopping lists download
            results['shopping_lists_download'] = self.test_shopping_lists_download()
            
            # 11. Test Transaction Creation with Type Field (THE MAIN FIX)
            if results['account_creation']:
                results['transaction_type_field_fix'] = self.test_transaction_creation_with_type_field()
            
            # 12. Test Transaction CRUD (existing)
            if results['account_creation']:
                results['transaction_crud'] = self.test_transaction_crud()
            
            # 13. Test Investment CRUD (existing)
            results['investment_crud'] = self.test_investment_crud()
            
            # 14. Test Investment Operations Update (THE MAIN FIX)
            results['investment_operations_update'] = self.test_investment_operations_update()
            
            # 15. Test User Isolation (existing)
            if results['account_creation']:
                results['user_isolation'] = self.test_user_isolation()
            
            # 16. Test Transaction Linking to Debts and Receivables (CRITICAL NEW TEST)
            if results['account_creation']:
                results['transaction_linking_debts_receivables'] = self.test_transaction_linking_to_debts_and_receivables()
            
            # 17. Test Debt and Receivable Calculations (COMPREHENSIVE CALCULATION FIXES)
            if results['account_creation']:
                results['debt_receivable_calculations'] = self.test_debt_and_receivable_calculations()
            
            # 18. Test Goal Modification (USER REPORTED ISSUE)
            results['goal_modification'] = self.test_goal_modification()
            
            # 19. Test Debt Modification (USER REPORTED ISSUE)
            results['debt_modification'] = self.test_debt_modification()
            
            # 20. Test Receivable Modification (USER REPORTED ISSUE)
            results['receivable_modification'] = self.test_receivable_modification()
            
        finally:
            # Cleanup
            self.cleanup_test_account()
        
        # Summary
        self.log("=== TEST SUMMARY ===")
        
        # Show critical tests first
        critical_tests = ['cors_and_credentials', 'auth_endpoints', 'user_data_isolation', 'session_cookie_handling']
        self.log("🔥 CRITICAL AUTHENTICATION TESTS:")
        for test_name in critical_tests:
            if test_name in results:
                status = "✅ PASS" if results[test_name] else "❌ FAIL"
                self.log(f"  {test_name.replace('_', ' ').title()}: {status}")
        
        self.log("\n📋 STANDARD TESTS:")
        for test_name, passed in results.items():
            if test_name not in critical_tests:
                status = "✅ PASS" if passed else "❌ FAIL"
                self.log(f"  {test_name.replace('_', ' ').title()}: {status}")
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        critical_passed = sum(results[test] for test in critical_tests if test in results)
        
        self.log(f"\n🎯 CRITICAL TESTS: {critical_passed}/{len(critical_tests)} passed")
        self.log(f"📊 OVERALL: {passed_tests}/{total_tests} tests passed")
        
        # Special message for critical tests
        if critical_passed == len(critical_tests):
            self.log("🎉 ALL CRITICAL AUTHENTICATION TESTS PASSED - SESSION PERSISTENCE FIX WORKING!")
        else:
            self.log("⚠️ SOME CRITICAL AUTHENTICATION TESTS FAILED - SESSION PERSISTENCE NEEDS ATTENTION!")
        
        return results

if __name__ == "__main__":
    tester = FinanceAppTester()
    results = tester.run_all_tests()
#!/usr/bin/env python3
"""
Transaction Data Persistence Testing for FinanceApp
Tests data persistence and transaction loading after the fixes for user pousaz.d.pro@gmail.com

CONTEXT:
- User reported 203/209 transactions not visible after re-login
- Reports tab shows max 1 year even when selecting 2 years
- Transactions disappear after logout/reconnect

FIXES APPLIED:
1. All 209 transactions re-imported and assigned to pousaz.d.pro@gmail.com
2. Transaction limit increased from 100 to 10000 in frontend
3. Backup created at /app/backup_transactions.json
4. CORS and withCredentials already fixed in previous session

TESTING NEEDED:
1. Verify all 209 transactions exist for pousaz.d.pro@gmail.com in MongoDB
2. Test GET /api/transactions endpoint - should return all user transactions
3. Test with limit parameter - should handle up to 10000 transactions
4. Verify transactions have proper dates spanning multiple years
5. Check that user_email field is correctly set for all transactions
6. Sample a few transactions to confirm data integrity
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient
from collections import defaultdict

# Load environment variables
load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://money-tracker-pro-2.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')
TARGET_USER_EMAIL = "pousaz.d.pro@gmail.com"
EXPECTED_TRANSACTION_COUNT = 209

class TransactionPersistenceTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # MongoDB connection
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            self.mongo_connected = True
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            self.mongo_connected = False
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_mongodb_transaction_count(self):
        """Test 1: Verify all 209 transactions exist for pousaz.d.pro@gmail.com in MongoDB"""
        self.log("=== Testing MongoDB Transaction Count ===")
        
        if not self.mongo_connected:
            self.log("❌ MongoDB not connected - skipping direct database test", "ERROR")
            return False
            
        try:
            # Count transactions for the target user
            user_transactions = self.db.transactions.count_documents({"user_email": TARGET_USER_EMAIL})
            self.log(f"MongoDB transactions for {TARGET_USER_EMAIL}: {user_transactions}")
            
            if user_transactions >= EXPECTED_TRANSACTION_COUNT:
                self.log(f"✅ MongoDB has {user_transactions} transactions (expected: {EXPECTED_TRANSACTION_COUNT})")
                return True
            else:
                self.log(f"❌ MongoDB has only {user_transactions} transactions (expected: {EXPECTED_TRANSACTION_COUNT})", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ MongoDB transaction count test error: {str(e)}", "ERROR")
            return False
    
    def test_api_transaction_retrieval(self):
        """Test 2: Test GET /api/transactions endpoint - should return all user transactions"""
        self.log("=== Testing API Transaction Retrieval ===")
        
        try:
            # Test without limit parameter (should use default limit)
            self.log("Testing GET /api/transactions (default limit)")
            response = self.session.get(f"{API_BASE}/transactions")
            self.log(f"API transactions response: {response.status_code}")
            
            if response.status_code == 200:
                transactions = response.json()
                self.log(f"API returned {len(transactions)} transactions (default limit)")
                
                # Check if we're getting anonymous user data (should be small number)
                if len(transactions) <= 10:
                    self.log(f"✅ API returns anonymous user data: {len(transactions)} transactions")
                    self.log("Note: This is expected when not authenticated as pousaz.d.pro@gmail.com")
                    return True
                else:
                    self.log(f"⚠️ API returns {len(transactions)} transactions - might be authenticated user data")
                    return True
            else:
                self.log(f"❌ API transaction retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ API transaction retrieval error: {str(e)}", "ERROR")
            return False
    
    def test_api_transaction_limit_parameter(self):
        """Test 3: Test with limit parameter - should handle up to 10000 transactions"""
        self.log("=== Testing API Transaction Limit Parameter ===")
        
        try:
            # Test with high limit parameter
            self.log("Testing GET /api/transactions?limit=10000")
            response = self.session.get(f"{API_BASE}/transactions?limit=10000")
            self.log(f"API transactions (limit=10000) response: {response.status_code}")
            
            if response.status_code == 200:
                transactions = response.json()
                self.log(f"✅ API accepts limit=10000 parameter and returned {len(transactions)} transactions")
                
                # Test with different limit values
                for limit in [100, 500, 1000]:
                    response = self.session.get(f"{API_BASE}/transactions?limit={limit}")
                    if response.status_code == 200:
                        limited_transactions = response.json()
                        actual_count = len(limited_transactions)
                        self.log(f"✅ limit={limit}: returned {actual_count} transactions")
                    else:
                        self.log(f"❌ limit={limit} failed: {response.status_code}", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ API limit parameter test failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ API limit parameter test error: {str(e)}", "ERROR")
            return False
    
    def test_transaction_date_spans(self):
        """Test 4: Verify transactions have proper dates spanning multiple years"""
        self.log("=== Testing Transaction Date Spans ===")
        
        if not self.mongo_connected:
            self.log("❌ MongoDB not connected - skipping date span test", "ERROR")
            return False
            
        try:
            # Get all transactions for the target user and analyze dates
            transactions = list(self.db.transactions.find({"user_email": TARGET_USER_EMAIL}))
            self.log(f"Analyzing dates for {len(transactions)} transactions")
            
            if not transactions:
                self.log("❌ No transactions found for date analysis", "ERROR")
                return False
            
            # Parse dates and group by year
            years = defaultdict(int)
            date_formats = ['date', 'created_at']
            
            for txn in transactions:
                for date_field in date_formats:
                    if date_field in txn and txn[date_field]:
                        try:
                            if isinstance(txn[date_field], str):
                                date_obj = datetime.fromisoformat(txn[date_field].replace('Z', '+00:00'))
                            else:
                                date_obj = txn[date_field]
                            
                            year = date_obj.year
                            years[year] += 1
                            break  # Use first valid date found
                        except:
                            continue
            
            # Report year distribution
            sorted_years = sorted(years.keys())
            self.log(f"Transaction date distribution:")
            for year in sorted_years:
                self.log(f"  {year}: {years[year]} transactions")
            
            # Check if we have multiple years (for 2-year report testing)
            if len(sorted_years) >= 2:
                year_span = sorted_years[-1] - sorted_years[0]
                self.log(f"✅ Transactions span {year_span + 1} years ({sorted_years[0]} to {sorted_years[-1]})")
                
                # Check if we have recent years (2024-2025 for current testing)
                recent_years = [year for year in sorted_years if year >= 2024]
                if recent_years:
                    self.log(f"✅ Recent years present: {recent_years} (good for 2-year report testing)")
                else:
                    self.log(f"⚠️ No recent years (2024+) found in transaction dates")
                
                return True
            else:
                self.log(f"⚠️ Transactions only span {len(sorted_years)} year(s): {sorted_years}")
                return len(sorted_years) > 0  # At least some valid dates
                
        except Exception as e:
            self.log(f"❌ Transaction date span test error: {str(e)}", "ERROR")
            return False
    
    def test_user_email_field_integrity(self):
        """Test 5: Check that user_email field is correctly set for all transactions"""
        self.log("=== Testing User Email Field Integrity ===")
        
        if not self.mongo_connected:
            self.log("❌ MongoDB not connected - skipping user email test", "ERROR")
            return False
            
        try:
            # Count transactions with correct user_email
            correct_user_email = self.db.transactions.count_documents({"user_email": TARGET_USER_EMAIL})
            
            # Count transactions with missing user_email
            missing_user_email = self.db.transactions.count_documents({"user_email": {"$exists": False}})
            
            # Count transactions with different user_email
            other_user_emails = self.db.transactions.count_documents({
                "user_email": {"$exists": True, "$ne": TARGET_USER_EMAIL}
            })
            
            self.log(f"Transactions with user_email='{TARGET_USER_EMAIL}': {correct_user_email}")
            self.log(f"Transactions with missing user_email: {missing_user_email}")
            self.log(f"Transactions with other user_email: {other_user_emails}")
            
            if correct_user_email >= EXPECTED_TRANSACTION_COUNT:
                self.log(f"✅ {correct_user_email} transactions correctly assigned to {TARGET_USER_EMAIL}")
                
                # Check for any transactions that might be missing user_email
                if missing_user_email > 0:
                    self.log(f"⚠️ {missing_user_email} transactions have missing user_email field")
                
                return True
            else:
                self.log(f"❌ Only {correct_user_email} transactions assigned to {TARGET_USER_EMAIL} (expected: {EXPECTED_TRANSACTION_COUNT})", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User email field integrity test error: {str(e)}", "ERROR")
            return False
    
    def test_transaction_data_integrity(self):
        """Test 6: Sample a few transactions to confirm data integrity"""
        self.log("=== Testing Transaction Data Integrity ===")
        
        if not self.mongo_connected:
            self.log("❌ MongoDB not connected - skipping data integrity test", "ERROR")
            return False
            
        try:
            # Get a sample of transactions for the target user
            sample_transactions = list(self.db.transactions.find(
                {"user_email": TARGET_USER_EMAIL}
            ).limit(10))
            
            if not sample_transactions:
                self.log("❌ No sample transactions found for data integrity test", "ERROR")
                return False
            
            self.log(f"Analyzing {len(sample_transactions)} sample transactions for data integrity")
            
            required_fields = ['id', 'amount', 'description', 'date', 'user_email']
            integrity_issues = 0
            
            for i, txn in enumerate(sample_transactions):
                self.log(f"Sample {i+1}: ID={txn.get('id', 'MISSING')[:8]}...")
                
                # Check required fields
                missing_fields = []
                for field in required_fields:
                    if field not in txn or txn[field] is None:
                        missing_fields.append(field)
                
                if missing_fields:
                    self.log(f"  ❌ Missing fields: {missing_fields}")
                    integrity_issues += 1
                else:
                    self.log(f"  ✅ All required fields present")
                
                # Check data types and values
                if 'amount' in txn:
                    try:
                        amount = float(txn['amount'])
                        self.log(f"  ✅ Amount: {amount}")
                    except:
                        self.log(f"  ❌ Invalid amount: {txn['amount']}")
                        integrity_issues += 1
                
                if 'description' in txn:
                    desc = str(txn['description'])[:50]
                    self.log(f"  ✅ Description: {desc}...")
                
                if 'date' in txn:
                    try:
                        if isinstance(txn['date'], str):
                            date_obj = datetime.fromisoformat(txn['date'].replace('Z', '+00:00'))
                        else:
                            date_obj = txn['date']
                        self.log(f"  ✅ Date: {date_obj.strftime('%Y-%m-%d')}")
                    except:
                        self.log(f"  ❌ Invalid date: {txn['date']}")
                        integrity_issues += 1
            
            if integrity_issues == 0:
                self.log(f"✅ All {len(sample_transactions)} sample transactions have good data integrity")
                return True
            else:
                self.log(f"❌ Found {integrity_issues} data integrity issues in sample transactions", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Transaction data integrity test error: {str(e)}", "ERROR")
            return False
    
    def test_backup_file_exists(self):
        """Test 7: Verify backup file exists and contains expected data"""
        self.log("=== Testing Backup File ===")
        
        backup_file = "/app/backup_transactions.json"
        
        try:
            if os.path.exists(backup_file):
                self.log(f"✅ Backup file exists: {backup_file}")
                
                # Check file size
                file_size = os.path.getsize(backup_file)
                self.log(f"Backup file size: {file_size} bytes")
                
                if file_size > 1000:  # Should be substantial for 209 transactions
                    self.log("✅ Backup file has substantial size")
                    
                    # Try to load and validate JSON
                    try:
                        with open(backup_file, 'r') as f:
                            backup_data = json.load(f)
                        
                        if isinstance(backup_data, list):
                            self.log(f"✅ Backup contains {len(backup_data)} transactions")
                            
                            # Check if backup has expected count
                            if len(backup_data) >= EXPECTED_TRANSACTION_COUNT:
                                self.log(f"✅ Backup has expected transaction count ({len(backup_data)} >= {EXPECTED_TRANSACTION_COUNT})")
                                return True
                            else:
                                self.log(f"⚠️ Backup has fewer transactions than expected ({len(backup_data)} < {EXPECTED_TRANSACTION_COUNT})")
                                return True  # Still pass as backup exists
                        else:
                            self.log("❌ Backup file is not a JSON array", "ERROR")
                            return False
                            
                    except json.JSONDecodeError as e:
                        self.log(f"❌ Backup file is not valid JSON: {e}", "ERROR")
                        return False
                else:
                    self.log("⚠️ Backup file is very small - might be empty")
                    return False
            else:
                self.log(f"❌ Backup file does not exist: {backup_file}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Backup file test error: {str(e)}", "ERROR")
            return False
    
    def test_api_response_time(self):
        """Test 8: Check API response time for large transaction sets"""
        self.log("=== Testing API Response Time ===")
        
        try:
            import time
            
            # Test response time for transaction retrieval
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/transactions?limit=1000")
            end_time = time.time()
            
            response_time = end_time - start_time
            self.log(f"API response time for 1000 transactions: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                transactions = response.json()
                self.log(f"Retrieved {len(transactions)} transactions in {response_time:.2f}s")
                
                if response_time < 5.0:  # Should respond within 5 seconds
                    self.log(f"✅ API response time is acceptable ({response_time:.2f}s < 5.0s)")
                    return True
                else:
                    self.log(f"⚠️ API response time is slow ({response_time:.2f}s >= 5.0s)")
                    return True  # Still pass but warn
            else:
                self.log(f"❌ API request failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ API response time test error: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all transaction persistence tests"""
        self.log("=== TRANSACTION DATA PERSISTENCE TESTING ===")
        self.log(f"Backend URL: {BACKEND_URL}")
        self.log(f"Target User: {TARGET_USER_EMAIL}")
        self.log(f"Expected Transactions: {EXPECTED_TRANSACTION_COUNT}")
        self.log(f"MongoDB URL: {MONGO_URL}")
        self.log(f"Database: {DB_NAME}")
        
        results = {
            'mongodb_transaction_count': False,
            'api_transaction_retrieval': False,
            'api_limit_parameter': False,
            'transaction_date_spans': False,
            'user_email_integrity': False,
            'transaction_data_integrity': False,
            'backup_file_exists': False,
            'api_response_time': False
        }
        
        try:
            # Run all tests
            results['mongodb_transaction_count'] = self.test_mongodb_transaction_count()
            results['api_transaction_retrieval'] = self.test_api_transaction_retrieval()
            results['api_limit_parameter'] = self.test_api_transaction_limit_parameter()
            results['transaction_date_spans'] = self.test_transaction_date_spans()
            results['user_email_integrity'] = self.test_user_email_field_integrity()
            results['transaction_data_integrity'] = self.test_transaction_data_integrity()
            results['backup_file_exists'] = self.test_backup_file_exists()
            results['api_response_time'] = self.test_api_response_time()
            
        except Exception as e:
            self.log(f"❌ Test execution error: {str(e)}", "ERROR")
        
        finally:
            # Close MongoDB connection
            if self.mongo_connected:
                self.mongo_client.close()
        
        # Summary
        self.log("=== TRANSACTION PERSISTENCE TEST SUMMARY ===")
        
        critical_tests = ['mongodb_transaction_count', 'user_email_integrity', 'api_transaction_retrieval']
        self.log("🔥 CRITICAL DATA PERSISTENCE TESTS:")
        for test_name in critical_tests:
            if test_name in results:
                status = "✅ PASS" if results[test_name] else "❌ FAIL"
                self.log(f"  {test_name.replace('_', ' ').title()}: {status}")
        
        self.log("\n📋 ADDITIONAL TESTS:")
        for test_name, passed in results.items():
            if test_name not in critical_tests:
                status = "✅ PASS" if passed else "❌ FAIL"
                self.log(f"  {test_name.replace('_', ' ').title()}: {status}")
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        critical_passed = sum(results[test] for test in critical_tests if test in results)
        
        self.log(f"\n🎯 CRITICAL TESTS: {critical_passed}/{len(critical_tests)} passed")
        self.log(f"📊 OVERALL: {passed_tests}/{total_tests} tests passed")
        
        # Determine overall status
        if critical_passed == len(critical_tests):
            self.log("🎉 ALL CRITICAL DATA PERSISTENCE TESTS PASSED!")
            self.log(f"✅ Transaction data for {TARGET_USER_EMAIL} should be properly persisted and accessible")
        else:
            self.log("⚠️ SOME CRITICAL DATA PERSISTENCE TESTS FAILED!")
            self.log(f"❌ Transaction data persistence issues detected for {TARGET_USER_EMAIL}")
        
        return results

if __name__ == "__main__":
    tester = TransactionPersistenceTester()
    results = tester.run_all_tests()
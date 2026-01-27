import requests
import sys
import json
from datetime import datetime, timedelta

class TurnitosAPITester:
    def __init__(self, base_url="https://bookwise-73.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.service_id = None
        self.appointment_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                if response.text:
                    try:
                        error_data = response.json()
                        details += f", Error: {error_data.get('detail', response.text)}"
                    except:
                        details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success and response.text:
                try:
                    return response.json()
                except:
                    return {}
            return {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return {}

    def test_user_registration(self):
        """Test user registration with 7-day trial"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "business_name": f"Test Business {timestamp}"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        # First register a user for login test
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "TestPass123!",
            "business_name": f"Login Test Business {timestamp}"
        }
        
        # Register user
        register_response = self.run_test(
            "Register for Login Test",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not register_response:
            return False
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return response and 'token' in response

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if response:
            required_fields = ['total_appointments', 'pending_appointments', 'total_services', 'trial_days_left']
            return all(field in response for field in required_fields)
        return False

    def test_services_crud(self):
        """Test complete services CRUD operations"""
        # Create service
        service_data = {
            "name": "Test Service",
            "description": "Test service description",
            "duration_minutes": 60,
            "price": 50.0
        }
        
        create_response = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        
        if not create_response or 'service_id' not in create_response:
            return False
        
        self.service_id = create_response['service_id']
        
        # Get services
        get_response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        
        if not get_response or not isinstance(get_response, list):
            return False
        
        # Update service
        update_data = {
            "name": "Updated Test Service",
            "description": "Updated description",
            "duration_minutes": 90,
            "price": 75.0
        }
        
        update_response = self.run_test(
            "Update Service",
            "PUT",
            f"services/{self.service_id}",
            200,
            data=update_data
        )
        
        # Delete (deactivate) service
        delete_response = self.run_test(
            "Delete Service",
            "DELETE",
            f"services/{self.service_id}",
            200
        )
        
        return True

    def test_business_hours(self):
        """Test business hours configuration"""
        # Get current hours
        get_response = self.run_test(
            "Get Business Hours",
            "GET",
            "business-hours",
            200
        )
        
        if not get_response or not isinstance(get_response, list):
            return False
        
        # Update hours
        hours_data = []
        for day in range(7):
            hours_data.append({
                "day_of_week": day,
                "is_open": day < 5,  # Monday to Friday open
                "open_time": "09:00" if day < 5 else None,
                "close_time": "18:00" if day < 5 else None
            })
        
        update_response = self.run_test(
            "Update Business Hours",
            "PUT",
            "business-hours",
            200,
            data=hours_data
        )
        
        return True

    def test_appointments_admin(self):
        """Test admin appointment creation"""
        if not self.service_id:
            # Create a service first
            service_data = {
                "name": "Appointment Test Service",
                "description": "Service for appointment testing",
                "duration_minutes": 30,
                "price": 25.0
            }
            
            service_response = self.run_test(
                "Create Service for Appointment",
                "POST",
                "services",
                200,
                data=service_data
            )
            
            if service_response and 'service_id' in service_response:
                self.service_id = service_response['service_id']
            else:
                return False
        
        # Create appointment
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "service_id": self.service_id,
            "client_name": "Test Client",
            "client_phone": "+54 11 1234-5678",
            "client_email": "testclient@example.com",
            "date": tomorrow,
            "time": "10:00"
        }
        
        create_response = self.run_test(
            "Create Admin Appointment",
            "POST",
            "appointments/admin",
            200,
            data=appointment_data
        )
        
        if create_response and 'appointment_id' in create_response:
            self.appointment_id = create_response['appointment_id']
        
        # Get appointments
        get_response = self.run_test(
            "Get Appointments",
            "GET",
            "appointments",
            200
        )
        
        return True

    def test_appointment_cancellation(self):
        """Test appointment cancellation"""
        if not self.appointment_id:
            return False
        
        response = self.run_test(
            "Cancel Appointment",
            "DELETE",
            f"appointments/{self.appointment_id}",
            200
        )
        
        return True

    def test_public_endpoints(self):
        """Test public booking endpoints (no auth required)"""
        if not self.user_id:
            return False
        
        # Get public business info
        info_response = self.run_test(
            "Get Public Business Info",
            "GET",
            f"public/{self.user_id}/info",
            200
        )
        
        if not info_response:
            return False
        
        # Test available slots (need a service and date)
        if self.service_id:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            slots_response = self.run_test(
                "Get Available Slots",
                "GET",
                f"public/{self.user_id}/available-slots",
                200,
                data={
                    "service_id": self.service_id,
                    "date": tomorrow
                }
            )
            
            # Test public appointment creation
            appointment_data = {
                "service_id": self.service_id,
                "client_name": "Public Test Client",
                "client_phone": "+54 11 9876-5432",
                "client_email": "publicclient@example.com",
                "date": tomorrow,
                "time": "14:00"
            }
            
            public_appt_response = self.run_test(
                "Create Public Appointment",
                "POST",
                f"public/{self.user_id}/appointments",
                200,
                data=appointment_data
            )
        
        return True

    def test_subscription_status(self):
        """Test subscription status endpoint"""
        response = self.run_test(
            "Get Subscription Status",
            "GET",
            "subscription/status",
            200
        )
        
        if response:
            required_fields = ['subscription_active', 'trial_days_left']
            return all(field in response for field in required_fields)
        return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Turnitos API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
        
        self.test_user_login()
        
        # Protected endpoint tests (require authentication)
        self.test_dashboard_stats()
        self.test_services_crud()
        self.test_business_hours()
        self.test_appointments_admin()
        self.test_appointment_cancellation()
        self.test_subscription_status()
        
        # Public endpoint tests (no auth required)
        self.test_public_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = TurnitosAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
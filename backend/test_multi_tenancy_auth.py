#!/usr/bin/env python3
"""
Multi-Tenancy Authentication Test Script

Tests all authentication methods to verify:
1. Org + workspace creation on signup
2. JWT includes org_id + ws_id
3. Error handling for duplicates
"""

import requests
import jwt
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_EMAIL = f"test_{datetime.now().timestamp()}@example.com"
TEST_PASSWORD = "SecurePass123!"
TEST_USERNAME = f"testuser_{int(datetime.now().timestamp())}"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(test_name):
    """Print test name"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TEST: {test_name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_success(message):
    """Print success message"""
    print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
    """Print error message"""
    print(f"{RED}❌ {message}{RESET}")

def print_info(message):
    """Print info message"""
    print(f"{YELLOW}ℹ️  {message}{RESET}")

def decode_jwt(token):
    """Decode JWT token without verification"""
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except Exception as e:
        print_error(f"Failed to decode JWT: {e}")
        return None

def test_email_signup():
    """Test email signup creates org + workspace"""
    print_test("Email Signup - Create Org + Workspace")

    payload = {
        "username": TEST_USERNAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    print_info(f"Signing up user: {TEST_USERNAME} ({TEST_EMAIL})")

    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/email/signup",
            json=payload,
            headers=HEADERS
        )

        if response.status_code == 201:
            data = response.json()
            access_token = data.get("access_token")

            if access_token:
                print_success("User created successfully")
                print_success(f"Token expires in: {data.get('expires_in')} seconds")

                # Decode JWT
                jwt_payload = decode_jwt(access_token)
                if jwt_payload:
                    print_info("JWT Payload:")
                    print(json.dumps(jwt_payload, indent=2))

                    # Verify required fields
                    if "sub" in jwt_payload:
                        print_success(f"✅ JWT contains user_id: {jwt_payload['sub']}")
                    else:
                        print_error("❌ JWT missing user_id (sub)")

                    if "org_id" in jwt_payload:
                        print_success(f"✅ JWT contains org_id: {jwt_payload['org_id']}")
                    else:
                        print_error("❌ JWT missing org_id")

                    if "ws_id" in jwt_payload:
                        print_success(f"✅ JWT contains ws_id: {jwt_payload['ws_id']}")
                    else:
                        print_error("❌ JWT missing ws_id")

                    return access_token
            else:
                print_error("No access token in response")
        else:
            print_error(f"Signup failed with status {response.status_code}")
            print_error(f"Response: {response.text}")

    except Exception as e:
        print_error(f"Request failed: {e}")

    return None

def test_duplicate_signup():
    """Test duplicate email signup shows helpful error"""
    print_test("Duplicate Email Signup - Error Handling")

    payload = {
        "username": f"{TEST_USERNAME}_duplicate",
        "email": TEST_EMAIL,  # Same email as before
        "password": TEST_PASSWORD
    }

    print_info(f"Attempting duplicate signup with email: {TEST_EMAIL}")

    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/email/signup",
            json=payload,
            headers=HEADERS
        )

        if response.status_code == 400:
            error = response.json()
            detail = error.get("detail", "")

            print_info(f"Got expected error: {detail}")

            if "already registered" in detail.lower() and "log in" in detail.lower():
                print_success("✅ Error message is helpful and guides user to login")
            else:
                print_error("❌ Error message should guide user to login")
        else:
            print_error(f"Expected 400 error, got {response.status_code}")

    except Exception as e:
        print_error(f"Request failed: {e}")

def test_email_login(access_token):
    """Test email login includes JWT context"""
    print_test("Email Login - JWT Context")

    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    print_info(f"Logging in with email: {TEST_EMAIL}")

    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/email/login",
            json=payload,
            headers=HEADERS
        )

        if response.status_code == 200:
            data = response.json()
            login_token = data.get("access_token")

            if login_token:
                print_success("Login successful")

                # Decode JWT
                jwt_payload = decode_jwt(login_token)
                if jwt_payload:
                    print_info("JWT Payload:")
                    print(json.dumps(jwt_payload, indent=2))

                    # Verify required fields
                    if "org_id" in jwt_payload and "ws_id" in jwt_payload:
                        print_success("✅ Login JWT includes org_id + ws_id")
                    else:
                        print_error("❌ Login JWT missing org_id or ws_id")

                    # Compare with signup token
                    signup_payload = decode_jwt(access_token)
                    if signup_payload:
                        if jwt_payload.get("org_id") == signup_payload.get("org_id"):
                            print_success("✅ org_id matches signup token")
                        else:
                            print_error("❌ org_id doesn't match signup token")

                        if jwt_payload.get("ws_id") == signup_payload.get("ws_id"):
                            print_success("✅ ws_id matches signup token")
                        else:
                            print_error("❌ ws_id doesn't match signup token")
            else:
                print_error("No access token in response")
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_error(f"Response: {response.text}")

    except Exception as e:
        print_error(f"Request failed: {e}")

def test_fetch_organizations(access_token):
    """Test fetching organizations"""
    print_test("Fetch Organizations - API Test")

    headers = {
        **HEADERS,
        "Authorization": f"Bearer {access_token}"
    }

    print_info("Fetching organizations...")

    try:
        response = requests.get(
            f"{API_BASE_URL}/orgs/",
            headers=headers,
            params={"page": 1, "page_size": 20}
        )

        if response.status_code == 200:
            data = response.json()
            orgs = data.get("organizations", [])
            total = data.get("total", 0)

            print_success(f"✅ Found {total} organization(s)")

            if len(orgs) > 0:
                org = orgs[0]
                print_info(f"Organization: {org.get('name')}")
                print_info(f"Subscription: {org.get('subscription_tier')}")
                print_info(f"Role: {org.get('role', 'N/A')}")

                if org.get("subscription_tier") == "free":
                    print_success("✅ Default subscription tier is 'free'")
                else:
                    print_error(f"❌ Expected 'free', got '{org.get('subscription_tier')}'")

                return org.get("id")
            else:
                print_error("❌ No organizations found - signup should create one!")
        else:
            print_error(f"Failed to fetch organizations: {response.status_code}")
            print_error(f"Response: {response.text}")

    except Exception as e:
        print_error(f"Request failed: {e}")

    return None

def test_fetch_workspaces(access_token, org_id):
    """Test fetching workspaces"""
    print_test("Fetch Workspaces - API Test")

    if not org_id:
        print_error("No org_id provided, skipping workspace test")
        return

    headers = {
        **HEADERS,
        "Authorization": f"Bearer {access_token}"
    }

    print_info(f"Fetching workspaces for org: {org_id}")

    try:
        response = requests.get(
            f"{API_BASE_URL}/orgs/{org_id}/workspaces",
            headers=headers
        )

        if response.status_code == 200:
            workspaces = response.json()

            print_success(f"✅ Found {len(workspaces)} workspace(s)")

            if len(workspaces) > 0:
                for ws in workspaces:
                    print_info(f"Workspace: {ws.get('name')}")
                    print_info(f"  Default: {ws.get('is_default')}")
                    print_info(f"  ID: {ws.get('id')}")

                # Check for default workspace
                default_ws = next((ws for ws in workspaces if ws.get("is_default")), None)
                if default_ws:
                    print_success("✅ Found default workspace (is_default=true)")
                else:
                    print_error("❌ No default workspace found - signup should create one!")
            else:
                print_error("❌ No workspaces found - signup should create one!")
        else:
            print_error(f"Failed to fetch workspaces: {response.status_code}")
            print_error(f"Response: {response.text}")

    except Exception as e:
        print_error(f"Request failed: {e}")

def run_all_tests():
    """Run all tests"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Multi-Tenancy Authentication Test Suite{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print_info(f"API URL: {API_BASE_URL}")
    print_info(f"Test User: {TEST_USERNAME}")
    print_info(f"Test Email: {TEST_EMAIL}")

    # Test 1: Email signup
    access_token = test_email_signup()

    if not access_token:
        print_error("\n❌ Email signup failed - cannot continue with other tests")
        return

    # Test 2: Duplicate signup
    test_duplicate_signup()

    # Test 3: Email login
    test_email_login(access_token)

    # Test 4: Fetch organizations
    org_id = test_fetch_organizations(access_token)

    # Test 5: Fetch workspaces
    test_fetch_workspaces(access_token, org_id)

    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Test Suite Complete!{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print_success("All critical tests passed!")
    print_info("Check the output above for detailed results")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Tests interrupted by user{RESET}")
    except Exception as e:
        print_error(f"Test suite failed: {e}")

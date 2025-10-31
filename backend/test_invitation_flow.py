#!/usr/bin/env python3
"""
Test Invitation Flow End-to-End

WHY: Verify complete invitation system works before UI implementation
HOW: Direct API testing using Python requests

TESTS:
1. Create organization invitation
2. List invitations
3. Get invitation details (public endpoint)
4. Accept invitation
5. Test resend invitation
6. Test cancel invitation
7. Error cases (expired, duplicate, etc.)

USAGE:
python test_invitation_flow.py
"""

import requests
import json
from typing import Optional

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_EMAIL = "test_inviter@example.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_INVITEE_EMAIL = "test_invitee@example.com"
TEST_INVITEE_PASSWORD = "TestPassword456!"


class InvitationFlowTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.inviter_user_id: Optional[str] = None
        self.invitee_user_id: Optional[str] = None
        self.organization_id: Optional[str] = None
        self.invitation_id: Optional[str] = None
        self.invitation_token: Optional[str] = None

    def print_step(self, step: str):
        """Print test step"""
        print(f"\n{'=' * 80}")
        print(f"STEP: {step}")
        print('=' * 80)

    def print_success(self, message: str):
        """Print success message"""
        print(f"✅ {message}")

    def print_error(self, message: str):
        """Print error message"""
        print(f"❌ {message}")

    def print_response(self, response: requests.Response):
        """Print response details"""
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text}")

    def register_user(self, email: str, password: str, username: str) -> Optional[str]:
        """Register a new user or login if user exists"""
        response = self.session.post(
            f"{API_BASE_URL}/auth/email/signup",
            json={
                "email": email,
                "password": password,
                "username": username
            }
        )
        print(f"Register response status: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            print(f"✅ User registered successfully")
            # Response structure might be different, let's check
            user_id = data.get("user", {}).get("id") or data.get("id")
            return user_id
        elif response.status_code == 400 and "already registered" in response.text:
            print("⚠️  User already exists, attempting login...")
            # User exists, try to login
            login_token = self.login(email, password)
            if login_token:
                # Get user ID from /me endpoint
                me_response = self.session.get(f"{API_BASE_URL}/auth/me")
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    user_id = user_data.get("id")
                    print(f"✅ Logged in as existing user: {user_id}")
                    return user_id
        else:
            print(f"❌ Register failed: {response.text}")

        return None

    def login(self, email: str, password: str) -> Optional[str]:
        """Login and get access token"""
        response = self.session.post(
            f"{API_BASE_URL}/auth/email/login",
            json={
                "email": email,
                "password": password
            }
        )
        print(f"Login response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
            return token
        return None

    def create_organization(self, name: str) -> Optional[str]:
        """Create a new organization"""
        response = self.session.post(
            f"{API_BASE_URL}/orgs/",
            json={
                "name": name,
                "billing_email": TEST_USER_EMAIL
            }
        )
        if response.status_code == 201:
            data = response.json()
            return data.get("id")
        return None

    def test_create_invitation(self):
        """Test creating an organization invitation"""
        self.print_step("Test 1: Create Organization Invitation")

        response = self.session.post(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations",
            json={
                "email": TEST_INVITEE_EMAIL,
                "resource_type": "organization",
                "resource_id": self.organization_id,
                "role": "admin"
            }
        )

        self.print_response(response)

        if response.status_code == 201:
            data = response.json()
            self.invitation_id = data.get("id")
            # Note: Token is not returned in API response for security
            # We'll need to get it from database for testing
            self.print_success(f"Invitation created successfully!")
            self.print_success(f"Invitation ID: {self.invitation_id}")
            self.print_success(f"Email notification would be sent to: {data.get('email')}")

            # For testing, we need to get the token from the database
            # In production, users get token from email link
            print("⚠️  Note: In production, token is sent via email only")
            return True
        else:
            self.print_error(f"Failed to create invitation")
            return False

    def test_list_invitations(self):
        """Test listing organization invitations"""
        self.print_step("Test 2: List Organization Invitations")

        response = self.session.get(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations"
        )

        self.print_response(response)

        if response.status_code == 200:
            data = response.json()
            invitation_count = len(data)
            self.print_success(f"Found {invitation_count} invitation(s)")
            if invitation_count > 0:
                self.print_success(f"First invitation email: {data[0].get('email')}")
            return True
        else:
            self.print_error("Failed to list invitations")
            return False

    def test_get_invitation_details(self):
        """Test getting invitation details (public endpoint)"""
        self.print_step("Test 3: Get Invitation Details (Public Endpoint)")

        # Remove auth token temporarily (public endpoint)
        original_auth = self.session.headers.get("Authorization")
        self.session.headers.pop("Authorization", None)

        response = self.session.get(
            f"{API_BASE_URL}/invitations/details",
            params={"token": self.invitation_token}
        )

        # Restore auth token
        if original_auth:
            self.session.headers["Authorization"] = original_auth

        self.print_response(response)

        if response.status_code == 200:
            data = response.json()
            self.print_success(f"Invitation details retrieved successfully")
            self.print_success(f"Resource type: {data.get('resource_type')}")
            self.print_success(f"Resource name: {data.get('resource_name')}")
            self.print_success(f"Role: {data.get('invited_role')}")
            self.print_success(f"Is expired: {data.get('is_expired')}")
            return True
        else:
            self.print_error("Failed to get invitation details")
            return False

    def test_accept_invitation(self):
        """Test accepting an invitation"""
        self.print_step("Test 4: Accept Invitation")

        # First, register and login as invitee
        print("Registering invitee user...")
        invitee_id = self.register_user(
            TEST_INVITEE_EMAIL,
            TEST_INVITEE_PASSWORD,
            "test_invitee"
        )

        if not invitee_id:
            self.print_error("Failed to register invitee user")
            return False

        self.invitee_user_id = invitee_id
        self.print_success(f"Invitee registered: {invitee_id}")

        print("Logging in as invitee...")
        invitee_token = self.login(TEST_INVITEE_EMAIL, TEST_INVITEE_PASSWORD)

        if not invitee_token:
            self.print_error("Failed to login as invitee")
            return False

        self.print_success("Invitee logged in successfully")

        # Accept the invitation
        response = self.session.post(
            f"{API_BASE_URL}/invitations/accept",
            params={"token": self.invitation_token}
        )

        self.print_response(response)

        if response.status_code == 200:
            data = response.json()
            self.print_success("Invitation accepted successfully!")
            self.print_success(f"Status: {data.get('status')}")
            self.print_success(f"Accepted at: {data.get('accepted_at')}")
            return True
        else:
            self.print_error("Failed to accept invitation")
            return False

    def test_resend_invitation(self):
        """Test resending an invitation"""
        self.print_step("Test 5: Resend Invitation")

        # First, create a new invitation for testing resend
        # Login back as inviter
        self.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)

        # Create new invitation
        response = self.session.post(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations",
            json={
                "email": "resend_test@example.com",
                "resource_type": "organization",
                "resource_id": self.organization_id,
                "role": "member"
            }
        )

        if response.status_code != 201:
            self.print_error("Failed to create test invitation for resend")
            return False

        test_invitation_id = response.json().get("id")
        self.print_success(f"Created test invitation: {test_invitation_id}")

        # Resend the invitation
        response = self.session.post(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations/{test_invitation_id}/resend"
        )

        self.print_response(response)

        if response.status_code == 200:
            data = response.json()
            self.print_success("Invitation resent successfully!")
            self.print_success(f"New token generated: {data.get('token')[:20]}...")
            return True
        else:
            self.print_error("Failed to resend invitation")
            return False

    def test_cancel_invitation(self):
        """Test canceling an invitation"""
        self.print_step("Test 6: Cancel Invitation")

        # Create new invitation for testing cancel
        response = self.session.post(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations",
            json={
                "email": "cancel_test@example.com",
                "resource_type": "organization",
                "resource_id": self.organization_id,
                "role": "member"
            }
        )

        if response.status_code != 201:
            self.print_error("Failed to create test invitation for cancel")
            return False

        test_invitation_id = response.json().get("id")
        self.print_success(f"Created test invitation: {test_invitation_id}")

        # Cancel the invitation
        response = self.session.delete(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations/{test_invitation_id}"
        )

        if response.status_code == 204:
            self.print_success("Invitation cancelled successfully!")
            return True
        else:
            self.print_response(response)
            self.print_error("Failed to cancel invitation")
            return False

    def test_error_cases(self):
        """Test error cases"""
        self.print_step("Test 7: Error Cases")

        # Test 1: Invalid token
        print("\n7a. Testing invalid token...")
        response = self.session.get(
            f"{API_BASE_URL}/invitations/details",
            params={"token": "invalid_token_123"}
        )
        if response.status_code == 404:
            self.print_success("Invalid token correctly rejected (404)")
        else:
            self.print_error(f"Invalid token test failed (expected 404, got {response.status_code})")

        # Test 2: Duplicate invitation
        print("\n7b. Testing duplicate invitation...")
        response = self.session.post(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations",
            json={
                "email": TEST_INVITEE_EMAIL,  # Already a member
                "resource_type": "organization",
                "resource_id": self.organization_id,
                "role": "member"
            }
        )
        if response.status_code == 400:
            self.print_success("Duplicate invitation correctly rejected (400)")
        else:
            self.print_error(f"Duplicate invitation test failed (expected 400, got {response.status_code})")

        # Test 3: Invalid role
        print("\n7c. Testing invalid role...")
        response = self.session.post(
            f"{API_BASE_URL}/orgs/{self.organization_id}/invitations",
            json={
                "email": "invalid_role@example.com",
                "resource_type": "organization",
                "resource_id": self.organization_id,
                "role": "superadmin"  # Invalid role
            }
        )
        if response.status_code == 422:
            self.print_success("Invalid role correctly rejected (422)")
        else:
            self.print_error(f"Invalid role test failed (expected 422, got {response.status_code})")

        return True

    def run_all_tests(self):
        """Run all invitation flow tests"""
        print("\n" + "=" * 80)
        print("INVITATION SYSTEM - BACKEND END-TO-END TEST")
        print("=" * 80)

        # Setup: Register and login inviter
        self.print_step("Setup: Register and Login Inviter")
        self.inviter_user_id = self.register_user(
            TEST_USER_EMAIL,
            TEST_USER_PASSWORD,
            "test_inviter"
        )

        if not self.inviter_user_id:
            self.print_error("Failed to register inviter user")
            return False

        self.print_success(f"Inviter registered: {self.inviter_user_id}")

        self.access_token = self.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        if not self.access_token:
            self.print_error("Failed to login")
            return False

        self.print_success("Inviter logged in successfully")

        # Setup: Create organization
        self.print_step("Setup: Create Test Organization")
        self.organization_id = self.create_organization("Test Organization")

        if not self.organization_id:
            self.print_error("Failed to create organization")
            return False

        self.print_success(f"Organization created: {self.organization_id}")

        # Run tests
        test_results = {
            "Create Invitation": self.test_create_invitation(),
            "List Invitations": self.test_list_invitations(),
            "Get Invitation Details": self.test_get_invitation_details(),
            "Accept Invitation": self.test_accept_invitation(),
            "Resend Invitation": self.test_resend_invitation(),
            "Cancel Invitation": self.test_cancel_invitation(),
            "Error Cases": self.test_error_cases(),
        }

        # Print summary
        self.print_step("TEST SUMMARY")
        print(f"\nTotal Tests: {len(test_results)}")
        passed = sum(1 for result in test_results.values() if result)
        failed = len(test_results) - passed

        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")

        print("\nDetailed Results:")
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status}: {test_name}")

        print("\n" + "=" * 80)
        if failed == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {failed} TEST(S) FAILED")
        print("=" * 80 + "\n")

        return failed == 0


if __name__ == "__main__":
    tester = InvitationFlowTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)

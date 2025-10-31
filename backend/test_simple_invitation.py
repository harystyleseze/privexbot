#!/usr/bin/env python3
"""
Simple invitation creation test to debug 500 error
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000/api/v1"

# Login
print("Logging in...")
login_response = requests.post(
    f"{API_BASE_URL}/auth/email/login",
    json={
        "email": "test_inviter@example.com",
        "password": "TestPassword123!"
    }
)

print(f"Login status: {login_response.status_code}")
if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json().get("access_token")
print(f"✅ Logged in successfully")

# Get user's organization
print("\nGetting organizations...")
orgs_response = requests.get(
    f"{API_BASE_URL}/orgs/",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Orgs status: {orgs_response.status_code}")
if orgs_response.status_code != 200:
    print(f"Failed to get orgs: {orgs_response.text}")
    exit(1)

orgs_data = orgs_response.json()
if not orgs_data.get("organizations"):
    print("No organizations found")
    exit(1)

org_id = orgs_data["organizations"][0]["id"]
print(f"✅ Found organization: {org_id}")

# Create invitation
print("\nCreating invitation...")
invitation_response = requests.post(
    f"{API_BASE_URL}/orgs/{org_id}/invitations",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "email": f"test_new_{int(time.time())}@example.com",
        "resource_type": "organization",
        "resource_id": org_id,
        "role": "admin"
    }
)

print(f"Invitation status: {invitation_response.status_code}")
print(f"Response: {invitation_response.text}")

if invitation_response.status_code == 201:
    print("✅ Invitation created successfully!")
    print(json.dumps(invitation_response.json(), indent=2))
else:
    print("❌ Failed to create invitation")

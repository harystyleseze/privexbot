#!/usr/bin/env python3
"""
Direct test of invitation service to isolate the error
"""

import sys
sys.path.insert(0, '/Users/user/Downloads/privexbot/privexbot-mvp/privexbot/backend/src')

from app.db.session import get_db
from app.services import invitation_service
from app.models.user import User
from app.models.organization import Organization
from uuid import UUID
import traceback

# Get DB session
db = next(get_db())

try:
    # Get test user and organization
    test_user = db.query(User).filter(User.email == "test_inviter@example.com").first()
    if not test_user:
        print("❌ Test user not found")
        exit(1)

    print(f"✅ Found test user: {test_user.id}")

    test_org = db.query(Organization).first()
    if not test_org:
        print("❌ No organization found")
        exit(1)

    print(f"✅ Found test organization: {test_org.id}")

    # Try to create invitation
    print("\nCreating invitation...")
    invitation = invitation_service.create_invitation(
        db=db,
        email="direct_test@example.com",
        resource_type="organization",
        resource_id=test_org.id,
        invited_role="admin",
        inviter_id=test_user.id,
        frontend_url="http://localhost:5173"
    )

    print(f"✅ Invitation created successfully!")
    print(f"Invitation ID: {invitation.id}")
    print(f"Invitation token: {invitation.token[:20]}...")
    print(f"Invitation email: {invitation.email}")
    print(f"Invitation status: {invitation.status}")

except Exception as e:
    print(f"❌ Error creating invitation:")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
finally:
    db.close()

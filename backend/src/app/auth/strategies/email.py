"""
Email/password authentication strategy.

WHY:
- Traditional username/password login
- Most common authentication method
- Secure password storage with hashing

HOW:
- Hash passwords with bcrypt
- Verify credentials on login
- Create/link to user account

PSEUDOCODE:
-----------
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.models.auth_identity import AuthIdentity

async def signup_with_email(
    email: str,
    password: str,
    username: str,
    db: Session
) -> User:
    \"\"\"
    WHY: Create new user with email/password
    HOW: Create User and AuthIdentity records

    Returns: User object
    Raises: HTTPException if email already exists
    \"\"\"

    # Step 1: Check if email already registered
    existing = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "email",
        AuthIdentity.provider_id == email
    ).first()

    if existing:
        raise HTTPException(400, "Email already registered")
        WHY: Prevent duplicate accounts

    # Step 2: Create user
    user = User(username=username, is_active=True)
    db.add(user)
    db.flush()  # Get user.id without committing
        WHY: Need user.id for auth_identity.user_id

    # Step 3: Hash password and create auth identity
    password_hash = hash_password(password)
        WHY: NEVER store plain text passwords
        HOW: Uses bcrypt with salt

    auth_identity = AuthIdentity(
        user_id=user.id,
        provider="email",
        provider_id=email,  # The email is the unique identifier
        data={
            "password_hash": password_hash,
            "email_verified": False  # For future email verification
        }
    )
    db.add(auth_identity)
    db.commit()

    return user


async def login_with_email(
    email: str,
    password: str,
    db: Session
) -> User:
    \"\"\"
    WHY: Authenticate user with email/password
    HOW: Verify password against stored hash

    Returns: User object if valid
    Raises: HTTPException if invalid credentials
    \"\"\"

    # Step 1: Find auth identity
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "email",
        AuthIdentity.provider_id == email
    ).first()

    if not auth_identity:
        raise HTTPException(401, "Invalid credentials")
            WHY: Don't reveal if email exists (security)

    # Step 2: Get user
    user = db.query(User).filter(User.id == auth_identity.user_id).first()

    if not user or not user.is_active:
        raise HTTPException(401, "Invalid credentials")
            WHY: Reject inactive users

    # Step 3: Verify password
    password_hash = auth_identity.data.get("password_hash")
    if not verify_password(password, password_hash):
        raise HTTPException(401, "Invalid credentials")
            WHY: Wrong password
            HOW: verify_password uses bcrypt comparison

    return user


async def change_password(
    user_id: UUID,
    old_password: str,
    new_password: str,
    db: Session
) -> bool:
    \"\"\"
    WHY: Allow users to change their password
    HOW: Verify old password, update to new hash
    \"\"\"

    # Find email auth identity for this user
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == user_id,
        AuthIdentity.provider == "email"
    ).first()

    if not auth_identity:
        raise HTTPException(400, "No email auth method found")

    # Verify old password
    old_hash = auth_identity.data.get("password_hash")
    if not verify_password(old_password, old_hash):
        raise HTTPException(401, "Current password is incorrect")

    # Update to new password
    new_hash = hash_password(new_password)
    auth_identity.data["password_hash"] = new_hash
    db.commit()

    return True
        WHY: Return success indicator


SECURITY NOTES:
---------------
WHY bcrypt:
    - Slow by design (prevents brute force)
    - Automatic salting (prevents rainbow tables)
    - Industry standard

WHY hash on signup:
    - Never store passwords in plain text
    - Even DB admins can't see passwords

WHY same error for email/password:
    - Don't reveal if email exists
    - Prevents user enumeration attacks
"""

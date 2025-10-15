# Database Migrations - Complete Guide for PrivexBot

**Date**: October 2024
**Status**: Educational + Troubleshooting Guide

---

## 🎯 What Are Database Migrations?

**Simple Answer**: Migrations are **version control for your database schema** (structure, not data).

Think of migrations like Git commits, but for your database structure:

- Git tracks changes to your **code**
- Migrations track changes to your **database tables/columns**

### What Migrations Do:

✅ Create/modify/delete database tables
✅ Add/remove/modify columns
✅ Create indexes for performance
✅ Add constraints (foreign keys, unique constraints)
✅ Track which changes have been applied
✅ Allow you to upgrade OR downgrade your schema

### What Migrations DON'T Do:

❌ Copy entire databases
❌ Transfer data between databases
❌ Backup your data
❌ Duplicate databases

---

## 🔍 How Migrations Work in PrivexBot

### Tools Used:

- **Alembic**: Python migration tool (works with SQLAlchemy)
- **PostgreSQL**: Our database
- **Docker**: Containerized environment

### Migration Workflow:

```
┌─────────────────────────────────────────────────────────────┐
│ DEVELOPMENT (Your Computer)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. You define models in code:                              │
│     class User(Base):                                        │
│         __tablename__ = "users"                              │
│         id = Column(UUID, primary_key=True)                  │
│         username = Column(String, unique=True)               │
│                                                              │
│  2. Generate migration:                                      │
│     $ alembic revision --autogenerate -m "add users table"   │
│     → Creates: alembic/versions/abc123_add_users_table.py   │
│                                                              │
│  3. Review generated migration:                              │
│     def upgrade():                                           │
│         op.create_table('users',                            │
│             sa.Column('id', sa.UUID(), nullable=False),     │
│             sa.Column('username', sa.String(), ...)         │
│         )                                                    │
│                                                              │
│  4. Apply migration locally:                                 │
│     $ alembic upgrade head                                   │
│     → Database now has 'users' table                         │
│                                                              │
│  5. Commit migration file to Git                             │
│     $ git add alembic/versions/abc123_add_users_table.py    │
│     $ git commit -m "Add users table migration"              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                            ↓ Git Push

┌─────────────────────────────────────────────────────────────┐
│ PRODUCTION (SecretVM)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Pull latest code (includes migration files)              │
│                                                              │
│  2. Docker container starts                                  │
│                                                              │
│  3. Entrypoint script runs:                                  │
│     $ alembic upgrade head                                   │
│     → Checks: Which migrations are already applied?          │
│     → Finds: abc123_add_users_table.py not applied yet       │
│     → Runs: Creates 'users' table in production database     │
│     → Marks: abc123 as applied in alembic_version table      │
│                                                              │
│  4. Server starts with correct database structure             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 How Alembic Tracks Applied Migrations

Alembic creates a special table called `alembic_version`:

```sql
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
```

**Example data:**

```
version_num
─────────────────────
3c4e4feca860
```

This tells Alembic: "Migration 3c4e4feca860 has already been applied."

When you run `alembic upgrade head`:

1. Alembic reads all migration files in `alembic/versions/`
2. Checks `alembic_version` table to see which are already applied
3. Runs only the new migrations
4. Updates `alembic_version` table

---

## 🏗️ Migration File Structure

**Location**: `backend/src/alembic/versions/`

**Example**: `3c4e4feca860_add_user_and_authidentity_tables_for_.py`

```python
"""Add User and AuthIdentity tables for authentication

Revision ID: 3c4e4feca860
Revises: None              # This is the first migration
Create Date: 2025-10-13 01:18:49.070203
"""

def upgrade() -> None:
    """Upgrade schema (apply this migration)."""
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # Create auth_identities table
    op.create_table('auth_identities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        ...
    )

def downgrade() -> None:
    """Downgrade schema (undo this migration)."""
    op.drop_table('auth_identities')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_table('users')
```

---

## 🔄 Dev vs Production: How It Works

### Development Environment (`docker-compose.dev.yml`)

**Database**: `privexbot_dev` (separate from production)

**Workflow:**

```bash
# 1. Start dev environment
docker compose -f docker-compose.dev.yml up

# Container starts → entrypoint script runs:
echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head  # ← Applies migrations to privexbot_dev

echo "🚀 Starting uvicorn server..."
uvicorn app.main:app --reload
```

**What happens:**

- Fresh database → All migrations run → Tables created
- Existing database → Only new migrations run → Schema updated
- **Data preserved**: Only structure changes, your test data stays

### Production Environment (`docker-compose.secretvm.yml`)

**Database**: `privexbot` (production data)

**Workflow:**

```bash
# 1. Deploy to SecretVM
docker compose up -d

# Container starts → entrypoint script runs:
echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head  # ← Applies migrations to privexbot

echo "🚀 Starting production server..."
gunicorn src.app.main:app --workers 4
```

**What happens:**

- First deployment → All migrations run → Tables created
- Update deployment → Only new migrations run → Schema updated
- **Production data preserved**: Migrations don't delete data

---

## 🚨 Your Current Issue: Migration Hanging on SecretVM

### Symptoms:

```
Oct 14 11:46:54 privexbot-backend-secretvm: 🔄 Running database migrations...
Oct 14 11:47:48 privexbot-backend-secretvm: 🔄 Running database migrations...
Oct 14 11:48:51 privexbot-backend-secretvm: 🔄 Running database migrations...
```

Container keeps restarting, never gets past migrations.

### Root Cause Analysis:

**Problem 1: Variable Substitution in .env File**

Your `.env.secretvm.local` file (line 13):

```bash
DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@postgres:5432/privexbot
```

**Issue**: The `${POSTGRES_PASSWORD}` is NOT expanded in .env files!

Python's pydantic reads this literally as:

```
Password = "${POSTGRES_PASSWORD}"  # Wrong! This is the literal string
```

So it tries to connect with password `${POSTGRES_PASSWORD}` instead of `PW`.

**Problem 2: Limited Error Output**

The entrypoint script doesn't show detailed errors, so you can't see:

```
ERROR: FATAL: password authentication failed for user "privexbot"
```

### Solutions:

#### Solution 1: Fix .env File (Hard-code Password)

**Update `.env.secretvm.local` line 13:**

```bash
# Before (WRONG)
DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@postgres:5432/privexbot

# After (CORRECT)
DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot
```

**Why this works:**

- Docker Compose expands variables in `environment:` section
- But Python reads .env file directly and doesn't expand variables
- Hard-coding makes it consistent

#### Solution 2: Improve Entrypoint Script Error Handling

Update the entrypoint script to show detailed errors when migrations fail.

---

## 🛠️ Common Migration Scenarios

### Scenario 1: Adding a New Column

**Code change:**

```python
# app/models/user.py
class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String)  # ← NEW COLUMN
```

**Generate migration:**

```bash
cd backend/src
alembic revision --autogenerate -m "add email to users"
```

**What happens:**

- Alembic detects new `email` column
- Creates migration file with `op.add_column('users', sa.Column('email', ...))`
- Next deployment: Column added to existing `users` table
- **Existing user records**: email column will be NULL (unless you set a default)

### Scenario 2: Modifying a Column

**Code change:**

```python
# Change username from String to String(100)
username = Column(String(100), unique=True)  # Added max length
```

**Migration:**

```python
def upgrade():
    op.alter_column('users', 'username',
                    type_=sa.String(100),
                    existing_type=sa.String())
```

**What happens:**

- Alters column type
- **Data preserved**: Existing usernames stay
- Validation: If any username > 100 chars, migration fails (you'd need to clean data first)

### Scenario 3: Fresh Database (First Deployment)

**Empty database:**

```
alembic upgrade head
→ Runs ALL migration files in order
→ Creates all tables from scratch
→ Database ready for use
```

### Scenario 4: Database Already Has Some Migrations

**Existing database** with migration `abc123` applied:

```
alembic upgrade head
→ Checks alembic_version table: abc123 is already applied
→ Finds new migration: def456
→ Runs only def456
→ Updates alembic_version with def456
```

---

## ⚙️ Configuration Files

### 1. `alembic.ini`

Location: `backend/src/alembic.ini`

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

# Default connection (overridden by env.py)
sqlalchemy.url = postgresql://user:pass@localhost/db
```

### 2. `alembic/env.py`

Location: `backend/src/alembic/env.py`

```python
from app.core.config import settings
from app.db.base import Base

# Override sqlalchemy.url with DATABASE_URL from environment
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set target_metadata to detect model changes
target_metadata = Base.metadata
```

**This is critical:**

- `settings.DATABASE_URL` comes from .env file
- `Base.metadata` includes all your models
- If DATABASE_URL is wrong, migrations can't connect

### 3. `app/db/base.py`

Location: `backend/src/app/db/base.py`

```python
from app.db.base_class import Base

# Import all models here so Alembic can detect them
from app.models.user import User
from app.models.auth_identity import AuthIdentity
```

**Important:** Every model MUST be imported here for autogenerate to work.

---

## 🔍 Debugging Migrations

### Check Current Migration Status

```bash
# Inside container
docker exec -it privexbot-backend-secretvm bash
cd /app/src

# Show current migration
alembic current

# Expected output:
# 3c4e4feca860 (head)

# If empty, no migrations have been applied yet
```

### Check Migration History

```bash
alembic history

# Output:
# 3c4e4feca860 -> (head), Add User and AuthIdentity tables for authentication
```

### Test Database Connection

```bash
# Inside container
python -c "
from app.core.config import settings
print('DATABASE_URL:', settings.DATABASE_URL)
"

# Should show:
# DATABASE_URL: postgresql://privexbot:PW@postgres:5432/privexbot
```

### Run Migration Manually with Verbose Output

```bash
# Inside container
cd /app/src
alembic upgrade head --sql  # Show SQL without executing
alembic upgrade head -v      # Verbose output
```

### Check PostgreSQL Directly

```bash
# Connect to database
docker exec -it privexbot-postgres-secretvm psql -U privexbot -d privexbot

# Check if alembic_version table exists
\dt

# Check applied migrations
SELECT * FROM alembic_version;

# Check if users table exists
\d users

# Exit
\q
```

---

## 📝 Migration Best Practices

### 1. Always Review Generated Migrations

```bash
# After generating
alembic revision --autogenerate -m "description"

# Review the file before applying
cat alembic/versions/abc123_description.py
```

Sometimes Alembic generates incorrect migrations (e.g., tries to drop and recreate indexes unnecessarily).

### 2. Test Migrations Locally First

```bash
# Test upgrade
alembic upgrade head

# Test downgrade
alembic downgrade -1

# Test upgrade again
alembic upgrade head
```

### 3. Backup Before Running Migrations in Production

```bash
# Backup database
docker exec privexbot-postgres pg_dump -U privexbot privexbot > backup.sql

# Run migration
alembic upgrade head

# If something goes wrong, restore
docker exec -i privexbot-postgres psql -U privexbot privexbot < backup.sql
```

### 4. Keep Migrations Small and Focused

```bash
# Good
alembic revision -m "add email to users"
alembic revision -m "add organizations table"

# Bad
alembic revision -m "add 10 new features and refactor everything"
```

### 5. Never Edit Applied Migrations

Once a migration is applied in production, never edit it. Create a new migration instead.

---

## 🚀 Complete Development Workflow

### Starting a New Feature

```bash
# 1. Create/modify models
vim app/models/organization.py

# 2. Import model in base.py
vim app/db/base.py
# Add: from app.models.organization import Organization

# 3. Generate migration
cd src
alembic revision --autogenerate -m "add organizations table"

# 4. Review migration
cat alembic/versions/def456_add_organizations_table.py

# 5. Apply locally
alembic upgrade head

# 6. Test your feature
pytest

# 7. Commit
git add alembic/versions/def456_add_organizations_table.py
git add app/models/organization.py
git add app/db/base.py
git commit -m "feat: add organizations model and migration"

# 8. Push and deploy
git push
# Migrations will run automatically on next deployment
```

---

## 🎯 Summary: What Migrations Actually Do

### For Development:

1. You write models in Python (tables, columns, relationships)
2. Alembic generates SQL commands from your models
3. Migrations run SQL to create/modify database structure
4. Your database schema matches your code

### For Production:

1. New code deployed (includes new migration files)
2. Container starts
3. Entrypoint runs `alembic upgrade head`
4. Only NEW migrations execute (old ones are skipped)
5. Database schema is updated
6. **Your data is preserved** (migrations only change structure)
7. Server starts with correct schema

### Key Takeaway:

**Migrations DO NOT:**

- Copy databases
- Duplicate data
- Create backups
- Transfer data between databases

**Migrations DO:**

- Version control your database structure
- Keep dev and production schemas in sync
- Allow safe, trackable schema updates
- Preserve data while changing structure

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Status**: Educational + Troubleshooting Guide

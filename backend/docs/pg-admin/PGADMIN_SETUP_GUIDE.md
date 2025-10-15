# PgAdmin Setup and Usage Guide

**Version**: 1.0
**Date**: 2025-10-15
**Status**: ✅ Production Ready

---

## Overview

This guide shows you how to access and use PgAdmin to manage your PostgreSQL database on SecretVM.

**PgAdmin Access**:

- **URL**: https://pgadmin.harystyles.store
- **Email**: privexbot@gmail.com
- **Password**: (from `PGADMIN_PASSWORD` in .env)

---

## Table of Contents

1. [First-Time Login](#first-time-login)
2. [Adding Your Database Server](#adding-your-database-server)
3. [Viewing Your Data](#viewing-your-data)
4. [Common Operations](#common-operations)
5. [Troubleshooting](#troubleshooting)

---

## First-Time Login

### Step 1: Access PgAdmin

1. Open your browser and navigate to: **https://pgadmin.harystyles.store**
2. You should see the PgAdmin login page

### Step 2: Login

Enter your credentials:

- **Email Address / Username**: `privexbot@gmail.com`
- **Password**: ``

Click **Login**

### Step 3: Welcome Screen

After successful login, you'll see the PgAdmin dashboard with:

- Left sidebar: "Browser" panel (currently empty)
- Main area: Welcome screen with quick links
- Top menu: Tools and options

---

## Adding Your Database Server

### Step 1: Register New Server

1. In the left sidebar, **right-click on "Servers"**
2. Select **"Register" → "Server..."**

A dialog box will appear with multiple tabs.

### Step 2: General Tab

Fill in the **General** tab:

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **Name**         | `PrivexBot Production`                       |
| **Server Group** | Servers (default)                            |
| **Connect now?** | ✓ (checked)                                  |
| **Comments**     | (optional) Production database for PrivexBot |

### Step 3: Connection Tab

Fill in the **Connection** tab:

| Field                    | Value       | Notes                     |
| ------------------------ | ----------- | ------------------------- |
| **Host name/address**    | `postgres`  | Docker container name     |
| **Port**                 | `5432`      | Default PostgreSQL port   |
| **Maintenance database** | `privexbot` | Your database name        |
| **Username**             | `privexbot` | Database user             |
| **Password**             | `ggj`       | From POSTGRES_PASSWORD    |
| **Save password?**       | ✓ (checked) | Convenient for future use |

**Important Notes**:

- The **hostname is `postgres`** (not `localhost` or IP address) because we're connecting from within Docker network
- All containers in the `traefik` network can resolve each other by container name
- This is internal connectivity - PostgreSQL is not exposed to the internet

### Step 4: Save Configuration

Click the **Save** button at the bottom of the dialog.

### Step 5: Verify Connection

You should now see in the left sidebar:

```
Servers
└─ PrivexBot Production
    ├─ Databases (1)
    ├─ Login/Group Roles
    └─ Tablespaces
```

If you see this, **congratulations!** You're connected to your database.

---

## Viewing Your Data

### Step 1: Navigate to Your Database

Expand the tree in the left sidebar:

```
Servers
└─ PrivexBot Production
    └─ Databases
        └─ privexbot ← Click here
            └─ Schemas
                └─ public ← Expand this
                    └─ Tables ← Your tables are here
```

### Step 2: View Tables

You should see these tables (from authentication implementation):

- **users** - User accounts
- **auth_identities** - Authentication providers (email, wallet addresses)
- **alembic_version** - Database migration tracking

### Step 3: View Table Data

To see the data in a table:

1. **Right-click** on the table name (e.g., `users`)
2. Select **"View/Edit Data" → "All Rows"**

A new tab opens showing:

- **Column headers** with data types
- **All rows** in the table
- **Filter toolbar** for searching/filtering data

### Step 4: View Your User Account

After signing up via the API (`/api/v1/auth/email/signup`), you can see your user:

1. Right-click on **users** table
2. Select **"View/Edit Data" → "All Rows"**

You'll see columns:

- `id` - UUID primary key
- `username` - Your username
- `is_active` - Account status (true/false)
- `created_at` - When account was created
- `updated_at` - Last update timestamp

### Step 5: View Authentication Identities

1. Right-click on **auth_identities** table
2. Select **"View/Edit Data" → "All Rows"**

You'll see:

- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `provider` - "email" or "evm" or "solana" or "cosmos"
- `provider_id` - Email address or wallet address
- `data` - JSON with additional provider-specific data (hashed password for email)
- `created_at`, `updated_at` - Timestamps

---

## Common Operations

### Query Tool

Execute custom SQL queries:

1. Right-click on your database (`privexbot`)
2. Select **"Query Tool"**
3. Write your SQL query in the editor
4. Click the **Play** button (▶) or press **F5**

**Example queries:**

```sql
-- Count total users
SELECT COUNT(*) FROM users;

-- View all active users
SELECT username, created_at
FROM users
WHERE is_active = true
ORDER BY created_at DESC;

-- Join users with their auth identities
SELECT
    u.username,
    ai.provider,
    ai.provider_id,
    u.created_at
FROM users u
JOIN auth_identities ai ON u.id = ai.user_id
ORDER BY u.created_at DESC;

-- Check current migration version
SELECT * FROM alembic_version;
```

### Refresh Data

If data doesn't update after API calls:

1. Right-click on **Tables**
2. Select **"Refresh"**
3. Or use the refresh icon in the toolbar

### Export Data

To export table data:

1. Right-click on the table
2. Select **"Import/Export Data..."**
3. Choose format (CSV, JSON, etc.)
4. Set file location and options
5. Click **OK**

### View Table Structure

To see table schema:

1. Right-click on the table
2. Select **"Properties"**
3. Navigate to **"Columns"** tab to see all columns and their types

### Create Backup

To backup your database:

1. Right-click on **privexbot** database
2. Select **"Backup..."**
3. Choose filename and format
4. Click **Backup**

**Note**: For production, use `pg_dump` via command line for more reliable backups.

---

## Database Schema Overview

### Users Table

| Column       | Type         | Description           |
| ------------ | ------------ | --------------------- |
| `id`         | UUID         | Primary key           |
| `username`   | VARCHAR(255) | Unique username       |
| `is_active`  | BOOLEAN      | Account active status |
| `created_at` | TIMESTAMP    | Account creation time |
| `updated_at` | TIMESTAMP    | Last update time      |

**Indexes**:

- `ix_users_username` - Unique index on username

### Auth Identities Table

| Column        | Type         | Description                        |
| ------------- | ------------ | ---------------------------------- |
| `id`          | UUID         | Primary key                        |
| `user_id`     | UUID         | Foreign key to users.id            |
| `provider`    | VARCHAR(50)  | "email", "evm", "solana", "cosmos" |
| `provider_id` | VARCHAR(255) | Email or wallet address            |
| `data`        | JSONB        | Provider-specific data             |
| `created_at`  | TIMESTAMP    | Identity creation time             |
| `updated_at`  | TIMESTAMP    | Last update time                   |

**Indexes**:

- `ix_auth_identities_user_id` - Index on user_id for joins
- `ix_auth_identities_provider_id` - Index on provider_id for lookups
- `uq_provider_provider_id` - Unique constraint on (provider, provider_id)

**Relationships**:

- `user_id` references `users(id)` with `ON DELETE CASCADE`
- One user can have multiple auth identities

---

## Security Best Practices

### ✅ Do's

1. **Keep PgAdmin credentials secure**

   - Don't share login credentials
   - Use strong passwords

2. **Use Read-Only queries for viewing**

   - Use SELECT queries to view data
   - Avoid UPDATE/DELETE unless necessary

3. **Regular backups**

   - Backup before making schema changes
   - Keep backups in secure location

4. **Audit sensitive operations**
   - Log any direct database modifications
   - Use API for normal operations when possible

### ❌ Don'ts

1. **Don't expose PgAdmin publicly**

   - PgAdmin is behind Traefik authentication
   - Don't share the PgAdmin URL publicly

2. **Don't modify data directly**

   - Use the API for data operations
   - Direct modifications bypass application logic

3. **Don't delete alembic_version table**

   - This table tracks migrations
   - Deleting it will break migration system

4. **Don't modify passwords in auth_identities**
   - Passwords are hashed
   - Direct modifications will break authentication

---

## Troubleshooting

### Issue: Can't Login to PgAdmin

**Symptoms**: Login page shows "Invalid email or password"

**Solutions**:

1. **Verify credentials**:

   - Email: `privexbot@gmail.com`
   - Password: ``

2. **Check if PgAdmin initialized correctly**:

   ```bash
   docker logs privexbot-pgadmin-secretvm | grep -i error
   ```

3. **Reset PgAdmin** (if credentials changed):
   - Stop PgAdmin container
   - Delete PgAdmin volume
   - Restart to reinitialize with correct password

### Issue: Can't Connect to Database Server

**Symptoms**: "could not connect to server" error when adding server

**Solutions**:

1. **Check PostgreSQL is running**:

   ```bash
   docker ps | grep postgres
   ```

2. **Verify database credentials**:

   - Username: `privexbot`
   - Password: `dg`
   - Database: `privexbot`

3. **Check hostname is correct**:

   - Use `postgres` (container name), not `localhost`
   - All containers must be on same network (`traefik`)

4. **Test database connection**:
   ```bash
   docker exec -it privexbot-postgres-secretvm \
     psql -U privexbot -d privexbot -c "SELECT 1;"
   ```

### Issue: No Tables Visible

**Symptoms**: Database connected but no tables shown

**Solutions**:

1. **Refresh the tables list**:

   - Right-click on "Tables"
   - Select "Refresh"

2. **Check migrations ran**:

   ```bash
   docker exec -it privexbot-postgres-secretvm \
     psql -U privexbot -d privexbot -c "\dt"
   ```

3. **Verify alembic_version**:

   ```bash
   docker exec -it privexbot-postgres-secretvm \
     psql -U privexbot -d privexbot \
     -c "SELECT * FROM alembic_version;"
   ```

   Should show: `3c4e4feca860`

4. **Check backend logs for migration errors**:
   ```bash
   docker logs privexbot-backend-secretvm | grep -i migration
   ```

### Issue: PgAdmin Redirect Loop

**Symptoms**: Keeps redirecting between login page and dashboard

**Solution**: This was fixed in v0.1.1 with proxy configuration. Ensure you're using the latest docker-compose.secretvm.yml with:

```yaml
environment:
  - PGADMIN_CONFIG_PROXY_X_FOR_COUNT=1
  - PGADMIN_CONFIG_PROXY_X_PROTO_COUNT=1
  - PGADMIN_CONFIG_PROXY_X_HOST_COUNT=1
  - PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION=False
```

### Issue: Slow Query Performance

**Solutions**:

1. **Add indexes** on frequently queried columns
2. **Use EXPLAIN** to analyze query plans
3. **Limit result sets** with LIMIT clause
4. **Check PostgreSQL logs** for slow queries

---

## Advanced Features

### Creating Database Roles

For additional security, create read-only roles:

```sql
-- Create read-only role
CREATE ROLE readonly_user LOGIN PASSWORD 'secure_password';

-- Grant connect permission
GRANT CONNECT ON DATABASE privexbot TO readonly_user;

-- Grant select on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Grant select on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO readonly_user;
```

### Monitoring Database Size

Check database size:

```sql
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'privexbot';
```

Check table sizes:

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Setting Up Query Favorites

Save frequently used queries:

1. Write your query in Query Tool
2. Click **"Save"** icon
3. Name your query
4. Access later from **"Manage Macros"**

---

## Integration with Your Application

### Verifying User Signup

After a user signs up via `/api/v1/auth/email/signup`:

1. Open PgAdmin
2. Navigate to `users` table
3. View all rows
4. You should see the new user with:

   - Generated UUID
   - Chosen username
   - `is_active = true`
   - Current timestamp in `created_at`

5. Check `auth_identities` table:
   - `provider = 'email'`
   - `provider_id = user's email`
   - `data` contains hashed password

### Debugging Authentication Issues

If login fails, check:

```sql
-- Find user by username
SELECT * FROM users WHERE username = 'target_username';

-- Find associated auth identity
SELECT ai.*
FROM auth_identities ai
JOIN users u ON ai.user_id = u.id
WHERE u.username = 'target_username';

-- Check if user is active
SELECT username, is_active
FROM users
WHERE username = 'target_username';
```

### Monitoring User Activity

```sql
-- Recent signups
SELECT username, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Users by authentication provider
SELECT
    ai.provider,
    COUNT(*) as user_count
FROM auth_identities ai
GROUP BY ai.provider;

-- Total users
SELECT COUNT(*) FROM users WHERE is_active = true;
```

---

## Security Checklist

Before using PgAdmin in production:

- [ ] PgAdmin accessible only via HTTPS (Traefik TLS)
- [ ] Strong password set for PgAdmin login
- [ ] PostgreSQL not exposed to public internet (internal only)
- [ ] Database credentials are strong and unique
- [ ] Regular backups configured
- [ ] Read-only queries preferred for data viewing
- [ ] API used for all normal data operations
- [ ] PgAdmin access restricted to authorized personnel
- [ ] Audit logs enabled for sensitive operations

---

## Quick Reference

### Connection Details

| Parameter         | Value                            |
| ----------------- | -------------------------------- |
| PgAdmin URL       | https://pgadmin.harystyles.store |
| PgAdmin Email     | privexbot@gmail.com              |
| PgAdmin Password  | Ebuka2025                        |
| Database Host     | postgres                         |
| Database Port     | 5432                             |
| Database Name     | privexbot                        |
| Database User     | privexbot                        |
| Database Password | Ebuka2025                        |

### Useful SQL Queries

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count records in each table
SELECT
    'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT
    'auth_identities', COUNT(*) FROM auth_identities;

-- Current migration version
SELECT version_num FROM alembic_version;

-- Database connections
SELECT * FROM pg_stat_activity WHERE datname = 'privexbot';
```

---

## Next Steps

Now that you have PgAdmin configured:

1. **Explore your data** - View users and auth identities
2. **Test queries** - Practice with SELECT statements
3. **Set up backups** - Configure regular database backups
4. **Create read-only users** - For viewing data safely
5. **Monitor growth** - Track database and table sizes

For more information:

- [Official PgAdmin Docs](https://www.pgadmin.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Backend README](../../README.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Status**: ✅ Production Ready

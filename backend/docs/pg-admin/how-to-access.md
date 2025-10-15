Part 1: How to Access Your Database in PgAdmin

Now that PgAdmin is running at https://pgadmin.harystyles.store/browser/, here's how to connect to your PostgreSQL database:

Step 1: Add a New Server in PgAdmin

1. Right-click on "Servers" in the left sidebar
2. Click "Register" → "Server..."

Step 2: Configure Connection - General Tab

- Name: PrivexBot Production

Step 3: Configure Connection - Connection Tab

Fill in these details:

- Host name/address: postgres (this is the container name from docker-compose)
- Port: 5432
- Maintenance database: privexbot
- Username: privexbot
- Password:
- Save password: ✓ (check this box)

Step 4: Click "Save"

You should now see your database! Expand the tree:
PrivexBot Production
└─ Databases
└─ privexbot
└─ Schemas
└─ public
└─ Tables
├─ users
├─ auth_identities
└─ alembic_version

Viewing Your User Data

1. Right-click on the users table
2. Select "View/Edit Data" → "All Rows"
3. You'll see your newly created user from the signup!

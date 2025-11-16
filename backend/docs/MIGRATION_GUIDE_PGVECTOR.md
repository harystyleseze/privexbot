# Migration Guide: Adding pgvector for Knowledge Base

**Date**: 2025-11-16
**Impact**: Low (Additive changes only)
**Backward Compatible**: Yes
**Downtime Required**: No (for local), <1 minute (for production)

---

## What's Changing?

1. **PostgreSQL Docker image**: `postgres:16-alpine` → `pgvector/pgvector:pg16`
2. **New tables added**: `knowledge_bases`, `documents`, `chunks`
3. **New extension enabled**: `pgvector` (for vector similarity search)
4. **New Docker service**: `qdrant` (vector database)

---

## Backward Compatibility

✅ **Existing functionality is NOT affected**:
- All existing tables (users, auth_identities, organizations, workspaces, etc.) remain unchanged
- No ALTER operations on existing tables
- No data migration required
- Existing API endpoints continue to work

✅ **Safe upgrade**:
- `pgvector/pgvector:pg16` is built on official `postgres:16` (same major version)
- Data directory persists in Docker volume `postgres_data`
- Extension is optional - existing code doesn't use it

---

## Upgrade Path

### For Local Development

**Option 1: Fresh Start (Recommended for local)**
```bash
# Backup your .env file
cp .env .env.backup

# Stop and remove containers (data is safe in volumes)
docker compose down

# Pull new images
docker compose pull

# Start with new configuration
docker compose up -d

# Verify services
docker compose ps
docker compose logs postgres | grep "database system is ready"
docker compose logs qdrant | grep "Qdrant is ready"

# Run migrations
# TODO: Add proper migration command when ready
```

**Option 2: Keep Existing Data**
```bash
# Stop containers (keeps volumes)
docker compose down

# Pull new images
docker compose pull

# Start services
docker compose up -d postgres redis qdrant

# Verify postgres upgraded successfully
docker compose exec postgres psql -U privexbot -d privexbot -c "SELECT version();"
# Should show PostgreSQL 16.x

# Run migrations to enable pgvector
docker compose exec postgres psql -U privexbot -d privexbot -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify extension
docker compose exec postgres psql -U privexbot -d privexbot -c "\dx"
# Should list 'vector' extension

# Start all services
docker compose up -d
```

---

### For Production (Secret VM or other environments)

⚠️ **IMPORTANT**: Test this process in staging first!

**Pre-upgrade Checklist**:
- [ ] Backup database: `pg_dump privexbot > backup_$(date +%Y%m%d).sql`
- [ ] Note current postgres version: `docker compose exec postgres psql --version`
- [ ] Verify disk space: `df -h` (need space for Docker image)
- [ ] Schedule maintenance window (5-10 minutes)
- [ ] Inform team of upgrade

**Upgrade Steps**:

```bash
# 1. Backup database
docker compose exec postgres pg_dump -U privexbot privexbot > /path/to/backup/privexbot_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Stop backend (keeps DB running)
docker compose stop backend celery-worker

# 3. Pull new images
docker compose pull postgres qdrant

# 4. Stop postgres
docker compose stop postgres

# 5. Start postgres with new image
docker compose up -d postgres

# 6. Wait for postgres to be ready (10-30 seconds)
docker compose logs -f postgres
# Wait for: "database system is ready to accept connections"

# 7. Enable pgvector extension
docker compose exec postgres psql -U privexbot -d privexbot -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 8. Verify extension enabled
docker compose exec postgres psql -U privexbot -d privexbot -c "\dx vector"

# 9. Start Qdrant
docker compose up -d qdrant

# 10. Verify Qdrant ready
curl http://localhost:6333/health
# Should return: {"status":"ok"}

# 11. Run database migrations (when ready)
# TODO: Add migration command

# 12. Start backend
docker compose up -d backend

# 13. Verify application health
curl http://localhost:8000/health
```

**Rollback Plan** (if upgrade fails):

```bash
# 1. Stop services
docker compose down

# 2. Restore postgres image in docker-compose.yml
#    Change: pgvector/pgvector:pg16
#    Back to: postgres:16-alpine

# 3. Restore database from backup
docker compose up -d postgres
sleep 10
docker compose exec -T postgres psql -U privexbot -d privexbot < /path/to/backup/privexbot_backup_TIMESTAMP.sql

# 4. Start all services
docker compose up -d
```

---

## Verification Steps

After upgrade, verify everything works:

```bash
# 1. Check all containers running
docker compose ps
# All should be "Up" and healthy

# 2. Verify postgres version and extension
docker compose exec postgres psql -U privexbot -d privexbot -c "
SELECT version();
SELECT * FROM pg_extension WHERE extname = 'vector';
"

# 3. Verify existing tables intact
docker compose exec postgres psql -U privexbot -d privexbot -c "\dt"
# Should show: users, auth_identities, organizations, workspaces, etc.

# 4. Verify new tables created (after migration)
# TODO: Add verification query

# 5. Test existing API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer YOUR_TOKEN"

# 6. Check Qdrant
curl http://localhost:6333/health
curl http://localhost:6333/collections
```

---

## FAQ

### Q: Will my existing data be lost?
**A**: No. Data is stored in Docker volumes which persist across container restarts. The new image is compatible with the old one.

### Q: Do I need to run migrations immediately?
**A**: No. The pgvector extension is enabled but not used until you run the KB model migrations. Existing functionality continues to work.

### Q: What if the upgrade fails?
**A**: Follow the rollback plan above. Your data backup ensures you can restore to previous state.

### Q: Can I upgrade postgres and add KB models separately?
**A**: Yes! You can:
1. First: Upgrade postgres image and enable pgvector
2. Later: Run KB model migrations when ready

### Q: Will this affect my existing auth/org/workspace features?
**A**: No. This is purely additive. No existing tables or columns are modified.

---

## Testing Checklist

Before deploying to production, verify in staging:

- [ ] Postgres upgraded successfully
- [ ] Pgvector extension enabled
- [ ] Qdrant service running
- [ ] All existing tests pass
- [ ] User authentication works
- [ ] Organization/workspace operations work
- [ ] No performance degradation
- [ ] Backup and restore process works

---

## Support

If you encounter issues:

1. Check logs: `docker compose logs postgres qdrant backend`
2. Verify volumes: `docker volume ls | grep privexbot`
3. Check disk space: `df -h`
4. Review this guide's rollback section

---

**Next Steps**: Once postgres is upgraded and pgvector is enabled, you can run the KB model migrations to create the knowledge_bases, documents, and chunks tables.

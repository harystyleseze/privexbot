# 🚀 Quick Start - Docker Setup

**Status**: ✅ Setup Complete | **Ready for**: Testing & Deployment

---

## ⚡ Fastest Path to Running

### Development (Local Coding)

\`\`\`bash
cd frontend
./scripts/docker/dev.sh up
# Open http://localhost:5173
# Start coding - changes auto-reload!
\`\`\`

### Production (Deploy Ready)

\`\`\`bash
cd frontend

# 1. Login to Docker Hub
docker login  # Username: harystyles

# 2. Build and push
./scripts/docker/build-push.sh 0.1.0

# 3. Copy the digest output, update docker-compose.prod.yml

# 4. Deploy
docker compose -f docker-compose.prod.yml up -d
# Open http://localhost
\`\`\`

---

## 📋 What You Got

✅ **Development Environment** - Hot reload, live coding
✅ **Production Build** - Multi-stage, optimized, minimal
✅ **SecretVM Ready** - Digest pinning, immutable
✅ **CI/CD Pipeline** - GitHub Actions automation
✅ **Helper Scripts** - One-command operations
✅ **Documentation** - 3000+ lines of guides

---

## 📁 Key Files

\`\`\`
frontend/
├── Dockerfile                    # Production build
├── Dockerfile.dev                # Development
├── docker-compose.dev.yml        # Dev environment
├── docker-compose.prod.yml       # Production deployment
├── nginx.conf                    # SPA routing
├── scripts/docker/
│   ├── build-push.sh             # Build & push
│   ├── dev.sh                    # Dev management
│   └── check.sh                  # Verify setup
├── DOCKER.md                     # Full guide (900+ lines)
├── TESTING.md                    # Testing guide (600+ lines)
└── DOCKER-SETUP-SUMMARY.md       # Implementation summary
\`\`\`

---

## 🎯 Common Commands

### Development
\`\`\`bash
./scripts/docker/dev.sh up        # Start
./scripts/docker/dev.sh logs      # View logs
./scripts/docker/dev.sh down      # Stop
./scripts/docker/dev.sh shell     # Open shell
\`\`\`

### Production
\`\`\`bash
./scripts/docker/build-push.sh 0.1.0  # Build version
./scripts/docker/check.sh             # Verify setup
\`\`\`

### Deployment
\`\`\`bash
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d
\`\`\`

---

## 📖 Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| **QUICK-START.md** | This file | First |
| **DOCKER-SETUP-SUMMARY.md** | Overview | Second |
| **DOCKER.md** | Complete guide | Deep dive |
| **TESTING.md** | Test procedures | Before deploy |
| **scripts/docker/README.md** | Scripts ref | As needed |

---

## ✅ Before First Use

\`\`\`bash
# 1. Verify environment
cd frontend
./scripts/docker/check.sh

# 2. Login to Docker Hub (for production)
docker login
# Username: harystyles
# Password: <your-token>

# 3. Test development
./scripts/docker/dev.sh up
# Visit http://localhost:5173

# 4. All good? Start building! 🎉
\`\`\`

---

## 🆘 Need Help?

**Quick fixes**:
- Docker not running? Start Docker Desktop
- Port in use? Change port in compose file or stop other service
- Changes not showing? Hard refresh browser (Cmd+Shift+R)

**Documentation**:
- \`./scripts/docker/check.sh\` - Environment diagnostics
- \`DOCKER.md\` - Troubleshooting section
- \`TESTING.md\` - Common issues

---

## 🎉 You're Ready!

The Docker setup is complete and production-ready. 

**Next**: Run \`./scripts/docker/check.sh\` to verify your environment!

---

**Happy Coding! 🚀**

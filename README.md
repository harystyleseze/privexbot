<div align="center">

<h3 style="background: linear-gradient(135deg, #a5b4fc 0%, #4361EE 100%); padding: 20px; border-radius: 20px; display: inline-block; margin-bottom: 20px;">
  <img src="https://avatars.githubusercontent.com/u/232574133?v=4" alt="PrivexBot Logo" width="150" height="150" style="border-radius: 50%; border: 4px solid white;"/>
</h3>

 <h3>Privacy-First AI Chatbot Builder Powered by Secret VM</h3>

<br>

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Why PrivexBot?](#-why-privexbot)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**PrivexBot** is a privacy-focused, multi-tenant SaaS platform that empowers organizations to build, train, and deploy AI-powered chatbots using their own data. Unlike traditional platforms, **all AI workloads**—including data ingestion, training, and inference—are executed within **Secret VM** environments (Trusted Execution Environments/TEEs) to ensure:

- 🔒 **Confidential Computation** - Data encrypted in memory during processing
- 🛡️ **Remote Attestation** - Cryptographically verify code integrity
- 🔐 **Zero Data Leakage** - Even platform administrators cannot access plaintext data
- ✅ **Regulatory Compliance** - Built for HIPAA, GDPR, and enterprise security requirements

### What Can You Build?

PrivexBot provides two powerful creation modes:

1. **Simple Chatbots** - Form-based interface for quick FAQ bots and simple Q&A assistants
2. **Advanced Chatflows** - Visual drag-and-drop workflow builder (like n8n/Dify) for complex, multi-step conversational AI

Both modes support:

- 📚 **RAG-powered Knowledge Bases** - Import from files, websites, Notion, Google Docs
- 🌍 **Multi-Channel Deployment** - Website widget, Discord, Telegram, WhatsApp, API
- 📊 **Lead Capture** - Built-in lead generation and analytics
- 🎨 **Full Customization** - Branding, colors, behavior, and deployment options

---

## ✨ Key Features

### 🔐 Privacy & Security

- **Secret VM Execution** - All AI inference runs in Trusted Execution Environments
- **End-to-End Encryption** - Data encrypted at rest and in memory
- **Multi-Provider Authentication** - Email, MetaMask, Phantom, Keplr wallet support
- **RBAC Permissions** - Granular role-based access control
- **Zero-Trust Architecture** - No plaintext data exposure to platform

### 🤖 Chatbot Creation

- **Dual Creation Modes**:
  - **Form-Based** - Quick chatbot creation with guided forms
  - **Visual Workflow** - Drag-and-drop node editor for complex logic
- **Draft-First Architecture** - Preview and test before deployment
- **Live Testing** - Test with real AI responses during creation
- **Version Control** - Track and rollback changes

### 📚 Knowledge Base (RAG)

- **Multi-Source Import**:
  - 📄 File Upload (PDF, Word, Text, CSV, JSON)
  - 🌐 Website Scraping (multi-page crawl with Crawl4AI)
  - 📝 Google Docs & Sheets
  - 📋 Notion pages and databases
  - ✍️ Direct text paste
- **Smart Chunking** - 4 strategies (size-based, heading-based, page-based, semantic)
- **Document Annotations** - Add context, importance, usage instructions
- **Background Processing** - Async document indexing with Celery
- **Vector Search** - FAISS, Qdrant, Weaviate, Milvus, Pinecone support

### 🚀 Multi-Channel Deployment

- **Website Embed** - JavaScript widget (~50KB) for any website
- **Discord Bot** - Native Discord integration with webhooks
- **Telegram Bot** - Full Telegram Bot API support
- **WhatsApp Business** - WhatsApp Business API integration
- **Zapier Webhook** - Connect to 5000+ apps via Zapier
- **Direct API** - RESTful API for custom integrations

### 📊 Lead Generation & Analytics

- **Optional Lead Capture** - Collect email, name, phone, custom fields
- **Smart Timing** - Before chat, during chat, or after N messages
- **Geolocation** - Automatic IP-based location detection
- **Analytics Dashboard** - Geographic distribution, conversion tracking
- **Privacy Controls** - GDPR-compliant with consent management

### 🎨 Customization

- **Widget Customization** - Position, colors, greeting, branding
- **Brand Control** - White-label options, custom domains
- **Behavior Configuration** - System prompts, personality, tone
- **Channel-Specific Settings** - Different configs per deployment channel

---

## 🚀 Why PrivexBot?

### For Enterprises

- ✅ **Data Privacy Guaranteed** - Secret VM ensures data never leaves TEE
- ✅ **Regulatory Compliance** - Meet HIPAA, GDPR, SOC 2 requirements
- ✅ **On-Premise Deployment** - Deploy to your own infrastructure
- ✅ **Audit Trails** - Complete logging and attestation records

### For Agencies

- ✅ **Multi-Tenant** - Manage multiple clients/organizations
- ✅ **White-Label** - Rebrand as your own service
- ✅ **Team Collaboration** - Workspaces for different departments
- ✅ **API Access** - Programmatic bot management

### For Developers

- ✅ **Open Source** - Full codebase transparency
- ✅ **Modern Stack** - FastAPI, React 19, TypeScript
- ✅ **Docker Ready** - One-command deployment
- ✅ **Extensible** - Plugin architecture for custom nodes

### For SaaS Builders

- ✅ **Production Ready** - Battle-tested architecture
- ✅ **Scalable** - Handles millions of messages
- ✅ **Monetization** - Built-in subscription and billing hooks
- ✅ **Analytics** - Usage tracking and insights

---

## 🏗️ Architecture

PrivexBot is built as a **monorepo** with three main packages:

```
┌─────────────────────────────────────────────────────────────┐
│                     PrivexBot Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Frontend (React + TypeScript)                      │  │
│  │  - Admin dashboard for bot creation                 │  │
│  │  - Visual workflow builder (ReactFlow)              │  │
│  │  - Analytics and lead management                    │  │
│  │  📍 Port 3000 (Dev) / 443 (Prod)                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                         ↕ REST API                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Backend (FastAPI + Python)                         │  │
│  │  - Multi-tenant API                                 │  │
│  │  - RAG knowledge base processing                    │  │
│  │  - Secret AI inference (TEE)                        │  │
│  │  - Multi-channel integrations                       │  │
│  │  📍 Port 8000                                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                         ↕                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Infrastructure                                     │  │
│  │  - PostgreSQL (Multi-tenant data)                   │  │
│  │  - Redis (Draft storage, sessions, cache)           │  │
│  │  - Celery (Background tasks)                        │  │
│  │  - Vector DB (FAISS/Qdrant/Pinecone)                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Widget (Vanilla JavaScript)                                │
│  - Embeddable chat widget (~50KB)                          │
│  - Framework-agnostic                                       │
│  - Works on any website                                     │
│  📍 Served via CDN or backend                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Architectural Principles

1. **Multi-Tenancy** - Organization → Workspace → Resources hierarchy
2. **Draft-First** - All creation happens in Redis before database commit
3. **Background Processing** - Never block API requests (Celery tasks)
4. **Backend-Only AI** - Secret AI never exposed to frontend
5. **Unified API** - Same endpoints work for chatbots and chatflows
6. **Plugin Architecture** - Extensible with custom nodes and integrations

**📖 For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## ⚡ Quick Start

### Prerequisites

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Node.js** (20+) - For local frontend development
- **Python** (3.11+) - For local backend development
- **Git** - For cloning the repository

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/privexbot.git
cd privexbot
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp .env.prod.example .env.prod

# Edit .env with your settings
nano .env
```

### 3. Start with Docker (Recommended)

```bash
# Start all services (frontend + backend + database + redis)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Services will be available at:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 4. Production Deployment

```bash
# Build production images
./scripts/build-prod.sh

# Test locally
./scripts/test-prod.sh

# Deploy to Docker Hub
./scripts/deploy-prod.sh
```

**📖 For detailed setup, see [GETTING_STARTED.md](./GETTING_STARTED.md)**

---

## 📚 Documentation

### General

- **[Getting Started Guide](./GETTING_STARTED.md)** - Complete setup and first chatbot creation
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and technical decisions
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to PrivexBot

### Development

- **[Docker Setup](./DOCKER_SETUP.md)** - Local development with Docker
- **[Backend Guide](./docs/technical-docs/COMPLETE_BACKEND_STRUCTURE.md)** - Python backend development
- **[Frontend Guide](./docs/technical-docs/FRONTEND_IMPLEMENTATION_SUMMARY.md)** - React frontend development
- **[Widget Guide](./widget/README.md)** - Widget development and embedding

### Deployment

- **[Production Deployment](./DEPLOYMENT_GUIDE.md)** - Deploy to production (VM, Cloud, K8s)
- **[Docker Hub Guide](./DOCKER_HUB_GUIDE.md)** - Push images to Docker Hub
- **[Complete Architecture Explained](./COMPLETE_ARCHITECTURE_EXPLAINED.md)** - Deep dive into widget, CDN, and deployment

### Technical Documentation

- **[API Reference](./API_REFERENCE.md)** - REST API endpoints and schemas
- **[Database Models](./docs/technical-docs/COMPONENTS_COMPLETE.md)** - Database models and components
- **[Multi-Tenancy](./docs/technical-docs/ARCHITECTURE_SUMMARY.md#multi-tenancy)** - Tenant isolation and permissions
- **[Knowledge Base Architecture](./docs/ai/steps/KNOWLEDGE_BASE_CREATION_FLOW.md)** - RAG implementation
- **[Deployment Architecture](./docs/technical-docs/CHATBOT_DEPLOYMENT_ARCHITECTURE.md)** - Multi-channel deployment
- **[Draft Mode Architecture](./docs/ai/steps/KB_DRAFT_MODE_ARCHITECTURE.md)** - Redis-based draft system
- **[Architecture Summary](./docs/technical-docs/ARCHITECTURE_SUMMARY.md)** - Complete technical overview

### Guides

- **[Quick Deploy Guide](./QUICK_DEPLOY_GUIDE.md)** - Fast VM deployment reference
- **[Widget CDN Explained](./WIDGET_CDN_EXPLAINED.md)** - CDN setup and widget delivery
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Comprehensive production deployment

---

## 🛠️ Technology Stack

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0+
- **Database**: PostgreSQL 15+ (with pgvector extension)
- **Cache/Session**: Redis 7+
- **Task Queue**: Celery with Redis broker
- **Migrations**: Alembic
- **Validation**: Pydantic V2
- **Package Manager**: uv
- **Testing**: pytest, pytest-asyncio

### Frontend

- **Framework**: React 19
- **Language**: TypeScript 5+
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + Zustand
- **Forms**: React Hook Form + Zod validation
- **Workflow Builder**: ReactFlow
- **HTTP Client**: Axios
- **Testing**: Vitest, React Testing Library

### Widget

- **Language**: Vanilla JavaScript (ES6+)
- **Build**: Webpack 5
- **Size**: ~50KB minified + gzipped
- **Compatibility**: All modern browsers (Chrome, Firefox, Safari, Edge)

### Infrastructure

- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Vector Stores**: FAISS, Qdrant, Weaviate, Milvus, Pinecone
- **Embeddings**: OpenAI, Secret AI, Hugging Face, Cohere
- **AI Inference**: Secret VM (Trusted Execution Environment)

### Integrations

- **Website Scraping**: Crawl4AI, Firecrawl, Jina Reader
- **Document Parsing**: Unstructured.io, PyMuPDF, python-docx
- **Cloud Sources**: Google Docs API, Notion API, Google Sheets API
- **Messaging**: Discord.py, python-telegram-bot, Twilio (WhatsApp)
- **Geolocation**: MaxMind GeoIP2, IP2Location
- **Authentication**: MetaMask, Phantom, Keplr wallet support

---

## 📁 Project Structure

```
privexbot/
├── backend/                          # Python FastAPI backend
│   ├── src/app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── api/v1/routes/           # API endpoints
│   │   │   ├── auth.py              # Authentication
│   │   │   ├── chatbot.py           # Chatbot CRUD
│   │   │   ├── chatflows.py         # Chatflow CRUD
│   │   │   ├── knowledge_bases.py   # KB management
│   │   │   ├── kb_draft.py          # Draft mode endpoints
│   │   │   ├── documents.py         # Document processing
│   │   │   ├── leads.py             # Lead management
│   │   │   ├── public.py            # Public API
│   │   │   └── webhooks/            # Platform webhooks
│   │   ├── models/                  # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── organization.py
│   │   │   ├── workspace.py
│   │   │   ├── chatbot.py
│   │   │   ├── chatflow.py
│   │   │   ├── knowledge_base.py
│   │   │   └── ...
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── services/                # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── chatbot_service.py
│   │   │   ├── chatflow_service.py
│   │   │   ├── chatflow_executor.py
│   │   │   ├── kb_draft_service.py
│   │   │   ├── inference_service.py  # Secret AI
│   │   │   ├── retrieval_service.py  # RAG
│   │   │   └── ...
│   │   ├── auth/strategies/         # Auth providers
│   │   ├── integrations/            # External integrations
│   │   ├── chatflow/nodes/          # Chatflow node types
│   │   ├── tasks/                   # Celery tasks
│   │   └── alembic/                 # Database migrations
│
│
├── frontend/                         # React TypeScript frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ChatbotBuilder.tsx   # Form-based builder
│   │   │   ├── ChatflowBuilder.tsx  # Visual builder
│   │   │   ├── KBCreationWizard.tsx # Draft KB creation
│   │   │   ├── KnowledgeBase.tsx
│   │   │   ├── LeadsDashboard.tsx
│   │   │   └── Deployments.tsx
│   │   ├── components/
│   │   │   ├── chatbot/             # Chatbot components
│   │   │   ├── chatflow/            # ReactFlow components
│   │   │   ├── kb/                  # KB creation (draft)
│   │   │   └── shared/              # Shared components
│   │   ├── api/                     # API clients
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom hooks
│   │   └── lib/                     # Utilities
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── nginx.conf
│
├── widget/                           # Embeddable chat widget
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── ui/
│   │   │   ├── ChatBubble.js
│   │   │   ├── ChatWindow.js
│   │   │   ├── MessageList.js
│   │   │   ├── InputBox.js
│   │   │   └── LeadForm.js
│   │   ├── api/client.js            # Backend API
│   │   └── styles/widget.css
│   ├── build/widget.js              # Compiled output
│   └── webpack.config.js
│
├── docs/                             # Documentation
│   ├── technical-docs/              # Technical specifications
│   ├── backend/                     # Backend docs
│   ├── frontend/                    # Frontend docs
│   └── widget/                      # Widget docs
│
├── scripts/                          # Utility scripts
│   ├── build-prod.sh                # Production build
│   ├── test-prod.sh                 # Test production locally
│   ├── deploy-prod.sh               # Deploy to Docker Hub
│   └── setup.sh                     # Initial setup
│
├── docker-compose.yml               # Development compose
├── docker-compose.prod.yml          # Production compose
├── .env.example                     # Development env template
├── .env.prod.example                # Production env template
├── README.md                        # This file
├── LICENSE                          # MIT License
└── CONTRIBUTING.md                  # Contribution guidelines
```

**📖 For detailed structure explanation, see [ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## 💻 Development

### Local Development Setup

#### Option 1: Docker (Recommended)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Access services
Frontend: http://localhost:3000
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs
```

#### Option 2: Native Development

**Backend:**

```bash
cd backend

# Install dependencies (using uv)
uv pip install -r requirements/dev.txt

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Widget:**

```bash
cd widget

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Backend linting
cd backend
ruff check .
mypy app/

# Frontend linting
cd frontend
npm run lint

# Format code
npm run format
```

**📖 For detailed development workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md)**

---

## 🚀 Deployment

### Production Deployment Options

#### 1. Single VM Deployment (Simple)

**Best for:** MVPs, small teams, 1-100 customers

```bash
# On your VM
git clone https://github.com/yourusername/privexbot.git
cd privexbot

# Setup environment
cp .env.prod.example .env.prod
nano .env.prod  # Edit configuration

# Build and deploy
./scripts/build-prod.sh
docker compose -f docker-compose.prod.yml up -d

# Access at your VM IP or domain
http://your-vm-ip:3000
```

**📊 Resources Required:**

- CPU: 2-4 cores
- RAM: 4-8 GB
- Disk: 50-100 GB
- Cost: ~$20-50/month (DigitalOcean, AWS Lightsail, Linode)

#### 2. Docker Hub + Multi-VM (Scalable)

**Best for:** Growing startups, 100-10,000 customers

1. **Push to Docker Hub:**

   ```bash
   # Tag images
   docker tag privexbot/frontend:latest yourusername/privexbot-frontend:latest
   docker tag privexbot/backend:latest yourusername/privexbot-backend:latest

   # Push
   docker push yourusername/privexbot-frontend:latest
   docker push yourusername/privexbot-backend:latest
   ```

2. **Deploy on VM:**

   ```bash
   # Pull and run
   docker pull yourusername/privexbot-frontend:latest
   docker pull yourusername/privexbot-backend:latest

   docker compose -f docker-compose.prod.yml up -d
   ```

**📖 Complete Docker Hub guide: [DOCKER_HUB_GUIDE.md](./DOCKER_HUB_GUIDE.md)**

#### 3. Kubernetes (Enterprise)

**Best for:** Enterprises, 10,000+ customers

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

**📖 Kubernetes deployment: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#kubernetes)**

### SSL/TLS Setup

```bash
# Using Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### CDN Setup (Optional)

For serving the widget globally:

```bash
# Using Cloudflare (FREE)
1. Sign up at cloudflare.com
2. Add your domain
3. Create cdn.yourdomain.com subdomain
4. Upload widget.js to Cloudflare Workers
5. Update WIDGET_CDN_URL in .env.prod
```

**📖 Complete deployment guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Workflow

- All PRs require passing tests
- Code must pass linting (ruff for Python, eslint for TypeScript)
- Add tests for new features
- Update documentation as needed

### Areas for Contribution

- 🐛 **Bug fixes** - Check [Issues](https://github.com/yourusername/privexbot/issues)
- ✨ **New features** - See [Roadmap](#-roadmap)
- 📚 **Documentation** - Help improve docs
- 🌍 **Translations** - Add language support
- 🧪 **Testing** - Improve test coverage
- 🎨 **UI/UX** - Design improvements

**📖 Full guidelines: [CONTRIBUTING.md](./CONTRIBUTING.md)**

---

## 📄 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](./LICENSE) file for details.

```
Copyright 2025 PrivexBot

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 🆘 Support

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/privexbot/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/yourusername/privexbot/discussions)
- **Discord**: [Join our community](https://discord.gg/privexbot)

### Documentation

- **Technical Docs**: [docs/](./docs/)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **FAQ**: [docs/technical-docs/privexbot-design/FAQ.md](./docs/technical-docs/privexbot-design/FAQ.md)

### Commercial Support

For enterprise support, custom development, or consulting:

- **Email**: support@privexbot.com
- **Website**: https://privexbot.com

---

## 🗺️ Roadmap

### Current Phase: MVP (v0.1 - v1.0)

- [x] Multi-tenant architecture
- [x] Form-based chatbot builder
- [x] Visual chatflow builder
- [x] Knowledge base with RAG
- [x] Website widget
- [x] Multi-auth support
- [x] Lead capture
- [x] Docker deployment
- [ ] Telegram integration
- [ ] Discord integration
- [ ] Production hardening
- [ ] Comprehensive testing

### Phase 2: Growth (v1.1 - v2.0)

- [ ] WhatsApp Business integration
- [ ] Slack integration
- [ ] Analytics dashboard v2
- [ ] A/B testing for bots
- [ ] Multi-language support
- [ ] Advanced workflow nodes
- [ ] Zapier app integration
- [ ] Mobile app (React Native)

### Phase 3: Enterprise (v2.1+)

- [ ] On-premise deployment
- [ ] SSO integration (SAML, OAuth)
- [ ] Advanced RBAC
- [ ] Audit logs
- [ ] SLA monitoring
- [ ] High availability setup
- [ ] Multi-region deployment
- [ ] Compliance certifications

**📖 See roadmap above for current development status**

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - UI library
- [ReactFlow](https://reactflow.dev/) - Visual workflow builder
- [Crawl4AI](https://github.com/unclecode/crawl4ai) - Website scraping
- [Unstructured](https://unstructured.io/) - Document parsing
- [Secret Network](https://scrt.network/) - Privacy-preserving computation
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

Special thanks to all [contributors](https://github.com/yourusername/privexbot/graphs/contributors)!

---

## ⭐ Star History

If you find PrivexBot useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/privexbot&type=Date)](https://star-history.com/#yourusername/privexbot&Date)

---

<div align="center">

**Built with ❤️ by the PrivexBot Team**

[Website](https://privexbot.com) • [Documentation](./docs/) • [Discord](https://discord.gg/privexbot) • [Twitter](https://twitter.com/privexbot)

</div>

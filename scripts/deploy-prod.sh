#!/bin/bash
set -e

# ==========================================
# PrivexBot Production Deployment Script
# ==========================================

echo "🚀 Deploying PrivexBot to Production..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.prod | xargs)

# Deployment confirmation
echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}API URL: ${VITE_API_BASE_URL}${NC}"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Stop existing production containers
echo -e "\n${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down || true

# Pull/Build latest images
echo -e "\n${YELLOW}🏗️  Building production images...${NC}"
docker compose -f docker-compose.prod.yml build

# Start services
echo -e "\n${YELLOW}🚀 Starting production services...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for health checks
echo -e "\n${YELLOW}⏳ Waiting for health checks...${NC}"
sleep 15

# Verify deployment
FRONTEND_PORT=${FRONTEND_PORT:-3000}
if curl -f -s http://localhost:${FRONTEND_PORT}/health > /dev/null; then
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}Frontend is running at: http://localhost:${FRONTEND_PORT}${NC}"
else
    echo -e "\n${RED}❌ Deployment failed - health check failed${NC}"
    echo -e "${YELLOW}Showing logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail=50 frontend
    exit 1
fi

# Show container status
echo -e "\n${YELLOW}📋 Container Status:${NC}"
docker compose -f docker-compose.prod.yml ps

# Cleanup old images (optional)
echo -e "\n${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "${YELLOW}Monitor logs with: docker compose -f docker-compose.prod.yml logs -f${NC}"

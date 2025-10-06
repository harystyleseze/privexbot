#!/bin/bash
set -e

# ==========================================
# PrivexBot Production Test Script
# ==========================================

echo "🧪 Testing PrivexBot Production Build Locally..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.prod | xargs)

# Start services
echo -e "${YELLOW}🚀 Starting production services...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check frontend health
FRONTEND_PORT=${FRONTEND_PORT:-3000}
echo -e "${YELLOW}🔍 Checking frontend health at http://localhost:${FRONTEND_PORT}/health${NC}"

if curl -f -s http://localhost:${FRONTEND_PORT}/health > /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy!${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Show running containers
echo -e "\n${YELLOW}📋 Running containers:${NC}"
docker compose -f docker-compose.prod.yml ps

# Show logs
echo -e "\n${YELLOW}📝 Recent logs:${NC}"
docker compose -f docker-compose.prod.yml logs --tail=20 frontend

echo -e "\n${GREEN}✅ Production build is running successfully!${NC}"
echo -e "${YELLOW}Access frontend at: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "\n${YELLOW}Commands:${NC}"
echo "  View logs:  docker compose -f docker-compose.prod.yml logs -f frontend"
echo "  Stop:       docker compose -f docker-compose.prod.yml down"

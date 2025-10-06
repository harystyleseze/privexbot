#!/bin/bash
set -e

# ==========================================
# PrivexBot Production Build Script
# ==========================================

echo "🚀 Starting PrivexBot Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    echo -e "${YELLOW}📝 Please create .env.prod from .env.prod.example${NC}"
    echo "   cp .env.prod.example .env.prod"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.prod | xargs)

# Validate required variables
REQUIRED_VARS=("VERSION" "API_BASE_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env.prod${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment validated${NC}"
echo -e "${YELLOW}📦 Building version: ${VERSION}${NC}"

# Build services
echo -e "\n${YELLOW}🏗️  Building frontend...${NC}"
docker compose -f docker-compose.prod.yml build frontend

echo -e "\n${GREEN}✅ Build completed successfully!${NC}"

# Show image info
echo -e "\n${YELLOW}📊 Image details:${NC}"
docker images | grep privexbot/frontend | head -1

echo -e "\n${GREEN}🎉 Production build complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test locally: ./scripts/test-prod.sh"
echo "  2. Deploy: ./scripts/deploy-prod.sh"

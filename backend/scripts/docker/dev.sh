#!/bin/bash
# Backend Development Environment Helper
# Usage: ./scripts/docker/dev.sh [command]
# Commands: up, down, restart, logs, build, clean, shell, db, migrate

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.dev.yml"
SERVICE_NAME="backend-dev"

# Function to display usage
usage() {
    echo -e "${BLUE}Backend Development Environment Helper${NC}"
    echo ""
    echo "Usage: ./scripts/docker/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up          Start development environment"
    echo "  down        Stop development environment"
    echo "  restart     Restart backend service"
    echo "  logs        View backend logs (follow mode)"
    echo "  build       Rebuild backend container"
    echo "  clean       Stop and remove all containers, volumes"
    echo "  shell       Access backend container shell"
    echo "  db          Access PostgreSQL shell"
    echo "  migrate     Run database migrations"
    echo "  test        Run tests inside container"
    echo ""
}

# Check if command is provided
if [ -z "$1" ]; then
    usage
    exit 1
fi

COMMAND=$1

case $COMMAND in
    up)
        echo -e "${GREEN}🚀 Starting development environment...${NC}"
        docker compose -f $COMPOSE_FILE up
        ;;

    down)
        echo -e "${YELLOW}🛑 Stopping development environment...${NC}"
        docker compose -f $COMPOSE_FILE down
        echo -e "${GREEN}✅ Stopped${NC}"
        ;;

    restart)
        echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
        docker compose -f $COMPOSE_FILE restart $SERVICE_NAME
        echo -e "${GREEN}✅ Restarted${NC}"
        ;;

    logs)
        echo -e "${BLUE}📋 Viewing backend logs (Ctrl+C to exit)...${NC}"
        docker compose -f $COMPOSE_FILE logs -f $SERVICE_NAME
        ;;

    build)
        echo -e "${YELLOW}🔨 Rebuilding backend container...${NC}"
        docker compose -f $COMPOSE_FILE build --no-cache $SERVICE_NAME
        echo -e "${GREEN}✅ Build complete${NC}"
        ;;

    clean)
        echo -e "${RED}🧹 Cleaning up (removes containers and volumes)...${NC}"
        read -p "Are you sure? This will delete all data (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose -f $COMPOSE_FILE down -v
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;

    shell)
        echo -e "${BLUE}🐚 Accessing backend container shell...${NC}"
        docker compose -f $COMPOSE_FILE exec $SERVICE_NAME /bin/bash
        ;;

    db)
        echo -e "${BLUE}🗄️  Accessing PostgreSQL shell...${NC}"
        docker compose -f $COMPOSE_FILE exec postgres psql -U privexbot -d privexbot_dev
        ;;

    migrate)
        echo -e "${YELLOW}🔄 Running database migrations...${NC}"
        docker compose -f $COMPOSE_FILE exec $SERVICE_NAME alembic upgrade head
        echo -e "${GREEN}✅ Migrations complete${NC}"
        ;;

    test)
        echo -e "${YELLOW}🧪 Running tests...${NC}"
        docker compose -f $COMPOSE_FILE exec $SERVICE_NAME pytest
        ;;

    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo ""
        usage
        exit 1
        ;;
esac

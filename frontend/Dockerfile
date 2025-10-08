# Production Dockerfile for PrivexBot Frontend
# Multi-stage build: Build static files in Node, serve with Nginx
# Purpose: Minimal, secure production image with runtime configuration
# Usage: docker build -t harystyles/privexbot-frontend:version .

# ============================================
# Stage 1: Builder - Build the React app
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and npm config for dependency installation
COPY package.json package-lock.json .npmrc ./

# Install dependencies
# Use ci for reproducible builds (installs both prod and dev deps needed for build)
# The .npmrc file configures legacy-peer-deps to handle React 19 compatibility
RUN npm ci

# Copy source code
COPY . .

# Build the application
# This creates the /app/dist folder with static files
RUN npm run build

# ============================================
# Stage 2: Production - Serve with Nginx
# ============================================
FROM nginx:alpine AS production

# Install bash for entrypoint script
RUN apk add --no-cache bash

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create entrypoint script for runtime configuration
# This allows the same Docker image to work in different environments
COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
set -e

echo "=== PrivexBot Frontend Entrypoint ==="
echo "Starting container initialization..."

# Generate runtime configuration file
echo "Generating runtime configuration..."
cat > /usr/share/nginx/html/config.js <<CONFIGJS
// Runtime Configuration
// This file is generated at container startup
// DO NOT EDIT - Changes will be overwritten
window.ENV_CONFIG = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:8000/api/v1}",
  WIDGET_CDN_URL: "${WIDGET_CDN_URL:-http://localhost:8080}",
  ENVIRONMENT: "${ENVIRONMENT:-production}"
};
CONFIGJS

echo "Generated runtime configuration:"
cat /usr/share/nginx/html/config.js

# Verify Nginx configuration
echo "Verifying Nginx configuration..."
nginx -t

# Start Nginx
echo "Starting Nginx..."
exec nginx -g 'daemon off;'
EOF

# Make entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

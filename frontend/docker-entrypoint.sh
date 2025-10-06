#!/bin/sh
set -e

echo "🚀 PrivexBot Frontend - Production Container Starting..."

# Default values
API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api/v1}"
WIDGET_CDN_URL="${WIDGET_CDN_URL:-http://localhost:8080}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Inject runtime configuration into config.js
# This allows the SAME Docker image to work in different environments
CONFIG_FILE="/usr/share/nginx/html/config.js"

if [ -f "$CONFIG_FILE" ]; then
    echo "📝 Injecting runtime configuration..."
    echo "   API_BASE_URL: $API_BASE_URL"
    echo "   WIDGET_CDN_URL: $WIDGET_CDN_URL"
    echo "   ENVIRONMENT: $ENVIRONMENT"

    # Replace placeholders with actual values
    sed -i "s|__API_BASE_URL__|$API_BASE_URL|g" "$CONFIG_FILE"
    sed -i "s|__WIDGET_CDN_URL__|$WIDGET_CDN_URL|g" "$CONFIG_FILE"
    sed -i "s|__ENVIRONMENT__|$ENVIRONMENT|g" "$CONFIG_FILE"

    echo "✅ Configuration injected successfully"
else
    echo "⚠️  Warning: config.js not found at $CONFIG_FILE"
fi

echo "🌐 Starting Nginx..."
exec "$@"

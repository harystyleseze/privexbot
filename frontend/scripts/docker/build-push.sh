#!/usr/bin/env bash
#
# PrivexBot Frontend - Build and Push Script
# Purpose: Build production Docker image, push to Docker Hub, and output digest
# Usage: ./scripts/docker/build-push.sh [version]
#
# Examples:
#   ./scripts/docker/build-push.sh 0.1.0        # Build and push v0.1.0 (MVP/prelaunch)
#   ./scripts/docker/build-push.sh 0.2.0-rc.1   # Build and push release candidate
#   ./scripts/docker/build-push.sh 1.0.0        # Official launch version
#
# Semantic Versioning for MVP/Prelaunch:
#   - 0.x.x: MVP/prelaunch versions (not production-ready)
#   - 1.0.0: Official launch version (reserved)
#   - Use format: 0.MINOR.PATCH or 0.MINOR.PATCH-rc.N for release candidates

set -euo pipefail

# Configuration
DOCKER_USERNAME="harystyles"
IMAGE_NAME="privexbot-frontend"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✔ ${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${NC} $1"
}

log_error() {
    echo -e "${RED}✖ ${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    # Check if logged in to Docker Hub
    # Try multiple methods as different Docker versions show this differently
    if [ -f ~/.docker/config.json ]; then
        if ! grep -q '"auths"' ~/.docker/config.json 2>/dev/null; then
            log_warning "Docker config exists but no auth found. May need to login."
        fi
    else
        log_warning "No Docker credentials found. Please run: docker login"
        log_info "Attempting to continue anyway..."
    fi

    # Alternative check: try to verify Docker Hub access
    # We'll let the push command fail if credentials are actually invalid

    log_success "All prerequisites met"
}

# Validate version format
validate_version() {
    local version=$1

    # Check if version follows semantic versioning
    if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
        log_error "Invalid version format: $version"
        log_info "Version must follow semantic versioning: MAJOR.MINOR.PATCH[-PRERELEASE]"
        log_info "Examples: 0.1.0, 0.2.3, 0.3.0-rc.1, 1.0.0"
        exit 1
    fi

    # Warn if using v1.0.0 or higher (reserved for official launch)
    if [[ $version =~ ^1\. ]] || [[ $version =~ ^[2-9]\. ]]; then
        log_warning "Version $version is >= 1.0.0 (official launch version)"
        read -p "Are you sure you want to use this version? (yes/no): " confirm
        if [[ $confirm != "yes" ]]; then
            log_info "Aborted by user"
            exit 0
        fi
    fi

    log_success "Version $version is valid"
}

# Build Docker image
build_image() {
    local version=$1
    local tag="${FULL_IMAGE_NAME}:${version}"

    log_info "Building Docker image: $tag"

    # Change to frontend directory (where Dockerfile is)
    cd "$(dirname "$0")/../.."

    # Build the image
    docker build \
        --file Dockerfile \
        --tag "$tag" \
        --tag "${FULL_IMAGE_NAME}:latest" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VERSION="$version" \
        .

    log_success "Image built successfully: $tag"
}

# Push image to Docker Hub
push_image() {
    local version=$1
    local tag="${FULL_IMAGE_NAME}:${version}"

    log_info "Pushing image to Docker Hub: $tag"

    # Push versioned tag
    docker push "$tag"

    # Push latest tag
    docker push "${FULL_IMAGE_NAME}:latest"

    log_success "Image pushed successfully"
}

# Get and display image digest
get_digest() {
    local version=$1
    local tag="${FULL_IMAGE_NAME}:${version}"

    log_info "Fetching image digest..."

    # Get the RepoDigest
    local digest=$(docker inspect --format='{{index .RepoDigests 0}}' "$tag" 2>/dev/null || echo "")

    if [[ -z "$digest" ]]; then
        log_error "Failed to get image digest. Image may not be pushed yet."
        exit 1
    fi

    log_success "Image digest retrieved"

    # Display the digest prominently
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          IMAGE DIGEST (PRODUCTION)                         ║"
    echo "╠════════════════════════════════════════════════════════════════════════════╣"
    echo "║                                                                            ║"
    echo "║  Copy this digest and update docker-compose.prod.yml:                     ║"
    echo "║                                                                            ║"
    echo "║  image: ${digest}"
    echo "║                                                                            ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""

    # Save digest to file for CI/CD
    echo "$digest" > .docker-digest
    log_info "Digest also saved to .docker-digest file"
}

# Display usage information
usage() {
    cat <<EOF
Usage: $0 [version]

Build, push, and get digest for PrivexBot frontend Docker image.

Arguments:
  version       Semantic version (e.g., 0.1.0, 0.2.0-rc.1, 1.0.0)

Examples:
  $0 0.1.0            # Build and push MVP version 0.1.0
  $0 0.2.0-rc.1       # Build and push release candidate
  $0 1.0.0            # Build and push official launch version

Versioning Guidelines:
  - 0.x.x         : MVP/prelaunch versions
  - 0.x.x-rc.N    : Release candidates
  - 1.0.0         : Official launch version (reserved)
  - 1.x.x+        : Post-launch versions

Prerequisites:
  - Docker installed and running
  - Logged in to Docker Hub (docker login)

EOF
    exit 1
}

# Main execution
main() {
    # Check if version argument is provided
    if [[ $# -ne 1 ]]; then
        usage
    fi

    local version=$1

    log_info "PrivexBot Frontend - Build and Push Script"
    log_info "Version: $version"
    echo ""

    # Run all steps
    check_prerequisites
    validate_version "$version"
    build_image "$version"
    push_image "$version"
    get_digest "$version"

    log_success "All steps completed successfully!"
    log_info "Next steps:"
    log_info "  1. Update docker-compose.prod.yml with the digest above"
    log_info "  2. Commit and push the updated docker-compose.prod.yml"
    log_info "  3. Deploy to production: docker compose -f docker-compose.prod.yml up -d"
}

# Run main function
main "$@"

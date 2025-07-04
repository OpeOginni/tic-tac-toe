#!/bin/bash

# Docker Build and Push Script for Tic-Tac-Toe
# This script builds and pushes multi-platform Docker images to Docker Hub

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if terraform.tfvars exists to get Docker Hub username
if [ ! -f "terraform/terraform.tfvars" ]; then
    print_error "terraform.tfvars not found!"
    print_status "Please copy terraform.tfvars.example to terraform.tfvars and configure it:"
    echo "cp terraform/terraform.tfvars.example terraform/terraform.tfvars"
    exit 1
fi

# Extract Docker Hub username from terraform.tfvars
DOCKER_HUB_USERNAME=$(grep "docker_hub_username" terraform/terraform.tfvars | cut -d'"' -f2)

if [ "$DOCKER_HUB_USERNAME" = "your-dockerhub-username" ]; then
    print_error "Please update docker_hub_username in terraform/terraform.tfvars"
    exit 1
fi

print_status "Building and pushing multi-platform Docker images for: $DOCKER_HUB_USERNAME"

# Step 1: Setup Docker Buildx for multi-platform builds
print_status "Setting up Docker Buildx for multi-platform builds..."

# Create and use a new builder instance if it doesn't exist
if ! docker buildx ls | grep -q "multiplatform"; then
    print_status "Creating new buildx builder..."
    docker buildx create --name multiplatform --use
else
    print_status "Using existing buildx builder..."
    docker buildx use multiplatform
fi

# Bootstrap the builder
docker buildx inspect --bootstrap

# Step 2: Check Docker Hub Login
print_status "Checking Docker Hub authentication..."

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    print_warning "Not logged in to Docker Hub. Please login:"
    docker login
fi

# Step 3: Build and Push Multi-Platform Docker Images
print_status "Building and pushing multi-platform Docker images..."

# Build and push Frontend (supports both ARM64 and AMD64)
print_status "Building and pushing frontend image for multiple platforms..."
cd frontend
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${DOCKER_HUB_USERNAME}/tic-tac-toe-frontend:latest \
    --push \
    .
cd ..

# Build and push Backend (supports both ARM64 and AMD64)
print_status "Building and pushing backend image for multiple platforms..."
cd backend
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${DOCKER_HUB_USERNAME}/tic-tac-toe-backend:latest \
    --push \
    .
cd ..

print_success "Multi-platform Docker images built and pushed successfully!"

echo ""
echo "=========================================="
echo "🐳 MULTI-PLATFORM DOCKER IMAGES PUBLISHED!"
echo "=========================================="
echo ""
echo "📦 Frontend Image: ${DOCKER_HUB_USERNAME}/tic-tac-toe-frontend:latest"
echo "📦 Backend Image: ${DOCKER_HUB_USERNAME}/tic-tac-toe-backend:latest"
echo ""
echo "🏗️  Platforms: linux/amd64, linux/arm64"
echo "✅ Compatible with AWS ECS (AMD64) and Apple Silicon (ARM64)"
echo ""
echo "🌐 Docker Hub Links:"
echo "   - Frontend: https://hub.docker.com/r/${DOCKER_HUB_USERNAME}/tic-tac-toe-frontend"
echo "   - Backend: https://hub.docker.com/r/${DOCKER_HUB_USERNAME}/tic-tac-toe-backend"
echo ""
echo "📋 To make repositories public:"
echo "   1. Go to Docker Hub (https://hub.docker.com)"
echo "   2. Navigate to your repositories"
echo "   3. Click on each repository"
echo "   4. Go to Settings tab"
echo "   5. Change visibility to 'Public'"
echo ""
echo "🚀 Ready to deploy with: ./deploy.sh"
echo "=========================================="

print_success "Multi-platform Docker push completed!" 
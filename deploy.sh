#!/bin/bash

# Tic-Tac-Toe AWS Deployment Script
# This script deploys the application to AWS using Terraform
# Note: Run ./docker-push.sh first to build and push Docker images

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

# Check if terraform.tfvars exists
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

print_status "Starting AWS deployment for Docker Hub user: $DOCKER_HUB_USERNAME"

# Check if Docker images exist
print_status "Checking if Docker images are available..."

# Check if images exist locally or on Docker Hub
if ! docker image inspect ${DOCKER_HUB_USERNAME}/tic-tac-toe-frontend:latest &> /dev/null; then
    print_warning "Frontend Docker image not found locally"
    print_status "Attempting to pull from Docker Hub..."
    if ! docker pull ${DOCKER_HUB_USERNAME}/tic-tac-toe-frontend:latest; then
        print_error "Frontend image not found locally or on Docker Hub"
        print_status "Please run: ./docker-push.sh first to build and push images"
        exit 1
    fi
fi

if ! docker image inspect ${DOCKER_HUB_USERNAME}/tic-tac-toe-backend:latest &> /dev/null; then
    print_warning "Backend Docker image not found locally"
    print_status "Attempting to pull from Docker Hub..."
    if ! docker pull ${DOCKER_HUB_USERNAME}/tic-tac-toe-backend:latest; then
        print_error "Backend image not found locally or on Docker Hub"
        print_status "Please run: ./docker-push.sh first to build and push images"
        exit 1
    fi
fi

print_success "Docker images are available!"

# Deploy with Terraform
print_status "Deploying infrastructure with Terraform..."

cd terraform

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init

# Plan the deployment
print_status "Planning Terraform deployment..."
terraform plan

# Apply the deployment
print_status "Applying Terraform configuration..."
terraform apply -auto-approve

print_success "Deployment completed successfully!"

# Display deployment information
print_status "Retrieving deployment information..."
ALB_DNS=$(terraform output -raw alb_dns_name)
FRONTEND_URL=$(terraform output -raw frontend_url)
BACKEND_URL=$(terraform output -raw backend_url)

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "=========================================="
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔌 Backend URL: $BACKEND_URL"
echo "🌐 Load Balancer: $ALB_DNS"
echo ""
echo "📊 Monitoring:"
echo "   - AWS Console: https://console.aws.amazon.com/ecs/"
echo "   - ECS Cluster: tic-tac-toe-cluster"
echo ""
echo "🔧 Management Commands:"
echo "   - Scale frontend: aws ecs update-service --cluster tic-tac-toe-cluster --service tic-tac-toe-frontend --desired-count <number>"
echo "   - Scale backend: aws ecs update-service --cluster tic-tac-toe-cluster --service tic-tac-toe-backend --desired-count <number>"
echo "   - View logs: aws logs tail /ecs/tic-tac-toe-frontend --follow"
echo ""
echo "💰 Cost Optimization:"
echo "   - Current configuration will auto-scale based on CPU/memory usage"
echo "   - Monitor costs in AWS Billing Console"
echo ""
echo "🎮 Ready to play Tic-Tac-Toe!"
echo "=========================================="

cd ..

print_success "Deployment script completed!" 
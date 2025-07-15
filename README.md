# Tic-Tac-Toe Game

A real-time multiplayer tic-tac-toe game built with Next.js frontend and WebSocket backend, deployable on AWS with auto-scaling capabilities.

## Project Structure

```
tic-tac-toe/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   └── components/      # React components
│   ├── public/              # Static assets
│   ├── package.json
│   ├── Dockerfile
│   └── next.config.ts
├── backend/                 # WebSocket server
│   ├── server.ts           # Main server file
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── terraform/              # AWS infrastructure as code
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── deploy.sh              # Deployment script
```

## Features

- **Real-time Multiplayer**: WebSocket-based communication for instant gameplay
- **Multiple Grid Sizes**: Support for 3x3 and 4x4 game boards
- **Score Tracking**: Persistent score tracking across games
- **Role Management**: Player and spectator roles with different permissions
- **AWS Deployment**: Scalable infrastructure with auto-scaling capabilities
- **Docker Support**: Containerized for easy deployment and development

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tic-tac-toe
   ```

2. **Start with Docker Compose (Recommended)**
   ```bash
   # Development mode with hot reload
   docker-compose -f docker-compose.dev.yml up

   # Production mode
   docker-compose up
   ```

3. **Manual Setup**
   ```bash
   # Backend
   cd backend
   npm install
   npm run dev

   # Frontend (in a new terminal)
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend WebSocket: ws://localhost:8080

### AWS Deployment

1. **Configure AWS credentials**
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_SESSION_TOKEN=your_session_token  # For student accounts
   ```

2. **Configure deployment**
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   # Edit terraform.tfvars with your settings
   ```

3. **Deploy to AWS**
   ```bash
   ./deploy.sh
   ```

## Tic-Tac-Toe Game Deployment Guide

This guide explains how to deploy the real-time multiplayer tic-tac-toe game on AWS with scalable infrastructure.

### Architecture Overview

The application is deployed using:
- **AWS ECS Fargate** for containerized services
- **Application Load Balancer (ALB)** for traffic distribution and WebSocket support
- **Auto Scaling Groups** for elastic scaling
- **VPC** with public/private subnets across multiple AZs
- **Multi-platform Docker images** (ARM64 + AMD64) for compatibility

## AWS Student Account Considerations

### **IAM Role Requirements**
For AWS Student accounts, use **LabRole** for task execution and task roles to avoid permission errors. The Terraform configuration automatically detects and uses LabRole if available.

## Docker Authentication

### **Public Docker Images (Recommended)**
For simplicity, make your Docker Hub repositories **public**. This requires no authentication:

1. Push your images to public Docker Hub repositories
2. No additional configuration needed in Terraform

## Scalability Features (NIST Rapid Elasticity)

### 1. Horizontal Auto Scaling
The infrastructure automatically scales based on:
- **CPU Utilization**: Scales when CPU > 70%
- **Memory Utilization**: Scales when memory > 80%
- **Request Count**: Scales based on incoming requests

### 2. Manual Scaling Configuration
You can configure scaling parameters in `terraform/terraform.tfvars`:

```hcl
# Frontend and Backend scaling can be configured independently

# Development Configuration
frontend_min_capacity = 1
frontend_max_capacity = 3
frontend_desired_capacity = 1
backend_min_capacity = 1
backend_max_capacity = 3
backend_desired_capacity = 1

# Production Configuration
frontend_min_capacity = 2
frontend_max_capacity = 10
frontend_desired_capacity = 3
backend_min_capacity = 2
backend_max_capacity = 8
backend_desired_capacity = 2

# High Traffic Configuration
frontend_min_capacity = 3
frontend_max_capacity = 20
frontend_desired_capacity = 5
backend_min_capacity = 3
backend_max_capacity = 15
backend_desired_capacity = 4
```

### 3. CPU and Memory Configuration for Different Loads
```hcl
# Light workload (Student account)
frontend_cpu = 256    # 0.25 vCPU
frontend_memory = 512 # 0.5 GB RAM
backend_cpu = 256
backend_memory = 512

# Medium workload (Student account)
frontend_cpu = 512    # 0.5 vCPU
frontend_memory = 1024 # 1 GB RAM
backend_cpu = 512
backend_memory = 1024

# Heavy workload (Student account)
frontend_cpu = 1024   # 1 vCPU
frontend_memory = 2048 # 2 GB RAM
backend_cpu = 1024
backend_memory = 2048
```

## Prerequisites

1. **AWS Student Account** with access credentials
2. **Terraform** >= 1.0 installed
3. **Docker** installed and running
4. **Docker Hub** account for image registry

## Quick Start

### 1. Configure Deployment
Copy and customize the configuration file:
```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Edit `terraform/terraform.tfvars` with your:
- AWS credentials (Access Key ID, Secret Access Key, Session Token)
- Docker Hub username
- Scaling parameters (optional)

### 2. Build and Push Docker Images
```bash
# Use the automated script for multi-platform builds
./docker-push.sh
```

**Note**: This script automatically builds multi-platform images (ARM64 + AMD64) and pushes to Docker Hub. Make sure your Docker Hub repositories are **public** or configure authentication as described above.

### 3. Deploy Infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

## Scaling Operations

### Manual Scaling
To manually scale your services:

```bash
# Scale frontend to 5 instances
aws ecs update-service --cluster tic-tac-toe-cluster \
                      --service tic-tac-toe-frontend \
                      --desired-count 5

# Scale backend to 3 instances
aws ecs update-service --cluster tic-tac-toe-cluster \
                      --service tic-tac-toe-backend \
                      --desired-count 3
```

### Update Scaling Parameters
Edit `terraform/terraform.tfvars` and run `terraform apply`:

Example for high-traffic scenario:
```hcl
frontend_min_capacity = 3
frontend_max_capacity = 15
frontend_desired_capacity = 5
backend_min_capacity = 2
backend_max_capacity = 10
backend_desired_capacity = 3
cpu_target_value = 60
memory_target_value = 70
```

### Auto Scaling Policies
The system includes multiple scaling policies:

1. **CPU-based scaling**: Targets 70% CPU utilization
2. **Memory-based scaling**: Targets 80% memory utilization
3. **Request-based scaling**: Scales based on request count per target

## Monitoring and Observability

### Key Metrics
Monitor your deployment through AWS Console:
- **ECS Service CPU/Memory utilization**
- **ALB request count and response times**
- **Target group health**
- **Auto scaling activities**

## Security Considerations

- Services run in private subnets
- ALB in public subnets with security groups
- IAM roles with least privilege (LabRole for student accounts)
- VPC with proper network ACLs

## Cleanup

To destroy all resources:
```bash
cd terraform
terraform destroy -auto-approve
```

## Support

For issues or questions:
1. Check ECS service status via AWS Console
2. Review Terraform state
3. Verify Docker images
4. Check AWS service limits 

## Game Rules

- **3x3 Grid**: Classic tic-tac-toe rules
- **4x4 Grid**: First to get 4 in a row (horizontal, vertical, or diagonal) wins
- **Real-time**: Moves are synchronized instantly between players
- **Spectator Mode**: Watch games without participating

## Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **WebSocket**: Native WebSocket API for real-time communication
- **State Management**: React hooks and context

### Backend (Node.js)
- **Runtime**: Node.js with TypeScript
- **WebSocket**: ws library for WebSocket server
- **Game Logic**: In-memory game state management
- **Scalability**: Stateless design for horizontal scaling

### AWS Infrastructure
- **Compute**: ECS Fargate for containerized services
- **Load Balancing**: Application Load Balancer
- **Networking**: VPC with public/private subnets
- **Scaling**: Auto Scaling Groups with CPU/memory triggers
- **Security**: Security groups and IAM roles

## Deployment Options

### Local Testing
- Docker Compose for local development and testing
- Hot reload support for both frontend and backend

### AWS Production
- Terraform Infrastructure as Code
- Auto-scaling from 1-50+ instances
- Multi-AZ deployment for high availability
- Load balancer for traffic distribution

## Configuration

### Environment Variables

**Frontend:**
- `NEXT_PUBLIC_WS_URL`: WebSocket server URL
- `NODE_ENV`: Environment (development/production)

**Backend:**
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)

### Terraform Variables
See `terraform/terraform.tfvars.example` for all configuration options including:
- Instance types and scaling limits
- AWS region and availability zones
- Security and networking settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with Docker Compose
5. Submit a pull request

## License

This project is licensed under the MIT License.

### Contibutors
- Opeyemi Bright Oginni - Group 40
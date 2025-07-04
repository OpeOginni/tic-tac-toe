# Project Structure

This document outlines the structure of the Tic-Tac-Toe project after reorganization into separate frontend and backend directories.

## Directory Structure

```
tic-tac-toe/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── api/           # API routes
│   │   │   │   └── health/    # Health check endpoint
│   │   │   ├── game/          # Game page
│   │   │   ├── globals.css    # Global styles
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── page.tsx       # Home page
│   │   │   └── favicon.ico    # Favicon
│   │   ├── components/        # React components
│   │   │   ├── GameStarter.tsx
│   │   │   └── TicTacToe.tsx
│   │   └── lib/               # Utility libraries
│   ├── public/                # Static assets
│   │   ├── *.svg             # SVG icons
│   │   └── favicon.ico       # Favicon
│   ├── package.json          # Frontend dependencies
│   ├── Dockerfile            # Frontend container
│   ├── tsconfig.json         # TypeScript config
│   ├── next.config.ts        # Next.js config
│   ├── eslint.config.mjs     # ESLint config
│   └── postcss.config.mjs    # PostCSS config
├── backend/                    # WebSocket server
│   ├── server.ts             # Main server file
│   ├── package.json          # Backend dependencies
│   ├── Dockerfile            # Backend container
│   └── tsconfig.json         # TypeScript config
├── terraform/                 # AWS infrastructure
│   ├── main.tf               # Main Terraform config
│   ├── variables.tf          # Input variables
│   ├── outputs.tf            # Output values
│   ├── vpc.tf                # VPC and networking
│   ├── security.tf           # Security groups and IAM
│   ├── ecs.tf                # ECS cluster and services
│   ├── alb.tf                # Application Load Balancer
│   ├── autoscaling.tf        # Auto-scaling policies
│   ├── terraform.tfvars      # Active configuration
│   ├── terraform.tfvars.example # Configuration template
│   ├── terraform.tfstate     # Terraform state
│   ├── terraform.tfstate.backup # Terraform state backup
│   └── .terraform/           # Terraform cache
├── docker-compose.yml         # Production Docker setup
├── docker-push.sh            # Docker build and push script
├── deploy.sh                 # Terraform deployment script
├── Dockerfile.frontend       # Root frontend Dockerfile (legacy)
├── Dockerfile.backend        # Root backend Dockerfile (legacy)
├── package.json              # Root package.json for monorepo
├── package-lock.json         # Root package lock
├── bun.lockb                 # Bun lock file
├── next-env.d.ts             # Next.js TypeScript definitions
├── .gitignore                # Git ignore rules
├── README.md                 # Main documentation
├── PROJECT_STRUCTURE.md      # This file
├── DEPLOYMENT.md             # Deployment guide
└── DEPLOYMENT_ISSUES_AND_SOLUTIONS.md # Deployment troubleshooting
```

## Key Changes from Original Structure

### 1. Separated Frontend and Backend

- **Frontend**: All Next.js related code moved to `frontend/` directory
- **Backend**: WebSocket server moved to `backend/` directory
- Each has its own `package.json`, `Dockerfile`, and `tsconfig.json`

### 2. Added Health Check Endpoint

- **Frontend API**: Added `/api/health` endpoint for AWS ECS health checks
- **Backend**: Built-in `/health` endpoint for load balancer health checks

### 3. Docker Configuration

- **Frontend Dockerfile**: `frontend/Dockerfile` - Multi-platform Next.js build
- **Backend Dockerfile**: `backend/Dockerfile` - Multi-platform Node.js server
- **Legacy Dockerfiles**: `Dockerfile.frontend` and `Dockerfile.backend` at root (kept for compatibility)
- **Multi-platform Support**: Docker images built for both ARM64 and AMD64 architectures

### 4. Terraform Infrastructure

- **Complete AWS Setup**: VPC, ECS, ALB, Auto-scaling, Security Groups
- **State Management**: Terraform state files for infrastructure tracking
- **Configuration Templates**: Example configurations for different environments
- **Independent Scaling**: Separate scaling policies for frontend and backend

### 5. Deployment Scripts

- **docker-push.sh**: Builds and pushes multi-platform Docker images
- **deploy.sh**: Handles Terraform deployment with validation
- **Separated Concerns**: Docker push separated from infrastructure deployment

### 6. Documentation

- **DEPLOYMENT.md**: Comprehensive deployment guide
- **DEPLOYMENT_ISSUES_AND_SOLUTIONS.md**: Troubleshooting guide with solutions to common issues
- **PROJECT_STRUCTURE.md**: This file documenting the project organization

## Development Workflow

### Local Development

```bash
# Install all dependencies
npm install

# Run frontend in development mode
cd frontend && npm run dev

# Run backend in development mode
cd backend && npm run dev
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Building and Deployment

```bash
# Build and push Docker images
./docker-push.sh

# Deploy infrastructure to AWS
./deploy.sh
```

## Port Configuration

- **Frontend**: Port 3000 (Next.js)
- **Backend**: Port 8080 (WebSocket server)
- **Load Balancer**: Port 80 (Frontend), Port 8080 (Backend)

## Environment Variables

### Frontend
- `NEXT_PUBLIC_WS_URL`: WebSocket server URL (defaults to `ws://localhost:8080`)

### Backend
- `PORT`: Server port (defaults to 8080)
- `NODE_ENV`: Environment mode (development/production)

## Docker Images

- **Frontend**: `opeoginni/tic-tac-toe-frontend:latest`
- **Backend**: `opeoginni/tic-tac-toe-backend:latest`
- **Multi-platform**: Both images support ARM64 and AMD64 architectures

## AWS Resources

- **ECS Cluster**: `tic-tac-toe-cluster`
- **ECS Services**: `tic-tac-toe-frontend` and `tic-tac-toe-backend`
- **Load Balancer**: Application Load Balancer with target groups
- **Auto Scaling**: Independent scaling policies for each service
- **VPC**: Custom VPC with public subnets across multiple AZs

## Benefits of This Structure

1. **Clear Separation**: Frontend and backend are completely separate
2. **Independent Scaling**: Each service can scale independently on AWS
3. **Health Monitoring**: Built-in health checks for both services
4. **Multi-platform Support**: Works on both development (ARM64) and production (AMD64)
5. **Infrastructure as Code**: Complete Terraform configuration for AWS
6. **Comprehensive Documentation**: Detailed guides for deployment and troubleshooting
7. **Production Ready**: Handles real-world deployment issues and edge cases

## Migration Notes

- Old `src/` directory content moved to `frontend/src/`
- Old `server/` directory content moved to `backend/`
- Docker image names updated to use separate repositories
- Terraform variables updated for independent scaling
- All configuration files moved to appropriate directories
- Added health check endpoints for AWS ECS compatibility
- Implemented multi-platform Docker builds for cross-architecture support 
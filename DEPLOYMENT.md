# Tic-Tac-Toe Game Deployment Guide

This guide explains how to deploy the real-time multiplayer tic-tac-toe game on AWS with scalable infrastructure.

## Architecture Overview

The application is deployed using:
- **AWS ECS Fargate** for containerized services
- **Application Load Balancer (ALB)** for traffic distribution and WebSocket support
- **Auto Scaling Groups** for elastic scaling
- **VPC** with public/private subnets across multiple AZs
- **Multi-platform Docker images** (ARM64 + AMD64) for compatibility

## AWS Student Account Considerations

### **Instance Type Limitations**
AWS Student accounts only support specific instance types:
- **t3.nano** (2 vCPU, 0.5 GB RAM)
- **t3.micro** (2 vCPU, 1 GB RAM) 
- **t3.small** (2 vCPU, 2 GB RAM)
- **t3.medium** (2 vCPU, 4 GB RAM)
- **t3.large** (2 vCPU, 8 GB RAM)

### **IAM Role Requirements**
For AWS Student accounts, use **LabRole** for task execution and task roles to avoid permission errors. The Terraform configuration automatically detects and uses LabRole if available.

### **Service Linked Roles**
If you see "the ECS service linked role could not be assumed", use the back button and try again. This happens when the service linked role doesn't exist yet in your account.

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

### 2. Build and Deploy
```bash
# Build and push Docker images
./docker-push.sh

# Deploy infrastructure
./deploy.sh
```

## Manual Deployment Steps

### 1. Build and Push Docker Images
```bash
# Use the automated script for multi-platform builds
./docker-push.sh
```

**Note**: This script automatically builds multi-platform images (ARM64 + AMD64) and pushes to Docker Hub. Make sure your Docker Hub repositories are **public** or configure authentication as described above.

### 2. Deploy Infrastructure
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

### Service Status
Check service status:
```bash
aws ecs describe-services --cluster tic-tac-toe-cluster --services tic-tac-toe-frontend tic-tac-toe-backend
```

## Troubleshooting

### Common Issues

1. **Services not starting**: Check ECS service status via AWS Console
2. **High latency**: Increase instance count or CPU/memory allocation
3. **WebSocket connection issues**: Verify ALB configuration and port 8080 access
4. **Auto scaling not working**: Check auto scaling activities
5. **Permission errors**: Ensure LabRole is used for student accounts
6. **Docker pull errors**: Verify images are public or authentication is configured
7. **Health check failures**: Ensure `/api/health` endpoint is accessible
8. **Environment variables not working**: Use standard Next.js runtime, not standalone mode
9. **Platform compatibility errors**: Ensure multi-platform Docker images (ARM64 + AMD64)

### Debugging Commands
```bash
# Check service status
aws ecs describe-services --cluster tic-tac-toe-cluster --services tic-tac-toe-frontend

# View auto scaling activities
aws application-autoscaling describe-scaling-activities --service-namespace ecs

# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Get load balancer DNS name
terraform output load_balancer_dns
```

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

## Advanced Scaling Scenarios

### Geographic Scaling
Update your `terraform.tfvars` file for different regions:

```hcl
# Deploy in us-east-1
aws_region = "us-east-1"

# Deploy in eu-west-1  
aws_region = "eu-west-1"
```

### Multi-Environment Scaling
Update your `terraform.tfvars` file for different environments:

```hcl
# Development
environment = "dev"
frontend_min_capacity = 1
frontend_max_capacity = 3
backend_min_capacity = 1
backend_max_capacity = 3

# Staging  
environment = "staging"
frontend_min_capacity = 2
frontend_max_capacity = 5
backend_min_capacity = 1
backend_max_capacity = 4

# Production
environment = "prod"
frontend_min_capacity = 3
frontend_max_capacity = 20
backend_min_capacity = 2
backend_max_capacity = 15
```

## Support

For issues or questions:
1. Check ECS service status via AWS Console
2. Review Terraform state
3. Verify Docker images
4. Check AWS service limits 
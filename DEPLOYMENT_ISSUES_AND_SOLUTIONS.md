# Deployment Issues and Solutions

This document chronicles all the deployment issues encountered during the AWS ECS deployment of the Tic-Tac-Toe application and their solutions.

## Table of Contents

1. [Project Structure Issues](#project-structure-issues)
2. [Docker Build Issues](#docker-build-issues)
3. [WebSocket Connection Problems](#websocket-connection-problems)
4. [Terraform Configuration Issues](#terraform-configuration-issues)
5. [AWS IAM Permission Issues](#aws-iam-permission-issues)
6. [Docker Platform Compatibility Issues](#docker-platform-compatibility-issues)
7. [Environment Variable Configuration Issues](#environment-variable-configuration-issues)
8. [Lessons Learned](#lessons-learned)

---

## Project Structure Issues

### Issue 1: Monorepo Structure
**Problem**: The project was initially structured as a monorepo with mixed frontend and backend files, making it difficult to containerize and deploy separately.

**Solution**: Restructured the project into separate directories:
```
tic-tac-toe/
├── frontend/          # Next.js application
├── backend/           # WebSocket server
├── terraform/         # AWS infrastructure
└── docker-compose.yml # Local development
```

**Files Changed**:
- Created separate `package.json` files for frontend and backend
- Created individual `Dockerfile` for each service
- Updated `docker-compose.yml` with separate build contexts

---

## Docker Build Issues

### Issue 2: Missing package-lock.json Files
**Problem**: After restructuring, Docker builds failed because `package-lock.json` files didn't exist in the new directories.

**Error**:
```
npm ERR! The package-lock.json file was created with a newer version of npm
```

**Solution**: Updated Dockerfiles to handle missing package-lock.json gracefully:
```dockerfile
# Handle both npm ci and npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
```

**Files Changed**:
- `frontend/Dockerfile`
- `backend/Dockerfile`

---

## WebSocket Connection Problems

### Issue 3: WebSocket Connection Failures
**Problem**: Frontend couldn't connect to the WebSocket backend after restructuring.

**Error**:
```
WebSocket connection failed: Error during WebSocket handshake
```

**Root Causes**:
1. Backend server was defaulting to port 3001 instead of 8080
2. Frontend had hardcoded fallback URL `ws://localhost:3001`
3. Missing health endpoint for debugging

**Solution**:
1. Fixed backend port configuration:
```typescript
const PORT = process.env.PORT || 8080;
```

2. Updated frontend WebSocket URL:
```typescript
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
```

3. Added health endpoint to backend:
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

**Files Changed**:
- `backend/src/server.ts`
- `frontend/src/components/TicTacToe.tsx`

---

## Terraform Configuration Issues

### Issue 4: ECS Task Definition Errors
**Problem**: Terraform validation failed due to missing IAM role references and incorrect image names.

**Error**:
```
Error: Reference to undeclared resource
```

**Solution**:
1. Updated ECS task definitions to use existing `LabRole`:
```hcl
execution_role_arn = data.aws_iam_role.lab_role.arn
task_role_arn      = data.aws_iam_role.lab_role.arn
```

2. Updated image names to match new structure:
```hcl
image = "${var.docker_hub_username}/tic-tac-toe-frontend:latest"
image = "${var.docker_hub_username}/tic-tac-toe-backend:latest"
```

**Files Changed**:
- `terraform/ecs.tf`
- `terraform/variables.tf`

### Issue 5: Missing Security Group Rules
**Problem**: ALB couldn't reach backend WebSocket service on port 8080.

**Solution**: Added missing ingress rule for WebSocket traffic:
```hcl
ingress {
  description = "WebSocket Backend"
  from_port   = 8080
  to_port     = 8080
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}
```

**Files Changed**:
- `terraform/security.tf`

---

## AWS IAM Permission Issues

### Issue 6: IAM Role Creation Forbidden
**Problem**: AWS student accounts don't have permission to create IAM roles.

**Error**:
```
Error: creating IAM Role (tic-tac-toe-ecs-autoscale-role): operation error IAM: CreateRole, 
https response error StatusCode: 403, RequestID: ..., api error AccessDenied: 
User: arn:aws:sts::...:assumed-role/voclabs/user... is not authorized to perform: 
iam:CreateRole on resource: arn:aws:iam::...:role/tic-tac-toe-ecs-autoscale-role 
because no identity-based policy allows the iam:CreateRole action
```

**Solution**: 
1. Removed custom IAM role creation
2. Used only the existing `LabRole` for all services:
```hcl
# Use LabRole for AWS Student accounts
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}
```

3. Updated all ECS task definitions to reference `data.aws_iam_role.lab_role.arn`

**Files Changed**:
- `terraform/security.tf` (removed custom IAM role resources)
- `terraform/ecs.tf` (updated role references)

---

## Docker Platform Compatibility Issues

### Issue 7: Container Platform Mismatch
**Problem**: Docker images built on Apple Silicon (ARM64) couldn't run on AWS ECS (AMD64).

**Error**:
```
Stopped reason: CannotPullContainerError: pull image manifest has been retried 7 time(s): 
image Manifest does not contain descriptor matching platform 'linux/amd64'
```

**Solution**: Implemented multi-platform Docker builds using Docker Buildx:

1. **Updated docker-push.sh script**:
```bash
# Setup Docker Buildx for multi-platform builds
docker buildx create --name multiplatform --use
docker buildx inspect --bootstrap

# Build for multiple platforms
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${DOCKER_HUB_USERNAME}/tic-tac-toe-frontend:latest \
    --push \
    .
```

2. **Benefits of multi-platform builds**:
   - ✅ Compatible with AWS ECS (AMD64)
   - ✅ Compatible with Apple Silicon (ARM64)
   - ✅ Compatible with Intel Macs (AMD64)
   - ✅ Future-proof for different architectures

**Files Changed**:
- `docker-push.sh`

---

## Environment Variable Configuration Issues

### Issue 8: Client-Side Environment Variables Not Working in Production
**Problem**: The frontend couldn't access the WebSocket URL in production, even though the `NEXT_PUBLIC_WS_URL` environment variable was set correctly in the ECS task definition.

**Error**:
```
WebSocket connection to 'ws://localhost:8080/?room=...' failed
// Should be connecting to ALB URL instead
```

**Root Cause**: 
Client-side environment variables in containerized Next.js applications can be unreliable because:
1. `NEXT_PUBLIC_*` variables are embedded at build time, not runtime
2. Container environment variables set at deployment time aren't always available to the client bundle
3. Complex runtime detection adds unnecessary complexity

**Solution**: Implemented server actions to securely pass configuration to client components:

1. **Created server action** (`frontend/src/app/actions.ts`):
```typescript
'use server';

export async function getWebSocketUrl(): Promise<string> {
  // Use regular environment variable (not NEXT_PUBLIC_)
  const wsUrl = process.env.WS_URL || 'ws://localhost:8080';
  return wsUrl;
}
```

2. **Updated TicTacToe component** to use server action:
```typescript
const [wsUrl, setWsUrl] = useState<string>('');

// Fetch WebSocket URL from server action
useEffect(() => {
  getWebSocketUrl().then(url => {
    console.log('WebSocket URL fetched from server:', url);
    setWsUrl(url);
  }).catch(err => {
    console.error('Failed to fetch WebSocket URL:', err);
    setWsUrl('ws://localhost:8080'); // fallback
  });
}, []);

// Wait for URL before connecting
useEffect(() => {
  if (!roomId || !playerId || !wsUrl) return;
  // ... WebSocket connection logic
}, [roomId, playerId, gridSize, wsUrl]);
```

3. **Updated Terraform configuration** to use regular environment variable:
```hcl
environment = [
  {
    name  = "WS_URL"  # Changed from NEXT_PUBLIC_WS_URL
    value = "ws://${aws_lb.main.dns_name}:8080"
  }
]
```

**Benefits of Server Action Approach**:
- ✅ **Secure**: WebSocket URL not exposed in client bundle
- ✅ **Reliable**: Server-side environment variables always work
- ✅ **Flexible**: Can change URL without rebuilding client
- ✅ **Clean**: No complex runtime detection needed
- ✅ **Type-safe**: Full TypeScript support

**Files Changed**:
- `frontend/src/app/actions.ts` (new server action)
- `frontend/src/components/TicTacToe.tsx` (updated to use server action)
- `terraform/ecs.tf` (changed environment variable name)

**Key Insight**: 
> **"Use server actions for configuration that needs to be dynamic at runtime"**
> 
> Server actions provide a clean, secure way to pass server-side configuration to client components without exposing sensitive information in the client bundle.

---

## Lessons Learned

### 1. Project Structure Best Practices
- **Separate concerns**: Keep frontend and backend in separate directories
- **Independent deployments**: Each service should have its own Dockerfile and package.json
- **Clear boundaries**: Use docker-compose for local development, separate containers for production

### 2. Docker Best Practices
- **Handle missing files gracefully**: Use conditional logic in Dockerfiles
- **Multi-platform builds**: Always build for target platform (AWS ECS uses AMD64)
- **Use Docker Buildx**: Essential for cross-platform compatibility

### 3. AWS Student Account Limitations
- **No IAM role creation**: Must use existing LabRole
- **Limited permissions**: Check AWS documentation for student account restrictions
- **Use data sources**: Reference existing resources instead of creating new ones

### 4. WebSocket Deployment Considerations
- **Port consistency**: Ensure all services use the same port configuration
- **Health endpoints**: Add health checks for debugging
- **Environment variables**: Use env vars for configuration flexibility

### 5. Next.js Environment Variable Best Practices
- **Use server actions**: For dynamic configuration that needs to be secure
- **Avoid NEXT_PUBLIC_* for sensitive data**: These are embedded in the client bundle
- **Server-side configuration**: Keep sensitive URLs and API keys on the server
- **Runtime flexibility**: Server actions allow changing configuration without rebuilds

### 6. Terraform Best Practices
- **Validate early**: Run `terraform plan` frequently
- **Use data sources**: Reference existing AWS resources
- **Modular configuration**: Separate concerns into different .tf files

### 7. Debugging Strategies
- **Layer-by-layer**: Fix one issue at a time
- **Check logs**: Use CloudWatch logs for ECS task debugging
- **Test locally**: Ensure Docker containers work locally before deploying
- **Question assumptions**: Sometimes the "simple" approach is better than the "optimized" one

---

## Quick Reference Commands

### Docker Commands
```bash
# Build multi-platform images
./docker-push.sh

# Test locally
docker-compose up --build

# Check image platforms
docker manifest inspect opeoginni/tic-tac-toe-frontend:latest
```

### Terraform Commands
```bash
# Validate configuration
terraform validate

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

### AWS ECS Commands
```bash
# Check service status
aws ecs describe-services --cluster tic-tac-toe-cluster --services tic-tac-toe-frontend

# Force new deployment
aws ecs update-service --cluster tic-tac-toe-cluster --service tic-tac-toe-frontend --force-new-deployment

# Check task logs
aws logs tail /ecs/tic-tac-toe-frontend --follow
```

---

## Summary

The deployment process encountered several common issues when moving from a monorepo to a microservices architecture on AWS ECS. The main categories of issues were:

1. **Structural**: Project organization and separation of concerns
2. **Docker**: Build processes and platform compatibility
3. **Networking**: WebSocket connections and port configurations
4. **AWS**: IAM permissions and service configurations
5. **Infrastructure**: Terraform configuration and resource management
6. **Configuration**: Environment variables and client-server communication

All issues were systematically resolved, with the final breakthrough being the implementation of server actions for secure, reliable configuration management. This approach eliminates the complexity of client-side environment variable handling while maintaining security and flexibility.

The final architecture successfully deploys a real-time multiplayer tic-tac-toe game with:
- ✅ Next.js frontend on ECS with server actions
- ✅ WebSocket backend on ECS  
- ✅ Application Load Balancer
- ✅ Auto-scaling capabilities
- ✅ Multi-platform Docker images
- ✅ Secure configuration management
- ✅ Proper security groups and networking 
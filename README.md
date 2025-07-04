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

## Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run linting
```

### Backend Development
```bash
cd backend
npm install
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript
npm run start      # Start production server
```

### Docker Development
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# Production testing
docker-compose up

# Build specific service
docker-compose build frontend
docker-compose build backend
```

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

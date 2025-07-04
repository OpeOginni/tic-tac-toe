output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "frontend_url" {
  description = "URL for the frontend application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "backend_url" {
  description = "URL for the backend WebSocket server"
  value       = "ws://${aws_lb.main.dns_name}:8080"
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}



output "docker_commands" {
  description = "Docker commands to build and push images"
  value = {
    frontend = [
      "docker build -f Dockerfile.frontend -t opeoginni/tic-tac-toe-frontend:latest .",
      "docker push opeoginni/tic-tac-toe-frontend:latest"
    ]
    backend = [
      "docker build -f Dockerfile.backend -t opeoginni/tic-tac-toe-backend:latest .",
      "docker push opeoginni/tic-tac-toe-backend:latest"
    ]
  }
} 
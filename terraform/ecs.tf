# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "tic-tac-toe-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "tic-tac-toe-cluster"
  }
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "tic-tac-toe-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn           = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${var.docker_hub_username}/tic-tac-toe-frontend:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "WS_URL"
          value = "ws://${aws_lb.main.dns_name}:8080"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      essential = true
      healthCheck = {
        command = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))\""]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "tic-tac-toe-frontend"
  }
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "tic-tac-toe-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn           = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${var.docker_hub_username}/tic-tac-toe-backend:latest"
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "8080"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      essential = true
      healthCheck = {
        command = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))\""]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "tic-tac-toe-backend"
  }
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "tic-tac-toe-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_listener.frontend,
  ]

  tags = {
    Name = "tic-tac-toe-frontend"
  }
}

# Backend ECS Service
resource "aws_ecs_service" "backend" {
  name            = "tic-tac-toe-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.backend,
  ]

  tags = {
    Name = "tic-tac-toe-backend"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/tic-tac-toe-frontend"
  retention_in_days = 7

  tags = {
    Name = "tic-tac-toe-frontend-logs"
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/tic-tac-toe-backend"
  retention_in_days = 7

  tags = {
    Name = "tic-tac-toe-backend-logs"
  }
} 
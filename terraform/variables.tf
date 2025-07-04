variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS Session Token (required for student accounts)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tic-tac-toe"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "docker_hub_username" {
  description = "Docker Hub username for image repositories"
  type        = string
  default     = "opeoginni"
}

# Frontend Configuration
variable "frontend_cpu" {
  description = "CPU units for frontend task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MB) for frontend task"
  type        = number
  default     = 512
}

variable "frontend_desired_capacity" {
  description = "Desired number of frontend instances"
  type        = number
  default     = 2
}

variable "frontend_min_capacity" {
  description = "Minimum number of frontend instances"
  type        = number
  default     = 1
}

variable "frontend_max_capacity" {
  description = "Maximum number of frontend instances"
  type        = number
  default     = 10
}

# Backend Configuration
variable "backend_cpu" {
  description = "CPU units for backend task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory (MB) for backend task"
  type        = number
  default     = 512
}

variable "backend_desired_capacity" {
  description = "Desired number of backend instances"
  type        = number
  default     = 2
}

variable "backend_min_capacity" {
  description = "Minimum number of backend instances"
  type        = number
  default     = 1
}

variable "backend_max_capacity" {
  description = "Maximum number of backend instances"
  type        = number
  default     = 10
}

# Scaling Configuration
variable "cpu_target_value" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

variable "instance_type" {
  description = "EC2 instance type (AWS Student: nano, micro, small, medium, large only)"
  type        = string
  default     = "t3.small"
  
  validation {
    condition = can(regex("^t3\\.(nano|micro|small|medium|large)$", var.instance_type))
    error_message = "For AWS Student accounts, only t3.nano, t3.micro, t3.small, t3.medium, and t3.large are supported."
  }
} 
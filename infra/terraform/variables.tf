variable "master_ip" {
  type        = string
  description = "Public IP of k3s master node"
}

variable "worker_ip" {
  type        = string
  description = "Public IP of k3s worker node"
}

variable "master_private_ip" {
  type        = string
  description = "Private IP of master node (for k3s agent join)"
}

variable "ssh_user" {
  type    = string
  default = "ubuntu"
}

variable "ssh_private_key_path" {
  type    = string
  default = "~/.ssh/id_rsa"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "app_image_tag" {
  type    = string
  default = "latest"
}

variable "app_image_repository" {
  type    = string
  default = "ghcr.io/sashaflake/auth-service"
}

variable "app_hostname" {
  type    = string
  default = "auth.example.com"
}

variable "grafana_hostname" {
  type    = string
  default = "grafana.example.com"
}

variable "grafana_admin_password" {
  type      = string
  sensitive = true
}

variable "letsencrypt_email" {
  type = string
}

variable "cors_allowed_hosts" {
  type    = string
  default = "http://localhost:3000"
}

variable "namespace" {
  type    = string
  default = "auth"
}

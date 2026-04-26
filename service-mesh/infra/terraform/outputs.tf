output "kubeconfig_path" {
  value       = "${path.module}/kubeconfig.yaml"
}

output "master_ip" {
  value = var.master_ip
}

output "grafana_url" {
  value = "http://${var.master_ip}:32000"
}

output "auth_service_url" {
  value = "http://${var.master_ip}:30080/graphql"
}

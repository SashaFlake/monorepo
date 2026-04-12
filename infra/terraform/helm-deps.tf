resource "null_resource" "helm_deps" {
  depends_on = [null_resource.k3s_worker]
  provisioner "local-exec" {
    command = "helm dependency update ${path.module}/../../infra/helm/auth-service"
  }
  triggers = {
    chart_lock = filemd5("${path.module}/../../infra/helm/auth-service/Chart.yaml")
  }
}

resource "helm_release" "kube_prometheus" {
  depends_on       = [null_resource.helm_deps]
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  version          = "58.7.2"
  namespace        = "monitoring"
  create_namespace = true
  set { name = "grafana.adminPassword"; value = var.grafana_admin_password }
  set { name = "grafana.ingress.enabled"; value = "true" }
  set { name = "grafana.ingress.hosts[0]"; value = var.grafana_hostname }
  set { name = "grafana.ingress.ingressClassName"; value = "nginx" }
  timeout = 600
}

resource "kubernetes_config_map" "grafana_dashboards" {
  depends_on = [helm_release.kube_prometheus]
  metadata {
    name      = "grafana-dashboards"
    namespace = "monitoring"
    labels    = { grafana_dashboard = "1" }
  }
  data = {
    for f in fileset("${path.module}/../ops/grafana/dashboards", "*.json") :
    f => file("${path.module}/../ops/grafana/dashboards/${f}")
  }
}

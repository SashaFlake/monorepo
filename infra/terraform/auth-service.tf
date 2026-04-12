resource "kubernetes_namespace" "auth" {
  depends_on = [null_resource.helm_deps]
  metadata {
    name = var.namespace
    labels = { "app.kubernetes.io/managed-by" = "terraform" }
  }
}

resource "helm_release" "auth_service" {
  depends_on = [kubernetes_namespace.auth, helm_release.cert_manager, helm_release.ingress_nginx]
  name       = "auth-service"
  chart      = "${path.module}/../../infra/helm/auth-service"
  namespace  = var.namespace

  set { name = "image.repository"; value = var.app_image_repository }
  set { name = "image.tag";        value = var.app_image_tag }
  set { name = "ingress.host";     value = var.app_hostname }
  set_sensitive { name = "env.JWT_SECRET"; value = var.jwt_secret }
  set { name = "env.STORAGE_IN_MEMORY"; value = "false" }
}

resource "helm_release" "ingress_nginx" {
  depends_on       = [null_resource.helm_deps]
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  version          = "4.10.1"
  namespace        = "ingress-nginx"
  create_namespace = true
  timeout          = 300
}

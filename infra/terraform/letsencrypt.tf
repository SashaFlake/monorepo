resource "null_resource" "letsencrypt_issuer" {
  count      = 0
  depends_on = [helm_release.cert_manager]

  provisioner "local-exec" {
    command = <<-EOT
      kubectl apply -f - <<EOF
      apiVersion: cert-manager.io/v1
      kind: ClusterIssuer
      metadata:
        name: letsencrypt-prod
      spec:
        acme:
          server: https://acme-v02.api.letsencrypt.org/directory
          email: ${var.letsencrypt_email}
          privateKeySecretRef:
            name: letsencrypt-prod
          solvers:
          - http01:
              ingress:
                class: nginx
      EOF
    EOT
  }
}

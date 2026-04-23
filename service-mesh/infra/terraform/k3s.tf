resource "null_resource" "k3s_master" {
  connection {
    type        = "ssh"
    host        = var.master_ip
    user        = var.ssh_user
    private_key = file(var.ssh_private_key_path)
  }
  provisioner "remote-exec" {
    inline = [
      "curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC='server --disable traefik' sh -s -",
      "sudo systemctl enable k3s && sudo systemctl start k3s",
      "sudo k3s kubectl wait --for=condition=Ready node --all --timeout=120s",
    ]
  }
  triggers = { master_ip = var.master_ip }
}

resource "null_resource" "fetch_kubeconfig" {
  depends_on = [null_resource.k3s_master]
  provisioner "local-exec" {
    command = <<-EOT
      ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=no ${var.ssh_user}@${var.master_ip} \
        'sudo cat /etc/rancher/k3s/k3s.yaml' \
        | sed 's|https://127.0.0.1:6443|https://${var.master_ip}:6443|g' \
        > ${path.module}/kubeconfig.yaml
    EOT
  }
  triggers = { master_ip = var.master_ip }
}

resource "null_resource" "fetch_node_token" {
  depends_on = [null_resource.k3s_master]
  provisioner "local-exec" {
    command = <<-EOT
      ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=no ${var.ssh_user}@${var.master_ip} \
        'sudo cat /var/lib/rancher/k3s/server/node-token' > ${path.module}/node-token.txt
    EOT
  }
  triggers = { master_ip = var.master_ip }
}

resource "null_resource" "k3s_worker" {
  depends_on = [null_resource.k3s_master, null_resource.fetch_node_token, null_resource.fetch_kubeconfig]
  provisioner "local-exec" {
    command = <<-EOT
      NODE_TOKEN=$(cat ${path.module}/node-token.txt | tr -d '\n')
      ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=no ${var.ssh_user}@${var.master_ip} \
        "ssh -o StrictHostKeyChecking=no ${var.ssh_user}@${var.master_private_ip} \
         'curl -sfL https://get.k3s.io | K3S_URL=https://${var.master_private_ip}:6443 K3S_TOKEN=$${NODE_TOKEN} sh -'"
    EOT
  }
  triggers = { master_ip = var.master_ip; worker_ip = var.worker_ip }
}

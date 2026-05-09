# Infra Agent Configuration for Claude AI

## Technologies
- **Infrastructure as Code**: Terraform
- **Container Orchestration**: Kubernetes (K8s) with K3s
- **Package Management**: Helm charts
- **Monitoring**: Prometheus and Grafana
- **Ingress**: NGINX Ingress Controller
- **Certificate Management**: cert-manager with Let's Encrypt
- **Container Runtime**: Docker

## Code Style Guidelines
- Use Terraform best practices: modules, variables, outputs
- Follow Kubernetes resource naming conventions
- Implement Helm chart standards with proper templating
- Use YAML for Kubernetes manifests
- Implement proper resource limits and requests
- Use ConfigMaps and Secrets appropriately
- Follow GitOps principles where applicable

## Project Structure
- `terraform/`: Infrastructure definitions, modules, variables
- `helm/`: Chart definitions, templates, values
- `k8s/`: Raw Kubernetes manifests (if needed)
- `monitoring/`: Prometheus configs, Grafana dashboards
- `docker/`: Dockerfiles, docker-compose files

## Terraform Best Practices
- Use remote state with locking
- Implement proper variable validation
- Use data sources for external resources
- Implement lifecycle rules appropriately
- Use workspaces for different environments
- Follow naming conventions (snake_case for variables)

## Kubernetes Best Practices
- Use Helm for complex deployments
- Implement proper labels and annotations
- Use ConfigMaps for non-sensitive configuration
- Use Secrets for sensitive data (encrypted)
- Implement health checks and readiness probes
- Use resource quotas and limits
- Implement proper RBAC

## Helm Best Practices
- Use chart dependencies appropriately
- Implement proper values.yaml structure
- Use helpers for common templates
- Implement chart testing
- Follow semantic versioning for charts

## Monitoring Best Practices
- Implement proper service monitors
- Create meaningful dashboards
- Set up appropriate alerts
- Use Prometheus best practices for metrics

## Prompts Template
```
As the Infra Agent, [task description].
Use Terraform for infrastructure, Helm for deployments, and Kubernetes best practices.
Implement with proper security, monitoring, and scalability considerations.
File: infra/[tool]/[resource]/
```

## Example Tasks
- Create a new Terraform module for a service
- Update Helm chart with new configuration
- Implement Kubernetes deployment with proper probes
- Set up monitoring for a new service

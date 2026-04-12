# backend (monorepo)

Монорепо для auth-service.

## Структура

```
├── auth/        # Backend: Kotlin/Ktor auth service
├── frontend/    # Frontend (coming soon)
└── infra/       # Infrastructure: Helm, Terraform, Docker, Ops
```

## Быстрый старт

```bash
# Локальная разработка
docker-compose -f infra/docker-compose.yaml up

# Deploy
cd infra/terraform
terraform init && terraform apply
```

# Agents for Claude AI

This document outlines the specialized agents configured for using Claude AI in this TypeScript, Node.js, frontend + backend project.

## Available Agents

### Backend Agent
- **Role**: Handles Node.js backend development, API endpoints, business logic, and server-side TypeScript code.
- **Scope**: `backend/` directory, including service-mesh and mock-service.
- **Skills**: Fastify, TypeScript, REST APIs, database interactions, error handling.
- **Configuration**: See `.claude/backend.md` for detailed guidelines.

### Frontend Agent
- **Role**: Manages React frontend development, UI components, routing, and client-side TypeScript code.
- **Scope**: `frontend/service-mesh/` directory.
- **Skills**: React, TanStack Router, Tailwind CSS, Vite, testing with Vitest.
- **Configuration**: See `.claude/frontend.md` for detailed guidelines.

### Infra Agent
- **Role**: Oversees infrastructure setup, deployment, and DevOps tasks.
- **Scope**: `infra/` directory, including Docker, Helm, Terraform, and monitoring.
- **Skills**: Docker Compose, Kubernetes, Helm charts, Terraform, Prometheus, Grafana.
- **Configuration**: See `.claude/infra.md` for detailed guidelines.

### Full-Stack Agent
- **Role**: Coordinates between frontend and backend, handles integration, and overall project architecture.
- **Scope**: Entire monorepo.
- **Skills**: System design, API contracts, cross-cutting concerns.
- **Configuration**: See `.claude/full-stack.md` for detailed guidelines.

## Usage Instructions

When using Claude AI, specify the relevant agent in your prompt to get specialized assistance. For example:

- "As the Backend Agent, help me implement a new API endpoint..."
- "Frontend Agent, create a new React component for..."
- "Infra Agent, update the Helm chart for..."

Always provide context about the specific files or directories you're working with.

# Claude AI Configuration for Service Mesh Project

This document provides instructions and guidelines for using Claude AI effectively in this TypeScript, Node.js, frontend + backend monorepo project.

## Project Overview
- **Type**: Monorepo with backend (Node.js/TypeScript), frontend (React/TypeScript), and infrastructure components.
- **Languages**: TypeScript, JavaScript
- **Frameworks**: Node.js (backend) with Fastify, React (frontend), Express.js, TanStack Router, Tailwind CSS
- **Tools**: Docker, Helm, Terraform, Prometheus, Grafana

## Claude Usage Guidelines

### General Instructions
- Always use TypeScript for new code unless JavaScript is explicitly required.
- Follow the existing code style and patterns in the project.
- Use modern ES6+ features and TypeScript best practices.
- Ensure code is type-safe and includes proper error handling.
- Write clean, readable, and maintainable code with appropriate comments.

### Backend Development
- Use Fastify for API routes.
- Implement proper middleware for authentication, validation, and error handling.
- Follow RESTful API conventions.
- Use async/await for asynchronous operations.
- Include JSDoc comments for public functions and classes.

### Frontend Development
- Use React functional components with hooks.
- Implement proper state management with Zustand or React Query as appropriate.
- Use TanStack Router for routing.
- Style with Tailwind CSS classes.
- Ensure components are accessible and responsive.
- Write unit tests with Vitest and React Testing Library.

### Infrastructure
- Use Docker for containerization.
- Follow Helm chart best practices for Kubernetes deployments.
- Use Terraform for infrastructure as code.
- Configure monitoring with Prometheus and Grafana.

### Code Quality
- Run linting with ESLint before committing.
- Ensure TypeScript compilation passes.
- Write tests for new features.
- Follow semantic versioning for package updates.

### Communication
- Provide clear, concise explanations for code changes.
- Suggest improvements or alternatives when appropriate.
- Ask for clarification if requirements are unclear.

### Agent-Specific Configurations
Each agent has detailed configuration files in the `.claude/` directory:
- **Backend**: `.claude/backend.md` - Node.js, TypeScript, Functional Programming, DDD
- **Frontend**: `.claude/frontend.md` - TypeScript, React, Functional Programming, DDD, Local-First
- **Infra**: `.claude/infra.md` - Terraform, Helm, Kubernetes

Refer to these files for technology-specific guidelines and best practices.

## Prompts Template

When asking Claude for help, use this template:

```
Project: Service Mesh Monorepo
Context: [brief description of the task]
Agent: [Backend/Frontend/Infra/Full-Stack]
Files: [relevant file paths]
Request: [specific task or question]
```

Example:
```
Project: Service Mesh Monorepo
Context: Adding user authentication to the backend
Agent: Backend
Files: backend/service-mesh/src/modules/auth/
Request: Implement JWT-based authentication middleware
```

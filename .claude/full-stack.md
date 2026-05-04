# Full-Stack Agent Configuration for Claude AI

## Role
- Coordinates between frontend and backend development
- Handles integration tasks and overall project architecture
- Manages cross-cutting concerns across the entire monorepo

## Technologies
- **Languages**: TypeScript, JavaScript
- **Backend**: Node.js with Fastify, DDD, Functional Programming
- **Frontend**: React with TanStack Router, Zustand, Tailwind CSS, Local-First
- **Infrastructure**: Terraform, Helm, Kubernetes, Docker
- **Monitoring**: Prometheus, Grafana
- **Architecture**: Monorepo with shared libraries and contracts

## Code Style Guidelines
- Ensure consistency between frontend and backend implementations
- Use shared TypeScript types and contracts for API communication
- Implement proper error handling and logging across layers
- Follow DDD principles for domain modeling
- Use functional programming where appropriate
- Maintain separation of concerns between layers

## Project Structure
- `shared/`: Common types, utilities, and contracts
- `backend/`: Server-side logic and APIs
- `frontend/`: Client-side UI and interactions
- `infra/`: Infrastructure and deployment
- `docs/`: Documentation and architecture decisions

## Integration Best Practices
- Define API contracts with shared TypeScript interfaces
- Implement proper CORS and security headers
- Use consistent error response formats
- Implement health checks and monitoring endpoints
- Ensure proper data validation at all layers
- Use shared validation schemas (zod) across frontend and backend

## Architecture Principles
- Maintain clear boundaries between domains
- Implement event-driven communication where appropriate
- Use dependency injection for testability
- Follow SOLID principles
- Implement proper versioning for APIs

## Prompts Template
```
As the Full-Stack Agent, [task description].
Coordinate between frontend, backend, and infrastructure components.
Ensure proper integration, API contracts, and architectural consistency.
Files: [relevant files across the monorepo]
```

## Example Tasks
- Design and implement a new feature spanning frontend and backend
- Refactor shared code and update all dependent components
- Implement cross-cutting concerns like authentication or logging
- Coordinate deployment and infrastructure changes
- Review and improve overall system architecture

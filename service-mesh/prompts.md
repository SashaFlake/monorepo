# Prompts for Claude AI

This file contains example prompts and templates for using Claude AI effectively in the Service Mesh project.

## Backend Prompts

### API Endpoint Creation
```
As the Backend Agent, create a new REST API endpoint for [describe functionality].
Use Express.js router, implement proper TypeScript types, include input validation with middleware, and add error handling.
File: backend/service-mesh/src/modules/[module]/presentation/[endpoint].ts
```

### Database Model
```
As the Backend Agent, design and implement a TypeScript interface and class for [entity name].
Include proper typing, validation, and methods for CRUD operations.
File: backend/service-mesh/src/modules/[module]/domain/[entity].ts
```

### Middleware Implementation
```
As the Backend Agent, implement [middleware type] middleware for [purpose].
Ensure it integrates with the existing Express.js setup and includes proper TypeScript types.
File: backend/service-mesh/src/shared/[middleware].ts
```

## Frontend Prompts

### React Component
```
As the Frontend Agent, create a new React functional component for [component purpose].
Use TypeScript, hooks, and Tailwind CSS for styling. Include proper prop types and default values.
File: frontend/service-mesh/src/components/[component].tsx
```

### Route Implementation
```
As the Frontend Agent, implement a new route for [route description] using TanStack Router.
Include route configuration, component, and any necessary loaders or actions.
File: frontend/service-mesh/src/routes/[route].tsx
```

### State Management
```
As the Frontend Agent, add state management for [feature] using Zustand store.
Include actions, selectors, and integrate with React Query if needed.
File: frontend/service-mesh/src/store/[store].ts
```

## Infrastructure Prompts

### Docker Configuration
```
As the Infra Agent, update the Dockerfile for [service] to [improvement].
Ensure it follows best practices for security and performance.
File: [service]/Dockerfile
```

### Helm Chart Update
```
As the Infra Agent, modify the Helm chart for [service] to [change].
Update templates, values, and ensure compatibility with Kubernetes.
File: infra/helm/[service]/
```

### Terraform Resource
```
As the Infra Agent, add a new Terraform resource for [resource type].
Include proper configuration, variables, and outputs.
File: infra/terraform/[resource].tf
```

## Full-Stack Prompts

### Feature Implementation
```
As the Full-Stack Agent, implement end-to-end functionality for [feature].
This includes backend API, frontend UI, and any necessary infrastructure changes.
Provide implementation plan and coordinate between components.
```

### Bug Fix
```
As the Full-Stack Agent, investigate and fix the bug in [describe issue].
Check both frontend and backend code, identify root cause, and implement fix with tests.
```

### Performance Optimization
```
As the Full-Stack Agent, optimize performance for [component/feature].
Analyze bottlenecks, suggest improvements, and implement changes across the stack.
```

## General Prompts

### Code Review
```
Review the following code for [language/framework]. Check for:
- TypeScript best practices
- Code quality and readability
- Security issues
- Performance considerations
- Test coverage suggestions

Code:
[paste code here]
```

### Testing
```
Write comprehensive tests for [functionality] using [testing framework].
Include unit tests, integration tests, and edge cases.
File: [test file path]
```

### Documentation
```
Generate documentation for [component/module].
Include API reference, usage examples, and any important notes.
Format: Markdown
```

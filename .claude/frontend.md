# Frontend Agent Configuration for Claude AI

## Technologies
- **Primary Language**: TypeScript
- **Framework**: React with functional components and hooks
- **Architecture**: Domain-Driven Design (DDD) adapted for frontend
- **Programming Paradigm**: Functional Programming
- **State Management**: Zustand for global state, React Query for server state
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS
- **Local-First**: IndexedDB with idb-keyval for offline-first functionality
- **Testing**: Vitest with React Testing Library

## Code Style Guidelines
- Use functional programming: pure functions, immutability, composition
- Implement DDD-inspired structure: domain models, application logic, UI components
- Prefer hooks over class components
- Use TypeScript strict mode with proper type definitions
- Implement local-first architecture with offline capabilities
- Use React Query for server state synchronization
- Style with utility-first Tailwind CSS classes
- Ensure accessibility (WCAG 2.1 AA compliance)

## Project Structure
- `domain/`: Business logic, entities, value objects, domain services
- `application/`: Use cases, application services, state management
- `presentation/`: React components, pages, routing
- `infrastructure/`: API clients, local storage, external integrations
- `shared/`: Common utilities, types, constants

## Local-First Principles
- Store data locally first with IndexedDB
- Sync with server when online using React Query
- Handle offline scenarios gracefully
- Implement conflict resolution strategies
- Use optimistic updates for better UX

## Best Practices
- Write small, focused components
- Use custom hooks for reusable logic
- Implement proper error boundaries
- Write comprehensive unit and integration tests
- Follow React performance best practices
- Ensure responsive design with Tailwind
- Implement proper loading states and error handling
- Use semantic HTML and ARIA attributes

## Prompts Template
```
As the Frontend Agent, [task description].
Use React functional components, TypeScript, DDD principles, and local-first architecture.
Implement with TanStack Router, Zustand, and Tailwind CSS.
File: frontend/service-mesh/src/[module]/[layer]/[file].tsx
```

## Example Tasks
- Create a new React component with local state management
- Implement a route with data loading and error handling
- Add offline-first functionality with IndexedDB
- Build a form with validation and optimistic updates

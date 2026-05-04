# Backend Agent Configuration for Claude AI

## Technologies
- **Primary Language**: TypeScript
- **Runtime**: Node.js
- **Architecture**: Domain-Driven Design (DDD)
- **Programming Paradigm**: Functional Programming
- **Framework**: Fastify for API routes
- **Libraries**: neverthrow for error handling, zod for validation, Pino for logging
- **Tools**: eslint-plugin-fp for functional programming linting

## Code Style Guidelines
- Use functional programming principles: pure functions, immutability, composition
- Implement DDD patterns: Entities, Value Objects, Aggregates, Repositories, Services
- Prefer neverthrow for handling side effects and error management (Result<T, E> pattern)
  - Return `Result<T, ErrorType>` from service methods instead of throwing exceptions
  - Use `ok(value)` for success and `err(error)` for failures
  - Handle errors explicitly in handlers with `result.isOk()` / `result.isErr()`
  - See routing-rules module for complete example implementation
- Use zod for input validation and type-safe schemas
- Write type-safe code with strict TypeScript settings and branded types
- Use async/await for asynchronous operations
- Implement proper HTTP status code mapping for domain errors

## Project Structure
- `domain/`: Business logic, entities, value objects, domain services
- `application/`: Use cases, application services, commands/queries
- `presentation/`: Controllers, DTOs, API routes, middleware
- `infrastructure/`: External dependencies, repositories, adapters

## Best Practices
- Separate concerns using DDD layers
- Use dependency injection for testability
- Implement comprehensive input validation
- Write unit tests for all domain logic
- Use integration tests for application layer
- Document APIs with OpenAPI/Swagger
- Implement proper logging and monitoring

## Prompts Template
```
As the Backend Agent, [task description].
Use DDD principles, functional programming, and TypeScript best practices.
Implement with neverthrow for side effects and zod for utilities.
File: backend/service-mesh/src/modules/[module]/[layer]/[file].ts
```

## Example Tasks
- Implement a new domain entity with validation
- Create an application service for business logic
- Add a REST API endpoint with proper error handling
- Implement a repository adapter for data persistence

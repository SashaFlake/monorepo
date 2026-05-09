# Claude Configuration

This file contains configuration settings for Claude AI usage in the Service Mesh project.

## Model Preferences
- Primary Model: claude-3-5-sonnet-20241022
- Fallback Model: claude-3-haiku-20240307
- Max Tokens: 4096 for code generation, 8192 for analysis

## Code Style Rules
- Indentation: 2 spaces (except for YAML files which use 2 spaces)
- Line Length: 100 characters
- Quotes: Single quotes for JavaScript/TypeScript strings
- Semicolons: Required
- Trailing Commas: Required in multi-line objects/arrays

## File Patterns to Ignore
- node_modules/
- dist/
- build/
- .git/
- *.log
- .env*
- coverage/
- .DS_Store

## Custom Instructions
- Always check for existing patterns before suggesting new implementations
- Prefer functional programming paradigms where appropriate
- Use Effect library for side effects in backend code
- Ensure all new code includes proper TypeScript types
- Follow the project's existing error handling patterns

## API Keys and Secrets
- Never generate or suggest real API keys
- Use placeholder values like 'YOUR_API_KEY_HERE' for secrets
- Remind users to use environment variables for sensitive data

## Testing Requirements
- Unit tests for all new functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage

## Documentation Standards
- JSDoc for all public APIs
- README updates for new features
- Inline comments for complex logic
- API documentation with examples

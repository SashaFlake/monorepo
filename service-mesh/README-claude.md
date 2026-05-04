# How to Use Claude AI Configuration Files

This guide explains how to effectively use the Claude AI configuration files in your Service Mesh project.

## File Structure Overview

```
service-mesh/
├── agents.md                    # Agent definitions and usage instructions
├── claude.md                    # Main configuration and guidelines
├── prompts.md                   # Example prompts for different tasks
└── .claude/
    ├── config.md               # General configuration settings
    ├── .claudeignore          # Files to ignore during analysis
    ├── backend.md             # Backend-specific guidelines
    ├── frontend.md            # Frontend-specific guidelines
    └── infra.md               # Infrastructure-specific guidelines
```

## Integration Methods

### 1. IDE Integration (Cursor, VS Code with Claude extensions)

If you're using an IDE with Claude integration:

1. **Reference in Prompts**: When asking Claude for help, mention the relevant configuration files:
   ```
   According to our project guidelines in .claude/backend.md, please implement...
   ```

2. **Context Awareness**: Some IDE extensions can read project files. Place these files in the root to ensure Claude has access to them.

### 2. API Usage

When using Claude via API:

1. **Include Context**: Add relevant configuration content to your system prompt:
   ```
   You are working on a TypeScript/Node.js project. Follow these guidelines:
   [paste content from claude.md and relevant agent config]
   ```

2. **File References**: Use the files as templates for your prompts.

### 3. Manual Usage

1. **Read Before Prompting**: Always review the relevant configuration file before asking Claude for help.

2. **Copy-Paste Guidelines**: Include key guidelines in your prompts:
   ```
   Project: Service Mesh Monorepo
   Agent: Backend
   Guidelines: Use DDD, functional programming, Effect library
   Task: Implement user authentication
   ```

## Best Practices

### Agent Selection
- **Backend Agent**: For Node.js/TypeScript server-side code
- **Frontend Agent**: For React/TypeScript client-side code
- **Infra Agent**: For Terraform, Helm, Kubernetes configurations
- **Full-Stack Agent**: For cross-cutting concerns and integration

### Prompt Structure
Always use the template from `claude.md`:

```
Project: Service Mesh Monorepo
Context: [brief description]
Agent: [Backend/Frontend/Infra/Full-Stack]
Files: [relevant file paths]
Request: [specific task]
```

### Configuration Updates
- Keep these files updated as your project evolves
- Add new patterns or technologies as they are adopted
- Review and refine prompts.md with successful examples

## Example Workflow

1. **Identify Task**: "I need to add a new API endpoint for user management"

2. **Select Agent**: Backend Agent

3. **Review Config**: Read `.claude/backend.md` for DDD and functional programming guidelines

4. **Craft Prompt**:
   ```
   Project: Service Mesh Monorepo
   Context: Adding user management functionality
   Agent: Backend
   Files: backend/service-mesh/src/modules/users/
   Request: Implement a REST API endpoint for user CRUD operations using DDD principles and functional programming
   ```

5. **Execute**: Claude will generate code following your established patterns

## Maintenance

- **Version Control**: Commit these files to your repository
- **Team Sharing**: Ensure all team members know about these configurations
- **Regular Updates**: Update guidelines as best practices evolve
- **Feedback Loop**: Add successful prompts to `prompts.md`

## Troubleshooting

- **Inconsistent Output**: Reference specific config files in prompts
- **Missing Context**: Include more details from the configuration files
- **New Technologies**: Add new sections to relevant config files
- **Team Alignment**: Use these files in code reviews and onboarding

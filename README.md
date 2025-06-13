# Gerard CLI

A TypeScript CLI tool for managing OpenAI vector stores.

## Installation

```bash
npm install
npm run build
```

## Usage

Set your OpenAI API key:
```bash
export OPENAI_API_KEY=your_api_key_here
```

### Commands

- `gerard create <name>` - Create a new vector store
- `gerard list` - List all vector stores
- `gerard delete <id>` - Delete a vector store by ID

### Examples

```bash
# Create a new vector store
gerard create "My Documents"

# List all vector stores
gerard list

# Delete a vector store
gerard delete vs_abc123def456
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Run integration tests (requires OPENAI_API_KEY)
npm run test:integration

# Lint
npm run lint

# Type check
npm run typecheck
```
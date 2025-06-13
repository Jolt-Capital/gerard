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
- `gerard add-file <vectorStoreId> <filePath>` - Upload a file to a vector store
- `gerard list-files <vectorStoreId>` - List all files in a vector store
- `gerard delete-file <vectorStoreId> <fileId>` - Delete a file from a vector store
- `gerard add-dir <vectorStoreId> <directoryPath>` - Add all files from a directory
- `gerard chat <vectorStoreId>` - Start interactive chat with a vector store

### Examples

```bash
# Create a new vector store
gerard create "My Documents"

# List all vector stores
gerard list

# Delete a vector store
gerard delete vs_abc123def456

# Add a file to a vector store
gerard add-file vs_abc123def456 ./documents/manual.pdf

# List files in a vector store
gerard list-files vs_abc123def456

# Delete a file from a vector store
gerard delete-file vs_abc123def456 file-xyz789abc123

# Add all files from a directory
gerard add-dir vs_abc123def456 ./documents/

# Start interactive chat with vector store
gerard chat vs_abc123def456

# Send a single message to vector store
gerard chat vs_abc123def456 --single "What is this document about?"

# Use a different model for chat
gerard chat vs_abc123def456 --model gpt-4o
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
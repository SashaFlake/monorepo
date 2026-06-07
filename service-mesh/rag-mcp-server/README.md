# RAG MCP Server

> MCP server for project indexing and hybrid code search via Qdrant + Ollama.
> This README describes the RAG server architecture for AI agents and developers.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [MCP Tools](#mcp-tools)
- [Chunking Strategy](#chunking-strategy)
- [Role Detection](#role-detection)
- [Search Algorithm](#search-algorithm)
- [Incremental Indexing](#incremental-indexing)
- [Commands](#commands)
- [Configuration](#configuration)

---

## Overview

RAG MCP Server provides **Retrieval-Augmented Generation** capabilities for the Kimi Code CLI. It indexes project source code into a vector database and enables hybrid semantic + lexical search.

**Control Plane** (this server):
- Chunking files into semantic blocks
- Computing embeddings via Ollama
- Storing vectors and metadata in Qdrant
- Hybrid search (vector + text + role priority)
- Incremental indexing (mtime-based)

**Data Plane** (external services):
- **Ollama** (`:11434`) — embedding model server (`nomic-embed-text`, 768d)
- **Qdrant** (`:6333`) — vector database (Cosine distance, HNSW)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | >= 20 | Runtime |
| TypeScript | ^5.4.0 | Type safety, strict mode |
| MCP SDK | ^1.0.4 | Model Context Protocol server implementation |
| glob | ^10.4.0 | File pattern matching |
| tsx | ^4.0.0 | TypeScript execution (dev) |

**External dependencies:**
- Ollama (any recent version) with `nomic-embed-text` model
- Qdrant (Docker) running on port 6333

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Control Plane                  │
│           Node.js MCP Server                │
│  • MCP stdio protocol                       │
│  • Chunking, roles, cache, incrementality   │
│  • Hybrid search (fusion)                   │
│  • Orchestration: Ollama + Qdrant HTTP      │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌─────────────┐     ┌─────────────┐
│   Ollama    │     │   Qdrant    │
│  :11434     │     │  :6333      │
│  nomic-     │     │  Docker     │
│  embed-text │     │  Cosine     │
│  768d       │     │  HNSW       │
└─────────────┘     └─────────────┘
```

### Components

| Component | File | Responsibility |
|---|---|---|
| **MCP Server** | `src/index.ts` | Stdio transport, tool registration, request routing |
| **Indexer** | `src/indexer.ts` | File discovery, mtime comparison, chunking, embedding, Qdrant upsert |
| **Chunker** | `src/chunker.ts` | Language-aware chunking (code declarations, markdown headings, config files) |
| **SearchEngine** | `src/search.ts` | Hybrid search: vector similarity + text match + priority boost + deduplication |
| **OllamaClient** | `src/ollama.ts` | Embedding generation with retry logic and SHA-256 cache |
| **QdrantClient** | `src/qdrant.ts` | Vector DB operations: collection management, upsert, search, delete, scroll |
| **Utils** | `src/utils.ts` | Project root detection, gitignore parsing, ignore matching, JSON I/O |
| **Config** | `src/config.ts` | Constants, role detection heuristics, allowed extensions |
| **Types** | `src/types.ts` | Shared TypeScript interfaces |

---

## Directory Structure

```
rag-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry: tools, handlers, transport
│   ├── indexer.ts            # Indexer class: indexProject, indexFile
│   ├── chunker.ts            # chunkFile: language-aware semantic chunking
│   ├── search.ts             # SearchEngine: hybrid vector + text search
│   ├── ollama.ts             # OllamaClient: embedding generation with cache
│   ├── qdrant.ts             # QdrantClient: vector DB HTTP client
│   ├── utils.ts              # findProjectRoot, loadGitignore, isIgnored, sha256, JSON I/O
│   ├── config.ts             # Constants, ALLOWED_EXTS, DEFAULT_IGNORE_PATTERNS, detectRole
│   └── types.ts              # Chunk, FileRole, IndexState, QdrantPoint, SearchResult
├── dist/                     # Compiled JavaScript (tsc output)
├── package.json              # Dependencies: @modelcontextprotocol/sdk, glob
├── tsconfig.json             # TypeScript config: ES2022, NodeNext, strict
├── README.md                 # This file
└── node_modules/
```

---

## MCP Tools

The server exposes 4 MCP tools:

### `index_project`

Indexes a project or subset of files into Qdrant.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | string | No | Absolute path to project root (defaults to CWD project root) |
| `pattern` | string | No | Glob pattern for files (defaults to `**/*`) |

**Returns:** count of indexed files, chunks, skipped files.

### `index_file`

Indexes a single file relative to the project root.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | string | Yes | Relative path to the file |

### `search_code`

Performs hybrid search across the indexed codebase.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Search query text |
| `limit` | number | No | Number of results (default: 5) |
| `role` | string | No | Filter by file role (e.g., `domain`, `service`) |
| `path` | string | No | Filter by substring in file path |

### `get_stats`

Returns index statistics: total points, unique files, role distribution, cache size.

---

## Chunking Strategy

The `chunkFile()` function in `src/chunker.ts` uses **language-aware chunking** based on file extension.

### Code Files (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, etc.)

Chunks are cut at **complete declarations**:

| Pattern | Chunk Type | Example |
|---|---|---|
| `function name()` | `function` | `function deriveStatus(...) { ... }` |
| `class Name` | `class` | `class RegistryService { ... }` |
| `interface Name` | `interface` | `interface EndpointContract<...> { ... }` |
| `enum Name` | `enum` | `enum InstanceStatus { ... }` |
| `type Name` | `interface` | `type ServiceId = ...` |
| `const name = (` | `function` | `const deriveStatus = (...) => ...` |

Block boundaries are detected with brace-balance parsing that respects:
- String literals (`"`, `'`, `` ` ``)
- Line comments (`//`)
- Block comments (`/* */`)

If no declarations are found, falls back to **raw sliding window** (1000 chars).

### Markdown (`.md`, `.txt`)

Chunks are cut at **headings** (`#`, `##`, `###`). Each chunk includes its heading for context.

### Config (`.json`, `.yaml`, `.yml`)

If file is < 3000 characters, indexed as a single chunk. Otherwise split by sliding window.

### CSS (`.css`, `.scss`, `.less`)

Chunks are cut at **selector blocks** (brace-balanced CSS rules).

### Post-processing

Large chunks (> `CHUNK_SIZE` = 1000 chars) are split into sub-chunks while preserving the original type.

---

## Role Detection

The `detectRole()` function in `src/config.ts` classifies files by name heuristics. This affects search priority.

| Role | Priority | File Name Patterns |
|---|---|---|
| `documentation` | 9 | `README*`, `/docs/` |
| `service` | 8 | `*service*`, `*controller*`, `*handler*`, `*usecase*` |
| `middleware` | 7 | `*middleware*`, `*guard*`, `*interceptor*` |
| `types` | 6 | `*.dto.*`, `*.types.*`, `*.interface.*`, `*.model.*` |
| `data` | 6 | `*repository*`, `*dao*`, `*store*` |
| `config` | 4 | `*.config.*`, `*config*`, `.yaml`, `.yml`, `.env` |
| `utility` | 5 | `*util*`, `*helper*`, `*lib*` |
| `test` | 2 | `*.test.*`, `*.spec.*`, `/__tests__/`, `/test/` |
| `code` | 5 | Default fallback |

Priority is used as a **search boost** (see Search Algorithm below).

---

## Search Algorithm

The `SearchEngine.search()` method implements a **3-stage hybrid fusion**:

### Stage 1: Vector Search

Query is embedded via Ollama. Qdrant returns top `limit * 4` candidates by cosine similarity.

### Stage 2: Text Scoring

Each candidate receives a lexical text score:
- **Name match** (+0.8): query contains the chunk name (e.g., `deriveStatus`)
- **Word match** (+0.1 per word): query words appear in name or text

### Stage 3: Priority Boost + Deduplication

- **Priority boost** (+0.1 * priority/10): documentation and domain files rank higher
- **Source deduplication**: max 2 chunks per source file to ensure diversity

### Final Score

```
finalScore = vectorScore * 0.6 + textScore * 0.4 + priorityBoost
```

Results are sorted by `finalScore` and truncated to `limit`.

---

## Incremental Indexing

`indexProject()` tracks file modification times in `~/.kimi_rag_db/index-state.json`:

1. **Discovery** — glob finds all files matching pattern (respects `.gitignore`)
2. **Filtering** — skips unsupported extensions, ignored paths
3. **mtime comparison** — unchanged files are skipped
4. **Re-indexing** — new/modified files are chunked, embedded, and upserted
5. **Cleanup** — orphaned entries (deleted files) are removed from Qdrant and state

### Embedding Cache

SHA-256 of chunk text → embedding vector. Stored in `~/.kimi_rag_db/embedding-cache.json`. Identical chunks are never re-embedded.

### Batch Processing

Embeddings are fetched in batches of `BATCH_SIZE = 8` to optimize Ollama throughput.

---

## Commands

```bash
# Install dependencies
npm install

# Build TypeScript → dist/
npm run build

# Start MCP server (production)
npm start             # node dist/index.js

# Dev mode (tsx)
npm run dev           # tsx src/index.ts
```

---

## Configuration

Constants are defined in `src/config.ts`:

| Constant | Value | Description |
|---|---|---|
| `CHUNK_SIZE` | 1000 | Max characters per chunk |
| `CHUNK_OVERLAP` | 150 | Overlap for raw sliding window chunks |
| `BATCH_SIZE` | 8 | Embedding batch size for Ollama |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant HTTP API |
| `OLLAMA_URL` | `http://localhost:11434/api/embeddings` | Ollama embeddings endpoint |
| `OLLAMA_MODEL` | `nomic-embed-text` | Embedding model name |
| `VECTOR_DIM` | 768 | Embedding vector dimension |
| `COLLECTION_NAME` | `code_chunks` | Qdrant collection name |
| `DB_PATH` | `~/.kimi_rag_db` | Local state and cache directory |

### Allowed Extensions

`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`, `.go`, `.rs`, `.java`, `.kt`, `.swift`, `.md`, `.txt`, `.json`, `.yaml`, `.yml`, `.sql`, `.sh`, `.html`, `.css`, `.scss`, `.less`, `.vue`, `.svelte`, `.proto`

### Default Ignore Patterns

`node_modules/**`, `.git/**`, `dist/**`, `build/**`, `.next/**`, `coverage/**`, `*.min.js`, `*.map`, lockfiles, `.env*`, `.DS_Store`, `**/.*/**`, `**/rag-mcp-server*/**`

---

## Data Plane Setup

Start external services before running the MCP server.

### Ollama

```bash
ollama serve
ollama pull nomic-embed-text
```

### Qdrant

```bash
docker run -d --name qdrant -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

---

## Kimi CLI Configuration

Add the server to `~/.config/kimi-code/mcp.json`:

```json
{
  "mcpServers": {
    "project-rag": {
      "command": "node",
      "args": ["/absolute/path/to/rag-mcp-server/dist/index.js"]
    }
  }
}
```

---

## Key Implementation Details

- **Project root detection:** Walks up from CWD looking for `package.json`, `.git`, `tsconfig.json`, etc.
- **Gitignore support:** Parses `.gitignore` and adds patterns to ignore list.
- **Retry logic:** Ollama client retries 3 times with exponential backoff (1s, 2s, 4s) on failure.
- **Timeout:** Ollama requests timeout after 30 seconds.
- **Security:** `index_file` validates that the resolved path does not escape the project root.
- **Orphan cleanup:** Deleted files are automatically removed from the index on the next `index_project` run.

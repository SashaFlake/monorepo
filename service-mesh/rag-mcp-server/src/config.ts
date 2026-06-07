import path from 'node:path';
import type { FileRole } from './types.js';

export const PROJECT_MARKERS = [
  'package.json',
  '.git',
  'tsconfig.json',
  'go.mod',
  'Cargo.toml',
  'pyproject.toml',
  'setup.py',
  'pom.xml',
  'build.gradle',
  'Dockerfile',
];

export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'out/**',
  '.next/**',
  '.output/**',
  '.vercel/**',
  '.turbo/**',
  '.idea/**',
  '.vscode/**',
  '.cache/**',
  'coverage/**',
  'tmp/**',
  'temp/**',
  '*.min.js',
  '*.map',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '.env*',
  '*.local',
  '.claudeignore',
];

export const ALLOWED_EXTS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.md',
  '.txt',
  '.json',
  '.yaml',
  '.yml',
  '.sql',
  '.sh',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.vue',
  '.svelte',
  '.proto',
];

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;
export const BATCH_SIZE = 8;
export const QDRANT_URL = 'http://localhost:6333';
export const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
export const OLLAMA_MODEL = 'nomic-embed-text';
export const VECTOR_DIM = 768;
export const COLLECTION_NAME = 'code_chunks';
export const DB_PATH = path.join(process.env.HOME || '.', '.kimi_rag_db');
export const STATE_PATH = path.join(DB_PATH, 'index-state.json');
export const CACHE_PATH = path.join(DB_PATH, 'embedding-cache.json');

export function detectRole(filePath: string): FileRole {
  const lower = filePath.toLowerCase();
  const name = lower.split(/[\\/]/).pop() || lower;

  if (name.includes('readme') || lower.includes('/docs/')) {
    return { role: 'documentation', priority: 9 };
  }
  if (
    name.includes('.test.') ||
    name.includes('.spec.') ||
    lower.includes('/__tests__/') ||
    lower.includes('/test/')
  ) {
    return { role: 'test', priority: 2 };
  }
  if (
    name.includes('.config.') ||
    name.includes('config') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.yml') ||
    lower.endsWith('.env')
  ) {
    return { role: 'config', priority: 4 };
  }
  if (
    name.includes('.dto.') ||
    name.includes('.types.') ||
    name.includes('.interface.') ||
    name.includes('.model.')
  ) {
    return { role: 'types', priority: 6 };
  }
  if (
    name.includes('service') ||
    name.includes('controller') ||
    name.includes('handler') ||
    name.includes('usecase')
  ) {
    return { role: 'service', priority: 8 };
  }
  if (
    name.includes('middleware') ||
    name.includes('guard') ||
    name.includes('interceptor')
  ) {
    return { role: 'middleware', priority: 7 };
  }
  if (
    name.includes('repository') ||
    name.includes('dao') ||
    name.includes('store')
  ) {
    return { role: 'data', priority: 6 };
  }
  if (
    name.includes('util') ||
    name.includes('helper') ||
    name.includes('lib')
  ) {
    return { role: 'utility', priority: 5 };
  }

  return { role: 'code', priority: 5 };
}

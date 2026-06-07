export interface Chunk {
  text: string;
  type: 'function' | 'class' | 'interface' | 'enum' | 'doc' | 'config' | 'raw';
  name?: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface FileRole {
  role: string;
  priority: number;
}

export interface IndexState {
  lastIndexed: number;
  files: Record<string, { mtime: number; chunkCount: number }>;
}

export interface CachedEmbedding {
  hash: string;
  vector: number[];
}

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    text: string;
    source: string;
    name: string;
    type: string;
    role: string;
    priority: number;
    lineStart: number;
    lineEnd: number;
  };
}

export interface ScoredPoint {
  point: QdrantPoint;
  score: number;
}

export interface SearchResult {
  point: QdrantPoint;
  score: number;
  vectorScore: number;
  textScore: number;
}

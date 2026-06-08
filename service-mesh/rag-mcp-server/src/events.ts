import { EventEmitter } from 'node:events';

export interface SearchStartedPayload {
  query: string;
  limit: number;
  roleFilter?: string;
  pathFilter?: string;
  excludeRoles?: string[];
}

export interface SearchCompletedPayload {
  query: string;
  resultsCount: number;
  vectorCandidates: number;
  durationMs: number;
}

export interface IndexStartedPayload {
  eventType: 'project' | 'file' | 'reverse-dependencies';
  filePath?: string;
}

export interface IndexCompletedPayload {
  eventType: 'project' | 'file' | 'reverse-dependencies';
  filePath?: string;
  filesCount?: number;
  chunksCount?: number;
  skippedCount?: number;
  durationMs: number;
}

export class StatsEventEmitter extends EventEmitter {
  emitSearchStarted(payload: SearchStartedPayload): void {
    this.emit('search:started', payload);
  }

  emitSearchCompleted(payload: SearchCompletedPayload): void {
    this.emit('search:completed', payload);
  }

  emitIndexStarted(payload: IndexStartedPayload): void {
    this.emit('index:started', payload);
  }

  emitIndexCompleted(payload: IndexCompletedPayload): void {
    this.emit('index:completed', payload);
  }
}

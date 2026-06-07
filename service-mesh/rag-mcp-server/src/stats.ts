import type { StatsEventEmitter } from './events.js';
import { StatsDb } from './stats-db.js';

export class StatsCollector {
  private readonly db: StatsDb;

  constructor(dbPath: string, events: StatsEventEmitter) {
    this.db = new StatsDb(dbPath);

    events.on('search:completed', (payload) => {
      this.db.insertSearchEvent({
        query: payload.query,
        role_filter: null,
        path_filter: null,
        results_count: payload.resultsCount,
        vector_candidates: payload.vectorCandidates,
        duration_ms: payload.durationMs,
      });
    });

    events.on('index:completed', (payload) => {
      this.db.insertIndexEvent({
        event_type: payload.eventType,
        file_path: payload.filePath ?? null,
        files_count: payload.filesCount ?? null,
        chunks_count: payload.chunksCount ?? null,
        skipped_count: payload.skippedCount ?? null,
        duration_ms: payload.durationMs,
      });
    });
  }

  async withStats<T>(toolName: string, args: unknown, handler: () => Promise<T>): Promise<T> {
    const argsJson = JSON.stringify(args);
    const start = Date.now();
    let result: T;
    let resultJson: string | null = null;
    let errorText: string | null = null;

    try {
      result = await handler();
      try {
        resultJson = JSON.stringify(result);
      } catch {
        resultJson = null;
      }
      return result;
    } catch (err) {
      errorText = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - start;
      this.db.insertToolCall({
        tool_name: toolName,
        args_json: argsJson,
        result_json: resultJson,
        error: errorText,
        duration_ms: duration,
      });
    }
  }

  getDb(): StatsDb {
    return this.db;
  }
}

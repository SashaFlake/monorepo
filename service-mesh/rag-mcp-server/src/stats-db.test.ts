import { describe, it } from 'node:test';
import assert from 'node:assert';
import { StatsDb } from './stats-db.js';

describe('StatsDb', () => {
  it('should initialize schema and insert tool_call', () => {
    const db = new StatsDb(':memory:');
    db.insertToolCall({
      tool_name: 'search_code',
      args_json: JSON.stringify({ query: 'foo' }),
      result_json: JSON.stringify({ ok: true }),
      error: null,
      duration_ms: 42,
    });

    const stats = db.getToolCallStats(0);
    assert.strictEqual(stats.total, 1);
    assert.deepStrictEqual(stats.byTool, { search_code: 1 });
    assert.strictEqual(stats.avgDuration, 42);

    db.close();
  });

  it('should insert and aggregate search_events', () => {
    const db = new StatsDb(':memory:');
    db.insertSearchEvent({ query: 'hello', role_filter: null, path_filter: null, results_count: 3, vector_candidates: 10, duration_ms: 100 });
    db.insertSearchEvent({ query: 'hello', role_filter: 'domain', path_filter: null, results_count: 2, vector_candidates: 8, duration_ms: 200 });

    const stats = db.getSearchStats(0);
    assert.strictEqual(stats.total, 2);
    assert.strictEqual(stats.avgDuration, 150);
    assert.deepStrictEqual(stats.topQueries, [{ query: 'hello', count: 2 }]);

    const slowest = db.getSlowestSearches(0, 5);
    assert.strictEqual(slowest.length, 2);
    assert.strictEqual(slowest[0].duration_ms, 200);

    db.close();
  });

  it('should insert and aggregate index_events', () => {
    const db = new StatsDb(':memory:');
    db.insertIndexEvent({ event_type: 'project', file_path: null, files_count: 5, chunks_count: 20, skipped_count: 1, duration_ms: 500 });
    db.insertIndexEvent({ event_type: 'file', file_path: 'src/foo.ts', files_count: null, chunks_count: 3, skipped_count: null, duration_ms: 50 });

    const stats = db.getIndexStats(0);
    assert.strictEqual(stats.totalEvents, 2);
    assert.strictEqual(stats.totalFiles, 5);
    assert.strictEqual(stats.totalChunks, 23);

    db.close();
  });
});

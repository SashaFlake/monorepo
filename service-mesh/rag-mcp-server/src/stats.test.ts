import { describe, it } from 'node:test';
import assert from 'node:assert';
import { StatsEventEmitter } from './events.js';
import { StatsCollector } from './stats.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

describe('StatsCollector', () => {
  it('should record successful tool call', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-stats-'));
    const dbPath = path.join(tmpDir, 'test.sqlite');
    const events = new StatsEventEmitter();
    const stats = new StatsCollector(dbPath, events);

    const result = await stats.withStats('search_code', { query: 'foo' }, async () => {
      return { items: [1, 2, 3] };
    });

    assert.deepStrictEqual(result, { items: [1, 2, 3] });

    const dbStats = stats.getDb().getToolCallStats(0);
    assert.strictEqual(dbStats.total, 1);
    assert.strictEqual(dbStats.byTool['search_code'], 1);
    assert.ok(dbStats.avgDuration !== null);
    assert.ok(dbStats.avgDuration! >= 0);

    stats.getDb().close();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('should record failed tool call with error', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-stats-'));
    const dbPath = path.join(tmpDir, 'test.sqlite');
    const events = new StatsEventEmitter();
    const stats = new StatsCollector(dbPath, events);

    await assert.rejects(
      async () => {
        await stats.withStats('index_project', { path: '/tmp' }, async () => {
          throw new Error('disk full');
        });
      },
      /disk full/,
    );

    const dbStats = stats.getDb().getToolCallStats(0);
    assert.strictEqual(dbStats.total, 1);
    const row = dbStats.byTool['index_project'];
    assert.strictEqual(row, 1);

    stats.getDb().close();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('should record search event from emitter', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-stats-'));
    const dbPath = path.join(tmpDir, 'test.sqlite');
    const events = new StatsEventEmitter();
    const stats = new StatsCollector(dbPath, events);

    events.emitSearchCompleted({ query: 'hello', resultsCount: 3, vectorCandidates: 10, durationMs: 120 });

    const searchStats = stats.getDb().getSearchStats(0);
    assert.strictEqual(searchStats.total, 1);
    assert.strictEqual(searchStats.avgDuration, 120);

    stats.getDb().close();
    fs.rmSync(tmpDir, { recursive: true });
  });
});

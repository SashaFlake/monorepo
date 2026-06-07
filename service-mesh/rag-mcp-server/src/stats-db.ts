import Database from 'better-sqlite3';

export interface ToolCallRow {
  id: number;
  tool_name: string;
  args_json: string | null;
  result_json: string | null;
  error: string | null;
  duration_ms: number | null;
  created_at: number;
}

export interface SearchEventRow {
  id: number;
  query: string;
  role_filter: string | null;
  path_filter: string | null;
  results_count: number | null;
  vector_candidates: number | null;
  duration_ms: number | null;
  created_at: number;
}

export interface IndexEventRow {
  id: number;
  event_type: 'project' | 'file';
  file_path: string | null;
  files_count: number | null;
  chunks_count: number | null;
  skipped_count: number | null;
  duration_ms: number | null;
  created_at: number;
}

export class StatsDb {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tool_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        args_json TEXT,
        result_json TEXT,
        error TEXT,
        duration_ms INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS search_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        role_filter TEXT,
        path_filter TEXT,
        results_count INTEGER,
        vector_candidates INTEGER,
        duration_ms INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS index_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL CHECK(event_type IN ('project', 'file')),
        file_path TEXT,
        files_count INTEGER,
        chunks_count INTEGER,
        skipped_count INTEGER,
        duration_ms INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_tool_calls_created ON tool_calls(created_at);
      CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_index_events_created ON index_events(created_at);
    `);
  }

  insertToolCall(row: Omit<ToolCallRow, 'id' | 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO tool_calls (tool_name, args_json, result_json, error, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(row.tool_name, row.args_json, row.result_json, row.error, row.duration_ms);
  }

  insertSearchEvent(row: Omit<SearchEventRow, 'id' | 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO search_events (query, role_filter, path_filter, results_count, vector_candidates, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(row.query, row.role_filter, row.path_filter, row.results_count, row.vector_candidates, row.duration_ms);
  }

  insertIndexEvent(row: Omit<IndexEventRow, 'id' | 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO index_events (event_type, file_path, files_count, chunks_count, skipped_count, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(row.event_type, row.file_path, row.files_count, row.chunks_count, row.skipped_count, row.duration_ms);
  }

  getToolCallStats(since: number): { total: number; byTool: Record<string, number>; avgDuration: number | null } {
    const totalRow = this.db.prepare(`SELECT COUNT(*) as c FROM tool_calls WHERE created_at >= ?`).get(since) as { c: number };
    const byToolRows = this.db.prepare(`SELECT tool_name, COUNT(*) as c FROM tool_calls WHERE created_at >= ? GROUP BY tool_name`).all(since) as Array<{ tool_name: string; c: number }>;
    const avgRow = this.db.prepare(`SELECT AVG(duration_ms) as a FROM tool_calls WHERE created_at >= ? AND duration_ms IS NOT NULL`).get(since) as { a: number | null };

    const byTool: Record<string, number> = {};
    for (const row of byToolRows) {
      byTool[row.tool_name] = row.c;
    }

    return { total: totalRow.c, byTool, avgDuration: avgRow.a };
  }

  getSearchStats(since: number): { total: number; avgDuration: number | null; topQueries: Array<{ query: string; count: number }> } {
    const totalRow = this.db.prepare(`SELECT COUNT(*) as c FROM search_events WHERE created_at >= ?`).get(since) as { c: number };
    const avgRow = this.db.prepare(`SELECT AVG(duration_ms) as a FROM search_events WHERE created_at >= ? AND duration_ms IS NOT NULL`).get(since) as { a: number | null };
    const topRows = this.db.prepare(`
      SELECT query, COUNT(*) as c FROM search_events WHERE created_at >= ? GROUP BY query ORDER BY c DESC LIMIT 10
    `).all(since) as Array<{ query: string; c: number }>;

    return { total: totalRow.c, avgDuration: avgRow.a, topQueries: topRows.map(r => ({ query: r.query, count: r.c })) };
  }

  getIndexStats(since: number): { totalEvents: number; totalFiles: number | null; totalChunks: number | null } {
    const totalRow = this.db.prepare(`SELECT COUNT(*) as c FROM index_events WHERE created_at >= ?`).get(since) as { c: number };
    const sums = this.db.prepare(`
      SELECT COALESCE(SUM(files_count), 0) as f, COALESCE(SUM(chunks_count), 0) as ch
      FROM index_events WHERE created_at >= ?
    `).get(since) as { f: number | null; ch: number | null };

    return { totalEvents: totalRow.c, totalFiles: sums.f, totalChunks: sums.ch };
  }

  getSlowestSearches(since: number, limit = 10): Array<{ query: string; duration_ms: number }> {
    return this.db.prepare(`
      SELECT query, duration_ms FROM search_events
      WHERE created_at >= ? AND duration_ms IS NOT NULL
      ORDER BY duration_ms DESC
      LIMIT ?
    `).all(since, limit) as Array<{ query: string; duration_ms: number }>;
  }

  close(): void {
    this.db.close();
  }
}

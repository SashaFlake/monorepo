import path from 'node:path';
import { StatsDb } from './stats-db.js';
import { DB_PATH } from './config.js';

function parseArgs(argv: string[]): {
  today: boolean;
  lastHour: boolean;
  last24h: boolean;
  topQueries: boolean;
  slowest: boolean;
  tools: boolean;
  index: boolean;
} {
  return {
    today: argv.includes('--today'),
    lastHour: argv.includes('--last-hour'),
    last24h: argv.includes('--last-24h') || (!argv.includes('--today') && !argv.includes('--last-hour')),
    topQueries: argv.includes('--top-queries'),
    slowest: argv.includes('--slowest'),
    tools: argv.includes('--tools'),
    index: argv.includes('--index'),
  };
}

function getSince(flags: ReturnType<typeof parseArgs>): number {
  const now = Math.floor(Date.now() / 1000);
  if (flags.today) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
  }
  if (flags.lastHour) return now - 3600;
  return now - 86400; // last-24h default
}

function main(): void {
  const flags = parseArgs(process.argv.slice(2));
  const since = getSince(flags);
  const db = new StatsDb(path.join(DB_PATH, 'rag-stats.sqlite'));

  const toolStats = db.getToolCallStats(since);
  const searchStats = db.getSearchStats(since);
  const indexStats = db.getIndexStats(since);

  const periodLabel = flags.today ? 'today' : flags.lastHour ? 'last hour' : 'last 24h';
  console.log(`📊 RAG Stats (${periodLabel})`);
  console.log('───────────────────────');

  if (!flags.topQueries && !flags.slowest && !flags.tools && !flags.index) {
    // Default summary
    console.log(`Tool calls:   ${toolStats.total}`);
    if (toolStats.total > 0) {
      for (const [name, count] of Object.entries(toolStats.byTool)) {
        console.log(`  ${name}: ${count}`);
      }
    }
    console.log();
    console.log(`Searches:     ${searchStats.total}${searchStats.avgDuration !== null ? ` (avg ${Math.round(searchStats.avgDuration)}ms)` : ''}`);
    if (searchStats.topQueries.length > 0) {
      console.log('Top queries:');
      for (let i = 0; i < searchStats.topQueries.length; i++) {
        const q = searchStats.topQueries[i];
        console.log(`  ${i + 1}. "${q.query}" (${q.count}×)`);
      }
    }
    console.log();
    console.log(`Index events: ${indexStats.totalEvents}${indexStats.totalFiles !== null ? ` (${indexStats.totalFiles} files` : ''}${indexStats.totalChunks !== null ? `, ${indexStats.totalChunks} chunks)` : ')'}`);

    const slowest = db.getSlowestSearches(since, 1);
    if (slowest.length > 0) {
      console.log(`Slowest search: "${slowest[0].query}" — ${slowest[0].duration_ms}ms`);
    }
  } else {
    if (flags.tools) {
      console.log(`Tool calls: ${toolStats.total}`);
      for (const [name, count] of Object.entries(toolStats.byTool)) {
        console.log(`  ${name}: ${count}`);
      }
      console.log();
    }
    if (flags.topQueries) {
      console.log('Top queries:');
      for (let i = 0; i < searchStats.topQueries.length; i++) {
        const q = searchStats.topQueries[i];
        console.log(`  ${i + 1}. "${q.query}" (${q.count}×)`);
      }
      console.log();
    }
    if (flags.slowest) {
      const slowest = db.getSlowestSearches(since, 10);
      console.log('Slowest searches:');
      for (const s of slowest) {
        console.log(`  ${s.duration_ms}ms — "${s.query}"`);
      }
      console.log();
    }
    if (flags.index) {
      console.log(`Index events: ${indexStats.totalEvents}`);
      if (indexStats.totalFiles !== null) console.log(`  Files: ${indexStats.totalFiles}`);
      if (indexStats.totalChunks !== null) console.log(`  Chunks: ${indexStats.totalChunks}`);
      console.log();
    }
  }

  db.close();
}

main();

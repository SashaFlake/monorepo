import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  CACHE_PATH,
  CHUNK_SIZE,
  DEFAULT_IGNORE_PATTERNS,
  STATE_PATH,
  detectRole,
} from './config.js';
import { chunkFile } from './chunker.js';
import type { OllamaClient } from './ollama.js';
import type { QdrantClient } from './qdrant.js';
import type { IndexState, QdrantPoint } from './types.js';
import type { StatsEventEmitter } from './events.js';
import { isIgnored, loadGitignore, loadJson, saveJson, shouldIndex } from './utils.js';

export class Indexer {
  constructor(
    private readonly projectRoot: string,
    private readonly ollama: OllamaClient,
    private readonly qdrant: QdrantClient,
    private readonly cache: Map<string, number[]>,
    private readonly events?: StatsEventEmitter,
  ) {}

  async indexProject(
    pattern = '**/*',
  ): Promise<{ indexed: number; chunks: number; skipped: number }> {
    this.events?.emitIndexStarted({ eventType: 'project' });
    const start = Date.now();

    const gitignorePatterns = loadGitignore(this.projectRoot);
    const ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...gitignorePatterns];

    const files = await glob(pattern, {
      cwd: this.projectRoot,
      absolute: false,
      nodir: true,
      ignore: ignorePatterns,
    });

    const state: IndexState = loadJson<IndexState>(STATE_PATH) ?? {
      lastIndexed: 0,
      files: {},
    };

    const toIndex: string[] = [];
    let skipped = 0;

    for (const file of files) {
      if (!shouldIndex(file)) {
        skipped++;
        continue;
      }
      const fullPath = path.join(this.projectRoot, file);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        skipped++;
        continue;
      }
      const existing = state.files[file];
      if (existing && stat.mtimeMs <= existing.mtime) {
        skipped++;
      } else {
        toIndex.push(file);
      }
    }

    let totalChunks = 0;
    let indexed = 0;

    for (let i = 0; i < toIndex.length; i++) {
      const file = toIndex[i];
      const fullPath = path.join(this.projectRoot, file);
      const text = await fs.promises.readFile(fullPath, 'utf-8');
      const chunks = chunkFile(text, file).filter(
        (c) => c.text.trim().length > 0,
      );
      if (chunks.length === 0) {
        skipped++;
        continue;
      }
      const role = detectRole(file);

      await this.qdrant.deleteBySource(file);

      const vectors = await this.ollama.getEmbeddingsBatch(
        chunks.map((c) => c.text),
        this.cache,
      );

      const points: QdrantPoint[] = chunks.map((chunk, idx) => ({
        id: crypto.randomUUID(),
        vector: vectors[idx],
        payload: {
          text: chunk.text,
          source: file,
          name: chunk.name ?? '',
          type: chunk.type,
          role: role.role,
          priority: role.priority,
          lineStart: chunk.lineStart ?? 1,
          lineEnd: chunk.lineEnd ?? 1,
        },
      }));

      await this.qdrant.upsertPoints(points);

      const stat = fs.statSync(fullPath);
      state.files[file] = { mtime: stat.mtimeMs, chunkCount: chunks.length };
      totalChunks += chunks.length;
      indexed++;

      console.error(
        `[${i + 1}/${toIndex.length}] ${file} (chunks: ${chunks.length})`,
      );
    }

    const currentFiles = new Set(files);
    const orphaned = Object.keys(state.files).filter((f) => !currentFiles.has(f));
    for (const file of orphaned) {
      await this.qdrant.deleteBySource(file);
      delete state.files[file];
      console.error(`[cleanup] Removed orphaned: ${file}`);
    }

    state.lastIndexed = Date.now();
    saveJson(STATE_PATH, state);
    this.saveCache();

    const durationMs = Date.now() - start;
    this.events?.emitIndexCompleted({
      eventType: 'project',
      filesCount: indexed,
      chunksCount: totalChunks,
      skippedCount: skipped,
      durationMs,
    });

    return { indexed, chunks: totalChunks, skipped };
  }

  async indexFile(relPath: string): Promise<number> {
    this.events?.emitIndexStarted({ eventType: 'file', filePath: relPath });
    const start = Date.now();

    const fullPath = path.join(this.projectRoot, relPath);
    const resolvedFull = path.resolve(fullPath);
    const resolvedRoot = path.resolve(this.projectRoot);

    if (!resolvedFull.startsWith(resolvedRoot + path.sep) && resolvedFull !== resolvedRoot) {
      throw new Error(`Path escapes project root: ${relPath}`);
    }

    if (isIgnored(relPath, DEFAULT_IGNORE_PATTERNS)) {
      console.error(`Skipped (ignored): ${relPath}`);
      return 0;
    }

    if (!shouldIndex(relPath)) {
      console.error(`Skipped (unsupported extension): ${relPath}`);
      return 0;
    }

    const text = await fs.promises.readFile(fullPath, 'utf-8');
    const chunks = chunkFile(text, relPath).filter(
      (c) => c.text.trim().length > 0,
    );
    if (chunks.length === 0) {
      return 0;
    }
    const role = detectRole(relPath);

    await this.qdrant.deleteBySource(relPath);

    const vectors = await this.ollama.getEmbeddingsBatch(
      chunks.map((c) => c.text),
      this.cache,
    );

    const points: QdrantPoint[] = chunks.map((chunk, idx) => ({
      id: crypto.randomUUID(),
      vector: vectors[idx],
      payload: {
        text: chunk.text,
        source: relPath,
        name: chunk.name ?? '',
        type: chunk.type,
        role: role.role,
        priority: role.priority,
        lineStart: chunk.lineStart ?? 1,
        lineEnd: chunk.lineEnd ?? 1,
      },
    }));

    await this.qdrant.upsertPoints(points);

    const state: IndexState = loadJson<IndexState>(STATE_PATH) ?? {
      lastIndexed: 0,
      files: {},
    };
    const stat = fs.statSync(fullPath);
    state.files[relPath] = { mtime: stat.mtimeMs, chunkCount: chunks.length };
    saveJson(STATE_PATH, state);
    this.saveCache();

    this.events?.emitIndexCompleted({
      eventType: 'file',
      filePath: relPath,
      chunksCount: chunks.length,
      durationMs: Date.now() - start,
    });

    return chunks.length;
  }

  private saveCache(): void {
    const obj = Object.fromEntries(this.cache);
    saveJson(CACHE_PATH, obj);
  }
}

import type { OllamaClient } from './ollama.js';
import type { QdrantClient } from './qdrant.js';
import type { SearchResult } from './types.js';
import type { StatsEventEmitter } from './events.js';

export class SearchEngine {
  constructor(
    private readonly qdrant: QdrantClient,
    private readonly ollama: OllamaClient,
    private readonly cache: Map<string, number[]>,
    private readonly events?: StatsEventEmitter,
  ) {}

  async search(
    query: string,
    limit: number,
    roleFilter?: string,
    pathFilter?: string,
  ): Promise<SearchResult[]> {
    this.events?.emitSearchStarted({ query, limit, roleFilter, pathFilter });
    const start = Date.now();

    const queryVector = await this.ollama.getEmbedding(query);
    const scored = await this.qdrant.search(
      queryVector,
      limit * 4,
      roleFilter,
    );

    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const results: SearchResult[] = [];
    const sourceCount = new Map<string, number>();

    for (const { point, score: vectorScore } of scored) {
      if (pathFilter && !point.payload.source.includes(pathFilter)) {
        continue;
      }

      let textScore = 0;
      const searchText = `${point.payload.name} ${point.payload.text}`.toLowerCase();

      if (
        point.payload.name &&
        query.toLowerCase().includes(point.payload.name.toLowerCase())
      ) {
        textScore += 0.8;
      }

      for (const word of queryWords) {
        if (searchText.includes(word)) {
          textScore += 0.1;
        }
      }

      const priorityBoost = (point.payload.priority / 10) * 0.1;
      const finalScore = vectorScore * 0.6 + textScore * 0.4 + priorityBoost;

      const count = sourceCount.get(point.payload.source) || 0;
      if (count >= 2) {
        continue;
      }
      sourceCount.set(point.payload.source, count + 1);

      results.push({
        point,
        score: finalScore,
        vectorScore,
        textScore,
      });

      if (results.length >= limit) {
        break;
      }
    }

    this.events?.emitSearchCompleted({
      query,
      resultsCount: results.length,
      vectorCandidates: scored.length,
      durationMs: Date.now() - start,
    });

    return results;
  }
}

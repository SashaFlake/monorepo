import type { QdrantPoint, ScoredPoint } from './types.js';

export class QdrantClient {
  constructor(
    private readonly url: string,
    private readonly collectionName: string,
    private readonly vectorDim: number,
  ) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Qdrant ${method} ${path} → ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
  }

  async ensureCollection(): Promise<void> {
    try {
      await this.request<{ result?: unknown }>(
        'GET',
        `/collections/${this.collectionName}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('404')) {
        await this.request('PUT', `/collections/${this.collectionName}`, {
          vectors: {
            size: this.vectorDim,
            distance: 'Cosine',
          },
        });
      } else {
        throw err;
      }
    }
  }

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    const chunkSize = 100;
    for (let i = 0; i < points.length; i += chunkSize) {
      const batch = points.slice(i, i + chunkSize);
      await this.request('PUT', `/collections/${this.collectionName}/points`, {
        points: batch,
      });
    }
  }

  async deleteBySource(source: string): Promise<void> {
    await this.request(
      'POST',
      `/collections/${this.collectionName}/points/delete`,
      {
        filter: {
          must: [{ key: 'source', match: { value: source } }],
        },
      },
    );
  }

  async deleteByType(type: string): Promise<void> {
    await this.request(
      'POST',
      `/collections/${this.collectionName}/points/delete`,
      {
        filter: {
          must: [{ key: 'type', match: { value: type } }],
        },
      },
    );
  }

  async search(
    vector: number[],
    limit: number,
    roleFilter?: string,
    excludeRoles?: string[],
  ): Promise<ScoredPoint[]> {
    const must: unknown[] = [];
    const mustNot: unknown[] = [];

    if (roleFilter) {
      must.push({ key: 'role', match: { value: roleFilter } });
    }
    if (excludeRoles && excludeRoles.length > 0) {
      for (const role of excludeRoles) {
        mustNot.push({ key: 'role', match: { value: role } });
      }
    }

    const filter: Record<string, unknown> | undefined =
      must.length > 0 || mustNot.length > 0
        ? {
            ...(must.length > 0 ? { must } : {}),
            ...(mustNot.length > 0 ? { must_not: mustNot } : {}),
          }
        : undefined;

    const payload = await this.request<{
      result?: {
        id: string;
        score: number;
        vector: number[];
        payload: QdrantPoint['payload'];
      }[];
    }>('POST', `/collections/${this.collectionName}/points/search`, {
      vector,
      limit,
      with_payload: true,
      filter,
    });

    return (payload.result || []).map((r) => ({
      point: {
        id: r.id,
        vector: r.vector,
        payload: r.payload,
      },
      score: r.score,
    }));
  }

  async count(): Promise<number> {
    const payload = await this.request<{
      result?: { points_count?: number; status?: string };
    }>('GET', `/collections/${this.collectionName}`);
    return payload.result?.points_count ?? 0;
  }

  async scrollAll(): Promise<QdrantPoint[]> {
    const all: QdrantPoint[] = [];
    let offset: string | number | undefined;

    while (true) {
      const payload = await this.request<{
        result?: {
          points?: {
            id: string;
            vector: number[];
            payload: QdrantPoint['payload'];
          }[];
          next_page_offset?: string | number | null;
        };
      }>('POST', `/collections/${this.collectionName}/points/scroll`, {
        limit: 1000,
        with_payload: true,
        offset,
      });

      const points = payload.result?.points || [];
      for (const p of points) {
        all.push({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        });
      }

      const next = payload.result?.next_page_offset;
      if (!next || points.length === 0) break;
      offset = next;
    }

    return all;
  }
}

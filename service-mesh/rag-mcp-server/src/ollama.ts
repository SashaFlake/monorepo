import { BATCH_SIZE } from './config.js';
import type { CachedEmbedding } from './types.js';
import { sha256 } from './utils.js';

export class OllamaClient {
  constructor(
    private readonly url: string,
    private readonly model: string,
    private readonly generationModel?: string,
  ) {}

  private get generateUrl(): string {
    return this.url.replace('/api/embeddings', '/api/generate');
  }

  async generate(
    prompt: string,
    options: { temperature?: number; numPredict?: number; system?: string } = {},
  ): Promise<string> {
    if (prompt.trim().length === 0) {
      throw new Error('Cannot generate from empty prompt');
    }

    let lastErr: Error | undefined;
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const body: Record<string, unknown> = {
          model: this.generationModel ?? this.model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.1,
            num_predict: options.numPredict ?? 100,
          },
        };
        if (options.system) {
          body.system = options.system;
        }

        const res = await fetch(this.generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Ollama HTTP ${res.status}`);
        }

        const data = (await res.json()) as { response?: string };
        if (typeof data.response !== 'string') {
          throw new Error('Invalid generate response: missing response text');
        }
        return data.response.trim();
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    throw lastErr;
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (text.trim().length === 0) {
      throw new Error('Cannot embed empty text');
    }

    let lastErr: Error | undefined;
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.model, prompt: text }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Ollama HTTP ${res.status}`);
        }

        const data = (await res.json()) as { embedding?: number[] };
        if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
          throw new Error(`Invalid embedding response: empty vector for text length ${text.length}`);
        }
        return data.embedding;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    throw lastErr;
  }

  async getEmbeddingsBatch(
    texts: string[],
    cache: Map<string, number[]>,
  ): Promise<number[][]> {
    const results: (number[] | undefined)[] = new Array(texts.length);
    const toFetch: { text: string; index: number }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const hash = sha256(texts[i]);
      const cached = cache.get(hash);
      if (cached) {
        results[i] = cached;
      } else {
        toFetch.push({ text: texts[i], index: i });
      }
    }

    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const vectors = await Promise.all(
        batch.map((item) => this.getEmbedding(item.text)),
      );
      for (let j = 0; j < batch.length; j++) {
        const hash = sha256(batch[j].text);
        cache.set(hash, vectors[j]);
        results[batch[j].index] = vectors[j];
      }
    }

    return results as number[][];
  }
}

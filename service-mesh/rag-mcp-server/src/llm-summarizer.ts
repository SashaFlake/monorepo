import type { Chunk } from './types.js';
import type { OllamaClient } from './ollama.js';

const SYSTEM_PROMPT = `You are a senior TypeScript engineer. Summarize the given function in 1-2 sentences. Focus on:
- What it does (behavior)
- Side effects (HTTP requests, state mutations, subscriptions, DOM events)
- What it returns
Do not explain implementation details or list parameters. Be concise.`;

const COMPLEXITY_MARKERS = [
  'useEffect',
  'useMutation',
  'useQuery',
  'useState',
  'useReducer',
  'useForm',
  'useRouter',
  'async',
  'Promise<',
  'await',
  'fetch(',
  '@sideEffects',
  'crypto.randomUUID',
  'window.confirm',
  'toast.',
];

function lineCount(chunk: Chunk): number {
  return (chunk.lineEnd ?? 1) - (chunk.lineStart ?? 1) + 1;
}

function isFunctionStart(text: string): boolean {
  return /^\s*(?:export\s+)?(?:async\s+)?(?:default\s+)?function\s+/.test(text);
}

export function shouldSummarize(chunk: Chunk): boolean {
  if (chunk.type !== 'function') return false;
  if (!isFunctionStart(chunk.text)) return false;
  const name = chunk.name ?? '';
  const text = chunk.text;

  // Hooks are almost always stateful/complex enough to warrant a summary.
  if (name.startsWith('use') && name.length > 3) return true;

  // Long functions.
  if (lineCount(chunk) > 25) return true;

  // Functions with explicit side-effects in JSDoc.
  if (text.includes('@sideEffects')) return true;

  // Functions with complexity markers.
  if (COMPLEXITY_MARKERS.some((m) => text.includes(m))) return true;

  return false;
}

function buildPrompt(chunk: Chunk): string {
  const name = chunk.name ?? 'anonymous';
  const code = chunk.text.slice(0, 1500);
  return `Function name: ${name}\n\n${code}\n\nSummary:`;
}

export async function summarizeChunks(
  ollama: OllamaClient,
  chunks: Chunk[],
  concurrency = 3,
): Promise<Map<Chunk, string>> {
  const toSummarize = chunks.filter(shouldSummarize);
  const results = new Map<Chunk, string>();

  if (toSummarize.length === 0) return results;

  async function processOne(chunk: Chunk): Promise<void> {
    try {
      const summary = await ollama.generate(buildPrompt(chunk), {
        system: SYSTEM_PROMPT,
        temperature: 0.1,
        numPredict: 80,
      });
      if (summary && summary.length > 10) {
        results.set(chunk, summary);
      }
    } catch (err) {
      console.error(`[llm-summary] Failed for ${chunk.name}:`, err);
    }
  }

  for (let i = 0; i < toSummarize.length; i += concurrency) {
    const batch = toSummarize.slice(i, i + concurrency);
    await Promise.all(batch.map(processOne));
  }

  return results;
}

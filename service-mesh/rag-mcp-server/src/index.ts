import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import path from 'node:path';
import {
  CACHE_PATH,
  COLLECTION_NAME,
  DB_PATH,
  OLLAMA_MODEL,
  OLLAMA_URL,
  QDRANT_URL,
  VECTOR_DIM,
} from './config.js';
import { Indexer } from './indexer.js';
import { OllamaClient } from './ollama.js';
import { QdrantClient } from './qdrant.js';
import { SearchEngine } from './search.js';
import { findProjectRoot, loadJson, saveJson } from './utils.js';

const server = new Server(
  { name: 'project-rag', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

const ollama = new OllamaClient(OLLAMA_URL, OLLAMA_MODEL);
const qdrant = new QdrantClient(QDRANT_URL, COLLECTION_NAME, VECTOR_DIM);
const cache = new Map<string, number[]>();

function loadCache(): void {
  const data = loadJson<Record<string, number[]>>(CACHE_PATH);
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      cache.set(key, value);
    }
  }
}

function saveCache(): void {
  const obj = Object.fromEntries(cache);
  saveJson(CACHE_PATH, obj);
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'index_project',
        description:
          'Проиндексировать проект: нарезать файлы на чанки, вычислить embeddings и сохранить в Qdrant.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Абсолютный путь к корню проекта',
            },
            pattern: {
              type: 'string',
              description: 'Glob паттерн для файлов',
            },
          },
        },
      },
      {
        name: 'index_file',
        description: 'Проиндексировать один файл относительно корня проекта.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Относительный путь к файлу',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_code',
        description:
          'Гибридный поиск по коду: векторный + текстовый с приоритетом ролей.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Поисковый запрос' },
            limit: {
              type: 'number',
              description: 'Количество результатов',
              default: 5,
            },
            role: {
              type: 'string',
              description: 'Фильтр по роли файла',
            },
            path: {
              type: 'string',
              description: 'Фильтр по подстроке в пути',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_stats',
        description: 'Показать статистику индекса.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  if (toolName === 'index_project') {
    const projectRoot = args.path
      ? path.resolve(String(args.path))
      : findProjectRoot(process.cwd());
    const indexer = new Indexer(projectRoot, ollama, qdrant, cache);
    const result = await indexer.indexProject(
      args.pattern ? String(args.pattern) : '**/*',
    );
    saveCache();
    return {
      content: [
        {
          type: 'text',
          text: `Индексация завершена:\n- Новых файлов: ${result.indexed}\n- Чанков: ${result.chunks}\n- Пропущено: ${result.skipped}\n- Корень: ${projectRoot}`,
        },
      ],
    };
  }

  if (toolName === 'index_file') {
    if (!args.path) {
      throw new Error('Параметр path обязателен');
    }
    const projectRoot = findProjectRoot(process.cwd());
    const indexer = new Indexer(projectRoot, ollama, qdrant, cache);
    const chunks = await indexer.indexFile(String(args.path));
    saveCache();
    return {
      content: [
        {
          type: 'text',
          text: `Файл ${String(args.path)} проиндексирован (${chunks} чанков).`,
        },
      ],
    };
  }

  if (toolName === 'search_code') {
    if (!args.query) {
      throw new Error('Параметр query обязателен');
    }
    const engine = new SearchEngine(qdrant, ollama, cache);
    const results = await engine.search(
      String(args.query),
      Number(args.limit) || 5,
      args.role ? String(args.role) : undefined,
      args.path ? String(args.path) : undefined,
    );

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Ничего не найдено. Сначала проиндексируй проект через index_project.',
          },
        ],
      };
    }

    const lines: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      lines.push(
        `--- Результат ${i + 1} (score: ${(r.score * 100).toFixed(1)}%) ---`,
      );
      lines.push(`Файл: ${r.point.payload.source} [${r.point.payload.role}]`);
      lines.push(`Строки: ${r.point.payload.lineStart}-${r.point.payload.lineEnd}`);
      lines.push(`Имя: ${r.point.payload.name}`);
      lines.push(`Тип: ${r.point.payload.type}`);
      const text =
        r.point.payload.text.length > 1500
          ? r.point.payload.text.slice(0, 1500) + '\n...'
          : r.point.payload.text;
      lines.push('```' + '\n' + text + '\n' + '```');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  }

  if (toolName === 'get_stats') {
    const count = await qdrant.count();
    const all = await qdrant.scrollAll();
    const files = new Set(all.map((p) => p.payload.source));
    const roles = new Map<string, number>();
    for (const p of all) {
      roles.set(p.payload.role, (roles.get(p.payload.role) || 0) + 1);
    }

    const roleLines: string[] = [];
    for (const [role, c] of roles) {
      roleLines.push(`  ${role}: ${c}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: [
            'Статистика индекса:',
            `- Точек: ${count}`,
            `- Уникальных файлов: ${files.size}`,
            '- По ролям:',
            ...roleLines,
            `- Кэш embeddings: ${cache.size}`,
            `- База: ${DB_PATH}`,
          ].join('\n'),
        },
      ],
    };
  }

  throw new Error(`Неизвестный инструмент: ${toolName}`);
});

async function main(): Promise<void> {
  await fs.promises.mkdir(DB_PATH, { recursive: true });
  loadCache();
  await qdrant.ensureCollection();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('🔍 RAG MCP Server запущен');
  console.error('   CWD:', process.cwd());
  console.error('   Qdrant:', QDRANT_URL);
  console.error('   Ollama:', OLLAMA_URL);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

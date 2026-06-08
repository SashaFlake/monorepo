import path from 'node:path';
import { CHUNK_SIZE } from './config.js';
import { extractReactChunks } from './react-chunker.js';
import type { Chunk } from './types.js';

function countLines(text: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') count++;
  }
  return count;
}

function chunkRaw(text: string, size: number, basename: string): Chunk[] {
  const chunks: Chunk[] = [];
  for (let i = 0; i < text.length; i += size) {
    const chunkText = text.slice(i, i + size);
    const lineStart = countLines(text, i);
    const lineEnd = lineStart + chunkText.split('\n').length - 1;
    chunks.push({
      text: chunkText,
      type: 'raw',
      name: basename,
      lineStart,
      lineEnd,
    });
  }
  return chunks;
}

/**
 * Найти индекс конца блока `{...}` с учётом баланса скобок,
 * строк (двойные, одинарные, backtick) и комментариев (line и block).
 */
function findBlockEnd(text: string, startIndex: number): number {
  let braceBalance = 0;
  let inString: string | null = null;
  let inComment = false;
  let foundFirstBrace = false;

  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (ch === '\\') {
        i++;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '\x60') {
      inString = ch;
      continue;
    }

    if (ch === '{') {
      braceBalance++;
      foundFirstBrace = true;
    }
    if (ch === '}') {
      braceBalance--;
    }

    if (foundFirstBrace && braceBalance <= 0) {
      return i + 1;
    }
  }

  return text.length;
}

function parseCssChunks(text: string, basename: string): Chunk[] {
  const lines = text.split('\n');
  const chunks: Chunk[] = [];
  let buffer: string[] = [];
  let braceBalance = 0;
  let blockStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    buffer.push(line);

    for (const ch of line) {
      if (ch === '{') braceBalance++;
      if (ch === '}') braceBalance--;
    }

    if (braceBalance <= 0 && buffer.length > 0) {
      const chunkText = buffer.join('\n').trim();
      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          type: 'raw',
          name: basename,
          lineStart: blockStartLine,
          lineEnd: i + 1,
        });
      }
      buffer = [];
      blockStartLine = i + 2;
    }
  }

  if (buffer.length > 0) {
    const chunkText = buffer.join('\n').trim();
    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        type: 'raw',
        name: basename,
        lineStart: blockStartLine,
        lineEnd: lines.length,
      });
    }
  }

  return chunks.length > 0 ? chunks : chunkRaw(text, 1500, basename);
}

function parseCodeChunks(text: string, basename: string): Chunk[] {
  const lines = text.split('\n');
  const chunks: Chunk[] = [];

  const declPatterns = [
    {
      re: /^\s*(?:export\s+)?(?:async\s+)?(?:default\s+)?function\s+(\w+)/,
      type: 'function' as const,
    },
    {
      re: /^\s*(?:export\s+)?(?:async\s+)?(?:default\s+)?class\s+(\w+)/,
      type: 'class' as const,
    },
    {
      re: /^\s*(?:export\s+)?interface\s+(\w+)/,
      type: 'interface' as const,
    },
    {
      re: /^\s*(?:export\s+)?enum\s+(\w+)/,
      type: 'enum' as const,
    },
    {
      re: /^\s*(?:export\s+)?type\s+(\w+)/,
      type: 'interface' as const,
    },
    {
      re: /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/,
      type: 'function' as const,
    },
  ];

  let i = 0;
  while (i < lines.length) {
    let matched = false;
    for (const pattern of declPatterns) {
      const match = lines[i].match(pattern.re);
      if (match) {
        const name = match[1];
        const lineStart = i + 1;

        // type alias без фигурных скобок
        if (pattern.re.source.includes('type') && !lines[i].includes('{')) {
          const typeLines: string[] = [lines[i]];
          let j = i + 1;
          while (j < lines.length && !lines[j - 1].trim().endsWith(';')) {
            typeLines.push(lines[j]);
            j++;
          }
          chunks.push({
            text: typeLines.join('\n').trim(),
            type: pattern.type,
            name,
            lineStart,
            lineEnd: j,
          });
          i = j - 1;
          matched = true;
          break;
        }

        const startIndex =
          lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
        const endIndex = findBlockEnd(text, startIndex);
        const chunkText = text.slice(startIndex, endIndex).trim();
        const lineEnd = countLines(text, endIndex - 1);

        chunks.push({
          text: chunkText,
          type: pattern.type,
          name,
          lineStart,
          lineEnd,
        });
        i = lineEnd;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }

  return chunks.length > 0 ? chunks : chunkRaw(text, 1500, basename);
}

function splitLargeChunks(chunks: Chunk[], maxSize: number): Chunk[] {
  const result: Chunk[] = [];
  for (const chunk of chunks) {
    if (chunk.text.length <= maxSize) {
      result.push(chunk);
      continue;
    }
    const subChunks = chunkRaw(chunk.text, maxSize, chunk.name ?? '');
    for (const sub of subChunks) {
      result.push({ ...sub, type: chunk.type });
    }
  }
  return result;
}

export function chunkFile(text: string, filePath: string): Chunk[] {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  if (ext === '.md' || ext === '.txt') {
    const lines = text.split('\n');
    const chunks: Chunk[] = [];
    let currentHeader = '';
    let currentBody: string[] = [];
    let headerLine = 1;
    let bodyStartLine = 1;

    const flush = (upToLine: number): void => {
      if (currentHeader || currentBody.length > 0) {
        const body = currentBody.join('\n').trim();
        const chunkText = currentHeader
          ? `${currentHeader}\n${body}`
          : body;
        const lineStart = currentHeader ? headerLine : bodyStartLine;
        chunks.push({
          text: chunkText,
          type: 'doc',
          name: currentHeader.replace(/^#{1,3}\s+/, '').trim() || basename,
          lineStart,
          lineEnd: upToLine - 1,
        });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^#{1,3}\s+/.test(line)) {
        flush(i + 1);
        currentHeader = line;
        headerLine = i + 1;
        currentBody = [];
      } else {
        if (currentBody.length === 0 && !currentHeader) {
          bodyStartLine = i + 1;
        }
        currentBody.push(line);
      }
    }
    flush(lines.length + 1);

    if (chunks.length === 0) {
      chunks.push({
        text,
        type: 'doc',
        name: basename,
        lineStart: 1,
        lineEnd: lines.length,
      });
    }

    return splitLargeChunks(chunks, CHUNK_SIZE);
  }

  if (ext === '.json' || ext === '.yaml' || ext === '.yml') {
    if (text.length < 3000) {
      const totalLines = text.split('\n').length;
      return [
        {
          text,
          type: 'config',
          name: basename,
          lineStart: 1,
          lineEnd: totalLines,
        },
      ];
    }
    return splitLargeChunks(chunkRaw(text, CHUNK_SIZE, basename), CHUNK_SIZE);
  }

  if (ext === '.css' || ext === '.scss' || ext === '.less') {
    return splitLargeChunks(parseCssChunks(text, basename), CHUNK_SIZE);
  }

  if (ext === '.tsx' || ext === '.jsx') {
    const codeChunks = parseCodeChunks(text, basename);
    const reactChunks = extractReactChunks(text, filePath);
    return splitLargeChunks([...reactChunks, ...codeChunks], CHUNK_SIZE);
  }

  return splitLargeChunks(parseCodeChunks(text, basename), CHUNK_SIZE);
}

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_EXTS, DEFAULT_IGNORE_PATTERNS, PROJECT_MARKERS } from './config.js';

export function findProjectRoot(startPath: string): string {
  let current = path.resolve(startPath);

  while (true) {
    for (const marker of PROJECT_MARKERS) {
      if (fs.existsSync(path.join(current, marker))) {
        return current;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return path.resolve(startPath);
}

export function shouldIndex(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTS.some((ext) => lower.endsWith(ext));
}

export function loadGitignore(projectRoot: string): string[] {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const patterns: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    if (trimmed.startsWith('!')) {
      continue;
    }

    let pattern = trimmed;

    if (!pattern.includes('/') && !pattern.startsWith('*')) {
      patterns.push(`**/${pattern}`);
      patterns.push(`**/${pattern}/**`);
    } else if (pattern.endsWith('/')) {
      patterns.push(`${pattern}**`);
    } else {
      patterns.push(pattern);
    }
  }

  return patterns;
}

export function isIgnored(
  relPath: string,
  patterns = DEFAULT_IGNORE_PATTERNS,
): boolean {
  const posixPath = relPath.replace(/\\/g, '/');
  const segments = posixPath.split('/');
  const fileName = segments[segments.length - 1] ?? '';

  for (const pattern of patterns) {
    if (pattern === '**/.*/**') {
      if (segments.some((s) => s.startsWith('.') && s.length > 1 && !s.startsWith('..'))) {
        return true;
      }
      continue;
    }

    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3);
      if (posixPath === prefix || posixPath.startsWith(prefix + '/')) {
        return true;
      }
      continue;
    }

    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1);
      if (fileName.endsWith(suffix)) {
        return true;
      }
      continue;
    }

    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (fileName.startsWith(prefix)) {
        return true;
      }
      continue;
    }

    if (posixPath === pattern || fileName === pattern) {
      return true;
    }
  }

  return false;
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

export function loadJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

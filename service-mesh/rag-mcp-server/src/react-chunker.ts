import path from 'node:path';
import ts from 'typescript';
import type { Chunk } from './types.js';

interface ImportInfo {
  name: string;
  source: string;
  isDefault?: boolean;
}

interface ExportInfo {
  name: string;
  kind: 'function' | 'const' | 'class' | 'interface' | 'type';
  isComponent: boolean;
  isHook: boolean;
  description?: string;
}

interface FileAnalysis {
  imports: ImportInfo[];
  exports: ExportInfo[];
  hasCreateFileRoute: boolean;
  filePath: string;
}

const REACT_RETURN_TYPES = new Set([
  'ReactElement',
  'JSX.Element',
  'Element',
  'VNode',
]);

const THIRD_PARTY_LIBS = new Set([
  'react',
  'react-dom',
  'tanstack',
  'effect',
  'lucide-react',
  'sonner',
  'zustand',
  'zod',
]);

const CSS_MODULE_NAMES = new Set(['styles', 's', 'classes', 'cx']);

const isThirdParty = (source: string): boolean => {
  const parts = source.split('/');
  const key = source.startsWith('@') ? parts[0].slice(1) : parts[0];
  return THIRD_PARTY_LIBS.has(key ?? '');
};

function containsJsx(node: ts.Node): boolean {
  let found = false;
  function visit(n: ts.Node): void {
    if (found) return;
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
      found = true;
      return;
    }
    ts.forEachChild(n, visit);
  }
  visit(node);
  return found;
}

function hasReactReturnType(node: ts.Node): boolean {
  if (!ts.isFunctionLike(node)) return false;
  const type = node.type;
  if (!type) return false;
  const text = type.getText();
  return Array.from(REACT_RETURN_TYPES).some((rt) => text.includes(rt));
}

function isLikelyComponent(name: string, node: ts.Node): boolean {
  if (!name || name[0] !== name[0].toUpperCase()) return false;
  if (ts.isFunctionLike(node) && 'body' in node) {
    if (hasReactReturnType(node)) return true;
    if (containsJsx((node as { body?: ts.Node }).body ?? node)) return true;
  }
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const init = node.initializer;
    if (
      (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) &&
      (hasReactReturnType(init) || containsJsx(init.body ?? init))
    ) {
      return true;
    }
  }
  return false;
}

function isHook(name: string): boolean {
  return typeof name === 'string' && name.startsWith('use') && name[2] === name[2].toUpperCase();
}

function getJsDocDescription(node: ts.Node): string | undefined {
  const docs = ts.getJSDocCommentsAndTags(node);
  if (!docs.length) return undefined;
  const first = docs[0];
  if (!ts.isJSDoc(first)) return undefined;
  const comment = first.comment;
  if (typeof comment === 'string') return comment.split('\n')[0].trim();
  if (Array.isArray(comment)) {
    return comment
      .map((c) => (typeof c === 'string' ? c : c.text))
      .join(' ')
      .split('\n')[0]
      .trim();
  }
  return undefined;
}

function analyzeSourceFile(sourceFile: ts.SourceFile, filePath: string): FileAnalysis {
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];
  let hasCreateFileRoute = false;

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) {
      const source = (node.moduleSpecifier as ts.StringLiteral).text;
      if (source === '@tanstack/react-router') {
        hasCreateFileRoute = true;
      }
      if (node.importClause) {
        if (node.importClause.name) {
          imports.push({ name: node.importClause.name.text, source, isDefault: true });
        }
        if (node.importClause.namedBindings) {
          const bindings = node.importClause.namedBindings;
          if (ts.isNamedImports(bindings)) {
            for (const el of bindings.elements) {
              imports.push({ name: el.name.text, source });
            }
          } else if (ts.isNamespaceImport(bindings)) {
            imports.push({ name: bindings.name.text, source, isDefault: true });
          }
        }
      }
      return;
    }

    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          exports.push({
            name: el.name.text,
            kind: 'const',
            isComponent: false,
            isHook: isHook(el.name.text),
          });
        }
      }
      return;
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      const isComponent = isLikelyComponent(name, node);
      const isExp =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      if (isExp || sourceFile.statements.some((s) => isDefaultExport(s, name))) {
        exports.push({
          name,
          kind: 'function',
          isComponent,
          isHook: isHook(name),
          description: getJsDocDescription(node),
        });
      }
      return;
    }

    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const name = decl.name.text;
          exports.push({
            name,
            kind: 'const',
            isComponent: isLikelyComponent(name, decl),
            isHook: isHook(name),
            description: getJsDocDescription(decl),
          });
        }
      }
      return;
    }

    if (
      ts.isClassDeclaration(node) &&
      node.name &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exports.push({
        name: node.name.text,
        kind: 'class',
        isComponent: false,
        isHook: false,
      });
    }

    if (
      ts.isInterfaceDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exports.push({
        name: node.name.text,
        kind: 'interface',
        isComponent: false,
        isHook: false,
      });
    }

    if (
      ts.isTypeAliasDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exports.push({
        name: node.name.text,
        kind: 'type',
        isComponent: false,
        isHook: false,
      });
    }
  }

  function isDefaultExport(stmt: ts.Statement, name: string): boolean {
    return (
      ts.isExportAssignment(stmt) &&
      !stmt.isExportEquals &&
      ts.isIdentifier(stmt.expression) &&
      stmt.expression.text === name
    );
  }

  ts.forEachChild(sourceFile, visit);

  // Detect createFileRoute usage in source text as fallback
  if (sourceFile.text.includes('createFileRoute')) {
    hasCreateFileRoute = true;
  }

  return { imports, exports, hasCreateFileRoute, filePath };
}

export function detectComponentRole(
  filePath: string,
  analysis: FileAnalysis,
): string {
  const lower = filePath.toLowerCase();
  const names = analysis.exports.map((e) => e.name);

  if (analysis.hasCreateFileRoute || lower.includes('/routes/')) {
    return 'route';
  }
  if (names.some((n) => n.endsWith('Page')) && lower.includes('/features/')) {
    return 'page';
  }
  if (lower.includes('/shared/ui/') || lower.includes('/shared/table/')) {
    return 'primitive';
  }
  if (names.some((n) => n.includes('Dialog') || n.includes('Modal'))) {
    return 'dialog';
  }
  if (names.some((n) => n.includes('Field'))) {
    return 'form-field';
  }
  if (names.some((n) => /(bar|chart|graph|visual)/i.test(n))) {
    return 'visualization';
  }
  if (analysis.exports.some((e) => e.isComponent)) {
    return 'component';
  }
  if (analysis.exports.some((e) => e.isHook)) {
    return 'hook';
  }
  return 'code';
}

function buildFileSummaryChunk(analysis: FileAnalysis): Chunk | null {
  const components = analysis.exports.filter((e) => e.isComponent);
  const hooks = analysis.exports.filter((e) => e.isHook);
  const others = analysis.exports.filter((e) => !e.isComponent && !e.isHook);

  if (components.length === 0 && hooks.length === 0 && others.length === 0) {
    return null;
  }

  const componentLines = components.map((c) => {
    const role = c.isComponent ? 'component' : c.isHook ? 'hook' : 'function';
    return `- ${c.name} (${role})${c.description ? `: ${c.description}` : ''}`;
  });

  const hookLines = hooks.map((h) => `- ${h.name} (hook)${h.description ? `: ${h.description}` : ''}`);

  const importedNames = analysis.imports
    .filter(
      (imp) =>
        !isThirdParty(imp.source) &&
        !CSS_MODULE_NAMES.has(imp.name) &&
        !imp.name.toLowerCase().endsWith('styles') &&
        (imp.source.startsWith('.') ||
          imp.source.startsWith('@/') ||
          imp.name[0] === imp.name[0].toUpperCase() ||
          imp.name.startsWith('use')),
    )
    .map((imp) => imp.name)
    .filter((n, i, a) => a.indexOf(n) === i)
    .slice(0, 12);

  const role = detectComponentRole(analysis.filePath, analysis);

  const parts: string[] = [
    `File: ${analysis.filePath}`,
    `Role: ${role}`,
  ];

  if (componentLines.length) {
    parts.push(`Components:\n${componentLines.join('\n')}`);
  }
  if (hookLines.length) {
    parts.push(`Hooks:\n${hookLines.join('\n')}`);
  }
  if (importedNames.length) {
    parts.push(`Uses: ${importedNames.join(', ')}`);
  }

  parts.push(
    `Related: ${analysis.hasCreateFileRoute ? 'route definition' : role === 'page' ? 'page component' : role === 'primitive' ? 'shared UI primitive' : 'routing-rules UI'}`,
  );

  return {
    text: parts.join('\n'),
    type: 'file-summary',
    name: `${path.basename(analysis.filePath, path.extname(analysis.filePath))}-summary`,
    lineStart: 1,
    lineEnd: 1,
  };
}

function buildDependencyChunk(analysis: FileAnalysis): Chunk | null {
  const significantImports = analysis.imports.filter(
    (imp) =>
      !isThirdParty(imp.source) &&
      !CSS_MODULE_NAMES.has(imp.name) &&
      (imp.source.startsWith('.') || imp.source.startsWith('@/')),
  );

  if (significantImports.length === 0) return null;

  const localImports = significantImports.filter(
    (imp) => imp.source.startsWith('.') || imp.source.startsWith('@/'),
  );

  const importedComponents = localImports
    .filter((imp) => imp.name[0] === imp.name[0].toUpperCase())
    .map((imp) => imp.name);

  if (importedComponents.length === 0) return null;

  const fileName = path.basename(analysis.filePath);
  const exportNames = analysis.exports
    .filter((e) => e.isComponent || e.isHook || analysis.hasCreateFileRoute)
    .map((e) => e.name);

  const lines: string[] = [
    `Dependency graph for ${fileName}:`,
    `Exports: ${exportNames.join(', ') || 'none'}`,
    `Imports local components/hooks: ${importedComponents.join(', ')}`,
  ];

  return {
    text: lines.join('\n'),
    type: 'dependency-graph',
    name: `${path.basename(analysis.filePath, path.extname(analysis.filePath))}-dependencies`,
    lineStart: 1,
    lineEnd: 1,
  };
}

/**
 * Extracts additional RAG chunks for React/TSX files:
 * - file-summary chunk describing exports and their roles
 * - dependency-graph chunk listing local component imports/exports
 *
 * Returns an empty array for non-React files or files without meaningful exports.
 */
export function extractReactChunks(text: string, filePath: string): Chunk[] {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.tsx' && ext !== '.jsx') return [];

  const scriptKind = ext === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.JSX;
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const analysis = analyzeSourceFile(sourceFile, filePath);

  const chunks: Chunk[] = [];
  const summary = buildFileSummaryChunk(analysis);
  if (summary) chunks.push(summary);
  const deps = buildDependencyChunk(analysis);
  if (deps) chunks.push(deps);

  return chunks;
}

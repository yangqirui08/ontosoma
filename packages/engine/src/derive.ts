import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import { SCHEMA_VERSION, type Ontology, type OntoEdge, type OntoNode, type SymbolKind } from './schema';

const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.ontosoma', 'coverage']);

const toPosix = (p: string): string => p.split(sep).join('/');

function listTsFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(full);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

function symbolKindOf(node: ts.Statement): SymbolKind | undefined {
  if (ts.isClassDeclaration(node)) return 'class';
  if (ts.isFunctionDeclaration(node)) return 'function';
  if (ts.isInterfaceDeclaration(node)) return 'interface';
  if (ts.isTypeAliasDeclaration(node)) return 'type';
  if (ts.isEnumDeclaration(node)) return 'enum';
  if (ts.isVariableStatement(node)) return 'const';
  return undefined;
}

function isExported(node: ts.Statement): boolean {
  const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return !!mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function namesOf(node: ts.Statement): string[] {
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations
      .map((d) => (ts.isIdentifier(d.name) ? d.name.text : undefined))
      .filter((n): n is string => n !== undefined);
  }
  const decl = node as ts.DeclarationStatement;
  return decl.name && ts.isIdentifier(decl.name) ? [decl.name.text] : [];
}

/** Resolve a relative import specifier to a posix relpath inside root, or undefined. */
function resolveLocalImport(fromFileAbs: string, spec: string, root: string, moduleIds: Set<string>): string | undefined {
  if (!spec.startsWith('.')) return undefined;
  const base = resolve(dirname(fromFileAbs), spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')];
  if (spec.endsWith('.js')) candidates.push(base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx'));
  for (const c of candidates) {
    const rel = toPosix(relative(root, c));
    if (moduleIds.has(rel)) return rel;
  }
  return undefined;
}

/**
 * Derive a v0 ontology from a directory of TypeScript, using the TS compiler's
 * own parser (syntactic only — no type-checker needed for this granularity).
 */
export function deriveOntology(targetDir: string): Ontology {
  const root = resolve(targetDir);
  const files = listTsFiles(root);
  const moduleIds = new Set(files.map((f) => toPosix(relative(root, f))));
  const nodes: OntoNode[] = [];
  const edges: OntoEdge[] = [];

  for (const fileAbs of files) {
    const relPath = toPosix(relative(root, fileAbs));
    nodes.push({ id: relPath, kind: 'module', name: relPath, path: relPath });

    const src = ts.createSourceFile(fileAbs, readFileSync(fileAbs, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const stmt of src.statements) {
      const sk = symbolKindOf(stmt);
      if (sk && isExported(stmt)) {
        for (const name of namesOf(stmt)) {
          const id = `${relPath}#${name}`;
          nodes.push({ id, kind: 'symbol', name, path: relPath, symbolKind: sk });
          edges.push({ kind: 'contains', from: relPath, to: id });
        }
      }
      if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        const target = resolveLocalImport(fileAbs, stmt.moduleSpecifier.text, root, moduleIds);
        if (target) edges.push({ kind: 'imports', from: relPath, to: target });
      }
    }
  }
  return { schemaVersion: SCHEMA_VERSION, nodes, edges };
}

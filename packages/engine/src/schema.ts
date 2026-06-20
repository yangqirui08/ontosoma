/**
 * Minimal OntoSoma ontology schema (v0).
 *
 * Code is the single source of truth; everything here is DERIVED from code.
 * The shape is intentionally tiny — just enough to run the shortest closed loop
 * (derive -> lockfile -> gate). Granularity grows in later schema versions.
 */

export const SCHEMA_VERSION = '0' as const;

export type NodeKind = 'module' | 'symbol';

export type SymbolKind = 'class' | 'function' | 'const' | 'interface' | 'type' | 'enum';

export type EdgeKind = 'contains' | 'imports';

export interface OntoNode {
  /** Stable id. module: posix relpath. symbol: `${relpath}#${name}`. */
  id: string;
  kind: NodeKind;
  name: string;
  /** Owning module's posix relpath. */
  path: string;
  symbolKind?: SymbolKind;
}

export interface OntoEdge {
  kind: EdgeKind;
  from: string;
  to: string;
}

export interface Ontology {
  schemaVersion: typeof SCHEMA_VERSION;
  nodes: OntoNode[];
  edges: OntoEdge[];
}

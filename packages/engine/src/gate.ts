import { readFileSync } from 'node:fs';
import { deriveOntology } from './derive';
import { parseOntology, serializeOntology } from './lockfile';
import type { Ontology } from './schema';

export interface GateResult {
  /** True when the freshly-derived ontology is byte-identical to the lockfile. */
  ok: boolean;
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}

const idSet = (o: Ontology): Set<string> => new Set(o.nodes.map((n) => n.id));
const edgeSet = (o: Ontology): Set<string> => new Set(o.edges.map((e) => `${e.kind} ${e.from} -> ${e.to}`));
const onlyIn = (a: Set<string>, b: Set<string>): string[] => [...b].filter((x) => !a.has(x)).sort();

/**
 * The drift gate: re-derive the target and compare against the committed lockfile.
 * "added" = present in code but missing from the lockfile; "removed" = the reverse.
 */
export function checkOntology(targetDir: string, lockfilePath: string): GateResult {
  const fresh = deriveOntology(targetDir);
  const committed = parseOntology(readFileSync(lockfilePath, 'utf8'));
  const freshIds = idSet(fresh);
  const oldIds = idSet(committed);
  const freshEdges = edgeSet(fresh);
  const oldEdges = edgeSet(committed);
  return {
    ok: serializeOntology(fresh) === serializeOntology(committed),
    addedNodes: onlyIn(oldIds, freshIds),
    removedNodes: onlyIn(freshIds, oldIds),
    addedEdges: onlyIn(oldEdges, freshEdges),
    removedEdges: onlyIn(freshEdges, oldEdges),
  };
}

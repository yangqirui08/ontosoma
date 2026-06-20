import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkOntology, deriveOntology, parseOntology, serializeOntology } from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const sample = join(here, 'fixtures', 'sample');

describe('deriveOntology', () => {
  it('extracts modules, exported symbols, and local import edges', () => {
    const o = deriveOntology(sample);

    expect(o.nodes.map((n) => n.id).sort()).toEqual([
      'a.ts',
      'a.ts#Foo',
      'b.ts',
      'b.ts#bar',
      'b.ts#baz',
    ]);

    const edges = o.edges.map((e) => `${e.kind} ${e.from} -> ${e.to}`).sort();
    expect(edges).toContain('contains a.ts -> a.ts#Foo');
    expect(edges).toContain('contains b.ts -> b.ts#bar');
    expect(edges).toContain('contains b.ts -> b.ts#baz');
    expect(edges).toContain('imports a.ts -> b.ts');

    const foo = o.nodes.find((n) => n.id === 'a.ts#Foo');
    expect(foo?.symbolKind).toBe('class');
  });
});

describe('lockfile', () => {
  it('serializes deterministically and round-trips', () => {
    const o = deriveOntology(sample);
    const once = serializeOntology(o);
    const twice = serializeOntology(parseOntology(once));
    expect(twice).toBe(once);
  });
});

describe('gate', () => {
  it('passes when the lockfile matches the code', () => {
    const dir = mkdtempSync(join(tmpdir(), 'onto-'));
    const lock = join(dir, 'ontology.json');
    writeFileSync(lock, serializeOntology(deriveOntology(sample)));

    expect(checkOntology(sample, lock).ok).toBe(true);
  });

  it('detects drift when the lockfile lags behind the code', () => {
    const dir = mkdtempSync(join(tmpdir(), 'onto-'));
    const lock = join(dir, 'ontology.json');

    // Lockfile is missing a symbol that the code actually has -> drift.
    const stale = deriveOntology(sample);
    stale.nodes = stale.nodes.filter((n) => n.id !== 'b.ts#baz');
    writeFileSync(lock, serializeOntology(stale));

    const r = checkOntology(sample, lock);
    expect(r.ok).toBe(false);
    expect(r.addedNodes).toContain('b.ts#baz');
  });
});

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { renderHtml } from './render';

function getFlag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv: string[]): number {
  const lockfile = argv[0];
  if (!lockfile) {
    console.error('usage: ontosoma-view <lockfile.json> [--out <out.html>]');
    return 2;
  }
  const out = getFlag(argv, '--out', `${lockfile.replace(/\.json$/, '')}.html`);
  const ontology = JSON.parse(readFileSync(lockfile, 'utf8')) as { nodes?: unknown[] };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderHtml(ontology));
  console.log(`rendered ${ontology.nodes?.length ?? 0} nodes -> ${out}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));

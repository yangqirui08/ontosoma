import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { deriveOntology } from './derive';
import { checkOntology } from './gate';
import { serializeOntology } from './lockfile';

const DEFAULT_LOCKFILE = '.ontosoma/ontology.json';

function getFlag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv: string[]): number {
  const [cmd, target] = argv;
  if (!cmd || !target) {
    console.error('usage: ontosoma <derive|check> <targetDir> [--out <lockfile>]');
    return 2;
  }
  const lockfile = getFlag(argv, '--out', DEFAULT_LOCKFILE);

  if (cmd === 'derive') {
    const onto = deriveOntology(target);
    mkdirSync(dirname(lockfile), { recursive: true });
    writeFileSync(lockfile, serializeOntology(onto));
    console.log(`derived ${onto.nodes.length} nodes, ${onto.edges.length} edges -> ${lockfile}`);
    return 0;
  }

  if (cmd === 'check') {
    const r = checkOntology(target, lockfile);
    if (r.ok) {
      console.log('ontology gate: OK (lockfile matches code)');
      return 0;
    }
    console.error('ontology gate: DRIFT detected');
    for (const n of r.addedNodes) console.error(`  + node ${n}`);
    for (const n of r.removedNodes) console.error(`  - node ${n}`);
    for (const e of r.addedEdges) console.error(`  + edge ${e}`);
    for (const e of r.removedEdges) console.error(`  - edge ${e}`);
    console.error('Run `ontosoma derive` to update the lockfile if this change is intended.');
    return 1;
  }

  console.error(`unknown command: ${cmd}`);
  return 2;
}

process.exit(main(process.argv.slice(2)));

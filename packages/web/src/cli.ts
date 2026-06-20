import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { renderHtml } from './render';

function getFlag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv: string[]): number {
  const lockfile = argv[0];
  if (!lockfile) {
    console.error('usage: ontosoma-view <lockfile.json> [--out <out.html>] [--annotations <file>]');
    return 2;
  }
  const out = getFlag(argv, '--out', `${lockfile.replace(/\.json$/, '')}.html`);
  const annPath = getFlag(argv, '--annotations', 'ontosoma.annotations.json');

  const ontology = JSON.parse(readFileSync(lockfile, 'utf8')) as {
    nodes?: Array<Record<string, unknown>>;
  };

  // 叠加中文标注层(对人友好):lockfile 保持纯代码派生,这里只补展示用的中文名/说明。
  let annotated = 0;
  if (existsSync(annPath)) {
    const ann = JSON.parse(readFileSync(annPath, 'utf8')) as {
      objects?: Record<string, { name?: string; note?: string }>;
    };
    const objs = ann.objects ?? {};
    for (const node of ontology.nodes ?? []) {
      const a = objs[node.id as string];
      if (a) {
        if (a.name) node.cn = a.name;
        if (a.note) node.note = a.note;
        annotated++;
      }
    }
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderHtml(ontology));
  console.log(`rendered ${ontology.nodes?.length ?? 0} nodes (${annotated} 标注) -> ${out}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));

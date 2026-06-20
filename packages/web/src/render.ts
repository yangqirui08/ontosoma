import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = '"__ONTOSOMA_DATA__"';

/**
 * Inject an ontology (any JSON-serializable lockfile object) into the
 * self-contained viewer template, returning a single standalone HTML string.
 * `<` is escaped so node names can never break out of the inlined <script>.
 */
export function renderHtml(ontology: unknown): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const template = readFileSync(join(here, 'viewer.html'), 'utf8');
  const data = JSON.stringify(ontology).replace(/</g, '\\u003c');
  return template.replace(MARKER, data);
}

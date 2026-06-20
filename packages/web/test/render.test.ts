import { describe, expect, it } from 'vitest';
import { renderHtml } from '../src/render';

describe('renderHtml', () => {
  it('injects the ontology and removes the placeholder marker', () => {
    const html = renderHtml({
      schemaVersion: '0',
      nodes: [{ id: 'a.ts', kind: 'module', name: 'a.ts', path: 'a.ts' }],
      edges: [],
    });
    expect(html).not.toContain('"__ONTOSOMA_DATA__"');
    expect(html).toContain('"a.ts"');
    expect(html).toContain('<svg');
  });

  it('escapes < so node names cannot break out of the inlined script', () => {
    const html = renderHtml({ nodes: [{ id: 'x', name: '</script>' }], edges: [] });
    expect(html).not.toContain('</script><');
    expect(html).toContain('\\u003c/script>');
  });
});

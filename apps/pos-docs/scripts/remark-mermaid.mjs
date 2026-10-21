const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Keep a readable source fallback; rendering is loaded only on diagram pages.
export default function mermaidFigures() {
  return tree => {
    function visit(node) {
      if (!node.children) return;
      node.children = node.children.map(child => {
        if (child.type === 'code' && child.lang === 'mermaid') {
          return { type: 'html', value: `<figure class="mermaid-figure" data-mermaid-figure><div class="mermaid-output" role="img" aria-label="Diagrama de arquitectura o flujo de esta sección"></div><p class="mermaid-status" role="status">Preparando diagrama…</p><details><summary>Ver definición del diagrama</summary><pre><code data-mermaid-source>${escape(child.value)}</code></pre></details></figure>` };
        }
        visit(child);
        return child;
      });
    }
    visit(tree);
  };
}

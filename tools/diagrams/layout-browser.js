/* Authoring only: render the C4 Mermaid model before native Excalidraw export. */
import mermaid from 'mermaid';

const configuration = {
  startOnLoad: false, securityLevel: 'strict', htmlLabels: false,
  theme: 'base', deterministicIds: true, deterministicIDSeed: 'pos-enterprise-tutorial',
  fontFamily: 'Arial, sans-serif', fontSize: 20,
  flowchart: {
    htmlLabels: false, useMaxWidth: false, curve: 'basis', padding: 12,
    nodeSpacing: 40, rankSpacing: 55, diagramPadding: 16, wrappingWidth: 320,
    subGraphTitleMargin: {top: 90, bottom: 70},
  },
  themeVariables: {
    fontFamily: 'Arial, sans-serif', fontSize: '20px', background: '#ffffff',
    primaryColor: '#edf4f1', primaryBorderColor: '#96b8af', primaryTextColor: '#17302d',
    secondaryColor: '#ffffff', tertiaryColor: '#ffffff', lineColor: '#527a70',
    textColor: '#17302d', edgeLabelBackground: '#ffffff', clusterBkg: '#ffffff', clusterBorder: '#c6d8d1',
  },
  themeCSS: '.node rect,.node polygon,.node path{stroke-width:1.6px}.edgeLabel text{font-size:18px}.cluster-label text{font-size:20px;font-weight:600}.node:focus{outline:none}.node:focus rect,.node:focus path,.node:focus polygon{stroke:#b05f30;stroke-width:3px}',
};

window.renderPosC4 = async ({key, source}) => {
  mermaid.initialize(configuration);
  const rendered = await mermaid.render(`pos-${key}`, source);
  const svg = new DOMParser().parseFromString(rendered.svg, 'image/svg+xml').documentElement;
  if (svg.localName !== 'svg' || svg.querySelector('foreignObject')) throw new Error(`Non-portable C4 SVG: ${key}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('class', 'pos-diagram-svg');
  const naturalWidth = Number(svg.getAttribute('viewBox').split(/\s+/)[2]);
  svg.setAttribute('style', `display:block;width:100%;max-width:${Math.min(900, Math.ceil(naturalWidth))}px;height:auto;margin-inline:auto;`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'group');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  for (const cluster of svg.querySelectorAll('g.cluster')) {
    const boundary = cluster.querySelector('rect'), label = cluster.querySelector('.cluster-label');
    if (boundary && label) label.setAttribute('transform', `translate(${Number(boundary.getAttribute('x')) + 15}, ${Number(boundary.getAttribute('y')) + 10})`);
  }
  const nodes = [];
  for (const node of svg.querySelectorAll('g.node')) {
    const match = /^flowchart-(.+)-\d+$/.exec(node.id);
    if (!match) throw new Error(`Unrecognized Mermaid node: ${node.id}`);
    const id = match[1];
    node.setAttribute('data-node', id);
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    const spans = Array.from(node.querySelectorAll('text tspan')).filter(span => !span.querySelector('tspan'));
    const label = (spans.length ? spans : Array.from(node.querySelectorAll('text'))).map(text => text.textContent).join(' ').replace(/\s+/g, ' ').trim();
    node.setAttribute('aria-label', `Ver detalle: ${label || id}`);
    nodes.push(id);
  }
  for (const element of svg.querySelectorAll('.edgePaths,.edgeLabels')) element.setAttribute('aria-hidden', 'true');
  return {svg: new XMLSerializer().serializeToString(svg), source, nodes};
};

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generatedPages, generatedDirectories, labLinks, siteBase, sourceRouteAliases, documentKinds, readingPath, docsOrigin, presentationOrigin, repositoryOrigin, presentationRepository } from '../content-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const output = path.join(root, 'apps/pos-docs/src/content/docs');
const sourceCache = new Map();
const warnings = new Set();
const routeBySource = new Map();
const anchorBySource = new Map();

function slug(text) {
  return text.toLowerCase().replace(/<[^>]*>/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\p{M}_\- ]/gu, '').replace(/ /g, '-');
}

function readSource(source) {
  if (sourceCache.has(source)) return sourceCache.get(source);
  const absolute = path.resolve(root, source);
  if (!absolute.startsWith(root + path.sep)) throw new Error(`Source outside repository: ${source}`);
  const text = fs.readFileSync(absolute, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const headings = [];
  const usedSlugs = new Map();
  let fence = null;
  lines.forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      return;
    }
    if (fence) return;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (!match) return;
    const base = slug(match[2]);
    const occurrence = usedSlugs.get(base) || 0;
    usedSlugs.set(base, occurrence + 1);
    headings.push({ index, level: match[1].length, text: match[2], id: base + (occurrence ? `-${occurrence}` : '') });
  });
  const data = { text, lines, headings };
  sourceCache.set(source, data);
  return data;
}

function bounds(page) {
  const source = readSource(page.source);
  const locate = (heading, fallback) => {
    if (!heading) return fallback;
    const found = source.headings.find(item => item.text === heading);
    if (!found) throw new Error(`Missing source heading: ${page.source}: ${heading}`);
    return found.index;
  };
  return { start: locate(page.range?.from, 0), end: locate(page.range?.to, source.lines.length) };
}

// Resolve a document's original anchors before splitting it across routes.
for (const page of generatedPages) {
  const source = readSource(page.source);
  const { start, end } = bounds(page);
  if (!routeBySource.has(page.source)) routeBySource.set(page.source, page.route);
  if (!anchorBySource.has(page.source)) anchorBySource.set(page.source, new Map());
  for (const heading of source.headings.filter(item => item.index >= start && item.index < end)) {
    anchorBySource.get(page.source).set(heading.id, page.route);
  }
  for (const match of source.lines.slice(start, end).join('\n').matchAll(/\bid=["']([^"']+)["']/g)) {
    anchorBySource.get(page.source).set(match[1], page.route);
  }
}

/** Resolve an existing documentation source and optional fragment to its canonical page. */
export function resolveDocLink(source, fragment = '') {
  const normalized = path.posix.normalize(source.replace(/\\/g, '/').replace(/^\//, ''));
  const route = routeBySource.get(normalized) || sourceRouteAliases[normalized.replace(/\/$/, '')];
  if (!route) return null;
  const rawFragment = fragment.replace(/^#/, '');
  const decoded = decodeURIComponent(rawFragment);
  const targetRoute = anchorBySource.get(normalized)?.get(decoded) || route;
  return `${siteBase}${targetRoute}/${rawFragment ? `#${rawFragment}` : ''}`;
}

/** Portable metadata consumed by the presentation's pinned, derived snapshot. */
export function buildLinkManifest() {
  return {
    schemaVersion: 1,
    docsOrigin,
    siteBase,
    routesBySource: Object.fromEntries(routeBySource),
    anchorsBySource: Object.fromEntries([...anchorBySource].map(([source, anchors]) => [source, Object.fromEntries(anchors)])),
    sourceAliases: {...sourceRouteAliases},
  };
}

// Every split source is partitioned exactly once: no lost or duplicated paragraphs.
for (const source of new Set(generatedPages.map(page => page.source))) {
  const pages = generatedPages.filter(page => page.source === source);
  if (pages.length < 2) continue;
  const coverage = new Uint8Array(readSource(source).lines.length);
  for (const page of pages) {
    const {start, end} = bounds(page);
    if (end <= start) throw new Error(`Empty or reversed source range: ${page.route}`);
    for (let index = start; index < end; index += 1) coverage[index] += 1;
  }
  if (coverage.some(count => count !== 1)) throw new Error(`Source ranges must cover each line exactly once: ${source}`);
}

function rewriteTarget(rawTarget, source) {
  const target = rawTarget.replace(/^<|>$/g, '');
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target) || target.startsWith(siteBase)) return rawTarget;
  const hashIndex = target.indexOf('#');
  const hash = hashIndex < 0 ? '' : target.slice(hashIndex + 1);
  const beforeHash = hashIndex < 0 ? target : target.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex < 0 ? '' : beforeHash.slice(queryIndex);
  const targetPath = queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex);
  let decodedPath;
  let decodedHash;
  try { decodedPath = decodeURIComponent(targetPath); decodedHash = decodeURIComponent(hash); }
  catch { warnings.add(`Invalid URL encoding in ${source}: ${target}`); return rawTarget; }
  const relative = decodedPath
    ? path.posix.normalize(decodedPath.startsWith('/') ? decodedPath.slice(1) : path.posix.join(path.posix.dirname(source), decodedPath))
    : source;
  const route = routeBySource.get(relative) || sourceRouteAliases[relative.replace(/\/$/, '')];
  if (route) {
    const aliasSource = generatedPages.find(page => page.route === route)?.source;
    const anchorRoute = decodedHash && (anchorBySource.get(relative)?.get(decodedHash) || (aliasSource && anchorBySource.get(aliasSource)?.get(decodedHash)));
    if (decodedHash && !anchorRoute) warnings.add(`Original anchor not found: ${source} -> ${relative}#${decodedHash}`);
    return `${siteBase}${anchorRoute || route}/${query}${hash ? `#${hash}` : ''}`;
  }
  if (relative.startsWith('../')) throw new Error(`Link escapes repository: ${source} -> ${target}`);
  const encoded = relative.split('/').map(segment => encodeURIComponent(segment)).join('/') + query + (hash ? `#${hash}` : '');
  if (relative.startsWith('presentation/')) return `${presentationOrigin}/${encoded}`;
  if (relative.startsWith('video/')) return `${presentationRepository}/blob/main/${encoded}`;
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) warnings.add(`Original file not found: ${source} -> ${relative}`);
  // Documentation downloads stay local. Product source is reviewed in GitHub,
  // never copied into the public web artifact.
  if (relative.startsWith('docs/')) return '/' + encoded;
  const kind = fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? 'tree' : 'blob';
  return `${repositoryOrigin}/${kind}/main/${encoded}`;
}

function rewriteLinks(text, source) {
  let fence = null;
  return text.split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      return line;
    }
    if (fence) return line;
    return line.replace(/(!?\[[^\]]*\]\()(<[^>]+>|[^)\s]+)([^)]*\))/g,
      (_, start, target, end) => start + rewriteTarget(target, source) + end)
      .replace(/^(\s*\[[^\]]+\]:\s*)(<[^>]+>|\S+)/, (_, prefix, target) => prefix + rewriteTarget(target, source));
  }).join('\n');
}

// Splitting a section into its own page must not leave H1 → H3/H4 jumps.
// Heading text and therefore public fragments stay unchanged.
export function normalizeHeadings(text) {
  let fence = null;
  const headings = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) { fence = fence === marker[1][0] ? null : fence || marker[1][0]; return; }
    if (fence) return;
    const match = line.match(/^(#{2,6})\s+/);
    if (match) headings.push({index, level: match[1].length});
  });
  if (!headings.length) return text;
  const ancestors = [];
  for (const {index, level} of headings) {
    while (ancestors.length && ancestors.at(-1) >= level) ancestors.pop();
    lines[index] = lines[index].replace(/^#{2,6}/, '#'.repeat(ancestors.length + 2));
    ancestors.push(level);
  }
  return lines.join('\n');
}

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function pageContext(page) {
  const kind = documentKinds[page.kind];
  if (!kind) throw new Error(`Unknown document kind: ${page.route}: ${page.kind}`);
  return `<aside class="doc-context" aria-label="Alcance de esta página" data-document-kind="${page.kind}">\n<p class="doc-context-label">${escapeHtml(kind.label)}</p>\n<p>${escapeHtml(page.description)}</p>\n<details data-pagefind-ignore><summary>Estado y alcance</summary><p>${escapeHtml(kind.detail)} <a href="${siteBase}${kind.link}/">Consultar referencia</a>.</p></details>\n</aside>\n\n`;
}

function pagination(page) {
  const index = readingPath.findIndex(entry => entry.route === page.route);
  const target = offset => {
    const entry = index < 0 ? undefined : readingPath[index + offset];
    return entry ? {label: entry.title, link: `${siteBase}${entry.route}/`} : false;
  };
  return `prev: ${JSON.stringify(target(-1))}\nnext: ${JSON.stringify(target(1))}\n`;
}

export function prepareContent() {
  const generatedFiles = new Set();
  for (const page of generatedPages) {
    const source = readSource(page.source);
    const { start, end } = bounds(page);
    let body = source.lines.slice(start, end).join('\n').trim();
    // The page title belongs to Starlight. Retain the source anchor without another H1.
    const firstHeading = source.headings.find(heading => heading.index === start);
    if (firstHeading) body = body.replace(/^#{1,6}\s+[^\n]+\n?/, `<span id="${firstHeading.id}"></span>\n`);
    body = normalizeHeadings(rewriteLinks(body, page.source));
    const extension = page.flow ? '.mdx' : '.md';
    const sourceLabel = page.kind === 'evidence' ? 'Evidencia y alcance de la revisión' : page.kind === 'research' ? 'Análisis que sustenta la propuesta' : 'Fuente del contenido';
    let imports = '';
    let enhanced = '';
    if (page.flow) {
      imports = "import FlowPlayer from '../../../components/FlowPlayer.astro';\n\n";
      const title = page.flow === 'sale' ? 'Venta confirmada en sucursal' : 'Publicación y activación de precios';
      enhanced = `<FlowPlayer scenario="${page.flow}" title="${title}" />\n\n`;
    }
    const labs = page.labs?.length ? '\n\n## Escenarios interactivos\n\n' + page.labs.map(id => `- [${labLinks[id]}](${presentationOrigin}/presentation/pos-corporativo-reveal.html?lectura=0#/${id})`).join('\n') + '\n\nLas simulaciones ilustran el diseño propuesto; no ejecutan operaciones ni demuestran garantías del producto.\n' : '';
    const frontmatter = `---\ntitle: ${JSON.stringify(page.title)}\ndescription: ${JSON.stringify(page.description)}\neditUrl: false\n${pagination(page)}---\n\n`;
    const sourceReference = page.sourceDownload === false ? `\`${page.source}\`` : `[${page.source}](${page.source.startsWith('docs/') ? '/' + page.source : `${repositoryOrigin}/blob/main/${page.source}`})`;
    const footer = `\n\n---\n\n${sourceLabel}: ${sourceReference}${page.range?.from ? ` · sección «${page.range.from}»` : ''}.\n`;
    const destination = path.join(output, page.route + extension);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, frontmatter + imports + pageContext(page) + enhanced + body + labs + footer, 'utf8');
    generatedFiles.add(destination);
  }

  // Remove stale generated Markdown only, never source documents or authored pages.
  for (const directory of generatedDirectories) {
    const absolute = path.resolve(output, directory);
    if (path.dirname(absolute) !== output || !fs.existsSync(absolute)) continue;
    for (const filename of fs.readdirSync(absolute)) {
      const candidate = path.join(absolute, filename);
      if (/\.mdx?$/.test(filename) && fs.lstatSync(candidate).isFile() && !generatedFiles.has(candidate)) fs.unlinkSync(candidate);
    }
  }

  const allDocs = [];
  function collect(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const relative = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) collect(relative);
      else if (entry.isFile() && entry.name.endsWith('.md')) allDocs.push(relative);
    }
  }
  collect('docs');
  const missing = allDocs.filter(source => !routeBySource.has(source));
  if (missing.length) throw new Error(`Documents without an editorial route: ${missing.join(', ')}`);
  console.log(`Starlight content: ${generatedFiles.size} pages, ${allDocs.length}/${allDocs.length} source documents indexed, proposal lines covered exactly once.`);
  for (const warning of warnings) console.warn(`[content] ${warning}`);
  console.log(`Original source link warnings: ${warnings.size}`);
  if (warnings.size) throw new Error('Source references must resolve before publishing documentation.');
  return { pages: generatedFiles.size, sources: allDocs.length, warnings: [...warnings] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) prepareContent();

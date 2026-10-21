/* Crop reviewed poster SVGs through their viewBox only. Never rewrites source artifacts. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const input = path.join(root, 'docs/diagramas-excalidraw');
const output = path.join(root, 'docs/diagramas-excalidraw/previews');
const margin = 28;
const names = {
  context: '01-contexto', containers: '02-contenedores', backend: '03-backend-sucursal',
  sync: '04-sincronizador', deployment: '05-despliegue'
};
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const round = value => Math.round(value * 1000) / 1000;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));

function elementBounds(element) {
  // These native boards use unrotated shapes and explicit polygonal arrow routes.
  // Fail for a new geometry convention instead of silently producing an unsafe crop.
  assert.equal(element.angle, 0, `Unsupported rotation: ${element.id}`);
  assert.ok(['rectangle', 'text', 'arrow', 'line'].includes(element.type), `Unsupported type: ${element.type}`);
  if (element.points) {
    const xs = element.points.map(point => element.x + point[0]);
    const ys = element.points.map(point => element.y + point[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  return [element.x, element.y, element.x + element.width, element.y + element.height];
}
function bounds(elements) {
  assert.ok(elements.length);
  const boxes = elements.map(elementBounds);
  return [Math.min(...boxes.map(b => b[0])), Math.min(...boxes.map(b => b[1])), Math.max(...boxes.map(b => b[2])), Math.max(...boxes.map(b => b[3]))];
}
function graphElements(scene, view) {
  const elements = scene.elements.filter(element => !element.isDeleted);
  const byId = new Map(elements.map(element => [element.id, element]));
  const ids = new Set(view.nodeIds.filter(id => id !== 'legend'));
  for (const boundary of view.boundaries) {
    ids.add(boundary.id);
    ids.add(`${boundary.id}-title`);
  }
  for (const relation of view.relationships) {
    const id = `${relation.from}_${relation.to}`;
    for (const part of [id, `label-${id}`, `label-bg-${id}`]) ids.add(part);
    const arrow = byId.get(id);
    assert.equal(arrow?.customData?.from, relation.from);
    assert.equal(arrow?.customData?.to, relation.to);
    assert.equal(arrow?.customData?.label, relation.label);
  }
  for (const id of ids) assert.ok(byId.has(id), `Missing diagram element: ${view.id}/${id}`);
  for (const element of elements) {
    if (element.containerId && ids.has(element.containerId)) ids.add(element.id);
  }
  for (const element of elements.filter(element => element.type === 'arrow')) {
    assert.ok(ids.has(element.id), `Unmapped arrow in ${view.id}: ${element.id}`);
  }
  return { all: elements, graph: elements.filter(element => ids.has(element.id)) };
}
function cropPoster(source, scene, view) {
  const tag = source.match(/^<svg\b[^>]*>/)?.[0];
  assert.ok(tag, `Missing SVG root: ${view.id}`);
  const box = tag.match(/\bviewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  assert.equal(box?.length, 4);
  const selected = graphElements(scene, view);
  const all = bounds(selected.all), graph = bounds(selected.graph);
  // exportToSvg translates native geometry into a padded viewport. Derive and
  // verify that translation from both axes instead of assuming poster dimensions.
  const padX = (box[2] - (all[2] - all[0])) / 2;
  const padY = (box[3] - (all[3] - all[1])) / 2;
  assert.ok(Math.abs(padX - padY) < 0.01 && Math.abs(padX - 35) < 0.01, `Unexpected export padding: ${view.id}`);
  const offsetX = box[0] + padX - all[0], offsetY = box[1] + padY - all[1];
  const crop = [graph[0] + offsetX - margin, graph[1] + offsetY - margin, graph[2] - graph[0] + margin * 2, graph[3] - graph[1] + margin * 2].map(round);
  assert.ok(crop[0] >= box[0] && crop[1] >= box[1]);
  assert.ok(crop[0] + crop[2] <= box[0] + box[2] && crop[1] + crop[3] <= box[1] + box[3]);
  const ids = new Set(selected.graph.map(element => element.id));
  const cropNative = [graph[0] - margin, graph[1] - margin, graph[2] + margin, graph[3] + margin];
  // The white sheet is intentionally behind everything. No poster header,
  // explanatory note, footer or external legend may intersect the preview.
  for (const element of selected.all.filter(element => !ids.has(element.id) && element.id !== 'sheet')) {
    const b = elementBounds(element);
    assert.ok(!(b[0] < cropNative[2] && b[2] > cropNative[0] && b[1] < cropNative[3] && b[3] > cropNative[1]), `Poster decoration intersects crop: ${view.id}/${element.id}`);
  }
  let croppedTag = tag.replace(/\bviewBox="[^"]+"/, `viewBox="${crop.join(' ')}"`);
  croppedTag = croppedTag.replace(/\bwidth="[^"]+"/, `width="${crop[2]}"`).replace(/\bheight="[^"]+"/, `height="${crop[3]}"`);
  const metadata = `<title>Vista previa parcial del póster: ${escape(view.title)}</title><desc>Recorte del área diagramática original, con todos sus nodos, relaciones y fronteras. El encabezado, la leyenda general, las fichas y las notas se consultan en el póster completo. No es otra edición del modelo.</desc>`;
  return {
    svg: croppedTag + metadata + source.slice(tag.length),
    report: {
      id: view.id, file: `${names[view.id]}.svg`, source: `docs/diagramas-excalidraw/${names[view.id]}.svg`,
      sourceSha256: hash(source),
      sourceViewBox: box, viewBox: crop, margin,
      nodes: view.nodeIds.filter(id => id !== 'legend').length,
      relationships: view.relationships.length, boundaries: view.boundaries.length,
      includedElementIds: selected.graph.map(element => element.id),
      excluded: 'Encabezado, leyenda general, fichas de responsabilidad, notas y pie del póster',
      interpretation: 'Vista previa parcial; el póster original completo conserva todo el contexto.'
    }
  };
}
function playwright() {
  for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(root, 'apps/pos-docs/node_modules/playwright')].filter(Boolean)) {
    try { return require(candidate); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Verification needs installed Playwright; set PLAYWRIGHT_MODULE_PATH if necessary. No download is performed.');
}
async function verify(previews) {
  const qa = path.join(root, 'tmp/diagrams/previews');
  fs.mkdirSync(qa, { recursive: true });
  const browser = await playwright().chromium.launch({ headless: true });
  const results = [];
  try {
    for (const preview of previews) {
      const [x, y, width, height] = preview.report.viewBox;
      const page = await browser.newPage({ viewport: { width: Math.ceil(width), height: Math.ceil(height) }, deviceScaleFactor: 1 });
      const errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
      await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;background:white">${preview.svg}</body></html>`);
      const geometry = await page.locator('svg').evaluate(svg => {
        const box = svg.viewBox.baseVal;
        const rootMatrix = svg.getScreenCTM().inverse();
        const visibleText = [];
        for (const element of svg.querySelectorAll('text')) {
          const b = element.getBBox(), matrix = rootMatrix.multiply(element.getScreenCTM());
          const p = new DOMPoint(b.x, b.y).matrixTransform(matrix);
          const q = new DOMPoint(b.x + b.width, b.y + b.height).matrixTransform(matrix);
          if (p.x < box.x + box.width && q.x > box.x && p.y < box.y + box.height && q.y > box.y) {
            visibleText.push({ text: element.textContent, clipped: p.x < box.x - 1 || q.x > box.x + box.width + 1 || p.y < box.y - 1 || q.y > box.y + box.height + 1, fontSize: parseFloat(getComputedStyle(element).fontSize) });
          }
        }
        return { visibleTextLines: visibleText.length, clipped: visibleText.filter(text => text.clipped), minFontSize: Math.min(...visibleText.map(text => text.fontSize)) };
      });
      assert.ok(geometry.visibleTextLines > 0);
      assert.deepEqual(geometry.clipped, [], `${preview.report.id}: visible text clipped by viewBox`);
      assert.deepEqual(errors, []);
      assert.deepEqual(requests, []);
      const screenshot = path.join(qa, preview.report.file.replace('.svg', '.png'));
      await page.screenshot({ path: screenshot, fullPage: true });
      results.push({ id: preview.report.id, screenshot: path.relative(root, screenshot).replaceAll('\\', '/'), width, height, x, y, ...geometry, errors, externalRequests: requests });
      await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(qa, 'validation.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(`Verified ${results.length} crops at native size: no clipped text or external requests.`);
}
async function main() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'tools/diagrams/models/c4-data.js'), 'utf8'), context);
  const check = process.argv.includes('--check');
  if (!check) fs.mkdirSync(output, { recursive: true });
  const previews = [];
  for (const view of context.window.POS_C4.views) {
    if (!names[view.id]) continue;
    const sourcePath = path.join(input, `${names[view.id]}.svg`);
    const nativePath = path.join(input, `${names[view.id]}.excalidraw`);
    const source = fs.readFileSync(sourcePath, 'utf8'), native = fs.readFileSync(nativePath, 'utf8');
    const preview = cropPoster(source, JSON.parse(native), view);
    preview.report.nativeSha256 = hash(native);
    if (check) assert.equal(fs.readFileSync(path.join(output, preview.report.file), 'utf8'), preview.svg, `Stale preview: ${preview.report.file}`);
    else fs.writeFileSync(path.join(output, preview.report.file), preview.svg);
    assert.equal(hash(fs.readFileSync(sourcePath, 'utf8')), hash(source));
    assert.equal(hash(fs.readFileSync(nativePath, 'utf8')), hash(native));
    previews.push(preview);
    console.log(`${view.id}: ${preview.report.viewBox[2]} × ${preview.report.viewBox[3]}, ${preview.report.nodes} nodes / ${preview.report.relationships} relationships`);
  }
  assert.equal(previews.length, 5);
  const report = JSON.stringify(previews.map(preview => preview.report), null, 2) + '\n';
  if (check) assert.equal(fs.readFileSync(path.join(output, 'bounds.json'), 'utf8').replaceAll('\r\n','\n'), report, 'Stale preview metadata');
  else fs.writeFileSync(path.join(output, 'bounds.json'), report);
  if (process.argv.includes('--verify')) await verify(previews);
}
main().catch(error => { console.error(error); process.exitCode = 1; });

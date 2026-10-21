/* Regenerate only the five C4 geometry records owned by POS Platform. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const runtime = path.resolve(process.env.EXCALIDRAW_RUNTIME || path.join(__dirname, 'runtime'));
const output = path.join(__dirname, 'models/c4-layouts.json');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'models/c4-data.js'), 'utf8'), context);
const views = context.window.POS_C4.views;
const normalize = text => text.replaceAll('\r\n', '\n').trim();
function playwright() {
  for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(root, 'apps/pos-docs/node_modules/playwright')].filter(Boolean)) {
    try { return require(candidate); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Install the documentation dependencies or set PLAYWRIGHT_MODULE_PATH to an installed Playwright package.');
}

async function main() {
  if (process.argv.includes('--check')) {
    const layouts = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.deepEqual(Object.keys(layouts).sort(), Array.from(views, view => view.key).sort());
    for (const view of views) {
      const layout = layouts[view.key];
      const source = fs.readFileSync(path.join(root, 'docs/diagramas-excalidraw/mermaid', view.key + '.mmd'), 'utf8');
      assert.equal(normalize(layout.source), normalize(source), `Stale C4 layout source: ${view.key}`);
      assert.deepEqual([...layout.nodes].sort(), Array.from(view.nodeIds).sort(), `C4 model/layout nodes differ: ${view.key}`);
      assert.ok(layout.svg.startsWith('<svg') && !layout.svg.includes('<foreignObject'));
    }
    console.log('Five reviewed C4 layouts match their Mermaid sources and model node contracts.');
    return;
  }
  if (!process.argv.includes('--write')) throw new Error('Use --check (read-only) or --write (replace reviewed geometry).');
  const bundle = path.join(root, 'tmp/diagrams/layout.js');
  fs.mkdirSync(path.dirname(bundle), {recursive: true});
  await require(path.join(runtime, 'node_modules/esbuild')).build({
    entryPoints: [path.join(__dirname, 'layout-browser.js')], nodePaths: [path.join(runtime, 'node_modules')],
    bundle: true, outfile: bundle, format: 'iife', define: {'process.env.NODE_ENV': '"production"'},
  });
  const {chromium} = playwright();
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1100, height: 1100}});
    await page.setContent('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({path: bundle});
    const layouts = {};
    for (const view of views) {
      const source = fs.readFileSync(path.join(root, 'docs/diagramas-excalidraw/mermaid', view.key + '.mmd'), 'utf8');
      const layout = await page.evaluate(payload => window.renderPosC4(payload), {key: view.key, source});
      assert.deepEqual([...layout.nodes].sort(), Array.from(view.nodeIds).sort(), `C4 node contract changed: ${view.key}`);
      layouts[view.key] = layout;
    }
    fs.writeFileSync(output, JSON.stringify(layouts, null, 2) + '\n');
    console.log('Updated five C4 layouts. Regenerate and verify Excalidraw scenes and previews before publishing.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

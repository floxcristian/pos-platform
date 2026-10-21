/* Check the assembled documentation, with the same CSP and routes as production. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {servePublic} = require('./serve.cjs');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../../..');
const output = path.join(root, 'dist/apps/pos-docs');
const qa = path.join(root, 'test-results-docs');
const report = {pages: 0, links: 0, checks: [], errors: [], requests: []};
const redirects = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).redirects || [];
function htmlFiles(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
async function run() {
  fs.mkdirSync(qa, {recursive: true});
  const server = await servePublic(0);
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', event => { if (event.type() === 'error') report.errors.push(event.text()); });
    page.on('response', response => { if (response.status() >= 400) report.requests.push(`${response.status()} ${response.url()}`); });
    const response = await page.goto(origin + '/guide/');
    assert.equal(response.status(), 200);
    assert.match(response.headers()['content-security-policy'], /wasm-unsafe-eval/);
    assert.equal(await page.locator('html').getAttribute('lang'), 'es');
    const snapshot = new Map();
    for (const file of htmlFiles(path.join(output, 'guide'))) {
      const content = fs.readFileSync(file, 'utf8');
      const dom = await page.evaluate(html => {
        const document = new DOMParser().parseFromString(html, 'text/html');
        return {ids: [...document.querySelectorAll('[id]')].map(e => e.id),
          pagination: Object.fromEntries(['prev', 'next'].map(direction => [direction, document.querySelector(`.pagination-links a[rel="${direction}"]`)?.getAttribute('href') ?? null])),
          headings: [...document.querySelectorAll('.sl-markdown-content h1,.sl-markdown-content h2,.sl-markdown-content h3,.sl-markdown-content h4,.sl-markdown-content h5,.sl-markdown-content h6')].filter(e => !e.closest('dialog')).map(e => ({level: Number(e.tagName.slice(1)), title: e.textContent})),
          links: [...document.querySelectorAll('a[href],img[src],script[src],link[rel="stylesheet"][href]')].map(e => e.getAttribute('href') || e.getAttribute('src')),
          inline: [...document.querySelectorAll('script:not([src])')].filter(e => e.textContent.trim() && !/application\/(?:ld\+)?json/.test(e.type)).length};
      }, content);
      assert.equal(dom.inline, 0, `Inline executable script conflicts with CSP: ${file}`);
      assert.equal(new Set(dom.ids).size, dom.ids.length, `Duplicate anchor in ${file}`);
      let previousLevel = 1;
      for (const heading of dom.headings) {
        assert.ok(heading.level <= previousLevel + 1 && heading.level > 1, `Heading hierarchy in ${file}: ${heading.title}`);
        previousLevel = heading.level;
      }
      snapshot.set(file, dom);
    }
    const linkErrors = new Set();
    for (const [file, dom] of snapshot) {
      const base = origin + '/' + path.relative(output, file).replaceAll('\\', '/').replace(/index\.html$/, '');
      for (const href of dom.links) {
        if (!href || /^(mailto:|data:|tel:)/.test(href)) continue;
        const target = new URL(href, base);
        if (target.origin !== origin) continue;
        let pathname = decodeURIComponent(target.pathname);
        pathname = redirects.find(item => item.source === pathname)?.destination || pathname;
        let destination = path.join(output, pathname);
        if (fs.existsSync(destination) && fs.statSync(destination).isDirectory()) destination = path.join(destination, 'index.html');
        if (!fs.existsSync(destination)) linkErrors.add(`${new URL(base).pathname} → missing ${href}`);
        if (target.hash && pathname.startsWith('/guide/') && snapshot.has(destination)) {
          if (!snapshot.get(destination).ids.includes(decodeURIComponent(target.hash.slice(1)))) linkErrors.add(`${new URL(base).pathname} → unknown anchor ${href}`);
        }
        report.links++;
      }
    }
    report.pages = snapshot.size;
    if (!process.argv.includes('--interactions-only')) {
      assert.deepEqual([...linkErrors], [], 'All documentation links must resolve');
      report.checks.push('All documentation pages, local resources, links and anchors resolve; executable scripts use same-origin files');
    }
    await page.locator('site-search button[data-open-modal]').click();
    await page.locator('.pagefind-ui__search-input').fill('permisos');
    await page.waitForFunction(() => document.querySelectorAll('.pagefind-ui__result-link').length > 0);
    assert.match(await page.locator('.pagefind-ui__results').innerText(), /permiso|acceso/i);
    await page.keyboard.press('Escape');
    report.checks.push('Pagefind returns Spanish access/permissions results under the deployed CSP');
    for (const [route, count, query] of [['mountain', 253, '/cajas-usuario/cerrar-caja/'], ['mountain-concentrator', 20, '/concentrador/reintentar/reintento-manual']]) {
      await page.goto(`${origin}/guide/api/${route}/`);
      const catalog = page.locator('pos-endpoint-catalog');
      await catalog.locator('.endpoint-filters').waitFor({state: 'visible'});
      assert.equal(await catalog.locator('[data-endpoint-entry]').count(), count);
      assert.equal(await catalog.locator('.endpoint-description').evaluateAll(elements => elements.every(element => element.textContent.trim().length > 30)), true);
      const search = catalog.locator('[data-endpoint-query]');
      await search.fill(query);
      assert.equal(await catalog.locator('[data-endpoint-entry]:visible').count(), 1);
      const method = await catalog.locator('[data-endpoint-entry]:visible').getAttribute('data-method');
      await catalog.locator('[data-endpoint-method]').selectOption(method);
      assert.equal(await catalog.locator('[data-endpoint-entry]:visible').count(), 1);
      const group = await catalog.locator('[data-endpoint-entry]:visible').getAttribute('data-group');
      await catalog.locator('[data-endpoint-group]').selectOption(group);
      assert.equal(await catalog.locator('[data-endpoint-entry]:visible').count(), 1);
      await search.fill('sin-coincidencias-987654');
      assert.equal(await catalog.locator('[data-endpoint-entry]:visible').count(), 0);
      assert.equal(await catalog.locator('[data-endpoint-empty]').isVisible(), true);
      await catalog.locator('.endpoint-overview summary').click();
      await catalog.locator('.endpoint-overview a').first().click();
      assert.equal(await catalog.locator('[data-endpoint-entry]:visible').count(), count, 'Capability index must clear filters before navigating');
      await search.fill('');
      await catalog.locator('[data-endpoint-method]').selectOption('');
      await catalog.locator('[data-endpoint-group]').selectOption('');
      assert.equal(await catalog.locator('[data-endpoint-entry]:visible').count(), count);
    }
    report.checks.push('Every legacy route has a description; route, method and capability filters work, including no results');
    await page.goto(origin + '/guide/api/mountain-configuration/');
    assert.equal(await page.locator('.configuration-entry').count(), 62);
    assert.equal(await page.locator('.configuration-entry h4 code').filter({hasText: /^URL_API_PAGO$/}).count(), 0);
    assert.equal(await page.locator('.configuration-entry h4 code').filter({hasText: /^URL_API_PAGO_[12]$/}).count(), 2);
    assert.match(await page.locator('main').innerText(), /Referencias en código comentado/);
    report.checks.push('48 backend and 14 monitor variables; commented-only references are not presented as active configuration');
    const {readingPath, generatedPages} = await import('../content-map.mjs');
    for (const entry of readingPath) {
      const routeFile = path.join(output, 'guide', entry.route, 'index.html');
      const dom = snapshot.get(routeFile);
      assert.ok(dom, `Missing proposal page: ${entry.route}`);
      const index = readingPath.indexOf(entry);
      for (const [direction, offset] of [['prev', -1], ['next', 1]]) {
        const target = readingPath[index + offset];
        assert.equal(dom.pagination[direction], target ? '/guide/' + target.route + '/' : null, `Wrong ${direction} page in proposal path: ${entry.route}`);
      }
    }
    for (const entry of generatedPages) {
      const html = fs.readFileSync(path.join(output, 'guide', entry.route, 'index.html'), 'utf8');
      assert.ok(html.includes(`data-document-kind="${entry.kind}"`), `Missing page scope: ${entry.route}`);
    }
    report.checks.push('Heading hierarchy, unique anchors, proposal reading path and page status are consistent');
    await page.goto(origin + '/guide/diagrams/');
    const preview = page.locator('[data-diagram-open]').first();
    await preview.click();
    assert.equal(await page.locator('dialog[open]').count(), 1);
    const zoom = page.locator('dialog[open] [data-diagram-scale]');
    await zoom.fill('150'); await zoom.dispatchEvent('input');
    assert.match(await page.locator('dialog[open] [data-diagram-scale-label]').innerText(), /150/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await preview.evaluate(e => e === document.activeElement), true);
    report.checks.push('Diagram expands, zooms, closes with Escape and restores keyboard focus');
    for (const route of ['proposal/continuity/', 'proposal/pricing-promotions/']) {
      await page.goto(origin + '/guide/' + route);
      const player = page.locator('pos-flow-player');
      const initial = await player.locator('[data-flow-title]').innerText();
      assert.equal(await player.locator('[data-flow-action="play"]').getAttribute('aria-pressed'), 'false');
      await player.locator('[data-flow-action="next"]').click();
      assert.notEqual(await player.locator('[data-flow-title]').innerText(), initial);
      await player.locator('[data-flow-action="previous"]').click();
      assert.equal(await player.locator('[data-flow-title]').innerText(), initial);
      await player.locator('[data-flow-action="play"]').click();
      assert.equal(await player.locator('[data-flow-action="play"]').getAttribute('aria-pressed'), 'true');
      await player.locator('[data-flow-action="play"]').click();
      await player.locator('[data-flow-seek]').fill('8'); await player.locator('[data-flow-seek]').dispatchEvent('input');
      assert.match(await player.locator('[data-flow-counter]').innerText(), /8/);
      await player.locator('[data-flow-action="reset"]').click();
      assert.equal(await player.locator('[data-flow-title]').innerText(), initial);
    }
    report.checks.push('Sale and pricing flows: no autoplay, manual steps, seek, play/pause and reset work');
    await page.goto(origin + '/guide/proposal/architecture/');
    const diagrams = page.locator('[data-mermaid-figure]');
    if (await diagrams.count()) {
      await page.waitForFunction(() => [...document.querySelectorAll('[data-mermaid-figure]')].every(e => e.dataset.rendered === 'true'));
      assert.ok(await page.locator('.mermaid-output svg').count());
      const expand = page.locator('.mermaid-viewer-actions button').first();
      await expand.click();
      assert.equal(await page.locator('dialog[open] svg').count(), 1);
      await page.keyboard.press('Escape');
      assert.equal(await expand.evaluate(e => e === document.activeElement), true);
      report.checks.push('Mermaid diagrams render from the authored source without external services');
    }
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({width, height: 950});
      for (const route of ['', 'overview/', 'contents/', 'diagrams/', 'proposal/pricing-promotions/', 'api/mountain/', 'api/mountain-configuration/']) {
        await page.goto(origin + '/guide/' + route);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${width}: ${route}`);
        await page.screenshot({path: path.join(qa, `${width}-${route ? route.split('/').filter(Boolean).at(-1) : 'inicio'}.png`)});
      }
    }
    report.checks.push('Home, diagram gallery and interactive content fit 1440/768/375/320px');
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.requests, []);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    fs.writeFileSync(path.join(qa, 'report.json'), JSON.stringify(report, null, 2));
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });

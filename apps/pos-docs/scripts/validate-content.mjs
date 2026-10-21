import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {documentKinds, generatedDirectories, generatedPages, readingPath, sidebar} from '../content-map.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const content = path.join(root, 'apps/pos-docs/src/content/docs');
const routes = new Set();
function register(route) {
  assert.match(route, /^(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/, `Documentation route must be English and URL-safe: ${route}`);
  assert.ok(!routes.has(route), `Duplicate documentation route: ${route}`);
  routes.add(route);
}
for (const page of generatedPages) {
  register(page.route);
  assert.ok(documentKinds[page.kind], `Missing editorial status: ${page.route}`);
  for (const key of ['title', 'description', 'source']) assert.ok(page[key]?.trim(), `Missing ${key}: ${page.route}`);
  assert.ok(fs.existsSync(path.join(root, page.source)), `Missing canonical source: ${page.source}`);
}
function authored(directory, prefix = '') {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (!prefix && generatedDirectories.includes(entry.name)) continue;
    const relative = prefix + entry.name;
    if (entry.isDirectory()) authored(path.join(directory, entry.name), relative + '/');
    else if (/\.mdx?$/.test(relative)) {
      register(relative.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, ''));
      const source = fs.readFileSync(path.join(directory, entry.name), 'utf8');
      assert.match(source, /^---\r?\n[\s\S]*?\r?\ndescription: .+\r?\n/, `Missing description: ${relative}`);
    }
  }
}
authored(content);
const navigation = new Set();
function visit(items) {
  for (const item of items) {
    if (item.items) visit(item.items);
    else {
      const route = item.link.replace(/^\//, '').replace(/\/$/, '');
      assert.ok(routes.has(route), `Sidebar points to a missing page: ${item.link}`);
      assert.ok(!navigation.has(route), `Page appears twice in sidebar: ${route}`);
      navigation.add(route);
    }
  }
}
visit(sidebar);
for (const route of routes) assert.ok(navigation.has(route), `Page missing from navigation: ${route}`);
assert.equal(new Set(readingPath.map(page => page.route)).size, readingPath.length, 'Repeated page in reading path');
for (const page of readingPath) assert.ok(routes.has(page.route), `Reading path points to missing page: ${page.route}`);

const endpoints = JSON.parse(fs.readFileSync(path.join(root, 'apps/pos-docs/src/data/legacy-endpoints.json'), 'utf8'));
const configuration = JSON.parse(fs.readFileSync(path.join(root, 'apps/pos-docs/src/data/legacy-configuration.json'), 'utf8'));
assert.match(endpoints.commit, /^[a-f0-9]{40}$/);
assert.equal(configuration.commit, endpoints.commit, 'Legacy catalogs must refer to the same reviewed snapshot');
for (const [app, entries] of Object.entries(endpoints.applications)) {
  assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length, `Duplicate API anchors in ${app}`);
  for (const entry of entries) {
    assert.ok(entry.description.length > 30 && entry.line > 0, `Incomplete API description/source: ${entry.path}`);
    assert.ok(endpoints.groupDescriptions[entry.group], `Undocumented functional area: ${entry.group}`);
  }
  const config = configuration.applications[app];
  assert.equal(new Set(config.variables.map(variable => variable.name)).size, config.variables.length, `Duplicate variable in ${app}`);
  for (const variable of config.variables) {
    assert.equal(variable.activeRead, true, `Commented reference counted as active: ${variable.name}`);
    assert.ok(variable.purpose && variable.condition && variable.sources.length, `Incomplete variable: ${variable.name}`);
    assert.ok(variable.sources.every(source => source.file.startsWith(app + '/') && source.line > 0), `Missing configuration evidence: ${variable.name}`);
    for (const forbidden of ['value', 'secret', 'defaultValue']) assert.ok(!(forbidden in variable), `Do not publish deployment values: ${variable.name}`);
  }
  for (const variable of config.commentedVariables) assert.ok(!config.variables.some(active => active.name === variable.name), `Commented variable also counted active: ${variable.name}`);
}
const backendGroups = new Set(endpoints.applications.backend.map(entry => entry.group));
for (const responsibility of endpoints.responsibilities) for (const group of responsibility.groups) assert.ok(backendGroups.has(group), `Unknown responsibility mapping: ${group}`);

const result = spawnSync(process.execPath, ['apps/pos-docs/scripts/sync-monorepo-catalog.mjs', '--check'], {cwd: root, stdio: 'inherit', windowsHide: true});
if (result.error) throw result.error;
assert.equal(result.status, 0, 'Monorepo representations diverge from their canonical catalog');
for (const command of [
  ['tools/diagrams/render-c4.cjs', '--check'],
  ['tools/diagrams/check-excalidraw.cjs', '--static'],
  ['tools/diagrams/generate-architecture-previews.cjs', '--check'],
]) {
  const validation = spawnSync(process.execPath, command, {cwd: root, stdio: 'inherit', windowsHide: true});
  if (validation.error) throw validation.error;
  assert.equal(validation.status, 0, `Diagram sources and assets diverge: ${command[0]}`);
}
console.log(`Editorial validation: ${routes.size} routes reachable once; ${readingPath.length} proposal steps; provenance and catalogs consistent.`);

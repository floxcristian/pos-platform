import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/monorepo-catalog.json', import.meta.url), 'utf8'));
const applications = [...catalog.applications, ...catalog.documentationApplications];
let check = false;
let workspace;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--check') check = true;
  else if (args[index] === '--workspace' && args[index + 1] && !args[index + 1].startsWith('--')) workspace = path.resolve(args[++index]);
  else throw new Error('Usage: node apps/pos-docs/scripts/sync-monorepo-catalog.mjs [--check] [--workspace <product-checkout>]');
}
if (catalog.schemaVersion !== 1 || !catalog.reviewedOn || !catalog.evidence) throw new Error('Invalid monorepo catalog metadata');
for (const [entries, key] of [[applications, 'name'], [catalog.libraries, 'path']]) {
  const names = entries.map(entry => entry[key]);
  if (new Set(names).size !== names.length || names.some(name => !/^[a-z][a-z0-9/-]+$/.test(name))) throw new Error('Invalid or duplicate catalog path');
}
const target = catalog.targetStructure;
if (!target?.decidedOn || !target.status || !target.coreRelationship || !target.entries?.length) {
  throw new Error('Missing target structure decision');
}
const targetPaths = new Set();
for (const entry of [...target.entries, ...catalog.workspaceSupport]) {
  for (const value of [entry.path, entry.currentPath].filter(Boolean)) {
    if (!/^(?:[a-z][a-z0-9-]*|\.github)(?:\/[a-z][a-z0-9-]*)*$/.test(value)) throw new Error('Invalid structure path: ' + value);
  }
  if (!entry.description) throw new Error('Missing structure description: ' + entry.path);
}
for (const entry of target.entries) {
  if (targetPaths.has(entry.path)) throw new Error('Duplicate target path: ' + entry.path);
  targetPaths.add(entry.path);
  if (!['conservado', 'mover', 'transitorio', 'por incorporar'].includes(entry.state)) throw new Error('Invalid target state: ' + entry.path);
  if ((entry.state === 'mover') !== Boolean(entry.currentPath)) throw new Error('Move requires currentPath: ' + entry.path);
}
for (const app of applications) {
  if (!targetPaths.has('apps/' + app.name)) throw new Error('Current app missing from target structure: ' + app.name);
}
for (const library of catalog.libraries) {
  const current = 'libs/' + library.path;
  if (!target.entries.some(entry => entry.path === current || entry.currentPath === current)) {
    throw new Error('Current library has no documented destination: ' + current);
  }
}
if (workspace) {
  for (const entry of [...target.entries, ...catalog.workspaceSupport]) {
    const currentPath = entry.currentPath || (entry.state === 'por incorporar' ? null : entry.path);
    if (currentPath && !fs.statSync(path.join(workspace, currentPath)).isDirectory()) throw new Error('Missing current directory: ' + currentPath);
  }
  // This optional review reads project files without building or running the product.
  const directory = path.join(workspace, 'apps');
  const projects = fs.readdirSync(directory, {withFileTypes: true})
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'project.json')))
    .map(entry => {
      const project = JSON.parse(fs.readFileSync(path.join(directory, entry.name, 'project.json'), 'utf8'));
      if (project.name !== entry.name || project.projectType !== 'application') throw new Error(`Unexpected application identity: ${entry.name}`);
      const isDocumentation = catalog.documentationApplications.some(app => app.name === project.name);
      if (isDocumentation !== project.tags?.includes('type:docs')) throw new Error(`Wrong documentation classification: ${project.name}`);
      return project.name;
    }).sort();
  const expected = applications.map(app => app.name).sort();
  if (JSON.stringify(projects) !== JSON.stringify(expected)) throw new Error(`Catalog apps differ from reviewed workspace: expected ${expected.join(', ')}, found ${projects.join(', ')}`);
  for (const library of catalog.libraries) {
    const directory = path.join(workspace, 'libs', library.path);
    if (!fs.statSync(directory).isDirectory()) throw new Error(`Missing library directory: ${library.path}`);
    if (library.kind !== 'frontend' || library.path !== 'features') {
      const project = JSON.parse(fs.readFileSync(path.join(directory, 'project.json'), 'utf8'));
      if (project.projectType !== 'library') throw new Error(`Expected library project: ${library.path}`);
    }
  }
  const actualContexts = fs.readdirSync(path.join(workspace, 'libs/backend'), {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => `backend/${entry.name}`).sort();
  const expectedContexts = catalog.libraries.filter(library => library.kind === 'backend-context').map(library => library.path).sort();
  if (JSON.stringify(actualContexts) !== JSON.stringify(expectedContexts)) throw new Error('Catalog backend contexts differ from reviewed workspace');
  console.log(`Workspace evidence checked: ${projects.length} application project files and ${catalog.libraries.length} library locations.`);
}

const full = [
  'apps/',
  ...catalog.applications.map(app => `  ${(app.name + '/').padEnd(23)} # ${app.description}`),
  ...catalog.documentationApplications.map(app => `  ${(app.name + '/').padEnd(23)} # Documentación estática; fuera del runtime POS`),
  'libs/',
  ...catalog.libraries.map(lib => `  ${(lib.path + '/').padEnd(23)} # ${lib.description}`),
  ...catalog.workspaceSupport.map(entry => (entry.path + '/').padEnd(25) + ' # ' + entry.description),
].join('\n');
function renderTarget(entries) {
  const tree = new Map();
  for (const entry of entries) {
    let level = tree;
    const segments = entry.path.split('/');
    for (const [index, segment] of segments.entries()) {
      if (!level.has(segment)) level.set(segment, {children: new Map()});
      const node = level.get(segment);
      if (index === segments.length - 1) node.entry = entry;
      level = node.children;
    }
  }
  const lines = [];
  const visit = (nodes, depth) => {
    for (const [name, node] of nodes) {
      const label = '  '.repeat(depth) + name + '/';
      lines.push(node.entry ? label.padEnd(31) + ' # [' + node.entry.state + '] ' + node.entry.description : label);
      visit(node.children, depth + 1);
    }
  };
  visit(tree, 0);
  return lines.join('\n');
}
const targetTree = renderTarget(target.entries);
const migration = [
  '| Ruta física actual | Destino acordado | Estado |',
  '| --- | --- | --- |',
  ...target.entries.filter(entry => entry.state !== 'conservado').map(entry =>
    '| `' + (entry.currentPath || (entry.state === 'transitorio' ? entry.path : 'sin biblioteca dedicada')) +
    '` | `' + entry.path + '` | ' + entry.state + ' |'),
].join('\n');
const table = [
  '| Aplicación | Lugar previsto | Responsabilidad | Estado revisado |',
  '| --- | --- | --- | --- |',
  ...applications.map(app => `| \`${app.name}\` | ${app.location} | ${app.description} | ${app.state} |`),
].join('\n');
const fence = value => '```text\n' + value + '\n```';
const outputs = [
  ['docs/opciones-tecnologicas.md', [['target', fence(targetTree)], ['applications', table]]],
  ['docs/monorepo.md', [['target', fence(targetTree)], ['current', fence(full)], ['migration', migration], ['applications', table]]],
  ['README.md', [['target', fence(targetTree)]]],
];
let changed = 0;
for (const [relative, blocks] of outputs) {
  const file = path.join(root, relative);
  const current = fs.readFileSync(file, 'utf8');
  let expected = current;
  for (const [marker, value] of blocks) {
    const start = '<!-- monorepo:' + marker + ':start -->';
    const end = '<!-- monorepo:' + marker + ':end -->';
    if (expected.split(start).length !== 2 || expected.split(end).length !== 2) throw new Error('Expected one ' + marker + ' block in ' + relative);
    const begin = expected.indexOf(start) + start.length;
    const finish = expected.indexOf(end, begin);
    if (finish < begin) throw new Error('Invalid catalog block order: ' + relative);
    expected = expected.slice(0, begin) + '\n' + value + '\n' + expected.slice(finish);
  }
  const stale = current.replaceAll('\r\n', '\n') !== expected.replaceAll('\r\n', '\n');
  if (check && stale) throw new Error('Catalog differs from ' + relative + '. Run npm --prefix apps/pos-docs run sync:catalog.');
  if (!check && stale) { fs.writeFileSync(file, expected); changed++; }
}
console.log('Monorepo catalog: ' + catalog.applications.length + ' runtime apps, ' + catalog.documentationApplications.length +
  ' documentation app, ' + catalog.libraries.length + ' current library locations; target structure and migration map ' +
  (check ? 'consistent' : 'synchronized (' + changed + ' documents updated)') + '.');

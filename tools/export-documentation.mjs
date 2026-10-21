import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildLinkManifest} from '../apps/pos-docs/scripts/prepare-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const inputs = [
  'docs/propuesta-arquitectura.md',
  'docs/vistas-arquitectura-y-flujos.md',
  'docs/recorridos-datos-tablas.md',
  'docs/operacion-caja-y-evolucion.md',
  'apps/pos-docs/src/data/monorepo-catalog.json',
  'tools/diagrams/models/c4-data.js',
  'tools/diagrams/models/dynamic-data.cjs',
  'tools/diagrams/models/c4-layouts.json',
  ...['01-contexto.svg', '02-contenedores.svg', '03-backend-sucursal.svg', '04-sincronizador.svg', '05-despliegue.svg', 'bounds.json'].map(file => 'docs/diagramas-excalidraw/previews/' + file),
];
const files = Object.fromEntries(inputs.map(file => {
  const content = fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n');
  return [file, {content, sha256: createHash('sha256').update(content).digest('hex')}];
}));
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const changes = execFileSync('git', ['status', '--porcelain', '--', 'docs', 'apps/pos-docs', 'tools/diagrams', 'tools/export-documentation.mjs'], {cwd: root, encoding: 'utf8'}).trim();
const snapshot = {
  schemaVersion: 1,
  repository: 'https://github.com/floxcristian/pos-platform',
  revision,
  dirty: changes.length > 0,
  notice: 'Generated public reference snapshot. Edit documentation in pos-platform, then regenerate from a clean revision.',
  links: buildLinkManifest(),
  files,
};
const target = path.join(root, 'dist/apps/pos-docs/documentation.snapshot.json');
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Documentation snapshot: ${revision.slice(0, 12)}${snapshot.dirty ? ' (workspace changes; not for publication to presentation repository)' : ' (clean revision)'}.`);

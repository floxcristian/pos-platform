import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const web = path.join(root, 'dist/apps/pos-web/browser');
const documentation = path.join(root, 'dist/apps/pos-docs');
const output = path.join(root, 'dist/vercel');
if (!fs.existsSync(path.join(web, 'index.html'))) throw new Error('Build pos-web before assembling the deployment.');
if (!fs.existsSync(path.join(documentation, '.pos-docs-build'))) throw new Error('Build pos-docs before assembling the deployment.');
if (path.dirname(output) !== path.join(root, 'dist') || path.basename(output) !== 'vercel') throw new Error('Unexpected deployment output.');
if (fs.existsSync(output)) {
  if (fs.lstatSync(output).isSymbolicLink() || !fs.existsSync(path.join(output, '.pos-platform-deployment'))) throw new Error('Refusing to replace an unmarked deployment folder.');
  fs.rmSync(output, {recursive: true});
}
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, '.pos-platform-deployment'), 'Generated from pos-web and pos-docs.\n');
fs.cpSync(web, output, {recursive: true});
for (const name of ['guide', 'docs']) {
  if (fs.existsSync(path.join(output, name))) throw new Error(`Web output collides with documentation namespace: ${name}`);
  fs.cpSync(path.join(documentation, name), path.join(output, name), {recursive: true});
}
fs.copyFileSync(path.join(documentation, 'documentation.snapshot.json'), path.join(output, 'documentation.snapshot.json'));
console.log('Vercel artifact: dist/vercel; POS at / and Starlight at /guide/.');

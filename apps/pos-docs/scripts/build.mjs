import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const app = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(app, '../..');
const output = path.join(root, 'dist/apps/pos-docs');
const marker = '.pos-docs-build';
const require = createRequire(import.meta.url);
const astroPackage = require.resolve('astro/package.json');
const astro = JSON.parse(fs.readFileSync(astroPackage, 'utf8'));
function run(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: app, stdio: 'inherit', windowsHide: true, env: {...process.env, ASTRO_TELEMETRY_DISABLED: '1'} });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Documentation command failed (${result.status}): ${file}`);
}
run(path.join(app, 'scripts/validate-content.mjs'));
run(path.join(app, 'scripts/prepare-content.mjs'));

// The only disposable tree is this app's declared artifact, never the source docs/.
if (path.relative(root, output).replaceAll('\\', '/') !== 'dist/apps/pos-docs') throw new Error('Invalid documentation output');
const realRoot = fs.realpathSync(root);
for (const directory of [path.join(root, 'dist'), path.join(root, 'dist/apps'), output]) {
  if (fs.existsSync(directory) && fs.realpathSync(directory) !== path.join(realRoot, path.relative(root, directory))) {
    throw new Error('Documentation output cannot traverse a symlink');
  }
}
if (fs.existsSync(output)) {
  if (fs.lstatSync(output).isSymbolicLink() || !fs.statSync(output).isDirectory() || !fs.existsSync(path.join(output, marker))) {
    throw new Error('Refusing to replace an unmarked documentation artifact');
  }
  fs.rmSync(output, {recursive: true});
}
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, marker), 'Generated from apps/pos-docs and docs/ in POS Platform.\n');
run(path.resolve(path.dirname(astroPackage), typeof astro.bin === 'string' ? astro.bin : astro.bin.astro), ['build']);

let assets = 0;
const publicExtensions = /\.(md|svg|png|jpe?g|webp|pdf|pptx|excalidraw|drawio|html|zip|mmd|json)$/i;
function copyDocuments(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), {withFileTypes: true})) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Documentation download must not be a symlink: ${relative}`);
    if (entry.isDirectory()) copyDocuments(relative);
    else if (entry.isFile() && publicExtensions.test(entry.name) && !entry.name.startsWith('.')) {
      const destination = path.join(output, relative);
      fs.mkdirSync(path.dirname(destination), {recursive: true});
      fs.copyFileSync(path.join(root, relative), destination);
      assets++;
    }
  }
}
copyDocuments('docs');

const scripts = new Set();
let pages = 0;
function externalize(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) externalize(file);
    else if (entry.name.endsWith('.html')) {
      let html = fs.readFileSync(file, 'utf8');
      html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (original, attributes, code) => {
        if (/\bsrc\s*=/i.test(attributes) || !code.trim() || /\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attributes)) return original;
        const hash = createHash('sha256').update(code).digest('hex').slice(0, 20);
        const name = `inline-${hash}.js`;
        fs.mkdirSync(path.join(output, 'guide/_astro'), {recursive: true});
        fs.writeFileSync(path.join(output, 'guide/_astro', name), code);
        scripts.add(name);
        return `<script${attributes} src="/guide/_astro/${name}"></script>`;
      });
      fs.writeFileSync(file, html);
      pages++;
    }
  }
}
externalize(output);
run(path.join(root, 'tools/export-documentation.mjs'));
console.log(`Documentation artifact: ${pages} HTML files, ${assets} downloads, ${scripts.size} shared scripts; dist/apps/pos-docs/{guide,docs}.`);

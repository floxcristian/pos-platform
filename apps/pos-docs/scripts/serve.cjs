/* Preview only the documentation artifact with the deployment's real security headers. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const output = path.join(root, 'dist/apps/pos-docs');
const configuration = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.md':'text/plain; charset=utf-8', '.mmd':'text/plain; charset=utf-8', '.json':'application/json', '.ico':'image/x-icon', '.wasm':'application/wasm', '.woff':'font/woff', '.woff2':'font/woff2', '.webp':'image/webp', '.avif':'image/avif', '.excalidraw':'application/json', '.drawio':'application/xml', '.zip':'application/zip', '.pdf':'application/pdf'};
function servePublic(port = Number(process.env.POS_DOCS_PORT || 4207)) {
  if (!fs.existsSync(path.join(output, '.pos-docs-build')) || fs.lstatSync(output).isSymbolicLink()) throw new Error('Build pos-docs before previewing it');
  const server = http.createServer((request, response) => {
    let pathname;
    let requestUrl;
    try { requestUrl = new URL(request.url, 'http://localhost'); pathname = decodeURIComponent(requestUrl.pathname); }
    catch { response.writeHead(400); return response.end(); }
    for (const item of configuration.headers || []) {
      const matches = item.source.endsWith('(.*)') ? pathname.startsWith(item.source.slice(0, -4)) : item.source === pathname;
      if (matches) for (const header of item.headers) response.setHeader(header.key, header.value);
    }
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); return response.end(); }
    const redirect = configuration.redirects?.find(item => item.source === pathname);
    if (redirect) { response.writeHead(redirect.permanent ? 308 : 307, {Location:redirect.destination}); return response.end(); }
    if (pathname === '/') { response.writeHead(307, {Location:'/guide/'}); return response.end(); }
    let file = path.resolve(output, '.' + pathname);
    const relative = path.relative(output, file);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) {
      response.writeHead(404); return response.end();
    }
    let stat;
    try {
      stat = fs.statSync(file);
      if (stat.isDirectory()) {
        if (!pathname.endsWith('/')) { response.writeHead(308, {Location: pathname + '/' + requestUrl.search}); return response.end(); }
        file = path.join(file, 'index.html');
        stat = fs.statSync(file);
      }
      const real = path.relative(fs.realpathSync(output), fs.realpathSync(file));
      if (!stat.isFile() || real.startsWith('..') || path.isAbsolute(real)) throw new Error('Outside output');
    } catch { response.writeHead(404); return response.end(); }
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.setHeader('Content-Length', stat.size);
    if (request.method === 'HEAD') return response.end();
    const stream = fs.createReadStream(file);
    response.once('close', () => stream.destroy());
    stream.once('error', () => response.destroy());
    stream.pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
if (require.main === module) servePublic().then(server => console.log(`Documentation: http://127.0.0.1:${server.address().port}/guide/`)).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {servePublic};

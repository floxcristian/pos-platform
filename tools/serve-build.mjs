import { createServer } from 'node:http';
import { open, readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const buildDirectory = resolve(workspace, 'dist/apps/pos-web/browser');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

function within(root, target) {
  const path = relative(root, target);
  return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`);
}

export async function createBuildServer({ root = buildDirectory } = {}) {
  const publicRoot = await realpath(root);
  const tauri = JSON.parse(
    await readFile(resolve(workspace, 'apps/pos-desktop/src-tauri/tauri.conf.json'), 'utf8'),
  );
  const csp = tauri.app.security.csp;
  if (typeof csp !== 'string' || !csp.trim())
    throw new Error('Missing production CSP in Tauri configuration.');
  // Read the exact production output; never compile, rewrite or fall back to dev assets here.
  await open(resolve(publicRoot, 'index.html'), 'r').then((file) => file.close());
  return createServer(async (request, response) => {
    response.setHeader('Content-Security-Policy', csp);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    const fail = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      fail(405, 'Method not allowed');
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
    } catch {
      fail(400, 'Invalid URL');
      return;
    }
    if (!pathname.startsWith('/') || /[\\\0:]/.test(pathname)) {
      fail(400, 'Invalid path');
      return;
    }
    if (pathname.split('/').some((segment) => segment.startsWith('.'))) {
      fail(403, 'Path not allowed');
      return;
    }
    const candidate = resolve(publicRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!within(publicRoot, candidate)) {
      fail(403, 'Path not allowed');
      return;
    }
    try {
      const actual = await realpath(candidate);
      if (!within(publicRoot, actual)) {
        fail(403, 'Path not allowed');
        return;
      }
      const file = await open(actual, 'r');
      const stat = await file.stat();
      if (!stat.isFile()) {
        await file.close();
        fail(404, 'Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': mime[extname(actual).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': stat.size,
      });
      if (request.method === 'HEAD') {
        await file.close();
        response.end();
        return;
      }
      const stream = file.createReadStream();
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (response.headersSent) response.destroy();
      else fail(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500, 'File unavailable');
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const port =
    args.length === 0
      ? 4300
      : args.length === 2 && args[0] === '--port' && /^\d+$/.test(args[1])
        ? Number(args[1])
        : NaN;
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Use --port with an integer from 1024 to 65535.');
  const server = await createBuildServer();
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () =>
    console.log(`Production build + Tauri CSP: http://127.0.0.1:${port}`),
  );
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}

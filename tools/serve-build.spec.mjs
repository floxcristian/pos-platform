import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { request } from 'node:http';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createBuildServer } from './serve-build.mjs';

describe('production preview boundary', () => {
  let fixture;
  let server;
  let port;
  beforeAll(async () => {
    fixture = await mkdtemp(join(tmpdir(), 'pos-build-preview-'));
    const root = join(fixture, 'public');
    const outside = join(fixture, 'outside');
    await mkdir(root);
    await mkdir(outside);
    await writeFile(join(root, 'index.html'), '<h1>Production build</h1>');
    await writeFile(join(root, 'main.js'), 'window.production = true;');
    await writeFile(join(root, 'styles.css'), 'body { margin: 0 }');
    await writeFile(join(outside, 'private.txt'), 'outside public root');
    await symlink(outside, join(root, 'escaped'), 'junction');
    server = await createBuildServer({ root });
    await new Promise((resolveListen, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolveListen);
    });
    port = server.address().port;
  });
  afterAll(async () => {
    if (server) await new Promise((resolveClose) => server.close(resolveClose));
    if (fixture) {
      if (!resolve(fixture).startsWith(`${resolve(tmpdir())}${sep}`)) throw new Error('Unsafe fixture path');
      await rm(fixture, { recursive: true, force: true });
    }
  });
  const get = (path, method = 'GET') =>
    new Promise((resolveResponse, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path, method }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () =>
          resolveResponse({ status: response.statusCode, headers: response.headers, body }),
        );
      });
      req.on('error', reject);
      req.end();
    });

  it('serves unchanged assets with correct MIME and restrictive production CSP', async () => {
    const html = await get('/');
    expect(html.status).toBe(200);
    expect(html.body).toBe('<h1>Production build</h1>');
    expect(html.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(html.headers['content-security-policy']).toContain("script-src 'self';");
    expect(html.headers['content-security-policy']).not.toContain("'unsafe-eval'");
    expect(html.headers['x-content-type-options']).toBe('nosniff');
    expect((await get('/main.js?version=1')).headers['content-type']).toBe('text/javascript; charset=utf-8');
    expect((await get('/styles.css')).headers['content-type']).toBe('text/css; charset=utf-8');
    const head = await get('/main.js', 'HEAD');
    expect(head.status).toBe(200);
    expect(head.body).toBe('');
    expect(Number(head.headers['content-length'])).toBeGreaterThan(0);
  });

  it.each([
    ['/..%2foutside/private.txt', 403],
    ['/%2e%2e/outside/private.txt', 403],
    ['/escaped/private.txt', 403],
    ['/%5c..%5coutside/private.txt', 400],
    ['/index.html%3Aprivate', 400],
    ['/%00index.html', 400],
    ['/%E0%A4%A', 400],
  ])('rejects unsafe path %s without exposing files', async (path, status) => {
    const response = await get(path);
    expect(response.status).toBe(status);
    expect(response.body).not.toContain('outside public root');
  });

  it('does not hide missing assets behind an SPA fallback or accept writes', async () => {
    expect((await get('/missing.js')).status).toBe(404);
    const response = await get('/index.html', 'POST');
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('GET, HEAD');
  });
});

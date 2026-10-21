import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Install outside the workspace so missing runtime dependencies cannot resolve
// accidentally from the monorepo's node_modules.
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
assert.ok(
  (nodeMajor === 22 && nodeMinor >= 19) || nodeMajor === 24,
  'Verify artifacts using the supported Node.js runtime: 22.19+ (22.x) or 24.x.',
);
const npmCli = process.env.npm_execpath;
const backendProjects = ['branch-api', 'country-api', 'branch-sync-worker', 'erp-worker'];
const args = process.argv.slice(2);
assert.ok(
  args.length === 0 ||
    (args.length === 1 && args[0] === '--all') ||
    args.every((arg) => backendProjects.includes(arg)),
  'Use --all or one or more backend project names.',
);
const projects = args.length === 0 ? ['branch-api'] : args[0] === '--all' ? backendProjects : args;

function run(artifact, args, { capture = false, timeoutMs = 180_000 } = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: artifact,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_PATH: '',
      ...Object.fromEntries(
        ['BRANCH_API', 'COUNTRY_API', 'BRANCH_SYNC_WORKER', 'ERP_WORKER'].flatMap((prefix) => [
          [`${prefix}_SENTRY_ENABLED`, 'false'],
          [`${prefix}_SENTRY_DSN`, ''],
          [`${prefix}_SENTRY_RELEASE`, ''],
        ]),
      ),
    },
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    timeout: timeoutMs,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Standalone API verification failed${capture ? `\n${result.stderr}` : ''}`);
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

for (const project of projects) {
  const artifact = await mkdtemp(join(tmpdir(), `${project}-`));
  try {
    assert.ok(npmCli, 'Run this verification through npm run api:smoke');
    await cp(join(workspace, 'dist/apps', project), artifact, {
      recursive: true,
      filter: (path) => !path.split(sep).includes('node_modules'),
    });
    // Registry access and package extraction can be slower than application startup.
    run(artifact, [npmCli, 'ci', '--omit=dev'], { timeoutMs: 600_000 });
    const prefix = {
      'branch-api': 'BRANCH_API',
      'country-api': 'COUNTRY_API',
      'branch-sync-worker': 'BRANCH_SYNC_WORKER',
      'erp-worker': 'ERP_WORKER',
    }[project];
    // Exercise the actual SDK from the isolated bundle, with an in-memory
    // transport: verification must never contact a configured Sentry service.
    run(
      artifact,
      [
        '--input-type=module',
        '--eval',
        `
      import assert from 'node:assert/strict';
      import application from './application.js';
      const { SentryErrorReporter, loadConfig } = application;
      const envelopes = [];
      const reporter = new SentryErrorReporter(loadConfig({
        NODE_ENV: 'production',
        ${prefix}_SENTRY_ENABLED: 'true',
        ${prefix}_SENTRY_DSN: 'https://public@sentry.example.invalid/1',
      }), () => ({
        send: async (envelope) => { envelopes.push(envelope); return { statusCode: 200 }; },
        flush: async () => true,
      }));
      const error = new Error('sensitive-exception-canary');
      error.stack = 'Error: sensitive-exception-canary\\n    at action (/private/sensitive-owner-canary/application.js:42:7)';
      const context = { phase: 'worker', code: 'WORKER_EXECUTION_FAILED' };
      assert.ok(reporter.captureException(error, context));
      assert.equal(reporter.captureException(error, context), undefined);
      assert.equal(await reporter.close(), true);
      assert.equal(envelopes.length, 1);
      const event = envelopes[0][1][0][1];
      assert.equal(event.tags.service, ${JSON.stringify(project)});
      assert.equal(event.tags.correlationId, event.tags.requestId);
      assert.equal(event.exception.values[0].stacktrace.frames[0].filename, 'application.js');
      assert.equal(event.exception.values[0].stacktrace.frames[0].lineno, 42);
      assert.doesNotMatch(JSON.stringify(envelopes), /sensitive-[\\w-]+-canary/);
    `,
      ],
      { capture: true },
    );
    if (project.endsWith('-worker')) {
      const output = run(artifact, ['main.js', 'check'], { capture: true });
      const rows = output.stdout
        .trim()
        .split(/\r?\n/)
        .map((line) => JSON.parse(line));
      const inspection = rows.find((row) => row.mode === 'scaffold');
      assert.equal(inspection?.service, project);
      assert.equal(inspection?.processingEnabled, false);
      assert.ok(inspection.modules.includes('SyncModule'));
      assert.ok(inspection.modules.includes(project === 'erp-worker' ? 'ErpModule' : 'CatalogModule'));
      assert.ok(rows.some((row) => row.event === 'worker.processing.disabled'));
      console.log(
        `${project}: standalone installation, safe Sentry transport, composition and clean shutdown passed.`,
      );
      continue;
    }
    const output = run(
      artifact,
      [
        '--input-type=module',
        '--eval',
        `
      import assert from 'node:assert/strict';
      import application from './application.js';
      const { createApplication, loadConfig, ReadinessService } = application;
      const app = await createApplication(loadConfig({ NODE_ENV: 'production', ${prefix}_LOG_LEVEL: 'info' }));
      try {
        await app.listen(0, '127.0.0.1');
        const origin = await app.getUrl();
        const ids = [];
        for (const path of ['/health/live', '/health/ready', '/api/v1']) {
          const response = await fetch(origin + path);
          assert.equal(response.status, 200, path);
          if (path === '/api/v1') assert.equal((await response.json()).service, ${JSON.stringify(project)});
          ids.push(response.headers.get('x-request-id'));
          assert.equal(response.headers.get('x-request-id'), response.headers.get('x-correlation-id'));
        }
        const docs = await fetch(origin + '/api/docs');
        assert.equal(docs.status, 404);
        ids.push(docs.headers.get('x-request-id'));
        const response = await fetch(origin + '/health/live?token=sensitive-query-canary', {
          headers: {
            authorization: 'Bearer sensitive-header-canary',
            'x-request-id': 'sensitive-incoming-id-canary',
            'x-correlation-id': 'sensitive-incoming-correlation-canary',
          },
        });
        assert.equal(response.status, 200);
        ids.push(response.headers.get('x-request-id'));
        const unknown = await fetch(origin + '/sensitive-path-canary', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password: 'sensitive-body-canary' }),
        });
        assert.equal(unknown.status, 404);
        ids.push(unknown.headers.get('x-request-id'));
        app.get(ReadinessService).beforeApplicationShutdown();
        const unavailable = await fetch(origin + '/health/ready');
        assert.equal(unavailable.status, 503);
        ids.push(unavailable.headers.get('x-request-id'));
        // A real unexpected failure through a Nest controller, without shipping
        // a synthetic failure endpoint or sending an event to Sentry.
        app.get(ReadinessService).isReady = () => { throw new Error('sensitive-exception-canary'); };
        const failure = await fetch(origin + '/health/ready');
        assert.equal(failure.status, 500);
        const failedRequestId = failure.headers.get('x-request-id');
        ids.push(failedRequestId);
        assert.equal(new Set(ids).size, ids.length);
        console.log(JSON.stringify({ event: 'test.responses', ids, failedRequestId }));
      } finally {
        await app.close();
      }
    `,
      ],
      { capture: true },
    );
    assert.doesNotMatch(`${output.stdout}\n${output.stderr}`, /sensitive-[\w-]+-canary/);
    const rows = output.stdout
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
    const responses = rows.find((row) => row.event === 'test.responses');
    assert.ok(responses);
    const completions = rows.filter((row) => row.event === 'http.request.completed');
    assert.equal(
      completions.length,
      responses.ids.length,
      'Each response must have exactly one completion log',
    );
    assert.deepEqual(new Set(completions.map((row) => row.requestId)), new Set(responses.ids));
    for (const row of completions) {
      assert.match(row.requestId, /^[0-9a-f-]{36}$/);
      assert.equal(row.correlationId, row.requestId);
      assert.equal(row.service, project);
      assert.equal(row.environment, 'production');
      assert.ok(typeof row.durationMs === 'number' && row.durationMs >= 0);
    }
    const failure = rows.find((row) => row.event === 'http.request.failed');
    assert.equal(
      rows.filter((row) => row.event === 'http.request.failed').length,
      1,
      'Expected readiness changes must not produce unexpected-failure logs',
    );
    assert.equal(
      failure?.requestId,
      responses.failedRequestId,
      'Nest logs must share the HTTP request context',
    );
    assert.equal(failure?.correlationId, responses.failedRequestId);
    assert.ok(rows.some((row) => row.event === 'application.initialized' && typeof row.level === 'number'));
    console.log(
      `${project}: standalone installation, safe Sentry transport, HTTP, production configuration and correlated safe logs passed.`,
    );
  } finally {
    assert.equal(dirname(artifact), resolve(tmpdir()));
    try {
      await rm(artifact, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
    } catch (error) {
      // Windows may retain a directory handle after its children are removed.
      // Only an empty, locked root may remain; never hide failed file cleanup.
      if (error.code !== 'EBUSY' || error.path !== artifact || (await readdir(artifact)).length !== 0) {
        throw error;
      }
      console.warn(`The OS still holds this empty temporary directory after cleanup: ${artifact}`);
    }
  }
}

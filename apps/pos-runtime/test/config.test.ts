import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/runtime-config.js';

describe('runtime environment', () => {
  it('should use a local server without CORS when no configuration is provided', () => {
    const config = loadConfig({});

    expect(config).toMatchObject({
      environment: 'development',
      host: '127.0.0.1',
      port: 3000,
      docsEnabled: true,
      corsOrigins: [],
    });
  });

  it('should disable documentation when production defaults or an explicit override require it', () => {
    expect(loadConfig({ NODE_ENV: 'production' }).docsEnabled).toBe(false);
    expect(loadConfig({ POS_API_DOCS_ENABLED: 'false' }).docsEnabled).toBe(false);
  });

  it('should accept explicit listening settings and exact origins', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      POS_API_HOST: '0.0.0.0',
      POS_API_PORT: '3100',
      POS_API_LOG_LEVEL: 'warn',
      POS_API_CORS_ORIGINS: 'http://127.0.0.1:4300, https://pos.example.test/',
    });

    expect(config.port).toBe(3100);
    expect(config.logLevel).toBe('warn');
    expect(config.corsOrigins).toEqual(['http://127.0.0.1:4300', 'https://pos.example.test']);
  });

  it.each(['0', '-1', '65536', '3000.5', '3000abc', 'NaN'])(
    'should reject invalid port %s before binding',
    (port) => expect(() => loadConfig({ POS_API_PORT: port })).toThrow(),
  );

  it.each([
    '*',
    'https://*.example.test',
    'https://example.test/path',
    'https://example.test?token=private-canary',
    'https://user:private-canary@example.test',
    'file:///tmp/example',
  ])('should reject unsafe CORS origin %s', (origins) => {
    expect(() => loadConfig({ POS_API_CORS_ORIGINS: origins })).toThrow();
  });

  it('should reject unsupported modes, flags, log levels and listen addresses', () => {
    expect(() => loadConfig({ NODE_ENV: 'prod' })).toThrow();
    expect(() => loadConfig({ POS_API_DOCS_ENABLED: 'yes' })).toThrow();
    expect(() => loadConfig({ POS_API_LOG_LEVEL: 'verbose' })).toThrow();
    expect(() => loadConfig({ POS_API_HOST: 'http://localhost' })).toThrow();
  });
});

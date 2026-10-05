import { describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE_KEY, DEMO_PASSWORD, LocalAuthSessionRepository } from './auth-session';
import { StorageAdapter } from './persistence';

function memoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('local mock authentication persistence', () => {
  it.each([false, true])('restores a %s remembered identity without storing credentials', (remember) => {
    const session = memoryStorage(),
      local = memoryStorage();
    const repository = new LocalAuthSessionRepository(session, local);
    expect(repository.read()).toEqual({ ok: true, value: null });
    expect(repository.write('user-cashier', remember)).toEqual({
      ok: true,
      value: { userId: 'user-cashier', remember },
    });
    const raw = (remember ? local : session).getItem(AUTH_STORAGE_KEY);
    expect(raw && JSON.parse(raw)).toEqual({ version: 1, userId: 'user-cashier' });
    expect(raw).not.toContain(DEMO_PASSWORD);
    expect((remember ? session : local).getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(new LocalAuthSessionRepository(session, local).read()).toEqual({
      ok: true,
      value: { userId: 'user-cashier', remember },
    });
    expect(new LocalAuthSessionRepository(memoryStorage(), local).read()).toEqual({
      ok: true,
      value: remember ? { userId: 'user-cashier', remember } : null,
    });
  });

  it('removes the other scope when the remember preference changes and clears both on logout', () => {
    const session = memoryStorage(),
      local = memoryStorage();
    const repository = new LocalAuthSessionRepository(session, local);
    repository.write('user-admin', true);
    repository.write('user-cashier', false);
    expect(local.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(repository.read()).toEqual({ ok: true, value: { userId: 'user-cashier', remember: false } });
    repository.write('user-admin', true);
    expect(session.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(repository.clear().ok).toBe(true);
    expect(repository.read()).toEqual({ ok: true, value: null });
  });

  it.each([
    '{',
    'null',
    '{}',
    '{"version":2,"userId":"user-admin"}',
    '{"version":1,"userId":123}',
    '{"version":1,"userId":""}',
  ])('rejects malformed saved sessions (%s)', (raw) => {
    const session = memoryStorage();
    session.setItem(AUTH_STORAGE_KEY, raw);
    expect(new LocalAuthSessionRepository(session, memoryStorage()).read().ok).toBe(false);
  });

  it('returns Result errors for blocked storage and still clears the second scope', () => {
    const local = memoryStorage();
    local.setItem(AUTH_STORAGE_KEY, JSON.stringify({ version: 1, userId: 'user-admin' }));
    const blocked: StorageAdapter = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const repository = new LocalAuthSessionRepository(blocked, local);
    expect(repository.read().ok).toBe(false);
    expect(repository.write('user-cashier', false).ok).toBe(false);
    local.setItem(AUTH_STORAGE_KEY, JSON.stringify({ version: 1, userId: 'user-admin' }));
    const remove = vi.spyOn(local, 'removeItem');
    expect(repository.clear().ok).toBe(false);
    expect(remove).toHaveBeenCalledWith(AUTH_STORAGE_KEY);
    expect(local.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(new LocalAuthSessionRepository(null, null).write('user-admin', false).ok).toBe(false);
  });
});

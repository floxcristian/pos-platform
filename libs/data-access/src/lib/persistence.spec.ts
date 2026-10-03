import { describe, expect, it } from 'vitest';
import { createFixtures } from './fixtures';
import { LocalSnapshotRepository, STORAGE_KEY, StorageAdapter, decodeSnapshot } from './persistence';
describe('versioned mock persistence', () => {
  it('round-trips a typed fixture', () => {
    expect(decodeSnapshot(JSON.stringify(createFixtures())).ok).toBe(true);
  });
  it('round-trips a scheduler audit identity without granting a system login role', () => {
    const fixture = createFixtures();
    fixture.audit[0].role = 'system';
    fixture.audit[0].actor = 'Planificador local';
    expect(decodeSnapshot(JSON.stringify(fixture)).ok).toBe(true);
    const raw = { ...fixture, role: 'system' };
    expect(decodeSnapshot(JSON.stringify(raw)).ok).toBe(false);
  });
  it.each(['not-json', '{}', 'null', '{"schemaVersion":2}'])(
    'rejects malformed or incompatible data: %s',
    (input) => {
      expect(decodeSnapshot(input).ok).toBe(false);
    },
  );
  it('rejects nested corrupt financial values instead of casting JSON', () => {
    const fixture = createFixtures();
    fixture.products[0].price = -1;
    expect(decodeSnapshot(JSON.stringify(fixture)).ok).toBe(false);
    const raw = JSON.parse(JSON.stringify(createFixtures()));
    raw.sales[0].payments[0].amount = '100';
    expect(decodeSnapshot(JSON.stringify(raw)).ok).toBe(false);
  });
  it('uses the versioned key and reports storage failure explicitly', () => {
    const memory = new Map<string, string>();
    const storage: StorageAdapter = {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
    };
    const repository = new LocalSnapshotRepository(storage);
    expect(repository.load()).toEqual({ ok: true, value: null });
    expect(repository.save(createFixtures()).ok).toBe(true);
    expect(memory.has(STORAGE_KEY)).toBe(true);
    expect(repository.load().ok).toBe(true);
    expect(repository.clear().ok).toBe(true);
    expect(memory.size).toBe(0);
    storage.setItem = () => {
      throw new Error('Quota');
    };
    expect(repository.save(createFixtures())).toEqual({
      ok: false,
      error: 'No se pudo guardar: el almacenamiento local está lleno o bloqueado.',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { createFixtures } from './fixtures';
import { LocalSnapshotRepository, STORAGE_KEY, StorageAdapter, decodeSnapshot } from './persistence';
describe('versioned mock persistence', () => {
  it('round-trips a typed fixture', () => {
    expect(decodeSnapshot(JSON.stringify(createFixtures())).ok).toBe(true);
  });
  it('adds the expanded sidebar preference to an earlier v1 snapshot without changing existing data', () => {
    const fixture = createFixtures();
    fixture.settings.companyName = 'Empresa personalizada';
    fixture.settings.theme = 'dark';
    fixture.activeDraft = {
      lines: [{ productId: fixture.products[0].id, quantity: 3, discount: 5 }],
      customerId: fixture.customers[0].id,
      documentType: 'factura',
      metadata: { contact: 'Contacto conservado' },
      updatedAt: new Date().toISOString(),
    };
    const legacy = JSON.parse(JSON.stringify(fixture));
    delete legacy.settings.sidebarCollapsed;

    expect(decodeSnapshot(JSON.stringify(legacy))).toEqual({ ok: true, value: fixture });
  });
  it.each([false, true])('preserves the saved sidebar preference: %s', (collapsed) => {
    const fixture = createFixtures();
    fixture.settings.sidebarCollapsed = collapsed;
    expect(decodeSnapshot(JSON.stringify(fixture))).toEqual({ ok: true, value: fixture });
  });
  it.each([null, 'false', 0, [], {}])('rejects a malformed sidebar preference: %j', (collapsed) => {
    const fixture = createFixtures();
    const raw = { ...fixture, settings: { ...fixture.settings, sidebarCollapsed: collapsed } };
    expect(decodeSnapshot(JSON.stringify(raw)).ok).toBe(false);
  });
  it('loads earlier v1 drafts and credit-note settlements without discarding other operations', () => {
    const fixture = createFixtures();
    const legacy = JSON.parse(JSON.stringify(fixture));
    delete legacy.activeDraft;
    legacy.creditNotes = [
      {
        id: 'legacy-nc',
        number: 'NC-legacy',
        saleId: fixture.sales[2].id,
        amount: 1000,
        reason: 'Devolución demo',
        lineQuantities: {},
        createdAt: new Date().toISOString(),
        fiscalStatus: 'issued',
        refundMethod: 'cuenta',
        refundedAmount: 1000,
        refundedAt: new Date().toISOString(),
        appliedAmount: 0,
      },
    ];
    const loaded = decodeSnapshot(JSON.stringify(legacy));
    expect(loaded.ok && loaded.value.sales).toHaveLength(fixture.sales.length);
    expect(loaded.ok && loaded.value.activeDraft).toBeNull();
    expect(loaded.ok && loaded.value.creditNotes[0]).toMatchObject({
      debtOffsetAmount: 1000,
      refundPaymentAmount: 0,
    });
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

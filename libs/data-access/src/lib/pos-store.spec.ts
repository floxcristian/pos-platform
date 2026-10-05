import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutInput, PosSnapshot, success } from '@corporate-pos/domain';
import { createFixtures } from './fixtures';
import { POS_AUTH_SESSION, POS_REPOSITORY, POS_SIMULATION, SimulationPort } from './ports';
import { AuthSession, AuthSessionRepository, DEMO_PASSWORD } from './auth-session';
import { SnapshotRepository } from './persistence';
import { PosStore } from './pos-store';
const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.splice(0).forEach((destroy) => destroy());
  vi.useRealTimers();
});
const now = new Date('2026-10-03T15:00:00Z');
const saleInput: CheckoutInput = {
  lines: [{ productId: 'prod-1', quantity: 2, discount: 0 }],
  documentType: 'boleta',
  payments: [{ method: 'efectivo', amount: 9980 }],
  idempotencyKey: 'test-checkout',
};
function createStore(
  initial = createFixtures(now),
  wait: (ms: number) => Promise<void> = () => Promise.resolve(),
  options: { authenticate?: boolean; authRepository?: AuthSessionRepository } = {},
): { store: PosStore; repository: SnapshotRepository; authRepository: AuthSessionRepository } {
  let count = 0;
  const repository: SnapshotRepository = {
    load: () => success(structuredClone(initial)),
    save: () => success(undefined),
    clear: () => success(undefined),
  };
  const simulation: SimulationPort = { now: () => now, id: (prefix) => `${prefix}-test-${++count}`, wait };
  let session: AuthSession | null = null;
  const authRepository: AuthSessionRepository = options.authRepository ?? {
    read: () => success(session),
    write: (userId, remember) => {
      session = { userId, remember };
      return success(session);
    },
    clear: () => {
      session = null;
      return success(undefined);
    },
  };
  const injector = Injector.create({
    providers: [
      { provide: POS_REPOSITORY, useValue: repository },
      { provide: POS_SIMULATION, useValue: simulation },
      { provide: POS_AUTH_SESSION, useValue: authRepository },
    ],
  });
  cleanup.push(() => injector.destroy());
  const store = runInInjectionContext(injector, () => new PosStore());
  if (options.authenticate !== false) {
    const user = initial.users.find((item) => item.role === initial.role && item.active);
    if (!user || !store.login(user.email, DEMO_PASSWORD).ok) throw new Error('Cannot sign in test fixture');
  }
  return { store, repository, authRepository };
}
describe('PosStore mock sign-in', () => {
  it('starts logged out even with a persisted admin role, then validates credentials and active users', () => {
    const fixture = createFixtures(now);
    fixture.users.find((user) => user.role === 'auditor')!.active = false;
    const { store } = createStore(fixture, undefined, { authenticate: false });
    expect(store.authenticated()).toBe(false);
    expect(store.currentUser()).toBeUndefined();
    expect(store.can('configure')).toBe(false);
    expect(store.login('missing@example.test', DEMO_PASSWORD).ok).toBe(false);
    expect(store.login('admin@example.test', 'incorrect').ok).toBe(false);
    expect(store.login('auditor@example.test', DEMO_PASSWORD).ok).toBe(false);
    expect(store.authenticated()).toBe(false);
    expect(store.login('  CAJA@EXAMPLE.TEST ', DEMO_PASSWORD).ok).toBe(true);
    expect(store.currentUser()?.id).toBe('user-cashier');
    expect(store.role()).toBe('cashier');
    expect(store.can('sell', 'sales')).toBe(true);
    expect(store.can('configure')).toBe(false);
  });

  it('keeps the selected identity when two users share a role and attributes operations to that user', () => {
    const fixture = createFixtures(now);
    const cashier = fixture.users.find((user) => user.role === 'cashier')!;
    fixture.users.push({
      ...cashier,
      id: 'user-second-cashier',
      name: 'Segunda cajera',
      email: 'segunda@example.test',
    });
    const { store } = createStore(fixture, undefined, { authenticate: false });
    expect(store.login('segunda@example.test', DEMO_PASSWORD).ok).toBe(true);
    expect(store.currentUser()?.id).toBe('user-second-cashier');
    expect(store.switchRole('cashier').ok).toBe(true);
    expect(store.currentUser()?.id).toBe('user-second-cashier');
    expect(store.checkout(saleInput).ok).toBe(true);
    expect(store.snapshot().audit[0]).toMatchObject({ actor: 'Segunda cajera', role: 'cashier' });
    expect(store.snapshot().sales[0].cashier).toBe('Segunda cajera');
  });

  it('restores only the selected active user and retains remember during a demo profile change', () => {
    const { store, authRepository } = createStore();
    expect(store.login('supervisor@example.test', DEMO_PASSWORD, true).ok).toBe(true);
    const { store: restored } = createStore(createFixtures(now), undefined, {
      authenticate: false,
      authRepository,
    });
    expect(restored.currentUser()?.id).toBe('user-supervisor');
    expect(restored.switchRole('cashier').ok).toBe(true);
    expect(authRepository.read()).toEqual({ ok: true, value: { userId: 'user-cashier', remember: true } });
  });

  it.each(['disabled', 'deleted'] as const)('rejects a %s identity during session restoration', (state) => {
    const { store, authRepository } = createStore();
    store.login('caja@example.test', DEMO_PASSWORD, true);
    const fixture = createFixtures(now);
    if (state === 'disabled') fixture.users.find((user) => user.id === 'user-cashier')!.active = false;
    else fixture.users = fixture.users.filter((user) => user.id !== 'user-cashier');
    const { store: restored } = createStore(fixture, undefined, { authenticate: false, authRepository });
    expect(restored.authenticated()).toBe(false);
    expect(restored.can('sell')).toBe(false);
    expect(authRepository.read()).toEqual({ ok: true, value: null });
  });

  it('retains the cash session and sale draft while logout blocks direct mutations and clears saved access', () => {
    const { store, authRepository } = createStore();
    store.saveActiveDraft({ lines: saleInput.lines, customerId: null, documentType: 'boleta', metadata: {} });
    const before = store.snapshot();
    expect(store.logout().ok).toBe(true);
    expect(store.snapshot()).toBe(before);
    expect(store.snapshot().session?.status).toBe('open');
    expect(store.snapshot().activeDraft?.lines).toEqual(saleInput.lines);
    expect(authRepository.read()).toEqual({ ok: true, value: null });
    expect(store.authenticated()).toBe(false);
    expect(store.currentUser()).toBeUndefined();
    expect(store.checkout(saleInput).ok).toBe(false);
    expect(store.moveCash('income', 1000, 'Después de salir').ok).toBe(false);
    expect(store.clearActiveDraft().ok).toBe(false);
    expect(store.switchRole('admin').ok).toBe(false);
    expect(store.setOnline(false).ok).toBe(false);
    expect(store.setSidebarCollapsed(true).ok).toBe(false);
    expect(store.resetDemo().ok).toBe(false);
    expect(store.snapshot()).toBe(before);
    expect(store.setTheme('dark').ok).toBe(true);
    expect(store.snapshot().audit[0]).toMatchObject({ actor: 'Preferencias locales', role: 'system' });
  });

  it('fails login closed on storage errors and always clears the in-memory identity on logout', () => {
    const { store, authRepository } = createStore();
    authRepository.clear = () => ({ ok: false, error: 'Almacenamiento bloqueado' });
    expect(store.logout().ok).toBe(false);
    expect(store.authenticated()).toBe(false);
    expect(store.can('configure')).toBe(false);
    authRepository.write = () => ({ ok: false, error: 'Almacenamiento bloqueado' });
    expect(store.login('admin@example.test', DEMO_PASSWORD).ok).toBe(false);
    expect(store.authenticated()).toBe(false);
  });

  it('does not publish an identity or business audit when persisting a demo role change fails', () => {
    const { store, authRepository } = createStore();
    const before = store.snapshot();
    authRepository.write = () => ({ ok: false, error: 'Almacenamiento bloqueado' });
    expect(store.switchRole('cashier').ok).toBe(false);
    expect(store.currentUser()?.id).toBe('user-admin');
    expect(store.role()).toBe('admin');
    expect(store.snapshot()).toBe(before);
  });

  it('uses live account permissions and invalidates a user who becomes inactive', () => {
    const fixture = createFixtures(now);
    const admin = fixture.users.find((user) => user.role === 'admin')!;
    fixture.users.push({ ...admin, id: 'backup-admin', email: 'backup@example.test' });
    const { store } = createStore(fixture);
    expect(store.saveUser({ ...admin, role: 'cashier' }).ok).toBe(true);
    expect(store.currentUser()?.id).toBe(admin.id);
    expect(store.role()).toBe('cashier');
    expect(store.can('configure')).toBe(false);
    expect(store.login('backup@example.test', DEMO_PASSWORD).ok).toBe(true);
    const backup = store.currentUser()!;
    expect(store.saveUser({ ...admin, role: 'admin' }).ok).toBe(true);
    expect(store.saveUser({ ...backup, active: false }).ok).toBe(true);
    expect(store.authenticated()).toBe(false);
    expect(store.can('configure')).toBe(false);
  });

  it('rejects a demo role without an active account and preserves the current identity', () => {
    const fixture = createFixtures(now);
    fixture.users.find((user) => user.role === 'auditor')!.active = false;
    const { store } = createStore(fixture);
    expect(store.switchRole('auditor').ok).toBe(false);
    expect(store.currentUser()?.id).toBe('user-admin');
  });

  it('allows an already authorized sync to finish with its original actor after logout', async () => {
    let release: () => void = () => undefined,
      first = true;
    const { store } = createStore(createFixtures(now), () => {
      if (!first) return Promise.resolve();
      first = false;
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    });
    const actor = store.currentUser()?.name;
    const pending = store.runSync('sync-products');
    store.logout();
    release();
    expect((await pending).ok).toBe(true);
    expect(store.snapshot().audit[0]).toMatchObject({ actor, role: 'admin', action: 'sync.completed' });
    expect((await store.runSync('sync-products')).ok).toBe(false);
  });
});

describe('PosStore command policy and event coordination', () => {
  it.each(['admin', 'supervisor', 'cashier', 'auditor'] as const)(
    'persists the sidebar preference for the %s profile',
    (role) => {
      const fixture = createFixtures(now);
      fixture.role = role;
      const { store, repository } = createStore(fixture);
      const save = vi.spyOn(repository, 'save');

      expect(store.setSidebarCollapsed(true).ok).toBe(true);
      expect(store.snapshot().settings.sidebarCollapsed).toBe(true);
      expect(save).toHaveBeenLastCalledWith(store.snapshot());
      expect(store.snapshot().audit[0]).toMatchObject({
        action: 'preference.sidebar.changed',
        entity: 'settings',
        role,
      });
      const { store: restored } = createStore(structuredClone(store.snapshot()));
      expect(restored.snapshot().settings.sidebarCollapsed).toBe(true);
      expect(store.setSidebarCollapsed(false).ok).toBe(true);
      expect(store.snapshot().settings.sidebarCollapsed).toBe(false);
    },
  );
  it('keeps the sidebar preference unchanged when its durable save fails', () => {
    const { store, repository } = createStore();
    const before = store.snapshot();
    repository.save = () => ({ ok: false, error: 'Disco lleno' });

    expect(store.setSidebarCollapsed(true)).toEqual({ ok: false, error: 'Disco lleno' });
    expect(store.snapshot()).toBe(before);
    expect(store.persistenceError()).toBe('Disco lleno');
  });
  it('rejects malformed sidebar preferences through both preference and settings commands', () => {
    const { store, repository } = createStore();
    const before = store.snapshot();
    const save = vi.spyOn(repository, 'save');
    const invalid = 'false' as unknown as boolean;

    expect(store.setSidebarCollapsed(invalid).ok).toBe(false);
    expect(store.updateSettings({ sidebarCollapsed: invalid }).ok).toBe(false);
    expect(store.snapshot()).toBe(before);
    expect(save).not.toHaveBeenCalled();
  });
  it('restores a persisted safe draft and clears it atomically with checkout', () => {
    const { store, repository } = createStore();
    const input = {
      lines: saleInput.lines,
      customerId: null,
      documentType: 'boleta' as const,
      metadata: { contact: 'Contacto Demo', deliveryMode: 'pickup' as const },
    };
    expect(store.saveActiveDraft(input).ok).toBe(true);
    const { store: restored } = createStore(structuredClone(store.snapshot()));
    expect(restored.snapshot().activeDraft?.metadata.contact).toBe('Contacto Demo');
    repository.save = () => ({ ok: false, error: 'Disco lleno' });
    expect(store.checkout(saleInput).ok).toBe(false);
    expect(store.snapshot().activeDraft?.lines).toEqual(saleInput.lines);
    repository.save = () => success(undefined);
    expect(store.checkout(saleInput).ok).toBe(true);
    expect(store.snapshot().activeDraft).toBeNull();
  });
  it('pausing and resuming transfer the active draft in the same durable mutation', () => {
    const { store } = createStore();
    store.saveActiveDraft({
      lines: saleInput.lines,
      customerId: null,
      documentType: 'boleta',
      metadata: { contact: 'Demo' },
    });
    const held = store.holdSale(saleInput.lines, null, 'boleta', 'Pausa', { contact: 'Demo' });
    if (!held.ok) throw new Error(held.error);
    expect(store.snapshot().activeDraft).toBeNull();
    expect(store.resumeSale(held.value.id).ok).toBe(true);
    expect(store.snapshot().activeDraft?.metadata.contact).toBe('Demo');
    expect(store.snapshot().heldSales.some((item) => item.id === held.value.id)).toBe(false);
    store.setModule('sales', false);
    expect(store.clearActiveDraft().ok).toBe(false);
  });
  it('never persists payment credentials or unknown fields from a draft input', () => {
    const { store } = createStore();
    const input = {
      lines: [{ ...saleInput.lines[0], cardNumber: 'SECRET-CARD' }],
      customerId: null,
      documentType: 'boleta' as const,
      metadata: { coupon: 'DEMO', voucher: 'SECRET-VOUCHER' },
      payments: [{ method: 'debito', token: 'SECRET-TOKEN' }],
    };
    expect(store.saveActiveDraft(input).ok).toBe(true);
    expect(JSON.stringify(store.snapshot().activeDraft)).not.toContain('SECRET');
  });
  it('the next clock tick recovers a persisted running state after storage returns', async () => {
    vi.useFakeTimers();
    let release: () => void = () => undefined;
    const { store, repository } = createStore(
      createFixtures(now),
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const pending = store.runSync('sync-products');
    repository.save = () => ({ ok: false, error: 'Disco lleno' });
    release();
    expect((await pending).ok).toBe(false);
    expect(store.snapshot().syncJobs[0].status).toBe('running');
    repository.save = () => success(undefined);
    await vi.advanceTimersByTimeAsync(20000);
    expect(store.snapshot().syncJobs[0].status).toBe('failed');
    expect(store.persistenceError()).toBeNull();
  });
  it.each(['sync', 'outbox'] as const)(
    'recovers %s from a transient persistence failure without a reload',
    async (kind) => {
      let release: () => void = () => undefined,
        first = true;
      const { store, repository } = createStore(createFixtures(now), () => {
        if (!first) return Promise.resolve();
        first = false;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      });
      const eventId = store.snapshot().outbox[0].id;
      const run = kind === 'sync' ? store.runSync('sync-products') : store.retryOutbox(eventId);
      repository.save = () => ({ ok: false, error: 'Disco lleno' });
      release();
      expect((await run).ok).toBe(false);
      repository.save = () => success(undefined);
      const retried =
        kind === 'sync' ? await store.runSync('sync-products') : await store.retryOutbox(eventId);
      expect(retried.ok).toBe(true);
      expect(store.snapshot().syncRuns.some((item) => item.status === 'running')).toBe(false);
      expect(store.snapshot().outbox.some((item) => item.status === 'processing')).toBe(false);
      expect(
        store
          .snapshot()
          .audit.some(
            (entry) =>
              entry.action ===
              (kind === 'sync' ? 'sync.persistence.recovered' : 'outbox.persistence.recovered'),
          ),
      ).toBe(true);
    },
  );
  it('a failed reset does not invalidate an authorized in-flight job', async () => {
    let release: () => void = () => undefined,
      first = true;
    const { store, repository } = createStore(createFixtures(now), () => {
      if (!first) return Promise.resolve();
      first = false;
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    });
    const pending = store.runSync('sync-products');
    repository.save = () => ({ ok: false, error: 'Disco lleno' });
    expect(store.resetDemo().ok).toBe(false);
    repository.save = () => success(undefined);
    release();
    expect((await pending).ok).toBe(true);
  });
  it('separates the fiscal total from rounding only the cash portion', () => {
    const { store } = createStore();
    store.setPrice('prod-1', 1005);
    const result = store.checkout({
      ...saleInput,
      lines: [{ productId: 'prod-1', quantity: 1, discount: 0 }],
      payments: [
        { method: 'debito', amount: 500 },
        { method: 'efectivo', amount: 500 },
      ],
    });
    expect(result.ok && result.value).toMatchObject({ total: 1005, paidTotal: 1000, roundingAdjustment: -5 });
    if (result.ok) expect(result.value.net + result.value.tax).toBe(1005);
  });
  it('converts change into an advance in one atomic checkout, and fails closed if disabled', () => {
    const { store } = createStore(),
      cash = store.snapshot().session?.expectedAmount ?? 0;
    const input: CheckoutInput = {
      ...saleInput,
      customerId: 'cust-1',
      cashTendered: 10000,
      changeDisposition: 'advance',
    };
    store.setModule('collections', false);
    expect(store.checkout(input).ok).toBe(false);
    expect(store.snapshot().session?.expectedAmount).toBe(cash);
    store.setModule('collections', true);
    const result = store.checkout(input);
    expect(result.ok && result.value.change).toBe(20);
    expect(store.snapshot().session?.expectedAmount).toBe(cash + 10000);
    expect(store.snapshot().collections[0]).toMatchObject({ kind: 'advance', amount: 20, appliedAmount: 0 });
    expect(result.ok && result.value.changeAdvanceId).toBe(store.snapshot().collections[0].id);
    expect(store.checkout(input).ok).toBe(true);
    expect(store.snapshot().session?.expectedAmount).toBe(cash + 10000);
  });
  it('keeps imported order prices after catalog and client rules change', () => {
    const { store } = createStore(),
      order = store.snapshot().salesOrders[0];
    const before = store.quote(order.lines, order.customerId, order.number);
    store.setPrice(order.lines[0].productId, 10000);
    store.savePriceRule({
      id: '',
      name: 'Nuevo convenio',
      productId: order.lines[0].productId,
      customerId: order.customerId,
      minQuantity: 1,
      unitPrice: 8000,
      enabled: true,
    });
    const after = store.quote(order.lines, order.customerId, order.number);
    expect(before.ok && before.value.total).toBe(after.ok && after.value.total);
  });
  it('respects assigned credit installments instead of allowing a cashier to invent terms', () => {
    const { store } = createStore();
    const result = store.checkout({
      ...saleInput,
      customerId: 'cust-2',
      payments: [{ method: 'cuenta', amount: 9980 }],
    });
    if (!result.ok) throw new Error(result.error);
    const plan = store.snapshot().agreements.find((item) => item.customerId === 'cust-2');
    expect(plan?.installments).toHaveLength(2);
    expect(plan?.installments.map((item) => item.amount)).toEqual([4990, 4990]);
    expect(plan?.installments[0].dueAt).toBe('2026-11-02');
  });
  it('blocks commands for a read-only profile even when invoked directly', () => {
    const { store } = createStore();
    store.switchRole('auditor');
    expect(store.checkout(saleInput).ok).toBe(false);
    expect(store.moveCash('income', 1000, 'Direct command').ok).toBe(false);
    expect(store.setModule('sales', false).ok).toBe(false);
  });
  it('a disabled feature also rejects a direct command', () => {
    const { store } = createStore();
    store.setModule('sales', false);
    expect(store.checkout(saleInput).ok).toBe(false);
    expect(store.holdSale(saleInput.lines, null, 'boleta', 'Venta').ok).toBe(false);
  });
  it('does not publish a new snapshot when durable save fails', () => {
    const { store, repository } = createStore();
    const before = store.snapshot();
    repository.save = () => ({ ok: false, error: 'Disco lleno' });
    expect(store.checkout(saleInput)).toEqual({ ok: false, error: 'Disco lleno' });
    expect(store.snapshot()).toBe(before);
    expect(store.persistenceError()).toBe('Disco lleno');
  });
  it('preserves held delivery metadata and consumes the hold once', () => {
    const { store } = createStore();
    const result = store.holdSale(saleInput.lines, null, 'boleta', 'Entrega', {
      deliveryMode: 'delivery',
      deliveryAddress: 'Demo 123',
      orderReference: 'OV-TEST',
    });
    if (!result.ok) throw new Error(result.error);
    const resumed = store.resumeSale(result.value.id);
    expect(resumed.ok && resumed.value.metadata.orderReference).toBe('OV-TEST');
    expect(store.resumeSale(result.value.id).ok).toBe(false);
  });
  it('keeps partial counting separate from closing and requires a discrepancy reason', () => {
    const { store } = createStore();
    const expected = store.snapshot().session?.expectedAmount ?? 0;
    expect(store.closeSession(expected + 1, { kind: 'complete' }).ok).toBe(false);
    expect(store.closeSession(expected, { kind: 'partial' }).ok).toBe(true);
    expect(store.snapshot().session?.status).toBe('open');
    expect(store.closeSession(expected, { kind: 'complete' }).ok).toBe(true);
    expect(store.snapshot().session?.status).toBe('closed');
  });
  it('reconciles uncertain cards without making another payment or issuing early', async () => {
    const { store } = createStore();
    const sale = store.checkout({
      ...saleInput,
      payments: [{ method: 'debito', amount: 9980 }],
      paymentScenario: 'unknown',
    });
    if (!sale.ok) throw new Error(sale.error);
    const fiscal = store
      .snapshot()
      .outbox.find((event) => event.aggregateId === sale.value.id && event.target === 'fiscal');
    if (!fiscal) throw new Error('Missing event');
    expect((await store.retryOutbox(fiscal.id)).ok).toBe(false);
    expect(store.resolvePayment(sale.value.id, 'confirmed').ok).toBe(true);
    expect(store.snapshot().sales.find((item) => item.id === sale.value.id)?.payments).toHaveLength(1);
    expect((await store.retryOutbox(fiscal.id)).ok).toBe(true);
    expect(store.snapshot().sales.find((item) => item.id === sale.value.id)).toMatchObject({
      fiscalStatus: 'issued',
      erpStatus: 'pending',
    });
  });
  it('dispatches each ERP job only for its own event family', async () => {
    const { store } = createStore();
    const sale = store.checkout(saleInput);
    store.collect('debt-1', 1000, 'efectivo');
    const collections = store
      .snapshot()
      .outbox.filter((event) => event.type === 'collection.created')
      .map((event) => event.id);
    expect((await store.runSync('sync-sales')).ok).toBe(true);
    expect(
      store
        .snapshot()
        .outbox.filter((event) => collections.includes(event.id))
        .every((event) => event.status === 'pending'),
    ).toBe(true);
    expect(sale.ok && store.snapshot().sales.find((item) => item.id === sale.value.id)?.erpStatus).toBe(
      'synced',
    );
    expect((await store.runSync('sync-collections')).ok).toBe(true);
    expect(
      store
        .snapshot()
        .outbox.filter((event) => collections.includes(event.id))
        .every((event) => event.status === 'sent'),
    ).toBe(true);
  });
  it('a failed retry preserves identity and delivers exactly once after recovery', async () => {
    const { store } = createStore();
    const event = store.snapshot().outbox[0];
    store.setIntegration('int-erp', false);
    expect((await store.retryOutbox(event.id)).ok).toBe(false);
    expect(store.snapshot().outbox.find((item) => item.id === event.id)).toMatchObject({
      status: 'failed',
      attempts: 1,
    });
    store.setIntegration('int-erp', true);
    expect((await store.retryOutbox(event.id)).ok).toBe(true);
    const attempts = store.snapshot().outbox.find((item) => item.id === event.id)?.attempts;
    expect((await store.retryOutbox(event.id)).ok).toBe(true);
    expect(store.snapshot().outbox.find((item) => item.id === event.id)?.attempts).toBe(attempts);
    expect(store.snapshot().outbox.filter((item) => item.id === event.id)).toHaveLength(1);
  });
  it('prevents overlap and a reset invalidates an in-flight result', async () => {
    let release: () => void = () => undefined;
    const { store } = createStore(
      createFixtures(now),
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const running = store.runSync('sync-products');
    expect((await store.runSync('sync-products')).ok).toBe(false);
    store.resetDemo();
    release();
    expect((await running).ok).toBe(false);
    expect(store.snapshot().syncRuns).toHaveLength(0);
  });
  it('recovers interrupted runs as retryable failures after reload', () => {
    const state: PosSnapshot = createFixtures(now);
    state.syncJobs[0].status = 'running';
    state.outbox[0].status = 'processing';
    const { store } = createStore(state);
    expect(store.snapshot().syncJobs[0].status).toBe('failed');
    expect(store.snapshot().outbox[0].status).toBe('failed');
  });
  it.each(['device', 'integration'] as const)('a reset invalidates an in-flight %s test', async (kind) => {
    let release: () => void = () => undefined;
    const { store } = createStore(
      createFixtures(now),
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const pending =
      kind === 'device'
        ? store.testDevice(store.snapshot().devices[0].id)
        : store.testIntegration(store.snapshot().integrations[0].id);
    expect(store.resetDemo().ok).toBe(true);
    const reset = store.snapshot();
    release();
    expect((await pending).ok).toBe(false);
    expect(store.snapshot()).toBe(reset);
  });
  it.each(['sync', 'outbox'] as const)(
    'preserves the initiating actor when the profile changes during %s',
    async (kind) => {
      let release: () => void = () => undefined,
        first = true;
      const { store } = createStore(createFixtures(now), () => {
        if (!first) return Promise.resolve();
        first = false;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      });
      const actor = store.currentUser()?.name;
      const pending =
        kind === 'sync' ? store.runSync('sync-products') : store.retryOutbox(store.snapshot().outbox[0].id);
      store.switchRole('auditor');
      release();
      expect((await pending).ok).toBe(true);
      expect(store.snapshot().audit[0]).toMatchObject({
        actor,
        role: 'admin',
        action: kind === 'sync' ? 'sync.completed' : 'outbox.delivered',
      });
    },
  );
  it('attributes scheduled work to the local scheduler instead of the viewing profile', async () => {
    vi.useFakeTimers();
    const state = createFixtures(now);
    state.syncJobs.forEach((job) => {
      job.schedule.enabled = false;
    });
    state.syncJobs[0].schedule.enabled = true;
    state.syncJobs[0].nextRun = new Date(now.getTime() - 1000).toISOString();
    const { store } = createStore(state);
    store.switchRole('auditor');
    await vi.advanceTimersByTimeAsync(20000);
    const entries = store
      .snapshot()
      .audit.filter((entry) => ['sync.started', 'sync.completed'].includes(entry.action));
    expect(entries).toHaveLength(2);
    expect(entries.every((entry) => entry.actor === 'Planificador local' && entry.role === 'system')).toBe(
      true,
    );
  });
  it('pays a structured locked order once and rejects altered quantities', () => {
    const { store } = createStore(),
      order = store.snapshot().salesOrders[0];
    const quote = store.quote(order.lines);
    if (!quote.ok) throw new Error(quote.error);
    const input: CheckoutInput = {
      ...saleInput,
      lines: order.lines,
      customerId: order.customerId,
      payments: [{ method: 'efectivo', amount: quote.value.cashTotal }],
      metadata: { orderReference: order.number },
    };
    expect(store.checkout({ ...input, lines: [{ ...order.lines[0], quantity: 1 }] }).ok).toBe(false);
    expect(store.checkout(input).ok).toBe(true);
    expect(store.loadSalesOrder(order.id).ok).toBe(false);
    expect(store.checkout({ ...input, idempotencyKey: 'second-order-payment' }).ok).toBe(false);
  });
  it('an agreement divides existing debt without creating another receivable', () => {
    const { store } = createStore(),
      debt = store.snapshot().receivables[0],
      count = store.snapshot().receivables.length;
    const agreement = store.createAgreement({
      customerId: debt.customerId,
      receivableIds: [debt.id],
      installments: 3,
      periodDays: 30,
      startDate: now.toISOString(),
    });
    if (!agreement.ok) throw new Error(agreement.error);
    expect(agreement.value.installments.reduce((sum, item) => sum + item.amount, 0)).toBe(debt.balance);
    expect(store.snapshot().receivables).toHaveLength(count);
    const first = agreement.value.installments[0];
    expect(store.collectInstallment(agreement.value.id, first.id, first.amount, 'efectivo').ok).toBe(true);
    expect(store.snapshot().agreements[0].installments[0].balance).toBe(0);
    expect(store.snapshot().receivables.find((item) => item.id === debt.id)?.balance).toBe(
      debt.balance - first.amount,
    );
    expect(
      store.createAgreement({
        customerId: debt.customerId,
        receivableIds: [debt.id],
        installments: 2,
        periodDays: 30,
        startDate: now.toISOString(),
      }).ok,
    ).toBe(false);
  });
  it('custody deposit confirms the existing withdrawal without reducing cash twice', () => {
    const { store } = createStore(),
      movement = store.moveCash('custody', 10000, 'Depósito bancario demo');
    if (!movement.ok) throw new Error(movement.error);
    const cash = store.snapshot().session?.expectedAmount;
    expect(
      store.confirmCustodyDeposit(movement.value.id, {
        bankId: 'bank-1',
        reference: 'DEMO-123',
        date: now.toISOString(),
      }).ok,
    ).toBe(true);
    expect(store.snapshot().session?.expectedAmount).toBe(cash);
    expect(
      store.confirmCustodyDeposit(movement.value.id, {
        bankId: 'bank-1',
        reference: 'DEMO-123',
        date: now.toISOString(),
      }).ok,
    ).toBe(false);
  });
  it('handover releases the register for the next session', () => {
    const { store } = createStore(),
      expected = store.snapshot().session?.expectedAmount ?? 0;
    expect(store.closeSession(expected, { kind: 'handover' }).ok).toBe(true);
    expect(store.snapshot().session?.status).toBe('closed');
    store.switchRole('cashier');
    expect(store.openSession(50000).ok).toBe(true);
    expect(store.snapshot().session?.cashier).toBe('Daniela Rojas');
  });
  it('applies an advance once for the same customer without receiving cash twice', () => {
    const { store } = createStore();
    const advance = store.advance('cust-1', 10000, 'efectivo');
    if (!advance.ok) throw new Error(advance.error);
    const cash = store.snapshot().session?.expectedAmount;
    const input: CheckoutInput = {
      ...saleInput,
      customerId: 'cust-1',
      payments: [{ method: 'anticipo', amount: 9980, reference: advance.value.id }],
    };
    expect(store.checkout({ ...input, customerId: 'cust-2' }).ok).toBe(false);
    expect(store.checkout(input).ok).toBe(true);
    expect(store.snapshot().collections.find((item) => item.id === advance.value.id)?.appliedAmount).toBe(
      9980,
    );
    expect(store.snapshot().session?.expectedAmount).toBe(cash);
    expect(store.checkout({ ...input, idempotencyKey: 'advance-again' }).ok).toBe(false);
  });
  it('a credit-note offset also reduces the installment plan attached to that debt', async () => {
    const { store } = createStore();
    const sale = store.checkout({
      ...saleInput,
      customerId: 'cust-1',
      payments: [{ method: 'cuenta', amount: 9980 }],
    });
    if (!sale.ok) throw new Error(sale.error);
    await store.retryFiscal(sale.value.id);
    const debt = store.snapshot().receivables.find((item) => item.document === sale.value.number);
    if (!debt) throw new Error('Missing debt');
    const agreement = store.createAgreement({
      customerId: 'cust-1',
      receivableIds: [debt.id],
      installments: 2,
      periodDays: 30,
      startDate: '2026-10-03',
    });
    if (!agreement.ok) throw new Error(agreement.error);
    const note = store.issueCreditNote({
      saleId: sale.value.id,
      quantities: { 'prod-1': 1 },
      reason: 'Producto defectuoso',
      refundMethod: 'cuenta',
    });
    if (!note.ok) throw new Error(note.error);
    expect(store.refundCreditNote(note.value.id, 'cuenta').ok).toBe(false);
    const fiscalEvent = store
      .snapshot()
      .outbox.find((event) => event.aggregateId === note.value.id && event.target === 'fiscal');
    if (!fiscalEvent) throw new Error('Missing fiscal event');
    expect((await store.retryOutbox(fiscalEvent.id)).ok).toBe(true);
    expect(store.refundCreditNote(note.value.id, 'cuenta').ok).toBe(true);
    expect(store.snapshot().agreements[0].installments.map((item) => item.balance)).toEqual([0, 4990]);
    expect(store.snapshot().receivables.find((item) => item.id === debt.id)?.balance).toBe(4990);
  });
});

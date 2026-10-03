import { describe, expect, it } from 'vitest';
import { CheckoutInput } from '@corporate-pos/domain';
import { createFixtures } from './fixtures';
import {
  TransactionContext,
  checkoutTransaction,
  collectTransaction,
  issueCreditNoteTransaction,
  refundCreditNoteTransaction,
} from './transactions';
const now = new Date('2026-10-03T15:00:00Z');
function context(): TransactionContext {
  let count = 0;
  return { now: now.toISOString(), actor: 'Test Demo', id: (prefix) => `${prefix}-${++count}` };
}
const input: CheckoutInput = {
  lines: [{ productId: 'prod-1', quantity: 2, discount: 0 }],
  documentType: 'boleta',
  payments: [{ method: 'efectivo', amount: 9980 }],
  idempotencyKey: 'request-test',
};
describe('transaction boundaries', () => {
  it('records local sale, payment, tax and ERP states independently', () => {
    const state = createFixtures(now),
      result = checkoutTransaction(state, input, context());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      total: 9980,
      paymentStatus: 'confirmed',
      fiscalStatus: 'pending',
      erpStatus: 'pending',
    });
    expect(state.outbox.filter((event) => event.aggregateId === result.value.id)).toHaveLength(2);
  });
  it('deduplicates the same idempotency key and rejects changed inputs', () => {
    const state = createFixtures(now),
      ctx = context();
    checkoutTransaction(state, input, ctx);
    const count = state.sales.length,
      cash = state.session?.expectedAmount,
      events = state.outbox.length;
    expect(checkoutTransaction(state, input, ctx).ok).toBe(true);
    expect(state.sales).toHaveLength(count);
    expect(state.outbox).toHaveLength(events);
    expect(state.session?.expectedAmount).toBe(cash);
    expect(
      checkoutTransaction(state, { ...input, payments: [{ method: 'debito', amount: 9980 }] }, ctx).ok,
    ).toBe(false);
  });
  it('does not create a sale for rejected or underpaid payments', () => {
    const state = createFixtures(now),
      count = state.sales.length;
    expect(
      checkoutTransaction(
        state,
        { ...input, payments: [{ method: 'debito', amount: 9980 }], paymentScenario: 'failed' },
        context(),
      ).ok,
    ).toBe(false);
    expect(
      checkoutTransaction(state, { ...input, payments: [{ method: 'efectivo', amount: 9979 }] }, context())
        .ok,
    ).toBe(false);
    expect(state.sales).toHaveLength(count);
  });
  it('keeps an uncertain card result for explicit reconciliation', () => {
    const state = createFixtures(now),
      result = checkoutTransaction(
        state,
        { ...input, payments: [{ method: 'debito', amount: 9980 }], paymentScenario: 'unknown' },
        context(),
      );
    expect(result.ok && result.value.paymentStatus).toBe('unknown');
    expect(result.ok && result.value.fiscalStatus).toBe('pending');
  });
  it('allows only policy-authorized cash offline and never emits fiscal documents', () => {
    const state = createFixtures(now);
    state.online = false;
    const result = checkoutTransaction(state, input, context());
    expect(result.ok && result.value.fiscalStatus).toBe('pending');
    expect(
      checkoutTransaction(
        state,
        { ...input, idempotencyKey: 'other', payments: [{ method: 'debito', amount: 9980 }] },
        context(),
      ).ok,
    ).toBe(false);
    const module = state.modules.find((item) => item.id === 'offlineSales');
    if (module) module.enabled = false;
    expect(checkoutTransaction(state, { ...input, idempotencyKey: 'third' }, context()).ok).toBe(false);
  });
  it('enforces feature flags and discounts at the command boundary', () => {
    const state = createFixtures(now);
    const module = state.modules.find((item) => item.id === 'cashPayment');
    if (module) module.enabled = false;
    expect(checkoutTransaction(state, input, context()).ok).toBe(false);
    expect(
      checkoutTransaction(
        state,
        { ...input, lines: [{ productId: 'prod-1', quantity: 2, discount: 21 }] },
        context(),
      ).ok,
    ).toBe(false);
  });
  it('does not treat a credit note as an immediate refund', () => {
    const state = createFixtures(now),
      original = state.sales.find((sale) => sale.fiscalStatus === 'issued');
    if (!original) throw new Error('Fixture missing');
    const ctx = context(),
      expected = state.session?.expectedAmount;
    const note = issueCreditNoteTransaction(
      state,
      {
        saleId: original.id,
        reason: 'Producto defectuoso',
        quantities: { [original.lines[0].productId]: 1 },
        refundMethod: 'efectivo',
      },
      ctx,
    );
    expect(note.ok && note.value.refundedAmount).toBe(0);
    expect(state.session?.expectedAmount).toBe(expected);
    if (!note.ok) return;
    note.value.fiscalStatus = 'issued';
    const refund = refundCreditNoteTransaction(state, note.value.id, 'efectivo', ctx);
    expect(refund.ok && refund.value.refundedAmount).toBe(note.value.amount);
    expect(refundCreditNoteTransaction(state, note.value.id, 'efectivo', ctx).ok).toBe(false);
  });
  it.each(['pending', 'failed'] as const)(
    'blocks a %s credit note refund without changing cash or balances',
    (status) => {
      const state = createFixtures(now),
        original = state.sales[2],
        ctx = context();
      const note = issueCreditNoteTransaction(
        state,
        {
          saleId: original.id,
          reason: 'Producto defectuoso',
          quantities: { [original.lines[0].productId]: 1 },
          refundMethod: 'efectivo',
        },
        ctx,
      );
      if (!note.ok) throw new Error(note.error);
      note.value.fiscalStatus = status;
      const before = structuredClone(state);
      expect(refundCreditNoteTransaction(state, note.value.id, 'efectivo', ctx).ok).toBe(false);
      expect(state).toEqual(before);
    },
  );
  it('never returns more units or rounds more money than the original line', () => {
    const state = createFixtures(now),
      original = state.sales[2];
    original.lines = [
      {
        productId: 'prod-1',
        quantity: 3,
        discount: 33.3,
        name: 'Demo',
        sku: 'DEMO',
        unitPrice: 100,
        total: 200,
      },
    ];
    original.fiscalStatus = 'issued';
    const ctx = context();
    for (let count = 0; count < 3; count++)
      issueCreditNoteTransaction(
        state,
        {
          saleId: original.id,
          reason: 'Producto defectuoso',
          quantities: { 'prod-1': 1 },
          refundMethod: 'efectivo',
        },
        ctx,
      );
    expect(state.creditNotes.reduce((sum, note) => sum + note.amount, 0)).toBe(200);
    expect(original.status).toBe('returned');
    expect(
      issueCreditNoteTransaction(
        state,
        {
          saleId: original.id,
          reason: 'Producto defectuoso',
          quantities: { 'prod-1': 4 },
          refundMethod: 'efectivo',
        },
        ctx,
      ).ok,
    ).toBe(false);
  });
  it('records collection ownership and protects debt against overpayment', () => {
    const state = createFixtures(now),
      debt = state.receivables[0];
    expect(
      collectTransaction(state, context(), debt.customerId, debt.id, debt.balance + 1, 'efectivo').ok,
    ).toBe(false);
    const result = collectTransaction(state, context(), debt.customerId, debt.id, debt.balance, 'efectivo');
    expect(result.ok && result.value.branchId).toBe('branch-1');
    expect(debt.balance).toBe(0);
    expect(debt.status).toBe('paid');
  });
  it('requires valid cheque details and an available Orsan adapter', () => {
    const state = createFixtures(now),
      payment = {
        method: 'cheque' as const,
        amount: 9980,
        reference: 'CHEQUE-DEMO',
        details: {
          bankId: 'bank-1',
          plazaId: 'plaza-1',
          chequeNumber: '100001',
          accountNumber: 'DEMO-ACCOUNT',
          dueAt: now.toISOString(),
          issuerName: 'Emisor Demo',
          issuerRut: '90000000-6',
          holderName: 'Portador Demo',
          holderRut: '90000000-6',
        },
      };
    expect(
      checkoutTransaction(
        state,
        { ...input, payments: [{ ...payment, details: { ...payment.details, bankId: 'missing' } }] },
        context(),
      ).ok,
    ).toBe(false);
    const orsan = state.integrations.find((item) => item.kind === 'cheques');
    if (orsan) orsan.enabled = false;
    expect(checkoutTransaction(state, { ...input, payments: [payment] }, context()).ok).toBe(false);
    if (orsan) orsan.enabled = true;
    expect(checkoutTransaction(state, { ...input, payments: [payment] }, context()).ok).toBe(true);
  });
  it('validates the original USD amount and exchange rate without inventing cash CLP', () => {
    const state = createFixtures(now),
      cash = state.session?.expectedAmount;
    expect(
      checkoutTransaction(
        state,
        {
          ...input,
          payments: [{ method: 'usd', amount: 9980, details: { currencyAmount: 99.8, exchangeRate: 100 } }],
        },
        context(),
      ).ok,
    ).toBe(true);
    expect(state.session?.expectedAmount).toBe(cash);
    expect(
      checkoutTransaction(
        state,
        {
          ...input,
          idempotencyKey: 'usd-bad',
          payments: [{ method: 'usd', amount: 9980, details: { currencyAmount: 100, exchangeRate: 100 } }],
        },
        context(),
      ).ok,
    ).toBe(false);
  });
  it('a credit note can be partially applied and only its remaining balance refunded', () => {
    const state = createFixtures(now),
      original = state.sales[2],
      ctx = context();
    const note = issueCreditNoteTransaction(
      state,
      {
        saleId: original.id,
        reason: 'Producto defectuoso',
        quantities: { [original.lines[0].productId]: 1 },
        refundMethod: 'efectivo',
      },
      ctx,
    );
    if (!note.ok) throw new Error(note.error);
    note.value.fiscalStatus = 'issued';
    expect(
      checkoutTransaction(
        state,
        {
          ...input,
          customerId: original.customerId,
          payments: [{ method: 'nota_credito', amount: 9980, reference: note.value.id }],
        },
        ctx,
      ).ok,
    ).toBe(true);
    expect(note.value.appliedAmount).toBe(9980);
    const refunded = refundCreditNoteTransaction(state, note.value.id, 'efectivo', ctx);
    expect(refunded.ok && refunded.value.refundedAmount).toBe(note.value.amount - 9980);
    expect(
      checkoutTransaction(
        state,
        {
          ...input,
          idempotencyKey: 'nc-again',
          customerId: original.customerId,
          payments: [{ method: 'nota_credito', amount: 9980, reference: note.value.id }],
        },
        ctx,
      ).ok,
    ).toBe(false);
  });
});

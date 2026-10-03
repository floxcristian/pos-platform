import { Collection, CreditNote, CreditNoteRefundQuote, Receivable, Sale } from './models';

/** Settle unpaid principal first. Returned money cannot exceed value actually funded by the customer. */
export function calculateCreditNoteRefund(
  sale: Sale,
  note: CreditNote,
  notes: readonly CreditNote[],
  debt: Receivable | undefined,
  collections: readonly Collection[],
): CreditNoteRefundQuote {
  const settlementAmount = note.amount - note.refundedAmount - note.appliedAmount;
  const debtOffsetAmount = Math.min(settlementAmount, debt?.balance ?? 0);
  const relatedNotes = notes.filter((item) => item.saleId === sale.id);
  const settledBefore = relatedNotes.reduce((sum, item) => sum + item.refundedAmount + item.appliedAmount, 0);
  const originalFunding = sale.payments
    .filter((payment) => payment.method !== 'cuenta' && payment.status === 'confirmed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const collectedDebt = debt
    ? collections
        .filter((collection) => collection.receivableId === debt.id)
        .reduce((sum, collection) => sum + collection.amount, 0)
    : 0;
  const consumedFunding = relatedNotes.reduce(
    (sum, item) => sum + item.refundPaymentAmount + item.appliedAmount,
    0,
  );
  const availableFunding = Math.max(0, originalFunding + collectedDebt - consumedFunding);
  const allocatedRounding =
    Math.round(((settledBefore + settlementAmount) * sale.roundingAdjustment) / sale.total) -
    Math.round((settledBefore * sale.roundingAdjustment) / sale.total);
  const refundPaymentAmount = Math.min(
    availableFunding,
    Math.max(0, settlementAmount - debtOffsetAmount + allocatedRounding),
  );
  return {
    settlementAmount,
    debtOffsetAmount,
    refundPaymentAmount,
    roundingAdjustment: debtOffsetAmount + refundPaymentAmount - settlementAmount,
  };
}

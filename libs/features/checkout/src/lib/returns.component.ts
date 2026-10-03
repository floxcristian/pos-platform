import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import { PaymentMethod, PAYMENT_LABELS } from '@corporate-pos/domain';
import {
  PageHeaderComponent,
  StatusTagComponent,
  MetricCardComponent,
  money,
  dateTime,
  downloadCsv,
} from '@corporate-pos/ui';

@Component({
  selector: 'pos-returns',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DialogModule,
    DrawerModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    MetricCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pos-page-header
      title="Devoluciones y notas de crédito"
      eyebrow="Postventa"
      subtitle="Emite la nota de crédito y gestiona la devolución de dinero como operaciones distintas."
      ><p-button
        label="Nueva nota de crédito"
        ariaLabel="Nueva nota de crédito"
        icon="pi pi-plus"
        (onClick)="createVisible.set(true)"
        [disabled]="!store.can('refund', 'returns')"
    /></pos-page-header>
    @if (error()) {
      <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
    }
    @if (feedback()) {
      <p-message severity="success" class="block mb-4">{{ feedback() }}</p-message>
    }
    <div class="grid gap-4 sm:grid-cols-3 mb-6">
      <pos-metric-card
        title="Notas de crédito"
        [value]="store.snapshot().creditNotes.length"
        icon="note-pencil"
      /><pos-metric-card
        title="Monto acreditado"
        [value]="money(totalCredited())"
        icon="arrow-counter-clockwise"
      /><pos-metric-card
        title="Saldo por devolver"
        [value]="money(pendingRefund())"
        detail="Emitir la NC no devuelve dinero automáticamente"
        icon="wallet"
      />
    </div>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden">
      <div class="flex flex-wrap gap-3 items-center justify-between p-5 border-b border-surface">
        <h2 class="text-lg font-semibold">Notas de crédito emitidas</h2>
        <input
          pInputText
          placeholder="Buscar por NC, venta o motivo…"
          aria-label="Buscar nota de crédito"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        />
      </div>
      <div class="overflow-x-auto">
        <table class="pos-table w-full text-sm">
          <thead class="text-left bg-surface-50 dark:bg-surface-900 text-muted-color">
            <tr>
              <th class="p-4 font-medium">Nota de crédito</th>
              <th class="p-4 font-medium">Documento original</th>
              <th class="p-4 font-medium">Fiscal</th>
              <th class="p-4 font-medium text-right">Monto</th>
              <th class="p-4 font-medium text-right">Devuelto</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody>
            @for (note of filtered(); track note.id) {
              <tr class="border-t border-surface">
                <td class="p-4">
                  <button
                    class="text-primary font-semibold hover:underline"
                    (click)="selectedNoteId.set(note.id)"
                  >
                    {{ note.number }}
                  </button>
                  <p class="text-xs text-muted-color mt-1">{{ dateTime(note.createdAt) }}</p>
                </td>
                <td class="p-4">
                  <p>{{ saleNumber(note.saleId) }}</p>
                  <p class="text-xs text-muted-color mt-1">{{ note.reason }}</p>
                </td>
                <td class="p-4"><pos-status-tag [value]="note.fiscalStatus" /></td>
                <td class="p-4 text-right font-semibold">{{ money(note.amount) }}</td>
                <td class="p-4 text-right">{{ money(note.refundedAmount) }}</td>
                <td class="p-3 text-right">
                  <p-button
                    label="Ver detalle"
                    ariaLabel="Ver detalle"
                    size="small"
                    severity="secondary"
                    (onClick)="selectedNoteId.set(note.id)"
                  />
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-12 text-center text-muted-color">
                  No hay notas de crédito que coincidan. Crea una a partir de una venta registrada.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <p-dialog
      header="Emitir nota de crédito"
      [visible]="createVisible()"
      (visibleChange)="createVisible.set($event)"
      [modal]="true"
      [style]="{ width: '52rem' }"
      [breakpoints]="{ '900px': '95vw' }"
    >
      @if (error()) {
        <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
      }
      <label class="block mb-5" for="checkout-returns-1"
        ><span class="block font-semibold mb-2">Documento original</span
        ><p-select
          inputId="checkout-returns-1"
          class="w-full"
          [options]="salesOptions()"
          optionLabel="label"
          optionValue="id"
          [filter]="true"
          placeholder="Buscar folio o cliente"
          [ngModel]="selectedSaleId()"
          (ngModelChange)="selectSale($event)"
          ariaLabel="Documento original de la devolución"
      /></label>
      @if (sale(); as original) {
        <div class="rounded-xl bg-surface-50 dark:bg-surface-900 p-4 mb-5">
          <div class="flex flex-wrap justify-between gap-3">
            <div>
              <p class="font-semibold">{{ original.customerName }}</p>
              <p class="text-sm text-muted-color">
                {{ original.number }} · {{ dateTime(original.createdAt) }}
              </p>
            </div>
            <strong>{{ money(original.total) }}</strong>
          </div>
        </div>
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-semibold">Productos a devolver</h3>
          <p-button
            label="Seleccionar todo lo disponible"
            ariaLabel="Seleccionar todo lo disponible"
            size="small"
            [text]="true"
            (onClick)="selectAll()"
          />
        </div>
        <div class="overflow-x-auto mb-5">
          <table class="pos-table pos-table--flush w-full text-sm">
            <thead class="bg-surface-50 dark:bg-surface-900 text-left">
              <tr>
                <th class="p-3 font-medium">Producto</th>
                <th class="p-3 font-medium text-right">Disponible</th>
                <th class="p-3 font-medium">Devolver</th>
                <th class="p-3 font-medium text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              @for (line of original.lines; track line.productId) {
                <tr class="border-t border-surface">
                  <td class="p-3">
                    {{ line.name }}<small class="block text-muted-color">{{ line.sku }}</small>
                  </td>
                  <td class="p-3 text-right">{{ available(line.productId) }}</td>
                  <td class="p-3">
                    <p-inputnumber
                      [ngModel]="quantities()[line.productId] ?? 0"
                      (ngModelChange)="setQuantity(line.productId, $event)"
                      [min]="0"
                      [max]="available(line.productId)"
                      [inputStyle]="{ width: '5rem' }"
                      [ariaLabel]="'Unidades a devolver de ' + line.name"
                    />
                  </td>
                  <td class="p-3 text-right">{{ money(lineReturnTotal(line.productId)) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <div class="grid gap-4 sm:grid-cols-2">
        <label for="checkout-returns-2"
          ><span class="block font-semibold mb-2">Motivo</span
          ><p-select
            inputId="checkout-returns-2"
            class="w-full"
            [options]="reasons()"
            optionLabel="name"
            optionValue="name"
            placeholder="Selecciona un motivo"
            [ngModel]="reason()"
            (ngModelChange)="reason.set($event)"
            ariaLabel="Motivo de devolución" /></label
        ><label for="checkout-returns-3"
          ><span class="block font-semibold mb-2">Detalle adicional</span
          ><input
            id="checkout-returns-3"
            pInputText
            class="w-full"
            [ngModel]="reasonDetail()"
            (ngModelChange)="reasonDetail.set($event)"
            placeholder="Observación para auditoría"
        /></label>
      </div>
      <div class="border-t border-surface mt-6 pt-5 flex justify-between text-xl font-semibold">
        <span>Total a acreditar</span><span>{{ money(returnTotal()) }}</span>
      </div>
      <p class="text-sm text-muted-color mt-3">
        Se emite una NC simulada y se conserva el vínculo con la venta. La devolución de dinero se gestiona
        después desde su detalle.
      </p>
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="createVisible.set(false)" /><p-button
          label="Emitir nota de crédito"
          ariaLabel="Emitir nota de crédito"
          icon="pi pi-check"
          (onClick)="issue()"
          [disabled]="!returnTotal() || !reason()"
      /></ng-template>
    </p-dialog>
    <p-drawer
      header="Detalle de nota de crédito"
      [visible]="!!selectedNote()"
      (visibleChange)="!$event && selectedNoteId.set(null)"
      position="right"
      styleClass="!w-full sm:!w-[36rem]"
    >
      @if (selectedNote(); as note) {
        <h2 class="text-2xl font-semibold">{{ note.number }}</h2>
        <p class="text-muted-color mt-2 mb-5">
          {{ saleNumber(note.saleId) }} · {{ dateTime(note.createdAt) }}
        </p>
        @if (error()) {
          <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
        }
        <div class="rounded-xl bg-surface-50 dark:bg-surface-900 p-5">
          <dl class="space-y-4">
            <div class="flex justify-between">
              <dt>Emisión fiscal</dt>
              <dd><pos-status-tag [value]="note.fiscalStatus" /></dd>
            </div>
            <div class="flex justify-between">
              <dt>Monto de NC</dt>
              <dd class="font-semibold">{{ money(note.amount) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Deuda compensada</dt>
              <dd class="font-semibold">{{ money(note.debtOffsetAmount) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Dinero devuelto</dt>
              <dd class="font-semibold">{{ money(note.refundPaymentAmount) }}</dd>
            </div>
            @if (note.debtOffsetAmount + note.refundPaymentAmount - note.refundedAmount; as rounding) {
              <div class="flex justify-between">
                <dt>Ajuste por redondeo original</dt>
                <dd>{{ money(rounding) }}</dd>
              </div>
            }
            <div class="flex justify-between">
              <dt>Saldo de NC liquidado</dt>
              <dd class="font-semibold">{{ money(note.refundedAmount) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Aplicado en otras ventas</dt>
              <dd class="font-semibold">{{ money(note.appliedAmount) }}</dd>
            </div>
            <div class="flex justify-between border-t border-surface pt-4">
              <dt>Saldo disponible</dt>
              <dd class="font-semibold">
                {{ money(note.amount - note.refundedAmount - note.appliedAmount) }}
              </dd>
            </div>
          </dl>
        </div>
        <h3 class="font-semibold mt-6 mb-2">Motivo registrado</h3>
        <p class="text-muted-color">{{ note.reason }}</p>
        <h3 class="font-semibold mt-6 mb-3">Productos acreditados</h3>
        <div class="space-y-2">
          @for (line of noteLines(); track line.id) {
            <div class="flex justify-between border-b border-surface pb-2 text-sm">
              <span>{{ line.name }}</span
              ><strong>{{ line.quantity }} unidades</strong>
            </div>
          }
        </div>
        @if (note.refundedAt) {
          <p-message severity="success" class="block mt-5"
            >Liquidación registrada el {{ dateTime(note.refundedAt) }}.
            @if (note.refundPaymentAmount) {
              {{ money(note.refundPaymentAmount) }} devueltos por {{ paymentLabels[note.refundMethod] }}.
            }
            @if (note.debtOffsetAmount) {
              {{ money(note.debtOffsetAmount) }} descontados de la deuda del cliente.
            }
          </p-message>
        }
        <div class="flex flex-wrap gap-3 mt-6">
          <p-button
            label="Descargar comprobante"
            ariaLabel="Descargar comprobante"
            icon="pi pi-download"
            severity="secondary"
            (onClick)="exportNote()"
          />
          @if (note.fiscalStatus !== 'issued') {
            <p-button
              label="Emitir documento fiscal"
              ariaLabel="Emitir documento fiscal"
              icon="pi pi-file-check"
              severity="secondary"
              [loading]="issuingFiscal()"
              (onClick)="emitFiscal()"
              [disabled]="!store.can('sync', 'sync')"
            />
          }
          <p-button
            label="Devolver dinero"
            ariaLabel="Devolver dinero"
            icon="pi pi-wallet"
            (onClick)="refundVisible.set(true)"
            [disabled]="
              note.fiscalStatus !== 'issued' ||
              note.refundedAmount + note.appliedAmount >= note.amount ||
              !store.can('refund', 'returns')
            "
          />
        </div>
      }
    </p-drawer>
    <p-dialog
      header="Devolver saldo de nota de crédito"
      [visible]="refundVisible()"
      (visibleChange)="refundVisible.set($event)"
      [modal]="true"
      [style]="{ width: '32rem' }"
      [breakpoints]="{ '640px': '95vw' }"
      ><p class="text-muted-color mb-3">
        Primero se descuenta la deuda pendiente de esta venta. Solo el resto se devuelve por el medio elegido,
        hasta el importe efectivamente pagado.
      </p>
      <p class="text-3xl font-semibold mb-5">
        {{
          money(
            (selectedNote()?.amount ?? 0) -
              (selectedNote()?.refundedAmount ?? 0) -
              (selectedNote()?.appliedAmount ?? 0)
          )
        }}
      </p>
      <label for="checkout-returns-4"
        ><span class="block font-semibold mb-2">Medio de devolución</span
        ><p-select
          inputId="checkout-returns-4"
          class="w-full"
          [options]="refundMethods"
          optionLabel="label"
          optionValue="value"
          [ngModel]="refundMethod()"
          (ngModelChange)="refundMethod.set($event)"
          ariaLabel="Medio de devolución de dinero"
      /></label>
      @if (refundQuote(); as quote) {
        @if (quote.ok) {
          <dl class="space-y-3 mt-5 rounded-xl bg-surface-50 dark:bg-surface-900 p-4">
            <div class="flex justify-between gap-4">
              <dt>Deuda a compensar</dt>
              <dd class="font-semibold">{{ money(quote.value.debtOffsetAmount) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt>Dinero a devolver</dt>
              <dd class="font-semibold">{{ money(quote.value.refundPaymentAmount) }}</dd>
            </div>
            @if (quote.value.roundingAdjustment) {
              <div class="flex justify-between gap-4">
                <dt>Ajuste por redondeo original</dt>
                <dd>{{ money(quote.value.roundingAdjustment) }}</dd>
              </div>
            }
          </dl>
        } @else {
          <p-message severity="error" class="block mt-4">{{ quote.error }}</p-message>
        }
      }
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="refundVisible.set(false)" /><p-button
          label="Confirmar devolución"
          ariaLabel="Confirmar devolución"
          [disabled]="!refundQuote()?.ok"
          (onClick)="refund()" /></ng-template
    ></p-dialog>
  `,
})
export class ReturnsComponent {
  readonly store = inject(PosStore);
  readonly money = money;
  readonly dateTime = dateTime;
  readonly Math = Math;
  readonly paymentLabels = PAYMENT_LABELS;
  readonly error = signal('');
  readonly feedback = signal('');
  readonly search = signal('');
  readonly createVisible = signal(false);
  readonly refundVisible = signal(false);
  readonly issuingFiscal = signal(false);
  readonly selectedSaleId = signal<string | null>(null);
  readonly sale = computed(() =>
    this.store.snapshot().sales.find((item) => item.id === this.selectedSaleId()),
  );
  readonly selectedNoteId = signal<string | null>(null);
  readonly selectedNote = computed(() =>
    this.store.snapshot().creditNotes.find((item) => item.id === this.selectedNoteId()),
  );
  readonly quantities = signal<Partial<Record<string, number>>>({});
  readonly reason = signal('');
  readonly reasonDetail = signal('');
  readonly refundMethod = signal<PaymentMethod>('efectivo');
  readonly refundQuote = computed(() => {
    const id = this.selectedNoteId();
    return id && this.refundVisible() ? this.store.quoteCreditNoteRefund(id, this.refundMethod()) : null;
  });
  readonly reasons = computed(() =>
    this.store.snapshot().referenceCatalogs.returnReason.filter((item) => item.active),
  );
  readonly refundMethods = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'transferencia' },
    { label: 'Tarjeta de débito', value: 'debito' },
    { label: 'Tarjeta de crédito', value: 'credito' },
    { label: 'Compensar deuda de esta venta', value: 'cuenta' },
  ];
  readonly salesOptions = computed(() =>
    this.store
      .snapshot()
      .sales.filter(
        (item) =>
          item.status !== 'returned' && item.paymentStatus === 'confirmed' && item.fiscalStatus === 'issued',
      )
      .map((item) => ({
        id: item.id,
        label: `${item.number} · ${item.customerName} · ${money(item.total)}`,
      })),
  );
  readonly totalCredited = computed(() =>
    this.store.snapshot().creditNotes.reduce((sum, item) => sum + item.amount, 0),
  );
  readonly pendingRefund = computed(() =>
    this.store
      .snapshot()
      .creditNotes.reduce((sum, item) => sum + item.amount - item.refundedAmount - item.appliedAmount, 0),
  );
  readonly returnTotal = computed(
    () => this.sale()?.lines.reduce((sum, line) => sum + this.lineReturnTotal(line.productId), 0) ?? 0,
  );
  readonly filtered = computed(() =>
    this.store
      .snapshot()
      .creditNotes.filter((item) =>
        `${item.number} ${this.saleNumber(item.saleId)} ${item.reason}`
          .toLowerCase()
          .includes(this.search().toLowerCase()),
      )
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  readonly noteLines = computed(() => {
    const note = this.selectedNote();
    if (!note) return [];
    const sale = this.store.snapshot().sales.find((item) => item.id === note.saleId);
    return Object.entries(note.lineQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({
        id,
        quantity,
        name: sale?.lines.find((line) => line.productId === id)?.name ?? id,
      }));
  });
  saleNumber(id: string): string {
    return this.store.snapshot().sales.find((item) => item.id === id)?.number ?? id;
  }
  selectSale(id: string): void {
    this.selectedSaleId.set(id);
    this.quantities.set({});
    this.error.set('');
  }
  available(productId: string): number {
    const line = this.sale()?.lines.find((item) => item.productId === productId);
    const credited = this.store
      .snapshot()
      .creditNotes.filter((item) => item.saleId === this.selectedSaleId())
      .reduce((sum, item) => sum + (item.lineQuantities[productId] ?? 0), 0);
    return Math.max(0, (line?.quantity ?? 0) - credited);
  }
  lineReturnTotal(productId: string): number {
    const line = this.sale()?.lines.find((item) => item.productId === productId);
    if (!line) return 0;
    const previous = line.quantity - this.available(productId);
    return (
      Math.round((line.total * (previous + (this.quantities()[productId] ?? 0))) / line.quantity) -
      Math.round((line.total * previous) / line.quantity)
    );
  }
  setQuantity(id: string, quantity: number | null): void {
    this.quantities.update((items) => ({ ...items, [id]: quantity ?? 0 }));
  }
  selectAll(): void {
    this.quantities.set(
      Object.fromEntries(
        this.sale()?.lines.map((item) => [item.productId, this.available(item.productId)]) ?? [],
      ),
    );
  }
  issue(): void {
    const id = this.selectedSaleId();
    if (!id) return;
    const result = this.store.issueCreditNote({
      saleId: id,
      reason: [this.reason(), this.reasonDetail()].filter(Boolean).join(' · '),
      quantities: Object.fromEntries(
        Object.entries(this.quantities()).map(([id, quantity]) => [id, quantity ?? 0]),
      ),
      refundMethod: this.refundMethod(),
    });
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.error.set('');
    this.createVisible.set(false);
    this.selectedNoteId.set(result.value.id);
    this.feedback.set(
      `NC ${result.value.number} registrada. La emisión fiscal y la devolución tienen estados independientes.`,
    );
    this.quantities.set({});
    this.selectedSaleId.set(null);
    this.reason.set('');
    this.reasonDetail.set('');
  }
  refund(): void {
    const id = this.selectedNoteId();
    if (!id) return;
    const result = this.store.refundCreditNote(id, this.refundMethod());
    if (!result.ok) {
      this.error.set(result.error);
      this.refundVisible.set(false);
      return;
    }
    this.error.set('');
    this.refundVisible.set(false);
    this.feedback.set(`Devolución registrada para ${result.value.number}.`);
  }
  async emitFiscal(): Promise<void> {
    const note = this.selectedNote();
    if (!note) return;
    const event = this.store
      .snapshot()
      .outbox.find((item) => item.aggregateId === note.id && item.target === 'fiscal');
    if (!event) {
      this.error.set('No existe un envío fiscal pendiente para esta NC.');
      return;
    }
    this.issuingFiscal.set(true);
    this.error.set('');
    try {
      const result = await this.store.retryOutbox(event.id);
      if (!result.ok) this.error.set(result.error);
      else this.feedback.set('La emisión fiscal simulada de la NC fue confirmada.');
    } finally {
      this.issuingFiscal.set(false);
    }
  }
  exportNote(): void {
    const note = this.selectedNote();
    if (!note) return;
    downloadCsv(`${note.number}.csv`, [
      ['Nota de crédito', note.number],
      ['Documento original', this.saleNumber(note.saleId)],
      ['Fecha', note.createdAt],
      ['Motivo', note.reason],
      ['Monto', note.amount],
      ['Saldo NC liquidado', note.refundedAmount],
      ['Deuda compensada', note.debtOffsetAmount],
      ['Dinero devuelto', note.refundPaymentAmount],
      [
        'Ajuste por redondeo original',
        note.debtOffsetAmount + note.refundPaymentAmount - note.refundedAmount,
      ],
      ['Medio', PAYMENT_LABELS[note.refundMethod]],
      [],
      ['Producto', 'Cantidad'],
      ...this.noteLines().map((item) => [item.name, item.quantity]),
    ]);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import {
  Agreement,
  Collection,
  Installment,
  PaymentMethod,
  PAYMENT_LABELS,
  Receivable,
  chileCivilDate,
} from '@corporate-pos/domain';
import {
  CivilDateTimeComponent,
  DuotoneIconComponent,
  PageHeaderComponent,
  StatusTagComponent,
  MetricCardComponent,
  money,
  date,
  dateTime,
  downloadCsv,
} from '@corporate-pos/ui';

@Component({
  selector: 'pos-collections',
  standalone: true,
  imports: [
    CivilDateTimeComponent,
    DuotoneIconComponent,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DialogModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    MetricCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pos-page-header
      title="Cobranzas y anticipos"
      eyebrow="Cuenta del cliente"
      subtitle="Consulta la deuda, registra un abono y conserva cada aplicación de pago."
    >
      <p-button
        label="Exportar cartola"
        ariaLabel="Exportar cartola"
        icon="pi pi-download"
        severity="secondary"
        (onClick)="export()"
        [disabled]="!customerId()"
      /><p-button
        label="Plan de cuotas"
        ariaLabel="Plan de cuotas"
        icon="pi pi-calendar"
        severity="secondary"
        (onClick)="beginAgreement()"
        [disabled]="!customerId() || !store.can('collect', 'collections')"
      /><p-button
        label="Nuevo anticipo"
        ariaLabel="Nuevo anticipo"
        icon="pi pi-plus"
        (onClick)="beginAdvance()"
        [disabled]="!customerId() || !store.can('collect', 'collections')"
      />
    </pos-page-header>
    @if (error()) {
      <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
    }
    @if (feedback()) {
      <p-message severity="success" class="block mb-4">{{ feedback() }}</p-message>
    }
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 p-5 mb-5">
      <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_2fr] items-center">
        <label for="checkout-collections-1"
          ><span class="block font-semibold mb-2">Buscar cliente por RUT o nombre</span
          ><p-select
            inputId="checkout-collections-1"
            class="w-full"
            [options]="store.snapshot().customers"
            optionLabel="name"
            optionValue="id"
            [filter]="true"
            filterBy="name,rut"
            placeholder="Selecciona un cliente"
            [ngModel]="customerId()"
            (ngModelChange)="customerId.set($event)"
            ariaLabel="Cliente para consultar deuda"
        /></label>
        @if (customer(); as client) {
          <div class="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <span class="text-muted-color block">RUT</span><strong>{{ client.rut }}</strong>
            </div>
            <div>
              <span class="text-muted-color block">Correo</span><span>{{ client.email }}</span>
            </div>
            <div>
              <span class="text-muted-color block">Última actualización</span
              ><span>{{ dateTime(client.updatedAt) }}</span>
            </div>
          </div>
        }
      </div>
    </section>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
      <pos-metric-card
        title="Deuda pendiente"
        [value]="money(totalDebt())"
        [detail]="receivables().length + ' documentos'"
        icon="file-text"
      /><pos-metric-card
        title="Deuda vencida"
        [value]="money(overdue())"
        detail="Según vencimiento de documento"
        icon="calendar-x"
      /><pos-metric-card
        title="Cupo disponible"
        [value]="money((customer()?.creditLimit ?? 0) - (customer()?.creditUsed ?? 0))"
        detail="Sujeto a autorización de crédito"
        icon="credit-card"
      /><pos-metric-card
        title="Anticipos disponibles"
        [value]="money(advances())"
        detail="Saldo aplicable en una venta u orden"
        icon="wallet"
      />
    </div>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden mb-6">
      <div class="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-surface">
        <h2 class="font-semibold text-lg">Documentos por cobrar</h2>
        <input
          pInputText
          placeholder="Filtrar por folio…"
          aria-label="Filtrar deuda por folio"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        />
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-muted-color bg-surface-50 dark:bg-surface-900">
            <tr>
              <th class="p-4 font-medium">Documento</th>
              <th class="p-4 font-medium">Vencimiento</th>
              <th class="p-4 font-medium">Estado</th>
              <th class="p-4 font-medium text-right">Original</th>
              <th class="p-4 font-medium text-right">Saldo</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody>
            @for (debt of visibleReceivables(); track debt.id) {
              <tr class="border-t border-surface">
                <td class="p-4 font-medium">
                  {{ debt.document
                  }}<small class="block text-xs text-muted-color font-normal mt-1"
                    >Emitido {{ date(debt.issuedAt) }}</small
                  >
                </td>
                <td class="p-4">{{ date(debt.dueAt) }}</td>
                <td class="p-4">
                  <pos-status-tag
                    [value]="debt.status === 'overdue' ? 'warning' : debt.status"
                    [label]="
                      debt.status === 'overdue' ? 'Vencido' : debt.status === 'partial' ? 'Pago parcial' : ''
                    "
                  />
                </td>
                <td class="p-4 text-right">{{ money(debt.amount) }}</td>
                <td class="p-4 text-right font-semibold">{{ money(debt.balance) }}</td>
                <td class="p-3 text-right">
                  <p-button
                    label="Abonar"
                    ariaLabel="Abonar"
                    icon="pi pi-wallet"
                    size="small"
                    severity="secondary"
                    (onClick)="beginCollection(debt)"
                    [disabled]="debt.balance <= 0 || !store.can('collect', 'collections')"
                  />
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-12 text-center text-muted-color">
                  {{
                    customerId()
                      ? 'No hay documentos con ese folio.'
                      : 'Selecciona un cliente para consultar su cuenta.'
                  }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden">
      <h2 class="p-5 font-semibold text-lg border-b border-surface">Pagos y anticipos registrados</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-muted-color bg-surface-50 dark:bg-surface-900">
            <tr>
              <th class="p-4 font-medium">Comprobante</th>
              <th class="p-4 font-medium">Fecha</th>
              <th class="p-4 font-medium">Concepto</th>
              <th class="p-4 font-medium">Medio de pago</th>
              <th class="p-4 font-medium text-right">Monto</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody>
            @for (collection of collections(); track collection.id) {
              <tr class="border-t border-surface">
                <td class="p-4 font-medium">{{ collection.reference }}</td>
                <td class="p-4">{{ dateTime(collection.createdAt) }}</td>
                <td class="p-4">
                  {{ collection.kind === 'advance' ? 'Anticipo' : documentName(collection.receivableId) }}
                </td>
                <td class="p-4">{{ paymentLabels[collection.method] }}</td>
                <td class="p-4 text-right font-semibold">
                  {{ money(collection.amount) }}
                  @if (collection.kind === 'advance') {
                    <p class="text-xs text-muted-color font-normal mt-1">
                      Disponible {{ money(collection.amount - collection.appliedAmount) }}
                    </p>
                  }
                </td>
                <td class="p-3">
                  <p-button
                    icon="pi pi-file"
                    severity="secondary"
                    [text]="true"
                    ariaLabel="Ver comprobante de abono"
                    (onClick)="showReceipt(collection)"
                  />
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-10 text-center text-muted-color">
                  Aún no hay pagos registrados para este cliente.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 p-5 mt-6">
      <h2 class="font-semibold text-lg mb-4">Acuerdos y cuotas</h2>
      <div class="space-y-5">
        @for (agreement of agreements(); track agreement.id) {
          <div class="rounded-xl border border-surface overflow-hidden">
            <div class="p-4 bg-surface-50 dark:bg-surface-900 flex justify-between gap-3">
              <div>
                <h3 class="font-semibold">Plan de {{ agreement.installments.length }} cuotas</h3>
                <p class="text-xs text-muted-color mt-1">
                  {{ agreement.receivableIds.length }} documentos · {{ date(agreement.createdAt) }}
                </p>
              </div>
              <pos-status-tag [value]="agreement.status" />
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-left text-muted-color">
                  <tr>
                    <th class="p-3 font-medium">Cuota</th>
                    <th class="p-3 font-medium">Vencimiento</th>
                    <th class="p-3 font-medium text-right">Original</th>
                    <th class="p-3 font-medium text-right">Saldo</th>
                    <th class="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (installment of agreement.installments; track installment.id) {
                    <tr class="border-t border-surface">
                      <td class="p-3">{{ installment.number }} / {{ agreement.installments.length }}</td>
                      <td class="p-3">{{ date(installment.dueAt) }}</td>
                      <td class="p-3 text-right">{{ money(installment.amount) }}</td>
                      <td class="p-3 text-right font-semibold">{{ money(installment.balance) }}</td>
                      <td class="p-2 text-right">
                        <p-button
                          label="Pagar cuota"
                          ariaLabel="Pagar cuota"
                          size="small"
                          [text]="true"
                          [disabled]="installment.balance <= 0 || !store.can('collect', 'collections')"
                          (onClick)="beginInstallment(agreement, installment)"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @empty {
          <p class="text-muted-color text-sm">
            Este cliente no tiene acuerdos. Puedes crear un plan sobre documentos pendientes, sin duplicar la
            deuda.
          </p>
        }
      </div>
    </section>
    <p-dialog
      header="Crear plan de cuotas"
      [visible]="agreementVisible()"
      (visibleChange)="agreementVisible.set($event)"
      [modal]="true"
      [style]="{ width: '40rem' }"
      [breakpoints]="{ '700px': '95vw' }"
    >
      @if (error()) {
        <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
      }
      <p class="text-muted-color text-sm mb-4">
        Selecciona la deuda que formará parte del acuerdo. Los pagos de cuotas se aplican a los documentos
        originales.
      </p>
      <div class="space-y-2 mb-5">
        @for (debt of eligibleDebts(); track debt.id) {
          <label
            class="flex items-center gap-3 rounded-lg border border-surface p-3"
            [attr.for]="'agreement-debt-' + debt.id"
            ><input
              type="checkbox"
              [id]="'agreement-debt-' + debt.id"
              [checked]="agreementDebtIds().includes(debt.id)"
              (change)="toggleAgreementDebt(debt.id)"
            /><span class="flex-1 text-sm">{{ debt.document }}</span
            ><strong class="text-sm">{{ money(debt.balance) }}</strong></label
          >
        } @empty {
          <p class="text-sm text-muted-color">No hay deuda disponible fuera de un acuerdo activo.</p>
        }
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <label for="agreement-count"
          ><span class="block font-semibold mb-2">Cuotas</span
          ><p-inputnumber
            inputId="agreement-count"
            [ngModel]="agreementCount()"
            (ngModelChange)="agreementCount.set($event ?? 1)"
            [min]="1"
            [max]="24"
            [inputStyle]="{ width: '100%' }"
            styleClass="w-full"
            ariaLabel="Cantidad de cuotas" /></label
        ><label for="agreement-period"
          ><span class="block font-semibold mb-2">Días entre cuotas</span
          ><p-inputnumber
            inputId="agreement-period"
            [ngModel]="agreementPeriod()"
            (ngModelChange)="agreementPeriod.set($event ?? 30)"
            [min]="1"
            [max]="90"
            [inputStyle]="{ width: '100%' }"
            styleClass="w-full"
            ariaLabel="Días entre cuotas" /></label
        ><label for="agreement-start"
          ><span class="block font-semibold mb-2">Primer vencimiento</span
          ><pos-civil-date-time
            inputId="agreement-start"
            ariaLabel="Primer vencimiento"
            class="w-full"
            [ngModel]="agreementStart()"
            (ngModelChange)="agreementStart.set($event)"
        /></label>
      </div>
      <p class="text-lg font-semibold mt-5">Total del acuerdo: {{ money(agreementTotal()) }}</p>
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="agreementVisible.set(false)" /><p-button
          label="Crear acuerdo"
          ariaLabel="Crear acuerdo"
          (onClick)="createAgreement()"
          [disabled]="!agreementDebtIds().length" /></ng-template
    ></p-dialog>
    <p-dialog
      [header]="
        kind() === 'advance'
          ? 'Registrar anticipo'
          : kind() === 'installment'
            ? 'Pagar cuota de acuerdo'
            : 'Abonar a documento'
      "
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [modal]="true"
      [style]="{ width: '32rem' }"
      [breakpoints]="{ '640px': '95vw' }"
    >
      @if (error()) {
        <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
      }
      <p class="font-semibold">{{ customer()?.name }}</p>
      <p class="text-sm text-muted-color mt-1 mb-5">
        {{ customer()?.rut }}
        @if (selectedDebt()) {
          · {{ selectedDebt()?.document }} · Saldo {{ money(selectedDebt()?.balance ?? 0) }}
        }
      </p>
      <div class="space-y-4">
        <label class="block" for="checkout-collections-2"
          ><span class="block font-semibold mb-2">Monto del abono</span
          ><p-inputnumber
            inputId="checkout-collections-2"
            class="w-full"
            styleClass="w-full"
            [inputStyle]="{ width: '100%' }"
            [ngModel]="amount()"
            (ngModelChange)="amount.set($event ?? 0)"
            mode="currency"
            currency="CLP"
            locale="es-CL"
            [min]="1"
            [maxFractionDigits]="0"
            ariaLabel="Monto del abono" /></label
        ><label class="block" for="checkout-collections-3"
          ><span class="block font-semibold mb-2">Medio de pago</span
          ><p-select
            inputId="checkout-collections-3"
            class="w-full"
            [options]="paymentOptions"
            optionLabel="label"
            optionValue="value"
            [ngModel]="method()"
            (ngModelChange)="method.set($event)"
            ariaLabel="Medio de pago de cobranza"
        /></label>
      </div>
      <p class="text-sm text-muted-color mt-5">
        La operación actualiza el saldo y genera un comprobante. El envío al ERP se registra por separado.
      </p>
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="dialogVisible.set(false)" /><p-button
          label="Confirmar abono"
          ariaLabel="Confirmar abono"
          icon="pi pi-check"
          (onClick)="pay()"
      /></ng-template>
    </p-dialog>
    <p-dialog
      header="Comprobante de abono"
      [visible]="!!receipt()"
      (visibleChange)="!$event && receipt.set(null)"
      [modal]="true"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '95vw' }"
    >
      @if (receipt(); as item) {
        <div class="text-center">
          <div class="flex justify-center">
            <pos-duotone-icon name="check-circle" [size]="48" class="text-primary" />
          </div>
          <h2 class="text-xl font-semibold mt-4">{{ item.reference }}</h2>
          <p class="text-muted-color mt-2">{{ customer()?.name }}</p>
          <p class="text-3xl font-semibold my-5">{{ money(receiptTotal()) }}</p>
          <p>
            {{
              receiptGroup().length > 1
                ? 'Pago distribuido entre documentos'
                : item.kind === 'advance'
                  ? 'Anticipo de cliente'
                  : documentName(item.receivableId)
            }}
          </p>
          <p class="text-sm text-muted-color mt-2">
            {{ paymentLabels[item.method] }} · {{ dateTime(item.createdAt) }}
          </p>
        </div>
        @if (receiptGroup().length > 1) {
          <div class="space-y-2 mt-5">
            @for (part of receiptGroup(); track part.id) {
              <div class="flex justify-between gap-3 text-sm border-t border-surface pt-2">
                <span>{{ documentName(part.receivableId) }}</span
                ><strong>{{ money(part.amount) }}</strong>
              </div>
            }
          </div>
        }
      }
      <ng-template #footer
        ><p-button
          label="Descargar comprobante"
          ariaLabel="Descargar comprobante"
          icon="pi pi-download"
          severity="secondary"
          (onClick)="exportReceipt()" /><p-button
          label="Listo"
          ariaLabel="Listo"
          (onClick)="receipt.set(null)" /></ng-template
    ></p-dialog>
  `,
})
export class CollectionsComponent {
  readonly store = inject(PosStore);
  readonly money = money;
  readonly date = date;
  readonly dateTime = dateTime;
  readonly paymentLabels = PAYMENT_LABELS;
  readonly customerId = signal<string | null>(
    this.store.snapshot().receivables.find((item) => item.balance > 0)?.customerId ?? null,
  );
  readonly customer = computed(() =>
    this.store.snapshot().customers.find((item) => item.id === this.customerId()),
  );
  readonly search = signal('');
  readonly error = signal('');
  readonly feedback = signal('');
  readonly dialogVisible = signal(false);
  readonly kind = signal<'collection' | 'advance' | 'installment'>('collection');
  readonly selectedDebtId = signal<string | null>(null);
  readonly selectedDebt = computed(() =>
    this.store.snapshot().receivables.find((item) => item.id === this.selectedDebtId()),
  );
  readonly amount = signal(0);
  readonly method = signal<PaymentMethod>('efectivo');
  readonly receipt = signal<Collection | null>(null);
  readonly paymentOptions = (Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][])
    .filter(([method]) => ['efectivo', 'debito', 'credito', 'transferencia'].includes(method))
    .map(([value, label]) => ({ value, label }));
  readonly receivables = computed(() =>
    this.store.snapshot().receivables.filter((item) => item.customerId === this.customerId()),
  );
  readonly visibleReceivables = computed(() =>
    this.receivables().filter((item) => item.document.toLowerCase().includes(this.search().toLowerCase())),
  );
  readonly collections = computed(() =>
    this.store
      .snapshot()
      .collections.filter((item) => item.customerId === this.customerId())
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  readonly totalDebt = computed(() => this.receivables().reduce((sum, item) => sum + item.balance, 0));
  readonly overdue = computed(() =>
    this.receivables()
      .filter((item) => item.balance > 0 && new Date(item.dueAt).getTime() < Date.now())
      .reduce((sum, item) => sum + item.balance, 0),
  );
  readonly advances = computed(() =>
    this.collections()
      .filter((item) => item.kind === 'advance')
      .reduce((sum, item) => sum + item.amount - item.appliedAmount, 0),
  );
  readonly agreements = computed(() =>
    this.store.snapshot().agreements.filter((item) => item.customerId === this.customerId()),
  );
  readonly eligibleDebts = computed(() =>
    this.receivables().filter(
      (item) =>
        item.balance > 0 &&
        !this.agreements().some(
          (agreement) => agreement.status === 'active' && agreement.receivableIds.includes(item.id),
        ),
    ),
  );
  readonly agreementVisible = signal(false);
  readonly agreementDebtIds = signal<string[]>([]);
  readonly agreementCount = signal(3);
  readonly agreementPeriod = signal(30);
  readonly agreementStart = signal(chileCivilDate());
  readonly agreementTotal = computed(() =>
    this.receivables()
      .filter((item) => this.agreementDebtIds().includes(item.id))
      .reduce((sum, item) => sum + item.balance, 0),
  );
  readonly selectedAgreement = signal<string | null>(null);
  readonly selectedInstallment = signal<string | null>(null);
  readonly receiptGroup = signal<Collection[]>([]);
  readonly receiptTotal = computed(() =>
    this.receiptGroup().length
      ? this.receiptGroup().reduce((sum, item) => sum + item.amount, 0)
      : (this.receipt()?.amount ?? 0),
  );
  beginAgreement(): void {
    this.error.set('');
    this.agreementDebtIds.set([]);
    this.agreementVisible.set(true);
  }
  toggleAgreementDebt(id: string): void {
    this.agreementDebtIds.update((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }
  createAgreement(): void {
    const customerId = this.customerId();
    if (!customerId) return;
    const result = this.store.createAgreement({
      customerId,
      receivableIds: this.agreementDebtIds(),
      installments: this.agreementCount(),
      startDate: this.agreementStart(),
      periodDays: this.agreementPeriod(),
    });
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.error.set('');
    this.agreementVisible.set(false);
    this.feedback.set('Acuerdo creado. La deuda original conserva su identidad y sus pagos.');
  }
  beginInstallment(agreement: Agreement, installment: Installment): void {
    this.error.set('');
    this.kind.set('installment');
    this.selectedDebtId.set(null);
    this.selectedAgreement.set(agreement.id);
    this.selectedInstallment.set(installment.id);
    this.amount.set(installment.balance);
    this.method.set('efectivo');
    this.dialogVisible.set(true);
  }
  documentName(id: string | null): string {
    return this.store.snapshot().receivables.find((item) => item.id === id)?.document ?? 'Anticipo';
  }
  showReceipt(item: Collection): void {
    this.receiptGroup.set([item]);
    this.receipt.set(item);
  }
  beginCollection(item: Receivable): void {
    this.error.set('');
    this.kind.set('collection');
    this.selectedDebtId.set(item.id);
    this.amount.set(item.balance);
    this.method.set('efectivo');
    this.dialogVisible.set(true);
  }
  beginAdvance(): void {
    this.error.set('');
    this.kind.set('advance');
    this.selectedDebtId.set(null);
    this.amount.set(0);
    this.method.set('efectivo');
    this.dialogVisible.set(true);
  }
  pay(): void {
    const customerId = this.customerId();
    if (!customerId) return;
    if (this.kind() === 'installment') {
      const result = this.store.collectInstallment(
        this.selectedAgreement() ?? '',
        this.selectedInstallment() ?? '',
        this.amount(),
        this.method(),
      );
      if (!result.ok) {
        this.error.set(result.error);
        return;
      }
      this.receiptGroup.set(result.value);
      this.receipt.set(result.value[0] ?? null);
    } else {
      const result =
        this.kind() === 'advance'
          ? this.store.advance(customerId, this.amount(), this.method())
          : this.store.collect(this.selectedDebtId() ?? '', this.amount(), this.method());
      if (!result.ok) {
        this.error.set(result.error);
        return;
      }
      this.receiptGroup.set([result.value]);
      this.receipt.set(result.value);
    }
    this.error.set('');
    this.dialogVisible.set(false);
    this.feedback.set('Abono registrado. La cuenta del cliente está actualizada.');
  }
  export(): void {
    if (!this.store.can('collect', 'collections') || !this.customerId()) return;
    downloadCsv(`cartola-${this.customerId()}.csv`, [
      ['Cliente', this.customer()?.name],
      ['RUT', this.customer()?.rut],
      [],
      ['Documento', 'Emisión', 'Vencimiento', 'Monto', 'Saldo', 'Estado'],
      ...this.receivables().map((item) => [
        item.document,
        item.issuedAt,
        item.dueAt,
        item.amount,
        item.balance,
        item.status,
      ]),
    ]);
  }
  exportReceipt(): void {
    const item = this.receipt();
    if (!item) return;
    downloadCsv(`comprobante-${item.reference}.csv`, [
      ['Cliente', this.customer()?.name],
      ['Fecha', item.createdAt],
      ['Total pagado', this.receiptTotal()],
      ['Datos', 'Demostración'],
      [],
      ['Comprobante', 'Concepto', 'Medio', 'Monto'],
      ...this.receiptGroup().map((part) => [
        part.reference,
        part.kind === 'advance' ? 'Anticipo' : this.documentName(part.receivableId),
        PAYMENT_LABELS[part.method],
        part.amount,
      ]),
    ]);
  }
}

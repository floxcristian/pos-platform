import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import { PAYMENT_LABELS } from '@corporate-pos/domain';
import {
  PosTooltipDirective,
  CivilDateTimeComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatusTagComponent,
  MetricCardComponent,
  money,
  dateTime,
  downloadCsv,
} from '@corporate-pos/ui';

@Component({
  selector: 'pos-documents',
  standalone: true,
  imports: [
    PosTooltipDirective,
    CivilDateTimeComponent,
    EmptyStateComponent,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DrawerModule,
    DialogModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    MetricCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pos-page-header
      heading="Documentos y pagos"
      eyebrow="Trazabilidad comercial"
      subtitle="Sigue cada venta desde su guardado local hasta la emisión y el registro en ERP."
    >
      <p-button
        label="Exportar"
        ariaLabel="Exportar"
        icon="pos-icon pos-icon-download-simple"
        severity="secondary"
        (onClick)="export()"
        [disabled]="!store.can('reports', 'reports')"
      />
      <a pButton routerLink="/venta" icon="pos-icon pos-icon-plus">Nueva venta</a>
    </pos-page-header>
    @if (error()) {
      <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
    }
    @if (feedback()) {
      <p-message severity="success" class="block mb-4">{{ feedback() }}</p-message>
    }
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
      <pos-metric-card
        heading="Ventas registradas"
        [value]="store.snapshot().sales.length"
        icon="receipt"
      /><pos-metric-card
        heading="Pendientes fiscales"
        [value]="fiscalPending()"
        detail="Emisión o revisión necesaria"
        icon="seal-check"
      /><pos-metric-card
        heading="Pendientes ERP"
        [value]="erpPending()"
        detail="Venta local conservada"
        icon="arrows-clockwise"
      /><pos-metric-card
        heading="Pagos por conciliar"
        [value]="unknownPayments()"
        detail="Consultar antes de volver a cobrar"
        icon="warning-circle"
      />
    </div>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden">
      <div class="p-5 flex flex-wrap gap-3 border-b border-surface">
        <input
          pInputText
          class="flex-1 min-w-52"
          aria-label="Buscar documento"
          placeholder="Folio, cliente o referencia…"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        /><p-select
          [options]="types"
          optionLabel="label"
          optionValue="value"
          [ngModel]="type()"
          (ngModelChange)="type.set($event)"
          ariaLabel="Tipo de documento"
        /><p-select
          [options]="states"
          optionLabel="label"
          optionValue="value"
          [ngModel]="state()"
          (ngModelChange)="state.set($event)"
          ariaLabel="Estado de documento"
        /><label class="flex items-center gap-2 text-sm" for="checkout-documents-1"
          ><span class="text-muted-color">Desde</span
          ><pos-civil-date-time
            inputId="checkout-documents-1"
            ariaLabel="Documentos desde"
            [ngModel]="from()"
            (ngModelChange)="from.set($event)" /></label
        ><label class="flex items-center gap-2 text-sm" for="checkout-documents-2"
          ><span class="text-muted-color">Hasta</span
          ><pos-civil-date-time
            inputId="checkout-documents-2"
            ariaLabel="Documentos hasta"
            [ngModel]="to()"
            (ngModelChange)="to.set($event)"
        /></label>
      </div>
      <div class="overflow-x-auto">
        <table class="pos-table w-full">
          <thead class="text-left bg-surface-50 dark:bg-surface-900 text-muted-color">
            <tr>
              <th class="p-4 font-medium">Documento</th>
              <th class="p-4 font-medium">Cliente</th>
              <th class="p-4 font-medium">Pago</th>
              <th class="p-4 font-medium">Fiscal</th>
              <th class="p-4 font-medium">ERP</th>
              <th class="p-4 text-right font-medium">Total</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody>
            @for (sale of filtered(); track sale.id) {
              <tr class="border-t border-surface hover:bg-surface-50 dark:hover:bg-surface-900">
                <td class="p-4">
                  <button class="pos-inline-action font-semibold text-left" (click)="selectedId.set(sale.id)">
                    {{ sale.number }}
                  </button>
                  <p class="text-xs text-muted-color mt-1">
                    {{ dateTime(sale.createdAt) }} ·
                    {{ sale.documentType === 'boleta' ? 'Boleta' : 'Factura' }}
                  </p>
                </td>
                <td class="p-4">{{ sale.customerName }}</td>
                <td class="p-4"><pos-status-tag [value]="sale.paymentStatus" /></td>
                <td class="p-4"><pos-status-tag [value]="sale.fiscalStatus" /></td>
                <td class="p-4"><pos-status-tag [value]="sale.erpStatus" /></td>
                <td class="p-4 text-right font-semibold tabular-nums whitespace-nowrap">
                  {{ money(sale.total) }}
                </td>
                <td class="p-3">
                  <p-button
                    posTooltip
                    posTooltipPosition="left"
                    icon="pos-icon pos-icon-arrow-right"
                    severity="secondary"
                    [text]="true"
                    [ariaLabel]="'Ver ' + sale.number"
                    (onClick)="selectedId.set(sale.id)"
                  />
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="p-0">
                  <pos-empty-state
                    heading="No hay documentos que coincidan con los filtros."
                    description="Cambia el período, el tipo o el estado del documento."
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="px-5 py-4 border-t border-surface text-xs text-muted-color">
        {{ filtered().length }} documentos · {{ money(filteredTotal()) }} en el resultado
      </div>
    </section>
    <p-drawer
      header="Detalle de documento"
      [visible]="!!selected()"
      (visibleChange)="!$event && selectedId.set(null)"
      position="right"
      styleClass="!w-full lg:!w-[48rem]"
    >
      @if (selected(); as sale) {
        <div class="mb-5">
          <div class="flex justify-between gap-4">
            <h2 class="text-2xl font-semibold">{{ sale.number }}</h2>
            <pos-status-tag [value]="sale.status" />
          </div>
          <p class="text-muted-color mt-2">{{ sale.customerName }} · {{ dateTime(sale.createdAt) }}</p>
          <p class="text-xs text-muted-color mt-1">
            {{ sale.cashier }} · {{ sale.branchId }} · {{ sale.sessionId }}
          </p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="rounded-xl border border-surface p-3">
            <span class="block text-xs text-muted-color mb-2">Venta local</span
            ><pos-status-tag value="completed" label="Guardada" />
          </div>
          <div class="rounded-xl border border-surface p-3">
            <span class="block text-xs text-muted-color mb-2">Pago</span
            ><pos-status-tag [value]="sale.paymentStatus" />
          </div>
          <div class="rounded-xl border border-surface p-3">
            <span class="block text-xs text-muted-color mb-2">Fiscal</span
            ><pos-status-tag [value]="sale.fiscalStatus" />
          </div>
          <div class="rounded-xl border border-surface p-3">
            <span class="block text-xs text-muted-color mb-2">ERP</span
            ><pos-status-tag [value]="sale.erpStatus" />
          </div>
        </div>
        @if (sale.paymentStatus === 'unknown') {
          <p-message severity="warn" class="block mb-5"
            >El resultado del pago requiere conciliación. No vuelvas a cobrar esta venta. Un supervisor puede
            registrar el resultado de la consulta simulada.</p-message
          >
        }
        @if (detailError()) {
          <p-message severity="error" class="block mb-4">{{ detailError() }}</p-message>
        }
        @if (detailFeedback()) {
          <p-message severity="success" class="block mb-4">{{ detailFeedback() }}</p-message>
        }
        <div class="flex flex-wrap gap-2 mb-6">
          <p-button
            label="Reimprimir"
            ariaLabel="Reimprimir"
            icon="pos-icon pos-icon-printer"
            severity="secondary"
            (onClick)="print(sale.id)"
            [disabled]="!store.can('sell', 'sales')"
          />
          @if (sale.fiscalStatus !== 'issued') {
            <p-button
              label="Reintentar emisión"
              ariaLabel="Reintentar emisión"
              icon="pos-icon pos-icon-arrow-clockwise"
              severity="secondary"
              [loading]="retrying()"
              (onClick)="retry(sale.id)"
              [disabled]="sale.paymentStatus !== 'confirmed'"
            />
          }
          @if (sale.paymentStatus === 'unknown' && canReconcile()) {
            <p-button
              label="Conciliar pago"
              ariaLabel="Conciliar pago"
              icon="pos-icon pos-icon-check-square"
              (onClick)="reconcileVisible.set(true)"
            />
          }
        </div>
        @if (sale.metadata.orderReference || sale.metadata.deliveryMode || sale.metadata.coupon) {
          <section class="rounded-xl bg-surface-50 dark:bg-surface-900 p-4 mb-5">
            <h3 class="font-semibold text-sm mb-2">Entrega y referencias</h3>
            <dl class="space-y-2 text-sm">
              @if (sale.metadata.orderReference) {
                <div class="flex justify-between gap-3">
                  <dt class="text-muted-color">Orden de venta</dt>
                  <dd>{{ sale.metadata.orderReference }}</dd>
                </div>
              }
              @if (sale.metadata.deliveryMode) {
                <div class="flex justify-between gap-3">
                  <dt class="text-muted-color">Entrega</dt>
                  <dd>{{ sale.metadata.deliveryMode === 'delivery' ? 'Despacho' : 'Retiro en tienda' }}</dd>
                </div>
              }
              @if (sale.metadata.deliveryAddress) {
                <div>
                  <dt class="text-muted-color">Dirección y contacto</dt>
                  <dd>{{ sale.metadata.deliveryAddress }} · {{ sale.metadata.contact }}</dd>
                </div>
              }
              @if (sale.metadata.coupon) {
                <div class="flex justify-between gap-3">
                  <dt class="text-muted-color">Promoción</dt>
                  <dd>{{ sale.metadata.coupon }}</dd>
                </div>
              }
            </dl>
          </section>
        }
        <h3 class="font-semibold mb-3">Productos</h3>
        <div class="overflow-x-auto mb-5">
          <table class="pos-table pos-table--flush w-full">
            <thead class="text-left bg-surface-50 dark:bg-surface-900">
              <tr>
                <th class="p-3 font-medium">Producto</th>
                <th class="p-3 font-medium text-right">Cant.</th>
                <th class="p-3 font-medium text-right">Desc.</th>
                <th class="p-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (line of sale.lines; track line.productId) {
                <tr class="border-t border-surface">
                  <td class="p-3">
                    {{ line.name }}<small class="block text-muted-color">{{ line.sku }}</small>
                  </td>
                  <td class="p-3 text-right">{{ line.quantity }}</td>
                  <td class="p-3 text-right">{{ line.discount }} %</td>
                  <td class="p-3 text-right">{{ money(line.total) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <dl class="space-y-2 mb-6 text-sm">
          <div class="flex justify-between">
            <dt>Neto</dt>
            <dd>{{ money(sale.net) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>IVA</dt>
            <dd>{{ money(sale.tax) }}</dd>
          </div>
          <div class="flex justify-between text-lg font-semibold">
            <dt>Total del documento</dt>
            <dd>{{ money(sale.total) }}</dd>
          </div>
          @if (sale.roundingAdjustment) {
            <div class="flex justify-between">
              <dt>Ajuste de efectivo</dt>
              <dd>{{ money(sale.roundingAdjustment) }}</dd>
            </div>
            <div class="flex justify-between font-semibold">
              <dt>Total cobrado</dt>
              <dd>{{ money(sale.paidTotal) }}</dd>
            </div>
          }
          @if (sale.cashTendered) {
            <div class="flex justify-between">
              <dt>Efectivo recibido</dt>
              <dd>{{ money(sale.cashTendered) }}</dd>
            </div>
          }
          @if (sale.change) {
            <div class="flex justify-between">
              <dt>
                {{
                  sale.changeDisposition === 'advance' ? 'Vuelto guardado como anticipo' : 'Vuelto entregado'
                }}
              </dt>
              <dd>{{ money(sale.change) }}</dd>
            </div>
          }
        </dl>
        <h3 class="font-semibold mb-3">Pagos</h3>
        <div class="space-y-3 mb-6">
          @for (payment of sale.payments; track payment.id) {
            <div class="rounded-xl border border-surface p-4 flex justify-between gap-3">
              <div>
                <p class="font-medium">{{ paymentLabels[payment.method] }}</p>
                <p class="text-xs text-muted-color mt-1">
                  {{ payment.reference || 'Sin referencia externa' }}
                </p>
                @if (payment.details; as details) {
                  @if (payment.method === 'cheque') {
                    <p class="text-xs text-muted-color mt-2">
                      Cheque {{ details.chequeNumber }} · Cuenta {{ details.accountNumber }}
                    </p>
                    <p class="text-xs text-muted-color mt-1">
                      Emisor: {{ details.issuerName }} · {{ details.issuerRut }}
                    </p>
                    <p class="text-xs text-muted-color mt-1">
                      Portador: {{ details.holderName }} · {{ details.holderRut }}
                    </p>
                  }
                  @if (payment.method === 'usd') {
                    <p class="text-xs text-muted-color mt-2">
                      USD {{ details.currencyAmount }} · Tipo de cambio {{ money(details.exchangeRate ?? 0) }}
                    </p>
                  }
                }
                <pos-status-tag class="block mt-2" [value]="payment.status" />
              </div>
              <strong>{{ money(payment.amount) }}</strong>
            </div>
          }
        </div>
        <h3 class="font-semibold mb-3">Integración de esta operación</h3>
        <div class="space-y-3">
          @for (event of saleEvents(); track event.id) {
            <div class="rounded-xl bg-surface-50 dark:bg-surface-900 p-4">
              <div class="flex justify-between">
                <span class="font-medium text-sm">{{
                  event.target === 'erp' ? 'Registro en ERP' : 'Emisión fiscal'
                }}</span
                ><pos-status-tag [value]="event.status" />
              </div>
              <p class="text-xs text-muted-color mt-2">{{ event.id }} · {{ event.attempts }} intentos</p>
              @if (event.lastError) {
                <p class="text-sm mt-2">{{ event.lastError }}</p>
              }
            </div>
          } @empty {
            <pos-empty-state
              icon="arrows-clockwise"
              heading="Sin envíos pendientes para esta venta."
              [headingLevel]="3"
            />
          }
        </div>
        <p class="text-xs text-muted-color mt-6 break-all">
          Identidad de operación: {{ sale.idempotencyKey }}
        </p>
      }
    </p-drawer>
    <p-dialog
      header="Conciliar resultado del pago"
      [visible]="reconcileVisible()"
      (visibleChange)="reconcileVisible.set($event)"
      [modal]="true"
      [style]="{ width: '32rem' }"
      [breakpoints]="{ '640px': '95vw' }"
      ><p class="text-muted-color mb-4">
        Registra el resultado de la consulta al proveedor simulado. Esta acción no ejecuta un nuevo cargo.
      </p>
      <p-select
        class="w-full"
        [options]="outcomes"
        optionLabel="label"
        optionValue="value"
        [ngModel]="outcome()"
        (ngModelChange)="outcome.set($event)"
        ariaLabel="Resultado confirmado" /><ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="reconcileVisible.set(false)" /><p-button
          label="Registrar resultado"
          ariaLabel="Registrar resultado"
          (onClick)="reconcile()" /></ng-template
    ></p-dialog>
  `,
})
export class DocumentsComponent {
  readonly store = inject(PosStore);
  private readonly route = inject(ActivatedRoute);
  private readonly dayFormatter = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Santiago',
  });
  readonly money = money;
  readonly dateTime = dateTime;
  readonly paymentLabels = PAYMENT_LABELS;
  readonly search = signal('');
  readonly type = signal('all');
  readonly state = signal('all');
  readonly from = signal('');
  readonly to = signal('');
  readonly error = signal('');
  readonly feedback = signal('');
  readonly detailError = signal('');
  readonly detailFeedback = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() =>
    this.store.snapshot().sales.find((item) => item.id === this.selectedId()),
  );
  readonly retrying = signal(false);
  readonly reconcileVisible = signal(false);
  readonly outcome = signal<'confirmed' | 'failed'>('confirmed');
  readonly types = [
    { label: 'Todos los documentos', value: 'all' },
    { label: 'Boletas', value: 'boleta' },
    { label: 'Facturas', value: 'factura' },
  ];
  readonly states = [
    { label: 'Todos los estados', value: 'all' },
    { label: 'Fiscal pendiente', value: 'fiscal' },
    { label: 'ERP pendiente', value: 'erp' },
    { label: 'Pago por conciliar', value: 'unknown' },
    { label: 'Con devoluciones', value: 'returned' },
  ];
  readonly outcomes = [
    { label: 'Proveedor confirma pago aprobado', value: 'confirmed' },
    { label: 'Proveedor confirma pago rechazado', value: 'failed' },
  ];
  readonly fiscalPending = computed(
    () => this.store.snapshot().sales.filter((item) => item.fiscalStatus !== 'issued').length,
  );
  readonly erpPending = computed(
    () => this.store.snapshot().sales.filter((item) => item.erpStatus !== 'synced').length,
  );
  readonly unknownPayments = computed(
    () => this.store.snapshot().sales.filter((item) => item.paymentStatus === 'unknown').length,
  );
  readonly canReconcile = computed(() => ['admin', 'supervisor'].includes(this.store.snapshot().role));
  readonly saleEvents = computed(() =>
    this.store.snapshot().outbox.filter((item) => item.aggregateId === this.selectedId()),
  );
  readonly filtered = computed(() =>
    this.store
      .snapshot()
      .sales.filter((item) => {
        const term = this.search().toLowerCase();
        const day = this.dayFormatter.format(new Date(item.createdAt));
        return (
          `${item.number} ${item.customerName} ${item.id} ${item.payments.map((payment) => payment.reference).join(' ')}`
            .toLowerCase()
            .includes(term) &&
          (this.type() === 'all' || item.documentType === this.type()) &&
          (!this.from() || day >= this.from()) &&
          (!this.to() || day <= this.to()) &&
          (this.state() === 'all' ||
            (this.state() === 'fiscal' && item.fiscalStatus !== 'issued') ||
            (this.state() === 'erp' && item.erpStatus !== 'synced') ||
            (this.state() === 'unknown' && item.paymentStatus === 'unknown') ||
            (this.state() === 'returned' && item.status !== 'completed'))
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  readonly filteredTotal = computed(() => this.filtered().reduce((sum, item) => sum + item.total, 0));
  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const search = params.get('buscar');
      if (search !== null) this.search.set(search);
    });
  }
  print(id: string): void {
    this.detailError.set('');
    const result = this.store.printDocument(id);
    if (!result.ok) this.detailError.set(result.error);
    else
      this.detailFeedback.set('Copia enviada a la cola de impresión simulada. La emisión fiscal no cambia.');
  }
  async retry(id: string): Promise<void> {
    this.retrying.set(true);
    this.detailError.set('');
    try {
      const result = await this.store.retryFiscal(id);
      if (!result.ok) this.detailError.set(result.error);
      else this.detailFeedback.set('El proveedor simulado confirmó la emisión del documento.');
    } finally {
      this.retrying.set(false);
    }
  }
  reconcile(): void {
    const sale = this.selected();
    if (!sale) return;
    const result = this.store.resolvePayment(sale.id, this.outcome());
    if (!result.ok) this.detailError.set(result.error);
    else {
      this.reconcileVisible.set(false);
      this.detailFeedback.set('Resultado conciliado. La auditoría conserva la decisión.');
    }
  }
  export(): void {
    if (!this.store.can('reports', 'reports')) return;
    downloadCsv('documentos.csv', [
      ['Folio', 'Fecha', 'Cliente', 'Tipo', 'Total', 'Pago', 'Fiscal', 'ERP'],
      ...this.filtered().map((item) => [
        item.number,
        item.createdAt,
        item.customerName,
        item.documentType,
        item.total,
        item.paymentStatus,
        item.fiscalStatus,
        item.erpStatus,
      ]),
    ]);
  }
}

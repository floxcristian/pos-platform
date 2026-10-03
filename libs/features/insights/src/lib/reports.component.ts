import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  afterNextRender,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { PosStore } from '@corporate-pos/data-access';
import {
  CivilDateTimeComponent,
  PageHeaderComponent,
  ThemeService,
  MetricCardComponent,
  StatusTagComponent,
  money,
  dateTime,
  number,
  downloadCsv,
} from '@corporate-pos/ui';
import {
  PAYMENT_LABELS,
  branchName,
  chartOptions,
  chartPalette,
  daysAgo,
  localDate,
  withinDates,
} from './analytics';

type ReportType = 'sales' | 'payments' | 'cash' | 'erp' | 'collections' | 'returns';
interface ReportRow {
  id: string;
  at: string;
  reference: string;
  concept: string;
  branchId: string;
  amount: number;
  status: string;
  detail: string;
  attributes: { label: string; value: string }[];
}
@Component({
  selector: 'pos-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CivilDateTimeComponent,
    FormsModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    DialogModule,
    ChartModule,
    InputTextModule,
    PageHeaderComponent,
    MetricCardComponent,
    StatusTagComponent,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  readonly theme = inject(ThemeService);
  readonly store = inject(PosStore);
  readonly reportType = signal<ReportType>('sales');
  readonly from = signal(daysAgo(29));
  readonly to = signal(localDate(new Date()));
  readonly branchId = signal('all');
  readonly query = signal('');
  readonly status = signal('all');
  readonly selected = signal<ReportRow | null>(null);
  readonly exportMessage = signal('');
  readonly chartReady = signal(false);
  readonly palette = signal<string[]>([]);
  readonly chartOptions = signal<object>({});
  readonly types: { label: string; value: ReportType; description: string }[] = [
    { label: 'Ventas', value: 'sales', description: 'Boletas y facturas con sus importes y estados.' },
    {
      label: 'Medios de pago',
      value: 'payments',
      description:
        'Desglose por pago; una venta puede tener más de un medio. Aplicar un anticipo o una nota de crédito no genera un nuevo ingreso de efectivo.',
    },
    {
      label: 'Cierres y arqueos',
      value: 'cash',
      description: 'Efectivo esperado, recuento y diferencia de cada turno.',
    },
    {
      label: 'Conciliación ERP y fiscal',
      value: 'erp',
      description: 'Estado de cada venta y sus pendientes de integración.',
    },
    {
      label: 'Cobranzas y anticipos',
      value: 'collections',
      description: 'Recaudación de cuentas por cobrar y anticipos de clientes.',
    },
    { label: 'Devoluciones', value: 'returns', description: 'Notas de crédito y reembolsos registrados.' },
  ];
  readonly typeInfo = computed(() => this.types.find((type) => type.value === this.reportType())!);
  readonly branches = computed(() => [
    { label: 'Todas las sucursales', value: 'all' },
    ...this.store.snapshot().branches.map((branch) => ({ label: branch.name, value: branch.id })),
  ]);
  readonly rangeError = computed(() =>
    !this.from() || !this.to()
      ? 'Completa las fechas del reporte.'
      : this.from() > this.to()
        ? 'La fecha de inicio debe ser anterior o igual a la fecha final.'
        : '',
  );
  readonly baseRows = computed<ReportRow[]>(() => {
    const state = this.store.snapshot();
    const type = this.reportType();
    if (type === 'sales' || type === 'erp')
      return state.sales.map((sale) => ({
        id: sale.id,
        at: sale.createdAt,
        reference: sale.number,
        concept: sale.customerName,
        branchId: sale.branchId,
        amount: sale.total,
        status: type === 'erp' ? sale.erpStatus : sale.paymentStatus,
        detail:
          type === 'erp'
            ? `Fiscal: ${sale.fiscalStatus === 'issued' ? 'emitido' : sale.fiscalStatus === 'failed' ? 'fallido' : 'pendiente'} · ERP: ${sale.erpStatus === 'synced' ? 'sincronizado' : sale.erpStatus === 'failed' ? 'fallido' : 'pendiente'}`
            : sale.documentType === 'boleta'
              ? 'Boleta electrónica'
              : 'Factura electrónica',
        attributes: [
          { label: 'Cliente', value: sale.customerName },
          { label: 'Cajero', value: sale.cashier },
          { label: 'Estado del pago', value: this.statusLabel(sale.paymentStatus) },
          { label: 'Neto', value: money(sale.net) },
          { label: 'IVA', value: money(sale.tax) },
          { label: 'Descuento', value: money(sale.discount) },
          ...sale.lines.map((line) => ({
            label: `${line.quantity} × ${line.name}`,
            value: money(line.total),
          })),
          { label: 'Identificador de operación', value: sale.id },
        ],
      }));
    if (type === 'payments')
      return state.sales.flatMap((sale) =>
        sale.payments.map((payment) => ({
          id: payment.id,
          at: sale.createdAt,
          reference: sale.number,
          concept: PAYMENT_LABELS[payment.method],
          branchId: sale.branchId,
          amount: payment.amount,
          status: payment.status,
          detail: sale.customerName,
          attributes: [
            { label: 'Cliente', value: sale.customerName },
            { label: 'Medio de pago', value: PAYMENT_LABELS[payment.method] },
            { label: 'Referencia', value: payment.reference || 'Sin referencia' },
            { label: 'Cajero', value: sale.cashier },
            { label: 'Identificador del pago', value: payment.id },
          ],
        })),
      );
    if (type === 'cash')
      return [
        ...state.sessions,
        ...(state.session && !state.sessions.some((session) => session.id === state.session?.id)
          ? [state.session]
          : []),
      ].map((session) => ({
        id: session.id,
        at: session.closedAt ?? session.openedAt,
        reference: session.id,
        concept: session.cashier,
        branchId: session.branchId,
        amount: session.countedAmount ?? session.expectedAmount,
        status: session.status,
        detail: session.difference === null ? 'Turno sin cierre' : `Diferencia: ${money(session.difference)}`,
        attributes: [
          { label: 'Apertura', value: dateTime(session.openedAt) },
          { label: 'Cierre', value: session.closedAt ? dateTime(session.closedAt) : 'En curso' },
          { label: 'Fondo inicial', value: money(session.openingAmount) },
          { label: 'Efectivo esperado', value: money(session.expectedAmount) },
          {
            label: 'Efectivo contado',
            value: session.countedAmount === null ? 'Sin recuento' : money(session.countedAmount),
          },
          {
            label: 'Diferencia',
            value: session.difference === null ? 'Sin recuento' : money(session.difference),
          },
        ],
      }));
    if (type === 'collections')
      return state.collections.map((collection) => {
        const customer = state.customers.find((item) => item.id === collection.customerId);
        return {
          id: collection.id,
          at: collection.createdAt,
          reference: collection.id,
          concept: customer?.name ?? 'Cliente',
          branchId: collection.branchId,
          amount: collection.amount,
          status: 'confirmed',
          detail: `${collection.kind === 'advance' ? 'Anticipo' : 'Cobranza'} · ${PAYMENT_LABELS[collection.method]}`,
          attributes: [
            { label: 'Cliente', value: customer?.name ?? 'Cliente' },
            { label: 'RUT', value: customer?.rut ?? '—' },
            {
              label: 'Documento asociado',
              value:
                state.receivables.find((receivable) => receivable.id === collection.receivableId)?.document ??
                'Anticipo sin documento',
            },
            { label: 'Referencia', value: collection.reference || '—' },
            { label: 'Medio de pago', value: PAYMENT_LABELS[collection.method] },
            ...(collection.kind === 'advance'
              ? [
                  { label: 'Aplicado a ventas', value: money(collection.appliedAmount) },
                  { label: 'Saldo del anticipo', value: money(collection.amount - collection.appliedAmount) },
                ]
              : []),
          ],
        };
      });
    return state.creditNotes.map((note) => {
      const sale = state.sales.find((item) => item.id === note.saleId);
      return {
        id: note.id,
        at: note.createdAt,
        reference: note.number,
        concept: sale?.customerName ?? 'Cliente',
        branchId: sale?.branchId ?? state.settings.branchId,
        amount: note.amount,
        status: note.fiscalStatus,
        detail: note.reason,
        attributes: [
          { label: 'Venta original', value: sale?.number ?? note.saleId },
          { label: 'Motivo', value: note.reason },
          { label: 'Medio de reembolso', value: PAYMENT_LABELS[note.refundMethod] },
          { label: 'Importe de la nota', value: money(note.amount) },
          { label: 'Deuda compensada', value: money(note.debtOffsetAmount) },
          { label: 'Dinero devuelto', value: money(note.refundPaymentAmount) },
          { label: 'Saldo de NC liquidado', value: money(note.refundedAmount) },
          { label: 'Aplicado a otra venta', value: money(note.appliedAmount) },
          {
            label: 'Saldo disponible',
            value: money(Math.max(0, note.amount - note.refundedAmount - note.appliedAmount)),
          },
        ],
      };
    });
  });
  readonly statusOptions = computed(() => [
    { label: 'Todos los estados', value: 'all' },
    ...[...new Set(this.baseRows().map((row) => row.status))].map((status) => ({
      label: this.statusLabel(status),
      value: status,
    })),
  ]);
  readonly rows = computed(() => {
    if (this.rangeError()) return [];
    const query = this.query().trim().toLocaleLowerCase('es');
    return this.baseRows()
      .filter(
        (row) =>
          withinDates(row.at, this.from(), this.to()) &&
          (this.branchId() === 'all' || row.branchId === this.branchId()) &&
          (this.status() === 'all' || row.status === this.status()) &&
          (!query || `${row.reference} ${row.concept} ${row.detail}`.toLocaleLowerCase('es').includes(query)),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
  });
  readonly usesConfirmedPayments = computed(() => ['sales', 'payments', 'erp'].includes(this.reportType()));
  readonly summaryRows = computed(() =>
    this.rows().filter(
      (row) =>
        !this.usesConfirmedPayments() ||
        (this.reportType() === 'erp'
          ? this.store
              .snapshot()
              .sales.some((sale) => sale.id === row.id && sale.paymentStatus === 'confirmed')
          : row.status === 'confirmed'),
    ),
  );
  readonly amount = computed(() => this.summaryRows().reduce((sum, row) => sum + row.amount, 0));
  readonly excludedAmount = computed(
    () => this.rows().reduce((sum, row) => sum + row.amount, 0) - this.amount(),
  );
  readonly amountTitle = computed(() =>
    this.reportType() === 'cash'
      ? 'Efectivo contado o esperado'
      : this.usesConfirmedPayments()
        ? 'Importe confirmado'
        : 'Importe total',
  );
  readonly amountDetail = computed(() =>
    this.usesConfirmedPayments()
      ? `${this.summaryRows().length} registros con pago confirmado`
      : 'Suma de los registros visibles',
  );
  readonly pending = computed(
    () =>
      this.rows().filter(
        (row) =>
          ['pending', 'failed', 'unknown', 'open'].includes(row.status) ||
          (this.reportType() === 'erp' &&
            this.store.snapshot().sales.some((sale) => sale.id === row.id && sale.fiscalStatus !== 'issued')),
      ).length,
  );
  readonly average = computed(() =>
    this.summaryRows().length ? Math.round(this.amount() / this.summaryRows().length) : 0,
  );
  readonly groups = computed(() => {
    const result = new Map<string, number>();
    for (const row of this.summaryRows()) {
      const key = this.reportType() === 'payments' ? row.concept : this.branchName(row.branchId);
      result.set(key, (result.get(key) ?? 0) + row.amount);
    }
    return [...result.entries()].map(([label, amount]) => ({ label, amount }));
  });
  readonly chart = computed(() => ({
    labels: this.groups().map((group) => group.label),
    datasets: [
      {
        label: 'Importe (CLP)',
        data: this.groups().map((group) => group.amount),
        backgroundColor: this.palette()[0],
        borderRadius: 5,
        maxBarThickness: 34,
      },
    ],
  }));
  readonly money = money;
  readonly dateTime = dateTime;
  readonly number = number;
  readonly branchName = (id: string): string => branchName(this.store.snapshot().branches, id);
  constructor() {
    afterNextRender(() => {
      this.palette.set(chartPalette(this.theme.resolvedTheme()));
      this.chartOptions.set(chartOptions(true));
      this.chartReady.set(true);
    });
    effect(() => {
      const theme = this.theme.resolvedTheme();
      if (this.chartReady())
        requestAnimationFrame(() => {
          this.palette.set(chartPalette(theme));
          this.chartOptions.set(chartOptions(true));
        });
    });
  }
  changeType(type: ReportType): void {
    this.reportType.set(type);
    this.status.set('all');
    this.exportMessage.set('');
    this.selected.set(null);
  }
  resetFilters(): void {
    this.from.set(daysAgo(29));
    this.to.set(localDate(new Date()));
    this.branchId.set('all');
    this.status.set('all');
    this.query.set('');
    this.exportMessage.set('');
  }
  statusLabel(status: string): string {
    return (
      (
        {
          confirmed: 'Confirmado',
          pending: 'Pendiente',
          unknown: 'Por conciliar',
          failed: 'Fallido',
          synced: 'Sincronizado',
          open: 'Abierto',
          closed: 'Cerrado',
          issued: 'Emitido',
        } as Record<string, string>
      )[status] ?? status
    );
  }
  export(): void {
    if (!this.rows().length || this.rangeError() || !this.store.can('reports', 'reports')) return;
    downloadCsv(`corporate-pos-${this.reportType()}-${this.from()}-${this.to()}.csv`, [
      ['Fecha', 'Referencia', 'Concepto', 'Sucursal', 'Importe CLP', 'Estado', 'Detalle'],
      ...this.rows().map((row) => [
        dateTime(row.at),
        row.reference,
        row.concept,
        this.branchName(row.branchId),
        row.amount,
        this.statusLabel(row.status),
        row.detail,
      ]),
    ]);
    this.exportMessage.set(`Se exportaron ${this.rows().length} registros con los filtros seleccionados.`);
  }
}

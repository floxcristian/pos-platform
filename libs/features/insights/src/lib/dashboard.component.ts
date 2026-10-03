import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  afterNextRender,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { PosStore } from '@corporate-pos/data-access';
import {
  PageHeaderComponent,
  ThemeService,
  MetricCardComponent,
  StatusTagComponent,
  money,
  dateTime,
  number,
} from '@corporate-pos/ui';
import {
  PAYMENT_LABELS,
  branchName,
  chartOptions,
  chartPalette,
  daysAgo,
  localDate,
  totalSales,
  withinDates,
} from './analytics';

@Component({
  selector: 'pos-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    SelectModule,
    ChartModule,
    TableModule,
    PageHeaderComponent,
    MetricCardComponent,
    StatusTagComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly theme = inject(ThemeService);
  readonly store = inject(PosStore);
  readonly period = signal(7);
  readonly branchId = signal(this.store.snapshot().settings.branchId);
  readonly chartReady = signal(false);
  readonly palette = signal<string[]>([]);
  readonly options = signal<object>({});
  readonly periods = [
    { label: 'Hoy', value: 1 },
    { label: 'Últimos 7 días', value: 7 },
    { label: 'Últimos 30 días', value: 30 },
  ];
  readonly branchOptions = computed(() => [
    ...(this.store.snapshot().role === 'cashier' ? [] : [{ label: 'Todas las sucursales', value: 'all' }]),
    ...this.store
      .snapshot()
      .branches.filter(
        (branch) =>
          branch.active &&
          (this.store.snapshot().role !== 'cashier' || branch.id === this.store.snapshot().settings.branchId),
      )
      .map((branch) => ({ label: branch.name, value: branch.id })),
  ]);
  readonly sales = computed(() =>
    this.store
      .snapshot()
      .sales.filter(
        (sale) =>
          (this.branchId() === 'all' || sale.branchId === this.branchId()) &&
          withinDates(sale.createdAt, daysAgo(this.period() - 1), localDate(new Date())),
      ),
  );
  readonly confirmedSales = computed(() => this.sales().filter((sale) => sale.paymentStatus === 'confirmed'));
  readonly paymentReview = computed(
    () => this.sales().filter((sale) => sale.paymentStatus !== 'confirmed').length,
  );
  readonly returns = computed(() =>
    this.store
      .snapshot()
      .creditNotes.filter(
        (note) =>
          withinDates(note.createdAt, daysAgo(this.period() - 1), localDate(new Date())) &&
          this.store
            .snapshot()
            .sales.some(
              (sale) =>
                sale.id === note.saleId && (this.branchId() === 'all' || sale.branchId === this.branchId()),
            ),
      ),
  );
  readonly gross = computed(() => totalSales(this.sales()));
  readonly refunded = computed(() => this.returns().reduce((sum, note) => sum + note.amount, 0));
  readonly netSales = computed(() => this.gross() - this.refunded());
  readonly average = computed(() =>
    this.confirmedSales().length ? Math.round(this.gross() / this.confirmedSales().length) : 0,
  );
  readonly priorSales = computed(() =>
    this.store
      .snapshot()
      .sales.filter(
        (sale) =>
          (this.branchId() === 'all' || sale.branchId === this.branchId()) &&
          withinDates(sale.createdAt, daysAgo(this.period() * 2 - 1), daysAgo(this.period())),
      ),
  );
  readonly priorReturns = computed(() =>
    this.store
      .snapshot()
      .creditNotes.filter(
        (note) =>
          withinDates(note.createdAt, daysAgo(this.period() * 2 - 1), daysAgo(this.period())) &&
          this.store
            .snapshot()
            .sales.some(
              (sale) =>
                sale.id === note.saleId && (this.branchId() === 'all' || sale.branchId === this.branchId()),
            ),
      )
      .reduce((sum, note) => sum + note.amount, 0),
  );
  readonly change = computed(() => {
    const previous = totalSales(this.priorSales()) - this.priorReturns();
    return previous > 0
      ? `${this.netSales() >= previous ? '+' : ''}${(((this.netSales() - previous) / previous) * 100).toFixed(1)}% vs. período anterior`
      : 'Sin base de comparación anterior';
  });
  readonly pendingFiscal = computed(
    () => this.sales().filter((sale) => sale.fiscalStatus !== 'issued').length,
  );
  readonly pendingErp = computed(() => this.sales().filter((sale) => sale.erpStatus !== 'synced').length);
  readonly recent = computed(() =>
    [...this.sales()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
  );
  readonly alerts = computed(() =>
    this.store
      .snapshot()
      .logs.filter((log) => log.level !== 'info')
      .slice(0, 3),
  );
  readonly syncPending = computed(
    () => this.store.snapshot().outbox.filter((event) => event.status !== 'sent').length,
  );
  readonly trend = computed(() => {
    const days = Array.from({ length: this.period() }, (_, index) => daysAgo(this.period() - index - 1));
    return {
      labels: days.map((day) =>
        new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(
          new Date(`${day}T12:00:00`),
        ),
      ),
      datasets: [
        {
          label: 'Ventas confirmadas (CLP)',
          data: days.map((day) =>
            totalSales(this.sales().filter((sale) => localDate(sale.createdAt) === day)),
          ),
          borderColor: this.palette()[0],
          backgroundColor: this.palette()[1],
          pointBackgroundColor: this.palette()[0],
          pointRadius: this.period() > 14 ? 0 : 3,
          tension: 0.3,
          fill: false,
          borderWidth: 2,
        },
      ],
    };
  });
  readonly payments = computed(() =>
    Object.entries(PAYMENT_LABELS)
      .map(([method, label], index) => ({
        label,
        total: this.sales()
          .flatMap((sale) => sale.payments)
          .filter((payment) => payment.method === method && payment.status === 'confirmed')
          .reduce((sum, payment) => sum + payment.amount, 0),
        color: this.palette()[index],
      }))
      .filter((row) => row.total > 0),
  );
  readonly paymentChart = computed(() => ({
    labels: this.payments().map((payment) => payment.label),
    datasets: [
      {
        data: this.payments().map((payment) => payment.total),
        backgroundColor: this.payments().map((payment) => payment.color),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }));
  readonly doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200 },
    cutout: '72%',
    plugins: { legend: { display: false } },
  };
  readonly topProducts = computed(() => {
    const totals = new Map<string, { name: string; quantity: number; total: number }>();
    for (const sale of this.confirmedSales())
      for (const line of sale.lines) {
        const current = totals.get(line.productId) ?? { name: line.name, quantity: 0, total: 0 };
        totals.set(line.productId, {
          name: line.name,
          quantity: current.quantity + line.quantity,
          total: current.total + line.total,
        });
      }
    return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  });
  readonly money = money;
  readonly dateTime = dateTime;
  readonly number = number;
  readonly branchName = (id: string): string => branchName(this.store.snapshot().branches, id);
  constructor() {
    effect(() => {
      if (this.store.snapshot().role === 'cashier')
        this.branchId.set(this.store.snapshot().settings.branchId);
    });
    afterNextRender(() => {
      this.palette.set(chartPalette(this.theme.resolvedTheme()));
      this.options.set(chartOptions());
      this.chartReady.set(true);
    });
    effect(() => {
      const theme = this.theme.resolvedTheme();
      if (this.chartReady())
        requestAnimationFrame(() => {
          this.palette.set(chartPalette(theme));
          this.options.set(chartOptions());
        });
    });
  }
}

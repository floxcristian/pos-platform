import type { Sale, Branch } from '@corporate-pos/domain';
import { addCalendarDays, chileCivilDate } from '@corporate-pos/domain';
export { PAYMENT_LABELS } from '@corporate-pos/domain';

export function localDate(value: string | Date): string {
  return chileCivilDate(value);
}
export function daysAgo(days: number, now = new Date()): string {
  return addCalendarDays(chileCivilDate(now), -days);
}
export function withinDates(value: string, from: string, to: string): boolean {
  const date = localDate(value);
  return (!from || date >= from) && (!to || date <= to);
}
export function branchName(branches: Branch[], id: string): string {
  return branches.find((branch) => branch.id === id)?.name ?? id;
}
export function totalSales(sales: Pick<Sale, 'total' | 'paymentStatus'>[]): number {
  return sales
    .filter((sale) => sale.paymentStatus === 'confirmed')
    .reduce((sum, sale) => sum + sale.total, 0);
}
export function token(name: string, fallback = 'currentColor'): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
export function chartPalette(theme: 'light' | 'dark' = 'light'): string[] {
  const dark = theme === 'dark';
  return [
    dark ? '--p-primary-400' : '--p-primary-500',
    '--p-primary-300',
    dark ? '--p-accent-400' : '--p-accent-600',
    '--p-surface-500',
    '--p-primary-700',
    '--p-accent-300',
    '--p-accent-700',
    '--p-primary-200',
    '--p-surface-400',
  ].map((name) => token(name));
}
export function chartOptions(horizontal = false): object {
  const foreground = token('--p-text-muted-color');
  const border = token('--p-content-border-color');
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200 },
    indexAxis: horizontal ? 'y' : 'x',
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: foreground, maxRotation: 0 } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: border },
        ticks: { color: foreground },
      },
    },
  };
}

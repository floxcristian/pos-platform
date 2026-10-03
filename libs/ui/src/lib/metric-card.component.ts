import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pos-metric-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 p-5' },
  template: `
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm text-muted-color font-medium">{{ title() }}</span>
      @if (icon()) {
        <i [class]="'pi ' + icon() + ' text-primary'" aria-hidden="true"></i>
      }
    </div>
    <p class="mt-3 text-3xl font-semibold text-color tracking-tight tabular-nums break-words">
      {{ value() }}
    </p>
    @if (detail()) {
      <p class="mt-2 text-sm text-muted-color leading-5">{{ detail() }}</p>
    }
  `,
})
export class MetricCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly detail = input<string>('');
  readonly icon = input<string>('');
}

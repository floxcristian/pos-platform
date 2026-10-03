import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DuotoneIconComponent, type DuotoneIconName } from './duotone-icon.component';

@Component({
  selector: 'pos-metric-card',
  standalone: true,
  imports: [DuotoneIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 p-5' },
  template: `
    <div class="flex items-center justify-between gap-3">
      <span class="min-w-0 text-sm text-muted-color font-medium">{{ title() }}</span>
      @if (icon(); as iconName) {
        <span
          class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <pos-duotone-icon [name]="iconName" [size]="32" />
        </span>
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
  readonly icon = input<DuotoneIconName>();
}

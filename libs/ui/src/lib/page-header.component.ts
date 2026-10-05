import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pos-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-4 mb-6' },
  template: `
    <div class="w-full sm:w-auto min-w-0 flex-1">
      @if (eyebrow()) {
        <p class="mb-2 ps-4 text-xs font-semibold uppercase tracking-widest text-primary">{{ eyebrow() }}</p>
      }
      <div class="flex min-w-0 items-start gap-3">
        <span class="mt-0.5 h-7 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
        <h1 class="min-w-0 text-balance text-2xl font-medium text-color leading-8">{{ heading() }}</h1>
      </div>
      @if (subtitle()) {
        <p class="mt-1 max-w-4xl ps-4 break-words text-pretty text-muted-color leading-6">{{ subtitle() }}</p>
      }
    </div>
    <div class="flex w-full flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto empty:hidden">
      <ng-content />
    </div>
  `,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly subtitle = input<string>('');
}

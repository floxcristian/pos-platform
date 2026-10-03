import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pos-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-4 mb-6' },
  template: `
    <div class="w-full sm:w-auto min-w-0 flex-1">
      @if (eyebrow()) {
        <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{{ eyebrow() }}</p>
      }
      <h1 class="text-3xl font-bold text-color leading-9">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="mt-2 max-w-4xl text-muted-color leading-6">{{ subtitle() }}</p>
      }
    </div>
    <div class="flex flex-wrap items-center gap-2 empty:hidden"><ng-content /></div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly subtitle = input<string>('');
}

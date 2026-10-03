import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DuotoneIconComponent, type DuotoneIconName } from './duotone-icon.component';

/** Compact empty state for an existing table, panel or tab. */
@Component({
  selector: 'pos-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DuotoneIconComponent],
  host: { class: 'flex flex-col items-center gap-4 px-4 py-8 text-center' },
  template: `
    <pos-duotone-icon [name]="icon()" [size]="40" class="text-primary" />
    <div class="min-w-0 max-w-sm space-y-1">
      @if (headingLevel() === 2) {
        <h2 class="break-words text-balance text-base font-medium leading-6 text-color">{{ heading() }}</h2>
      } @else {
        <h3 class="break-words text-balance text-base font-medium leading-6 text-color">{{ heading() }}</h3>
      }
      @if (description()) {
        <p class="break-words text-pretty text-base leading-6 text-muted-color">{{ description() }}</p>
      }
    </div>
    <div class="flex flex-wrap justify-center gap-2 empty:hidden"><ng-content /></div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<DuotoneIconName>('funnel');
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly headingLevel = input<2 | 3>(2);
}

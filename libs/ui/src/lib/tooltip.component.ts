import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/** One presentation for template directives and PrimeNG's public PT event slots. */
@Component({
  selector: 'pos-tooltip-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pos-tooltip',
    role: 'tooltip',
    '[attr.id]': 'tooltipId()',
    '[attr.data-position]': 'position()',
    '(mouseenter)': 'entered.emit()',
    '(mouseleave)': 'left.emit()',
  },
  template: `<span class="pos-tooltip-arrow" aria-hidden="true"></span>{{ text() }}`,
})
export class TooltipComponent {
  readonly tooltipId = input.required<string>();
  readonly text = input.required<string>();
  readonly position = input<TooltipPosition>('top');
  readonly entered = output<void>();
  readonly left = output<void>();
}

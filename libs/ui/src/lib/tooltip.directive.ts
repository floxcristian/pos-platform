import { DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { TooltipPosition } from './tooltip.component';
import { TooltipService } from './tooltip.service';

/** Empty value reuses the control's aria-label instead of duplicating action text. */
@Directive({
  selector: '[posTooltip]',
  standalone: true,
  host: {
    '(mouseenter)': 'enter("hover")',
    '(mouseleave)': 'leave("hover")',
    '(focusin)': 'enter("focus")',
    '(focusout)': 'leave("focus")',
    '(click)': 'dismiss()',
  },
})
export class PosTooltipDirective {
  readonly posTooltip = input('');
  readonly posTooltipPosition = input<TooltipPosition>('top');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly tooltip = inject(TooltipService);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.tooltip.destroyOwner(this));
  }

  enter(channel: 'hover' | 'focus'): void {
    this.tooltip.enter(this, this.host, channel, this.posTooltip(), this.posTooltipPosition());
  }

  leave(channel: 'hover' | 'focus'): void {
    this.tooltip.leave(this, this.host, channel);
  }

  dismiss(): void {
    this.tooltip.dismissOwner(this);
  }
}

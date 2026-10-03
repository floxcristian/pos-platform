import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DUOTONE_ICONS, type DuotoneIconName } from './duotone-icons';

export type { DuotoneIconName } from './duotone-icons';

/** Decorative illustration. Its adjacent text supplies the accessible name. */
@Component({
  selector: 'pos-duotone-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      vertical-align: middle;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  template: `
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path [attr.d]="paths().secondary" opacity="0.4" />
      <path [attr.d]="paths().primary" />
    </svg>
  `,
})
export class DuotoneIconComponent {
  readonly name = input.required<DuotoneIconName>();
  readonly size = input<24 | 28 | 32 | 40 | 48>(32);
  protected readonly paths = computed(() => DUOTONE_ICONS[this.name()]);
}

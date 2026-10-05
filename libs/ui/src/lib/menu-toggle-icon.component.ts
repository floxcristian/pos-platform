import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Decorative menu glyph; the owning button supplies its label and expanded state. */
@Component({
  selector: 'pos-menu-toggle-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.is-expanded]': 'expanded()',
  },
  styleUrl: './menu-toggle-icon.component.css',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path class="bar" d="M3.75 6H20.25M3.75 18H20.25" vector-effect="non-scaling-stroke" />
      <path class="bar bar-middle" d="M3.75 12H20.25" vector-effect="non-scaling-stroke" />
      <path class="chevron" d="m20.25 8.25-3.75 3.75 3.75 3.75" />
    </svg>
  `,
})
export class MenuToggleIconComponent {
  readonly expanded = input(false);
}

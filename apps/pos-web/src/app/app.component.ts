import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { createToastTooltipPassThrough } from '@corporate-pos/ui';

@Component({
  selector: 'pos-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `
    <router-outlet />
    <p-toast
      position="bottom-right"
      [pt]="toastTooltip"
      [breakpoints]="{ '640px': { width: 'calc(100% - 2rem)', right: '1rem' } }"
    />
    <p-confirmdialog [draggable]="false" [style]="{ width: '30rem' }" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // Local PT reaches each ToastItem; the closeButton section resolves its own owner.
  readonly toastTooltip = createToastTooltipPassThrough();
}

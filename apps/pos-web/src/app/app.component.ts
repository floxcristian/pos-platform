import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'pos-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template:
    "<router-outlet /><p-toast position=\"bottom-right\" [breakpoints]=\"{'640px': {width: 'calc(100% - 2rem)', right: '1rem'}}\" /><p-confirmdialog [style]=\"{width: '30rem'}\" />",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}

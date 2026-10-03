import { inject, Injectable } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import type { Result } from '@corporate-pos/domain';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly messages = inject(MessageService);
  private readonly confirmations = inject(ConfirmationService);
  result(result: Result<unknown>, message = 'Cambios guardados'): boolean {
    this.messages.add(
      result.ok
        ? { severity: 'success', summary: message, life: 3500 }
        : { severity: 'error', summary: 'No se pudo completar', detail: result.error, life: 7000 },
    );
    return result.ok;
  }
  info(summary: string, detail?: string): void {
    this.messages.add({ severity: 'info', summary, detail, life: 5000 });
  }
  confirm(message: string, accept: () => void, header = 'Confirmar cambio', reject?: () => void): void {
    this.confirmations.confirm({
      message,
      header,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Confirmar',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept,
      reject,
    });
  }
}

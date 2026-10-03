import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';
const STATES: Record<string, { label: string; severity: Severity }> = {
  active: { label: 'Activo', severity: 'success' },
  enabled: { label: 'Habilitado', severity: 'success' },
  disabled: { label: 'Deshabilitado', severity: 'secondary' },
  inactive: { label: 'Inactivo', severity: 'secondary' },
  online: { label: 'Con conexión', severity: 'success' },
  offline: { label: 'Sin conexión', severity: 'warn' },
  completed: { label: 'Completado', severity: 'success' },
  success: { label: 'Correcto', severity: 'success' },
  paid: { label: 'Pagado', severity: 'success' },
  approved: { label: 'Aprobado', severity: 'success' },
  in_payment: { label: 'En pago', severity: 'info' },
  confirmed: { label: 'Confirmado', severity: 'success' },
  ready: { label: 'Listo', severity: 'success' },
  connected: { label: 'Conectado', severity: 'success' },
  sent: { label: 'Entregado', severity: 'success' },
  partial: { label: 'Abono parcial', severity: 'warn' },
  overdue: { label: 'Vencido', severity: 'danger' },
  idle: { label: 'En espera', severity: 'secondary' },
  available: { label: 'Disponible', severity: 'info' },
  downloaded: { label: 'Descargado', severity: 'info' },
  current: { label: 'Al día', severity: 'success' },
  partially_returned: { label: 'Devolución parcial', severity: 'warn' },
  returned: { label: 'Devuelto', severity: 'secondary' },
  accepted: { label: 'Aceptado', severity: 'success' },
  emitted: { label: 'Emitido', severity: 'success' },
  issued: { label: 'Emitido', severity: 'success' },
  synced: { label: 'Sincronizado', severity: 'success' },
  pending: { label: 'Pendiente', severity: 'warn' },
  queued: { label: 'En cola', severity: 'warn' },
  running: { label: 'En ejecución', severity: 'info' },
  processing: { label: 'Procesando', severity: 'info' },
  open: { label: 'Abierto', severity: 'success' },
  closed: { label: 'Cerrado', severity: 'secondary' },
  draft: { label: 'Borrador', severity: 'secondary' },
  paused: { label: 'Pausado', severity: 'secondary' },
  failed: { label: 'Fallido', severity: 'danger' },
  error: { label: 'Error', severity: 'danger' },
  rejected: { label: 'Rechazado', severity: 'danger' },
  blocked: { label: 'Bloqueado', severity: 'danger' },
  unknown: { label: 'Por conciliar', severity: 'warn' },
  warning: { label: 'Atención', severity: 'warn' },
  canceled: { label: 'Anulado', severity: 'secondary' },
  cancelled: { label: 'Anulado', severity: 'secondary' },
  info: { label: 'Información', severity: 'info' },
  retry: { label: 'Reintento pendiente', severity: 'warn' },
};

@Component({
  selector: 'pos-status-tag',
  standalone: true,
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [value]="displayLabel()" [severity]="severity()" />`,
})
export class StatusTagComponent {
  readonly value = input<string>('');
  readonly label = input<string>('');
  readonly displayLabel = computed(() => this.label() || STATES[this.value()]?.label || this.value());
  readonly severity = computed<Severity>(() => STATES[this.value()]?.severity ?? 'secondary');
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import type { SyncJob, SyncSchedule } from '@corporate-pos/domain';
import {
  CivilDateTimeComponent,
  PageHeaderComponent,
  StatusTagComponent,
  MetricCardComponent,
  dateTime,
  downloadCsv,
} from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-sync-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CivilDateTimeComponent,
    FormsModule,
    ButtonModule,
    TableModule,
    SelectButtonModule,
    SelectModule,
    MultiSelectModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    ToggleSwitchModule,
    ProgressBarModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    MetricCardComponent,
  ],
  template: ` <div class="pos-section">
      <pos-page-header
        eyebrow="Control"
        title="Centro de sincronización"
        subtitle="Controla qué información viaja, cuándo se ejecuta y qué queda pendiente."
      >
        <p-button
          ariaLabel="Ejecutar flujos habilitados"
          label="Ejecutar flujos habilitados"
          icon="pi pi-sync"
          [loading]="runningAll()"
          [disabled]="!store.snapshot().online"
          (onClick)="runAll()"
        />
      </pos-page-header>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <pos-metric-card
          title="Flujos"
          [value]="'' + store.snapshot().syncJobs.length"
          detail="Subidas y bajadas independientes"
          icon="pi pi-arrow-right-arrow-left"
        />
        <pos-metric-card
          title="Programados"
          [value]="'' + scheduled()"
          detail="Horario de Santiago de Chile"
          icon="pi pi-clock"
        />
        <pos-metric-card
          title="Eventos pendientes"
          [value]="'' + pending()"
          detail="Conservan su identificador al reintentar"
          icon="pi pi-inbox"
        />
        <pos-metric-card
          title="Requieren atención"
          [value]="'' + failed()"
          detail="Revisa el error antes de reintentar"
          icon="pi pi-exclamation-circle"
        />
      </div>
      @if (!store.snapshot().online) {
        <p-message severity="warn"
          >La caja está sin conexión simulada. Los datos permanecen guardados y los envíos se reanudan al
          conectar.</p-message
        >
      }
      <div class="pos-filter">
        <div class="pos-segments">
          <p-selectbutton
            [options]="tabs"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="tab"
            [allowEmpty]="false"
            ariaLabel="Vistas de sincronización"
          />
        </div>
      </div>
      @if (tab === 'flows') {
        <div class="pos-filter">
          <label for="sync-direction" class="font-medium">Dirección</label
          ><p-select
            ariaLabel="Dirección"
            inputId="sync-direction"
            [options]="directions"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="direction"
          /><span class="text-muted-color text-sm"
            >La programación mock se ejecuta mientras esta aplicación permanece abierta.</span
          >
        </div>
        <div class="pos-panel overflow-hidden">
          <p-table
            [value]="jobs()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25]"
            [tableStyle]="{ 'min-width': '62rem' }"
            dataKey="id"
          >
            <ng-template #header
              ><tr>
                <th>Flujo</th>
                <th>Estado</th>
                <th>Programación</th>
                <th>Última ejecución</th>
                <th>Acciones</th>
              </tr></ng-template
            >
            <ng-template #body let-job
              ><tr>
                <td>
                  <div class="font-semibold">{{ job.name }}</div>
                  <div class="text-xs text-muted-color mt-1">
                    {{ job.direction === 'inbound' ? 'Central → sucursal' : 'Sucursal → central' }} ·
                    {{ job.entities }}
                  </div>
                </td>
                <td>
                  <pos-status-tag [value]="job.status" />
                  @if (job.status === 'running') {
                    <p-progressbar [value]="job.progress" class="block mt-2 w-32" />
                  }
                </td>
                <td>
                  <div>{{ scheduleLabel(job) }}</div>
                  <small class="text-muted-color">Próxima: {{ dateTime(job.nextRun) }}</small>
                </td>
                <td>
                  <div>{{ dateTime(job.lastRun) }}</div>
                  @if (job.lastError) {
                    <small class="text-red-700 dark:text-red-300">{{ job.lastError }}</small>
                  }
                </td>
                <td>
                  <div class="flex gap-2">
                    <p-button
                      icon="pi pi-play"
                      severity="secondary"
                      [ariaLabel]="'Ejecutar ' + job.name"
                      [disabled]="!store.snapshot().online || job.status === 'running'"
                      (onClick)="run(job)"
                    /><p-button
                      ariaLabel="Programar"
                      icon="pi pi-calendar-clock"
                      label="Programar"
                      severity="secondary"
                      (onClick)="edit(job)"
                    />
                  </div>
                </td></tr
            ></ng-template>
            <ng-template #emptymessage
              ><tr>
                <td colspan="5" class="pos-empty">No hay flujos para esta dirección.</td>
              </tr></ng-template
            >
          </p-table>
        </div>
      }
      @if (tab === 'outbox') {
        <div class="pos-panel p-5">
          <h2 class="font-semibold text-lg">Cola de salida</h2>
          <p class="text-muted-color mt-1">
            ERP y fiscalidad se confirman por separado. Reintentar un evento no vuelve a cobrar al cliente.
          </p>
        </div>
        <div class="pos-panel overflow-hidden">
          <p-table
            [value]="store.snapshot().outbox"
            [paginator]="true"
            [rows]="10"
            [tableStyle]="{ 'min-width': '58rem' }"
            ><ng-template #header
              ><tr>
                <th>Evento / operación</th>
                <th>Destino</th>
                <th>Estado</th>
                <th>Intentos</th>
                <th>Creado</th>
                <th>Acción</th>
              </tr></ng-template
            ><ng-template #body let-event
              ><tr>
                <td>
                  <span class="font-medium">{{ event.type }}</span>
                  <div class="text-xs text-muted-color font-mono mt-1">{{ event.aggregateId }}</div>
                </td>
                <td>{{ event.target === 'erp' ? 'Dynamics AX' : 'Proveedor DTE' }}</td>
                <td>
                  <pos-status-tag [value]="event.status" />
                  @if (event.lastError) {
                    <p class="text-xs mt-1 text-red-700 dark:text-red-300">{{ event.lastError }}</p>
                  }
                </td>
                <td>{{ event.attempts }}</td>
                <td>{{ dateTime(event.createdAt) }}</td>
                <td>
                  <p-button
                    ariaLabel="Reintentar"
                    label="Reintentar"
                    icon="pi pi-refresh"
                    severity="secondary"
                    [disabled]="
                      event.status === 'sent' || event.status === 'processing' || !store.snapshot().online
                    "
                    (onClick)="retry(event.id)"
                  />
                </td></tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="6" class="pos-empty">
                  No hay eventos pendientes. Las nuevas operaciones aparecerán aquí.
                </td>
              </tr></ng-template
            ></p-table
          >
        </div>
      }
      @if (tab === 'history') {
        <div class="flex justify-end">
          <p-button
            ariaLabel="Exportar historial"
            label="Exportar historial"
            icon="pi pi-download"
            severity="secondary"
            (onClick)="exportHistory()"
          />
        </div>
        <div class="pos-panel overflow-hidden">
          <p-table
            [value]="store.snapshot().syncRuns"
            [paginator]="true"
            [rows]="10"
            [tableStyle]="{ 'min-width': '50rem' }"
            ><ng-template #header
              ><tr>
                <th>Flujo</th>
                <th>Inicio</th>
                <th>Origen</th>
                <th>Registros</th>
                <th>Resultado</th>
              </tr></ng-template
            ><ng-template #body let-run
              ><tr>
                <td>{{ jobName(run.jobId) }}</td>
                <td>{{ dateTime(run.startedAt) }}</td>
                <td>{{ run.trigger === 'manual' ? 'Manual' : 'Programado' }}</td>
                <td>{{ run.records }}</td>
                <td>
                  <pos-status-tag [value]="run.status" />
                  @if (run.error) {
                    <p class="text-xs mt-1 text-red-700 dark:text-red-300">{{ run.error }}</p>
                  }
                </td>
              </tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="5" class="pos-empty">Ejecuta un flujo para ver su historial.</td>
              </tr></ng-template
            ></p-table
          >
        </div>
      }
    </div>
    <p-dialog
      header="Programar sincronización"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '38rem' }"
    >
      @if (selected) {
        <div class="pos-section">
          <div>
            <h3 class="font-semibold">{{ selected.name }}</h3>
            <p class="text-muted-color mt-1">{{ selected.description }}</p>
          </div>
          <div class="flex items-center justify-between">
            <label for="schedule-enabled">Habilitar sincronizador</label
            ><p-toggleswitch inputId="schedule-enabled" [(ngModel)]="schedule.enabled" />
          </div>
          <div class="pos-field">
            <label for="schedule-mode">Frecuencia</label
            ><p-select
              ariaLabel="Frecuencia"
              inputId="schedule-mode"
              [options]="modes"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="schedule.mode"
              appendTo="body"
            />
          </div>
          @if (schedule.mode === 'interval') {
            <div class="pos-field">
              <label for="schedule-interval">Cada cuántos minutos</label
              ><p-inputnumber
                inputId="schedule-interval"
                [(ngModel)]="schedule.intervalMinutes"
                [min]="1"
                [max]="1440"
                [showButtons]="true"
              />
            </div>
          }
          @if (schedule.mode === 'daily') {
            <div class="pos-field">
              <label for="schedule-time">Hora local</label
              ><pos-civil-date-time
                inputId="schedule-time"
                ariaLabel="Hora local"
                mode="time"
                [(ngModel)]="schedule.time"
              />
            </div>
          }
          @if (schedule.mode !== 'manual') {
            <div class="pos-field">
              <label for="schedule-days">Días de ejecución</label
              ><p-multiselect
                ariaLabel="Días de ejecución"
                inputId="schedule-days"
                [options]="days"
                optionLabel="label"
                optionValue="value"
                [(ngModel)]="schedule.weekdays"
                appendTo="body"
              /><small>Zona horaria: America/Santiago. Se conserva al cerrar y abrir la aplicación.</small>
            </div>
          }
          <div class="flex items-center justify-between gap-4 border-t border-surface pt-4">
            <div>
              <label for="schedule-failure">Simular fallo en la próxima ejecución</label
              ><small class="block text-muted-color mt-1"
                >Permite probar el diagnóstico y el reintento.</small
              >
            </div>
            <p-toggleswitch inputId="schedule-failure" [(ngModel)]="failNext" />
          </div>
        </div>
      }
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          (onClick)="dialog = false" /><p-button
          ariaLabel="Guardar programación"
          label="Guardar programación"
          icon="pi pi-check"
          (onClick)="save()"
      /></ng-template>
    </p-dialog>`,
})
export class SyncCenterComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly dateTime = (value: string | null): string => (value ? dateTime(value) : '—');
  readonly runningAll = signal(false);
  readonly pending = computed(() => this.store.snapshot().outbox.filter((e) => e.status !== 'sent').length);
  readonly failed = computed(
    () => this.store.snapshot().syncJobs.filter((j) => j.status === 'failed').length,
  );
  readonly scheduled = computed(
    () =>
      this.store.snapshot().syncJobs.filter((j) => j.schedule.enabled && j.schedule.mode !== 'manual').length,
  );
  readonly tabs = [
    { label: 'Sincronizadores', value: 'flows' },
    { label: 'Cola de salida', value: 'outbox' },
    { label: 'Historial', value: 'history' },
  ];
  readonly directions = [
    { label: 'Todas', value: 'all' },
    { label: 'Bajada a sucursal', value: 'inbound' },
    { label: 'Subida a central', value: 'outbound' },
  ];
  readonly modes = [
    { label: 'Solo manual', value: 'manual' },
    { label: 'Por intervalo', value: 'interval' },
    { label: 'Una vez al día', value: 'daily' },
  ];
  readonly days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(
    (label, value) => ({ label, value }),
  );
  tab = 'flows';
  direction = 'all';
  dialog = false;
  selected: SyncJob | null = null;
  failNext = false;
  schedule: SyncSchedule = {
    enabled: true,
    mode: 'manual',
    intervalMinutes: 15,
    time: '08:00',
    weekdays: [1, 2, 3, 4, 5, 6],
    timezone: 'America/Santiago',
  };
  jobs(): SyncJob[] {
    return this.store
      .snapshot()
      .syncJobs.filter((j) => this.direction === 'all' || j.direction === this.direction);
  }
  jobName(id: string): string {
    return this.store.snapshot().syncJobs.find((j) => j.id === id)?.name ?? id;
  }
  scheduleLabel(job: SyncJob): string {
    return !job.schedule.enabled
      ? 'Deshabilitado'
      : job.schedule.mode === 'manual'
        ? 'Manual'
        : job.schedule.mode === 'daily'
          ? 'Diario · ' + job.schedule.time
          : 'Cada ' + job.schedule.intervalMinutes + ' min';
  }
  edit(job: SyncJob): void {
    this.selected = job;
    this.schedule = structuredClone(job.schedule);
    this.failNext = job.failNext;
    this.dialog = true;
  }
  save(): void {
    if (
      this.selected &&
      this.feedback.result(
        this.store.updateSyncJob(this.selected.id, { schedule: this.schedule, failNext: this.failNext }),
        'Programación guardada',
      )
    )
      this.dialog = false;
  }
  async run(job: SyncJob): Promise<void> {
    this.feedback.result(await this.store.runSync(job.id), 'Sincronización finalizada');
  }
  async runAll(): Promise<void> {
    this.runningAll.set(true);
    try {
      for (const job of this.store
        .snapshot()
        .syncJobs.filter((j) => j.schedule.enabled && j.status !== 'running')) {
        const result = await this.store.runSync(job.id);
        if (!result.ok) this.feedback.result(result);
      }
      this.feedback.info('Ejecución terminada', 'Revisa el historial de cada sincronizador.');
    } finally {
      this.runningAll.set(false);
    }
  }
  async retry(id: string): Promise<void> {
    this.feedback.result(await this.store.retryOutbox(id), 'Evento procesado');
  }
  exportHistory(): void {
    downloadCsv('sincronizaciones.csv', [
      ['Flujo', 'Inicio', 'Fin', 'Origen', 'Registros', 'Estado', 'Error'],
      ...this.store
        .snapshot()
        .syncRuns.map((r) => [
          this.jobName(r.jobId),
          r.startedAt,
          r.finishedAt ?? '',
          r.trigger,
          r.records,
          r.status,
          r.error ?? '',
        ]),
    ]);
  }
}

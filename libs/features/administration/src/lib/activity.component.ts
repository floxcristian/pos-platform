import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DrawerModule } from 'primeng/drawer';
import { PosStore } from '@corporate-pos/data-access';
import type { LogEntry, AuditEntry } from '@corporate-pos/domain';
import {
  PosTooltipDirective,
  EmptyStateComponent,
  PageHeaderComponent,
  StatusTagComponent,
  MetricCardComponent,
  dateTime,
  downloadCsv,
} from '@corporate-pos/ui';

@Component({
  selector: 'pos-activity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PosTooltipDirective,
    FormsModule,
    ButtonModule,
    TableModule,
    SelectButtonModule,
    SelectModule,
    InputTextModule,
    DrawerModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusTagComponent,
    MetricCardComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Control"
        heading="Actividad y auditoría"
        subtitle="Sigue los eventos de operación y los cambios administrativos."
        ><p-button
          ariaLabel="Exportar vista"
          label="Exportar vista"
          icon="pos-icon pos-icon-download-simple"
          severity="secondary"
          (onClick)="export()" /><p-button
          ariaLabel="Descargar diagnóstico"
          label="Descargar diagnóstico"
          icon="pos-icon pos-icon-file-arrow-up"
          severity="secondary"
          (onClick)="diagnostics()"
      /></pos-page-header>
      <div class="grid gap-4 sm:grid-cols-3">
        <pos-metric-card
          heading="Eventos registrados"
          [value]="store.snapshot().logs.length"
          icon="list-bullets"
          detail="Actividad del entorno mock"
        /><pos-metric-card
          heading="Errores"
          [value]="errors()"
          icon="warning-circle"
          detail="Con mensaje y correlación"
        /><pos-metric-card
          heading="Cambios auditados"
          [value]="store.snapshot().audit.length"
          icon="shield-check"
          detail="Actor, acción y entidad"
        />
      </div>
      <div class="pos-filter">
        <div class="pos-segments">
          <p-selectbutton
            [options]="tabs"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="tab"
            [allowEmpty]="false"
            ariaLabel="Registro de actividad"
          />
        </div>
        <div class="flex-1"></div>
        @if (tab === 'logs') {
          <label class="sr-only" for="log-level">Nivel</label
          ><p-select
            ariaLabel="Nivel"
            inputId="log-level"
            [options]="levels"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="level"
          />
        }
        <label class="sr-only" for="log-search">Buscar mensaje, actor o correlación</label
        ><input
          pInputText
          id="log-search"
          [(ngModel)]="search"
          placeholder="Mensaje, actor o correlación…"
          class="w-full sm:w-72"
        />
      </div>
      @if (tab === 'logs') {
        <div class="pos-panel overflow-hidden">
          <p-table
            tableStyleClass="pos-table"
            [value]="logs()"
            [paginator]="true"
            [rows]="15"
            [tableStyle]="{ 'min-width': '58rem' }"
            ><ng-template #header
              ><tr>
                <th>Fecha</th>
                <th>Nivel</th>
                <th>Origen</th>
                <th>Mensaje</th>
                <th>Detalle</th>
              </tr></ng-template
            ><ng-template #body let-log
              ><tr>
                <td class="whitespace-nowrap">{{ dateTime(log.createdAt) }}</td>
                <td><pos-status-tag [value]="log.level" /></td>
                <td>{{ log.source }}</td>
                <td class="max-w-xl">{{ log.message }}</td>
                <td>
                  <p-button
                    posTooltip
                    posTooltipPosition="left"
                    icon="pos-icon pos-icon-magnifying-glass"
                    [text]="true"
                    severity="secondary"
                    [ariaLabel]="'Detalle del evento ' + log.id"
                    (onClick)="openLog(log)"
                  />
                </td></tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="5">
                  <pos-empty-state
                    heading="No hay eventos que coincidan con tus filtros."
                    description="Prueba con otro nivel o término de búsqueda."
                  />
                </td></tr></ng-template
          ></p-table>
        </div>
      }
      @if (tab === 'audit') {
        <div class="pos-panel overflow-hidden">
          <p-table
            tableStyleClass="pos-table"
            [value]="audit()"
            [paginator]="true"
            [rows]="15"
            [tableStyle]="{ 'min-width': '58rem' }"
            ><ng-template #header
              ><tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Cambio</th>
              </tr></ng-template
            ><ng-template #body let-entry
              ><tr>
                <td class="whitespace-nowrap">{{ dateTime(entry.createdAt) }}</td>
                <td>
                  {{ entry.actor }}<small class="block text-muted-color">{{ entry.role }}</small>
                </td>
                <td class="font-medium">{{ entry.action }}</td>
                <td class="font-mono text-xs">{{ entry.entity }}</td>
                <td class="max-w-xl">{{ entry.detail }}</td>
              </tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="5">
                  <pos-empty-state
                    icon="list-checks"
                    heading="Sin cambios para mostrar"
                    description="Los cambios de configuración y operaciones aparecerán aquí."
                  />
                </td></tr></ng-template
          ></p-table>
        </div>
      }
    </div>
    <p-drawer
      [(visible)]="drawer"
      position="right"
      header="Detalle del evento"
      [style]="{ width: 'min(34rem,100vw)' }"
    >
      @if (selected) {
        <div class="pos-section">
          <pos-status-tag [value]="selected.level" />
          <h2 class="text-xl font-semibold leading-8">{{ selected.message }}</h2>
          <dl class="grid grid-cols-[7rem_1fr] gap-4 text-sm">
            <dt class="text-muted-color">Fecha</dt>
            <dd>{{ dateTime(selected.createdAt) }}</dd>
            <dt class="text-muted-color">Origen</dt>
            <dd>{{ selected.source }}</dd>
            <dt class="text-muted-color">ID</dt>
            <dd class="font-mono break-all">{{ selected.id }}</dd>
            <dt class="text-muted-color">Correlación</dt>
            <dd class="font-mono break-all">{{ selected.correlationId }}</dd>
          </dl>
          @if (selected.correlationId) {
            <p-button
              ariaLabel="Ver eventos relacionados"
              label="Ver eventos relacionados"
              icon="pos-icon pos-icon-funnel"
              severity="secondary"
              (onClick)="correlate()"
            />
          }
          <pre
            class="text-xs bg-surface-50 dark:bg-surface-900 p-4 rounded-lg whitespace-pre-wrap break-all"
            >{{ json(selected) }}</pre
          >
        </div>
      }
    </p-drawer>`,
})
export class ActivityComponent {
  readonly store = inject(PosStore);
  readonly dateTime = dateTime;
  readonly json = (value: unknown): string => JSON.stringify(value, null, 2);
  readonly tabs = [
    { label: 'Logs de operación', value: 'logs' },
    { label: 'Auditoría de cambios', value: 'audit' },
  ];
  readonly levels = [
    { label: 'Todos los niveles', value: 'all' },
    { label: 'Información', value: 'info' },
    { label: 'Advertencia', value: 'warning' },
    { label: 'Error', value: 'error' },
  ];
  tab = 'logs';
  level = 'all';
  search = '';
  drawer = false;
  selected: LogEntry | null = null;
  errors(): number {
    return this.store.snapshot().logs.filter((l) => l.level === 'error').length;
  }
  logs(): LogEntry[] {
    const q = this.search.toLowerCase();
    return this.store
      .snapshot()
      .logs.filter(
        (l) =>
          (this.level === 'all' || l.level === this.level) &&
          (l.message + ' ' + l.source + ' ' + l.correlationId).toLowerCase().includes(q),
      );
  }
  audit(): AuditEntry[] {
    const q = this.search.toLowerCase();
    return this.store
      .snapshot()
      .audit.filter((a) =>
        (a.actor + ' ' + a.action + ' ' + a.entity + ' ' + a.detail).toLowerCase().includes(q),
      );
  }
  openLog(log: LogEntry): void {
    this.selected = log;
    this.drawer = true;
  }
  correlate(): void {
    this.search = this.selected?.correlationId ?? '';
    this.drawer = false;
    this.level = 'all';
  }
  export(): void {
    if (this.tab === 'logs')
      downloadCsv('logs.csv', [
        ['Fecha', 'Nivel', 'Origen', 'Mensaje', 'Correlación'],
        ...this.logs().map((l) => [l.createdAt, l.level, l.source, l.message, l.correlationId]),
      ]);
    else
      downloadCsv('auditoria.csv', [
        ['Fecha', 'Actor', 'Rol', 'Acción', 'Entidad', 'Detalle'],
        ...this.audit().map((a) => [a.createdAt, a.actor, a.role, a.action, a.entity, a.detail]),
      ]);
  }
  diagnostics(): void {
    const s = this.store.snapshot();
    const payload = {
      generatedAt: new Date().toISOString(),
      environment: 'mock',
      version: s.update.currentVersion,
      schemaVersion: s.schemaVersion,
      online: s.online,
      counts: { sales: s.sales.length, queue: s.outbox.filter((e) => e.status !== 'sent').length },
      modules: s.modules.map((m) => ({ id: m.id, enabled: m.enabled })),
      sync: s.syncJobs.map((j) => ({ id: j.id, status: j.status, lastError: j.lastError })),
      devices: s.devices.map((d) => ({ type: d.type, status: d.status })),
      errors: s.logs
        .filter((l) => l.level === 'error')
        .map((l) => ({ source: l.source, createdAt: l.createdAt, message: l.message })),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagnostico-pos.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

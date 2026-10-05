import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import type { Device, Integration } from '@corporate-pos/domain';
import {
  DuotoneIconComponent,
  PageHeaderComponent,
  StatusTagComponent,
  dateTime,
  type DuotoneIconName,
} from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-devices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    PageHeaderComponent,
    StatusTagComponent,
    DuotoneIconComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Control"
        heading="Dispositivos de caja"
        subtitle="Impresión, terminal de pago, lectores y cajón. Pruebas simuladas sin hardware real."
      />
      <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (device of store.snapshot().devices; track device.id) {
          <article class="pos-panel p-6">
            <div class="flex justify-between items-start gap-3">
              <span
                class="rounded-xl bg-primary-50 dark:bg-primary-950 text-primary size-14 shrink-0 flex items-center justify-center"
                ><pos-duotone-icon [name]="icon(device.type)" [size]="32" /></span
              ><pos-status-tag [value]="device.enabled ? device.status : 'inactive'" />
            </div>
            <h2 class="text-xl font-semibold mt-5">{{ device.name }}</h2>
            <p class="text-sm text-muted-color mt-2 break-words">{{ device.connection }}</p>
            <p class="text-xs text-muted-color mt-4">Última prueba: {{ dateTime(device.lastTest) }}</p>
            <div class="border-t border-surface mt-5 pt-5 flex flex-wrap justify-between items-center gap-3">
              <div class="flex gap-3 items-center">
                <p-toggleswitch
                  [inputId]="'device-' + device.id"
                  [ngModel]="device.enabled"
                  (ngModelChange)="toggle(device, $event)"
                /><label [for]="'device-' + device.id" class="text-sm">Habilitado</label>
              </div>
              <p-button
                ariaLabel="Probar"
                label="Probar"
                icon="pos-icon pos-icon-lightning"
                severity="secondary"
                [loading]="busy() === device.id"
                [disabled]="!device.enabled"
                (onClick)="test(device)"
              />
            </div>
            @if (store.can('configure', 'devices')) {
              <p-button
                ariaLabel="Configurar"
                label="Configurar"
                icon="pos-icon pos-icon-gear"
                severity="secondary"
                styleClass="mt-3"
                (onClick)="configure(device)"
              />
            }
          </article>
        }
      </div>
      <div class="pos-panel p-5">
        <h2 class="font-semibold">Aplicaciones locales, con responsabilidad separada</h2>
        <p class="text-muted-color leading-7 mt-2">
          La impresora entrega una representación del documento. El proveedor fiscal emite el DTE. El terminal
          confirma el pago. Cada resultado se registra de forma independiente.
        </p>
      </div>
    </div>
    <p-dialog
      header="Configurar dispositivo"
      [visible]="!!editing()"
      (visibleChange)="!$event && editing.set(null)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }"
    >
      <form (ngSubmit)="save()" novalidate class="flex flex-col gap-5">
        <p class="text-sm text-muted-color">
          Describe el dispositivo de demostración y su conexión simulada. No ingreses direcciones de equipos
          reales.
        </p>
        <div class="pos-field">
          <label for="device-name">Nombre del dispositivo</label
          ><input
            pInputText
            id="device-name"
            name="deviceName"
            [(ngModel)]="draft.name"
            maxlength="100"
            required
            autocomplete="off"
          />
        </div>
        <div class="pos-field">
          <label for="device-connection">Descripción de conexión simulada</label
          ><input
            pInputText
            id="device-connection"
            name="deviceConnection"
            [(ngModel)]="draft.connection"
            maxlength="160"
            required
            autocomplete="off"
            placeholder="Ej. Impresora térmica USB de demostración"
          />
        </div>
        <div class="flex items-center justify-between gap-3">
          <label for="device-enabled">Dispositivo habilitado</label
          ><p-toggleswitch inputId="device-enabled" name="deviceEnabled" [(ngModel)]="draft.enabled" />
        </div>
        @if (error()) {
          <p role="alert" class="text-red-600 dark:text-red-400 text-sm">{{ error() }}</p>
        }
        <div class="flex justify-end gap-3 border-t border-surface pt-4">
          <p-button
            label="Cancelar"
            ariaLabel="Cancelar"
            severity="secondary"
            (onClick)="editing.set(null)"
          /><p-button
            type="submit"
            label="Guardar configuración"
            ariaLabel="Guardar configuración"
            icon="pos-icon pos-icon-check"
          />
        </div>
      </form>
    </p-dialog>`,
})
export class DevicesComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly busy = signal('');
  readonly editing = signal<Device | null>(null);
  readonly error = signal('');
  draft: Pick<Device, 'name' | 'connection' | 'enabled'> = { name: '', connection: '', enabled: true };
  readonly dateTime = (value: string | null): string => (value ? dateTime(value) : 'Sin pruebas');
  icon(type: Device['type']): DuotoneIconName {
    const icons: Record<Device['type'], DuotoneIconName> = {
      printer: 'printer',
      payment: 'credit-card',
      scanner: 'barcode',
      drawer: 'wallet',
      cheque: 'receipt',
    };
    return icons[type];
  }
  configure(device: Device): void {
    this.draft = { name: device.name, connection: device.connection, enabled: device.enabled };
    this.error.set('');
    this.editing.set(device);
  }
  save(): void {
    const device = this.editing();
    if (!device) return;
    const result = this.store.updateDevice(device.id, this.draft);
    if (this.feedback.result(result, 'Configuración del dispositivo guardada')) {
      this.error.set('');
      this.editing.set(null);
    } else if (!result.ok) this.error.set(result.error);
  }
  toggle(device: Device, enabled: boolean): void {
    this.feedback.result(
      this.store.setDevice(device.id, enabled),
      enabled ? 'Dispositivo habilitado' : 'Dispositivo deshabilitado',
    );
  }
  async test(device: Device): Promise<void> {
    this.busy.set(device.id);
    try {
      this.feedback.result(await this.store.testDevice(device.id), 'Prueba completada');
    } finally {
      this.busy.set('');
    }
  }
}

@Component({
  selector: 'pos-integrations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    DuotoneIconComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Administración"
        heading="Integraciones"
        subtitle="Adaptadores de la operación: ERP, fiscalidad y validación de pagos."
      />
      <p-message severity="info"
        >Todos los adaptadores están en modo mock. No se solicitan credenciales ni se conectan servicios
        corporativos.</p-message
      >
      <div class="grid gap-5 md:grid-cols-2">
        @for (integration of store.snapshot().integrations; track integration.id) {
          <article class="pos-panel p-6">
            <div class="flex justify-between items-start gap-3">
              <div class="flex gap-3 items-center min-w-0">
                <span
                  class="rounded-xl bg-primary-50 dark:bg-primary-950 text-primary w-12 h-12 shrink-0 flex items-center justify-center"
                  ><pos-duotone-icon [name]="icon(integration.kind)" [size]="28"
                /></span>
                <div class="min-w-0">
                  <h2 class="text-lg font-semibold">{{ integration.name }}</h2>
                  <p class="text-sm text-muted-color break-words">{{ integration.provider }}</p>
                </div>
              </div>
              <pos-status-tag [value]="integration.enabled ? integration.status : 'inactive'" />
            </div>
            <p class="text-muted-color leading-7 my-5">{{ description(integration.kind) }}</p>
            <p class="text-xs text-muted-color">Última prueba: {{ dateTime(integration.lastTest) }}</p>
            <div class="border-t border-surface mt-5 pt-5 flex flex-wrap justify-between items-center gap-3">
              <div class="flex gap-3 items-center">
                <p-toggleswitch
                  [inputId]="'integration-' + integration.id"
                  [ngModel]="integration.enabled"
                  (ngModelChange)="toggle(integration, $event)"
                /><label [for]="'integration-' + integration.id">Habilitada</label>
              </div>
              <p-button
                ariaLabel="Probar conexión"
                label="Probar conexión"
                icon="pos-icon pos-icon-link"
                severity="secondary"
                [loading]="busy() === integration.id"
                [disabled]="!integration.enabled"
                (onClick)="test(integration)"
              />
            </div>
            <p-button
              ariaLabel="Configurar"
              label="Configurar"
              icon="pos-icon pos-icon-gear"
              severity="secondary"
              styleClass="mt-3"
              (onClick)="configure(integration)"
            />
          </article>
        }
      </div>
    </div>
    <p-dialog
      header="Configurar integración"
      [visible]="!!editing()"
      (visibleChange)="!$event && editing.set(null)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }"
    >
      <form (ngSubmit)="save()" novalidate class="flex flex-col gap-5">
        <p class="text-sm text-muted-color">
          Estos nombres identifican al adaptador de demostración. La conexión permanece simulada y no necesita
          credenciales.
        </p>
        <div class="pos-field">
          <label for="integration-name">Nombre de la integración</label
          ><input
            pInputText
            id="integration-name"
            name="integrationName"
            [(ngModel)]="draft.name"
            maxlength="100"
            required
            autocomplete="off"
          />
        </div>
        <div class="pos-field">
          <label for="integration-provider">Proveedor de demostración</label
          ><input
            pInputText
            id="integration-provider"
            name="integrationProvider"
            [(ngModel)]="draft.provider"
            maxlength="100"
            required
            autocomplete="off"
          />
        </div>
        <div class="flex items-center justify-between gap-3">
          <label for="integration-enabled">Integración habilitada</label
          ><p-toggleswitch
            inputId="integration-enabled"
            name="integrationEnabled"
            [(ngModel)]="draft.enabled"
          />
        </div>
        @if (error()) {
          <p role="alert" class="text-red-600 dark:text-red-400 text-sm">{{ error() }}</p>
        }
        <div class="flex justify-end gap-3 border-t border-surface pt-4">
          <p-button
            label="Cancelar"
            ariaLabel="Cancelar"
            severity="secondary"
            (onClick)="editing.set(null)"
          /><p-button
            type="submit"
            label="Guardar configuración"
            ariaLabel="Guardar configuración"
            icon="pos-icon pos-icon-check"
          />
        </div>
      </form>
    </p-dialog>`,
})
export class IntegrationsComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly busy = signal('');
  readonly editing = signal<Integration | null>(null);
  readonly error = signal('');
  draft: Pick<Integration, 'name' | 'provider' | 'enabled'> = { name: '', provider: '', enabled: true };
  readonly dateTime = (value: string | null): string => (value ? dateTime(value) : 'Sin pruebas');
  icon(kind: Integration['kind']): DuotoneIconName {
    const icons: Record<Integration['kind'], DuotoneIconName> = {
      erp: 'bank',
      fiscal: 'seal-check',
      payments: 'credit-card',
      cheques: 'seal-check',
    };
    return icons[kind];
  }
  description(kind: Integration['kind']): string {
    return {
      erp: 'Recibe operaciones y confirma su registro en Dynamics AX. Una venta local puede tener el registro ERP pendiente.',
      fiscal:
        'Simula la emisión de boletas, facturas y notas de crédito. Conserva su propio estado y permite reintentar.',
      payments:
        'Simula autorización, rechazo y resultado desconocido del terminal. Un resultado desconocido se concilia antes de volver a operar.',
      cheques: 'Simula la validación de cheques con Orsan, el proveedor vigente en la operación de Chile.',
    }[kind];
  }
  configure(integration: Integration): void {
    this.draft = { name: integration.name, provider: integration.provider, enabled: integration.enabled };
    this.error.set('');
    this.editing.set(integration);
  }
  save(): void {
    const integration = this.editing();
    if (!integration) return;
    const result = this.store.updateIntegration(integration.id, this.draft);
    if (this.feedback.result(result, 'Configuración de la integración guardada')) {
      this.error.set('');
      this.editing.set(null);
    } else if (!result.ok) this.error.set(result.error);
  }
  toggle(integration: Integration, enabled: boolean): void {
    this.feedback.result(
      this.store.setIntegration(integration.id, enabled),
      enabled ? 'Integración habilitada' : 'Integración deshabilitada',
    );
  }
  async test(integration: Integration): Promise<void> {
    this.busy.set(integration.id);
    try {
      this.feedback.result(await this.store.testIntegration(integration.id), 'Conexión simulada verificada');
    } finally {
      this.busy.set('');
    }
  }
}

@Component({
  selector: 'pos-updates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, ProgressBarModule, MessageModule, PageHeaderComponent, StatusTagComponent],
  template: `<div class="pos-section">
    <pos-page-header
      eyebrow="Administración"
      heading="Actualizaciones"
      subtitle="Control de versión de la caja de escritorio y despliegue por etapas."
    />
    <section class="pos-panel p-6 max-w-4xl">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span class="text-muted-color text-sm">Versión de esta caja</span>
          <h2 class="text-4xl font-semibold mt-2">{{ store.snapshot().update.currentVersion }}</h2>
          <p class="text-sm text-muted-color mt-3">Canal estable · Windows · Tauri 2</p>
        </div>
        <pos-status-tag [value]="store.snapshot().update.status" />
      </div>
      <div class="border-t border-surface mt-6 pt-6">
        <h3 class="font-semibold text-lg">
          {{
            store.snapshot().update.status === 'current'
              ? 'La caja está actualizada'
              : 'Versión ' + store.snapshot().update.availableVersion + ' disponible'
          }}
        </h3>
        <p class="text-muted-color mt-2">
          Última comprobación: {{ dateTime(store.snapshot().update.checkedAt) }}
        </p>
        @if (busy()) {
          <p-progressbar mode="indeterminate" class="block mt-5" [style]="{ height: '6px' }" />
        }
      </div>
      <div class="flex flex-wrap justify-end gap-3 mt-6">
        <p-button
          ariaLabel="Buscar actualizaciones"
          label="Buscar actualizaciones"
          icon="pos-icon pos-icon-arrow-clockwise"
          severity="secondary"
          [loading]="busy()"
          (onClick)="check()"
        />
        @if (store.snapshot().update.status === 'available') {
          <p-button
            ariaLabel="Descargar actualización"
            label="Descargar actualización"
            icon="pos-icon pos-icon-download-simple"
            [disabled]="busy()"
            (onClick)="download()"
          />
        }
        @if (store.snapshot().update.status === 'downloaded') {
          <p-button
            ariaLabel="Aplicar actualización"
            label="Aplicar actualización"
            icon="pos-icon pos-icon-check"
            [disabled]="busy()"
            (onClick)="apply()"
          />
        }
      </div>
    </section>
    <div class="pos-panel p-6 max-w-4xl">
      <h2 class="text-lg font-semibold mb-4">Notas de la versión de demostración</h2>
      <ul class="space-y-3 text-muted-color list-disc pl-5">
        <li>Sincronizadores con horario y reintentos sin duplicar operaciones.</li>
        <li>Permisos por perfil y módulos configurables.</li>
        <li>Conciliación separada del pago, DTE y ERP.</li>
        <li>Reporte de cierre y auditoría de cambios.</li>
      </ul>
      <p-message severity="info" class="block mt-6"
        >Este recorrido simula la descarga y aplicación. La distribución real requiere firma de binarios,
        manifiesto de actualización y política de despliegue.</p-message
      >
    </div>
  </div>`,
})
export class UpdatesComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly busy = signal(false);
  readonly dateTime = (value: string | null): string => (value ? dateTime(value) : 'Sin comprobar');
  async check(): Promise<void> {
    this.busy.set(true);
    try {
      this.feedback.result(await this.store.checkUpdate(), 'Comprobación terminada');
    } finally {
      this.busy.set(false);
    }
  }
  async download(): Promise<void> {
    this.busy.set(true);
    try {
      this.feedback.result(await this.store.downloadUpdate(), 'Actualización descargada (mock)');
    } finally {
      this.busy.set(false);
    }
  }
  apply(): void {
    this.feedback.confirm(
      'La demo cambiará la versión registrada. No se instalará software ni se reiniciará el equipo.',
      () => {
        this.feedback.result(this.store.applyUpdate(), 'Versión actualizada en la demo');
      },
      'Aplicar actualización simulada',
    );
  }
}

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import type { FeatureModule, PosSettings } from '@corporate-pos/domain';
import { PageHeaderComponent, StatusTagComponent } from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
    TextareaModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: `<div class="pos-section">
    <pos-page-header
      eyebrow="Administración"
      heading="Módulos y configuración"
      subtitle="Activa capacidades y define las políticas de esta empresa y sucursal."
    />
    <div class="pos-filter">
      <div class="pos-segments">
        <p-selectbutton
          [options]="tabs"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="tab"
          [allowEmpty]="false"
          ariaLabel="Configuración"
        />
      </div>
    </div>
    @if (tab === 'modules') {
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-muted-color">
          Los cambios se aplican al menú, las rutas y las operaciones. El historial se conserva.
        </p>
        <pos-status-tag value="active" [label]="enabledCount() + ' módulos habilitados'" />
      </div>
      @for (category of categories; track category.id) {
        <section>
          <h2 class="font-semibold text-lg mb-3">{{ category.label }}</h2>
          <div class="grid gap-3 lg:grid-cols-2">
            @for (module of modules(category.id); track module.id) {
              <div class="pos-panel p-5 flex items-center justify-between gap-5">
                <div>
                  <label class="font-semibold cursor-pointer" [for]="'module-' + module.id">{{
                    module.name
                  }}</label>
                  <p class="text-sm text-muted-color mt-1 leading-6">{{ module.description }}</p>
                </div>
                <p-toggleswitch
                  [inputId]="'module-' + module.id"
                  [ngModel]="moduleValues()[module.id]"
                  (ngModelChange)="toggle(module, $event)"
                />
              </div>
            }
          </div>
        </section>
      }
    }
    @if (tab === 'policies') {
      <section class="pos-panel pos-form-panel p-6 max-w-4xl">
        <h2 class="font-semibold text-lg mb-5">Políticas de operación</h2>
        <div class="pos-form-grid">
          <div class="pos-field">
            <label for="max-discount">Descuento máximo manual</label
            ><p-inputnumber
              inputId="max-discount"
              [(ngModel)]="settings.maxDiscountPercent"
              [min]="0"
              [max]="100"
              suffix=" %"
            /><small>Se valida al registrar cada venta.</small>
          </div>
          <div class="pos-field">
            <label for="offline-limit">Monto máximo por venta sin conexión</label
            ><p-inputnumber
              inputId="offline-limit"
              [(ngModel)]="settings.offlineLimit"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="0"
              [maxFractionDigits]="0"
            /><small>Solo si está habilitada la venta offline y el medio de pago es admitido.</small>
          </div>
          <div class="sm:col-span-2 flex justify-between gap-4 items-center border-t border-surface pt-5">
            <div>
              <label for="auto-print" class="font-medium">Imprimir comprobante al terminar</label>
              <p class="text-muted-color text-sm mt-1">
                La impresión mock registra la tarea sin usar hardware.
              </p>
            </div>
            <p-toggleswitch inputId="auto-print" [(ngModel)]="settings.autoPrint" />
          </div>
          <div class="pos-field sm:col-span-2">
            <label for="receipt-message">Mensaje del comprobante</label
            ><textarea
              pTextarea
              id="receipt-message"
              [(ngModel)]="settings.receiptMessage"
              rows="3"
              maxlength="200"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <p-button
            ariaLabel="Restablecer cambios"
            label="Restablecer cambios"
            severity="secondary"
            (onClick)="reload()"
          /><p-button
            ariaLabel="Guardar políticas"
            label="Guardar políticas"
            icon="pos-icon pos-icon-check"
            (onClick)="save()"
          />
        </div>
      </section>
    }
    @if (tab === 'company') {
      <section class="pos-panel p-6 max-w-4xl">
        <h2 class="font-semibold text-lg mb-5">Empresa y puesto de trabajo</h2>
        <div class="pos-form-grid">
          <div class="pos-field">
            <label for="company-name">Razón social</label
            ><input pInputText id="company-name" [(ngModel)]="settings.companyName" />
          </div>
          <div class="pos-field">
            <label for="company-rut">RUT de empresa</label
            ><input pInputText id="company-rut" [(ngModel)]="settings.companyRut" />
          </div>
          <div class="pos-field">
            <label for="company-branch">Sucursal activa</label
            ><p-select
              ariaLabel="Sucursal activa"
              inputId="company-branch"
              [options]="store.snapshot().branches"
              optionLabel="name"
              optionValue="id"
              [(ngModel)]="settings.branchId"
            />
          </div>
          <div class="pos-field">
            <label for="company-terminal">Código de caja</label
            ><input pInputText id="company-terminal" [(ngModel)]="settings.terminalId" />
          </div>
          <div class="pos-field">
            <label for="company-currency">Moneda</label
            ><input pInputText id="company-currency" value="Peso chileno · CLP" readonly />
          </div>
          <div class="pos-field">
            <label for="company-tax">IVA</label><input pInputText id="company-tax" value="19 %" readonly />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <p-button
            ariaLabel="Restablecer cambios"
            label="Restablecer cambios"
            severity="secondary"
            (onClick)="reload()"
          /><p-button
            ariaLabel="Guardar empresa"
            label="Guardar empresa"
            icon="pos-icon pos-icon-check"
            (onClick)="save()"
          />
        </div>
      </section>
    }
    @if (tab === 'demo') {
      <section class="pos-panel p-6 max-w-3xl">
        <h2 class="font-semibold text-lg">Entorno de demostración</h2>
        <p class="text-muted-color leading-7 mt-3">
          Los datos son sintéticos y se conservan en este navegador. No se cobra dinero, no se emiten
          documentos tributarios y no se envía información al ERP.
        </p>
        <div class="grid gap-4 sm:grid-cols-2 my-6">
          <div class="rounded-lg bg-surface-50 dark:bg-surface-900 p-4">
            <span class="text-muted-color text-sm">Persistencia</span>
            <p class="font-semibold mt-1">Local · esquema v{{ store.snapshot().schemaVersion }}</p>
          </div>
          <div class="rounded-lg bg-surface-50 dark:bg-surface-900 p-4">
            <span class="text-muted-color text-sm">Programaciones</span>
            <p class="font-semibold mt-1">Mientras la aplicación esté abierta</p>
          </div>
        </div>
        <p-message severity="warn"
          >Restablecer elimina las ventas y cambios de esta demo y vuelve a cargar los datos
          iniciales.</p-message
        >
        <div class="mt-5">
          <p-button
            ariaLabel="Restablecer demostración"
            label="Restablecer demostración"
            icon="pos-icon pos-icon-arrow-clockwise"
            severity="danger"
            [outlined]="true"
            (onClick)="reset()"
          />
        </div>
      </section>
    }
  </div>`,
})
export class SettingsComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  settings: PosSettings = structuredClone(this.store.snapshot().settings);
  tab = 'modules';
  readonly tabs = [
    { label: 'Módulos', value: 'modules' },
    { label: 'Políticas', value: 'policies' },
    { label: 'Empresa y caja', value: 'company' },
    { label: 'Demostración', value: 'demo' },
  ];
  readonly categories = [
    { id: 'operation', label: 'Operación de caja' },
    { id: 'management', label: 'Gestión comercial' },
    { id: 'platform', label: 'Plataforma' },
    { id: 'policy', label: 'Capacidades de venta' },
  ];
  modules(category: string): FeatureModule[] {
    return this.store.snapshot().modules.filter((m) => m.category === category);
  }
  enabledCount(): number {
    return this.store.snapshot().modules.filter((m) => m.enabled).length;
  }
  readonly moduleValues = signal<Record<string, boolean>>({});
  constructor() {
    effect(() => {
      this.moduleValues.set(Object.fromEntries(this.store.snapshot().modules.map((m) => [m.id, m.enabled])));
    });
  }
  toggle(module: FeatureModule, enabled: boolean): void {
    this.moduleValues.update((values) => ({ ...values, [module.id]: enabled }));
    const restore = (): void => {
      this.moduleValues.update((values) => ({ ...values, [module.id]: module.enabled }));
    };
    const apply = (): void => {
      if (
        !this.feedback.result(
          this.store.setModule(module.id, enabled),
          enabled ? 'Módulo habilitado' : 'Módulo deshabilitado',
        )
      )
        restore();
    };
    if (enabled) apply();
    else
      this.feedback.confirm(
        'Se bloqueará el acceso a ' + module.name + ' y sus operaciones. Los datos existentes se conservan.',
        apply,
        'Deshabilitar ' + module.name,
        restore,
      );
  }
  reload(): void {
    this.settings = structuredClone(this.store.snapshot().settings);
  }
  save(): void {
    const patch: Partial<PosSettings> =
      this.tab === 'policies'
        ? {
            maxDiscountPercent: this.settings.maxDiscountPercent,
            offlineLimit: this.settings.offlineLimit,
            autoPrint: this.settings.autoPrint,
            receiptMessage: this.settings.receiptMessage,
          }
        : {
            companyName: this.settings.companyName,
            companyRut: this.settings.companyRut,
            branchId: this.settings.branchId,
            terminalId: this.settings.terminalId,
          };
    this.feedback.result(this.store.updateSettings(patch), 'Configuración guardada');
  }
  reset(): void {
    this.feedback.confirm(
      'Se eliminarán los cambios guardados en este navegador. ¿Restablecer los datos iniciales de la demo?',
      () => {
        this.feedback.result(this.store.resetDemo(), 'Demostración restablecida');
        this.reload();
      },
      'Restablecer demostración',
    );
  }
}

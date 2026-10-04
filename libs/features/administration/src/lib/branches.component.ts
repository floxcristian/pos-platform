import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import { validMoney, type Branch } from '@corporate-pos/domain';
import { DuotoneIconComponent, PageHeaderComponent, StatusTagComponent } from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-branches',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    ToggleSwitchModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    DuotoneIconComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Administración"
        heading="Sucursales y cajas"
        subtitle="Organiza la red comercial y el alcance de cada puesto de trabajo."
        ><p-button
          ariaLabel="Nueva sucursal"
          label="Nueva sucursal"
          icon="pos-icon pos-icon-plus"
          (onClick)="edit()"
      /></pos-page-header>
      <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (branch of store.snapshot().branches; track branch.id) {
          <article class="pos-panel p-6">
            <div class="flex justify-between items-start">
              <span
                class="flex items-center justify-center rounded-xl size-14 shrink-0 bg-primary-50 dark:bg-primary-950 text-primary"
                ><pos-duotone-icon name="buildings" [size]="32" /></span
              ><pos-status-tag
                [value]="branch.active ? (branch.online ? 'connected' : 'offline') : 'inactive'"
              />
            </div>
            <h2 class="text-xl font-semibold mt-5">{{ branch.name }}</h2>
            <p class="text-xs text-muted-color font-mono mt-1">{{ branch.code }}</p>
            <p class="text-muted-color mt-4">{{ branch.address }} · {{ branch.city }}</p>
            <div class="grid grid-cols-2 gap-4 border-y border-surface py-4 my-5">
              <div>
                <small class="text-muted-color">Cajas registradas</small>
                <p class="font-semibold text-xl">{{ branch.terminals }}</p>
              </div>
              <div>
                <small class="text-muted-color">Usuarios asignados</small>
                <p class="font-semibold text-xl">{{ users(branch.id) }}</p>
              </div>
            </div>
            <div class="flex justify-between items-center gap-2">
              @if (branch.id === store.snapshot().settings.branchId) {
                <span class="text-primary text-sm font-semibold">Sucursal de esta caja</span>
              } @else {
                <span class="text-sm text-muted-color">{{
                  branch.active ? 'Habilitada' : 'Deshabilitada'
                }}</span>
              }
              <p-button
                ariaLabel="Editar"
                label="Editar"
                icon="pos-icon pos-icon-pencil"
                severity="secondary"
                (onClick)="edit(branch)"
              />
            </div>
          </article>
        }
      </div>
      <div class="pos-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="font-semibold">Puesto de trabajo actual</h2>
          <p class="text-muted-color mt-1">
            {{ store.snapshot().settings.terminalId }} · {{ store.branch()?.name }}
          </p>
        </div>
        <span class="text-sm text-muted-color">La asignación se configura en Empresa y caja.</span>
      </div>
    </div>
    <p-dialog
      [header]="branch.id ? 'Editar sucursal' : 'Nueva sucursal'"
      [(visible)]="dialog"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '38rem' }"
    >
      <p class="text-sm text-muted-color mb-5">Los campos marcados con * son obligatorios.</p>
      @if (saveError) {
        <p-message id="branch-save-error" severity="error" class="block mb-5">{{ saveError }}</p-message>
      }
      <div class="pos-form-grid">
        <div class="pos-field">
          <label for="branch-code">Código *</label
          ><input
            pInputText
            id="branch-code"
            [(ngModel)]="branch.code"
            (ngModelChange)="saveError = ''"
            required
            aria-required="true"
            [invalid]="!!fieldError('code')"
            [attr.aria-invalid]="!!fieldError('code')"
            [attr.aria-describedby]="fieldError('code') ? 'branch-code-error' : null"
          />
          @if (fieldError('code'); as error) {
            <p-message id="branch-code-error" severity="error" variant="simple" size="small">{{
              error
            }}</p-message>
          }
        </div>
        <div class="pos-field">
          <label for="branch-name">Nombre *</label
          ><input
            pInputText
            id="branch-name"
            [(ngModel)]="branch.name"
            (ngModelChange)="saveError = ''"
            required
            aria-required="true"
            [invalid]="!!fieldError('name')"
            [attr.aria-invalid]="!!fieldError('name')"
            [attr.aria-describedby]="fieldError('name') ? 'branch-name-error' : null"
          />
          @if (fieldError('name'); as error) {
            <p-message id="branch-name-error" severity="error" variant="simple" size="small">{{
              error
            }}</p-message>
          }
        </div>
        <div class="pos-field sm:col-span-2">
          <label for="branch-address">Dirección (opcional)</label
          ><input
            pInputText
            id="branch-address"
            [(ngModel)]="branch.address"
            (ngModelChange)="saveError = ''"
          />
        </div>
        <div class="pos-field">
          <label for="branch-city">Comuna *</label
          ><input
            pInputText
            id="branch-city"
            [(ngModel)]="branch.city"
            (ngModelChange)="saveError = ''"
            required
            aria-required="true"
            [invalid]="!!fieldError('city')"
            [attr.aria-invalid]="!!fieldError('city')"
            [attr.aria-describedby]="fieldError('city') ? 'branch-city-error' : null"
          />
          @if (fieldError('city'); as error) {
            <p-message id="branch-city-error" severity="error" variant="simple" size="small">{{
              error
            }}</p-message>
          }
        </div>
        <div class="pos-field">
          <label for="branch-terminals">Cajas registradas *</label
          ><p-inputnumber
            inputId="branch-terminals"
            [(ngModel)]="branch.terminals"
            (ngModelChange)="saveError = ''"
            [min]="1"
            [max]="100"
            [showButtons]="true"
            [fluid]="true"
            [ariaRequired]="true"
            [invalid]="!!fieldError('terminals')"
            [ariaDescribedBy]="fieldError('terminals') ? 'branch-terminals-error' : undefined"
          />
          @if (fieldError('terminals'); as error) {
            <p-message id="branch-terminals-error" severity="error" variant="simple" size="small">{{
              error
            }}</p-message>
          }
        </div>
        <div class="flex justify-between items-center">
          <label for="branch-active">Sucursal activa</label
          ><p-toggleswitch
            inputId="branch-active"
            [(ngModel)]="branch.active"
            (ngModelChange)="saveError = ''"
          />
        </div>
        <div class="flex justify-between items-center">
          <label for="branch-online">Conectada (mock)</label
          ><p-toggleswitch
            inputId="branch-online"
            [(ngModel)]="branch.online"
            (ngModelChange)="saveError = ''"
          />
        </div>
      </div>
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          (onClick)="dialog = false" /><p-button
          ariaLabel="Guardar sucursal"
          label="Guardar sucursal"
          (onClick)="save()" /></ng-template
    ></p-dialog>`,
})
export class BranchesComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  dialog = false;
  submitted = false;
  saveError = '';
  branch: Branch = {
    id: '',
    name: '',
    code: '',
    city: '',
    address: '',
    active: true,
    terminals: 1,
    online: true,
  };
  users(id: string): number {
    return this.store.snapshot().users.filter((u) => u.active && u.branchIds.includes(id)).length;
  }
  edit(branch?: Branch): void {
    this.branch = branch
      ? structuredClone(branch)
      : { id: '', name: '', code: '', city: '', address: '', active: true, terminals: 1, online: true };
    this.submitted = false;
    this.saveError = '';
    this.dialog = true;
  }
  fieldError(field: 'code' | 'name' | 'city' | 'terminals'): string | null {
    if (!this.submitted) return null;
    if (field === 'terminals') {
      return validMoney(this.branch.terminals) ? null : 'Ingresa un número entero de cajas mayor que cero.';
    }
    if (this.branch[field].trim()) return null;
    return {
      code: 'Ingresa el código de la sucursal.',
      name: 'Ingresa el nombre de la sucursal.',
      city: 'Ingresa la comuna de la sucursal.',
    }[field];
  }
  save(): void {
    this.submitted = true;
    const result = this.store.saveBranch({ ...this.branch, id: this.branch.id || crypto.randomUUID() });
    this.saveError = result.ok ? '' : result.error;
    if (this.feedback.result(result, 'Sucursal guardada')) this.dialog = false;
  }
}

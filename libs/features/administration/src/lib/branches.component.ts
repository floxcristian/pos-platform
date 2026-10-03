import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PosStore } from '@corporate-pos/data-access';
import type { Branch } from '@corporate-pos/domain';
import { PageHeaderComponent, StatusTagComponent } from '@corporate-pos/ui';
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
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Administración"
        title="Sucursales y cajas"
        subtitle="Organiza la red comercial y el alcance de cada puesto de trabajo."
        ><p-button ariaLabel="Nueva sucursal" label="Nueva sucursal" icon="pi pi-plus" (onClick)="edit()"
      /></pos-page-header>
      <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (branch of store.snapshot().branches; track branch.id) {
          <article class="pos-panel p-6">
            <div class="flex justify-between items-start">
              <span
                class="flex items-center justify-center rounded-xl w-12 h-12 bg-primary-50 dark:bg-primary-950 text-primary"
                ><i class="pi pi-building text-xl" aria-hidden="true"></i></span
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
                icon="pi pi-pencil"
                severity="secondary"
                [text]="true"
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
      [style]="{ width: '38rem' }"
      ><div class="pos-form-grid">
        <div class="pos-field">
          <label for="branch-code">Código *</label
          ><input pInputText id="branch-code" [(ngModel)]="branch.code" />
        </div>
        <div class="pos-field">
          <label for="branch-name">Nombre *</label
          ><input pInputText id="branch-name" [(ngModel)]="branch.name" />
        </div>
        <div class="pos-field sm:col-span-2">
          <label for="branch-address">Dirección *</label
          ><input pInputText id="branch-address" [(ngModel)]="branch.address" />
        </div>
        <div class="pos-field">
          <label for="branch-city">Comuna *</label
          ><input pInputText id="branch-city" [(ngModel)]="branch.city" />
        </div>
        <div class="pos-field">
          <label for="branch-terminals">Cajas registradas</label
          ><p-inputnumber
            inputId="branch-terminals"
            [(ngModel)]="branch.terminals"
            [min]="1"
            [max]="100"
            [showButtons]="true"
          />
        </div>
        <div class="flex justify-between items-center">
          <label for="branch-active">Sucursal activa</label
          ><p-toggleswitch inputId="branch-active" [(ngModel)]="branch.active" />
        </div>
        <div class="flex justify-between items-center">
          <label for="branch-online">Conectada (mock)</label
          ><p-toggleswitch inputId="branch-online" [(ngModel)]="branch.online" />
        </div>
      </div>
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          [outlined]="true"
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
    this.dialog = true;
  }
  save(): void {
    if (
      this.feedback.result(
        this.store.saveBranch({ ...this.branch, id: this.branch.id || crypto.randomUUID() }),
        'Sucursal guardada',
      )
    )
      this.dialog = false;
  }
}

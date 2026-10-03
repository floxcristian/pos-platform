import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PosStore } from '@corporate-pos/data-access';
import { PosUser, Role, ROLE_LABELS, ROLE_PERMISSIONS, Permission } from '@corporate-pos/domain';
import { PageHeaderComponent, StatusTagComponent } from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    TableModule,
    SelectButtonModule,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    DialogModule,
    ToggleSwitchModule,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Administración"
        heading="Usuarios y permisos"
        subtitle="Perfiles y sucursales asignadas para separar operación, supervisión y auditoría."
        ><p-button
          ariaLabel="Nuevo usuario"
          label="Nuevo usuario"
          icon="pos-icon pos-icon-user-plus"
          (onClick)="edit()"
      /></pos-page-header>
      <div class="pos-filter">
        <div class="pos-segments">
          <p-selectbutton
            [options]="tabs"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="tab"
            [allowEmpty]="false"
            ariaLabel="Usuarios y perfiles"
          />
        </div>
      </div>
      @if (tab === 'users') {
        <div class="pos-panel overflow-hidden">
          <p-table
            tableStyleClass="pos-table"
            [value]="store.snapshot().users"
            [paginator]="true"
            [rows]="10"
            [tableStyle]="{ 'min-width': '48rem' }"
            ><ng-template #header
              ><tr>
                <th>Usuario</th>
                <th>Perfil</th>
                <th>Sucursales</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr></ng-template
            ><ng-template #body let-user
              ><tr>
                <td>
                  <div class="flex gap-3 items-center">
                    <span
                      class="rounded-full bg-primary-50 dark:bg-primary-950 text-primary w-10 h-10 flex items-center justify-center font-semibold"
                      >{{ initials(user.name) }}</span
                    >
                    <div>
                      <p class="font-semibold">{{ user.name }}</p>
                      <small class="text-muted-color">{{ user.email }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ labels[user.role] }}</td>
                <td>{{ branchNames(user) }}</td>
                <td><pos-status-tag [value]="user.active ? 'active' : 'inactive'" /></td>
                <td>
                  <p-button
                    ariaLabel="Editar"
                    label="Editar"
                    icon="pos-icon pos-icon-pencil"
                    severity="secondary"
                    (onClick)="edit(user)"
                  />
                </td></tr></ng-template
          ></p-table>
        </div>
        <p class="text-sm text-muted-color">
          La demo cambia de perfil desde el menú superior. La autenticación corporativa y las invitaciones se
          incorporarán al conectar un proveedor de identidad.
        </p>
      }
      @if (tab === 'roles') {
        <div class="pos-panel overflow-hidden">
          <p-table tableStyleClass="pos-table" [value]="permissions" [tableStyle]="{ 'min-width': '44rem' }"
            ><ng-template #header
              ><tr>
                <th>Permiso</th>
                @for (role of roles; track role.value) {
                  <th>{{ role.label }}</th>
                }
              </tr></ng-template
            ><ng-template #body let-permission
              ><tr>
                <td class="font-medium">{{ permission.label }}</td>
                @for (role of roles; track role.value) {
                  <td>
                    <span
                      [class]="
                        allowed(role.value, permission.value)
                          ? 'text-primary font-semibold'
                          : 'text-muted-color'
                      "
                      >{{ allowed(role.value, permission.value) ? 'Permitido' : '—' }}</span
                    >
                  </td>
                }
              </tr></ng-template
            ></p-table
          >
        </div>
        <p class="text-sm text-muted-color">
          Los perfiles son políticas del producto. Deshabilitar un módulo bloquea sus acciones para todos los
          perfiles.
        </p>
      }
    </div>
    <p-dialog
      [header]="user.id ? 'Editar usuario' : 'Nuevo usuario'"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '36rem' }"
      ><div class="pos-section">
        <div class="pos-field">
          <label for="user-name">Nombre *</label><input pInputText id="user-name" [(ngModel)]="user.name" />
        </div>
        <div class="pos-field">
          <label for="user-email">Correo *</label
          ><input pInputText id="user-email" type="email" [(ngModel)]="user.email" />
        </div>
        <div class="pos-field">
          <label for="user-role">Perfil *</label
          ><p-select
            ariaLabel="Perfil *"
            inputId="user-role"
            [options]="roles"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="user.role"
            appendTo="body"
          />
        </div>
        <div class="pos-field">
          <label for="user-branches">Sucursales asignadas *</label
          ><p-multiselect
            ariaLabel="Sucursales asignadas *"
            inputId="user-branches"
            [options]="store.snapshot().branches"
            optionLabel="name"
            optionValue="id"
            [(ngModel)]="user.branchIds"
            appendTo="body"
          />
        </div>
        <div class="flex justify-between items-center">
          <label for="user-active">Usuario activo</label
          ><p-toggleswitch inputId="user-active" [(ngModel)]="user.active" />
        </div>
      </div>
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          (onClick)="dialog = false" /><p-button
          ariaLabel="Guardar usuario"
          label="Guardar usuario"
          (onClick)="save()" /></ng-template
    ></p-dialog>`,
})
export class UsersComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly labels: Record<string, string> = ROLE_LABELS;
  readonly roles = (Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => ({
    value,
    label,
  }));
  readonly tabs = [
    { label: 'Usuarios', value: 'users' },
    { label: 'Matriz de permisos', value: 'roles' },
  ];
  readonly permissions: { label: string; value: Permission }[] = [
    { label: 'Vender y consultar documentos', value: 'sell' },
    { label: 'Operar caja', value: 'cash' },
    { label: 'Emitir NC y devolver pagos', value: 'refund' },
    { label: 'Cobrar deudas y anticipos', value: 'collect' },
    { label: 'Editar maestros', value: 'masters' },
    { label: 'Gestionar precios', value: 'pricing' },
    { label: 'Consultar reportes', value: 'reports' },
    { label: 'Ejecutar sincronización', value: 'sync' },
    { label: 'Cambiar configuración', value: 'configure' },
    { label: 'Administrar usuarios', value: 'users' },
    { label: 'Consultar auditoría', value: 'audit' },
    { label: 'Gestionar dispositivos', value: 'devices' },
  ];
  tab = 'users';
  dialog = false;
  user: PosUser = { id: '', name: '', email: '', role: 'cashier', active: true, branchIds: [] };
  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }
  branchNames(user: PosUser): string {
    return this.store
      .snapshot()
      .branches.filter((b) => user.branchIds.includes(b.id))
      .map((b) => b.name)
      .join(', ');
  }
  allowed(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  }
  edit(user?: PosUser): void {
    this.user = user
      ? structuredClone(user)
      : {
          id: '',
          name: '',
          email: '',
          role: 'cashier',
          active: true,
          branchIds: [this.store.snapshot().settings.branchId],
        };
    this.dialog = true;
  }
  save(): void {
    if (
      this.feedback.result(
        this.store.saveUser({ ...this.user, id: this.user.id || crypto.randomUUID() }),
        'Usuario guardado',
      )
    )
      this.dialog = false;
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { PosStore } from '@corporate-pos/data-access';
import type { PriceRule } from '@corporate-pos/domain';
import { EmptyStateComponent, StatusTagComponent, money } from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-price-rules',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    TableModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
    DialogModule,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  template: ` <div class="pos-section">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">Precios por cliente y cantidad</h2>
          <p class="text-muted-color text-sm mt-2">
            El precio específico del cliente tiene prioridad. Dentro de una condición se aplica la escala
            alcanzada.
          </p>
        </div>
        <p-button
          class="ms-auto"
          ariaLabel="Nueva condición"
          label="Nueva condición"
          icon="pos-icon pos-icon-plus"
          (onClick)="edit()"
        />
      </div>
      <div class="pos-panel overflow-hidden">
        @if (store.snapshot().priceRules.length) {
          <p-table
            tableStyleClass="pos-table"
            [value]="store.snapshot().priceRules"
            [paginator]="true"
            [rows]="10"
            [tableStyle]="{ 'min-width': '56rem' }"
            ><ng-template #header
              ><tr>
                <th>Condición</th>
                <th>Producto</th>
                <th>Cliente</th>
                <th>Desde</th>
                <th>Precio unitario</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr></ng-template
            ><ng-template #body let-rule
              ><tr>
                <td class="font-semibold">{{ rule.name }}</td>
                <td>{{ productName(rule.productId) }}</td>
                <td>{{ customerName(rule.customerId) }}</td>
                <td>{{ rule.minQuantity }} unidades</td>
                <td>{{ money(rule.unitPrice) }}<small class="block text-muted-color">IVA incluido</small></td>
                <td><pos-status-tag [value]="rule.enabled ? 'active' : 'inactive'" /></td>
                <td>
                  <p-button
                    ariaLabel="Editar condición"
                    label="Editar"
                    icon="pos-icon pos-icon-pencil"
                    severity="secondary"
                    (onClick)="edit(rule)"
                  />
                </td></tr></ng-template
          ></p-table>
        } @else {
          <pos-empty-state
            icon="list-checks"
            heading="Sin condiciones especiales de precio"
            [headingLevel]="3"
            description="Crea una condición para definir precios por cliente o cantidad."
          />
        }
      </div>
      <p class="text-sm text-muted-color">
        Estas condiciones no se acumulan con descuentos manuales u ofertas sobre el mismo producto. Las ventas
        ya guardadas conservan sus precios originales.
      </p>
    </div>
    <p-dialog
      [header]="rule.id ? 'Editar condición de precio' : 'Nueva condición de precio'"
      [(visible)]="dialog"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '40rem' }"
      ><div class="pos-section">
        <div class="pos-field">
          <label for="rule-name">Nombre *</label><input pInputText id="rule-name" [(ngModel)]="rule.name" />
        </div>
        <div class="pos-field">
          <label for="rule-product">Producto *</label
          ><p-select
            inputId="rule-product"
            ariaLabel="Producto de la condición"
            [options]="store.snapshot().products"
            optionLabel="name"
            optionValue="id"
            [(ngModel)]="rule.productId"
            [filter]="true"
            appendTo="body"
          />
        </div>
        <div class="pos-field">
          <label for="rule-customer">Cliente</label
          ><p-select
            inputId="rule-customer"
            ariaLabel="Cliente de la condición"
            [options]="customers()"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="rule.customerId"
            [filter]="true"
            appendTo="body"
          />
        </div>
        <div class="pos-form-grid">
          <div class="pos-field">
            <label for="rule-quantity">Cantidad mínima *</label
            ><p-inputnumber
              inputId="rule-quantity"
              [(ngModel)]="rule.minQuantity"
              [min]="1"
              [max]="9999"
              [maxFractionDigits]="0"
            />
          </div>
          <div class="pos-field">
            <label for="rule-price">Precio unitario con IVA *</label
            ><p-inputnumber
              inputId="rule-price"
              [(ngModel)]="rule.unitPrice"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="1"
              [maxFractionDigits]="0"
            />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <label for="rule-enabled">Condición habilitada</label
          ><p-toggleswitch inputId="rule-enabled" [(ngModel)]="rule.enabled" />
        </div>
      </div>
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="dialog = false" /><p-button
          label="Guardar condición"
          ariaLabel="Guardar condición"
          icon="pos-icon pos-icon-check"
          (onClick)="save()" /></ng-template
    ></p-dialog>`,
})
export class PriceRulesComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly money = money;
  dialog = false;
  rule: PriceRule = {
    id: '',
    name: '',
    productId: '',
    customerId: null,
    minQuantity: 1,
    unitPrice: 0,
    enabled: true,
  };
  customers(): { label: string; value: string | null }[] {
    return [
      { label: 'Todos los clientes', value: null },
      ...this.store
        .snapshot()
        .customers.filter((c) => c.active)
        .map((c) => ({ label: c.name, value: c.id })),
    ];
  }
  productName(id: string): string {
    return this.store.snapshot().products.find((p) => p.id === id)?.name ?? id;
  }
  customerName(id: string | null): string {
    return id ? (this.store.snapshot().customers.find((c) => c.id === id)?.name ?? id) : 'Todos los clientes';
  }
  edit(rule?: PriceRule): void {
    this.rule = rule
      ? structuredClone(rule)
      : { id: '', name: '', productId: '', customerId: null, minQuantity: 1, unitPrice: 0, enabled: true };
    this.dialog = true;
  }
  save(): void {
    if (
      this.feedback.result(
        this.store.savePriceRule({ ...this.rule, id: this.rule.id || crypto.randomUUID() }),
        'Condición de precio guardada',
      )
    )
      this.dialog = false;
  }
}

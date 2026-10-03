import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PosStore } from '@corporate-pos/data-access';
import type { Customer, Product, ReferenceItem, ReferenceKind } from '@corporate-pos/domain';
import { PageHeaderComponent, StatusTagComponent, money, dateTime, downloadCsv } from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';

@Component({
  selector: 'pos-masters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    TableModule,
    SelectButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    ToggleSwitchModule,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: ` <div class="pos-section">
      <pos-page-header
        eyebrow="Gestión"
        title="Maestros"
        subtitle="Datos compartidos por venta, cobranza y operación de sucursal."
        ><p-button
          ariaLabel="Exportar"
          label="Exportar"
          icon="pi pi-download"
          severity="secondary"
          (onClick)="export()" /><p-button
          [ariaLabel]="
            tab === 'products' ? 'Nuevo producto' : tab === 'customers' ? 'Nuevo cliente' : 'Nuevo registro'
          "
          [label]="
            tab === 'products' ? 'Nuevo producto' : tab === 'customers' ? 'Nuevo cliente' : 'Nuevo registro'
          "
          icon="pi pi-plus"
          (onClick)="create()"
      /></pos-page-header>
      <div class="pos-filter">
        <div class="pos-segments">
          <p-selectbutton
            [options]="tabs"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="tab"
            [allowEmpty]="false"
            ariaLabel="Maestros"
          />
        </div>
        <div class="flex-1"></div>
        <label class="sr-only" for="master-search">Buscar registros</label
        ><input
          pInputText
          id="master-search"
          [(ngModel)]="search"
          placeholder="Nombre, código o RUT…"
          class="w-full sm:w-72"
        />
      </div>
      @if (tab === 'products') {
        <div class="flex items-center gap-2 text-sm text-muted-color">
          <i class="pi pi-info-circle" aria-hidden="true"></i>El stock es de consulta. La caja no administra
          existencias.
        </div>
        <div class="pos-panel overflow-hidden">
          <p-table
            tableStyleClass="pos-table"
            [value]="products()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [tableStyle]="{ 'min-width': '55rem' }"
            dataKey="id"
            ><ng-template #header
              ><tr>
                <th pSortableColumn="name">Producto <p-sortIcon field="name" /></th>
                <th>Categoría</th>
                <th pSortableColumn="price">Precio <p-sortIcon field="price" /></th>
                <th>Stock consultado</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr></ng-template
            ><ng-template #body let-product
              ><tr>
                <td>
                  <div class="font-semibold">{{ product.name }}</div>
                  <div class="text-xs text-muted-color mt-1">{{ product.sku }} · {{ product.barcode }}</div>
                </td>
                <td>{{ product.category }}</td>
                <td class="font-medium">
                  {{ money(product.price) }}<small class="block text-muted-color">IVA incluido</small>
                </td>
                <td>{{ product.stock }} {{ product.unit }}</td>
                <td><pos-status-tag [value]="product.active ? 'active' : 'inactive'" /></td>
                <td>
                  <p-button
                    ariaLabel="Editar"
                    label="Editar"
                    icon="pi pi-pencil"
                    severity="secondary"
                    (onClick)="editProduct(product)"
                  />
                </td></tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="6" class="pos-empty">No encontramos productos con esa búsqueda.</td>
              </tr></ng-template
            ></p-table
          >
        </div>
      }
      @if (tab === 'customers') {
        <div class="pos-panel overflow-hidden">
          <p-table
            tableStyleClass="pos-table"
            [value]="customers()"
            [paginator]="true"
            [rows]="10"
            [tableStyle]="{ 'min-width': '58rem' }"
            dataKey="id"
            ><ng-template #header
              ><tr>
                <th pSortableColumn="name">Cliente <p-sortIcon field="name" /></th>
                <th>Contacto</th>
                <th>Crédito disponible</th>
                <th>Actualización</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr></ng-template
            ><ng-template #body let-customer
              ><tr>
                <td>
                  <div class="font-semibold">{{ customer.name }}</div>
                  <div class="text-xs text-muted-color mt-1">
                    {{ customer.rut }} · {{ customer.business || 'Persona natural' }}
                  </div>
                </td>
                <td>
                  {{ customer.email }}<small class="block text-muted-color">{{ customer.phone }}</small>
                </td>
                <td>
                  {{ money(customer.creditLimit - customer.creditUsed)
                  }}<small class="block text-muted-color">Límite {{ money(customer.creditLimit) }}</small>
                </td>
                <td>{{ dateTime(customer.updatedAt) }}</td>
                <td><pos-status-tag [value]="customer.active ? 'active' : 'inactive'" /></td>
                <td>
                  <p-button
                    ariaLabel="Editar"
                    label="Editar"
                    icon="pi pi-pencil"
                    severity="secondary"
                    (onClick)="editCustomer(customer)"
                  />
                </td></tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="6" class="pos-empty">
                  No encontramos clientes. Puedes crear un registro nuevo.
                </td>
              </tr></ng-template
            ></p-table
          >
        </div>
      }
      @if (tab === 'catalogs') {
        <div class="pos-filter">
          <label for="catalog-kind">Catálogo</label
          ><p-select
            ariaLabel="Catálogo"
            inputId="catalog-kind"
            [options]="catalogs"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="kind"
          />
        </div>
        <div class="pos-panel overflow-hidden">
          <p-table tableStyleClass="pos-table" [value]="references()" [paginator]="true" [rows]="10"
            ><ng-template #header
              ><tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr></ng-template
            ><ng-template #body let-item
              ><tr>
                <td class="font-mono">{{ item.code }}</td>
                <td>{{ item.name }}</td>
                <td><pos-status-tag [value]="item.active ? 'active' : 'inactive'" /></td>
                <td>
                  <p-button
                    ariaLabel="Editar"
                    label="Editar"
                    icon="pi pi-pencil"
                    severity="secondary"
                    (onClick)="editReference(item)"
                  />
                </td></tr></ng-template
            ><ng-template #emptymessage
              ><tr>
                <td colspan="4" class="pos-empty">Sin registros para esta búsqueda.</td>
              </tr></ng-template
            ></p-table
          >
        </div>
      }
    </div>
    <p-dialog [header]="editorTitle" [(visible)]="dialog" [modal]="true" [style]="{ width: '44rem' }">
      @if (editor === 'product') {
        <div class="pos-form-grid">
          <div class="pos-field sm:col-span-2">
            <label for="product-name">Nombre *</label
            ><input pInputText id="product-name" [(ngModel)]="product.name" maxlength="120" />
          </div>
          <div class="pos-field">
            <label for="product-sku">SKU *</label
            ><input pInputText id="product-sku" [(ngModel)]="product.sku" />
          </div>
          <div class="pos-field">
            <label for="product-barcode">Código de barras</label
            ><input pInputText id="product-barcode" [(ngModel)]="product.barcode" />
          </div>
          <div class="pos-field">
            <label for="product-category">Categoría</label
            ><input pInputText id="product-category" [(ngModel)]="product.category" />
          </div>
          <div class="pos-field">
            <label for="product-brand">Marca</label
            ><input pInputText id="product-brand" [(ngModel)]="product.brand" />
          </div>
          <div class="pos-field">
            <label for="product-price">Precio con IVA *</label
            ><p-inputnumber
              inputId="product-price"
              [(ngModel)]="product.price"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="1"
              [maxFractionDigits]="0"
            />
          </div>
          <div class="pos-field">
            <label for="product-cost">Costo unitario</label
            ><p-inputnumber
              inputId="product-cost"
              [(ngModel)]="product.cost"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="0"
              [maxFractionDigits]="0"
            />
          </div>
          <div class="pos-field">
            <label for="product-unit">Unidad</label
            ><input pInputText id="product-unit" [(ngModel)]="product.unit" />
          </div>
          <div class="flex items-center justify-between">
            <label for="product-active">Disponible para venta</label
            ><p-toggleswitch inputId="product-active" [(ngModel)]="product.active" />
          </div>
        </div>
      }
      @if (editor === 'customer') {
        <div class="pos-form-grid">
          <div class="pos-field sm:col-span-2">
            <label for="customer-name">Nombre o razón social *</label
            ><input pInputText id="customer-name" [(ngModel)]="customer.name" />
          </div>
          <div class="pos-field">
            <label for="customer-rut">RUT *</label
            ><input pInputText id="customer-rut" [(ngModel)]="customer.rut" placeholder="12.345.678-5" />
          </div>
          <div class="pos-field">
            <label for="customer-business">Giro</label
            ><input pInputText id="customer-business" [(ngModel)]="customer.business" />
          </div>
          <div class="pos-field">
            <label for="customer-email">Correo electrónico</label
            ><input pInputText type="email" id="customer-email" [(ngModel)]="customer.email" />
          </div>
          <div class="pos-field">
            <label for="customer-phone">Teléfono</label
            ><input pInputText type="tel" id="customer-phone" [(ngModel)]="customer.phone" />
          </div>
          <div class="pos-field">
            <label for="customer-address">Dirección</label
            ><input pInputText id="customer-address" [(ngModel)]="customer.address" />
          </div>
          <div class="pos-field">
            <label for="customer-city">Comuna</label
            ><input pInputText id="customer-city" [(ngModel)]="customer.city" />
          </div>
          <div class="pos-field">
            <label for="customer-installments">Cuotas de crédito</label
            ><p-inputnumber
              inputId="customer-installments"
              [(ngModel)]="customer.creditTerms.installments"
              [min]="1"
              [max]="36"
              [maxFractionDigits]="0"
            />
          </div>
          <div class="pos-field">
            <label for="customer-period">Días entre vencimientos</label
            ><p-inputnumber
              inputId="customer-period"
              [(ngModel)]="customer.creditTerms.periodDays"
              [min]="1"
              [max]="365"
              [maxFractionDigits]="0"
            /><small>Condiciones asignadas al cliente; se consultan al vender.</small>
          </div>
          <div class="pos-field">
            <label for="customer-credit">Límite de crédito</label
            ><p-inputnumber
              inputId="customer-credit"
              [(ngModel)]="customer.creditLimit"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="0"
              [maxFractionDigits]="0"
            />
          </div>
          <div class="flex items-center justify-between">
            <label for="customer-active">Cliente activo</label
            ><p-toggleswitch inputId="customer-active" [(ngModel)]="customer.active" />
          </div>
        </div>
      }
      @if (editor === 'reference') {
        <div class="pos-section">
          <div class="pos-field">
            <label for="reference-code">Código *</label
            ><input pInputText id="reference-code" [(ngModel)]="reference.code" />
          </div>
          <div class="pos-field">
            <label for="reference-name">Nombre *</label
            ><input pInputText id="reference-name" [(ngModel)]="reference.name" />
          </div>
          <div class="flex items-center justify-between">
            <label for="reference-active">Habilitado</label
            ><p-toggleswitch inputId="reference-active" [(ngModel)]="reference.active" />
          </div>
        </div>
      }
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          (onClick)="dialog = false" /><p-button
          ariaLabel="Guardar"
          label="Guardar"
          icon="pi pi-check"
          (onClick)="save()"
      /></ng-template>
    </p-dialog>`,
})
export class MastersComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  private readonly route = inject(ActivatedRoute);
  readonly money = money;
  readonly dateTime = dateTime;
  readonly tabs = [
    { label: 'Productos', value: 'products' },
    { label: 'Clientes', value: 'customers' },
    { label: 'Catálogos de operación', value: 'catalogs' },
  ];
  readonly catalogs = [
    { label: 'Bancos', value: 'bank' },
    { label: 'Plazas de cheques', value: 'plaza' },
    { label: 'Motivos de nota de crédito', value: 'returnReason' },
    { label: 'Vendedores', value: 'seller' },
  ];
  tab = 'products';
  search = '';
  kind: ReferenceKind = 'bank';
  dialog = false;
  editor: 'product' | 'customer' | 'reference' = 'product';
  editorTitle = '';
  product: Partial<Product> & { name: string; sku: string; price: number } = {
    name: '',
    sku: '',
    price: 0,
    active: true,
    unit: 'un',
    taxRate: 19,
    cost: 0,
  };
  customer: Partial<Customer> & { name: string; rut: string; creditTerms: Customer['creditTerms'] } = {
    name: '',
    rut: '',
    active: true,
    creditLimit: 0,
    creditTerms: { installments: 1, periodDays: 30 },
  };
  reference: ReferenceItem = { id: '', code: '', name: '', active: true };
  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.search = params.get('buscar') ?? '';
      if (this.search && this.store.snapshot().customers.some((c) => c.rut === this.search))
        this.tab = 'customers';
    });
  }
  private matches(...values: string[]): boolean {
    return values.join(' ').toLocaleLowerCase('es').includes(this.search.toLocaleLowerCase('es'));
  }
  products(): Product[] {
    return this.store.snapshot().products.filter((p) => this.matches(p.name, p.sku, p.barcode, p.category));
  }
  customers(): Customer[] {
    return this.store.snapshot().customers.filter((c) => this.matches(c.name, c.rut, c.email));
  }
  references(): ReferenceItem[] {
    return this.store.snapshot().referenceCatalogs[this.kind].filter((r) => this.matches(r.name, r.code));
  }
  create(): void {
    if (this.tab === 'products') this.editProduct();
    else if (this.tab === 'customers') this.editCustomer();
    else this.editReference();
  }
  editProduct(value?: Product): void {
    this.product = value
      ? structuredClone(value)
      : { name: '', sku: '', price: 0, cost: 0, active: true, unit: 'un', taxRate: 19 };
    this.editor = 'product';
    this.editorTitle = value ? 'Editar producto' : 'Nuevo producto';
    this.dialog = true;
  }
  editCustomer(value?: Customer): void {
    this.customer = value
      ? structuredClone(value)
      : {
          name: '',
          rut: '',
          active: true,
          creditLimit: 0,
          email: '',
          phone: '',
          address: '',
          city: '',
          business: '',
          creditTerms: { installments: 1, periodDays: 30 },
        };
    this.editor = 'customer';
    this.editorTitle = value ? 'Editar cliente' : 'Nuevo cliente';
    this.dialog = true;
  }
  editReference(value?: ReferenceItem): void {
    this.reference = value
      ? structuredClone(value)
      : { id: crypto.randomUUID(), name: '', code: '', active: true };
    this.editor = 'reference';
    this.editorTitle = value ? 'Editar registro' : 'Nuevo registro';
    this.dialog = true;
  }
  save(): void {
    const result =
      this.editor === 'product'
        ? this.store.saveProduct(this.product)
        : this.editor === 'customer'
          ? this.store.saveCustomer(this.customer)
          : this.store.saveReferenceItem(this.kind, this.reference);
    if (this.feedback.result(result)) this.dialog = false;
  }
  export(): void {
    if (this.tab === 'products')
      downloadCsv('productos.csv', [
        ['SKU', 'Producto', 'Categoría', 'Precio IVA incluido', 'Stock consultado', 'Estado'],
        ...this.products().map((p) => [
          p.sku,
          p.name,
          p.category,
          p.price,
          p.stock,
          p.active ? 'Activo' : 'Inactivo',
        ]),
      ]);
    else if (this.tab === 'customers')
      downloadCsv('clientes.csv', [
        ['RUT', 'Cliente', 'Correo', 'Dirección', 'Crédito disponible'],
        ...this.customers().map((c) => [c.rut, c.name, c.email, c.address, c.creditLimit - c.creditUsed]),
      ]);
    else
      downloadCsv('catalogo.csv', [
        ['Código', 'Nombre', 'Activo'],
        ...this.references().map((r) => [r.code, r.name, r.active]),
      ]);
  }
}

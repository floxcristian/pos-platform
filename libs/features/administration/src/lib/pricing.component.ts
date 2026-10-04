import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PosStore } from '@corporate-pos/data-access';
import { chileCivilDate, type Offer, type Product } from '@corporate-pos/domain';
import {
  CivilDateTimeComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatusTagComponent,
  money,
  date,
  downloadCsv,
  chileDayToISO,
} from '@corporate-pos/ui';
import { FeedbackService } from './feedback.service';
import { PriceRulesComponent } from './price-rules.component';

@Component({
  selector: 'pos-pricing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CivilDateTimeComponent,
    EmptyStateComponent,
    PriceRulesComponent,
    FormsModule,
    ButtonModule,
    TableModule,
    SelectButtonModule,
    MultiSelectModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    ToggleSwitchModule,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: `<div class="pos-section">
      <pos-page-header
        eyebrow="Gestión comercial"
        heading="Precios y ofertas"
        subtitle="Precios finales en pesos chilenos, con vigencia y control de cambios."
        ><p-button
          ariaLabel="Exportar precios"
          label="Exportar precios"
          icon="pos-icon pos-icon-download-simple"
          severity="secondary"
          (onClick)="export()" /><p-button
          ariaLabel="Nueva oferta"
          label="Nueva oferta"
          icon="pos-icon pos-icon-plus"
          (onClick)="editOffer()"
      /></pos-page-header>
      <div class="pos-filter">
        <div class="pos-segments">
          <p-selectbutton
            [options]="tabs"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="tab"
            [allowEmpty]="false"
            ariaLabel="Precios y promociones"
          />
        </div>
        <div class="flex-1"></div>
        <label for="pricing-search" class="sr-only">Buscar producto u oferta</label
        ><input pInputText id="pricing-search" placeholder="Buscar…" [(ngModel)]="search" />
      </div>
      @if (tab === 'prices') {
        <div class="pos-panel overflow-hidden">
          @if (products().length) {
            <p-table
              tableStyleClass="pos-table"
              [value]="products()"
              [paginator]="true"
              [rows]="10"
              [tableStyle]="{ 'min-width': '44rem' }"
              ><ng-template #header
                ><tr>
                  <th>Producto</th>
                  <th>Precio con IVA</th>
                  <th>Costo</th>
                  <th>Margen sobre precio neto</th>
                  <th>Acción</th>
                </tr></ng-template
              ><ng-template #body let-product
                ><tr>
                  <td>
                    <div class="font-semibold">{{ product.name }}</div>
                    <small class="text-muted-color">{{ product.sku }}</small>
                  </td>
                  <td>{{ money(product.price) }}</td>
                  <td>{{ money(product.cost) }}</td>
                  <td>{{ margin(product) }} %</td>
                  <td>
                    <p-button
                      ariaLabel="Cambiar precio"
                      label="Cambiar precio"
                      icon="pos-icon pos-icon-pencil"
                      severity="secondary"
                      (onClick)="editPrice(product)"
                    />
                  </td></tr></ng-template
            ></p-table>
          } @else {
            <pos-empty-state
              icon="magnifying-glass"
              heading="No hay productos para esa búsqueda"
              description="Prueba con otro nombre o código de producto."
            />
          }
        </div>
      }
      @if (tab === 'offers') {
        <div class="grid gap-4 lg:grid-cols-2">
          @for (offer of offers(); track offer.id) {
            <article class="pos-panel p-6">
              <div class="flex justify-between gap-3">
                <h2 class="text-lg font-semibold">{{ offer.name }}</h2>
                <pos-status-tag [value]="offer.active ? 'active' : 'inactive'" />
              </div>
              <p class="text-3xl font-semibold text-primary my-4">
                {{ offer.discountPercent }} %
                <span class="text-sm font-normal text-muted-color">de descuento</span>
              </p>
              <p class="text-sm text-muted-color">{{ date(offer.startsAt) }} — {{ date(offer.endsAt) }}</p>
              <p class="text-sm mt-2">{{ offer.productIds.length }} productos · {{ productNames(offer) }}</p>
              <div class="flex justify-end mt-5">
                <p-button
                  ariaLabel="Editar oferta"
                  label="Editar oferta"
                  icon="pos-icon pos-icon-pencil"
                  severity="secondary"
                  (onClick)="editOffer(offer)"
                />
              </div>
            </article>
          } @empty {
            <div class="pos-panel lg:col-span-2">
              <pos-empty-state
                icon="shopping-bag"
                heading="Sin ofertas"
                description="Crea una promoción y define sus productos y vigencia."
              />
            </div>
          }
        </div>
      }
      @if (tab === 'rules') {
        <pos-price-rules />
      }
    </div>
    <p-dialog
      header="Cambiar precio"
      [(visible)]="priceDialog"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '30rem' }"
    >
      @if (selected) {
        <div class="pos-section">
          <p class="font-semibold">{{ selected.name }}</p>
          <p class="text-muted-color">Precio actual: {{ money(selected.price) }}</p>
          <div class="pos-field">
            <label for="new-price">Nuevo precio con IVA</label
            ><p-inputnumber
              inputId="new-price"
              [(ngModel)]="newPrice"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="1"
              [maxFractionDigits]="0"
            />
          </div>
          <p class="text-sm text-muted-color">
            El cambio se aplica a ventas nuevas y queda registrado en auditoría.
          </p>
        </div>
      }
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          (onClick)="priceDialog = false" /><p-button
          ariaLabel="Guardar precio"
          label="Guardar precio"
          (onClick)="savePrice()" /></ng-template
    ></p-dialog>
    <p-dialog
      header="Configurar oferta"
      [(visible)]="offerDialog"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '40rem' }"
      ><div class="pos-section">
        <div class="pos-field">
          <label for="offer-name">Nombre *</label
          ><input pInputText id="offer-name" [(ngModel)]="offer.name" />
        </div>
        <div class="pos-field">
          <label for="offer-products">Productos *</label
          ><p-multiselect
            ariaLabel="Productos *"
            inputId="offer-products"
            [options]="store.snapshot().products"
            optionLabel="name"
            optionValue="id"
            [(ngModel)]="offer.productIds"
            [filter]="true"
            appendTo="body"
          />
        </div>
        <div class="pos-field">
          <label for="offer-discount">Descuento porcentual *</label
          ><p-inputnumber
            inputId="offer-discount"
            [(ngModel)]="offer.discountPercent"
            [min]="1"
            [max]="100"
            suffix=" %"
          />
        </div>
        <div class="pos-form-grid">
          <div class="pos-field">
            <label for="offer-from">Desde *</label
            ><pos-civil-date-time inputId="offer-from" ariaLabel="Desde" [(ngModel)]="startsAt" />
          </div>
          <div class="pos-field">
            <label for="offer-to">Hasta *</label
            ><pos-civil-date-time inputId="offer-to" ariaLabel="Hasta" [(ngModel)]="endsAt" />
          </div>
        </div>
        <div class="flex items-center justify-between">
          <label for="offer-active">Oferta habilitada</label
          ><p-toggleswitch inputId="offer-active" [(ngModel)]="offer.active" />
        </div>
      </div>
      <ng-template #footer
        ><p-button
          ariaLabel="Cancelar"
          label="Cancelar"
          severity="secondary"
          (onClick)="offerDialog = false" /><p-button
          ariaLabel="Guardar oferta"
          label="Guardar oferta"
          icon="pos-icon pos-icon-check"
          (onClick)="saveOffer()" /></ng-template
    ></p-dialog>`,
})
export class PricingComponent {
  readonly store = inject(PosStore);
  private readonly feedback = inject(FeedbackService);
  readonly money = money;
  readonly date = date;
  readonly tabs = [
    { label: 'Lista de precios', value: 'prices' },
    { label: 'Ofertas', value: 'offers' },
    { label: 'Condiciones de precio', value: 'rules' },
  ];
  tab = 'prices';
  search = '';
  priceDialog = false;
  offerDialog = false;
  selected: Product | null = null;
  newPrice = 0;
  startsAt = '';
  endsAt = '';
  offer: Offer = {
    id: '',
    name: '',
    productIds: [],
    discountPercent: 10,
    startsAt: '',
    endsAt: '',
    active: true,
  };
  products(): Product[] {
    const q = this.search.toLowerCase();
    return this.store.snapshot().products.filter((p) => (p.name + ' ' + p.sku).toLowerCase().includes(q));
  }
  offers(): Offer[] {
    return this.store
      .snapshot()
      .offers.filter((o) => o.name.toLowerCase().includes(this.search.toLowerCase()));
  }
  margin(p: Product): string {
    return ((1 - p.cost / (p.price / 1.19)) * 100).toFixed(1);
  }
  productNames(offer: Offer): string {
    return this.store
      .snapshot()
      .products.filter((p) => offer.productIds.includes(p.id))
      .map((p) => p.name)
      .join(', ');
  }
  editPrice(p: Product): void {
    this.selected = p;
    this.newPrice = p.price;
    this.priceDialog = true;
  }
  savePrice(): void {
    if (
      this.selected &&
      this.feedback.result(this.store.setPrice(this.selected.id, this.newPrice), 'Precio actualizado')
    )
      this.priceDialog = false;
  }
  editOffer(o?: Offer): void {
    this.offer = o
      ? structuredClone(o)
      : {
          id: crypto.randomUUID(),
          name: '',
          productIds: [],
          discountPercent: 10,
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          active: true,
        };
    this.startsAt = chileCivilDate(this.offer.startsAt);
    this.endsAt = chileCivilDate(this.offer.endsAt);
    this.offerDialog = true;
  }
  saveOffer(): void {
    if (!this.startsAt || !this.endsAt) {
      this.feedback.result({ ok: false, error: 'Completa la vigencia de la oferta.' });
      return;
    }
    if (
      this.feedback.result(
        this.store.saveOffer({
          ...this.offer,
          startsAt: chileDayToISO(this.startsAt),
          endsAt: chileDayToISO(this.endsAt, true),
        }),
        'Oferta guardada',
      )
    )
      this.offerDialog = false;
  }
  export(): void {
    downloadCsv('precios.csv', [
      ['SKU', 'Producto', 'Precio con IVA', 'Costo'],
      ...this.products().map((p) => [p.sku, p.name, p.price, p.cost]),
    ]);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import {
  CartLine,
  DocumentType,
  PaymentInput,
  PaymentMethod,
  Product,
  Sale,
  PAYMENT_LABELS,
  roundCash,
  chileCivilDate,
} from '@corporate-pos/domain';
import {
  CivilDateTimeComponent,
  DuotoneIconComponent,
  PageHeaderComponent,
  StatusTagComponent,
  money,
  date,
  dateTime,
} from '@corporate-pos/ui';

@Component({
  selector: 'pos-checkout',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DialogModule,
    DrawerModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    CivilDateTimeComponent,
    DuotoneIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent {
  readonly store = inject(PosStore);
  private readonly initialDraft = structuredClone(this.store.snapshot().activeDraft);
  readonly money = money;
  readonly date = date;
  readonly dateTime = dateTime;
  readonly paymentLabels = PAYMENT_LABELS;
  readonly query = signal('');
  readonly category = signal('Todas');
  readonly lines = signal<CartLine[]>(this.initialDraft?.lines ?? []);
  readonly customerId = signal<string | null>(this.initialDraft?.customerId ?? null);
  readonly documentType = signal<DocumentType>(this.initialDraft?.documentType ?? 'boleta');
  readonly error = signal('');
  readonly feedback = signal('');
  readonly paying = signal(false);
  readonly heldVisible = signal(false);
  readonly receipt = signal<Sale | null>(null);
  readonly receiptChange = signal(0);
  readonly customerVisible = signal(false);
  readonly customerName = signal('');
  readonly customerRut = signal('');
  readonly customerEmail = signal('');
  readonly customerPhone = signal('');
  readonly customerAddress = signal('');
  readonly customerCity = signal('');
  readonly customerBusiness = signal('');
  readonly deliveryMode = signal<'pickup' | 'delivery'>(this.initialDraft?.metadata.deliveryMode ?? 'pickup');
  readonly deliveryAddress = signal(this.initialDraft?.metadata.deliveryAddress ?? '');
  readonly deliveryContact = signal(this.initialDraft?.metadata.contact ?? '');
  readonly orderReference = signal(this.initialDraft?.metadata.orderReference ?? '');
  readonly paymentScenario = signal<'confirmed' | 'unknown' | 'failed'>('confirmed');
  readonly offerId = signal('');
  readonly appliedOffer = signal(this.initialDraft?.metadata.coupon ?? '');
  readonly ordersVisible = signal(false);
  readonly orderSearch = signal('');
  readonly loadedOrder = computed(() =>
    this.store.snapshot().salesOrders.find((item) => item.number === this.orderReference()),
  );
  readonly orders = computed(() =>
    this.store
      .snapshot()
      .salesOrders.filter(
        (item) =>
          item.status === 'open' &&
          `${item.number} ${this.store.snapshot().customers.find((customer) => customer.id === item.customerId)?.name}`
            .toLowerCase()
            .includes(this.orderSearch().toLowerCase()),
      ),
  );
  readonly paymentMethod = signal<PaymentMethod>('efectivo');
  readonly paymentAmount = signal(0);
  readonly paymentReference = signal('');
  readonly bankId = signal('');
  readonly plazaId = signal('');
  readonly chequeNumber = signal('');
  readonly accountNumber = signal('');
  readonly chequeDate = signal(chileCivilDate());
  readonly issuerName = signal('');
  readonly issuerRut = signal('');
  readonly holderName = signal('');
  readonly holderRut = signal('');
  readonly changeDisposition = signal<'cash' | 'advance'>('cash');
  readonly changeOptions = [
    { label: 'Entregar en efectivo', value: 'cash' },
    { label: 'Guardar como anticipo del cliente', value: 'advance' },
  ];
  readonly currencyAmount = signal(0);
  readonly exchangeRate = signal(950);
  readonly payments = signal<PaymentInput[]>([]);
  readonly categories = computed(() => [
    'Todas',
    ...new Set(
      this.store
        .snapshot()
        .products.filter((item) => item.active)
        .map((item) => item.category),
    ),
  ]);
  readonly products = computed(() =>
    this.store
      .snapshot()
      .products.filter(
        (item) =>
          item.active &&
          (this.category() === 'Todas' || item.category === this.category()) &&
          `${item.name} ${item.sku} ${item.barcode}`
            .toLocaleLowerCase()
            .includes(this.query().toLocaleLowerCase()),
      ),
  );
  readonly customers = computed(() => [
    { id: null, name: 'Venta a público' },
    ...this.store.snapshot().customers.filter((item) => item.active),
  ]);
  readonly selectedCustomer = computed(() =>
    this.store.snapshot().customers.find((item) => item.id === this.customerId()),
  );
  readonly quote = computed(() => this.store.quote(this.lines(), this.customerId(), this.orderReference()));
  readonly total = computed(() => {
    const result = this.quote();
    return result.ok ? result.value.total : 0;
  });
  readonly paid = computed(() => this.payments().reduce((sum, item) => sum + item.amount, 0));
  readonly nonCashPaid = computed(() =>
    this.payments()
      .filter((item) => item.method !== 'efectivo')
      .reduce((sum, item) => sum + item.amount, 0),
  );
  readonly cashTendered = computed(() =>
    this.payments()
      .filter((item) => item.method === 'efectivo')
      .reduce((sum, item) => sum + item.amount, 0),
  );
  readonly roundingAdjustment = computed(() =>
    this.cashTendered() > 0 || this.paymentMethod() === 'efectivo'
      ? roundCash(Math.max(0, this.total() - this.nonCashPaid())) -
        Math.max(0, this.total() - this.nonCashPaid())
      : 0,
  );
  readonly payable = computed(() => this.total() + this.roundingAdjustment());
  readonly remaining = computed(() => Math.max(0, this.payable() - this.paid()));
  readonly change = computed(() => Math.max(0, this.paid() - this.payable()));
  readonly creditFirstDue = computed(() => {
    const day = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return new Date(Date.parse(day) + (this.selectedCustomer()?.creditTerms.periodDays ?? 30) * 86400000)
      .toISOString()
      .slice(0, 10);
  });
  readonly paymentOptions = computed(() =>
    (Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][])
      .filter(([value]) => this.paymentEnabled(value))
      .map(([value, label]) => ({ value, label })),
  );
  readonly creditNotes = computed(() =>
    this.store.snapshot().creditNotes.flatMap((item) => {
      const quote = this.store.quoteCreditNoteApplication(item.id, this.customerId());
      return quote.ok && quote.value.availableAmount > 0
        ? [
            {
              id: item.id,
              label: `${item.number} · Saldo utilizable ${money(quote.value.availableAmount)}`,
            },
          ]
        : [];
    }),
  );
  readonly advances = computed(() =>
    this.store
      .snapshot()
      .collections.filter(
        (item) =>
          item.kind === 'advance' &&
          item.customerId === this.customerId() &&
          item.amount > item.appliedAmount,
      )
      .map((item) => ({
        id: item.id,
        label: `${item.reference} · Saldo ${money(item.amount - item.appliedAmount)}`,
      })),
  );
  readonly documentOptions = [
    { label: 'Boleta electrónica', value: 'boleta' },
    { label: 'Factura electrónica', value: 'factura' },
  ];
  readonly deliveryOptions = [
    { label: 'Retiro en tienda', value: 'pickup' },
    { label: 'Despacho', value: 'delivery' },
  ];
  readonly paymentScenarios = [
    { label: 'Pago aprobado', value: 'confirmed' },
    { label: 'Respuesta desconocida · conciliar', value: 'unknown' },
    { label: 'Pago rechazado', value: 'failed' },
  ];
  readonly activeOffers = computed(() =>
    this.store
      .snapshot()
      .offers.filter(
        (item) =>
          item.active && Date.parse(item.startsAt) <= Date.now() && Date.parse(item.endsAt) >= Date.now(),
      ),
  );
  private operationKey = crypto.randomUUID();

  constructor() {
    effect(() => {
      const draft = {
        lines: this.lines(),
        customerId: this.customerId(),
        documentType: this.documentType(),
        metadata: {
          orderReference: this.orderReference(),
          deliveryMode: this.deliveryMode(),
          deliveryAddress: this.deliveryAddress(),
          contact: this.deliveryContact(),
          coupon: this.appliedOffer(),
        },
      };
      const empty =
        !draft.lines.length &&
        !draft.customerId &&
        draft.documentType === 'boleta' &&
        draft.metadata.deliveryMode === 'pickup' &&
        !draft.metadata.orderReference &&
        !draft.metadata.deliveryAddress &&
        !draft.metadata.contact &&
        !draft.metadata.coupon;
      untracked(() => {
        if (empty && !this.store.snapshot().activeDraft) return;
        const result = empty ? this.store.clearActiveDraft() : this.store.saveActiveDraft(draft);
        if (!result.ok) this.error.set(result.error);
      });
    });
  }

  product(id: string): Product | undefined {
    return this.store.snapshot().products.find((item) => item.id === id);
  }
  pricedLine(id: string) {
    const result = this.quote();
    return result.ok ? result.value.lines.find((item) => item.productId === id) : undefined;
  }
  paymentEnabled(method: PaymentMethod): boolean {
    if (method === 'efectivo') return this.store.can('sell', 'cashPayment');
    if (method === 'cheque') return this.store.can('sell', 'chequePayment');
    if (method === 'cuenta') return this.store.can('sell', 'creditPayment');
    if (method === 'nota_credito') return this.store.can('sell', 'creditNotePayment');
    if (method === 'usd') return this.store.can('sell', 'usdPayment');
    if (method === 'anticipo') return this.store.can('sell', 'advancePayment');
    return this.store.can('sell', 'sales');
  }
  add(product: Product): void {
    if (!this.store.can('sell', 'sales')) {
      this.error.set('Tu perfil no permite iniciar ventas.');
      return;
    }
    if (this.loadedOrder()?.locked) {
      this.error.set(
        'Esta orden de venta conserva sus condiciones comerciales y no permite modificar productos.',
      );
      return;
    }
    this.error.set('');
    this.feedback.set('');
    this.lines.update((lines) => {
      const found = lines.find((item) => item.productId === product.id);
      return found
        ? lines.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...lines, { productId: product.id, quantity: 1, discount: 0 }];
    });
  }
  scan(): void {
    const exact = this.products().find(
      (item) => item.barcode === this.query() || item.sku.toLowerCase() === this.query().toLowerCase(),
    );
    if (exact) {
      this.add(exact);
      this.query.set('');
    } else if (this.products().length === 1) {
      this.add(this.products()[0]);
      this.query.set('');
    }
  }
  updateLine(id: string, field: 'quantity' | 'discount', value: number | null): void {
    if (this.loadedOrder()?.locked) return;
    this.lines.update((lines) =>
      lines.map((item) => (item.productId === id ? { ...item, [field]: value ?? 0 } : item)),
    );
  }
  remove(id: string): void {
    if (this.loadedOrder()?.locked) return;
    this.lines.update((lines) => lines.filter((item) => item.productId !== id));
  }
  loadOrder(id: string): void {
    if (this.lines().length) {
      this.error.set('Pausa la venta actual antes de cargar una orden.');
      return;
    }
    const result = this.store.loadSalesOrder(id);
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    const order = result.value;
    this.lines.set(structuredClone(order.lines));
    this.customerId.set(order.customerId);
    this.documentType.set('factura');
    this.orderReference.set(order.number);
    this.deliveryMode.set(order.deliveryMode);
    this.deliveryAddress.set(order.address);
    this.deliveryContact.set(order.contact);
    this.ordersVisible.set(false);
    this.error.set('');
    this.feedback.set(
      `Orden ${order.number} cargada. ${order.locked ? 'Conserva sus condiciones comerciales.' : 'Puedes revisar sus productos antes de cobrar.'}`,
    );
  }
  orderCustomer(id: string): string {
    return this.store.snapshot().customers.find((item) => item.id === id)?.name ?? id;
  }
  orderTotal(id: string): number {
    const order = this.store.snapshot().salesOrders.find((item) => item.id === id);
    if (!order) return 0;
    const quote = this.store.quote(order.lines, order.customerId, order.number);
    return quote.ok ? quote.value.total : 0;
  }
  hold(): void {
    const result = this.store.holdSale(
      this.lines(),
      this.customerId(),
      this.documentType(),
      this.selectedCustomer()?.name ?? 'Venta a público',
      {
        orderReference: this.orderReference(),
        deliveryMode: this.deliveryMode(),
        deliveryAddress: this.deliveryAddress(),
        contact: this.deliveryContact(),
        coupon: this.appliedOffer(),
      },
    );
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.clear();
    this.feedback.set('Venta pausada. Puedes retomarla desde Ventas pausadas.');
  }
  resume(id: string): void {
    if (this.lines().length) {
      this.error.set('Pausa o vacía la venta actual antes de retomar otra.');
      this.heldVisible.set(false);
      return;
    }
    const result = this.store.resumeSale(id);
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.lines.set(result.value.lines);
    this.customerId.set(result.value.customerId);
    this.documentType.set(result.value.documentType);
    this.deliveryMode.set(result.value.metadata.deliveryMode ?? 'pickup');
    this.deliveryAddress.set(result.value.metadata.deliveryAddress ?? '');
    this.deliveryContact.set(result.value.metadata.contact ?? '');
    this.orderReference.set(result.value.metadata.orderReference ?? '');
    this.appliedOffer.set(result.value.metadata.coupon ?? '');
    this.heldVisible.set(false);
    this.error.set('');
    this.operationKey = crypto.randomUUID();
  }
  clear(): void {
    this.lines.set([]);
    this.payments.set([]);
    this.customerId.set(null);
    this.documentType.set('boleta');
    this.deliveryMode.set('pickup');
    this.deliveryAddress.set('');
    this.deliveryContact.set('');
    this.orderReference.set('');
    this.appliedOffer.set('');
    this.offerId.set('');
    this.paymentScenario.set('confirmed');
    this.error.set('');
    this.operationKey = crypto.randomUUID();
  }
  createCustomer(): void {
    if (this.loadedOrder()?.locked) {
      this.error.set('La orden conserva su cliente original.');
      return;
    }
    const result = this.store.createCustomer({
      name: this.customerName(),
      rut: this.customerRut(),
      email: this.customerEmail(),
      phone: this.customerPhone(),
      address: this.customerAddress(),
      city: this.customerCity(),
      business: this.customerBusiness(),
    });
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.customerId.set(result.value.id);
    this.customerVisible.set(false);
    this.error.set('');
    this.feedback.set('Cliente creado y seleccionado en la venta.');
    this.customerName.set('');
    this.customerRut.set('');
    this.customerEmail.set('');
    this.customerPhone.set('');
    this.customerAddress.set('');
    this.customerCity.set('');
    this.customerBusiness.set('');
  }
  applyOffer(): void {
    if (this.loadedOrder()?.locked) {
      this.error.set('La orden mantiene sus precios y descuentos originales.');
      return;
    }
    const result = this.store.applyOffer(this.lines(), this.offerId());
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.lines.set(result.value);
    const name = this.activeOffers().find((item) => item.id === this.offerId())?.name ?? this.offerId();
    this.appliedOffer.set(name);
    this.error.set('');
    this.feedback.set(`Promoción aplicada: ${name}.`);
  }
  convertUsd(): void {
    this.paymentAmount.set(Math.round(this.currencyAmount() * this.exchangeRate()));
  }
  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
    this.paymentReference.set('');
    this.paymentAmount.set(this.remaining());
  }
  startPayment(): void {
    this.error.set('');
    const quote = this.quote();
    if (!quote.ok) {
      this.error.set(quote.error);
      return;
    }
    if (!this.store.snapshot().session || this.store.snapshot().session?.status !== 'open') {
      this.error.set('Abre una sesión de caja antes de cobrar.');
      return;
    }
    if (this.documentType() === 'factura' && !this.customerId()) {
      this.error.set('Selecciona un cliente para emitir la factura.');
      return;
    }
    if (
      this.deliveryMode() === 'delivery' &&
      (!this.deliveryAddress().trim() || !this.deliveryContact().trim())
    ) {
      this.error.set('Completa la dirección y el contacto del despacho.');
      return;
    }
    this.payments.set([]);
    this.paymentMethod.set(this.paymentOptions()[0]?.value ?? 'efectivo');
    this.paymentAmount.set(this.payable());
    this.paymentReference.set('');
    this.changeDisposition.set('cash');
    this.paying.set(true);
  }
  addPayment(): void {
    this.error.set('');
    const amount = this.paymentAmount();
    const method = this.paymentMethod();
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      this.error.set('Ingresa un monto entero mayor que cero.');
      return;
    }
    if (!this.paymentEnabled(method)) {
      this.error.set('Este medio de pago está deshabilitado.');
      return;
    }
    if (this.payments().length && !this.store.can('sell', 'splitPayment')) {
      this.error.set('El pago mixto está deshabilitado.');
      return;
    }
    if (method !== 'efectivo' && amount > this.remaining()) {
      this.error.set('Este medio no permite un monto superior al saldo.');
      return;
    }
    if (['transferencia', 'cheque'].includes(method) && this.paymentReference().trim().length < 3) {
      this.error.set('Indica la referencia de la transferencia o del cheque verificado.');
      return;
    }
    if (method === 'cuenta' && !this.customerId()) {
      this.error.set('El crédito requiere un cliente identificado.');
      return;
    }
    if (method === 'nota_credito' && !this.paymentReference()) {
      this.error.set('Selecciona una nota de crédito disponible.');
      return;
    }
    if (method === 'anticipo' && (!this.customerId() || !this.paymentReference())) {
      this.error.set('Selecciona un cliente y uno de sus anticipos disponibles.');
      return;
    }
    if (
      method === 'cheque' &&
      (!this.bankId() ||
        !this.plazaId() ||
        !this.chequeNumber() ||
        !this.accountNumber() ||
        !this.chequeDate() ||
        !this.issuerName().trim() ||
        !this.issuerRut().trim() ||
        !this.holderName().trim() ||
        !this.holderRut().trim())
    ) {
      this.error.set('Completa los datos bancarios y los datos del emisor y portador del cheque.');
      return;
    }
    this.payments.update((items) => [
      ...items,
      {
        method,
        amount,
        reference: this.paymentReference().trim(),
        details:
          method === 'cheque'
            ? {
                bankId: this.bankId(),
                plazaId: this.plazaId(),
                chequeNumber: this.chequeNumber(),
                accountNumber: this.accountNumber(),
                dueAt: this.chequeDate(),
                issuerName: this.issuerName(),
                issuerRut: this.issuerRut(),
                holderName: this.holderName(),
                holderRut: this.holderRut(),
              }
            : method === 'usd'
              ? { currencyAmount: this.currencyAmount(), exchangeRate: this.exchangeRate() }
              : undefined,
      },
    ]);
    this.paymentAmount.set(this.remaining());
    this.paymentReference.set('');
  }
  removePayment(index: number): void {
    this.payments.update((items) => items.filter((_, current) => current !== index));
    this.paymentAmount.set(this.remaining());
  }
  finish(): void {
    let change = this.change();
    const appliedPayments = this.payments()
      .map((payment) => {
        if (payment.method !== 'efectivo' || !change) return payment;
        const returned = Math.min(change, payment.amount);
        change -= returned;
        return { ...payment, amount: payment.amount - returned };
      })
      .filter((payment) => payment.amount > 0 || payment.method === 'efectivo');
    if (this.roundingAdjustment() && !appliedPayments.some((payment) => payment.method === 'efectivo'))
      appliedPayments.push({ method: 'efectivo', amount: 0 });
    const result = this.store.checkout({
      lines: this.lines(),
      customerId: this.customerId(),
      documentType: this.documentType(),
      payments: appliedPayments,
      idempotencyKey: this.operationKey,
      cashTendered: this.cashTendered(),
      changeDisposition: this.changeDisposition(),
      paymentScenario: this.payments().some((payment) => ['debito', 'credito'].includes(payment.method))
        ? this.paymentScenario()
        : 'confirmed',
      metadata: {
        orderReference: this.orderReference().trim(),
        deliveryMode: this.deliveryMode(),
        deliveryAddress: this.deliveryAddress().trim(),
        contact: this.deliveryContact().trim(),
        coupon: this.appliedOffer(),
      },
    });
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.receiptChange.set(this.change());
    this.receipt.set(result.value);
    this.paying.set(false);
    this.clear();
    this.feedback.set(`Venta ${result.value.number} guardada.`);
  }
  print(): void {
    const sale = this.receipt();
    if (!sale) return;
    const result = this.store.printDocument(sale.id);
    this.feedback.set(result.ok ? 'Comprobante enviado a la cola de impresión simulada.' : '');
    if (!result.ok) this.error.set(result.error);
  }
}

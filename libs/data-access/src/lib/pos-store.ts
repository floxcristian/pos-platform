import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  Agreement,
  AgreementInput,
  AppUpdate,
  AuditIdentity,
  Branch,
  CartLine,
  CashMovement,
  CashSession,
  CheckoutInput,
  Collection,
  CreditNote,
  Customer,
  CustodyDeposit,
  Device,
  DocumentType,
  HeldSale,
  Integration,
  ModuleId,
  Offer,
  OutboxEvent,
  PaymentMethod,
  Permission,
  PosSettings,
  PosSnapshot,
  PosUser,
  PriceRule,
  Product,
  ReferenceItem,
  ReferenceKind,
  Result,
  ReturnInput,
  Role,
  Sale,
  SaleMetadata,
  SalesOrder,
  SaleTotals,
  SyncJob,
  SyncRun,
  ROLE_LABELS,
  canPerform,
  calculateTotals,
  failure,
  nextScheduledRun,
  success,
  toLocalDate,
  validMoney,
  validateSchedule,
} from '@corporate-pos/domain';
import { createFixtures } from './fixtures';
import { MockSyncEngine } from './sync-engine';
import { POS_REPOSITORY, POS_SIMULATION } from './ports';
import {
  TransactionContext,
  cashMovement,
  checkoutTransaction,
  collectTransaction,
  createAgreementTransaction,
  collectInstallmentTransaction,
  issueCreditNoteTransaction,
  refundCreditNoteTransaction,
  quoteTransaction,
} from './transactions';
import {
  saveBranchRecord,
  saveCustomerRecord,
  saveOfferRecord,
  saveProductRecord,
  saveReferenceRecord,
  savePriceRuleRecord,
  saveUserRecord,
  updateSettingsRecord,
} from './administration';

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
@Injectable({ providedIn: 'root' })
export class PosStore {
  private readonly repository = inject(POS_REPOSITORY);
  private readonly simulation = inject(POS_SIMULATION);
  private readonly destroyRef = inject(DestroyRef);
  private initialPersistenceError: string | null = null;
  private readonly state = signal<PosSnapshot>(this.initialize());
  readonly snapshot = this.state.asReadonly();
  readonly clock = signal(this.simulation.now());
  readonly currentUser = computed(
    () =>
      this.snapshot().users.find((user) => user.role === this.snapshot().role && user.active) ??
      this.snapshot().users[0],
  );
  readonly branch = computed(() =>
    this.snapshot().branches.find((branch) => branch.id === this.snapshot().settings.branchId),
  );
  readonly pendingEvents = computed(() => this.snapshot().outbox.filter((event) => event.status !== 'sent'));
  readonly persistenceError = signal<string | null>(this.initialPersistenceError);
  private generation = 0;
  private readonly syncEngine = new MockSyncEngine(
    {
      snapshot: () => this.snapshot(),
      can: (permission, module) => this.can(permission, module),
      isEnabled: (module) => this.isEnabled(module),
      generation: () => this.generation,
      identity: () => this.auditIdentity(),
      commit: <T>(
        draft: PosSnapshot,
        value: T,
        action: string,
        entity: string,
        identity?: AuditIdentity,
      ): Result<T> => this.commit(draft, value, action, entity, action, identity),
      log: (draft, source, message, correlationId, level) =>
        this.log(draft, source, message, correlationId, level),
      publish: (draft) => {
        const saved = this.repository.save(draft);
        if (!saved.ok) {
          this.persistenceError.set(saved.error);
          return saved;
        }
        this.persistenceError.set(null);
        this.state.set(freeze(draft));
        return success(undefined);
      },
    },
    this.simulation,
  );

  constructor() {
    const interval = setInterval(() => {
      this.clock.set(this.simulation.now());
      this.syncEngine.tickSchedules();
    }, 20000);
    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
      this.generation++;
    });
  }
  private initialize(): PosSnapshot {
    const loaded = this.repository.load();
    const state = loaded.ok && loaded.value ? loaded.value : createFixtures(this.simulation.now());
    const now = this.simulation.now().toISOString();
    for (const job of state.syncJobs) {
      if (job.status === 'running') {
        job.status = 'failed';
        job.lastError = 'Ejecución interrumpida al cerrar la aplicación. Puedes reintentar.';
        job.progress = 0;
      }
      if (!job.nextRun) job.nextRun = nextScheduledRun(job.schedule, this.simulation.now());
    }
    for (const run of state.syncRuns.filter((run) => run.status === 'running')) {
      run.status = 'failed';
      run.finishedAt = now;
      run.error = 'La aplicación se cerró antes de terminar.';
    }
    for (const event of state.outbox.filter((event) => event.status === 'processing')) {
      event.status = 'failed';
      event.lastError = 'Envío interrumpido. Reintentar conserva el identificador.';
    }
    if (!loaded.ok)
      state.logs.unshift({
        id: this.simulation.id('log'),
        createdAt: now,
        source: 'persistence',
        level: 'warning',
        message: loaded.error,
        correlationId: 'local-recovery',
      });
    const saved = this.repository.save(state);
    if (!saved.ok) this.initialPersistenceError = saved.error;
    return freeze(state);
  }
  can(permission: Permission, module?: ModuleId): boolean {
    return canPerform(this.snapshot().role, permission, this.snapshot().modules, module);
  }
  isEnabled(id: ModuleId): boolean {
    return this.snapshot().modules.some((module) => module.id === id && module.enabled);
  }
  private context(): TransactionContext {
    return {
      now: this.simulation.now().toISOString(),
      id: (prefix) => this.simulation.id(prefix),
      actor: this.currentUser()?.name ?? `${ROLE_LABELS[this.snapshot().role]} Demo`,
    };
  }
  private auditIdentity(): AuditIdentity {
    return { actor: this.context().actor, role: this.snapshot().role };
  }
  private commit<T>(
    draft: PosSnapshot,
    value: T,
    action: string,
    entity: string,
    detail = action,
    identity: AuditIdentity = this.auditIdentity(),
  ): Result<T> {
    const context = this.context();
    draft.audit.unshift({
      id: context.id('audit'),
      createdAt: context.now,
      actor: identity.actor,
      role: identity.role,
      action,
      entity,
      detail,
    });
    draft.audit = draft.audit.slice(0, 1000);
    draft.logs = draft.logs.slice(0, 1000);
    const saved = this.repository.save(draft);
    if (!saved.ok) {
      this.persistenceError.set(saved.error);
      return saved;
    }
    this.persistenceError.set(null);
    this.state.set(freeze(draft));
    return success(value);
  }
  private command<T>(
    permission: Permission,
    module: ModuleId | undefined,
    action: string,
    entity: string,
    operation: (draft: PosSnapshot, context: TransactionContext) => Result<T>,
    identity?: AuditIdentity,
  ): Result<T> {
    if (!this.can(permission, module))
      return failure('Tu perfil no tiene permiso o esta funcionalidad está deshabilitada.');
    const draft = structuredClone(this.snapshot());
    const result = operation(draft, this.context());
    return result.ok ? this.commit(draft, result.value, action, entity, action, identity) : result;
  }
  private log(
    draft: PosSnapshot,
    source: string,
    message: string,
    correlationId: string,
    level: 'info' | 'warning' | 'error' = 'info',
  ): void {
    draft.logs.unshift({
      id: this.simulation.id('log'),
      createdAt: this.simulation.now().toISOString(),
      level,
      source,
      message,
      correlationId,
    });
  }

  switchRole(role: Role): Result<Role> {
    if (!['admin', 'supervisor', 'cashier', 'auditor'].includes(role)) return failure('El perfil no existe.');
    const draft = structuredClone(this.snapshot());
    draft.role = role;
    return this.commit(
      draft,
      role,
      'demo.role.changed',
      'identity',
      `Perfil de demostración: ${ROLE_LABELS[role]}`,
    );
  }
  setOnline(online: boolean): Result<boolean> {
    const draft = structuredClone(this.snapshot());
    draft.online = online;
    this.log(
      draft,
      'connectivity',
      online ? 'Conexión simulada restablecida.' : 'Modo sin conexión simulado activado.',
      'demo-network',
    );
    return this.commit(draft, online, 'demo.network.changed', 'network');
  }
  setTheme(theme: PosSettings['theme']): Result<PosSettings> {
    if (!['light', 'dark', 'system'].includes(theme)) return failure('El tema no existe.');
    const draft = structuredClone(this.snapshot());
    draft.settings.theme = theme;
    return this.commit(draft, draft.settings, 'preference.theme.changed', 'settings');
  }
  setModule(id: ModuleId, enabled: boolean): Result<void> {
    return this.command('configure', undefined, 'module.changed', id, (draft) => {
      const module = draft.modules.find((item) => item.id === id);
      if (!module) return failure('El módulo no existe.');
      if (id === 'sync' && !enabled && draft.syncJobs.some((job) => job.status === 'running'))
        return failure('Espera que termine la sincronización para deshabilitar el módulo.');
      module.enabled = enabled;
      return success(undefined);
    });
  }
  quote(lines: CartLine[], customerId: string | null = null, orderReference?: string): Result<SaleTotals> {
    return quoteTransaction(this.snapshot(), lines, customerId, orderReference);
  }
  loadSalesOrder(id: string): Result<SalesOrder> {
    if (!this.can('sell', 'sales')) return failure('No tienes permiso para cargar órdenes de venta.');
    const order = this.snapshot().salesOrders.find((item) => item.id === id);
    if (!order || order.status !== 'open') return failure('La orden no está disponible para pago.');
    return success(structuredClone(order));
  }
  createAgreement(input: AgreementInput): Result<Agreement> {
    return this.command('collect', 'collections', 'agreement.created', input.customerId, (draft, context) =>
      createAgreementTransaction(draft, input, context),
    );
  }
  collectInstallment(
    agreementId: string,
    installmentId: string,
    amount: number,
    method: PaymentMethod,
  ): Result<Collection[]> {
    return this.command('collect', 'collections', 'installment.collected', installmentId, (draft, context) =>
      collectInstallmentTransaction(draft, agreementId, installmentId, amount, method, context),
    );
  }
  confirmCustodyDeposit(
    movementId: string,
    input: { bankId: string; reference: string; date: string },
  ): Result<CustodyDeposit> {
    return this.command('cash', 'cash', 'custody.deposit.confirmed', movementId, (draft, context) => {
      const movement = draft.cashMovements.find((item) => item.id === movementId && item.type === 'custody');
      if (!movement) return failure('El retiro de custodia no existe.');
      if (draft.custodyDeposits.some((deposit) => deposit.movementId === movementId))
        return failure('La custodia ya tiene un depósito confirmado.');
      if (
        !draft.referenceCatalogs.bank.some((bank) => bank.id === input.bankId && bank.active) ||
        !input.reference.trim() ||
        !toLocalDate(input.date)
      )
        return failure('Completa banco, referencia y fecha válida.');
      const deposit: CustodyDeposit = {
        id: context.id('deposit'),
        movementId,
        bankId: input.bankId,
        reference: input.reference.trim(),
        date: toLocalDate(input.date) ?? input.date,
        amount: movement.amount,
        createdAt: context.now,
      };
      draft.custodyDeposits.unshift(deposit);
      return success(deposit);
    });
  }
  applyOffer(lines: CartLine[], code: string): Result<CartLine[]> {
    if (!this.can('sell', 'sales') || !this.isEnabled('discounts'))
      return failure('Las ofertas no están habilitadas para este perfil.');
    const now = this.simulation.now().getTime();
    const offer = this.snapshot().offers.find(
      (item) =>
        (item.id.toLowerCase() === code.trim().toLowerCase() ||
          item.name.toLowerCase() === code.trim().toLowerCase()) &&
        item.active &&
        Date.parse(item.startsAt) <= now &&
        Date.parse(item.endsAt) >= now,
    );
    if (!offer || !lines.some((line) => offer.productIds.includes(line.productId)))
      return failure('No hay una oferta vigente para ese código y los productos del carro.');
    return success(
      lines.map((line) => ({
        ...line,
        discount: offer.productIds.includes(line.productId)
          ? Math.max(line.discount, offer.discountPercent)
          : line.discount,
      })),
    );
  }
  checkout(input: CheckoutInput): Result<Sale> {
    return this.command('sell', 'sales', 'sale.created', input.idempotencyKey, (draft, context) =>
      checkoutTransaction(draft, input, context),
    );
  }
  holdSale(
    lines: CartLine[],
    customerId: string | null,
    documentType: DocumentType,
    label: string,
    metadata: SaleMetadata = {},
  ): Result<HeldSale> {
    return this.command('sell', 'sales', 'sale.held', 'held-sale', (draft, context) => {
      const quote = calculateTotals(lines, draft.products);
      if (!quote.ok) return quote;
      if (customerId && !draft.customers.some((customer) => customer.id === customerId && customer.active))
        return failure('El cliente no existe o está inactivo.');
      const held: HeldSale = {
        id: context.id('held'),
        label: label.trim() || `Venta en espera ${draft.heldSales.length + 1}`,
        lines: structuredClone(lines),
        customerId,
        documentType,
        createdAt: context.now,
        metadata: structuredClone(metadata),
      };
      draft.heldSales.unshift(held);
      return success(held);
    });
  }
  resumeSale(id: string): Result<HeldSale> {
    return this.command('sell', 'sales', 'sale.resumed', id, (draft) => {
      const held = draft.heldSales.find((item) => item.id === id);
      if (!held) return failure('La venta en espera no existe.');
      draft.heldSales = draft.heldSales.filter((item) => item.id !== id);
      return success(held);
    });
  }
  openSession(amount: number): Result<CashSession> {
    return this.command('cash', 'cash', 'cash.opened', 'cash-session', (draft, context) => {
      if (draft.session?.status === 'open') return failure('Ya hay un turno abierto.');
      if (!validMoney(amount, true)) return failure('El fondo debe ser un entero no negativo.');
      const session: CashSession = {
        id: context.id('session'),
        openedAt: context.now,
        closedAt: null,
        cashier: context.actor,
        openingAmount: amount,
        expectedAmount: amount,
        countedAmount: null,
        difference: null,
        status: 'open',
        branchId: draft.settings.branchId,
      };
      draft.session = session;
      if (amount)
        draft.cashMovements.unshift({
          id: context.id('cash'),
          sessionId: session.id,
          type: 'opening',
          amount,
          reason: 'Fondo de apertura',
          createdAt: context.now,
          actor: context.actor,
          reference: session.id,
        });
      return success(session);
    });
  }
  closeSession(
    counted: number,
    options: { kind: 'partial' | 'complete' | 'handover'; reason?: string } = { kind: 'complete' },
  ): Result<CashSession> {
    return this.command(
      'cash',
      'cash',
      options.kind === 'partial'
        ? 'cash.counted'
        : options.kind === 'handover'
          ? 'cash.handover'
          : 'cash.closed',
      'cash-session',
      (draft, context) => {
        const session = draft.session;
        if (!session || session.status !== 'open') return failure('No hay un turno abierto.');
        if (!validMoney(counted, true)) return failure('El efectivo contado debe ser un entero no negativo.');
        if (
          draft.sales.some((sale) => sale.sessionId === session.id && sale.paymentStatus === 'unknown') &&
          options.kind !== 'partial'
        )
          return failure('Concilia los pagos de resultado desconocido antes de cerrar.');
        const difference = counted - session.expectedAmount;
        if (difference && !options.reason?.trim())
          return failure('Explica la diferencia del arqueo antes de guardar.');
        session.countedAmount = counted;
        session.difference = difference;
        if (options.kind !== 'partial') {
          session.status = 'closed';
          session.closedAt = context.now;
          draft.sessions.unshift(structuredClone(session));
        }
        this.log(
          draft,
          'cash',
          `Arqueo ${options.kind === 'partial' ? 'parcial' : 'final'}: diferencia ${difference} CLP. ${options.reason ?? ''}`,
          session.id,
          difference ? 'warning' : 'info',
        );
        return success(session);
      },
    );
  }
  moveCash(type: 'income' | 'expense' | 'custody', amount: number, reason: string): Result<CashMovement> {
    return this.command('cash', 'cash', `cash.${type}`, 'cash-movement', (draft, context) => {
      if (!['income', 'expense', 'custody'].includes(type)) return failure('El movimiento no es válido.');
      if (reason.trim().length < 5) return failure('Describe el motivo con al menos cinco caracteres.');
      return cashMovement(draft, context, type, amount, reason.trim());
    });
  }
  collect(receivableId: string, amount: number, method: PaymentMethod): Result<Collection> {
    return this.command('collect', 'collections', 'collection.created', receivableId, (draft, context) => {
      const debt = draft.receivables.find((item) => item.id === receivableId);
      return debt
        ? collectTransaction(draft, context, debt.customerId, receivableId, amount, method)
        : failure('La cuenta por cobrar no existe.');
    });
  }
  advance(customerId: string, amount: number, method: PaymentMethod): Result<Collection> {
    return this.command('collect', 'collections', 'advance.created', customerId, (draft, context) =>
      collectTransaction(draft, context, customerId, null, amount, method),
    );
  }
  issueCreditNote(input: ReturnInput): Result<CreditNote> {
    return this.command('refund', 'returns', 'credit-note.created', input.saleId, (draft, context) =>
      issueCreditNoteTransaction(draft, input, context),
    );
  }
  refundCreditNote(id: string, method: PaymentMethod): Result<CreditNote> {
    return this.command('refund', 'returns', 'credit-note.refunded', id, (draft, context) =>
      refundCreditNoteTransaction(draft, id, method, context),
    );
  }
  resolvePayment(saleId: string, outcome: 'confirmed' | 'failed'): Result<Sale> {
    return this.command('refund', 'sales', 'payment.reconciled', saleId, (draft) => {
      const sale = draft.sales.find((item) => item.id === saleId);
      if (!sale || sale.paymentStatus !== 'unknown')
        return failure('La venta no tiene un pago de resultado desconocido.');
      if (!draft.online) return failure('La conciliación simulada necesita conexión.');
      sale.payments.forEach((payment) => {
        if (payment.status === 'unknown') payment.status = outcome;
      });
      sale.paymentStatus = outcome;
      const order = draft.salesOrders.find((item) => item.saleId === saleId);
      if (order) {
        order.status = outcome === 'confirmed' ? 'paid' : 'open';
        if (outcome === 'failed') order.saleId = null;
      }
      this.log(draft, 'payments', `Resultado conciliado: ${outcome}. No se ejecutó otro cobro.`, saleId);
      return success(sale);
    });
  }
  printDocument(saleId: string): Result<string> {
    return this.command('sell', 'sales', 'document.printed', saleId, (draft) => {
      const sale = draft.sales.find((item) => item.id === saleId);
      if (!sale) return failure('El documento no existe.');
      if (
        !draft.devices.some(
          (device) => device.type === 'printer' && device.enabled && device.status === 'ready',
        )
      )
        return failure('Habilita una impresora disponible.');
      const receipt = `DOCUMENTO DE DEMOSTRACIÓN · SIN VALIDEZ TRIBUTARIA\n${draft.settings.companyName}\n${sale.number}\n${sale.lines.map((line) => `${line.quantity} × ${line.name}: $${line.total}`).join('\n')}\nTotal documento CLP: $${sale.total}\nAjuste redondeo: $${sale.roundingAdjustment}\nTotal cobrado: $${sale.paidTotal}\nVuelto: $${sale.change} (${sale.changeDisposition})\nEstado fiscal: ${sale.fiscalStatus}\n${draft.settings.receiptMessage}`;
      this.log(draft, 'printer', `Representación imprimible generada para ${sale.number}.`, saleId);
      return success(receipt);
    });
  }

  saveCustomer(input: Partial<Customer> & { name: string; rut: string }): Result<Customer> {
    return this.command('masters', 'masters', 'customer.saved', input.id ?? 'new', (draft, context) =>
      saveCustomerRecord(draft, input, context),
    );
  }
  createCustomer(input: Partial<Customer> & { name: string; rut: string }): Result<Customer> {
    return this.command('sell', 'sales', 'customer.created-at-checkout', 'new', (draft, context) => {
      if (input.id) return failure('La creación rápida solo admite clientes nuevos.');
      return saveCustomerRecord(draft, { ...input, creditLimit: 0, creditUsed: 0 }, context);
    });
  }
  saveProduct(input: Partial<Product> & { name: string; sku: string; price: number }): Result<Product> {
    return this.command('masters', 'masters', 'product.saved', input.id ?? 'new', (draft, context) =>
      saveProductRecord(draft, input, context),
    );
  }
  setPrice(productId: string, price: number): Result<Product> {
    return this.command('pricing', 'pricing', 'price.changed', productId, (draft, context) => {
      const product = draft.products.find((item) => item.id === productId);
      if (!product || !validMoney(price))
        return failure('Selecciona un producto e ingresa un precio entero mayor a cero.');
      product.price = price;
      product.updatedAt = context.now;
      return success(product);
    });
  }
  saveOffer(input: Offer): Result<Offer> {
    return this.command('pricing', 'pricing', 'offer.saved', input.id || 'new', (draft, context) =>
      saveOfferRecord(draft, input, context),
    );
  }
  savePriceRule(input: PriceRule): Result<PriceRule> {
    return this.command('pricing', 'pricing', 'price-rule.saved', input.id || 'new', (draft, context) =>
      savePriceRuleRecord(draft, input, context),
    );
  }
  updateSettings(input: Partial<PosSettings>): Result<PosSettings> {
    return this.command('configure', undefined, 'settings.changed', 'settings', (draft) =>
      updateSettingsRecord(draft, input),
    );
  }
  saveUser(input: PosUser): Result<PosUser> {
    return this.command('users', 'users', 'user.saved', input.id || 'new', (draft, context) =>
      saveUserRecord(draft, input, context),
    );
  }
  saveBranch(input: Branch): Result<Branch> {
    return this.command('configure', 'branches', 'branch.saved', input.id || 'new', (draft, context) =>
      saveBranchRecord(draft, input, context),
    );
  }
  saveReferenceItem(kind: ReferenceKind, input: ReferenceItem): Result<ReferenceItem> {
    return this.command(
      'masters',
      'masters',
      'reference.saved',
      `${kind}:${input.id || 'new'}`,
      (draft, context) => saveReferenceRecord(draft, kind, input, context),
    );
  }
  updateSyncJob(id: string, input: Partial<SyncJob>): Result<SyncJob> {
    return this.command('sync', 'sync', 'sync.schedule.changed', id, (draft) => {
      const job = draft.syncJobs.find((item) => item.id === id);
      if (!job) return failure('La sincronización no existe.');
      if (job.status === 'running') return failure('Espera a que termine la ejecución actual.');
      if (input.schedule) {
        const valid = validateSchedule(input.schedule);
        if (!valid.ok) return valid;
        job.schedule = structuredClone(valid.value);
        job.nextRun = nextScheduledRun(job.schedule, this.simulation.now());
      }
      if (input.failNext !== undefined) job.failNext = input.failNext;
      return success(job);
    });
  }
  setDevice(id: string, enabled: boolean): Result<Device> {
    return this.command('devices', 'devices', 'device.changed', id, (draft) => {
      const device = draft.devices.find((item) => item.id === id);
      if (!device) return failure('El dispositivo no existe.');
      device.enabled = enabled;
      device.status = enabled ? 'ready' : 'offline';
      return success(device);
    });
  }
  updateDevice(id: string, input: Partial<Device>): Result<Device> {
    return this.command('configure', 'devices', 'device.configured', id, (draft) => {
      const device = draft.devices.find((item) => item.id === id);
      if (!device) return failure('El dispositivo no existe.');
      if (input.name !== undefined) {
        if (!input.name.trim()) return failure('El dispositivo necesita un nombre.');
        device.name = input.name.trim();
      }
      if (input.connection !== undefined) {
        if (!input.connection.trim()) return failure('Describe la conexión simulada.');
        device.connection = input.connection.trim();
      }
      if (input.enabled !== undefined) {
        device.enabled = input.enabled;
        device.status = input.enabled ? 'ready' : 'offline';
      }
      return success(device);
    });
  }
  async testDevice(id: string): Promise<Result<Device>> {
    if (!this.can('devices', 'devices')) return failure('No tienes permiso para probar dispositivos.');
    const generation = this.generation,
      identity = this.auditIdentity();
    await this.simulation.wait(500);
    if (generation !== this.generation) return failure('La demostración se reinició durante la prueba.');
    return this.command(
      'devices',
      'devices',
      'device.tested',
      id,
      (draft, context) => {
        const device = draft.devices.find((item) => item.id === id);
        if (!device?.enabled) return failure('Habilita el dispositivo antes de probarlo.');
        device.lastTest = context.now;
        device.status = 'ready';
        this.log(draft, 'devices', `Prueba simulada correcta: ${device.name}.`, id);
        return success(device);
      },
      identity,
    );
  }
  setIntegration(id: string, enabled: boolean): Result<Integration> {
    return this.command('configure', 'integrations', 'integration.changed', id, (draft) => {
      const integration = draft.integrations.find((item) => item.id === id);
      if (!integration) return failure('La integración no existe.');
      integration.enabled = enabled;
      integration.status = enabled ? 'connected' : 'offline';
      return success(integration);
    });
  }
  updateIntegration(id: string, input: Partial<Integration>): Result<Integration> {
    return this.command('configure', 'integrations', 'integration.configured', id, (draft) => {
      const integration = draft.integrations.find((item) => item.id === id);
      if (!integration) return failure('La integración no existe.');
      if (input.name !== undefined) {
        if (!input.name.trim()) return failure('La integración necesita un nombre.');
        integration.name = input.name.trim();
      }
      if (input.provider !== undefined) {
        if (!input.provider.trim()) return failure('Identifica al proveedor simulado.');
        integration.provider = input.provider.trim();
      }
      if (input.enabled !== undefined) {
        integration.enabled = input.enabled;
        integration.status = input.enabled ? 'connected' : 'offline';
      }
      return success(integration);
    });
  }
  async testIntegration(id: string): Promise<Result<Integration>> {
    if (!this.can('configure', 'integrations'))
      return failure('No tienes permiso para probar integraciones.');
    const generation = this.generation,
      identity = this.auditIdentity();
    await this.simulation.wait(500);
    if (generation !== this.generation) return failure('La demostración se reinició durante la prueba.');
    return this.command(
      'configure',
      'integrations',
      'integration.tested',
      id,
      (draft, context) => {
        const integration = draft.integrations.find((item) => item.id === id);
        if (!integration?.enabled) return failure('Habilita la integración antes de probarla.');
        if (!draft.online) return failure('La prueba necesita conexión simulada.');
        integration.lastTest = context.now;
        integration.status = 'connected';
        this.log(draft, 'integrations', `Prueba simulada correcta: ${integration.name}.`, id);
        return success(integration);
      },
      identity,
    );
  }
  checkUpdate(): Result<AppUpdate> {
    return this.command('configure', 'updates', 'update.checked', 'application', (draft, context) => {
      if (!draft.online) return failure('La búsqueda de versiones necesita conexión.');
      draft.update.checkedAt = context.now;
      draft.update.status =
        draft.update.currentVersion === draft.update.availableVersion ? 'current' : 'available';
      return success(draft.update);
    });
  }
  downloadUpdate(): Result<AppUpdate> {
    return this.command('configure', 'updates', 'update.downloaded', 'application', (draft) => {
      if (!draft.online || draft.update.status !== 'available')
        return failure('Busca una versión disponible con conexión.');
      draft.update.status = 'downloaded';
      return success(draft.update);
    });
  }
  applyUpdate(): Result<AppUpdate> {
    return this.command('configure', 'updates', 'update.applied', 'application', (draft) => {
      if (draft.update.status !== 'downloaded') return failure('Descarga primero una actualización.');
      if (draft.session?.status === 'open')
        return failure('Cierra el turno antes de aplicar una actualización.');
      if (draft.syncJobs.some((job) => job.status === 'running'))
        return failure('Espera que terminen las sincronizaciones.');
      draft.update.currentVersion = draft.update.availableVersion;
      draft.update.status = 'current';
      return success(draft.update);
    });
  }
  resetDemo(): Result<void> {
    if (!this.can('configure')) return failure('Solo un administrador puede reiniciar la demostración.');
    this.generation++;
    const fresh = createFixtures(this.simulation.now());
    fresh.syncJobs.forEach((job) => (job.nextRun = nextScheduledRun(job.schedule, this.simulation.now())));
    return this.commit(fresh, undefined, 'demo.reset', 'workspace');
  }

  runSync(id: string): Promise<Result<SyncRun>> {
    return this.syncEngine.runSync(id);
  }
  retryOutbox(id: string): Promise<Result<OutboxEvent>> {
    return this.syncEngine.retryOutbox(id);
  }
  retryFiscal(saleId: string): Promise<Result<Sale>> {
    return this.syncEngine.retryFiscal(saleId);
  }
}

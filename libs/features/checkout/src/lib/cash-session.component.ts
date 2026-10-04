import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { PosStore } from '@corporate-pos/data-access';
import { CashMovement, chileCivilDate } from '@corporate-pos/domain';
import {
  PosTooltipDirective,
  CivilDateTimeComponent,
  DuotoneIconComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatusTagComponent,
  MetricCardComponent,
  money,
  date,
  dateTime,
  downloadCsv,
} from '@corporate-pos/ui';

@Component({
  selector: 'pos-cash-session',
  standalone: true,
  imports: [
    PosTooltipDirective,
    CivilDateTimeComponent,
    DuotoneIconComponent,
    EmptyStateComponent,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    MessageModule,
    PageHeaderComponent,
    StatusTagComponent,
    MetricCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pos-page-header
      heading="Caja y turno"
      eyebrow="Control de caja"
      subtitle="Apertura, movimientos, arqueo y cierre en un solo lugar."
    >
      @if (open()) {
        <a pButton routerLink="/venta" icon="pos-icon pos-icon-shopping-cart">Ir a vender</a>
      }
      <p-button
        label="Informe de caja"
        ariaLabel="Informe de caja"
        icon="pos-icon pos-icon-download-simple"
        severity="secondary"
        (onClick)="exportSession()"
        [disabled]="!session()"
      />
    </pos-page-header>
    @if (error()) {
      <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
    }
    @if (feedback()) {
      <p-message severity="success" class="block mb-4">{{ feedback() }}</p-message>
    }
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
      <pos-metric-card
        heading="Estado de caja"
        [value]="open() ? 'Abierta' : 'Cerrada'"
        [detail]="store.snapshot().settings.terminalId"
        icon="desktop"
      />
      <pos-metric-card
        heading="Fondo de apertura"
        [value]="money(session()?.openingAmount ?? 0)"
        [detail]="session() ? dateTime(session()!.openedAt) : 'Sin turno iniciado'"
        icon="wallet"
      />
      <pos-metric-card
        heading="Efectivo esperado"
        [value]="money(session()?.expectedAmount ?? 0)"
        detail="Apertura y movimientos del turno"
        icon="money"
      />
      <pos-metric-card
        heading="Operaciones del turno"
        [value]="movements().length"
        [detail]="session()?.cashier ?? 'Selecciona una caja para empezar'"
        icon="list-checks"
      />
    </div>
    @if (!open()) {
      <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 p-6 mb-6 max-w-3xl">
        <div class="flex items-start gap-4">
          <span
            class="size-14 shrink-0 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-surface-900 text-primary"
          >
            <pos-duotone-icon name="lock-key-open" [size]="32" />
          </span>
          <div>
            <h2 class="text-xl font-semibold">Comenzar un nuevo turno</h2>
            <p class="text-muted-color text-sm mt-2">
              Declara el efectivo inicial. La apertura queda asociada al cajero y la sucursal actual.
            </p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 mt-6">
          <label for="checkout-cash-session-1"
            ><span class="block font-semibold mb-2">Monto de apertura</span
            ><p-inputnumber
              inputId="checkout-cash-session-1"
              class="w-full"
              styleClass="w-full"
              [inputStyle]="{ width: '100%' }"
              [ngModel]="openingAmount()"
              (ngModelChange)="openingAmount.set($event ?? 0)"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="0"
              [maxFractionDigits]="0"
              ariaLabel="Monto de apertura" /></label
          ><label for="checkout-cash-session-2"
            ><span class="block font-semibold mb-2">Confirmar monto</span
            ><p-inputnumber
              inputId="checkout-cash-session-2"
              class="w-full"
              styleClass="w-full"
              [inputStyle]="{ width: '100%' }"
              [ngModel]="openingConfirm()"
              (ngModelChange)="openingConfirm.set($event ?? 0)"
              mode="currency"
              currency="CLP"
              locale="es-CL"
              [min]="0"
              [maxFractionDigits]="0"
              ariaLabel="Confirmar monto de apertura"
          /></label>
        </div>
        <p-button
          label="Abrir caja"
          ariaLabel="Abrir caja"
          icon="pos-icon pos-icon-lock-key-open"
          class="block mt-5"
          (onClick)="openSession()"
          [disabled]="!store.can('cash', 'cash')"
        />
      </section>
    } @else {
      <div class="flex flex-wrap justify-end gap-3 mb-6">
        <p-button
          label="Ingreso o retiro"
          ariaLabel="Ingreso o retiro"
          icon="pos-icon pos-icon-arrows-left-right"
          severity="secondary"
          (onClick)="movementVisible.set(true)"
        /><p-button
          label="Arqueo parcial"
          ariaLabel="Arqueo parcial"
          icon="pos-icon pos-icon-calculator"
          severity="secondary"
          (onClick)="beginClose('partial')"
        /><p-button
          label="Cambio de cajero"
          ariaLabel="Cambio de cajero"
          icon="pos-icon pos-icon-users"
          severity="secondary"
          (onClick)="beginClose('handover')"
        /><p-button
          label="Cerrar turno"
          ariaLabel="Cerrar turno"
          icon="pos-icon pos-icon-lock-key"
          (onClick)="beginClose('complete')"
        />
      </div>
    }
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden mb-6">
      <div class="p-5 flex items-center justify-between gap-3 border-b border-surface">
        <h2 id="cash-movements-heading" class="text-lg font-semibold">Movimientos del turno</h2>
        <span class="text-xs text-muted-color">{{ session()?.id ?? 'Sin sesión' }}</span>
      </div>
      @if (movements().length) {
        <div class="overflow-x-auto" role="region" aria-labelledby="cash-movements-heading" tabindex="0">
          <table class="pos-table w-full text-sm">
            <thead class="bg-surface-50 dark:bg-surface-900 text-left text-muted-color">
              <tr>
                <th class="p-4 font-medium">Hora</th>
                <th class="p-4 font-medium">Movimiento</th>
                <th class="p-4 font-medium">Concepto / referencia</th>
                <th class="p-4 font-medium">Responsable</th>
                <th class="p-4 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              @for (movement of movements(); track movement.id) {
                <tr class="border-t border-surface">
                  <td class="p-4 whitespace-nowrap">{{ dateTime(movement.createdAt) }}</td>
                  <td class="p-4 font-medium">{{ movementLabel(movement.type) }}</td>
                  <td class="p-4">
                    <p>{{ movement.reason }}</p>
                    <small class="text-muted-color">{{ movement.reference }}</small>
                  </td>
                  <td class="p-4">{{ movement.actor }}</td>
                  <td class="p-4 text-right tabular-nums">{{ money(movement.amount) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <pos-empty-state
          icon="arrows-left-right"
          heading="Sin movimientos en este turno"
          description="Aquí aparecerán los ingresos, retiros y movimientos de efectivo del turno."
          [headingLevel]="3"
        />
      }
    </section>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden">
      <h2 id="cash-history-heading" class="p-5 text-lg font-semibold border-b border-surface">
        Historial de turnos
      </h2>
      @if (store.snapshot().sessions.length) {
        <div class="overflow-x-auto" role="region" aria-labelledby="cash-history-heading" tabindex="0">
          <table class="pos-table w-full text-sm">
            <thead class="bg-surface-50 dark:bg-surface-900 text-left text-muted-color">
              <tr>
                <th class="p-4 font-medium">Apertura</th>
                <th class="p-4 font-medium">Cajero</th>
                <th class="p-4 font-medium">Estado</th>
                <th class="p-4 font-medium text-right">Declarado</th>
                <th class="p-4 font-medium text-right">Diferencia</th>
                <th class="p-4"></th>
              </tr>
            </thead>
            <tbody>
              @for (item of store.snapshot().sessions; track item.id) {
                <tr class="border-t border-surface">
                  <td class="p-4">{{ dateTime(item.openedAt) }}</td>
                  <td class="p-4">{{ item.cashier }}</td>
                  <td class="p-4"><pos-status-tag [value]="item.status" /></td>
                  <td class="p-4 text-right">
                    {{ item.countedAmount === null ? '—' : money(item.countedAmount) }}
                  </td>
                  <td class="p-4 text-right">
                    {{ item.difference === null ? '—' : money(item.difference) }}
                  </td>
                  <td class="p-3">
                    <p-button
                      posTooltip
                      icon="pos-icon pos-icon-download-simple"
                      severity="secondary"
                      [text]="true"
                      ariaLabel="Descargar informe del turno"
                      (onClick)="exportSession(item)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <pos-empty-state
          icon="clock"
          heading="Todavía no hay turnos cerrados."
          description="Al cerrar un turno, podrás consultar su resumen y descargar el informe aquí."
          [headingLevel]="3"
        />
      }
    </section>
    <section class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-950 overflow-hidden mt-6">
      <h2 id="cash-custody-heading" class="p-5 text-lg font-semibold border-b border-surface">
        Custodia y depósitos
      </h2>
      @if (custodyMovements().length) {
        <div class="overflow-x-auto" role="region" aria-labelledby="cash-custody-heading" tabindex="0">
          <table class="pos-table w-full text-sm">
            <thead class="text-left bg-surface-50 dark:bg-surface-900">
              <tr>
                <th class="p-4 font-medium">Entrega</th>
                <th class="p-4 font-medium">Responsable</th>
                <th class="p-4 font-medium text-right">Monto</th>
                <th class="p-4 font-medium">Depósito</th>
                <th class="p-4"></th>
              </tr>
            </thead>
            <tbody>
              @for (movement of custodyMovements(); track movement.id) {
                <tr class="border-t border-surface">
                  <td class="p-4">
                    {{ dateTime(movement.createdAt) }}
                    <p class="text-xs text-muted-color mt-1">{{ movement.reason }}</p>
                  </td>
                  <td class="p-4">{{ movement.actor }}</td>
                  <td class="p-4 text-right font-semibold">{{ money(movement.amount) }}</td>
                  <td class="p-4">
                    @if (depositFor(movement.id); as deposit) {
                      <pos-status-tag value="confirmed" label="Confirmado" />
                      <p class="text-xs text-muted-color mt-1">
                        {{ deposit.reference }} · {{ date(deposit.date) }}
                      </p>
                    } @else {
                      <pos-status-tag value="pending" label="Por confirmar" />
                    }
                  </td>
                  <td class="p-3">
                    <p-button
                      label="Confirmar depósito"
                      ariaLabel="Confirmar depósito"
                      size="small"
                      severity="secondary"
                      [disabled]="!!depositFor(movement.id) || !store.can('cash', 'cash')"
                      (onClick)="beginDeposit(movement)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <pos-empty-state
          icon="bank"
          heading="Sin entregas a custodia"
          description="Registra una entrega desde Ingreso o retiro. Aquí podrás confirmar su depósito."
          [headingLevel]="3"
        />
      }
    </section>
    <p-dialog
      header="Confirmar depósito de custodia"
      [visible]="depositVisible()"
      (visibleChange)="depositVisible.set($event)"
      [modal]="true"
      [style]="{ width: '32rem' }"
      [breakpoints]="{ '640px': '95vw' }"
    >
      @if (error()) {
        <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
      }
      <p class="text-2xl font-semibold mb-5">{{ money(depositMovement()?.amount ?? 0) }}</p>
      <div class="space-y-4">
        <label class="block" for="custody-bank"
          ><span class="block font-semibold mb-2">Banco receptor</span
          ><p-select
            inputId="custody-bank"
            class="w-full"
            [options]="store.snapshot().referenceCatalogs.bank"
            optionLabel="name"
            optionValue="id"
            [ngModel]="depositBank()"
            (ngModelChange)="depositBank.set($event)"
            ariaLabel="Banco receptor del depósito" /></label
        ><label class="block" for="custody-reference"
          ><span class="block font-semibold mb-2">Referencia del depósito</span
          ><input
            id="custody-reference"
            pInputText
            class="w-full"
            [ngModel]="depositReference()"
            (ngModelChange)="depositReference.set($event)" /></label
        ><label class="block" for="custody-date"
          ><span class="block font-semibold mb-2">Fecha</span
          ><pos-civil-date-time
            inputId="custody-date"
            ariaLabel="Fecha de depósito"
            class="w-full"
            [ngModel]="depositDate()"
            (ngModelChange)="depositDate.set($event)"
        /></label>
      </div>
      <p class="text-sm text-muted-color mt-4">
        Se asocia la confirmación a la entrega existente. El saldo de caja no cambia por segunda vez.
      </p>
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="depositVisible.set(false)" /><p-button
          label="Registrar confirmación"
          ariaLabel="Registrar confirmación"
          (onClick)="saveDeposit()" /></ng-template
    ></p-dialog>
    <p-dialog
      header="Movimiento de efectivo"
      [visible]="movementVisible()"
      (visibleChange)="movementVisible.set($event)"
      [modal]="true"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '95vw' }"
    >
      @if (error()) {
        <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
      }
      <div class="space-y-4">
        <label class="block" for="checkout-cash-session-3"
          ><span class="block font-semibold mb-2">Tipo</span
          ><p-select
            inputId="checkout-cash-session-3"
            class="w-full"
            [options]="movementTypes"
            optionLabel="label"
            optionValue="value"
            [ngModel]="movementType()"
            (ngModelChange)="movementType.set($event)"
            ariaLabel="Tipo de movimiento" /></label
        ><label class="block" for="checkout-cash-session-4"
          ><span class="block font-semibold mb-2">Monto</span
          ><p-inputnumber
            inputId="checkout-cash-session-4"
            class="w-full"
            styleClass="w-full"
            [inputStyle]="{ width: '100%' }"
            [ngModel]="movementAmount()"
            (ngModelChange)="movementAmount.set($event ?? 0)"
            mode="currency"
            currency="CLP"
            locale="es-CL"
            [min]="1"
            [maxFractionDigits]="0"
            ariaLabel="Monto de movimiento" /></label
        ><label class="block" for="checkout-cash-session-5"
          ><span class="block font-semibold mb-2">Motivo</span
          ><input
            id="checkout-cash-session-5"
            pInputText
            class="w-full"
            [ngModel]="movementReason()"
            (ngModelChange)="movementReason.set($event)"
            placeholder="Ej. Retiro para custodia"
        /></label>
      </div>
      <ng-template #footer
        ><p-button
          label="Cancelar"
          ariaLabel="Cancelar"
          severity="secondary"
          (onClick)="movementVisible.set(false)" /><p-button
          label="Registrar movimiento"
          ariaLabel="Registrar movimiento"
          (onClick)="move()"
      /></ng-template>
    </p-dialog>
    <p-dialog
      [header]="
        closeKind() === 'partial'
          ? 'Arqueo parcial'
          : closeKind() === 'handover'
            ? 'Cambio de cajero'
            : 'Cerrar turno'
      "
      [visible]="closingVisible()"
      (visibleChange)="closingVisible.set($event)"
      [modal]="true"
      [style]="{ width: '40rem' }"
      [breakpoints]="{ '700px': '95vw' }"
    >
      @if (error()) {
        <p-message severity="error" class="block mb-4">{{ error() }}</p-message>
      }
      <p class="text-sm text-muted-color mb-5">
        Cuenta el efectivo físico por denominación.
        {{
          closeKind() === 'partial'
            ? 'Este arqueo deja el turno abierto.'
            : closeKind() === 'handover'
              ? 'La caja quedará libre para que el siguiente cajero abra su turno.'
              : 'El cierre registra el resultado y finaliza el turno.'
        }}
      </p>
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-3">
        @for (denomination of denominations; track denomination) {
          <label class="rounded-xl border border-surface p-3" [attr.for]="'denomination-' + denomination"
            ><span class="text-sm font-medium block mb-2">{{ money(denomination) }}</span
            ><p-inputnumber
              [inputId]="'denomination-' + denomination"
              [ngModel]="counts()[denomination] ?? 0"
              (ngModelChange)="setCount(denomination, $event)"
              [min]="0"
              [max]="99999"
              [inputStyle]="{ width: '100%' }"
              styleClass="w-full"
              [ariaLabel]="'Cantidad de ' + money(denomination)"
          /></label>
        }
      </div>
      <dl class="my-5 space-y-3">
        <div class="flex justify-between">
          <dt>Efectivo contado</dt>
          <dd class="font-semibold">{{ money(counted()) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt>Efectivo esperado</dt>
          <dd class="font-semibold">{{ money(session()?.expectedAmount ?? 0) }}</dd>
        </div>
        <div class="flex justify-between border-t border-surface pt-3">
          <dt>Diferencia</dt>
          <dd class="font-semibold">{{ money(counted() - (session()?.expectedAmount ?? 0)) }}</dd>
        </div>
      </dl>
      <label class="block" for="checkout-cash-session-7"
        ><span class="block font-semibold mb-2"
          >Observación
          {{ counted() !== session()?.expectedAmount ? '(obligatoria con diferencia)' : '(opcional)' }}</span
        ><input
          id="checkout-cash-session-7"
          pInputText
          class="w-full"
          [ngModel]="closeReason()"
          (ngModelChange)="closeReason.set($event)"
      /></label>
      <ng-template #footer
        ><p-button
          label="Volver"
          ariaLabel="Volver"
          severity="secondary"
          (onClick)="closingVisible.set(false)" /><p-button
          [label]="
            closeKind() === 'partial'
              ? 'Guardar arqueo'
              : closeKind() === 'handover'
                ? 'Entregar caja'
                : 'Confirmar cierre'
          "
          [ariaLabel]="
            closeKind() === 'partial'
              ? 'Guardar arqueo'
              : closeKind() === 'handover'
                ? 'Entregar caja'
                : 'Confirmar cierre'
          "
          icon="pos-icon pos-icon-check"
          (onClick)="closeSession()"
      /></ng-template>
    </p-dialog>
  `,
})
export class CashSessionComponent {
  readonly store = inject(PosStore);
  readonly money = money;
  readonly date = date;
  readonly dateTime = dateTime;
  readonly session = computed(() => this.store.snapshot().session);
  readonly open = computed(() => this.session()?.status === 'open');
  readonly movements = computed(() =>
    this.store
      .snapshot()
      .cashMovements.filter((item) => item.sessionId === this.session()?.id)
      .slice()
      .reverse(),
  );
  readonly error = signal('');
  readonly feedback = signal('');
  readonly openingAmount = signal(100000);
  readonly openingConfirm = signal(0);
  readonly movementVisible = signal(false);
  readonly movementType = signal<'income' | 'expense' | 'custody'>('expense');
  readonly movementAmount = signal(0);
  readonly movementReason = signal('');
  readonly closingVisible = signal(false);
  readonly closeKind = signal<'partial' | 'complete' | 'handover'>('complete');
  readonly closeReason = signal('');
  readonly denominations = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 10];
  readonly counts = signal<Partial<Record<number, number>>>({});
  readonly counted = computed(() =>
    Object.entries(this.counts()).reduce(
      (sum, [denomination, quantity]) => sum + Number(denomination) * (quantity ?? 0),
      0,
    ),
  );
  readonly movementTypes = [
    { label: 'Retiro de efectivo', value: 'expense' },
    { label: 'Ingreso de efectivo', value: 'income' },
    { label: 'Entrega a custodia', value: 'custody' },
  ];
  readonly custodyMovements = computed(() => {
    const snapshot = this.store.snapshot();
    const sessionIds = new Set(
      [...snapshot.sessions, snapshot.session]
        .filter((item) => item?.branchId === snapshot.settings.branchId)
        .map((item) => item?.id),
    );
    return snapshot.cashMovements.filter((item) => item.type === 'custody' && sessionIds.has(item.sessionId));
  });
  readonly depositVisible = signal(false);
  readonly depositMovement = signal<CashMovement | null>(null);
  readonly depositBank = signal('');
  readonly depositReference = signal('');
  readonly depositDate = signal(chileCivilDate());
  depositFor(id: string) {
    return this.store.snapshot().custodyDeposits.find((item) => item.movementId === id);
  }
  beginDeposit(movement: CashMovement): void {
    this.depositMovement.set(movement);
    this.depositVisible.set(true);
    this.depositReference.set('');
    this.error.set('');
  }
  saveDeposit(): void {
    const movement = this.depositMovement();
    if (!movement) return;
    const result = this.store.confirmCustodyDeposit(movement.id, {
      bankId: this.depositBank(),
      reference: this.depositReference(),
      date: this.depositDate(),
    });
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.depositVisible.set(false);
    this.error.set('');
    this.feedback.set(
      'Depósito confirmado sobre la entrega a custodia. El efectivo no se descuenta nuevamente.',
    );
  }
  movementLabel(value: string): string {
    return (
      (
        {
          opening: 'Apertura',
          sale: 'Venta',
          income: 'Ingreso',
          expense: 'Retiro',
          custody: 'Custodia',
          collection: 'Cobranza',
          advance: 'Anticipo',
          refund: 'Devolución',
        } as Record<string, string>
      )[value] ?? value
    );
  }
  openSession(): void {
    this.error.set('');
    if (this.openingAmount() !== this.openingConfirm()) {
      this.error.set('Los montos de apertura no coinciden.');
      return;
    }
    const result = this.store.openSession(this.openingAmount());
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.feedback.set('Caja abierta. Ya puedes registrar operaciones.');
  }
  move(): void {
    const result = this.store.moveCash(this.movementType(), this.movementAmount(), this.movementReason());
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.error.set('');
    this.movementVisible.set(false);
    this.feedback.set(
      `${this.movementLabel(result.value.type)} registrado por ${money(result.value.amount)}.`,
    );
    this.movementAmount.set(0);
    this.movementReason.set('');
  }
  beginClose(kind: 'partial' | 'complete' | 'handover'): void {
    this.closeKind.set(kind);
    this.error.set('');
    this.counts.set({});
    this.closeReason.set('');
    this.closingVisible.set(true);
  }
  setCount(denomination: number, quantity: number | null): void {
    this.counts.update((counts) => ({ ...counts, [denomination]: quantity ?? 0 }));
  }
  closeSession(): void {
    const result = this.store.closeSession(this.counted(), {
      kind: this.closeKind(),
      reason: this.closeReason(),
    });
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.error.set('');
    this.closingVisible.set(false);
    this.feedback.set(
      this.closeKind() === 'partial'
        ? 'Arqueo guardado. El turno sigue abierto.'
        : this.closeKind() === 'handover'
          ? 'Caja entregada. El siguiente cajero puede iniciar su propio turno.'
          : 'Turno cerrado. El informe conserva todos sus movimientos.',
    );
  }
  exportSession(session = this.session()): void {
    if (!session || !this.store.can('cash', 'cash')) return;
    const moves = this.store.snapshot().cashMovements.filter((item) => item.sessionId === session.id);
    downloadCsv(`caja-${session.id}.csv`, [
      ['Informe de caja · datos de demostración'],
      ['Turno', session.id],
      ['Cajero', session.cashier],
      ['Apertura', session.openedAt],
      ['Cierre', session.closedAt ?? 'Abierto'],
      ['Esperado', session.expectedAmount],
      ['Declarado', session.countedAmount ?? ''],
      ['Diferencia', session.difference ?? ''],
      [],
      ['Fecha', 'Tipo', 'Monto', 'Motivo', 'Referencia'],
      ...moves.map((item) => [
        item.createdAt,
        this.movementLabel(item.type),
        item.amount,
        item.reason,
        item.reference,
      ]),
    ]);
  }
}

import {
  AuditIdentity,
  ModuleId,
  OutboxEvent,
  Permission,
  PosSnapshot,
  Result,
  Sale,
  SyncRun,
  failure,
  nextScheduledRun,
  success,
} from '@corporate-pos/domain';
import { SimulationPort } from './ports';

/** Mock orchestration depends on a state port, not on Angular components or browser storage. */
export interface SyncHost {
  snapshot(): PosSnapshot;
  can(permission: Permission, module?: ModuleId): boolean;
  isEnabled(module: ModuleId): boolean;
  generation(): number;
  identity(): AuditIdentity;
  publish(snapshot: PosSnapshot): Result<void>;
  commit<T>(
    snapshot: PosSnapshot,
    value: T,
    action: string,
    entity: string,
    identity?: AuditIdentity,
  ): Result<T>;
  log(
    snapshot: PosSnapshot,
    source: string,
    message: string,
    correlationId: string,
    level?: 'info' | 'warning' | 'error',
  ): void;
}
export class MockSyncEngine {
  private readonly pendingJobRecovery = new Map<
    string,
    { runId: string; generation: number; identity: AuditIdentity; error: string }
  >();
  private readonly pendingEventRecovery = new Map<
    string,
    { generation: number; identity: AuditIdentity; error: string }
  >();
  constructor(
    private readonly host: SyncHost,
    private readonly simulation: SimulationPort,
  ) {}
  runSync(id: string): Promise<Result<SyncRun>> {
    return this.executeSync(id, 'manual');
  }
  private async executeSync(id: string, trigger: 'manual' | 'scheduled'): Promise<Result<SyncRun>> {
    if (trigger === 'manual' && !this.host.can('sync', 'sync'))
      return failure('No tienes permiso para ejecutar sincronizaciones.');
    if (!this.host.isEnabled('sync')) return failure('El módulo de sincronización está deshabilitado.');
    const recovered = this.recoverPending();
    if (!recovered.ok) return recovered;
    if (!this.host.snapshot().online) return failure('Conecta la caja para ejecutar la sincronización.');
    const job = this.host.snapshot().syncJobs.find((item) => item.id === id);
    if (!job || job.status === 'running') return failure('La tarea no existe o ya está en ejecución.');
    const generation = this.host.generation();
    const identity: AuditIdentity =
      trigger === 'scheduled' ? { actor: 'Planificador local', role: 'system' } : this.host.identity();
    const startedAt = this.simulation.now().toISOString();
    const run: SyncRun = {
      id: this.simulation.id('run'),
      jobId: id,
      startedAt,
      finishedAt: null,
      trigger,
      status: 'running',
      records: 0,
      error: null,
    };
    const draft = structuredClone(this.host.snapshot());
    const mutableJob = draft.syncJobs.find((item) => item.id === id);
    if (!mutableJob) return failure('La tarea no existe.');
    mutableJob.status = 'running';
    mutableJob.progress = 0;
    mutableJob.lastError = null;
    mutableJob.nextRun = nextScheduledRun(mutableJob.schedule, this.simulation.now());
    draft.syncRuns.unshift(run);
    draft.syncRuns = draft.syncRuns.slice(0, 250);
    this.host.log(
      draft,
      id,
      `Sincronización ${trigger === 'manual' ? 'manual' : 'programada'} iniciada.`,
      run.id,
    );
    const persisted = this.host.commit(draft, run, 'sync.started', id, identity);
    if (!persisted.ok) return persisted;
    for (const progress of [25, 65, 100]) {
      await this.simulation.wait(600);
      if (generation !== this.host.generation())
        return failure('La demostración se reinició durante la ejecución.');
      if (!this.host.snapshot().online)
        return this.finishSync(
          id,
          run.id,
          'Se perdió la conexión. La próxima ejecución conserva los eventos pendientes.',
          identity,
        );
      const progressState = structuredClone(this.host.snapshot());
      const current = progressState.syncJobs.find((item) => item.id === id);
      if (!current) return failure('La tarea ya no existe.');
      current.progress = progress;
      const saved = this.host.publish(progressState);
      if (!saved.ok) {
        this.pendingJobRecovery.set(id, { runId: run.id, generation, identity, error: saved.error });
        return saved;
      }
    }
    return this.finishSync(
      id,
      run.id,
      job.failNext ? 'Fallo transitorio simulado. Reintenta para procesar los mismos identificadores.' : null,
      identity,
    );
  }
  private finishSync(
    id: string,
    runId: string,
    error: string | null,
    identity: AuditIdentity,
  ): Result<SyncRun> {
    const draft = structuredClone(this.host.snapshot()),
      now = this.simulation.now().toISOString();
    const job = draft.syncJobs.find((item) => item.id === id),
      run = draft.syncRuns.find((item) => item.id === runId);
    if (!job || !run) return failure('La ejecución ya no existe.');
    job.failNext = false;
    const target = id === 'sync-fiscal' ? 'fiscal' : 'erp';
    const integration = draft.integrations.find((item) => item.kind === target);
    if (!integration?.enabled || integration.status !== 'connected')
      error = `La integración ${target} no está disponible.`;
    let records = 0;
    if (job.direction === 'outbound') {
      const eventType =
        id === 'sync-sales'
          ? 'sale.created'
          : id === 'sync-returns'
            ? 'credit-note.created'
            : id === 'sync-collections'
              ? 'collection.created'
              : null;
      for (const event of draft.outbox.filter(
        (item) =>
          item.target === target &&
          ['pending', 'failed'].includes(item.status) &&
          (target === 'fiscal' || item.type === eventType),
      )) {
        const sale = draft.sales.find((item) => item.id === event.aggregateId);
        if (sale && sale.paymentStatus !== 'confirmed') continue;
        event.attempts++;
        if (error) this.failEvent(draft, event, error);
        else {
          this.deliverEvent(draft, event, now);
          records++;
        }
      }
    } else if (!error) {
      if (id === 'sync-products' || id === 'sync-prices') {
        draft.products.forEach((product) => (product.updatedAt = now));
        records = draft.products.length;
      }
      if (id === 'sync-customers') {
        draft.customers.forEach((customer) => (customer.updatedAt = now));
        records = draft.customers.length;
      }
    }
    job.status = error ? 'failed' : 'success';
    job.progress = error ? 0 : 100;
    job.lastRun = now;
    job.lastError = error;
    job.records = records;
    run.status = error ? 'failed' : 'success';
    run.finishedAt = now;
    run.error = error;
    run.records = records;
    this.host.log(draft, id, error ?? `${records} registros procesados.`, runId, error ? 'error' : 'info');
    const saved = this.host.commit(draft, run, error ? 'sync.failed' : 'sync.completed', id, identity);
    if (!saved.ok)
      this.pendingJobRecovery.set(id, {
        runId,
        generation: this.host.generation(),
        identity,
        error: saved.error,
      });
    return !saved.ok ? saved : error ? failure(error) : saved;
  }
  private deliverEvent(draft: PosSnapshot, event: OutboxEvent, now: string): void {
    event.status = 'sent';
    event.deliveredAt = now;
    event.lastError = null;
    const sale = draft.sales.find((item) => item.id === event.aggregateId);
    if (sale) {
      if (event.target === 'erp') sale.erpStatus = 'synced';
      else sale.fiscalStatus = 'issued';
    }
    const note = draft.creditNotes.find((item) => item.id === event.aggregateId);
    if (note && event.target === 'fiscal') note.fiscalStatus = 'issued';
  }
  private failEvent(draft: PosSnapshot, event: OutboxEvent, error: string): void {
    event.status = 'failed';
    event.lastError = error;
    const sale = draft.sales.find((item) => item.id === event.aggregateId);
    if (sale) {
      if (event.target === 'erp') sale.erpStatus = 'failed';
      else sale.fiscalStatus = 'failed';
    }
    const note = draft.creditNotes.find((item) => item.id === event.aggregateId);
    if (note && event.target === 'fiscal') note.fiscalStatus = 'failed';
  }
  retryOutbox(id: string): Promise<Result<OutboxEvent>> {
    return this.dispatchOutbox(id, 'sync', 'sync');
  }
  private async dispatchOutbox(
    id: string,
    permission: Permission,
    module: ModuleId,
  ): Promise<Result<OutboxEvent>> {
    if (!this.host.can(permission, module)) return failure('No tienes permiso para reenviar eventos.');
    const recovered = this.recoverPending();
    if (!recovered.ok) return recovered;
    if (!this.host.snapshot().online) return failure('Conecta la caja para reenviar eventos.');
    const event = this.host.snapshot().outbox.find((item) => item.id === id);
    if (!event) return failure('El evento no existe.');
    if (event.status === 'sent') return success(event);
    if (event.status === 'processing') return failure('El evento ya está en proceso.');
    const sale = this.host.snapshot().sales.find((item) => item.id === event.aggregateId);
    if (sale && sale.paymentStatus !== 'confirmed')
      return failure('Concilia primero el pago. No se reenviará un cobro de resultado desconocido.');
    const generation = this.host.generation();
    const identity = this.host.identity();
    const draft = structuredClone(this.host.snapshot()),
      mutable = draft.outbox.find((item) => item.id === id);
    if (!mutable) return failure('El evento no existe.');
    mutable.status = 'processing';
    mutable.attempts++;
    const start = this.host.commit(draft, mutable, 'outbox.retry.started', id, identity);
    if (!start.ok) return start;
    await this.simulation.wait(700);
    if (generation !== this.host.generation()) return failure('La demostración se reinició.');
    const final = structuredClone(this.host.snapshot()),
      current = final.outbox.find((item) => item.id === id);
    if (!current) return failure('El evento no existe.');
    const integration = final.integrations.find((item) => item.kind === current.target);
    const error = !final.online
      ? 'Sin conexión.'
      : !integration?.enabled || integration.status !== 'connected'
        ? 'La integración no está disponible.'
        : null;
    if (error) this.failEvent(final, current, error);
    else this.deliverEvent(final, current, this.simulation.now().toISOString());
    this.host.log(
      final,
      'outbox',
      error ?? 'Evento entregado sin duplicar la operación.',
      id,
      error ? 'error' : 'info',
    );
    const result = this.host.commit(
      final,
      current,
      error ? 'outbox.failed' : 'outbox.delivered',
      id,
      identity,
    );
    if (!result.ok) this.pendingEventRecovery.set(id, { generation, identity, error: result.error });
    return !result.ok ? result : error ? failure(error) : result;
  }
  /** Terminal state is retried after storage recovers; no unsaved snapshot is published. */
  private recoverPending(): Result<void> {
    for (const [id, recovery] of this.pendingJobRecovery) {
      if (recovery.generation !== this.host.generation()) {
        this.pendingJobRecovery.delete(id);
        continue;
      }
      const draft = structuredClone(this.host.snapshot());
      const job = draft.syncJobs.find((item) => item.id === id),
        run = draft.syncRuns.find((item) => item.id === recovery.runId);
      if (!job || !run) {
        this.pendingJobRecovery.delete(id);
        continue;
      }
      const error = `La ejecución se interrumpió al guardar: ${recovery.error}`;
      job.status = 'failed';
      job.progress = 0;
      job.lastError = error;
      run.status = 'failed';
      run.error = error;
      run.finishedAt = this.simulation.now().toISOString();
      this.host.log(draft, 'persistence', error, run.id, 'error');
      const saved = this.host.commit(draft, undefined, 'sync.persistence.recovered', id, recovery.identity);
      if (!saved.ok) return saved;
      this.pendingJobRecovery.delete(id);
    }
    for (const [id, recovery] of this.pendingEventRecovery) {
      if (recovery.generation !== this.host.generation()) {
        this.pendingEventRecovery.delete(id);
        continue;
      }
      const draft = structuredClone(this.host.snapshot()),
        event = draft.outbox.find((item) => item.id === id);
      if (!event) {
        this.pendingEventRecovery.delete(id);
        continue;
      }
      const error = `El envío se interrumpió al guardar: ${recovery.error}`;
      this.failEvent(draft, event, error);
      this.host.log(draft, 'persistence', error, event.id, 'error');
      const saved = this.host.commit(draft, undefined, 'outbox.persistence.recovered', id, recovery.identity);
      if (!saved.ok) return saved;
      this.pendingEventRecovery.delete(id);
    }
    return success(undefined);
  }
  async retryFiscal(saleId: string): Promise<Result<Sale>> {
    if (!this.host.can('sell', 'sales')) return failure('No tienes permiso para emitir documentos.');
    const sale = this.host.snapshot().sales.find((item) => item.id === saleId);
    if (!sale) return failure('El documento no existe.');
    if (sale.fiscalStatus === 'issued') return success(sale);
    if (!this.host.snapshot().online || sale.paymentStatus !== 'confirmed')
      return failure('Necesitas conexión y un pago confirmado.');
    const event = this.host
      .snapshot()
      .outbox.find((item) => item.aggregateId === saleId && item.target === 'fiscal');
    if (!event) return failure('El documento no tiene un evento fiscal pendiente.');
    const dispatched = await this.dispatchOutbox(event.id, 'sell', 'sales');
    if (!dispatched.ok) return dispatched;
    const current = this.host.snapshot().sales.find((item) => item.id === saleId);
    return current ? success(current) : failure('El documento ya no existe.');
  }
  tickSchedules(): void {
    if (!this.recoverPending().ok) return;
    if (!this.host.snapshot().online || !this.host.isEnabled('sync')) return;
    const now = this.simulation.now().getTime();
    for (const job of this.host.snapshot().syncJobs)
      if (
        job.schedule.enabled &&
        job.schedule.mode !== 'manual' &&
        job.status !== 'running' &&
        job.nextRun &&
        Date.parse(job.nextRun) <= now
      )
        void this.executeSync(job.id, 'scheduled');
  }
}

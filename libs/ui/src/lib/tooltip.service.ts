import { DOCUMENT } from '@angular/common';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TooltipComponent, TooltipPosition } from './tooltip.component';

interface TooltipRequest {
  owner: unknown;
  origin: HTMLElement;
  target: HTMLElement;
  text: string;
  position: TooltipPosition;
}

const POSITIONS: Record<TooltipPosition, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -4 },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 4 },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -4 },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 4 },
};

/** Resolves only the control owned by this host; never scans the document. */
export function tooltipControl(host: HTMLElement): HTMLElement {
  if (host.tagName === 'P-BUTTON') return host.querySelector<HTMLButtonElement>('button') ?? host;
  if (host.matches('button, input, [role="button"], [role="combobox"], a[href]')) return host;
  const field = host.closest(
    'p-select, p-multiselect, p-multiSelect, p-datepicker, p-datePicker, p-date-picker',
  );
  return field?.querySelector<HTMLElement>('[role="combobox"]') ?? host;
}

/** Native labels remain the single source of text, including dynamic actions. */
export function tooltipLabel(target: HTMLElement, fallback = ''): string {
  return (
    target.getAttribute('aria-label')?.trim() ||
    target.closest('p-button')?.getAttribute('aria-label')?.trim() ||
    fallback.trim()
  );
}

@Injectable({ providedIn: 'root' })
export class TooltipService {
  private readonly overlay = inject(Overlay);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptions = new Subscription();
  private overlayRef: OverlayRef | null = null;
  private request: TooltipRequest | null = null;
  private tooltipId = '';
  private serial = 0;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private triggerHovered = false;
  private triggerFocused = false;
  private tooltipHovered = false;
  private openCleanup: (() => void) | null = null;
  private suppressedAction: { owner: unknown; text: string } | null = null;
  private suppressionCleanup: (() => void) | null = null;
  private checkQueued = false;

  constructor() {
    if (this.router) {
      this.subscriptions.add(
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationStart) {
            this.dismiss();
            this.clearSuppression();
          }
        }),
      );
    }
    this.destroyRef.onDestroy(() => {
      this.dismiss();
      this.clearSuppression();
      this.subscriptions.unsubscribe();
    });
  }

  enter(
    owner: unknown,
    origin: HTMLElement,
    channel: 'hover' | 'focus',
    text = '',
    position: TooltipPosition = 'top',
    target = tooltipControl(origin),
  ): void {
    const label = text.trim() || tooltipLabel(target);
    if (!label || this.isDisabled(origin, target) || !origin.isConnected) return;
    const suppressed = this.suppressedAction;
    if (suppressed && suppressed.owner === owner && suppressed.text === label) return;
    this.clearHideTimer();
    if (this.request?.owner !== owner || this.request?.origin !== origin) {
      this.dismiss();
      this.request = { owner, origin, target, text: label, position };
      this.show();
    }
    if (channel === 'hover') this.triggerHovered = true;
    else this.triggerFocused = true;
  }

  leave(owner: unknown, origin: HTMLElement, channel: 'hover' | 'focus'): void {
    const request = this.request;
    if (!request || request.owner !== owner || request.origin !== origin) return;
    if (channel === 'hover') this.triggerHovered = false;
    else this.triggerFocused = false;
    this.scheduleHide();
  }

  dismissOwner(owner: unknown): void {
    if (this.request?.owner === owner) this.dismiss();
  }

  destroyOwner(owner: unknown): void {
    this.dismissOwner(owner);
    if (this.suppressedAction?.owner === owner) this.clearSuppression();
  }

  /** Render hooks do no DOM work unless this specific owner has an active tooltip. */
  checkActiveOrigin(owner: unknown, enabled = true): void {
    if (!this.request || this.request.owner !== owner || this.checkQueued) return;
    this.checkQueued = true;
    const request = this.request;
    queueMicrotask(() => {
      this.checkQueued = false;
      if (this.request !== request) return;
      if (
        !enabled ||
        !request.origin.isConnected ||
        !request.origin.getClientRects().length ||
        this.isDisabled(request.origin, request.target)
      )
        this.dismiss();
    });
  }

  dismissDetachedOrigin(): void {
    if (this.request && !this.request.origin.isConnected) this.dismiss();
  }

  dismiss(): void {
    this.clearHideTimer();
    this.openCleanup?.();
    this.openCleanup = null;
    const target = this.request?.target;
    if (target && this.tooltipId) {
      const ids = (target.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && id !== this.tooltipId);
      if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
      else target.removeAttribute('aria-describedby');
    }
    this.request = null;
    this.tooltipId = '';
    this.triggerHovered = false;
    this.triggerFocused = false;
    this.tooltipHovered = false;
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  private show(): void {
    const request = this.request;
    if (!request) return;
    const order = [
      request.position,
      ...(['top', 'bottom', 'right', 'left'] as const).filter((side) => side !== request.position),
    ];
    const position = this.overlay
      .position()
      .flexibleConnectedTo(request.origin)
      .withPositions(order.map((side) => POSITIONS[side]))
      .withViewportMargin(16)
      .withFlexibleDimensions(false)
      .withPush(true);
    const ref = this.overlay.create({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.close(),
      panelClass: 'pos-tooltip-panel',
      hasBackdrop: false,
      disposeOnNavigation: true,
    });
    this.overlayRef = ref;
    const component = ref.attach(new ComponentPortal(TooltipComponent));
    this.tooltipId = `pos-tooltip-${++this.serial}`;
    component.setInput('tooltipId', this.tooltipId);
    component.setInput('text', request.text);
    component.setInput('position', request.position);
    component.instance.entered.subscribe(() => {
      this.tooltipHovered = true;
      this.clearHideTimer();
    });
    component.instance.left.subscribe(() => {
      this.tooltipHovered = false;
      this.scheduleHide();
    });
    const changes = position.positionChanges.subscribe(({ connectionPair }) => {
      const side =
        order.find((key) => {
          const candidate = POSITIONS[key];
          return (
            candidate.originX === connectionPair.originX &&
            candidate.originY === connectionPair.originY &&
            candidate.overlayX === connectionPair.overlayX &&
            candidate.overlayY === connectionPair.overlayY
          );
        }) ?? request.position;
      component.setInput('position', side);
    });
    const detachments = ref.detachments().subscribe(() => this.dismiss());
    const description = new Set(
      (request.target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean),
    );
    description.add(this.tooltipId);
    request.target.setAttribute('aria-describedby', [...description].join(' '));
    // Capture scrolls from the app's own overflow panes, not only CDK scrollables.
    const onScroll = (): void => this.dismiss();
    const onClick = (event: MouseEvent): void => {
      this.suppressCurrentAction(event);
      this.dismiss();
    };
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.suppressCurrentAction(event);
        this.dismiss();
        event.stopPropagation();
      }
    };
    this.document.addEventListener('scroll', onScroll, true);
    this.document.addEventListener('click', onClick, true);
    this.document.addEventListener('keydown', onKeydown, true);
    this.openCleanup = () => {
      changes.unsubscribe();
      detachments.unsubscribe();
      this.document.removeEventListener('scroll', onScroll, true);
      this.document.removeEventListener('click', onClick, true);
      this.document.removeEventListener('keydown', onKeydown, true);
    };
    // Measure the rendered label, not the empty portal created before its inputs.
    component.changeDetectorRef.detectChanges();
    ref.updatePosition();
  }

  private isDisabled(origin: HTMLElement, target: HTMLElement): boolean {
    return (
      target.matches(':disabled, [aria-disabled="true"]') ||
      !!origin.closest('[aria-disabled="true"], .p-disabled, [inert]')
    );
  }

  private scheduleHide(): void {
    this.clearHideTimer();
    if (this.triggerHovered || this.triggerFocused || this.tooltipHovered) return;
    // Allows crossing the 4px gap. No lifetime timeout: users may read at their own pace.
    this.hideTimer = setTimeout(() => this.dismiss(), 120);
  }

  private clearHideTimer(): void {
    if (this.hideTimer !== undefined) clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
  }

  private suppressCurrentAction(event: MouseEvent | KeyboardEvent): void {
    if (!this.request) return;
    this.clearSuppression();
    this.suppressedAction = { owner: this.request.owner, text: this.request.text };
    // PrimeNG can recreate/refocus a clicked calendar button. That is not a new
    // request for help. Re-arm on the next actual pointer movement or key press.
    const pointer = 'clientX' in event ? { x: event.clientX, y: event.clientY } : null;
    const onMove = (next: PointerEvent): void => {
      if (
        !pointer ||
        next.clientX !== pointer.x ||
        next.clientY !== pointer.y ||
        next.movementX ||
        next.movementY
      ) {
        this.clearSuppression();
      }
    };
    const onKey = (next: KeyboardEvent): void => {
      if (next !== event) this.clearSuppression();
    };
    this.document.addEventListener('pointermove', onMove, true);
    this.document.addEventListener('keydown', onKey, true);
    this.suppressionCleanup = () => {
      this.document.removeEventListener('pointermove', onMove, true);
      this.document.removeEventListener('keydown', onKey, true);
    };
  }

  private clearSuppression(): void {
    this.suppressionCleanup?.();
    this.suppressionCleanup = null;
    this.suppressedAction = null;
  }
}

import { inject } from '@angular/core';
import type { LifecycleHooks } from 'primeng/api';
import type { GlobalPassThrough } from 'primeng/config';
import type { DatePickerPassThrough } from 'primeng/types/datepicker';
import type { DialogPassThrough } from 'primeng/types/dialog';
import type { DrawerPassThrough } from 'primeng/types/drawer';
import type { PaginatorPassThrough } from 'primeng/types/paginator';
import type { ToastPassThrough } from 'primeng/types/toast';
import type { InputNumberPassThrough } from 'primeng/types/inputnumber';
import type { SelectPassThrough } from 'primeng/types/select';
import type { MultiSelectPassThrough } from 'primeng/types/multiselect';
import { TooltipService, tooltipLabel } from './tooltip.service';

interface TooltipEvents {
  onmouseenter: (event: MouseEvent) => void;
  onmouseleave: (event: MouseEvent) => void;
  onfocusin: (event: FocusEvent) => void;
  onfocusout: (event: FocusEvent) => void;
  onclick: () => void;
}

function tooltipEvents(
  tooltip: TooltipService,
  owner: unknown,
  fallback: string,
  enabled = () => true,
): TooltipEvents {
  const origin = (event: Event): HTMLElement | null =>
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  const enter = (event: Event, channel: 'hover' | 'focus'): void => {
    const target = origin(event);
    if (target && enabled()) tooltip.enter(owner, target, channel, tooltipLabel(target, fallback));
  };
  const leave = (event: Event, channel: 'hover' | 'focus'): void => {
    const target = origin(event);
    if (target) tooltip.leave(owner, target, channel);
  };
  return {
    onmouseenter: (event: MouseEvent) => enter(event, 'hover'),
    onmouseleave: (event: MouseEvent) => leave(event, 'hover'),
    onfocusin: (event: FocusEvent) => enter(event, 'focus'),
    onfocusout: (event: FocusEvent) => leave(event, 'focus'),
    onclick: () => tooltip.dismissOwner(owner),
  };
}

/**
 * Toast forwards its PT input signal to ToastItem. Keep this an object and resolve
 * only the closeButton section: that public callback receives the individual item.
 */
export function createToastTooltipPassThrough(tooltip = inject(TooltipService)): ToastPassThrough {
  return {
    closeButton: ({ instance }) => tooltipEvents(tooltip, instance, 'Cerrar'),
    hooks: {
      // Angular may invoke destroy hooks before removing the element. Checking the
      // one active origin after removal avoids clearing another notification's tooltip.
      onDestroy: () => queueMicrotask(() => tooltip.dismissDetachedOrigin()),
    },
  };
}

/**
 * Call in an injection context (e.g. an app initializer) and merge into PrimeNG.pt.
 * Public PT listeners extend the native controls; no Angular directives are injected
 * into library-owned DOM. The same TooltipService also serves [posTooltip].
 */
export function createTooltipPassThrough(tooltip = inject(TooltipService)): GlobalPassThrough {
  const overlayVisible = (owner: unknown): boolean =>
    typeof owner !== 'object' || owner === null || !('visible' in owner) || owner.visible !== false;
  const hooks = (owner: unknown, enabled = () => true): LifecycleHooks => ({
    onDestroy: () => tooltip.destroyOwner(owner),
    onAfterViewChecked: () => tooltip.checkActiveOrigin(owner, enabled()),
  });

  const events = (owner: unknown, fallback: string): TooltipEvents => tooltipEvents(tooltip, owner, fallback);

  const button = (owner: unknown, fallback: string, enabled = () => true) => ({
    root: tooltipEvents(tooltip, owner, fallback, enabled),
  });
  const dialog: DialogPassThrough = ({ instance }) => ({
    pcCloseButton: button(instance, 'Cerrar', () => overlayVisible(instance)),
    pcMaximizeButton: button(instance, 'Maximizar', () => overlayVisible(instance)),
    hooks: hooks(instance, () => overlayVisible(instance)),
  });
  const drawer: DrawerPassThrough = ({ instance }) => ({
    pcCloseButton: button(instance, 'Cerrar', () => overlayVisible(instance)),
    hooks: hooks(instance, () => overlayVisible(instance)),
  });
  const paginator: PaginatorPassThrough = ({ instance }) => ({
    first: events(instance, 'Primera página'),
    prev: events(instance, 'Página anterior'),
    next: events(instance, 'Página siguiente'),
    last: events(instance, 'Última página'),
    hooks: hooks(instance),
  });
  const datepicker: DatePickerPassThrough = ({ instance }) => ({
    pcPrevButton: button(instance, 'Anterior'),
    pcNextButton: button(instance, 'Siguiente'),
    pcIncrementButton: button(instance, 'Aumentar'),
    pcDecrementButton: button(instance, 'Disminuir'),
    dropdown: events(instance, 'Elegir fecha'),
    inputIconContainer: events(instance, 'Elegir fecha'),
    hooks: hooks(instance),
  });
  const toast = createToastTooltipPassThrough(tooltip);
  const inputNumber: InputNumberPassThrough = ({ instance }) => ({
    incrementButton: { ...events(instance, 'Aumentar'), 'aria-label': 'Aumentar' },
    decrementButton: { ...events(instance, 'Disminuir'), 'aria-label': 'Disminuir' },
    hooks: hooks(instance),
  });
  const select: SelectPassThrough = ({ instance }) => ({
    dropdown: { ...events(instance, 'Abrir opciones'), 'aria-label': 'Abrir opciones' },
    hooks: hooks(instance),
  });
  const multiSelect: MultiSelectPassThrough = ({ instance }) => ({
    dropdown: { ...events(instance, 'Abrir opciones'), 'aria-label': 'Abrir opciones' },
    hooks: hooks(instance),
  });

  return {
    dialog,
    drawer,
    // ConfirmDialog delegates its close action to Dialog, so global Dialog PT covers it.
    paginator,
    datepicker,
    toast,
    inputNumber,
    select,
    multiSelect,
  };
}

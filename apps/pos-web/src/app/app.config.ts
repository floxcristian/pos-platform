import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withHashLocation, withComponentInputBinding } from '@angular/router';
import { PrimeNG, providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppPreset, PRIMENG_OPTIONS, createTooltipPassThrough } from '@corporate-pos/ui';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    providePrimeNG({
      ripple: false,
      overlayAppendTo: 'body',
      ptOptions: { mergeProps: true },
      theme: { preset: AppPreset, options: PRIMENG_OPTIONS },
      translation: {
        accept: 'Aceptar',
        reject: 'Cancelar',
        choose: 'Seleccionar',
        emptyMessage: 'No hay registros',
        emptyFilterMessage: 'No hay coincidencias',
        emptySearchMessage: 'No hay resultados',
        selectionMessage: '{0} elementos seleccionados',
        searchMessage: '{0} resultados disponibles',
        firstDayOfWeek: 1,
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
        monthNames: [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        today: 'Hoy',
        clear: 'Limpiar',
        prevMonth: 'Mes anterior',
        nextMonth: 'Mes siguiente',
        chooseMonth: 'Elegir mes',
        chooseYear: 'Elegir año',
        chooseDate: 'Elegir fecha',
        prevYear: 'Año anterior',
        nextYear: 'Año siguiente',
        prevDecade: 'Década anterior',
        nextDecade: 'Década siguiente',
        prevHour: 'Hora anterior',
        nextHour: 'Hora siguiente',
        prevMinute: 'Minuto anterior',
        nextMinute: 'Minuto siguiente',
      },
    }),
    provideAppInitializer(() => {
      const prime = inject(PrimeNG);
      prime.pt.set({ ...prime.pt(), ...createTooltipPassThrough() });
      prime.setTranslation({
        aria: {
          ...prime.translation.aria,
          close: 'Cerrar',
          firstPageLabel: 'Primera página',
          lastPageLabel: 'Última página',
          nextPageLabel: 'Página siguiente',
          prevPageLabel: 'Página anterior',
          rowsPerPageLabel: 'Filas por página',
          pageLabel: 'Página {page}',
          selectAll: 'Seleccionar todo',
          unselectAll: 'Deseleccionar todo',
          showFilterMenu: 'Mostrar filtros',
          hideFilterMenu: 'Ocultar filtros',
          filterOperator: 'Operador de filtro',
          filterConstraint: 'Condición de filtro',
          jumpToPageDropdownLabel: 'Ir a página',
          jumpToPageInputLabel: 'Ir a página',
        },
      });
    }),
    MessageService,
    ConfirmationService,
  ],
};

import type { DuotoneIconName } from '@corporate-pos/ui';

interface LoginPanel {
  kind: 'terminal' | 'feature' | 'statement' | 'receipt' | 'catalog';
  title: string;
  description: string;
  icon: DuotoneIconName;
  eyebrow?: string;
}

/** Product illustrations, not live metrics or customer endorsements. */
export const LOGIN_PANELS: readonly (readonly LoginPanel[])[] = [
  [
    {
      kind: 'terminal',
      eyebrow: 'Punto de venta',
      title: 'Todo listo para una nueva jornada.',
      description: 'Una experiencia de caja, de principio a fin.',
      icon: 'desktop',
    },
    {
      kind: 'feature',
      title: 'Ventas y documentos',
      description: 'Del carrito a la boleta, en el mismo lugar.',
      icon: 'receipt',
    },
    {
      kind: 'catalog',
      title: 'Tu catálogo a mano',
      description: 'Repuestos, insumos y accesorios.',
      icon: 'wrench',
    },
    {
      kind: 'statement',
      eyebrow: 'La operación, conectada',
      title: 'Una sola caja.',
      description: 'Ventas · Cobros · Devoluciones',
      icon: 'arrows-clockwise',
    },
  ],
  [
    {
      kind: 'statement',
      eyebrow: 'De apertura a cierre',
      title: 'Cada movimiento cuenta.',
      description: 'Control de la jornada de caja.',
      icon: 'wallet',
    },
    {
      kind: 'feature',
      title: 'Pagos y conciliación',
      description: 'El estado de cada pago, siempre a la vista.',
      icon: 'credit-card',
    },
    {
      kind: 'receipt',
      eyebrow: 'Un flujo completo',
      title: 'Cada venta, en orden.',
      description: 'Detalle, documento y seguimiento.',
      icon: 'file-text',
    },
    {
      kind: 'feature',
      title: 'Equipos y sucursales',
      description: 'Perfiles para cada responsabilidad.',
      icon: 'buildings',
    },
  ],
  [
    {
      kind: 'feature',
      title: 'Acceso por perfil',
      description: 'Caja, supervisión, administración y auditoría.',
      icon: 'shield-check',
    },
    {
      kind: 'catalog',
      title: 'Encuentra lo que necesitas',
      description: 'Consulta productos y disponibilidad.',
      icon: 'package',
    },
    {
      kind: 'statement',
      eyebrow: 'Información clara',
      title: 'Tu jornada, a la vista.',
      description: 'Reportes para acompañar la operación.',
      icon: 'chart-bar',
    },
    {
      kind: 'feature',
      title: 'Trazabilidad',
      description: 'El historial de cada acción en un solo lugar.',
      icon: 'list-checks',
    },
  ],
];

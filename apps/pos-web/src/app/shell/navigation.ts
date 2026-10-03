import type { ModuleId, Permission } from '@corporate-pos/domain';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  permission?: Permission;
  module?: ModuleId;
  keywords?: string;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      {
        label: 'Inicio',
        route: '/inicio',
        icon: 'pos-icon-squares-four',
        keywords: 'panel resumen dashboard',
      },
      {
        label: 'Nueva venta',
        route: '/venta',
        icon: 'pos-icon-shopping-cart',
        permission: 'sell',
        module: 'sales',
      },
      {
        label: 'Mi caja',
        route: '/caja',
        icon: 'pos-icon-wallet',
        permission: 'cash',
        module: 'cash',
        keywords: 'turno apertura cierre arqueo custodia',
      },
      {
        label: 'Documentos',
        route: '/documentos',
        icon: 'pos-icon-file',
        permission: 'sell',
        module: 'sales',
        keywords: 'boleta factura DTE impresión fiscal',
      },
      {
        label: 'Cobranzas y anticipos',
        route: '/cobranzas',
        icon: 'pos-icon-credit-card',
        permission: 'collect',
        module: 'collections',
      },
      {
        label: 'Devoluciones',
        route: '/devoluciones',
        icon: 'pos-icon-arrow-counter-clockwise',
        permission: 'refund',
        module: 'returns',
        keywords: 'nota crédito reembolso',
      },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        label: 'Maestros',
        route: '/maestros',
        icon: 'pos-icon-database',
        permission: 'masters',
        module: 'masters',
        keywords: 'productos clientes catálogo stock vendedores',
      },
      {
        label: 'Precios y ofertas',
        route: '/precios',
        icon: 'pos-icon-tag',
        permission: 'pricing',
        module: 'pricing',
        keywords: 'descuento promoción',
      },
      {
        label: 'Reportes',
        route: '/reportes',
        icon: 'pos-icon-chart-bar',
        permission: 'reports',
        module: 'reports',
        keywords: 'estadísticas ventas ingresos exportar',
      },
    ],
  },
  {
    label: 'Control',
    items: [
      {
        label: 'Sincronización',
        route: '/sincronizacion',
        icon: 'pos-icon-arrows-clockwise',
        permission: 'sync',
        module: 'sync',
        keywords: 'programar sincronizadores colas outbox reintentos',
      },
      {
        label: 'Actividad y auditoría',
        route: '/actividad',
        icon: 'pos-icon-clock-counter-clockwise',
        permission: 'audit',
        module: 'audit',
        keywords: 'logs errores eventos trazabilidad',
      },
      {
        label: 'Dispositivos',
        route: '/dispositivos',
        icon: 'pos-icon-desktop',
        permission: 'devices',
        module: 'devices',
        keywords: 'impresora transbank lector cheques cajón',
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        label: 'Módulos y configuración',
        route: '/configuracion',
        icon: 'pos-icon-sliders-horizontal',
        permission: 'configure',
        keywords: 'funcionalidades habilitar deshabilitar políticas empresa',
      },
      {
        label: 'Usuarios y permisos',
        route: '/usuarios',
        icon: 'pos-icon-users',
        permission: 'users',
        module: 'users',
      },
      {
        label: 'Sucursales y cajas',
        route: '/sucursales',
        icon: 'pos-icon-buildings',
        permission: 'configure',
        module: 'branches',
      },
      {
        label: 'Integraciones',
        route: '/integraciones',
        icon: 'pos-icon-plugs-connected',
        permission: 'configure',
        module: 'integrations',
        keywords: 'Dynamics AX ERP fiscal orsan transbank',
      },
      {
        label: 'Actualizaciones',
        route: '/actualizaciones',
        icon: 'pos-icon-cloud-arrow-down',
        permission: 'configure',
        module: 'updates',
        keywords: 'versiones despliegue tauri',
      },
    ],
  },
];

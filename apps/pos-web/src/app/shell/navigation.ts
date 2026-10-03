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
      { label: 'Inicio', route: '/inicio', icon: 'pi-th-large', keywords: 'panel resumen dashboard' },
      {
        label: 'Nueva venta',
        route: '/venta',
        icon: 'pi-shopping-cart',
        permission: 'sell',
        module: 'sales',
      },
      {
        label: 'Mi caja',
        route: '/caja',
        icon: 'pi-wallet',
        permission: 'cash',
        module: 'cash',
        keywords: 'turno apertura cierre arqueo custodia',
      },
      {
        label: 'Documentos',
        route: '/documentos',
        icon: 'pi-file',
        permission: 'sell',
        module: 'sales',
        keywords: 'boleta factura DTE impresión fiscal',
      },
      {
        label: 'Cobranzas y anticipos',
        route: '/cobranzas',
        icon: 'pi-credit-card',
        permission: 'collect',
        module: 'collections',
      },
      {
        label: 'Devoluciones',
        route: '/devoluciones',
        icon: 'pi-replay',
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
        icon: 'pi-database',
        permission: 'masters',
        module: 'masters',
        keywords: 'productos clientes catálogo stock vendedores',
      },
      {
        label: 'Precios y ofertas',
        route: '/precios',
        icon: 'pi-tags',
        permission: 'pricing',
        module: 'pricing',
        keywords: 'descuento promoción',
      },
      {
        label: 'Reportes',
        route: '/reportes',
        icon: 'pi-chart-bar',
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
        icon: 'pi-sync',
        permission: 'sync',
        module: 'sync',
        keywords: 'programar sincronizadores colas outbox reintentos',
      },
      {
        label: 'Actividad y auditoría',
        route: '/actividad',
        icon: 'pi-history',
        permission: 'audit',
        module: 'audit',
        keywords: 'logs errores eventos trazabilidad',
      },
      {
        label: 'Dispositivos',
        route: '/dispositivos',
        icon: 'pi-desktop',
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
        icon: 'pi-sliders-h',
        permission: 'configure',
        keywords: 'funcionalidades habilitar deshabilitar políticas empresa',
      },
      {
        label: 'Usuarios y permisos',
        route: '/usuarios',
        icon: 'pi-users',
        permission: 'users',
        module: 'users',
      },
      {
        label: 'Sucursales y cajas',
        route: '/sucursales',
        icon: 'pi-building',
        permission: 'configure',
        module: 'branches',
      },
      {
        label: 'Integraciones',
        route: '/integraciones',
        icon: 'pi-directions',
        permission: 'configure',
        module: 'integrations',
        keywords: 'Dynamics AX ERP fiscal orsan transbank',
      },
      {
        label: 'Actualizaciones',
        route: '/actualizaciones',
        icon: 'pi-cloud-download',
        permission: 'configure',
        module: 'updates',
        keywords: 'versiones despliegue tauri',
      },
    ],
  },
];

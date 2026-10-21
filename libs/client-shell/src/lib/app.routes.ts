import { inject } from '@angular/core';
import { CanMatchFn, Router, Routes } from '@angular/router';
import { PosStore } from '@pos-platform/data-access';
import type { ModuleId, Permission } from '@pos-platform/domain';
import { guestGuard, sessionChildGuard, sessionMatchGuard } from './session.guards';

const access =
  (permission: Permission, module?: ModuleId): CanMatchFn =>
  () =>
    inject(PosStore).can(permission, module) || inject(Router).createUrlTree(['/sin-acceso']);

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Corporate POS',
    canMatch: [guestGuard],
    loadComponent: () => import('@pos-platform/features/access').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    canMatch: [sessionMatchGuard],
    canActivateChild: [sessionChildGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · Corporate POS',
        loadComponent: () => import('@pos-platform/features/insights').then((m) => m.DashboardComponent),
      },
      {
        path: 'venta',
        title: 'Nueva venta · Corporate POS',
        canMatch: [access('sell', 'sales')],
        loadComponent: () => import('@pos-platform/features/checkout').then((m) => m.CheckoutComponent),
      },
      {
        path: 'caja',
        title: 'Mi caja · Corporate POS',
        canMatch: [access('cash', 'cash')],
        loadComponent: () => import('@pos-platform/features/checkout').then((m) => m.CashSessionComponent),
      },
      {
        path: 'documentos',
        title: 'Documentos · Corporate POS',
        canMatch: [access('sell', 'sales')],
        loadComponent: () => import('@pos-platform/features/checkout').then((m) => m.DocumentsComponent),
      },
      {
        path: 'cobranzas',
        title: 'Cobranzas · Corporate POS',
        canMatch: [access('collect', 'collections')],
        loadComponent: () => import('@pos-platform/features/checkout').then((m) => m.CollectionsComponent),
      },
      {
        path: 'devoluciones',
        title: 'Devoluciones · Corporate POS',
        canMatch: [access('refund', 'returns')],
        loadComponent: () => import('@pos-platform/features/checkout').then((m) => m.ReturnsComponent),
      },
      {
        path: 'reportes',
        title: 'Reportes · Corporate POS',
        canMatch: [access('reports', 'reports')],
        loadComponent: () => import('@pos-platform/features/insights').then((m) => m.ReportsComponent),
      },
      {
        path: 'maestros',
        title: 'Maestros · Corporate POS',
        canMatch: [access('masters', 'masters')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.MastersComponent),
      },
      {
        path: 'precios',
        title: 'Precios y ofertas · Corporate POS',
        canMatch: [access('pricing', 'pricing')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.PricingComponent),
      },
      {
        path: 'sincronizacion',
        title: 'Sincronización · Corporate POS',
        canMatch: [access('sync', 'sync')],
        loadComponent: () =>
          import('@pos-platform/features/administration').then((m) => m.SyncCenterComponent),
      },
      {
        path: 'actividad',
        title: 'Actividad · Corporate POS',
        canMatch: [access('audit', 'audit')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.ActivityComponent),
      },
      {
        path: 'configuracion',
        title: 'Configuración · Corporate POS',
        canMatch: [access('configure')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.SettingsComponent),
      },
      {
        path: 'usuarios',
        title: 'Usuarios · Corporate POS',
        canMatch: [access('users', 'users')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.UsersComponent),
      },
      {
        path: 'sucursales',
        title: 'Sucursales · Corporate POS',
        canMatch: [access('configure', 'branches')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.BranchesComponent),
      },
      {
        path: 'dispositivos',
        title: 'Dispositivos · Corporate POS',
        canMatch: [access('devices', 'devices')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.DevicesComponent),
      },
      {
        path: 'integraciones',
        title: 'Integraciones · Corporate POS',
        canMatch: [access('configure', 'integrations')],
        loadComponent: () =>
          import('@pos-platform/features/administration').then((m) => m.IntegrationsComponent),
      },
      {
        path: 'actualizaciones',
        title: 'Actualizaciones · Corporate POS',
        canMatch: [access('configure', 'updates')],
        loadComponent: () => import('@pos-platform/features/administration').then((m) => m.UpdatesComponent),
      },
      {
        path: 'sin-acceso',
        title: 'Acceso no disponible · Corporate POS',
        loadComponent: () => import('./access-denied.component').then((m) => m.AccessDeniedComponent),
      },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];

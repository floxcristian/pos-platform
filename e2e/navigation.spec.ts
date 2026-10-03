import { expect, test } from '@playwright/test';

test('todas las áreas de producto cargan con encabezado y sin excepciones', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const routes = [
    'inicio',
    'venta',
    'caja',
    'documentos',
    'cobranzas',
    'devoluciones',
    'maestros',
    'precios',
    'reportes',
    'sincronizacion',
    'actividad',
    'configuracion',
    'usuarios',
    'sucursales',
    'dispositivos',
    'integraciones',
    'actualizaciones',
  ];
  for (const route of routes) {
    await page.goto('/#/' + route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acceso no disponible' })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

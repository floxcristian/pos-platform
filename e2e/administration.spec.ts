import { expect, test } from '@playwright/test';

test('deshabilitar un módulo bloquea el menú y el acceso por URL sin perder datos', async ({ page }) => {
  await page.goto('/#/configuracion');
  await page.locator('label[for="module-sales"]').click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Venta', exact: true })).toBeChecked();
  await page.locator('label[for="module-sales"]').click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Nueva venta' }),
  ).toHaveCount(0);
  await page.goto('/#/venta');
  await expect(page.getByRole('heading', { name: 'Acceso no disponible' })).toBeVisible();
  await page.goto('/#/configuracion');
  await page.locator('label[for="module-sales"]').click();
  await page.goto('/#/documentos');
  await expect(page.getByRole('button', { name: 'F-10001', exact: true })).toBeVisible();
});

test('el perfil cajero conserva operación y bloquea configuración por URL', async ({ page }) => {
  await page.goto('/#/inicio');
  const profile = page.getByRole('button', { name: /^Perfil y entorno de demostración:/ });
  await expect(profile.getByText('Administrador Demo', { exact: true })).toBeVisible();
  await profile.click();
  await page.getByRole('combobox', { name: 'Perfil de demostración' }).click();
  await page.getByRole('option', { name: 'Cajero', exact: true }).click();
  await expect(profile.getByText('Cajero Demo', { exact: true })).toBeVisible();
  await expect(profile.getByText('CD', { exact: true })).toBeVisible();
  await expect(profile).not.toContainText('CAJA-01');
  await page.reload();
  await expect(profile.getByText('Cajero Demo', { exact: true })).toBeVisible();
  await page.goto('/#/configuracion');
  await expect(page.getByRole('heading', { name: 'Acceso no disponible' })).toBeVisible();
  await page.goto('/#/venta');
  await expect(
    page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }),
  ).toBeVisible();
});

test('programación persistida, fallo simulado y reintento manual del mismo flujo', async ({ page }) => {
  await page.goto('/#/sincronizacion');
  let row = page.getByRole('row').filter({ hasText: 'Ventas hacia ERP' });
  await row.getByRole('button', { name: 'Programar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Programar sincronización' });
  await dialog.getByRole('combobox', { name: 'Frecuencia' }).click();
  await page.getByRole('option', { name: 'Por intervalo', exact: true }).click();
  await dialog.getByRole('spinbutton', { name: 'Cada cuántos minutos' }).fill('30');
  await dialog.locator('label[for="schedule-failure"]').click();
  await dialog.getByRole('button', { name: 'Guardar programación' }).click();
  await page.reload();
  row = page.getByRole('row').filter({ hasText: 'Ventas hacia ERP' });
  await expect(row.getByText('Cada 30 min')).toBeVisible();
  await row.getByRole('button', { name: 'Ejecutar Ventas hacia ERP', exact: true }).click();
  await expect(row.getByText('Fallido', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Ejecutar Ventas hacia ERP', exact: true }).click();
  await expect(row.getByText('Correcto', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Historial', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Ventas hacia ERP' })).toHaveCount(2);
});

test('maestros valida antes de guardar y conserva un producto nuevo tras recargar', async ({ page }) => {
  await page.goto('/#/maestros');
  await page.getByRole('button', { name: 'Nuevo producto' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo producto' });
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('El producto necesita nombre y SKU.')).toBeVisible();
  await dialog.getByLabel('Nombre *', { exact: true }).fill('Producto sintético de prueba');
  await dialog.getByLabel('SKU *', { exact: true }).fill('QA-NEW-001');
  await dialog.getByRole('spinbutton', { name: 'Precio con IVA *', exact: true }).fill('11900');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole('textbox', { name: 'Buscar registros' }).fill('QA-NEW-001');
  await expect(page.getByRole('row').filter({ hasText: 'Producto sintético de prueba' })).toBeVisible();
});

test('sin conexión bloquea la ejecución manual y muestra el estado operativo', async ({ page }) => {
  await page.goto('/#/sincronizacion');
  await page.getByRole('button', { name: 'Perfil y entorno de demostración' }).click();
  await page.locator('label[for="demo-online"]').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Ejecutar flujos habilitados' })).toBeDisabled();
  await expect(
    page.getByText('Sin conexión simulada. Las operaciones permitidas quedan guardadas para sincronizar.'),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ejecutar flujos habilitados' })).toBeDisabled();
});

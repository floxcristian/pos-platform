import { expect, test, type Page } from '@playwright/test';

async function choose(page: Page, name: string, option: string): Promise<void> {
  const select = page.getByRole('combobox', { name, exact: true });
  if ((await select.innerText()).trim() === option) return;
  await select.click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('el borrador conserva carro y despacho al navegar y recargar, sin resucitar una venta confirmada', async ({
  page,
}) => {
  await page.goto('/#/venta');
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
  await choose(page, 'Cliente de la venta', 'Taller Horizonte Demo');
  await choose(page, 'Forma de entrega', 'Despacho');
  await page.getByLabel('Dirección de despacho', { exact: true }).fill('Dirección sintética de prueba 123');
  await page.getByLabel('Contacto para la entrega', { exact: true }).fill('Contacto de demostración');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('link', { name: 'Documentos', exact: true }).click();
  await nav.getByRole('link', { name: 'Nueva venta', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' })).toHaveValue(
    '1',
  );
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Cliente de la venta' })).toHaveText(
    'Taller Horizonte Demo',
  );
  await expect(page.getByLabel('Dirección de despacho', { exact: true })).toHaveValue(
    'Dirección sintética de prueba 123',
  );
  await expect(page.getByLabel('Contacto para la entrega', { exact: true })).toHaveValue(
    'Contacto de demostración',
  );
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await page.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Venta guardada' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Tu venta comienza aquí', { exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' })).toHaveCount(
    0,
  );
});

test('guardar políticas conserva el tema actual y no guarda cambios pendientes de empresa', async ({
  page,
}) => {
  await page.goto('/#/configuracion');
  await page.getByRole('button', { name: 'Empresa y caja', exact: true }).click();
  const company = page.getByLabel('Razón social', { exact: true });
  const original = await company.inputValue();
  await company.fill('Empresa pendiente de guardar');
  await page.getByRole('button', { name: 'Políticas', exact: true }).click();
  await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();
  await page.getByLabel('Mensaje del comprobante', { exact: true }).fill('Gracias por tu preferencia.');
  await page.getByRole('button', { name: 'Guardar políticas', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/p-dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/p-dark/);
  await page.getByRole('button', { name: 'Políticas', exact: true }).click();
  await expect(page.getByLabel('Mensaje del comprobante', { exact: true })).toHaveValue(
    'Gracias por tu preferencia.',
  );
  await page.getByRole('button', { name: 'Empresa y caja', exact: true }).click();
  await expect(company).toHaveValue(original);
});

test('la apariencia Sistema sigue cambios del SO y una elección explícita los ignora', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/inicio');
  await page.getByRole('button', { name: 'Perfil y entorno de demostración' }).click();
  await choose(page, 'Apariencia', 'Sistema');
  await expect(page.locator('html')).not.toHaveClass(/p-dark/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/p-dark/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/p-dark/);
  await choose(page, 'Apariencia', 'Oscuro');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/p-dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/p-dark/);
});

test('un fallo de impresión se explica dentro del recibo sin deshacer la venta', async ({ page }) => {
  await page.goto('/#/dispositivos');
  const printer = page.getByRole('article').filter({ hasText: 'Impresora térmica · caja 01' });
  await printer.getByRole('switch', { name: 'Habilitado', exact: true }).uncheck();
  await page.goto('/#/venta');
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await page.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  await receipt.getByRole('button', { name: 'Imprimir comprobante', exact: true }).click();
  await expect(receipt.getByText('Habilita una impresora disponible.', { exact: true })).toBeVisible();
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await expect(page.getByRole('button', { name: number, exact: true })).toHaveCount(1);
});

test('almacenamiento bloqueado mantiene aviso y no confirma ventas hasta recuperar la escritura', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota de prueba', 'QuotaExceededError');
    };
    window.addEventListener('restore-storage-for-test', () => {
      Storage.prototype.setItem = write;
    });
  });
  await page.goto('/#/venta');
  const banner = page.getByRole('alert').filter({ hasText: 'No se pudo guardar en este equipo' });
  await expect(banner).toBeVisible();
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
  await page.getByRole('button', { name: /^Cobrar / }).click();
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(
    payment.getByText('No se pudo guardar: el almacenamiento local está lleno o bloqueado.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Venta guardada' })).toHaveCount(0);
  await expect(banner).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('restore-storage-for-test')));
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  await expect(receipt).toBeVisible();
  await expect(banner).toHaveCount(0);
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await expect(page.getByRole('button', { name: number, exact: true })).toHaveCount(1);
});

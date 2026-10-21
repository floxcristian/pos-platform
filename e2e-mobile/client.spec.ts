import { expect, test } from '../e2e/fixtures';

test('mobile boot uses the shared guarded routes and a drawer at phone and tablet widths', async ({
  page,
}) => {
  await expect(page.locator('html')).toHaveAttribute('data-client-platform', 'mobile');
  await expect(page.locator('#desktop-navigation')).toHaveCount(0);
  const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await menu.click();
  const drawer = page.getByRole('complementary').filter({
    has: page.getByRole('button', { name: 'Cerrar navegación', exact: true }),
  });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Nueva venta', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page).toHaveURL(/#\/venta$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/inicio$/);
  await expect(menu).toBeVisible();
});

test('mobile checkout preserves a completed synthetic sale after reloading', async ({ page }) => {
  await page.goto('/#/venta');
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
  await page.getByRole('button', { name: /^Cobrar / }).click();
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await payment.getByRole('spinbutton', { name: 'Monto del pago' }).fill('5000');
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  await expect(receipt).toBeVisible();
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await expect(page.getByRole('button', { name: number, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: number, exact: true })).toBeVisible();
});

test('mobile layout fits the viewport and loads under its production content policy', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  await page.goto('/#/inicio');
  await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeVisible();
  const sizes = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
  const response = await page.request.get('/');
  expect(response.headers()['content-security-policy']).not.toContain('unsafe-eval');
  expect(response.headers()['content-security-policy']).toContain("object-src 'none'");
  expect(failures).toEqual([]);
});

import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openDashboard(page: Page): Promise<void> {
  await page.goto('/#/inicio');
  await expect(page.getByRole('heading', { name: 'Tu operación, en un vistazo' })).toBeVisible();
  await expect(page.locator('p-chart canvas').first()).toBeVisible();
}

test('shell: navegación por teclado, búsqueda global y persistencia del tema', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openDashboard(page);

  await page.getByRole('link', { name: 'Saltar al contenido' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page).toHaveURL(/#\/inicio$/);

  await page.keyboard.press('Control+k');
  const search = page.getByRole('dialog', { name: 'Buscar en Corporate POS' });
  await expect(search).toBeVisible();
  await search.getByRole('textbox').fill('reportes');
  await search.getByRole('button', { name: /Reportes Ir al módulo/ }).click();
  await expect(page).toHaveURL(/#\/reportes$/);
  await expect(page.getByRole('heading', { name: 'Reportes', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/p-dark/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Reportes', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/p-dark/);
  await page.getByRole('button', { name: 'Usar tema claro', exact: true }).click();
  await expect(page.locator('html')).not.toHaveClass(/p-dark/);
  expect(errors).toEqual([]);
});

test('shell: el menú lateral conserva su estado sin interferir con la navegación móvil', async ({ page }) => {
  await openDashboard(page);
  const sidebar = page.locator('#desktop-navigation');
  const toggle = page.getByRole('button', { name: 'Ocultar menú lateral', exact: true });
  await expect(sidebar).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-controls', 'desktop-navigation');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const originalWidth = (await page.locator('main').boundingBox())!.width;

  await toggle.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Ocultar menú lateral');
  await toggle.press('Enter');
  const reopen = page.getByRole('button', { name: 'Mostrar menú lateral', exact: true });
  await expect(reopen).toBeFocused();
  await expect(reopen).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar).toBeHidden();
  expect((await page.locator('main').boundingBox())!.width).toBeGreaterThan(originalWidth + 200);

  await page.keyboard.press('Control+k');
  const search = page.getByRole('dialog', { name: 'Buscar en Corporate POS' });
  await search.getByRole('textbox').fill('reportes');
  await search.getByRole('button', { name: /Reportes Ir al módulo/ }).click();
  await expect(page).toHaveURL(/#\/reportes$/);
  await expect(sidebar).toBeHidden();
  await page.reload();
  await expect(reopen).toBeVisible();
  await expect(sidebar).toBeHidden();

  await page.setViewportSize({ width: 375, height: 1000 });
  await expect(reopen).toBeHidden();
  await page.getByRole('button', { name: 'Abrir navegación', exact: true }).click();
  const mobileMenu = page.getByRole('navigation', { name: 'Navegación móvil' });
  await mobileMenu.getByRole('link', { name: 'Mi caja', exact: true }).click();
  await expect(page).toHaveURL(/#\/caja$/);
  await expect(mobileMenu).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(sidebar).toBeHidden();
  await reopen.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Mostrar menú lateral');
  await reopen.press('Enter');
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Mi caja', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.reload();
  await expect(toggle).toBeVisible();
  await expect(sidebar).toBeVisible();
});

test('reportes: filtros, detalle y exportación CSV de los resultados', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/reportes');
  await expect(page.getByRole('heading', { name: 'Reportes', exact: true })).toBeVisible();
  await expect(page.locator('p-chart canvas')).toBeVisible();

  await page
    .getByRole('button', { name: /Ver detalle de/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Estado del pago', { exact: true })).toBeVisible();
  await page.getByRole('dialog').locator('.p-dialog-close-button').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^corporate-pos-sales-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const output = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(output);
  const csv = await readFile(output, 'utf8');
  expect(csv).toContain('"Fecha";"Referencia";"Concepto";"Sucursal";"Importe CLP";"Estado";"Detalle"');
  expect(csv.split('\r\n').length).toBeGreaterThan(2);
  await expect(page.getByRole('status').filter({ hasText: 'Se exportaron' })).toBeVisible();

  const fromDate = page.getByRole('combobox', { name: 'Desde', exact: true });
  await fromDate.press('ControlOrMeta+a');
  await fromDate.pressSequentially('01/01/2099');
  await fromDate.press('Tab');
  await expect(page.getByRole('alert').filter({ hasText: 'La fecha de inicio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exportar CSV', exact: true })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Buscar en resultados', exact: true }).fill('sin-resultados-e2e');
  await expect(page.getByText('No hay registros con estos filtros', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('configuración mock de dispositivos e integraciones valida y conserva cambios', async ({ page }) => {
  await page.goto('/#/dispositivos');
  await page.locator('article').first().getByRole('button', { name: 'Configurar', exact: true }).click();
  const deviceDialog = page.getByRole('dialog', { name: 'Configurar dispositivo' });
  await deviceDialog.getByLabel('Nombre del dispositivo', { exact: true }).fill('');
  await deviceDialog.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
  await expect(deviceDialog.getByRole('alert')).toContainText('necesita un nombre');
  await deviceDialog
    .getByLabel('Nombre del dispositivo', { exact: true })
    .fill('Impresora de demostración E2E');
  await deviceDialog
    .getByLabel('Descripción de conexión simulada', { exact: true })
    .fill('Conexión USB simulada');
  await deviceDialog.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
  await expect(deviceDialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Impresora de demostración E2E', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Conexión USB simulada', { exact: true })).toBeVisible();

  await page.goto('/#/integraciones');
  await page.locator('article').first().getByRole('button', { name: 'Configurar', exact: true }).click();
  const integrationDialog = page.getByRole('dialog', { name: 'Configurar integración' });
  await integrationDialog
    .getByLabel('Nombre de la integración', { exact: true })
    .fill('ERP de demostración E2E');
  await integrationDialog.getByLabel('Proveedor de demostración', { exact: true }).fill('');
  await integrationDialog.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
  await expect(integrationDialog.getByRole('alert')).toContainText('proveedor simulado');
  await integrationDialog.getByLabel('Proveedor de demostración', { exact: true }).fill('AX simulado E2E');
  await integrationDialog.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
  await expect(integrationDialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'ERP de demostración E2E', exact: true })).toBeVisible();
  await expect(page.getByText('AX simulado E2E', { exact: true })).toBeVisible();
});

for (const { width, height } of [
  { width: 375, height: 800 },
  { width: 1440, height: 1000 },
  { width: 1536, height: 724 },
]) {
  test(`dashboard y reportes mantienen gráficos y scroll a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await openDashboard(page);
    const documentOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(documentOverflow).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    const main = page.locator('#main-content');
    expect(await main.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const canvas = page.locator('p-chart canvas').first();
    const chart = await canvas.boundingBox();
    expect(chart?.width).toBeGreaterThan(150);
    expect((chart?.x ?? 0) + (chart?.width ?? 0)).toBeLessThanOrEqual(width);

    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true });
    if (width === 375) {
      await page.getByRole('button', { name: 'Abrir navegación', exact: true }).click();
      const menu = page.getByRole('navigation', { name: 'Navegación móvil' });
      await expect(menu).toBeVisible();
      await menu.getByRole('link', { name: 'Reportes', exact: true }).click();
    } else {
      await page
        .getByRole('navigation', { name: 'Navegación principal' })
        .getByRole('link', { name: 'Reportes', exact: true })
        .click();
    }
    await expect(page.getByRole('heading', { name: 'Reportes', exact: true })).toBeVisible();
    await expect(page.locator('p-chart canvas')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // A screen-reader-only label below the viewport must stay inside the main scroll area.
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    expect(await main.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`reports-${width}.png`), fullPage: true });
    await main.hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect((await page.locator('.brand-header-bg').boundingBox())!.y).toBe(0);
    await main.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
    await expect
      .poll(() => main.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop))
      .toBeLessThan(1);
    await expect(page.locator('.p-paginator')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  });
}

for (const route of ['inicio', 'reportes']) {
  for (const theme of ['claro', 'oscuro']) {
    test(`accesibilidad WCAG: ${route}, tema ${theme}`, async ({ page }, testInfo) => {
      await page.goto(`/#/${route}`);
      await expect(page.locator('p-chart canvas').first()).toBeVisible();
      if (theme === 'oscuro') {
        await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();
        await expect(page.locator('html')).toHaveClass(/p-dark/);
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      await testInfo.attach('axe-results', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });
      await page.screenshot({ path: testInfo.outputPath(`${route}-${theme}.png`), fullPage: true });
      expect(results.violations).toEqual([]);
    });
  }
}

import { expect, test, type Locator, type Page } from '@playwright/test';

async function expectTooltip(page: Page, control: Locator, label: string): Promise<void> {
  // Scroll dismisses help by design. Finish the viewport update before entering the control.
  await control.scrollIntoViewIfNeeded();
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.mouse.move(0, 0);
  await control.hover();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveCount(1);
  await expect(tooltip).toHaveText(label);
  await expect(tooltip).toBeVisible();
  await expect(control).toHaveAttribute('aria-describedby', (await tooltip.getAttribute('id')) as string);
  const box = await tooltip.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
}

for (const theme of ['light', 'dark'] as const) {
  test(`tooltips ${theme}: referencia visual, teclado, clic y overlays`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.goto('/#/venta');
    if (theme === 'dark') await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();
    const themeLabel = theme === 'light' ? 'Usar tema oscuro' : 'Usar tema claro';
    const themeButton = page.getByRole('button', { name: themeLabel, exact: true });
    await expectTooltip(page, themeButton, themeLabel);
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveCSS('background-color', 'rgb(55, 57, 61)');
    await expect(tooltip).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(tooltip).toHaveCSS('border-radius', '6px');
    await expect(tooltip).toHaveCSS('padding', '8px 12px');
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);
    await expect(themeButton).not.toHaveAttribute('aria-describedby');

    await page.getByRole('button', { name: 'Buscar en la caja, Control K', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(themeButton).toBeFocused();
    await expect(tooltip).toHaveText(themeLabel);
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await expect(themeButton).toBeFocused();

    const notifications = page.getByRole('button', { name: /^Notificaciones:/ });
    await expectTooltip(page, notifications, (await notifications.getAttribute('aria-label')) as string);
    await notifications.click();
    await expect(tooltip).toHaveCount(0);
    const closeDrawer = page.locator('.p-drawer-close-button').getByRole('button');
    await expectTooltip(page, closeDrawer, 'Cerrar');
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await expect(closeDrawer).toBeVisible();
    await closeDrawer.click();

    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Buscar en Corporate POS', exact: true });
    const closeDialog = dialog.locator('.p-dialog-close-button');
    await expectTooltip(page, closeDialog, 'Cerrar');
    await page.screenshot({ path: testInfo.outputPath(`tooltip-dialog-${theme}.png`) });
    await closeDialog.click();
    await expect(tooltip).toHaveCount(0);
    await expect(dialog).not.toBeVisible();

    await page.goto('/#/reportes');
    const detail = page.getByRole('button', { name: /Ver detalle de/ }).first();
    await expectTooltip(page, detail, (await detail.getAttribute('aria-label')) as string);
    const detailTooltipId = await tooltip.getAttribute('id');
    await detail.click();
    // The dialog autofocus may show a new Close tooltip. Verify cleanup of the clicked action itself.
    await expect(page.locator(`#${detailTooltipId}`)).toHaveCount(0);
    await expect(detail).not.toHaveAttribute('aria-describedby');
    await page.getByRole('dialog').locator('.p-dialog-close-button').click();
    await expectTooltip(page, page.locator('.p-paginator-next'), 'Página siguiente');
    await page.locator('.p-paginator-next').click();
    await expect(tooltip).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Desde', exact: true }).click();
    await expectTooltip(page, page.locator('.p-datepicker-prev-button'), 'Mes anterior');
    await page.locator('.p-datepicker-prev-button').click();
    await expect(tooltip).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expectTooltip(
      page,
      page.getByRole('button', { name: /^Notificaciones:/ }),
      (await notifications.getAttribute('aria-label')) as string,
    );
    await page.goto('/#/inicio');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('ayudas en campos, avisos y controles bloqueados; sin tooltips huérfanos', async ({ page }) => {
  await page.goto('/#/venta');
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
  const quantity = page.locator('p-inputnumber').filter({
    has: page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado', exact: true }),
  });
  await expectTooltip(page, quantity.locator('.p-inputnumber-increment-button'), 'Aumentar');
  await page.getByRole('button', { name: 'Quitar Guante de trabajo reforzado', exact: true }).click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cargar orden de venta', exact: true }).click();
  await page
    .locator('.p-drawer section')
    .filter({ hasText: 'OV-DEMO-1001' })
    .getByRole('button', { name: 'Cargar esta orden', exact: true })
    .click();
  await expect(page.locator('.p-drawer-mask')).toHaveCount(0);
  const remove = page.getByRole('button', { name: 'Quitar Guante de trabajo reforzado', exact: true });
  await expect(remove).toBeDisabled();
  await remove.hover({ force: true });
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  await page.goto('/#/sucursales');
  await page.getByRole('button', { name: 'Nueva sucursal', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar sucursal', exact: true }).click();
  await expectTooltip(page, page.locator('.p-toast-close-button'), 'Cerrar');
  await page.locator('.p-toast-close-button').click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  for (const id of ['branch-code', 'branch-name', 'branch-city']) {
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-describedby', `${id}-error`);
    await expect(page.locator(`#${id}-error`)).toBeVisible();
  }
  await page.locator('#branch-name').fill('Sucursal demostración');
  await expect(page.locator('#branch-name-error')).toHaveCount(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.goto('/#/reportes');
  await expectTooltip(page, page.locator('p-select .p-select-dropdown').first(), 'Abrir opciones');
  await page.locator('#main-content').evaluate((el) => el.scrollBy(0, 100));
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('375px: ayudas del header sin desbordamiento y jerarquía consistente', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/#/inicio');
  const profile = page.getByRole('button', { name: /^Perfil y entorno de demostración:/ });
  // SVG mask defaults must not override the responsive hidden utility and widen this control.
  await expect(profile.locator('.pos-icon-caret-down')).toBeHidden();
  expect(await profile.boundingBox()).toMatchObject({ width: 44, height: 44 });
  await expectTooltip(page, profile, 'Administrador Demo · Administrador');
  const openNav = page.getByRole('button', { name: 'Abrir navegación', exact: true });
  await expectTooltip(page, openNav, 'Abrir navegación');
  await openNav.click();
  await expectTooltip(page, page.locator('.p-drawer-close-button').getByRole('button'), 'Cerrar');
  await page.locator('.p-drawer-close-button').getByRole('button').click();
  await expect(page.locator('.p-drawer-mask')).toHaveCount(0);
  await expectTooltip(page, page.getByRole('button', { name: 'Buscar', exact: true }), 'Buscar');
  await page.mouse.move(0, 0);
  await page.goto('/#/sucursales');
  await expect(page.locator('pos-page-header h1')).toHaveCSS('font-size', '24px');
  await expect(page.locator('pos-page-header h1')).toHaveCSS('font-weight', '500');
  await expect(page.locator('pos-page-header')).not.toHaveAttribute('title');
  const gap = await page
    .locator('pos-page-header')
    .evaluate((el) => el.nextElementSibling!.getBoundingClientRect().top - el.getBoundingClientRect().bottom);
  expect(gap).toBe(24);
  expect(
    await page.locator('#main-content').evaluate((el) => el.scrollWidth - el.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('confirmaciones y avisos temporales limpian su ayuda y descripción accesible', async ({
  page,
}, testInfo) => {
  await page.goto('/#/configuracion');
  await page.getByRole('button', { name: 'Demostración', exact: true }).click();
  await page.getByRole('button', { name: 'Restablecer demostración', exact: true }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Restablecer demostración' });
  await expectTooltip(page, confirmation.locator('.p-dialog-close-button'), 'Cerrar');
  await confirmation.locator('.p-dialog-close-button').click();
  await expect(confirmation).not.toBeVisible();
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  await page.goto('/#/sucursales');
  await page.getByRole('button', { name: 'Nueva sucursal', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar sucursal', exact: true }).click();
  const close = page.locator('.p-toast-close-button');
  await expectTooltip(page, close, 'Cerrar');
  await page.keyboard.press('Tab');
  await close.focus();
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveText('Cerrar');
  // Preserve the actual DOM node to assert cleanup after PrimeNG destroys its item.
  const element = await close.elementHandle();
  await expect(close).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  expect(await element!.evaluate((el) => el.getAttribute('aria-describedby'))).toBeNull();
  const numberField = await page.locator('p-inputnumber').boundingBox();
  const nameField = await page.locator('#branch-name').boundingBox();
  const cityField = await page.locator('#branch-city').boundingBox();
  expect(Math.abs(numberField!.y - cityField!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(numberField!.x + numberField!.width - nameField!.x - nameField!.width)).toBeLessThanOrEqual(
    1,
  );
  await page.screenshot({ path: testInfo.outputPath('branch-validation.png') });
});

test('selector múltiple y estado vacío comparten presentación accesible', async ({ page }, testInfo) => {
  await page.goto('/#/precios');
  await page.getByRole('button', { name: 'Nueva oferta', exact: true }).click();
  const select = page.locator('p-multiselect .p-multiselect-dropdown');
  await select.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Abrir opciones');
  await select.click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goto('/#/maestros');
  await page.getByRole('textbox', { name: 'Buscar registros' }).fill('sin coincidencias 000000');
  const empty = page.locator('pos-empty-state');
  await expect(empty).toBeVisible();
  await expect(empty.getByRole('heading')).toHaveText('No encontramos productos con esa búsqueda.');
  await expect(empty.locator('svg')).toHaveCSS('width', '40px');
  await expect(page.locator('.pos-table')).toHaveCSS('font-size', '16px');
  await page.screenshot({ path: testInfo.outputPath('masters-empty.png') });
});

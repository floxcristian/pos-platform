import { expect, test, type Locator, type Page } from '@playwright/test';

type Rgb = [number, number, number];
function contrast(a: Rgb, b: Rgb): number {
  const luminance = (rgb: Rgb) =>
    rgb
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

// Composite transparent controls over their actual ancestor surfaces, not over assumed white.
async function colors(control: Locator): Promise<{ foreground: Rgb; background: Rgb }> {
  return control.evaluate((element) => {
    const context = document.createElement('canvas').getContext('2d')!;
    function rgba(css: string): number[] {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = css;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    }
    const ancestors: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
    let background = [255, 255, 255];
    for (const ancestor of ancestors) {
      const color = rgba(getComputedStyle(ancestor).backgroundColor);
      const alpha = color[3] / 255;
      background = background.map((channel, i) => color[i] * alpha + channel * (1 - alpha));
    }
    return {
      foreground: rgba(getComputedStyle(element).color).slice(0, 3) as [number, number, number],
      background: background as [number, number, number],
    };
  });
}

async function expectHover(page: Page, control: Locator, pressed = true): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const normal = await colors(control);
  const box = await control.boundingBox();
  await control.hover();
  // Product regression threshold for perceptible state change; not a WCAG state-to-state criterion.
  await expect
    .poll(async () => contrast(normal.background, (await colors(control)).background))
    .toBeGreaterThanOrEqual(1.2);
  const hover = await colors(control);
  expect(contrast(hover.foreground, hover.background)).toBeGreaterThanOrEqual(4.5);
  expect(await control.boundingBox()).toEqual(box);
  if (pressed) {
    await page.mouse.down();
    await expect
      .poll(async () => contrast(hover.background, (await colors(control)).background))
      .toBeGreaterThan(1.1);
    const active = await colors(control);
    expect(contrast(active.foreground, active.background)).toBeGreaterThanOrEqual(4.5);
    // Release outside the target so destructive/close actions are never invoked by this check.
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
}

async function expectInlineAction(page: Page, control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const normal = await colors(control);
  const box = await control.boundingBox();
  await expect(control).toHaveCSS('text-decoration-line', 'underline');
  await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(control.locator('.pos-icon, svg')).toHaveCount(0);
  expect(contrast(normal.foreground, normal.background)).toBeGreaterThanOrEqual(4.5);
  await control.hover();
  await expect.poll(async () => (await colors(control)).foreground).not.toEqual(normal.foreground);
  const hover = await colors(control);
  expect(hover.background).toEqual(normal.background);
  expect(contrast(hover.foreground, hover.background)).toBeGreaterThanOrEqual(4.5);
  expect(await control.boundingBox()).toEqual(box);
  await page.mouse.down();
  const active = await colors(control);
  expect(active.background).toEqual(normal.background);
  expect(contrast(active.foreground, active.background)).toBeGreaterThanOrEqual(4.5);
  await expect(control).toHaveCSS('text-decoration-line', 'underline');
  await page.mouse.move(0, 0);
  await page.mouse.up();
}

for (const theme of ['light', 'dark'] as const) {
  test(`interacciones ${theme}: cierres, acciones, segmentos y controles deshabilitados`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.goto('/#/venta');
    if (theme === 'dark') await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();
    const themeButton = page.getByRole('button', {
      name: theme === 'light' ? 'Usar tema oscuro' : 'Usar tema claro',
      exact: true,
    });
    await themeButton.hover();
    await expect(themeButton).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(themeButton).toHaveCSS(
      'background-color',
      theme === 'light' ? 'rgb(0, 74, 122)' : 'rgb(0, 55, 92)',
    );

    const product = page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true });
    await expectHover(page, product);

    await page.keyboard.press('Control+k');
    const search = page.getByRole('dialog', { name: 'Buscar en Corporate POS', exact: true });
    await expect(search.getByRole('textbox')).toBeFocused();
    const close = search.locator('.p-dialog-close-button');
    await expectHover(page, close);
    await expectHover(page, search.locator('.pos-surface-action').first());
    await search.getByRole('textbox').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();
    await expect(close).not.toHaveCSS('box-shadow', 'none');
    await close.hover();
    await search.screenshot({ path: testInfo.outputPath(`close-hover-${theme}.png`) });
    await close.press('Enter');
    await expect(search).not.toBeVisible();

    await page.getByRole('button', { name: /^Notificaciones:/ }).click();
    const drawerClose = page.locator('.p-drawer-close-button').getByRole('button');
    await expectHover(page, drawerClose);
    await drawerClose.click();

    await page.getByRole('button', { name: 'Cargar orden de venta', exact: true }).click();
    const order = page.locator('.p-drawer section').filter({ hasText: 'OV-DEMO-1001' });
    await order.getByRole('button', { name: 'Cargar esta orden', exact: true }).click();
    await expect(product).toBeDisabled();
    await page.mouse.move(0, 0);
    const disabled = await colors(product);
    await product.hover({ force: true });
    expect(await colors(product)).toEqual(disabled);

    await page.goto('/#/reportes');
    const selected = page.getByRole('button', { name: 'Ventas', exact: true });
    const selectedColor = await colors(selected.locator('.p-togglebutton-content'));
    const segment = page.getByRole('button', { name: 'Medios de pago', exact: true });
    await expectHover(page, segment, false);
    expect(await colors(selected.locator('.p-togglebutton-content'))).toEqual(selectedColor);
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expectHover(page, page.getByRole('button', { name: /Ver detalle de/ }).first());
    await expectHover(page, page.locator('.p-paginator-next'), false);
    await page.getByRole('combobox', { name: 'Desde', exact: true }).click();
    await expectHover(page, page.locator('.p-datepicker-prev-button'), false);
    await expectHover(page, page.locator('.p-datepicker-select-year'), false);
    await page.keyboard.press('Escape');

    await page.goto('/#/inicio');
    for (const link of await page.locator('a.pos-inline-action, summary.pos-inline-action').all()) {
      await expectInlineAction(page, link);
    }
    const cardLinkGap = await page
      .getByRole('link', { name: 'Ver caja', exact: true })
      .evaluate(
        (el) => el.getBoundingClientRect().top - el.previousElementSibling!.getBoundingClientRect().bottom,
      );
    expect(cardLinkGap).toBeGreaterThanOrEqual(12);
    const currentPage = page
      .getByRole('navigation', { name: 'Navegación principal', exact: true })
      .locator('[aria-current="page"]');
    const currentColor = await colors(currentPage);
    expect(currentColor.foreground).toEqual(theme === 'light' ? [0, 70, 120] : [217, 236, 255]);
    await currentPage.hover();
    expect(await colors(currentPage)).toEqual(currentColor);
    await expectHover(
      page,
      page
        .getByRole('navigation', { name: 'Navegación principal', exact: true })
        .getByRole('link', { name: 'Reportes', exact: true }),
    );

    await page.goto('/#/configuracion');
    await page.getByRole('button', { name: 'Demostración', exact: true }).click();
    const reset = page.getByRole('button', { name: 'Restablecer demostración', exact: true });
    await expectHover(page, reset);
    await reset.hover();
    const danger = await colors(reset);
    expect(danger.foreground[0]).toBeGreaterThan(danger.foreground[1]);
    expect(danger.background[0]).toBeGreaterThan(danger.background[1]);

    await page.goto('/#/sucursales');
    await page.getByRole('button', { name: 'Nueva sucursal', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar sucursal', exact: true }).click();
    await expectHover(page, page.locator('.p-toast-close-button'), false);
    await page.locator('.p-toast-close-button').click();
    await expect(page.locator('.p-toast-message')).toHaveCount(0);
  });
}

import { expect, test } from '@playwright/test';

// Focus measured in the published prime-showcase (2026-10-03); remaining values from its local Form Card.
for (const theme of ['light', 'dark'] as const) {
  test(`contrato visual ${theme}: marca, foco, controles y secundarios`, async ({ page }) => {
    await page.goto('/#/venta');
    if (theme === 'dark') await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();

    await expect(page.locator('html')).toHaveCSS('font-size', '16px');
    const brand = await page
      .locator('header')
      .first()
      .evaluate((el) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        context.fillStyle = getComputedStyle(el).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      });
    expect(brand).toEqual([0, 109, 182, 255]);
    await expect(page.locator('header').first()).toHaveCSS('height', '64px');
    const input = page.getByRole('textbox', { name: 'Buscar producto o código de barras', exact: true });
    await input.click();
    await expect(input).toHaveCSS('font-size', '16px');
    await expect(input).toHaveCSS('outline-width', '0px');
    const style = await input.evaluate((el) => {
      const css = getComputedStyle(el);
      return { shadow: css.boxShadow, height: parseFloat(css.height) };
    });
    expect(style.height).toBeGreaterThanOrEqual(40);
    expect(style.height).toBeLessThan(44);
    if (theme === 'light') {
      expect(style.shadow).toBe('rgb(178, 221, 249) 0px 0px 0px 3.2px');
      await expect(input).toHaveCSS('border-color', 'rgb(0, 116, 194)');
    } else {
      expect(style.shadow).not.toBe('none');
      expect(style.shadow).toContain('3.2px');
    }

    // The header search dialog must use the same focus treatment as ordinary form fields.
    await page.keyboard.press('Control+k');
    const searchDialog = page.getByRole('dialog', { name: 'Buscar en Corporate POS', exact: true });
    const searchInput = searchDialog.getByRole('textbox');
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveCSS('box-shadow', style.shadow);
    await expect(searchInput).toHaveCSS('outline-width', '0px');
    const focusClearance = await searchInput.evaluate((el) => {
      const content = el.closest('.p-dialog-content')!;
      return el.getBoundingClientRect().top - content.getBoundingClientRect().top;
    });
    expect(focusClearance).toBeGreaterThanOrEqual(3.2);
    await page.keyboard.press('Escape');
    await expect(searchDialog).not.toBeVisible();

    const secondary = page.getByRole('button', { name: 'Cargar orden de venta', exact: true });
    await expect(secondary).toHaveCSS(
      'background-color',
      theme === 'light' ? 'rgb(226, 228, 231)' : 'rgb(55, 57, 61)',
    );
    await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeDisabled();
    const select = page.getByRole('combobox', { name: 'Categoría de productos', exact: true });
    await select.focus();
    await select.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Seguridad', exact: true })).toBeVisible();
    await page.getByRole('option', { name: 'Seguridad', exact: true }).click();
    await expect(select).toContainText('Seguridad');
    await expect(
      page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Agregar Taladro percutor 750 W', exact: true }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'Crear cliente express', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Crear cliente express', exact: true });
    await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCSS(
      'background-color',
      theme === 'light' ? 'rgb(217, 236, 255)' : 'rgb(0, 38, 70)',
    );
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('link', { name: 'Reportes', exact: true }).click();
    const segment = page.getByRole('button', { name: 'Ventas', exact: true });
    await expect(segment).toHaveAttribute('aria-pressed', 'true');
    await expect(segment).toHaveCSS(
      'background-color',
      theme === 'light' ? 'rgb(226, 228, 231)' : 'rgb(55, 57, 61)',
    );
    await expect(segment).toHaveCSS('min-block-size', '40px');
    await page.getByRole('button', { name: 'Medios de pago', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Medios de pago', exact: true })).toBeVisible();
  });
}

test('375px: formularios y selector de reportes conservan su escala sin desbordar la página', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  for (const route of ['venta', 'reportes', 'configuracion']) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('font-size', '16px');
    const overflow = await page.locator('main').evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});

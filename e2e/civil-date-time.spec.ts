import { expect, test } from './fixtures';

test('calendario PrimeNG conserva el día civil elegido, limpia y admite teclado', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-03T15:00:00Z'));
  await page.goto('/#/reportes');
  const from = page.getByRole('combobox', { name: 'Desde', exact: true });
  await expect(from).toHaveValue('04/09/2026');
  await from.click();
  const calendar = page.locator('.p-datepicker-panel');
  await expect(calendar).toBeVisible();
  // This day starts at 01:00 in Chile because the DST transition skips midnight.
  await calendar.locator('[data-date="2026-8-6"]').click();
  await expect(from).toHaveValue('06/09/2026');
  await expect(calendar).not.toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('corporate-pos-sales-2026-09-06-2026-10-03.csv');

  await from.click();
  await calendar.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await expect(from).toHaveValue('');
  await from.pressSequentially('01/01/2099');
  await from.press('Tab');
  await expect(page.getByRole('alert').filter({ hasText: 'La fecha de inicio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('hora de sincronización usa selector PrimeNG y persiste HH:mm', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/sincronizacion');
  await page.getByRole('button', { name: 'Programar', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Frecuencia', exact: true }).click();
  await page.getByRole('option', { name: 'Una vez al día', exact: true }).click();
  const time = dialog.getByRole('combobox', { name: 'Hora local', exact: true });
  await time.click();
  await expect(page.locator('.p-datepicker-time-picker')).toBeVisible();
  await time.press('ControlOrMeta+a');
  await time.pressSequentially('08:30');
  await time.press('Tab');
  await dialog.getByRole('button', { name: 'Guardar programación', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Programar', exact: true }).first().click();
  await expect(page.getByRole('combobox', { name: 'Hora local', exact: true })).toHaveValue('08:30');
  expect(errors).toEqual([]);
});

test('documentos filtra un período inclusivo, conserva resultados al elegir y permite limpiar', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-03T15:00:00Z'));
  await page.goto('/#/documentos');
  await expect(page.getByRole('button', { name: 'F-10001', exact: true })).toBeVisible();
  // Exercise both Chilean day boundaries; UTC dates alone would include/exclude the wrong documents.
  await page.evaluate(() => {
    const key = 'corporate-pos:demo:v1';
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    snapshot.sales[0].createdAt = '2026-10-01T03:00:00.000Z';
    snapshot.sales[1].createdAt = '2026-10-04T02:59:59.999Z';
    snapshot.sales[2].createdAt = '2026-10-04T03:00:00.000Z';
    snapshot.sales[3].createdAt = '2026-10-01T02:59:59.999Z';
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.reload();
  const range = page.getByRole('combobox', { name: 'Período de documentos', exact: true });
  const documents = page.locator('pos-documents table tbody .pos-inline-action');
  await expect(documents.first()).toBeVisible();
  const allCount = await documents.count();
  await range.focus();
  await range.press('ArrowDown');
  const calendar = page.locator('.p-datepicker-panel');
  await expect(calendar).toBeVisible();
  await calendar.locator('[data-date="2026-9-1"]').click();
  await expect(page.getByRole('status').filter({ hasText: 'Selecciona la fecha final' })).toBeVisible();
  await expect(documents).toHaveCount(allCount);
  await calendar.locator('[data-date="2026-9-3"]').click();
  await expect(calendar).not.toBeVisible();
  await expect(range).toHaveValue('01/10/2026 - 03/10/2026');
  await expect(page.getByRole('button', { name: 'F-10001', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B-10002', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B-10003', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'F-10004', exact: true })).toHaveCount(0);
  const filteredCount = await documents.count();
  expect(filteredCount).toBeLessThan(allCount);

  await range.click();
  const sameDay = calendar.locator('[data-date="2026-9-3"]');
  await sameDay.focus();
  await sameDay.press('Enter');
  await expect(documents).toHaveCount(filteredCount);
  await sameDay.press('Enter');
  await expect(range).toHaveValue('03/10/2026 - 03/10/2026');
  await expect(page.getByRole('button', { name: 'F-10001', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'B-10002', exact: true })).toBeVisible();

  await range.click();
  await calendar.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await expect(range).toHaveValue('');
  await expect(documents).toHaveCount(allCount);
  await expect(page.getByRole('status').filter({ hasText: 'Selecciona la fecha final' })).toHaveCount(0);
});

for (const width of [375, 768, 1600]) {
  test(`período de documentos permanece en un campo sin desbordar a ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date('2026-10-03T15:00:00Z'));
    await page.goto('/#/documentos');
    const range = page.getByRole('combobox', { name: 'Período de documentos', exact: true });
    await range.click();
    const calendar = page.locator('.p-datepicker-panel');
    await expect(calendar).toBeVisible();
    const panel = await calendar.boundingBox();
    expect(panel!.x).toBeGreaterThanOrEqual(0);
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
    await calendar.locator('[data-date="2026-9-1"]').click();
    await calendar.locator('[data-date="2026-9-3"]').click();
    await expect(calendar).not.toBeVisible();
    await expect(range).toHaveValue('01/10/2026 - 03/10/2026');
    expect(await range.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1600) {
      const filter = page.getByRole('textbox', { name: 'Buscar documento', exact: true });
      const first = await filter.boundingBox();
      const last = await range.boundingBox();
      expect(Math.abs(first!.y - last!.y)).toBeLessThan(1);
    }
    await page.screenshot({ path: testInfo.outputPath(`documents-period-${width}.png`) });
  });
}

import { expect, test } from '@playwright/test';

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

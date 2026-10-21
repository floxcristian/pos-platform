import { expect, test as base, type Page } from '@playwright/test';

interface Credentials {
  email?: string;
  password?: string;
  remember?: boolean;
}

interface DemoOptions {
  fixedTime: string | undefined;
}

/** Use the public demo login so protected-page suites exercise the same session as the UI. */
export async function signIn(page: Page, credentials: Credentials = {}): Promise<void> {
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(credentials.email ?? 'admin@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill(credentials.password ?? 'Demo123!');
  await page
    .getByRole('checkbox', { name: 'Mantener sesión en este equipo', exact: true })
    .setChecked(credentials.remember ?? false);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.locator('pos-shell')).toBeVisible();
}

export const test = base.extend<DemoOptions>({
  fixedTime: [undefined, { option: true }],
  page: async ({ page, fixedTime }, use) => {
    // Seed demo records and test filters from the same clock, before the first navigation.
    if (fixedTime) await page.clock.setFixedTime(new Date(fixedTime));
    await page.goto('/#/login');
    await signIn(page);
    await use(page);
  },
});

export { expect, type Locator, type Page } from '@playwright/test';

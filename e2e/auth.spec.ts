import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn } from './fixtures';

const AUTH_KEY = 'corporate-pos:auth:v1';

async function expectLoggedOut(page: Page): Promise<void> {
  await expect(page).toHaveURL(/#\/login(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Bienvenido', exact: true })).toBeVisible();
  await expect(page.locator('pos-shell')).toHaveCount(0);
}

async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Perfil y entorno de demostración:/ }).click();
  await page
    .getByRole('dialog', { name: 'Perfil y entorno', exact: true })
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expectLoggedOut(page);
}

test('sin sesión protege un enlace directo y recupera su ruta y filtro después del acceso', async ({
  page,
}) => {
  await page.goto('/#/documentos?buscar=F-10001');
  await expectLoggedOut(page);
  expect(new URLSearchParams(new URL(page.url()).hash.split('?')[1]).get('returnUrl')).toBe(
    '/documentos?buscar=F-10001',
  );
  await signIn(page);
  await expect(page).toHaveURL(/#\/documentos\?buscar=F-10001$/);
  await expect(page.getByRole('textbox', { name: 'Buscar documento', exact: true })).toHaveValue('F-10001');
  await expect(page.getByRole('button', { name: 'F-10001', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Perfil y entorno de demostración:/ })).toContainText(
    'Cristian Flores',
  );
});

test('valida campos y contraseña sin abrir una sesión, y permite corregir el acceso', async ({ page }) => {
  await page.goto('/#/login');
  const email = page.getByLabel('Correo electrónico', { exact: true });
  const password = page.getByLabel('Contraseña', { exact: true });
  const submit = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
  await expect(email).toHaveValue('');
  await expect(password).toHaveValue('');
  await submit.click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(password).toHaveAttribute('aria-invalid', 'true');

  await email.fill('correo-invalido');
  await submit.click();
  await expect(page.getByText('Ingresa un correo electrónico válido.', { exact: true })).toBeVisible();
  await email.fill('admin@example.test');
  await password.fill('contraseña-incorrecta');
  await submit.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Correo o contraseña incorrectos' })).toBeVisible();
  await expectLoggedOut(page);
  expect(
    await page.evaluate((key) => [sessionStorage.getItem(key), localStorage.getItem(key)], AUTH_KEY),
  ).toEqual([null, null]);

  await password.fill('Demo123!');
  await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await password.press('Enter');
  await expect(page).toHaveURL(/#\/inicio$/);
  await expect(page.locator('pos-shell')).toBeVisible();
});

test('la sesión sin recordar sobrevive a recargar y termina al abrir una pestaña independiente', async ({
  page,
  context,
}) => {
  await page.goto('/#/login');
  await signIn(page);
  await page.reload();
  await expect(page.locator('pos-shell')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), AUTH_KEY)).toBeNull();
  await page.goto('/#/login');
  await expect(page).toHaveURL(/#\/inicio$/);

  const freshTab = await context.newPage();
  try {
    await freshTab.goto('/#/reportes');
    await expectLoggedOut(freshTab);
  } finally {
    await freshTab.close();
  }
  await expect(page.locator('pos-shell')).toBeVisible();
});

test('mantener sesión permite reabrir la caja en otra pestaña y borrar ese acceso al salir', async ({
  page,
  context,
}) => {
  await page.goto('/#/login');
  await signIn(page, { remember: true });
  await page.reload();
  await expect(page.locator('pos-shell')).toBeVisible();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), AUTH_KEY)).toBeNull();

  const freshTab = await context.newPage();
  try {
    await freshTab.goto('/#/reportes');
    await expect(freshTab.getByRole('heading', { name: 'Reportes', exact: true })).toBeVisible();
    await signOut(freshTab);
    expect(await freshTab.evaluate((key) => localStorage.getItem(key), AUTH_KEY)).toBeNull();
  } finally {
    await freshTab.close();
  }
  await page.reload();
  await expectLoggedOut(page);
});

test('cerrar sesión conserva la venta y el turno, y bloquea atrás y las URL protegidas', async ({ page }) => {
  await page.goto('/#/venta');
  await signIn(page);
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' })).toHaveValue(
    '1',
  );
  const businessBefore = await page.evaluate(() => localStorage.getItem('corporate-pos:demo:v1'));
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: 'Documentos', exact: true })
    .click();
  await signOut(page);
  expect(
    await page.evaluate((key) => [sessionStorage.getItem(key), localStorage.getItem(key)], AUTH_KEY),
  ).toEqual([null, null]);
  expect(await page.evaluate(() => localStorage.getItem('corporate-pos:demo:v1'))).toBe(businessBefore);
  await page.goBack();
  await expectLoggedOut(page);
  for (const route of ['reportes', 'venta', 'configuracion']) {
    await page.goto(`/#/${route}`);
    await expectLoggedOut(page);
  }
  await page.goto('/#/venta');
  await signIn(page);
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' })).toHaveValue(
    '1',
  );
  await expect(page.getByText('Turno abierto', { exact: true })).toBeVisible();
  await page.goto('/#/documentos');
  await expect(page.getByRole('button', { name: 'F-10001', exact: true })).toBeVisible();
});

test('el retorno de acceso rechaza destinos externos', async ({ page }) => {
  await page.goto('/#/login?returnUrl=%2F%2Fexample.test%2F');
  const origin = new URL(page.url()).origin;
  await signIn(page);
  await expect(page).toHaveURL(`${origin}/#/inicio`);
});

for (const theme of ['claro', 'oscuro']) {
  test(`el acceso de escritorio conserva el tema ${theme} y cumple accesibilidad sin desbordar`, async ({
    page,
  }) => {
    await page.goto('/#/login');
    if (theme === 'oscuro') {
      await signIn(page);
      await page.getByRole('button', { name: 'Usar tema oscuro', exact: true }).click();
      await signOut(page);
      await page.reload();
      await expect(page.locator('html')).toHaveClass(/p-dark/);
    }
    await expectLoggedOut(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const width of [320, 375]) {
  test(`el acceso móvil permite usar el formulario completo sin desbordamiento a ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 667 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/login');
    await expectLoggedOut(page);
    const form = page.locator('form');
    const bounds = await form.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Olvidé mi contraseña', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Ayuda de acceso', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Entendido', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath(`login-mobile-${width}.png`), fullPage: true });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    await signIn(page);
    await expect(page).toHaveURL(/#\/inicio$/);
  });
}

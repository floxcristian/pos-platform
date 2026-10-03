import { expect, test, type Page } from '@playwright/test';

async function addGloves(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Agregar Guante de trabajo reforzado', exact: true }).click();
}
async function choose(page: Page, name: string, option: string): Promise<void> {
  const select = page.getByRole('combobox', { name, exact: true });
  if ((await select.innerText()).trim() === option) return;
  await select.click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('venta en efectivo conserva vuelto, documento local, emisión fiscal y cola ERP', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await page.getByRole('button', { name: /^Cobrar / }).click();
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await payment.getByRole('spinbutton', { name: 'Monto del pago' }).fill('5000');
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await expect(payment.getByText('$10', { exact: true })).toBeVisible();
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  await expect(receipt).toBeVisible();
  await expect(receipt.getByText(/Entrega \$10 de vuelto/)).toBeVisible();
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await receipt.getByRole('button', { name: 'Nueva venta', exact: true }).click();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await page.getByRole('button', { name: number, exact: true }).click();
  const detail = page.locator('.p-drawer').last();
  await expect(detail.getByText('Guardada', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Reintentar emisión', exact: true }).click();
  await expect(detail.getByText('Emitido', { exact: true })).toBeVisible();
  await expect(detail.getByText('Registro en ERP', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: number, exact: true })).toBeVisible();
});

test('pausar y retomar conserva cliente, carro y datos de despacho tras recargar', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await choose(page, 'Cliente de la venta', 'Taller Horizonte Demo');
  await choose(page, 'Forma de entrega', 'Despacho');
  await page.getByLabel('Dirección de despacho', { exact: true }).fill('Dirección sintética de prueba 123');
  await page.getByLabel('Contacto para la entrega', { exact: true }).fill('Persona de demostración');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Ventas pausadas/ }).click();
  await page.getByRole('button', { name: 'Retomar venta', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' })).toHaveValue(
    '1',
  );
  await expect(page.getByLabel('Dirección de despacho', { exact: true })).toHaveValue(
    'Dirección sintética de prueba 123',
  );
  await expect(page.getByLabel('Contacto para la entrega', { exact: true })).toHaveValue(
    'Persona de demostración',
  );
});

test('un pago incierto se concilia sin ejecutar una segunda venta', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await choose(page, 'Medio de pago', 'Tarjeta de débito');
  await page.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await choose(page, 'Escenario de pago simulado', 'Respuesta desconocida · conciliar');
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await expect(receipt.getByText('Por conciliar', { exact: true })).toBeVisible();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await page.getByRole('button', { name: number, exact: true }).click();
  const detail = page.locator('.p-drawer').last();
  await expect(detail.getByRole('button', { name: 'Reintentar emisión', exact: true })).toBeDisabled();
  await detail.getByRole('button', { name: 'Conciliar pago', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Conciliar resultado del pago' })
    .getByRole('button', { name: 'Registrar resultado', exact: true })
    .click();
  await expect(detail.getByText('Por conciliar', { exact: true })).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Reintentar emisión', exact: true })).toBeEnabled();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await expect(page.getByRole('button', { name: number, exact: true })).toHaveCount(1);
});

test('NC por producto limita unidades y devuelve dinero una sola vez', async ({ page }) => {
  await page.goto('/#/devoluciones');
  await page.getByRole('button', { name: 'Nueva nota de crédito', exact: true }).click();
  await page.getByRole('combobox', { name: 'Documento original de la devolución' }).click();
  await page.getByRole('option').filter({ hasText: 'F-10004' }).click();
  await page.getByRole('button', { name: 'Seleccionar todo lo disponible', exact: true }).click();
  await page.getByRole('combobox', { name: 'Motivo de devolución' }).click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).click();
  const detail = page.locator('.p-drawer').last();
  await expect(detail.getByRole('heading', { name: /NC-DEMO-/ })).toBeVisible();
  await detail.getByRole('button', { name: 'Emitir documento fiscal', exact: true }).click();
  await expect(detail.getByText('Emitido', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Devolver dinero', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Devolver saldo de nota de crédito' })
    .getByRole('button', { name: 'Confirmar devolución', exact: true })
    .click();
  await expect(detail.getByText(/Liquidación registrada/)).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Devolver dinero', exact: true })).toBeDisabled();
});

test('cargar una OV protegida importa condiciones y no permite modificar su carro', async ({ page }) => {
  await page.goto('/#/venta');
  await page.getByRole('button', { name: 'Cargar orden de venta', exact: true }).click();
  const order = page.locator('.p-drawer section').filter({ hasText: 'OV-DEMO-1001' });
  await order.getByRole('button', { name: 'Cargar esta orden', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' })).toHaveValue(
    '12',
  );
  await expect(
    page.getByRole('spinbutton', { name: 'Cantidad de Guante de trabajo reforzado' }),
  ).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Cliente de la venta' })).toBeDisabled();
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await page.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  await expect(receipt.getByRole('heading', { name: /F-DEMO-/ })).toBeVisible();
  await receipt.getByRole('button', { name: 'Nueva venta', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar orden de venta', exact: true }).click();
  await expect(page.locator('.p-drawer section').filter({ hasText: 'OV-DEMO-1001' })).toHaveCount(0);
});

test('pagar una cuota reduce el documento original sin duplicar la deuda', async ({ page }) => {
  await page.goto('/#/cobranzas');
  await page.getByRole('button', { name: 'Plan de cuotas', exact: true }).click();
  const plan = page.getByRole('dialog', { name: 'Crear plan de cuotas' });
  await plan.getByRole('checkbox', { name: /F-DEMO-800/ }).check();
  await plan.getByRole('button', { name: 'Crear acuerdo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Plan de 3 cuotas', exact: true })).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: '1 / 3' })
    .getByRole('button', { name: 'Pagar cuota' })
    .click();
  const payment = page.getByRole('dialog', { name: 'Pagar cuota de acuerdo' });
  const amount = Number(
    (await payment.getByRole('spinbutton', { name: 'Monto del abono' }).inputValue()).replace(/\D/g, ''),
  );
  await payment.getByRole('button', { name: 'Confirmar abono', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Comprobante de abono' })
    .getByRole('button', { name: 'Listo', exact: true })
    .click();
  const balance = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(100000 - amount);
  await expect(
    page.getByRole('row').filter({ hasText: 'F-DEMO-800' }).first().getByText(balance, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: '1 / 3' }).getByRole('button', { name: 'Pagar cuota' }),
  ).toBeDisabled();
});

test('custodia y confirmación de depósito registran el retiro una sola vez', async ({ page }) => {
  await page.goto('/#/caja');
  await page.getByRole('button', { name: 'Ingreso o retiro', exact: true }).click();
  await choose(page, 'Tipo de movimiento', 'Entrega a custodia');
  const movement = page.getByRole('dialog', { name: 'Movimiento de efectivo' });
  await movement.getByRole('spinbutton', { name: 'Monto de movimiento' }).fill('1000');
  await movement.getByLabel('Motivo', { exact: true }).fill('Entrega de demostración');
  await movement.getByRole('button', { name: 'Registrar movimiento', exact: true }).click();
  const expected = page.locator('pos-metric-card').filter({ hasText: 'Efectivo esperado' });
  const afterWithdrawal = await expected.innerText();
  await page.getByRole('button', { name: 'Confirmar depósito', exact: true }).click();
  await choose(page, 'Banco receptor del depósito', 'Banco de demostración A');
  const deposit = page.getByRole('dialog', { name: 'Confirmar depósito de custodia' });
  await deposit.getByLabel('Referencia del depósito', { exact: true }).fill('MOCK-DEP-1001');
  await deposit.getByRole('button', { name: 'Registrar confirmación', exact: true }).click();
  await expect(expected).toHaveText(afterWithdrawal, { useInnerText: true });
  await expect(page.getByRole('button', { name: 'Confirmar depósito', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Cambio de cajero', exact: true }).click();
  const handover = page.getByRole('dialog', { name: 'Cambio de cajero' });
  await handover.getByRole('spinbutton', { name: 'Cantidad de $10', exact: true }).fill('13696');
  await handover.getByRole('button', { name: 'Entregar caja', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir caja', exact: true })).toBeVisible();
});

test('aplicar un anticipo consume su saldo sin ingresar efectivo dos veces', async ({ page }) => {
  await page.goto('/#/cobranzas');
  await page.getByRole('button', { name: 'Nuevo anticipo', exact: true }).click();
  const advance = page.getByRole('dialog', { name: 'Registrar anticipo' });
  await advance.getByRole('spinbutton', { name: 'Monto del abono' }).fill('5000');
  await advance.getByRole('button', { name: 'Confirmar abono', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Comprobante de abono' })
    .getByRole('button', { name: 'Listo', exact: true })
    .click();
  await page.goto('/#/caja');
  const cashAfterAdvance = await page
    .locator('pos-metric-card')
    .filter({ hasText: 'Efectivo esperado' })
    .innerText();
  await page.goto('/#/venta');
  await addGloves(page);
  await choose(page, 'Cliente de la venta', 'Taller Horizonte Demo');
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await choose(page, 'Medio de pago', 'Anticipo de cliente');
  await page.getByRole('combobox', { name: 'Anticipo como pago', exact: true }).click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Venta guardada' })).toBeVisible();
  await page.goto('/#/cobranzas');
  await expect(
    page
      .locator('pos-metric-card')
      .filter({ hasText: 'Anticipos disponibles' })
      .getByText('$10', { exact: true }),
  ).toBeVisible();
  await page.goto('/#/caja');
  await expect(page.locator('pos-metric-card').filter({ hasText: 'Efectivo esperado' })).toHaveText(
    cashAfterAdvance,
    { useInnerText: true },
  );
});

test('redondeo de efectivo y vuelto como anticipo conservan ajuste y saldo del cliente', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await choose(page, 'Cliente de la venta', 'Taller Horizonte Demo');
  await page.getByRole('spinbutton', { name: 'Descuento de Guante de trabajo reforzado' }).fill('7');
  await page.getByRole('button', { name: /^Cobrar / }).click();
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await payment.getByRole('spinbutton', { name: 'Monto del pago' }).fill('5000');
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await expect(payment.getByText('$360', { exact: true })).toBeVisible();
  await choose(page, 'Destino del vuelto', 'Guardar como anticipo del cliente');
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  await expect(receipt.getByText(/Vuelto de \$360 guardado como anticipo/)).toBeVisible();
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await page.getByRole('button', { name: number, exact: true }).click();
  const detail = page.locator('.p-drawer').last();
  await expect(detail.getByText('Ajuste de efectivo', { exact: true })).toBeVisible();
  await expect(detail.getByText('$4.640', { exact: true }).first()).toBeVisible();
  await page.goto('/#/cobranzas');
  await expect(
    page
      .locator('pos-metric-card')
      .filter({ hasText: 'Anticipos disponibles' })
      .getByText('$360', { exact: true }),
  ).toBeVisible();
});

test('cheque exige datos completos de emisor y portador y conserva la referencia Orsan', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await choose(page, 'Medio de pago', 'Cheque · Orsan');
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await payment.getByLabel('Referencia cheque / verificación Orsan', { exact: true }).fill('ORSAN-MOCK-123');
  await choose(page, 'Banco del cheque', 'Banco de demostración A');
  await choose(page, 'Plaza del cheque', 'Santiago');
  await payment.getByLabel('Cuenta', { exact: true }).fill('000123');
  await payment.getByLabel('Número de cheque', { exact: true }).fill('000456');
  await payment.getByLabel('Nombre del emisor', { exact: true }).fill('Emisor Demo');
  await payment.getByLabel('RUT del emisor', { exact: true }).fill('90000000-6');
  await payment.getByLabel('Nombre del portador', { exact: true }).fill('Portador Demo');
  await payment.getByLabel('RUT del portador', { exact: true }).fill('90000001-4');
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: 'Venta guardada' });
  const number = await receipt.getByRole('heading', { name: /B-DEMO-/ }).innerText();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await page.getByRole('button', { name: number, exact: true }).click();
  const detail = page.locator('.p-drawer').last();
  await expect(detail.getByText('ORSAN-MOCK-123', { exact: true })).toBeVisible();
  await expect(detail.getByText('Emisor: Emisor Demo · 90000000-6', { exact: true })).toBeVisible();
  await expect(detail.getByText('Portador: Portador Demo · 90000001-4', { exact: true })).toBeVisible();
});

test('crédito usa el plazo preasignado al cliente y crea un plan sobre la nueva deuda', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await choose(page, 'Cliente de la venta', 'Constructora Ladera Demo');
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await choose(page, 'Medio de pago', 'Crédito cliente');
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await expect(payment.getByRole('heading', { name: 'Condiciones de crédito del cliente' })).toBeVisible();
  await expect(payment.getByText('30 días', { exact: true })).toBeVisible();
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const number = await page
    .getByRole('dialog', { name: 'Venta guardada' })
    .getByRole('heading', { name: /B-DEMO-/ })
    .innerText();
  await page.goto('/#/cobranzas');
  await choose(page, 'Cliente para consultar deuda', 'Constructora Ladera Demo');
  await expect(page.getByRole('row').filter({ hasText: number })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plan de 2 cuotas', exact: true })).toBeVisible();
});

test('devolver una venta a crédito descuenta deuda y muestra cero dinero a devolver', async ({ page }) => {
  await page.goto('/#/venta');
  await addGloves(page);
  await choose(page, 'Cliente de la venta', 'Constructora Ladera Demo');
  await page.getByRole('button', { name: /^Cobrar / }).click();
  await choose(page, 'Medio de pago', 'Crédito cliente');
  const payment = page.getByRole('dialog', { name: 'Cobrar venta' });
  await payment.getByRole('button', { name: 'Agregar pago', exact: true }).click();
  await payment.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const number = await page
    .getByRole('dialog', { name: 'Venta guardada' })
    .getByRole('heading', { name: /B-DEMO-/ })
    .innerText();
  await page.goto(`/#/documentos?buscar=${encodeURIComponent(number)}`);
  await page.getByRole('button', { name: number, exact: true }).click();
  await page.locator('.p-drawer').getByRole('button', { name: 'Reintentar emisión', exact: true }).click();
  await expect(page.locator('.p-drawer').getByText('Emitido', { exact: true })).toBeVisible();
  await page.goto('/#/devoluciones');
  await page.getByRole('button', { name: 'Nueva nota de crédito', exact: true }).click();
  await page.getByRole('combobox', { name: 'Documento original de la devolución' }).click();
  await page.getByRole('option').filter({ hasText: number }).click();
  await page.getByRole('button', { name: 'Seleccionar todo lo disponible', exact: true }).click();
  await page.getByRole('combobox', { name: 'Motivo de devolución' }).click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).click();
  const detail = page.locator('.p-drawer').last();
  await detail.getByRole('button', { name: 'Emitir documento fiscal', exact: true }).click();
  await expect(detail.getByText('Emitido', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Devolver dinero', exact: true }).click();
  const refund = page.getByRole('dialog', { name: 'Devolver saldo de nota de crédito' });
  await expect(refund.locator('dl > div').filter({ hasText: 'Dinero a devolver' }).locator('dd')).toHaveText(
    '$0',
  );
  await expect(
    refund.locator('dl > div').filter({ hasText: 'Deuda a compensar' }).locator('dd'),
  ).not.toHaveText('$0');
  await refund.getByRole('button', { name: 'Confirmar devolución', exact: true }).click();
  await expect(detail.getByText(/descontados de la deuda del cliente/)).toBeVisible();
  await expect(detail.locator('dl > div').filter({ hasText: 'Dinero devuelto' }).locator('dd')).toHaveText(
    '$0',
  );
  await expect(detail.getByRole('button', { name: 'Devolver dinero', exact: true })).toBeDisabled();
});

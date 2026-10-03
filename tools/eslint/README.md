# Contratos visuales de PrimeNG

`pos-ui-contracts.cjs` conserva dos decisiones de `prime-showcase`: acciones secundarias con relleno gris y variante `text` reservada para botones sin etiqueta visible. Analiza templates Angular, incluidos los templates inline mediante el procesador ya configurado.

Cubre `p-button` y las directivas `pButton` sobre `button` o `a`, propiedades booleanas y `variant`, valores literales enlazados, etiquetas dinámicas y texto proyectado. No interpreta expresiones arbitrarias de `severity` o de variantes. No modifica automáticamente botones: una acción destructiva puede requerir una severity diferente.

Las pruebas forman parte de `npm test`. Para ejecutar solo este contrato:

```powershell
npx vitest run tools/eslint/pos-ui-contracts.spec.ts
```

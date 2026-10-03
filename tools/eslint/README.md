# Contratos visuales de PrimeNG

`pos-ui-contracts.cjs` conserva las recetas de botones y ayudas compartidas. Analiza templates Angular, incluidos los templates inline mediante el procesador ya configurado.

| Regla                                     | Contrato                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pos-ui/no-secondary-outlined-button`     | Las acciones secundarias usan relleno gris, sin variante outlined.                                  |
| `pos-ui/no-labeled-secondary-text-button` | La variante text secundaria se reserva para botones sin etiqueta visible.                           |
| `pos-ui/icon-button-tooltip`              | Los botones de solo icono declaran `posTooltip`; la etiqueta accesible continúa siendo obligatoria. |

Cubre `p-button` y las directivas `pButton` sobre `button` o `a`, propiedades booleanas y `variant`, valores literales enlazados, etiquetas dinámicas y texto proyectado. No interpreta expresiones arbitrarias de `severity` o de variantes. No modifica automáticamente botones: una acción destructiva puede requerir una severity diferente.

La regla de tooltips también cubre botones HTML nativos. Identifica el atributo `icon` o un elemento `i`/`svg` descendiente; un texto `sr-only` aporta accesibilidad pero no cuenta como etiqueta visible. Acepta `posTooltip` estático o enlazado y no exige tooltip a controles con texto visible. No analiza el DOM interno de PrimeNG: sus cierres, paginadores y controles de campos se cubren mediante `createTooltipPassThrough`, con slots PT tipados y el mismo servicio de overlay.

```html
<p-button posTooltip icon="pi pi-search" ariaLabel="Buscar" />
<button posTooltip aria-label="Cerrar"><i class="pi pi-times" aria-hidden="true"></i></button>
```

Importar `PosTooltipDirective` desde `@corporate-pos/ui` en el componente consumidor. El valor vacío reutiliza `ariaLabel`/`aria-label`, incluidas las etiquetas dinámicas; no duplicar el texto en un atributo nativo `title`. ESLint comprueba la presencia declarada de la directiva, no su comportamiento ejecutado ni el contenido final de la etiqueta. Hover, foco, Escape, clic y limpieza de overlays se comprueban en los recorridos de navegador.

Las pruebas forman parte de `npm test`. Para ejecutar solo este contrato:

```powershell
npx vitest run tools/eslint/pos-ui-contracts.spec.ts
```

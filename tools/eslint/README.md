# Reglas de código y contratos visuales

`eslint.config.cjs` centraliza las reglas del workspace. `npm run lint` prepara el grafo real de Nx y falla ante errores o advertencias; no depende de una caché creada por otro comando.

## Backend y librerías universales

`tsconfig.eslint.backend.json` aporta información de tipos para las cuatro apps Node, `libs/backend`, `libs/platform/backend`, `contracts`, `shared-kernel` y `country-policies`, incluidos sus tests y configuración TypeScript. Un solo programa de lint evita cargar un proyecto completo por cada módulo. Sus comprobaciones incluyen:

- Promesas sin gestionar, incluso precedidas de `void`, y callbacks async utilizados donde se espera `void`.
- `await` aplicado a valores que no son promesas; retorno de promesas sin `await` cuando cambia el comportamiento de `try`/`catch`/`finally`.
- Asignaciones, argumentos, llamadas, accesos y retornos inseguros provenientes de `any`; aserciones innecesarias y no nulas.
- Excepciones y rechazos que no son objetos `Error`, switches incompletos sobre uniones y métodos separados de su receptor.

La API fluida `FastifyReply` también es un thenable: `reply.header()` configura una cabecera y no debe esperarse con `await`, que esperaría a que termine la respuesta. Por eso `no-floating-promises` conserva la comprobación oficial de `Promise` sin extenderla a cualquier thenable. Las pruebas cubren esta diferencia.

No se admiten directivas `eslint-disable` en estos proyectos: las excepciones deben ser cambios precisos en la configuración central y revisarse junto con una prueba. `noInlineConfig` mantiene activa la regla y la advertencia por intento de supresión también hace fallar el comando. `@ts-ignore` y `@ts-nocheck` están prohibidos; `@ts-expect-error` requiere una explicación de al menos diez caracteres.

Los módulos reciben configuración validada por inyección. La lectura de `process.env` queda en configuración y entradas de proceso, con pruebas de entorno fuera del código de negocio. Los SDK de Sentry y la construcción de Pino pertenecen a `platform/backend`; los servicios pueden inyectar `PinoLogger` de `nestjs-pino`. Los límites Nx se siguen comprobando, incluidos imports dinámicos literales de paquetes.

## Reglas compartidas y frontend

Todo TypeScript conserva las comprobaciones sintácticas, sin `any` explícito, variables no utilizadas, `eval`, `Function` dinámico o `debugger`. La igualdad es estricta salvo la comprobación idiomática `value == null`. Los parámetros de callback que deben conservar su posición pueden usar prefijo `_`; las variables locales sin usar no quedan excluidas por ese prefijo.

`console` está prohibido; únicamente los bootstraps `apps/pos-desktop/src/main.ts` y `apps/pos-mobile/src/main.ts` permiten `console.error` para un fallo previo al arranque de Angular. El frontend mantiene reglas Angular, plantillas, accesibilidad y límites Nx, pero esta entrega no le aplica el programa de lint con tipos del backend. Sus directivas de supresión sin uso son errores.

`pos-code-quality.cjs` impide `.only` y `.skip` en archivos de test TS/MTS al identificar imports de Vitest, incluidos alias y namespace. No confunde campos ordinarios como `pagination.skip` con controles de ejecución de tests.

`backend-quality.spec.ts` comprueba estas reglas mediante el ESLint real y archivos incluidos en el programa TypeScript. `architecture-boundaries.spec.ts` verifica dependencias prohibidas y composiciones permitidas. Ninguna suite reemplaza el compilador ni las pruebas del comportamiento de la aplicación.

`libs/client-shell` tiene tags `type:shell` y `env:browser`: compone features, UI y acceso a datos para ambos clientes. Las apps no importan otras apps; las features no importan el shell y las bibliotecas de navegador no importan servidor. Los SDK nativos se mantienen en los hosts y adaptadores autorizados; compartir Angular no elimina esa frontera.

## Contratos visuales de PrimeNG

`pos-ui-contracts.cjs` conserva las recetas de botones y ayudas compartidas. Analiza templates Angular, incluidos los templates inline mediante el procesador ya configurado.

| Regla                                     | Contrato                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pos-ui/no-secondary-outlined-button`     | Las acciones secundarias usan relleno tonal, sin variante outlined.                                 |
| `pos-ui/no-labeled-secondary-text-button` | La variante text secundaria se reserva para botones sin etiqueta visible.                           |
| `pos-ui/icon-button-tooltip`              | Los botones de solo icono declaran `posTooltip`; la etiqueta accesible continúa siendo obligatoria. |

Cubre `p-button` y las directivas `pButton` sobre `button` o `a`, propiedades booleanas y `variant`, valores literales enlazados, etiquetas dinámicas y texto proyectado. No interpreta expresiones arbitrarias de `severity` o de variantes. No modifica automáticamente botones: una acción destructiva puede requerir una severity diferente.

La regla de tooltips también cubre botones HTML nativos. Identifica el atributo `icon` o un elemento `i`/`svg` descendiente; un texto `sr-only` aporta accesibilidad pero no cuenta como etiqueta visible. Acepta `posTooltip` estático o enlazado y no exige tooltip a controles con texto visible. No analiza el DOM interno de PrimeNG: sus cierres, paginadores y controles de campos se cubren mediante `createTooltipPassThrough`, con slots PT tipados y el mismo servicio de overlay.

```html
<p-button posTooltip icon="pos-icon pos-icon-magnifying-glass" ariaLabel="Buscar" />
<button posTooltip aria-label="Cerrar"><i class="pos-icon pos-icon-x" aria-hidden="true"></i></button>
```

Importar `PosTooltipDirective` desde `@pos-platform/ui` en el componente consumidor. El valor vacío reutiliza `ariaLabel`/`aria-label`, incluidas las etiquetas dinámicas; no duplicar el texto en un atributo nativo `title`. ESLint comprueba la presencia declarada de la directiva, no su comportamiento ejecutado ni el contenido final de la etiqueta. Hover, foco, Escape, clic y limpieza de overlays se comprueban en los recorridos de navegador.

Las pruebas forman parte de `npm test`. Para ejecutar solo este contrato:

```powershell
npx vitest run tools/eslint/pos-ui-contracts.spec.ts
```

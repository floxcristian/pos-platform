# Seguridad y dependencias

Revisión: 3 de octubre de 2026. Corporate POS es una maqueta funcional con datos sintéticos y adaptadores locales. No tiene credenciales corporativas, endpoints de pago o fiscalidad reales, ni permisos nativos para operar dispositivos.

## Qué se valida

Las reglas de permisos y módulos se aplican tanto a las rutas como a los comandos del store. Sin embargo, el selector de perfil es una herramienta de demostración: no autentica personas. El almacenamiento local puede ser modificado por quien controla el navegador o equipo. Estos mecanismos permiten comprobar el comportamiento del producto, pero no sustituyen identidad real, autorización en servidor, aislamiento entre clientes ni una auditoría inmutable.

Los comandos persisten su resultado antes de publicar el nuevo estado. Un error de persistencia se muestra en la interfaz y evita confirmar el cambio. Los pagos con resultado desconocido requieren conciliación explícita; no se reintentan automáticamente. Los estados de pago, documento fiscal y ERP son independientes.

Las exportaciones CSV neutralizan celdas que pueden interpretarse como fórmulas y escapan delimitadores, comillas y saltos de línea. Hay pruebas específicas de esta transformación. Los valores se muestran mediante bindings de Angular; no se necesita insertar HTML de documentos o proveedores.

## Auditoría de dependencias

Ejecutar desde la raíz, con las versiones fijadas en el lockfile:

```powershell
npm ci
npm audit --omit=dev
npm audit
npm run check
```

El primer audit mide el árbol de dependencias de producción declarado en npm. El segundo incluye compiladores, generadores, linters y otras herramientas de desarrollo. Un resultado sin alertas en producción no significa que todo el toolchain esté libre de vulnerabilidades, ni demuestra por sí solo la seguridad de la aplicación.

La primera instalación informó 44 paquetes afectados: 1 crítico, 35 altos, 6 moderados y 2 bajos. Ese diagnóstico motivó la actualización de Angular a 21.2.25, builder/CLI a 21.2.24, Nx a 23.2.1, PrimeNG a 21.1.10 y ESLint a 10.12.0 con sus integraciones compatibles. El JSON inicial se conserva fuera del repositorio porque es un artefacto de diagnóstico, no documentación del producto.

El audit del lockfile actualizado, ejecutado el 3 de octubre de 2026, devuelve:

| Comando                | Resultado                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `npm audit --omit=dev` | **0 vulnerabilidades** en el árbol declarado de producción.                                    |
| `npm audit`            | **24 paquetes afectados en desarrollo: 22 altos y 2 críticos**. Sin alertas moderadas o bajas. |

Los conteos incluyen paquetes que heredan el riesgo de una dependencia: los dos críticos son `piscina` y `@angular/build`, afectados por el mismo aviso de Piscina. No equivalen a dos fallas independientes de la aplicación. Las versiones y el resultado deben volver a verificarse cuando cambie el lockfile o la base de avisos.

Se mantienen versiones coherentes entre framework, compilador, CLI y componentes. No se usa `--force`, `--legacy-peer-deps`, `overrides` ni parches locales para sustituir dependencias transitivas que sus proyectos aún no han actualizado.

### Dependencias transitivas que requieren seguimiento

La revisión del lockfile actualizado confirma estas cadenas pendientes:

| Dependencia directa                                                                         | Dependencia transitiva observada                            | Seguimiento                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@angular/build` 21.2.24                                                                    | `piscina` 5.2.0                                             | GHSA-67c8-pqhq-4rmx afecta versiones 5.x anteriores a 5.3.2. Angular 22.2.1 incorpora la corrección, pero exige migrar de manera conjunta framework, builder, TypeScript y Node. No se mezcla ese builder con Angular 21. |
| Nx 23.2.1                                                                                   | `axios` 1.18.1, `brace-expansion` 5.0.9 y `smol-toml` 1.6.1 | El audit inicial y los manifiestos publicados señalan versiones afectadas. Requieren versiones corregidas incorporadas por Nx; actualizar solo Angular no elimina estas cadenas.                                          |
| `@angular/cli` 21.2.24 → `pacote` → `npm-registry-fetch` / `sigstore` → `make-fetch-happen` | `http-cache-semantics` 4.2.0                                | Al revisar el registro no había una versión corregida publicada de esta dependencia. El audit propaga el aviso a CLI y a herramientas que dependen de ella, incluido `angular-eslint`.                                    |

El árbol contiene además `brace-expansion` 5.0.12 para otros consumidores, pero Nx mantiene su propia copia 5.0.9. La presencia de una copia corregida no resuelve automáticamente la vulnerable. La cadena de `braces` del diagnóstico inicial ya no aparece en este audit.

El aviso de Piscina describe una vía de ejecución de código cuando otro defecto ya permite contaminar `Object.prototype` dentro del mismo proceso Node. Opciones heredadas del pool pueden entonces alterar el entorno o los argumentos de un worker. Es un riesgo del proceso de compilación: Piscina no se distribuye como parte del JavaScript estático de la caja. Esto no demuestra que el build concreto sea explotable, ni permite tratar la dependencia como corregida. La severidad del audit es crítica. Ver el [aviso del proyecto](https://github.com/piscinajs/piscina/security/advisories/GHSA-67c8-pqhq-4rmx) y la [versión corregida 5.3.2](https://github.com/piscinajs/piscina/releases/tag/v5.3.2).

Los otros avisos pueden consultarse en sus registros: [brace-expansion](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [smol-toml](https://github.com/advisories/GHSA-7w5x-hrqm-74c2) y [http-cache-semantics](https://github.com/advisories/GHSA-ch52-4w7c-c8xp). Las rutas completas y los avisos de Axios se obtienen con `npm audit`; pueden cambiar cuando se actualiza una dependencia directa.

Las sugerencias automáticas del audit incluyen bajar `@angular/cli` a 7.2.4 y `@angular/build` a 19.2.27. No son una migración compatible con este proyecto Angular 21. No deben aplicarse sin evaluar el conjunto de versiones.

Mientras existan alertas en el toolchain, los builds deben ejecutarse en entornos aislados, con entradas de confianza y sin credenciales de producción. Una compilación de una contribución no confiable no debe recibir secretos. Esta medida reduce exposición; no corrige las bibliotecas. Antes de una distribución productiva hay que incorporar la corrección upstream o hacer una migración compatible, repetir el audit y ejecutar las pruebas y recorridos de UI.

## Host de escritorio

Tauri declara una capability local sin permisos y no registra comandos de negocio, acceso a archivos, shell, red externa o dispositivos. La CSP de producción limita scripts a los assets locales; la política de desarrollo permite además el servidor local. No hay claves de firma ni un updater conectado. La configuración y las limitaciones del entorno de compilación están en [desktop.md](desktop.md).

El paso a producción requiere identidad real, persistencia transaccional de Edge, contratos autenticados para sincronización e integraciones, una política de retención de datos y logs, firma de artefactos y pruebas con dispositivos y equipos reales. Es trabajo pendiente del producto; esta maqueta permite revisar sus flujos y estados antes de implementarlo.

# Revisión de calidad y fidelidad visual

Revisión del 3 de octubre de 2026. Alcance: maqueta Corporate POS, sistema visual de prime-showcase, integridad de operaciones simuladas, persistencia, sincronización, límites Nx y validaciones de entrega.

## Conclusión

La primera entrega tenía una base modular razonable, pero no justificaba afirmar que todo estaba resuelto con calidad de producción. La revisión reprodujo diferencias visuales y defectos funcionales; se corrigieron con contratos compartidos y regresiones. La maqueta sigue utilizando identidad simulada y almacenamiento web. Es una base para validar el producto; no es una caja autorizada para operar pagos o emitir documentos fiscales reales.

## Fidelidad a prime-showcase

Los iconos decorativos de tarjetas usan un componente compartido con SVG duotono de Phosphor 2.1.1 (MIT): capas internas con opacidades 1 y 0,4, heredando el color del tema. Las métricas, sucursales y dispositivos usan 32 px; las tarjetas de estado e integraciones, 28 px; los estados vacíos, 40 px; las confirmaciones, 48 px. Los importes conservan el ancho completo de su tarjeta. Los controles compactos propios usan máscaras SVG Phosphor Bold; los grandes combinan su geometría Bold con la capa secundaria Duotone, según [el catálogo de iconografía](iconography.md). Solo se incluyen los dibujos utilizados, sin cargar otra fuente ni recursos remotos; la licencia acompaña al bundle web y Tauri en `third-party-licenses.txt`.

Se compararon el preset, `DESIGN.md`, las recetas PrimeNG, los estilos ejecutados y el formulario renderizado del Storybook original. Los presets de origen y de la primera entrega eran equivalentes: la divergencia venía de reglas CSS y variantes elegidas en los templates. El repositorio de referencia se mantuvo sin modificaciones.

En la ampliación de esta revisión, la referencia pública accesible fue la pantalla de inicio de sesión. No se compararon los módulos autenticados de esa publicación. La comparación interna de tablas, formularios, cabeceras y estados vacíos se basa en el código y las recetas del repositorio local de prime-showcase; esa versión puede diferir de la publicada. Los ajustes previamente medidos contra la referencia pública —foco y encabezado SVG— se conservan.

El encabezado usa el archivo exacto `images/tornado.svg` de [prime-showcase publicado](https://prime-showcase-mu.vercel.app/), comprobado el 3 de octubre de 2026. Esa versión conserva los tonos `#005DB9`, `#0089D6` y `#0073c8`; la revisión posterior del repositorio local tenía otra paleta. Se mantienen sus opacidades internas y el encuadre `cover` / `center`, como recurso local de la web y del paquete Tauri. Los botones del header usan los estados de la misma referencia: iconos blancos, hover oscuro al 40% en escritorio y 25% en móvil; el botón de tema y el perfil conservan sus variantes. Estos tokens se limitan al encabezado para no alterar los controles de las demás pantallas.

| Hallazgo                                | Corrección y criterio                                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header primary700 en vez de primary500  | Azul de marca `#006db6`, altura 64 px. Textos y avatar conservan contraste en claro y oscuro.                                                                   |
| Raíz 14 px en vez de 16 px              | Inter local a 16 px; navegación y formularios recuperan la escala de la referencia. Metadatos siguen teniendo tamaños subordinados.                             |
| Outline separado en inputs              | Halo único de 3,2 px, sin separador blanco, medido en la versión publicada: #b2ddf9 sobre borde #0074c2. En oscuro, #27a0f1 al 55 %.                            |
| Controles forzados a 44 px              | Inputs y selects conservan medidas Aura, aproximadamente 42 px a escala 16. Segmentos con mínimo 40 px; objetivos específicos suben a 44 px con puntero táctil. |
| Secundarios outlined/text               | Secundarios rellenos tonales en vistas y diálogos mediante tokens comunes del preset. Dos reglas ESLint evitan reintroducir las variantes incompatibles.        |
| SelectButton sin pista de la referencia | Tokens grises 200/700 y thumb nativo. Contenedores con desplazamiento horizontal para etiquetas largas, sin desbordar la página.                                |
| Calendarios nativos inconsistentes      | Un ControlValueAccessor usa PrimeNG DatePicker y adapta fechas civiles y horas sin convertirlas a UTC. Textos y navegación del calendario en español.           |
| Paneles con radios arbitrarios          | Paneles de datos de 16 px y formularios de 24 px; títulos y etiquetas con jerarquía común.                                                                      |

La iconografía propia utiliza Phosphor con licencia MIT. No se copian FontAwesome Pro, módulos ajenos, configuradores de marca, modificaciones a `node_modules` ni el paquete de parches del origen. Los estados se resuelven con tokens soportados de PrimeNG y recetas compartidas, no con excepciones por pantalla. La igualdad visual se comprueba en controles renderizados y accesibilidad; no implica que el POS reproduzca los módulos de otro producto.

## Grosor de iconos

La referencia local usa Font Awesome Sharp; PrimeIcons daba a los controles del POS un trazo más fino. Se reemplazó por 59 dibujos Phosphor Bold oficiales para navegación, encabezado y acciones. Los 31 iconos grandes combinan el contorno Bold con su capa secundaria Duotone. El catálogo y sus generadores están documentados en [Iconografía](iconography.md); CI comprueba que los recursos coincidan con la versión fijada. Los iconos internos de PrimeNG mantienen sus SVG nativos.

Se revisaron los catálogos completos y las pantallas en claro, oscuro, móvil y alto contraste. Se corrigió el relleno de las máscaras en alto contraste y el estado «Sin ofertas», que ahora usa el componente duotono compartido. Capturas: [claro](screenshots/icons-bold-light.png), [oscuro](screenshots/icons-bold-dark.png) y [catálogo](screenshots/icons-catalogue.png).

Validación local: build de producción, lint, formato, generación reproducible y 153 pruebas de lógica/contratos aprobados. La suite de 46 E2E dio 45 aprobados y una aserción global de tooltip incorrecta: el detalle retiraba su ayuda, pero el cierre del diálogo recibía foco y mostraba una nueva. El trace confirmó la limpieza del ID original y de `aria-describedby`. Se corrigió la aserción para comprobar esa asociación concreta; los seis E2E de tooltips pasaron después. La regresión nueva de iconos comprueba carga de máscaras bajo CSP y colores del control en alto contraste claro y oscuro. No se ejecutó el instalador Tauri localmente.

## Perfil del encabezado

El avatar del encabezado usa una superficie tonal `primary-100`, iniciales `primary-700` y esquinas de 8 px. Se redujo de 36 a 32 px para darle aire dentro del botón de 44 px; avatar, texto y flecha se separan 12 px, con padding exterior de 8/12 px y 2 px entre las líneas. Se conservan tooltip y foco, y el disparador comunica la apertura del diálogo mediante ARIA. Capturas de [Cajero](screenshots/profile-cajero.png) y [Administrador](screenshots/profile-administrador.png).

En móvil el botón ocupa 44 × 44 px. La comprobación detectó que el display sin capa de `.pos-icon` anulaba `hidden`: la flecha seguía visible y el perfil medía 72 px. Los estilos base de la máscara pasan a `components`, después de predeclarar el mismo orden de capas estáticas de Tailwind. Las utilidades responsivas recuperan su prioridad; el preset PrimeNG y las reglas de alto contraste conservan la suya. El recorrido móvil comprueba que la flecha desaparece y el botón mantiene el ancho previsto.

Validación del ajuste: build, lint, formato, generación de iconos y 153 pruebas de lógica aprobados. Pasaron nueve recorridos de perfil, teclado, accesibilidad y tooltips; después de corregir la prioridad de los iconos, los 12 E2E de contrato visual, interacción y tooltips también aprobaron. La inspección del perfil confirmó padding, gaps, radio, apertura del diálogo y ancho móvil en el artefacto de producción local.

## Ampliación visual y tooltips

Esta ampliación corrige los siguientes hallazgos. Su verificación se registra por separado de los resultados históricos de la sección Verificación.

| Hallazgo                                                                                        | Cambio implementado                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los botones compactos solo tenían nombre accesible, sin una ayuda visible uniforme              | Directiva `posTooltip` y un único TooltipService compartido entre templates y controles internos de PrimeNG. La regla `pos-ui/icon-button-tooltip` evita omitirla en botones de solo icono.          |
| Los inputs llamados `title` podían producir tooltips nativos sobre cabeceras y métricas         | PageHeaderComponent, MetricCardComponent y EmptyStateComponent usan `heading`. Las ayudas de acciones usan el overlay compartido.                                                                    |
| Cabecera de 30 px en negrita frente a la receta local de 24 px y peso medio                     | PageHeaderComponent adopta la escala de 24 px, peso 500 y acento vertical; conserva metadatos y subtítulo.                                                                                           |
| Maestros y Sucursales sumaban 48 px bajo la cabecera, mientras Documentos e Inicio tenían 24 px | `pos-section` aporta el único gap en las páginas que lo usan; el margen del PageHeader se conserva para los otros contextos.                                                                         |
| Datos principales de Documentos a 14 px frente a los 16 px de Maestros                          | `pos-table` fija el cuerpo principal a 16 px, manteniendo los tamaños explícitos de metadatos y los paddings ya revisados.                                                                           |
| Resultados vacíos con presentaciones distintas                                                  | EmptyStateComponent reúne icono duotono de 40 px, título compacto, descripción y slot de acciones. Documentos, Actividad, Maestros y Reportes usan la misma receta sin añadir contenedores anidados. |
| Nueva/Editar sucursal comunicaba errores solo mediante un toast temporal                        | Campos obligatorios con estado inválido y error persistente asociado por `aria-describedby`, conservando la validación del comando.                                                                  |

El motor de tooltips usa CDK Overlay para posición, ajuste al viewport y montaje por encima de diálogos; la presentación comparte los colores, espaciado y flecha de la receta visual. La directiva toma el texto de la etiqueta accesible cuando no recibe un valor explícito. `createTooltipPassThrough` extiende los controles internos con los tipos públicos de `GlobalPassThrough` y de cada componente: cierres de Dialog/Drawer/Toast, paginadores, calendario, InputNumber, Select y MultiSelect. ConfirmDialog reutiliza el cierre de Dialog. Toast recibe también PT local para asociar cada ayuda a su notificación y limpiarla al expirar.

PrimeNG PT añade atributos, listeners y hooks a sus slots; **no crea directivas Angular en tiempo de ejecución**. Por eso no se agrega un atributo `pTooltip` o `posTooltip` esperando que Angular lo instancie en el DOM interno. Los listeners PT llaman al mismo TooltipService que la directiva de los templates, sin escanear todo el documento ni modificar `node_modules`.

El contrato de interacción mantiene una sola ayuda visible: hover y foco de teclado la abren; el puntero puede cruzar hasta el texto sin cerrarla; no tiene caducidad mientras se está leyendo. Escape cierra la ayuda primero y conserva el foco. Clic, navegación, scroll y destrucción o cierre del control limpian la ayuda, sus listeners y su ID de `aria-describedby`, respetando otras descripciones existentes. Los controles deshabilitados no presentan ayuda de disponibilidad. Este comportamiento debe comprobarse tanto en controles propios como en overlays de PrimeNG.

`e2e/tooltips.spec.ts` incorpora seis recorridos para claro/oscuro, teclado, acciones dinámicas, cierres de overlays, campos, controles bloqueados, expiración de avisos y viewport de 375 px; también comprueba la escala de la cabecera, la separación de 24 px y los estados vacíos. El refoco del calendario tras pulsar una flecha no vuelve a abrir una ayuda descartada; hace falta una nueva interacción del puntero o del teclado. Los cierres de paneles tampoco reabren ayudas durante su animación de salida.

La revisión de capturas detectó además que el número de cajas sobrepasaba su columna del formulario de sucursal. Se usa la propiedad oficial `fluid` de InputNumber. Los campos se alinean arriba cuando una columna muestra un error más alto que la otra; se comprueban los bordes derecho y superior de los controles.

Evidencia visual: [tooltip claro](screenshots/tooltip-light.png), [tooltip oscuro](screenshots/tooltip-dark.png), [estado vacío](screenshots/masters-empty.png) y [validación de sucursal](screenshots/branch-validation.png).

Verificación final de esta ampliación: build de producción, lint y formato aprobados; **153 pruebas de lógica y contratos y los 45 E2E de la suite completa aprobados**. Los seis recorridos nuevos también pasaron dos repeticiones consecutivas. El helper espera a que termine el desplazamiento al control antes de hacer hover: el scroll cierra los tooltips por contrato. Se revisaron las capturas en claro y oscuro y los estados de formulario y búsqueda vacía. Los ajustes previos de foco, hover, header, tablas y gráficos conservan sus regresiones aprobadas.

## Defectos reproducidos y corregidos

La revisión de hover encontró que los cierres de diálogo/drawer consumían `button.text.secondary`, mientras el preset solo personalizaba `button.root.secondary`. El fondo claro cambiaba de blanco a `#f9fafb` (relación entre superficies 1,05:1), y los selectores segmentados conservaban exactamente el mismo fondo al pasar el cursor.

El preset ahora define hover y pulsado para variantes text/outlined, con colores de texto calculados contra el fondo más intenso. La receta se extiende a paginación, calendario y cierre de avisos. Las acciones HTML de búsqueda, navegación, productos y enlaces comparten esos tokens; la selección y los controles deshabilitados conservan sus estados. Los botones del header mantienen sus tokens específicos de la referencia publicada.

`e2e/interaction-states.spec.ts` comprueba los estados renderizados en claro y oscuro: cambio perceptible de superficie, contraste mínimo de texto de 4,5:1 en hover/pulsado, ausencia de desplazamientos, cierre por teclado y controles bloqueados sin feedback de disponibilidad. El umbral de diferencia entre superficies es una regla visual del producto, no un criterio WCAG entre estados.

Verificación de esta corrección: build, lint, 144 pruebas de lógica y 14 E2E de interacción, contrato visual, navegación y accesibilidad aprobados. Capturas del cierre en [tema claro](screenshots/button-hover-light.png) y [tema oscuro](screenshots/button-hover-dark.png).

| Área                               | Defecto observado                                                                     | Comportamiento corregido                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Venta en preparación               | Se perdía al navegar                                                                  | Borrador persistente con cliente, líneas y entrega; se limpia de forma atómica al confirmar o pausar. No persiste datos de un pago en curso.                                  |
| Devoluciones a crédito             | Era posible entregar efectivo conservando la deuda                                    | Se compensa deuda y cuotas primero; solo se devuelve financiación efectiva. La vista previa y el comando comparten cálculo de dominio y muestran deuda y dinero por separado. |
| Uso de NC                          | Una NC de crédito impago podía financiar una segunda venta y convertirse en reembolso | El saldo utilizable reserva deuda del origen; su compensación y el consumo en la venta destino son atómicos.                                                                  |
| Horario de Santiago                | Un horario diario podía repetirse en el cambio de hora                                | La programación diaria identifica la primera ocurrencia de cada día civil y evita ejecutarlo dos veces.                                                                       |
| Fallo de persistencia durante sync | La ejecución quedaba bloqueada en curso hasta recargar                                | El motor conserva una recuperación pendiente y la persiste al siguiente intento/tick, sin publicar un estado que no se guardó.                                                |
| Reset fallido                      | Invalidaba operaciones aunque no se hubiera guardado el reset                         | El cambio de generación solo ocurre después de persistir.                                                                                                                     |
| Configuración                      | Guardar una pestaña podía revertir campos editados en otra parte                      | Cada pestaña envía únicamente sus propios campos.                                                                                                                             |
| Tema Sistema                       | No reaccionaba al cambio del sistema operativo                                        | Servicio único reactivo para shell y gráficos, con limpieza del listener.                                                                                                     |
| Impresión                          | El error quedaba oculto detrás del recibo                                             | Mensaje visible dentro del diálogo; la venta guardada se conserva.                                                                                                            |
| Fechas comerciales                 | Defaults y vigencias podían usar el día UTC                                           | Defaults civiles en Chile; vigencias comparadas por instante, con conversión adecuada al editar.                                                                              |
| Límites Nx                         | Domain podía importar Angular                                                         | Restricción de paquetes externos además de los límites entre librerías.                                                                                                       |

## Verificación

Resultado histórico local y de [CI](https://github.com/floxcristian/corporate-pos/actions/runs/37151843645) para `0d09abc`, anterior a la ampliación visual y de tooltips: **144 pruebas de lógica e infraestructura y 37 E2E sobre producción aprobadas**, además de lint, formato y build. El smoke con CSP no registró violaciones ni errores de JavaScript. La misma ejecución generó el instalador NSIS de Windows; no se ha instalado ni ejercitado dentro de WebView2 local.

Las regresiones cubren invariantes monetarias, deuda y cuotas, persistencia fallida, recuperación, calendario y zona horaria, borradores, cambios de configuración, controles PrimeNG y accesibilidad. Se validan recorridos reales de navegador en claro/oscuro y anchos de 375 y 1440 px. ESLint verifica arquitectura, accesibilidad de templates y variantes del sistema visual; TypeScript y Angular compilan en modo estricto.

CI sirve el bundle de producción para los recorridos y conserva el inventario completo de dependencias, además del gate de dependencias runtime. La compilación de Tauri en Windows valida el empaquetado; no sustituye ejecutar el instalador y los flujos en WebView2 con periféricos reales. Ver [escritorio](desktop.md) y [seguridad](security.md).

El build desactiva únicamente `optimization.styles.inlineCritical`: Angular generaba un handler `onload` inline que `script-src self` bloqueaba en el host de escritorio. Se usa la configuración oficial, sin reescribir el HTML ni debilitar la CSP. Los overlays de PrimeNG se montan en `body` mediante la opción global soportada para evitar que el scroll de un diálogo recorte/cierre opciones.

## Condiciones pendientes para producción

- Identidad verificable, autorización de servidor y separación efectiva entre empresas/sucursales.
- Base local transaccional, coordinación entre procesos, migraciones, respaldo y recuperación. El snapshot web no garantiza concurrencia entre pestañas.
- Sincronización durable fuera de la ventana, contratos autenticados y deduplicación en receptores reales.
- Integraciones de pago, fiscalidad, ERP, Orsan e impresión verificadas con proveedores y hardware. Los estados actuales son simulados.
- Resolver avisos del toolchain, auditar dependencias Rust, firmar y probar instaladores/actualizaciones, establecer canales y recuperación de versiones.
- Pruebas de carga, fallos operacionales, monitoreo y retención de auditoría de producción.

Estas condiciones están fuera de lo que demuestra una maqueta con datos sintéticos. El estado de una ejecución de pruebas no equivale a una certificación «enterprise-grade».

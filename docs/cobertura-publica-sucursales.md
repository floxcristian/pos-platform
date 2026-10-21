# Cobertura publicada de tiendas de Implementos

**Consulta: 1 de octubre de 2026.** Los directorios públicos revisados contienen **31 entradas de tiendas en Chile, 12 en Perú y 3 en España: 46 en total**. Es un conteo del listado comercial publicado, no un inventario de sucursales con POS instalado, cajas, servidores o carga transaccional.

## Resultado y fuentes principales

| País | Entradas encontradas | Tras deduplicar | Fuente oficial y comprobación |
| --- | ---: | ---: | --- |
| Chile | 31 | **31** | [Directorio de Chile](https://www.implementos.cl/sitio/tiendas): encabezado con 31; [datos públicos de tiendas consumidos por la web](https://b2b-api.implementos.cl/ecommerce/api/v1/logistic/stores): 31 registros, con 31 códigos y 31 pares nombre/dirección distintos. |
| Perú | 12 | **12** | [Directorio de Perú](https://www.implementos.com.pe/sitio/tiendas): 12 fichas visibles y 12 entidades `AutoPartsStore` en el JSON-LD del mismo HTML. |
| España | 3 | **3** | [Directorio de España](https://www.implementos.eu/sitio/tiendas): encabezado con 3, tres fichas visibles y tres entidades `AutoPartsStore` en el JSON-LD del mismo HTML. |
| **Total de los tres directorios** | **46** | **46** | Suma del inventario publicado por país, sin extrapolación a despliegues técnicos. |

Para una presentación: **«46 tiendas en los directorios públicos consultados el 01-10-2026: Chile 31, Perú 12 y España 3. Cobertura operativa del POS por confirmar.»**

La fecha indica cuándo se observó la publicación. Las páginas no entregan una fecha de vigencia de cada local ni acreditan que el inventario web sea exhaustivo respecto de todas las instalaciones de la empresa.

## Inventario de Chile

Fuente: [directorio oficial](https://www.implementos.cl/sitio/tiendas), contrastado con sus [datos públicos de tiendas](https://b2b-api.implementos.cl/ecommerce/api/v1/logistic/stores). Se conserva la denominación del registro, normalizando mayúsculas y tildes para lectura; los códigos se mantienen literalmente. La columna localidad corresponde al campo `city` publicado, no a una clasificación geográfica validada independientemente.

| # | Tienda publicada | Localidad publicada | Código público |
| ---: | --- | --- | --- |
| 1 | Arica | Arica | `ARICA` |
| 2 | Iquique | Iquique | `IQUIQUE` |
| 3 | Alto Hospicio | Alto Hospicio | `ALT HOSPIC` |
| 4 | Antofagasta | Antofagasta | `ANTOFGASTA` |
| 5 | Calama | Calama | `CALAMA` |
| 6 | Copiapó | Copiapó | `COPIAPO` |
| 7 | Coquimbo | Coquimbo | `COQUIMBO` |
| 8 | Melipilla | Melipilla | `MELIPILLA` |
| 9 | Placilla | Placilla | `PLACILLA` |
| 10 | Concón | Con Con | `CON CON` |
| 11 | Colina | Colina | `COLINA` |
| 12 | Lampa | Lampa | `LAMPA` |
| 13 | Estación Central | Estación Central | `EST CNTRAL` |
| 14 | Santiago Centro | Estación Central | `STGOCENTRO` |
| 15 | San Bernardo | San Bernardo | `SAN BRNRDO` |
| 16 | Rancagua 2 | Rancagua | `RANCAGUA 2` |
| 17 | San Fernando | San Fernando | `SAN FERNAN` |
| 18 | Curicó | Curicó | `CURICO` |
| 19 | Talca | Talca | `TALCA` |
| 20 | Linares | Linares | `LINARES` |
| 21 | Chillán | Chillán | `CHILLAN` |
| 22 | Concepción | Concepción | `CONCEPCION` |
| 23 | Talcahuano | Talcahuano | `TALCAHUANO` |
| 24 | Coronel | Coronel | `CORONEL` |
| 25 | Los Ángeles | Los Ángeles | `LS ANGELES` |
| 26 | Temuco | Temuco | `TEMUCO` |
| 27 | Valdivia | Valdivia | `VALDIVIA` |
| 28 | Osorno | Osorno | `OSORNO` |
| 29 | Puerto Montt | Puerto Montt | `P MONTT2` |
| 30 | Castro | Castro | `CASTRO` |
| 31 | Punta Arenas | Punta Arenas | `PTA ARENAS` |

Estación Central y Santiago Centro tienen códigos, nombres y direcciones diferentes: se conservan como dos entradas aunque compartan `city`. El nombre comercial Coronel tampoco debe reinterpretarse como una dirección dentro de la comuna de Coronel: el domicilio publicado menciona San Pedro de la Paz. Análogamente, Temuco tiene domicilio publicado en Padre Las Casas. No se deduplicó por ciudad ni se geocodificaron los locales.

El campo `order` del servicio tiene saltos y un valor repetido. El máximo de ese campo no es la cantidad de tiendas; la numeración anterior es la del inventario deduplicado.

## Inventario de Perú

Fuente: [directorio oficial de Perú](https://www.implementos.com.pe/sitio/tiendas). El listado agrupa **3 fichas en Norte, 6 en Centro y 3 en Sur**. El JSON-LD de la misma página confirma 12 identificadores distintos. Se conserva la localidad declarada en `addressLocality`; las agrupaciones Norte/Centro/Sur son las utilizadas por el sitio.

| # | Tienda publicada | Localidad declarada | Grupo del directorio |
| ---: | --- | --- | --- |
| 1 | Chiclayo | Chiclayo | Norte |
| 2 | Piura | Piura | Norte |
| 3 | Trujillo | Trujillo | Norte |
| 4 | Callao | Callao | Centro |
| 5 | Comas | Lima | Centro |
| 6 | Lurin | Lurin | Centro |
| 7 | Santa Anita | Lima | Centro |
| 8 | Santa Clara | Lima | Centro |
| 9 | Ventanilla | Sin `addressLocality`; la dirección publicada indica Ventanilla, Callao | Centro |
| 10 | Arequipa | Arequipa | Sur |
| 11 | Arequipa II | Arequipa | Sur |
| 12 | Cusco | Cusco | Sur |

Arequipa y Arequipa II tienen identificadores y direcciones distintos. Se mantienen ambas; agrupar por ciudad habría producido un subconteo. El nombre «Lurin» se conserva como está rotulado en el directorio.

## Inventario de España

Fuente: [directorio oficial de España](https://www.implementos.eu/sitio/tiendas). El sitio presenta **2 fichas en Centro y 1 en Este**. Sus localidades estructuradas usan Toledo, Guadalajara y Valencia; esas etiquetas no deben convertirse automáticamente en municipios. Los nombres y las direcciones visibles permiten identificar Seseña y Azuqueca de Henares.

| # | Tienda publicada | Localidad o área declarada por el sitio | Grupo | Identificador público |
| ---: | --- | --- | --- | --- |
| 1 | Seseña | Seseña en la dirección; Toledo en `addressLocality` | Centro | `store-00002` |
| 2 | Azuqueca | Azuqueca de Henares en la dirección; Guadalajara en `addressLocality` | Centro | `store-00004` |
| 3 | Valencia | Valencia en `addressLocality`; código postal 46394 en la dirección | Este | `store-00005` |

No se añade Fuenlabrada a este conteo: aparece en el relato de apertura de la empresa, pero no en el directorio consultado. Su ausencia tampoco demuestra por sí sola un cierre, un cambio de nombre o una migración de actividad.

## Discrepancias entre páginas

| Observación | Tratamiento |
| --- | --- |
| Una extracción indexada de la ruta chilena `/tiendas/`, rastreada aproximadamente dos meses antes, devolvió un encabezado con 30. | La descarga directa del 01-10-2026 de [esa misma ruta](https://www.implementos.cl/tiendas/) y de `/sitio/tiendas` muestra 31; los datos del listado devuelven 31. Se utiliza la comprobación directa fechada, sin inferir cuándo cambió. |
| Los textos de [Acerca de nosotros de Perú](https://www.implementos.com.pe/sitio/acerca-de-nosotros) y [España](https://www.implementos.eu/sitio/acerca-de-nosotros) mencionan 13 tiendas en Perú y una próxima expansión a cuatro en España; también conservan 30 para la red chilena. | Se registra el conflicto editorial. Los directorios actuales enumeran 12, 3 y 31, respectivamente. No se deducen aperturas, cierres ni errores específicos sin confirmación del equipo. |
| El relato corporativo de España menciona Fuenlabrada, Seseña y Azuqueca como parte de su llegada al país, mientras el directorio enumera Seseña, Azuqueca y Valencia. | Se distingue una narración histórica de un listado público actual. Para el inventario se usan las fichas actuales; operaciones debe confirmar la historia y cobertura real. |

## Método reproducible y límites

1. Buscar y abrir las secciones de tiendas en los tres dominios oficiales. No usar resultados de terceros como inventario.
2. Contrastar el contenido indexado con descargas HTTP directas del HTML público de las URLs anteriores, realizadas el 01-10-2026. No iniciar sesión ni conceder ubicación.
3. Para Perú y España, contar fichas de la página y analizar el bloque `script#jsonld-localbusiness`, cuyo `@graph` contiene las entidades `AutoPartsStore`. Contar identificadores `@id` únicos y comprobar pares de nombre/dirección tras normalizar mayúsculas y espacios. Resultado: 12/12 y 3/3, sin colisiones.
4. Para Chile, el HTML inicial expone el encabezado, pero no las fichas completas. El [JavaScript público referenciado por la página](https://www.implementos.cl/main.99fc4530c383559d.js) identifica la lectura del recurso de tiendas. Se consultó únicamente [ese listado comercial público](https://b2b-api.implementos.cl/ecommerce/api/v1/logistic/stores) mediante GET anónimo: respuesta HTTP 200, sin cabecera Authorization, cookies ni credenciales. No se consultaron APIs privadas de operación. Contar registros, códigos `code` y pares nombre/dirección normalizados: 31 en los tres casos.
5. No contar duplicados del menú o pie de página, la tienda seleccionada en la cabecera, enlaces a otras empresas del holding, venta telefónica ni canal digital como tiendas adicionales.
6. Mantener registros distintos con el mismo nombre de ciudad cuando sus identificadores y domicilios difieren. No usar códigos, sufijos como «2» o el máximo del campo de orden para inferir locales adicionales.

El navegador de automatización no estuvo disponible en esta comprobación; la verificación se hizo mediante lectura web, HTML y datos estructurados públicos. El conteo no depende de activar geolocalización, de una sesión comercial ni de consultas a sistemas internos. Este documento conserva el inventario observado; no es un monitor automático de aperturas o cierres.

### Qué clasificación permiten las fuentes

- Chile denomina los registros como tiendas; Perú y España publican fichas de tiendas y las tipifican como `AutoPartsStore`.
- Las páginas revisadas no proporcionan un inventario separado y exhaustivo de centros de distribución, showrooms, bodegas, oficinas o sedes administrativas. Tampoco permiten asegurar que una tienda no comparta recinto con alguno de ellos.
- No se agregó una instalación por aparecer como dirección de contacto, ni se contó el comercio electrónico como otra tienda.
- La cobertura del sitio comercial puede diferir de la cobertura organizacional y técnica del proyecto POS. Debe reconciliarse con un maestro interno que incluya país, entidad legal, identificador de sucursal, tipo de local, vigencia, sistema utilizado y responsable.

### Qué no se puede calcular a partir de este inventario

**No se infieren cantidad de cajas, POS simultáneos, ventas por segundo (TPS), volumen diario, horario técnico, topología, operación offline ni número de despliegues de ERP/POS.** Una tienda puede tener múltiples cajas y entornos, o no usar el mismo software que otra.

Para dimensionar la arquitectura se necesitan esos datos operativos por sucursal y sus distribuciones de carga, incluyendo picos y recuperación después de desconexión. Este inventario solo aporta una referencia pública de cobertura geográfica para contextualizar la propuesta.

### Huellas del extracto contado

Se calcularon estas huellas SHA-256 sobre un extracto canónico por país: registros ordenados por ID, claves ordenadas, UTF-8, JSON compacto y campos `id`, `name`, `locality`, `address` —más `order` en Chile—. Sirven para distinguir esta observación de futuras descargas; no certifican la realidad operacional.

| País | SHA-256 del extracto |
| --- | --- |
| Chile | `441bce26466787ab3044a422947f6e107ad0a143ff5d1b2220299e407d4c177a` |
| Perú | `2daa4475d777869b6c3ecd7dfecc88af6563cc43268dd3947221980d9ee6ed5c` |
| España | `26327bea5aadb684af6d0f63b6fe7b0351ff1459725b045ab9fbe7cecd7b25f5` |

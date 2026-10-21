# Decisiones de arquitectura

## 1. Monorepo Nx con límites de dependencia

Un producto multipaís con seis aplicaciones operativas: `pos-web`, `pos-desktop`, `pos-runtime`, `pos-sync-worker`, `country-api` y `erp-worker`. Las apps componen librerías por responsabilidad; no equivalen a seis servicios ya desplegados. El mismo repositorio incluye `pos-docs`, la séptima aplicación, para la documentación Starlight. La [guía del monorepo](monorepo.md) detalla el scaffold, su propiedad de datos y la evidencia del legado que orienta las fronteras.

El frontend conserva `domain`, que no importa Angular, y `data-access`, que implementa las mutaciones mock. Las features no se importan entre sí; el shell compone sus rutas. `ui` contiene presentación y formatos, sin acceso a persistencia ni reglas de operación. El backend dispone de contextos en `libs/backend`, contratos y políticas puras en `contracts`, `shared-kernel` y `country-policies`, y reutiliza la infraestructura técnica de `platform/backend`. ESLint verifica las direcciones de importación y Nx conoce los proyectos.

Las aplicaciones Node se empaquetan con Rspack/SWC y el plugin oficial de Nx para incluir las librerías fuente internas; TSC conserva la comprobación de tipos. Esta reutilización entre aplicaciones justifica la evolución desde el build TSC inicial de una sola API. Las dependencias externas se instalan desde el manifiesto y lockfile de cada artefacto, cuya ejecución se verifica fuera del workspace. No se copian los plugins de parcheo de Core ni se obliga a publicar librerías internas como paquetes independientes.

No se copió el backend, autenticación, módulos sociales, marketing o integraciones de prime-showcase. La referencia aporta el sistema visual. Los formularios utilizan componentes PrimeNG nativos y las capacidades de Angular; no hay modificaciones a paquetes de terceros.

## 2. Estado y puertos

`PosStore` expone un snapshot signal de solo lectura y comandos que retornan `Result<T>`. Los fallos esperados se muestran como mensajes accionables. Las features nunca alteran las colecciones directamente. El reloj, la generación de identificadores y las esperas de simulación son sustituibles para probar casos deterministas.

`POS_REPOSITORY` permite sustituir el adaptador local. El formato se valida al cargar y tiene una versión explícita. Cada mutación se construye sobre una copia; la aplicación solo anuncia éxito después de persistirla. El almacenamiento web es suficiente para una demostración, pero tiene límites de tamaño, concurrencia y seguridad. No tiene las garantías de una base de datos.

La dirección de producto propone un backend de sucursal NestJS/Fastify compartido por las cajas y conectado a PostgreSQL de sucursal. Angular/Tauri consume su API, sin acceso SQL directo ni una base transaccional por terminal en el perfil de continuidad ante caída de WAN. La LAN y el servidor de sucursal siguen siendo dependencias de ese perfil. La sincronización duradera y el planificador pasarían a procesos supervisados que no dependan de la pestaña abierta. SQLite por terminal es una alternativa del perfil adicional sin LAN/servidor, pendiente de validación; no es la persistencia seleccionada por defecto. Esta dirección sigue la [propuesta de arquitectura](propuesta-arquitectura.md) y sus [opciones tecnológicas](opciones-tecnologicas.md).

`apps/pos-runtime` incorpora la [base HTTP de ese backend](api.md): NestJS/Fastify, configuración y sondas de aplicación. Aún no tiene persistencia ni casos de uso de negocio, y no sustituye los adaptadores mock actuales del frontend. Instalar un framework no acredita las garantías transaccionales, de seguridad o continuidad de la propuesta.

`country-api` prepara la composición del backend de país; `pos-sync-worker` y `erp-worker` preparan procesos separados para entrega y adaptadores. Son puntos de implementación, no sincronizadores reales. Los contextos scaffold no exponen fachadas que simulen una operación exitosa: deben incorporar casos de uso y pruebas antes de habilitar endpoints o jobs comerciales.

## 3. Cuatro estados distintos

- **Venta local:** se guardan documento, líneas, pagos y eventos pendientes.
- **Pago:** confirmado, rechazado o desconocido. Un resultado desconocido exige conciliación; no se cobra de nuevo automáticamente.
- **Fiscal:** documento pendiente, emitido o fallido. Una impresión no demuestra emisión.
- **ERP:** pendiente, sincronizado o fallido. Una venta local no demuestra registro en Dynamics AX.

Una nota de crédito conserva las cantidades y valores del documento original. Emitirla y devolver el pago son acciones distintas. Los pagos con crédito de cliente y con NC no deben confundirse con tarjetas de crédito.

## 4. Sincronización

Los flujos tienen dirección, entidades, programación, siguiente ejecución y ejecuciones históricas. Admiten manual, intervalo y hora diaria con selección de días en `America/Santiago`. Las ejecuciones en curso no se duplican. Un cierre interrumpido se recupera como error revisable.

Ese comportamiento sigue siendo el mock del frontend. La estructura nueva asigna la ejecución supervisada a `pos-sync-worker` y los contratos/progreso a `libs/backend/sync`. Persistencia durable, locks, transportes, programación fuera de la pestaña y conciliación entre aplicaciones quedan pendientes.

La cola de salida conserva la identidad de la operación y del evento durante los reintentos. Fiscal y ERP tienen confirmación independiente. El modo offline conserva el trabajo local autorizado y bloquea acciones que exigen un proveedor. En el producto real, la deduplicación debe existir también en el receptor; el mock no prueba garantías de servicios externos.

## 5. Permisos y módulos

Los perfiles Administrador, Supervisor, Cajero y Auditor tienen políticas explícitas. La navegación, las rutas y los comandos verifican permiso y disponibilidad del módulo. Deshabilitar una capacidad conserva su historial. Los registros de auditoría incluyen actor, rol, acción y entidad.

El selector de perfil es una herramienta de demostración. No constituye autenticación ni una barrera contra alguien que controle el navegador. En producción se necesita identidad verificable, sesiones y autorización de servidor por empresa/sucursal/caja. La auditoría local mock tampoco sustituye un registro remoto inmutable.

## 6. Multisucursal y producto comercial

La interfaz separa operación de caja, gestión comercial y plataforma. Los maestros y políticas son compartidos, con filtros de sucursal en análisis y asignaciones en usuarios. El diseño debe evolucionar a configuración corporativa con herencia por sucursal, aprobaciones de cambios, despliegue gradual y contratos versionados. Esa administración remota no se simula como si hubiera dispositivos reales conectados.

`country-policies` concentra la variación nacional y `fiscal` delimita emisión/proveedores; las reglas comunes no se duplican en una app distinta por país. Los perfiles iniciales y contratos no acreditan homologación fiscal, pagos o reglas comerciales fuera de la demostración chilena. Una app de backoffice separada se evaluará si existe una experiencia o ciclo de despliegue que la requiera.

## 7. Escritorio seguro

Tauri aloja el mismo build estático. La navegación por hash funciona sin un servidor de rutas. La CSP limita conexiones y recursos; los assets y fuentes son locales. No se habilitan plugins de shell, filesystem o HTTP para la maqueta. Las futuras integraciones nativas necesitan comandos y capacidades específicas, cancelación y límites de tiempo, sin exponer credenciales al frontend.

La actualización del producto requiere firma de instaladores, firma de manifiestos, protección contra downgrade, canales y validación de compatibilidad de la base local. La pantalla actual ilustra el recorrido y conserva su estado mock; no instala binarios.

## 8. Calidad

Pruebas unitarias para dinero, permisos, eventos, calendario y recuperación; pruebas de navegador para recorridos; compilación estricta y límites Nx; CI en Linux y Windows. No se comunica “listo para producción” por tener una interfaz completa: pagos, fiscalidad, operación sin red y recuperación requieren pruebas de integración y operación real antes de habilitar una caja.

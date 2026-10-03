# Decisiones de arquitectura

## 1. Monorepo Nx con límites de dependencia

Un solo producto y una sola definición del dominio para web y escritorio. `domain` no importa Angular. `data-access` depende de contratos del dominio y concentra las mutaciones. Las features no se importan entre sí; el shell compone sus rutas. `ui` contiene presentación y formatos, sin acceso a persistencia ni reglas de operación. ESLint verifica estas direcciones y Nx conoce todos los proyectos.

No se copió el backend, autenticación, módulos sociales, marketing o integraciones de prime-showcase. La referencia aporta el sistema visual. Los formularios utilizan componentes PrimeNG nativos y las capacidades de Angular; no hay modificaciones a paquetes de terceros.

## 2. Estado y puertos

`PosStore` expone un snapshot signal de solo lectura y comandos que retornan `Result<T>`. Los fallos esperados se muestran como mensajes accionables. Las features nunca alteran las colecciones directamente. El reloj, la generación de identificadores y las esperas de simulación son sustituibles para probar casos deterministas.

`POS_REPOSITORY` permite sustituir el adaptador local. El formato se valida al cargar y tiene una versión explícita. Cada mutación se construye sobre una copia; la aplicación solo anuncia éxito después de persistirla. El almacenamiento web es suficiente para una demostración, pero tiene límites de tamaño, concurrencia y seguridad. No tiene las garantías de una base de datos.

Para el producto de escritorio, el siguiente adaptador debe usar una base local transaccional (por ejemplo SQLite) detrás de comandos Tauri con permisos mínimos, migraciones, cifrado según el modelo de amenazas, respaldo y recuperación. La UI y los contratos de negocio se mantienen. La sincronización duradera y el planificador pasan a un servicio que no dependa de la pestaña abierta.

## 3. Cuatro estados distintos

- **Venta local:** se guardan documento, líneas, pagos y eventos pendientes.
- **Pago:** confirmado, rechazado o desconocido. Un resultado desconocido exige conciliación; no se cobra de nuevo automáticamente.
- **Fiscal:** documento pendiente, emitido o fallido. Una impresión no demuestra emisión.
- **ERP:** pendiente, sincronizado o fallido. Una venta local no demuestra registro en Dynamics AX.

Una nota de crédito conserva las cantidades y valores del documento original. Emitirla y devolver el pago son acciones distintas. Los pagos con crédito de cliente y con NC no deben confundirse con tarjetas de crédito.

## 4. Sincronización

Los flujos tienen dirección, entidades, programación, siguiente ejecución y ejecuciones históricas. Admiten manual, intervalo y hora diaria con selección de días en `America/Santiago`. Las ejecuciones en curso no se duplican. Un cierre interrumpido se recupera como error revisable.

La cola de salida conserva la identidad de la operación y del evento durante los reintentos. Fiscal y ERP tienen confirmación independiente. El modo offline conserva el trabajo local autorizado y bloquea acciones que exigen un proveedor. En el producto real, la deduplicación debe existir también en el receptor; el mock no prueba garantías de servicios externos.

## 5. Permisos y módulos

Los perfiles Administrador, Supervisor, Cajero y Auditor tienen políticas explícitas. La navegación, las rutas y los comandos verifican permiso y disponibilidad del módulo. Deshabilitar una capacidad conserva su historial. Los registros de auditoría incluyen actor, rol, acción y entidad.

El selector de perfil es una herramienta de demostración. No constituye autenticación ni una barrera contra alguien que controle el navegador. En producción se necesita identidad verificable, sesiones y autorización de servidor por empresa/sucursal/caja. La auditoría local mock tampoco sustituye un registro remoto inmutable.

## 6. Multisucursal y producto comercial

La interfaz separa operación de caja, gestión comercial y plataforma. Los maestros y políticas son compartidos, con filtros de sucursal en análisis y asignaciones en usuarios. El diseño debe evolucionar a configuración corporativa con herencia por sucursal, aprobaciones de cambios, despliegue gradual y contratos versionados. Esa administración remota no se simula como si hubiera dispositivos reales conectados.

## 7. Escritorio seguro

Tauri aloja el mismo build estático. La navegación por hash funciona sin un servidor de rutas. La CSP limita conexiones y recursos; los assets y fuentes son locales. No se habilitan plugins de shell, filesystem o HTTP para la maqueta. Las futuras integraciones nativas necesitan comandos y capacidades específicas, cancelación y límites de tiempo, sin exponer credenciales al frontend.

La actualización del producto requiere firma de instaladores, firma de manifiestos, protección contra downgrade, canales y validación de compatibilidad de la base local. La pantalla actual ilustra el recorrido y conserva su estado mock; no instala binarios.

## 8. Calidad

Pruebas unitarias para dinero, permisos, eventos, calendario y recuperación; pruebas de navegador para recorridos; compilación estricta y límites Nx; CI en Linux y Windows. No se comunica “listo para producción” por tener una interfaz completa: pagos, fiscalidad, operación sin red y recuperación requieren pruebas de integración y operación real antes de habilitar una caja.

# Caja corporativa — plan de entrega

## Producto

Demostración de una caja corporativa para Chile, con recorridos conectados y datos sintéticos. Reutiliza la identidad visual de prime-showcase y separa operación, gestión comercial y administración técnica. La cobertura y las variantes del sistema anterior están detalladas en [el inventario de Chile](audit-chile-for-product.md).

## Reorganización del monorepo acordada

**Decisión del 21 de octubre de 2026:** POS independiente, con Core solo como referencia. La [estructura objetivo](monorepo.md#estructura-objetivo-acordada) agrupa lo transversal en `libs/shared/` y conserva los contextos de negocio. Esta etapa actualiza documentación; las rutas físicas siguen pendientes de migración.

| Etapa | Trabajo | Criterio de aceptación |
| --- | --- | --- |
| Documentación | Árbol objetivo, inventario actual, propiedad DDD y proyectos de pruebas | Catálogo sincronizado, navegación, Astro, build y comprobación de navegador |
| Base backend | Trasladar `platform/backend` a `shared/backend`; conservar comportamiento y decidir proyectos por frontera real | Lint, tipos, tests y build backend; artefactos arrancan fuera del workspace |
| Contratos y kernel | Trasladar contratos técnicos a `shared/contracts` y modelo mínimo a `shared/kernel` | Dominio puro; contratos comerciales conservan propietario; sin imports de frameworks |
| UI transversal | Trasladar `ui` a `shared/frontend/ui` y ajustar generadores/activos | Build web, iconografía, tests y recorridos de UI conservados |
| E2E y soporte | Registrar `pos-clients-e2e` y sus dependencias de `pos-desktop` y `pos-mobile`; extraer soporte a `shared/testing` cuando exista reutilización | CI sigue probando producción; reportes y fixtures funcionan; producción no importa testing |
| Cierre de transición | Ajustar aliases, tags, tsconfigs, targets, inputs de caché, scripts, CI y catálogo | No quedan referencias ejecutables obsoletas ni dos ubicaciones permanentes para la misma capacidad |

`domain`, `data-access` y `country-policies` requieren revisión de propiedad; no se trasladan completos a shared por comodidad. Las pruebas de fronteras deben rechazar dependencias de servidor desde navegador, frameworks desde dominio, producción hacia testing e imports privados entre contextos.

La aceptación de cada traslado utiliza `npm run icons:check` cuando afecte UI, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` y los checks backend/estructura correspondientes. Mantener los comandos públicos actuales o documentar su sustitución en el mismo cambio. La [guía de pruebas](testing.md) diferencia los alcances.

No crear implementaciones comerciales ni suites de sistema vacías como parte de un movimiento de carpetas. El desarrollo de persistencia, identidad e integraciones avanza después por recorridos verificables.

## Recorridos

1. Inicio: métricas, gráficos, actividad, alertas y accesos por rol.
2. Venta: cliente, productos, precios, descuentos, retiro/despacho, boleta/factura, pagos mixtos, cheque/Orsan, crédito, vuelto/anticipo, pausar/retomar y resultado local/fiscal/ERP.
3. Caja: apertura, movimientos, arqueo por denominaciones, cierre parcial/total, custodia, diferencias e impresión Z.
4. Documentos: búsqueda, detalle, reimpresión, estado fiscal/ERP; cobranzas, anticipos, NC y devolución de pago con trazabilidad.
5. Maestros: clientes/RUT, direcciones/contactos, productos, precios/ofertas, sucursales, empleados, bancos y motivos. Búsqueda, edición local simulada, exportación y validación.
6. Sincronización: flujos separados, cola durable simulada, progreso, errores/reintentos, ejecución manual, horarios por zona, pausa/mantenimiento e historial.
7. Reportes: ventas, recaudación, cierres, medios de pago, pendientes/conciliación y rendimiento; filtros, gráficos y exportación.
8. Administración: módulos/capacidades, perfiles/roles, usuarios, tiendas/cajas, política offline, dispositivos, integraciones y versiones.
9. Observabilidad: logs estructurados, auditoría, correlación y diagnósticos simulados.

## Base

Nx + Angular CSR + PrimeNG y tema derivado de prime-showcase. Tauri 2 como shell. Tipos/contratos, repositorio mock versionado, comandos auditados y políticas independientes de la UI. Sin patch-package ni integraciones heredadas.

## Comprobación

Compilar y comprobar límites Nx; probar importes, permisos, flags, idempotencia, pago incierto, programación y persistencia; recorrer UI en escritorio y móvil y verificar accesibilidad. Crear repo Git independiente y privado en GitHub con instrucciones reproducibles.

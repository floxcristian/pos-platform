# Caja corporativa — plan de entrega

## Producto

Demostración de una caja corporativa para Chile, con recorridos conectados y datos sintéticos. Reutiliza la identidad visual de prime-showcase y separa operación, gestión comercial y administración técnica. La cobertura y las variantes del sistema anterior están detalladas en [el inventario de Chile](audit-chile-for-product.md).

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

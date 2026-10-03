# Inventario de Chile para Corporate POS

Revisión estática: 3 de octubre de 2026. Este documento es el inventario de origen y los criterios para la maqueta; no afirma que cada función ya esté implementada en el nuevo producto. La cobertura real debe comprobarse contra sus pantallas y pruebas.

## Alcance y decisiones de producto

Se revisaron rutas, páginas, componentes y servicios del POS anterior, además de los análisis existentes de sincronización, concentrador e impresión. No se ejecutaron aplicaciones corporativas, migraciones, consultas a bases ni endpoints. No se copian datos de clientes, credenciales o direcciones de infraestructura. Los registros del nuevo producto deben ser inventados.

Referencias principales:

- `mountain-implementos`, commit `711f97fd7948c696bf45c992c5b121683bdbacd7`.
- `mountain-sync-sucursal`, referencia `master` analizada en `540ab9a70e7befbca27a2f7eb88b87b25109e4d1`. El checkout de evidencia conserva `desarrollo`; las cadencias de master se obtienen del análisis trazado a ese commit, no se atribuyen al checkout.
- `mountain-concentrador`, `b2fd1ec266d131abb54b7076d41acce30f045119`.
- `api-impresion-caja`, `2e74b2d64985902f5fdfb52902016a5f65d7b577`.

La presencia de una función en código no acredita uso productivo de todas sus variantes. Las aclaraciones operativas del usuario tienen prioridad: **la caja chilena no administra stock**, **Orsan continúa y se retira Instacheck**, y las ofertas se consultan desde caja. No copiar pantallas de inventario, constructor de módulos técnicos ni páginas «en construcción» solo porque existen en el código antiguo.

Estados empleados en este inventario:

- **Base:** capacidad con rutas/interfaz o servicios identificados en el sistema anterior; conservar el recorrido de negocio.
- **Condicional:** existe código, pero su activación o uso depende de sucursal, perfil, configuración o evidencia incompleta.
- **Producto:** ampliación propuesta para comercializar la nueva caja; no atribuirla al legado.

P0 identifica recorridos que impiden operar si faltan; P1 completa control y operación diaria; P2 aporta extensibilidad comercial. La priorización no es una clasificación de incidentes.

## 1. Venta y atención de clientes

| ID  | Prioridad / origen | Capacidad que no debe perderse                                                        | Comportamiento esperado en la maqueta                                                                                                                                                    | Fuentes       |
| --- | ------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| V01 | P0 · Base          | Venta a público, cliente identificado y cliente express                               | Cambiar el contexto de venta; buscar RUT o nombre; elegir cliente; express con RUT, nombre, correo y teléfono. Validar RUT con DV, sin exponer datos reales.                             | S02, S03      |
| V02 | P0 · Base          | Boleta y factura                                                                      | Tipo de documento explícito; requisitos del cliente y límite de líneas visibles antes del cobro. DTE no es un tercer tipo equivalente: agrupa documentos electrónicos.                   | S03, S04      |
| V03 | P0 · Base          | Catálogo, búsqueda, cantidades y detalle de línea                                     | Buscar por SKU/nombre, agregar/quitar líneas, modificar cantidades y mostrar precio, impuesto, descuento y total.                                                                        | S04, S05      |
| V04 | P0 · Base          | Precios por cliente, cantidad y sucursal                                              | Mostrar de qué lista/regla sale el precio; recalcular al cambiar cliente o cantidad; impedir cobrar precio inválido. Mock de error y recuperación conserva el carro.                     | S05           |
| V05 | P0 · Base          | Promociones y cupón                                                                   | Ingresar/validar/quitar cupón, mostrar promociones aplicadas y conflictos; evitar simular que cualquier texto da descuento.                                                              | S04, S06      |
| V06 | P0 · Base          | Pausar, reanudar y cancelar venta en curso                                            | Lista de ventas pausadas con cliente, importe, fecha, cajero y selección; cancelar con motivo cuando corresponda. Recuperar sin duplicar cobros ya registrados.                          | S07           |
| V07 | P0 · Base          | Orden/nota de venta externa                                                           | Buscar OV, ver líneas y vendedor, importar referencias y pagos/anticipos relacionados. Una OV con condiciones especiales de despacho puede impedir modificar sus líneas.                 | S04, S08      |
| V08 | P1 · Base          | Retiro y despacho                                                                     | Dirección de facturación y entrega diferenciadas; contacto comprador; elegir retiro/despacho y líneas asociadas; conservar referencia externa. No producir movimientos locales de stock. | S01, S04, S03 |
| V09 | P1 · Base          | Mis ventas, comprobante y detalle                                                     | Buscar operaciones del cajero/sucursal y abrir detalle con tres estados separados: venta local, emisión fiscal y registro ERP.                                                           | S07, S09      |
| V10 | P1 · Condicional   | Precio por escala, precio mínimo, historial por cliente y descuento vendedor/segmento | Catálogo y simulador de reglas con vigencia y ámbito. La existencia de tablas locales no demuestra que el cálculo offline del legado esté activo.                                        | S05, S18      |
| V11 | P1 · Producto      | Atajos y recuperación de sesión                                                       | Atajos visibles, foco en escáner/búsqueda, recuperación de carro tras recarga, bloqueo de sesión, recibo consistente y estados vacíos/error.                                             | Diseño nuevo  |
| V12 | P2 · Producto      | Devolución omnicanal y venta asistida                                                 | Habilitar por compañía/sucursal; conservar canal, referencia y políticas. La maqueta no debe prometer integración con un canal real.                                                     | Diseño nuevo  |

El legado consulta precios y promociones remotos en los recorridos activos. En la propuesta, la evaluación local es una capacidad nueva que necesita paquetes de reglas versionados, vigencia y equivalencia funcional; no basta con etiquetar una tabla de productos como «offline».

## 2. Pagos y cobranza

| ID  | Prioridad / origen                    | Capacidad que no debe perderse          | Comportamiento esperado en la maqueta                                                                                                                                       | Fuentes                              |
| --- | ------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| P01 | P0 · Base                             | Pago mixto y saldo pendiente            | Agregar varias formas de pago, ver cada partida, total pagado/saldo/vuelto. Finalizar solo con saldo cubierto y operación válida; evitar doble finalización.                | S10                                  |
| P02 | P0 · Base                             | Efectivo y redondeo                     | Monto recibido, monto aplicado, ajuste de redondeo y vuelto separados.                                                                                                      | S11                                  |
| P03 | P1 · Condicional                      | Efectivo en dólares                     | Habilitar moneda adicional con tipo de cambio, fecha/origen, factor y valor configurado. Mostrar conversión y moneda del vuelto. No imponer a todas las sucursales.         | S11, S20                             |
| P04 | P1 · Base                             | Vuelto como anticipo                    | Ofrecerlo solo en contextos permitidos; decisión explícita; recibo y saldo del cliente coherentes.                                                                          | S11                                  |
| P05 | P0 · Base                             | Débito/crédito Transbank                | Flujo simulado esperando/aprobado/rechazado/resultado desconocido. Un timeout no autoriza otro cobro automático; consultar/conciliar la operación.                          | S10, S12                             |
| P06 | P1 · Base                             | Tarjeta no integrada                    | Referencia/voucher, tipo de tarjeta y cuotas cuando corresponda; permiso independiente respecto del terminal integrado. No almacenar PAN completo o CVV en mocks.           | S10                                  |
| P07 | P0 · Base                             | Transferencia                           | Banco/cuenta receptora configurada, referencia, fecha y monto; distinguir registrar evidencia de confirmar depósito.                                                        | S10                                  |
| P08 | P0 · Base                             | Crédito de cliente                      | Cupo disponible, bloqueos, clasificación, plazo, cuotas y vencimiento. Rechazar si no está autorizado; frescura del saldo no equivale a autorización offline.               | S13                                  |
| P09 | P1 · Base                             | Cheque y cheque a fecha                 | Banco, plaza, cuenta, número, monto, emisor, portador, teléfono y fechas; varios cheques; límites de vigencia y plazo.                                                      | S14                                  |
| P10 | P1 · Base con actualización operativa | Verificación Orsan                      | Verificación simulada pendiente/aprobada/rechazada/desconocida, código de resultado y revisión autorizada. Instacheck se excluye del catálogo vigente.                      | S14, S24                             |
| P11 | P1 · Base                             | Lector e impresión de cheque            | Simular lectura MICR y completar campos, confirmar correcciones, imprimir frente/reverso y mostrar resultado por trabajo.                                                   | S14, S21                             |
| P12 | P0 · Base                             | Pago con nota de crédito                | Buscar folio y cliente, saldo disponible, punto de emisión, pagos previos y operaciones pendientes de sincronizar. No reutilizar saldo de otra NC.                          | S15                                  |
| P13 | P0 · Base                             | Cobranza de deuda                       | Cartola y estado de cuenta, filtro por folios/estado/morosidad, seleccionar documentos, aplicar monto y distribuir pago, recuperar pago en curso.                           | S16                                  |
| P14 | P0 · Base                             | Abonos y anticipos                      | Abono del cliente y referencia a OV, comprobante y aplicación posterior; recuperar abono en proceso antes de cambiar de cliente.                                            | S07, S16                             |
| P15 | P1 · Base                             | Acuerdos y refresco de estado de cuenta | Consultar/refrescar acuerdos y deuda, ver pagos y saldos, actualización local y fecha del refresco separadas.                                                               | S16                                  |
| P16 | P1 · Base                             | Operación del terminal                  | Estado de conexión, cargar llaves, cierre del terminal, comprobante última venta, totales y detalles de pagos; simulados y auditados. Cierre terminal no es cierre de caja. | S12                                  |
| P17 | P1 · Producto                         | Conciliación de pagos                   | Bandeja de resultados desconocidos, evidencia, referencia externa, resolución y auditoría. Pago aceptado no implica emisión fiscal exitosa.                                 | Diseño nuevo, motivado por S09 y S12 |

## 3. Devoluciones y fiscalidad

| ID  | Prioridad / origen | Capacidad                                | Recorrido propuesto                                                                                                                                                                                   | Fuentes      |
| --- | ------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| F01 | P0 · Base          | Emisión de NC                            | Buscar documento original, seleccionar líneas/cantidades, motivo y tipo de modificación; validar importes y referencias; generar NC simulada.                                                         | S15          |
| F02 | P0 · Base          | Devolución de pago de NC                 | Flujo propio: buscar NC, consultar saldo y pagos del documento, elegir devolución y medio, validar máximo y estado. No confundir devolver dinero con emitir NC.                                       | S15          |
| F03 | P1 · Base          | Listado de NC emitidas                   | Filtro cliente/folio/fecha/estado, detalle, relación con original y recibo.                                                                                                                           | S15          |
| F04 | P0 · Base          | Emitir, consultar estado y recuperar DTE | Bandeja con pendiente/en proceso/emitido/rechazado/resultado desconocido; datos de emisión, error accionable y referencia proveedor.                                                                  | S01, S09     |
| F05 | P0 · Base          | Proveedores fiscales intercambiables     | El legado selecciona Acepta/Ingydev. Simular adaptadores y capacidades; configuración por entidad fiscal, sin endpoints ni credenciales reales.                                                       | S09          |
| F06 | P0 · Base          | PDF e impresión del DTE y comprobantes   | Ver/imprimir boleta/factura, comprobante de pago, cobranza, abono y devolución; copias y cola de impresión separadas del estado fiscal.                                                               | S21          |
| F07 | P1 · Condicional   | Anulación                                | No trasladar como capacidad universal el botón de anular de modal-pagar: en el snapshot aparece deshabilitado. El producto puede ofrecer un flujo controlado de reversa/NC con autorización y motivo. | S10          |
| F08 | P1 · Producto      | Reglas fiscales por país                 | Módulo y configuración versionados, bloqueo por falta de configuración, reglas por documento. No presentar el mock como certificación fiscal ni inferir permisos de contingencia.                     | Diseño nuevo |

## 4. Apertura, cierre y custodia

| ID  | Prioridad / origen | Capacidad                           | Recorrido propuesto                                                                                                                                                  | Fuentes      |
| --- | ------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| C01 | P0 · Base          | Abrir caja                          | Cajas disponibles/ocupadas, cajero y punto de emisión, monto inicial y confirmación; impedir tomar una caja ocupada.                                                 | S17          |
| C02 | P0 · Base          | Cierre parcial                      | Pausar/liberar caja para otro usuario, manteniendo trazabilidad del turno y saldo.                                                                                   | S17          |
| C03 | P0 · Base          | Cierre completo                     | Fin de jornada, validación de operaciones pendientes, arqueo y diferencias; resumen reproducible.                                                                    | S17          |
| C04 | P0 · Base          | Arqueo por forma de pago            | Montos calculados/declarados, detalle de efectivo por denominaciones, diferencias sobrante/faltante, cheques/tarjetas/otros medios.                                  | S17          |
| C05 | P1 · Base          | Custodia                            | Desglose y exportación para custodia, recaudación y confirmación de depósito; conservar referencia del cierre.                                                       | S17, S19     |
| C06 | P1 · Base          | Historial de cierres                | Filtrar fechas/cajero/caja, abrir detalle de transacciones y conciliación; imprimir/exportar.                                                                        | S19          |
| C07 | P1 · Producto      | Aprobación de diferencias y retiros | Solicitud, motivo, supervisor, límite por política y auditoría; retiros/ingresos de efectivo separados de venta. No afirmar que todo este circuito existía en Chile. | Diseño nuevo |

## 5. Maestros y configuración

El producto debe distinguir **autoridad del dato**, copia consultable y fecha/resultado de sincronización. Que el POS pueda consultar un maestro no significa que deba ser su editor principal.

| Grupo             | Contenido conservado / propuesto                                                                                                                    | Política recomendada                                                                                                                           | Fuentes            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Clientes          | RUT/DV, razón social, tipo, giro, clasificación comercial/financiera, bloqueos, subsegmento, datos de contacto, direcciones, estado de cuenta/plazo | Copia local consultable; alta/edición por capacidad; indicar cambios pendientes y conflictos.                                                  | S01, S03, S13, S16 |
| Productos         | Código/SKU, descripción, categorías 1–3, marca, atributos, impuestos y referencia externa                                                           | Catálogo como proyección comercial; sin controles de stock autoritativo obligatorios.                                                          | S01, S05, S24      |
| Precios y ofertas | Listas, mínimo, escalas, históricos/segmentos, pack/cantidad, descuentos, vigencia, activada, cupón/promoción                                       | Consulta en caja; administración central configurable con aprobación/versiones. El CRUD de ofertas existente no demuestra que cajeros lo usen. | S05, S06, S18      |
| Tributarios       | Tipos de documento, impuestos, giros, motivos/tipos de NC, emisor, formatos y copias                                                                | Por país/entidad legal; el mock usa políticas de ejemplo, no sustituye validación fiscal.                                                      | S01, S20           |
| Organización      | Compañías, sucursales, cajas, puntos de emisión, empleados/usuarios, bodegas como referencia externa, canales                                       | Añadir ámbitos de compañía y país como producto. Herencia central→sucursal→caja visible.                                                       | S01, S18           |
| Pagos             | Formas/grupos/estados, bancos, plazas, cuentas receptoras, denominaciones, plazos, límites cheque/NC/devolución, monedas/cambio                     | Habilitar por ámbito y rol; no permitir dependencias inválidas.                                                                                | S01, S10, S14, S20 |
| Dispositivos      | Impresora térmica/PDF, lector cheque, escáner, terminal                                                                                             | Inventario de periféricos, diagnóstico mock, cola y errores; Tauri será el adaptador local.                                                    | S12, S21           |
| Seguridad         | Usuarios, perfiles, menús y gestiones                                                                                                               | Traducir a roles y permisos por acción/ámbito; ocultar un menú no reemplaza autorización de comandos.                                          | S22                |
| Operación         | Inactividad/bloqueo, apertura, método/copias de impresión, carga de monto, límites y textos comerciales                                             | Editor tipado con valores por defecto, validación, vista previa, auditoría y restauración.                                                     | S20                |

### Controles de habilitación que deben ser funcionales en la maqueta

- Módulo: activo/desactivado, alcance y dependencias, descripción del efecto y quién modificó la política.
- Capacidad: pago con cheque, crédito, moneda adicional, descuento manual, devoluciones, venta offline, alta de cliente, impresora, terminal y exportación.
- Permiso: ver, crear, cobrar, anular/devolver, aprobar, programar, ejecutar, reintentar, exportar y administrar.
- Dependencias: desactivar fiscalidad no debe mostrar una venta como fiscalmente emitida; desactivar sincronización no debe borrar pendientes; desactivar una forma de pago debe impedir nuevas partidas y conservar el histórico.
- Flujo de cambios: ver valor heredado, sobrescritura local autorizada, fecha efectiva, validación y registro de auditoría.

No hace falta portar al producto la administración técnica de «módulos/submódulos» del antiguo menú. Un catálogo estable de módulos con capacidades es más claro que permitir editar arbitrariamente la navegación del código.

## 6. Sincronizadores e integración

### Cobertura real de datos

**Subidas: once familias.** Ventas, pagos de factura, notas de crédito, clientes, direcciones, contactos, abonos/anticipos, arqueos, sobrantes/faltantes, pagos de cobranza y devoluciones. [S18]

**Bajadas programadas: catorce tipos.** Clientes, saldos, direcciones, contactos, facturas pendientes, empleados, cajas, bancos, sucursales, bodegas, plazas bancarias, precios, artículos y motivos de devolución/NC. También existen servicios de atributos y variantes de precio no incluidos todos en la búsqueda programada. [S18]

Hay dos caminos complementarios para clientes: lotes de maestros y refresco al cargar un cliente por RUT. En el legado, ese refresco remoto puede provocar un error en la interfaz aunque exista copia local. El nuevo producto debe mantener el carro y explicar si utiliza copia vigente, desactualizada o si necesita autorización online. [S24]

### Pantalla operativa mínima

| Zona                        | Información                                                                                                                       | Acciones mock                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Resumen                     | Conexión, última confirmación, pendientes/errores, antigüedad del más antiguo, retraso por flujo, sucursales afectadas            | Filtrar y abrir el flujo responsable                                                              |
| Catálogo de sincronizadores | Nombre, dirección, origen/destino, entidades, dependencias, estado habilitado, política manual/programada                         | Activar/desactivar con efecto real en la simulación                                               |
| Calendario                  | Intervalo o días/horas, zona horaria, próxima ejecución, ventana de mantenimiento, exclusiones, política si se pierde una ventana | Editar, validar y guardar; vista previa de próximas ejecuciones                                   |
| Ejecución manual            | Alcance/entidad/sucursal, cantidad, límite, modo incremental o reconciliación autorizada                                          | Ejecutar, ver progreso y cancelar trabajos no iniciados; impedir duplicar el mismo trabajo activo |
| Historial                   | ID de ejecución, disparador/manual/programado, usuario, inicio/fin/duración, leídos/aplicados/fallidos/omitidos                   | Abrir detalle y exportar                                                                          |
| Mensajes                    | ID de negocio, correlación, entidad, versión, intento, próximo reintento, estado local/envío/confirmación                         | Consultar, reintentar elegibles, abrir registro de negocio                                        |
| Incidencias                 | Error legible, detalle técnico sanitizado, acción recomendada, responsable, edad                                                  | Simular fallo, revisar, corregir mock, reintentar y comprobar resultado                           |
| Mantenimiento               | Estado de admisión, en ejecución, pausados, punto de recuperación                                                                 | Pausar admisión, drenar, continuar; no borrar la cola                                             |
| Conciliación                | Diferencias local/proveedor/ERP por referencia                                                                                    | Consultar antes de reenviar ante respuesta incierta                                               |

El usuario informa ventana Chile L–V 07:00–22:00 y sábado 07:00–16:00, con mantenimiento posterior el sábado. Es una política operativa inicial editable en `America/Santiago`, no un cron universal para todos los países. El código de master incluye diferencias (por ejemplo domingo y rutas manuales), documentadas en S18/S24.

### Semántica que debe verse correcta incluso con mocks

1. **Guardada localmente**, **pendiente de enviar**, **enviada**, **confirmada por ERP**, **requiere revisión** son estados distintos.
2. El DTE tiene su propio estado. Impresión, aprobación de pago y registro ERP no lo sustituyen.
3. Un job terminado puede tener filas fallidas; separar procesadas, exitosas y fallidas.
4. La recuperación conserva IDs y referencias; un botón de reintento no crea otra venta ni otro cobro.
5. La interfaz puede simular latencia, desconexión y reinicio, sin afirmar que existe un backend durable de producción.
6. Un modo manual «Ejecutar ahora» respeta permisos, mantenimiento y límites; si permite una excepción, exige motivo y registra la decisión.

## 7. Tableros, reportes y logs

**Existentes que conservar:** resumen de ventas con totales/detalle; dashboard de ventas, formas de pago y productos más vendidos; cierres de caja y transacciones; informe Z; recaudación; confirmación de depósito; custodia; cartola y deuda; devoluciones/NC; estado de sucursales, mensajes y errores. [S01, S19, S23]

La ruta `resumen-venta-tipos` apunta a un componente en construcción en el snapshot revisado. Puede convertirse en reporte nuevo, pero no se debe describir como función activa acreditada del legado. Sucede lo mismo con varias rutas de inventario/bodegas/listas de precio. [S25]

**Ampliaciones de producto:**

- Tablero comercial por período/sucursal/canal/cajero: ventas, tickets, ticket promedio, mix de pago, devoluciones, comparativo y tendencia, con detalle al pulsar una métrica.
- Tablero operativo: disponibilidad de cajas/dispositivos, tiempos de atención simulados, DTE pendientes, conciliaciones, antigüedad de colas, fallos por conector.
- Reporte de descuentos/promociones y autorizaciones, impacto y vigencias.
- Exportación real de datos mock filtrados y opción de programar reportes, claramente simulada sin destinatarios ni envíos reales.
- Definiciones de cada indicador y bases consistentes: ventas netas/brutas, impuestos, devoluciones y anulaciones no se suman indiscriminadamente.
- Logs estructurados: hora, nivel, módulo, sucursal, caja, usuario ficticio, correlación, acción, resultado y detalle sanitizado. Buscar/filtrar/copiar/exportar.
- Auditoría separada de logs técnicos: quién cambió política/permisos/calendario, valor anterior/nuevo, motivo y alcance; no permitir editar el registro desde la UI.
- Centro de alertas con resolver/asignar/abrir operación, no solo una lista decorativa.

## 8. Límites de offline y arquitectura objetivo

La experiencia debe mostrar **qué se puede hacer**, no solamente un interruptor «offline»:

| Operación                                             | Mock objetivo                              | Condición visible                                          |
| ----------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| Consultar catálogo/clientes descargados               | Disponible                                 | Mostrar fecha/versión de los datos                         |
| Preparar y pausar carro                               | Disponible                                 | Persistencia local de la maqueta                           |
| Calcular precio local                                 | Condicional                                | Paquete de reglas vigente y política habilitada            |
| Cobrar en efectivo                                    | Condicional                                | Política comercial aprobada y estado fiscal independiente  |
| Crédito / saldo NC / transferencia confirmada / Orsan | No inferir autorización por tener copia    | Requiere política explícita o confirmación correspondiente |
| Terminal                                              | Estado independiente de internet de la app | Resultado desconocido conduce a conciliación               |
| Emisión fiscal                                        | Estado independiente                       | No inventar permiso de contingencia                        |
| Enviar al ERP                                         | Pendiente al estar desconectado            | Reanudar con el mismo ID                                   |
| Imprimir comprobante permitido                        | Depende de dispositivo                     | Impreso no equivale a emitido fiscalmente                  |

Para Nx conviene separar dominio, casos de uso, acceso a datos, proveedores mock y UI por capacidad. El frontend no debe importar una implementación concreta de AX o de Tauri desde todas las pantallas. Adaptadores de escritorio, ERP, fiscalidad, pagos e impresión deben quedar detrás de contratos pequeños. El modo web usa mocks; Tauri incorpora el contenedor y permisos mínimos, sin ejecutar comandos o acceder al sistema de archivos arbitrariamente desde una vista.

Preparar Nx/Tauri y simular políticas no convierte esta maqueta en un POS certificado ni en una solución durable de producción. La base sí puede ser mantenible: tipos, límites de módulos, validaciones, pruebas de negocio, recuperación de estados y documentación de contratos.

## 9. Recorridos de aceptación recomendados

1. Abrir caja disponible con monto inicial → venta boleta pública → pago efectivo → recibo → pendiente ERP sin duplicar la venta.
2. Cliente por RUT → factura → productos por cantidad → cupón válido/inválido → pago mixto → historial.
3. Carro pausado → recarga de pantalla → reanudar → conservar cliente/líneas y referencias.
4. OV con despacho especial → bloquear edición indebida → seleccionar medios de pago.
5. Tarjeta con respuesta desconocida → impedir nuevo intento ciego → conciliar → un solo pago.
6. Cheque a fecha → banco/plaza/personas/fecha → Orsan rechazado/aprobado → condición de habilitación respetada.
7. Cliente con deuda → seleccionar documentos → pago parcial/mixto → recibo → nuevo saldo y trazabilidad.
8. Abono asociado a OV → recuperación de pago en curso → aplicación posterior sin sumar el mismo dinero dos veces.
9. Documento original → NC → devolución del saldo permitida → estados, motivo y auditoría.
10. Arqueo parcial → turno abierto; cambio de cajero → caja liberada; cierre final → arqueo con diferencias justificadas.
11. Reimpresión fallida → trabajo visible en cola → reintento conserva relación con documento y marca copia.
12. Cambiar programación de clientes → próxima ejecución recalculada → ejecución manual con historial.
13. Fallo de sincronización → registro de error → reintento/conciliación → estado ERP confirmado conservando IDs.
14. Desactivar cheques por sucursal → opción no disponible en nuevas ventas → histórico legible; reactivar y verificar permiso del cajero.
15. Rol cajero sin administración → impedir acceder o ejecutar acción administrativa desde ruta directa.
16. Reporte filtrado → gráfico y tabla coherentes → exportación contiene únicamente esas filas mock.

## 10. Cobertura de los recorridos implementados

El inventario anterior conserva el alcance del origen. La siguiente tabla identifica las pantallas y comandos concretos de la maqueta; sus datos, respuestas fiscales, autorizaciones y movimientos bancarios son simulados.

| Pantalla             | Recorrido disponible                                                                                                                                              | Estado y control conservados                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Punto de venta       | Catálogo por nombre/SKU/código de barras, cantidades, precios por cliente/escala, descuentos, promoción vigente, boleta/factura, cliente express, retiro/despacho | Cotización centralizada; RUT y requisitos de factura; límites de descuento; precio aplicado visible por línea                  |
| Ventas pausadas y OV | Pausar/recuperar con cliente y despacho; cargar OV pendiente; pagar o pausar una OV protegida                                                                     | Condiciones comerciales y precio de la OV conservados; OV pagada excluida; pago desconocido bloquea nueva cobranza             |
| Cobrar venta         | Efectivo, tarjetas, transferencia, Orsan, cupo cliente, NC, anticipo y USD; combinación de medios                                                                 | Suma validada, redondeo sobre porción efectivo, monto recibido/vuelto separados, vuelto como anticipo en la misma transacción  |
| Cheques y crédito    | Datos bancarios y nombre/RUT de emisor y portador; condición de crédito del cliente con cuotas, plazo y vencimiento                                               | Orsan simulado; cupo validado; cuotas preasignadas, sin edición arbitraria por el cajero; deuda y acuerdo vinculados           |
| Documentos y pagos   | Buscar por folio/cliente/referencia, filtrar fechas/estados, ver líneas/pagos, reimprimir, emitir DTE, conciliar tarjeta                                          | Venta local, pago, fiscal y ERP separados; conciliación no ejecuta otro cobro; ajuste de efectivo y vuelto trazados            |
| Caja y turno         | Apertura confirmada, ingreso/retiro, custodia, depósito, arqueo por denominación, cambio de cajero, cierre e informe CSV                                          | Confirmar depósito no descuenta efectivo nuevamente; diferencia exige motivo; cierre bloqueado por pagos desconocidos          |
| Cobranzas            | Cuenta por cliente, abono de documento, anticipo, cartola/comprobante, acuerdo de cuotas y pago de cuota                                                          | Abono y cuota reducen la misma deuda; aplicación de anticipo no vuelve a ingresar efectivo                                     |
| Devoluciones         | Selección de documento/productos, NC parcial o completa, emisión fiscal y devolución de dinero separadas                                                          | Unidades/saldo disponibles, redondeo acumulado por línea, motivo auditado; NC aplicada en otra venta reduce saldo reembolsable |

Las pruebas de navegador están en `e2e/checkout.spec.ts`: venta/estado fiscal, pausa persistente, conciliación, NC/reembolso, OV protegida, cuotas, custodia/cambio de cajero, consumo de anticipo, redondeo/vuelto, cheque completo y crédito con plan. Las reglas transaccionales se prueban además en `libs/data-access/src/lib/transactions.spec.ts` y `pos-store.spec.ts`.

La maqueta no pretende copiar cada variante histórica del origen: cobranza mixta, tarjeta manual no integrada, pago de NC emitida fuera de la base simulada y detalles adicionales de segmentación comercial requieren contratos propios al conectar sistemas reales. Las órdenes, saldos y reglas incluidas permiten ejecutar los recorridos descritos sin esas conexiones. Ninguna pantalla da autoridad de stock a la caja.

## Fuentes de evidencia

Todos los paths de Mountain parten de `repos/mountain-implementos/` en el workspace de auditoría `pos-enterprise`. Los enlaces siguientes fijan el commit para que el inventario sea reproducible sin copiar código corporativo a este producto.

| ID  | Fuente                                                                                                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01 | [Rutas del backend](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js): documentos, productos, clientes, cajas, pagos, maestros, reportes, cobranzas, NC, ofertas y permisos.                                                                                          |
| S02 | `frontend/src/app/modules/pos/pages/punto-de-venta/punto-de-venta.component.ts`: carga de cliente, documento según tipo y respuesta remota.                                                                                                                                                                                                              |
| S03 | [Detalle de la venta](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/components/pos-detalle-venta-actual/pos-detalle-venta-actual.component.html): público/identificado/express, tipo de documento y ficha.                                                    |
| S04 | `frontend/src/app/modules/pos/components/pos-listado-productos/pos-listado-productos.component.html`: cupón, despacho, restricciones OV y líneas de facturación, impuestos/descuentos.                                                                                                                                                                   |
| S05 | `backend/app/Services/ProductosService.js`, `backend/app/Controllers/Http/ProductoController.js`, `backend/app/Services/Precios/PreciosImplementosServices.js`; `frontend/src/app/modules/pos/components/pos-botones/pos-botones.component.ts`.                                                                                                          |
| S06 | `backend/app/Services/Promociones/PromocionesImplementosServices.js`, rutas `promociones/consultaPromociones`, `cupon/consultaCupon`; `frontend/src/app/modules/ofertas/pages/oferta/oferta.component.html`.                                                                                                                                             |
| S07 | `frontend/src/app/data/pos-botones.ts`; `frontend/src/app/modules/pos/components/modals/{modal-reanudar-venta,modal-mis-ventas,modal-abonar}/`; `backend/app/Controllers/Http/ComprobanteVentaController.js`.                                                                                                                                            |
| S08 | `frontend/src/app/modules/pos/components/modals/modal-orden-de-venta/`; `frontend/src/app/modules/pos/components/listados/listado-nota-ventas/`; rutas `nota-de-venta` y controlador `NotaDeVentaAXController`.                                                                                                                                          |
| S09 | [PuntoDeVentaController](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js); análisis `pos-enterprise/docs/analisis-repositorios/mountain-implementos.md`, apartados venta local/DTE y selección de proveedor.                          |
| S10 | `frontend/src/app/modules/pos/components/modals/modal-pagar/modal-pagar.component.html`; `frontend/src/app/shared/components/pagos/forma-pago-agrupadas/`; `frontend/src/app/shared/components/formas-de-pago/{tarjeta-credito,tarjeta-debito,transferencia}/`.                                                                                          |
| S11 | [Efectivo](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/shared/components/formas-de-pago/efectivo/efectivo.component.html): redondeo, dólares y vuelto como anticipo.                                                                                                    |
| S12 | `frontend/src/app/modules/pos/pages/transbank/transbank.component.html`; `frontend/src/app/shared/components/formas-de-pago/pos-integraciones/transbank/transbank-pago/`.                                                                                                                                                                                |
| S13 | `frontend/src/app/shared/components/formas-de-pago/credito/credito.component.html`: bloqueo, cupo, plazos, cuotas y vencimiento.                                                                                                                                                                                                                         |
| S14 | `frontend/src/app/shared/components/formas-de-pago/pos-pago-cheque/` y `pos-pago-cheque-form/`; `backend/app/Controllers/Http/ChequesController.js`.                                                                                                                                                                                                     |
| S15 | `frontend/src/app/modules/devoluciones/devoluciones-routing.module.ts`; `frontend/src/app/modules/devoluciones/pages/`; `frontend/src/app/modules/pos/pages/devolucion-pago/devolucion-pago-nota-credito.component.html`; `frontend/src/app/shared/components/formas-de-pago/pos-pago-nc/`; `backend/app/Controllers/Http/NotaDeCreditoAxController.js`. |
| S16 | `frontend/src/app/modules/cobranzas/pages/estado-cuenta-cliente/estado-cuenta-cliente.component.html`; `cartola-clientes/`; rutas/controladores `Cobranza`, `CobranzaAcuerdo`, `CartolaCliente`, `Abono`.                                                                                                                                                |
| S17 | `frontend/src/app/modules/pos/pages/{abrir-caja,definir-cierre,cerrar-caja,resumen-cierre-caja}/`; `backend/app/Controllers/Http/CajasUsuarioController.js`.                                                                                                                                                                                             |
| S18 | [Cron master](https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/cronHooks.js); `pos-enterprise/docs/analisis-repositorios/mountain-sync-sucursal.md`, secciones 2–4; servicios `SyncUpload`, `Sync`, `SyncPrecios`.                                                                    |
| S19 | [InformesController](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/InformesController.js): resumen, cierre, recaudación, Z, depósito y transacciones; `frontend/src/app/modules/reportes/pages/reporte-detalle-cierre-caja/`.                                 |
| S20 | [ConfiguracionesModel](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/models/configuraciones.model.ts): capacidades/configuración históricas; no copiar su proveedor Instacheck por defecto al producto vigente.                                                           |
| S21 | `pos-enterprise/docs/analisis-repositorios/api-impresion-caja.md`; [documentos.service.ts](https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/documentos.service.ts); `api-impresion-caja/WindowsServiceImpresora`, `Biblioteca/Helper`.                              |
| S22 | `frontend/src/app/modules/configuraciones/components/perfiles/permisos-menus/` y `permisos-gestiones/`; rutas backend `perfiles`, `asignar-gestiones`, `asignar-menus`, `login/accesos`.                                                                                                                                                                 |
| S23 | `frontend/src/app/modules/sincronizador/sincronizador-routing.module.ts`; `backend-concentrador/start/routes.js`: estado, detalle, errores y reintento manual.                                                                                                                                                                                           |
| S24 | `pos-enterprise/docs/contraste-apuntes-operacion-chile.md`: AP-01 stock, AP-04 refresco cliente, AP-07 Orsan, AP-08/09 ventanas y mantenimiento.                                                                                                                                                                                                         |
| S25 | `frontend/src/app/modules/reportes/reportes-routing.module.ts`; `frontend/src/app/modules/inventario/inventario-routing.module.ts`; `frontend/src/app/modules/configuraciones/configuraciones.routing.module.ts`: componentes activos versus rutas en construcción.                                                                                      |

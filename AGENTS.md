# Corporate POS

Maqueta funcional de producto con datos sintéticos. No conectar servicios corporativos, dispositivos reales, proveedores fiscales ni medios de pago.

## Arquitectura

- Nx integrado: apps/pos-web, apps/pos-desktop y librerías con límites explícitos.
- Angular standalone, OnPush, signals y TypeScript estricto. PrimeNG nativo primero.
- domain es TypeScript puro; data-access implementa puertos con adaptadores mock y persistencia local versionada. Las features consumen servicios, no localStorage ni datos duplicados.
- ui contiene el preset y componentes de presentación sin reglas de negocio.
- Feature flags y permisos deben aplicarse a rutas y comandos, no solo al menú.
- Identidad de operación, pago, fiscalidad y ERP son estados diferentes. Nunca repetir automáticamente un pago de resultado desconocido.
- Datos de inventario solo consultivos: el POS de Chile no es autoridad de stock.

## Diseño

Conservar la identidad y recetas de prime-showcase: Aura corporativo, Inter local, superficies neutras, densidad operativa, navegación predecible y PrimeNG. Tailwind y tokens del preset; evitar colores arbitrarios por componente. PrimeIcons en controles compactos; DuotoneIconComponent (SVG Phosphor MIT) en iconos decorativos grandes, sin copiar FontAwesome Pro. Usar 28–32 px en tarjetas, 40 px en estados vacíos y 48 px en confirmaciones. Mantener la licencia de los SVG en el artefacto web.
UI en español para cajeros, supervisores y administradores. Acciones completas con validación, estados vacíos, errores, confirmaciones y feedback. Teclado, foco visible, etiquetas y contraste verificables. No controles decorativos ni enlaces sin destino.
Las tablas usan `pos-table` en el elemento table (`tableStyleClass` en PrimeNG) para alinear sus extremos con las cabeceras: 20 px en tarjetas, `pos-table--compact` para cabeceras de 16 px y `pos-table--flush` cuando el contenedor ya aporta el padding. El texto principal usa 16 px; los metadatos conservan su tamaño explícito. Conservar el espaciado vertical y entre columnas.
PageHeaderComponent, MetricCardComponent y EmptyStateComponent usan `heading`, no `title`: el atributo HTML nativo produce un tooltip accidental. Las cabeceras de página usan 24 px, peso medio y acento vertical. La separación posterior es de 24 px: el margen del componente se anula cuando el padre `pos-section` ya aporta ese gap. Usar EmptyStateComponent en tablas y paneles vacíos, sin añadir otro borde al contenedor existente.
El foco sigue la referencia publicada en prime-showcase-mu.vercel.app: halo único de 3,2 px sin separador blanco. Verificar esa versión antes de copiar cambios del preset local, que puede ser diferente.
Los estados hover/pulsado usan los tokens del preset, incluidos botones text/outlined y cierres de overlays. Para acciones HTML propias, usar pos-surface-action, pos-inline-action o pos-interactive-card. Comprobar contraste del texto contra el fondo pulsado, conservar la selección y excluir controles deshabilitados.

Los botones de solo icono deben importar PosTooltipDirective y declarar `posTooltip`, además de su `ariaLabel`/`aria-label`. Sin valor, la directiva reutiliza la etiqueta accesible; usar texto explícito solo si aporta una descripción distinta. No sustituir la etiqueta accesible ni el foco visible por un tooltip y no usar el atributo nativo `title` para estas ayudas. La regla `pos-ui/icon-button-tooltip` verifica los controles definidos en templates.
El tooltip aparece con hover o foco de teclado, permite mover el puntero sobre su texto y se cierra con Escape, clic, navegación o scroll. Escape cierra primero la ayuda sin retirar el foco ni cerrar el diálogo que la contiene. Mantener un solo overlay, conservar los demás IDs de `aria-describedby` y limpiar listeners, timers y overlay al destruir o cerrar el control. No mostrar ayuda de disponibilidad en controles deshabilitados.
Los controles internos de PrimeNG usan `createTooltipPassThrough`: slots PT públicos tipados con listeners y hooks del ciclo de vida, conectados al mismo TooltipService/CDK Overlay. Los atributos PT no instancian directivas Angular en tiempo de ejecución; no intentar inyectar `pTooltip`/`posTooltip` mediante PT ni parchear el DOM generado por la librería.

## Entrega

Ejecutar build, lint, pruebas de dominio y recorridos de UI. Documentar límites reales del mock y de Tauri. No llamar listo para producción a una maqueta. No copiar secretos, el historial ni features irrelevantes de prime-showcase.

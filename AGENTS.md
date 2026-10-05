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

Conservar la identidad y recetas de prime-showcase: Aura corporativo, Inter local, superficies neutras, densidad operativa, navegación predecible y PrimeNG. Tailwind y tokens del preset; evitar colores arbitrarios por componente. Los controles compactos propios usan `pos-icon pos-icon-NOMBRE`, con máscaras SVG Phosphor Bold; DuotoneIconComponent combina su geometría Bold con la capa secundaria Duotone para iconos decorativos grandes. No simular grosor con sombras, contornos CSS o font-weight ni copiar FontAwesome Pro. Usar 28–32 px en tarjetas, 40 px en estados vacíos y 48 px en confirmaciones. Regenerar con `npm run icons:generate`, comprobar con `npm run icons:check` y mantener la licencia de los SVG en el artefacto web. Ver `docs/iconography.md`.
UI en español para cajeros, supervisores y administradores. Acciones completas con validación, estados vacíos, errores, confirmaciones y feedback. Teclado, foco visible, etiquetas y contraste verificables. No controles decorativos ni enlaces sin destino.
Las tablas usan `pos-table` en el elemento table (`tableStyleClass` en PrimeNG) para alinear sus extremos con las cabeceras: 20 px en tarjetas, `pos-table--compact` para cabeceras de 16 px y `pos-table--flush` cuando el contenedor ya aporta el padding. El texto principal usa 16 px; los metadatos conservan su tamaño explícito. Conservar el espaciado vertical y entre columnas.
PageHeaderComponent, MetricCardComponent y EmptyStateComponent usan `heading`, no `title`: el atributo HTML nativo produce un tooltip accidental. Las cabeceras de página usan 24 px, peso medio y acento vertical. La separación posterior es de 24 px: el margen del componente se anula cuando el padre `pos-section` ya aporta ese gap. Usar EmptyStateComponent en tablas y paneles vacíos, con un icono duotone contextual de 40 px y sin añadir otro borde al contenedor existente. Cuando no hay filas, mostrar el estado vacío fuera de la tabla y de su área de scroll para que el icono y el texto se vean completos en móvil.
El foco sigue la referencia publicada en prime-showcase-mu.vercel.app: halo único de 3,2 px sin separador blanco. Verificar esa versión antes de copiar cambios del preset local, que puede ser diferente.
En el encabezado, usar iconos de acción de 24 px dentro de botones de 44 px; lupa del buscador a 20 px e indicador del perfil a 16 px. Comparar el área pintada entre familias: el tamaño nominal de una fuente no equivale al dibujo visible de una máscara SVG.
El perfil del encabezado usa avatar tonal de 32 px con radio de 8 px, separación horizontal de 12 px y 2 px entre líneas. En móvil queda como botón de 44 × 44 px. Los estilos base de los iconos viven en la capa components para respetar las utilidades responsivas; conservar las reglas de alto contraste fuera de ella.
Los estados hover/pulsado usan los tokens del preset, incluidos botones text/outlined y cierres de overlays. Para acciones HTML propias, usar pos-surface-action, pos-inline-action o pos-interactive-card. Comprobar contraste del texto contra el fondo pulsado, conservar la selección y excluir controles deshabilitados.
Los botones secundarios rellenos usan la variante tonal azul de prime-showcase en toda la aplicación, configurada en el preset: primary 100/200/300 con texto 700 en claro y 900/800/700 con texto 100 en oscuro. Compartir los tokens entre vistas y diálogos, sin sobrescrituras locales; conservar el halo de foco común. Las variantes text/outlined y los controles segmentados mantienen sus estilos propios.
Los enlaces contextuales usan pos-inline-action: peso semibold (600) definido en la clase compartida, sin pesos individuales por pantalla, sin iconos, siempre subrayados y con fondo transparente. Hover y pulsación cambian solo el color del texto mediante los tokens primary del preset; conservar el foco visible. Esta regla no se aplica a la navegación ni a enlaces presentados como botones. Los desplegables summary conservan su indicador nativo.
Todos los modales p-dialog y p-confirmdialog declaran [draggable]="false" mediante el input nativo de PrimeNG. No habilitar arrastre en sus encabezados.

Los botones de solo icono deben importar PosTooltipDirective y declarar `posTooltip`, además de su `ariaLabel`/`aria-label`. Sin valor, la directiva reutiliza la etiqueta accesible; usar texto explícito solo si aporta una descripción distinta. No sustituir la etiqueta accesible ni el foco visible por un tooltip y no usar el atributo nativo `title` para estas ayudas. La regla `pos-ui/icon-button-tooltip` verifica los controles definidos en templates.
El tooltip aparece con hover o foco de teclado, permite mover el puntero sobre su texto y se cierra con Escape, clic, navegación o scroll. Escape cierra primero la ayuda sin retirar el foco ni cerrar el diálogo que la contiene. Mantener un solo overlay, conservar los demás IDs de `aria-describedby` y limpiar listeners, timers y overlay al destruir o cerrar el control. No mostrar ayuda de disponibilidad en controles deshabilitados.
Los controles internos de PrimeNG usan `createTooltipPassThrough`: slots PT públicos tipados con listeners y hooks del ciclo de vida, conectados al mismo TooltipService/CDK Overlay. Los atributos PT no instancian directivas Angular en tiempo de ejecución; no intentar inyectar `pTooltip`/`posTooltip` mediante PT ni parchear el DOM generado por la librería.

## Entrega

Ejecutar build, lint, pruebas de dominio y recorridos de UI. Documentar límites reales del mock y de Tauri. No llamar listo para producción a una maqueta. No copiar secretos, el historial ni features irrelevantes de prime-showcase.

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
Las tablas usan `pos-table` en el elemento table (`tableStyleClass` en PrimeNG) para alinear sus extremos con las cabeceras: 20 px en tarjetas, `pos-table--compact` para cabeceras de 16 px y `pos-table--flush` cuando el contenedor ya aporta el padding. Conservar el espaciado vertical y entre columnas.
El foco sigue la referencia publicada en prime-showcase-mu.vercel.app: halo único de 3,2 px sin separador blanco. Verificar esa versión antes de copiar cambios del preset local, que puede ser diferente.

## Entrega

Ejecutar build, lint, pruebas de dominio y recorridos de UI. Documentar límites reales del mock y de Tauri. No llamar listo para producción a una maqueta. No copiar secretos, el historial ni features irrelevantes de prime-showcase.

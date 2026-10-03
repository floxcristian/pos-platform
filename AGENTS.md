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

Conservar la identidad y recetas de prime-showcase: Aura corporativo, Inter local, superficies neutras, densidad operativa, navegación predecible y PrimeNG. Tailwind y tokens del preset; evitar colores arbitrarios por componente. PrimeIcons, sin copiar FontAwesome Pro.
UI en español para cajeros, supervisores y administradores. Acciones completas con validación, estados vacíos, errores, confirmaciones y feedback. Teclado, foco visible, etiquetas y contraste verificables. No controles decorativos ni enlaces sin destino.

## Entrega

Ejecutar build, lint, pruebas de dominio y recorridos de UI. Documentar límites reales del mock y de Tauri. No llamar listo para producción a una maqueta. No copiar secretos, el historial ni features irrelevantes de prime-showcase.

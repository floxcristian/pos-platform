# Iconografía

Corporate POS utiliza geometría de Phosphor Icons 2.1.1, con licencia MIT. Los controles compactos usan dibujos Bold oficiales; los iconos decorativos grandes combinan el dibujo Bold con la capa secundaria del Duotone del mismo nombre. Esta combinación es una adaptación propia del producto, no una variante publicada por Phosphor.

`DuotoneIconComponent` dibuja dos capas SVG de 256 × 256 unidades, sin modificar sus coordenadas: secundaria al 40 % y principal opaca. Ambas heredan `currentColor`. Las tarjetas usan 28–32 px; los estados vacíos, 40 px; las confirmaciones, 48 px. Se conserva `aria-hidden` porque su texto acompaña al dibujo. Los botones mantienen su nombre accesible y tooltip.

El grosor procede de la geometría Bold diseñada por Phosphor. No se simula mediante `font-weight`, trazos CSS, sombras ni copias de FontAwesome Pro. Solo se incluyen los iconos del catálogo del producto; no se distribuye una fuente de iconos completa.

## Iconos compactos

Los controles propios usan `pos-icon pos-icon-NOMBRE`, también en el input `icon` de PrimeNG. El catálogo contiene 59 máscaras SVG con la geometría Bold oficial. Cada máscara mide `1em`, hereda el color del control y mantiene el tamaño ya definido por su contexto. No depende de fuentes, ligaduras, peticiones externas ni JavaScript adicional. Los iconos internos que proporciona PrimeNG conservan sus SVG nativos.

El encabezado usa 24 px (`text-2xl`) en menú, búsqueda móvil, tema y notificaciones; 20 px (`text-xl`) en la lupa del buscador y 16 px en el indicador del perfil. Los botones conservan su área de 44 × 44 px. El tamaño se ajusta por el dibujo visible, no solo por el tamaño nominal de la fuente: a 16 px la campana Phosphor ocupa aproximadamente 12,5 × 13,5 px, mientras que a 24 px ocupa 18,75 × 20 px. Esto corrige la diferencia que persistía tras adoptar Bold. No se deforma la geometría ni se modifica el grosor mediante CSS.

Verificación de este ajuste: build, lint, 153 pruebas de lógica y 13 E2E de contrato visual, interacción, tooltips y navegación aprobados. Se comprobaron las dimensiones renderizadas, claro/oscuro, hover, alto contraste y ausencia de desbordamiento a 375 px. Capturas del [encabezado de escritorio](screenshots/header-actions-optical.png) y [móvil](screenshots/header-actions-mobile.png).

`tools/generate-compact-icons.mjs` genera `libs/ui/src/lib/compact-icons.css`. Para añadir uno, incluir su nombre en el catálogo explícito y regenerar. No escribir SVG codificado ni editar la salida a mano. Las máscaras usan recursos `data:` permitidos por las políticas CSP de la web y Tauri.

En alto contraste de Windows, las máscaras conservan el color del sistema utilizado por el control padre mediante `forced-color-adjust: preserve-parent-color`; los navegadores que no soportan ese valor usan `CanvasText`. La regla se limita al dibujo para evitar que el navegador convierta su relleno en un fondo invisible. Los controles siguen recibiendo los colores forzados del sistema. Referencia: [CSS Color Adjustment](https://www.w3.org/TR/css-color-adjust-1/#forced-color-adjust-prop).

## Regenerar el catálogo

Después de instalar las dependencias del repositorio, ejecutar desde su raíz:

```sh
npm run icons:generate
npm run icons:check
```

Ambos generadores utilizan `@phosphor-icons/core` 2.1.1 instalado localmente y el formato del proyecto. `--check` compara la salida esperada sin escribir archivos. El generador duotono contiene un catálogo explícito de 37 nombres y escribe `libs/ui/src/lib/duotone-icons.ts`.

`npm run check` y el job web de CI ejecutan la comprobación del catálogo para detectar cambios manuales o recursos desactualizados.

Se validan la versión, el `viewBox`, los atributos y las capas antes de extraer la geometría. Solo se aceptan los SVG simples conocidos, sin transformaciones, trazos, referencias, máscaras ni reglas de relleno adicionales. Si cambia el formato de un recurso, la generación falla y exige revisión; no intenta reinterpretar el dibujo.

Para añadir un icono, elegir un nombre disponible en ambas variantes, incluirlo en el catálogo y regenerar. Revisar visualmente la superposición en claro y oscuro, especialmente los huecos y contornos internos. La capa principal Bold puede tener proporciones distintas de su equivalente Duotone: el generador conserva el diseño original de cada capa y no deforma ninguna para ajustarla.

La atribución y la licencia completas se incluyen en `apps/pos-web/public/third-party-licenses.txt`, distribuido con la web y Tauri. El paquete de origen es una dependencia de desarrollo para generar recursos locales; la interfaz no lo consulta en ejecución.

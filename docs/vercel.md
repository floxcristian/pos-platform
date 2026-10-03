# Frontend en Vercel

Vercel publica la aplicación Angular como archivos estáticos. Nx compila `pos-web` y sus librerías; no se ejecuta Rust ni se genera el instalador Tauri en este despliegue.

## Primer despliegue

1. En [Vercel](https://vercel.com/new), selecciona **Add New → Project** e importa **floxcristian/pos-platform** desde GitHub.
2. Mantén **Root Directory** en la raíz del repositorio (`./`, o el campo vacío). No selecciones `apps/pos-web`: el `package.json`, el lockfile, Nx y `libs` están en la raíz o fuera de esa carpeta.
3. Usa **Framework Preset: Other**. El `vercel.json` versionado define los valores siguientes:

| Ajuste               | Valor                       |
| -------------------- | --------------------------- |
| Production Branch    | `main`                      |
| Root Directory       | Raíz del repositorio (`./`) |
| Framework Preset     | `Other`                     |
| Install Command      | `npx --yes npm@11.6.0 ci`   |
| Build Command        | `npm run build`             |
| Output Directory     | `dist/apps/pos-web/browser` |
| Node.js              | `24.x`                      |
| Variables de entorno | Ninguna para esta demo      |

4. Pulsa **Deploy**. Si Node.js no aparece durante la importación, comprueba **Settings → Build and Deployment → Node.js Version**. El rango `engines.node` de este repositorio admite Node 24; Vercel resuelve ese rango a la versión compatible más alta disponible.
5. Abre la URL que asigne Vercel y comprueba `/#/inicio`, `/#/venta` y `/#/sincronizacion`. Recarga una ruta interna y verifica que cargan el fondo SVG del header, fuentes, gráficos y selectores.

El framework `null` en `vercel.json` equivale a **Other**: el comando explícito de Nx genera el sitio y Vercel sirve únicamente `dist/apps/pos-web/browser`. No utilices `dist/apps/pos-web` ni la carpeta de código fuente como salida. Los campos versionados evitan depender de ajustes manuales diferentes en cada entorno.

## Actualizaciones y datos

Con la integración GitHub conectada, los nuevos commits en la rama de producción generan despliegues. La aplicación usa rutas con `#`, por lo que no necesita reescrituras SPA para recargar una ruta interna. Si más adelante se cambia a rutas sin `#`, habrá que configurar el fallback a `index.html`.

Los datos mock se guardan en el navegador de cada persona y por dominio. Cambiar de localhost a Vercel, o a otro dominio de preview, comienza con un almacenamiento distinto. No hay backend compartido ni variables secretas necesarias. La sincronización programada es simulada y funciona mientras la aplicación permanece abierta; Vercel no la convierte en un proceso de servidor.

El contenedor de escritorio continúa empaquetándose con `npm run desktop:build` y en GitHub Actions. La web de Vercel permite revisar el frontend, pero no instala Tauri ni incorpora acceso real a impresoras o terminales de pago.

## Referencias

- [Configuración de build, raíz y directorio de salida](https://vercel.com/docs/builds/configure-a-build).
- [Configuración versionada con vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
- [Versiones de Node.js y prioridad de engines](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

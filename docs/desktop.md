# Host de escritorio Tauri

`apps/pos-desktop` prepara una aplicación Windows con Tauri 2 y reutiliza exactamente el frontend Angular de `apps/pos-web`. No hay una segunda interfaz ni servicios de caja duplicados. El instalador previsto es NSIS por usuario.

## Prerrequisitos Windows

- Node.js compatible con `package.json` y dependencias instaladas con `npm ci`.
- Rust mediante rustup con host MSVC. `rust-toolchain.toml` fija Rust 1.90.0, requerido por la versión de Tauri seleccionada.
- Microsoft C++ Build Tools con la carga **Desktop development with C++** y Windows SDK.
- Microsoft Edge WebView2 Runtime.

Los requisitos de Windows están descritos en la [documentación oficial de Tauri](https://v2.tauri.app/start/prerequisites/#windows). No se instalan herramientas del sistema automáticamente desde este repositorio.

## Ejecutar y compilar

Desde la raíz del workspace:

```powershell
npm run desktop:info
npm run desktop:dev
npm run desktop:build
```

`desktop:dev` inicia el frontend en `http://127.0.0.1:4300` antes de abrir la ventana nativa. No inicies otro servidor en ese mismo puerto. Para trabajar solo con la web, usa `npm start`.

`desktop:build` ejecuta el build Angular e incorpora `dist/apps/pos-web/browser`. Los artefactos de Windows se generan en `apps/pos-desktop/src-tauri/target/release/bundle/nsis`.

Nx ejecuta Tauri desde `apps/pos-desktop`. Los hooks `beforeDevCommand` y `beforeBuildCommand` declaran `cwd: "../../.."`: Tauri los ejecuta después de cambiar al directorio `src-tauri`, por lo que apuntan explícitamente a la raíz del workspace. `frontendDist` también se resuelve desde `src-tauri`. Ver [configuración de Tauri](https://v2.tauri.app/reference/config/#buildconfig) y su [implementación del build](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-cli/src/build.rs).

La navegación usa hash para que las rutas funcionen dentro del protocolo local del host. El enlace de salto al contenido enfoca la región principal sin cambiar ese hash.

## Frontera del prototipo

La ventana `main` tiene una capability explícita sin permisos nativos. No se registran comandos Rust ni plugins de archivos, shell, HTTP, impresoras, pagos o dispositivos. La CSP productiva admite assets incorporados y el transporte interno de Tauri; la política de desarrollo permite además el servidor y WebSocket local de Angular. PrimeNG y Angular necesitan estilos dinámicos, por eso `style-src` conserva `unsafe-inline`; `script-src` productivo no lo admite. Referencia: [capabilities de Tauri](https://v2.tauri.app/security/capabilities/).

El almacenamiento de esta maqueta sigue siendo el adaptador local del frontend. El host no transforma localStorage en una base transaccional ni implementa un servicio de sincronización cuando la aplicación está cerrada. La impresión, terminal de pago, Orsan, fiscalidad, ERP y actualización siguen simulados.

Antes de distribuir a sucursales faltan la persistencia de Edge, integración nativa con dispositivos probados, identidad real, firma de instaladores, manejo del cierre con operaciones pendientes y pruebas sobre los equipos objetivo. Un updater futuro debe validar firmas, usar un canal autenticado de distribución, controlar el despliegue gradual y definir recuperación. No hay endpoints de actualización ni claves privadas en este scaffold; la pantalla de actualizaciones es una simulación.

## Verificación y límite actual

Se puede validar el JSON y el layout de archivos con la CLI, además del build web. Para confirmar un ejecutable es imprescindible compilar con Rust y MSVC y abrirlo en Windows. Este entorno no tiene Cargo/Rust disponibles, por lo que no se afirma que exista un instalador probado.

Las versiones directas de Tauri están fijadas en Cargo.toml. La primera compilación con el toolchain debe generar `Cargo.lock`; debe revisarse y versionarse para fijar también las dependencias transitivas. Los iconos pertenecen al proyecto, se generan desde una figura geométrica propia y no incluyen Font Awesome Pro.

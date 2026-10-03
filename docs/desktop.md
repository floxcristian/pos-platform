# Host de escritorio Tauri

`apps/pos-desktop` prepara una aplicación Windows con Tauri 2 y reutiliza exactamente el frontend Angular de `apps/pos-web`. No hay una segunda interfaz ni servicios de caja duplicados. El instalador NSIS por usuario fue generado correctamente en CI.

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

La compilación y el empaquetado de Windows terminaron correctamente en el [job `windows-desktop` de GitHub Actions](https://github.com/floxcristian/corporate-pos/actions/runs/37151843645/job/111287161510), finalizado el **3 de octubre de 2026 a las 20:37:51 UTC**. Ejecutó `npm run desktop:build` con Rust 1.90.0 para el commit [`0d09abc01ca0d0314d51056e2f7d1eaf8027d256`](https://github.com/floxcristian/corporate-pos/commit/0d09abc01ca0d0314d51056e2f7d1eaf8027d256).

El artefacto **`corporate-pos-windows-demo`** contiene `Corporate POS_0.1.0_x64-setup.exe` (2.035.184 bytes) y el `Cargo.lock` generado por esa misma compilación. El lockfile fue recuperado sin modificaciones en `apps/pos-desktop/src-tauri/Cargo.lock`; fija también las dependencias transitivas del build exitoso. La copia de esta revisión está en `dist/installers/0d09abc/target/release/bundle/nsis/`, directorio ignorado por Git. El hash del lockfile del artefacto coincide con el versionado.

| Archivo del artefacto               | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `Corporate POS_0.1.0_x64-setup.exe` | `77b0a0a71ac10856c77a439e7970fdea48af64f1c212281a3d31ce59f013b1d4` |
| `Cargo.lock`                        | `d0de437f15583981a9420589b81eafdf0c746048a78aeed3d4a6d698f3d941e2` |

**El instalador no se ha ejecutado ni instalado en el equipo local.** La evidencia confirma compilación y empaquetado en CI, no una prueba de apertura o uso del programa nativo. El entorno local sigue sin Cargo/Rust ni MSVC. Falta comprobar la interfaz dentro de WebView2 y su comportamiento en los equipos objetivo. El instalador de demostración no tiene firma comercial.

Las versiones directas de Tauri están fijadas en `Cargo.toml`. Los iconos pertenecen al proyecto, se generan desde una figura geométrica propia y no incluyen Font Awesome Pro.

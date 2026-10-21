# Cliente móvil Angular y Capacitor

`apps/pos-mobile` contiene un cliente Angular con arranque propio y un host Capacitor para Android e iOS. Consume `libs/client-shell` y los componentes, estilos y activos de `libs/ui`; no depende del build de escritorio. La [decisión de clientes nativos](decisions/native-clients.md) explica la separación y sus límites.

La UI transversal permanece hoy en `libs/ui`; su destino acordado es `libs/shared/frontend/ui`. `client-shell` conserva su responsabilidad de composición fuera del grupo técnico shared. Ver la [correspondencia del monorepo](monorepo.md#correspondencia-con-el-checkout-actual).

## Comandos

Desde la raíz del monorepo, con las dependencias instaladas mediante `npm ci`:

| Comando | Resultado |
| --- | --- |
| `npm run mobile:start` | Sirve la interfaz Angular móvil para desarrollo local en `http://127.0.0.1:4301` |
| `npm run mobile:build` | Genera el bundle Angular en `dist/apps/pos-mobile/browser` |
| `npm run mobile:sync:android` | Prepara el bundle y sincroniza el proyecto Android |
| `npm run mobile:sync:ios` | Prepara el bundle y sincroniza el proyecto iOS |
| `npm run mobile:android` | Ejecuta el cliente Android mediante Capacitor, con toolchain y dispositivo/emulador disponibles |
| `npm run mobile:ios` | Ejecuta el cliente iOS mediante Capacitor, en macOS con Xcode y destino disponible |

Capacitor copia el bundle compilado al proyecto nativo durante `sync`; no compila la interfaz Angular por sí solo. Los comandos del monorepo coordinan esas etapas. Actualizar código compartido requiere construir y sincronizar nuevamente antes de probar en el host. [Flujo oficial de Capacitor](https://capacitorjs.com/docs/basics/workflow).

## Entorno nativo

La base usa Capacitor 8.5.3 y `@capacitor/app` 8.1.2, con dependencias declaradas en el workspace de `apps/pos-mobile`. Android usa SDK 36, API mínima 24 y Java 21; requiere Android Studio y un dispositivo o emulador compatible. iOS usa un destino mínimo 15, Swift Package Manager y Xcode 26 o posterior en macOS. Revisar los [requisitos oficiales](https://capacitorjs.com/docs/getting-started/environment-setup) antes de preparar el agente de build. Un equipo Windows puede trabajar en la interfaz y el proyecto Android, pero no sustituye al entorno de compilación de iOS.

El identificador de aplicación es `com.implementos.posplatform.mobile`. Los proyectos nativos conservan su configuración por plataforma; las credenciales de firma y distribución deben configurarse fuera del repositorio. La generación de una base Android/iOS no equivale a publicación en tiendas ni distribución empresarial.

El host carga recursos empaquetados, sin `server.url` remoto ni tráfico HTTP sin cifrar. Android conserva sólo el permiso de red del WebView, sin permisos de cámara o pagos, y desactiva el respaldo automático. El botón Atrás utiliza el comportamiento de historial de Capacitor; no se introduce un flujo de salida o cierre de turno. La CSP de `apps/pos-mobile/src/index.html` se aplica al bundle y su vista previa. Estas configuraciones requieren verificación en el dispositivo; no acreditan almacenamiento seguro de sesión ni operación bancaria.

### Alerta en las herramientas de iOS

La revisión del 21 de octubre de 2026 mantiene una alerta moderada en `@capacitor/cli` 8.5.3 → `xcode` 3.0.1 → `uuid`. El aviso [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) afecta a los métodos `v3()`, `v5()` y `v6()` cuando reciben un buffer de salida externo. El código instalado de `xcode`, en `lib/pbxProject.js`, genera identificadores mediante `uuid.v4()` sin buffer; esa llamada no coincide con la condición vulnerable descrita. La dependencia pertenece a las herramientas de generación de proyectos, no al bundle Angular móvil.

La alerta sigue pendiente: esta revisión de la llamada no significa que el paquete esté corregido. Capacitor CLI 8.5.3 es la última versión estable comprobada y todavía depende de `xcode` 3.x. Conservar las versiones fijadas, revisar la corrección upstream y repetir `npm audit` al actualizar; no aplicar un downgrade automático ni sustituir dependencias mediante overrides.

## Alcance comprobable

El cliente conserva el login y los recorridos de datos sintéticos del prototipo. No agrega autenticación real, un almacén seguro de credenciales, persistencia transaccional móvil ni sincronización de ventas en segundo plano. Tampoco habilita pagos, cámara, lectores, impresoras u otras capacidades nativas sin sus contratos, permisos e integración específica.

La verificación del bundle y los recorridos de navegador se distingue de la apertura en Android/iOS. Antes de afirmar soporte nativo deben probarse instalación, acceso, teclado, orientación, áreas seguras, suspensión/reanudación, pérdida de conectividad y recuperación en dispositivos representativos. Los permisos, firma y distribución se validan por plataforma. La prueba de un viewport móvil en Chromium no cubre esas condiciones.

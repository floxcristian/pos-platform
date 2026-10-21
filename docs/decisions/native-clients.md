# ADR-14 · Clientes de escritorio y móvil independientes

**Estado:** decisión aceptada el 21 de octubre de 2026. **Alcance:** composición del cliente y artefactos de entrega. No acredita operación productiva ni homologación de sistemas operativos, dispositivos o proveedores.

## Decisión

POS Platform tiene dos aplicaciones cliente: `apps/pos-desktop`, con Angular y Tauri para el puesto de escritorio, y `apps/pos-mobile`, con Angular y Capacitor para Android e iOS. Cada aplicación posee su arranque, configuración del host y build. Se elimina `pos-web`: el producto no necesita una tercera aplicación para publicar una demo en navegador.

El servidor Angular de desarrollo sigue disponible para trabajar y probar la interfaz. No constituye otro cliente de producto ni una oferta PWA. Vercel publica únicamente la documentación Starlight en `/guide/`; la entrada `/` redirige a la guía.

## Código compartido y dependencias

`libs/client-shell` compone `AppComponent`, `createClientConfig(platform)`, rutas, guards y shell. Tiene tags `type:shell` y `env:browser`. Las aplicaciones eligen su plataforma y arrancan Angular desde sus propios `main.ts`; no importan otra aplicación ni copian el shell.

```mermaid
flowchart TB
    Desktop["pos-desktop · Angular + Tauri"] --> Shell["client-shell · configuración, rutas y navegación"]
    Mobile["pos-mobile · Angular + Capacitor"] --> Shell
    Shell --> Features["features · pantallas y recorridos"]
    Shell --> UI["ui · componentes, tokens, assets y estilos"]
    Features --> UI
    Features --> Data["data-access · adaptadores mock actuales"]
    Data --> Domain["domain · reglas actuales del prototipo"]
```

Las flechas representan imports de código. `libs/ui/assets` y `libs/ui/src/styles.css` sirven a ambos builds. El shell reutiliza las mismas features y adaptadores; no se crean copias de ventas, pagos o permisos por sistema operativo. `libs/client-shell` no es un proceso ni un despliegue adicional. Su composición pertenece al cliente, por eso no se convierte en una biblioteca técnica genérica bajo `shared`.

El código nativo y sus permisos pertenecen al host correspondiente. Una integración de periféricos requiere un contrato de capacidad y un adaptador homologado; añadir Tauri o Capacitor no habilita por sí solo impresoras, lectores ni cobros. Las features compartidas no deben depender directamente de SDK de Tauri o Capacitor.

## Datos y acceso

La dirección de backend no cambia: los dos clientes consumirán la API autorizada de sucursal; PostgreSQL conserva la autoridad transaccional de la tienda. No se incorpora una base SQL de ventas por móvil ni acceso directo a la base desde la interfaz.

El cliente móvil depende de la conectividad autorizada al backend para las operaciones que la requieran. Compartir interfaz no habilita venta fuera de la sucursal, operación sin LAN, acceso remoto público ni permisos adicionales. Esos recorridos necesitan una decisión y pruebas propias.

Actualmente ambos clientes conservan datos sintéticos y adaptadores mock. No se implementan autenticación corporativa, almacenamiento seguro de credenciales ni nuevas operaciones comerciales mediante esta separación. Tauri mantiene `com.floxcristian.corporatepos` por compatibilidad; Capacitor utiliza `com.implementos.posplatform.mobile`. Sus almacenes locales son independientes: compartir código no sincroniza datos ni sesiones entre dispositivos.

## Entrega y verificación

| Etapa | Qué acredita | Qué queda por comprobar |
| --- | --- | --- |
| Build Angular de cada cliente | Su configuración y bundle se compilan | Ejecución dentro del host nativo |
| Pruebas de navegador | Recorridos compartidos y comportamiento adaptable en el entorno probado | Permisos, ciclo de vida, almacenamiento y APIs del dispositivo |
| Sincronización Capacitor | Copia del bundle y actualización de dependencias del proyecto nativo | Compilación e instalación Android/iOS |
| Empaquetado Tauri o compilación móvil | Generación del artefacto en la plataforma usada | Firma, distribución, instalación, operación y recuperación sobre equipos reales |
| Homologación | Comportamiento observado para el dispositivo, versión y proveedor probados | Plataformas o capacidades fuera de ese alcance |

Las guías de [escritorio](../desktop.md) y [móvil](../mobile.md) mantienen los comandos y prerrequisitos, sin duplicarlos aquí. El [catálogo del monorepo](../monorepo.md) registra seis aplicaciones operativas y `pos-docs` como séptima aplicación documental.

## Consecuencias y alternativas

Esta separación permite evolucionar permisos, integración nativa, empaquetado y distribución por plataforma, conservando una sola implementación de las pantallas compartidas. Exige verificar los dos builds y probar los hosts de manera independiente; el resultado de Windows no certifica Android o iOS.

Mantener `pos-web` como aplicación compartida haría depender los hosts de una tercera aplicación cuyo despliegue ya no se requiere. Copiar la interfaz en cada cliente produciría deriva de reglas, accesibilidad y experiencia. El shell compartido conserva la reutilización y deja explícita la composición de cada aplicación.

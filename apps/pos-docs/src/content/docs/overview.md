---
title: Visión general de la solución
description: Producto compartido, operación en sucursal, integración por país y estado real de implementación de POS Platform.
editUrl: false
prev: false
next:
  label: Producto, alcance y países
  link: /guide/proposal/product/
---

**POS Platform es la propuesta de un producto corporativo de punto de venta para Chile, Perú y España.** Comparte las reglas y los casos de uso de venta, caja, precios y pagos. Cada país selecciona su configuración y sus integraciones fiscales, bancarias y ERP. La continuidad durante una caída de Internet es uno de sus requisitos, junto con integridad de las operaciones, permisos, extensibilidad y mantenimiento común.

## Qué se comparte y qué cambia

El **núcleo común** son los módulos de negocio y sus contratos de código. Por ejemplo, una venta conserva su identidad, sus líneas, importes y estados en cualquier país. Ese núcleo se ejecuta en aplicaciones con responsabilidades diferentes; no significa un único servidor mundial.

El **perfil de país** selecciona moneda, reglas, documentos y proveedores compatibles para una entidad legal. Un **adaptador** implementa la conexión concreta con AX, Gira, un ERP custom o un proveedor fiscal. Cambiar un valor de configuración permite elegir un adaptador ya soportado; incorporar un proveedor nuevo requiere código, pruebas y homologación. Los perfiles de usuario —cajero, administrador u otros accesos— pertenecen a la autorización, no a esta configuración de país.

[Alcance del producto y variantes](/guide/proposal/product/) · [Contratos y adaptadores](/guide/proposal/contracts/)

## Dónde funciona cada responsabilidad

| Zona | Responsabilidad propuesta | Datos que conserva |
| --- | --- | --- |
| Puesto de caja | Presentar la operación con Angular; Tauri permite empaquetarla y acceder a capacidades nativas autorizadas. | Interfaz y preferencias; el puente de periféricos puede conservar evidencia técnica durable de sus comandos. La autoridad de ventas permanece en sucursal. |
| Servidor de sucursal | Validar permisos, calcular precios con datos locales y confirmar ventas, pagos registrados y movimientos de caja. | PostgreSQL guarda las operaciones y sus eventos pendientes en una misma transacción. |
| Sincronizador de sucursal | Entregar operaciones a central, recibir maestros y preparar versiones comerciales. | Identidades de mensajes, pendientes y avances persistidos en PostgreSQL de sucursal. |
| Plataforma de país | Aceptar operaciones, consolidar información, distribuir datos e integrar el ERP y los proveedores de su ámbito. | PostgreSQL operativo de país y estados de integración. El ERP conserva su responsabilidad financiera pactada. |

En el perfil inicial, **varias cajas comparten el servidor y la base de su sucursal**. Una caída de Internet permite continuar las operaciones expresamente habilitadas, mientras la red local, el servidor y las dependencias necesarias funcionen. La caída de ese servidor es otro escenario: autonomía por terminal requiere una decisión adicional y no se activa automáticamente.

[Aplicaciones, datos y contratos](/guide/proposal/architecture/) · [Diagramas C4](/guide/diagrams/) · [Condiciones de continuidad](/guide/proposal/continuity/)

## Una venta, de principio a fin

Ejemplo ilustrativo de una operación permitida con datos vigentes:

1. El operador prepara la venta en la caja. El backend valida su acceso y obtiene el precio desde una versión local completa de reglas y datos comerciales.
2. Antes del pago, valida vigencia, permisos y capacidades disponibles. Persiste la intención y la identidad del intento. El medio de pago sigue su contrato: se registra efectivo o se solicita y consulta la autorización correspondiente. Un resultado incierto queda pendiente de recuperación; no se vuelve a cobrar a ciegas.
3. Conforme al resultado y las reglas del medio de pago, el backend confirma los cambios locales de negocio y el evento pendiente en **la misma transacción PostgreSQL**. Ese commit es la confirmación de persistencia en la sucursal.
4. El sincronizador entrega el evento conservando su identidad. Si debe reenviarlo, central reconoce el duplicado y evita repetir el efecto local acordado.
5. Central confirma su aceptación durable. La integración ERP se procesa y concilia posteriormente. Venta local, resultado del pago, documento fiscal y registro ERP conservan estados separados.

La **outbox** es el registro de eventos pendientes junto al negocio; la **inbox** identifica mensajes recibidos y permite recuperar su procesamiento. Son registros persistidos, no aplicaciones adicionales. El [recorrido de venta](/guide/proposal/continuity/) muestra las etapas y el [contrato de sincronización](/guide/proposal/synchronization/) precisa los acuses y los fallos.

## Cómo encaja el código

Las aplicaciones de `apps/` arrancan procesos o interfaces. Las bibliotecas de `libs/` agrupan reglas, casos de uso, contratos e integraciones; una biblioteca no exige un despliegue propio. Nx organiza proyectos y tareas de construcción. Sus límites deben impedir que una función de ventas escriba directamente en los datos de otro módulo.

El [catálogo del monorepo](/guide/architecture/monorepo/) es la referencia de nombres y estructura. Distingue la maqueta web, las bases técnicas locales y las capacidades que todavía deben implementarse. Incluye la [correspondencia desde Mountain y otros repositorios](/guide/architecture/monorepo/#correspondencia-del-legacy-con-pos-platform).

## Estado de la propuesta

| Estado | Qué se puede afirmar |
| --- | --- |
| Dirección indicada | Angular + Tauri para el cliente y Nx para organizar el código. La homologación y operación del producto siguen pendientes. |
| Diseño recomendado | Backend modular NestJS/Fastify, PostgreSQL de sucursal y país, sincronización recuperable y adaptadores por capacidad. Requieren aprobación y piloto. |
| Base de código revisada | Existen una maqueta y scaffolding local. El catálogo distingue lo presente de lo propuesto y registra el alcance de esa revisión. |
| Legacy observado | Mountain ya tiene login, perfiles y accesos a módulos. Los informes fijan los snapshots y las limitaciones; no prueban la configuración productiva. |
| Por acordar | Matriz de operaciones offline, vigencias y recotización, proveedores, límites por país, recuperación, capacidad y criterios cuantitativos de aceptación. |

El [registro de decisiones](/guide/proposal/decisions/) fija los motivos y las condiciones de aprobación. La [validación del piloto](/guide/operations/validation/) define las evidencias necesarias. Las simulaciones explican el comportamiento propuesto; las garantías se demuestran mediante esas pruebas y la homologación.

[Mapa de contenidos](/guide/contents/) · [Glosario con el significado aplicado al POS](/guide/glossary/)

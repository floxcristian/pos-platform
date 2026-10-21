/** Editorial map. Markdown under docs/ remains the source of architectural decisions. */
export const siteBase = '/guide/';
export const docsOrigin = 'https://pos-platform-tau.vercel.app';
export const presentationOrigin = 'https://presentation-gamma-rust.vercel.app';
export const repositoryOrigin = 'https://github.com/floxcristian/pos-platform';
export const presentationRepository = 'https://github.com/floxcristian/pos-architecture';
export const generatedDirectories = ['proposal', 'architecture', 'operations', 'evidence', 'reference', 'implementation'];
export const sourceRouteAliases = {
  'docs/referencias': 'evidence/background',
  'docs-site/README.md': 'reference/maintenance',
  'presentation/README.md': 'reference/presentation',
  'presentation/CONTENT_NOTES.md': 'reference/editorial-notes',
  'presentation/tools/narration-pipeline.md': 'reference/narration-pipeline',
  'video/README.md': 'reference/video-publication',
};

// Reader-facing status is shared by every generated page, not inferred from its title.
export const documentKinds = {
  proposal: { label: 'Propuesta de producto', detail: 'Diseño objetivo. El registro de decisiones distingue las direcciones indicadas de las recomendaciones pendientes.', link: 'proposal/decisions' },
  design: { label: 'Diseño de implementación', detail: 'Contratos y estructura propuestos; su presencia aquí no acredita funcionamiento productivo.', link: 'proposal/decisions' },
  research: { label: 'Análisis de alternativas', detail: 'Fundamentos y condiciones de evaluación. La recomendación vigente está en el registro de decisiones.', link: 'proposal/decisions' },
  evidence: { label: 'Evidencia del sistema actual', detail: 'Lectura de fuentes y snapshots identificados. La versión desplegada y las garantías operativas requieren confirmación.', link: 'evidence/audit' },
  reference: { label: 'Referencia y mantenimiento', detail: 'Material de consulta. No introduce decisiones de producto ni acredita su implementación.', link: 'contents' },
  historical: { label: 'Antecedente del explorador', detail: 'Describe el explorador y sus revisiones anteriores. La propuesta en Reveal y la guía actual tienen alcances propios.', link: 'reference/presentation' },
  implementation: { label: 'Implementación del monorepo', detail: 'Describe el código, los comandos y los límites de la base actual. Una demostración o un scaffold no acredita capacidades productivas.', link: 'implementation/monorepo' },
};

// A bounded route through the proposal; reference material is consulted on demand.
export const readingPath = [
  { route: 'overview', title: 'Visión general de la solución' },
  { route: 'proposal/product', title: 'Producto, alcance y países' },
  { route: 'proposal/architecture', title: 'Aplicaciones, datos y responsabilidades' },
  { route: 'architecture/monorepo', title: 'Monorepo y límites de módulos' },
  { route: 'proposal/continuity', title: 'Venta y continuidad operativa' },
  { route: 'proposal/pricing-promotions', title: 'Precios y ofertas locales' },
  { route: 'proposal/synchronization', title: 'Sincronización y propiedad de datos' },
  { route: 'proposal/contracts', title: 'Contratos, fachada y ACL' },
  { route: 'proposal/access-operations', title: 'Acceso, permisos y operación' },
  { route: 'proposal/fiscal-compliance', title: 'Fiscalidad y documentos' },
  { route: 'proposal/decisions', title: 'Registro de decisiones' },
  { route: 'operations/validation', title: 'Validación y criterios del piloto' },
];

const proposalSource = 'docs/propuesta-arquitectura.md';
const proposal = (route, title, description, from, to, extra = {}) => ({
  route: `proposal/${route}`, title, description, source: proposalSource,
  range: { from, to }, kind: 'proposal', ...extra,
});
const reference = (route, source, title, description, kind = 'reference') => ({ route, source, title, description, kind });

export const generatedPages = [
  proposal('product', 'Producto, alcance y países', 'Objetivo corporativo, módulos compartidos, variantes por país y alcance de la propuesta.', null, 'Evolución desde la arquitectura actual de Chile'),
  proposal('evolution', 'Evolución desde Chile', 'Punto de partida, continuidad por sucursal y límites de la migración desde Mountain.', 'Evolución desde la arquitectura actual de Chile', 'Independencia del POS y referencias de organización'),
  proposal('corporate-reuse', 'POS independiente y referencias', 'Organización propia con shared; Core como referencia y alternativas históricas de plataforma.', 'Independencia del POS y referencias de organización', 'Arquitectura de referencia: perfil WAN preferente'),
  proposal('architecture', 'Aplicaciones, datos y responsabilidades', 'Cliente POS, backend de sucursal, plataforma de país y contratos de los contenedores.', 'Arquitectura de referencia: perfil WAN preferente', 'Funcionamiento sin conexión'),
  proposal('continuity', 'Venta y continuidad operativa', 'Confirmación local, límites ante pérdida de WAN y recuperación de pagos o impresiones inciertos.', 'Funcionamiento sin conexión', 'Sincronización y consistencia', { flow: 'sale', labs: ['laboratorio-venta'] }),
  proposal('synchronization', 'Sincronización y propiedad de datos', 'Outbox, inbox, acuses durables, deduplicación y autoridades por dato.', 'Sincronización y consistencia', 'Evaluación local de ofertas', { labs: ['laboratorio-entrega'] }),
  proposal('pricing-promotions', 'Precios y ofertas locales', 'Reglas versionadas, evaluación local y activación completa de datos comerciales.', 'Evaluación local de ofertas', 'Integración de los sistemas actuales', { flow: 'pricing', labs: ['laboratorio-eventos-precios', 'laboratorio-snapshot-precios'] }),
  proposal('integration', 'Integración por país', 'Relación con Dynamics AX, Gira y el sistema de Perú mediante contratos comunes y conciliación.', 'Integración de los sistemas actuales', 'Estandarización y evolución hacia un ERP común'),
  proposal('contracts', 'Contratos, fachada y ACL', 'Vocabulario del POS, límites de integración y traducción de los modelos externos.', 'Estandarización y evolución hacia un ERP común', 'Coexistencia y corte de ERP', { labs: ['laboratorio-frontera-erp'] }),
  proposal('erp-migration', 'Coexistencia y cambio de ERP', 'Destino persistido, corte por dominio y conciliación durante la migración de ERP.', 'Coexistencia y corte de ERP', 'Fiscalidad y documentos por país'),
  proposal('fiscal-compliance', 'Fiscalidad y documentos', 'Variantes fiscales de Chile, Perú y España y condiciones que necesitan validación.', 'Fiscalidad y documentos por país', 'Seguridad y operación'),
  proposal('access-operations', 'Acceso, permisos y operación', 'Login y perfiles existentes, autorización propuesta, auditoría y operación segura.', 'Seguridad y operación', 'Servicios de inteligencia artificial propuestos'),
  proposal('ai', 'Servicios de IA propuestos', 'Asistencia y automatización acotadas, con fuentes, permisos y control humano.', 'Servicios de inteligencia artificial propuestos', 'Tecnología y despliegue propuestos'),
  proposal('technology', 'Tecnología y despliegue', 'Dirección de cliente, backend recomendado, PostgreSQL y despliegue gradual.', 'Tecnología y despliegue propuestos', 'Decisiones de arquitectura'),
  proposal('decisions', 'Registro de decisiones', 'Decisiones de arquitectura, alternativas, estado y condiciones de aprobación.', 'Decisiones de arquitectura', null),
  reference('architecture/native-clients', 'docs/decisions/native-clients.md', 'Clientes de escritorio y móvil', 'Decisión aceptada: arranques independientes, shell compartido, Tauri y Capacitor; entrega y límites de verificación.', 'design'),
  reference('architecture/c4-model', 'docs/c4-arquitectura-propuesta.md', 'Modelo C4 y contratos', 'Alcance, notación y responsabilidades de las vistas C1, C2, C3 y despliegue.', 'design'),
  reference('architecture/drawio', 'docs/diagramas-drawio/README.md', 'Diagramas editables en draw.io', 'Atlas de siete vistas, archivos individuales y conversión desde las fuentes de Excalidraw.', 'reference'),
  { ...reference('architecture/technologies', 'docs/opciones-tecnologicas.md', 'Evaluación tecnológica', 'NestJS, Fastify, PostgreSQL, observabilidad y clientes Tauri/Capacitor: razones y condiciones de adopción.', 'design'), range: { from: null, to: '5. Monorepo con Nx' } },
  { ...reference('architecture/monorepo', 'docs/opciones-tecnologicas.md', 'Monorepo y límites de módulos', 'Aplicaciones, bibliotecas, contratos y unidades de ejecución del producto POS.', 'design'), range: { from: '5. Monorepo con Nx', to: null } },
  reference('architecture/providers', 'docs/extensibilidad-proveedores-dispositivos.md', 'Proveedores y dispositivos', 'Contratos y capacidades para fiscalidad, pagos, impresión y periféricos.', 'design'),
  { ...reference('architecture/messaging', 'docs/investigacion-mensajeria-pos.md', 'Mensajería: criterios y alternativas', 'Evaluación de WSO2, RabbitMQ, BullMQ y trabajo durable según el tipo de carga.', 'research'), labs: ['laboratorio-bullmq', 'laboratorio-rabbitmq'] },
  reference('architecture/ai', 'docs/servicios-ia-pos.md', 'Diseño de servicios de IA', 'Casos de asistencia, acceso a fuentes, límites de automatización y criterios de validación.', 'design'),
  reference('architecture/rfid', 'docs/evolucion-rfid-autoservicio.md', 'RFID y autoservicio', 'Evolución opcional y condiciones para incorporar identificación por radio y autoservicio.', 'design'),
  reference('operations/cash-management', 'docs/operacion-caja-y-evolucion.md', 'Operación de caja', 'Turnos, pagos, movimientos y evolución de los procesos actuales.', 'reference'),
  reference('operations/resilience', 'docs/revision-resiliencia-datos-pos.md', 'Resiliencia y recuperación', 'Fallos, estados inciertos, durabilidad, retención y recuperación por responsabilidad.', 'research'),
  reference('operations/validation', 'docs/validacion-y-decisiones.md', 'Validación y criterios del piloto', 'Pruebas propuestas y decisiones pendientes para validar la arquitectura.', 'design'),
  reference('operations/open-items', 'docs/solicitud-informacion-equipo.md', 'Información y decisiones pendientes', 'Evidencia, responsables y datos que faltan para cerrar la arquitectura.', 'reference'),
  reference('evidence/current-state', 'docs/vistas-arquitectura-y-flujos.md', 'Vistas actuales y recorridos', 'Reconstrucción de Chile y secuencias contrastadas con los recorridos propuestos.', 'evidence'),
  reference('evidence/integration-catalog', 'docs/catalogo-integraciones-actuales.md', 'Catálogo de integraciones', 'Rutas, aplicaciones, contratos y fuentes del sistema analizado.', 'evidence'),
  reference('evidence/data-flows', 'docs/recorridos-datos-tablas.md', 'Recorridos de datos y tablas', 'Lecturas, escrituras y límites de commit de cinco recorridos del sistema actual.', 'evidence'),
  reference('evidence/repositories', 'docs/mapa-repositorios-y-conexiones.md', 'Mapa de repositorios', 'Repositorios revisados, relaciones y responsabilidades verificadas.', 'evidence'),
  reference('evidence/chile-operations', 'docs/contraste-apuntes-operacion-chile.md', 'Contraste de operación en Chile', 'Información recibida sobre la operación y su contraste con el código.', 'evidence'),
  reference('evidence/background', 'docs/antecedentes-presentacion-chile.md', 'Antecedentes de Chile', 'Lectura de la presentación y diagramas recibidos como antecedentes.', 'evidence'),
  reference('evidence/branches', 'docs/cobertura-publica-sucursales.md', 'Inventario público de sucursales', 'Fuentes públicas de tiendas; no representa el inventario de despliegues POS.', 'evidence'),
  reference('evidence/audit', 'docs/analisis-repositorios/README.md', 'Alcance de la revisión de código', 'Método, snapshots, conclusiones y límites de la inspección estática.', 'evidence'),
  reference('evidence/mountain', 'docs/analisis-repositorios/mountain-implementos.md', 'Mountain: cliente y backend', 'Login, perfiles, ventas, precios, caja y hallazgos del repositorio Mountain.', 'evidence'),
  reference('evidence/branch-synchronizer', 'docs/analisis-repositorios/mountain-sync-sucursal.md', 'Sincronizador de sucursal', 'Preparación, entrega, recepción y reintentos del sincronizador actual.', 'evidence'),
  reference('evidence/central-hub', 'docs/analisis-repositorios/mountain-concentrador.md', 'Concentrador central', 'Artefactos centrales, alcance de la revisión y límites de despliegue.', 'evidence'),
  reference('evidence/central-ingestion', 'docs/analisis-repositorios/mountain-concentrador-ingreso.md', 'Concentrador: ingreso y procesamiento', 'Custodia, persistencia y procesamiento de los mensajes centrales.', 'evidence'),
  reference('evidence/master-data-distribution', 'docs/analisis-repositorios/mountain-concentrador-maestros.md', 'Concentrador: distribución de maestros', 'Preparación, lotes y distribución central hacia sucursales.', 'evidence'),
  reference('evidence/apis', 'docs/analisis-repositorios/apis-implementos.md', 'APIs de Implementos', 'Servicios compartidos, precios y relaciones con los sistemas externos.', 'evidence'),
  reference('evidence/payments', 'docs/analisis-repositorios/api-pagos-caja.md', 'API de pagos de caja', 'Procesos del adaptador de pagos, estados y condiciones por verificar.', 'evidence'),
  reference('evidence/printing', 'docs/analisis-repositorios/api-impresion-caja.md', 'API de impresión de caja', 'Contratos de impresión, dependencias locales y límites de la evidencia.', 'evidence'),
  reference('evidence/core', 'docs/analisis-repositorios/core.md', 'Core corporativo', 'Capacidades revisadas de la plataforma de integración corporativa.', 'evidence'),
  reference('evidence/devops', 'docs/analisis-repositorios/devops-platform.md', 'DevOps Platform', 'Acciones y flujos corporativos de construcción y despliegue revisados.', 'evidence'),
  reference('evidence/corporate-reuse', 'docs/analisis-repositorios/aportes-plataforma-corporativa.md', 'Evaluación corporativa histórica', 'Evidencia y alternativas históricas; la decisión vigente mantiene el POS independiente de Core.', 'evidence'),
  reference('reference/corporate-review', 'docs/revision-arquitectura-corporativa.md', 'Revisión y alternativas corporativas', 'Motivos y alternativas de la revisión histórica, con decisiones posteriores identificadas.', 'research'),
  reference('reference/coverage', 'docs/cobertura-documentacion-presentacion.md', 'Cobertura del explorador y antecedentes', 'Registro de cobertura del explorador anterior y relación con las fuentes; no es una auditoría de Reveal.', 'historical'),
  reference('reference/explorer', 'docs/visor-interacciones-componentes.md', 'Visor de aplicaciones y recorridos', 'Accesos a las vistas de componentes, datos y simulaciones de la presentación.', 'reference'),
  reference('reference/editable-diagrams', 'docs/diagramas-excalidraw/README.md', 'Edición y fuentes de diagramas', 'Archivos editables, alcance y mantenimiento de los diagramas de Excalidraw.', 'reference'),
  reference('reference/integration-presentations', 'docs/analisis-repositorios/integration-presentations.md', 'Referencia de Integration Platform', 'Alcance del material de presentación utilizado como referencia.', 'reference'),
  reference('reference/repository', 'docs/editorial/repository-background.md', 'Repositorio y antecedentes', 'Origen de la documentación, referencia histórica del análisis y ubicación actual de sus fuentes.', 'reference'),
  reference('reference/presentation', 'docs/editorial/presentation.md', 'Presentación y publicación', 'Accesos a Reveal, narración y al manual mantenido en el repositorio de presentación.', 'reference'),
  reference('reference/editorial-notes', 'docs/editorial/editorial-notes.md', 'Notas editoriales del explorador', 'Acceso a los criterios del explorador, mantenidos en el repositorio de presentación.', 'historical'),
  reference('reference/maintenance', 'apps/pos-docs/README.md', 'Mantenimiento de la documentación', 'Fuentes, generación, diagramas, búsqueda y publicación de esta guía Starlight.', 'reference'),
  reference('reference/documentation-audit', 'docs/auditoria-documentacion.md', 'Auditoría de consistencia documental', 'Hallazgos, correcciones, fuentes canónicas, controles de calidad y validación pendiente con el equipo.', 'reference'),
  reference('reference/narration-pipeline', 'docs/editorial/narration-pipeline.md', 'Narrador: audio y sincronización', 'Acceso a la documentación canónica de guion, generación y publicación del audio.', 'reference'),
  reference('reference/video-publication', 'docs/editorial/video-publication.md', 'Video: producción y publicación', 'Acceso al video y a su procedimiento de producción, conservados con la presentación.', 'reference'),
  reference('implementation/repository', 'README.md', 'Repositorio POS Platform', 'Entrada al monorepo: aplicaciones, comandos, documentación y límites de implementación.', 'implementation'),
  reference('implementation/architecture', 'docs/architecture.md', 'Arquitectura de la implementación', 'Límites y dependencias de la base de código actual, diferenciados de la arquitectura objetivo.', 'implementation'),
  reference('implementation/monorepo', 'docs/monorepo.md', 'Estructura del monorepo', 'Estructura objetivo con shared, límites DDD, proyectos de pruebas y correspondencia con las rutas físicas actuales.', 'implementation'),
  reference('implementation/testing', 'docs/testing.md', 'Pruebas y proyectos E2E', 'Cobertura de los clientes, proyecto E2E objetivo y soporte compartido de pruebas; migración física pendiente.', 'implementation'),
  reference('implementation/api', 'docs/api.md', 'Base de API NestJS', 'Arranque, configuración, sondas, OpenAPI, Pino y Sentry opcional de la base backend; sin operaciones comerciales ni persistencia.', 'implementation'),
  reference('implementation/mock-api', 'docs/mock-api.md', 'Adaptadores de la demostración', 'Contratos mock, datos sintéticos y límites de los flujos del frontend.', 'implementation'),
  reference('implementation/desktop', 'docs/desktop.md', 'Cliente de escritorio', 'Empaquetado Tauri, comandos y alcance del contenedor de demostración.', 'implementation'),
  reference('implementation/mobile', 'docs/mobile.md', 'Cliente móvil', 'Cliente Angular y Capacitor, builds propios y límites de verificación nativa en Android e iOS.', 'implementation'),
  reference('implementation/security', 'docs/security.md', 'Seguridad y límites actuales', 'Alcance de seguridad del prototipo y condiciones que requiere una operación real.', 'implementation'),
  reference('implementation/iconography', 'docs/iconography.md', 'Iconografía y controles', 'Fuentes de iconos, tamaños, accesibilidad y generación de activos del producto.', 'implementation'),
  reference('implementation/product-review', 'docs/audit-chile-for-product.md', 'Contraste de Chile con el producto', 'Relación entre evidencia de la operación chilena y capacidades de la demostración.', 'implementation'),
  reference('implementation/plan', 'docs/implementation-plan.md', 'Plan de implementación', 'Etapas, alcance y verificaciones del desarrollo del producto.', 'implementation'),
  reference('implementation/quality-review', 'docs/quality-review.md', 'Revisión de la demostración', 'Hallazgos y comprobaciones de calidad de la maqueta, con su fecha y límites.', 'implementation'),
  reference('implementation/deployment', 'docs/vercel.md', 'Publicación de la documentación', 'Starlight en Vercel: configuración y verificación; clientes nativos y backend con entregas separadas.', 'implementation'),
];

export const labLinks = {
  'laboratorio-venta': 'Venta, pago y confirmación local',
  'laboratorio-eventos-precios': 'Precios por eventos',
  'laboratorio-snapshot-precios': 'Carga masiva de precios',
  'laboratorio-entrega': 'Entrega y acuse durable',
  'laboratorio-bullmq': 'BullMQ: trabajos centrales',
  'laboratorio-rabbitmq': 'RabbitMQ: distribución a consumidores',
  'laboratorio-frontera-erp': 'Fachada, ACL y adaptador ERP',
};
// Starlight applies Astro's base to sidebar links; body links are already public URLs.
const item = (route, label) => ({ label: label || generatedPages.find(page => page.route === route)?.title || route, link: '/' + route + '/' });
export const sidebar = [
  { label: 'Inicio', link: '/' },
  { label: 'Visión general de la solución', link: '/overview/' },
  { label: 'Mapa de contenidos', link: '/contents/' },
  { label: 'Glosario del POS', link: '/glossary/' },
  { label: 'Producto y alcance', collapsed: true, items: ['product', 'evolution', 'corporate-reuse'].map(route => item(`proposal/${route}`)) },
  { label: 'Arquitectura y estructura', collapsed: true, items: [item('proposal/architecture'), item('architecture/monorepo'), { label: 'Diagramas C4', link: '/diagrams/' }, item('architecture/c4-model'), item('architecture/native-clients'), item('architecture/drawio'), item('proposal/contracts'), item('proposal/technology'), item('architecture/technologies'), item('architecture/providers'), item('architecture/messaging')] },
  { label: 'Flujos del producto', collapsed: true, items: ['continuity', 'pricing-promotions', 'synchronization', 'integration', 'erp-migration', 'fiscal-compliance', 'access-operations'].map(route => item(`proposal/${route}`)).concat([item('operations/cash-management')]) },
  { label: 'Decisiones y validación', collapsed: true, items: [item('proposal/decisions'), ...['validation', 'resilience', 'open-items'].map(route => item(`operations/${route}`))] },
  { label: 'Implementación y desarrollo', collapsed: true, items: generatedPages.filter(page => page.route.startsWith('implementation/')).map(page => item(page.route)) },
  { label: 'Extensiones opcionales', collapsed: true, items: [item('proposal/ai'), item('architecture/ai'), item('architecture/rfid')] },
  { label: 'APIs y configuración del legacy', collapsed: true, items: [{ label: 'Mountain: backend de sucursal', link: '/api/mountain/' }, { label: 'Mountain: monitor concentrador', link: '/api/mountain-concentrator/' }, { label: 'Mountain: variables de entorno', link: '/api/mountain-configuration/' }] },
  { label: 'Sistema actual y evidencia', collapsed: true, items: ['audit', 'repositories', 'integration-catalog', 'data-flows', 'current-state', 'chile-operations', 'background', 'branches'].map(route => item(`evidence/${route}`)).concat([{ label: 'Informes por repositorio', collapsed: true, items: ['mountain', 'branch-synchronizer', 'central-hub', 'central-ingestion', 'master-data-distribution', 'apis', 'payments', 'printing', 'core', 'devops', 'corporate-reuse'].map(route => item(`evidence/${route}`)) }]) },
  { label: 'Referencias y mantenimiento', collapsed: true, items: generatedPages.filter(page => page.route.startsWith('reference/')).map(page => item(page.route)) },
];

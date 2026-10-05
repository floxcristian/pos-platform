/** Stable identities for synthetic users; legacy labels support existing saved demos. */
export const DEMO_USER_NAMES = {
  admin: { id: 'user-admin', legacyName: 'Administrador Demo', name: 'Cristian Flores' },
  supervisor: { id: 'user-supervisor', legacyName: 'Supervisor Demo', name: 'Carlos Muñoz' },
  cashier: { id: 'user-cashier', legacyName: 'Cajero Demo', name: 'Daniela Rojas' },
  auditor: { id: 'user-auditor', legacyName: 'Auditor Demo', name: 'Valentina Torres' },
} as const;

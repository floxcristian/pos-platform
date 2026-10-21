/** Defence in depth for structured logs; business payloads must never be logged. */
const SENSITIVE_FIELDS = [
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'dsn',
  'sentryDsn',
  'email',
  'phone',
  'rut',
  'documentNumber',
  'cardNumber',
  'pan',
  'cvv',
  'cvc',
  'pin',
  'req',
  'res',
  'request',
  'response',
  'body',
  'headers',
] as const;

// Pino supports fixed-depth wildcards, not recursive paths. These cover the
// root and two nested object levels; arbitrary payloads remain prohibited.
export const LOG_REDACTION_PATHS = SENSITIVE_FIELDS.flatMap((field) => [
  `["${field}"]`,
  `*["${field}"]`,
  `*.*["${field}"]`,
]);

/** Raw error messages, causes and stacks may contain credentials or PII. */
export function serializeLogError(): { type: string } {
  return { type: 'Error' };
}

export function serializeLogContext(value: unknown): string {
  return typeof value === 'string' && /^[a-z][a-z\d_.:-]{0,95}$/iu.test(value) ? value : 'Application';
}

/** Nest can put an exception stack in context or derive msg from err.message. */
export function safeErrorLogFields(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const containsError = value instanceof Error || 'err' in value || 'error' in value;
  const unsafeContext = 'context' in value && serializeLogContext(value.context) !== value.context;
  if (!containsError && !unsafeContext) return undefined;
  const fields: Record<string, unknown> = { event: 'application.error', err: serializeLogError() };
  if ('error' in value) fields['error'] = serializeLogError();
  if ('context' in value) fields['context'] = serializeLogContext(value.context);
  if ('event' in value && typeof value.event === 'string' && /^[a-z][a-z\d_.]{0,95}$/u.test(value.event)) {
    fields['event'] = value.event;
  }
  if ('code' in value && typeof value.code === 'string' && /^[A-Z][A-Z\d_]{0,63}$/u.test(value.code)) {
    fields['code'] = value.code;
  }
  if ('statusCode' in value && typeof value.statusCode === 'number' && Number.isInteger(value.statusCode)) {
    fields['statusCode'] = value.statusCode;
  }
  return fields;
}

import { Result, failure, success } from '@corporate-pos/domain';
import { StorageAdapter } from './persistence';

/** Public credentials for the local demonstration; this is not a production authentication adapter. */
export const DEMO_PASSWORD = 'Demo123!';
export const AUTH_STORAGE_KEY = 'corporate-pos:auth:v1';

export interface AuthSession {
  userId: string;
  remember: boolean;
}

export interface AuthSessionRepository {
  read(): Result<AuthSession | null>;
  write(userId: string, remember: boolean): Result<AuthSession>;
  clear(): Result<void>;
}

/** Stores only the selected mock identity, separately from cash sessions and business data. */
export class LocalAuthSessionRepository implements AuthSessionRepository {
  constructor(
    private readonly sessionStorage: StorageAdapter | null,
    private readonly localStorage: StorageAdapter | null,
  ) {}

  read(): Result<AuthSession | null> {
    try {
      for (const [storage, remember] of [
        [this.sessionStorage, false],
        [this.localStorage, true],
      ] as const) {
        const raw = storage?.getItem(AUTH_STORAGE_KEY);
        if (!raw) continue;
        const value: unknown = JSON.parse(raw);
        if (
          !value ||
          typeof value !== 'object' ||
          !('version' in value) ||
          value.version !== 1 ||
          !('userId' in value) ||
          typeof value.userId !== 'string' ||
          !value.userId.trim() ||
          value.userId.length > 200
        )
          return failure('La sesión guardada no es válida. Vuelve a iniciar sesión.');
        return success({ userId: value.userId, remember });
      }
      return success(null);
    } catch {
      return failure('No se pudo leer la sesión guardada. Vuelve a iniciar sesión.');
    }
  }

  write(userId: string, remember: boolean): Result<AuthSession> {
    const target = remember ? this.localStorage : this.sessionStorage;
    const other = remember ? this.sessionStorage : this.localStorage;
    if (!target) return failure('El almacenamiento de sesión no está disponible en este navegador.');
    try {
      other?.removeItem(AUTH_STORAGE_KEY);
      target.setItem(AUTH_STORAGE_KEY, JSON.stringify({ version: 1, userId }));
      return success({ userId, remember });
    } catch {
      return failure('No se pudo guardar la sesión. Revisa el almacenamiento del navegador.');
    }
  }

  clear(): Result<void> {
    let failed = false;
    for (const storage of [this.sessionStorage, this.localStorage]) {
      try {
        storage?.removeItem(AUTH_STORAGE_KEY);
      } catch {
        failed = true;
      }
    }
    return failed
      ? failure('La sesión se cerró, pero no se pudo borrar el acceso guardado del navegador.')
      : success(undefined);
  }
}

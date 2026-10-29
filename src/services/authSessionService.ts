/**
 * AGROGESTIONA ERP - Servicio de Gestión de Sesiones y Persistencia
 * Implementa sesiones temporales (sessionStorage) vs persistentes (localStorage)
 * conforme a la opción "Mantener la sesión iniciada" solicitada en el Prompt Maestro.
 */

import { Usuario } from '../types/erp';

const SESSION_TEMP_KEY = 'agrogestiona_session_temp_v1';
const SESSION_PERSISTENT_KEY = 'agrogestiona_session_persistent_v1';
const LEGACY_STORAGE_KEY = 'erp_ovinos_auth_user_v1';

// Vigencia de sesión persistente: 7 días en milisegundos
const PERSISTENT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionData {
  user: Usuario;
  rememberMe: boolean;
  createdAt: number;
  expiresAt: number;
  token?: string;
}

/**
 * Guarda la sesión del usuario según la preferencia "Mantener la sesión iniciada"
 */
export const saveUserSession = (user: Usuario, rememberMe: boolean): void => {
  const now = Date.now();
  const sessionData: SessionData = {
    user: {
      ...user,
      activo: user.activo !== undefined ? user.activo : true,
      inhabilitado: false,
    },
    rememberMe,
    createdAt: now,
    expiresAt: rememberMe ? now + PERSISTENT_SESSION_TTL_MS : now + 12 * 60 * 60 * 1000,
  };

  try {
    if (rememberMe) {
      // Sesión persistente: Guardar en localStorage
      localStorage.setItem(SESSION_PERSISTENT_KEY, JSON.stringify(sessionData));
      // Limpiar sesión temporal si existía
      sessionStorage.removeItem(SESSION_TEMP_KEY);
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(user));
    } else {
      // Sesión temporal: Guardar exclusivamente en sessionStorage (se destruye al cerrar el navegador o pestaña)
      sessionStorage.setItem(SESSION_TEMP_KEY, JSON.stringify(sessionData));
      // Limpiar cualquier persistencia en localStorage para evitar que sobreviva al cierre del navegador
      localStorage.removeItem(SESSION_PERSISTENT_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (err) {
    console.error('[SessionService] Error al guardar sesión:', err);
  }
};

/**
 * Recupera la sesión activa actual validando vigencia, estado y mecanismo de persistencia
 */
export const getActiveUserSession = (): { user: Usuario; rememberMe: boolean } | null => {
  try {
    // 1. Primero verificar si hay una sesión temporal activa en la pestaña actual (sessionStorage)
    const tempRaw = sessionStorage.getItem(SESSION_TEMP_KEY);
    if (tempRaw) {
      const parsed: SessionData = JSON.parse(tempRaw);
      if (parsed && parsed.user && parsed.user.id_usuario) {
        // Verificar si está inhabilitado o expiró
        if (parsed.user.inhabilitado === true || parsed.user.activo === false) {
          clearUserSession();
          return null;
        }
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          clearUserSession();
          return null;
        }
        return { user: parsed.user, rememberMe: false };
      }
    }

    // 2. Si no hay sesión en sessionStorage, verificar si existe una sesión persistente autorizada en localStorage
    const persistentRaw = localStorage.getItem(SESSION_PERSISTENT_KEY);
    if (persistentRaw) {
      const parsed: SessionData = JSON.parse(persistentRaw);
      if (parsed && parsed.user && parsed.user.id_usuario) {
        // Validar vencimiento de la sesión persistente
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          console.info('[SessionService] La sesión persistente ha expirado.');
          clearUserSession();
          return null;
        }

        // Validar inhabilitación
        if (parsed.user.inhabilitado === true || parsed.user.activo === false) {
          console.warn('[SessionService] El usuario se encuentra inhabilitado.');
          clearUserSession();
          return null;
        }

        return { user: parsed.user, rememberMe: true };
      }
    }

    // 3. Compatibilidad con almacenamiento legado si el usuario no tenía el nuevo esquema
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsedUser = JSON.parse(legacyRaw);
      if (parsedUser && parsedUser.id_usuario && !parsedUser.inhabilitado && parsedUser.activo !== false) {
        return { user: parsedUser, rememberMe: false };
      }
    }
  } catch (err) {
    console.warn('[SessionService] Error al verificar sesión activa:', err);
    clearUserSession();
  }

  return null;
};

/**
 * Cierra la sesión activa de forma inmediata, invalidando credenciales y limpiando almacenamientos
 */
export const clearUserSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_TEMP_KEY);
    localStorage.removeItem(SESSION_PERSISTENT_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem('erp_ovinos_active_session_id');

    // Notificar al backend sobre el cierre de sesión si corresponde
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    // Evitar que el usuario vuelva a pantallas privadas con el botón "Atrás"
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch (err) {
    console.error('[SessionService] Error durante cierre de sesión:', err);
  }
};

/**
 * Actualiza los datos o permisos del usuario en la sesión activa sin alterar su tipo de persistencia
 */
export const refreshSessionUser = (updatedUser: Usuario): void => {
  try {
    const tempRaw = sessionStorage.getItem(SESSION_TEMP_KEY);
    if (tempRaw) {
      const parsed: SessionData = JSON.parse(tempRaw);
      parsed.user = updatedUser;
      sessionStorage.setItem(SESSION_TEMP_KEY, JSON.stringify(parsed));
      return;
    }

    const persistentRaw = localStorage.getItem(SESSION_PERSISTENT_KEY);
    if (persistentRaw) {
      const parsed: SessionData = JSON.parse(persistentRaw);
      parsed.user = updatedUser;
      localStorage.setItem(SESSION_PERSISTENT_KEY, JSON.stringify(parsed));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  } catch (err) {
    console.error('[SessionService] Error al actualizar usuario de sesión:', err);
  }
};

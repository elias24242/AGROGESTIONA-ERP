/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Servicio de Trazabilidad de Sesiones y Permanencia de Usuarios
 */

import { Usuario, RegistroSesion, Auditoria } from '../types/erp';
import { DatabaseState, saveDatabaseState, loadDatabaseState } from './sheetsService';
import { getFechaHoraArgentinaISO } from '../utils/dateUtils';

const ACTIVE_SESSION_ID_KEY = 'erp_ovinos_active_session_id';

/**
 * Formatea una duración en segundos a una cadena legible
 */
export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min ${seconds} seg`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds} seg`;
  }
  return `${seconds} seg`;
};

/**
 * Registra el inicio de sesión de un usuario
 */
export const startUserSession = (user: Usuario, state: DatabaseState): RegistroSesion => {
  if (!state.sesiones) {
    state.sesiones = [];
  }

  // Cerrar cualquier sesión activa previa del mismo usuario si quedó colgada
  const now = Date.now();
  const fechaStr = getFechaHoraArgentinaISO();

  state.sesiones.forEach(s => {
    if (s.id_usuario === user.id_usuario && s.estado === 'ACTIVA') {
      s.estado = 'CERRADA';
      s.fecha_cierre = fechaStr;
      const dur = Math.max(1, Math.floor((now - (s.timestamp_inicio || now)) / 1000));
      s.duracion_segundos = dur;
      s.duracion_formateada = formatDuration(dur);
    }
  });

  const device = typeof navigator !== 'undefined'
    ? navigator.userAgent.includes('Mobile')
      ? 'Dispositivo Móvil'
      : 'Navegador Web / Escritorio'
    : 'Servidor Web';

  const newSession: RegistroSesion = {
    id_sesion: `SES-${now}-${Math.floor(Math.random() * 1000)}`,
    id_usuario: user.id_usuario,
    username: user.username,
    nombre_completo: user.nombre_completo,
    rol_nombre: user.rol_nombre,
    fecha_inicio: fechaStr,
    timestamp_inicio: now,
    estado: 'ACTIVA',
    dispositivo: device,
  };

  state.sesiones.unshift(newSession);

  // Registro en el Libro de Auditoría
  const audit: Auditoria = {
    id_auditoria: `AUD-${now}`,
    id_usuario: user.id_usuario,
    username: user.username,
    fecha_hora: fechaStr,
    operacion: 'ALTA',
    tabla_afectada: 'sesiones',
    id_registro: newSession.id_sesion,
    valor_nuevo: JSON.stringify({
      username: user.username,
      rol: user.rol_nombre,
      inicio: fechaStr,
      estado: 'ACTIVA',
    }),
    motivo: `Inicio de sesión en el sistema: @${user.username} (${user.rol_nombre})`,
  };
  state.auditoria.unshift(audit);

  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, newSession.id_sesion);
  } catch (e) {}

  saveDatabaseState(state);
  return newSession;
};

/**
 * Registra el cierre de sesión calculando el tiempo de permanencia exacto
 */
export const closeUserSession = (
  user: Usuario,
  state: DatabaseState
): { session?: RegistroSesion; duracionTexto: string } => {
  if (!state.sesiones) {
    state.sesiones = [];
  }

  const now = Date.now();
  const fechaStr = getFechaHoraArgentinaISO();
  let activeId: string | null = null;

  try {
    activeId = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch (e) {}

  // Buscar la sesión activa correspondiente
  let session = state.sesiones.find(
    s => (activeId && s.id_sesion === activeId) || (s.id_usuario === user.id_usuario && s.estado === 'ACTIVA')
  );

  let duracionTexto = '0 seg';

  if (session) {
    const elapsedSecs = Math.max(1, Math.floor((now - (session.timestamp_inicio || now)) / 1000));
    duracionTexto = formatDuration(elapsedSecs);

    session.estado = 'CERRADA';
    session.fecha_cierre = fechaStr;
    session.timestamp_cierre = now;
    session.duracion_segundos = elapsedSecs;
    session.duracion_formateada = duracionTexto;

    // Registro en Auditoría
    const audit: Auditoria = {
      id_auditoria: `AUD-${now}`,
      id_usuario: user.id_usuario,
      username: user.username,
      fecha_hora: fechaStr,
      operacion: 'MODIFICACION',
      tabla_afectada: 'sesiones',
      id_registro: session.id_sesion,
      valor_nuevo: JSON.stringify({
        inicio: session.fecha_inicio,
        cierre: fechaStr,
        duracion: duracionTexto,
        duracion_segundos: elapsedSecs,
      }),
      motivo: `Cierre de sesión de @${user.username} tras ${duracionTexto} de actividad en el sistema`,
    };
    state.auditoria.unshift(audit);
  } else {
    // Si no había registro previo, asentar evento de desconexión
    const audit: Auditoria = {
      id_auditoria: `AUD-${now}`,
      id_usuario: user.id_usuario,
      username: user.username,
      fecha_hora: fechaStr,
      operacion: 'MODIFICACION',
      tabla_afectada: 'sesiones',
      id_registro: `SES-CERRADA-${now}`,
      valor_nuevo: JSON.stringify({ fecha_cierre: fechaStr }),
      motivo: `Cierre de sesión de @${user.username}`,
    };
    state.auditoria.unshift(audit);
  }

  try {
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  } catch (e) {}

  saveDatabaseState(state);
  return { session, duracionTexto };
};

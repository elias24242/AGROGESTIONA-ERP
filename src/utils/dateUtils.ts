/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Utilidades Centralizadas para Manejo de Fechas y Horarios en Hora Oficial Argentina (ART / America/Argentina/Buenos_Aires - UTC-3)
 */

export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Retorna la fecha actual en formato ISO (YYYY-MM-DD) calculada en Hora Argentina
 */
export const getFechaArgentinaISO = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/**
 * Retorna la marca de tiempo actual en formato estándar YYYY-MM-DD HH:mm:ss calculada en Hora Argentina
 */
export const getFechaHoraArgentinaISO = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
};

/**
 * Formatea una fecha dada (string o Date) a formato argentino DD/MM/AAAA
 */
export const formatFechaArg = (fechaStrOrDate?: string | Date | null): string => {
  if (!fechaStrOrDate) return '-';
  try {
    if (typeof fechaStrOrDate === 'string') {
      // Si ya viene como YYYY-MM-DD
      const match = fechaStrOrDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
      const d = new Date(fechaStrOrDate);
      if (isNaN(d.getTime())) return fechaStrOrDate;
      return new Intl.DateTimeFormat('es-AR', {
        timeZone: ARGENTINA_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    }
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: ARGENTINA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(fechaStrOrDate);
  } catch {
    return String(fechaStrOrDate);
  }
};

/**
 * Formatea un horario en hora argentina (HH:mm o HH:mm:ss)
 */
export const formatHoraArg = (fechaStrOrDate?: string | Date | null, includeSeconds = true): string => {
  if (!fechaStrOrDate) return '-';
  try {
    if (typeof fechaStrOrDate === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(fechaStrOrDate.trim())) {
      return fechaStrOrDate.trim();
    }
    const d = typeof fechaStrOrDate === 'string' ? new Date(fechaStrOrDate) : fechaStrOrDate;
    if (isNaN(d.getTime())) return String(fechaStrOrDate);
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: ARGENTINA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    }).format(d);
  } catch {
    return '-';
  }
};

/**
 * Formatea fecha y hora completa en horario argentino (DD/MM/AAAA HH:mm:ss hs ART)
 */
export const formatFechaHoraArg = (fechaStrOrDate?: string | Date | null): string => {
  if (!fechaStrOrDate) return '-';
  try {
    if (typeof fechaStrOrDate === 'string') {
      const trimmed = fechaStrOrDate.trim();
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]} ${match[4]} hs (ART)`;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const fecha = new Intl.DateTimeFormat('es-AR', {
          timeZone: ARGENTINA_TIMEZONE,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(d);
        const hora = new Intl.DateTimeFormat('es-AR', {
          timeZone: ARGENTINA_TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(d);
        return `${fecha} ${hora} hs (ART)`;
      }
      return trimmed;
    }
    const fecha = new Intl.DateTimeFormat('es-AR', {
      timeZone: ARGENTINA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(fechaStrOrDate);
    const hora = new Intl.DateTimeFormat('es-AR', {
      timeZone: ARGENTINA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(fechaStrOrDate);
    return `${fecha} ${hora} hs (ART)`;
  } catch {
    return String(fechaStrOrDate);
  }
};

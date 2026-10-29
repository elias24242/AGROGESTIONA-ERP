/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Utilidades para Trazabilidad Granular y Log Detallado de Cambios por Campo en Auditoría
 */

import { Auditoria, CampoModificado, Usuario } from '../types/erp';
import { formatFechaHoraArg } from './dateUtils';

export interface EventoCambioCampo {
  id_evento: string;
  id_auditoria: string;
  id_usuario: string;
  username: string;
  nombre_usuario: string;
  rol_usuario: string;
  fecha_hora: string;
  operacion: 'ALTA' | 'MODIFICACION' | 'ANULACION' | 'SINCRONIZACION';
  tabla_afectada: string;
  id_registro: string;
  campo: string;
  etiqueta_campo: string;
  valor_anterior: any;
  valor_anterior_formateado: string;
  valor_nuevo: any;
  valor_nuevo_formateado: string;
  motivo: string;
  delta?: string;
  tipo_dato?: 'texto' | 'numero' | 'moneda' | 'booleano' | 'fecha';
}

/**
 * Diccionario de etiquetas humanas legibles para campos técnicos
 */
const DICCIONARIO_CAMPOS: Record<string, { label: string; tipo: 'texto' | 'numero' | 'moneda' | 'booleano' | 'fecha' }> = {
  // Usuarios y Accesos
  rol: { label: 'Rol de Acceso', tipo: 'texto' },
  rol_nombre: { label: 'Rol de Usuario', tipo: 'texto' },
  activo: { label: 'Estado de Cuenta', tipo: 'booleano' },
  inhabilitado: { label: 'Inhabilitación de Acceso', tipo: 'booleano' },
  email: { label: 'Correo Electrónico', tipo: 'texto' },
  nombre_completo: { label: 'Nombre Completo', tipo: 'texto' },
  password_hash: { label: 'Clave de Seguridad (Hash)', tipo: 'texto' },
  permitido: { label: 'Permiso Habilitado', tipo: 'booleano' },

  // Zootécnico y Majada
  cabezas: { label: 'Cantidad de Cabezas', tipo: 'numero' },
  cabezas_tratadas: { label: 'Cabezas Tratadas', tipo: 'numero' },
  categoria: { label: 'Categoría Zootécnica', tipo: 'texto' },
  id_categoria: { label: 'Categoría Zootécnica', tipo: 'texto' },
  id_categoria_origen: { label: 'Categoría Origen', tipo: 'texto' },
  id_categoria_destino: { label: 'Categoría Destino', tipo: 'texto' },
  subunidad: { label: 'Subunidad Productiva', tipo: 'texto' },
  id_subunidad: { label: 'Subunidad Productiva', tipo: 'texto' },
  id_subunidad_origen: { label: 'Subunidad Origen', tipo: 'texto' },
  id_subunidad_destino: { label: 'Subunidad Destino', tipo: 'texto' },
  lote: { label: 'Lote / Potrero', tipo: 'texto' },
  id_lote: { label: 'Lote / Potrero', tipo: 'texto' },
  peso_vivo: { label: 'Peso Vivo Total (kg)', tipo: 'numero' },
  kg_vivo_total: { label: 'Peso Vivo Total (kg)', tipo: 'numero' },
  kgTotal: { label: 'Peso Total Pesaje (kg)', tipo: 'numero' },
  dosis_valor: { label: 'Dosis Técnica Vigente', tipo: 'numero' },
  dosis_unitaria_real: { label: 'Dosis Unitaria Real', tipo: 'numero' },
  consumo_total_real: { label: 'Consumo Total de Medicamento', tipo: 'numero' },
  valor_referencia: { label: 'Meta de Rendimiento / Referencia', tipo: 'numero' },
  indicador: { label: 'Indicador Zootécnico', tipo: 'texto' },

  // Económico y Costos
  precio: { label: 'Precio Unitario', tipo: 'moneda' },
  precio_unitario: { label: 'Precio Unitario', tipo: 'moneda' },
  precio_promedio_ponderado: { label: 'Precio Promedio Ponderado', tipo: 'moneda' },
  importe_total: { label: 'Importe Total', tipo: 'moneda' },
  importe_asignado: { label: 'Importe Asignado', tipo: 'moneda' },
  porcentaje: { label: 'Porcentaje Asignado (%)', tipo: 'numero' },
  stock_actual: { label: 'Existencia en Depósito', tipo: 'numero' },
  estado_confirmacion: { label: 'Estado de Confirmación', tipo: 'texto' },
  estado_precio: { label: 'Estado de Imputación de Precio', tipo: 'texto' },
  fecha: { label: 'Fecha Operativa', tipo: 'fecha' },
  fecha_vigencia: { label: 'Fecha de Vigencia', tipo: 'fecha' },
};

/**
 * Mapeo de nombres de tablas a nombres amigables
 */
export const TABLAS_ETIQUETAS: Record<string, string> = {
  usuarios: 'Usuarios y Accesos',
  roles_permisos: 'Matriz de Permisos (RBAC)',
  dosis_tecnicas: 'Dosis Técnicas Veterinarias',
  insumos: 'Insumos y Farmacia Veterinaria',
  movimientos_hacienda: 'Movimientos de Majada',
  inventario_inicial: 'Inventario Inicial Canónico',
  referencias_rendimiento: 'Metas y Referencias de Rendimiento',
  costos: 'Costos Directos e Indirectos',
  distribuciones_costos: 'Distribución de Costos',
  ventas: 'Ventas Comerciales',
  compras: 'Compras y Facturación',
  sanidad_y_consumos: 'Tratamientos Sanitarios',
  produccion: 'Producción Física',
  pesajes: 'Pesajes de Hacienda',
  sesiones: 'Sesiones de Usuarios',
};

/**
 * Formatea un valor para presentación humana
 */
export function formatearValorCampo(valor: any, tipo?: 'texto' | 'numero' | 'moneda' | 'booleano' | 'fecha'): string {
  if (valor === undefined || valor === null) {
    return '(Sin valor / Nulo)';
  }

  if (typeof valor === 'boolean' || tipo === 'booleano') {
    return valor ? 'Habilitado / Activo' : 'Deshabilitado / Inactivo';
  }

  if (typeof valor === 'number' || tipo === 'numero' || tipo === 'moneda') {
    if (tipo === 'moneda') {
      return `$${Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return Number(valor).toLocaleString('es-AR');
  }

  if (typeof valor === 'object') {
    return JSON.stringify(valor);
  }

  const str = String(valor).trim();
  if (str === '') return '(Vacío)';
  return str;
}

/**
 * Calcula delta o variación entre dos valores si son numéricos
 */
function calcularDelta(valAnt: any, valPost: any, tipo?: string): string | undefined {
  const numAnt = Number(valAnt);
  const numPost = Number(valPost);

  if (!isNaN(numAnt) && !isNaN(numPost) && isFinite(numAnt) && isFinite(numPost)) {
    const diff = numPost - numAnt;
    if (diff === 0) return undefined;

    const signo = diff > 0 ? '+' : '';
    if (tipo === 'moneda') {
      return `${signo}$${diff.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (numAnt !== 0) {
      const pct = ((diff / numAnt) * 100).toFixed(1);
      return `${signo}${diff.toLocaleString('es-AR')} (${signo}${pct}%)`;
    }
    return `${signo}${diff.toLocaleString('es-AR')}`;
  }

  return undefined;
}

/**
 * Extrae la lista granular de campos modificados a partir de un registro de auditoría
 */
export function extraerCambiosDeAuditoria(aud: Auditoria): CampoModificado[] {
  // 1. Si ya tiene `cambios_campos` explícito, retornarlo
  if (aud.cambios_campos && aud.cambios_campos.length > 0) {
    return aud.cambios_campos;
  }

  const cambios: CampoModificado[] = [];

  // 2. Parsear valor_anterior y valor_nuevo
  let prevObj: any = null;
  let newObj: any = null;

  if (aud.valor_anterior) {
    try {
      prevObj = typeof aud.valor_anterior === 'string' ? JSON.parse(aud.valor_anterior) : aud.valor_anterior;
    } catch {
      prevObj = aud.valor_anterior;
    }
  }

  if (aud.valor_nuevo) {
    try {
      newObj = typeof aud.valor_nuevo === 'string' ? JSON.parse(aud.valor_nuevo) : aud.valor_nuevo;
    } catch {
      newObj = aud.valor_nuevo;
    }
  }

  // Si ambos son objetos, comparar clave a clave
  if (prevObj && typeof prevObj === 'object' && newObj && typeof newObj === 'object') {
    const todasLasClaves = Array.from(new Set([...Object.keys(prevObj), ...Object.keys(newObj)]));

    for (const key of todasLasClaves) {
      // Ignorar metadatos internos irrelevantes
      if (['password_hash', 'id_auditoria', 'fecha_modificacion', 'usuario_id'].includes(key)) continue;

      const vAnt = prevObj[key];
      const vPost = newObj[key];

      // Verificar si hubo un cambio real
      const esDistinto = JSON.stringify(vAnt) !== JSON.stringify(vPost);
      if (esDistinto) {
        const meta = DICCIONARIO_CAMPOS[key];
        cambios.push({
          campo: key,
          etiqueta: meta?.label || humanizarNombreCampo(key),
          valor_anterior: vAnt !== undefined ? vAnt : null,
          valor_nuevo: vPost !== undefined ? vPost : null,
          tipo_dato: meta?.tipo || (typeof vPost === 'number' ? 'numero' : typeof vPost === 'boolean' ? 'booleano' : 'texto'),
        });
      }
    }
  } else if (aud.operacion === 'MODIFICACION') {
    // Si no son objetos JSON estructurados pero es MODIFICACION, registrar como cambio de registro
    cambios.push({
      campo: 'registro_completo',
      etiqueta: 'Estado General del Registro',
      valor_anterior: prevObj,
      valor_nuevo: newObj,
      tipo_dato: 'texto',
    });
  } else if (aud.operacion === 'ALTA' && newObj && typeof newObj === 'object') {
    // Para altas, registrar los campos clave inicializados
    for (const key of Object.keys(newObj)) {
      if (['password_hash', 'id_auditoria'].includes(key)) continue;
      const meta = DICCIONARIO_CAMPOS[key];
      cambios.push({
        campo: key,
        etiqueta: meta?.label || humanizarNombreCampo(key),
        valor_anterior: '(Registro Nuevo)',
        valor_nuevo: newObj[key],
        tipo_dato: meta?.tipo || (typeof newObj[key] === 'number' ? 'numero' : 'texto'),
      });
    }
  }

  return cambios;
}

/**
 * Convierte un nombre en snake_case o camelCase a texto legible en español
 */
export function humanizarNombreCampo(campo: string): string {
  if (DICCIONARIO_CAMPOS[campo]) {
    return DICCIONARIO_CAMPOS[campo].label;
  }

  return campo
    .replace(/^id_/, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Obtiene la lista aplanada de todos los eventos de cambio de campo
 * cruzando los datos del usuario para máxima trazabilidad
 */
export function obtenerTodosLosEventosDeCampo(
  auditorias: Auditoria[],
  usuarios: Usuario[] = []
): EventoCambioCampo[] {
  const userMap = new Map<string, Usuario>();
  for (const u of usuarios) {
    userMap.set(u.username.toLowerCase(), u);
    userMap.set(u.id_usuario, u);
  }

  const eventos: EventoCambioCampo[] = [];

  for (const aud of auditorias) {
    const userObj = userMap.get(aud.username.toLowerCase()) || userMap.get(aud.id_usuario);
    const nombreUsuario = aud.nombre_usuario || userObj?.nombre_completo || aud.username;
    const rolUsuario = aud.rol_usuario || userObj?.rol_nombre || 'USUARIO';

    const camposCambiados = extraerCambiosDeAuditoria(aud);

    if (camposCambiados.length === 0) {
      // Si no se extrajeron claves individuales, crear al menos un evento para el cambio
      eventos.push({
        id_evento: `${aud.id_auditoria}-gen`,
        id_auditoria: aud.id_auditoria,
        id_usuario: aud.id_usuario,
        username: aud.username,
        nombre_usuario: nombreUsuario,
        rol_usuario: rolUsuario,
        fecha_hora: aud.fecha_hora,
        operacion: aud.operacion,
        tabla_afectada: aud.tabla_afectada,
        id_registro: aud.id_registro,
        campo: 'operacion',
        etiqueta_campo: 'Operación Asentada',
        valor_anterior: aud.valor_anterior || '(Sin previo)',
        valor_anterior_formateado: aud.valor_anterior ? formatearValorCampo(aud.valor_anterior) : '(Inicial)',
        valor_nuevo: aud.valor_nuevo,
        valor_nuevo_formateado: formatearValorCampo(aud.valor_nuevo),
        motivo: aud.motivo,
        tipo_dato: 'texto',
      });
    } else {
      camposCambiados.forEach((c, idx) => {
        const vAntFmt = formatearValorCampo(c.valor_anterior, c.tipo_dato);
        const vPostFmt = formatearValorCampo(c.valor_nuevo, c.tipo_dato);
        const delta = calcularDelta(c.valor_anterior, c.valor_nuevo, c.tipo_dato);

        eventos.push({
          id_evento: `${aud.id_auditoria}-${c.campo}-${idx}`,
          id_auditoria: aud.id_auditoria,
          id_usuario: aud.id_usuario,
          username: aud.username,
          nombre_usuario: nombreUsuario,
          rol_usuario: rolUsuario,
          fecha_hora: aud.fecha_hora,
          operacion: aud.operacion,
          tabla_afectada: aud.tabla_afectada,
          id_registro: aud.id_registro,
          campo: c.campo,
          etiqueta_campo: c.etiqueta || humanizarNombreCampo(c.campo),
          valor_anterior: c.valor_anterior,
          valor_anterior_formateado: vAntFmt,
          valor_nuevo: c.valor_nuevo,
          valor_nuevo_formateado: vPostFmt,
          motivo: aud.motivo,
          delta,
          tipo_dato: c.tipo_dato,
        });
      });
    }
  }

  // Ordenar cronológicamente descendente (más recientes primero)
  return eventos.sort((a, b) => (b.fecha_hora > a.fecha_hora ? 1 : -1));
}

/**
 * Exporta los eventos detallados a un archivo CSV descargable
 */
export function exportarEventosACSV(eventos: EventoCambioCampo[]): void {
  const headers = [
    'ID Evento',
    'ID Auditoria',
    'Fecha y Hora',
    'Usuario',
    'Nombre Completo',
    'Rol',
    'Operacion',
    'Tabla Afectada',
    'ID Registro',
    'Campo Modificado',
    'Valor Anterior',
    'Valor Posterior',
    'Variacion (Delta)',
    'Motivo Justificado',
  ];

  const rows = eventos.map(e => [
    e.id_evento,
    e.id_auditoria,
    formatFechaHoraArg(e.fecha_hora),
    `@${e.username}`,
    `"${e.nombre_usuario.replace(/"/g, '""')}"`,
    e.rol_usuario,
    e.operacion,
    e.tabla_afectada,
    e.id_registro,
    `"${e.etiqueta_campo.replace(/"/g, '""')}"`,
    `"${e.valor_anterior_formateado.replace(/"/g, '""')}"`,
    `"${e.valor_nuevo_formateado.replace(/"/g, '""')}"`,
    e.delta || '-',
    `"${e.motivo.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `log_eventos_auditoria_unrc_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

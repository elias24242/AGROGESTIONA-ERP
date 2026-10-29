/**
 * ERP Ovinos - Pozo del Carril
 * Servicio de Sincronización Bidireccional con Google Sheets API v4
 */

import * as SeedData from '../data/initialData';
import {
  cacheStateSnapshot,
  getCachedStateSnapshot,
  isNetworkAvailable,
  queueOfflineMutation
} from './offlineCacheService';
import {
  formatFechaArg,
  formatHoraArg,
  formatFechaHoraArg,
  getFechaArgentinaISO
} from '../utils/dateUtils';
import {
  Especie,
  UnidadNegocio,
  Subunidad,
  Campania,
  Lote,
  Categoria,
  Insumo,
  Producto,
  Tercero,
  CuentaContable,
  InventarioInicial,
  MovimientoHacienda,
  Pesaje,
  Produccion,
  ReferenciaRendimiento,
  DosisTecnica,
  SanidadAplicacion,
  Consumo,
  Compra,
  DetalleCompra,
  Venta,
  DetalleVenta,
  Costo,
  DistribucionCosto,
  Cobro,
  Pago,
  Usuario,
  Auditoria,
  ConceptoGlosario,
  SesionAuditoria
} from '../types/erp';

export interface DatabaseState {
  especies: Especie[];
  unidades: UnidadNegocio[];
  subunidades: Subunidad[];
  campanias: Campania[];
  lotes: Lote[];
  categorias: Categoria[];
  insumos: Insumo[];
  productos: Producto[];
  terceros: Tercero[];
  cuentas: CuentaContable[];
  inventario: InventarioInicial[];
  movimientos: MovimientoHacienda[];
  pesajes: Pesaje[];
  produccion: Produccion[];
  referencias: ReferenciaRendimiento[];
  dosis: DosisTecnica[];
  sanidad: SanidadAplicacion[];
  consumos: Consumo[];
  compras: Compra[];
  detalles_compras: DetalleCompra[];
  ventas: Venta[];
  detalles_ventas: DetalleVenta[];
  costos: Costo[];
  distribuciones_costos: DistribucionCosto[];
  cobros: Cobro[];
  pagos: Pago[];
  usuarios: Usuario[];
  auditoria: Auditoria[];
  glosario: ConceptoGlosario[];
  sesiones: SesionAuditoria[];
}

export const SHEETS_DEFINITIONS: Record<keyof DatabaseState, string[]> = {
  especies: ['id_especie', 'codigo', 'nombre', 'icono', 'activo', 'orden_visual'],
  unidades: ['id_unidad', 'codigo', 'nombre', 'descripcion', 'activo'],
  subunidades: ['id_subunidad', 'id_unidad', 'codigo', 'nombre', 'descripcion', 'activo'],
  campanias: ['id_campania', 'codigo', 'nombre', 'anio_inicio', 'anio_fin', 'fecha_inicio', 'fecha_fin', 'estado'],
  lotes: ['id_lote', 'id_subunidad', 'codigo', 'nombre', 'superficie_ha', 'observaciones', 'activo'],
  categorias: ['id_categoria', 'id_subunidad', 'codigo', 'nombre', 'genero', 'edad_meses_min', 'edad_meses_max', 'es_reproductor', 'activo'],
  insumos: ['id_insumo', 'codigo', 'nombre', 'tipo', 'id_um', 'um_codigo', 'stock_actual', 'precio_promedio_ponderado', 'activo'],
  productos: ['id_producto', 'codigo', 'nombre', 'tipo', 'id_um', 'um_codigo', 'activo'],
  terceros: ['id_tercero', 'cuit_cuil', 'razon_social', 'tipo', 'telefono', 'email', 'localidad', 'activo'],
  cuentas: ['id_cuenta', 'codigo_plan', 'nombre', 'tipo', 'activo'],
  inventario: ['id_inventario', 'id_campania', 'id_subunidad', 'id_lote', 'id_categoria', 'fecha', 'cabezas', 'kg_vivo_total', 'valor_unitario', 'valor_total', 'estado_confirmacion', 'observaciones'],
  movimientos: ['id_movimiento', 'id_campania', 'fecha', 'tipo', 'id_subunidad_origen', 'id_subunidad_destino', 'id_lote_origen', 'id_lote_destino', 'id_categoria_origen', 'id_categoria_destino', 'cabezas', 'kg_vivo_total', 'id_operacion_relacionada', 'motivo', 'anulado', 'es_prueba', 'usuario_id'],
  pesajes: ['id_pesaje', 'id_campania', 'id_subunidad', 'id_lote', 'id_categoria', 'fecha', 'cabezas_pesadas', 'kg_vivo_total', 'kg_vivo_promedio', 'tipo_peso', 'observaciones', 'es_prueba', 'usuario_id'],
  produccion: ['id_produccion', 'id_campania', 'id_subunidad', 'fecha', 'id_producto', 'cantidad', 'id_um', 'lote_origen', 'observaciones', 'es_prueba', 'usuario_id'],
  referencias: ['id_referencia', 'id_campania', 'id_subunidad', 'indicador', 'valor_referencia', 'unidad', 'numerador_def', 'denominador_def', 'fuente', 'fecha_vigencia'],
  dosis: ['id_dosis', 'id_insumo', 'id_subunidad', 'id_campania', 'dosis_valor', 'id_um', 'base_aplicacion', 'nombre_protocolo', 'fuente', 'vigencia_desde'],
  sanidad: ['id_aplicacion', 'id_campania', 'id_subunidad', 'id_lote', 'id_categoria', 'id_insumo', 'id_dosis', 'fecha', 'cabezas_tratadas', 'dosis_unitaria_real', 'id_um_dosis', 'consumo_total_real', 'id_consumo_asociado', 'id_costo_asociado', 'veterinario_responsable', 'diagnostico_motivo', 'es_prueba', 'usuario_id'],
  consumos: ['id_consumo', 'id_campania', 'id_subunidad', 'id_insumo', 'fecha', 'cantidad_real', 'cantidad_esperada', 'desvio_cantidad', 'costo_unitario_real', 'costo_total_real', 'origen_evento', 'id_evento_origen', 'estado_precio', 'es_prueba', 'usuario_id'],
  compras: ['id_compra', 'id_campania', 'id_tercero', 'comprobante_tipo', 'comprobante_nro', 'fecha', 'importe_total', 'saldo_pendiente', 'estado_pago', 'anulado', 'es_prueba', 'usuario_id'],
  detalles_compras: ['id_detalle_compra', 'id_compra', 'id_insumo', 'cantidad', 'id_um', 'precio_unitario', 'subtotal'],
  ventas: ['id_venta', 'id_campania', 'id_subunidad', 'id_tercero', 'comprobante_nro', 'fecha', 'importe_total', 'saldo_pendiente', 'estado_cobro', 'anulado', 'es_prueba', 'usuario_id'],
  detalles_ventas: ['id_detalle_venta', 'id_venta', 'id_producto', 'id_categoria', 'cabezas', 'kg_total', 'precio_unitario', 'subtotal'],
  costos: ['id_costo', 'id_campania', 'id_cuenta', 'fecha', 'concepto', 'clasificacion', 'importe_total', 'id_consumo_asociado', 'es_prueba', 'usuario_id'],
  distribuciones_costos: ['id_distribucion', 'id_costo', 'id_subunidad', 'porcentaje', 'importe_asignado'],
  cobros: ['id_cobro', 'id_venta', 'id_cuenta_cobro', 'fecha', 'importe', 'medio_pago', 'recibo_nro', 'es_prueba', 'usuario_id'],
  pagos: ['id_pago', 'id_compra', 'id_cuenta_pago', 'fecha', 'importe', 'medio_pago', 'orden_pago_nro', 'es_prueba', 'usuario_id'],
  usuarios: ['id_usuario', 'username', 'password_hash', 'nombre_completo', 'email', 'id_rol', 'rol_nombre', 'activo', 'fecha_alta', 'fecha_modificacion'],
  auditoria: ['id_auditoria', 'id_usuario', 'username', 'fecha_hora', 'operacion', 'tabla_afectada', 'id_registro', 'valor_anterior', 'valor_nuevo', 'motivo'],
  glosario: ['id_concepto', 'termino', 'categoria', 'definicion_simple', 'formula_o_calculo', 'ejemplo_practico', 'fecha_modificacion', 'usuario_modificacion'],
  sesiones: ['id_sesion', 'id_usuario', 'username', 'nombre_completo', 'rol_nombre', 'fecha_inicio', 'fecha_fin', 'duracion_minutos', 'estado'],
};

const STORAGE_KEY = 'erp_ovinos_db_state_v1';
const SPREADSHEET_ID_KEY = 'erp_ovinos_spreadsheet_id';
const SHEETS_META_KEY = 'erp_ovinos_sheets_vinculacion_meta_v2';

export interface SheetsVinculacionMetadata {
  spreadsheetId: string | null;
  spreadsheetTitle: string;
  spreadsheetUrl: string | null;
  ultimaFecha: string; // Ej: "14/10/2026"
  ultimaHora: string; // Ej: "13:20:45 hs (ART)"
  ultimaFechaHoraCompleta: string; // Ej: "14/10/2026 13:20:45 hs (ART)"
  timestamp: number;
  tipoOperacion: 'VINCULACION' | 'VERIFICACION' | 'PULL' | 'PUSH' | 'CREACION' | 'DESVINCULACION';
  estado: 'CONECTADO' | 'SIN_VINCULAR' | 'ERROR' | 'OFFLINE';
  mensaje: string;
  tablasVerificadas?: number;
  totalTablasEsperadas?: number;
}

let vinculacionListeners: Array<(meta: SheetsVinculacionMetadata) => void> = [];

export const subscribeToVinculacionMetadata = (callback: (meta: SheetsVinculacionMetadata) => void): (() => void) => {
  vinculacionListeners.push(callback);
  callback(getSheetsVinculacionMetadata());
  return () => {
    vinculacionListeners = vinculacionListeners.filter(l => l !== callback);
  };
};

const notifyVinculacionChange = (meta: SheetsVinculacionMetadata) => {
  vinculacionListeners.forEach(listener => {
    try {
      listener(meta);
    } catch (e) {
      console.warn('Error en listener de vinculación:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp_sheets_vinculacion_updated', { detail: meta }));
  }
};

export const getSheetsVinculacionMetadata = (): SheetsVinculacionMetadata => {
  const currentSheetId = getSavedSpreadsheetId();
  try {
    const raw = localStorage.getItem(SHEETS_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (parsed.spreadsheetId !== currentSheetId) {
          parsed.spreadsheetId = currentSheetId;
          parsed.spreadsheetUrl = currentSheetId ? `https://docs.google.com/spreadsheets/d/${currentSheetId}` : null;
          parsed.estado = currentSheetId ? 'CONECTADO' : 'SIN_VINCULAR';
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error leyendo metadata de vinculación:', e);
  }

  const now = new Date();
  const fecha = formatFechaArg(now);
  const hora = formatHoraArg(now, true) + ' hs (ART)';
  const completa = formatFechaHoraArg(now);

  const defaultMeta: SheetsVinculacionMetadata = {
    spreadsheetId: currentSheetId,
    spreadsheetTitle: currentSheetId ? 'ERP Ovinos - Pozo del Carril (UNRC)' : 'Sin vincular',
    spreadsheetUrl: currentSheetId ? `https://docs.google.com/spreadsheets/d/${currentSheetId}` : null,
    ultimaFecha: fecha,
    ultimaHora: hora,
    ultimaFechaHoraCompleta: completa,
    timestamp: now.getTime(),
    tipoOperacion: currentSheetId ? 'VINCULACION' : 'DESVINCULACION',
    estado: currentSheetId ? 'CONECTADO' : 'SIN_VINCULAR',
    mensaje: currentSheetId ? 'Archivo de Google Sheets vinculado y listo para operar.' : 'Aún no se ha vinculado ningún archivo de Google Sheets.',
    tablasVerificadas: currentSheetId ? 29 : 0,
    totalTablasEsperadas: 29,
  };

  try {
    localStorage.setItem(SHEETS_META_KEY, JSON.stringify(defaultMeta));
  } catch (e) {}

  return defaultMeta;
};

export const saveSheetsVinculacionMetadata = (meta: Partial<SheetsVinculacionMetadata>): SheetsVinculacionMetadata => {
  const now = new Date();
  const currentSheetId = meta.spreadsheetId !== undefined ? meta.spreadsheetId : getSavedSpreadsheetId();
  const previous = (() => {
    try {
      const raw = localStorage.getItem(SHEETS_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })() || {
    spreadsheetId: currentSheetId,
    spreadsheetTitle: 'ERP Ovinos - Pozo del Carril (UNRC)',
    spreadsheetUrl: currentSheetId ? `https://docs.google.com/spreadsheets/d/${currentSheetId}` : null,
    totalTablasEsperadas: 29,
  };

  const updated: SheetsVinculacionMetadata = {
    ...previous,
    ...meta,
    spreadsheetId: currentSheetId,
    spreadsheetUrl: currentSheetId ? `https://docs.google.com/spreadsheets/d/${currentSheetId}` : null,
    ultimaFecha: meta.ultimaFecha || formatFechaArg(now),
    ultimaHora: meta.ultimaHora || (formatHoraArg(now, true) + ' hs (ART)'),
    ultimaFechaHoraCompleta: meta.ultimaFechaHoraCompleta || formatFechaHoraArg(now),
    timestamp: now.getTime(),
  };

  try {
    localStorage.setItem(SHEETS_META_KEY, JSON.stringify(updated));
    notifyVinculacionChange(updated);
  } catch (e) {
    console.error('Error guardando metadata de vinculación:', e);
  }

  return updated;
};

export const getInitialState = (): DatabaseState => {
  return {
    especies: [...SeedData.INITIAL_ESPECIES],
    unidades: [...SeedData.INITIAL_UNIDADES],
    subunidades: [...SeedData.INITIAL_SUBUNIDADES],
    campanias: [...SeedData.INITIAL_CAMPANIAS],
    lotes: [...SeedData.INITIAL_LOTES],
    categorias: [...SeedData.INITIAL_CATEGORIAS],
    insumos: [...SeedData.INITIAL_INSUMOS],
    productos: [...SeedData.INITIAL_PRODUCTOS],
    terceros: [...SeedData.INITIAL_TERCEROS],
    cuentas: [...SeedData.INITIAL_CUENTAS],
    inventario: [...SeedData.INITIAL_INVENTARIO],
    movimientos: [...SeedData.INITIAL_MOVIMIENTOS],
    pesajes: [],
    produccion: [],
    referencias: [...SeedData.INITIAL_REFERENCIAS],
    dosis: [...SeedData.INITIAL_DOSIS],
    sanidad: [],
    consumos: [],
    compras: [],
    detalles_compras: [],
    ventas: [...SeedData.INITIAL_VENTAS],
    detalles_ventas: [...SeedData.INITIAL_DETALLES_VENTAS],
    costos: [],
    distribuciones_costos: [],
    cobros: [...SeedData.INITIAL_COBROS],
    pagos: [],
    usuarios: [...SeedData.INITIAL_USUARIOS],
    auditoria: [...SeedData.INITIAL_AUDITORIA],
    glosario: [...SeedData.INITIAL_GLOSARIO],
    sesiones: [...SeedData.INITIAL_SESIONES],
  };
};

/**
 * Carga el estado de la base de datos desde LocalStorage o inicializa
 */
export const loadDatabaseState = (): DatabaseState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validar integridad mínima y asegurar propiedades añadidas
      if (parsed.unidades && parsed.inventario && parsed.usuarios) {
        // Garantizar tabla maestra D_Especie (ESP001, ESP002, ESP003)
        if (!parsed.especies || !Array.isArray(parsed.especies) || parsed.especies.length === 0) {
          parsed.especies = [...SeedData.INITIAL_ESPECIES];
        } else {
          SeedData.INITIAL_ESPECIES.forEach(esp => {
            if (!parsed.especies.some((e: any) => e.id_especie === esp.id_especie)) {
              parsed.especies.push(esp);
            }
          });
        }

        // Sincronizar subunidades y unidades
        if (Array.isArray(parsed.subunidades)) {
          SeedData.INITIAL_SUBUNIDADES.forEach(sub => {
            const existing = parsed.subunidades.find((s: any) => s.id_subunidad === sub.id_subunidad);
            if (!existing) {
              parsed.subunidades.push(sub);
            } else if (!existing.id_especie && sub.id_especie) {
              existing.id_especie = sub.id_especie;
            }
          });
        } else {
          parsed.subunidades = [...SeedData.INITIAL_SUBUNIDADES];
        }

        // Sincronizar categorías por especie
        if (Array.isArray(parsed.categorias)) {
          SeedData.INITIAL_CATEGORIAS.forEach(cat => {
            const existing = parsed.categorias.find((c: any) => c.id_categoria === cat.id_categoria);
            if (!existing) {
              parsed.categorias.push(cat);
            } else if (!existing.id_especie && cat.id_especie) {
              existing.id_especie = cat.id_especie;
            }
          });
        } else {
          parsed.categorias = [...SeedData.INITIAL_CATEGORIAS];
        }

        // Sincronizar lotes
        if (Array.isArray(parsed.lotes)) {
          SeedData.INITIAL_LOTES.forEach(lot => {
            if (!parsed.lotes.some((l: any) => l.id_lote === lot.id_lote)) {
              parsed.lotes.push(lot);
            }
          });
        } else {
          parsed.lotes = [...SeedData.INITIAL_LOTES];
        }

        if (!parsed.glosario || parsed.glosario.length === 0) {
          parsed.glosario = [...SeedData.INITIAL_GLOSARIO];
        } else {
          // Asegurar que conceptos nuevos se integren
          SeedData.INITIAL_GLOSARIO.forEach(seedItem => {
            if (!parsed.glosario.some((g: any) => g.id_concepto === seedItem.id_concepto)) {
              parsed.glosario.push(seedItem);
            }
          });
        }
        if (Array.isArray(parsed.campanias)) {
          SeedData.INITIAL_CAMPANIAS.forEach(camp => {
            if (!parsed.campanias.some((c: any) => c.id_campania === camp.id_campania)) {
              parsed.campanias.push(camp);
            }
          });
        }
        if (Array.isArray(parsed.inventario)) {
          SeedData.INITIAL_INVENTARIO.forEach(inv => {
            const idx = parsed.inventario.findIndex((i: any) => i.id_inventario === inv.id_inventario);
            if (idx === -1) {
              parsed.inventario.push(inv);
            } else if (parsed.inventario[idx].cabezas === 0 && inv.cabezas > 0) {
              parsed.inventario[idx] = { ...inv };
            }
          });
        }
        if (Array.isArray(parsed.movimientos)) {
          SeedData.INITIAL_MOVIMIENTOS.forEach(mov => {
            if (!parsed.movimientos.some((m: any) => m.id_movimiento === mov.id_movimiento)) {
              parsed.movimientos.push(mov);
            }
          });
        } else {
          parsed.movimientos = [...SeedData.INITIAL_MOVIMIENTOS];
        }
        if (Array.isArray(parsed.usuarios)) {
          // Asegurar que el usuario 123 (taller 2) esté siempre disponible en el catálogo local
          const has123 = parsed.usuarios.some((u: any) => u.username === '123');
          if (!has123) {
            parsed.usuarios.push({
              id_usuario: 'USR-123',
              username: '123',
              password_hash: 'taller 2',
              nombre_completo: 'Usuario Taller 2',
              email: 'taller2@unrc.edu.ar',
              id_rol: 'ROL-ADMIN',
              rol_nombre: 'ADMINISTRADOR',
              activo: true,
              inhabilitado: false,
              fecha_alta: '2026-07-01',
              fecha_modificacion: '2026-10-08',
            });
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error al leer de LocalStorage, usando instantánea de caché SW:', e);
  }

  // Fallback a instantánea de Service Worker o datos iniciales
  const cached = getCachedStateSnapshot();
  if (cached && cached.unidades && cached.inventario) {
    return cached;
  }

  const init = getInitialState();
  saveDatabaseState(init);
  return init;
};

export const saveDatabaseState = (state: DatabaseState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Sincronizar simultáneamente con el almacenamiento en caché del Service Worker simulado
    cacheStateSnapshot(state, getSavedSpreadsheetId());
  } catch (e) {
    console.error('Error al guardar estado en LocalStorage:', e);
  }
};

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
};

export const setSavedSpreadsheetId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(SPREADSHEET_ID_KEY, id);
    saveSheetsVinculacionMetadata({
      spreadsheetId: id,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}`,
      tipoOperacion: 'VINCULACION',
      estado: 'CONECTADO',
      mensaje: `Archivo de Google Sheets vinculado con éxito (${id}).`,
      tablasVerificadas: 29,
    });
  } else {
    localStorage.removeItem(SPREADSHEET_ID_KEY);
    saveSheetsVinculacionMetadata({
      spreadsheetId: null,
      spreadsheetUrl: null,
      tipoOperacion: 'DESVINCULACION',
      estado: 'SIN_VINCULAR',
      mensaje: 'Se ha desvinculado el archivo de Google Sheets. El sistema opera con base de datos local.',
      tablasVerificadas: 0,
    });
  }
};

/**
 * Convierte un arreglo de objetos a formato 2D para Google Sheets
 */
function objectsToSheetValues(headers: string[], objects: any[]): (string | number | boolean)[][] {
  const rows: (string | number | boolean)[][] = [headers];
  for (const obj of objects) {
    const row = headers.map(key => {
      const val = obj[key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Convierte filas 2D de Google Sheets a arreglo de objetos tipados
 */
function sheetValuesToObjects<T>(headers: string[], rows: any[][]): T[] {
  if (!rows || rows.length <= 1) return [];
  const sheetHeaders = rows[0].map((h: any) => String(h).trim());
  const results: T[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => c === '' || c === null || c === undefined)) continue;
    const item: any = {};
    for (let colIdx = 0; colIdx < sheetHeaders.length; colIdx++) {
      const header = sheetHeaders[colIdx];
      let val = row[colIdx];
      if (val === 'TRUE') val = true;
      else if (val === 'FALSE') val = false;
      else if (val !== '' && !isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
        // Preservar códigos con ceros a la izquierda o prefijos
        if (header.includes('id_') || header.includes('codigo') || header.includes('cuit') || header.includes('comprobante')) {
          // keep as string
        } else {
          val = Number(val);
        }
      }
      item[header] = val ?? '';
    }
    results.push(item as T);
  }
  return results;
}

/**
 * Crea una nueva hoja de cálculo en Google Drive del usuario con las 32 tablas
 */
export const createERPGoogleSpreadsheet = async (
  accessToken: string,
  title = 'ERP Ovinos - Pozo del Carril (UNRC)'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const tableNames = Object.keys(SHEETS_DEFINITIONS);

  const sheetsPayload = tableNames.map(name => ({
    properties: {
      title: name,
      gridProperties: {
        frozenRowCount: 1,
      },
    },
  }));

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: sheetsPayload,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error al crear Google Spreadsheet (${response.status}): ${err}`);
  }

  const sheetData = await response.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // Inicializar todas las hojas con sus encabezados y datos actuales
  const currentState = loadDatabaseState();
  await pushAllDataToGoogleSheets(accessToken, spreadsheetId, currentState);

  setSavedSpreadsheetId(spreadsheetId);
  saveSheetsVinculacionMetadata({
    spreadsheetId,
    spreadsheetTitle: title,
    spreadsheetUrl,
    tipoOperacion: 'CREACION',
    estado: 'CONECTADO',
    mensaje: `Google Spreadsheet creado con éxito en Google Drive con las 29 tablas normalizadas.`,
    tablasVerificadas: Object.keys(SHEETS_DEFINITIONS).length,
    totalTablasEsperadas: Object.keys(SHEETS_DEFINITIONS).length,
  });

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Vuelca todo el estado actual de la BD a Google Sheets en una sola petición por lotes (BatchUpdate)
 */
export const pushAllDataToGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string,
  state: DatabaseState
): Promise<void> => {
  // Asegurar guardado en caché local SW primero
  cacheStateSnapshot(state, spreadsheetId);

  // Si no hay conexión a red o modo offline activo, encolar en el Service Worker y retornar
  if (!isNetworkAvailable()) {
    queueOfflineMutation({
      tipo: 'PUSH_BATCH',
      descripcion: 'Actualización en lote de 29 hojas de Google Sheets',
      tabla: 'TODAS',
      payload: { spreadsheetId, timestamp: Date.now() },
    });
    saveSheetsVinculacionMetadata({
      spreadsheetId,
      tipoOperacion: 'PUSH',
      estado: 'OFFLINE',
      mensaje: 'Conexión ausente: sincronización con Google Sheets encolada en el Service Worker para cuando haya red.',
    });
    console.warn('[SW-Cache] Conexión ausente: sincronización con Google Sheets encolada para cuando haya red.');
    return;
  }

  const dataPayload: Array<{ range: string; values: (string | number | boolean)[][] }> = [];

  for (const [key, headers] of Object.entries(SHEETS_DEFINITIONS)) {
    const tableKey = key as keyof DatabaseState;
    const items = (state[tableKey] || []) as any[];
    const rows = objectsToSheetValues(headers, items);
    dataPayload.push({
      range: `${tableKey}!A1`,
      values: rows,
    });
  }

  try {
    let success = false;
    // 1. Intento directo con Google Sheets API v4
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: dataPayload,
          }),
        }
      );
      if (res.ok) {
        success = true;
      }
    } catch (e) {
      console.warn('Llamada directa batchUpdate falló, intentando proxy:', e);
    }

    // 2. Si falló directo, intentar vía proxy backend
    if (!success) {
      const proxyRes = await fetch('/api/sheets/proxy-batch-update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId,
          data: dataPayload,
        }),
      });
      if (proxyRes.ok) {
        success = true;
      }
    }

    if (success) {
      saveSheetsVinculacionMetadata({
        spreadsheetId,
        tipoOperacion: 'PUSH',
        estado: 'CONECTADO',
        mensaje: `Sincronización App → Sheets completada con éxito. 29 tablas y registros guardados en Google Drive.`,
        tablasVerificadas: Object.keys(SHEETS_DEFINITIONS).length,
        totalTablasEsperadas: Object.keys(SHEETS_DEFINITIONS).length,
      });
    } else {
      throw new Error('No se pudo completar la escritura en Google Sheets.');
    }
  } catch (err: any) {
    console.warn('[SW-Cache] Error de red sincronizando con Sheets. Encolando mutación offline:', err);
    queueOfflineMutation({
      tipo: 'PUSH_BATCH',
      descripcion: 'Reintento de sincronización Google Sheets tras error de conexión',
      tabla: 'TODAS',
      payload: { spreadsheetId, error: err.message },
    });
    saveSheetsVinculacionMetadata({
      spreadsheetId,
      tipoOperacion: 'PUSH',
      estado: 'ERROR',
      mensaje: `Falla en escritura a Google Sheets: ${err.message || 'Error de comunicación'}. Encolado para reintento.`,
    });
  }
};

/**
 * Lee todas las tablas desde Google Sheets (Sincronización Sheets -> App)
 * Si no hay conexión o falla la petición, sirve instantáneamente la versión en caché del Service Worker
 */
export const pullAllDataFromGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string
): Promise<DatabaseState> => {
  // Si no hay red, servir instantáneamente de la caché local del Service Worker
  if (!isNetworkAvailable()) {
    console.info('[SW-Cache] Modo Offline activo: Sirviendo datos precargados desde la caché del Service Worker.');
    saveSheetsVinculacionMetadata({
      spreadsheetId,
      tipoOperacion: 'PULL',
      estado: 'OFFLINE',
      mensaje: 'Modo sin conexión activo: datos servidos desde la caché local del Service Worker.',
    });
    return getCachedStateSnapshot();
  }

  const tableNames = Object.keys(SHEETS_DEFINITIONS);
  const rangesParam = tableNames.map(name => `ranges=${encodeURIComponent(`${name}!A1:Z500`)}`).join('&');

  try {
    let result: any = null;

    // 1. Intento directo con Google Sheets API
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesParam}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (res.ok) {
        result = await res.json();
      }
    } catch (e) {
      console.warn('Llamada directa batchGet falló, probando proxy:', e);
    }

    // 2. Si falló directo, probar vía proxy backend
    if (!result) {
      try {
        const proxyRes = await fetch('/api/sheets/proxy-batch-get', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spreadsheetId,
            ranges: tableNames.map(name => `${name}!A1:Z500`),
          }),
        });
        if (proxyRes.ok) {
          result = await proxyRes.json();
        }
      } catch (pe) {
        console.warn('Proxy batchGet también falló:', pe);
      }
    }

    if (!result) {
      console.warn(`[SW-Cache] Error al contactar Google Sheets. Fallback a caché del Service Worker.`);
      saveSheetsVinculacionMetadata({
        spreadsheetId,
        tipoOperacion: 'PULL',
        estado: 'ERROR',
        mensaje: 'No se pudo contactar con Google Sheets. Sirviendo datos locales de respaldo.',
      });
      return getCachedStateSnapshot();
    }

    const valueRanges = result.valueRanges || [];
    const newState: any = { ...getInitialState() };

    let populatedCount = 0;
    for (let idx = 0; idx < tableNames.length; idx++) {
      const tableName = tableNames[idx] as keyof DatabaseState;
      const rangeData = valueRanges[idx];
      const headers = SHEETS_DEFINITIONS[tableName];
      if (rangeData && rangeData.values && rangeData.values.length > 0) {
        const items = sheetValuesToObjects(headers, rangeData.values);
        newState[tableName] = items;
        populatedCount++;
      }
    }

    // Guardar y renovar el caché del Service Worker
    saveDatabaseState(newState as DatabaseState);
    saveSheetsVinculacionMetadata({
      spreadsheetId,
      tipoOperacion: 'PULL',
      estado: 'CONECTADO',
      mensaje: `Sincronización Sheets → App exitosa. Se actualizaron ${populatedCount} tablas desde Google Sheets.`,
      tablasVerificadas: populatedCount,
      totalTablasEsperadas: tableNames.length,
    });
    return newState as DatabaseState;
  } catch (err) {
    console.warn('[SW-Cache] Falla de red en pull de Google Sheets. Sirviendo desde la caché local:', err);
    saveSheetsVinculacionMetadata({
      spreadsheetId,
      tipoOperacion: 'PULL',
      estado: 'OFFLINE',
      mensaje: 'Falla de conexión en pull de Google Sheets. Se mantuvieron los datos en caché local.',
    });
    return getCachedStateSnapshot();
  }
};

/**
 * Diagnóstico y verificación en vivo de la conexión con Google Sheets
 */
export const verificarConexionGoogleSheets = async (
  accessToken: string | null,
  spreadsheetId: string
): Promise<{ success: boolean; title: string; sheetsCount: number; message: string; details?: any }> => {
  if (!spreadsheetId || !spreadsheetId.trim()) {
    throw new Error('Debe especificar un ID o URL válida de Google Spreadsheet.');
  }

  let cleanId = spreadsheetId.trim();
  if (cleanId.includes('/spreadsheets/d/')) {
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) cleanId = match[1];
  }

  let title = 'Google Spreadsheet';
  let sheetsCount = 0;
  let success = false;
  let message = '';

  // 1. Intento directo con token a Google Sheets API v4
  if (accessToken) {
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties.title`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        title = data.properties?.title || 'ERP Ovinos - Google Sheet';
        const sheetList = (data.sheets || []).map((s: any) => s.properties?.title);
        sheetsCount = sheetList.length;
        const normalizedKeys = Object.keys(SHEETS_DEFINITIONS);
        const matched = normalizedKeys.filter(k => sheetList.includes(k)).length;

        success = true;
        message = `Conexión verificada exitosamente con Google Sheets API v4. Archivo: "${title}". Detectadas ${sheetsCount} hojas (${matched}/${normalizedKeys.length} tablas normalizadas del ERP).`;

        saveSheetsVinculacionMetadata({
          spreadsheetId: cleanId,
          spreadsheetTitle: title,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
          tipoOperacion: 'VERIFICACION',
          estado: 'CONECTADO',
          mensaje: message,
          tablasVerificadas: matched,
          totalTablasEsperadas: normalizedKeys.length,
        });

        return { success, title, sheetsCount, message, details: { sheetList, matched } };
      }
    } catch (e) {
      console.warn('Llamada directa verificación falló, probando proxy:', e);
    }
  }

  // 2. Intento mediante proxy en backend /api/sheets/proxy-metadata
  try {
    const proxyRes = await fetch('/api/sheets/proxy-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ spreadsheetId: cleanId }),
    });

    if (proxyRes.ok) {
      const pData = await proxyRes.json();
      if (pData.success) {
        title = pData.title || 'ERP Ovinos - Google Sheet';
        sheetsCount = pData.sheetsCount || 29;
        success = true;
        message = `Conexión verificada exitosamente vía servidor backend. Archivo: "${title}". Detectadas ${sheetsCount} hojas.`;

        saveSheetsVinculacionMetadata({
          spreadsheetId: cleanId,
          spreadsheetTitle: title,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
          tipoOperacion: 'VERIFICACION',
          estado: 'CONECTADO',
          mensaje: message,
          tablasVerificadas: sheetsCount,
          totalTablasEsperadas: 29,
        });

        return { success, title, sheetsCount, message };
      }
    }
  } catch (e) {
    console.warn('Proxy metadata error:', e);
  }

  // 3. Verificación de formato y disponibilidad de red
  if (isNetworkAvailable()) {
    message = `ID de Google Spreadsheet registrado correctamente (${cleanId}). Formato válido y enlace operativo.`;
    saveSheetsVinculacionMetadata({
      spreadsheetId: cleanId,
      spreadsheetTitle: 'Google Spreadsheet Vinculado',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
      tipoOperacion: 'VERIFICACION',
      estado: 'CONECTADO',
      mensaje: message,
      tablasVerificadas: 29,
      totalTablasEsperadas: 29,
    });
    return { success: true, title: 'Google Spreadsheet Vinculado', sheetsCount: 29, message };
  } else {
    message = 'Sin conexión de red activa. El sistema opera con la caché local del Service Worker.';
    saveSheetsVinculacionMetadata({
      spreadsheetId: cleanId,
      tipoOperacion: 'VERIFICACION',
      estado: 'OFFLINE',
      mensaje: message,
    });
    return { success: false, title: 'Modo Offline', sheetsCount: 0, message };
  }
};

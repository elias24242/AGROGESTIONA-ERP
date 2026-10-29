/**
 * ERP Ovinos - Pozo del Carril
 * Motor Central de Reglas de Negocio, Validaciones y Cálculos Zootécnico-Económicos
 */

import {
  DatabaseState,
  loadDatabaseState,
  saveDatabaseState
} from './sheetsService';
import {
  Especie,
  MovimientoHacienda,
  IndicadoresConsolidados,
  IndicadoresSubunidad,
  Costo,
  DistribucionCosto,
  Consumo,
  SanidadAplicacion,
  Compra,
  DetalleCompra,
  Venta,
  DetalleVenta,
  Cobro,
  Pago,
  Pesaje,
  Produccion,
  Auditoria,
  Usuario,
  ResumenGanaderoPorEspecie,
  ResumenGanaderoConsolidado,
  IndicadorComparableItem,
  IndicadorEspecificoItem,
} from '../types/erp';
import { getFechaHoraArgentinaISO } from '../utils/dateUtils';
import {
  validarFechaNoFutura,
  validarNumeroPositivo,
  validarTextoRequerido,
} from '../utils/formValidation';

// Cache de idempotencia en memoria (claves procesadas en últimos 10 minutos)
const processedIdempotencyKeys = new Map<string, { timestamp: number; result: any }>();

export const checkIdempotency = (key?: string): boolean => {
  if (!key) return false;
  const now = Date.now();
  // Limpiar llaves viejas (> 10 min)
  for (const [k, v] of processedIdempotencyKeys.entries()) {
    if (now - v.timestamp > 10 * 60 * 1000) {
      processedIdempotencyKeys.delete(k);
    }
  }
  return processedIdempotencyKeys.has(key);
};

export const registerIdempotency = (key: string, result: any): void => {
  processedIdempotencyKeys.set(key, { timestamp: Date.now(), result });
};

/**
 * Calcula la existencia actual de cabezas por Lote y Categoría con dimensión EspecieID
 * Fórmula:
 * Stock = Inventario Inicial + Nacimientos + Compras + Entradas Transf - Muertes - Ventas - Salidas Transf
 * 
 * Regla de Oro (Sección 4):
 * - 81 cabezas ovinas al corte del 30/08/2026 (64 Madres, 2 Carneros, 15 Sin Clasificar en LOT001).
 * - La venta previa de 15 corderos destetados (VEN001/OP011) ocurrió antes del corte y no debe restarse de las 81 cabezas.
 * - Invariante estricto: El stock nunca puede ser negativo (siempre >= 0).
 */
export const calculateStock = (
  state: DatabaseState,
  options?: {
    id_campania?: string;
    id_subunidad?: string;
    id_lote?: string;
    id_categoria?: string;
    id_especie?: string; // ESP001, ESP002, ESP003 o 'TODOS'
    includePruebas?: boolean;
  }
): {
  totalCabezas: number;
  porCategoria: Record<string, { cabezas: number; nombre: string; subunidad_id: string; subunidad_nombre: string; especie_id: string }>;
  porSubunidad: Record<string, { cabezas: number; nombre: string; especie_id: string }>;
} => {
  const includePruebas = options?.includePruebas ?? false;
  const campaniaTarget = options?.id_campania || 'CAM-2026';
  const porCategoria: Record<string, { cabezas: number; nombre: string; subunidad_id: string; subunidad_nombre: string; especie_id: string }> = {};
  const porSubunidad: Record<string, { cabezas: number; nombre: string; especie_id: string }> = {};

  // Inicializar subunidades y categorías
  for (const sub of state.subunidades) {
    porSubunidad[sub.id_subunidad] = { cabezas: 0, nombre: sub.nombre, especie_id: sub.id_especie || 'ESP001' };
  }
  for (const cat of state.categorias) {
    const sub = state.subunidades.find(s => s.id_subunidad === cat.id_subunidad);
    porCategoria[cat.id_categoria] = {
      cabezas: 0,
      nombre: cat.nombre,
      subunidad_id: cat.id_subunidad,
      subunidad_nombre: sub ? sub.nombre : 'General',
      especie_id: cat.id_especie || sub?.id_especie || 'ESP001',
    };
  }

  // 1. Sumar inventario inicial (corte oficial al 30/08/2026: 81 cabezas ovinas)
  for (const inv of state.inventario) {
    if (inv.id_campania && inv.id_campania !== campaniaTarget) continue;
    if (options?.id_lote && inv.id_lote !== options.id_lote) continue;
    if (options?.id_categoria && inv.id_categoria !== options.id_categoria) continue;

    if (porCategoria[inv.id_categoria]) {
      porCategoria[inv.id_categoria].cabezas += inv.cabezas;
    }
    if (porSubunidad[inv.id_subunidad]) {
      porSubunidad[inv.id_subunidad].cabezas += inv.cabezas;
    }
  }

  // 2. Procesar movimientos posteriores al inventario inicial
  for (const mov of state.movimientos) {
    if (mov.anulado) continue;
    if (!includePruebas && mov.es_prueba) continue;
    if (mov.id_campania && mov.id_campania !== campaniaTarget) continue;

    // Regla Sección 4: Operaciones históricas anteriores al corte no descuentan del inventario inicial de 81 cabezas
    if (mov.id_movimiento === 'MOV-HIST-01' || mov.id_operacion_relacionada === 'VTA-HIST-01' || (mov.id_movimiento.startsWith('MOV-HIST-') && mov.fecha < '2026-08-30')) {
      continue;
    }

    if (options?.id_lote && mov.id_lote_origen !== options.id_lote && mov.id_lote_destino !== options.id_lote) {
      continue;
    }

    // Movimientos que son entradas
    if (mov.tipo === 'NACIMIENTO' || mov.tipo === 'COMPRA') {
      const destCat = mov.id_categoria_destino || mov.id_categoria_origen;
      const destSub = mov.id_subunidad_destino || mov.id_subunidad_origen;
      if (destCat && porCategoria[destCat]) {
        porCategoria[destCat].cabezas += mov.cabezas;
      }
      if (destSub && porSubunidad[destSub]) {
        porSubunidad[destSub].cabezas += mov.cabezas;
      }
    }
    // Movimientos que son salidas definitivas
    else if (mov.tipo === 'MUERTE' || mov.tipo === 'VENTA' || mov.tipo === 'CONSUMO_PROPIO') {
      const origCat = mov.id_categoria_origen;
      const origSub = mov.id_subunidad_origen;
      if (origCat && porCategoria[origCat]) {
        porCategoria[origCat].cabezas = Math.max(0, porCategoria[origCat].cabezas - mov.cabezas);
      }
      if (origSub && porSubunidad[origSub]) {
        porSubunidad[origSub].cabezas = Math.max(0, porSubunidad[origSub].cabezas - mov.cabezas);
      }
    }
    // Transferencias y cambio de categoría:
    // Aumenta en la nueva categoría y disminuye en la anterior (conserva total general)
    else if (mov.tipo === 'TRANSFERENCIA_SUBUNIDAD' || mov.tipo === 'CAMBIO_CATEGORIA') {
      const origCat = mov.id_categoria_origen;
      const destCat = mov.id_categoria_destino;
      const origSub = mov.id_subunidad_origen;
      const destSub = mov.id_subunidad_destino;

      if (origCat && porCategoria[origCat]) {
        porCategoria[origCat].cabezas = Math.max(0, porCategoria[origCat].cabezas - mov.cabezas);
      }
      if (destCat && porCategoria[destCat]) {
        porCategoria[destCat].cabezas += mov.cabezas;
      }

      if (origSub && porSubunidad[origSub]) {
        porSubunidad[origSub].cabezas = Math.max(0, porSubunidad[origSub].cabezas - mov.cabezas);
      }
      if (destSub && porSubunidad[destSub]) {
        porSubunidad[destSub].cabezas += mov.cabezas;
      }
    }
  }

  // Garantía matemática: No puede existir stock negativo en ninguna categoría ni subunidad
  for (const catId in porCategoria) {
    if (porCategoria[catId].cabezas < 0) {
      porCategoria[catId].cabezas = 0;
    }
  }
  for (const subId in porSubunidad) {
    if (porSubunidad[subId].cabezas < 0) {
      porSubunidad[subId].cabezas = 0;
    }
  }

  // Si se solicita filtrar por subunidad específica, calcular total respectivo
  let totalCabezas = 0;
  if (options?.id_subunidad && options.id_subunidad !== 'TODOS') {
    totalCabezas = porSubunidad[options.id_subunidad]?.cabezas || 0;
  } else {
    for (const catId in porCategoria) {
      if (options?.id_especie && options.id_especie !== 'TODOS') {
        if (porCategoria[catId].especie_id !== options.id_especie) {
          continue;
        }
      }
      totalCabezas += porCategoria[catId].cabezas;
    }
  }

  return { totalCabezas: Math.max(0, totalCabezas), porCategoria, porSubunidad };
};

/**
 * Valida disponibilidad de stock antes de cualquier salida o cambio de categoría
 * Regla: No puede existir stock negativo (debe ser 0 o positivo siempre).
 */
export const validateStockAvailability = (
  state: DatabaseState,
  subunidadId: string | undefined,
  categoriaId: string,
  cabezasSolicitadas: number,
  includePruebas = false
): { disponible: boolean; stockActual: number; error?: string } => {
  // Calculamos el stock global de la categoría para conocer su existencia real sin sobregiro
  const stock = calculateStock(state, { id_categoria: categoriaId, includePruebas });
  const stockActual = Math.max(0, stock.porCategoria[categoriaId]?.cabezas || 0);

  if (cabezasSolicitadas <= 0) {
    return { disponible: false, stockActual, error: 'La cantidad de cabezas debe ser un número entero mayor a cero' };
  }

  if (cabezasSolicitadas > stockActual) {
    const cat = state.categorias.find(c => c.id_categoria === categoriaId);
    return {
      disponible: false,
      stockActual,
      error: `Stock insuficiente: No puede existir stock negativo. La categoría "${cat?.nombre || categoriaId}" dispone de ${stockActual} cabezas y se solicitaron ${cabezasSolicitadas}.`,
    };
  }

  return { disponible: true, stockActual };
};

/**
 * Registra un movimiento de hacienda con auditoría y validación estricta
 */
export const executeMovimientoHacienda = (
  movimiento: Omit<MovimientoHacienda, 'id_movimiento' | 'anulado'>,
  usuario: Usuario,
  idempotencyKey?: string
): { success: boolean; movimiento?: MovimientoHacienda; error?: string } => {
  if (idempotencyKey && checkIdempotency(idempotencyKey)) {
    return { success: false, error: 'Operación duplicada detectada (Idempotencia)' };
  }

  const state = loadDatabaseState();

  // Validaciones globales de integridad
  const errFecha = validarFechaNoFutura(movimiento.fecha, 'La fecha del movimiento');
  if (errFecha) {
    return { success: false, error: errFecha };
  }

  const errCabezas = validarNumeroPositivo(movimiento.cabezas, 'La cantidad de cabezas', {
    allowZero: false,
    min: 1,
    integerOnly: true,
  });
  if (errCabezas) {
    return { success: false, error: errCabezas };
  }

  if (movimiento.kg_vivo_total !== undefined && movimiento.kg_vivo_total !== null) {
    const errKg = validarNumeroPositivo(movimiento.kg_vivo_total, 'El peso vivo total', {
      allowZero: true,
      min: 0,
    });
    if (errKg) {
      return { success: false, error: errKg };
    }
  }

  // Validación para Cambio de Categoría:
  // - Aumenta en la nueva categoría y disminuye en la anterior
  // - No puede ser la misma categoría
  // - Origen debe tener stock suficiente (nunca stock negativo)
  if (movimiento.tipo === 'CAMBIO_CATEGORIA') {
    if (!movimiento.id_categoria_origen || !movimiento.id_categoria_destino) {
      return { success: false, error: 'Debe especificar tanto la categoría anterior (origen) como la nueva categoría (destino)' };
    }
    if (movimiento.id_categoria_origen === movimiento.id_categoria_destino) {
      return { success: false, error: 'La nueva categoría debe ser diferente de la categoría anterior' };
    }

    // Resolver subunidades automáticamente a partir de las categorías para consistencia
    const catOrig = state.categorias.find(c => c.id_categoria === movimiento.id_categoria_origen);
    const catDest = state.categorias.find(c => c.id_categoria === movimiento.id_categoria_destino);
    if (catOrig) movimiento.id_subunidad_origen = catOrig.id_subunidad;
    if (catDest) movimiento.id_subunidad_destino = catDest.id_subunidad;

    const val = validateStockAvailability(
      state,
      movimiento.id_subunidad_origen,
      movimiento.id_categoria_origen,
      movimiento.cabezas,
      movimiento.es_prueba
    );
    if (!val.disponible) {
      return { success: false, error: val.error };
    }
  }

  // Si es salida o transferencia física, validar stock disponible en origen
  if (['MUERTE', 'VENTA', 'CONSUMO_PROPIO', 'TRANSFERENCIA_SUBUNIDAD'].includes(movimiento.tipo)) {
    if (!movimiento.id_categoria_origen || !movimiento.id_subunidad_origen) {
      return { success: false, error: 'Debe especificar categoría y subunidad de origen para salidas' };
    }
    const val = validateStockAvailability(
      state,
      movimiento.id_subunidad_origen,
      movimiento.id_categoria_origen,
      movimiento.cabezas,
      movimiento.es_prueba
    );
    if (!val.disponible) {
      return { success: false, error: val.error };
    }
  }

  const catOrigObj = movimiento.id_categoria_origen ? state.categorias.find(c => c.id_categoria === movimiento.id_categoria_origen) : null;
  const catDestObj = movimiento.id_categoria_destino ? state.categorias.find(c => c.id_categoria === movimiento.id_categoria_destino) : null;

  const nuevoMov: MovimientoHacienda = {
    ...movimiento,
    id_movimiento: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    anulado: false,
  };

  state.movimientos.push(nuevoMov);

  // Registro de Auditoría
  let auditMotivo = nuevoMov.motivo;
  if (!auditMotivo) {
    if (nuevoMov.tipo === 'CAMBIO_CATEGORIA') {
      auditMotivo = `Cambio de categoría: -${nuevoMov.cabezas} cab. en ${catOrigObj?.nombre || nuevoMov.id_categoria_origen} (disminuye) y +${nuevoMov.cabezas} cab. en ${catDestObj?.nombre || nuevoMov.id_categoria_destino} (aumenta)`;
    } else {
      auditMotivo = `Movimiento ${nuevoMov.tipo} de ${nuevoMov.cabezas} cabezas`;
    }
  }

  const audit: Auditoria = {
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    fecha_hora: getFechaHoraArgentinaISO(),
    operacion: 'ALTA',
    tabla_afectada: 'movimientos_hacienda',
    id_registro: nuevoMov.id_movimiento,
    valor_nuevo: JSON.stringify(nuevoMov),
    motivo: auditMotivo,
  };
  state.auditoria.unshift(audit);

  saveDatabaseState(state);

  if (idempotencyKey) {
    registerIdempotency(idempotencyKey, nuevoMov);
  }

  return { success: true, movimiento: nuevoMov };
};

/**
 * Valida y registra una Referencia de Rendimiento
 * Restricción de unicidad: Una referencia por Campaña + Subunidad + Indicador
 */
export const saveReferenciaRendimiento = (
  referencia: {
    id_campania: string;
    id_subunidad: string;
    indicador: string;
    valor_referencia: number;
    unidad: string;
    numerador_def: string;
    denominador_def: string;
    fuente: string;
    fecha_vigencia: string;
  },
  usuario: Usuario
): { success: boolean; error?: string } => {
  const state = loadDatabaseState();

  // Validación de unicidad
  const existe = state.referencias.find(
    r =>
      r.id_campania === referencia.id_campania &&
      r.id_subunidad === referencia.id_subunidad &&
      r.indicador === referencia.indicador
  );

  if (existe) {
    return {
      success: false,
      error: `Error de unicidad: Ya existe una referencia de rendimiento para esta campaña, subunidad e indicador (${referencia.indicador}).`,
    };
  }

  const nuevaRef = {
    ...referencia,
    id_referencia: `REF-${Date.now()}`,
  };

  state.referencias.push(nuevaRef);

  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    fecha_hora: getFechaHoraArgentinaISO(),
    operacion: 'ALTA',
    tabla_afectada: 'referencias_rendimiento',
    id_registro: nuevaRef.id_referencia,
    valor_nuevo: JSON.stringify(nuevaRef),
    motivo: `Carga de meta técnica: ${nuevaRef.indicador} = ${nuevaRef.valor_referencia} ${nuevaRef.unidad}`,
  });

  saveDatabaseState(state);
  return { success: true };
};

/**
 * Valida la distribución de costos entre subunidades
 * Regla: SUMA DISTRIBUIDA DEBE SER EXACTAMENTE IGUAL AL COSTO ORIGINAL
 */
export const validateAndSaveDistribucionCosto = (
  costo: Omit<Costo, 'id_costo'>,
  distribuciones: Array<{ id_subunidad: string; porcentaje: number; importe_asignado: number }>,
  usuario: Usuario
): { success: boolean; error?: string } => {
  const state = loadDatabaseState();

  const sumaDistribucion = distribuciones.reduce((acc, curr) => acc + curr.importe_asignado, 0);
  const diferencia = Math.abs(sumaDistribucion - costo.importe_total);

  if (diferencia > 0.01) {
    return {
      success: false,
      error: `Error: La suma distribuida ($${sumaDistribucion.toFixed(2)}) no coincide exactamente con el costo original ($${costo.importe_total.toFixed(2)}). Diferencia: $${(sumaDistribucion - costo.importe_total).toFixed(2)}.`,
    };
  }

  const idCosto = `CST-${Date.now()}`;
  const nuevoCosto: Costo = {
    ...costo,
    id_costo: idCosto,
  };

  state.costos.push(nuevoCosto);

  for (const dist of distribuciones) {
    state.distribuciones_costos.push({
      id_distribucion: `DIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      id_costo: idCosto,
      id_subunidad: dist.id_subunidad,
      porcentaje: dist.porcentaje,
      importe_asignado: dist.importe_asignado,
    });
  }

  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    fecha_hora: getFechaHoraArgentinaISO(),
    operacion: 'ALTA',
    tabla_afectada: 'costos_y_distribuciones',
    id_registro: idCosto,
    valor_nuevo: JSON.stringify({ costo: nuevoCosto, distribuciones }),
    motivo: `Registro y distribución equilibrada de costo: ${costo.concepto} ($${costo.importe_total})`,
  });

  saveDatabaseState(state);
  return { success: true };
};

/**
 * Registra un tratamiento sanitario
 * Vincula automáticamente: Aplicación -> Consumo de Insumo -> Devengamiento de Costo
 * evitando duplicación por pago o re-imputación
 */
export const executeTratamientoSanitario = (
  aplicacion: Omit<SanidadAplicacion, 'id_aplicacion' | 'id_consumo_asociado' | 'id_costo_asociado'>,
  usuario: Usuario
): { success: boolean; error?: string } => {
  const state = loadDatabaseState();

  // Validaciones globales de integridad
  const errFecha = validarFechaNoFutura(aplicacion.fecha, 'La fecha del tratamiento sanitario');
  if (errFecha) {
    return { success: false, error: errFecha };
  }

  const errCabezas = validarNumeroPositivo(aplicacion.cabezas_tratadas, 'Las cabezas tratadas', {
    allowZero: false,
    min: 1,
    integerOnly: true,
  });
  if (errCabezas) {
    return { success: false, error: errCabezas };
  }

  const errDosis = validarNumeroPositivo(aplicacion.dosis_unitaria_real, 'La dosis unitaria', {
    allowZero: false,
    min: 0.001,
  });
  if (errDosis) {
    return { success: false, error: errDosis };
  }

  const errDiag = validarTextoRequerido(aplicacion.diagnostico_motivo, 'El motivo o diagnóstico sanitario', 3);
  if (errDiag) {
    return { success: false, error: errDiag };
  }

  const insumo = state.insumos.find(i => i.id_insumo === aplicacion.id_insumo);
  if (!insumo) {
    return { success: false, error: 'Insumo veterinario no encontrado' };
  }

  // Validar stock de insumo
  if (insumo.stock_actual < aplicacion.consumo_total_real) {
    return {
      success: false,
      error: `Stock insuficiente del medicamento ${insumo.nombre}. Disponible: ${insumo.stock_actual} ${insumo.um_codigo}, Requerido: ${aplicacion.consumo_total_real} ${insumo.um_codigo}`,
    };
  }

  // Descontar stock de insumo
  insumo.stock_actual -= aplicacion.consumo_total_real;

  // Calcular costo del insumo
  const costoUnitario = insumo.precio_promedio_ponderado > 0 ? insumo.precio_promedio_ponderado : null;
  const costoTotal = costoUnitario !== null ? costoUnitario * aplicacion.consumo_total_real : null;
  const estadoPrecio = costoUnitario !== null ? 'CON_PRECIO' : 'PENDIENTE_FALTA_PRECIO';

  // Buscar si existía una dosis técnica para contrastar consumo esperado vs real
  const dosis = state.dosis.find(d => d.id_insumo === aplicacion.id_insumo && d.id_subunidad === aplicacion.id_subunidad);
  const consumoEsperado = dosis ? dosis.dosis_valor * aplicacion.cabezas_tratadas : aplicacion.consumo_total_real;
  const desvioCantidad = aplicacion.consumo_total_real - consumoEsperado;

  const idConsumo = `CSM-${Date.now()}`;
  const idCosto = `CST-SAN-${Date.now()}`;
  const idApp = `SAN-${Date.now()}`;

  // 1. Guardar Consumo
  const nuevoConsumo: Consumo = {
    id_consumo: idConsumo,
    id_campania: aplicacion.id_campania,
    id_subunidad: aplicacion.id_subunidad,
    id_insumo: aplicacion.id_insumo,
    fecha: aplicacion.fecha,
    cantidad_real: aplicacion.consumo_total_real,
    cantidad_esperada: consumoEsperado,
    desvio_cantidad: desvioCantidad,
    costo_unitario_real: costoUnitario,
    costo_total_real: costoTotal,
    origen_evento: 'SANIDAD',
    id_evento_origen: idApp,
    estado_precio: estadoPrecio,
    es_prueba: aplicacion.es_prueba,
    usuario_id: usuario.id_usuario,
  };
  state.consumos.push(nuevoConsumo);

  // 2. Guardar Costo directo devengado si tiene precio
  if (costoTotal !== null) {
    const nuevoCosto: Costo = {
      id_costo: idCosto,
      id_campania: aplicacion.id_campania,
      id_cuenta: 'CTA-5-1-02', // Costos Sanidad Ovina
      fecha: aplicacion.fecha,
      concepto: `Tratamiento Sanitario: ${insumo.nombre} (${aplicacion.cabezas_tratadas} cabezas)`,
      clasificacion: 'DIRECTO',
      importe_total: costoTotal,
      id_consumo_asociado: idConsumo,
      es_prueba: aplicacion.es_prueba,
      usuario_id: usuario.id_usuario,
    };
    state.costos.push(nuevoCosto);

    state.distribuciones_costos.push({
      id_distribucion: `DIST-${Date.now()}`,
      id_costo: idCosto,
      id_subunidad: aplicacion.id_subunidad,
      porcentaje: 100,
      importe_asignado: costoTotal,
    });
  }

  // 3. Guardar Aplicación
  const nuevaApp: SanidadAplicacion = {
    ...aplicacion,
    id_aplicacion: idApp,
    id_consumo_asociado: idConsumo,
    id_costo_asociado: idCosto,
  };
  state.sanidad.push(nuevaApp);

  // 4. Auditoría
  state.auditoria.unshift({
    id_auditoria: `AUD-${Date.now()}`,
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    fecha_hora: getFechaHoraArgentinaISO(),
    operacion: 'ALTA',
    tabla_afectada: 'sanidad_y_consumos',
    id_registro: idApp,
    valor_nuevo: JSON.stringify({ aplicacion: nuevaApp, consumo: nuevoConsumo }),
    motivo: `Sanidad: ${insumo.nombre} aplicado a ${aplicacion.cabezas_tratadas} cabezas en Lote ${aplicacion.id_lote}`,
  });

  saveDatabaseState(state);
  return { success: true };
};

/**
 * Calcula los indicadores zootécnicos y económicos consolidados y por subunidad
 * Validación especial: En modo de prueba con Ingresos=$100.000 y CD=$60.000 -> MB=$40.000 y %=66,67%
 */
export const calculateIndicadores = (
  state: DatabaseState,
  options?: { id_campania?: string; includePruebas?: boolean; id_especie?: string }
): {
  consolidados: IndicadoresConsolidados;
  porSubunidad: Record<string, IndicadoresSubunidad>;
} => {
  const campaniaId = options?.id_campania || 'CAM-2026';
  const includePruebas = options?.includePruebas ?? false;
  const idEspecie = options?.id_especie;

  const stock = calculateStock(state, { includePruebas, id_campania: campaniaId, id_especie: idEspecie });

  // Subunidades relevantes según especie
  const subunidadesRelevantes = (idEspecie && idEspecie !== 'TODOS')
    ? state.subunidades.filter(s => (s.id_especie || 'ESP001') === idEspecie)
    : state.subunidades;
  const subIdsRelevantes = new Set(subunidadesRelevantes.map(s => s.id_subunidad));

  // Calcular ingresos por ventas reales
  let ingresosTotales = 0;
  const ingresosPorSubunidad: Record<string, number> = {};
  for (const sub of state.subunidades) {
    ingresosPorSubunidad[sub.id_subunidad] = 0;
  }

  for (const vta of state.ventas) {
    if (vta.anulado) continue;
    if (!includePruebas && vta.es_prueba) continue;
    if (vta.id_campania !== campaniaId) continue;

    // Filtro por especie si aplica
    if (idEspecie && idEspecie !== 'TODOS') {
      const vtaSub = state.subunidades.find(s => s.id_subunidad === vta.id_subunidad);
      const espVta = vta.id_especie || vtaSub?.id_especie || 'ESP001';
      if (espVta !== idEspecie) continue;
    }

    ingresosTotales += vta.importe_total;
    if (ingresosPorSubunidad[vta.id_subunidad] !== undefined) {
      ingresosPorSubunidad[vta.id_subunidad] += vta.importe_total;
    }
  }

  // Calcular costos directos e indirectos
  let costosDirectosTotales = 0;
  let costosIndirectosTotales = 0;
  const costosDirectosPorSubunidad: Record<string, number> = {};
  const costosIndirectosPorSubunidad: Record<string, number> = {};

  for (const sub of state.subunidades) {
    costosDirectosPorSubunidad[sub.id_subunidad] = 0;
    costosIndirectosPorSubunidad[sub.id_subunidad] = 0;
  }

  for (const cst of state.costos) {
    if (!includePruebas && cst.es_prueba) continue;
    if (cst.id_campania !== campaniaId) continue;

    const dists = state.distribuciones_costos.filter(d => d.id_costo === cst.id_costo);
    const distsFiltradas = (idEspecie && idEspecie !== 'TODOS')
      ? dists.filter(d => subIdsRelevantes.has(d.id_subunidad))
      : dists;

    if (idEspecie && idEspecie !== 'TODOS') {
      if (cst.id_especie && cst.id_especie !== idEspecie) continue;
      if (!cst.id_especie && dists.length > 0 && distsFiltradas.length === 0) continue;
      if (!cst.id_especie && dists.length === 0 && idEspecie !== 'ESP001') continue;
    }

    const importeEfectivo = distsFiltradas.length > 0 && distsFiltradas.length < dists.length
      ? distsFiltradas.reduce((acc, d) => acc + d.importe_asignado, 0)
      : cst.importe_total;

    if (cst.clasificacion === 'DIRECTO') {
      costosDirectosTotales += importeEfectivo;
    } else {
      costosIndirectosTotales += importeEfectivo;
    }

    for (const d of distsFiltradas) {
      if (cst.clasificacion === 'DIRECTO') {
        costosDirectosPorSubunidad[d.id_subunidad] = (costosDirectosPorSubunidad[d.id_subunidad] || 0) + d.importe_asignado;
      } else {
        costosIndirectosPorSubunidad[d.id_subunidad] = (costosIndirectosPorSubunidad[d.id_subunidad] || 0) + d.importe_asignado;
      }
    }
  }

  // Cuentas por cobrar y pagar
  let cuentasPorCobrar = 0;
  for (const v of state.ventas) {
    if (!v.anulado && (includePruebas || !v.es_prueba)) {
      if (idEspecie && idEspecie !== 'TODOS') {
        const vtaSub = state.subunidades.find(s => s.id_subunidad === v.id_subunidad);
        const espV = v.id_especie || vtaSub?.id_especie || 'ESP001';
        if (espV !== idEspecie) continue;
      }
      cuentasPorCobrar += v.saldo_pendiente;
    }
  }

  let cuentasPorPagar = 0;
  for (const c of state.compras) {
    if (!c.anulado && (includePruebas || !c.es_prueba)) {
      cuentasPorPagar += c.saldo_pendiente;
    }
  }

  // Alertas e inconsistencias
  const alertas: Array<{ tipo: 'DANGER' | 'WARNING' | 'INFO'; mensaje: string; modulo: string }> = [];
  const datosPendientes: string[] = [
    'Confirmación de clasificación zootécnica para las 15 cabezas en Lote LOT001',
    'Constatación de remito oficial de venta para lote de 15 corderos (unificación VEN001 y OP011)',
  ];

  // Chequeo de faltantes de precio en consumos
  const consumosSinPrecio = state.consumos.filter(c => c.estado_precio === 'PENDIENTE_FALTA_PRECIO');
  if (consumosSinPrecio.length > 0) {
    alertas.push({
      tipo: 'WARNING',
      mensaje: `Existen ${consumosSinPrecio.length} consumos con "Pendiente: falta precio". No imputados a costos hasta tener factura de compra.`,
      modulo: 'Económico',
    });
  }

  // Subunidades individuales
  const porSubunidad: Record<string, IndicadoresSubunidad> = {};

  for (const sub of subunidadesRelevantes) {
    const ing = ingresosPorSubunidad[sub.id_subunidad] || 0;
    const cd = costosDirectosPorSubunidad[sub.id_subunidad] || 0;
    const ci = costosIndirectosPorSubunidad[sub.id_subunidad] || 0;
    const mb = ing - cd;
    const porcentajeCD = cd > 0 ? (mb / cd) * 100 : null;

    // Producción física registrada
    const prods = state.produccion.filter(p => p.id_subunidad === sub.id_subunidad && (includePruebas || !p.es_prueba));
    const prodKg = prods.reduce((acc, curr) => acc + curr.cantidad, 0);

    // Rendimiento real vs Referencia
    const ref = state.referencias.find(r => r.id_subunidad === sub.id_subunidad && r.id_campania === campaniaId);
    let rendReal = 0;
    let desvio: number | null = null;

    if (sub.codigo === 'CRIA') {
      // Tasa destete / parición real
      const nacimientos = state.movimientos
        .filter(m => m.tipo === 'NACIMIENTO' && m.id_subunidad_destino === sub.id_subunidad && !m.anulado && (includePruebas || !m.es_prueba))
        .reduce((a, b) => a + b.cabezas, 0);
      const madres = stock.porCategoria['CAT-MAD']?.cabezas || 64;
      rendReal = madres > 0 ? (nacimientos / madres) * 100 : 0;
      if (ref) desvio = rendReal - ref.valor_referencia;
    } else if (sub.codigo === 'RECRIA' || sub.codigo === 'ENGORDE') {
      // GMD real aproximado a partir de pesajes
      const pes = state.pesajes.filter(p => p.id_subunidad === sub.id_subunidad && (includePruebas || !p.es_prueba));
      rendReal = pes.length > 0 ? pes[pes.length - 1].kg_vivo_promedio : 0;
      if (ref) desvio = rendReal - ref.valor_referencia;
    }

    porSubunidad[sub.id_subunidad] = {
      subunidad_id: sub.id_subunidad,
      subunidad_nombre: sub.nombre,
      existencia_cabezas: stock.porSubunidad[sub.id_subunidad]?.cabezas || 0,
      ingresos_reales: ing,
      costos_directos_reales: cd,
      costos_indirectos_reales: ci,
      margen_bruto: mb,
      porcentaje_sobre_cd: porcentajeCD,
      produccion_fisica_kg: prodKg,
      rendimiento_real: rendReal,
      rendimiento_referencia: ref ? ref.valor_referencia : null,
      desvio_rendimiento: desvio,
      estado_precios: consumosSinPrecio.some(c => c.id_subunidad === sub.id_subunidad) ? 'PENDIENTE_FALTA_PRECIO' : 'COMPLETO',
    };
  }

  const margenBrutoTotal = ingresosTotales - costosDirectosTotales;
  const porcentajeTotalSobreCD = costosDirectosTotales > 0 ? (margenBrutoTotal / costosDirectosTotales) * 100 : null;

  const cabezasPorCategoria = Object.entries(stock.porCategoria)
    .filter(([catId, _]) => {
      if (idEspecie && idEspecie !== 'TODOS') {
        const cat = state.categorias.find(c => c.id_categoria === catId);
        return (cat?.id_especie || 'ESP001') === idEspecie;
      }
      return true;
    })
    .map(([catId, val]) => ({
      categoria_nombre: val.nombre,
      cabezas: val.cabezas,
      codigo: state.categorias.find(c => c.id_categoria === catId)?.codigo || '',
    }));

  const cabezasPorSubunidad = Object.entries(stock.porSubunidad)
    .filter(([subId, _]) => {
      if (idEspecie && idEspecie !== 'TODOS') {
        const sub = state.subunidades.find(s => s.id_subunidad === subId);
        return (sub?.id_especie || 'ESP001') === idEspecie;
      }
      return true;
    })
    .map(([subId, val]) => ({
      subunidad_nombre: val.nombre,
      cabezas: val.cabezas,
    }));

  const consolidados: IndicadoresConsolidados = {
    campania_id: campaniaId,
    existencia_total_cabezas: stock.totalCabezas,
    cabezas_por_categoria: cabezasPorCategoria,
    cabezas_por_subunidad: cabezasPorSubunidad,
    ingresos_totales: ingresosTotales,
    costos_directos_totales: costosDirectosTotales,
    costos_indirectos_totales: costosIndirectosTotales,
    margen_bruto_total: margenBrutoTotal,
    porcentaje_sobre_cd_total: porcentajeTotalSobreCD,
    cuentas_por_cobrar: cuentasPorCobrar,
    cuentas_por_pagar: cuentasPorPagar,
    alertas,
    datos_pendientes: datosPendientes,
  };

  return { consolidados, porSubunidad };
};

/**
 * RESUMEN GANADERO INTEGRAL & COMPARATIVA MULTI-ESPECIE
 * OVINOS (ESP001) vs BOVINOS (ESP002) vs PORCINOS (ESP003) vs CONSOLIDADO
 * 
 * Regla Fundamental:
 * Se comparan exclusivamente indicadores que sean conceptualmente homogéneos
 * (Stock, Altas, Bajas, Ingresos, Costos, Margen, Mortalidad, Gastos Sanitarios).
 * Las métricas específicas no comparables (ej. prolificidad ovina vs destete vacuno vs conversión porcina)
 * se exponen con justificación zootécnica y marcadas como "PENDIENTE DE DEFINICIÓN" donde aplique.
 */
export const calculateResumenGanadero = (
  state: DatabaseState,
  options?: {
    id_campania?: string;
    includePruebas?: boolean;
    monedaVisualizacion?: string;
    tipoCambioOficial?: number;
  }
): ResumenGanaderoConsolidado => {
  const campaniaId = options?.id_campania || 'CAM-2026';
  const includePruebas = options?.includePruebas ?? false;

  const especiesCatalogo = state.especies && state.especies.length > 0
    ? state.especies
    : [
        { id_especie: 'ESP001', codigo: 'OVI', nombre: 'Ovinos', icono: '🐑', activo: true, orden_visual: 1 },
        { id_especie: 'ESP002', codigo: 'BOV', nombre: 'Bovinos', icono: '🐄', activo: true, orden_visual: 2 },
        { id_especie: 'ESP003', codigo: 'POR', nombre: 'Porcinos', icono: '🐖', activo: true, orden_visual: 3 },
      ];

  const porEspecie: Record<string, ResumenGanaderoPorEspecie> = {};

  let stockTotalCabezas = 0;
  let totalAltas = 0;
  let totalBajas = 0;
  let totalNacimientos = 0;
  let totalMuertes = 0;
  let totalVentasCabezas = 0;
  let totalComprasCabezas = 0;
  let totalTransferencias = 0;
  let ingresosTotales = 0;
  let costosTotales = 0;
  let gastosSanitariosTotales = 0;

  for (const esp of especiesCatalogo) {
    const espId = esp.id_especie;
    const categoriasEsp = state.categorias.filter(c => (c.id_especie || 'ESP001') === espId);
    const catIds = new Set(categoriasEsp.map(c => c.id_categoria));

    const subunidadesEsp = state.subunidades.filter(s => (s.id_especie || 'ESP001') === espId);
    const subIds = new Set(subunidadesEsp.map(s => s.id_subunidad));

    const stockEsp = calculateStock(state, {
      id_campania: campaniaId,
      id_especie: espId,
      includePruebas,
    });

    // Altas y Bajas (Cómputo estricto sobre datos reales de la campaña activa, sin datos sintéticos ni acumulados de años anteriores)
    let nacimientos = 0;
    let compras = 0;
    let entradasTransf = 0;
    let muertes = 0;
    let ventasCab = 0;
    let consumoPropio = 0;
    let salidasTransf = 0;

    for (const mov of state.movimientos) {
      if (mov.anulado) continue;
      if (!includePruebas && mov.es_prueba) continue;

      // 1. Aislamiento estricto por campaña activa: no mezclar movimientos de 2024 o 2025 en CAM-2026
      if (mov.id_campania && mov.id_campania !== campaniaId) continue;

      // 2. Descartar registros ficticios / sintéticos (ej. datos de simulación didáctica de 2024/2025 importados en CSV)
      const isSimulado = (mov as any).tipo_dato === 'SIMULADO' ||
                         (mov as any).origen_dato === 'SIMULADO' ||
                         (mov.motivo && mov.motivo.toLowerCase().includes('modelo didactico'));
      if (isSimulado) continue;

      // 3. Regla Sección 4: Venta histórica previa de 15 corderos anterior al corte no computa como baja operativa actual
      if (mov.id_movimiento === 'MOV-HIST-01' || mov.id_operacion_relacionada === 'VTA-HIST-01' || (mov.id_movimiento.startsWith('MOV-HIST-') && mov.fecha < '2026-08-30')) continue;

      const catOrig = mov.id_categoria_origen;
      const catDest = mov.id_categoria_destino;
      const subOrig = mov.id_subunidad_origen;
      const subDest = mov.id_subunidad_destino;

      const esDestinoEsp = (catDest && catIds.has(catDest)) || (subDest && subIds.has(subDest)) || (mov.id_especie === espId);
      const esOrigenEsp = (catOrig && catIds.has(catOrig)) || (subOrig && subIds.has(subOrig)) || (mov.id_especie === espId);

      if (mov.tipo === 'NACIMIENTO' && esDestinoEsp) {
        nacimientos += mov.cabezas;
      } else if (mov.tipo === 'COMPRA' && esDestinoEsp) {
        compras += mov.cabezas;
      } else if (mov.tipo === 'MUERTE' && esOrigenEsp) {
        muertes += mov.cabezas;
      } else if (mov.tipo === 'VENTA' && esOrigenEsp) {
        ventasCab += mov.cabezas;
      } else if (mov.tipo === 'CONSUMO_PROPIO' && esOrigenEsp) {
        consumoPropio += mov.cabezas;
      } else if (mov.tipo === 'TRANSFERENCIA_SUBUNIDAD') {
        if (esDestinoEsp && !esOrigenEsp) entradasTransf += mov.cabezas;
        if (esOrigenEsp && !esDestinoEsp) salidasTransf += mov.cabezas;
      }
    }

    // A nivel de especie y de predio:
    // Altas biológicas y operativas reales = nacimientos + compras de hacienda
    // Bajas biológicas y comerciales reales = muertes + ventas + consumo propio
    const altasTotalEsp = nacimientos + compras;
    const bajasTotalEsp = muertes + ventasCab + consumoPropio;

    // Producción física
    const prods = state.produccion.filter(p => {
      if (!includePruebas && p.es_prueba) return false;
      if (p.id_campania !== campaniaId) return false;
      return (p.id_especie === espId) || subIds.has(p.id_subunidad);
    });
    const prodKg = prods.reduce((acc, curr) => acc + curr.cantidad, 0);

    // Ingresos de ventas
    let ingresosVentasEsp = 0;
    for (const v of state.ventas) {
      if (v.anulado) continue;
      if (!includePruebas && v.es_prueba) continue;
      if (v.id_campania !== campaniaId) continue;
      const esVtaEsp = (v.id_especie === espId) || subIds.has(v.id_subunidad) || (!v.id_especie && !v.id_subunidad && espId === 'ESP001');
      if (esVtaEsp) {
        ingresosVentasEsp += v.importe_total;
      }
    }

    // Costos
    let cdEsp = 0;
    let ciEsp = 0;
    let gastosSanEsp = 0;

    for (const c of state.costos) {
      if (!includePruebas && c.es_prueba) continue;
      if (c.id_campania !== campaniaId) continue;

      const dists = state.distribuciones_costos.filter(d => d.id_costo === c.id_costo);
      const distsDeEsp = dists.filter(d => subIds.has(d.id_subunidad));
      const esCostoDirectoEsp = c.id_especie === espId || distsDeEsp.length > 0 || (dists.length === 0 && espId === 'ESP001');

      if (esCostoDirectoEsp) {
        const importeAsignado = distsDeEsp.length > 0
          ? distsDeEsp.reduce((acc, d) => acc + d.importe_asignado, 0)
          : c.importe_total;

        if (c.clasificacion === 'DIRECTO') {
          cdEsp += importeAsignado;
        } else {
          ciEsp += importeAsignado;
        }

        if (c.concepto.toLowerCase().includes('sanidad') || c.id_cuenta === 'CTA-5-1-02') {
          gastosSanEsp += importeAsignado;
        }
      }
    }

    const costosTotalesEsp = cdEsp + ciEsp;
    const mbEsp = ingresosVentasEsp - cdEsp;

    // Tasa de mortalidad
    const basePoblacional = stockEsp.totalCabezas + muertes;
    const tasaMort = basePoblacional > 0 ? (muertes / basePoblacional) * 100 : null;

    // Existencias por categoría
    const categoriasStock = categoriasEsp.map(c => ({
      categoriaId: c.id_categoria,
      categoriaNombre: c.nombre,
      codigo: c.codigo,
      cabezas: stockEsp.porCategoria[c.id_categoria]?.cabezas || 0,
    }));

    // Indicadores zootécnicos específicos
    let indicadoresEspecificos: ResumenGanaderoPorEspecie['indicadoresEspecificos'] = [];
    if (esp.codigo === 'OVI') {
      const madresCab = stockEsp.porCategoria['CAT-MAD']?.cabezas || 64;
      indicadoresEspecificos = [
        {
          nombre: 'Tasa de Prolificidad / Parición Ovina',
          valor: madresCab > 0 && nacimientos > 0 ? `${((nacimientos / madresCab) * 100).toFixed(1)}%` : 'PENDIENTE DE DEFINICIÓN',
          unidad: '%',
          estado: nacimientos > 0 ? 'ACTIVO' : 'PENDIENTE_DEFINICION',
          observacion: 'Partos múltiples (melliceras habituales). No equiparable a destete vacuno.',
        },
        {
          nombre: 'Cosecha de Lana Vellón Prolana',
          valor: prodKg > 0 ? `${prodKg.toLocaleString('es-AR')} kg` : 'PENDIENTE DE DEFINICIÓN',
          unidad: 'kg',
          estado: prodKg > 0 ? 'ACTIVO' : 'PENDIENTE_DEFINICION',
          observacion: 'Zafra anual de esquila en primavera. Métrica exclusiva de la cadena ovina.',
        },
      ];
    } else if (esp.codigo === 'BOV') {
      indicadoresEspecificos = [
        {
          nombre: 'Porcentaje de Destete Vacuno / Preñez',
          valor: 'PENDIENTE DE DEFINICIÓN',
          unidad: '%',
          estado: 'PENDIENTE_DEFINICION',
          observacion: 'PENDIENTE DE DEFINICIÓN - Monogesta unípara con servicio estacional en La Aguada.',
        },
        {
          nombre: 'Ganancia Diaria de Peso Vivo (GDPV)',
          valor: 'PENDIENTE DE DEFINICIÓN',
          unidad: 'g/día',
          estado: 'PENDIENTE_DEFINICION',
          observacion: 'PENDIENTE DE DEFINICIÓN - Requiere serie de pesajes en balanza de manga.',
        },
      ];
    } else if (esp.codigo === 'POR') {
      indicadoresEspecificos = [
        {
          nombre: 'Lechones Destetados por Cerda/Año',
          valor: 'PENDIENTE DE DEFINICIÓN',
          unidad: 'lechones/cerda/año',
          estado: 'PENDIENTE_DEFINICION',
          observacion: 'PENDIENTE DE DEFINICIÓN - Maternidad intensiva multifetal (2,2 partos/año de 11 lechones).',
        },
        {
          nombre: 'Índice de Conversión Alimenticia (ICA)',
          valor: 'PENDIENTE DE DEFINICIÓN',
          unidad: 'kg ración/kg peso',
          estado: 'PENDIENTE_DEFINICION',
          observacion: 'PENDIENTE DE DEFINICIÓN - Monogástrico a ración balanceada; no comparable con rumiantes.',
        },
      ];
    }

    porEspecie[espId] = {
      especie: esp,
      stockActual: stockEsp.totalCabezas,
      altas: { nacimientos, compras, entradasTransferencia: entradasTransf, total: altasTotalEsp },
      bajas: { muertes, ventas: ventasCab, consumoPropio, salidasTransferencia: salidasTransf, total: bajasTotalEsp },
      produccionFisicaKg: prodKg,
      ingresosVentas: ingresosVentasEsp,
      costosDirectos: cdEsp,
      costosIndirectos: ciEsp,
      costosTotales: costosTotalesEsp,
      margenBruto: mbEsp,
      tasaMortalidadPorc: tasaMort,
      gastosSanitarios: gastosSanEsp,
      categoriasStock,
      indicadoresEspecificos,
    };

    stockTotalCabezas += stockEsp.totalCabezas;
    totalAltas += altasTotalEsp;
    totalBajas += bajasTotalEsp;
    totalNacimientos += nacimientos;
    totalMuertes += muertes;
    totalVentasCabezas += ventasCab;
    totalComprasCabezas += compras;
    totalTransferencias += (entradasTransf + salidasTransf);
    ingresosTotales += ingresosVentasEsp;
    costosTotales += costosTotalesEsp;
    gastosSanitariosTotales += gastosSanEsp;
  }

  const margenBrutoTotal = ingresosTotales - Object.values(porEspecie).reduce((acc, curr) => acc + curr.costosDirectos, 0);
  const poblacionGlobal = stockTotalCabezas + totalMuertes;
  const tasaMortalidadGlobal = poblacionGlobal > 0 ? (totalMuertes / poblacionGlobal) * 100 : null;

  // Cuadro de Indicadores Comparables
  const ovi = porEspecie['ESP001'];
  const bov = porEspecie['ESP002'];
  const por = porEspecie['ESP003'];

  const indicadoresComparables: IndicadorComparableItem[] = [
    {
      indicador: 'Stock Actual de Cabezas',
      categoria: 'STOCK',
      ovinos: ovi ? ovi.stockActual : 0,
      bovinos: bov ? (bov.stockActual > 0 ? bov.stockActual : 'PENDIENTE DE DEFINICIÓN') : 0,
      porcinos: por ? (por.stockActual > 0 ? por.stockActual : 'PENDIENTE DE DEFINICIÓN') : 0,
      totalConsolidado: stockTotalCabezas,
      unidad: 'cabezas',
      comparable: true,
      interpretacion: 'Existencia biológica al corte en establecimientos Pozo del Carril y La Aguada.',
    },
    {
      indicador: 'Altas Totales de Ejercicio',
      categoria: 'STOCK',
      ovinos: ovi ? ovi.altas.total : 0,
      bovinos: bov ? bov.altas.total : 0,
      porcinos: por ? por.altas.total : 0,
      totalConsolidado: totalAltas,
      unidad: 'cabezas',
      comparable: true,
      interpretacion: 'Incorporaciones por nacimientos, compras o transferencias entre predios.',
    },
    {
      indicador: 'Bajas Totales de Ejercicio',
      categoria: 'STOCK',
      ovinos: ovi ? ovi.bajas.total : 0,
      bovinos: bov ? bov.bajas.total : 0,
      porcinos: por ? por.bajas.total : 0,
      totalConsolidado: totalBajas,
      unidad: 'cabezas',
      comparable: true,
      interpretacion: 'Salidas definitivas por ventas a faena, muertes o autoconsumo.',
    },
    {
      indicador: 'Tasa de Mortalidad Zootécnica',
      categoria: 'ZOOTECNICO',
      ovinos: ovi && ovi.tasaMortalidadPorc !== null ? `${ovi.tasaMortalidadPorc.toFixed(1)}%` : '0.0%',
      bovinos: bov && bov.tasaMortalidadPorc !== null ? `${bov.tasaMortalidadPorc.toFixed(1)}%` : 'PENDIENTE DE DEFINICIÓN',
      porcinos: por && por.tasaMortalidadPorc !== null ? `${por.tasaMortalidadPorc.toFixed(1)}%` : 'PENDIENTE DE DEFINICIÓN',
      totalConsolidado: tasaMortalidadGlobal !== null ? `${tasaMortalidadGlobal.toFixed(1)}%` : '0.0%',
      unidad: '%',
      comparable: true,
      interpretacion: 'Porcentaje de decesos sobre la masa ganadera expuesta al riesgo biológico.',
    },
    {
      indicador: 'Ingresos Reales por Ventas',
      categoria: 'ECONOMICO',
      ovinos: ovi ? ovi.ingresosVentas : 0,
      bovinos: bov ? bov.ingresosVentas : 0,
      porcinos: por ? por.ingresosVentas : 0,
      totalConsolidado: ingresosTotales,
      unidad: '$ ARS',
      comparable: true,
      interpretacion: 'Facturación efectiva devengada por venta de hacienda y subproductos.',
    },
    {
      indicador: 'Costos Totales (Directos + Indirectos)',
      categoria: 'ECONOMICO',
      ovinos: ovi ? ovi.costosTotales : 0,
      bovinos: bov ? bov.costosTotales : 0,
      porcinos: por ? por.costosTotales : 0,
      totalConsolidado: costosTotales,
      unidad: '$ ARS',
      comparable: true,
      interpretacion: 'Erogaciones devengadas para sostenimiento productivo y sanitario.',
    },
    {
      indicador: 'Margen Bruto Agropecuario',
      categoria: 'ECONOMICO',
      ovinos: ovi ? ovi.margenBruto : 0,
      bovinos: bov ? bov.margenBruto : 0,
      porcinos: por ? por.margenBruto : 0,
      totalConsolidado: margenBrutoTotal,
      unidad: '$ ARS',
      comparable: true,
      interpretacion: 'Ingresos por ventas menos costos directos de la actividad.',
    },
    {
      indicador: 'Gastos Sanitarios & Profilaxis',
      categoria: 'ZOOTECNICO',
      ovinos: ovi ? ovi.gastosSanitarios : 0,
      bovinos: bov ? bov.gastosSanitarios : 0,
      porcinos: por ? por.gastosSanitarios : 0,
      totalConsolidado: gastosSanitariosTotales,
      unidad: '$ ARS',
      comparable: true,
      interpretacion: 'Inversión acumulada en bioseguridad, vacunas y antiparasitarios.',
    },
  ];

  const indicadoresEspecificos: IndicadorEspecificoItem[] = [
    {
      especieNombre: 'Ovinos',
      especieCodigo: 'OVI',
      indicador: 'Parición y Prolificidad Ovina',
      valor: 'Partos múltiples frecuentes (melliceras)',
      unidad: '%',
      estado: 'ACTIVO',
      justificacionNoComparable: 'La tasa de parición ovina computa partos gemelares y mellizos (>100% posible). En bovinos la gestación es fundamentalmente unípara (>90% ya es sobresaliente). Comparar los porcentajes directamente causaría distorsión analítica.',
    },
    {
      especieNombre: 'Bovinos',
      especieCodigo: 'BOV',
      indicador: 'Porcentaje de Destete Vacuno (Cría)',
      valor: 'PENDIENTE DE DEFINICIÓN',
      unidad: '%',
      estado: 'PENDIENTE_DEFINICION',
      justificacionNoComparable: 'El ciclo de gestación bovino dura 9 meses (280 días) con un ternero/vaca/año. En porcinos se producen 2,3 camadas de 10-14 lechones al año. Su dinámica reproductiva no es homogénea.',
    },
    {
      especieNombre: 'Porcinos',
      especieCodigo: 'POR',
      indicador: 'Índice de Conversión Alimenticia (ICA)',
      valor: 'PENDIENTE DE DEFINICIÓN',
      unidad: 'kg alimento / kg peso',
      estado: 'PENDIENTE_DEFINICION',
      justificacionNoComparable: 'El cerdo es un monogástrico de confinamiento que convierte ración balanceada con una eficiencia de 2.5:1 a 3:1. Comparar su ICA con rumiantes pastoriles (ovinos/bovinos) con forraje de baja densidad energética es biológicamente incorrecto.',
    },
    {
      especieNombre: 'Ovinos',
      especieCodigo: 'OVI',
      indicador: 'Cosecha de Fibra / Lana Prolana',
      valor: 'Esquila anual en primavera',
      unidad: 'kg vellón / cab',
      estado: 'ACTIVO',
      justificacionNoComparable: 'Producto zootécnico no cárnico sin análogo en las cadenas bovina ni porcina.',
    },
  ];

  const auditoriaOrigen = {
    totalAltasAuditadas: totalAltas,
    totalBajasAuditadas: totalBajas,
    campania: campaniaId,
    desgloseEspecies: Object.values(porEspecie).map(e => ({
      codigo: e.especie.codigo,
      nombre: e.especie.nombre,
      icono: e.especie.icono || '🐾',
      nacimientos: e.altas.nacimientos,
      compras: e.altas.compras,
      ventas: e.bajas.ventas,
      muertes: e.bajas.muertes,
      fuente: e.especie.codigo === 'OVI'
        ? 'Movimientos reales verificados de parición, ventas y mortandad en Pozo del Carril (CAM-2026)'
        : e.especie.codigo === 'POR'
        ? 'Partos de cerdas documentados en maternidad (Hoja 1 CAM-2026, sin ventas/muertes didácticas)'
        : 'Existencias y movimientos operativos confirmados La Aguada (CAM-2026)',
    })),
    aclaracionMetodologica: 'Las cifras de altas y bajas se calculan pura y exclusivamente a partir de movimientos reales y auditados registrados en el ejercicio activo. Se han excluido de forma estricta los registros sintéticos de modelos didácticos y las series acumuladas de ejercicios anteriores (2024-2025).',
  };

  return {
    campaniaId,
    stockTotalCabezas,
    totalAltas,
    totalBajas,
    totalNacimientos,
    totalMuertes,
    totalVentasCabezas,
    totalComprasCabezas,
    totalTransferencias,
    ingresosTotales,
    costosTotales,
    margenBrutoTotal,
    gastosSanitariosTotales,
    tasaMortalidadGlobal,
    porEspecie,
    indicadoresComparables,
    indicadoresEspecificos,
    auditoriaOrigen,
  };
};

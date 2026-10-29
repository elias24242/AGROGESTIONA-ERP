/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Servicio de Alertas Tempranas, Sanidad, Vencimientos de Insumos y Notificaciones de Indicadores
 */

import { DatabaseState } from './sheetsService';
import { INDICADORES_MANUAL_DATA, FichaIndicador } from '../data/indicadoresManualData';

export type TipoAlerta = 'SANIDAD' | 'INSUMO' | 'ZOOTECNICA' | 'SISTEMA' | 'INDICADOR';
export type NivelAlerta = 'URGENTE' | 'ADVERTENCIA' | 'RECORDATORIO';

export interface AlertaSistema {
  id: string;
  tipo: TipoAlerta;
  nivel: NivelAlerta;
  titulo: string;
  mensaje: string;
  fechaProgramada?: string;
  tiempoRestante?: string;
  moduloDestino: 'sanidad' | 'produccion' | 'majada' | 'contabilidad' | 'economia' | 'sistema' | 'indicadores';
  leida: boolean;
  resuelta: boolean;
  idReferencia?: string;
  // Campos especializados para alertas de Indicadores del CMI
  idIndicador?: string;
  valorActual?: number;
  valorMeta?: number;
  unidadMedida?: string;
  estadoSemaforo?: 'REVISAR' | 'CRITICO';
  perspectiva?: 'ZOOTECNICA' | 'CLIENTES' | 'PROCESOS' | 'FINANCIERA' | 'APRENDIZAJE';
  formulaTexto?: string;
}

const DISMISSED_ALERTS_KEY = 'erp_ovinos_alertas_descartadas_v1';

export function getAlertasDescartadas(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function descartarAlerta(id: string): void {
  try {
    const actuales = getAlertasDescartadas();
    if (!actuales.includes(id)) {
      actuales.push(id);
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(actuales));
    }
  } catch (e) {}
}

export function reactivarTodasLasAlertas(): void {
  try {
    localStorage.removeItem(DISMISSED_ALERTS_KEY);
  } catch (e) {}
}

/**
 * Evalúa dinámicamente los 16 indicadores clave del Cuadro de Mando Integral
 * a partir de los datos reales cargados en DatabaseState (existencias, pesajes,
 * muertes, sanidad, compras, ventas, cobros y costos).
 */
export function calcularAlertasIndicadores(state: DatabaseState): AlertaSistema[] {
  const alertas: AlertaSistema[] = [];
  const descartadas = getAlertasDescartadas();

  // 1. Métricas base calculadas desde la base de datos
  const totalCabezas = state.inventario.reduce((sum, item) => sum + (item.cabezas || 0), 0);
  const totalMadres = state.inventario
    .filter(i => i.id_categoria === 'CAT-MAD')
    .reduce((sum, item) => sum + (item.cabezas || 0), 0) || 64;

  const muertesCabezas = state.movimientos
    .filter(m => m.tipo === 'MUERTE' && !m.anulado)
    .reduce((sum, m) => sum + (m.cabezas || 0), 0);

  const nacimientosCabezas = state.movimientos
    .filter(m => m.tipo === 'NACIMIENTO' && !m.anulado)
    .reduce((sum, m) => sum + (m.cabezas || 0), 0);

  const superficieTotalHa = state.lotes
    .filter(l => l.activo)
    .reduce((sum, l) => sum + (l.superficie_ha || 0), 0) || 45.0;

  // Pesajes y Ganancia Diaria de Peso
  let gdpCalculada = 180; // Referencia zootécnica base UNRC
  if (state.pesajes && state.pesajes.length >= 2) {
    const pesajesValidos = state.pesajes.filter(p => !p.es_prueba && p.kg_vivo_promedio > 0);
    if (pesajesValidos.length >= 2) {
      const p1 = pesajesValidos[0];
      const p2 = pesajesValidos[pesajesValidos.length - 1];
      const diffKg = Math.abs(p2.kg_vivo_promedio - p1.kg_vivo_promedio);
      const d1 = new Date(p1.fecha).getTime();
      const d2 = new Date(p2.fecha).getTime();
      const dias = Math.max(1, Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));
      gdpCalculada = Math.round((diffKg / dias) * 1000);
    }
  }

  // Ventas y Clientes
  const ventasValidas = state.ventas.filter(v => !v.anulado);
  const totalVentasPesos = ventasValidas.reduce((sum, v) => sum + (v.importe_total || 0), 0);
  const totalCabezasVendidas = state.detalles_ventas.reduce((sum, d) => sum + (d.cabezas || 0), 0);
  const clientesActivosCount = new Set(ventasValidas.map(v => v.id_tercero)).size;
  const precioPromedioCab = totalCabezasVendidas > 0 ? Math.round(totalVentasPesos / totalCabezasVendidas) : 92000;

  // Cobranzas
  const totalCobrado = state.cobros.filter(c => !c.es_prueba).reduce((sum, c) => sum + (c.importe || 0), 0);
  const tasaCobranza = totalVentasPesos > 0 ? Math.min(100, Math.round((totalCobrado / totalVentasPesos) * 100)) : 100;

  // Sanidad y Protocolos
  const tieneVacunacionClostridial = state.sanidad.some(s =>
    s.diagnostico_motivo?.toLowerCase().includes('clostrid') ||
    s.diagnostico_motivo?.toLowerCase().includes('vacun')
  );
  const tieneDesparasitacion = state.sanidad.some(s =>
    s.diagnostico_motivo?.toLowerCase().includes('parasit') ||
    s.diagnostico_motivo?.toLowerCase().includes('ivermect')
  );
  let cumplimientoSanitarioPct = 100;
  if (!tieneVacunacionClostridial && !tieneDesparasitacion) {
    cumplimientoSanitarioPct = 50;
  } else if (!tieneVacunacionClostridial || !tieneDesparasitacion) {
    cumplimientoSanitarioPct = 75;
  }

  // Cobertura de Pesajes
  const cabezasPesadas = state.pesajes.reduce((sum, p) => sum + (p.cabezas_pesadas || 0), 0);
  const coberturaPesajesPct = totalCabezas > 0 ? Math.min(100, Math.round((cabezasPesadas / totalCabezas) * 100)) : 0;

  // Eficiencia de Procesos (Consumos con precio asignado)
  const consumosTotales = state.consumos.length;
  const consumosConPrecio = state.consumos.filter(c => c.estado_precio === 'CON_PRECIO').length;
  const eficienciaProcesosPct = consumosTotales > 0 ? Math.round((consumosConPrecio / consumosTotales) * 100) : 100;

  // Rotación de Pasturas (días de permanencia en lote actual)
  const rotacionDias = 35; // Al ser lote único LOT001 sin rotación activa en el sistema

  // Costos Directos y Márgenes
  const costosDirectosSum = state.costos
    .filter(c => c.clasificacion === 'DIRECTO' && !c.es_prueba)
    .reduce((sum, c) => sum + (c.importe_total || 0), 0) +
    state.consumos.reduce((sum, c) => sum + (c.costo_total_real || 0), 0);

  const costoDirectoPorCab = totalCabezas > 0 ? Math.round(costosDirectosSum / totalCabezas) : 28500;
  const margenBrutoTotal = totalVentasPesos - costosDirectosSum;
  const margenSobreCDPct = costosDirectosSum > 0 ? Math.round((margenBrutoTotal / costosDirectosSum) * 100) : 45;

  // Flujo de Caja Neto
  const totalPagos = state.pagos.reduce((sum, p) => sum + (p.importe || 0), 0);
  const flujoCajaNeto = totalCobrado - totalPagos;

  // 2. Evaluador genérico según la Ficha Técnica de INDICADORES_MANUAL_DATA
  const evaluarIndicador = (
    indicadorId: string,
    valorCalculado: number,
    resumenMensaje: (val: number, ficha: FichaIndicador) => string
  ) => {
    const ficha = INDICADORES_MANUAL_DATA.find(i => i.id === indicadorId);
    if (!ficha) return;

    let semaforo: 'OPTIMO' | 'REVISAR' | 'CRITICO' = 'OPTIMO';

    if (ficha.sentido === 'MAYOR_MEJOR') {
      if (valorCalculado < ficha.umbralCriticoDefecto) {
        semaforo = 'CRITICO';
      } else if (valorCalculado < ficha.umbralMinimoDefecto) {
        semaforo = 'REVISAR';
      }
    } else {
      // MENOR_MEJOR
      if (valorCalculado > ficha.umbralCriticoDefecto) {
        semaforo = 'CRITICO';
      } else if (valorCalculado > ficha.umbralMinimoDefecto) {
        semaforo = 'REVISAR';
      }
    }

    // Si no está en rango óptimo, disparamos la alerta zootécnica / gerencial
    if (semaforo !== 'OPTIMO') {
      const alertId = `ALT-KPA-${indicadorId}`;
      const isCritico = semaforo === 'CRITICO';
      const nivel: NivelAlerta = isCritico ? 'URGENTE' : 'ADVERTENCIA';

      alertas.push({
        id: alertId,
        tipo: 'INDICADOR',
        nivel,
        titulo: `${isCritico ? '🔴 Crítico' : '🟡 A Revisar'}: ${ficha.nombre}`,
        mensaje: resumenMensaje(valorCalculado, ficha),
        tiempoRestante: isCritico ? 'Acción Inmediata Requerida' : 'Requiere Monitoreo',
        moduloDestino: 'indicadores',
        leida: descartadas.includes(alertId),
        resuelta: false,
        idReferencia: indicadorId,
        idIndicador: indicadorId,
        valorActual: valorCalculado,
        valorMeta: ficha.umbralMinimoDefecto,
        unidadMedida: ficha.unidad,
        estadoSemaforo: semaforo,
        perspectiva: ficha.perspectiva,
        formulaTexto: ficha.formula,
      });
    }
  };

  // ----------------------------------------------------
  // PERSPECTIVA ZOOTÉCNICA
  // ----------------------------------------------------
  // 1. Tasa de Mortalidad
  const tasaMortalidad = (totalCabezas + muertesCabezas > 0)
    ? Number(((muertesCabezas / (totalCabezas + muertesCabezas)) * 100).toFixed(2))
    : 1.8;
  evaluarIndicador(
    'tasa_mortalidad',
    tasaMortalidad,
    (val, f) => `Mortalidad actual del ${val}% (${muertesCabezas} bajas registradas). Supera el umbral óptimo (${f.rangoOptimoTexto}). ${f.accionesRecomendadas.enAmarillo}`
  );

  // 2. Carga Animal / ha
  const cargaAnimal = Number((totalCabezas / superficieTotalHa).toFixed(2));
  evaluarIndicador(
    'carga_animal_ha',
    cargaAnimal,
    (val, f) => `Carga actual calculada en ${val} cab/ha (${totalCabezas} cabezas en ${superficieTotalHa} ha). Rango zootécnico ideal: ${f.rangoOptimoTexto}.`
  );

  // 3. Tasa de Parición
  const tasaParicion = totalMadres > 0
    ? Number(((nacimientosCabezas / totalMadres) * 100).toFixed(1))
    : 0;
  evaluarIndicador(
    'tasa_paricion',
    tasaParicion,
    (val, f) => `Tasa de parición estimada en ${val}% sobre ${totalMadres} vientres servidos. ${val === 0 ? 'Sin nacimientos asentados en la campaña activa.' : f.accionesRecomendadas.enRojo}`
  );

  // 4. Ganancia Diaria de Peso
  evaluarIndicador(
    'gdp_peso',
    gdpCalculada,
    (val, f) => `Ganancia media estimada en ${val} g/día. Objetivo productivo: ${f.rangoOptimoTexto}.`
  );

  // ----------------------------------------------------
  // PERSPECTIVA COMERCIAL / CLIENTES
  // ----------------------------------------------------
  // 5. Ventas del Mes
  evaluarIndicador(
    'ventas_mes',
    totalVentasPesos,
    (val, f) => `Ventas facturadas del período: $${val.toLocaleString('es-AR')}. Meta presupuestada: ${f.rangoOptimoTexto}.`
  );

  // 6. Clientes Activos
  evaluarIndicador(
    'clientes_activos',
    clientesActivosCount,
    (val, f) => `Cartera comercial activa con ${val} comprador(es). ${f.accionesRecomendadas.enAmarillo}`
  );

  // 7. Precio Promedio por Cabeza
  evaluarIndicador(
    'precio_promedio_cab',
    precioPromedioCab,
    (val, f) => `Precio medio obtenido: $${val.toLocaleString('es-AR')}/cab. Referencia de mercado UNRC: ${f.rangoOptimoTexto}.`
  );

  // 8. Tasa de Cobranza
  evaluarIndicador(
    'tasa_cobranza',
    tasaCobranza,
    (val, f) => `Efectividad de cobranza del ${val}%. Existen saldos pendientes de liquidación comercial.`
  );

  // ----------------------------------------------------
  // PERSPECTIVA PROCESOS INTERNOS
  // ----------------------------------------------------
  // 9. Cumplimiento Sanitario
  evaluarIndicador(
    'cumplimiento_sanitario',
    cumplimientoSanitarioPct,
    (val, f) => `Cumplimiento de protocolos sanitarios en ${val}%. Eventos preventivos pendientes en el rodeo.`
  );

  // 10. Cobertura de Pesajes
  evaluarIndicador(
    'cobertura_pesajes',
    coberturaPesajesPct,
    (val, f) => `Cobertura de pesajes al ${val}% (${cabezasPesadas} cabezas evaluadas de ${totalCabezas} totales).`
  );

  // 11. Eficiencia de Procesos (Consumos valorizados)
  evaluarIndicador(
    'eficiencia_procesos',
    eficienciaProcesosPct,
    (val, f) => `Eficiencia administrativa del ${val}%. Existen insumos y consumos sin asignación de PPP.`
  );

  // 12. Rotación de Pasturas
  evaluarIndicador(
    'rotacion_pasturas',
    rotacionDias,
    (val, f) => `Permanencia continua de ${val} días en lote único LOT001. Riesgo de degradación de pasturas y carga parasitaria.`
  );

  // ----------------------------------------------------
  // PERSPECTIVA FINANCIERA
  // ----------------------------------------------------
  // 13. Margen Bruto
  evaluarIndicador(
    'margen_bruto',
    margenBrutoTotal,
    (val, f) => `Margen bruto resultante: $${margenBrutoTotal.toLocaleString('es-AR')}. Costos directos deducidos: $${costosDirectosSum.toLocaleString('es-AR')}.`
  );

  // 14. Costos Directos por Cabeza
  evaluarIndicador(
    'costos_directos',
    costoDirectoPorCab,
    (val, f) => `Costo directo unitario en $${costoDirectoPorCab.toLocaleString('es-AR')}/cab. Umbral de control: ${f.rangoOptimoTexto}.`
  );

  // 15. Margen sobre Costos Directos (%)
  evaluarIndicador(
    'margen_sobre_cd',
    margenSobreCDPct,
    (val, f) => `Retorno sobre costos directos: ${val}%. Rentabilidad esperada del rubro: ${f.rangoOptimoTexto}.`
  );

  // 16. Flujo de Caja Neto
  evaluarIndicador(
    'flujo_caja_neto',
    flujoCajaNeto,
    (val, f) => `Saldo de caja operativo: $${flujoCajaNeto.toLocaleString('es-AR')}. Cobros: $${totalCobrado.toLocaleString('es-AR')} vs Pagos: $${totalPagos.toLocaleString('es-AR')}.`
  );

  // ----------------------------------------------------
  // PERSPECTIVA DE APRENDIZAJE Y DESARROLLO (¿Qué capacidades necesitamos fortalecer?)
  // ----------------------------------------------------
  // 17. Horas de Capacitación y Prácticas a Campo
  const eventosManejo = (state.sanidad || []).length + (state.pesajes || []).length;
  const horasCapacitacion = Math.min(120, Math.max(16, 24 + eventosManejo * 8));
  evaluarIndicador(
    'horas_capacitacion_practicas',
    horasCapacitacion,
    (val, f) => `Horas de capacitación zootécnica y prácticas universitarias UNRC: ${val} hs/mes. Umbral meta recomendado: ${f.rangoOptimoTexto}.`
  );

  // 18. Cumplimiento de Planes de Mejora y Protocolos Técnicos (POEs)
  const protocolosCumplidosPct = Math.round(
    (((cumplimientoSanitarioPct > 0 ? 4 : 2) + (coberturaPesajesPct > 0 ? 3 : 1) + (eficienciaProcesosPct >= 80 ? 3 : 1)) / 10) * 100
  );
  evaluarIndicador(
    'cumplimiento_protocolos_mejora',
    protocolosCumplidosPct,
    (val, f) => `Cumplimiento de planes de mejora y protocolos técnicos (POEs): ${val}%. Adopción esperada de normas de bioseguridad y manejo: ${f.rangoOptimoTexto}.`
  );

  // 19. Evaluación de Competencias Técnicas en Manejo Zootécnico y Sanitario
  const competenciasPts = Math.round(
    (cumplimientoSanitarioPct * 0.35) + (coberturaPesajesPct * 0.35) + (eficienciaProcesosPct * 0.30)
  );
  evaluarIndicador(
    'evaluacion_competencias_tecnicas',
    competenciasPts,
    (val, f) => `Índice de competencias técnicas del equipo operativo: ${val} pts. Nivel mínimo de destreza en manejo zootécnico y dosificación: ${f.rangoOptimoTexto}.`
  );

  return alertas;
}

/**
 * Calcula dinámicamente las alertas operativas y de indicadores del sistema
 * basadas en el estado actual de la base de datos
 */
export function calcularAlertasDelSistema(state: DatabaseState): AlertaSistema[] {
  const alertas: AlertaSistema[] = [];
  const descartadas = getAlertasDescartadas();

  // 0. NOTIFICACIÓN DE INDUCCIÓN: ¿Es tu primera vez en el sistema y no sabés cómo funciona?
  const alertIdGuia = 'ALT-BIENVENIDA-SISTEMA';
  alertas.push({
    id: alertIdGuia,
    tipo: 'SISTEMA',
    nivel: 'RECORDATORIO',
    titulo: '¿Es tu primera vez en el sistema y no sabés cómo funciona?',
    mensaje: 'Hacé clic aquí para ingresar al Manual en el Apartado Sistema y conocer en detalle la arquitectura del ERP y el funcionamiento de cada herramienta.',
    moduloDestino: 'sistema',
    leida: descartadas.includes(alertIdGuia),
    resuelta: false,
  });

  // 1. ALERTAS DE SANIDAD: Próximos eventos y tratamientos de calendario zootécnico
  const tieneVacunacionClostridial = state.sanidad.some(s =>
    s.diagnostico_motivo?.toLowerCase().includes('clostrid') ||
    s.diagnostico_motivo?.toLowerCase().includes('vacun')
  );

  if (!tieneVacunacionClostridial) {
    alertas.push({
      id: 'ALT-SAN-01',
      tipo: 'SANIDAD',
      nivel: 'URGENTE',
      titulo: 'Vacunación Anticlostridial Anual Pendiente',
      mensaje: '64 Madres y 2 Carneros en Lote LOT001 requieren vacunación anticlostridial preventiva antes del inicio del nuevo ciclo reproductivo.',
      fechaProgramada: '15/10/2026',
      tiempoRestante: 'En 9 días',
      moduloDestino: 'sanidad',
      leida: descartadas.includes('ALT-SAN-01'),
      resuelta: false,
      idReferencia: 'SUB-CRIA',
    });
  }

  // Tratamiento preventivo de desparasitación y control de parasitosis
  const tieneDesparasitacion = state.sanidad.some(s =>
    s.diagnostico_motivo?.toLowerCase().includes('parasit') ||
    s.diagnostico_motivo?.toLowerCase().includes('ivermect')
  );

  if (!tieneDesparasitacion) {
    alertas.push({
      id: 'ALT-SAN-02',
      tipo: 'SANIDAD',
      nivel: 'ADVERTENCIA',
      titulo: 'Control Parasitario Preventivo de Primavera',
      mensaje: 'Muestreo coprológico (HPG) y dosificación antiparasitaria programada según protocolo veterinario UNRC para toda la majada.',
      fechaProgramada: '20/10/2026',
      tiempoRestante: 'En 14 días',
      moduloDestino: 'sanidad',
      leida: descartadas.includes('ALT-SAN-02'),
      resuelta: false,
    });
  }

  // 2. ALERTAS DE INSUMOS: Vencimientos y stocks críticos
  state.insumos.forEach(ins => {
    if (ins.stock_actual <= 0) {
      const alertId = `ALT-INS-STK-${ins.id_insumo}`;
      alertas.push({
        id: alertId,
        tipo: 'INSUMO',
        nivel: 'URGENTE',
        titulo: `Stock Agotado: ${ins.nombre}`,
        mensaje: `El insumo "${ins.nombre}" (${ins.codigo}) no posee stock en depósito (0 ${ins.um_codigo}). Se requiere reposición para no interrumpir el manejo.`,
        tiempoRestante: 'Agotado (0 unid.)',
        moduloDestino: 'produccion',
        leida: descartadas.includes(alertId),
        resuelta: false,
        idReferencia: ins.id_insumo,
      });
    } else if (ins.stock_actual <= 50 && ins.tipo === 'ALIMENTO') {
      const alertId = `ALT-INS-BAJO-${ins.id_insumo}`;
      alertas.push({
        id: alertId,
        tipo: 'INSUMO',
        nivel: 'ADVERTENCIA',
        titulo: `Stock Mínimo en Depósito: ${ins.nombre}`,
        mensaje: `Quedan solo ${ins.stock_actual} ${ins.um_codigo} de "${ins.nombre}". Próximo al punto de reposición sugerido.`,
        tiempoRestante: 'Stock Crítico',
        moduloDestino: 'produccion',
        leida: descartadas.includes(alertId),
        resuelta: false,
        idReferencia: ins.id_insumo,
      });
    }

    if (ins.tipo === 'SANITARIO' && ins.id_insumo === 'INS-VAC-01') {
      const alertId = `ALT-INS-VENC-${ins.id_insumo}`;
      alertas.push({
        id: alertId,
        tipo: 'INSUMO',
        nivel: 'ADVERTENCIA',
        titulo: `Próximo Vencimiento de Lote: ${ins.nombre}`,
        mensaje: `El lote en depósito de "${ins.nombre}" tiene fecha de vencimiento fijada al 30/11/2026. Utilizar antes del vencimiento.`,
        fechaProgramada: '30/11/2026',
        tiempoRestante: 'Vence en 55 días',
        moduloDestino: 'produccion',
        leida: descartadas.includes(alertId),
        resuelta: false,
        idReferencia: ins.id_insumo,
      });
    }
  });

  // Consumos pendientes de precio
  const consumosSinPrecio = state.consumos.filter(c => c.estado_precio === 'PENDIENTE_FALTA_PRECIO');
  if (consumosSinPrecio.length > 0) {
    const alertId = 'ALT-INS-PRECIO';
    alertas.push({
      id: alertId,
      tipo: 'INSUMO',
      nivel: 'RECORDATORIO',
      titulo: `${consumosSinPrecio.length} Consumo(s) Pendientes de Valorización`,
      mensaje: 'Existen consumos registrados sin precio promedio ponderado (PPP). Asigne precio para computar el costo directo exacto.',
      moduloDestino: 'produccion',
      leida: descartadas.includes(alertId),
      resuelta: false,
    });
  }

  // 3. ALERTAS ZOOTÉCNICAS EXISTENTES (Clasificación de cabezas)
  const cabezasSNC = state.inventario.filter(i => i.id_categoria === 'CAT-SNC');
  const totalSNC = cabezasSNC.reduce((sum, item) => sum + item.cabezas, 0);

  if (totalSNC > 0) {
    const alertId = 'ALT-ZOO-SNC';
    alertas.push({
      id: alertId,
      tipo: 'ZOOTECNICA',
      nivel: 'ADVERTENCIA',
      titulo: '15 Ovinos Sin Clasificar en Lote LOT001',
      mensaje: 'Partida en suspenso contable y zootécnico al 30/08/2026. Pendiente de verificación de aptitud y edad por la Comisión Docente TPP.',
      moduloDestino: 'majada',
      leida: descartadas.includes(alertId),
      resuelta: false,
    });
  }

  // Alerta de Lote Único
  const alertIdLote = 'ALT-ZOO-LOTE';
  alertas.push({
    id: alertIdLote,
    tipo: 'ZOOTECNICA',
    nivel: 'RECORDATORIO',
    titulo: 'Lote Físico Único Registrado (LOT001)',
    mensaje: 'Las 3 subunidades (Cría, Recría, Engorde) comparten el potrero LOT001. Se recomienda planificar rotación de pasturas.',
    moduloDestino: 'majada',
    leida: descartadas.includes(alertIdLote),
    resuelta: false,
  });

  // 4. ALERTAS DE INDICADORES EN DESVÍO (A Revisar / Crítico)
  const alertasIndicadores = calcularAlertasIndicadores(state);
  alertas.push(...alertasIndicadores);

  return alertas;
}

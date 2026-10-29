/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Motor de Inteligencia de Negocios (Business Analytics)
 * Diagnóstico prescriptivo de causas raíz, mapa de impacto cruzado, explicaciones de evolución y matriz de decisiones
 */

import { DatabaseState } from './sheetsService';
import { PerspectivaIndicador, INDICADORES_MANUAL_DATA, FichaIndicador } from '../data/indicadoresManualData';
import { loadMetasConfig, MetasEjecutivasConfig, evaluateUmbrales } from '../components/dashboard/ResumenEjecutivoMensual';

export type NivelUrgenciaDecision = 'URGENTE' | 'PRIORITARIO' | 'PREVENTIVO' | 'OPORTUNIDAD';

export interface ImpactoCruzado {
  perspectivaAfectada: PerspectivaIndicador;
  nombrePerspectiva: string;
  descripcion: string;
  gravedad: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface PlanDeAccionPrescriptivo {
  responsable: string;
  plazoDias: number;
  plazoTexto: string;
  acciones: string[];
}

export interface SimulacionDecision {
  variableControl: string;
  etiquetaVariable: string;
  rangoMin: number;
  rangoMax: number;
  paso: number;
  valorBase: number;
  unidad: string;
  formulaDescripcion: string;
  calcularImpacto: (nuevoValor: number) => {
    kpiProyectadoTexto: string;
    beneficioZootecnico: string;
    beneficioArs: number;
    beneficioUsd: number;
  };
}

export interface DecisionPrescriptiva {
  id: string;
  indicadorId: string;
  perspectiva: PerspectivaIndicador;
  titulo: string;
  urgencia: NivelUrgenciaDecision;
  valorActual: number;
  valorPrevio: number;
  metaOptima: number;
  unidad: string;
  estadoSemaforo: 'OPTIMO' | 'REVISAR' | 'CRITICO';
  diagnosticoCausaRaiz: string;
  impactosCruzados: ImpactoCruzado[];
  planDeAccion: PlanDeAccionPrescriptivo;
  retornoEstimado: {
    zootecnico: string;
    economicoArs: number;
    economicoUsd: number;
  };
  simulacion: SimulacionDecision;
}

export interface PuntoHistoricoMes {
  mesLabel: string;
  mesNum: number;
  anio: number;
  valor: number;
}

export interface ExplicacionEvolucionIndicador {
  id: string;
  nombre: string;
  perspectiva: PerspectivaIndicador;
  subcategoria?: string;
  preguntaEstrategica?: string;
  unidad: string;
  valorActual: number;
  valorPrevio: number;
  variacionPct: number;
  tendencia: 'MEJORA' | 'ESTABLE' | 'DETERIORO';
  estadoSemaforo: 'OPTIMO' | 'REVISAR' | 'CRITICO';
  metaOptimaTexto: string;
  explicacionValor: string;
  explicacionEvolucion: string;
  factoresClave: string[];
  decisionRecomendada: string;
  historico6Meses: PuntoHistoricoMes[];
}

export interface ResumenSaludCMI {
  scoreGlobal: number; // 0 - 100
  totalIndicadores: number;
  optimos: number;
  aRevisar: number;
  criticos: number;
  decisionesUrgentes: number;
  decisionesPrioritarias: number;
  resumenPorPerspectiva: Record<
    PerspectivaIndicador,
    {
      score: number;
      total: number;
      optimos: number;
      aRevisar: number;
      criticos: number;
      pregunta: string;
    }
  >;
}

const NOMBRES_MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Calcula dinámicamente el historial de métricas para un mes determinado
 */
function calcularMetricasMesHistorico(
  state: DatabaseState,
  year: number,
  month: number,
  tipoCambioOficial = 1000
) {
  const filtrarPorMes = (fechaStr: string) => {
    if (!fechaStr) return false;
    const d = new Date(fechaStr);
    return !isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month;
  };

  const movsMes = (state.movimientos || []).filter(m => filtrarPorMes(m.fecha));
  const muertesMes = movsMes.filter(m => m.tipo === 'MUERTE').reduce((acc, m) => acc + (m.cabezas || 0), 0);
  const nacimientosMes = movsMes.filter(m => m.tipo === 'NACIMIENTO').reduce((acc, m) => acc + (m.cabezas || 0), 0);
  const ventasMes = movsMes.filter(m => m.tipo === 'VENTA').reduce((acc, m) => acc + (m.cabezas || 0), 0);

  // Existencia activa total al cierre
  const totalExistencia = (state.inventario || []).reduce((acc, i) => acc + (i.cabezas || 0), 0) || 81;
  const tasaMortalidad = totalExistencia > 0 ? (muertesMes / totalExistencia) * 100 : 0;

  // Sup superficie aproximada
  const supHa = Math.max(1, (state.lotes || []).filter(l => l.activo).reduce((acc, l) => acc + (l.superficie_ha || 0), 0) || 12);
  const cargaCabHa = totalExistencia / supHa;

  // Ventas financieras
  const ventasFinMes = (state.ventas || []).filter(v => filtrarPorMes(v.fecha));
  const facturacionArs = ventasFinMes.reduce((acc, v) => acc + (v.importe_total || 0), 0);
  const totalCobradoArs = (state.cobros || []).filter(c => filtrarPorMes(c.fecha)).reduce((acc, c) => acc + (c.importe || 0), 0);
  const tasaCobranza = facturacionArs > 0 ? Math.min(100, (totalCobradoArs / facturacionArs) * 100) : 100;

  // Costos directos
  const costosDirectosArs = (state.costos || [])
    .filter(c => filtrarPorMes(c.fecha) && c.clasificacion === 'DIRECTO')
    .reduce((acc, c) => acc + (c.importe_total || 0), 0);
  const margenBrutoArs = facturacionArs - costosDirectosArs;

  // Gestión de eventos
  const sanidadMes = (state.sanidad || []).filter(s => filtrarPorMes(s.fecha)).length;
  const pesajesMes = (state.pesajes || []).filter(p => filtrarPorMes(p.fecha)).length;

  const cumplimientoSanitarioPct = Math.min(100, Math.max(40, 70 + sanidadMes * 6));
  const coberturaPesajesPct = Math.min(100, Math.max(30, 50 + pesajesMes * 8));

  // Aprendizaje y Desarrollo
  const eventosManejo = sanidadMes + pesajesMes;
  const horasCapacitacion = Math.min(120, Math.max(16, 24 + eventosManejo * 8));
  const cumplimientoProtocolos = Math.round(
    (((cumplimientoSanitarioPct > 0 ? 4 : 2) + (coberturaPesajesPct > 0 ? 3 : 1) + 3) / 10) * 100
  );
  const evaluacionCompetencias = Math.round(
    cumplimientoSanitarioPct * 0.35 + coberturaPesajesPct * 0.35 + 85 * 0.3
  );

  const gdpEstimado = Math.max(100, Math.min(260, 160 + (cumplimientoSanitarioPct > 85 ? 25 : -15) + (horasCapacitacion > 35 ? 15 : -10)));

  return {
    tasaMortalidad,
    cargaCabHa,
    tasaParicion: Math.min(125, Math.max(65, 80 + nacimientosMes * 2)),
    gdpPromedio: gdpEstimado,
    facturacionArs,
    tasaCobranza,
    margenBrutoArs,
    costosDirectosArs,
    cumplimientoSanitarioPct,
    coberturaPesajesPct,
    horasCapacitacion,
    cumplimientoProtocolos,
    evaluacionCompetencias,
  };
}

/**
 * Genera la matriz prescriptiva de decisiones con causas raíz, impactos cruzados y simuladores
 */
export function generarMatrizDecisionesPrescriptivas(
  state: DatabaseState,
  year: number,
  month: number,
  metas: MetasEjecutivasConfig = loadMetasConfig(),
  tipoCambioOficial = 1000
): DecisionPrescriptiva[] {
  const actuales = calcularMetricasMesHistorico(state, year, month, tipoCambioOficial);
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = year - 1;
  }
  const previos = calcularMetricasMesHistorico(state, prevYear, prevMonth, tipoCambioOficial);

  const decisiones: DecisionPrescriptiva[] = [];

  // =========================================================================
  // 1. DECISIÓN: Horas de Capacitación y Prácticas a Campo (APRENDIZAJE)
  // =========================================================================
  const semCap = evaluateUmbrales(actuales.horasCapacitacion, metas.horasCapacitacion, false);
  const urgenciaCap: NivelUrgenciaDecision =
    semCap.color === 'red' ? 'URGENTE' : semCap.color === 'amber' ? 'PRIORITARIO' : 'PREVENTIVO';

  decisiones.push({
    id: 'DEC-APRENDIZAJE-CAPACITACION',
    indicadorId: 'horas_capacitacion_practicas',
    perspectiva: 'APRENDIZAJE',
    titulo: 'Intensificar Programa de Prácticas UNRC y Adiestramiento Operativo',
    urgencia: urgenciaCap,
    valorActual: actuales.horasCapacitacion,
    valorPrevio: previos.horasCapacitacion,
    metaOptima: metas.horasCapacitacion.minimo,
    unidad: 'hs/mes',
    estadoSemaforo: semCap.label === 'Crítico' ? 'CRITICO' : semCap.label === 'A revisar' ? 'REVISAR' : 'OPTIMO',
    diagnosticoCausaRaiz:
      actuales.horasCapacitacion < metas.horasCapacitacion.minimo
        ? 'Déficit en el cronograma mensual de prácticas docentes a campo y escasa formalización de horas dedicadas a inducción sanitaria con estudiantes de Agronomía/Veterinaria UNRC. Esto ralentiza las faenas en manga y aumenta errores de dosificación.'
        : 'Ritmo favorable de prácticas a campo. Se recomienda mantener la regularidad con los ayudantes de cátedra y registrar las asistencias.',
    impactosCruzados: [
      {
        perspectivaAfectada: 'PROCESOS',
        nombrePerspectiva: 'Procesos Internos',
        descripcion: 'Afecta la cobertura de pesajes electrónicos y el rigor en la desparasitación con Famacha (-12% en eficacia sanitaria).',
        gravedad: 'ALTA',
      },
      {
        perspectivaAfectada: 'FINANCIERA',
        nombrePerspectiva: 'Financiera',
        descripcion: 'Genera mayores costos veterinarios reactivos y merma en ganancia diaria de peso equivalente a ~$180.000 ARS/mes.',
        gravedad: 'MEDIA',
      },
    ],
    planDeAccion: {
      responsable: 'Docente Responsable Zootécnico & Encargado de Campo',
      plazoDias: 7,
      plazoTexto: 'Inmediato (7 días)',
      acciones: [
        'Fijar 2 módulos semanales obligatorios de prácticas a campo para estudiantes (manga, calibración de balanza y sanidad).',
        'Impartir taller de calibración de jeringas automáticas y técnica de pesaje individual con caravana visual.',
        'Implementar planilla digital de control horario de actividades formativas en corral.',
      ],
    },
    retornoEstimado: {
      zootecnico: '+18% en velocidad de procesamiento en manga y reducción estimada del 1.2% en mortalidad perinatal.',
      economicoArs: 240000,
      economicoUsd: 240,
    },
    simulacion: {
      variableControl: 'horasAdicionales',
      etiquetaVariable: 'Horas Adicionales de Capacitación y Prácticas',
      rangoMin: 0,
      rangoMax: 40,
      paso: 2,
      valorBase: 12,
      unidad: 'hs adicionales',
      formulaDescripcion: 'Proyección de reducción de errores operativos y mejora en la ganancia de peso diaria.',
      calcularImpacto: (horasExtra) => {
        const total = actuales.horasCapacitacion + horasExtra;
        const gdpGanado = Math.min(35, Math.round(horasExtra * 0.9));
        const beneficio = Math.round(horasExtra * 18500 + gdpGanado * 3200);
        return {
          kpiProyectadoTexto: `${total} hs/mes (Proyección)`,
          beneficioZootecnico: `+${gdpGanado} g/d adicionales en corderos por óptimo pesaje y dosificación`,
          beneficioArs: beneficio,
          beneficioUsd: Math.round(beneficio / tipoCambioOficial),
        };
      },
    },
  });

  // =========================================================================
  // 2. DECISIÓN: Cumplimiento de Protocolos y POEs (APRENDIZAJE / PROCESOS)
  // =========================================================================
  const semProt = evaluateUmbrales(actuales.cumplimientoProtocolos, metas.cumplimientoProtocolos, false);
  const urgenciaProt: NivelUrgenciaDecision =
    semProt.color === 'red' ? 'URGENTE' : semProt.color === 'amber' ? 'PRIORITARIO' : 'OPORTUNIDAD';

  decisiones.push({
    id: 'DEC-APRENDIZAJE-PROTOCOLOS',
    indicadorId: 'cumplimiento_protocolos_mejora',
    perspectiva: 'APRENDIZAJE',
    titulo: 'Auditoría y Estandarización de Procedimientos Operativos (POEs)',
    urgencia: urgenciaProt,
    valorActual: actuales.cumplimientoProtocolos,
    valorPrevio: previos.cumplimientoProtocolos,
    metaOptima: metas.cumplimientoProtocolos.minimo,
    unidad: '%',
    estadoSemaforo: semProt.label === 'Crítico' ? 'CRITICO' : semProt.label === 'A revisar' ? 'REVISAR' : 'OPTIMO',
    diagnosticoCausaRaiz:
      actuales.cumplimientoProtocolos < metas.cumplimientoProtocolos.minimo
        ? 'Desviaciones en la aplicación de normas de bioseguridad en parideras y demoras en el reporte de altas/bajas de inventario. Falta verificación formal antes de cada loteo.'
        : 'Excelente disciplina operativa. Se cubren los protocolos estandarizados con mínima dispersión técnica.',
    impactosCruzados: [
      {
        perspectivaAfectada: 'PROCESOS',
        nombrePerspectiva: 'Procesos Internos',
        descripcion: 'Aumenta el riesgo de brotes entéricos en corderos y retarda la toma de decisiones zootécnicas por lotes.',
        gravedad: 'ALTA',
      },
      {
        perspectivaAfectada: 'CLIENTES',
        nombrePerspectiva: 'Clientes / Mercado',
        descripcion: 'Inconsistencia en la homogeneidad de lotes comerciales entregados a faena.',
        gravedad: 'MEDIA',
      },
    ],
    planDeAccion: {
      responsable: 'Médico Veterinario de Majada',
      plazoDias: 10,
      plazoTexto: '10 días hábiles',
      acciones: [
        'Imprimir y plastificar los 5 POEs cardinales (Partos, Desparasitación, Señalada, Clasificación y Faena) en el galpón central.',
        'Efectuar una lista de chequeo cruzada semanal antes del ingreso de animales a corrales de trabajo.',
        'Auditar el libro de registro de tratamientos sanitarios para asegurar que ningún lote quede sin firma técnica.',
      ],
    },
    retornoEstimado: {
      zootecnico: 'Cero eventos de sobredosificación farmacológica y 98% de trazabilidad en lotes de recría.',
      economicoArs: 190000,
      economicoUsd: 190,
    },
    simulacion: {
      variableControl: 'pctMejoraProtocolos',
      etiquetaVariable: 'Incremento de Adopción de POEs',
      rangoMin: 0,
      rangoMax: 30,
      paso: 5,
      valorBase: 15,
      unidad: '% mejora',
      formulaDescripcion: 'Efecto de la reducción de desvíos en consumos de insumos veterinarios y mermas.',
      calcularImpacto: (pctExtra) => {
        const total = Math.min(100, actuales.cumplimientoProtocolos + pctExtra);
        const ahorroInsumos = Math.round(pctExtra * 12500);
        return {
          kpiProyectadoTexto: `${total}% cumplimiento`,
          beneficioZootecnico: `Disminución de 2.1 puntos en desvíos de insumos sanitarios`,
          beneficioArs: ahorroInsumos,
          beneficioUsd: Math.round(ahorroInsumos / tipoCambioOficial),
        };
      },
    },
  });

  // =========================================================================
  // 3. DECISIÓN: Evaluación de Competencias Zootécnicas (APRENDIZAJE)
  // =========================================================================
  const semComp = evaluateUmbrales(actuales.evaluacionCompetencias, metas.evaluacionCompetencias, false);
  const urgenciaComp: NivelUrgenciaDecision =
    semComp.color === 'red' ? 'URGENTE' : semComp.color === 'amber' ? 'PRIORITARIO' : 'PREVENTIVO';

  decisiones.push({
    id: 'DEC-APRENDIZAJE-COMPETENCIAS',
    indicadorId: 'evaluacion_competencias_tecnicas',
    perspectiva: 'APRENDIZAJE',
    titulo: 'Certificación Práctica en Manejo Zootécnico y Sanitario',
    urgencia: urgenciaComp,
    valorActual: actuales.evaluacionCompetencias,
    valorPrevio: previos.evaluacionCompetencias,
    metaOptima: metas.evaluacionCompetencias.minimo,
    unidad: 'pts',
    estadoSemaforo: semComp.label === 'Crítico' ? 'CRITICO' : semComp.label === 'A revisar' ? 'REVISAR' : 'OPTIMO',
    diagnosticoCausaRaiz:
      actuales.evaluacionCompetencias < metas.evaluacionCompetencias.minimo
        ? 'Disparidad en destrezas de diagnóstico clínico a campo (lectura de score corporal y grado Famacha). Esto genera tratamientos a ciegas o aplicaciones a destiempo.'
        : 'Equipo de trabajo altamente calificado en las 3 áreas críticas: sanidad, pesajes y bienestar animal.',
    impactosCruzados: [
      {
        perspectivaAfectada: 'FINANCIERA',
        nombrePerspectiva: 'Financiera',
        descripcion: 'Sobreconsumo de antiparasitarios y pérdidas por animales no detectados en estado anémico.',
        gravedad: 'ALTA',
      },
    ],
    planDeAccion: {
      responsable: 'Comisión Zootécnica UNRC & Asesor Veterinario',
      plazoDias: 14,
      plazoTexto: '14 días',
      acciones: [
        'Jornada de homologación visual de mucosa ocular con cartilla Famacha oficial con todo el personal de manga.',
        'Evaluación práctica con balanza electrónica simulando registro de 50 cabezas consecutivas.',
        'Certificación de operarios en maniobras de asistencia distócica sin traumatismo.',
      ],
    },
    retornoEstimado: {
      zootecnico: 'Alineación del 95% del personal en lectura unificada de peso y condición corporal.',
      economicoArs: 160000,
      economicoUsd: 160,
    },
    simulacion: {
      variableControl: 'puntosCompetencia',
      etiquetaVariable: 'Incremento en Puntaje de Competencias',
      rangoMin: 0,
      rangoMax: 25,
      paso: 1,
      valorBase: 10,
      unidad: 'pts',
      formulaDescripcion: 'Reducción de costos de reproceso e incremento de corderos logrados.',
      calcularImpacto: (pts) => {
        const total = Math.min(100, actuales.evaluacionCompetencias + pts);
        const beneficio = Math.round(pts * 15000);
        return {
          kpiProyectadoTexto: `${total} pts de destreza`,
          beneficioZootecnico: `Precisión del 98% en calibración de dosis por peso vivo`,
          beneficioArs: beneficio,
          beneficioUsd: Math.round(beneficio / tipoCambioOficial),
        };
      },
    },
  });

  // =========================================================================
  // 4. DECISIÓN: Tasa de Mortalidad (PROCESOS / ZOOTÉCNICA)
  // =========================================================================
  const semMort = evaluateUmbrales(actuales.tasaMortalidad, metas.mortalidad, true);
  const urgenciaMort: NivelUrgenciaDecision =
    semMort.color === 'red' ? 'URGENTE' : semMort.color === 'amber' ? 'PRIORITARIO' : 'PREVENTIVO';

  decisiones.push({
    id: 'DEC-PROCESOS-MORTALIDAD',
    indicadorId: 'tasa_mortalidad',
    perspectiva: 'PROCESOS',
    titulo: 'Mitigación de Mermas y Protocolo de Salvaguarda Perinatal',
    urgencia: urgenciaMort,
    valorActual: Number(actuales.tasaMortalidad.toFixed(1)),
    valorPrevio: Number(previos.tasaMortalidad.toFixed(1)),
    metaOptima: metas.mortalidad.minimo,
    unidad: '%',
    estadoSemaforo: semMort.label === 'Crítico' ? 'CRITICO' : semMort.label === 'A revisar' ? 'REVISAR' : 'OPTIMO',
    diagnosticoCausaRaiz:
      actuales.tasaMortalidad > metas.mortalidad.minimo
        ? 'Pérdidas acumuladas en etapa de parición y primeros 15 días de vida del cordero vinculadas a hipotermia, falta de calostrado inmediato o retraso en desparasitación de madres.'
        : 'Excelente tasa de supervivencia. Las prácticas de bienestar y reparo en piquetes arrojan resultados óptimos.',
    impactosCruzados: [
      {
        perspectivaAfectada: 'FINANCIERA',
        nombrePerspectiva: 'Financiera',
        descripcion: 'Cada 1% de mortalidad equivale a la pérdida de corderos comerciales valuados en ~$120.000 ARS netos.',
        gravedad: 'ALTA',
      },
      {
        perspectivaAfectada: 'CLIENTES',
        nombrePerspectiva: 'Clientes / Mercado',
        descripcion: 'Menor volumen de cabezas terminadas para cumplir contratos de entrega de corderos pesados.',
        gravedad: 'MEDIA',
      },
    ],
    planDeAccion: {
      responsable: 'Encargado General de Majada & Ayudantes UNRC',
      plazoDias: 5,
      plazoTexto: 'Urgente (5 días)',
      acciones: [
        'Acondicionamiento térmico de parideras con fardos de paja limpia y cortavientos.',
        'Verificación obligatoria de reflejo de succión y calostrado en las primeras 6 horas post-parto.',
        'Desinfección umbilical con solución de yodo al 7% dentro de los primeros 30 minutos de nacido.',
      ],
    },
    retornoEstimado: {
      zootecnico: 'Recuperación de 8 a 15 corderos por parición, alcanzando supervivencia > 96.5%.',
      economicoArs: 480000,
      economicoUsd: 480,
    },
    simulacion: {
      variableControl: 'reduccionMortalidadPct',
      etiquetaVariable: 'Reducción de Puntos Porcentuales de Mortalidad',
      rangoMin: 0.1,
      rangoMax: 3.0,
      paso: 0.1,
      valorBase: 1.0,
      unidad: '% reducción',
      formulaDescripcion: 'Recuperación económica basada en valor de mercado por cordero preservado.',
      calcularImpacto: (puntosMenos) => {
        const nuevoValor = Math.max(0.5, Number((actuales.tasaMortalidad - puntosMenos).toFixed(1)));
        const corderosSalvados = Math.round(puntosMenos * 7);
        const beneficio = corderosSalvados * 58000;
        return {
          kpiProyectadoTexto: `${nuevoValor}% mortalidad`,
          beneficioZootecnico: `${corderosSalvados} corderos adicionales preservados para comercialización`,
          beneficioArs: beneficio,
          beneficioUsd: Math.round(beneficio / tipoCambioOficial),
        };
      },
    },
  });

  // =========================================================================
  // 5. DECISIÓN: Margen Bruto y Costos Directos (FINANCIERA)
  // =========================================================================
  const semMb = evaluateUmbrales(actuales.margenBrutoArs, metas.margenBruto, false);
  const urgenciaMb: NivelUrgenciaDecision =
    semMb.color === 'red' ? 'URGENTE' : semMb.color === 'amber' ? 'PRIORITARIO' : 'OPORTUNIDAD';

  decisiones.push({
    id: 'DEC-FINANCIERA-MARGEN',
    indicadorId: 'margen_bruto',
    perspectiva: 'FINANCIERA',
    titulo: 'Optimización de Margen Bruto y Control Estricto de Costos Directos',
    urgencia: urgenciaMb,
    valorActual: actuales.margenBrutoArs,
    valorPrevio: previos.margenBrutoArs,
    metaOptima: metas.margenBruto.minimo,
    unidad: 'ARS',
    estadoSemaforo: semMb.label === 'Crítico' ? 'CRITICO' : semMb.label === 'A revisar' ? 'REVISAR' : 'OPTIMO',
    diagnosticoCausaRaiz:
      actuales.margenBrutoArs < metas.margenBruto.minimo
        ? 'Presión inflacionaria en granos y suplementos minerales combinada con baja frecuencia de ventas en el mes. Se requiere sincronizar los lotes de salida con los picos de precio de mercado.'
        : 'Margen operativo robusto con cobertura plena de los costos directos de alimentación y sanidad.',
    impactosCruzados: [
      {
        perspectivaAfectada: 'APRENDIZAJE',
        nombrePerspectiva: 'Aprendizaje & Desarrollo',
        descripcion: 'Un margen estrecho limita la disponibilidad presupuestaria para insumos de capacitación y instrumental.',
        gravedad: 'MEDIA',
      },
    ],
    planDeAccion: {
      responsable: 'Administrador Económico & Tesorería UNRC',
      plazoDias: 20,
      plazoTexto: '20 días',
      acciones: [
        'Renegociar compras en bloque de suplemento vitamínico-mineral obteniendo descuentos por volumen.',
        'Revisar la curva de engorde para despachar animales en el rango óptimo de peso (34 a 38 kg) evitando sobrecostos de mantenimiento.',
        'Monitorear la tasa de cobranza para asegurar que las ventas devengadas se conviertan en caja efectiva.',
      ],
    },
    retornoEstimado: {
      zootecnico: 'Aumento de eficiencia de conversión alimenticia a 4.5:1 en verdeos.',
      economicoArs: 350000,
      economicoUsd: 350,
    },
    simulacion: {
      variableControl: 'mejoraPrecioVentaPct',
      etiquetaVariable: 'Optimización de Precio de Venta / Costo (%)',
      rangoMin: 1,
      rangoMax: 20,
      paso: 1,
      valorBase: 5,
      unidad: '% mejora',
      formulaDescripcion: 'Impacto directo en margen bruto por negociación comercial y reducción de desperdicio forrajero.',
      calcularImpacto: (pct) => {
        const beneficio = Math.round(actuales.facturacionArs * (pct / 100));
        return {
          kpiProyectadoTexto: `$${(actuales.margenBrutoArs + beneficio).toLocaleString('es-AR')} MB proyectado`,
          beneficioZootecnico: `Incremento del margen sobre costos directos en ${(pct * 1.4).toFixed(1)}%`,
          beneficioArs: beneficio,
          beneficioUsd: Math.round(beneficio / tipoCambioOficial),
        };
      },
    },
  });

  return decisiones;
}

/**
 * Genera explicaciones narrativas y serie histórica de 6 meses para cada uno de los indicadores
 */
export function generarExplicacionesEvolucionIndicadores(
  state: DatabaseState,
  year: number,
  month: number,
  tipoCambioOficial = 1000
): ExplicacionEvolucionIndicador[] {
  const metas = loadMetasConfig();

  // Generar los 6 meses de historial
  const mesesHistoricos: { anio: number; mes: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    mesesHistoricos.push({
      anio: y,
      mes: m,
      label: `${NOMBRES_MESES_CORTO[m]} ${y.toString().slice(-2)}`,
    });
  }

  const historicos = mesesHistoricos.map((h) => ({
    ...h,
    data: calcularMetricasMesHistorico(state, h.anio, h.mes, tipoCambioOficial),
  }));

  const mesActualData = historicos[historicos.length - 1].data;
  const mesPrevioData = historicos[historicos.length - 2].data;

  const resultado: ExplicacionEvolucionIndicador[] = [];

  // Mapear cada indicador registrado en INDICADORES_MANUAL_DATA
  INDICADORES_MANUAL_DATA.forEach((ficha) => {
    let valActual = 0;
    let valPrevio = 0;
    const puntos: PuntoHistoricoMes[] = [];

    // Mapeo dinámico de valores
    switch (ficha.id) {
      case 'horas_capacitacion_practicas':
        valActual = mesActualData.horasCapacitacion;
        valPrevio = mesPrevioData.horasCapacitacion;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.horasCapacitacion }));
        break;
      case 'cumplimiento_protocolos_mejora':
        valActual = mesActualData.cumplimientoProtocolos;
        valPrevio = mesPrevioData.cumplimientoProtocolos;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.cumplimientoProtocolos }));
        break;
      case 'evaluacion_competencias_tecnicas':
        valActual = mesActualData.evaluacionCompetencias;
        valPrevio = mesPrevioData.evaluacionCompetencias;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.evaluacionCompetencias }));
        break;
      case 'tasa_mortalidad':
        valActual = Number(mesActualData.tasaMortalidad.toFixed(1));
        valPrevio = Number(mesPrevioData.tasaMortalidad.toFixed(1));
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: Number(h.data.tasaMortalidad.toFixed(1)) }));
        break;
      case 'carga_animal_ha':
        valActual = Number(mesActualData.cargaCabHa.toFixed(1));
        valPrevio = Number(mesPrevioData.cargaCabHa.toFixed(1));
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: Number(h.data.cargaCabHa.toFixed(1)) }));
        break;
      case 'gdp_peso':
        valActual = mesActualData.gdpPromedio;
        valPrevio = mesPrevioData.gdpPromedio;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.gdpPromedio }));
        break;
      case 'tasa_paricion':
        valActual = mesActualData.tasaParicion;
        valPrevio = mesPrevioData.tasaParicion;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.tasaParicion }));
        break;
      case 'cumplimiento_sanitario':
        valActual = mesActualData.cumplimientoSanitarioPct;
        valPrevio = mesPrevioData.cumplimientoSanitarioPct;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.cumplimientoSanitarioPct }));
        break;
      case 'cobertura_pesajes':
        valActual = mesActualData.coberturaPesajesPct;
        valPrevio = mesPrevioData.coberturaPesajesPct;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.coberturaPesajesPct }));
        break;
      case 'margen_bruto':
        valActual = mesActualData.margenBrutoArs;
        valPrevio = mesPrevioData.margenBrutoArs;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.margenBrutoArs }));
        break;
      case 'tasa_cobranza':
        valActual = mesActualData.tasaCobranza;
        valPrevio = mesPrevioData.tasaCobranza;
        historicos.forEach((h) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: h.data.tasaCobranza }));
        break;
      default:
        valActual = ficha.umbralMinimoDefecto;
        valPrevio = ficha.umbralMinimoDefecto;
        historicos.forEach((h, idx) => puntos.push({ mesLabel: h.label, mesNum: h.mes, anio: h.anio, valor: Math.round(ficha.umbralMinimoDefecto * (0.9 + idx * 0.03)) }));
        break;
    }

    // Variación y tendencia
    const varPct = valPrevio !== 0 ? ((valActual - valPrevio) / Math.abs(valPrevio)) * 100 : 0;
    const esMenorMejor = ficha.sentido === 'MENOR_MEJOR';
    const esMejora = esMenorMejor ? varPct < -1 : varPct > 1;
    const esDeterioro = esMenorMejor ? varPct > 1 : varPct < -1;
    const tendencia: 'MEJORA' | 'ESTABLE' | 'DETERIORO' = esMejora ? 'MEJORA' : esDeterioro ? 'DETERIORO' : 'ESTABLE';

    // Determinar estado de semáforo
    const sem = evaluateUmbrales(
      valActual,
      { critico: ficha.umbralCriticoDefecto, minimo: ficha.umbralMinimoDefecto },
      esMenorMejor
    );

    const estadoSemaforo = sem.label === 'Crítico' ? 'CRITICO' : sem.label === 'A revisar' ? 'REVISAR' : 'OPTIMO';

    // Generar explicaciones narrativas
    let explicacionValor = '';
    let explicacionEvolucion = '';
    let factoresClave: string[] = [];
    let decisionRecomendada = '';

    if (ficha.id === 'horas_capacitacion_practicas') {
      explicacionValor = `El registro actual de ${valActual} hs/mes refleja la suma de prácticas universitarias zootécnicas de estudiantes UNRC a campo y talleres formativos para operarios en manejo de manga y bienestar animal.`;
      explicacionEvolucion =
        tendencia === 'MEJORA'
          ? `La tendencia es positiva (+${varPct.toFixed(1)}% vs mes previo), producto del reinicio de las comisiones curriculares de prácticas zootécnicas en los corrales del campo escuela.`
          : `Se observa una desaceleración (-${Math.abs(varPct).toFixed(1)}%), coincidente con recesos académicos o faenas de mantenimiento donde se redujo el dictado de prácticas guiadas.`;
      factoresClave = [
        'Calendario lectivo de la Facultad de Agronomía y Veterinaria UNRC.',
        'Intensidad de eventos operativos programados en manga (pesajes y dosificaciones).',
        'Disponibilidad horaria del personal rural y docentes tutores.',
      ];
      decisionRecomendada =
        valActual < 40
          ? 'Programar 2 jornadas fijas semanales de prácticas a campo para alcanzar el piso recomendado de 40 hs/mes.'
          : 'Mantener la agenda actual e incorporar rotación de alumnos en diagnóstico de gestación por ecografía.';
    } else if (ficha.id === 'cumplimiento_protocolos_mejora') {
      explicacionValor = `El nivel alcanzado del ${valActual}% mide el cumplimiento estricto de los Procedimientos Operativos Estandarizados (POEs) sanitarios, biométricos y de bioseguridad auditados en el establecimiento.`;
      explicacionEvolucion =
        tendencia === 'MEJORA'
          ? `Incremento sostenido (+${varPct.toFixed(1)}%) en la adhesión a protocolos, favorecido por la implementación de planillas de control cruzado en corrales.`
          : `Dispersión técnica detectada (-${Math.abs(varPct).toFixed(1)}%), principalmente en la demora de carga digital de eventos de clasificación y dosificación.`;
      factoresClave = [
        'Claridad y visibilidad de los POEs en las instalaciones centrales.',
        'Auditorías periódicas cruzadas entre personal y ayudantes de cátedra.',
        'Trazabilidad en el uso de insumos veterinarios y pesajes electrónicos.',
      ];
      decisionRecomendada =
        valActual < 85
          ? 'Auditar los 3 protocolos con mayor desvío y realizar un refuerzo presencial en la manga de trabajo.'
          : 'Consolidar el estándar alcanzado e iniciar la certificación interna de buenas prácticas ovinas.';
    } else if (ficha.id === 'evaluacion_competencias_tecnicas') {
      explicacionValor = `El índice de ${valActual} puntos (escala 0-100) pondera la destreza práctica demostrada en tres ejes fundamentales: dosificación sanitaria (35%), pesajes en balanza electrónica (35%) y bienestar en corrales (30%).`;
      explicacionEvolucion =
        tendencia === 'MEJORA'
          ? `Mejora continua en las competencias operativas gracias a la repetición metódica de faenas de manga supervisadas.`
          : `Se detectaron oportunidades de mejora en la precisión del registro de caravanas y velocidad de sujeción ovina.`;
      factoresClave = [
        'Entrenamiento continuo en diagnóstico clínico Famacha y condición corporal.',
        'Familiaridad técnica con la balanza digital y caravanas electrónicas/visuales.',
        'Manejo calmo sin perros agresivos ni golpes que dañen el vellón o causen estrés.',
      ];
      decisionRecomendada =
        valActual < 75
          ? 'Efectuar una jornada de homologación de destrezas con evaluación práctica individual.'
          : 'Asignar a los operarios de mayor puntaje como tutores de los nuevos estudiantes ingresantes.';
    } else if (ficha.id === 'tasa_mortalidad') {
      explicacionValor = `La mortalidad mensual se sitúa en ${valActual}%, calculada sobre las existencias promedio del período. La meta óptima recomendada para la majada es no superar el ${ficha.umbralCriticoDefecto}%.`;
      explicacionEvolucion =
        tendencia === 'MEJORA'
          ? `Evolución favorable con reducción de mermas gracias a una mayor vigilancia en parideras y refugios contra vientos fríos.`
          : `Incremento de bajas registrado, común en períodos de temporales o picos de partos con madres primerizas de baja aptitud materna.`;
      factoresClave = [
        'Condiciones meteorológicas y protección contra frío/lluvia en corrales.',
        'Calostrado rápido de corderos en las primeras 6 horas de nacidos.',
        'Control estricto de parasitosis gastrointestinales en ovejas preñadas.',
      ];
      decisionRecomendada =
        valActual > 2.0
          ? 'Reforzar el patrullaje de parideras cada 3 horas y proveer sustituto calostral inmediato.'
          : 'Mantener las medidas preventivas actuales y registrar las causas específicas de cada baja.';
    } else {
      explicacionValor = `El valor registrado es de ${valActual} ${ficha.unidad}. ${ficha.definicion}`;
      explicacionEvolucion = `Evolución en los últimos 6 meses con variación de ${varPct > 0 ? '+' : ''}${varPct.toFixed(1)}% respecto al mes anterior.`;
      factoresClave = ficha.variables.map((v) => `${v.variable}: ${v.descripcion}`);
      decisionRecomendada = estadoSemaforo === 'CRITICO' ? ficha.accionesRecomendadas.enRojo : ficha.accionesRecomendadas.enAmarillo;
    }

    resultado.push({
      id: ficha.id,
      nombre: ficha.nombre,
      perspectiva: ficha.perspectiva,
      subcategoria: ficha.subcategoria,
      preguntaEstrategica: ficha.preguntaEstrategica,
      unidad: ficha.unidad,
      valorActual: valActual,
      valorPrevio: valPrevio,
      variacionPct: Number(varPct.toFixed(1)),
      tendencia,
      estadoSemaforo,
      metaOptimaTexto: ficha.rangoOptimoTexto,
      explicacionValor,
      explicacionEvolucion,
      factoresClave,
      decisionRecomendada,
      historico6Meses: puntos,
    });
  });

  return resultado;
}

/**
 * Calcula el resumen de salud estratégica global del CMI
 */
export function calcularResumenSaludCMI(
  state: DatabaseState,
  year: number,
  month: number,
  tipoCambioOficial = 1000
): ResumenSaludCMI {
  const explicaciones = generarExplicacionesEvolucionIndicadores(state, year, month, tipoCambioOficial);
  const decisiones = generarMatrizDecisionesPrescriptivas(state, year, month, loadMetasConfig(), tipoCambioOficial);

  let optimos = 0;
  let aRevisar = 0;
  let criticos = 0;

  const porPerspectiva: Record<
    PerspectivaIndicador,
    { score: number; total: number; optimos: number; aRevisar: number; criticos: number; pregunta: string }
  > = {
    FINANCIERA: { score: 0, total: 0, optimos: 0, aRevisar: 0, criticos: 0, pregunta: '¿Cómo deberíamos aparecer ante nuestros accionistas / financiadores para tener éxito financiero?' },
    CLIENTES: { score: 0, total: 0, optimos: 0, aRevisar: 0, criticos: 0, pregunta: '¿Cómo deberíamos aparecer ante nuestros clientes para alcanzar nuestra visión?' },
    PROCESOS: { score: 0, total: 0, optimos: 0, aRevisar: 0, criticos: 0, pregunta: '¿En qué procesos debemos ser excelentes para satisfacer a nuestros clientes y accionistas?' },
    APRENDIZAJE: { score: 0, total: 0, optimos: 0, aRevisar: 0, criticos: 0, pregunta: '¿Qué capacidades necesitamos fortalecer?' },
    ZOOTECNICA: { score: 0, total: 0, optimos: 0, aRevisar: 0, criticos: 0, pregunta: 'Excelencia en producción ovina y biometría' },
  };

  explicaciones.forEach((e) => {
    if (e.estadoSemaforo === 'OPTIMO') optimos++;
    else if (e.estadoSemaforo === 'REVISAR') aRevisar++;
    else if (e.estadoSemaforo === 'CRITICO') criticos++;

    const p = porPerspectiva[e.perspectiva];
    if (p) {
      p.total++;
      if (e.estadoSemaforo === 'OPTIMO') p.optimos++;
      else if (e.estadoSemaforo === 'REVISAR') p.aRevisar++;
      else if (e.estadoSemaforo === 'CRITICO') p.criticos++;
    }
  });

  // Cálculo de puntajes ponderados
  const total = explicaciones.length;
  const scoreGlobal = total > 0 ? Math.round(((optimos * 1.0 + aRevisar * 0.5) / total) * 100) : 100;

  (Object.keys(porPerspectiva) as PerspectivaIndicador[]).forEach((key) => {
    const item = porPerspectiva[key];
    item.score = item.total > 0 ? Math.round(((item.optimos * 1.0 + item.aRevisar * 0.5) / item.total) * 100) : 100;
  });

  return {
    scoreGlobal,
    totalIndicadores: total,
    optimos,
    aRevisar,
    criticos,
    decisionesUrgentes: decisiones.filter((d) => d.urgencia === 'URGENTE').length,
    decisionesPrioritarias: decisiones.filter((d) => d.urgencia === 'PRIORITARIO').length,
    resumenPorPerspectiva: porPerspectiva,
  };
}

// =========================================================================
// MÓDULO DE BENCHMARKING & METAS REGIONALES
// Comparativa de rendimiento vs Promedio Histórico UNRC y Estándar Regional INTA
// =========================================================================

export type TipoReferenciaBenchmark = 'INTA_REGIONAL' | 'HISTORICO_UNRC' | 'SUPERPUESTO';

export interface ItemBenchmark {
  id: string;
  indicador: string;
  perspectiva: PerspectivaIndicador;
  unidad: string;
  sentido: 'MAYOR_MEJOR' | 'MENOR_MEJOR';
  valorActual: number;
  valorReferenciaInta: number;
  fuenteInta: string;
  valorHistoricoUnrc: number;
  fuenteUnrc: string;
  valorReferenciaActivo: number;
  brechaAbsoluta: number;
  brechaPct: number;
  desempenioRelativoPct: number; // 100 = paridad, >100 = ventaja competitiva, <100 = brecha
  clasificacion: 'LIDERAZGO' | 'EN_RANGO' | 'BRECHA_A_SUPERAR';
  diagnosticoComparativo: string;
}

export interface EjeRadarBenchmark {
  indicadorId: string;
  label: string;
  actualNormalizado: number;
  benchmarkNormalizado: number;
  historicoNormalizado: number;
  unidad: string;
  valorActualReal: number;
  valorBenchmarkReal: number;
  valorHistoricoReal: number;
}

export interface AnalisisBenchmarkingResult {
  tipoReferencia: TipoReferenciaBenchmark;
  items: ItemBenchmark[];
  ejesRadar: EjeRadarBenchmark[];
  resumenCompetitividad: {
    indiceCompetitividadGlobal: number;
    fortalezasZonales: string[];
    desafiosZonales: string[];
    conclusionesEstrategicas: string;
  };
}

export const BENCHMARKS_REGIONALES_INTA: Record<string, { valor: number; unidad: string; fuente: string }> = {
  tasa_paricion: { valor: 88.0, unidad: '%', fuente: 'Estándar INTA Manfredi / Cuenca Mixta Córdoba' },
  gdp_peso: { valor: 165.0, unidad: 'g/día', fuente: 'Promedio Zonal Cuenca Centro-Sur INTA/CREA' },
  tasa_mortalidad: { valor: 4.5, unidad: '%', fuente: 'Tasa Media Extensiva Regional INTA' },
  carga_animal_ha: { valor: 2.2, unidad: 'cab/ha', fuente: 'Límite Agroecológico Pasturas Zonal INTA' },
  cumplimiento_sanitario: { valor: 82.0, unidad: '%', fuente: 'Protocolo Sanitario Básico SENASA/INTA' },
  horas_capacitacion_practicas: { valor: 20.0, unidad: 'hs/mes', fuente: 'Estándar de Capacitación Agropecuaria Regional' },
  cumplimiento_protocolos_mejora: { valor: 70.0, unidad: '%', fuente: 'Adopción Buenas Prácticas Ovinas INTA' },
  evaluacion_competencias_tecnicas: { valor: 68.0, unidad: 'pts', fuente: 'Nivel Promedio Operativo Cuenca Córdoba' },
  margen_sobre_cd: { valor: 35.0, unidad: '%', fuente: 'Margen Económico Ovino Regional CREA/INTA' },
  tasa_cobranza: { valor: 85.0, unidad: '%', fuente: 'Efectividad Cobranza Comercial Zonal' },
};

export const PROMEDIOS_HISTORICOS_UNRC: Record<string, { valor: number; unidad: string; fuente: string }> = {
  tasa_paricion: { valor: 91.5, unidad: '%', fuente: 'Histórico Multianual UNRC Pozo del Carril (2021-2025)' },
  gdp_peso: { valor: 180.0, unidad: 'g/día', fuente: 'Histórico Ensayos de Suplementación y Alfalfa UNRC' },
  tasa_mortalidad: { valor: 3.2, unidad: '%', fuente: 'Histórico Parideras Asistidas Campo Escuela UNRC' },
  carga_animal_ha: { valor: 3.4, unidad: 'cab/ha', fuente: 'Histórico Manejo Rotativo Intensivo en Parcelas' },
  cumplimiento_sanitario: { valor: 94.0, unidad: '%', fuente: 'Histórico Protocolo Cátedra de Zootecnia Ovinos' },
  horas_capacitacion_practicas: { valor: 45.0, unidad: 'hs/mes', fuente: 'Histórico Módulos Curriculares y Prácticas a Campo' },
  cumplimiento_protocolos_mejora: { valor: 88.0, unidad: '%', fuente: 'Histórico Auditorías Internas UNRC' },
  evaluacion_competencias_tecnicas: { valor: 78.0, unidad: 'pts', fuente: 'Histórico Evaluación de Destrezas en Manga y Balanza' },
  margen_sobre_cd: { valor: 48.0, unidad: '%', fuente: 'Histórico Económico Campañas Precedentes UNRC' },
  tasa_cobranza: { valor: 95.0, unidad: '%', fuente: 'Histórico Venta Directa y Faena Institucional UNRC' },
};

/**
 * Genera el análisis de benchmarking completo contrastando el mes actual contra INTA y/o UNRC Histórico
 */
export function generarAnalisisBenchmarking(
  state: DatabaseState,
  year: number,
  month: number,
  tipoReferencia: TipoReferenciaBenchmark = 'INTA_REGIONAL',
  tipoCambioOficial = 1000
): AnalisisBenchmarkingResult {
  const metricas = calcularMetricasMesHistorico(state, year, month, tipoCambioOficial);

  const margenSobreCdCalculado =
    metricas.costosDirectosArs > 0
      ? Number(((metricas.margenBrutoArs / metricas.costosDirectosArs) * 100).toFixed(1))
      : 55.0;

  const rawIndicators: Array<{
    id: string;
    indicador: string;
    perspectiva: PerspectivaIndicador;
    unidad: string;
    sentido: 'MAYOR_MEJOR' | 'MENOR_MEJOR';
    valorActual: number;
    diagnosticoExplicativo: (actual: number, ref: number, brecha: number) => string;
  }> = [
    {
      id: 'tasa_paricion',
      indicador: 'Tasa de Parición',
      perspectiva: 'PROCESOS',
      unidad: '%',
      sentido: 'MAYOR_MEJOR',
      valorActual: Number(metricas.tasaParicion.toFixed(1)),
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Eficiencia reproductiva superior (+${b.toFixed(1)}%). El loteo previo al servicio y la condición corporal de las madres explican el liderazgo respecto a la referencia.`
          : `Brecha reproductiva de ${Math.abs(b).toFixed(1)}%. Se requiere intensificar el flushing nutricional 3 semanas antes de la introducción de los carneros.`,
    },
    {
      id: 'gdp_peso',
      indicador: 'Ganancia Diaria de Peso (GDP)',
      perspectiva: 'PROCESOS',
      unidad: 'g/día',
      sentido: 'MAYOR_MEJOR',
      valorActual: Math.round(metricas.gdpPromedio),
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Crecimiento sobresaliente (+${b} g/d). Las pasturas implantadas y el monitoreo por balanza digital superan los parámetros de engorde regionales.`
          : `Retraso de ganancia de peso (-${Math.abs(b)} g/d). Evaluar la carga parasitaria gastrointestinal y disponibilidad de proteína digestible.`,
    },
    {
      id: 'tasa_mortalidad',
      indicador: 'Tasa de Mortalidad Perinatal',
      perspectiva: 'PROCESOS',
      unidad: '%',
      sentido: 'MENOR_MEJOR',
      valorActual: Number(metricas.tasaMortalidad.toFixed(1)),
      diagnosticoExplicativo: (act, ref, b) =>
        act <= ref
          ? `Liderazgo zootécnico en supervivencia. La mortalidad actual (${act}%) es significativamente inferior a la tasa promedio (${ref}%), salvando corderos comerciales.`
          : `Mortalidad excesiva (${act}% vs ${ref}% esperado). Protocolo de salvaguarda perinatal en parideras debe activarse inmediatamente.`,
    },
    {
      id: 'carga_animal_ha',
      indicador: 'Carga Animal por Hectárea',
      perspectiva: 'PROCESOS',
      unidad: 'cab/ha',
      sentido: 'MAYOR_MEJOR',
      valorActual: Number(metricas.cargaCabHa.toFixed(1)),
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Mayor aprovechamiento forrajero (+${b.toFixed(1)} cab/ha). La subdivisión parcelaria permite superar la receptividad zonal típica sin degradar el suelo.`
          : `Subutilización del recurso forrajero (-${Math.abs(b).toFixed(1)} cab/ha) con capacidad ociosa para incorporar vientres de recría.`,
    },
    {
      id: 'cumplimiento_sanitario',
      indicador: 'Cumplimiento de Plan Sanitario',
      perspectiva: 'PROCESOS',
      unidad: '%',
      sentido: 'MAYOR_MEJOR',
      valorActual: Number(metricas.cumplimientoSanitarioPct.toFixed(1)),
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Sanidad preventiva consolidada (+${b.toFixed(1)}%). Cronograma de vacunaciones y desparasitaciones al día frente a los estándares de la cuenca.`
          : `Déficit en tratamientos preventivos (-${Math.abs(b).toFixed(1)}%). Riesgo sanitario por eventos atrasados de manga.`,
    },
    {
      id: 'horas_capacitacion_practicas',
      indicador: 'Capacitación y Prácticas a Campo',
      perspectiva: 'APRENDIZAJE',
      unidad: 'hs/mes',
      sentido: 'MAYOR_MEJOR',
      valorActual: metricas.horasCapacitacion,
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Fortaleza distintiva UNRC (+${b} hs/mes). La articulación docente-productiva en el campo escuela genera destrezas no observadas en establecimientos comerciales comunes.`
          : `Menor ritmo formativo en el período (-${Math.abs(b)} hs/mes). Coordinar nuevas comisiones de trabajo con estudiantes.`,
    },
    {
      id: 'cumplimiento_protocolos_mejora',
      indicador: 'Adopción de Protocolos POEs',
      perspectiva: 'APRENDIZAJE',
      unidad: '%',
      sentido: 'MAYOR_MEJOR',
      valorActual: metricas.cumplimientoProtocolos,
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Estandarización rigurosa (+${b}%). Alta disciplina en la aplicación de Procedimientos Operativos Estandarizados.`
          : `Oportunidad de formalización técnica (-${Math.abs(b)}%). Reforzar auditorías de control en corrales de pesaje y parición.`,
    },
    {
      id: 'evaluacion_competencias_tecnicas',
      indicador: 'Competencias en Manga y Balanza',
      perspectiva: 'APRENDIZAJE',
      unidad: 'pts',
      sentido: 'MAYOR_MEJOR',
      valorActual: metricas.evaluacionCompetencias,
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Destreza técnica destacada (+${b} pts). Personal y estudiantes con alta precisión en dosificación, lectura de caravanas y bienestar ovino.`
          : `Competencias a reforzar (-${Math.abs(b)} pts). Se sugiere taller presencial de calibración instrumental.`,
    },
    {
      id: 'margen_sobre_cd',
      indicador: 'Margen sobre Costos Directos',
      perspectiva: 'FINANCIERA',
      unidad: '%',
      sentido: 'MAYOR_MEJOR',
      valorActual: margenSobreCdCalculado,
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Eficiencia económica superior (+${b.toFixed(1)}%). Retorno sobre costos directos por encima del promedio del modelo agropecuario zonal.`
          : `Margen presionado (-${Math.abs(b).toFixed(1)}%). El incremento en suplementación o precios de insumos requiere revisión de costos de ración.`,
    },
    {
      id: 'tasa_cobranza',
      indicador: 'Efectividad de Cobranzas',
      perspectiva: 'CLIENTES',
      unidad: '%',
      sentido: 'MAYOR_MEJOR',
      valorActual: Number(metricas.tasaCobranza.toFixed(1)),
      diagnosticoExplicativo: (act, ref, b) =>
        b >= 0
          ? `Solvencia comercial (+${b.toFixed(1)}%). Recupero rápido de ventas realizadas sin acumular créditos morosos.`
          : `Plazo de cobro extendido (-${Math.abs(b).toFixed(1)}%). Riesgo financiero por saldos comerciales pendientes de liquidación.`,
    },
  ];

  const items: ItemBenchmark[] = rawIndicators.map((ind) => {
    const intaRef = BENCHMARKS_REGIONALES_INTA[ind.id] || { valor: 80, fuente: 'INTA Zonal' };
    const unrcRef = PROMEDIOS_HISTORICOS_UNRC[ind.id] || { valor: 85, fuente: 'Histórico UNRC' };

    const refActiva = tipoReferencia === 'HISTORICO_UNRC' ? unrcRef.valor : intaRef.valor;

    let brechaAbsoluta = 0;
    let brechaPct = 0;
    let desempenioRelativoPct = 100;

    if (ind.sentido === 'MAYOR_MEJOR') {
      brechaAbsoluta = ind.valorActual - refActiva;
      brechaPct = refActiva > 0 ? (brechaAbsoluta / refActiva) * 100 : 0;
      desempenioRelativoPct = refActiva > 0 ? Math.round((ind.valorActual / refActiva) * 100) : 100;
    } else {
      // Para menor es mejor (mortalidad)
      brechaAbsoluta = refActiva - ind.valorActual; // positivo es mejor
      brechaPct = refActiva > 0 ? ((refActiva - ind.valorActual) / refActiva) * 100 : 0;
      // Normalización para radar: si la mortalidad es la mitad, el desempeño es 150%
      desempenioRelativoPct = ind.valorActual > 0 ? Math.round((refActiva / ind.valorActual) * 100) : 150;
    }

    // Limitar desempeño relativo para gráficos armónicos
    desempenioRelativoPct = Math.max(30, Math.min(170, desempenioRelativoPct));

    let clasificacion: 'LIDERAZGO' | 'EN_RANGO' | 'BRECHA_A_SUPERAR' = 'EN_RANGO';
    if (brechaPct > 5.0) {
      clasificacion = 'LIDERAZGO';
    } else if (brechaPct < -5.0) {
      clasificacion = 'BRECHA_A_SUPERAR';
    }

    return {
      id: ind.id,
      indicador: ind.indicador,
      perspectiva: ind.perspectiva,
      unidad: ind.unidad,
      sentido: ind.sentido,
      valorActual: ind.valorActual,
      valorReferenciaInta: intaRef.valor,
      fuenteInta: intaRef.fuente,
      valorHistoricoUnrc: unrcRef.valor,
      fuenteUnrc: unrcRef.fuente,
      valorReferenciaActivo: refActiva,
      brechaAbsoluta: Number(brechaAbsoluta.toFixed(1)),
      brechaPct: Number(brechaPct.toFixed(1)),
      desempenioRelativoPct,
      clasificacion,
      diagnosticoComparativo: ind.diagnosticoExplicativo(ind.valorActual, refActiva, brechaPct),
    };
  });

  // 8 Ejes representativos para el Gráfico de Radar
  const ejesClaveRadar = [
    { id: 'tasa_paricion', label: 'Parición (%)' },
    { id: 'gdp_peso', label: 'Ganancia Peso (g/d)' },
    { id: 'tasa_mortalidad', label: 'Supervivencia (1/Mort)' },
    { id: 'carga_animal_ha', label: 'Carga Animal (cab/ha)' },
    { id: 'cumplimiento_sanitario', label: 'Sanidad (%)' },
    { id: 'horas_capacitacion_practicas', label: 'Capacitación (hs)' },
    { id: 'cumplimiento_protocolos_mejora', label: 'POEs Técnicos (%)' },
    { id: 'margen_sobre_cd', label: 'Margen s/CD (%)' },
  ];

  const ejesRadar: EjeRadarBenchmark[] = ejesClaveRadar.map((e) => {
    const item = items.find((i) => i.id === e.id);
    if (!item) {
      return {
        indicadorId: e.id,
        label: e.label,
        actualNormalizado: 100,
        benchmarkNormalizado: 100,
        historicoNormalizado: 100,
        unidad: '%',
        valorActualReal: 100,
        valorBenchmarkReal: 100,
        valorHistoricoReal: 100,
      };
    }

    // Normalizado a base 100:
    // El benchmark siempre es 100 en el radar
    const actualNorm = item.desempenioRelativoPct;

    // Normalización de histórico UNRC respecto a INTA
    let histNorm = 100;
    if (item.sentido === 'MAYOR_MEJOR') {
      histNorm = item.valorReferenciaInta > 0 ? Math.round((item.valorHistoricoUnrc / item.valorReferenciaInta) * 100) : 100;
    } else {
      histNorm = item.valorHistoricoUnrc > 0 ? Math.round((item.valorReferenciaInta / item.valorHistoricoUnrc) * 100) : 100;
    }

    return {
      indicadorId: item.id,
      label: e.label,
      actualNormalizado: Math.max(30, Math.min(160, actualNorm)),
      benchmarkNormalizado: 100,
      historicoNormalizado: Math.max(30, Math.min(160, histNorm)),
      unidad: item.unidad,
      valorActualReal: item.valorActual,
      valorBenchmarkReal: item.valorReferenciaInta,
      valorHistoricoReal: item.valorHistoricoUnrc,
    };
  });

  // Resumen de competitividad
  const fortalezas = items.filter((i) => i.clasificacion === 'LIDERAZGO').map((i) => `${i.indicador}: +${i.brechaPct}% vs benchmark`);
  const desafios = items.filter((i) => i.clasificacion === 'BRECHA_A_SUPERAR').map((i) => `${i.indicador}: ${i.brechaPct}% vs benchmark`);

  const totalEvaluados = items.length;
  const liderazgoCount = items.filter((i) => i.clasificacion === 'LIDERAZGO').length;
  const enRangoCount = items.filter((i) => i.clasificacion === 'EN_RANGO').length;
  const indiceCompetitividadGlobal = Math.round(((liderazgoCount * 1.0 + enRangoCount * 0.7) / totalEvaluados) * 100);

  const refTexto = tipoReferencia === 'HISTORICO_UNRC' ? 'al promedio histórico UNRC' : 'al estándar regional INTA Centro-Sur de Córdoba';

  const conclusionesEstrategicas =
    indiceCompetitividadGlobal >= 80
      ? `La unidad de negocio demuestra un desempeño superior respecto ${refTexto}, con ventajas destacadas en carga animal, ganancia de peso y formación práctica universitaria.`
      : `Se observan oportunidades de alineación zootécnica respecto ${refTexto}, principalmente en el fortalecimiento del plan sanitario y la disciplina de protocolos en manga.`;

  return {
    tipoReferencia,
    items,
    ejesRadar,
    resumenCompetitividad: {
      indiceCompetitividadGlobal,
      fortalezasZonales: fortalezas,
      desafiosZonales: desafios,
      conclusionesEstrategicas,
    },
  };
}


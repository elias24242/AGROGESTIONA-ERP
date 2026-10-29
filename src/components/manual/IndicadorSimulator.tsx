import React, { useState, useMemo } from 'react';
import { FichaIndicador } from '../../data/indicadoresManualData';
import {
  BENCHMARKS_REGIONALES_INTA,
  PROMEDIOS_HISTORICOS_UNRC,
} from '../../services/businessAnalyticsService';
import {
  Calculator,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  Info,
  Target,
  Sliders,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  ShieldCheck,
} from 'lucide-react';

interface VariableConfig {
  key: string;
  label: string;
  unit: string;
  defaultValue: number;
  step: number;
  min: number;
  max: number;
  help: string;
}

interface SimulatorDef {
  variables: VariableConfig[];
  calculate: (values: Record<string, number>) => number;
  formatResult: (val: number) => string;
  getFormulaWithValues: (values: Record<string, number>, result: number) => string;
}

const SIMULATORS_MAP: Record<string, SimulatorDef> = {
  tasa_mortalidad: {
    variables: [
      { key: 'bajas', label: 'Bajas por Muerte', unit: 'cabezas', defaultValue: 1, step: 1, min: 0, max: 50, help: 'Ovinos fallecidos en el período' },
      { key: 'existencia', label: 'Existencia Total Majada', unit: 'cabezas', defaultValue: 81, step: 1, min: 1, max: 1000, help: 'Stock total de cabezas vivas' },
    ],
    calculate: (v) => (v.existencia > 0 ? (v.bajas / v.existencia) * 100 : 0),
    formatResult: (val) => `${val.toFixed(2)} %`,
    getFormulaWithValues: (v, res) => `(${v.bajas} bajas / ${v.existencia} cabezas) × 100 = ${res.toFixed(2)}%`,
  },
  carga_animal_ha: {
    variables: [
      { key: 'cabezas', label: 'Existencia Total', unit: 'cabezas', defaultValue: 81, step: 1, min: 1, max: 500, help: 'Cabezas presentes en el potrero' },
      { key: 'hectareas', label: 'Superficie Forrajera', unit: 'ha', defaultValue: 45.0, step: 0.5, min: 1, max: 500, help: 'Hectáreas útiles asignadas' },
    ],
    calculate: (v) => (v.hectareas > 0 ? v.cabezas / v.hectareas : 0),
    formatResult: (val) => `${val.toFixed(2)} cab/ha`,
    getFormulaWithValues: (v, res) => `${v.cabezas} cabezas / ${v.hectareas} ha = ${res.toFixed(2)} cab/ha`,
  },
  tasa_paricion: {
    variables: [
      { key: 'nacimientos', label: 'Nacimientos en el Período', unit: 'corderos', defaultValue: 62, step: 1, min: 0, max: 200, help: 'Corderos nacidos vivos' },
      { key: 'vientres', label: 'Vientres Expuestos a Servicio', unit: 'madres', defaultValue: 64, step: 1, min: 1, max: 200, help: 'Ovejas servidas por carneros' },
    ],
    calculate: (v) => (v.vientres > 0 ? (v.nacimientos / v.vientres) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `(${v.nacimientos} nacidos / ${v.vientres} madres) × 100 = ${res.toFixed(1)}%`,
  },
  gdp_peso: {
    variables: [
      { key: 'pesoInicial', label: 'Peso Inicial Promedio', unit: 'kg', defaultValue: 18.0, step: 0.5, min: 5, max: 60, help: 'Peso en la 1ª pesada de control' },
      { key: 'pesoFinal', label: 'Peso Final Promedio', unit: 'kg', defaultValue: 25.5, step: 0.5, min: 10, max: 80, help: 'Peso en la 2ª pesada' },
      { key: 'dias', label: 'Días Transcurridos', unit: 'días', defaultValue: 35, step: 1, min: 1, max: 180, help: 'Intervalo de tiempo entre pesajes' },
    ],
    calculate: (v) => (v.dias > 0 ? ((v.pesoFinal - v.pesoInicial) / v.dias) * 1000 : 0),
    formatResult: (val) => `${Math.round(val)} g/día`,
    getFormulaWithValues: (v, res) => `((${v.pesoFinal} kg - ${v.pesoInicial} kg) / ${v.dias} d) × 1000 = ${Math.round(res)} g/día`,
  },
  ventas_mes: {
    variables: [
      { key: 'corderos', label: 'Ventas de Corderos y Hacienda', unit: 'ARS', defaultValue: 580000, step: 10000, min: 0, max: 5000000, help: 'Ingresos por venta de animales' },
      { key: 'otros', label: 'Ventas de Lana / Subproductos', unit: 'ARS', defaultValue: 120000, step: 5000, min: 0, max: 1000000, help: 'Ingresos por zafra lanera' },
    ],
    calculate: (v) => v.corderos + v.otros,
    formatResult: (val) => `$ ${val.toLocaleString('es-AR')}`,
    getFormulaWithValues: (v, res) => `$${v.corderos.toLocaleString('es-AR')} + $${v.otros.toLocaleString('es-AR')} = $${res.toLocaleString('es-AR')}`,
  },
  clientes_activos: {
    variables: [
      { key: 'carnicerias', label: 'Frigoríficos / Carnicerías', unit: 'clientes', defaultValue: 2, step: 1, min: 0, max: 10, help: 'Compradores recurrentes' },
      { key: 'particulares', label: 'Productores / Particulares', unit: 'clientes', defaultValue: 1, step: 1, min: 0, max: 20, help: 'Compras directas de vientres o lechales' },
    ],
    calculate: (v) => v.carnicerias + v.particulares,
    formatResult: (val) => `${val} clientes`,
    getFormulaWithValues: (v, res) => `${v.carnicerias} frigoríficos + ${v.particulares} particulares = ${res} clientes`,
  },
  precio_promedio_cab: {
    variables: [
      { key: 'totalVentas', label: 'Total Facturado en Hacienda', unit: 'ARS', defaultValue: 720000, step: 10000, min: 0, max: 5000000, help: 'Monto de venta total' },
      { key: 'cabezas', label: 'Cabezas Ovinas Despachadas', unit: 'cabezas', defaultValue: 16, step: 1, min: 1, max: 200, help: 'Total de animales comercializados' },
    ],
    calculate: (v) => (v.cabezas > 0 ? v.totalVentas / v.cabezas : 0),
    formatResult: (val) => `$ ${Math.round(val).toLocaleString('es-AR')} / cab`,
    getFormulaWithValues: (v, res) => `$${v.totalVentas.toLocaleString('es-AR')} / ${v.cabezas} cab = $${Math.round(res).toLocaleString('es-AR')} / cab`,
  },
  tasa_cobranza: {
    variables: [
      { key: 'cobrado', label: 'Cobros Efectivos Realizados', unit: 'ARS', defaultValue: 680000, step: 10000, min: 0, max: 5000000, help: 'Dinero acreditado en banco o caja' },
      { key: 'facturado', label: 'Total Facturado en Ventas', unit: 'ARS', defaultValue: 700000, step: 10000, min: 1, max: 5000000, help: 'Monto devengado en el mes' },
    ],
    calculate: (v) => (v.facturado > 0 ? (v.cobrado / v.facturado) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `($${v.cobrado.toLocaleString('es-AR')} / $${v.facturado.toLocaleString('es-AR')}) × 100 = ${res.toFixed(1)}%`,
  },
  cumplimiento_sanitario: {
    variables: [
      { key: 'aplicados', label: 'Tratamientos Aplicados', unit: 'dosis/eventos', defaultValue: 19, step: 1, min: 0, max: 50, help: 'Dosis sanitarias ejecutadas en fecha' },
      { key: 'programados', label: 'Tratamientos Programados', unit: 'dosis/eventos', defaultValue: 20, step: 1, min: 1, max: 50, help: 'Protocolo preventivo del calendario' },
    ],
    calculate: (v) => (v.programados > 0 ? (v.aplicados / v.programados) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `(${v.aplicados} aplicados / ${v.programados} programados) × 100 = ${res.toFixed(1)}%`,
  },
  cobertura_pesajes: {
    variables: [
      { key: 'pesadas', label: 'Cabezas Pesadas en Balanza', unit: 'cabezas', defaultValue: 28, step: 1, min: 0, max: 100, help: 'Animales muestreados en manga' },
      { key: 'totales', label: 'Stock Categorías en Desarrollo', unit: 'cabezas', defaultValue: 32, step: 1, min: 1, max: 100, help: 'Corderos y borregas en recría/engorde' },
    ],
    calculate: (v) => (v.totales > 0 ? (v.pesadas / v.totales) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `(${v.pesadas} pesadas / ${v.totales} total) × 100 = ${res.toFixed(1)}%`,
  },
  eficiencia_procesos: {
    variables: [
      { key: 'sinPrecio', label: 'Consumos sin Precio Asignado', unit: '%', defaultValue: 2.0, step: 0.5, min: 0, max: 50, help: '% de remitos pendientes de valorizar' },
      { key: 'desvios', label: 'Desvíos de Consumo Técnico', unit: '%', defaultValue: 3.5, step: 0.5, min: 0, max: 50, help: '% de desvío frente a la dosis teórica' },
    ],
    calculate: (v) => Math.max(0, 100 - (v.sinPrecio + v.desvios)),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `100% - (${v.sinPrecio}% + ${v.desvios}%) = ${res.toFixed(1)}%`,
  },
  rotacion_pasturas: {
    variables: [
      { key: 'descanso', label: 'Superficie en Descanso / Rebrote', unit: 'ha', defaultValue: 38.0, step: 0.5, min: 0, max: 100, help: 'Hectáreas sin pastoreo activo' },
      { key: 'total', label: 'Superficie Forrajera Total', unit: 'ha', defaultValue: 45.0, step: 0.5, min: 1, max: 100, help: 'Total de potreros ovinos' },
    ],
    calculate: (v) => (v.total > 0 ? (v.descanso / v.total) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `(${v.descanso} ha descanso / ${v.total} ha total) × 100 = ${res.toFixed(1)}%`,
  },
  margen_bruto: {
    variables: [
      { key: 'ventas', label: 'Ingresos por Ventas Devengadas', unit: 'ARS', defaultValue: 780000, step: 10000, min: 0, max: 5000000, help: 'Ventas de carne, lana y hacienda' },
      { key: 'costosDirectos', label: 'Costos Directos del Período', unit: 'ARS', defaultValue: 340000, step: 10000, min: 0, max: 5000000, help: 'Alimentos, sanidad, pasturas y esquila' },
    ],
    calculate: (v) => v.ventas - v.costosDirectos,
    formatResult: (val) => `$ ${val.toLocaleString('es-AR')}`,
    getFormulaWithValues: (v, res) => `$${v.ventas.toLocaleString('es-AR')} - $${v.costosDirectos.toLocaleString('es-AR')} = $${res.toLocaleString('es-AR')}`,
  },
  costos_directos: {
    variables: [
      { key: 'alimentacion', label: 'Alimentación y Forrajes', unit: 'ARS', defaultValue: 180000, step: 5000, min: 0, max: 2000000, help: 'Granos, rollos y concentrados consumidos' },
      { key: 'sanidad', label: 'Sanidad y Veterinaria', unit: 'ARS', defaultValue: 75000, step: 5000, min: 0, max: 1000000, help: 'Vacunas, antiparasitarios y curaciones' },
      { key: 'otrosDirectos', label: 'Esquila, Fletes y Mano de Obra Temp.', unit: 'ARS', defaultValue: 85000, step: 5000, min: 0, max: 1000000, help: 'Gastos variables directos' },
    ],
    calculate: (v) => v.alimentacion + v.sanidad + v.otrosDirectos,
    formatResult: (val) => `$ ${val.toLocaleString('es-AR')}`,
    getFormulaWithValues: (v, res) => `$${v.alimentacion.toLocaleString('es-AR')} + $${v.sanidad.toLocaleString('es-AR')} + $${v.otrosDirectos.toLocaleString('es-AR')} = $${res.toLocaleString('es-AR')}`,
  },
  margen_sobre_cd: {
    variables: [
      { key: 'margenBruto', label: 'Margen Bruto Obtenido', unit: 'ARS', defaultValue: 440000, step: 10000, min: 0, max: 5000000, help: 'Resultado operativo directo' },
      { key: 'costosDirectos', label: 'Costos Directos Incurridos', unit: 'ARS', defaultValue: 340000, step: 10000, min: 1, max: 5000000, help: 'Capital de trabajo directo' },
    ],
    calculate: (v) => (v.costosDirectos > 0 ? (v.margenBruto / v.costosDirectos) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `($${v.margenBruto.toLocaleString('es-AR')} / $${v.costosDirectos.toLocaleString('es-AR')}) × 100 = ${res.toFixed(1)}%`,
  },
  flujo_caja_neto: {
    variables: [
      { key: 'cobros', label: 'Cobros Efectivos Acreditados', unit: 'ARS', defaultValue: 620000, step: 10000, min: 0, max: 5000000, help: 'Ingresos monetarios reales en cuenta' },
      { key: 'pagos', label: 'Pagos Efectivos Desembolsados', unit: 'ARS', defaultValue: 480000, step: 10000, min: 0, max: 5000000, help: 'Egresos monetarios reales cancelados' },
    ],
    calculate: (v) => v.cobros - v.pagos,
    formatResult: (val) => `$ ${val.toLocaleString('es-AR')}`,
    getFormulaWithValues: (v, res) => `$${v.cobros.toLocaleString('es-AR')} - $${v.pagos.toLocaleString('es-AR')} = $${res.toLocaleString('es-AR')}`,
  },
  horas_capacitacion_practicas: {
    variables: [
      { key: 'practicasEstudiantes', label: 'Horas Prácticas Estudiantes UNRC', unit: 'hs', defaultValue: 32, step: 2, min: 0, max: 150, help: 'Prácticas docentes a campo en corrales y manga' },
      { key: 'capacitacionPersonal', label: 'Horas Capacitación Personal Rural', unit: 'hs', defaultValue: 16, step: 2, min: 0, max: 100, help: 'Talleres de sanidad, bienestar y nutrición' },
    ],
    calculate: (v) => v.practicasEstudiantes + v.capacitacionPersonal,
    formatResult: (val) => `${val} hs/mes`,
    getFormulaWithValues: (v, res) => `${v.practicasEstudiantes} hs (UNRC) + ${v.capacitacionPersonal} hs (Personal) = ${res} hs/mes`,
  },
  cumplimiento_protocolos_mejora: {
    variables: [
      { key: 'ejecutados', label: 'Protocolos y Mejoras Ejecutados', unit: 'protocolos', defaultValue: 9, step: 1, min: 0, max: 30, help: 'POEs auditados y aplicados correctamente' },
      { key: 'programados', label: 'Total Protocolos Programados', unit: 'protocolos', defaultValue: 10, step: 1, min: 1, max: 30, help: 'Estándares fijados para la etapa' },
    ],
    calculate: (v) => (v.programados > 0 ? (v.ejecutados / v.programados) * 100 : 0),
    formatResult: (val) => `${val.toFixed(1)} %`,
    getFormulaWithValues: (v, res) => `(${v.ejecutados} ejecutados / ${v.programados} programados) × 100 = ${res.toFixed(1)}%`,
  },
  evaluacion_competencias_tecnicas: {
    variables: [
      { key: 'sanidad', label: 'Destreza Sanitaria y Dosificación', unit: 'pts', defaultValue: 82, step: 1, min: 0, max: 100, help: 'Famacha, inyectables y curaciones (ponderación 35%)' },
      { key: 'pesajes', label: 'Manejo en Manga y Pesajes', unit: 'pts', defaultValue: 78, step: 1, min: 0, max: 100, help: 'Lectura caravanas, balanza y registro (ponderación 35%)' },
      { key: 'corrales', label: 'Bienestar y Manejo en Corrales', unit: 'pts', defaultValue: 85, step: 1, min: 0, max: 100, help: 'Enjaulados, parición y sujeción ovina (ponderación 30%)' },
    ],
    calculate: (v) => Math.round(v.sanidad * 0.35 + v.pesajes * 0.35 + v.corrales * 0.30),
    formatResult: (val) => `${val} pts`,
    getFormulaWithValues: (v, res) => `(${v.sanidad} × 0.35) + (${v.pesajes} × 0.35) + (${v.corrales} × 0.30) = ${res} pts`,
  },
};

interface IndicadorSimulatorProps {
  indicador: FichaIndicador;
  onClose?: () => void;
}

export const IndicadorSimulator: React.FC<IndicadorSimulatorProps> = ({ indicador, onClose }) => {
  const def = SIMULATORS_MAP[indicador.id];

  // Referencias estándar disponibles
  const intaRef = BENCHMARKS_REGIONALES_INTA[indicador.id]?.valor ?? indicador.umbralMinimoDefecto;
  const unrcRef = PROMEDIOS_HISTORICOS_UNRC[indicador.id]?.valor ?? indicador.umbralMinimoDefecto;

  // Estado de Meta Estándar
  const [metaPreset, setMetaPreset] = useState<'INTA' | 'UNRC' | 'CUSTOM'>('INTA');
  const [metaValor, setMetaValor] = useState<number>(() => intaRef);

  // Estado de Margen de Error / Tolerancia (porcentaje ±)
  const [margenErrorPct, setMargenErrorPct] = useState<number>(5);

  // Estado de Escenario Activo
  const [escenarioActivo, setEscenarioActivo] = useState<'BASE' | 'OPTIMISTA' | 'PESIMISTA' | 'CUSTOM'>('BASE');

  // Inicializar estado con los valores por defecto de variables
  const [values, setValues] = useState<Record<string, number>>(() => {
    if (!def) return {};
    const initial: Record<string, number> = {};
    def.variables.forEach((v) => {
      initial[v.key] = v.defaultValue;
    });
    return initial;
  });

  // Generador dinámico de escenarios
  const escenarios = useMemo(() => {
    if (!def) return null;

    const baseVals: Record<string, number> = {};
    const optVals: Record<string, number> = {};
    const pesVals: Record<string, number> = {};

    def.variables.forEach((v) => {
      baseVals[v.key] = v.defaultValue;

      const isNegativeCostOrLoss =
        v.key.includes('bajas') ||
        v.key.includes('muerte') ||
        v.key.includes('sinPrecio') ||
        v.key.includes('desvios') ||
        v.key.includes('costos');

      if (isNegativeCostOrLoss) {
        // En optimista, las bajas y costos disminuyen un 30%
        optVals[v.key] = Math.max(v.min, Math.round((v.defaultValue * 0.7) / v.step) * v.step);
        // En pesimista, aumentan un 40%
        pesVals[v.key] = Math.min(v.max, Math.round((v.defaultValue * 1.4) / v.step) * v.step);
      } else {
        // En optimista, los nacimientos, ganancias y precios aumentan un 20%
        optVals[v.key] = Math.min(v.max, Math.round((v.defaultValue * 1.2) / v.step) * v.step);
        // En pesimista, disminuyen un 20%
        pesVals[v.key] = Math.max(v.min, Math.round((v.defaultValue * 0.8) / v.step) * v.step);
      }
    });

    const valorBase = def.calculate(baseVals);
    const valorOpt = def.calculate(optVals);
    const valorPes = def.calculate(pesVals);

    return {
      base: { valores: baseVals, resultado: valorBase },
      optimista: { valores: optVals, resultado: valorOpt },
      pesimista: { valores: pesVals, resultado: valorPes },
    };
  }, [def]);

  const handleApplyEscenario = (tipo: 'BASE' | 'OPTIMISTA' | 'PESIMISTA') => {
    if (!escenarios) return;
    setEscenarioActivo(tipo);
    if (tipo === 'BASE') setValues({ ...escenarios.base.valores });
    if (tipo === 'OPTIMISTA') setValues({ ...escenarios.optimista.valores });
    if (tipo === 'PESIMISTA') setValues({ ...escenarios.pesimista.valores });
  };

  const handleReset = () => {
    if (!def) return;
    const initial: Record<string, number> = {};
    def.variables.forEach((v) => {
      initial[v.key] = v.defaultValue;
    });
    setValues(initial);
    setEscenarioActivo('BASE');
  };

  const handleChange = (key: string, val: number) => {
    setValues((prev) => ({
      ...prev,
      [key]: isNaN(val) ? 0 : val,
    }));
    setEscenarioActivo('CUSTOM');
  };

  // Cálculo del valor simulado
  const calculatedValue = useMemo(() => {
    if (!def) return 0;
    return def.calculate(values);
  }, [def, values]);

  // Cálculos de Margen de Error y Banda de Tolerancia
  const bandaTolerancia = useMemo(() => {
    const errorDelta = Math.abs(metaValor * (margenErrorPct / 100));
    const limiteInferior = metaValor - errorDelta;
    const limiteSuperior = metaValor + errorDelta;

    const desvioAbsoluto = calculatedValue - metaValor;
    const desvioPct = metaValor !== 0 ? (desvioAbsoluto / metaValor) * 100 : 0;

    const estaDentroMargen =
      calculatedValue >= Math.min(limiteInferior, limiteSuperior) &&
      calculatedValue <= Math.max(limiteInferior, limiteSuperior);

    let esFavorable = false;
    if (indicador.sentido === 'MAYOR_MEJOR') {
      esFavorable = calculatedValue >= limiteInferior;
    } else {
      esFavorable = calculatedValue <= limiteSuperior;
    }

    return {
      limiteInferior: Number(limiteInferior.toFixed(2)),
      limiteSuperior: Number(limiteSuperior.toFixed(2)),
      desvioAbsoluto: Number(desvioAbsoluto.toFixed(2)),
      desvioPct: Number(desvioPct.toFixed(1)),
      estaDentroMargen,
      esFavorable,
    };
  }, [metaValor, margenErrorPct, calculatedValue, indicador.sentido]);

  // Estado del Semáforo Técnico
  const status = useMemo((): 'OPTIMO' | 'REVISAR' | 'CRITICO' => {
    if (!def) return 'OPTIMO';
    const val = calculatedValue;
    if (indicador.sentido === 'MAYOR_MEJOR') {
      if (val >= metaValor * 0.95) return 'OPTIMO';
      if (val >= metaValor * 0.85) return 'REVISAR';
      return 'CRITICO';
    } else {
      // MENOR_MEJOR
      if (val <= metaValor * 1.05) return 'OPTIMO';
      if (val <= metaValor * 1.25) return 'REVISAR';
      return 'CRITICO';
    }
  }, [def, calculatedValue, metaValor, indicador.sentido]);

  if (!def) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
        Simulador en desarrollo para este indicador.
      </div>
    );
  }

  const resultText = def.formatResult(calculatedValue);
  const formulaWithValues = def.getFormulaWithValues(values, calculatedValue);

  return (
    <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xl">
      {/* 1. CABECERA EJECUTIVA DEL SIMULADOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider">
                Simulador Dinámico de Escenarios
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">{indicador.abreviatura}</span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Previsión y Metas para &quot;{indicador.nombre}&quot;
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
            title="Restablecer valores de prueba de la UNRC"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Restablecer</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* 2. DEFINICIÓN DE METAS ESTÁNDARES Y MARGEN DE ERROR (TOLERANCIA) */}
      <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Selector de Meta Estándar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Meta Estándar:
            </span>
            <div className="flex items-center space-x-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMetaPreset('INTA');
                  setMetaValor(intaRef);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  metaPreset === 'INTA'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Estándar INTA ({intaRef} {indicador.unidad})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetaPreset('UNRC');
                  setMetaValor(unrcRef);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  metaPreset === 'UNRC'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Meta UNRC ({unrcRef} {indicador.unidad})
              </button>
              <button
                type="button"
                onClick={() => setMetaPreset('CUSTOM')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  metaPreset === 'CUSTOM'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Personalizada
              </button>
            </div>
          </div>

          {/* Input de Meta personalizada si está activa */}
          {metaPreset === 'CUSTOM' && (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">Valor Meta:</span>
              <input
                type="number"
                step="0.5"
                value={metaValor}
                onChange={(e) => setMetaValor(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold"
              />
              <span className="text-[11px] text-slate-400 font-mono">{indicador.unidad}</span>
            </div>
          )}

          {/* Margen de Error / Tolerancia */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-400 shrink-0">
              Margen de Error:
            </span>
            {[3, 5, 10, 15].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMargenErrorPct(m)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  margenErrorPct === m
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ±{m}%
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de Banda de Tolerancia */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 gap-2">
          <span>
            Banda Aceptable: <strong className="text-slate-200 font-mono font-bold">{bandaTolerancia.limiteInferior}</strong> a{' '}
            <strong className="text-slate-200 font-mono font-bold">{bandaTolerancia.limiteSuperior} {indicador.unidad}</strong>
          </span>
          <span
            className={`font-semibold flex items-center gap-1 ${
              bandaTolerancia.estaDentroMargen
                ? 'text-emerald-400'
                : bandaTolerancia.esFavorable
                ? 'text-indigo-400'
                : 'text-rose-400'
            }`}
          >
            {bandaTolerancia.estaDentroMargen ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dentro del margen de tolerancia programado</span>
              </>
            ) : bandaTolerancia.esFavorable ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Superávit favorable (+{Math.abs(bandaTolerancia.desvioPct)}%)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Desvío crítico fuera de margen ({bandaTolerancia.desvioPct}%)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 3. GENERADOR DE ESCENARIOS PREVISIONALES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Escenarios de Previsión Rápida:
          </span>
          <span className="text-[10px] text-slate-400">
            Aplica combinaciones típicas de variables con un solo clic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleApplyEscenario('OPTIMISTA')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              escenarioActivo === 'OPTIMISTA'
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 text-emerald-100'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-400 flex items-center gap-1">
                🌟 Escenario Optimista
              </span>
              <span className="font-mono text-emerald-300 font-black">
                {escenarios ? def.formatResult(escenarios.optimista.resultado) : '-'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Mayor fertilidad/ganancia y mínimas pérdidas sanitarias
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyEscenario('BASE')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              escenarioActivo === 'BASE'
                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 text-indigo-100'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-400 flex items-center gap-1">
                ⚖️ Escenario Base UNRC
              </span>
              <span className="font-mono text-white font-black">
                {escenarios ? def.formatResult(escenarios.base.resultado) : '-'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Rendimientos normales registrados en el campo escuela
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyEscenario('PESIMISTA')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              escenarioActivo === 'PESIMISTA'
                ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40 text-rose-100'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-400 flex items-center gap-1">
                🌧️ Escenario Pesimista
              </span>
              <span className="font-mono text-rose-300 font-black">
                {escenarios ? def.formatResult(escenarios.pesimista.resultado) : '-'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Estrés climático, mortandad elevada o caída de precios
            </p>
          </button>
        </div>
      </div>

      {/* 4. CONTROLES DE VARIABLES INTERACTIVAS */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Ajuste Fino de Variables:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {def.variables.map((variable) => {
            const currentVal = values[variable.key] ?? variable.defaultValue;
            return (
              <div
                key={variable.key}
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-200 truncate pr-2" title={variable.help}>
                    {variable.label}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    [{variable.unit}]
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step={variable.step}
                    min={variable.min}
                    max={variable.max}
                    value={currentVal}
                    onChange={(e) => handleChange(variable.key, parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500 tabular-nums"
                  />
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  {variable.help}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. GRÁFICOS SIMPLES Y FÁCILES DE INTERPRETAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* GRÁFICO 1: BANDA DE META Y POSICIONAMIENTO ACTUAL */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              Posición frente a la Meta & Margen de Error
            </span>
            <span className="font-mono text-[10px] text-indigo-300">
              Meta: {metaValor} ±{margenErrorPct}%
            </span>
          </div>

          {/* Barra visual gráfica */}
          {(() => {
            const minScale = Math.min(bandaTolerancia.limiteInferior * 0.8, calculatedValue * 0.8, 0);
            const maxScale = Math.max(bandaTolerancia.limiteSuperior * 1.25, calculatedValue * 1.25, metaValor * 1.2, 1);
            const range = maxScale - minScale || 1;

            const calcPct = Math.min(100, Math.max(0, ((calculatedValue - minScale) / range) * 100));
            const metaPct = Math.min(100, Math.max(0, ((metaValor - minScale) / range) * 100));
            const tolMinPct = Math.min(100, Math.max(0, ((bandaTolerancia.limiteInferior - minScale) / range) * 100));
            const tolMaxPct = Math.min(100, Math.max(0, ((bandaTolerancia.limiteSuperior - minScale) / range) * 100));
            const tolWidth = Math.max(2, tolMaxPct - tolMinPct);

            return (
              <div className="space-y-2 py-1">
                <div className="relative w-full h-8 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center">
                  {/* Zona de Tolerancia (Verde sombreada) */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/50"
                    style={{ left: `${tolMinPct}%`, width: `${tolWidth}%` }}
                    title={`Banda aceptable: ${bandaTolerancia.limiteInferior} a ${bandaTolerancia.limiteSuperior}`}
                  />

                  {/* Línea de Meta Estándar */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10"
                    style={{ left: `${metaPct}%` }}
                    title={`Meta Estándar: ${metaValor}`}
                  />

                  {/* Cursor de Valor Simulado Actual */}
                  <div
                    className="absolute z-20 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${calcPct}%` }}
                  >
                    <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-md animate-pulse" />
                  </div>
                </div>

                {/* Leyenda de la barra */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Mín: {Math.round(minScale)}</span>
                  <span className="text-amber-400 font-bold">Meta: {metaValor}</span>
                  <span className="text-indigo-400 font-bold">Simulado: {resultText}</span>
                  <span>Máx: {Math.round(maxScale)}</span>
                </div>
              </div>
            );
          })()}

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Desvío calculado:</span>
            <span
              className={`font-mono font-bold ${
                bandaTolerancia.desvioPct >= 0
                  ? indicador.sentido === 'MAYOR_MEJOR'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                  : indicador.sentido === 'MAYOR_MEJOR'
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {bandaTolerancia.desvioPct >= 0 ? `+${bandaTolerancia.desvioPct}%` : `${bandaTolerancia.desvioPct}%`}{' '}
              respecto a la meta
            </span>
          </div>
        </div>

        {/* GRÁFICO 2: COMPARATIVA DE ESCENARIOS PREVISIONALES */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Comparativa de Escenarios
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Fácil lectura</span>
          </div>

          {escenarios && (() => {
            const itemsGrafico = [
              { label: 'Pesimista', valor: escenarios.pesimista.resultado, color: 'bg-rose-500' },
              { label: 'Base UNRC', valor: escenarios.base.resultado, color: 'bg-slate-500' },
              { label: 'Optimista', valor: escenarios.optimista.resultado, color: 'bg-emerald-500' },
              { label: 'Tu Simulación', valor: calculatedValue, color: 'bg-indigo-500' },
            ];

            const maxVal = Math.max(...itemsGrafico.map((i) => i.valor), metaValor, 1);

            return (
              <div className="space-y-2 pt-1">
                {itemsGrafico.map((item, idx) => {
                  const barWidth = Math.min(100, Math.max(8, (item.valor / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium">{item.label}</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {def.formatResult(item.valor)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-300`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 6. RESULTADO FINAL Y DIAGNÓSTICO PRESCRIPTIVO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Resultado Numérico y Sustitución */}
        <div className="md:col-span-2 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between space-y-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Sustitución en la Fórmula Formal:
            </span>
            <div className="font-mono text-xs text-indigo-300 font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 mt-1 overflow-x-auto select-all">
              {formulaWithValues}
            </div>
          </div>

          <div className="flex items-baseline space-x-2 pt-1">
            <span className="text-xs text-slate-400 font-medium">Resultado Simulado:</span>
            <span className="text-2xl font-black font-mono text-white tracking-tight tabular-nums">
              {resultText}
            </span>
            <span className="text-xs text-slate-400">({indicador.unidad})</span>
          </div>
        </div>

        {/* Diagnóstico del Semáforo y Decisión */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            status === 'OPTIMO'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : status === 'REVISAR'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 font-bold text-xs">
              {status === 'OPTIMO' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {status === 'REVISAR' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {status === 'CRITICO' && <AlertOctagon className="w-4 h-4 text-rose-400" />}
              <span>
                {status === 'OPTIMO'
                  ? 'Semáforo: Óptimo'
                  : status === 'REVISAR'
                  ? 'Semáforo: A Revisar'
                  : 'Semáforo: Crítico'}
              </span>
            </div>
            <div className="text-[11px] font-mono mt-1 opacity-90">
              Rango meta: {indicador.rangoOptimoTexto}
            </div>
          </div>

          <div className="text-[11px] mt-2 pt-2 border-t border-white/10 leading-snug">
            {status === 'OPTIMO' && (
              <span className="text-emerald-300">
                ✓ El valor simulado cumple con los estándares zootécnicos y económicos recomendados para el predio UNRC.
              </span>
            )}
            {status === 'REVISAR' && (
              <span className="text-amber-300">
                ⚠ {indicador.accionesRecomendadas.enAmarillo}
              </span>
            )}
            {status === 'CRITICO' && (
              <span className="text-rose-300 font-semibold">
                🚨 {indicador.accionesRecomendadas.enRojo}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

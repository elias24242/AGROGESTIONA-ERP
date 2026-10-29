import React, { useState, useMemo, useEffect } from 'react';
import { DatabaseState } from '../services/sheetsService';
import { MonedaTipo, convertirArsAUsd } from '../services/currencyService';
import {
  generarMatrizDecisionesPrescriptivas,
  generarExplicacionesEvolucionIndicadores,
  calcularResumenSaludCMI,
  generarAnalisisBenchmarking,
  DecisionPrescriptiva,
  ExplicacionEvolucionIndicador,
  NivelUrgenciaDecision,
  TipoReferenciaBenchmark,
  ItemBenchmark,
  EjeRadarBenchmark,
  AnalisisBenchmarkingResult,
  BENCHMARKS_REGIONALES_INTA,
  PROMEDIOS_HISTORICOS_UNRC,
} from '../services/businessAnalyticsService';
import {
  PerspectivaIndicador,
  PERSPECTIVAS_CMI_INFO,
  INDICADORES_MANUAL_DATA,
  FichaIndicador,
} from '../data/indicadoresManualData';
import {
  ESTANDARES_INDICADORES_MASTER,
  EstandarIndicador,
} from '../data/estandaresIndicadoresData';

import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders,
  DollarSign,
  Layers,
  Users,
  GraduationCap,
  Sparkles,
  Compass,
  ChevronRight,
  HelpCircle,
  ShieldAlert,
  BarChart2,
  Info,
  Calendar,
  Target,
  Scale,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface BusinessAnalyticsModuleProps {
  state: DatabaseState;
  selectedSubunidad: string;
  selectedCampania: string;
  selectedEspecie?: string;
  isTestMode: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES', indicadorId?: string) => void;
  monedaVisualizacion?: MonedaTipo;
  tipoCambioOficial?: number;
  isLightMode?: boolean;
}

export const BusinessAnalyticsModule: React.FC<BusinessAnalyticsModuleProps> = ({
  state,
  selectedSubunidad,
  selectedCampania,
  selectedEspecie = 'TODOS',
  isTestMode,
  onNavigateTab,
  onOpenManual,
  monedaVisualizacion = 'ARS',
  tipoCambioOficial = 1000,
  isLightMode = false,
}) => {
  const hoy = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    let y = hoy.getFullYear();
    if (state.movimientos && state.movimientos.length > 0) {
      const anios = state.movimientos.map((m) => new Date(m.fecha).getFullYear()).filter((n) => !isNaN(n));
      if (anios.length > 0) y = Math.max(...anios, y);
    }
    return y;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => hoy.getMonth());

  // Pestañas internas de navegación analítica
  const [activeSubTab, setActiveSubTab] = useState<'decisiones' | 'benchmarking' | 'mapa_cruzado' | 'explicaciones'>('decisiones');

  // Estado para la ficha y gráfico de evolución temporal de indicadores
  const [indicadorSeleccionadoId, setIndicadorSeleccionadoId] = useState<string>('margen_bruto_ha');

  // Filtros de decisiones
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('TODAS');
  const [filtroPerspectiva, setFiltroPerspectiva] = useState<string>('TODAS');

  // Configuración de Benchmarking & Metas Regionales
  const [benchmarkRefMode, setBenchmarkRefMode] = useState<TipoReferenciaBenchmark>('INTA_REGIONAL');
  const [filtroPerspectivaBenchmark, setFiltroPerspectivaBenchmark] = useState<string>('TODAS');
  const [hoveredEjeId, setHoveredEjeId] = useState<string | null>(null);

  // Filtro de especie para la matriz de 3 niveles de estándares
  const [filtroEspecieEstandares, setFiltroEspecieEstandares] = useState<string>(() => selectedEspecie || 'TODOS');

  useEffect(() => {
    if (selectedEspecie) {
      setFiltroEspecieEstandares(selectedEspecie);
    }
  }, [selectedEspecie]);

  // Lista de tríadas de estándares: Real vs Pozo del Carril vs INTA
  const triadasEstandares = useMemo(() => {
    const itemsDef: Array<{
      id_indicador: string;
      indicador_nombre: string;
      id_especie: 'ESP001' | 'ESP002' | 'ESP003' | 'TODOS';
      especie_nombre: string;
      icono_especie: string;
      unidad: string;
      valorReal: number | string;
    }> = [
      // OVINOS
      {
        id_indicador: 'tasa_mortalidad_general',
        indicador_nombre: 'Mortalidad General de Majada',
        id_especie: 'ESP001',
        especie_nombre: 'Ovinos',
        icono_especie: '🐑',
        unidad: '%',
        valorReal: 3.2,
      },
      {
        id_indicador: 'supervivencia_corderos',
        indicador_nombre: 'Supervivencia de Corderos al Destete',
        id_especie: 'ESP001',
        especie_nombre: 'Ovinos',
        icono_especie: '🐑',
        unidad: '%',
        valorReal: 84.5,
      },
      {
        id_indicador: 'rendimiento_res',
        indicador_nombre: 'Rendimiento al Gancho (Res Ovina)',
        id_especie: 'ESP001',
        especie_nombre: 'Ovinos',
        icono_especie: '🐑',
        unidad: '%',
        valorReal: 51.2,
      },
      {
        id_indicador: 'margen_bruto_ha',
        indicador_nombre: 'Margen Bruto Ovino por Hectárea',
        id_especie: 'ESP001',
        especie_nombre: 'Ovinos',
        icono_especie: '🐑',
        unidad: '$/ha',
        valorReal: 46850,
      },
      // BOVINOS
      {
        id_indicador: 'porc_destete_bovino',
        indicador_nombre: 'Porcentaje de Destete Bovino',
        id_especie: 'ESP002',
        especie_nombre: 'Bovinos',
        icono_especie: '🐄',
        unidad: '%',
        valorReal: 77.4,
      },
      {
        id_indicador: 'ganancia_diaria_peso_bov',
        indicador_nombre: 'Ganancia Diaria de Peso Bovina (ADPV)',
        id_especie: 'ESP002',
        especie_nombre: 'Bovinos',
        icono_especie: '🐄',
        unidad: 'kg/día',
        valorReal: 0.810,
      },
      {
        id_indicador: 'margen_bruto_ha',
        indicador_nombre: 'Margen Bruto Bovino por Hectárea',
        id_especie: 'ESP002',
        especie_nombre: 'Bovinos',
        icono_especie: '🐄',
        unidad: '$/ha',
        valorReal: 64200,
      },
      // PORCINOS
      {
        id_indicador: 'lechones_destetados_parto',
        indicador_nombre: 'Lechones Destetados por Parto',
        id_especie: 'ESP003',
        especie_nombre: 'Porcinos',
        icono_especie: '🐖',
        unidad: 'lechones/parto',
        valorReal: 10.2,
      },
      {
        id_indicador: 'conversion_alimenticia_porc',
        indicador_nombre: 'Conversión Alimenticia Porcina',
        id_especie: 'ESP003',
        especie_nombre: 'Porcinos',
        icono_especie: '🐖',
        unidad: 'kg/kg',
        valorReal: 2.82,
      },
      {
        id_indicador: 'mortalidad_engorde_porc',
        indicador_nombre: 'Mortalidad en Engorde Porcino',
        id_especie: 'ESP003',
        especie_nombre: 'Porcinos',
        icono_especie: '🐖',
        unidad: '%',
        valorReal: 2.3,
      },
    ];

    return itemsDef.map((defItem) => {
      const estandarPozoCarril =
        ESTANDARES_INDICADORES_MASTER.find(
          (e) =>
            e.id_indicador === defItem.id_indicador &&
            e.id_especie === defItem.id_especie &&
            e.tipo_estandar === 'POZO_CARRIL'
        ) || null;

      const estandarInta =
        ESTANDARES_INDICADORES_MASTER.find(
          (e) =>
            e.id_indicador === defItem.id_indicador &&
            e.id_especie === defItem.id_especie &&
            e.tipo_estandar === 'INTA'
        ) || null;

      let desvioIntaPct: number | null = null;
      if (
        estandarInta &&
        estandarInta.valor !== null &&
        typeof defItem.valorReal === 'number' &&
        estandarInta.estado_definicion === 'HOMOLOGADO'
      ) {
        desvioIntaPct = Number(
          (((defItem.valorReal - estandarInta.valor) / estandarInta.valor) * 100).toFixed(1)
        );
      }

      return {
        ...defItem,
        estandarPozoCarril,
        estandarInta,
        desvioIntaPct,
      };
    });
  }, []);

  const triadasFiltradas = useMemo(() => {
    if (filtroEspecieEstandares === 'TODOS') return triadasEstandares;
    return triadasEstandares.filter((t) => t.id_especie === filtroEspecieEstandares);
  }, [triadasEstandares, filtroEspecieEstandares]);

  // Estados del Simulador de Escenarios & Metas
  const [filtroPerspSimulador, setFiltroPerspSimulador] = useState<string>('TODAS');
  const [indicadorSimuladorId, setIndicadorSimuladorId] = useState<string>('tasa_mortalidad');

  // Estado para sliders interactivos de simulación de decisiones (almacena el valor actual ajustado por cada id)
  const [simulacionesValores, setSimulacionesValores] = useState<Record<string, number>>({});

  // Indicador activo para el simulador de escenarios
  const indicadorSimuladorActivo = useMemo(() => {
    return (
      INDICADORES_MANUAL_DATA.find((ind) => ind.id === indicadorSimuladorId) ||
      INDICADORES_MANUAL_DATA[0]
    );
  }, [indicadorSimuladorId]);

  // Años disponibles
  const availableYears = useMemo(() => {
    const s = new Set<number>([2024, 2025, 2026, 2027, hoy.getFullYear()]);
    state.campanias.forEach((c) => {
      if (c.anio_inicio) s.add(c.anio_inicio);
      if (c.anio_fin) s.add(c.anio_fin);
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [state.campanias, hoy]);

  // Sincronizar automáticamente el año analítico al cambiar de campaña en el header
  useEffect(() => {
    const c = state.campanias.find((camp) => camp.id_campania === selectedCampania);
    if (c && c.anio_inicio) {
      setSelectedYear(c.anio_inicio);
    }
  }, [selectedCampania, state.campanias]);

  const isConsolidado = selectedSubunidad === 'TODOS' || selectedSubunidad === 'todas' || !selectedSubunidad;

  // Filtrar estado para que la selección de subunidad en el header afecte directamente el análisis
  const stateFiltrado = useMemo(() => {
    if (isConsolidado) return state;
    return {
      ...state,
      inventario: (state.inventario || []).filter((i) => i.id_subunidad === selectedSubunidad),
      movimientos: (state.movimientos || []).filter(
        (m) => m.id_subunidad_origen === selectedSubunidad || m.id_subunidad_destino === selectedSubunidad
      ),
      sanidad: (state.sanidad || []).filter((s) => s.id_subunidad === selectedSubunidad),
      pesajes: (state.pesajes || []).filter((p) => p.id_subunidad === selectedSubunidad),
      lotes: (state.lotes || []).filter((l) => l.id_subunidad === selectedSubunidad),
      consumos: (state.consumos || []).filter((c) => c.id_subunidad === selectedSubunidad),
    };
  }, [state, selectedSubunidad, isConsolidado]);

  // Datos analíticos computados
  const resumenSalud = useMemo(() => {
    return calcularResumenSaludCMI(stateFiltrado, selectedYear, selectedMonth, tipoCambioOficial);
  }, [stateFiltrado, selectedYear, selectedMonth, tipoCambioOficial]);

  const decisiones = useMemo(() => {
    return generarMatrizDecisionesPrescriptivas(stateFiltrado, selectedYear, selectedMonth, undefined, tipoCambioOficial);
  }, [stateFiltrado, selectedYear, selectedMonth, tipoCambioOficial]);

  const explicaciones = useMemo(() => {
    return generarExplicacionesEvolucionIndicadores(stateFiltrado, selectedYear, selectedMonth, tipoCambioOficial);
  }, [stateFiltrado, selectedYear, selectedMonth, tipoCambioOficial]);

  const indicadorActivo = useMemo(() => {
    return (
      explicaciones.find((e) => e.id === indicadorSeleccionadoId) ||
      explicaciones[0] ||
      null
    );
  }, [explicaciones, indicadorSeleccionadoId]);

  const analisisBenchmarking = useMemo(() => {
    return generarAnalisisBenchmarking(stateFiltrado, selectedYear, selectedMonth, benchmarkRefMode, tipoCambioOficial);
  }, [stateFiltrado, selectedYear, selectedMonth, benchmarkRefMode, tipoCambioOficial]);

  const itemsBenchmarkFiltrados = useMemo(() => {
    if (filtroPerspectivaBenchmark === 'TODAS') return analisisBenchmarking.items;
    return analisisBenchmarking.items.filter((item) => item.perspectiva === filtroPerspectivaBenchmark);
  }, [analisisBenchmarking, filtroPerspectivaBenchmark]);

  // Filtrado de decisiones
  const decisionesFiltradas = useMemo(() => {
    return decisiones.filter((d) => {
      const matchUrgencia = filtroUrgencia === 'TODAS' || d.urgencia === filtroUrgencia;
      const matchPersp = filtroPerspectiva === 'TODAS' || d.perspectiva === filtroPerspectiva;
      return matchUrgencia && matchPersp;
    });
  }, [decisiones, filtroUrgencia, filtroPerspectiva]);

  // Manejo de cambio de valor en simuladores
  const handleUpdateSimulacion = (decisionId: string, val: number) => {
    setSimulacionesValores((prev) => ({
      ...prev,
      [decisionId]: val,
    }));
  };

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO EJECUTIVO & CONTROLES TEMPORALES                            */}
      {/* ========================================================================= */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#a2c7b5]">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Centro de Inteligencia Ganadera</span>
              <span>·</span>
              <span className="font-semibold text-slate-700 dark:text-[#e5f4ed]">
                {selectedSubunidad === 'TODOS'
                  ? 'Consolidado General'
                  : state.subunidades.find((s) => s.id_subunidad === selectedSubunidad)?.nombre || selectedSubunidad}
              </span>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedCampania}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-[#f2fcf6] mt-1">
              Centro de Inteligencia Ganadera
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#a2c7b5] mt-0.5 max-w-2xl">
              Resultados, rentabilidad y decisiones: diagnóstico causal, análisis de brechas e inteligencia agropecuaria.
            </p>
          </div>

          {/* Selector de Mes y Año */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              <select
                aria-label="Seleccionar mes de análisis"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-semibold px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 border-none focus:outline-none cursor-pointer"
              >
                {mesesNombres.map((m, idx) => (
                  <option key={m} value={idx} className="bg-slate-800 text-white">
                    {m}
                  </option>
                ))}
              </select>

              <select
                aria-label="Seleccionar año de análisis"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold font-mono px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 border-none focus:outline-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-slate-800 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual('INDICADORES')}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual de Fichas</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumen Visual e Intuitivo de Salud del Campo (Cuadro de Mando Integral Simplificado) */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>📊</span>
                <span>¿Cómo está la salud general de tu campo? (Semáforo de Gestión)</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                {resumenSalud.scoreGlobal}% Salud General
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-[#a2c7b5] hidden sm:inline">
              Sin definiciones complejas • Lectura rápida en 4 preguntas clave
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Perspectiva Financiera */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">💰</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    resumenSalud.resumenPorPerspectiva.FINANCIERA.score >= 70
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {resumenSalud.resumenPorPerspectiva.FINANCIERA.score >= 70 ? 'Positivo' : 'Atención'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                  ¿Gana o pierde dinero el campo?
                </h4>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {resumenSalud.resumenPorPerspectiva.FINANCIERA.score}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">salud de caja</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#a2c7b5] mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 leading-relaxed">
                {resumenSalud.resumenPorPerspectiva.FINANCIERA.score >= 70
                  ? 'Las ventas de hacienda y lana cubren holgadamente los costos del período.'
                  : 'Se recomienda controlar gastos directos de alimentación y comercialización.'}
              </p>
            </div>

            {/* 2. Perspectiva Productiva / Procesos */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">🌾</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    resumenSalud.resumenPorPerspectiva.PROCESOS.score >= 70
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {resumenSalud.resumenPorPerspectiva.PROCESOS.score >= 70 ? 'Rendidor' : 'Ajustar'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                  ¿La tierra y pasturas rinden bien?
                </h4>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {resumenSalud.resumenPorPerspectiva.PROCESOS.score}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">eficiencia pasto</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#a2c7b5] mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 leading-relaxed">
                {resumenSalud.resumenPorPerspectiva.PROCESOS.score >= 70
                  ? 'Rotación de piquetes y carga animal ajustadas a la receptividad de pasturas.'
                  : 'Revisar disponibilidad forrajera en lotes para evitar sobrepastoreo.'}
              </p>
            </div>

            {/* 3. Perspectiva del Rodeo / Clientes */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">🐑</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    resumenSalud.resumenPorPerspectiva.CLIENTES.score >= 70
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {resumenSalud.resumenPorPerspectiva.CLIENTES.score >= 70 ? 'Sanos' : 'Seguimiento'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                  ¿Los animales están sanos y crecen?
                </h4>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {resumenSalud.resumenPorPerspectiva.CLIENTES.score}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">estado rodeo</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#a2c7b5] mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 leading-relaxed">
                {resumenSalud.resumenPorPerspectiva.CLIENTES.score >= 70
                  ? 'Buena ganancia de peso diaria, baja mortandad (<4%) y sanidad al día.'
                  : 'Se aconseja reforzar dosificación antiparasitaria y control de pesos.'}
              </p>
            </div>

            {/* 4. Perspectiva Futuro / Aprendizaje */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">📈</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    resumenSalud.resumenPorPerspectiva.APRENDIZAJE.score >= 70
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {resumenSalud.resumenPorPerspectiva.APRENDIZAJE.score >= 70 ? 'Creciendo' : 'Capacitar'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                  ¿El campo está listo para el futuro?
                </h4>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {resumenSalud.resumenPorPerspectiva.APRENDIZAJE.score}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">sostenibilidad</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#a2c7b5] mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 leading-relaxed">
                {resumenSalud.resumenPorPerspectiva.APRENDIZAJE.score >= 70
                  ? 'Registros al 100%, trazabilidad individualizada y buena reposición de madres.'
                  : 'Fomentar la carga periódica de pesajes para mejorar la precisión de índices.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PESTAÑAS DE VISTA ANALÍTICA (Segmented Control)                         */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 w-full max-w-5xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('decisiones')}
          className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'decisiones'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Decisiones Prescriptivas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            activeSubTab === 'decisiones' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white'
          }`}>
            {decisiones.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('explicaciones')}
          className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'explicaciones'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Evolución Histórica</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            activeSubTab === 'explicaciones' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white'
          }`}>
            {explicaciones.length}
          </span>
        </button>


        <button
          type="button"
          onClick={() => setActiveSubTab('benchmarking')}
          className={`flex-1 min-w-[180px] py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'benchmarking'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Benchmarking Zonal</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeSubTab === 'benchmarking' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white'
          }`}>
            INTA · UNRC
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mapa_cruzado')}
          className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'mapa_cruzado'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Impacto Cruzado CMI</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISTA A: MATRIZ DE DECISIONES PRESCRIPTIVAS & SIMULACIÓN               */}
      {/* ========================================================================= */}
      {activeSubTab === 'decisiones' && (
        <div className="space-y-4">
          {/* Filtros de la Matriz de Decisiones */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Urgencia:
              </span>
              {(['TODAS', 'URGENTE', 'PRIORITARIO', 'PREVENTIVO', 'OPORTUNIDAD'] as const).map((urg) => (
                <button
                  key={urg}
                  type="button"
                  onClick={() => setFiltroUrgencia(urg)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filtroUrgencia === urg
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {urg === 'TODAS' ? 'Todas' : urg}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Perspectiva:
              </span>
              {[
                { id: 'TODAS', label: 'Todas' },
                { id: 'APRENDIZAJE', label: 'Desarrollo' },
                { id: 'PROCESOS', label: 'Procesos' },
                { id: 'FINANCIERA', label: 'Financiera' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFiltroPerspectiva(p.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filtroPerspectiva === p.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Tarjetas de Decisión Prescriptiva */}
          <div className="space-y-4">
            {decisionesFiltradas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No se registran decisiones pendientes con los filtros seleccionados
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Todos los indicadores bajo este criterio se encuentran dentro de los márgenes óptimos de tolerancia.
                </p>
              </div>
            ) : (
              decisionesFiltradas.map((dec) => {
                const valorSimuladoActual =
                  simulacionesValores[dec.id] !== undefined
                    ? simulacionesValores[dec.id]
                    : dec.simulacion.valorBase;

                const impactoSimulado = dec.simulacion.calcularImpacto(valorSimuladoActual);

                return (
                  <div
                    key={dec.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isLightMode
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-slate-900/95 border-slate-800 hover:border-slate-700 shadow-lg'
                    }`}
                  >
                    {/* Encabezado de la Tarjeta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span
                            className={`font-bold uppercase px-1.5 py-0.5 rounded ${
                              dec.urgencia === 'URGENTE'
                                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                                : dec.urgencia === 'PRIORITARIO'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                                : 'bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                            }`}
                          >
                            Prioridad: {dec.urgencia}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-indigo-700 dark:text-indigo-400 font-semibold">{dec.perspectiva}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 dark:text-slate-400 font-mono">
                            Actual: <strong className="text-slate-900 dark:text-white font-bold">{dec.valorActual} {dec.unidad}</strong> (Meta: ≥ {dec.metaOptima} {dec.unidad})
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                          {dec.titulo}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                            dec.estadoSemaforo === 'CRITICO'
                              ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20'
                              : dec.estadoSemaforo === 'REVISAR'
                              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
                              : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
                          }`}
                        >
                          Semáforo: {dec.estadoSemaforo}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo: Diagnóstico de Causa Raíz e Impacto Cruzado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      {/* Causa Raíz */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1">
                          Diagnóstico de Causa Raíz (¿Por qué ocurre?):
                        </span>
                        <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                          {dec.diagnosticoCausaRaiz}
                        </p>
                      </div>

                      {/* Impacto Cruzado en otras perspectivas */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1">
                          Impacto Cruzado en el Sistema CMI:
                        </span>
                        <div className="space-y-1.5 mt-1">
                          {dec.impactosCruzados.map((imp, idx) => (
                            <div key={idx} className="text-xs flex items-start space-x-1.5">
                              <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-slate-800 dark:text-slate-300">
                                <strong className="text-slate-900 dark:text-white font-bold">{imp.nombrePerspectiva}:</strong> {imp.descripcion}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Plan de Acción Prescriptivo */}
                    <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                          <Compass className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                          <span>Plan de Acción Directivo:</span>
                        </span>
                        <span className="text-slate-700 dark:text-slate-400 font-mono text-[11px]">
                          Responsable: <strong className="text-indigo-950 dark:text-indigo-300 font-bold">{dec.planDeAccion.responsable}</strong> · Plazo: <strong className="text-slate-900 dark:text-white font-bold">{dec.planDeAccion.plazoTexto}</strong>
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-800 dark:text-slate-300 pl-4 list-disc font-medium">
                        {dec.planDeAccion.acciones.map((acc, aIdx) => (
                          <li key={aIdx}>{acc}</li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-indigo-200 dark:border-indigo-500/20 flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-slate-800 dark:text-slate-300 font-medium">
                          <strong className="text-emerald-800 dark:text-emerald-400 font-bold">Retorno Zootécnico:</strong> {dec.retornoEstimado.zootecnico}
                        </span>
                        <span className="font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                          Impacto Estimado: +${dec.retornoEstimado.economicoArs.toLocaleString('es-AR')} ARS
                          {monedaVisualizacion === 'USD' && ` (US$ ${dec.retornoEstimado.economicoUsd})`}
                        </span>
                      </div>
                    </div>

                    {/* Simulador Interactivo de Impacto de la Decisión ("What-If") */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Simular Adopción de la Decisión en Tiempo Real</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-700 dark:text-slate-400">
                          Ajuste: <strong className="text-indigo-800 dark:text-indigo-400 font-bold">{valorSimuladoActual} {dec.simulacion.unidad}</strong>
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex-1">
                          <input
                            aria-label={dec.simulacion.etiquetaVariable}
                            type="range"
                            min={dec.simulacion.rangoMin}
                            max={dec.simulacion.rangoMax}
                            step={dec.simulacion.paso}
                            value={valorSimuladoActual}
                            onChange={(e) => handleUpdateSimulacion(dec.id, parseFloat(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1 font-semibold">
                            <span>{dec.simulacion.rangoMin} {dec.simulacion.unidad}</span>
                            <span>{dec.simulacion.etiquetaVariable}</span>
                            <span>{dec.simulacion.rangoMax} {dec.simulacion.unidad}</span>
                          </div>
                        </div>

                        {/* Resultado Proyectado en Vivo */}
                        <div className="sm:w-64 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-xs shrink-0">
                          <span className="text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-400 block">
                            Proyección Simulada:
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {impactoSimulado.kpiProyectadoTexto}
                          </span>
                          <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                            Beneficio: +${impactoSimulado.beneficioArs.toLocaleString('es-AR')} ARS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VISTA B: EXPLICACIONES DETALLADAS & EVOLUCIÓN HISTÓRICA                */}
      {/* ========================================================================= */}
      {activeSubTab === 'explicaciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Selector Lateral de Indicador */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Seleccionar Indicador CMI ({explicaciones.length})
            </h3>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {explicaciones.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setIndicadorSeleccionadoId(exp.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    indicadorSeleccionadoId === exp.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : isLightMode
                      ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={indicadorSeleccionadoId === exp.id ? 'text-indigo-200' : 'text-slate-400'}>
                      {exp.perspectiva}
                    </span>
                    <span
                      className={`font-bold ${
                        exp.estadoSemaforo === 'CRITICO'
                          ? 'text-rose-400'
                          : exp.estadoSemaforo === 'REVISAR'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {exp.valorActual} {exp.unidad}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold truncate mt-0.5">{exp.nombre}</h4>
                </button>
              ))}
            </div>
          </div>

          {/* Ficha Explicativa & Gráfico de Evolución Temporal */}
          <div className="lg:col-span-8">
            {indicadorActivo && (
              <div
                className={`p-6 rounded-2xl border space-y-5 ${
                  isLightMode
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-900/95 border-slate-800 shadow-xl'
                }`}
              >
                {/* Cabecera del Indicador */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-indigo-400">{indicadorActivo.perspectiva}</span>
                      <span>·</span>
                      <span>Meta: {indicadorActivo.metaOptimaTexto}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                      {indicadorActivo.nombre}
                    </h2>
                  </div>

                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                      {indicadorActivo.valorActual}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{indicadorActivo.unidad}</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                        indicadorActivo.variacionPct >= 0
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {indicadorActivo.variacionPct >= 0 ? '+' : ''}
                      {indicadorActivo.variacionPct}% vs mes previo
                    </span>
                  </div>
                </div>

                {/* Gráfico Visual de Evolución de los últimos 6 meses */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Evolución Histórica de los Últimos 6 Meses</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Tendencia: <strong className="text-white">{indicadorActivo.tendencia}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2 pt-3">
                    {indicadorActivo.historico6Meses.map((p, pIdx) => {
                      const maxVal = Math.max(
                        ...indicadorActivo.historico6Meses.map((item) => item.valor),
                        1
                      );
                      const barHeightPct = Math.max(15, Math.round((p.valor / maxVal) * 100));
                      const isCurrent = pIdx === indicadorActivo.historico6Meses.length - 1;

                      return (
                        <div key={p.mesLabel} className="flex flex-col items-center space-y-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.valor}
                          </span>
                          <div className="w-full bg-slate-800/80 h-24 rounded-lg flex items-end p-1">
                            <div
                              className={`w-full rounded-md transition-all duration-500 ${
                                isCurrent
                                  ? 'bg-indigo-500 shadow-sm'
                                  : 'bg-slate-600 hover:bg-slate-500'
                              }`}
                              style={{ height: `${barHeightPct}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-mono ${
                              isCurrent ? 'font-bold text-indigo-400' : 'text-slate-500'
                            }`}
                          >
                            {p.mesLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explicación del Valor Actual */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Explicación Técnica del Valor Actual:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {indicadorActivo.explicacionValor}
                  </p>
                </div>

                {/* Explicación de la Evolución Temporal */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Factores Determinantes de la Trayectoria:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {indicadorActivo.explicacionEvolucion}
                  </p>
                </div>

                {/* Factores Clave */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Variables y Factores Operativos del Establecimiento:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {indicadorActivo.factoresClave.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Decisión Prescriptiva Recomendada */}
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start space-x-3">
                  <Compass className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400 block tracking-wider">
                      Recomendación Estratégica:
                    </span>
                    <p className="text-xs sm:text-sm text-indigo-200 font-medium mt-0.5">
                      {indicadorActivo.decisionRecomendada}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VISTA C: MAPA DE IMPACTO CRUZADO (Norton & Kaplan CMI)                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'mapa_cruzado' && (
        <div
          className={`p-6 rounded-2xl border space-y-6 ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
              <Compass className="w-4 h-4" />
              <span>Metodología Balanced Scorecard (Norton & Kaplan)</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Mapa de Causalidad e Impacto Cruzado en la Majada
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Cómo las capacidades humanas y el entrenamiento técnico impulsan la excelencia operativa, satisfacen al mercado y maximizan la rentabilidad económica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Base: Aprendizaje y Desarrollo */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">1. Aprendizaje & Desarrollo</span>
              </div>
              <p className="text-xs text-purple-200 italic font-semibold">
                «¿Qué capacidades necesitamos fortalecer?»
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>· Horas de capacitación de operarios y prácticas UNRC.</p>
                <p>· Cumplimiento de Procedimientos Operativos (POEs).</p>
                <p>· Destreza técnica en pesajes y Famacha.</p>
              </div>
              <div className="pt-2 border-t border-purple-500/20 text-[11px] text-purple-300 font-mono">
                Impulsa la precisión en manga ↓
              </div>
            </div>

            {/* 2. Procesos Internos */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">2. Procesos Internos</span>
              </div>
              <p className="text-xs text-emerald-200 italic font-semibold">
                «¿En qué procesos debemos ser excelentes?»
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>· Control de mortalidad (&lt; 2%).</p>
                <p>· Cobertura de pesajes y ganancia de peso (GDP &gt; 180 g/d).</p>
                <p>· Eficiencia en plan sanitario y rotación de pasturas.</p>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
                Genera corderos homogéneos ↓
              </div>
            </div>

            {/* 3. Clientes / Mercado */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400">
                <Users className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">3. Clientes & Mercado</span>
              </div>
              <p className="text-xs text-blue-200 italic font-semibold">
                «¿Cómo debemos aparecer ante los clientes?»
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>· Calidad uniforme de canal y genética ovina.</p>
                <p>· Precio medio obtenido por cabeza comercializada.</p>
                <p>· Efectividad en cobranzas de ventas devengadas.</p>
              </div>
              <div className="pt-2 border-t border-blue-500/20 text-[11px] text-blue-300 font-mono">
                Convierte volumen en ingresos ↓
              </div>
            </div>

            {/* 4. Cúpula: Financiera */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">4. Perspectiva Financiera</span>
              </div>
              <p className="text-xs text-indigo-200 italic font-semibold">
                «¿Cómo tener éxito financiero sostenido?»
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>· Margen bruto mensual positivo.</p>
                <p>· Control riguroso de costos directos de alimentación.</p>
                <p>· Flujo de caja neto operativo solvente.</p>
              </div>
              <div className="pt-2 border-t border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
                Sustenta nuevas inversiones en el campo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VISTA D: BENCHMARKING & METAS REGIONALES (INTA & HISTÓRICO UNRC)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'benchmarking' && (
        <div className="space-y-6">
          {/* Header de Benchmarking y Selector de Referencias */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                    <Target className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      Benchmarking Regional & Metas Zonales
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                        Cuenca Córdoba Centro-Sur
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Contraste multidimensional de productividad ovina, sanidad, aprendizaje y economía frente a estándares zonales INTA y la serie histórica del campo escuela UNRC.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Referencia Activa */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => setBenchmarkRefMode('INTA_REGIONAL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                    benchmarkRefMode === 'INTA_REGIONAL'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Estándar INTA</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/10">Zonal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBenchmarkRefMode('HISTORICO_UNRC')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                    benchmarkRefMode === 'HISTORICO_UNRC'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Histórico UNRC</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/20">Campo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBenchmarkRefMode('SUPERPUESTO')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                    benchmarkRefMode === 'SUPERPUESTO'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Superpuesto (Ambos)</span>
                </button>
              </div>
            </div>

            {/* Metadatos de Referencia Activa */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Línea de Base:
              </span>
              {benchmarkRefMode === 'INTA_REGIONAL' && (
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  Estándares Agroecológicos INTA Manfredi / Marcos Juárez para ovinos en pasturas templadas (Cuenca Centro-Sur de Córdoba).
                </span>
              )}
              {benchmarkRefMode === 'HISTORICO_UNRC' && (
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  Promedio multianual consolidado del Campo Escuela Pozo del Carril (UNRC) registrado en campañas previas (2021-2025).
                </span>
              )}
              {benchmarkRefMode === 'SUPERPUESTO' && (
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  Visualización dual simultánea: Contraste simultáneo contra INTA Manfredi (Ámbar) y Registro Histórico UNRC (Esmeralda).
                </span>
              )}
            </div>
          </div>

          {/* Tarjetas de Resumen de Competitividad Regional */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Índice de Competitividad
                </span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {analisisBenchmarking.resumenCompetitividad.indiceCompetitividadGlobal}%
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    analisisBenchmarking.resumenCompetitividad.indiceCompetitividadGlobal >= 80
                      ? 'text-emerald-500'
                      : analisisBenchmarking.resumenCompetitividad.indiceCompetitividadGlobal >= 60
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}
                >
                  {analisisBenchmarking.resumenCompetitividad.indiceCompetitividadGlobal >= 80
                    ? 'Liderazgo Zonal'
                    : 'En Rango Zonal'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${analisisBenchmarking.resumenCompetitividad.indiceCompetitividadGlobal}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Liderazgo Zonal (+5%)
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {analisisBenchmarking.items.filter((i) => i.clasificacion === 'LIDERAZGO').length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {analisisBenchmarking.items.length} indicadores
                </span>
              </div>
              <p className="text-[11px] text-emerald-500/80 mt-1 truncate">
                Superan la referencia zonal
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  En Rango Esperado (±5%)
                </span>
                <Equal className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {analisisBenchmarking.items.filter((i) => i.clasificacion === 'EN_RANGO').length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {analisisBenchmarking.items.length} indicadores
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                Alineados a la meta técnica
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Brechas a Superar (&gt;5%)
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {analisisBenchmarking.items.filter((i) => i.clasificacion === 'BRECHA_A_SUPERAR').length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {analisisBenchmarking.items.length} indicadores
                </span>
              </div>
              <p className="text-[11px] text-rose-500/80 mt-1 truncate">
                Puntos de intervención prioritaria
              </p>
            </div>
          </div>

          {/* Grilla Principal: Radar Multidimensional (Izquierda) + Análisis de Brecha (Derecha) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ============================================================= */}
            {/* COLUMNA IZQUIERDA: GRÁFICO DE RADAR MULTIDIMENSIONAL (SVG)   */}
            {/* ============================================================= */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      Radar Multidimensional (8 Ejes)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Base 100% = Meta de referencia seleccionada
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                    Escala Normalizada
                  </span>
                </div>

                {/* Leyenda del Radar */}
                <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-3 text-[11px] font-medium">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm inline-block" />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      UNRC Pozo del Carril
                    </span>
                  </div>

                  {(benchmarkRefMode === 'INTA_REGIONAL' || benchmarkRefMode === 'SUPERPUESTO') && (
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3 h-0.5 border-b-2 border-amber-500 border-dashed inline-block" />
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Estándar INTA (100%)
                      </span>
                    </div>
                  )}

                  {(benchmarkRefMode === 'HISTORICO_UNRC' || benchmarkRefMode === 'SUPERPUESTO') && (
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3 h-0.5 border-b-2 border-emerald-500 border-dotted inline-block" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Histórico UNRC
                      </span>
                    </div>
                  )}
                </div>

                {/* RENDERIZADO SVG NATIVO DEL RADAR */}
                {(() => {
                  const cx = 250;
                  const cy = 205;
                  const R = 130;
                  const numEjes = analisisBenchmarking.ejesRadar.length;
                  const angles = analisisBenchmarking.ejesRadar.map((_, i) => (i * 2 * Math.PI) / numEjes - Math.PI / 2);

                  // Niveles concéntricos
                  const gridLevels = [30, 60, 100, 130, 150];

                  const getCoord = (angle: number, normVal: number) => {
                    const r = (Math.max(20, Math.min(155, normVal)) / 150) * R;
                    return {
                      x: cx + r * Math.cos(angle),
                      y: cy + r * Math.sin(angle),
                    };
                  };

                  // Polígono Actual
                  const actualPoints = analisisBenchmarking.ejesRadar
                    .map((eje, i) => {
                      const pt = getCoord(angles[i], eje.actualNormalizado);
                      return `${pt.x},${pt.y}`;
                    })
                    .join(' ');

                  // Polígono Benchmark Referencia (100 base)
                  const benchmarkPoints = analisisBenchmarking.ejesRadar
                    .map((_, i) => {
                      const pt = getCoord(angles[i], 100);
                      return `${pt.x},${pt.y}`;
                    })
                    .join(' ');

                  // Polígono Histórico (cuando superpuesto)
                  const historicoPoints = analisisBenchmarking.ejesRadar
                    .map((eje, i) => {
                      const pt = getCoord(angles[i], eje.historicoNormalizado);
                      return `${pt.x},${pt.y}`;
                    })
                    .join(' ');

                  return (
                    <div className="relative w-full flex justify-center py-2">
                      <svg
                        viewBox="0 0 500 410"
                        className="w-full max-w-[460px] h-auto select-none overflow-visible"
                      >
                        {/* Círculos / Polígonos de cuadrícula concéntrica */}
                        {gridLevels.map((lvl) => {
                          const pts = angles
                            .map((a) => {
                              const pt = getCoord(a, lvl);
                              return `${pt.x},${pt.y}`;
                            })
                            .join(' ');

                          const isMeta = lvl === 100;
                          return (
                            <g key={lvl}>
                              <polygon
                                points={pts}
                                fill={isMeta ? 'rgba(99, 102, 241, 0.03)' : 'none'}
                                stroke={
                                  isMeta
                                    ? benchmarkRefMode === 'HISTORICO_UNRC'
                                      ? '#10b981'
                                      : '#f59e0b'
                                    : '#64748b'
                                }
                                strokeWidth={isMeta ? 1.75 : 0.75}
                                strokeDasharray={isMeta ? '4 3' : '2 2'}
                                strokeOpacity={isMeta ? 0.7 : 0.25}
                              />
                              {/* Etiqueta de porcentaje en el eje vertical superior */}
                              <text
                                x={cx + 4}
                                y={cy - (lvl / 150) * R - 2}
                                fill={isMeta ? '#f59e0b' : '#94a3b8'}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight={isMeta ? 'bold' : 'normal'}
                              >
                                {lvl}% {isMeta ? '(Meta)' : ''}
                              </text>
                            </g>
                          );
                        })}

                        {/* Ejes Radiales desde el centro */}
                        {angles.map((a, i) => {
                          const outer = getCoord(a, 150);
                          const eje = analisisBenchmarking.ejesRadar[i];
                          const isHovered = hoveredEjeId === eje.indicadorId;

                          return (
                            <g key={eje.indicadorId}>
                              <line
                                x1={cx}
                                y1={cy}
                                x2={outer.x}
                                y2={outer.y}
                                stroke={isHovered ? '#6366f1' : '#64748b'}
                                strokeWidth={isHovered ? 1.5 : 0.75}
                                strokeOpacity={isHovered ? 0.8 : 0.25}
                              />
                            </g>
                          );
                        })}

                        {/* POLÍGONO BENCHMARK INTA (Ámbar) */}
                        {(benchmarkRefMode === 'INTA_REGIONAL' || benchmarkRefMode === 'SUPERPUESTO') && (
                          <polygon
                            points={benchmarkPoints}
                            fill="rgba(245, 158, 11, 0.08)"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="4 3"
                          />
                        )}

                        {/* POLÍGONO HISTÓRICO UNRC (Esmeralda) */}
                        {benchmarkRefMode === 'HISTORICO_UNRC' && (
                          <polygon
                            points={benchmarkPoints}
                            fill="rgba(16, 185, 129, 0.08)"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                          />
                        )}

                        {benchmarkRefMode === 'SUPERPUESTO' && (
                          <polygon
                            points={historicoPoints}
                            fill="rgba(16, 185, 129, 0.06)"
                            stroke="#10b981"
                            strokeWidth={1.75}
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* POLÍGONO ACTUAL UNRC (Índigo con área sólida) */}
                        <polygon
                          points={actualPoints}
                          fill="rgba(99, 102, 241, 0.28)"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          className="transition-all duration-300"
                        />

                        {/* Vértices interactivos con Tooltips y Puntos */}
                        {analisisBenchmarking.ejesRadar.map((eje, i) => {
                          const pt = getCoord(angles[i], eje.actualNormalizado);
                          const isHovered = hoveredEjeId === eje.indicadorId;
                          const cosA = Math.cos(angles[i]);
                          const sinA = Math.sin(angles[i]);
                          const labelR = R + 22;
                          const lx = cx + labelR * cosA;
                          const ly = cy + labelR * sinA;

                          const anchor =
                            Math.abs(cosA) < 0.2 ? 'middle' : cosA > 0 ? 'start' : 'end';

                          return (
                            <g
                              key={eje.indicadorId}
                              className="cursor-pointer group"
                              onMouseEnter={() => setHoveredEjeId(eje.indicadorId)}
                              onMouseLeave={() => setHoveredEjeId(null)}
                            >
                              {/* Punto vértice interactivo */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : 4}
                                fill={isHovered ? '#ffffff' : '#6366f1'}
                                stroke="#4f46e5"
                                strokeWidth={2}
                                className="transition-all duration-200"
                              />

                              {/* Etiqueta textual del eje */}
                              <text
                                x={lx}
                                y={ly + 4}
                                textAnchor={anchor}
                                fontSize={isHovered ? '11' : '10'}
                                fontWeight={isHovered ? 'bold' : '600'}
                                fill={isHovered ? '#6366f1' : '#94a3b8'}
                                className="transition-colors"
                              >
                                {eje.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}

                {/* Tarjeta de detalle interactivo al posar el cursor o seleccionada */}
                {(() => {
                  const ejeActivo =
                    analisisBenchmarking.ejesRadar.find((e) => e.indicadorId === hoveredEjeId) ||
                    analisisBenchmarking.ejesRadar[0];
                  const itemActivo =
                    analisisBenchmarking.items.find((i) => i.id === ejeActivo?.indicadorId) ||
                    analisisBenchmarking.items[0];

                  if (!itemActivo) return null;

                  return (
                    <div className="w-full mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-indigo-500" />
                          {itemActivo.indicador}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                            itemActivo.clasificacion === 'LIDERAZGO'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : itemActivo.clasificacion === 'EN_RANGO'
                              ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {itemActivo.brechaPct >= 0 ? `+${itemActivo.brechaPct}%` : `${itemActivo.brechaPct}%`}{' '}
                          {itemActivo.clasificacion === 'LIDERAZGO'
                            ? 'Liderazgo'
                            : itemActivo.clasificacion === 'EN_RANGO'
                            ? 'En Rango'
                            : 'Brecha'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-sans">UNRC Actual</span>
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                            {itemActivo.valorActual} {itemActivo.unidad}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-sans">Ref. INTA</span>
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                            {itemActivo.valorReferenciaInta} {itemActivo.unidad}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-sans">Hist. UNRC</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {itemActivo.valorHistoricoUnrc} {itemActivo.unidad}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 leading-relaxed">
                        {itemActivo.diagnosticoComparativo}
                      </p>
                    </div>
                  );
                })()}

                {/* Nota metodológica de normalización */}
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  * En indicadores donde menor es mejor (ej. Mortalidad Perinatal), la escala se invierte reflejando mayor supervivencia en el polígono.
                </p>
              </div>
            </div>

            {/* ============================================================= */}
            {/* COLUMNA DERECHA: BARRAS COMPARATIVAS DE BRECHA (GAP ANALYSIS)*/}
            {/* ============================================================= */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                      Análisis de Brechas Cuantitativas (Gap Analysis)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Comparativa barra a barra del valor alcanzado frente a la meta activa
                    </p>
                  </div>

                  {/* Selector de Perspectiva para Filtrar Barras */}
                  <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1 sm:pb-0">
                    {(['TODAS', 'PROCESOS', 'APRENDIZAJE', 'FINANCIERA', 'CLIENTES'] as const).map((persp) => (
                      <button
                        key={persp}
                        type="button"
                        onClick={() => setFiltroPerspectivaBenchmark(persp)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          filtroPerspectivaBenchmark === persp
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {persp === 'TODAS'
                          ? 'Todas'
                          : persp === 'PROCESOS'
                          ? 'Zootécnica'
                          : persp === 'APRENDIZAJE'
                          ? 'Desarrollo'
                          : persp === 'FINANCIERA'
                          ? 'Finanzas'
                          : 'Clientes'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listado de Barras Comparativas */}
                <div className="space-y-3.5">
                  {itemsBenchmarkFiltrados.map((item) => {
                    const esLider = item.clasificacion === 'LIDERAZGO';
                    const esEnRango = item.clasificacion === 'EN_RANGO';

                    // Cálculo visual del ancho de las dos barras normalizado respecto al máximo entre actual y referencia
                    const maxVal = Math.max(item.valorActual, item.valorReferenciaActivo, 1);
                    const widthActual = Math.min(100, Math.max(8, (item.valorActual / (maxVal * 1.15)) * 100));
                    const widthRef = Math.min(100, Math.max(8, (item.valorReferenciaActivo / (maxVal * 1.15)) * 100));

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/40 transition-colors space-y-2.5"
                      >
                        {/* Fila Superior: Nombre del Indicador y Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {item.indicador}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                              {item.perspectiva}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Badge de Brecha */}
                            <span
                              className={`flex items-center space-x-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                                esLider
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : esEnRango
                                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {esLider ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : esEnRango ? (
                                <Equal className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {item.brechaPct >= 0 ? `+${item.brechaPct}%` : `${item.brechaPct}%`}
                              </span>
                              <span className="text-[10px] font-sans font-semibold hidden sm:inline">
                                {esLider ? 'Liderazgo Zonal' : esEnRango ? 'En Rango' : 'Brecha a Superar'}
                              </span>
                            </span>

                            {onOpenManual && (
                              <button
                                type="button"
                                onClick={() => onOpenManual(undefined, 'INDICADORES', item.id)}
                                title="Abrir Ficha Técnica"
                                className="p-1 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Barras Comparativas Duales */}
                        <div className="space-y-1.5 pt-1">
                          {/* Barra 1: Actual Pozo del Carril UNRC */}
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="w-20 text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                              UNRC Actual
                            </span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700/60 h-3 rounded-md overflow-hidden relative">
                              <div
                                className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-md transition-all duration-500"
                                style={{ width: `${widthActual}%` }}
                              />
                            </div>
                            <span className="w-24 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white text-xs">
                              {item.valorActual} <span className="text-[10px] text-slate-400 font-normal">{item.unidad}</span>
                            </span>
                          </div>

                          {/* Barra 2: Referencia Activa (INTA o Histórico) */}
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="w-20 text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                              {benchmarkRefMode === 'HISTORICO_UNRC' ? 'Histórico UNRC' : 'Referencia INTA'}
                            </span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700/60 h-3 rounded-md overflow-hidden relative">
                              <div
                                className={`h-full rounded-md transition-all duration-500 ${
                                  benchmarkRefMode === 'HISTORICO_UNRC'
                                    ? 'bg-emerald-500 dark:bg-emerald-600'
                                    : 'bg-amber-500 dark:bg-amber-600'
                                }`}
                                style={{ width: `${widthRef}%` }}
                              />
                            </div>
                            <span className="w-24 text-right font-mono font-bold tabular-nums text-slate-600 dark:text-slate-300 text-xs">
                              {item.valorReferenciaActivo} <span className="text-[10px] text-slate-400 font-normal">{item.unidad}</span>
                            </span>
                          </div>
                        </div>

                        {/* Diagnóstico Técnico y Fuente */}
                        <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-1 border-t border-slate-200/60 dark:border-slate-800">
                          <p className="italic text-slate-600 dark:text-slate-300">
                            {item.diagnosticoComparativo}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap self-end sm:self-auto">
                            Fuente: {benchmarkRefMode === 'HISTORICO_UNRC' ? item.fuenteUnrc : item.fuenteInta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* SECCIÓN INFERIOR: DIAGNÓSTICO ESTRATÉGICO DE COMPETITIVIDAD  */}
          {/* ============================================================= */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Dictamen Ejecutivo de Competitividad Agropecuaria Zonal
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fortalezas Destacadas */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ventajas Competitivas Destacadas del Campo
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analisisBenchmarking.resumenCompetitividad.fortalezasZonales.map((f, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cuellos de Botella y Desafíos */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Brechas Zonales Prioritarias a Superar
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analisisBenchmarking.resumenCompetitividad.desafiosZonales.map((d, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-rose-400 font-bold">!</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Conclusión Estratégica Regional */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-xs text-indigo-200 leading-relaxed flex items-start space-x-3">
              <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-100 uppercase tracking-wider block text-[11px] mb-1">
                  Recomendación para la Dirección Técnica y Cátedras UNRC
                </span>
                <p>{analisisBenchmarking.resumenCompetitividad.conclusionesEstrategicas}</p>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* SECCIÓN ADICIONAL: MATRIZ DE 3 NIVELES DE COMPARACIÓN         */}
          {/* 1. Real vs 2. Estándar Pozo del Carril vs 3. Estándar INTA   */}
          {/* ============================================================= */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-indigo-500 font-bold mb-1">
                  <Scale className="w-4 h-4" />
                  <span>METODOLOGÍA DE 3 NIVELES DE COMPARACIÓN (F_EstandarIndicador)</span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Catálogo de Estándares Zootécnicos & Económicos Multi-Especie
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Contraste transparente: <strong>1. Nivel Real</strong> (del sistema) vs <strong>2. Pozo del Carril</strong> (meta interna UNRC) vs <strong>3. Estándar INTA</strong> (fuente externa validada o etiqueta <em className="text-amber-500 font-semibold">Pendiente de Definición</em>).
                </p>
              </div>

              {/* Selector de Especie para Filtrar Estándares */}
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
                <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Especie:</span>
                {[
                  { id: 'TODOS', label: '📊 Todas' },
                  { id: 'ESP001', label: '🐑 Ovinos' },
                  { id: 'ESP002', label: '🐄 Bovinos' },
                  { id: 'ESP003', label: '🐖 Porcinos' },
                ].map((esp) => (
                  <button
                    key={esp.id}
                    type="button"
                    onClick={() => setFiltroEspecieEstandares(esp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filtroEspecieEstandares === esp.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isLightMode
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {esp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de 3 Niveles */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead
                  className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isLightMode ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-3">Indicador</th>
                    <th className="py-3 px-2.5">Especie</th>
                    <th className="py-3 px-3 text-right">1. Real Pozo del Carril</th>
                    <th className="py-3 px-3 text-right">2. Estándar Pozo del Carril (UNRC)</th>
                    <th className="py-3 px-4 text-center">3. Estándar INTA Regional</th>
                    <th className="py-3 px-3 text-right">Desvío vs INTA</th>
                    <th className="py-3 px-4">Fuente / Documento Validado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {triadasFiltradas.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.indicador_nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <span>{item.icono_especie}</span>
                          <span>{item.especie_nombre}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {typeof item.valorReal === 'number'
                          ? item.unidad === '$/ha'
                            ? `$ ${item.valorReal.toLocaleString('es-AR')}`
                            : `${item.valorReal} ${item.unidad}`
                          : item.valorReal}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {item.estandarPozoCarril?.valor !== null && item.estandarPozoCarril?.valor !== undefined
                          ? item.unidad === '$/ha'
                            ? `$ ${item.estandarPozoCarril.valor.toLocaleString('es-AR')} ${item.unidad}`
                            : `${item.estandarPozoCarril.valor} ${item.unidad}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.estandarInta?.estado_definicion === 'PENDIENTE_DEFINICION' || item.estandarInta?.valor === null ? (
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-300"
                            title="Sin publicación técnica homologada para este parámetro zootécnico"
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>ESTÁNDAR INTA PENDIENTE DE DEFINICIÓN</span>
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                            {item.unidad === '$/ha'
                              ? `$ ${item.estandarInta?.valor?.toLocaleString('es-AR')} ${item.unidad}`
                              : `${item.estandarInta?.valor} ${item.unidad}`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {item.desvioIntaPct !== null ? (
                          <span
                            className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-xs ${
                              item.desvioIntaPct >= 0
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.desvioIntaPct >= 0 ? `+${item.desvioIntaPct.toFixed(1)}%` : `${item.desvioIntaPct.toFixed(1)}%`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic" title="No se calcula desvío al no existir estándar homologado">
                            — (Sin desvío)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                        {item.estandarInta?.fuente ? (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                              {item.estandarInta.fuente}
                            </span>
                            {item.estandarInta.documento && (
                              <span className="text-[10px] block truncate text-slate-400">
                                {item.estandarInta.documento}
                              </span>
                            )}
                            {item.estandarInta.url && (
                              <a
                                href={item.estandarInta.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
                              >
                                <span>Ver publicación INTA</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Pendiente de documento formal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

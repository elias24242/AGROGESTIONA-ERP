import React, { useState, useMemo, useEffect } from 'react';
import { DatabaseState } from '../services/sheetsService';
import { Usuario } from '../types/erp';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Calendar,
  Filter,
  Info,
  CheckCircle2,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle,
  Maximize2,
  Download,
  RotateCcw
} from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';

import { BotonAyudaContextual } from '../components/BotonAyudaContextual';

interface GraficosModuleProps {
  state: DatabaseState;
  currentUser: Usuario;
  selectedSubunidad: string;
  selectedCampania: string;
  selectedEspecie?: string;
  isTestMode: boolean;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
  isLightMode?: boolean;
}

export const GraficosModule: React.FC<GraficosModuleProps> = ({
  state,
  currentUser,
  selectedSubunidad: propSelectedSubunidad,
  selectedCampania,
  selectedEspecie = 'TODOS',
  isTestMode,
  onOpenManual,
  isLightMode = false,
}) => {
  // Filtro de subunidad específico para gráficos
  const [subunidadFiltro, setSubunidadFiltro] = useState<string>(propSelectedSubunidad);

  // Sincronizar automáticamente con el selector del Header
  useEffect(() => {
    setSubunidadFiltro(propSelectedSubunidad);
  }, [propSelectedSubunidad]);

  // Selector de tipo de gráfico: Línea de evolución, Área acumulada, o Barras por subunidad
  const [tipoGrafico, setTipoGrafico] = useState<'lineas' | 'areas' | 'barras'>('lineas');
  const [modoBarras, setModoBarras] = useState<'apiladas' | 'agrupadas'>('apiladas');

  // Campañas disponibles ordenadas cronológicamente
  const campaniasOrdenadas = useMemo(() => {
    return [...state.campanias].sort((a, b) => a.anio_inicio - b.anio_inicio);
  }, [state.campanias]);

  // Selección múltiple de campañas activas en el gráfico (por defecto todas)
  const [campaniasSeleccionadas, setCampaniasSeleccionadas] = useState<string[]>(() => {
    return campaniasOrdenadas.map(c => c.id_campania);
  });

  // Asegurar que la campaña seleccionada en el header esté visible en el gráfico
  useEffect(() => {
    if (selectedCampania && !campaniasSeleccionadas.includes(selectedCampania)) {
      setCampaniasSeleccionadas(prev => [...prev, selectedCampania]);
    }
  }, [selectedCampania]);

  const toggleCampania = (idCamp: string) => {
    setCampaniasSeleccionadas(prev => {
      if (prev.includes(idCamp)) {
        if (prev.length === 1) return prev; // Mantener al menos una
        return prev.filter(id => id !== idCamp);
      } else {
        return [...prev, idCamp];
      }
    });
  };

  const seleccionarTodasCampanias = () => {
    setCampaniasSeleccionadas(campaniasOrdenadas.map(c => c.id_campania));
  };

  // Metadatos de títulos y series según la especie activa
  const seriesLabels = useMemo(() => {
    if (selectedEspecie === 'ESP001') {
      return {
        cria: 'Cría Ovina',
        recria: 'Recría Ovina',
        engorde: 'Engorde / Cabaña',
        total: 'Total Majada Ovina',
        titulo: 'Evolución del Inventario Ovino',
        subtitulo: 'Curvas de parición, desarrollo de reposición y terminación en Pozo del Carril',
      };
    }
    if (selectedEspecie === 'ESP002') {
      return {
        cria: 'Cría Bovina',
        recria: 'Recría & Invernada',
        engorde: 'Adaptación / Corral',
        total: 'Total Rodeo Bovino',
        titulo: 'Evolución del Rodeo Bovino (La Aguada)',
        subtitulo: 'Existencias vacunas por etapa productiva en ciclo de 390 días',
      };
    }
    if (selectedEspecie === 'ESP003') {
      return {
        cria: 'Maternidad & Reprod.',
        recria: 'Destete Porcino',
        engorde: 'Engorde / Capones',
        total: 'Total Piara Porcina',
        titulo: 'Evolución de la Piara Porcina (Pozo del Carril)',
        subtitulo: 'Fases Cría (Lechón), Destete (Cachorro) y Engorde (Capón a faena)',
      };
    }
    return {
      cria: '🐑 Ovinos',
      recria: '🐄 Bovinos',
      engorde: '🐖 Porcinos',
      total: '📊 Total Ganadería',
      titulo: 'Evolución de la Ganadería Integral Multi-Especie',
      subtitulo: 'Comparativa de biomasa y cabezas en Ovinos, Bovinos y Porcinos',
    };
  }, [selectedEspecie]);

  // Subunidades disponibles para filtrar según especie
  const subunidadesDisponibles = useMemo(() => {
    if (selectedEspecie === 'ESP001') {
      return [
        { id: 'TODOS', label: 'Toda la Majada' },
        { id: 'SUB-CRIA', label: 'Cría Ovina' },
        { id: 'SUB-REC', label: 'Recría Ovina' },
        { id: 'SUB-ENG', label: 'Engorde / Cabaña' },
      ];
    }
    if (selectedEspecie === 'ESP002') {
      return [
        { id: 'TODOS', label: 'Todo el Rodeo' },
        { id: 'SUB-BOV-CRIA', label: 'Cría Bovina' },
        { id: 'SUB-BOV-REC', label: 'Recría & Invernada' },
      ];
    }
    if (selectedEspecie === 'ESP003') {
      return [
        { id: 'TODOS', label: 'Toda la Piara' },
        { id: 'SUB-POR-CRIA', label: 'Maternidad & Reprod.' },
        { id: 'SUB-POR-ENG', label: 'Recría & Terminación' },
      ];
    }
    return [
      { id: 'TODOS', label: 'Toda la Ganadería' },
      { id: 'SUB-CRIA', label: '🐑 Ovinos' },
      { id: 'SUB-BOV-CRIA', label: '🐄 Bovinos' },
      { id: 'SUB-POR-CRIA', label: '🐖 Porcinos' },
    ];
  }, [selectedEspecie]);

  // Calcular inventario por campaña y subunidad considerando inventario inicial y movimientos registrados
  const dataGrafico = useMemo(() => {
    return campaniasOrdenadas
      .filter(camp => campaniasSeleccionadas.includes(camp.id_campania))
      .map(camp => {
        const invCamp = state.inventario.filter(i => i.id_campania === camp.id_campania);
        const movsCamp = state.movimientos.filter(
          m => m.id_campania === camp.id_campania && !m.anulado && (isTestMode ? true : !m.es_prueba)
        );

        if (selectedEspecie === 'TODOS') {
          let oviCab = invCamp.filter(i => (i.id_subunidad === 'SUB-CRIA' || i.id_subunidad === 'SUB-REC' || i.id_subunidad === 'SUB-ENG')).reduce((a, b) => a + b.cabezas, 0);
          let bovCab = invCamp.filter(i => (i.id_subunidad === 'SUB-BOV-CRIA' || i.id_subunidad === 'SUB-BOV-REC')).reduce((a, b) => a + b.cabezas, 0);
          let porCab = invCamp.filter(i => (i.id_subunidad === 'SUB-POR-CRIA' || i.id_subunidad === 'SUB-POR-ENG')).reduce((a, b) => a + b.cabezas, 0);

          for (const m of movsCamp) {
            if (m.id_movimiento === 'MOV-HIST-01' || m.id_operacion_relacionada === 'VTA-HIST-01') continue;
            const destSub = m.id_subunidad_destino || m.id_subunidad_origen || '';
            const origSub = m.id_subunidad_origen || '';
            const isOvi = destSub.includes('SUB-CRIA') || destSub.includes('SUB-REC') || destSub.includes('SUB-ENG') || origSub.includes('SUB-CRIA') || origSub.includes('SUB-REC') || origSub.includes('SUB-ENG');
            const isBov = destSub.includes('BOV') || origSub.includes('BOV');
            const isPor = destSub.includes('POR') || origSub.includes('POR');

            if (m.tipo === 'NACIMIENTO' || m.tipo === 'COMPRA') {
              if (isOvi) oviCab += m.cabezas;
              else if (isBov) bovCab += m.cabezas;
              else if (isPor) porCab += m.cabezas;
            } else if (m.tipo === 'MUERTE' || m.tipo === 'VENTA' || m.tipo === 'CONSUMO_PROPIO') {
              if (isOvi) oviCab = Math.max(0, oviCab - m.cabezas);
              else if (isBov) bovCab = Math.max(0, bovCab - m.cabezas);
              else if (isPor) porCab = Math.max(0, porCab - m.cabezas);
            }
          }

          return {
            id_campania: camp.id_campania,
            campaniaCodigo: camp.codigo,
            campaniaNombre: camp.nombre,
            anio: camp.anio_inicio,
            cria: oviCab,
            recria: bovCab,
            engorde: porCab,
            total: oviCab + bovCab + porCab,
          };
        }

        const sub1: string = selectedEspecie === 'ESP002' ? 'SUB-BOV-CRIA' : selectedEspecie === 'ESP003' ? 'SUB-POR-CRIA' : 'SUB-CRIA';
        const sub2: string = selectedEspecie === 'ESP002' ? 'SUB-BOV-REC' : selectedEspecie === 'ESP003' ? 'SUB-POR-CRIA' : 'SUB-REC';
        const sub3: string = selectedEspecie === 'ESP002' ? 'SUB-BOV-REC' : selectedEspecie === 'ESP003' ? 'SUB-POR-ENG' : 'SUB-ENG';

        let c1 = invCamp.filter(i => i.id_subunidad === sub1).reduce((acc, i) => acc + i.cabezas, 0);
        let c2 = invCamp.filter(i => i.id_subunidad === sub2 && sub2 !== sub1).reduce((acc, i) => acc + i.cabezas, 0);
        let c3 = invCamp.filter(i => i.id_subunidad === sub3 && sub3 !== sub2 && sub3 !== sub1).reduce((acc, i) => acc + i.cabezas, 0);

        for (const m of movsCamp) {
          if (m.id_movimiento === 'MOV-HIST-01' || m.id_operacion_relacionada === 'VTA-HIST-01') continue;

          if (m.tipo === 'NACIMIENTO' || m.tipo === 'COMPRA') {
            const destSub = m.id_subunidad_destino || m.id_subunidad_origen;
            if (destSub === sub1) c1 += m.cabezas;
            else if (destSub === sub2) c2 += m.cabezas;
            else if (destSub === sub3) c3 += m.cabezas;
          } else if (m.tipo === 'MUERTE' || m.tipo === 'VENTA' || m.tipo === 'CONSUMO_PROPIO') {
            const origSub = m.id_subunidad_origen;
            if (origSub === sub1) c1 = Math.max(0, c1 - m.cabezas);
            else if (origSub === sub2) c2 = Math.max(0, c2 - m.cabezas);
            else if (origSub === sub3) c3 = Math.max(0, c3 - m.cabezas);
          } else if (m.tipo === 'TRANSFERENCIA_SUBUNIDAD' || m.tipo === 'CAMBIO_CATEGORIA') {
            const origSub = m.id_subunidad_origen;
            const destSub = m.id_subunidad_destino;
            if (origSub === sub1) c1 = Math.max(0, c1 - m.cabezas);
            else if (origSub === sub2) c2 = Math.max(0, c2 - m.cabezas);
            else if (origSub === sub3) c3 = Math.max(0, c3 - m.cabezas);

            if (destSub === sub1) c1 += m.cabezas;
            else if (destSub === sub2) c2 += m.cabezas;
            else if (destSub === sub3) c3 += m.cabezas;
          }
        }

        const totalMajada = c1 + c2 + c3;

        return {
          id_campania: camp.id_campania,
          campaniaCodigo: camp.codigo,
          campaniaNombre: camp.nombre,
          anio: camp.anio_inicio,
          cria: c1,
          recria: c2,
          engorde: c3,
          total: totalMajada,
        };
      });
  }, [campaniasOrdenadas, campaniasSeleccionadas, state.inventario, state.movimientos, isTestMode, selectedEspecie]);

  // Indicadores de resumen dinámicos según el filtro de subunidad activo
  const kpiTotales = useMemo(() => {
    if (dataGrafico.length === 0) return { inicial: 0, actual: 0, delta: 0, porcentaje: 0, participacion: 0, dominante: 'Cría Ovina', porcentajeDominante: 0 };
    
    const getValor = (row: typeof dataGrafico[0]) => {
      if (subunidadFiltro === 'SUB-CRIA') return row.cria;
      if (subunidadFiltro === 'SUB-REC') return row.recria;
      if (subunidadFiltro === 'SUB-ENG') return row.engorde;
      return row.total;
    };

    const primero = getValor(dataGrafico[0]);
    const ultimoRow = dataGrafico[dataGrafico.length - 1];
    const ultimo = getValor(ultimoRow);
    const delta = ultimo - primero;
    const porcentaje = primero > 0 ? ((delta / primero) * 100) : 0;

    // Participación de la subunidad filtrada sobre el total
    const participacion = ultimoRow.total > 0 ? (ultimo / ultimoRow.total) * 100 : 0;

    // Subunidad dominante en la última campaña
    let dominante = 'Cría Ovina';
    let maxCab = ultimoRow.cria;
    if (ultimoRow.recria > maxCab) {
      dominante = 'Recría';
      maxCab = ultimoRow.recria;
    }
    if (ultimoRow.engorde > maxCab) {
      dominante = 'Engorde / Cabaña';
      maxCab = ultimoRow.engorde;
    }
    const porcentajeDominante = ultimoRow.total > 0 ? (maxCab / ultimoRow.total) * 100 : 0;

    return { inicial: primero, actual: ultimo, delta, porcentaje, participacion, dominante, porcentajeDominante };
  }, [dataGrafico, subunidadFiltro]);

  // Descargar datos de la matriz a archivo CSV
  const handleExportarCSV = () => {
    const headers = ['Campaña', 'Año', 'Cría Ovina (cab)', 'Recría (cab)', 'Engorde / Cabaña (cab)', 'Total Majada (cab)'];
    const rows = dataGrafico.map(r => [
      `Campaña ${r.campaniaCodigo}`,
      r.anio,
      r.cria,
      r.recria,
      r.engorde,
      r.total
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Evolucion_Inventario_Ovinos_UNRC_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Colores profesionales acordes a la identidad visual agropecuaria UNRC
  const colorCria = '#10b981';    // Emerald
  const colorRecria = '#0284c7';  // Sky/Blue
  const colorEngorde = '#f59e0b'; // Amber
  const colorTotal = '#6366f1';   // Indigo

  // Custom Tooltip para recharts con formato limpio y números tabulares
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3.5 rounded-xl border shadow-2xl text-xs space-y-1.5 backdrop-blur-md ${
            isLightMode
              ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/20'
              : 'bg-slate-900/95 border-slate-700 text-white shadow-black/60'
          }`}
        >
          <p className="font-extrabold text-sm border-b border-slate-700/30 pb-1 flex items-center justify-between gap-4">
            <span className={isLightMode ? 'text-slate-900' : 'text-white'}>Campaña {label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Inventario Ovino</span>
          </p>
          {payload.map((entry: any, index: number) => {
            const labelNombre =
              entry.name === 'cria'
                ? 'Cría Ovina'
                : entry.name === 'recria'
                ? 'Recría'
                : entry.name === 'engorde'
                ? 'Engorde / Cabaña'
                : 'Total Majada';

            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-mono">
                <span className="flex items-center space-x-1.5 font-sans font-semibold" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span>{labelNombre}:</span>
                </span>
                <span className={`font-extrabold tabular-nums ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {entry.value} <span className="font-sans font-normal text-slate-400 text-[10px]">cabezas</span>
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const nombreFiltroActivo =
    subunidadFiltro === 'SUB-CRIA'
      ? 'Cría Ovina'
      : subunidadFiltro === 'SUB-REC'
      ? 'Recría'
      : subunidadFiltro === 'SUB-ENG'
      ? 'Engorde / Cabaña'
      : 'Toda la Majada';

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo de Gráficos */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 text-white'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className={`text-lg font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {seriesLabels.titulo}
                </h2>
                <BotonAyudaContextual moduloId="graficos" onOpenManual={onOpenManual} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Intercampaña
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {seriesLabels.subtitulo}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Ayuda rápida */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportarCSV}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors shadow-sm ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Exportar la matriz de datos de las campañas a archivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exportar CSV</span>
          </button>

          {onOpenManual && (
            <button
              onClick={() => onOpenManual('Lote y Subunidades')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Aprende cómo se compone el inventario de ovinos por subunidad"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Conceptos Zootécnicos</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicador de Auditoría */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['inventario', 'movimientos', 'campanias', 'subunidades']}
        seccionNombre="Inventario Histórico & Campañas Ovinas"
      />

      {/* Tarjetas KPI de Evolución Intercampaña Dinámicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Actual */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-colors ${
            isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Inventario Última Campaña
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-3xl font-black tabular-nums ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {kpiTotales.actual}
            </span>
            <span className={`text-xs font-medium ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>cabezas</span>
          </div>
          <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {nombreFiltroActivo} · {dataGrafico[dataGrafico.length - 1]?.campaniaCodigo || 'Actual'}
          </p>
        </div>

        {/* Variación Absoluta */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-colors ${
            isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Crecimiento Neto ({nombreFiltroActivo})
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-3xl font-black tabular-nums ${kpiTotales.delta >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {kpiTotales.delta >= 0 ? `+${kpiTotales.delta}` : kpiTotales.delta}
            </span>
            <span className={`text-xs font-medium ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>cabezas</span>
          </div>
          <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Variación entre primera y última campaña
          </p>
        </div>

        {/* Tasa Porcentual */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-colors ${
            isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Tasa de Variación (%)
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-3xl font-black tabular-nums ${kpiTotales.porcentaje >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {kpiTotales.porcentaje >= 0 ? `+${kpiTotales.porcentaje.toFixed(1)}%` : `${kpiTotales.porcentaje.toFixed(1)}%`}
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Evolución total acumulada
          </p>
        </div>

        {/* Participación / Subunidad Dominante */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-colors ${
            isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {subunidadFiltro === 'TODOS' ? 'Subunidad Principal' : 'Participación en Majada'}
          </span>
          <div className="mt-2">
            {subunidadFiltro === 'TODOS' ? (
              <span className="text-xl font-black text-emerald-500 dark:text-emerald-400">
                {kpiTotales.dominante}
              </span>
            ) : (
              <span className="text-2xl font-black text-sky-500 dark:text-sky-400 tabular-nums">
                {kpiTotales.participacion.toFixed(1)}%
              </span>
            )}
          </div>
          <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {subunidadFiltro === 'TODOS'
              ? `Representa el ${kpiTotales.porcentajeDominante.toFixed(1)}% de las cabezas totales`
              : `Sobre el total de la majada en la última campaña`}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Configuración del Gráfico */}
      <div
        className={`p-4 rounded-2xl border shadow-sm space-y-4 transition-colors ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Campañas (Interactivo) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center space-x-1.5 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Campañas en Comparativa:</span>
              </span>
              <button
                onClick={seleccionarTodasCampanias}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold ml-3 cursor-pointer"
              >
                (Seleccionar Todas)
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {campaniasOrdenadas.map(camp => {
                const isSelected = campaniasSeleccionadas.includes(camp.id_campania);
                return (
                  <button
                    key={camp.id_campania}
                    onClick={() => toggleCampania(camp.id_campania)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : isLightMode
                        ? 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>Campaña {camp.codigo}</span>
                    {camp.estado === 'ABIERTA' && (
                      <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-white/20 text-white">
                        Activa
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Tipo de Gráfico */}
          <div className="space-y-1.5">
            <span className={`text-xs font-bold flex items-center space-x-1.5 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Modalidad de Visualización:</span>
            </span>
            <div
              className={`flex items-center p-1 rounded-xl border text-xs ${
                isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                onClick={() => setTipoGrafico('lineas')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tipoGrafico === 'lineas'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Líneas de Evolución
              </button>
              <button
                onClick={() => setTipoGrafico('areas')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tipoGrafico === 'areas'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Áreas Apiladas
              </button>
              <button
                onClick={() => setTipoGrafico('barras')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tipoGrafico === 'barras'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Barras por Subunidad
              </button>
            </div>
          </div>
        </div>

        {/* Filtro específico por Subunidad */}
        <div
          className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLightMode ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Subunidad en Foco:</span>
            <div className="flex flex-wrap items-center gap-1">
              {subunidadesDisponibles.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSubunidadFiltro(sub.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    subunidadFiltro === sub.id
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {tipoGrafico === 'barras' && (
            <div className="flex items-center space-x-2">
              <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Disposición de barras:</span>
              <button
                onClick={() => setModoBarras(modoBarras === 'apiladas' ? 'agrupadas' : 'apiladas')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {modoBarras === 'apiladas' ? 'Cambiar a Agrupadas' : 'Cambiar a Apiladas'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL DEL GRÁFICO RECHARTS */}
      <div
        className={`p-5 rounded-2xl border shadow-md space-y-4 transition-colors ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-3 ${
            isLightMode ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div>
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>
                {subunidadFiltro === 'TODOS'
                  ? 'Evolución del Stock Total y por Subunidad (Cabezas)'
                  : `Evolución de Stock — Subunidad: ${nombreFiltroActivo}`}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Corte oficial al inicio de cada campaña y trazabilidad de movimientos en el Lote 1 (LOT001)
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-xs font-mono">
            {subunidadFiltro === 'TODOS' ? (
              <>
                <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Cría</span>
                </span>
                <span className="flex items-center space-x-1.5 text-sky-600 dark:text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Recría</span>
                </span>
                <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Engorde</span>
                </span>
                <span className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span>Total</span>
                </span>
              </>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Subunidad Filtrada</span>
            )}
          </div>
        </div>

        {/* Contenedor Responsivo del Gráfico Recharts */}
        <div className="h-80 sm:h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {tipoGrafico === 'lineas' ? (
              <LineChart data={dataGrafico} margin={{ top: 15, right: 25, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#334155'} opacity={0.6} />
                <XAxis
                  dataKey="campaniaCodigo"
                  stroke={isLightMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isLightMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                  unit=" cab"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value) => {
                    const map: Record<string, string> = {
                      cria: seriesLabels.cria,
                      recria: seriesLabels.recria,
                      engorde: seriesLabels.engorde,
                      total: seriesLabels.total,
                    };
                    return (
                      <span className={`text-xs font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {map[value] || value}
                      </span>
                    );
                  }}
                />
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-CRIA') && (
                  <Line
                    type="monotone"
                    dataKey="cria"
                    stroke={colorCria}
                    strokeWidth={3}
                    dot={{ r: 5, fill: colorCria }}
                    activeDot={{ r: 7 }}
                    name="cria"
                  />
                )}
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-REC') && (
                  <Line
                    type="monotone"
                    dataKey="recria"
                    stroke={colorRecria}
                    strokeWidth={3}
                    dot={{ r: 5, fill: colorRecria }}
                    activeDot={{ r: 7 }}
                    name="recria"
                  />
                )}
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-ENG') && (
                  <Line
                    type="monotone"
                    dataKey="engorde"
                    stroke={colorEngorde}
                    strokeWidth={3}
                    dot={{ r: 5, fill: colorEngorde }}
                    activeDot={{ r: 7 }}
                    name="engorde"
                  />
                )}
                {subunidadFiltro === 'TODOS' && (
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={colorTotal}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: colorTotal }}
                    activeDot={{ r: 6 }}
                    name="total"
                  />
                )}
              </LineChart>
            ) : tipoGrafico === 'areas' ? (
              <AreaChart data={dataGrafico} margin={{ top: 15, right: 25, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorCriaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorCria} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={colorCria} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorRecriaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorRecria} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={colorRecria} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorEngordeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorEngorde} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={colorEngorde} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#334155'} opacity={0.6} />
                <XAxis
                  dataKey="campaniaCodigo"
                  stroke={isLightMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isLightMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                  unit=" cab"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value) => {
                    const map: Record<string, string> = {
                      cria: seriesLabels.cria,
                      recria: seriesLabels.recria,
                      engorde: seriesLabels.engorde,
                    };
                    return (
                      <span className={`text-xs font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {map[value] || value}
                      </span>
                    );
                  }}
                />
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-CRIA') && (
                  <Area
                    type="monotone"
                    dataKey="cria"
                    stroke={colorCria}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCriaGrad)"
                    stackId="1"
                    name="cria"
                  />
                )}
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-REC') && (
                  <Area
                    type="monotone"
                    dataKey="recria"
                    stroke={colorRecria}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRecriaGrad)"
                    stackId="1"
                    name="recria"
                  />
                )}
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-ENG') && (
                  <Area
                    type="monotone"
                    dataKey="engorde"
                    stroke={colorEngorde}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEngordeGrad)"
                    stackId="1"
                    name="engorde"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={dataGrafico} margin={{ top: 15, right: 25, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#334155'} opacity={0.6} />
                <XAxis
                  dataKey="campaniaCodigo"
                  stroke={isLightMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isLightMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                  unit=" cab"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value) => {
                    const map: Record<string, string> = {
                      cria: seriesLabels.cria,
                      recria: seriesLabels.recria,
                      engorde: seriesLabels.engorde,
                    };
                    return (
                      <span className={`text-xs font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {map[value] || value}
                      </span>
                    );
                  }}
                />
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-CRIA') && (
                  <Bar
                    dataKey="cria"
                    stackId={modoBarras === 'apiladas' ? 'a' : undefined}
                    fill={colorCria}
                    radius={modoBarras === 'apiladas' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    name="cria"
                  />
                )}
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-REC') && (
                  <Bar
                    dataKey="recria"
                    stackId={modoBarras === 'apiladas' ? 'a' : undefined}
                    fill={colorRecria}
                    radius={modoBarras === 'apiladas' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    name="recria"
                  />
                )}
                {(subunidadFiltro === 'TODOS' || subunidadFiltro === 'SUB-ENG') && (
                  <Bar
                    dataKey="engorde"
                    stackId={modoBarras === 'apiladas' ? 'a' : undefined}
                    fill={colorEngorde}
                    radius={modoBarras === 'apiladas' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                    name="engorde"
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA DE DATOS DESGLOSADA POR CAMPAÑA */}
      <div
        className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-colors ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <span>Matriz Numérica de Inventario por Campaña</span>
            </h3>
            <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Valores auditables en cabezas físicas con desglose por subunidad
            </span>
          </div>
          <button
            onClick={handleExportarCSV}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer border ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Descargar CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead
              className={`uppercase font-semibold ${
                isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Campaña</th>
                <th className="py-2.5 px-3 text-right">Cría Ovina</th>
                <th className="py-2.5 px-3 text-right">Recría</th>
                <th className="py-2.5 px-3 text-right">Engorde / Cabaña</th>
                <th className="py-2.5 px-3 text-right">Total Majada</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Variación vs Anterior</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {dataGrafico.map((row, idx) => {
                const getRowVal = (r: typeof row) => {
                  if (subunidadFiltro === 'SUB-CRIA') return r.cria;
                  if (subunidadFiltro === 'SUB-REC') return r.recria;
                  if (subunidadFiltro === 'SUB-ENG') return r.engorde;
                  return r.total;
                };

                const currentVal = getRowVal(row);
                const prev = idx > 0 ? getRowVal(dataGrafico[idx - 1]) : null;
                const deltaPrev = prev !== null ? currentVal - prev : null;

                return (
                  <tr
                    key={row.id_campania}
                    className={`transition-colors ${
                      isLightMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className={`py-3 px-3 font-mono font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Campaña {row.campaniaCodigo}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      subunidadFiltro === 'SUB-CRIA' ? 'text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 rounded' : 'text-emerald-500'
                    }`}>
                      {row.cria} cab.
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      subunidadFiltro === 'SUB-REC' ? 'text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/30 rounded' : 'text-sky-500'
                    }`}>
                      {row.recria} cab.
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      subunidadFiltro === 'SUB-ENG' ? 'text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 rounded' : 'text-amber-500'
                    }`}>
                      {row.engorde} cab.
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-black text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {row.total} cab.
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {deltaPrev !== null ? (
                        <span className={`font-bold ${deltaPrev >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {deltaPrev >= 0 ? `+${deltaPrev}` : deltaPrev} cab. ({((deltaPrev / (prev || 1)) * 100).toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">Línea base</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

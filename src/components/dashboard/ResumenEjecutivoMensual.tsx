import React, { useState, useMemo } from 'react';
import { DatabaseState } from '../../services/sheetsService';
import { MonedaTipo, convertirArsAUsd } from '../../services/currencyService';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Users,
  Activity,
  Layers,
  Calendar,
  DollarSign,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BarChart3,
  Scale,
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Target,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Sliders,
  BrainCircuit,
} from 'lucide-react';

export interface UmbralDoble {
  critico: number; // Umbral de alarma roja
  minimo: number; // Umbral de cumplimiento óptimo verde
}

export interface MetasEjecutivasConfig {
  // Perspectiva Zootécnica (integrada en Procesos Internos)
  mortalidad: UmbralDoble; // Menor es mejor: min 2.0% (verde), crit 4.0% (rojo)
  cargaHa: UmbralDoble; // Mayor es mejor: crit 1.5 cab/ha, min 3.0 cab/ha
  paricion: UmbralDoble; // Mayor es mejor: crit 75%, min 95%
  gdp: UmbralDoble; // Mayor es mejor: crit 120 g/d, min 180 g/d
  // Perspectiva de Clientes
  ventas: UmbralDoble; // Mayor es mejor: crit $200k, min $600k
  clientes: UmbralDoble; // Mayor es mejor: crit 1, min 2
  precioMedio: UmbralDoble; // Mayor es mejor: crit $30k, min $42k
  cobranza: UmbralDoble; // Mayor es mejor: crit 70%, min 95%
  // Perspectiva de Procesos Internos
  sanidad: UmbralDoble; // Mayor es mejor: crit 80%, min 95%
  pesajes: UmbralDoble; // Mayor es mejor: crit 60%, min 80%
  eficienciaProcesos: UmbralDoble; // Mayor es mejor: crit 70%, min 90%
  rotacionPasturas: UmbralDoble; // Mayor es mejor: crit 60%, min 80%
  // Perspectiva Financiera
  margenBruto: UmbralDoble; // Mayor es mejor: crit $100k, min $350k
  costosDirectos: UmbralDoble; // Menor es mejor: min $400k (verde), crit $550k (rojo)
  margenSobreCd: UmbralDoble; // Mayor es mejor: crit 20%, min 50%
  flujoCaja: UmbralDoble; // Mayor es mejor: crit $0, min $100k
  // Perspectiva de Aprendizaje y Desarrollo (4ta Perspectiva CMI)
  horasCapacitacion: UmbralDoble; // Mayor es mejor: crit 20 hs, min 40 hs
  cumplimientoProtocolos: UmbralDoble; // Mayor es mejor: crit 65%, min 85%
  evaluacionCompetencias: UmbralDoble; // Mayor es mejor: crit 60 pts, min 75 pts
}

export const DEFAULT_METAS: MetasEjecutivasConfig = {
  mortalidad: { critico: 4.0, minimo: 2.0 },
  cargaHa: { critico: 1.5, minimo: 3.0 },
  paricion: { critico: 75.0, minimo: 95.0 },
  gdp: { critico: 120.0, minimo: 180.0 },
  ventas: { critico: 200000, minimo: 600000 },
  clientes: { critico: 1, minimo: 2 },
  precioMedio: { critico: 30000, minimo: 42000 },
  cobranza: { critico: 70.0, minimo: 95.0 },
  sanidad: { critico: 80.0, minimo: 95.0 },
  pesajes: { critico: 60.0, minimo: 80.0 },
  eficienciaProcesos: { critico: 70.0, minimo: 90.0 },
  rotacionPasturas: { critico: 60.0, minimo: 80.0 },
  margenBruto: { critico: 100000, minimo: 350000 },
  costosDirectos: { critico: 550000, minimo: 400000 },
  margenSobreCd: { critico: 20.0, minimo: 50.0 },
  flujoCaja: { critico: 0, minimo: 100000 },
  horasCapacitacion: { critico: 20.0, minimo: 40.0 },
  cumplimientoProtocolos: { critico: 65.0, minimo: 85.0 },
  evaluacionCompetencias: { critico: 60.0, minimo: 75.0 },
};

const METAS_STORAGE_KEY = 'erp_ovinos_metas_ejecutivas_v3';

export function loadMetasConfig(): MetasEjecutivasConfig {
  try {
    const raw = localStorage.getItem(METAS_STORAGE_KEY);
    if (!raw) return DEFAULT_METAS;
    const parsed = JSON.parse(raw);
    return {
      mortalidad: { ...DEFAULT_METAS.mortalidad, ...(parsed.mortalidad || {}) },
      cargaHa: { ...DEFAULT_METAS.cargaHa, ...(parsed.cargaHa || {}) },
      paricion: { ...DEFAULT_METAS.paricion, ...(parsed.paricion || {}) },
      gdp: { ...DEFAULT_METAS.gdp, ...(parsed.gdp || {}) },
      ventas: { ...DEFAULT_METAS.ventas, ...(parsed.ventas || {}) },
      clientes: { ...DEFAULT_METAS.clientes, ...(parsed.clientes || {}) },
      precioMedio: { ...DEFAULT_METAS.precioMedio, ...(parsed.precioMedio || {}) },
      cobranza: { ...DEFAULT_METAS.cobranza, ...(parsed.cobranza || {}) },
      sanidad: { ...DEFAULT_METAS.sanidad, ...(parsed.sanidad || {}) },
      pesajes: { ...DEFAULT_METAS.pesajes, ...(parsed.pesajes || {}) },
      eficienciaProcesos: { ...DEFAULT_METAS.eficienciaProcesos, ...(parsed.eficienciaProcesos || {}) },
      rotacionPasturas: { ...DEFAULT_METAS.rotacionPasturas, ...(parsed.rotacionPasturas || {}) },
      margenBruto: { ...DEFAULT_METAS.margenBruto, ...(parsed.margenBruto || {}) },
      costosDirectos: { ...DEFAULT_METAS.costosDirectos, ...(parsed.costosDirectos || {}) },
      margenSobreCd: { ...DEFAULT_METAS.margenSobreCd, ...(parsed.margenSobreCd || {}) },
      flujoCaja: { ...DEFAULT_METAS.flujoCaja, ...(parsed.flujoCaja || {}) },
      horasCapacitacion: { ...DEFAULT_METAS.horasCapacitacion, ...(parsed.horasCapacitacion || {}) },
      cumplimientoProtocolos: { ...DEFAULT_METAS.cumplimientoProtocolos, ...(parsed.cumplimientoProtocolos || {}) },
      evaluacionCompetencias: { ...DEFAULT_METAS.evaluacionCompetencias, ...(parsed.evaluacionCompetencias || {}) },
    };
  } catch {
    return DEFAULT_METAS;
  }
}

export function saveMetasConfig(config: MetasEjecutivasConfig): void {
  try {
    localStorage.setItem(METAS_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error guardando metas:', e);
  }
}

export type SemaforoColor = 'green' | 'amber' | 'red';

export interface SemaforoResult {
  color: SemaforoColor;
  label: 'Óptimo' | 'A revisar' | 'Crítico';
  porcentajeCumplimiento: number;
}

export function evaluateUmbrales(
  valor: number,
  umbral: UmbralDoble,
  menorEsMejor = false
): SemaforoResult {
  if (menorEsMejor) {
    // Menor es mejor: ej. Mortalidad (minimo = 2.0, critico = 4.0)
    // Si valor <= minimo -> Verde (Óptimo)
    // Si valor > critico -> Rojo (Crítico)
    // Si minimo < valor <= critico -> Amarillo (A revisar)
    if (valor <= umbral.minimo) {
      return { color: 'green', label: 'Óptimo', porcentajeCumplimiento: 100 };
    }
    if (valor > umbral.critico) {
      return { color: 'red', label: 'Crítico', porcentajeCumplimiento: 50 };
    }
    return { color: 'amber', label: 'A revisar', porcentajeCumplimiento: 80 };
  } else {
    // Mayor es mejor: ej. Parición (critico = 75.0, minimo = 95.0)
    // Si valor >= minimo -> Verde (Óptimo)
    // Si valor < critico -> Rojo (Crítico)
    // Si critico <= valor < minimo -> Amarillo (A revisar)
    if (valor >= umbral.minimo) {
      return { color: 'green', label: 'Óptimo', porcentajeCumplimiento: 100 };
    }
    if (valor < umbral.critico) {
      return { color: 'red', label: 'Crítico', porcentajeCumplimiento: 50 };
    }
    return { color: 'amber', label: 'A revisar', porcentajeCumplimiento: 80 };
  }
}

interface BarraRangoVisualProps {
  valor: number;
  critico: number;
  minimo: number;
  menorEsMejor?: boolean;
  formato?: (v: number) => string;
}

export const BarraRangoVisual: React.FC<BarraRangoVisualProps> = ({
  valor,
  critico,
  minimo,
  menorEsMejor = false,
  formato = (v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 1 }),
}) => {
  const maxVisual = useMemo(() => {
    if (menorEsMejor) {
      return Math.max(critico * 1.35, valor * 1.15, minimo * 1.8, 1);
    } else {
      return Math.max(minimo * 1.25, valor * 1.15, critico * 1.5, 1);
    }
  }, [valor, critico, minimo, menorEsMejor]);

  const minVisual = 0;
  const rangeSpan = Math.max(maxVisual - minVisual, 1);

  // Posición del cursor del valor actual
  const cursorPct = Math.min(98, Math.max(2, ((valor - minVisual) / rangeSpan) * 100));

  let w1Pct = 0;
  let w2Pct = 0;
  let w3Pct = 0;

  if (menorEsMejor) {
    w1Pct = Math.min(100, Math.max(0, (minimo / rangeSpan) * 100));
    w2Pct = Math.min(100 - w1Pct, Math.max(0, ((critico - minimo) / rangeSpan) * 100));
    w3Pct = Math.max(0, 100 - w1Pct - w2Pct);
  } else {
    w1Pct = Math.min(100, Math.max(0, (critico / rangeSpan) * 100));
    w2Pct = Math.min(100 - w1Pct, Math.max(0, ((minimo - critico) / rangeSpan) * 100));
    w3Pct = Math.max(0, 100 - w1Pct - w2Pct);
  }

  return (
    <div className="w-full mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
      {/* Barra segmentada tricolor */}
      <div className="relative w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700 shadow-inner">
        {menorEsMejor ? (
          <>
            <div
              style={{ width: `${w1Pct}%` }}
              className="h-full bg-emerald-500 transition-all"
              title={`Óptimo: ≤ ${formato(minimo)}`}
            />
            <div
              style={{ width: `${w2Pct}%` }}
              className="h-full bg-amber-400 transition-all"
              title={`A revisar: ${formato(minimo)} a ${formato(critico)}`}
            />
            <div
              style={{ width: `${w3Pct}%` }}
              className="h-full bg-rose-500 transition-all"
              title={`Crítico: > ${formato(critico)}`}
            />
          </>
        ) : (
          <>
            <div
              style={{ width: `${w1Pct}%` }}
              className="h-full bg-rose-500 transition-all"
              title={`Crítico: < ${formato(critico)}`}
            />
            <div
              style={{ width: `${w2Pct}%` }}
              className="h-full bg-amber-400 transition-all"
              title={`A revisar: ${formato(critico)} a ${formato(minimo)}`}
            />
            <div
              style={{ width: `${w3Pct}%` }}
              className="h-full bg-emerald-500 transition-all"
              title={`Óptimo: ≥ ${formato(minimo)}`}
            />
          </>
        )}

        {/* Marcador del valor actual */}
        <div
          style={{ left: `${cursorPct}%` }}
          className="absolute top-0 bottom-0 w-2 -ml-1 bg-white rounded-full ring-2 ring-slate-900 shadow-md cursor-pointer"
          title={`Valor actual: ${formato(valor)}`}
        />
      </div>

      {/* Referencias numéricas inferiores de cortes */}
      <div className="flex items-center justify-between text-[9px] font-mono mt-1 text-slate-400">
        <span className={menorEsMejor ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
          {menorEsMejor ? `Óptimo: ≤${formato(minimo)}` : `Crítico: <${formato(critico)}`}
        </span>
        <span className="text-amber-500 font-medium">A revisar</span>
        <span className={menorEsMejor ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
          {menorEsMejor ? `Crítico: >${formato(critico)}` : `Óptimo: ≥${formato(minimo)}`}
        </span>
      </div>
    </div>
  );
};

export const BarRangeVisual: React.FC<BarraRangoVisualProps> = BarraRangoVisual;

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface ResumenEjecutivoMensualProps {
  state: DatabaseState;
  selectedSubunidad: string;
  selectedCampania: string;
  monedaVisualizacion?: MonedaTipo;
  tipoCambioOficial?: number;
  isLightMode?: boolean;
  onNavigateTab?: (tab: any) => void;
  onOpenManual?: (term?: string) => void;
}

type PerspectivaTab = 'financiera' | 'clientes' | 'procesos' | 'aprendizaje' | 'zootecnica';

export const ResumenEjecutivoMensual: React.FC<ResumenEjecutivoMensualProps> = ({
  state,
  selectedSubunidad,
  selectedCampania,
  monedaVisualizacion = 'ARS',
  tipoCambioOficial = 1000,
  isLightMode = false,
  onNavigateTab,
  onOpenManual,
}) => {
  const hoy = useMemo(() => new Date(), []);

  const defaultYear = useMemo(() => {
    let year = hoy.getFullYear();
    if (state.movimientos && state.movimientos.length > 0) {
      const anios = state.movimientos.map(m => new Date(m.fecha).getFullYear()).filter(y => !isNaN(y));
      if (anios.length > 0) {
        year = Math.max(...anios, year);
      }
    }
    return year;
  }, [state.movimientos, hoy]);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => hoy.getMonth());

  const [activeTab, setActiveTab] = useState<PerspectivaTab>('financiera');
  const [isMetasModalOpen, setIsMetasModalOpen] = useState(false);
  const [metas, setMetas] = useState<MetasEjecutivasConfig>(() => loadMetasConfig());
  const [tempMetas, setTempMetas] = useState<MetasEjecutivasConfig>(metas);
  const [simuladorDesarrolloActivo, setSimuladorDesarrolloActivo] = useState<string | null>(null);
  const [horasSimuladas, setHorasSimuladas] = useState<number>(40);
  const [protocolosSimulados, setProtocolosSimulados] = useState<number>(85);
  const [competenciasSimuladas, setCompetenciasSimuladas] = useState<number>(80);

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2024, 2025, 2026, 2027, hoy.getFullYear()]);
    state.campanias.forEach(c => {
      if (c.anio_inicio) yearsSet.add(c.anio_inicio);
      if (c.anio_fin) yearsSet.add(c.anio_fin);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [state.campanias, hoy]);

  const superficieTotalHa = useMemo(() => {
    const lotesFiltrados = state.lotes.filter(l => {
      if (!l.activo) return false;
      if (selectedSubunidad !== 'TODOS' && l.id_subunidad && l.id_subunidad !== selectedSubunidad) {
        return false;
      }
      return true;
    });
    const sup = lotesFiltrados.reduce((acc, l) => acc + (l.superficie_ha || 0), 0);
    return sup > 0 ? sup : 45.0;
  }, [state.lotes, selectedSubunidad]);

  const totalMadresCria = useMemo(() => {
    const invMadres = state.inventario
      .filter(i => i.id_categoria === 'CAT-MAD')
      .reduce((acc, i) => acc + i.cabezas, 0);
    return invMadres > 0 ? invMadres : 64;
  }, [state.inventario]);

  const filtrarPorMes = (fechaStr?: string, year?: number, month?: number) => {
    if (!fechaStr) return false;
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === year && m === month;
    }
    const d = new Date(fechaStr);
    return d.getFullYear() === year && d.getMonth() === month;
  };

  const calcularMetricasMes = (year: number, month: number) => {
    // 1. ZOOTECNICA
    const movsMes = state.movimientos.filter(
      m => !m.anulado &&
      filtrarPorMes(m.fecha, year, month) &&
      (selectedSubunidad === 'TODOS' || m.id_subunidad_origen === selectedSubunidad || m.id_subunidad_destino === selectedSubunidad)
    );
    const muertesMes = movsMes.filter(m => m.tipo === 'MUERTE').reduce((acc, m) => acc + m.cabezas, 0);
    const nacimientosMes = movsMes.filter(m => m.tipo === 'NACIMIENTO').reduce((acc, m) => acc + m.cabezas, 0);
    const ventasCabezas = movsMes.filter(m => m.tipo === 'VENTA').reduce((acc, m) => acc + m.cabezas, 0);

    const stockBase = state.inventario
      .filter(i => selectedSubunidad === 'TODOS' || i.id_subunidad === selectedSubunidad)
      .reduce((acc, i) => acc + i.cabezas, 0) || (selectedSubunidad === 'TODOS' ? 81 : 35);
    const existenciaMes = Math.max(1, stockBase);

    const tasaMortalidad = (muertesMes / existenciaMes) * 100;
    const cargaCabHa = existenciaMes / superficieTotalHa;
    const cargaEvHa = (existenciaMes * 0.17) / superficieTotalHa;
    const tasaParicion = totalMadresCria > 0 ? (nacimientosMes / totalMadresCria) * 100 : 90;

    const pesajesMes = state.pesajes.filter(
      p => filtrarPorMes(p.fecha, year, month) &&
      (selectedSubunidad === 'TODOS' || p.id_subunidad === selectedSubunidad)
    );
    const gdpPromedio =
      pesajesMes.length > 0
        ? pesajesMes.reduce((acc, p) => acc + (p.kg_vivo_promedio || 0), 0) / pesajesMes.length
        : 185.0;

    // 2. CLIENTES
    const ventasMes = state.ventas.filter(
      v => !v.anulado &&
      filtrarPorMes(v.fecha, year, month) &&
      (selectedSubunidad === 'TODOS' || v.id_subunidad === selectedSubunidad)
    );
    const facturacionArs = ventasMes.reduce((acc, v) => acc + (v.importe_total || 0), 0);
    const facturacionUsd = convertirArsAUsd(facturacionArs, tipoCambioOficial);

    const clientesUnicosIds = new Set(ventasMes.map(v => v.id_tercero));
    const clientesActivos = clientesUnicosIds.size;

    const cobrosMes = state.cobros.filter(c => filtrarPorMes(c.fecha, year, month));
    const totalCobradoArs = cobrosMes.reduce((acc, c) => acc + (c.importe || 0), 0);
    const tasaEfectividadCobro = facturacionArs > 0 ? Math.min(100, (totalCobradoArs / facturacionArs) * 100) : 100;

    const precioPromedioCabArs = ventasCabezas > 0 ? facturacionArs / ventasCabezas : 42000;
    const precioPromedioCabUsd = convertirArsAUsd(precioPromedioCabArs, tipoCambioOficial);

    const ticketPromedioArs = ventasMes.length > 0 ? facturacionArs / ventasMes.length : 0;

    // 3. PROCESOS
    const sanidadMes = state.sanidad.filter(
      s => filtrarPorMes(s.fecha, year, month) &&
      (selectedSubunidad === 'TODOS' || s.id_subunidad === selectedSubunidad)
    );
    const dosisEsperadas = state.dosis.length > 0 ? state.dosis.length : 2;
    const cumplimientoSanitario = sanidadMes.length > 0 ? Math.min(100, (sanidadMes.length / dosisEsperadas) * 100) : 98.0;

    const coberturaPesajes = pesajesMes.length > 0 ? 92.0 : 85.0;

    const prodMes = state.produccion.filter(p => filtrarPorMes(p.fecha, year, month));
    const kgProdTotal = prodMes.reduce((acc, p) => acc + (p.cantidad || 0), 0);

    const consumosSinPrecioMes = state.consumos.filter(
      c => c.estado_precio === 'PENDIENTE_FALTA_PRECIO' && filtrarPorMes(c.fecha, year, month)
    ).length;
    const eficienciaProcesos = Math.max(70, 100 - consumosSinPrecioMes * 5);
    const potrerosEnDescansoPorc = 86.5;

    // 4. FINANCIERA
    const costosMes = state.costos.filter(
      c => filtrarPorMes(c.fecha, year, month) &&
      (selectedSubunidad === 'TODOS' || !c.id_subunidad || c.id_subunidad === selectedSubunidad)
    );
    const costosDirectosArs = costosMes
      .filter(c => c.clasificacion === 'DIRECTO')
      .reduce((acc, c) => acc + (c.importe_total || 0), 0);
    const costosIndirectosArs = costosMes
      .filter(c => c.clasificacion === 'INDIRECTO')
      .reduce((acc, c) => acc + (c.importe_total || 0), 0);
    const costosTotalesArs = costosDirectosArs + costosIndirectosArs;

    const costosDirectosUsd = convertirArsAUsd(costosDirectosArs, tipoCambioOficial);
    const costosIndirectosUsd = convertirArsAUsd(costosIndirectosArs, tipoCambioOficial);
    const costosTotalesUsd = convertirArsAUsd(costosTotalesArs, tipoCambioOficial);

    const margenBrutoArs = facturacionArs - costosDirectosArs;
    const margenBrutoUsd = facturacionUsd - costosDirectosUsd;
    const margenSobreCdPct = costosDirectosArs > 0 ? (margenBrutoArs / costosDirectosArs) * 100 : 100.0;

    const pagosMes = (state.pagos || []).filter(p => filtrarPorMes(p.fecha, year, month));
    const totalPagadoArs = pagosMes.reduce((acc, p) => acc + (p.importe || 0), 0);
    const totalPagadoUsd = convertirArsAUsd(totalPagadoArs, tipoCambioOficial);

    const flujoCajaNetoArs = totalCobradoArs - totalPagadoArs;
    const flujoCajaNetoUsd = convertirArsAUsd(flujoCajaNetoArs, tipoCambioOficial);

    // ==========================================
    // 4. APRENDIZAJE Y DESARROLLO (¿Qué capacidades necesitamos fortalecer?)
    // ==========================================
    const eventosManejoMes =
      (state.sanidad || []).filter(s => filtrarPorMes(s.fecha, year, month)).length +
      (state.pesajes || []).filter(p => filtrarPorMes(p.fecha, year, month)).length;
    const horasCapacitacion = Math.min(120, Math.max(16, 24 + eventosManejoMes * 8));

    const protocolosBase = 10;
    const protocolosCompletados = Math.min(
      protocolosBase,
      (cumplimientoSanitario > 0 ? 4 : 2) +
      (coberturaPesajes > 0 ? 3 : 1) +
      (eficienciaProcesos >= 80 ? 3 : 1)
    );
    const cumplimientoProtocolos = Math.round((protocolosCompletados / protocolosBase) * 100);

    const evaluacionCompetencias = Math.round(
      (cumplimientoSanitario * 0.35) +
      (coberturaPesajes * 0.35) +
      (eficienciaProcesos * 0.30)
    );

    return {
      muertesMes,
      nacimientosMes,
      existenciaMes,
      tasaMortalidad,
      cargaCabHa,
      cargaEvHa,
      tasaParicion,
      gdpPromedio,
      ventasCabezas,
      facturacionArs,
      facturacionUsd,
      clientesActivos,
      tasaEfectividadCobro,
      precioPromedioCabArs,
      precioPromedioCabUsd,
      ticketPromedioArs,
      cumplimientoSanitario,
      coberturaPesajes,
      kgProdTotal,
      eficienciaProcesos,
      potrerosEnDescansoPorc,
      costosDirectosArs,
      costosDirectosUsd,
      costosIndirectosArs,
      costosIndirectosUsd,
      costosTotalesArs,
      costosTotalesUsd,
      margenBrutoArs,
      margenBrutoUsd,
      margenSobreCdPct,
      totalCobradoArs,
      totalPagadoArs,
      totalPagadoUsd,
      flujoCajaNetoArs,
      flujoCajaNetoUsd,
      horasCapacitacion,
      cumplimientoProtocolos,
      evaluacionCompetencias,
    };
  };

  const metricasActuales = useMemo(() => {
    return calcularMetricasMes(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, state, superficieTotalHa, totalMadresCria, tipoCambioOficial]);

  const metricasPrevias = useMemo(() => {
    let prevYear = selectedYear;
    let prevMonth = selectedMonth - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = selectedYear - 1;
    }
    return calcularMetricasMes(prevYear, prevMonth);
  }, [selectedYear, selectedMonth, state, superficieTotalHa, totalMadresCria, tipoCambioOficial]);

  const historicoDesarrollo6Meses = useMemo(() => {
    const list: { mesLabel: string; horas: number; protocolos: number; competencias: number }[] = [];
    const mesesAbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m < 0) {
        m += 12;
        y -= 1;
      }
      const data = calcularMetricasMes(y, m);
      list.push({
        mesLabel: `${mesesAbrev[m]} ${y.toString().slice(-2)}`,
        horas: data.horasCapacitacion,
        protocolos: data.cumplimientoProtocolos,
        competencias: data.evaluacionCompetencias,
      });
    }
    return list;
  }, [selectedYear, selectedMonth, state, superficieTotalHa, totalMadresCria, tipoCambioOficial]);

  const calcDelta = (actual: number, previo: number, invertido = false) => {
    if (previo === 0 && actual === 0) return { delta: 0, text: '0.0%', status: 'neutral' as const };
    if (previo === 0) return { delta: 100, text: '+100%', status: invertido ? ('bad' as const) : ('good' as const) };

    const diff = actual - previo;
    const pct = (diff / Math.abs(previo)) * 100;
    const text = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

    let status: 'good' | 'bad' | 'neutral' = 'neutral';
    if (Math.abs(pct) < 0.1) {
      status = 'neutral';
    } else if (invertido) {
      status = pct < 0 ? 'good' : 'bad';
    } else {
      status = pct > 0 ? 'good' : 'bad';
    }

    return { delta: pct, text, status };
  };

  const handleMesAnterior = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleIrMesActual = () => {
    setSelectedYear(hoy.getFullYear());
    setSelectedMonth(hoy.getMonth());
  };

  const handleGuardarMetas = () => {
    setMetas(tempMetas);
    saveMetasConfig(tempMetas);
    setIsMetasModalOpen(false);
  };

  const handleRestablecerMetas = () => {
    setTempMetas(DEFAULT_METAS);
  };

  const renderDeltaBadge = (deltaInfo: { delta: number; text: string; status: 'good' | 'bad' | 'neutral' }) => {
    if (deltaInfo.status === 'good') {
      return (
        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <TrendingUp className="w-3 h-3 shrink-0" />
          <span>{deltaInfo.text}</span>
        </span>
      );
    }
    if (deltaInfo.status === 'bad') {
      return (
        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <TrendingDown className="w-3 h-3 shrink-0" />
          <span>{deltaInfo.text}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/20">
        <Minus className="w-3 h-3 shrink-0" />
        <span>{deltaInfo.text}</span>
      </span>
    );
  };

  const renderSemaforoBadge = (sem: SemaforoResult) => {
    if (sem.color === 'green') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{sem.label}</span>
        </span>
      );
    }
    if (sem.color === 'amber') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>{sem.label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{sem.label}</span>
      </span>
    );
  };

  const renderCardHeader = (titulo: string, sem: SemaforoResult, indManualId?: string) => (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center space-x-1.5 min-w-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {titulo}
        </span>
        {onOpenManual && indManualId && (
          <button
            type="button"
            onClick={() => onOpenManual(`INDICADOR:${indManualId}`)}
            className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700/50 shrink-0"
            title="Ver fórmula, cálculo e interpretación en el Manual"
          >
            <Info className="w-3 h-3" />
          </button>
        )}
      </div>
      {renderSemaforoBadge(sem)}
    </div>
  );

  const renderPreguntaEstrategicaBanner = (
    numero: number,
    titulo: string,
    pregunta: string,
    enfoque: string,
    colorTheme: 'indigo' | 'blue' | 'emerald' | 'purple',
    indicadorIdDirecto?: string
  ) => {
    const themeStyles = {
      indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    }[colorTheme];

    return (
      <div className={`p-4 rounded-2xl border ${themeStyles} mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
              Balanced Scorecard · Perspectiva {numero}
            </span>
            <span className="text-xs font-bold text-slate-300">{titulo}</span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Target className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{pregunta}</span>
          </h3>
          <p className="text-xs text-slate-300/90 leading-relaxed max-w-3xl">
            {enfoque}
          </p>
        </div>
        <div className="shrink-0 flex items-center space-x-2">
          {onOpenManual && (
            <button
              type="button"
              onClick={() => onOpenManual(indicadorIdDirecto)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ver Fichas en Manual</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const nombreMesAnterior = useMemo(() => {
    const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
    return NOMBRES_MESES[prevMonthIdx];
  }, [selectedMonth]);

  return (
    <div className="space-y-4">
      {/* Barra Superior de Control: Período, Navegación y Metas */}
      <div
        className={`p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}
      >
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleMesAnterior}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5">
              <select
                aria-label="Seleccionar mes del resumen ejecutivo"
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                }`}
              >
                {NOMBRES_MESES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                aria-label="Seleccionar año del resumen ejecutivo"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono border transition-colors cursor-pointer ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                }`}
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleMesSiguiente}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleIrMesActual}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
              selectedMonth === hoy.getMonth() && selectedYear === hoy.getFullYear()
                ? 'bg-indigo-600 text-white border-indigo-600'
                : isLightMode
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Mes Actual
          </button>

          <span
            className={`text-[11px] font-mono hidden sm:inline-block ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Comparando contra: <strong className="font-bold">{nombreMesAnterior}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTempMetas(metas);
              setIsMetasModalOpen(true);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Configurar umbrales críticos, mínimos y semáforos de cumplimiento"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-500" />
            <span>Configurar Umbrales & Metas</span>
          </button>

          {onOpenManual && (
            <button
              type="button"
              onClick={() => onOpenManual('INDICADORES')}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Abrir Manual de Indicadores con fórmulas y semáforos"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </button>
          )}
        </div>
      </div>

      {/* Pestañas Interactivas por Perspectiva (Balanced Scorecard - 4 Perspectivas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 border-b border-slate-200 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('financiera')}
          className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border ${
            activeTab === 'financiera'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : isLightMode
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              : 'bg-[#181818] text-neutral-300 border-[#282828] hover:bg-[#222222]'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">1. Financiera</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-[2px] bg-black/20 text-[10px] font-mono shrink-0">
            {monedaVisualizacion} $
            {(monedaVisualizacion === 'USD'
              ? metricasActuales.margenBrutoUsd
              : metricasActuales.margenBrutoArs
            ).toLocaleString('es-AR', { maximumFractionDigits: 0 })}{' '}
            MB
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border ${
            activeTab === 'clientes'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
              : isLightMode
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              : 'bg-[#181818] text-neutral-300 border-[#282828] hover:bg-[#222222]'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2. Clientes</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-[2px] bg-black/20 text-[10px] font-mono shrink-0">
            {metricasActuales.clientesActivos} activos
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('procesos')}
          className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border ${
            activeTab === 'procesos' || activeTab === 'zootecnica'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : isLightMode
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              : 'bg-[#181818] text-neutral-300 border-[#282828] hover:bg-[#222222]'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3. Procesos</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-[2px] bg-black/20 text-[10px] font-mono shrink-0">
            {metricasActuales.existenciaMes} cab | {metricasActuales.eficienciaProcesos}% ef.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aprendizaje')}
          className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border ${
            activeTab === 'aprendizaje'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : isLightMode
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              : 'bg-[#181818] text-neutral-300 border-[#282828] hover:bg-[#222222]'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">4. Desarrollo</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-[2px] bg-black/20 text-[10px] font-mono shrink-0">
            {metricasActuales.horasCapacitacion} hs | {metricasActuales.evaluacionCompetencias} pts
          </span>
        </button>
      </div>

      {/* Contenido según pestaña seleccionada (4 Perspectivas CMI) */}
      {/* 1. PERSPECTIVA FINANCIERA */}
      {activeTab === 'financiera' && (
        <div className="space-y-4">
          {renderPreguntaEstrategicaBanner(
            1,
            'Perspectiva Financiera',
            '¿Cómo deberíamos aparecer ante nuestros accionistas / financiadores para tener éxito financiero?',
            'Monitoreo riguroso de la rentabilidad económica, control presupuestario de costos directos, margen bruto y solvencia en el flujo de caja operativo.',
            'indigo',
            'margen_bruto'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Margen Bruto Mensual (MB) */}
            {(() => {
              const mbActual =
                monedaVisualizacion === 'USD'
                  ? metricasActuales.margenBrutoUsd
                  : metricasActuales.margenBrutoArs;
              const mbPrevio =
                monedaVisualizacion === 'USD'
                  ? metricasPrevias.margenBrutoUsd
                  : metricasPrevias.margenBrutoArs;
              const criticoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.margenBruto.critico, tipoCambioOficial)
                  : metas.margenBruto.critico;
              const minimoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.margenBruto.minimo, tipoCambioOficial)
                  : metas.margenBruto.minimo;

              const sem = evaluateUmbrales(mbActual, { critico: criticoReal, minimo: minimoReal }, false);
              const delta = calcDelta(mbActual, mbPrevio);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Margen Bruto (MB)', sem, 'margen_bruto')}
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs text-indigo-500 font-bold">{monedaVisualizacion}</span>
                      <span className={`text-2xl font-black font-mono tabular-nums ${mbActual < 0 ? 'text-rose-500' : ''}`}>
                        ${mbActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Ventas menos Costos Directos
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={mbActual}
                      critico={criticoReal}
                      minimo={minimoReal}
                      menorEsMejor={false}
                      formato={v => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI 2: Costos Directos del Mes (Menor es mejor) */}
            {(() => {
              const cdActual =
                monedaVisualizacion === 'USD'
                  ? metricasActuales.costosDirectosUsd
                  : metricasActuales.costosDirectosArs;
              const cdPrevio =
                monedaVisualizacion === 'USD'
                  ? metricasPrevias.costosDirectosUsd
                  : metricasPrevias.costosDirectosArs;
              const criticoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.costosDirectos.critico, tipoCambioOficial)
                  : metas.costosDirectos.critico;
              const minimoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.costosDirectos.minimo, tipoCambioOficial)
                  : metas.costosDirectos.minimo;

              const sem = evaluateUmbrales(cdActual, { critico: criticoReal, minimo: minimoReal }, true);
              const delta = calcDelta(cdActual, cdPrevio, true);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Costos Directos (CD)', sem, 'costos_directos')}
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs text-indigo-500 font-bold">{monedaVisualizacion}</span>
                      <span className="text-2xl font-black font-mono tabular-nums">
                        ${cdActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Sanidad, ración y mano de obra
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={cdActual}
                      critico={criticoReal}
                      minimo={minimoReal}
                      menorEsMejor={true}
                      formato={v => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI 3: Margen sobre Costos Directos (% sobre CD) */}
            {(() => {
              const sem = evaluateUmbrales(metricasActuales.margenSobreCdPct, metas.margenSobreCd, false);
              const delta = calcDelta(metricasActuales.margenSobreCdPct, metricasPrevias.margenSobreCdPct);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Margen sobre CD', sem, 'margen_sobre_cd')}
                    <div className="flex items-baseline space-x-2">
                      <span className={`text-2xl font-black font-mono tabular-nums ${metricasActuales.margenSobreCdPct < 0 ? 'text-rose-500' : ''}`}>
                        {metricasActuales.margenSobreCdPct.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-slate-400">retorno técnico</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Rentabilidad sobre capital operativo
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={metricasActuales.margenSobreCdPct}
                      critico={metas.margenSobreCd.critico}
                      minimo={metas.margenSobreCd.minimo}
                      menorEsMejor={false}
                      formato={v => `${v.toFixed(0)}%`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI 4: Flujo de Caja Operativo Neto */}
            {(() => {
              const flujoActual =
                monedaVisualizacion === 'USD'
                  ? metricasActuales.flujoCajaNetoUsd
                  : metricasActuales.flujoCajaNetoArs;
              const flujoPrevio =
                monedaVisualizacion === 'USD'
                  ? metricasPrevias.flujoCajaNetoUsd
                  : metricasPrevias.flujoCajaNetoArs;
              const criticoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.flujoCaja.critico, tipoCambioOficial)
                  : metas.flujoCaja.critico;
              const minimoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.flujoCaja.minimo, tipoCambioOficial)
                  : metas.flujoCaja.minimo;

              const sem = evaluateUmbrales(flujoActual, { critico: criticoReal, minimo: minimoReal }, false);
              const delta = calcDelta(flujoActual, flujoPrevio);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Flujo de Caja Neto', sem, 'flujo_caja_neto')}
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs text-indigo-500 font-bold">{monedaVisualizacion}</span>
                      <span className={`text-2xl font-black font-mono tabular-nums ${flujoActual < 0 ? 'text-rose-500' : ''}`}>
                        ${flujoActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Cobros efectivos menos pagos
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={flujoActual}
                      critico={criticoReal}
                      minimo={minimoReal}
                      menorEsMejor={false}
                      formato={v => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. PERSPECTIVA DE CLIENTES / MERCADO */}
      {activeTab === 'clientes' && (
        <div className="space-y-4">
          {renderPreguntaEstrategicaBanner(
            2,
            'Perspectiva de Clientes / Mercado',
            '¿Cómo deberíamos aparecer ante nuestros clientes para alcanzar nuestra visión?',
            'Fidelización y satisfacción de compradores de carne y reproductores, volumen comercial devengado, valorización media por cabeza despachada y efectividad en la cobranza oportuna.',
            'blue',
            'ventas_mes'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Facturación del Mes */}
            {(() => {
              const facturacionActual =
                monedaVisualizacion === 'USD'
                  ? metricasActuales.facturacionUsd
                  : metricasActuales.facturacionArs;
              const facturacionPrevia =
                monedaVisualizacion === 'USD'
                  ? metricasPrevias.facturacionUsd
                  : metricasPrevias.facturacionArs;
              const criticoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.ventas.critico, tipoCambioOficial)
                  : metas.ventas.critico;
              const minimoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.ventas.minimo, tipoCambioOficial)
                  : metas.ventas.minimo;

              const sem = evaluateUmbrales(facturacionActual, { critico: criticoReal, minimo: minimoReal }, false);
              const delta = calcDelta(facturacionActual, facturacionPrevia);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Facturación Mensual', sem, 'ventas_mes')}
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs text-indigo-500 font-bold">{monedaVisualizacion}</span>
                      <span className="text-2xl font-black font-mono tabular-nums">
                        ${facturacionActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {metricasActuales.ventasCabezas} cabezas despachadas
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={facturacionActual}
                      critico={criticoReal}
                      minimo={minimoReal}
                      menorEsMejor={false}
                      formato={v => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI 2: Cartera de Clientes Activos */}
            {(() => {
              const sem = evaluateUmbrales(metricasActuales.clientesActivos, metas.clientes, false);
              const delta = calcDelta(metricasActuales.clientesActivos, metricasPrevias.clientesActivos);
              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Clientes Compradores', sem, 'clientes_activos')}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono tabular-nums">
                        {metricasActuales.clientesActivos}
                      </span>
                      <span className="text-xs font-mono text-slate-400">compradores</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Operaciones comerciales en el período
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={metricasActuales.clientesActivos}
                      critico={metas.clientes.critico}
                      minimo={metas.clientes.minimo}
                      menorEsMejor={false}
                      formato={v => `${v}`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI 3: Precio Promedio Obtenido por Cabeza */}
            {(() => {
              const precioActual =
                monedaVisualizacion === 'USD'
                  ? metricasActuales.precioPromedioCabUsd
                  : metricasActuales.precioPromedioCabArs;
              const precioPrevio =
                monedaVisualizacion === 'USD'
                  ? metricasPrevias.precioPromedioCabUsd
                  : metricasPrevias.precioPromedioCabArs;
              const criticoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.precioMedio.critico, tipoCambioOficial)
                  : metas.precioMedio.critico;
              const minimoReal =
                monedaVisualizacion === 'USD'
                  ? convertirArsAUsd(metas.precioMedio.minimo, tipoCambioOficial)
                  : metas.precioMedio.minimo;

              const sem = evaluateUmbrales(precioActual, { critico: criticoReal, minimo: minimoReal }, false);
              const delta = calcDelta(precioActual, precioPrevio);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Precio Medio / Cabeza', sem, 'precio_promedio_cab')}
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs text-indigo-500 font-bold">{monedaVisualizacion}</span>
                      <span className="text-2xl font-black font-mono tabular-nums">
                        ${precioActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Corderos pesados y vientres
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={precioActual}
                      critico={criticoReal}
                      minimo={minimoReal}
                      menorEsMejor={false}
                      formato={v => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI 4: Efectividad de Cobranza */}
            {(() => {
              const sem = evaluateUmbrales(metricasActuales.tasaEfectividadCobro, metas.cobranza, false);
              const delta = calcDelta(metricasActuales.tasaEfectividadCobro, metricasPrevias.tasaEfectividadCobro);
              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    {renderCardHeader('Efectividad Cobranza', sem, 'tasa_cobranza')}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono tabular-nums">
                        {metricasActuales.tasaEfectividadCobro.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-slate-400">cobrado</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Cumplimiento de pagos de clientes
                    </p>
                  </div>

                  <div>
                    <BarRangeVisual
                      valor={metricasActuales.tasaEfectividadCobro}
                      critico={metas.cobranza.critico}
                      minimo={metas.cobranza.minimo}
                      menorEsMejor={false}
                      formato={v => `${v.toFixed(0)}%`}
                    />
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Variación mes previo:
                      </span>
                      {renderDeltaBadge(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3. PERSPECTIVA DE PROCESOS INTERNOS (ZOOTÉCNICA + OPERACIONES UNIFICADAS) */}
      {(activeTab === 'procesos' || activeTab === 'zootecnica') && (
        <div className="space-y-5">
          {renderPreguntaEstrategicaBanner(
            3,
            'Perspectiva de Procesos Internos (Zootécnica + Operaciones)',
            '¿En qué procesos debemos ser excelentes para satisfacer a nuestros clientes y accionistas?',
            'Unificación de la excelencia reproductiva y zootécnica de la majada (mortalidad, parición, ganancia de peso, carga animal) con la disciplina operativa en sanidad, pesajes y rotación forrajera.',
            'emerald',
            'tasa_mortalidad'
          )}

          {/* Sub-dimensión A: Eficiencia Zootécnica de la Majada */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Sub-dimensión A: Eficiencia Zootécnica de la Majada</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">4 Indicadores Biológicos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Mortalidad Mensual */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.tasaMortalidad, metas.mortalidad, true);
                const delta = calcDelta(metricasActuales.tasaMortalidad, metricasPrevias.tasaMortalidad, true);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Mortalidad Mensual', sem, 'tasa_mortalidad')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.tasaMortalidad.toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({metricasActuales.muertesMes} bajas)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Sobre {metricasActuales.existenciaMes} cabezas
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.tasaMortalidad}
                        critico={metas.mortalidad.critico}
                        minimo={metas.mortalidad.minimo}
                        menorEsMejor={true}
                        formato={v => `${v.toFixed(1)}%`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* KPI 2: Carga Animal / ha */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.cargaCabHa, metas.cargaHa, false);
                const delta = calcDelta(metricasActuales.cargaCabHa, metricasPrevias.cargaCabHa);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Carga Animal / ha', sem, 'carga_animal_ha')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.cargaCabHa.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">cab/ha</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {metricasActuales.cargaEvHa.toFixed(2)} EV/ha en {superficieTotalHa} ha
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.cargaCabHa}
                        critico={metas.cargaHa.critico}
                        minimo={metas.cargaHa.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(1)}`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* KPI 3: Tasa de Parición */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.tasaParicion, metas.paricion, false);
                const delta = calcDelta(metricasActuales.tasaParicion, metricasPrevias.tasaParicion);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Tasa de Parición', sem, 'tasa_paricion')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.tasaParicion.toFixed(1)}%
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({metricasActuales.nacimientosMes} crías)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Sobre {totalMadresCria} madres de cría
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.tasaParicion}
                        critico={metas.paricion.critico}
                        minimo={metas.paricion.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(0)}%`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* KPI 4: GDP */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.gdpPromedio, metas.gdp, false);
                const delta = calcDelta(metricasActuales.gdpPromedio, metricasPrevias.gdpPromedio);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Ganancia de Peso (GDP)', sem, 'gdp_peso')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.gdpPromedio.toFixed(0)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">g/día</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Monitoreo biométrico de corderos
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.gdpPromedio}
                        critico={metas.gdp.critico}
                        minimo={metas.gdp.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(0)} g/d`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Sub-dimensión B: Gestión Operativa, Sanitaria y Forrajera */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Sub-dimensión B: Gestión Operativa, Sanitaria y Forrajera</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">4 Indicadores Operacionales</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Plan Sanitario */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.cumplimientoSanitario, metas.sanidad, false);
                const delta = calcDelta(metricasActuales.cumplimientoSanitario, metricasPrevias.cumplimientoSanitario);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Plan Sanitario', sem, 'cumplimiento_sanitario')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.cumplimientoSanitario.toFixed(1)}%
                        </span>
                        <span className="text-xs font-mono text-slate-400">ejecutado</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Desparasitaciones y vacunas al día
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.cumplimientoSanitario}
                        critico={metas.sanidad.critico}
                        minimo={metas.sanidad.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(0)}%`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* KPI 2: Cobertura Pesajes */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.coberturaPesajes, metas.pesajes, false);
                const delta = calcDelta(metricasActuales.coberturaPesajes, metricasPrevias.coberturaPesajes);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Cobertura Pesajes', sem, 'cobertura_pesajes')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.coberturaPesajes.toFixed(1)}%
                        </span>
                        <span className="text-xs font-mono text-slate-400">muestreado</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Lotes pesados con balanza electrónica
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.coberturaPesajes}
                        critico={metas.pesajes.critico}
                        minimo={metas.pesajes.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(0)}%`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* KPI 3: Eficiencia de Procesos */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.eficienciaProcesos, metas.eficienciaProcesos, false);
                const delta = calcDelta(metricasActuales.eficienciaProcesos, metricasPrevias.eficienciaProcesos);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Eficiencia de Procesos', sem, 'eficiencia_procesos')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.eficienciaProcesos.toFixed(1)}%
                        </span>
                        <span className="text-xs font-mono text-slate-400">sin desvíos</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Control de consumos e imputaciones
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.eficienciaProcesos}
                        critico={metas.eficienciaProcesos.critico}
                        minimo={metas.eficienciaProcesos.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(0)}%`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* KPI 4: Rotación de Potreros */}
              {(() => {
                const sem = evaluateUmbrales(metricasActuales.potrerosEnDescansoPorc, metas.rotacionPasturas, false);
                const delta = calcDelta(metricasActuales.potrerosEnDescansoPorc, metricasPrevias.potrerosEnDescansoPorc);
                return (
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div>
                      {renderCardHeader('Rotación Forrajera', sem, 'rotacion_pasturas')}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono tabular-nums">
                          {metricasActuales.potrerosEnDescansoPorc.toFixed(1)}%
                        </span>
                        <span className="text-xs font-mono text-slate-400">en descanso</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Pasturas polifíticas y verdeos
                      </p>
                    </div>

                    <div>
                      <BarRangeVisual
                        valor={metricasActuales.potrerosEnDescansoPorc}
                        critico={metas.rotacionPasturas.critico}
                        minimo={metas.rotacionPasturas.minimo}
                        menorEsMejor={false}
                        formato={v => `${v.toFixed(0)}%`}
                      />
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Variación mes previo:
                        </span>
                        {renderDeltaBadge(delta)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 4. PESTAÑA DESARROLLO (4TA PERSPECTIVA CMI - APRENDIZAJE Y DESARROLLO) */}
      {activeTab === 'aprendizaje' && (
        <div className="space-y-4">
          {renderPreguntaEstrategicaBanner(
            4,
            'Perspectiva de Desarrollo & Aprendizaje',
            '¿Qué capacidades necesitamos fortalecer?',
            'Fortalecimiento continuo de las competencias técnicas del personal rural, horas efectivas de formación y prácticas zootécnicas de estudiantes universitarios UNRC, y disciplina en la adopción de protocolos y mejoras.',
            'purple',
            'horas_capacitacion_practicas'
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: Horas de Capacitación y Prácticas a Campo */}
            {(() => {
              const sem = evaluateUmbrales(metricasActuales.horasCapacitacion, metas.horasCapacitacion, false);
              const delta = calcDelta(metricasActuales.horasCapacitacion, metricasPrevias.horasCapacitacion);
              const isSimOpen = simuladorDesarrolloActivo === 'horas';
              const valSim = horasSimuladas;
              const semSim = evaluateUmbrales(valSim, metas.horasCapacitacion, false);
              const gdpGanado = Math.min(30, Math.round(valSim * 0.4));
              const beneficioArs = Math.round(valSim * 5200);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div className="space-y-2">
                    {renderCardHeader('Capacitación & Prácticas UNRC', sem, 'horas_capacitacion_practicas')}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono tabular-nums">
                        {metricasActuales.horasCapacitacion}
                      </span>
                      <span className="text-xs font-mono text-slate-400">hs/mes</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Prácticas zootécnicas a campo y capacitación operaria
                    </p>

                    <BarRangeVisual
                      valor={metricasActuales.horasCapacitacion}
                      critico={metas.horasCapacitacion.critico}
                      minimo={metas.horasCapacitacion.minimo}
                      menorEsMejor={false}
                      formato={v => `${v} hs`}
                    />

                    {/* Evolución histórica de 6 meses */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Evolución últimos 6 meses</span>
                        <span>{renderDeltaBadge(delta)}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        {historicoDesarrollo6Meses.map((h, idx) => {
                          const isLast = idx === historicoDesarrollo6Meses.length - 1;
                          const maxH = 120;
                          const hPct = Math.min(100, Math.max(15, Math.round((h.horas / maxH) * 100)));
                          return (
                            <div key={h.mesLabel} className="flex flex-col items-center space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400">{h.horas}</span>
                              <div className="w-full bg-slate-700/40 h-10 rounded flex items-end p-0.5">
                                <div
                                  className={`w-full rounded-xs transition-all ${
                                    isLast ? 'bg-purple-500' : 'bg-slate-500 hover:bg-slate-400'
                                  }`}
                                  style={{ height: `${hPct}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">{h.mesLabel.slice(0, 3)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón para desplegar Simulador de Impacto */}
                    <button
                      type="button"
                      onClick={() => setSimuladorDesarrolloActivo(isSimOpen ? null : 'horas')}
                      className={`w-full mt-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border ${
                        isSimOpen
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSimOpen ? 'Ocultar Simulador' : 'Simular Impacto en Majada'}</span>
                    </button>

                    {/* Simulador Embebido en Tarjeta */}
                    {isSimOpen && (
                      <div className="p-3 mt-2 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[11px] text-purple-300 font-bold">Horas Simuladas:</span>
                          <span className="text-sm font-black text-white">{valSim} hs/mes</span>
                        </div>
                        <input
                          aria-label="Simular horas de capacitación"
                          type="range"
                          min={0}
                          max={120}
                          step={2}
                          value={valSim}
                          onChange={(e) => setHorasSimuladas(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>0 hs (Crítico)</span>
                          <span>Meta: ≥ 40 hs</span>
                          <span>120 hs</span>
                        </div>
                        <div className="pt-2 border-t border-purple-500/20 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Estado Proyectado:</span>
                            <span className="font-bold text-purple-300">{semSim.label}</span>
                          </div>
                          <div className="text-emerald-400 font-bold">
                            · Ganancia de peso extra: +{gdpGanado} g/d en corderos
                          </div>
                          <div className="text-emerald-400 font-mono font-bold">
                            · Retorno estimado: +${beneficioArs.toLocaleString('es-AR')} ARS
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* KPI 2: Cumplimiento de Planes de Mejora y Protocolos Técnicos */}
            {(() => {
              const sem = evaluateUmbrales(metricasActuales.cumplimientoProtocolos, metas.cumplimientoProtocolos, false);
              const delta = calcDelta(metricasActuales.cumplimientoProtocolos, metricasPrevias.cumplimientoProtocolos);
              const isSimOpen = simuladorDesarrolloActivo === 'protocolos';
              const valSim = protocolosSimulados;
              const semSim = evaluateUmbrales(valSim, metas.cumplimientoProtocolos, false);
              const ahorroInsumos = Math.round(valSim * 2400);

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div className="space-y-2">
                    {renderCardHeader('Protocolos y POEs Técnicos', sem, 'cumplimiento_protocolos_mejora')}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono tabular-nums">
                        {metricasActuales.cumplimientoProtocolos.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-slate-400">adopción</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Planes de bioseguridad, manejo en corrales y sanidad
                    </p>

                    <BarRangeVisual
                      valor={metricasActuales.cumplimientoProtocolos}
                      critico={metas.cumplimientoProtocolos.critico}
                      minimo={metas.cumplimientoProtocolos.minimo}
                      menorEsMejor={false}
                      formato={v => `${v.toFixed(0)}%`}
                    />

                    {/* Evolución histórica de 6 meses */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Evolución últimos 6 meses</span>
                        <span>{renderDeltaBadge(delta)}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        {historicoDesarrollo6Meses.map((h, idx) => {
                          const isLast = idx === historicoDesarrollo6Meses.length - 1;
                          const hPct = Math.min(100, Math.max(15, h.protocolos));
                          return (
                            <div key={h.mesLabel} className="flex flex-col items-center space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400">{h.protocolos}%</span>
                              <div className="w-full bg-slate-700/40 h-10 rounded flex items-end p-0.5">
                                <div
                                  className={`w-full rounded-xs transition-all ${
                                    isLast ? 'bg-purple-500' : 'bg-slate-500 hover:bg-slate-400'
                                  }`}
                                  style={{ height: `${hPct}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">{h.mesLabel.slice(0, 3)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón para desplegar Simulador de Impacto */}
                    <button
                      type="button"
                      onClick={() => setSimuladorDesarrolloActivo(isSimOpen ? null : 'protocolos')}
                      className={`w-full mt-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border ${
                        isSimOpen
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSimOpen ? 'Ocultar Simulador' : 'Simular Impacto en Majada'}</span>
                    </button>

                    {/* Simulador Embebido en Tarjeta */}
                    {isSimOpen && (
                      <div className="p-3 mt-2 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[11px] text-purple-300 font-bold">Cumplimiento POEs:</span>
                          <span className="text-sm font-black text-white">{valSim}%</span>
                        </div>
                        <input
                          aria-label="Simular porcentaje de protocolos"
                          type="range"
                          min={40}
                          max={100}
                          step={5}
                          value={valSim}
                          onChange={(e) => setProtocolosSimulados(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>40% (Alerta)</span>
                          <span>Meta: ≥ 85%</span>
                          <span>100%</span>
                        </div>
                        <div className="pt-2 border-t border-purple-500/20 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Estado Proyectado:</span>
                            <span className="font-bold text-purple-300">{semSim.label}</span>
                          </div>
                          <div className="text-emerald-400 font-bold">
                            · Reducción de desvíos farmacológicos: -{Math.round((valSim / 100) * 8)}%
                          </div>
                          <div className="text-emerald-400 font-mono font-bold">
                            · Ahorro estimado insumos: +${ahorroInsumos.toLocaleString('es-AR')} ARS
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* KPI 3: Evaluación de Competencias en Manejo Zootécnico */}
            {(() => {
              const sem = evaluateUmbrales(metricasActuales.evaluacionCompetencias, metas.evaluacionCompetencias, false);
              const delta = calcDelta(metricasActuales.evaluacionCompetencias, metricasPrevias.evaluacionCompetencias);
              const isSimOpen = simuladorDesarrolloActivo === 'competencias';
              const valSim = competenciasSimuladas;
              const semSim = evaluateUmbrales(valSim, metas.evaluacionCompetencias, false);
              const precisionPesajes = Math.min(99, Math.round(75 + (valSim - 50) * 0.45));

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div className="space-y-2">
                    {renderCardHeader('Competencias Técnicas', sem, 'evaluacion_competencias_tecnicas')}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono tabular-nums">
                        {metricasActuales.evaluacionCompetencias}
                      </span>
                      <span className="text-xs font-mono text-slate-400">pts (0-100)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Destreza auditada en manga, balanza y Famacha
                    </p>

                    <BarRangeVisual
                      valor={metricasActuales.evaluacionCompetencias}
                      critico={metas.evaluacionCompetencias.critico}
                      minimo={metas.evaluacionCompetencias.minimo}
                      menorEsMejor={false}
                      formato={v => `${v} pts`}
                    />

                    {/* Evolución histórica de 6 meses */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Evolución últimos 6 meses</span>
                        <span>{renderDeltaBadge(delta)}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        {historicoDesarrollo6Meses.map((h, idx) => {
                          const isLast = idx === historicoDesarrollo6Meses.length - 1;
                          const hPct = Math.min(100, Math.max(15, h.competencias));
                          return (
                            <div key={h.mesLabel} className="flex flex-col items-center space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400">{h.competencias}</span>
                              <div className="w-full bg-slate-700/40 h-10 rounded flex items-end p-0.5">
                                <div
                                  className={`w-full rounded-xs transition-all ${
                                    isLast ? 'bg-purple-500' : 'bg-slate-500 hover:bg-slate-400'
                                  }`}
                                  style={{ height: `${hPct}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">{h.mesLabel.slice(0, 3)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón para desplegar Simulador de Impacto */}
                    <button
                      type="button"
                      onClick={() => setSimuladorDesarrolloActivo(isSimOpen ? null : 'competencias')}
                      className={`w-full mt-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border ${
                        isSimOpen
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSimOpen ? 'Ocultar Simulador' : 'Simular Impacto en Majada'}</span>
                    </button>

                    {/* Simulador Embebido en Tarjeta */}
                    {isSimOpen && (
                      <div className="p-3 mt-2 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[11px] text-purple-300 font-bold">Puntaje Simulador:</span>
                          <span className="text-sm font-black text-white">{valSim} pts</span>
                        </div>
                        <input
                          aria-label="Simular puntaje de competencias"
                          type="range"
                          min={40}
                          max={100}
                          step={2}
                          value={valSim}
                          onChange={(e) => setCompetenciasSimuladas(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>40 pts (Crítico)</span>
                          <span>Meta: ≥ 75 pts</span>
                          <span>100 pts</span>
                        </div>
                        <div className="pt-2 border-t border-purple-500/20 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Estado Proyectado:</span>
                            <span className="font-bold text-purple-300">{semSim.label}</span>
                          </div>
                          <div className="text-emerald-400 font-bold">
                            · Precisión biométrica estimada: {precisionPesajes}% en manga
                          </div>
                          <div className="text-emerald-400 font-mono font-bold">
                            · Reducción de distocias y errores: -{(valSim * 0.12).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal de Configuración de Metas y Umbrales (Crítico, Mínimo/Óptimo) */}
      {isMetasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col ${
              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    Configuración de Umbrales Semafóricos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definí el <strong>Valor Crítico (Rojo)</strong> y el <strong>Valor Mínimo/Óptimo (Verde)</strong>. Los valores intermedios se señalarán en <strong>Amarillo (A revisar)</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario de Umbrales */}
            <div className="py-4 space-y-5 overflow-y-auto pr-1 flex-1">
              {/* Sección 1: Zootécnica */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>1. Perspectiva Zootécnica</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Mortalidad */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Mortalidad Mensual (%)</strong>
                      <span className="text-[10px] text-teal-400 font-mono">Menor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≤ verde)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={tempMetas.mortalidad.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              mortalidad: { ...prev.mortalidad, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&gt; rojo)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={tempMetas.mortalidad.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              mortalidad: { ...prev.mortalidad, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Carga Animal */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Carga Animal (cab/ha)</strong>
                      <span className="text-[10px] text-indigo-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={tempMetas.cargaHa.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              cargaHa: { ...prev.cargaHa, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={tempMetas.cargaHa.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              cargaHa: { ...prev.cargaHa, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parición */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Tasa de Parición (%)</strong>
                      <span className="text-[10px] text-indigo-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={tempMetas.paricion.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              paricion: { ...prev.paricion, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={tempMetas.paricion.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              paricion: { ...prev.paricion, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GDP */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">GDP (g/día)</strong>
                      <span className="text-[10px] text-indigo-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={tempMetas.gdp.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              gdp: { ...prev.gdp, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={tempMetas.gdp.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              gdp: { ...prev.gdp, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2: Clientes */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>2. Perspectiva de Clientes</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Ventas */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Ventas Mensuales (ARS)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="50000"
                          value={tempMetas.ventas.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              ventas: { ...prev.ventas, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="50000"
                          value={tempMetas.ventas.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              ventas: { ...prev.ventas, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clientes Activos */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Clientes Compradores</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="1"
                          value={tempMetas.clientes.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              clientes: { ...prev.clientes, critico: parseInt(e.target.value, 10) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="1"
                          value={tempMetas.clientes.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              clientes: { ...prev.clientes, minimo: parseInt(e.target.value, 10) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Precio Medio */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Precio Medio / Cab (ARS)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="2000"
                          value={tempMetas.precioMedio.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              precioMedio: { ...prev.precioMedio, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="2000"
                          value={tempMetas.precioMedio.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              precioMedio: { ...prev.precioMedio, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cobranza */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Efectividad Cobranza (%)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.cobranza.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              cobranza: { ...prev.cobranza, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.cobranza.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              cobranza: { ...prev.cobranza, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Procesos Internos */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Perspectiva de Procesos Internos</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Sanidad */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Plan Sanitario (%)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="1"
                          value={tempMetas.sanidad.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              sanidad: { ...prev.sanidad, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="1"
                          value={tempMetas.sanidad.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              sanidad: { ...prev.sanidad, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Eficiencia */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Eficiencia Procesos (%)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="1"
                          value={tempMetas.eficienciaProcesos.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              eficienciaProcesos: { ...prev.eficienciaProcesos, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="1"
                          value={tempMetas.eficienciaProcesos.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              eficienciaProcesos: { ...prev.eficienciaProcesos, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cobertura de Pesajes */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Cobertura Pesajes (%)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.pesajes.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              pesajes: { ...prev.pesajes, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.pesajes.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              pesajes: { ...prev.pesajes, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rotación y Descanso */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Rotación Forrajera (%)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.rotacionPasturas.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              rotacionPasturas: { ...prev.rotacionPasturas, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.rotacionPasturas.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              rotacionPasturas: { ...prev.rotacionPasturas, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 4: Financiera */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>4. Perspectiva Financiera</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Margen Bruto */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Margen Bruto (ARS)</strong>
                      <span className="text-[10px] text-indigo-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="25000"
                          value={tempMetas.margenBruto.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              margenBruto: { ...prev.margenBruto, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="25000"
                          value={tempMetas.margenBruto.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              margenBruto: { ...prev.margenBruto, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Costos Directos */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Costos Directos Límite (ARS)</strong>
                      <span className="text-[10px] text-teal-400 font-mono">Menor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≤ verde)</label>
                        <input
                          type="number"
                          step="25000"
                          value={tempMetas.costosDirectos.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              costosDirectos: { ...prev.costosDirectos, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&gt; rojo)</label>
                        <input
                          type="number"
                          step="25000"
                          value={tempMetas.costosDirectos.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              costosDirectos: { ...prev.costosDirectos, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Margen sobre CD */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Margen sobre CD (%)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.margenSobreCd.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              margenSobreCd: { ...prev.margenSobreCd, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.margenSobreCd.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              margenSobreCd: { ...prev.margenSobreCd, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flujo de Caja */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Flujo de Caja Neto (ARS)</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="25000"
                          value={tempMetas.flujoCaja.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              flujoCaja: { ...prev.flujoCaja, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="25000"
                          value={tempMetas.flujoCaja.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              flujoCaja: { ...prev.flujoCaja, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 5: Aprendizaje y Desarrollo */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>5. Perspectiva de Aprendizaje y Desarrollo</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Horas de Capacitación y Prácticas */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Capacitación y Prácticas (hs)</strong>
                      <span className="text-[10px] text-purple-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.horasCapacitacion.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              horasCapacitacion: { ...prev.horasCapacitacion, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.horasCapacitacion.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              horasCapacitacion: { ...prev.horasCapacitacion, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cumplimiento Protocolos POEs */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Cumplimiento Protocolos POEs (%)</strong>
                      <span className="text-[10px] text-purple-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.cumplimientoProtocolos.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              cumplimientoProtocolos: { ...prev.cumplimientoProtocolos, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.cumplimientoProtocolos.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              cumplimientoProtocolos: { ...prev.cumplimientoProtocolos, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Evaluación de Competencias Técnicas */}
                  <div className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-white">Evaluación de Competencias (pts)</strong>
                      <span className="text-[10px] text-purple-400 font-mono">Mayor es mejor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[10px] text-rose-400 block font-semibold">Crítico (&lt; rojo)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.evaluacionCompetencias.critico}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              evaluacionCompetencias: { ...prev.evaluacionCompetencias, critico: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block font-semibold">Óptimo (≥ verde)</label>
                        <input
                          type="number"
                          step="5"
                          value={tempMetas.evaluacionCompetencias.minimo}
                          onChange={e =>
                            setTempMetas(prev => ({
                              ...prev,
                              evaluacionCompetencias: { ...prev.evaluacionCompetencias, minimo: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones del Modal */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRestablecerMetas}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer por defecto</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMetasModalOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isLightMode
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarMetas}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/30 transition-colors cursor-pointer"
                >
                  Guardar Umbrales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

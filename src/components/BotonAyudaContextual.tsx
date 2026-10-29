import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface AyudaConfig {
  tab: 'SISTEMA' | 'GLOSARIO';
  term: string;
  label: string;
  tooltip: string;
}

export const AYUDA_CONTEXTUAL_CONFIG: Record<string, AyudaConfig> = {
  ganaderia: {
    tab: 'SISTEMA',
    term: 'ganaderia',
    label: 'Ganadería & Resumen',
    tooltip: 'Ayuda de Ganadería: Resumen multi-especie, balance zootécnico y comparativas',
  },
  dashboard: {
    tab: 'SISTEMA',
    term: 'dashboard',
    label: 'Dashboard General',
    tooltip: 'Ayuda del Dashboard: Indicadores globales y estado zootécnico',
  },
  inventario: {
    tab: 'SISTEMA',
    term: 'majada',
    label: 'Majada & Hacienda',
    tooltip: 'Ayuda de Hacienda: Trazabilidad, categorías y existencias',
  },
  majada: {
    tab: 'SISTEMA',
    term: 'majada',
    label: 'Majada & Hacienda',
    tooltip: 'Ayuda de Hacienda: Trazabilidad, categorías y existencias',
  },
  produccion: {
    tab: 'SISTEMA',
    term: 'produccion',
    label: 'Producción & Insumos',
    tooltip: 'Ayuda de Producción: Consumos, stock y dosis técnicas',
  },
  graficos: {
    tab: 'GLOSARIO',
    term: 'Lote y Subunidades',
    label: 'Gráficos & Métricas',
    tooltip: 'Ayuda de Métricas: Evolución zootécnica y económica',
  },
  reproduccion: {
    tab: 'GLOSARIO',
    term: 'Porcentaje de Parición',
    label: 'Reproducción Ovina',
    tooltip: 'Ayuda de Reproducción: Parición, servicios y fertilidad de vientres',
  },
  sanidad: {
    tab: 'GLOSARIO',
    term: 'Período de Carencia',
    label: 'Sanidad Ovina',
    tooltip: 'Ayuda de Sanidad: Fármacos veterinarios, dosis y período de carencia',
  },
  alimentacion: {
    tab: 'GLOSARIO',
    term: 'Dosis Técnica',
    label: 'Alimentación & Forrajes',
    tooltip: 'Ayuda de Alimentación: Raciones diarias, forrajes y dosis técnicas',
  },
  economia: {
    tab: 'GLOSARIO',
    term: 'Margen Bruto',
    label: 'Operaciones Económicas',
    tooltip: 'Ayuda de Finanzas: Costos directos, ventas y margen bruto',
  },
  contabilidad: {
    tab: 'GLOSARIO',
    term: 'Activo Biológico (RT 54)',
    label: 'Medición Contable',
    tooltip: 'Ayuda de RT 54: Valuación patrimonial y VNR de activos biológicos',
  },
  auditoria: {
    tab: 'SISTEMA',
    term: 'auditoria',
    label: 'Auditoría & Trazabilidad',
    tooltip: 'Ayuda de Auditoría: Bitácora inmutable y log de modificaciones',
  },
  pruebas: {
    tab: 'SISTEMA',
    term: 'pruebas',
    label: 'Casos de Prueba',
    tooltip: 'Ayuda de Casos de Prueba: Ensayos de validación del sistema',
  },
  configuracion: {
    tab: 'SISTEMA',
    term: 'configuracion',
    label: 'Configuración',
    tooltip: 'Ayuda de Configuración: Usuarios, roles RBAC y conexión Sheets',
  },
  modelo_datos: {
    tab: 'SISTEMA',
    term: 'modelo_datos',
    label: 'Modelo de Datos',
    tooltip: 'Ayuda del Modelo de Datos: Entidades 3FN y diccionario de tablas',
  },
};

export interface BotonAyudaContextualProps {
  moduloId: string;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
  termOverride?: string;
  tabOverride?: 'SISTEMA' | 'GLOSARIO';
  className?: string;
  size?: 'sm' | 'md';
}

export const BotonAyudaContextual: React.FC<BotonAyudaContextualProps> = ({
  moduloId,
  onOpenManual,
  termOverride,
  tabOverride,
  className = '',
  size = 'sm',
}) => {
  if (!onOpenManual) return null;

  const config = AYUDA_CONTEXTUAL_CONFIG[moduloId] || {
    tab: 'SISTEMA',
    term: moduloId,
    label: moduloId,
    tooltip: `Ayuda del módulo: ${moduloId}`,
  };

  const targetTab = tabOverride || config.tab;
  const targetTerm = termOverride || config.term;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenManual(targetTerm, targetTab);
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      title={config.tooltip}
      aria-label={config.tooltip}
      className={`inline-flex items-center justify-center gap-1 font-medium transition-all cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 ${
        isSmall ? 'p-1.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span className="hidden sm:inline font-semibold">Ayuda</span>
    </button>
  );
};

import React from 'react';
import { ArrowUpRight, HelpCircle } from 'lucide-react';
import { MonedaTipo } from '../../../services/currencyService';

interface WidgetKpisProps {
  displayCabezas: number;
  displayIngresosArs: number;
  displayIngresosUsd: number;
  displayCDArs: number;
  displayCDUsd: number;
  displayCIArs: number;
  displayCIUsd: number;
  displayMBArs: number;
  displayMBUsd: number;
  displayPorcCD: number | null;
  monedaVisualizacion: MonedaTipo;
  isLightMode?: boolean;
  onOpenManual?: (term?: string) => void;
}

export const WidgetKpis: React.FC<WidgetKpisProps> = ({
  displayCabezas,
  displayIngresosArs,
  displayIngresosUsd,
  displayCDArs,
  displayCDUsd,
  displayCIArs,
  displayCIUsd,
  displayMBArs,
  displayMBUsd,
  displayPorcCD,
  monedaVisualizacion,
  isLightMode = false,
  onOpenManual,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Cabezas Totales */}
      <div
        className={`p-4 rounded-xl border shadow-xs relative overflow-hidden transition-colors ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-850 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Existencia Majada
            </span>
            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual('Lote y Subunidades')}
                className={`transition-colors cursor-pointer ${
                  isLightMode
                    ? 'text-slate-400 hover:text-emerald-600'
                    : 'text-slate-500 hover:text-emerald-400'
                }`}
                title="¿Cómo se compone la existencia de la majada?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
              isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            🐑
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black">{displayCabezas}</span>
          <span className={`text-xs font-medium ml-1.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            cabezas
          </span>
        </div>
        <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Corte oficial: 81 cabezas al 30/08
        </p>
      </div>

      {/* Ingresos Reales Devengados */}
      <div
        className={`p-4 rounded-xl border shadow-xs relative overflow-hidden transition-colors ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-850 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Ingresos Reales
            </span>
            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual('Ingresos Reales')}
                className={`transition-colors cursor-pointer ${
                  isLightMode ? 'text-slate-400 hover:text-blue-600' : 'text-slate-500 hover:text-blue-400'
                }`}
                title="¿Qué son los Ingresos Reales?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isLightMode ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/10 text-blue-400'
            }`}
          >
            $
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black">
            {monedaVisualizacion === 'USD'
              ? `US$ ${displayIngresosUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
              : `$ ${displayIngresosArs.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
          </span>
        </div>
        <p className="text-[11px] mt-1 flex items-center justify-between">
          <span className="flex items-center space-x-0.5 text-emerald-500 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Ventas confirmadas</span>
          </span>
          <span className={`font-mono text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {monedaVisualizacion === 'USD'
              ? `$ ${displayIngresosArs.toLocaleString('es-AR')} ARS`
              : `US$ ${displayIngresosUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })} USD`}
          </span>
        </p>
      </div>

      {/* Costos Directos Reales */}
      <div
        className={`p-4 rounded-xl border shadow-xs relative overflow-hidden transition-colors ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-850 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Costos Directos
            </span>
            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual('Costo Directo')}
                className={`transition-colors cursor-pointer ${
                  isLightMode ? 'text-slate-400 hover:text-rose-600' : 'text-slate-500 hover:text-rose-400'
                }`}
                title="¿Qué es un Costo Directo?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isLightMode ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            CD
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black">
            {monedaVisualizacion === 'USD'
              ? `US$ ${displayCDUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
              : `$ ${displayCDArs.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
          </span>
        </div>
        <p className={`text-[11px] mt-1 flex items-center justify-between ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>
            CI: {monedaVisualizacion === 'USD' ? `US$ ${displayCIUsd.toFixed(2)}` : `$ ${displayCIArs.toLocaleString('es-AR')}`}
          </span>
          <span className="font-mono text-[10px]">
            {monedaVisualizacion === 'USD'
              ? `$ ${displayCDArs.toLocaleString('es-AR')} ARS`
              : `US$ ${displayCDUsd.toFixed(2)} USD`}
          </span>
        </p>
      </div>

      {/* Margen Bruto Real */}
      <div
        className={`p-4 rounded-xl border shadow-xs relative overflow-hidden transition-colors ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-850 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Margen Bruto
            </span>
            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual('Margen Bruto')}
                className={`transition-colors cursor-pointer ${
                  isLightMode ? 'text-slate-400 hover:text-teal-600' : 'text-slate-500 hover:text-teal-400'
                }`}
                title="¿Qué es el Margen Bruto?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isLightMode ? 'bg-teal-100 text-teal-800' : 'bg-teal-500/10 text-teal-400'
            }`}
          >
            MB
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black">
            {monedaVisualizacion === 'USD'
              ? `US$ ${displayMBUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
              : `$ ${displayMBArs.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
          </span>
        </div>
        <div className="text-[11px] font-semibold mt-1 flex items-center justify-between">
          {displayPorcCD !== null ? (
            <span className={displayMBArs >= 0 ? 'text-teal-500 font-bold' : 'text-rose-500 font-bold'}>
              {displayPorcCD.toFixed(2)}% s/CD
            </span>
          ) : (
            <span className={isLightMode ? 'text-slate-400' : 'text-slate-500'}>Sin CD</span>
          )}
          <span className={`font-mono text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {monedaVisualizacion === 'USD'
              ? `$ ${displayMBArs.toLocaleString('es-AR')} ARS`
              : `US$ ${displayMBUsd.toFixed(2)} USD`}
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  EyeOff,
  GripVertical,
} from 'lucide-react';

interface WidgetContainerProps {
  id: string;
  titulo: string;
  subtitulo?: string;
  icono?: React.ReactNode;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
  isLightMode?: boolean;
  colapsado?: boolean;
  onToggleColapso?: () => void;
  onMoverArriba?: () => void;
  onMoverAbajo?: () => void;
  onOcultar?: () => void;
  puedeSubir?: boolean;
  puedeBajar?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  id,
  titulo,
  subtitulo,
  icono,
  badge,
  actionButton,
  isLightMode = false,
  colapsado = false,
  onToggleColapso,
  onMoverArriba,
  onMoverAbajo,
  onOcultar,
  puedeSubir = true,
  puedeBajar = true,
  className = '',
  children,
}) => {
  return (
    <div
      id={`widget-${id}`}
      className={`rounded-[2px] transition-colors duration-150 border shadow-xs overflow-hidden ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#121212] border-[#262626] text-neutral-100'
      } ${className}`}
    >
      {/* Cabecera del Widget */}
      <div
        className={`px-4 py-3 sm:px-5 flex items-center justify-between gap-3 border-b transition-colors select-none ${
          isLightMode
            ? 'border-slate-100 bg-slate-50/70 hover:bg-slate-50'
            : 'border-[#262626] bg-[#161616] hover:bg-[#1a1a1a]'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          {icono && (
            <div
              className={`w-7 h-7 rounded-[2px] flex items-center justify-center shrink-0 ${
                isLightMode
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {icono}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className={`text-sm font-bold truncate ${isLightMode ? 'text-slate-900' : 'text-neutral-100'}`}>
                {titulo}
              </h3>
              {badge}
            </div>
            {subtitulo && (
              <p className={`text-xs truncate ${isLightMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                {subtitulo}
              </p>
            )}
          </div>
        </div>

        {/* Acciones del Widget */}
        <div className="flex items-center space-x-1 shrink-0">
          {actionButton}

          <div
            className={`flex items-center space-x-0.5 pl-1.5 border-l ${
              isLightMode ? 'border-slate-200' : 'border-[#2c2c2c]'
            }`}
          >
            {onMoverArriba && (
              <button
                type="button"
                onClick={onMoverArriba}
                disabled={!puedeSubir}
                className={`p-1 rounded-[2px] text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isLightMode
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
                }`}
                title="Mover arriba en el Dashboard"
                aria-label="Mover arriba"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}

            {onMoverAbajo && (
              <button
                type="button"
                onClick={onMoverAbajo}
                disabled={!puedeBajar}
                className={`p-1 rounded-[2px] text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isLightMode
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
                }`}
                title="Mover abajo en el Dashboard"
                aria-label="Mover abajo"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleColapso && (
              <button
                type="button"
                onClick={onToggleColapso}
                className={`p-1 rounded-[2px] text-xs transition-colors cursor-pointer ${
                  isLightMode
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
                }`}
                title={colapsado ? 'Expandir contenido' : 'Colapsar contenido'}
                aria-label="Colapsar o expandir"
              >
                {colapsado ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}

            {onOcultar && (
              <button
                type="button"
                onClick={onOcultar}
                className={`p-1 rounded-[2px] text-xs transition-colors cursor-pointer ${
                  isLightMode
                    ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                    : 'text-neutral-400 hover:text-rose-400 hover:bg-[#222222]'
                }`}
                title="Ocultar del Dashboard (podrás reactivarlo desde el menú de configuración)"
                aria-label="Ocultar widget"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del Widget */}
      {!colapsado && <div className="p-4 sm:p-5">{children}</div>}
    </div>
  );
};

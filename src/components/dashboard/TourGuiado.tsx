import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
} from 'lucide-react';

export interface TourStep {
  targetSelector: string;
  titulo: string;
  descripcion: string;
  posicionPreferida?: 'top' | 'bottom' | 'left' | 'right';
  icono?: string;
}

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '#tour-encabezado-subunidad',
    titulo: 'Subunidad y Lote Productivo',
    descripcion:
      'Aquí podés ver qué subunidad estás gestionando (Cría, Recría, Engorde o Toda la Majada) en el potrero LOT001 y el estado del entorno.',
    posicionPreferida: 'bottom',
  },
  {
    targetSelector: '#tour-personalizar-widgets',
    titulo: 'Personalizar Resúmenes del Dashboard',
    descripcion:
      'Hacé clic aquí para abrir el menú arrastrable. Podés activar, ocultar y reordenar las tarjetas arrastrándolas según tus prioridades.',
    posicionPreferida: 'bottom',
  },
  {
    targetSelector: '#tour-audit-badge',
    titulo: 'Auditoría y Trazabilidad en Tiempo Real',
    descripcion:
      'Verificá de inmediato quién realizó la última modificación, la fecha exacta y la operación asentada para total control contable.',
    posicionPreferida: 'bottom',
  },
  {
    targetSelector: '#widget-kpis',
    titulo: 'Indicadores Clave (KPIs Ejecutivos)',
    descripcion:
      'Cabezas totales, ingresos devengados, costos directos y margen bruto real con conversión automática entre Pesos Argentinos (ARS) y Dólares (USD).',
    posicionPreferida: 'bottom',
  },
  {
    targetSelector: '#widget-stock_actual',
    titulo: 'Existencias por Categoría Zootécnica',
    descripcion:
      'Detalle físico de Madres, Carneros, Borregas y Corderos con porcentajes sobre el total y acceso directo para registrar movimientos.',
    posicionPreferida: 'top',
  },
  {
    targetSelector: '#widget-proximos_servicios',
    titulo: 'Próximos Servicios y Calendario Reproductivo',
    descripcion:
      'Cronograma zootécnico: fechas de encaste a campo, revisación andrológica de carneros, ecografía gestacional y fechas de parición.',
    posicionPreferida: 'top',
  },
  {
    targetSelector: '#widget-alertas_criticas',
    titulo: 'Alertas Críticas y Parámetros Pendientes',
    descripcion:
      'Notificaciones prioritarias sobre vacunaciones sanitarias pendientes, stocks mínimos en depósito y lotes en suspenso contable.',
    posicionPreferida: 'top',
  },
];

const TOUR_STORAGE_KEY = 'erp_ovinos_tour_completado_v1';

export function isTourCompletado(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function marcarTourCompletado(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  } catch {}
}

export function reiniciarTour(): void {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {}
}

interface TourGuiadoProps {
  activo: boolean;
  onCerrar: () => void;
  isLightMode?: boolean;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const TourGuiado: React.FC<TourGuiadoProps> = ({
  activo,
  onCerrar,
  isLightMode = false,
}) => {
  const [pasoActual, setPasoActual] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Filtrar pasos cuyos elementos existen en el DOM
  const paso = DASHBOARD_TOUR_STEPS[pasoActual];

  // Actualizar rectángulo del elemento objetivo
  const actualizarPosicion = useCallback(() => {
    if (!activo || !paso) return;

    const el = document.querySelector(paso.targetSelector);
    if (el) {
      // Hacer scroll suave hacia el elemento si está fuera del viewport
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      setTargetRect(null);
    }
  }, [activo, paso]);

  useEffect(() => {
    if (!activo) return;

    // Pequeño timeout para permitir scroll o animaciones
    const timer = setTimeout(actualizarPosicion, 100);

    const handleResize = () => actualizarPosicion();
    const handleScroll = () => actualizarPosicion();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activo, pasoActual, actualizarPosicion]);

  // Teclas de acceso rápido (flechas y escape)
  useEffect(() => {
    if (!activo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinalizar();
      } else if (e.key === 'ArrowRight') {
        handleSiguiente();
      } else if (e.key === 'ArrowLeft') {
        handleAnterior();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activo, pasoActual]);

  if (!activo || !paso) return null;

  const totalPasos = DASHBOARD_TOUR_STEPS.length;
  const esUltimoPaso = pasoActual === totalPasos - 1;

  const handleSiguiente = () => {
    if (esUltimoPaso) {
      handleFinalizar();
    } else {
      setPasoActual(prev => prev + 1);
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(prev => prev - 1);
    }
  };

  const handleFinalizar = () => {
    marcarTourCompletado();
    onCerrar();
  };

  // Calcular posición del tooltip flotante
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  const padding = 12;
  const tooltipWidth = 360;

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    // Preferencia arriba o abajo
    const colocarAbajo =
      paso.posicionPreferida === 'bottom'
        ? spaceBelow >= 220 || spaceBelow > spaceAbove
        : spaceAbove < 220 && spaceBelow > spaceAbove;

    let top = colocarAbajo
      ? targetRect.bottom + padding
      : targetRect.top - 230 - padding;

    // Ajustar si se sale por arriba o abajo
    if (top < 10) top = 10;
    if (top + 230 > window.innerHeight) top = window.innerHeight - 240;

    // Centrar horizontalmente respecto al objetivo
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    if (left < 12) left = 12;
    if (left + tooltipWidth > window.innerWidth - 12) {
      left = window.innerWidth - tooltipWidth - 12;
    }

    tooltipStyle = {
      ...tooltipStyle,
      top: `${top}px`,
      left: `${left}px`,
      width: `${Math.min(tooltipWidth, window.innerWidth - 24)}px`,
    };
  } else {
    // Si el elemento no está en pantalla, centrar el tooltip
    tooltipStyle = {
      ...tooltipStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${Math.min(tooltipWidth, window.innerWidth - 24)}px`,
    };
  }

  // Padding para el spotlight recortado
  const spotPad = 6;

  return (
    <div className="fixed inset-0 z-[9990] select-none animate-in fade-in duration-200">
      {/* Capa superpuesta semitransparente con recorte SVG para spotlight */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        style={{ zIndex: 9991 }}
        onClick={handleFinalizar}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* Fondo blanco: opaco */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Agujero negro: transparente sobre el elemento objetivo */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - spotPad)}
                y={Math.max(0, targetRect.top - spotPad)}
                width={targetRect.width + spotPad * 2}
                height={targetRect.height + spotPad * 2}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Rectángulo oscuro con máscara */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Borde brillante y pulsante sobre el elemento resaltado */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl ring-4 ring-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300"
          style={{
            zIndex: 9995,
            top: `${Math.max(0, targetRect.top - spotPad)}px`,
            left: `${Math.max(0, targetRect.left - spotPad)}px`,
            width: `${targetRect.width + spotPad * 2}px`,
            height: `${targetRect.height + spotPad * 2}px`,
          }}
        />
      )}

      {/* Tarjeta flotante con explicación y controles */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={`rounded-2xl shadow-2xl border p-4 sm:p-5 transition-all duration-200 ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del paso */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Tour Guiado • Paso {pasoActual + 1} de {totalPasos}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinalizar}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLightMode
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Saltar y cerrar el tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título y descripción explicativa */}
        <div className="space-y-1.5 mb-4">
          <h4 className="text-base font-extrabold tracking-tight">
            {paso.titulo}
          </h4>
          <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            {paso.descripcion}
          </p>
        </div>

        {/* Indicador de progreso con puntos */}
        <div className="flex items-center justify-center space-x-1.5 mb-4">
          {DASHBOARD_TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPasoActual(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === pasoActual
                  ? 'w-6 bg-emerald-500'
                  : idx < pasoActual
                  ? 'w-2 bg-emerald-500/40'
                  : isLightMode
                  ? 'w-2 bg-slate-300'
                  : 'w-2 bg-slate-700'
              }`}
              title={`Ir al paso ${idx + 1}`}
            />
          ))}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleFinalizar}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isLightMode
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Saltar Tour
          </button>

          <div className="flex items-center space-x-2">
            {pasoActual > 0 && (
              <button
                type="button"
                onClick={handleAnterior}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  isLightMode
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSiguiente}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <span>{esUltimoPaso ? '¡Entendido!' : 'Siguiente'}</span>
              {esUltimoPaso ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

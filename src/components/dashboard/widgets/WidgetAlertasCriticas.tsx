import React from 'react';
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  BellRing,
  Gauge,
  Calculator,
  Activity,
  TrendingDown
} from 'lucide-react';
import { AlertaSistema } from '../../../services/alertService';

interface WidgetAlertasCriticasProps {
  alertas: AlertaSistema[];
  datosPendientes: string[];
  isLightMode?: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES', indicadorId?: string) => void;
}

export const WidgetAlertasCriticas: React.FC<WidgetAlertasCriticasProps> = ({
  alertas,
  datosPendientes,
  isLightMode = false,
  onNavigateTab,
  onOpenManual,
}) => {
  // Separar alertas de indicadores de las operativas
  const alertasIndicadores = alertas.filter(a => a.tipo === 'INDICADOR');
  const alertasOperativas = alertas.filter(a => a.tipo !== 'SISTEMA' && a.tipo !== 'INDICADOR');

  const tieneAlertas = alertasIndicadores.length > 0 || alertasOperativas.length > 0 || datosPendientes.length > 0;

  const handleAction = (alerta: AlertaSistema) => {
    if (alerta.tipo === 'INDICADOR' || alerta.moduloDestino === 'indicadores') {
      if (onOpenManual) {
        onOpenManual(undefined, 'INDICADORES', alerta.idIndicador || alerta.idReferencia);
      } else {
        onNavigateTab('dashboard');
      }
    } else {
      onNavigateTab(alerta.moduloDestino);
    }
  };

  return (
    <div className="space-y-4">
      {!tieneAlertas ? (
        <div
          className={`p-6 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 ${
            isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <h4 className="font-bold text-sm">Sin Indicadores ni Alertas Críticas Pendientes</h4>
          <p className="text-xs max-w-md opacity-85">
            Todos los indicadores zootécnicos, financieros y tratamientos sanitarios del establecimiento están en rango óptimo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SECCIÓN 1: INDICADORES EN ESTADO CRÍTICO O A REVISAR */}
          {alertasIndicadores.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Indicadores Fuera de Meta ({alertasIndicadores.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {alertasIndicadores.filter(a => a.nivel === 'URGENTE').length} críticos · {alertasIndicadores.filter(a => a.nivel === 'ADVERTENCIA').length} a revisar
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {alertasIndicadores.map(alerta => {
                  const isCritico = alerta.nivel === 'URGENTE';
                  return (
                    <div
                      key={alerta.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                        isCritico
                          ? isLightMode
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950 hover:border-rose-300'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-200 hover:border-rose-500/50'
                          : isLightMode
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950 hover:border-amber-300'
                          : 'bg-amber-950/20 border-amber-500/30 text-amber-200 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                isCritico
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isCritico ? 'Crítico' : 'A Revisar'}
                            </span>
                            {alerta.perspectiva && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {alerta.perspectiva}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {alerta.idIndicador}
                          </span>
                        </div>

                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {alerta.titulo.replace(/^[🔴🟡]\s*(Crítico|A Revisar):\s*/, '')}
                        </h5>

                        <p className="text-[11px] opacity-85 line-clamp-2 leading-relaxed">
                          {alerta.mensaje}
                        </p>

                        {/* Comparación de valor real vs meta */}
                        {alerta.valorActual !== undefined && (
                          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-200 dark:border-slate-800/80">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Real: </span>
                              <strong className={`font-black ${isCritico ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                {alerta.valorActual} {alerta.unidadMedida || ''}
                              </strong>
                            </div>
                            {alerta.valorMeta !== undefined && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                Meta: {alerta.valorMeta} {alerta.unidadMedida || ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleAction(alerta)}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm ${
                            isCritico
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                          title="Abrir ficha técnica y simulador interactivo de fórmulas"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Simular y Corregir Fórmula</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: PARÁMETROS PENDIENTES DE VERIFICACIÓN */}
          {datosPendientes.length > 0 && (
            <div className="space-y-2">
              {datosPendientes.map((pendiente, idx) => (
                <div
                  key={`pend-${idx}`}
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    isLightMode
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] mr-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">
                      Verificación
                    </span>
                    <span>{pendiente}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECCIÓN 3: ALERTAS OPERATIVAS (Sanidad, Insumos, Majada) */}
          {alertasOperativas.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Alertas Operativas y Sanitarias ({alertasOperativas.length})
                </h4>
              </div>

              <div className="space-y-2">
                {alertasOperativas.map(alerta => {
                  const isUrgente = alerta.nivel === 'URGENTE';
                  const cardStyle = isUrgente
                    ? isLightMode
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : isLightMode
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200';

                  const badgeStyle = isUrgente
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-500 border border-amber-500/30';

                  return (
                    <div
                      key={alerta.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${cardStyle}`}
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${isUrgente ? 'text-rose-500' : 'text-amber-500'}`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-extrabold text-xs">{alerta.titulo}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${badgeStyle}`}>
                              {alerta.nivel}
                            </span>
                            {alerta.tiempoRestante && (
                              <span className="text-[10px] font-mono opacity-80">
                                • {alerta.tiempoRestante}
                              </span>
                            )}
                          </div>
                          <p className="opacity-90 leading-relaxed">{alerta.mensaje}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAction(alerta)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center space-x-1 ${
                          isUrgente
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                        title={`Resolver en módulo ${alerta.moduloDestino}`}
                      >
                        <span>Resolver</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

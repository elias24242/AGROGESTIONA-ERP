import React, { useState, useEffect } from 'react';
import { AlertaSistema, descartarAlerta, reactivarTodasLasAlertas } from '../services/alertService';
import {
  Bell,
  X,
  AlertTriangle,
  Syringe,
  Package,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Gauge,
  Calculator,
  TrendingDown,
  Activity
} from 'lucide-react';

interface NotificacionesEmergentesProps {
  alertas: AlertaSistema[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onAlertDismiss: () => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES', indicadorId?: string) => void;
  isLightMode?: boolean;
}

export const NotificacionesEmergentes: React.FC<NotificacionesEmergentesProps> = ({
  alertas,
  isOpen,
  onClose,
  onNavigateTab,
  onAlertDismiss,
  onOpenManual,
  isLightMode = false,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('TODAS');
  const [toastVisible, setToastVisible] = useState<boolean>(true);
  const [toastAlerta, setToastAlerta] = useState<AlertaSistema | null>(null);

  // Seleccionar la alerta más crítica no leída para mostrar como notificación emergente inicial (toast)
  useEffect(() => {
    const noLeidas = alertas.filter(a => !a.leida);
    if (noLeidas.length > 0) {
      // Priorizar URGENTE luego ADVERTENCIA luego RECORDATORIO
      const urgente = noLeidas.find(a => a.nivel === 'URGENTE') || noLeidas[0];
      setToastAlerta(urgente);
      setToastVisible(true);

      // Auto ocultar el toast flotante luego de 9 segundos
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [alertas]);

  const alertasNoLeidas = alertas.filter(a => !a.leida);

  const alertasFiltradas = alertas.filter(a => {
    if (filtroTipo === 'TODAS') return true;
    return a.tipo === filtroTipo;
  });

  const handleDescartar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    descartarAlerta(id);
    onAlertDismiss();
  };

  const handleNavegar = (alerta: AlertaSistema) => {
    handleDescartar(alerta.id);
    if (alerta.tipo === 'INDICADOR' || alerta.moduloDestino === 'indicadores') {
      if (onOpenManual) {
        onOpenManual(undefined, 'INDICADORES', alerta.idIndicador || alerta.idReferencia);
      } else {
        onNavigateTab('dashboard');
      }
    } else if (alerta.moduloDestino === 'sistema') {
      if (onOpenManual) {
        onOpenManual('SISTEMA');
      } else {
        onNavigateTab('dashboard');
      }
    } else {
      onNavigateTab(alerta.moduloDestino);
    }
    onClose();
  };

  const getIconoTipo = (tipo: string, nivel?: string) => {
    switch (tipo) {
      case 'INDICADOR':
        return nivel === 'URGENTE' ? (
          <Gauge className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <Activity className="w-4 h-4 text-amber-400 shrink-0" />
        );
      case 'SANIDAD':
        return <Syringe className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'INSUMO':
        return <Package className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'SISTEMA':
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'URGENTE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'ADVERTENCIA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <>
      {/* 1. NOTIFICACIÓN TOAST FLOTANTE TEMPORAL */}
      {toastVisible && toastAlerta && !isOpen && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-full p-4 pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white relative overflow-hidden backdrop-blur-md">
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                toastAlerta.nivel === 'URGENTE'
                  ? 'bg-rose-500'
                  : toastAlerta.nivel === 'ADVERTENCIA'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
            />

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                {getIconoTipo(toastAlerta.tipo, toastAlerta.nivel)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getNivelBadge(
                      toastAlerta.nivel
                    )}`}
                  >
                    {toastAlerta.tipo}: {toastAlerta.nivel}
                  </span>
                  <button
                    onClick={() => setToastVisible(false)}
                    className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                    title="Cerrar notificación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-xs font-bold mt-1 text-white truncate">{toastAlerta.titulo}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {toastAlerta.mensaje}
                </p>

                {toastAlerta.tipo === 'INDICADOR' && toastAlerta.valorActual !== undefined && (
                  <div className="mt-1.5 flex items-center space-x-2 text-[10px] font-mono bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Valor Actual:</span>
                    <strong className={toastAlerta.nivel === 'URGENTE' ? 'text-rose-400' : 'text-amber-400'}>
                      {toastAlerta.valorActual} {toastAlerta.unidadMedida || ''}
                    </strong>
                    {toastAlerta.valorMeta !== undefined && (
                      <span className="text-slate-500">
                        • Meta: {toastAlerta.valorMeta} {toastAlerta.unidadMedida || ''}
                      </span>
                    )}
                  </div>
                )}

                {toastAlerta.tiempoRestante && toastAlerta.tipo !== 'INDICADOR' && (
                  <div className="flex items-center space-x-1 text-[10px] text-amber-400 mt-1.5 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{toastAlerta.tiempoRestante}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleNavegar(toastAlerta)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                  >
                    {toastAlerta.tipo === 'INDICADOR' ? (
                      <>
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simular y Analizar Fórmula</span>
                      </>
                    ) : (
                      <>
                        <span>{toastAlerta.moduloDestino === 'sistema' ? 'Abrir Guía del Sistema' : 'Revisar en el Módulo'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={e => {
                      handleDescartar(toastAlerta.id, e);
                      setToastVisible(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PANEL DESPLEGABLE COMPLETO DE ALERTAS (MODAL / DRAWER) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-700/80 text-slate-100'
            }`}
          >
            {/* Header del Centro de Alertas */}
            <div
              className={`p-4 sm:p-5 border-b flex items-start justify-between ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2
                      className={`text-base font-black tracking-tight ${
                        isLightMode ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      Centro de Alertas & Notificaciones
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                      {alertasNoLeidas.length} pendientes
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Indicadores críticos/a revisar, eventos sanitarios, insumos y parámetros zootécnicos
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Filtro */}
            <div
              className={`px-4 sm:px-5 py-2.5 border-b flex items-center justify-between text-xs gap-2 ${
                isLightMode ? 'bg-slate-100/60 border-slate-200' : 'bg-slate-950/50 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                {[
                  { id: 'TODAS', label: `Todas (${alertas.length})` },
                  { id: 'INDICADOR', label: `Indicadores (${alertas.filter(a => a.tipo === 'INDICADOR').length})` },
                  { id: 'SANIDAD', label: `Sanidad (${alertas.filter(a => a.tipo === 'SANIDAD').length})` },
                  { id: 'INSUMO', label: `Insumos (${alertas.filter(a => a.tipo === 'INSUMO').length})` },
                  { id: 'ZOOTECNICA', label: `Zootécnicas (${alertas.filter(a => a.tipo === 'ZOOTECNICA').length})` },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFiltroTipo(t.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                      filtroTipo === t.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isLightMode
                        ? 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  reactivarTodasLasAlertas();
                  onAlertDismiss();
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center space-x-1 cursor-pointer whitespace-nowrap ml-2"
                title="Restablece todas las alertas para volver a verlas"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Restablecer</span>
              </button>
            </div>

            {/* Lista de Alertas */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {alertasFiltradas.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No hay alertas activas en esta categoría</p>
                  <p className="text-xs text-slate-500">
                    Todos los parámetros zootécnicos, stock de insumos y métricas del establecimiento están en rango óptimo.
                  </p>
                </div>
              ) : (
                alertasFiltradas.map(alerta => (
                  <div
                    key={alerta.id}
                    onClick={() => handleNavegar(alerta)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      alerta.leida
                        ? isLightMode
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                        : isLightMode
                        ? 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
                        : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        {getIconoTipo(alerta.tipo, alerta.nivel)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getNivelBadge(
                              alerta.nivel
                            )}`}
                          >
                            {alerta.nivel}
                          </span>
                          {alerta.perspectiva && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                              {alerta.perspectiva}
                            </span>
                          )}
                          <span
                            className={`text-xs font-bold ${
                              isLightMode ? 'text-slate-900 font-extrabold' : 'text-white'
                            }`}
                          >
                            {alerta.titulo}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            isLightMode ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        >
                          {alerta.mensaje}
                        </p>

                        {/* Bloque comparativo de valores para indicadores */}
                        {alerta.tipo === 'INDICADOR' && alerta.valorActual !== undefined && (
                          <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono bg-slate-900/90 dark:bg-slate-950/80 p-2 rounded-xl border border-slate-800 w-fit">
                            <span className="text-slate-400">Valor Real:</span>
                            <strong className={alerta.nivel === 'URGENTE' ? 'text-rose-400' : 'text-amber-400'}>
                              {alerta.valorActual} {alerta.unidadMedida || ''}
                            </strong>
                            {alerta.valorMeta !== undefined && (
                              <span className="text-slate-400">
                                • Meta Óptima: {alerta.valorMeta} {alerta.unidadMedida || ''}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-400 font-medium">
                          {alerta.fechaProgramada && (
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>Fecha: {alerta.fechaProgramada}</span>
                            </span>
                          )}
                          {alerta.tiempoRestante && (
                            <span className="flex items-center space-x-1 text-amber-400 font-bold">
                              <Clock className="w-3 h-3" />
                              <span>{alerta.tiempoRestante}</span>
                            </span>
                          )}
                          <span className="text-emerald-400 font-semibold hover:underline flex items-center space-x-1">
                            {alerta.tipo === 'INDICADOR' ? (
                              <>
                                <Calculator className="w-3 h-3" />
                                <span>Simular en Manual de Indicadores →</span>
                              </>
                            ) : alerta.moduloDestino === 'sistema' ? (
                              <span>Abrir Guía del Sistema →</span>
                            ) : (
                              <span>Ir a {alerta.moduloDestino.toUpperCase()} →</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={e => handleDescartar(alerta.id, e)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
                      title="Marcar como leída / descartar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className={`p-3.5 border-t flex items-center justify-between text-xs ${
                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span>
                Total notificables: <strong className="text-white">{alertas.length}</strong>
              </span>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

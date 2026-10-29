import React, { useState, useRef, useEffect } from 'react';
import { Usuario, Subunidad, Campania } from '../types/erp';
import {
  MonedaTipo,
  DOLAR_HOY_URL,
  CotizacionDolar,
  TipoCotizacionUsd,
} from '../services/currencyService';
import { CacheWorkerStatus } from '../services/offlineCacheService';
import {
  getSheetsVinculacionMetadata,
  subscribeToVinculacionMetadata,
  SheetsVinculacionMetadata
} from '../services/sheetsService';
import {
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  BookOpen,
  ExternalLink,
  Moon,
  Sun,
  Bell,
  Wifi,
  WifiOff,
  ChevronDown,
  HelpCircle,
  Clock,
  User,
  Settings,
  Beaker,
  Check,
  Shield,
  Sparkles,
  Bot,
  Type,
} from 'lucide-react';
import { formatFechaArg, formatHoraArg } from '../utils/dateUtils';

interface HeaderProps {
  currentUser: Usuario;
  subunidades: Subunidad[];
  campanias: Campania[];
  selectedSubunidad: string;
  onSelectSubunidad: (subId: string) => void;
  selectedCampania: string;
  onSelectCampania: (campId: string) => void;
  selectedEspecie?: string; // 'TODOS' | 'ESP001' | 'ESP002' | 'ESP003'
  onSelectEspecie?: (espId: string) => void;
  isTestMode: boolean;
  onToggleTestMode: () => void;
  isSyncing: boolean;
  onRefreshData: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  spreadsheetId: string | null;
  onConnectSheets: () => void;
  monedaVisualizacion: MonedaTipo;
  onToggleMonedaVisualizacion: (moneda: MonedaTipo) => void;
  tipoCotizacionUsd?: TipoCotizacionUsd;
  onToggleTipoCotizacionUsd?: (tipo: TipoCotizacionUsd) => void;
  cotizacionOficial: CotizacionDolar;
  onOpenManual: (term?: string) => void;
  onOpenNotificaciones: () => void;
  pendingAlertsCount: number;
  isLightMode: boolean;
  onToggleTheme: () => void;
  cacheWorkerStatus?: CacheWorkerStatus;
  isSimulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
  onExportExcel?: () => void;
  isExportingExcel?: boolean;
  onOpenChat?: () => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  subunidades,
  campanias,
  selectedSubunidad,
  onSelectSubunidad,
  selectedCampania,
  onSelectCampania,
  selectedEspecie = 'TODOS',
  onSelectEspecie,
  isTestMode,
  onToggleTestMode,
  isSyncing,
  onRefreshData,
  onOpenLogin,
  onLogout,
  spreadsheetId,
  onConnectSheets,
  monedaVisualizacion,
  onToggleMonedaVisualizacion,
  tipoCotizacionUsd = 'VENDEDOR',
  onToggleTipoCotizacionUsd,
  cotizacionOficial,
  onOpenManual,
  onOpenNotificaciones,
  pendingAlertsCount,
  isLightMode,
  onToggleTheme,
  cacheWorkerStatus = 'ONLINE_SYNCED',
  isSimulatedOffline = false,
  onToggleSimulatedOffline,
  onExportExcel,
  isExportingExcel = false,
  onOpenChat,
  activeTab = 'dashboard',
}) => {
  const [showUsdMenu, setShowUsdMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [currentArgTime, setCurrentArgTime] = useState<Date>(() => new Date());
  const [sheetsMeta, setSheetsMeta] = useState<SheetsVinculacionMetadata>(() => getSheetsVinculacionMetadata());

  // Suscribirse a cambios en vivo de la metadata de vinculación con Google Sheets
  useEffect(() => {
    const unsub = subscribeToVinculacionMetadata(meta => {
      setSheetsMeta(meta);
    });
    return () => unsub();
  }, []);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const usdMenuRef = useRef<HTMLDivElement>(null);
  const textSizeMenuRef = useRef<HTMLDivElement>(null);

  // 3 Estilos de tamaño de tipografía: Chico, Normal (+2 pts), Muy Grande
  const [textSize, setTextSize] = useState<'chico' | 'normal' | 'grande'>(() => {
    try {
      const saved = localStorage.getItem('agrogestiona_text_size');
      if (saved === 'chico' || saved === 'normal' || saved === 'grande') return saved;
    } catch (e) {}
    return 'normal';
  });
  const [showTextSizeMenu, setShowTextSizeMenu] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize);
    try {
      localStorage.setItem('agrogestiona_text_size', textSize);
    } catch (e) {}
  }, [textSize]);

  // Reloj horario Argentina en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentArgTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Cierre automático al hacer clic fuera o pulsar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (usdMenuRef.current && !usdMenuRef.current.contains(event.target as Node)) {
        setShowUsdMenu(false);
      }
      if (textSizeMenuRef.current && !textSizeMenuRef.current.contains(event.target as Node)) {
        setShowTextSizeMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowUsdMenu(false);
        setShowTextSizeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtrar subunidades según especie seleccionada si no es 'TODOS'
  const subunidadesFiltradas = selectedEspecie !== 'TODOS'
    ? subunidades.filter(s => (s.id_especie || 'ESP001') === selectedEspecie)
    : subunidades;

  const getBreadcrumbs = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return ['Inicio', 'Dashboard General'];
      case 'ganaderia':
        return ['Ganadería', 'Resumen Ganadero'];
      case 'majada':
        return ['Ganadería', 'Stock & Movimientos'];
      case 'produccion':
        return ['Producción', 'Producción & Consumos'];
      case 'sanidad':
        return ['Producción', 'Sanidad & Veterinaria'];
      case 'economia':
        return ['Operaciones', 'Registro de Operaciones'];
      case 'contabilidad':
        return ['Economía', 'Medición RT 54'];
      case 'analytics':
        return ['Inteligencia Ganadera', 'Centro de Inteligencia Ganadera'];
      case 'graficos':
        return ['Indicadores', 'Gráficos Comparativos'];
      case 'configuracion':
        return ['Administración', 'Configuración & Usuarios'];
      case 'auditoria':
        return ['Administración', 'Libro de Auditoría'];
      case 'modelo_datos':
        return ['Administración', 'Modelo de Datos'];
      case 'pruebas':
        return ['Calidad', 'Casos de Aceptación'];
      default:
        return ['Inicio', 'Dashboard'];
    }
  };

  const breadcrumbs = getBreadcrumbs(activeTab);

  return (
    <header
      className={`px-3 sm:px-5 py-2 sticky top-0 z-30 shadow-xs border-b transition-colors duration-200 ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
        {/* Izquierda: Branding AGROGESTIONA ERP con Logo Oficial y Breadcrumbs Discretos */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <img
            src="/assets/aistudio/image_6dfa77ba.png"
            alt="AGROGESTIONA ERP Logo"
            className="w-9 h-9 object-contain rounded-[2px] bg-white p-0.5 border border-emerald-600/40 shadow-xs shrink-0"
          />
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span
                className={`font-black text-xs sm:text-sm tracking-tight ${
                  isLightMode ? 'text-slate-900' : 'text-[#f2fcf6]'
                }`}
              >
                AGROGESTIONA ERP
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] hidden sm:inline ${
                isLightMode ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
              }`}>
                {selectedSubunidad !== 'TODOS' ? (subunidades.find(s => s.id_subunidad === selectedSubunidad)?.nombre || 'Pozo del Carril') : 'Pozo del Carril – La Aguada'}
              </span>
            </div>
            {/* Breadcrumbs Discretos */}
            <div className="flex items-center space-x-1 text-[10px] font-medium text-slate-500 dark:text-[#a2c7b5] mt-0.5">
              <span>{breadcrumbs[0]}</span>
              <span>/</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {breadcrumbs[1]}
              </span>
            </div>
          </div>
        </div>

        {/* Centro: SELECTOR PRINCIPAL GLOBAL DE ESPECIE + Subunidad + Campaña + Cotización */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* ========================================================= */}
          {/* 1. SELECTOR PRINCIPAL GLOBAL DE ESPECIE (REQUERIMIENTO 2) */}
          {/* ========================================================= */}
          {onSelectEspecie && (
            <div
              className={`flex items-center rounded-[2px] p-0.5 border text-xs ${
                isLightMode
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : 'bg-[#183027] border-[#264d3f]'
              }`}
              title="Selector Global de Especie / Vista: Modifica el contexto de toda la aplicación"
            >
              <span className="text-[10px] font-black uppercase tracking-wider px-1 text-emerald-700 dark:text-emerald-400 hidden lg:inline">
                ESPECIE:
              </span>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => onSelectEspecie('ESP001')}
                  className={`px-2 py-1 rounded-[2px] text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                    selectedEspecie === 'ESP001'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : isLightMode
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-emerald-100/60'
                      : 'text-neutral-300 hover:text-white hover:bg-[#242424]'
                  }`}
                  title="🐑 Ovinos (EspecieID: ESP001)"
                >
                  <span>🐑</span>
                  <span>Ovinos</span>
                </button>

                <button
                  onClick={() => onSelectEspecie('ESP002')}
                  className={`px-2 py-1 rounded-[2px] text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                    selectedEspecie === 'ESP002'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : isLightMode
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-blue-100/60'
                      : 'text-neutral-300 hover:text-white hover:bg-[#242424]'
                  }`}
                  title="🐄 Bovinos (EspecieID: ESP002)"
                >
                  <span>🐄</span>
                  <span>Bovinos</span>
                </button>

                <button
                  onClick={() => onSelectEspecie('ESP003')}
                  className={`px-2 py-1 rounded-[2px] text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                    selectedEspecie === 'ESP003'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : isLightMode
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-purple-100/60'
                      : 'text-neutral-300 hover:text-white hover:bg-[#242424]'
                  }`}
                  title="🐖 Porcinos (EspecieID: ESP003)"
                >
                  <span>🐖</span>
                  <span>Porcinos</span>
                </button>

                <button
                  onClick={() => onSelectEspecie('TODOS')}
                  className={`px-2 py-1 rounded-[2px] text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                    selectedEspecie === 'TODOS'
                      ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-500/60'
                      : isLightMode
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                      : 'text-neutral-300 hover:text-white hover:bg-[#242424]'
                  }`}
                  title="📊 Toda la Ganadería (Consolidado Multi-Especie)"
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">Toda la Ganadería</span>
                  <span className="sm:hidden">Todos</span>
                </button>
              </div>
            </div>
          )}



          {/* Selector de Campaña */}
          <select
            value={selectedCampania}
            onChange={e => onSelectCampania(e.target.value)}
            className={`text-[11px] rounded-lg px-2 py-1 font-medium border focus:outline-none cursor-pointer ${
              isLightMode
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Seleccionar Campaña Productiva"
          >
            {campanias.map(c => (
              <option key={c.id_campania} value={c.id_campania}>
                {c.codigo}
              </option>
            ))}
          </select>

          {/* Indicador sutil de Sandbox/Pruebas si está activo */}
          {isTestMode && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 flex items-center space-x-1"
              title="Modo Sandbox Activo"
            >
              <Beaker className="w-3 h-3" />
              <span>Sandbox</span>
            </span>
          )}

          {/* Cotización Dólar Oficial ARS / USD Compacta */}
          <div
            ref={usdMenuRef}
            className={`relative flex items-center rounded-lg p-0.5 border space-x-1 text-xs ${
              isLightMode
                ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                : 'bg-slate-950/80 border-slate-700/80 text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-0.5 pr-1 border-r border-slate-300 dark:border-slate-800">
              <button
                onClick={() => {
                  onToggleMonedaVisualizacion('ARS');
                  setShowUsdMenu(false);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  monedaVisualizacion === 'ARS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ver datos en Pesos Argentinos ($ ARS)"
              >
                ARS
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    onToggleMonedaVisualizacion('USD');
                    setShowUsdMenu(!showUsdMenu);
                  }}
                  className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    monedaVisualizacion === 'USD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ver en Dólares (USD) y seleccionar Tipo de Cambio"
                >
                  <span>USD</span>
                  <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                </button>

                {/* Submenú de Tipo de Cambio USD */}
                {showUsdMenu && (
                  <div
                    className={`absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-xl z-50 p-2 text-xs animate-in fade-in-50 duration-150 ${
                      isLightMode
                        ? 'bg-white border-slate-300 text-slate-900 shadow-slate-400/30'
                        : 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold">Tipo de Cambio Dólar</span>
                      <button
                        onClick={() => {
                          setShowUsdMenu(false);
                          onOpenManual('Tipo de Cambio Comprador');
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-0.5"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Manual</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onToggleTipoCotizacionUsd) onToggleTipoCotizacionUsd('COMPRADOR');
                          onToggleMonedaVisualizacion('USD');
                          setShowUsdMenu(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                          tipoCotizacionUsd === 'COMPRADOR'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/40'
                            : isLightMode
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-semibold block text-[11px]">TC Comprador</span>
                          <span className="text-[10px] text-slate-400">Ventas / Cobros</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          ${cotizacionOficial.compra.toLocaleString('es-AR')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onToggleTipoCotizacionUsd) onToggleTipoCotizacionUsd('VENDEDOR');
                          onToggleMonedaVisualizacion('USD');
                          setShowUsdMenu(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                          tipoCotizacionUsd === 'VENDEDOR'
                            ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 font-bold border border-blue-500/40'
                            : isLightMode
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-semibold block text-[11px]">TC Vendedor</span>
                          <span className="text-[10px] text-slate-400">Compras / Costos</span>
                        </div>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          ${cotizacionOficial.venta.toLocaleString('es-AR')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Valores rápidos Dólar Hoy C: / V: */}
            <div className="flex items-center space-x-1.5 px-1 text-[10px] font-mono">
              <span
                onClick={() => {
                  if (onToggleTipoCotizacionUsd) onToggleTipoCotizacionUsd('COMPRADOR');
                  onToggleMonedaVisualizacion('USD');
                }}
                className={`cursor-pointer hover:underline ${
                  monedaVisualizacion === 'USD' && tipoCotizacionUsd === 'COMPRADOR' ? 'font-bold' : ''
                }`}
                title="Aplicar TC Comprador"
              >
                <span className="text-slate-500 font-sans">C:</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  ${cotizacionOficial.compra.toLocaleString('es-AR')}
                </strong>
              </span>
              <span className="text-slate-400">|</span>
              <span
                onClick={() => {
                  if (onToggleTipoCotizacionUsd) onToggleTipoCotizacionUsd('VENDEDOR');
                  onToggleMonedaVisualizacion('USD');
                }}
                className={`cursor-pointer hover:underline ${
                  monedaVisualizacion === 'USD' && tipoCotizacionUsd === 'VENDEDOR' ? 'font-bold' : ''
                }`}
                title="Aplicar TC Vendedor"
              >
                <span className="text-slate-500 font-sans">V:</span>{' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  ${cotizacionOficial.venta.toLocaleString('es-AR')}
                </strong>
              </span>
              <a
                href={DOLAR_HOY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-emerald-500 p-0.5"
                title="Ver cotización oficial en Dólar Hoy"
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Derecha: Notificaciones, Tema ☼/☾, Sincronización Rápida y Menú Único de Usuario & Configuración */}
        <div className="flex items-center space-x-1.5">
          {/* Botón Asistente IA (Orientación & Análisis) */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-[2px] border transition-colors cursor-pointer shadow-xs ${
                isLightMode
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-[#183027] hover:bg-[#1f3d32] border-[#264d3f] text-emerald-300'
              }`}
              title="Abrir Asistente IA: Orientación del Sistema e Interpretación de Datos"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden md:inline text-[11px] font-bold">Asistente IA</span>
            </button>
          )}

          {/* Selector de 3 Estilos de Tipografía: Chico, Normal (+2-3 pts), Muy Grande */}
          <div className="relative" ref={textSizeMenuRef}>
            <button
              type="button"
              onClick={() => setShowTextSizeMenu(!showTextSizeMenu)}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-[2px] border transition-colors cursor-pointer shadow-xs ${
                isLightMode
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-[#183027] hover:bg-[#1f3d32] border-[#264d3f] text-[#f2fcf6]'
              }`}
              title="Ajustar tamaño de letra: Chico (15px), Normal (17.5px) o Muy Grande (20.5px)"
            >
              <Type className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold hidden lg:inline">
                {textSize === 'chico' ? 'A- Chico' : textSize === 'normal' ? 'A Normal' : 'A+ Grande'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showTextSizeMenu && (
              <div
                className={`absolute right-0 mt-1.5 w-52 rounded-[2px] shadow-2xl border py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
                }`}
              >
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-[#264d3f] text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Tamaño de Letra</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Personalizable</span>
                </div>
                {(
                  [
                    { id: 'chico', label: 'Tamaño Chico', sub: '15px compacto', badge: 'Compacto' },
                    { id: 'normal', label: 'Tamaño Normal', sub: '17.5px estándar (+2.5 pts)', badge: 'Recomendado' },
                    { id: 'grande', label: 'Tamaño Muy Grande', sub: '20.5px lectura cómoda', badge: 'Accesible' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTextSize(opt.id);
                      setShowTextSizeMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer transition-colors ${
                      textSize === opt.id
                        ? 'bg-emerald-700/20 text-emerald-400 font-bold border-l-2 border-emerald-500'
                        : isLightMode
                        ? 'hover:bg-slate-100'
                        : 'hover:bg-[#183027]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <span className="text-[9px] px-1 rounded-[2px] bg-slate-700/50 text-slate-300">
                          {opt.badge}
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-400">{opt.sub}</span>
                    </div>
                    {textSize === opt.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Directo Tema Claro / Oscuro (1 Clic) */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-[2px] border transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5] hover:bg-[#1f3d32] hover:text-[#f2fcf6]'
            }`}
            title={isLightMode ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
          >
            {isLightMode ? (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Campana de Notificaciones y Alertas (Compacta) */}
          <button
            onClick={onOpenNotificaciones}
            className={`relative p-1.5 rounded-[2px] border transition-colors cursor-pointer ${
              pendingAlertsCount > 0
                ? isLightMode
                  ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : isLightMode
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5] hover:bg-[#1f3d32]'
            }`}
            title="Alertas de sanidad, vencimientos y avisos zootécnicos"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            {pendingAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-[2px] text-[8px] font-bold flex items-center justify-center">
                {pendingAlertsCount}
              </span>
            )}
          </button>

          {/* Botón de Sincronización Rápida (Icono reducido) */}
          <button
            onClick={onRefreshData}
            disabled={isSyncing}
            className={`p-1.5 rounded-[2px] border transition-colors cursor-pointer disabled:opacity-50 ${
              isLightMode
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#183027] hover:bg-[#1f3d32] border-[#264d3f] text-[#a2c7b5]'
            }`}
            title={`Sincronizar datos con Google Sheets. Última actualización: ${sheetsMeta.ultimaFechaHoraCompleta}`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'animate-spin text-emerald-500' : 'text-[#a2c7b5]'
              }`}
            />
          </button>

          {/* Indicador de Estado y Última Actualización de Vinculación con Google Sheets */}
          {onConnectSheets && (
            <button
              onClick={onConnectSheets}
              className={`px-2 py-1 rounded-[2px] border text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isLightMode
                  ? spreadsheetId
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                  : spreadsheetId
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
              }`}
              title={`Google Sheets: ${spreadsheetId ? 'Vinculado y sincronizado' : 'Sin vincular'}. Última actualización: ${sheetsMeta.ultimaFechaHoraCompleta}. Clic para ver configuración y diagnóstico.`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span
                className={`w-1.5 h-1.5 rounded-[1px] shrink-0 ${
                  spreadsheetId && sheetsMeta.estado === 'CONECTADO'
                    ? 'bg-emerald-500'
                    : spreadsheetId
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline font-mono text-[10px]">
                {spreadsheetId
                  ? `Sheets: ${sheetsMeta.ultimaHora ? sheetsMeta.ultimaHora.replace(' hs (ART)', '') : 'OK'}`
                  : 'Sheets: Sin vincular'}
              </span>
            </button>
          )}

          {/* ========================================================================= */}
          {/* MENÚ DESPLEGABLE ÚNICO DE USUARIO Y CONFIGURACIÓN (SIMPLIFICA LA INTERFAZ) */}
          {/* ========================================================================= */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center space-x-2 pl-1.5 pr-2 py-1 rounded-lg border text-left cursor-pointer transition-all shadow-xs ${
                showUserMenu
                  ? isLightMode
                    ? 'bg-slate-200 border-slate-400'
                    : 'bg-slate-700 border-slate-600 ring-1 ring-emerald-500/40'
                  : isLightMode
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Menú de Usuario y Configuración del Sistema"
            >
              {/* Avatar Reducido */}
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30 shrink-0">
                {currentUser.username[0].toUpperCase()}
              </div>

              {/* Datos de usuario compactos */}
              <div className="hidden sm:block leading-tight text-xs">
                <span
                  className={`font-semibold block text-[11px] max-w-[110px] truncate ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  @{currentUser.username}
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium block uppercase leading-none">
                  {currentUser.rol_nombre}
                </span>
              </div>

              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                  showUserMenu ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Unificado */}
            {showUserMenu && (
              <div
                className={`absolute right-0 top-full mt-1.5 w-64 rounded-xl border shadow-xl z-50 py-2 text-xs animate-in fade-in-50 zoom-in-95 duration-150 ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 shadow-slate-400/30'
                    : 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
                }`}
              >
                {/* 1. Encabezado de Usuario y Perfil */}
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xs border border-emerald-500/30 shrink-0">
                      {currentUser.username[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs truncate">{currentUser.nombre_completo}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{currentUser.username}</p>
                      <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        {currentUser.rol_nombre}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Sección Configuración de Entorno & Visualización */}
                <div className="py-1 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <span className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Configuración Visual
                  </span>

                  {/* Toggle Tema Claro / Oscuro */}
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isLightMode ? (
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>Tema: {isLightMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Alternar</span>
                  </button>

                  {/* Toggle Modo Sandbox / Pruebas */}
                  <button
                    onClick={() => {
                      onToggleTestMode();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Beaker className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo Sandbox</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isTestMode
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'text-slate-400'
                      }`}
                    >
                      {isTestMode ? 'Activo' : 'Real'}
                    </span>
                  </button>

                  {/* Estado de Red / Caché Offline */}
                  {onToggleSimulatedOffline && (
                    <button
                      onClick={() => {
                        onToggleSimulatedOffline();
                      }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isSimulatedOffline ? (
                          <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span>Caché Offline (SW)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isSimulatedOffline ? 'Desconectado' : 'Online'}
                      </span>
                    </button>
                  )}
                </div>

                {/* 3. Sección Herramientas del Sistema */}
                <div className="py-1 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <span className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Herramientas
                  </span>

                  {/* Exportar a Excel */}
                  {onExportExcel && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onExportExcel();
                      }}
                      disabled={isExportingExcel}
                      className={`w-full px-3 py-1.5 flex items-center space-x-2 text-left transition-colors cursor-pointer disabled:opacity-50 ${
                        isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isExportingExcel ? 'Exportando Excel...' : 'Exportar Base a Excel (.xlsx)'}</span>
                    </button>
                  )}

                  {/* Asistente IA del Sistema */}
                  {onOpenChat && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenChat();
                      }}
                      className={`w-full px-3 py-1.5 flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                        isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Asistente IA (Ayuda & Análisis)</span>
                    </button>
                  )}

                  {/* Manual y Guía del Sistema */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenManual();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                      isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Manual Didáctico & Guía</span>
                  </button>

                  {/* Conectar / Ajustar Google Sheets */}
                  {onConnectSheets && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onConnectSheets();
                      }}
                      className={`w-full px-3 py-2 flex flex-col text-left transition-colors cursor-pointer ${
                        isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-xs">Configuración de Google Sheets</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono pl-5.5 mt-0.5">
                        Última act: {sheetsMeta.ultimaFecha} {sheetsMeta.ultimaHora ? sheetsMeta.ultimaHora.replace(' hs (ART)', '') : ''} hs (ART)
                      </span>
                    </button>
                  )}
                </div>

                {/* 4. Hora Oficial Argentina */}
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Hora ART (UTC-3):</span>
                  </div>
                  <span className="font-bold text-slate-300">
                    {formatHoraArg(currentArgTime, false)} hs
                  </span>
                </div>

                {/* 5. Acciones de Sesión & Usuario */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenLogin();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                      isLightMode ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cambiar Usuario / Rol</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-1.5 flex items-center space-x-2 text-left text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

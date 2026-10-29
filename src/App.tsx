/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Aplicación Web Principal
 */

import React, { useState, useEffect } from 'react';
import {
  loadDatabaseState,
  saveDatabaseState,
  getSavedSpreadsheetId,
  setSavedSpreadsheetId,
  pullAllDataFromGoogleSheets,
  DatabaseState
} from './services/sheetsService';
import { getAccessToken, initAuth } from './services/firebase';
import { Usuario } from './types/erp';
import { hasModuleAccess } from './services/permissionService';
import {
  MonedaTipo,
  CotizacionDolar,
  TipoCotizacionUsd,
  getCotizacionOficial,
  fetchCotizacionEnVivo,
  getMonedaVisualizacion,
  saveMonedaVisualizacion,
  getTipoCotizacionUsd,
  saveTipoCotizacionUsd,
  getTipoCambioPorModo,
  getTipoCambioOficial,
  saveTipoCambioOficial
} from './services/currencyService';
import {
  CacheWorkerStatus,
  initializeServiceWorkerEngine,
  subscribeToWorkerStatus,
  setSimulatedOfflineMode,
  isSimulatedOfflineForced,
  isNetworkAvailable
} from './services/offlineCacheService';
import { calcularAlertasDelSistema } from './services/alertService';
import { getFechaArgentinaISO } from './utils/dateUtils';

import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { AccessDenied } from './components/AccessDenied';
import { PantallaInicio } from './components/PantallaInicio';
import { ManualConceptosModal } from './components/ManualConceptosModal';
import { NotificacionesEmergentes } from './components/NotificacionesEmergentes';
import { ChatAsistenteIA } from './components/ChatAsistenteIA';
import { WifiOff, Wifi, RefreshCw, FileSpreadsheet, CheckCircle2, AlertCircle, X, Sparkles, Bot } from 'lucide-react';
import { exportarDatosFiltradosExcel, ExportResult } from './services/excelExportService';

import { DashboardModule } from './modules/DashboardModule';
import { GanaderiaModule } from './modules/GanaderiaModule';
import { BusinessAnalyticsModule } from './modules/BusinessAnalyticsModule';
import { GraficosModule } from './modules/GraficosModule';
import { MajadaModule } from './modules/MajadaModule';
import { ProduccionConsumosModule } from './modules/ProduccionConsumosModule';
import { SanidadModule } from './modules/SanidadModule';
import { OperacionesEconomicasModule } from './modules/OperacionesEconomicasModule';
import { ContabilidadModule } from './modules/ContabilidadModule';
import { AuditoriaModule } from './modules/AuditoriaModule';
import { CasosPruebaModule } from './modules/CasosPruebaModule';
import { ConfiguracionModule } from './modules/ConfiguracionModule';
import { ModeloDatosModule } from './modules/ModeloDatosModule';
import { EcosistemaGoogleModule } from './modules/EcosistemaGoogleModule';
import { AsesoriaIAModule } from './modules/AsesoriaIAModule';
import { NoticiasAgroModule } from './modules/NoticiasAgroModule';

import { getActiveUserSession, saveUserSession, clearUserSession, refreshSessionUser } from './services/authSessionService';
import { startUserSession, closeUserSession } from './services/sessionService';

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState>(() => loadDatabaseState());
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const session = getActiveUserSession();
    return session ? session.user : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedEspecie, setSelectedEspecie] = useState<string>('TODOS');
  const [selectedSubunidad, setSelectedSubunidad] = useState<string>('TODOS');
  const [selectedCampania, setSelectedCampania] = useState<string>('CAM-2026');

  const handleSelectEspecie = (espId: string) => {
    setSelectedEspecie(espId);
    // Si se selecciona una especie específica y la subunidad activa no corresponde a esa especie, restablecer a 'TODOS'
    if (espId !== 'TODOS' && selectedSubunidad !== 'TODOS') {
      const sub = dbState.subunidades.find(s => s.id_subunidad === selectedSubunidad);
      if (sub && (sub.id_especie || 'ESP001') !== espId) {
        setSelectedSubunidad('TODOS');
      }
    }
  };
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => getSavedSpreadsheetId());

  // Gestión de moneda dual y cotización oficial (Compra y Venta diferenciadas desde Dólar Hoy)
  const [monedaVisualizacion, setMonedaVisualizacion] = useState<MonedaTipo>(() => getMonedaVisualizacion());
  const [tipoCotizacionUsd, setTipoCotizacionUsd] = useState<TipoCotizacionUsd>(() => getTipoCotizacionUsd());
  const [cotizacionOficial, setCotizacionOficial] = useState<CotizacionDolar>(() => getCotizacionOficial());
  
  // Tipo de cambio activo efectivo según el modo Comprador o Vendedor
  const [tipoCambioOficial, setTipoCambioOficial] = useState<number>(() => {
    const cot = getCotizacionOficial();
    const modo = getTipoCotizacionUsd();
    return modo === 'COMPRADOR' ? cot.compra : cot.venta;
  });

  // Tema Claro / Oscuro (Pantalla Clara con colores claros vs Pantalla Oscura original)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('erp_ovinos_theme_v1');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark'; // Por defecto pantalla oscura como estaba
  });
  const isLightMode = theme === 'light';

  // Modal / Drawer de Notificaciones Emergentes
  const [isNotificacionesOpen, setIsNotificacionesOpen] = useState<boolean>(false);

  // Modal de Manual de Conceptos y Glosario Didáctico
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualHighlightTerm, setManualHighlightTerm] = useState<string | undefined>(undefined);
  const [manualInitialTab, setManualInitialTab] = useState<'SISTEMA' | 'GLOSARIO' | 'INDICADORES' | undefined>(undefined);
  const [manualInitialIndicadorId, setManualInitialIndicadorId] = useState<string | undefined>(undefined);

  // Asistente de Inteligencia Artificial (Chatbot de ayuda técnica y datos en tiempo real)
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Estado de Exportación Global a Excel (XLSX)
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [excelExportToast, setExcelExportToast] = useState<{
    show: boolean;
    success: boolean;
    title: string;
    message: string;
    fileName?: string;
  } | null>(null);

  // Estado del Service Worker y Caché Local
  const [cacheWorkerStatus, setCacheWorkerStatus] = useState<CacheWorkerStatus>('ONLINE_SYNCED');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => isSimulatedOfflineForced());

  // Consultar cotización oficial en vivo desde backend al iniciar
  useEffect(() => {
    fetchCotizacionEnVivo().then(fresh => {
      if (fresh && fresh.compra > 0 && fresh.venta > 0) {
        setCotizacionOficial(fresh);
        const tc = tipoCotizacionUsd === 'COMPRADOR' ? fresh.compra : fresh.venta;
        setTipoCambioOficial(tc);
      }
    });
  }, [tipoCotizacionUsd]);

  // Inicializar motor de Service Worker y suscripción a eventos de conectividad
  useEffect(() => {
    initializeServiceWorkerEngine(() => {
      console.log('[SW] Conectividad restablecida: sincronizando datos con Google Sheets...');
      handleRefreshData();
    });

    const unsubscribe = subscribeToWorkerStatus(status => {
      setCacheWorkerStatus(status);
      setIsSimulatedOffline(isSimulatedOfflineForced());
    });

    return () => unsubscribe();
  }, []);

  // Sincronizar catálogo de usuarios y habilitaciones frescas desde el servidor backend al cargar
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          // Reconciliar estado del usuario actual contra el backend
          if (currentUser) {
            const currentInBackend = data.users.find(
              (bu: Usuario) =>
                bu.id_usuario === currentUser.id_usuario ||
                bu.username.toLowerCase() === currentUser.username.toLowerCase() ||
                (bu.email && currentUser.email && bu.email.toLowerCase() === currentUser.email.toLowerCase())
            );
            if (currentInBackend) {
              const estaInhabilitado = currentInBackend.inhabilitado === true || currentInBackend.activo === false;
              if (estaInhabilitado) {
                console.warn('Usuario inhabilitado en backend, cerrando sesión:', currentUser.username);
                handleLogout();
              } else {
                const refreshed: Usuario = {
                  ...currentUser,
                  ...currentInBackend,
                  activo: true,
                  inhabilitado: false,
                };
                setCurrentUser(refreshed);
                try {
                  localStorage.setItem('erp_ovinos_auth_user_v1', JSON.stringify(refreshed));
                } catch (e) {}
              }
            }
          }

          setDbState(prevState => {
            const nextUsers = [...data.users];
            prevState.usuarios.forEach(pu => {
              if (!nextUsers.some(nu => nu.id_usuario === pu.id_usuario || nu.username.toLowerCase() === pu.username.toLowerCase())) {
                nextUsers.push({
                  ...pu,
                  activo: pu.activo !== undefined ? !!pu.activo : !pu.inhabilitado,
                  inhabilitado: pu.inhabilitado !== undefined ? !!pu.inhabilitado : !pu.activo,
                });
              }
            });

            // Garantizar usuario 123 (taller 2)
            if (!nextUsers.some(u => u.username === '123')) {
              nextUsers.push({
                id_usuario: 'USR-123',
                username: '123',
                password_hash: 'taller 2',
                nombre_completo: 'Usuario Taller 2',
                email: 'taller2@unrc.edu.ar',
                id_rol: 'ROL-ADMIN',
                rol_nombre: 'ADMINISTRADOR',
                activo: true,
                inhabilitado: false,
                fecha_alta: '2026-07-01',
                fecha_modificacion: '2026-10-08',
              });
            }

            const updated = { ...prevState, usuarios: nextUsers };
            saveDatabaseState(updated);

            // Sincronizar catálogo hacia el backend
            fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usuarios: nextUsers }),
            }).catch(() => {});

            return updated;
          });
        }
      })
      .catch(e => console.warn('No se pudieron sincronizar usuarios del backend al iniciar:', e));
  }, []);

  // Sincronizar clase CSS global con el modo claro / oscuro
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('theme-light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('theme-light');
      document.body.classList.add('dark');
    }
  }, [isLightMode]);

  // Escuchar cambios de autenticación de Firebase y validar usuarios externos
  useEffect(() => {
    initAuth(
      (googleUser, token) => {
        console.log('Sesión Google activa para Sheets:', googleUser.email);
        const email = googleUser.email?.toLowerCase().trim();
        if (email && !currentUser) {
          fetch('/api/users')
            .then(res => res.json())
            .then(data => {
              const catalog: Usuario[] = data.success && Array.isArray(data.users) ? data.users : dbState.usuarios;
              const found = catalog.find(
                u =>
                  (u.email && u.email.toLowerCase().trim() === email) ||
                  u.username.toLowerCase().trim() === email ||
                  (u.email && u.email.split('@')[0].toLowerCase() === email.split('@')[0])
              );

              if (found) {
                if (found.inhabilitado === true || found.activo === false) {
                  console.warn('Usuario externo inhabilitado en el sistema:', email);
                  return;
                }
                const validUser: Usuario = {
                  ...found,
                  activo: true,
                  inhabilitado: false,
                };
                setCurrentUser(validUser);
                try {
                  localStorage.setItem('erp_ovinos_auth_user_v1', JSON.stringify(validUser));
                } catch (e) {}
              } else {
                // Usuario externo validado por Google OAuth
                const extUser: Usuario = {
                  id_usuario: `USR-GOOG-${Date.now()}`,
                  username: (email.split('@')[0] || 'usuario').replace(/[^a-zA-Z0-9_]/g, ''),
                  password_hash: 'google_authenticated',
                  nombre_completo: googleUser.displayName || `Usuario (${email})`,
                  email: email,
                  id_rol: 'ROL-ADMIN',
                  rol_nombre: 'ADMINISTRADOR',
                  activo: true,
                  inhabilitado: false,
                  fecha_alta: getFechaArgentinaISO(),
                  fecha_modificacion: getFechaArgentinaISO(),
                };
                setCurrentUser(extUser);
                try {
                  localStorage.setItem('erp_ovinos_auth_user_v1', JSON.stringify(extUser));
                } catch (e) {}
                fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(extUser),
                }).catch(() => {});
              }
            })
            .catch(e => console.warn('Error al verificar usuario externo Google:', e));
        }
      },
      () => {
        // Auth callback
      }
    );
  }, [currentUser]);

  // Redirigir automáticamente si el usuario actual no posee acceso al módulo seleccionado
  // Se evalúa tanto por cambio de estado como por evento reactivo inmediato 'agrogestiona_permissions_changed'
  useEffect(() => {
    const verifyAccess = () => {
      if (currentUser && !hasModuleAccess(currentUser, activeTab)) {
        setActiveTab('dashboard');
      }
    };

    verifyAccess();

    window.addEventListener('agrogestiona_permissions_changed', verifyAccess);
    return () => {
      window.removeEventListener('agrogestiona_permissions_changed', verifyAccess);
    };
  }, [currentUser, activeTab]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('erp_ovinos_theme_v1', nextTheme);
    } catch (e) {}
  };

  const handleStateUpdate = () => {
    const updated = loadDatabaseState();
    setDbState({ ...updated });
  };

  const handleToggleMonedaVisualizacion = (moneda: MonedaTipo) => {
    setMonedaVisualizacion(moneda);
    saveMonedaVisualizacion(moneda);
  };

  const handleToggleTipoCotizacionUsd = (tipo: TipoCotizacionUsd) => {
    setTipoCotizacionUsd(tipo);
    saveTipoCotizacionUsd(tipo);
    const tc = tipo === 'COMPRADOR' ? cotizacionOficial.compra : cotizacionOficial.venta;
    setTipoCambioOficial(tc);
  };

  const handleToggleSimulatedOffline = () => {
    const nextVal = !isSimulatedOffline;
    setSimulatedOfflineMode(nextVal);
    setIsSimulatedOffline(nextVal);
  };

  const handleOpenManual = (
    term?: string,
    tab?: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES',
    indicadorId?: string
  ) => {
    setManualHighlightTerm(term);
    setManualInitialTab(tab);
    setManualInitialIndicadorId(indicadorId);
    setIsManualModalOpen(true);
  };

  const handleRefreshData = async () => {
    setIsSyncing(true);
    try {
      if (spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          const fresh = await pullAllDataFromGoogleSheets(token, spreadsheetId);
          setDbState({ ...fresh });
        } else {
          handleStateUpdate();
        }
      } else {
        handleStateUpdate();
      }

      // Refrescar también la cotización del dólar en vivo
      const cotFresh = await fetchCotizacionEnVivo();
      if (cotFresh) {
        setCotizacionOficial(cotFresh);
        const tc = tipoCotizacionUsd === 'COMPRADOR' ? cotFresh.compra : cotFresh.venta;
        setTipoCambioOficial(tc);
      }
    } catch (e) {
      console.warn('Refresh fallback to local database state:', e);
      handleStateUpdate();
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  const handleSpreadsheetIdChange = (id: string | null) => {
    setSpreadsheetId(id);
    setSavedSpreadsheetId(id);
  };

  const handleExportarExcelGlobal = () => {
    if (!currentUser) return;
    setIsExportingExcel(true);
    try {
      const tc = tipoCotizacionUsd === 'COMPRADOR' ? cotizacionOficial.compra : cotizacionOficial.venta;
      const res: ExportResult = exportarDatosFiltradosExcel({
        state: dbState,
        currentUser,
        selectedSubunidad,
        selectedCampania,
        isTestMode,
        monedaVisualizacion,
        tipoCambioOficial: tc > 0 ? tc : tipoCambioOficial,
      });

      if (res.success) {
        setExcelExportToast({
          show: true,
          success: true,
          title: 'Exportación a Excel completada',
          message: `Se descargó con éxito el archivo ${res.fileName} con datos filtrados de Majada (${res.resumen.totalCabezas} existencias, ${res.resumen.totalMovimientos} movimientos), Consumos (${res.resumen.totalConsumos} insumos), Sanidad (${res.resumen.totalSanidad} tratamientos) y Producción.`,
          fileName: res.fileName,
        });
      } else {
        setExcelExportToast({
          show: true,
          success: false,
          title: 'No se pudo generar el archivo Excel',
          message: res.error || 'Ocurrió un error inesperado al procesar los libros de cálculo.',
        });
      }
    } catch (err: any) {
      console.error('Error al exportar Excel global:', err);
      setExcelExportToast({
        show: true,
        success: false,
        title: 'Error de exportación',
        message: err?.message || 'Error interno al exportar los datos a formato XLSX.',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleLogin = (user: Usuario, rememberMe?: boolean) => {
    if (user.inhabilitado === true || user.activo === false) {
      console.warn('Usuario inhabilitado intentando acceder:', user.username);
      return;
    }
    const verifiedUser: Usuario = {
      ...user,
      activo: true,
      inhabilitado: false,
    };
    saveUserSession(verifiedUser, !!rememberMe);
    startUserSession(verifiedUser, dbState);
    setCurrentUser(verifiedUser);
    setIsLoginModalOpen(false);
    handleStateUpdate();
  };

  const handleLogout = () => {
    if (currentUser) {
      closeUserSession(currentUser, dbState);
    }
    clearUserSession();
    setCurrentUser(null);
  };

  // Si no hay sesión iniciada, mostrar la Pantalla de Inicio
  if (!currentUser) {
    return (
      <PantallaInicio
        onLogin={handleLogin}
        usuariosDisponibles={dbState.usuarios}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // Alertas dinámicas calculadas desde el motor zootécnico y de insumos
  const alertasDelSistema = calcularAlertasDelSistema(dbState);
  const pendingAlertsCount = alertasDelSistema.filter(a => !a.leida).length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
        isLightMode ? 'theme-light bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Header Superior Global con Selector de Especie, Moneda Dual, Dólar Hoy, Botón Luna, Tipo Cambio USD y Caché SW */}
      <Header
        activeTab={activeTab}
        currentUser={currentUser}
        subunidades={dbState.subunidades}
        campanias={dbState.campanias}
        selectedSubunidad={selectedSubunidad}
        onSelectSubunidad={setSelectedSubunidad}
        selectedCampania={selectedCampania}
        onSelectCampania={setSelectedCampania}
        selectedEspecie={selectedEspecie}
        onSelectEspecie={handleSelectEspecie}
        isTestMode={isTestMode}
        onToggleTestMode={() => setIsTestMode(!isTestMode)}
        isSyncing={isSyncing}
        onRefreshData={handleRefreshData}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        spreadsheetId={spreadsheetId}
        onConnectSheets={() => setActiveTab('configuracion')}
        monedaVisualizacion={monedaVisualizacion}
        onToggleMonedaVisualizacion={handleToggleMonedaVisualizacion}
        tipoCotizacionUsd={tipoCotizacionUsd}
        onToggleTipoCotizacionUsd={handleToggleTipoCotizacionUsd}
        cotizacionOficial={cotizacionOficial}
        onOpenManual={handleOpenManual}
        onOpenNotificaciones={() => setIsNotificacionesOpen(true)}
        pendingAlertsCount={pendingAlertsCount}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
        cacheWorkerStatus={cacheWorkerStatus}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        onExportExcel={handleExportarExcelGlobal}
        isExportingExcel={isExportingExcel}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Banner de Operatividad Offline con Caché de Service Worker */}
      {(isSimulatedOffline || cacheWorkerStatus === 'OFFLINE_CACHE_ACTIVE') && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-amber-800 dark:text-amber-200 backdrop-blur-md gap-2">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Modo Sin Conexión (Caché Service Worker Activa):</strong> Operando con datos locales de LocalStorage. Puedes seguir interactuando, consultando y cargando datos normalmente sin conexión a Google Sheets.
            </span>
          </div>
          <button
            onClick={handleToggleSimulatedOffline}
            className="px-2.5 py-1 bg-amber-500/30 hover:bg-amber-500/40 text-amber-900 dark:text-amber-100 border border-amber-500/50 rounded-lg font-bold text-[11px] cursor-pointer"
          >
            {isSimulatedOffline ? 'Reconectar con Google Sheets' : 'Reintentar Conexión'}
          </button>
        </div>
      )}

      {/* Contenedor Principal: Sidebar + Área de Contenido */}
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingAlertsCount={pendingAlertsCount}
          currentUser={currentUser}
          isLightMode={isLightMode}
        />

        <main className="flex-1 p-4 lg:p-7 max-w-7xl w-full mx-auto overflow-y-auto overflow-x-hidden min-w-0">
          {!hasModuleAccess(currentUser, activeTab) ? (
            <AccessDenied
              currentUser={currentUser}
              moduleName={
                activeTab === 'economia'
                  ? 'Operaciones Económicas'
                  : activeTab === 'contabilidad'
                  ? 'Medición Contable (RT 54)'
                  : activeTab === 'auditoria'
                  ? 'Registro de Auditoría'
                  : activeTab === 'configuracion'
                  ? 'Configuración & Usuarios'
                  : activeTab === 'modelo_datos'
                  ? 'Modelo de Datos (Exclusivo Administradores)'
                  : activeTab === 'analytics'
                  ? 'Centro de Inteligencia Ganadera'
                  : activeTab
              }
              onGoBack={() => setActiveTab('dashboard')}
              onOpenLogin={() => setIsLoginModalOpen(true)}
            />
          ) : (
            <>
              {activeTab === 'ganaderia' && (
                <GanaderiaModule
                  state={dbState}
                  currentUser={currentUser}
                  selectedEspecie={selectedEspecie}
                  onSelectEspecie={handleSelectEspecie}
                  selectedCampania={selectedCampania}
                  isTestMode={isTestMode}
                  onNavigateTab={setActiveTab}
                  onOpenManual={handleOpenManual}
                  monedaVisualizacion={monedaVisualizacion}
                  tipoCambioOficial={tipoCambioOficial}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardModule
                  state={dbState}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  selectedEspecie={selectedEspecie}
                  isTestMode={isTestMode}
                  onNavigateTab={setActiveTab}
                  onOpenManual={handleOpenManual}
                  monedaVisualizacion={monedaVisualizacion}
                  tipoCambioOficial={tipoCambioOficial}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'analytics' && (
                <BusinessAnalyticsModule
                  state={dbState}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  selectedEspecie={selectedEspecie}
                  isTestMode={isTestMode}
                  onNavigateTab={setActiveTab}
                  onOpenManual={handleOpenManual}
                  monedaVisualizacion={monedaVisualizacion}
                  tipoCambioOficial={tipoCambioOficial}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'graficos' && (
                <GraficosModule
                  state={dbState}
                  currentUser={currentUser}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  selectedEspecie={selectedEspecie}
                  isTestMode={isTestMode}
                  onOpenManual={handleOpenManual}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'majada' && (
                <MajadaModule
                  state={dbState}
                  currentUser={currentUser}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  selectedEspecie={selectedEspecie}
                  isTestMode={isTestMode}
                  onStateUpdate={handleStateUpdate}
                  onOpenManual={handleOpenManual}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'produccion' && (
                <ProduccionConsumosModule
                  state={dbState}
                  currentUser={currentUser}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  isTestMode={isTestMode}
                  onStateUpdate={handleStateUpdate}
                  onOpenManual={handleOpenManual}
                  monedaVisualizacion={monedaVisualizacion}
                  tipoCambioOficial={tipoCambioOficial}
                />
              )}

              {activeTab === 'sanidad' && (
                <SanidadModule
                  state={dbState}
                  currentUser={currentUser}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  isTestMode={isTestMode}
                  onStateUpdate={handleStateUpdate}
                  onOpenManual={handleOpenManual}
                />
              )}

              {activeTab === 'economia' && (
                <OperacionesEconomicasModule
                  state={dbState}
                  currentUser={currentUser}
                  selectedSubunidad={selectedSubunidad}
                  selectedCampania={selectedCampania}
                  isTestMode={isTestMode}
                  onStateUpdate={handleStateUpdate}
                  onOpenManual={handleOpenManual}
                  monedaVisualizacion={monedaVisualizacion}
                  tipoCambioOficial={tipoCambioOficial}
                />
              )}

              {activeTab === 'contabilidad' && (
                <ContabilidadModule
                  state={dbState}
                  selectedCampania={selectedCampania}
                  isTestMode={isTestMode}
                  onOpenManual={handleOpenManual}
                  monedaVisualizacion={monedaVisualizacion}
                  tipoCambioOficial={tipoCambioOficial}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'auditoria' && (
                <AuditoriaModule
                  state={dbState}
                  onOpenManual={handleOpenManual}
                />
              )}

              {activeTab === 'pruebas' && (
                <CasosPruebaModule
                  state={dbState}
                  currentUser={currentUser}
                  onStateUpdate={handleStateUpdate}
                  onOpenManual={handleOpenManual}
                />
              )}

              {activeTab === 'configuracion' && (
                <ConfiguracionModule
                  state={dbState}
                  currentUser={currentUser}
                  spreadsheetId={spreadsheetId}
                  onSpreadsheetIdChange={handleSpreadsheetIdChange}
                  onStateUpdate={handleStateUpdate}
                  onOpenManual={handleOpenManual}
                />
              )}

              {activeTab === 'modelo_datos' && (
                <ModeloDatosModule
                  state={dbState}
                  currentUser={currentUser}
                  onNavigateTab={setActiveTab}
                  onOpenManual={handleOpenManual}
                  onStateUpdate={handleStateUpdate}
                />
              )}

              {activeTab === 'google_hub' && (
                <EcosistemaGoogleModule
                  currentUser={currentUser || {
                    id_usuario: 'USR-DEFAULT',
                    username: 'admin',
                    nombre_completo: 'Administrador UNRC',
                    email: 'admin@unrc.edu.ar',
                    id_rol: 'ROL-ADMIN',
                    rol_nombre: 'ADMINISTRADOR',
                    activo: true,
                    fecha_alta: '2026-01-01',
                    fecha_modificacion: '2026-01-01',
                  }}
                  spreadsheetId={spreadsheetId}
                  onOpenManual={handleOpenManual}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'asesoria_ia' && (
                <AsesoriaIAModule
                  currentUser={currentUser}
                  state={dbState}
                  onNavigateTab={setActiveTab}
                  onOpenManual={handleOpenManual}
                  isLightMode={isLightMode}
                />
              )}

              {activeTab === 'noticias' && (
                <NoticiasAgroModule
                  currentUser={currentUser}
                  onOpenManual={handleOpenManual}
                  isLightMode={isLightMode}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Componente de Notificaciones Emergentes (Toast flotante + Modal/Drawer de gestión) */}
      <NotificacionesEmergentes
        alertas={alertasDelSistema}
        isOpen={isNotificacionesOpen}
        onClose={() => setIsNotificacionesOpen(false)}
        onNavigateTab={tab => setActiveTab(tab)}
        onAlertDismiss={handleStateUpdate}
        onOpenManual={handleOpenManual}
        isLightMode={isLightMode}
      />

      {/* Modal de Inicio de Sesión y Cambio de Rol */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        usuariosDisponibles={dbState.usuarios}
        onLogin={handleLogin}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Modal Didáctico del Sistema, Herramientas y Glosario */}
      <ManualConceptosModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        state={dbState}
        currentUser={currentUser}
        initialHighlightTerm={manualHighlightTerm}
        initialTab={manualInitialTab}
        initialIndicadorId={manualInitialIndicadorId}
        onStateUpdate={handleStateUpdate}
        onNavigateTab={(tab: string) => {
          setActiveTab(tab as any);
          setIsManualModalOpen(false);
        }}
      />
      {/* Toast Informativo de Exportación a Excel */}
      {excelExportToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            excelExportToast.success
              ? isLightMode
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
              : isLightMode
              ? 'bg-rose-50/95 border-rose-300 text-rose-950'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-100'
          }`}
          role="alert"
        >
          <div className="flex items-start space-x-3">
            {excelExportToast.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold truncate">{excelExportToast.title}</h4>
                <button
                  onClick={() => setExcelExportToast(null)}
                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-current opacity-70 hover:opacity-100"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">{excelExportToast.message}</p>
              {excelExportToast.fileName && (
                <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 border border-current/20">
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{excelExportToast.fileName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante para Lanzar el Asistente IA (Orientación & Análisis) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className={`fixed bottom-5 right-5 z-40 flex items-center space-x-2 px-3.5 py-2.5 rounded-full shadow-xl border cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 group ${
            isLightMode
              ? 'bg-linear-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-600/30 hover:shadow-emerald-600/50'
              : 'bg-linear-to-r from-emerald-600 to-teal-500 text-white border-emerald-400/60 shadow-emerald-950/80 hover:shadow-emerald-500/30'
          }`}
          title="Abrir Asistente IA: Orientación del Sistema e Interpretación de Datos"
          aria-label="Abrir Asistente IA"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300 animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-tight">Asistente IA</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-white/20 text-white">
            UNRC
          </span>
        </button>
      )}

      {/* Ventana de Chat del Asistente IA */}
      <ChatAsistenteIA
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        state={dbState}
        currentUser={currentUser}
        selectedSubunidad={selectedSubunidad}
        selectedCampania={selectedCampania}
        isLightMode={isLightMode}
        activeTab={activeTab}
      />
    </div>
  );
}

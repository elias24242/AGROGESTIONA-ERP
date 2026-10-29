import React, { useState } from 'react';
import { DatabaseState } from '../services/sheetsService';
import { calculateIndicadores, calculateStock } from '../services/businessEngine';
import {
  DollarSign,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  BookOpen,
  Sparkles,
  ArrowRight,
  X,
  SlidersHorizontal,
  Boxes,
  Landmark,
  PackageX,
  Scale,
  RotateCcw,
  PlusCircle,
  Compass,
  BarChart3,
} from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import {
  convertirArsAUsd,
  MonedaTipo,
  getTipoCambioOficial,
} from '../services/currencyService';
import { calcularAlertasDelSistema } from '../services/alertService';
import { TourGuiado, isTourCompletado } from '../components/dashboard/TourGuiado';

// Componentes del sistema de Widgets personalizados
import {
  WidgetId,
  AVAILABLE_WIDGETS,
  UserWidgetPreference,
  loadUserWidgetPreferences,
  saveUserWidgetPreferences,
} from '../components/dashboard/dashboardWidgets';
import { WidgetContainer } from '../components/dashboard/WidgetContainer';
import { WidgetConfigModal } from '../components/dashboard/WidgetConfigModal';
import { ResumenEjecutivoMensual } from '../components/dashboard/ResumenEjecutivoMensual';
import { WidgetKpis } from '../components/dashboard/widgets/WidgetKpis';
import { WidgetStockActual } from '../components/dashboard/widgets/WidgetStockActual';
import { WidgetProximosServicios } from '../components/dashboard/widgets/WidgetProximosServicios';
import { WidgetAlertasCriticas } from '../components/dashboard/widgets/WidgetAlertasCriticas';
import { WidgetPosicionTesoreria } from '../components/dashboard/widgets/WidgetPosicionTesoreria';
import { WidgetSubunidadesGestion } from '../components/dashboard/widgets/WidgetSubunidadesGestion';
import { WidgetInsumosCriticos } from '../components/dashboard/widgets/WidgetInsumosCriticos';
import { WidgetProduccionFisica } from '../components/dashboard/widgets/WidgetProduccionFisica';

interface DashboardModuleProps {
  state: DatabaseState;
  selectedSubunidad: string;
  selectedCampania: string;
  selectedEspecie?: string;
  isTestMode: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES', indicadorId?: string) => void;
  monedaVisualizacion?: MonedaTipo;
  tipoCambioOficial?: number;
  isLightMode?: boolean;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  state,
  selectedSubunidad,
  selectedCampania,
  selectedEspecie = 'TODOS',
  isTestMode,
  onNavigateTab,
  onOpenManual,
  monedaVisualizacion = 'ARS',
  tipoCambioOficial = getTipoCambioOficial(),
  isLightMode = false,
}) => {
  // Estado para modal de configuración arrastrable de widgets
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(() => !isTourCompletado());
  const [preferences, setPreferences] = useState<UserWidgetPreference[]>(() =>
    loadUserWidgetPreferences()
  );

  const { consolidados, porSubunidad } = calculateIndicadores(state, {
    id_campania: selectedCampania,
    includePruebas: isTestMode,
    id_especie: selectedEspecie,
  });

  const stock = calculateStock(state, {
    id_subunidad: selectedSubunidad !== 'TODOS' ? selectedSubunidad : undefined,
    id_especie: selectedEspecie,
    includePruebas: isTestMode,
  });

  const currentSubData = selectedSubunidad !== 'TODOS' ? porSubunidad[selectedSubunidad] : null;

  // KPIs dinámicos según filtro
  const displayCabezas = currentSubData ? currentSubData.existencia_cabezas : consolidados.existencia_total_cabezas;
  const displayIngresosArs = currentSubData ? currentSubData.ingresos_reales : consolidados.ingresos_totales;
  const displayCDArs = currentSubData ? currentSubData.costos_directos_reales : consolidados.costos_directos_totales;
  const displayCIArs = currentSubData ? currentSubData.costos_indirectos_reales : consolidados.costos_indirectos_totales;
  const displayMBArs = currentSubData ? currentSubData.margen_bruto : consolidados.margen_bruto_total;
  const displayPorcCD = currentSubData ? currentSubData.porcentaje_sobre_cd : consolidados.porcentaje_sobre_cd_total;

  // Conversión a USD según tipo de cambio oficial
  const displayIngresosUsd = convertirArsAUsd(displayIngresosArs, tipoCambioOficial);
  const displayCDUsd = convertirArsAUsd(displayCDArs, tipoCambioOficial);
  const displayCIUsd = convertirArsAUsd(displayCIArs, tipoCambioOficial);
  const displayMBUsd = convertirArsAUsd(displayMBArs, tipoCambioOficial);

  // Alertas tempranas activas
  const alertasDelSistema = calcularAlertasDelSistema(state);

  const [guiaDismissed, setGuiaDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('erp_ovinos_guia_sistema_dismissed_v1') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissGuia = () => {
    setGuiaDismissed(true);
    try {
      localStorage.setItem('erp_ovinos_guia_sistema_dismissed_v1', 'true');
    } catch {}
  };

  const currentSubName =
    selectedSubunidad !== 'TODOS'
      ? state.subunidades.find(s => s.id_subunidad === selectedSubunidad)?.nombre || 'Subunidad'
      : selectedEspecie === 'ESP001'
      ? 'Rodeo Ovino (Pozo del Carril)'
      : selectedEspecie === 'ESP002'
      ? 'Rodeo Bovino (La Aguada)'
      : selectedEspecie === 'ESP003'
      ? 'Piara Porcina (Pozo del Carril)'
      : 'Consolidado Ganadero Multi-Especie';

  // Guardado y actualización de preferencias
  const handleSavePreferences = (updated: UserWidgetPreference[]) => {
    setPreferences(updated);
    saveUserWidgetPreferences(updated);
  };

  // Reordenar widget hacia arriba directamente desde el dashboard
  const handleMoverArriba = (indexEnVisibles: number) => {
    const visibles = preferences.filter(p => p.visible);
    if (indexEnVisibles <= 0) return;

    const currentId = visibles[indexEnVisibles].id;
    const previousId = visibles[indexEnVisibles - 1].id;

    const newPrefs = [...preferences];
    const currentIndexInAll = newPrefs.findIndex(p => p.id === currentId);
    const previousIndexInAll = newPrefs.findIndex(p => p.id === previousId);

    const temp = newPrefs[currentIndexInAll];
    newPrefs[currentIndexInAll] = newPrefs[previousIndexInAll];
    newPrefs[previousIndexInAll] = temp;

    handleSavePreferences(newPrefs);
  };

  // Reordenar widget hacia abajo directamente desde el dashboard
  const handleMoverAbajo = (indexEnVisibles: number) => {
    const visibles = preferences.filter(p => p.visible);
    if (indexEnVisibles >= visibles.length - 1) return;

    const currentId = visibles[indexEnVisibles].id;
    const nextId = visibles[indexEnVisibles + 1].id;

    const newPrefs = [...preferences];
    const currentIndexInAll = newPrefs.findIndex(p => p.id === currentId);
    const nextIndexInAll = newPrefs.findIndex(p => p.id === nextId);

    const temp = newPrefs[currentIndexInAll];
    newPrefs[currentIndexInAll] = newPrefs[nextIndexInAll];
    newPrefs[nextIndexInAll] = temp;

    handleSavePreferences(newPrefs);
  };

  // Ocultar un widget directamente desde el botón en el widget
  const handleOcultarWidget = (id: WidgetId) => {
    const updated = preferences.map(p => (p.id === id ? { ...p, visible: false } : p));
    handleSavePreferences(updated);
  };

  // Colapsar/expandir widget
  const handleToggleColapsoWidget = (id: WidgetId) => {
    const updated = preferences.map(p =>
      p.id === id ? { ...p, colapsado: !p.colapsado } : p
    );
    handleSavePreferences(updated);
  };

  const visibles = preferences.filter(p => p.visible);
  const widgetDefsMap = new Map(AVAILABLE_WIDGETS.map(w => [w.id, w]));

  // Renderizador individual de cada widget
  const renderWidgetContent = (
    pref: UserWidgetPreference,
    indexEnVisibles: number,
    puedeSubir: boolean,
    puedeBajar: boolean
  ) => {
    const def = widgetDefsMap.get(pref.id);
    if (!def) return null;

    switch (pref.id) {
      case 'resumen_ejecutivo':
        return (
          <div key={pref.id} className="col-span-1 lg:col-span-2">
            <WidgetContainer
              id={pref.id}
              titulo="Resumen Ejecutivo Mensual (Cuadro de Mando)"
              subtitulo="Perspectivas Zootécnica, Clientes, Procesos Internos y Financiera con semáforos y comparativa mensual"
              icono={<BarChart3 className="w-4 h-4 text-emerald-500" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <ResumenEjecutivoMensual
                state={state}
                selectedSubunidad={selectedSubunidad}
                selectedCampania={selectedCampania}
                monedaVisualizacion={monedaVisualizacion}
                tipoCambioOficial={tipoCambioOficial}
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
                onOpenManual={onOpenManual}
              />
            </WidgetContainer>
          </div>
        );

      case 'kpis':
        return (
          <div key={pref.id} className="col-span-1 lg:col-span-2">
            <WidgetContainer
              id={pref.id}
              titulo="Indicadores Clave (KPIs Económicos y Zootécnicos)"
              subtitulo="Métricas cardinales de la majada y balance contable de campaña"
              icono={<DollarSign className="w-4 h-4" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetKpis
                displayCabezas={displayCabezas}
                displayIngresosArs={displayIngresosArs}
                displayIngresosUsd={displayIngresosUsd}
                displayCDArs={displayCDArs}
                displayCDUsd={displayCDUsd}
                displayCIArs={displayCIArs}
                displayCIUsd={displayCIUsd}
                displayMBArs={displayMBArs}
                displayMBUsd={displayMBUsd}
                displayPorcCD={displayPorcCD}
                monedaVisualizacion={monedaVisualizacion}
                isLightMode={isLightMode}
                onOpenManual={onOpenManual}
              />
            </WidgetContainer>
          </div>
        );

      case 'stock_actual':
        return (
          <div key={pref.id} className="col-span-1 lg:col-span-2">
            <WidgetContainer
              id={pref.id}
              titulo="Existencias por Categoría Zootécnica"
              subtitulo="Distribución física de cabezas en Lote Productivo LOT001"
              icono={<Boxes className="w-4 h-4" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetStockActual
                stockPorCategoria={stock.porCategoria}
                totalCabezas={displayCabezas}
                selectedEspecie={selectedEspecie}
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
              />
            </WidgetContainer>
          </div>
        );

      case 'proximos_servicios':
        return (
          <div key={pref.id} className="col-span-1 lg:col-span-2">
            <WidgetContainer
              id={pref.id}
              titulo="Próximos Servicios y Calendario Reproductivo"
              subtitulo="Cronograma de encastes, revisaciones andrológicas y pariciones UNRC"
              icono={<Calendar className="w-4 h-4" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetProximosServicios
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
              />
            </WidgetContainer>
          </div>
        );

      case 'alertas_criticas':
        return (
          <div key={pref.id} className="col-span-1 lg:col-span-2">
            <WidgetContainer
              id={pref.id}
              titulo="Alertas Críticas y Parámetros Pendientes"
              subtitulo="Control de inconsistencias, tratamientos zootécnicos y notificaciones operativas"
              icono={<AlertTriangle className="w-4 h-4 text-amber-500" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetAlertasCriticas
                alertas={alertasDelSistema}
                datosPendientes={consolidados.datos_pendientes}
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
                onOpenManual={onOpenManual}
              />
            </WidgetContainer>
          </div>
        );

      case 'posicion_tesoreria':
        return (
          <div key={pref.id} className="col-span-1">
            <WidgetContainer
              id={pref.id}
              titulo="Posición Comercial y Tesorería"
              subtitulo="Cuentas corrientes con clientes y proveedores"
              icono={<Landmark className="w-4 h-4 text-blue-500" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetPosicionTesoreria
                cuentasPorCobrar={consolidados.cuentas_por_cobrar}
                cuentasPorPagar={consolidados.cuentas_por_pagar}
                monedaVisualizacion={monedaVisualizacion}
                tipoCambioOficial={tipoCambioOficial}
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
              />
            </WidgetContainer>
          </div>
        );

      case 'subunidades_gestion':
        return (
          <div key={pref.id} className="col-span-1">
            <WidgetContainer
              id={pref.id}
              titulo="Subunidades de Gestión"
              subtitulo="Cría, Recría y Engorde (Cabezas y Márgenes Brutos)"
              icono={<Layers className="w-4 h-4 text-emerald-500" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetSubunidadesGestion
                subunidades={state.subunidades}
                porSubunidad={porSubunidad}
                monedaVisualizacion={monedaVisualizacion}
                tipoCambioOficial={tipoCambioOficial}
                isLightMode={isLightMode}
              />
            </WidgetContainer>
          </div>
        );

      case 'insumos_criticos':
        return (
          <div key={pref.id} className="col-span-1">
            <WidgetContainer
              id={pref.id}
              titulo="Stock Crítico de Insumos"
              subtitulo="Farmacia veterinaria y raciones en depósito central"
              icono={<PackageX className="w-4 h-4 text-amber-500" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetInsumosCriticos
                insumos={state.insumos}
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
              />
            </WidgetContainer>
          </div>
        );

      case 'produccion_fisica':
        return (
          <div key={pref.id} className="col-span-1">
            <WidgetContainer
              id={pref.id}
              titulo="Producción Física y Dinámica de Pesajes"
              subtitulo="Rendimiento en carne, zafra de lana y evolución de ganancia"
              icono={<Scale className="w-4 h-4 text-indigo-500" />}
              isLightMode={isLightMode}
              colapsado={pref.colapsado}
              onToggleColapso={() => handleToggleColapsoWidget(pref.id)}
              onMoverArriba={() => handleMoverArriba(indexEnVisibles)}
              onMoverAbajo={() => handleMoverAbajo(indexEnVisibles)}
              onOcultar={() => handleOcultarWidget(pref.id)}
              puedeSubir={puedeSubir}
              puedeBajar={puedeBajar}
            >
              <WidgetProduccionFisica
                pesajes={state.pesajes}
                produccion={state.produccion}
                isLightMode={isLightMode}
                onNavigateTab={onNavigateTab}
              />
            </WidgetContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificación de Inducción: ¿Es tu primera vez en el sistema y no sabés cómo funciona? */}
      {!guiaDismissed && (
        <div className={`p-4 sm:p-5 rounded-[2px] border shadow-sm relative overflow-hidden animate-in fade-in transition-colors ${
          isLightMode
            ? 'bg-emerald-50/90 border-emerald-300 text-slate-900'
            : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-[2px] bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] border uppercase tracking-wider ${
                    isLightMode
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  }`}>
                    Inducción & Ayuda Rápida
                  </span>
                  <span className={`text-xs font-medium ${isLightMode ? 'text-slate-500' : 'text-[#a2c7b5]'}`}>
                    • UNRC Ovinos
                  </span>
                </div>
                <h3 className={`text-sm sm:text-base font-extrabold ${isLightMode ? 'text-slate-900' : 'text-[#f2fcf6]'}`}>
                  ¿Es tu primera vez en el sistema y no sabés cómo funciona?
                </h3>
                <p className={`text-xs max-w-2xl leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#a2c7b5]'}`}>
                  Conocé la estructura integral del ERP Pozo del Carril, el flujo de datos zootécnicos y contables (RT 54), y la guía paso a paso de cada una de las herramientas del sistema.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center flex-wrap">
              <button
                type="button"
                onClick={() => setIsTourActive(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[2px] text-xs transition-all shadow-xs cursor-pointer"
                title="Iniciar recorrido guiado interactivo por el Dashboard"
              >
                <Compass className="w-4 h-4" />
                <span>Tour Guiado</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenManual && onOpenManual('SISTEMA')}
                className="flex items-center space-x-2 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[2px] text-xs transition-all shadow-xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ver Guía del Sistema</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDismissGuia}
                className={`p-2 rounded-[2px] transition-colors cursor-pointer ${
                  isLightMode ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-[#a2c7b5] hover:text-white hover:bg-[#183027]'
                }`}
                title="Ocultar aviso de inducción"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado Operativo del Dashboard con Botones de Personalizar Widgets y Tour Guiado */}
      <div
        id="tour-encabezado-subunidad"
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-xl border shadow-sm transition-colors ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900/90 border-slate-800 text-slate-100'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-base sm:text-lg font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {currentSubName}
            </h2>
            <BotonAyudaContextual moduloId="dashboard" onOpenManual={onOpenManual} />
            <span className={`text-xs font-mono font-medium ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              · Lote Productivo LOT001
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Panel de control general: indicadores zootécnicos, inventario físico y balance económico
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap">
          {isTestMode && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold shrink-0">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Modo Pruebas (Sandbox)</span>
            </div>
          )}

          {/* Botón de Lanzamiento de Tour Guiado */}
          <button
            type="button"
            onClick={() => setIsTourActive(true)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isLightMode
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-xs'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-xs'
            }`}
            title="Iniciar recorrido guiado interactivo por el Dashboard"
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>Tour Guiado</span>
          </button>

          {/* Botón Destacado: Personalizar Widgets */}
          <button
            id="tour-personalizar-widgets"
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-950/30 cursor-pointer"
            title="Abrir menú arrastrable para seleccionar y ordenar los resúmenes del Dashboard"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Personalizar Widgets</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
              {visibles.length}/{preferences.length}
            </span>
          </button>
        </div>
      </div>

      {/* Indicador de última modificación con persona, día y horario */}
      <div id="tour-audit-badge">
        <SectionAuditBadge
          auditoriaList={state.auditoria}
          seccionNombre="Toda la Unidad de Negocio Ovinos"
        />
      </div>

      {/* Renderizado de los Widgets configurados por el usuario */}
      {visibles.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 ${
            isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold">No hay widgets seleccionados en el Dashboard</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Podés seleccionar qué resúmenes deseas visualizar (stock actual, próximos servicios, alertas críticas, KPIs, finanzas) mediante el menú arrastrable.
          </p>
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Configurar Widgets Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibles.map((pref, index) =>
            renderWidgetContent(
              pref,
              index,
              index > 0,
              index < visibles.length - 1
            )
          )}
        </div>
      )}

      {/* Menú Flotante y Arrastrable de Configuración de Widgets */}
      <WidgetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        isLightMode={isLightMode}
      />

      {/* Tour Guiado Interactivo con capa superpuesta semitransparente */}
      <TourGuiado
        activo={isTourActive}
        onCerrar={() => setIsTourActive(false)}
        isLightMode={isLightMode}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Usuario } from '../types/erp';
import { hasModuleAccess, canPerformAction } from '../services/permissionService';
import {
  LayoutDashboard,
  Boxes,
  Wheat,
  Syringe,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  FlaskConical,
  Settings,
  Database,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Sparkles,
  Newspaper,
  SlidersHorizontal,
} from 'lucide-react';
import { PersonalizarMenuModal, getSavedMenuPreferences } from './PersonalizarMenuModal';

export type ActiveTab =
  | 'ganaderia'
  | 'dashboard'
  | 'analytics'
  | 'graficos'
  | 'majada'
  | 'produccion'
  | 'sanidad'
  | 'economia'
  | 'contabilidad'
  | 'auditoria'
  | 'pruebas'
  | 'configuracion'
  | 'modelo_datos'
  | 'google_hub'
  | 'asesoria_ia'
  | 'noticias';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingAlertsCount: number;
  currentUser: Usuario;
  isLightMode?: boolean;
  onOpenManual?: (term?: string) => void;
  onExportExcel?: () => void;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  items: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: any;
    badge?: number;
    description?: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingAlertsCount,
  currentUser,
  isLightMode = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPersonalizarOpen, setIsPersonalizarOpen] = useState(false);
  const [menuPreferencesVersion, setMenuPreferencesVersion] = useState(0);

  // Modo colapsado en desktop (ancho reducido de pantalla)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('agrogestiona_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    try {
      localStorage.setItem('agrogestiona_sidebar_collapsed', String(nextVal));
    } catch {}
  };

  // Escuchar cambios de preferencias y permisos en vivo
  useEffect(() => {
    const handlePrefsChange = () => setMenuPreferencesVersion(v => v + 1);
    window.addEventListener('agrogestiona_menu_preferences_changed', handlePrefsChange);
    window.addEventListener('agrogestiona_permissions_changed', handlePrefsChange);
    return () => {
      window.removeEventListener('agrogestiona_menu_preferences_changed', handlePrefsChange);
      window.removeEventListener('agrogestiona_permissions_changed', handlePrefsChange);
    };
  }, []);

  // Macro-Grupos de Navegación del Sistema Ganadero Integral (SIN NÚMEROS)
  const baseMenuGroups: MenuGroup[] = [
    {
      id: 'inicio',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard General',
          shortLabel: 'Dashboard',
          icon: LayoutDashboard,
          badge: pendingAlertsCount,
          description: 'Visión general de la explotación',
        },
      ],
    },
    {
      id: 'ganaderia_grupo',
      label: 'Ganadería',
      icon: Layers,
      items: [
        {
          id: 'ganaderia',
          label: 'Resumen Ganadero',
          shortLabel: 'Resumen',
          icon: Layers,
          description: 'Consolidado Ovi, Bov, Por',
        },
        {
          id: 'majada',
          label: 'Stock & Movimientos',
          shortLabel: 'Movimientos',
          icon: Boxes,
          description: 'Hacienda, lotes y pesajes',
        },
      ],
    },
    {
      id: 'produccion_grupo',
      label: 'Producción',
      icon: Wheat,
      items: [
        {
          id: 'produccion',
          label: 'Producción & Consumos',
          shortLabel: 'Producción',
          icon: Wheat,
          description: 'Kilos producidos y alimentos',
        },
        {
          id: 'sanidad',
          label: 'Sanidad & Veterinaria',
          shortLabel: 'Sanidad',
          icon: Syringe,
          description: 'Protocolos y tratamientos',
        },
      ],
    },
    {
      id: 'operaciones_grupo',
      label: 'Operaciones',
      icon: CircleDollarSign,
      items: [
        {
          id: 'economia',
          label: 'Registro de Operaciones',
          shortLabel: 'Operaciones',
          icon: CircleDollarSign,
          description: 'Compras, ventas y tesorería',
        },
      ],
    },
    {
      id: 'economia_grupo',
      label: 'Economía & Contabilidad',
      icon: FileText,
      items: [
        {
          id: 'contabilidad',
          label: 'Medición Contable RT 54',
          shortLabel: 'Contabilidad RT 54',
          icon: FileText,
          description: 'Valuación y balances (Exclusivo Administrador)',
        },
      ],
    },
    {
      id: 'indicadores_grupo',
      label: 'Centro de Inteligencia Ganadera',
      icon: BrainCircuit,
      items: [
        {
          id: 'analytics',
          label: 'Centro de Inteligencia Ganadera',
          shortLabel: 'Inteligencia',
          icon: BrainCircuit,
          description: 'Resultados, rentabilidad y decisiones',
        },
        {
          id: 'graficos',
          label: 'Gráficos Comparativos',
          shortLabel: 'Gráficos',
          icon: BarChart3,
          description: 'Evolución y tendencias',
        },
      ],
    },
    {
      id: 'administracion_grupo',
      label: 'Administración',
      icon: Settings,
      items: [
        {
          id: 'configuracion',
          label: 'Configuración & Usuarios',
          shortLabel: 'Configuración',
          icon: Settings,
          description: 'Nómina, roles y Google Sheets',
        },
        {
          id: 'auditoria',
          label: 'Libro de Auditoría',
          shortLabel: 'Auditoría',
          icon: ShieldCheck,
          description: 'Registro inmutable de cambios',
        },
        {
          id: 'modelo_datos',
          label: 'Modelo de Datos',
          shortLabel: 'Modelo Datos',
          icon: Database,
          description: 'Esquema relacional y tablas',
        },
      ],
    },
    {
      id: 'pruebas_grupo',
      label: 'Pruebas & Calidad',
      icon: FlaskConical,
      items: [
        {
          id: 'pruebas',
          label: 'Casos de Aceptación',
          shortLabel: 'Casos Prueba',
          icon: FlaskConical,
          description: 'Validaciones de integridad y seguridad',
        },
      ],
    },
    {
      id: 'ecosistema_grupo',
      label: 'Ecosistema & Integraciones',
      icon: Sparkles,
      items: [
        {
          id: 'google_hub',
          label: 'Ecosistema Google',
          shortLabel: 'Google Hub',
          icon: Calendar,
          description: 'Calendar, Gmail y Sheets',
        },
        {
          id: 'asesoria_ia',
          label: 'Asesoría & Respuestas IA',
          shortLabel: 'Asesoría IA',
          icon: Sparkles,
          description: 'Consultas técnicas y RT 54',
        },
        {
          id: 'noticias',
          label: 'Noticias & Mercados Agro',
          shortLabel: 'Mercados',
          icon: Newspaper,
          description: 'Cañuelas MAG, ROSPORC, Granos',
        },
      ],
    },
  ];

  // Cargar preferencias personalizadas del usuario
  const userPrefs = getSavedMenuPreferences(currentUser.id_usuario);
  const hiddenModulesSet = new Set(userPrefs.hiddenModules || []);

  // Filtrar ítems permitidos por RBAC y que el usuario no haya ocultado voluntariamente
  const getFilteredItems = (items: MenuGroup['items']) => {
    return items.filter(item => {
      // 1. Regla dura de seguridad RBAC
      if (!hasModuleAccess(currentUser, item.id)) return false;
      // 2. Preferencia de visualización del usuario
      if (hiddenModulesSet.has(item.id)) return false;
      return true;
    });
  };

  // Reordenar ítems si el usuario tiene orden personalizado
  const menuGroups: MenuGroup[] = baseMenuGroups.map(group => {
    let allowed = getFilteredItems(group.items);
    if (userPrefs.customOrder && userPrefs.customOrder.length > 0) {
      const orderMap = new Map(userPrefs.customOrder.map((id, index) => [id, index]));
      allowed = [...allowed].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
        return orderA - orderB;
      });
    }
    return {
      ...group,
      items: allowed,
    };
  }).filter(group => group.items.length > 0);

  // Encontrar el grupo padre de una pestaña activa
  const findParentGroupId = (tab: ActiveTab): string => {
    for (const group of baseMenuGroups) {
      if (group.items.some(item => item.id === tab)) {
        return group.id;
      }
    }
    return 'inicio';
  };

  // ACORDEÓN EXCLUSIVO: Solo un grupo abierto a la vez
  const [openGroupId, setOpenGroupId] = useState<string | null>(() => findParentGroupId(activeTab));

  useEffect(() => {
    const parent = findParentGroupId(activeTab);
    setOpenGroupId(parent);
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setOpenGroupId(prev => (prev === groupId ? null : groupId));
  };

  const handleSelectTab = (tab: ActiveTab, parentId?: string) => {
    onTabChange(tab);
    if (parentId) {
      setOpenGroupId(parentId);
    }
  };

  const allAllowedItems = menuGroups.flatMap(g => g.items);
  const currentItem = allAllowedItems.find(item => item.id === activeTab) ||
    baseMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab);

  return (
    <>
      {/* ================= BARRA DE NAVEGACIÓN MÓVIL (PANTALLAS < md) ================= */}
      <div
        className={`md:hidden sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isLightMode ? 'bg-[#ffffff]/95 border-slate-200 text-slate-800' : 'bg-[#12241d]/95 border-[#264d3f] text-[#f2fcf6]'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          {/* Módulo activo actual */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center space-x-2 text-xs font-bold cursor-pointer"
          >
            {currentItem && (
              <span className="flex items-center space-x-2">
                <currentItem.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate max-w-[170px]">{currentItem.label}</span>
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsPersonalizarOpen(true)}
              className="p-1.5 rounded-[2px] text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              title="Personalizar mi menú"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
              {allAllowedItems.length} módulos
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-[2px] text-[#a2c7b5] hover:text-white hover:bg-[#183027] transition-colors cursor-pointer"
              aria-label="Abrir menú de módulos"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scroll Horizontal Rápido de Pestañas Móviles */}
        <div className="flex items-center space-x-1 px-2.5 py-1.5 overflow-x-auto no-scrollbar border-t border-black/5 dark:border-white/5">
          {allAllowedItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleSelectTab(item.id, findParentGroupId(item.id));
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-[#183027] text-[#d1e7dc] hover:bg-[#1f3d32]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.shortLabel}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="w-3.5 h-3.5 rounded-[2px] bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desplegable Completo en Móvil */}
        {mobileMenuOpen && (
          <div
            className={`p-3 space-y-2 border-t shadow-2xl max-h-[70vh] overflow-y-auto ${
              isLightMode ? 'bg-white border-slate-200' : 'bg-[#12241d] border-[#264d3f]'
            }`}
          >
            <div className="pb-2 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-500">Navegación</span>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsPersonalizarOpen(true);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Personalizar mi menú</span>
              </button>
            </div>

            {menuGroups.map(group => {
              return (
                <div key={group.id} className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider block px-1 ${isLightMode ? 'text-slate-500' : 'text-[#a2c7b5]'}`}>
                    {group.label}
                  </span>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSelectTab(item.id, group.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[2px] text-xs font-semibold cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-700 text-white font-bold'
                            : isLightMode
                            ? 'hover:bg-slate-100 text-slate-800'
                            : 'hover:bg-[#183027] text-[#f2fcf6]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= SIDEBAR VERTICAL DE ESCRITORIO ================= */}
      <aside
        className={`hidden md:flex flex-col shrink-0 min-h-[calc(100vh-53px)] border-r transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60 lg:w-64'
        } ${
          isLightMode
            ? 'bg-[#ffffff] border-slate-200 text-slate-700'
            : 'bg-[#12241d] border-[#264d3f] text-[#d1e7dc]'
        }`}
      >
        {/* Encabezado del Sidebar con Botón de Colapso */}
        <div
          className={`px-3 py-2.5 border-b flex items-center justify-between ${
            isLightMode ? 'border-slate-200 bg-slate-50/70' : 'border-[#264d3f] bg-[#152b22]'
          }`}
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-2 min-w-0 pr-1">
                <img
                  src="/assets/aistudio/image_6dfa77ba.png"
                  alt="AGROGESTIONA ERP"
                  className="w-7 h-7 object-contain rounded-[2px] bg-white p-0.5 border border-slate-300 dark:border-neutral-700 shrink-0 shadow-xs"
                />
                <div className="min-w-0">
                  <span className={`text-[11px] font-black uppercase tracking-wider block truncate ${
                    isLightMode ? 'text-slate-900' : 'text-neutral-100'
                  }`}>
                    AGROGESTIONA
                  </span>
                  <span className={`text-[10px] block truncate ${isLightMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                    ERP Ganadero
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleCollapse}
                className={`p-1 rounded-[2px] border transition-colors cursor-pointer shrink-0 ${
                  isLightMode
                    ? 'border-slate-300 text-slate-600 hover:bg-slate-200'
                    : 'border-[#333333] text-neutral-400 hover:bg-[#222222] hover:text-white'
                }`}
                title="Colapsar menú lateral"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center space-y-1.5">
              <img
                src="/assets/aistudio/image_6dfa77ba.png"
                alt="AGROGESTIONA ERP"
                className="w-6 h-6 object-contain rounded-[2px] bg-white p-0.5 border border-slate-300 dark:border-neutral-700 shadow-xs"
              />
              <button
                type="button"
                onClick={handleToggleCollapse}
                className={`p-1 rounded-[2px] border transition-colors cursor-pointer ${
                  isLightMode
                    ? 'border-slate-300 text-slate-600 hover:bg-slate-200'
                    : 'border-[#333333] text-neutral-400 hover:bg-[#222222] hover:text-white'
                }`}
                title="Expandir menú lateral"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Macro-Grupos (Modo Expandido vs Modo Colapsado) */}
        {!isCollapsed ? (
          <div className="p-2 space-y-1 flex-1 overflow-y-auto no-scrollbar">
            {menuGroups.map(group => {
              const isExpanded = openGroupId === group.id;
              const hasActiveChild = group.items.some(it => it.id === activeTab);
              const GroupIcon = group.icon;

              return (
                <div key={group.id} className="space-y-0.5 border-b border-black/5 dark:border-white/5 pb-1 last:border-b-0">
                  {/* Cabecera de Grupo con Toggle Exclusivo (SIN NUMERACIÓN) */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[2px] text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                      hasActiveChild
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                        : isLightMode
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-[#a2c7b5] hover:text-[#f2fcf6] hover:bg-[#183027]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <GroupIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{group.label}</span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-1">
                      {group.id === 'inicio' && pendingAlertsCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-rose-500" />
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                  </button>

                  {/* Sub-ítems del Grupo Abierto */}
                  {isExpanded && (
                    <div className="pl-2 space-y-0.5 pt-0.5">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isReadOnly =
                          !canPerformAction(currentUser, item.id, 'CREAR') &&
                          item.id !== 'dashboard' &&
                          item.id !== 'auditoria';

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id, group.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-xs font-semibold transition-colors cursor-pointer relative ${
                              isActive
                                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                                : isLightMode
                                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                                : 'text-[#d1e7dc] hover:text-white hover:bg-[#183027]'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive
                                    ? 'text-white'
                                    : isLightMode
                                    ? 'text-slate-500'
                                    : 'text-neutral-400'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0 ml-1">
                              {isReadOnly && (
                                <span
                                  className={`text-[9px] font-bold px-1 py-0.2 rounded-[2px] ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : isLightMode
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-[#262626] text-neutral-400'
                                  }`}
                                  title="Modo Consulta (Solo Lectura)"
                                >
                                  Lectura
                                </span>
                              )}
                              {item.badge !== undefined && item.badge > 0 && (
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] ${
                                    isActive
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Botón Funcional "Personalizar mi menú" (Prompt Sección 3.4) */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsPersonalizarOpen(true)}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[2px] text-xs font-bold cursor-pointer transition-colors border ${
                  isLightMode
                    ? 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200 hover:border-emerald-300'
                    : 'bg-[#183027] hover:bg-[#1f3d32] text-[#a2c7b5] hover:text-white border-[#264d3f] hover:border-emerald-500'
                }`}
                title="Configurar qué módulos ver y su orden"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Personalizar mi menú</span>
              </button>
            </div>
          </div>
        ) : (
          /* VISTA COLAPSADA */
          <div className="p-1.5 space-y-1.5 flex-1 overflow-y-auto no-scrollbar flex flex-col items-center">
            {allAllowedItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const parentId = findParentGroupId(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id, parentId)}
                  className={`w-10 h-10 rounded-[2px] flex items-center justify-center transition-colors cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : isLightMode
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                  title={`${item.label} (${item.description || ''})`}
                >
                  <Icon className="w-4 h-4" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-[1px] bg-rose-500" />
                  )}
                </button>
              );
            })}

            <div className="w-full pt-2 border-t border-black/5 dark:border-white/5 flex justify-center">
              <button
                type="button"
                onClick={() => setIsPersonalizarOpen(true)}
                className="w-10 h-10 rounded-[2px] flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                title="Personalizar mi menú"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer del Sidebar con Identificación de la Cuenta */}
        <div
          className={`p-2.5 border-t text-xs ${
            isLightMode ? 'border-slate-200 bg-slate-50' : 'border-[#264d3f] bg-[#0c1813]'
          }`}
        >
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className={`font-bold block truncate text-xs ${isLightMode ? 'text-slate-800' : 'text-[#f2fcf6]'}`}>
                  @{currentUser.username}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#a2c7b5] block truncate font-mono">
                  {currentUser.rol_nombre}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sesión autenticada" />
            </div>
          ) : (
            <div className="flex justify-center" title={`@${currentUser.username} (${currentUser.rol_nombre})`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>

      {/* Modal de Personalización del Menú */}
      <PersonalizarMenuModal
        isOpen={isPersonalizarOpen}
        onClose={() => setIsPersonalizarOpen(false)}
        currentUser={currentUser}
        isLightMode={isLightMode}
        onPreferencesUpdated={() => setMenuPreferencesVersion(v => v + 1)}
      />
    </>
  );
};

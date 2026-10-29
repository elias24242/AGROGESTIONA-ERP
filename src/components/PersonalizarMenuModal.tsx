/**
 * AGROGESTIONA ERP - Modal de Personalización de Menú
 * Permite a cada usuario decidir qué módulos visualizar y en qué orden dentro de su navegación.
 * Las preferencias se guardan de forma persistente por usuario y respetan las restricciones de seguridad RBAC.
 */

import React, { useState } from 'react';
import { Usuario } from '../types/erp';
import { ActiveTab } from './Sidebar';
import { MODULOS_SISTEMA, hasModuleAccess } from '../services/permissionService';
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  Info,
} from 'lucide-react';

export interface MenuUserPreferences {
  hiddenModules: ActiveTab[];
  customOrder?: ActiveTab[];
}

const MENU_PREFS_KEY_PREFIX = 'agrogestiona_menu_prefs_';

export const getSavedMenuPreferences = (userId: string): MenuUserPreferences => {
  try {
    const raw = localStorage.getItem(`${MENU_PREFS_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error al cargar preferencias de menú del usuario:', e);
  }
  return { hiddenModules: [] };
};

export const saveMenuPreferences = (userId: string, prefs: MenuUserPreferences): void => {
  try {
    localStorage.setItem(`${MENU_PREFS_KEY_PREFIX}${userId}`, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('agrogestiona_menu_preferences_changed', { detail: { userId } }));
  } catch (e) {
    console.error('Error al guardar preferencias de menú:', e);
  }
};

interface PersonalizarMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  isLightMode?: boolean;
  onPreferencesUpdated: () => void;
}

export const PersonalizarMenuModal: React.FC<PersonalizarMenuModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isLightMode = false,
  onPreferencesUpdated,
}) => {
  if (!isOpen) return null;

  // Filtrar exclusivamente los módulos a los que el usuario tiene acceso por permisos de seguridad
  const authorizedModules = MODULOS_SISTEMA.filter(m => hasModuleAccess(currentUser, m.id));

  // Cargar preferencias vigentes
  const initialPrefs = getSavedMenuPreferences(currentUser.id_usuario);

  // Inicializar orden de módulos
  const initialOrder: ActiveTab[] = [];
  if (initialPrefs.customOrder && Array.isArray(initialPrefs.customOrder)) {
    // Primero los módulos autorizados que están en el orden personalizado
    initialPrefs.customOrder.forEach(id => {
      if (authorizedModules.some(m => m.id === id) && !initialOrder.includes(id)) {
        initialOrder.push(id);
      }
    });
  }
  // Agregar cualquier módulo autorizado que no estuviera en el orden guardado
  authorizedModules.forEach(m => {
    if (!initialOrder.includes(m.id)) {
      initialOrder.push(m.id);
    }
  });

  const [orderedTabs, setOrderedTabs] = useState<ActiveTab[]>(initialOrder);
  const [hiddenTabs, setHiddenTabs] = useState<ActiveTab[]>(initialPrefs.hiddenModules || []);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Mover módulo hacia arriba
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...orderedTabs];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setOrderedTabs(newOrder);
  };

  // Mover módulo hacia abajo
  const handleMoveDown = (index: number) => {
    if (index >= orderedTabs.length - 1) return;
    const newOrder = [...orderedTabs];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setOrderedTabs(newOrder);
  };

  // Alternar visibilidad (mostrar / ocultar)
  const handleToggleVisibility = (id: ActiveTab) => {
    // Debe quedar al menos un módulo visible
    const isCurrentlyHidden = hiddenTabs.includes(id);
    if (!isCurrentlyHidden && hiddenTabs.length >= orderedTabs.length - 1) {
      alert('Debe mantener visible al menos un módulo en su navegación.');
      return;
    }

    if (isCurrentlyHidden) {
      setHiddenTabs(prev => prev.filter(t => t !== id));
    } else {
      setHiddenTabs(prev => [...prev, id]);
    }
  };

  // Guardar cambios
  const handleSave = () => {
    const newPrefs: MenuUserPreferences = {
      hiddenModules: hiddenTabs,
      customOrder: orderedTabs,
    };
    saveMenuPreferences(currentUser.id_usuario, newPrefs);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onPreferencesUpdated();
      onClose();
    }, 600);
  };

  // Restaurar valores predeterminados
  const handleReset = () => {
    const defaultOrder = MODULOS_SISTEMA.filter(m => hasModuleAccess(currentUser, m.id)).map(m => m.id);
    setOrderedTabs(defaultOrder);
    setHiddenTabs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-[2px] border shadow-2xl overflow-hidden ${
          isLightMode
            ? 'bg-white border-emerald-200 text-slate-900'
            : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
        }`}
      >
        {/* Cabecera del Modal */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLightMode ? 'border-slate-200 bg-slate-50' : 'border-[#264d3f] bg-[#0c1813]'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-[2px] bg-emerald-600 text-white">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Personalizar mi Menú de Navegación</h3>
              <p className="text-xs text-slate-500 dark:text-[#a2c7b5]">
                Configure qué módulos desea ver y ordénelos según su preferencia de trabajo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] hover:bg-slate-200 dark:hover:bg-[#183027] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Notificación informativa */}
        <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between gap-2 ${
          isLightMode ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900' : 'bg-[#183027]/60 border-[#264d3f] text-[#a2c7b5]'
        }`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Usuario activo: <strong>@{currentUser.username}</strong> ({currentUser.rol_nombre}). Solo se listan módulos autorizados.
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar por defecto</span>
          </button>
        </div>

        {/* Lista de Módulos Reordenables y Conmutables */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-[55vh]">
          {orderedTabs.map((tabId, idx) => {
            const modInfo = MODULOS_SISTEMA.find(m => m.id === tabId);
            if (!modInfo) return null;
            const isHidden = hiddenTabs.includes(tabId);

            return (
              <div
                key={tabId}
                className={`p-3 rounded-[2px] border flex items-center justify-between gap-3 transition-all ${
                  isHidden
                    ? isLightMode
                      ? 'bg-slate-100/70 border-slate-200 opacity-60'
                      : 'bg-[#15241d]/50 border-[#1f3d32] opacity-50'
                    : isLightMode
                    ? 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                    : 'bg-[#183027] border-[#264d3f] shadow-xs hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xs font-mono font-bold opacity-60 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className={`text-sm font-bold block truncate ${
                      isHidden ? 'line-through text-slate-400' : ''
                    }`}>
                      {modInfo.nombre}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-[#a2c7b5] block truncate">
                      {modInfo.descripcion}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Botón Reordenar Arriba */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-[2px] border border-slate-300 dark:border-[#264d3f] hover:bg-slate-100 dark:hover:bg-[#12241d] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    title="Subir posición"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Botón Reordenar Abajo */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === orderedTabs.length - 1}
                    className="p-1.5 rounded-[2px] border border-slate-300 dark:border-[#264d3f] hover:bg-slate-100 dark:hover:bg-[#12241d] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    title="Bajar posición"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Visibilidad */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(tabId)}
                    className={`px-2.5 py-1.5 rounded-[2px] text-xs font-bold flex items-center space-x-1 border cursor-pointer transition-all ${
                      isHidden
                        ? 'bg-slate-200 dark:bg-[#12241d] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-600'
                    }`}
                    title={isHidden ? 'Hacer visible' : 'Ocultar módulo'}
                  >
                    {isHidden ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Oculto</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Visible</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie del modal con acciones */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLightMode ? 'border-slate-200 bg-slate-50' : 'border-[#264d3f] bg-[#0c1813]'
        }`}>
          <div className="text-[11px] text-slate-500 dark:text-[#a2c7b5]">
            <span>{orderedTabs.length - hiddenTabs.length} módulos visibles de {orderedTabs.length}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-[2px] text-xs font-bold cursor-pointer transition-colors ${
                isLightMode
                  ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  : 'border-[#264d3f] hover:bg-[#183027] text-white'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold rounded-[2px] text-xs cursor-pointer transition-all flex items-center space-x-1.5 shadow-xs"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Preferencias</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

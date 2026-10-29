/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Servicio de Almacenamiento en Caché Local y Lógica Simulada de Service Worker
 * 
 * Permite la persistencia robusta y la operatividad ininterrumpida offline
 * cuando Google Sheets o la conexión de red no se encuentran disponibles.
 */

import { DatabaseState, getInitialState } from './sheetsService';

export type CacheWorkerStatus = 'ONLINE_SYNCED' | 'OFFLINE_CACHE_ACTIVE' | 'BACKGROUND_SYNCING' | 'PENDING_CHANGES';

export interface OfflineMutation {
  id: string;
  tipo: string;
  descripcion: string;
  fechaHora: string;
  tabla: string;
  payload: any;
}

export interface ServiceWorkerCacheMetadata {
  version: string;
  ultimoSnapshot: string;
  totalTablas: number;
  totalRegistros: number;
  origen: 'GOOGLE_SHEETS' | 'LOCAL_CACHE';
  spreadsheetId: string | null;
  mutacionesPendientes: number;
}

const SW_CACHE_KEY = 'sw_cache_erp_ovinos_state_v2';
const SW_METADATA_KEY = 'sw_cache_erp_ovinos_meta_v2';
const SW_QUEUE_KEY = 'sw_cache_erp_ovinos_queue_v2';
const SW_SIMULATED_OFFLINE_KEY = 'sw_cache_simulated_offline_v2';

// Estado reactivo en memoria del Service Worker simulado
let currentWorkerStatus: CacheWorkerStatus = 'ONLINE_SYNCED';
let statusListeners: Array<(status: CacheWorkerStatus, meta: ServiceWorkerCacheMetadata) => void> = [];

/**
 * Registra listeners para cambios de estado del Service Worker simulado
 */
export function subscribeToWorkerStatus(callback: (status: CacheWorkerStatus, meta: ServiceWorkerCacheMetadata) => void): () => void {
  statusListeners.push(callback);
  callback(currentWorkerStatus, getCacheMetadata());
  return () => {
    statusListeners = statusListeners.filter(l => l !== callback);
  };
}

function notifyStatusChange() {
  const meta = getCacheMetadata();
  statusListeners.forEach(listener => {
    try {
      listener(currentWorkerStatus, meta);
    } catch (e) {
      console.warn('Error en listener de SW cache:', e);
    }
  });
}

/**
 * Comprueba si la red está disponible o si el modo offline está forzado
 */
export function isNetworkAvailable(): boolean {
  try {
    const forced = localStorage.getItem(SW_SIMULATED_OFFLINE_KEY);
    if (forced === 'true') return false;
  } catch (e) {}
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Permite forzar o simular el modo offline para pruebas
 */
export function setSimulatedOfflineMode(offline: boolean): void {
  try {
    localStorage.setItem(SW_SIMULATED_OFFLINE_KEY, offline ? 'true' : 'false');
    currentWorkerStatus = offline ? 'OFFLINE_CACHE_ACTIVE' : (getOfflineQueue().length > 0 ? 'PENDING_CHANGES' : 'ONLINE_SYNCED');
    notifyStatusChange();
  } catch (e) {}
}

export function isSimulatedOfflineForced(): boolean {
  try {
    return localStorage.getItem(SW_SIMULATED_OFFLINE_KEY) === 'true';
  } catch (e) {}
  return false;
}

/**
 * Guarda una instantánea completa de datos en el caché del Service Worker
 */
export function cacheStateSnapshot(state: DatabaseState, spreadsheetId?: string | null): void {
  try {
    localStorage.setItem(SW_CACHE_KEY, JSON.stringify(state));

    let totalRegistros = 0;
    Object.keys(state).forEach(key => {
      const arr = (state as any)[key];
      if (Array.isArray(arr)) totalRegistros += arr.length;
    });

    const meta: ServiceWorkerCacheMetadata = {
      version: '2.0.0-sw',
      ultimoSnapshot: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium' }),
      totalTablas: Object.keys(state).length,
      totalRegistros,
      origen: spreadsheetId ? 'GOOGLE_SHEETS' : 'LOCAL_CACHE',
      spreadsheetId: spreadsheetId || null,
      mutacionesPendientes: getOfflineQueue().length,
    };

    localStorage.setItem(SW_METADATA_KEY, JSON.stringify(meta));
    currentWorkerStatus = isNetworkAvailable() ? (meta.mutacionesPendientes > 0 ? 'PENDING_CHANGES' : 'ONLINE_SYNCED') : 'OFFLINE_CACHE_ACTIVE';
    notifyStatusChange();
  } catch (e) {
    console.error('[SW-Cache] Error guardando snapshot en caché:', e);
  }
}

/**
 * Recupera la instantánea desde el caché de Service Worker (fallback offline instantáneo)
 */
export function getCachedStateSnapshot(): DatabaseState {
  try {
    const raw = localStorage.getItem(SW_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.unidades && parsed.inventario) {
        return parsed as DatabaseState;
      }
    }
  } catch (e) {
    console.warn('[SW-Cache] Error leyendo instantánea de caché:', e);
  }
  return getInitialState();
}

/**
 * Obtiene los metadatos de sincronización y estado del caché
 */
export function getCacheMetadata(): ServiceWorkerCacheMetadata {
  try {
    const raw = localStorage.getItem(SW_METADATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    version: '2.0.0-sw',
    ultimoSnapshot: 'Recién inicializado',
    totalTablas: 32,
    totalRegistros: 81,
    origen: 'LOCAL_CACHE',
    spreadsheetId: null,
    mutacionesPendientes: getOfflineQueue().length,
  };
}

/**
 * Registra una acción / mutación realizada en modo offline para sincronización posterior
 */
export function queueOfflineMutation(mutation: Omit<OfflineMutation, 'id' | 'fechaHora'>): void {
  try {
    const queue = getOfflineQueue();
    const nueva: OfflineMutation = {
      ...mutation,
      id: `MUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fechaHora: new Date().toLocaleString('es-AR'),
    };
    queue.push(nueva);
    localStorage.setItem(SW_QUEUE_KEY, JSON.stringify(queue));

    if (!isNetworkAvailable()) {
      currentWorkerStatus = 'OFFLINE_CACHE_ACTIVE';
    } else {
      currentWorkerStatus = 'PENDING_CHANGES';
    }
    notifyStatusChange();
  } catch (e) {
    console.error('[SW-Cache] Error encolando mutación offline:', e);
  }
}

/**
 * Obtiene la cola de mutaciones offline pendientes
 */
export function getOfflineQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(SW_QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

/**
 * Limpia la cola de mutaciones tras una sincronización exitosa
 */
export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(SW_QUEUE_KEY);
    currentWorkerStatus = isNetworkAvailable() ? 'ONLINE_SYNCED' : 'OFFLINE_CACHE_ACTIVE';
    notifyStatusChange();
  } catch (e) {}
}

/**
 * Inicializa los eventos de conexión del navegador (online / offline)
 */
export function initializeServiceWorkerEngine(onReconnected?: () => void): void {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    if (!isSimulatedOfflineForced()) {
      currentWorkerStatus = getOfflineQueue().length > 0 ? 'PENDING_CHANGES' : 'ONLINE_SYNCED';
      notifyStatusChange();
      if (onReconnected) onReconnected();
    }
  };

  const handleOffline = () => {
    currentWorkerStatus = 'OFFLINE_CACHE_ACTIVE';
    notifyStatusChange();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Estado inicial
  currentWorkerStatus = isNetworkAvailable() 
    ? (getOfflineQueue().length > 0 ? 'PENDING_CHANGES' : 'ONLINE_SYNCED')
    : 'OFFLINE_CACHE_ACTIVE';
  notifyStatusChange();
}

/**
 * AGROGESTIONA ERP - Servicio de Control de Acceso Basado en Roles y Permisos (RBAC)
 * Soporta configuración a nivel de Rol y a nivel de Usuario Individual.
 * La denegación de permisos tiene efecto real e inmediato (inclusive para usuarios Administradores si se les revoca el acceso).
 */

import { Usuario } from '../types/erp';
import { ActiveTab } from '../components/Sidebar';

export interface ModuloPermisos {
  id: ActiveTab;
  nombre: string;
  descripcion: string;
  acciones: Array<{ id: 'LEER' | 'CREAR' | 'EDITAR' | 'ANULAR' | 'ADMINISTRAR'; label: string }>;
}

export const MODULOS_SISTEMA: ModuloPermisos[] = [
  {
    id: 'dashboard',
    nombre: 'Panel Principal',
    descripcion: 'Visualización de indicadores consolidados, estado del establecimiento y alertas prioritarias',
    acciones: [{ id: 'LEER', label: 'Ver Panel' }],
  },
  {
    id: 'ganaderia',
    nombre: 'Ganadería & Resumen',
    descripcion: 'Resumen Ganadero multi-especie, existencias, balance de biomasa y comparativas Ovinos vs Bovinos vs Porcinos',
    acciones: [{ id: 'LEER', label: 'Ver Resumen Ganadero' }],
  },
  {
    id: 'majada',
    nombre: 'Stock & Movimientos',
    descripcion: 'Control físico de cabezas, lotes, pesajes, nacimientos, bajas y transferencias',
    acciones: [
      { id: 'LEER', label: 'Consultar Existencias' },
      { id: 'CREAR', label: 'Registrar Eventos de Campo' },
      { id: 'ANULAR', label: 'Anulación Lógica con Motivo' },
    ],
  },
  {
    id: 'produccion',
    nombre: 'Producción & Consumos',
    descripcion: 'Registro de producción física, consumos reales y desvíos zootécnicos',
    acciones: [
      { id: 'LEER', label: 'Ver Comparativas' },
      { id: 'CREAR', label: 'Cargar Producción y Consumos' },
    ],
  },
  {
    id: 'sanidad',
    nombre: 'Sanidad & Veterinaria',
    descripcion: 'Protocolos veterinarios, tratamientos y aplicaciones de dosis',
    acciones: [
      { id: 'LEER', label: 'Ver Historial Sanitario' },
      { id: 'CREAR', label: 'Registrar Aplicaciones' },
    ],
  },
  {
    id: 'economia',
    nombre: 'Registro de Operaciones',
    descripcion: 'Compras, ventas, tesorería y balance económico',
    acciones: [
      { id: 'LEER', label: 'Ver Libro Económico' },
      { id: 'CREAR', label: 'Emitir Ventas y Compras' },
      { id: 'ADMINISTRAR', label: 'Tesorería y Distribución de Costos' },
    ],
  },
  {
    id: 'contabilidad',
    nombre: 'Medición Contable RT 54',
    descripcion: 'Guía técnica normativa, valuación a VNR y criterios contables para entes agropecuarios',
    acciones: [
      { id: 'LEER', label: 'Ver Cuadros y Guía RT 54' },
      { id: 'ADMINISTRAR', label: 'Gestionar Parámetros Contables' },
    ],
  },
  {
    id: 'analytics',
    nombre: 'Centro de Inteligencia Ganadera',
    descripcion: 'Resultados, rentabilidad, diagnóstico causal y toma de decisiones',
    acciones: [
      { id: 'LEER', label: 'Consultar Diagnósticos y Decisiones' },
      { id: 'ADMINISTRAR', label: 'Simular Escenarios y Planes de Acción' },
    ],
  },
  {
    id: 'graficos',
    nombre: 'Gráficos Comparativos',
    descripcion: 'Evolución gráfica del inventario por subunidad a lo largo de las campañas',
    acciones: [{ id: 'LEER', label: 'Ver Gráficos y Evolución' }],
  },
  {
    id: 'configuracion',
    nombre: 'Configuración & Usuarios',
    descripcion: 'Gestión de usuarios, roles, permisos y Google Sheets',
    acciones: [
      { id: 'LEER', label: 'Ver Parámetros' },
      { id: 'ADMINISTRAR', label: 'Crear Usuarios y Gestionar Roles' },
    ],
  },
  {
    id: 'auditoria',
    nombre: 'Libro de Auditoría',
    descripcion: 'Trazabilidad total inmutable de operaciones y modificaciones',
    acciones: [{ id: 'LEER', label: 'Consultar Log de Auditoría' }],
  },
  {
    id: 'modelo_datos',
    nombre: 'Modelo de Datos',
    descripcion: 'Esquema relacional interactivo, arquitectura de cuadros y flujo de información',
    acciones: [
      { id: 'LEER', label: 'Consultar Diagramas y Esquemas' },
      { id: 'ADMINISTRAR', label: 'Verificar Integridad Referencial' },
    ],
  },
  {
    id: 'pruebas',
    nombre: 'Casos de Aceptación',
    descripcion: 'Suite de pruebas formales y casos de aceptación verificables del ERP',
    acciones: [
      { id: 'LEER', label: 'Ver Pruebas' },
      { id: 'CREAR', label: 'Ejecutar Pruebas' },
    ],
  },
  {
    id: 'google_hub',
    nombre: 'Ecosistema Google',
    descripcion: 'Integración con Google Calendar, despachos por Gmail y Google Sheets',
    acciones: [
      { id: 'LEER', label: 'Ver Calendario y Plantillas' },
      { id: 'CREAR', label: 'Despachar Correos y Eventos' },
    ],
  },
  {
    id: 'asesoria_ia',
    nombre: 'Asesoría & Respuestas IA',
    descripcion: 'Consultas zootécnicas, RT 54 y sanitarias fundadas en datos del establecimiento',
    acciones: [
      { id: 'LEER', label: 'Consultar Q&A e Informes' },
      { id: 'CREAR', label: 'Ejecutar Consultas' },
    ],
  },
  {
    id: 'noticias',
    nombre: 'Noticias & Mercados Agro',
    descripcion: 'Cotizaciones en tiempo real del MAG Cañuelas, ROSPORC, granos y cereales',
    acciones: [
      { id: 'LEER', label: 'Ver Noticias y Mercados' },
    ],
  },
];

// Matriz base de permisos por rol
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, Record<string, boolean>>> = {
  ADMINISTRADOR: {
    dashboard: { LEER: true },
    ganaderia: { LEER: true },
    majada: { LEER: true, CREAR: true, ANULAR: true },
    produccion: { LEER: true, CREAR: true },
    sanidad: { LEER: true, CREAR: true },
    economia: { LEER: true, CREAR: true, ADMINISTRAR: true },
    contabilidad: { LEER: true, ADMINISTRAR: true },
    analytics: { LEER: true, ADMINISTRAR: true },
    graficos: { LEER: true },
    configuracion: { LEER: true, ADMINISTRAR: true },
    auditoria: { LEER: true },
    modelo_datos: { LEER: true, ADMINISTRAR: true },
    pruebas: { LEER: true, CREAR: true },
    google_hub: { LEER: true, CREAR: true },
    asesoria_ia: { LEER: true, CREAR: true },
    noticias: { LEER: true },
  },
  RESPONSABLE_UNIDAD: {
    dashboard: { LEER: true },
    ganaderia: { LEER: true },
    majada: { LEER: true, CREAR: true, ANULAR: true },
    produccion: { LEER: true, CREAR: true },
    sanidad: { LEER: true, CREAR: true },
    economia: { LEER: true, CREAR: true, ADMINISTRAR: true },
    contabilidad: { LEER: false, ADMINISTRAR: false },
    analytics: { LEER: true, ADMINISTRAR: true },
    graficos: { LEER: true },
    configuracion: { LEER: true, ADMINISTRAR: false },
    auditoria: { LEER: true },
    modelo_datos: { LEER: false, ADMINISTRAR: false },
    pruebas: { LEER: true, CREAR: true },
    google_hub: { LEER: true, CREAR: true },
    asesoria_ia: { LEER: true, CREAR: true },
    noticias: { LEER: true },
  },
  OPERADOR: {
    dashboard: { LEER: true },
    ganaderia: { LEER: true },
    majada: { LEER: true, CREAR: true, ANULAR: false },
    produccion: { LEER: true, CREAR: true },
    sanidad: { LEER: true, CREAR: true },
    economia: { LEER: false, CREAR: false, ADMINISTRAR: false },
    contabilidad: { LEER: false, ADMINISTRAR: false },
    analytics: { LEER: true, ADMINISTRAR: false },
    graficos: { LEER: true },
    configuracion: { LEER: false, ADMINISTRAR: false },
    auditoria: { LEER: false },
    modelo_datos: { LEER: false, ADMINISTRAR: false },
    pruebas: { LEER: true, CREAR: false },
    google_hub: { LEER: true, CREAR: false },
    asesoria_ia: { LEER: true, CREAR: true },
    noticias: { LEER: true },
  },
  AUDITORIA: {
    dashboard: { LEER: true },
    ganaderia: { LEER: true },
    majada: { LEER: true, CREAR: false, ANULAR: false },
    produccion: { LEER: true, CREAR: false },
    sanidad: { LEER: true, CREAR: false },
    economia: { LEER: true, CREAR: false, ADMINISTRAR: false },
    contabilidad: { LEER: false, ADMINISTRAR: false },
    analytics: { LEER: true, ADMINISTRAR: false },
    graficos: { LEER: true },
    configuracion: { LEER: true, ADMINISTRAR: false },
    auditoria: { LEER: true },
    modelo_datos: { LEER: false, ADMINISTRAR: false },
    pruebas: { LEER: true, CREAR: false },
    google_hub: { LEER: true, CREAR: false },
    asesoria_ia: { LEER: true, CREAR: false },
    noticias: { LEER: true },
  },
};

const ROLE_PERMISSIONS_STORAGE_KEY = 'agrogestiona_role_permissions_v2';
const USER_PERMISSIONS_STORAGE_KEY = 'agrogestiona_user_permissions_v2';

export const loadRolePermissions = (): Record<string, Record<string, Record<string, boolean>>> => {
  try {
    const raw = localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error loading custom role permissions:', e);
  }
  return { ...DEFAULT_ROLE_PERMISSIONS };
};

export const saveRolePermissions = (matrix: Record<string, Record<string, Record<string, boolean>>>) => {
  try {
    localStorage.setItem(ROLE_PERMISSIONS_STORAGE_KEY, JSON.stringify(matrix));
    // Sincronizar en ventana para reactividad inmediata
    window.dispatchEvent(new CustomEvent('agrogestiona_permissions_changed', { detail: { type: 'role' } }));
  } catch (e) {
    console.error('Error saving role permissions:', e);
  }
};

/**
 * Obtiene los permisos individuales específicos de un usuario (sobreescrituras)
 */
export const getUserSpecificPermissions = (userId: string): Record<string, Record<string, boolean>> => {
  try {
    const allUsersMapRaw = localStorage.getItem(USER_PERMISSIONS_STORAGE_KEY);
    if (allUsersMapRaw) {
      const allUsersMap = JSON.parse(allUsersMapRaw);
      return allUsersMap[userId] || {};
    }
  } catch (e) {
    console.warn('Error loading user-specific permissions:', e);
  }
  return {};
};

/**
 * Guarda los permisos individuales específicos de un usuario
 */
export const saveUserSpecificPermissions = (
  userId: string,
  userPerms: Record<string, Record<string, boolean>>
) => {
  try {
    const allUsersMapRaw = localStorage.getItem(USER_PERMISSIONS_STORAGE_KEY);
    const allUsersMap = allUsersMapRaw ? JSON.parse(allUsersMapRaw) : {};
    allUsersMap[userId] = userPerms;
    localStorage.setItem(USER_PERMISSIONS_STORAGE_KEY, JSON.stringify(allUsersMap));
    window.dispatchEvent(new CustomEvent('agrogestiona_permissions_changed', { detail: { type: 'user', userId } }));
  } catch (e) {
    console.error('Error saving user specific permissions:', e);
  }
};

/**
 * Determina si un usuario tiene acceso de lectura a un módulo.
 * APLICA REGLA OBLIGATORIA: Si un administrador revoca el acceso a un módulo para un usuario o rol,
 * la restricción se aplica efectivamente de inmediato.
 */
export const hasModuleAccess = (user: Usuario | null, module: ActiveTab): boolean => {
  if (!user || user.activo === false || user.inhabilitado === true) return false;

  // 1. Verificar primero si existe una regla específica configurada para este usuario individual
  const userOverrides = getUserSpecificPermissions(user.id_usuario);
  if (userOverrides[module] && userOverrides[module]['LEER'] !== undefined) {
    return !!userOverrides[module]['LEER'];
  }

  // 2. Si el usuario tiene en su objeto usuario permisos_personalizados
  if (user.permisos_personalizados && (user.permisos_personalizados as any)[module]) {
    const customMod = (user.permisos_personalizados as any)[module];
    if (customMod.LEER !== undefined) {
      return !!customMod.LEER;
    }
  }

  // 3. Verificar matriz de permisos asignada al rol
  const roleMatrix = loadRolePermissions();
  const roleName = user.rol_nombre || 'OPERADOR';
  const roleRules = roleMatrix[roleName] || DEFAULT_ROLE_PERMISSIONS[roleName];

  if (roleRules && roleRules[module] && roleRules[module]['LEER'] !== undefined) {
    return !!roleRules[module]['LEER'];
  }

  // 4. Default: Si no hay regla específica y es ADMIN, permitir salvo modelo_datos
  if (roleName === 'ADMINISTRADOR') {
    return true;
  }

  return false;
};

/**
 * Determina si un usuario puede realizar una acción específica en un módulo
 */
export const canPerformAction = (
  user: Usuario | null,
  module: ActiveTab,
  action: 'LEER' | 'CREAR' | 'EDITAR' | 'ANULAR' | 'ADMINISTRAR'
): boolean => {
  if (!user || user.activo === false || user.inhabilitado === true) return false;

  // 1. Verificación a nivel de usuario individual
  const userOverrides = getUserSpecificPermissions(user.id_usuario);
  if (userOverrides[module] && userOverrides[module][action] !== undefined) {
    return !!userOverrides[module][action];
  }

  // 2. Verificación a nivel de rol configurado
  const roleMatrix = loadRolePermissions();
  const roleName = user.rol_nombre || 'OPERADOR';
  const roleRules = roleMatrix[roleName] || DEFAULT_ROLE_PERMISSIONS[roleName];

  if (roleRules && roleRules[module] && roleRules[module][action] !== undefined) {
    return !!roleRules[module][action];
  }

  if (roleName === 'ADMINISTRADOR') {
    return true;
  }

  return false;
};

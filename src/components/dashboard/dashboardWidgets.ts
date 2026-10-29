export type WidgetId =
  | 'resumen_ejecutivo'
  | 'kpis'
  | 'stock_actual'
  | 'proximos_servicios'
  | 'alertas_criticas'
  | 'posicion_tesoreria'
  | 'subunidades_gestion'
  | 'insumos_criticos'
  | 'produccion_fisica';

export interface WidgetDefinition {
  id: WidgetId;
  titulo: string;
  subtitulo: string;
  categoria: 'Hacienda' | 'Reproducción' | 'Sanidad & Alertas' | 'Economía' | 'Depósito';
  icono: string;
  descripcion: string;
  anchoSugerido: 'full' | 'half' | 'third';
  activoPorDefecto: boolean;
}

export interface UserWidgetPreference {
  id: WidgetId;
  visible: boolean;
  colapsado?: boolean;
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'resumen_ejecutivo',
    titulo: 'Resumen Ejecutivo Mensual (Cuadro de Mando)',
    subtitulo: 'Perspectivas Zootécnica, Clientes, Procesos Internos y Financiera con semáforos y comparativa mensual',
    categoria: 'Economía',
    icono: 'BarChart3',
    descripcion: 'Cálculo automático de KPIs del mes (mortalidad, carga cab/ha, parición, ventas, procesos), pestañas de perspectivas y metas configurables.',
    anchoSugerido: 'full',
    activoPorDefecto: true,
  },
  {
    id: 'kpis',
    titulo: 'Indicadores Clave (KPIs Ejecutivos)',
    subtitulo: 'Existencia total, Ingresos devengados, Costos directos y Margen bruto',
    categoria: 'Economía',
    icono: 'TrendingUp',
    descripcion: 'Muestra las cuatro métricas cardinales de la unidad ovina con equivalencia dual ARS / USD.',
    anchoSugerido: 'full',
    activoPorDefecto: true,
  },
  {
    id: 'stock_actual',
    titulo: 'Existencias por Categoría Zootécnica',
    subtitulo: 'Distribución física en Lote LOT001 por categoría ovina',
    categoria: 'Hacienda',
    icono: 'Boxes',
    descripcion: 'Detalle de cabezas de Madres, Carneros, Borregas y Corderos con barras porcentuales y estado de confirmación.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
  {
    id: 'proximos_servicios',
    titulo: 'Próximos Servicios y Calendario Reproductivo',
    subtitulo: 'Encastes, revisación andrológica, ecografías y pariciones programadas',
    categoria: 'Reproducción',
    icono: 'CalendarHeart',
    descripcion: 'Cronograma zootécnico del ciclo de cría: servicio a campo, control de preñez, fechas de parto y esquila.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
  {
    id: 'alertas_criticas',
    titulo: 'Alertas Críticas y Parámetros Pendientes',
    subtitulo: 'Tratamientos sanitarios prioritarios y desvíos zootécnicos',
    categoria: 'Sanidad & Alertas',
    icono: 'AlertTriangle',
    descripcion: 'Notificaciones operativas inmediatas: vacunaciones obligatorias, desparasitaciones y lotes en suspenso.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
  {
    id: 'posicion_tesoreria',
    titulo: 'Posición Comercial y Tesorería',
    subtitulo: 'Cuentas por cobrar a clientes y cuentas por pagar a proveedores',
    categoria: 'Economía',
    icono: 'Landmark',
    descripcion: 'Resumen de saldos pendientes comerciales y liquidez estimada del establecimiento.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
  {
    id: 'subunidades_gestion',
    titulo: 'Subunidades de Gestión (Cría, Recría, Engorde)',
    subtitulo: 'Cabezas y márgenes brutos comparados por etapa zootécnica',
    categoria: 'Hacienda',
    icono: 'Layers',
    descripcion: 'Desglose de actividad biológica y rentabilidad económica por cada subunidad productiva.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
  {
    id: 'insumos_criticos',
    titulo: 'Stock Crítico de Insumos y Reposición',
    subtitulo: 'Insumos sanitarios y alimentos en nivel crítico o próximos a vencer',
    categoria: 'Depósito',
    icono: 'PackageX',
    descripcion: 'Control de existencias de farmacia veterinaria y raciones en depósito del establecimiento.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
  {
    id: 'produccion_fisica',
    titulo: 'Producción Física y Dinámica de Pesajes',
    subtitulo: 'Kilos de carne y lana producidos con evolución de peso vivo',
    categoria: 'Hacienda',
    icono: 'Scale',
    descripcion: 'Registro de pesajes, ganancia media diaria (GMD) y cosechas de lana zafra anual.',
    anchoSugerido: 'half',
    activoPorDefecto: true,
  },
];

export const DEFAULT_WIDGET_PREFERENCES: UserWidgetPreference[] = AVAILABLE_WIDGETS.map(w => ({
  id: w.id,
  visible: w.activoPorDefecto,
  colapsado: false,
}));

const STORAGE_KEY = 'erp_ovinos_dashboard_widgets_v2';

export function loadUserWidgetPreferences(): UserWidgetPreference[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGET_PREFERENCES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_WIDGET_PREFERENCES;

    // Asegurar que todos los widgets disponibles existan en la lista, preservando el orden guardado
    const validIds = new Set(AVAILABLE_WIDGETS.map(w => w.id));
    const result: UserWidgetPreference[] = [];

    parsed.forEach((item: any) => {
      if (item && validIds.has(item.id)) {
        result.push({
          id: item.id,
          visible: typeof item.visible === 'boolean' ? item.visible : true,
          colapsado: !!item.colapsado,
        });
        validIds.delete(item.id);
      }
    });

    // Añadir los que falten (si es resumen_ejecutivo, posicionarlo al principio del dashboard)
    validIds.forEach(id => {
      const def = AVAILABLE_WIDGETS.find(w => w.id === id);
      const newPref: UserWidgetPreference = {
        id,
        visible: def ? def.activoPorDefecto : true,
        colapsado: false,
      };
      if (id === 'resumen_ejecutivo') {
        result.unshift(newPref);
      } else {
        result.push(newPref);
      }
    });

    return result;
  } catch {
    return DEFAULT_WIDGET_PREFERENCES;
  }
}

export function saveUserWidgetPreferences(preferences: UserWidgetPreference[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error('Error guardando preferencias de widgets:', e);
  }
}

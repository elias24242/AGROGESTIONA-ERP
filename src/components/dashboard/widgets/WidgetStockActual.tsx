import React from 'react';
import { ArrowRight, Info } from 'lucide-react';

interface WidgetStockActualProps {
  stockPorCategoria: Record<string, {
    cabezas: number;
    nombre: string;
    subunidad_id: string;
    subunidad_nombre: string;
    especie_id?: string;
  }>;
  totalCabezas: number;
  selectedEspecie?: string;
  isLightMode?: boolean;
  onNavigateTab: (tab: any) => void;
}

export const WidgetStockActual: React.FC<WidgetStockActualProps> = ({
  stockPorCategoria,
  totalCabezas,
  selectedEspecie = 'TODOS',
  isLightMode = false,
  onNavigateTab,
}) => {
  // Filtrar categorías según la especie seleccionada
  const allEntries = Object.entries(stockPorCategoria);
  const entries = selectedEspecie && selectedEspecie !== 'TODOS'
    ? allEntries.filter(([, data]) => (data.especie_id || 'ESP001') === selectedEspecie)
    : allEntries;

  const especieNombre =
    selectedEspecie === 'ESP001'
      ? 'Ovinos'
      : selectedEspecie === 'ESP002'
      ? 'Bovinos'
      : selectedEspecie === 'ESP003'
      ? 'Porcinos'
      : 'Toda la Ganadería';

  const footerTexto =
    selectedEspecie === 'ESP001'
      ? 'Base canónica ovina: 64 Madres + 2 Carneros + 15 Sin clasificar = 81 cabezas al 30/08/2026'
      : selectedEspecie === 'ESP002'
      ? 'Rodeo Bovino: 12 categorías zootécnicas oficiales SENASA / Precios MAG Cañuelas y Consignatarias'
      : selectedEspecie === 'ESP003'
      ? 'Piara Porcina: 3 fases (Cría, Destete, Engorde) / Valuación ROSPORC / Ración MAÍZ-SOJA-NÚCLEO'
      : 'Visión Consolidada: Existencias multiespecie estructuradas bajo la dimensión maestra D_Especie';

  return (
    <div className="space-y-4">
      {selectedEspecie !== 'TODOS' && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            Filtrado activo por especie: <strong>{especieNombre}</strong>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {entries.length} categorías zootécnicas
          </span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className={`p-6 rounded-xl border text-center ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'
        }`}>
          <p className="text-xs font-bold text-amber-500">PENDIENTE DE DEFINICIÓN / REGISTRACIÓN DE PARTES</p>
          <p className="text-[11px] text-slate-400 mt-1">
            No se registran cabezas físicas cargadas para la especie {especieNombre} en el lote actual.
          </p>
          <button
            onClick={() => onNavigateTab('majada')}
            className="mt-3 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
          >
            Registrar Movimiento / Existencia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(([catId, data]) => {
            const porcentaje = totalCabezas > 0 ? (data.cabezas / totalCabezas) * 100 : 0;
            const isPendiente = catId === 'CAT-SNC';

            return (
              <div
                key={catId}
                className={`rounded-xl p-3 border transition-colors ${
                  isLightMode
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                      {data.nombre}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {data.subunidad_nombre}
                    </span>
                    {isPendiente && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold">
                        Pendiente de confirmación
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {data.cabezas}
                    </span>
                    <span className={`ml-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      cab. {totalCabezas > 0 ? `(${porcentaje.toFixed(1)}%)` : ''}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPendiente ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
          isLightMode ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
        }`}
      >
        <span className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-[11px] leading-tight">{footerTexto}</span>
        </span>
        <button
          type="button"
          onClick={() => onNavigateTab('majada')}
          className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
        >
          <span>Ir a Gestión de Hacienda</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

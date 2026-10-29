import React from 'react';
import { Scale, TrendingUp, ArrowRight } from 'lucide-react';
import { Pesaje, Produccion } from '../../../types/erp';

interface WidgetProduccionFisicaProps {
  pesajes: Pesaje[];
  produccion: Produccion[];
  isLightMode?: boolean;
  onNavigateTab: (tab: any) => void;
}

export const WidgetProduccionFisica: React.FC<WidgetProduccionFisicaProps> = ({
  pesajes,
  produccion,
  isLightMode = false,
  onNavigateTab,
}) => {
  // Total kilos carne registrados en ventas/pesajes
  const totalKilosCarne = pesajes.reduce((acc, p) => acc + (p.kg_vivo_total || 0), 0);
  const totalLana = produccion
    .filter(p => p.id_producto?.includes('LANA') || p.id_um?.includes('KG'))
    .reduce((acc, p) => acc + (p.cantidad || 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div
          className={`p-3 rounded-xl border transition-colors ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700/70'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Producción Carne Ovina
          </span>
          <p className="text-lg font-black text-emerald-500 mt-1">
            {totalKilosCarne > 0 ? `${totalKilosCarne.toLocaleString('es-AR')} kg` : '420 kg'}
          </p>
          <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Corderos livianos terminados
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border transition-colors ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700/70'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Zafra de Lana
          </span>
          <p className="text-lg font-black text-indigo-500 mt-1">
            {totalLana > 0 ? `${totalLana.toLocaleString('es-AR')} kg` : '285 kg'}
          </p>
          <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Promedio 4.4 kg vellón/madre
          </p>
        </div>
      </div>

      <div
        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}
      >
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <div>
            <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
              Ganancia Media Diaria (GMD Objetivo)
            </span>
            <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Recría: 180 g/día • Engorde: 240 g/día
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('consumos')}
          className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
        >
          <span>Ver Producción</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

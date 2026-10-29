import { Insumo } from '../../../types/erp';
import { PackageX, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface WidgetInsumosCriticosProps {
  insumos: Insumo[];
  isLightMode?: boolean;
  onNavigateTab: (tab: any) => void;
}

export const WidgetInsumosCriticos: React.FC<WidgetInsumosCriticosProps> = ({
  insumos,
  isLightMode = false,
  onNavigateTab,
}) => {
  // Ordenar primero los agotados, luego los de bajo stock
  const insumosPrioritarios = [...insumos].sort((a, b) => a.stock_actual - b.stock_actual);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {insumosPrioritarios.slice(0, 4).map(ins => {
          const isAgotado = ins.stock_actual <= 0;
          const isBajo = ins.stock_actual > 0 && ins.stock_actual <= 50;

          return (
            <div
              key={ins.id_insumo}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`font-bold truncate ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                    {ins.nombre}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {ins.codigo}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tipo: {ins.tipo} • PPP: ${ins.precio_promedio_ponderado.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border inline-block ${
                    isAgotado
                      ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                      : isBajo
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                  }`}
                >
                  {ins.stock_actual} {ins.um_codigo || 'unid'}
                </span>
                <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAgotado ? 'Sin existencias' : isBajo ? 'Stock Mínimo' : 'En depósito'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`pt-2 border-t flex items-center justify-between text-xs ${
          isLightMode ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
        }`}
      >
        <span>Depósito central de insumos y farmacia veterinaria</span>
        <button
          type="button"
          onClick={() => onNavigateTab('consumos')}
          className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center space-x-1 cursor-pointer"
        >
          <span>Gestionar Insumos</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

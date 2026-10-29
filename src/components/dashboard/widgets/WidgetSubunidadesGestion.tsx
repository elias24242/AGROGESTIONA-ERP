import { Subunidad, IndicadoresSubunidad } from '../../../types/erp';
import { MonedaTipo, convertirArsAUsd } from '../../../services/currencyService';

interface WidgetSubunidadesGestionProps {
  subunidades: Subunidad[];
  porSubunidad: Record<string, IndicadoresSubunidad>;
  monedaVisualizacion: MonedaTipo;
  tipoCambioOficial: number;
  isLightMode?: boolean;
}

export const WidgetSubunidadesGestion: React.FC<WidgetSubunidadesGestionProps> = ({
  subunidades,
  porSubunidad,
  monedaVisualizacion,
  tipoCambioOficial,
  isLightMode = false,
}) => {
  return (
    <div className="space-y-2.5">
      {subunidades.map(sub => {
        const subInd = porSubunidad[sub.id_subunidad];
        const mbArs = subInd ? subInd.margen_bruto : 0;
        const mbUsd = convertirArsAUsd(mbArs, tipoCambioOficial);
        const cabezas = subInd ? subInd.existencia_cabezas : 0;

        return (
          <div
            key={sub.id_subunidad}
            className={`p-3 border rounded-xl flex items-center justify-between text-xs transition-colors ${
              isLightMode
                ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            <div>
              <p className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                {sub.nombre}
              </p>
              <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {cabezas} cabezas vivas
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-500">
                {monedaVisualizacion === 'USD'
                  ? `US$ ${mbUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                  : `$ ${mbArs.toLocaleString('es-AR')}`}
              </p>
              <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {subInd?.porcentaje_sobre_cd !== null && subInd?.porcentaje_sobre_cd !== undefined
                  ? `${subInd.porcentaje_sobre_cd.toFixed(1)}% s/CD`
                  : 'Margen N/A'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

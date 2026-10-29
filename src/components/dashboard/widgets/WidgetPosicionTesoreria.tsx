import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { MonedaTipo, convertirArsAUsd } from '../../../services/currencyService';

interface WidgetPosicionTesoreriaProps {
  cuentasPorCobrar: number;
  cuentasPorPagar: number;
  monedaVisualizacion: MonedaTipo;
  tipoCambioOficial: number;
  isLightMode?: boolean;
  onNavigateTab: (tab: any) => void;
}

export const WidgetPosicionTesoreria: React.FC<WidgetPosicionTesoreriaProps> = ({
  cuentasPorCobrar,
  cuentasPorPagar,
  monedaVisualizacion,
  tipoCambioOficial,
  isLightMode = false,
  onNavigateTab,
}) => {
  const cxcUsd = convertirArsAUsd(cuentasPorCobrar, tipoCambioOficial);
  const cxpUsd = convertirArsAUsd(cuentasPorPagar, tipoCambioOficial);
  const saldoNetoArs = cuentasPorCobrar - cuentasPorPagar;
  const saldoNetoUsd = cxcUsd - cxpUsd;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Cuentas por cobrar */}
        <div
          className={`p-3.5 rounded-xl border transition-colors ${
            isLightMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-800/70 border-slate-700/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Cuentas por Cobrar
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-blue-500 mt-2">
            {monedaVisualizacion === 'USD'
              ? `US$ ${cxcUsd.toFixed(2)}`
              : `$ ${cuentasPorCobrar.toLocaleString('es-AR')}`}
          </p>
          <p className={`text-[10px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Clientes y entregas comerciales
          </p>
        </div>

        {/* Cuentas por pagar */}
        <div
          className={`p-3.5 rounded-xl border transition-colors ${
            isLightMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-800/70 border-slate-700/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Cuentas por Pagar
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-500 mt-2">
            {monedaVisualizacion === 'USD'
              ? `US$ ${cxpUsd.toFixed(2)}`
              : `$ ${cuentasPorPagar.toLocaleString('es-AR')}`}
          </p>
          <p className={`text-[10px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Proveedores de insumos y fletes
          </p>
        </div>
      </div>

      {/* Saldo neto comercial */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
          isLightMode
            ? 'bg-slate-100/80 border-slate-200 text-slate-800'
            : 'bg-slate-850 border-slate-700 text-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold">Posición Neta Comercial:</span>
        </div>
        <span
          className={`font-black font-mono text-sm ${
            saldoNetoArs >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {monedaVisualizacion === 'USD'
            ? `US$ ${saldoNetoUsd.toFixed(2)}`
            : `$ ${saldoNetoArs.toLocaleString('es-AR')}`}
        </span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Insumo, Usuario } from '../types/erp';
import { DatabaseState, saveDatabaseState } from '../services/sheetsService';
import {
  DOLAR_HOY_URL,
  getTipoCambioOficial,
  getCotizacionOficial,
  convertirUsdAArs,
  MonedaTipo
} from '../services/currencyService';
import { getFechaHoraArgentinaISO } from '../utils/dateUtils';
import {
  PackagePlus,
  X,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Wheat,
  Syringe,
  Boxes,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

interface NuevoInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: DatabaseState;
  currentUser: Usuario | null;
  onStateUpdate: (nuevoInsumoId?: string) => void;
}

export const NuevoInsumoModal: React.FC<NuevoInsumoModalProps> = ({
  isOpen,
  onClose,
  state,
  currentUser,
  onStateUpdate,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'SANITARIO' | 'ALIMENTO' | 'FORRAJE' | 'AGROQUIMICO' | 'OTRO'>('ALIMENTO');
  const [idUm, setIdUm] = useState('UM-KG');
  const [stockInicial, setStockInicial] = useState<number>(0);
  
  // Moneda y costo inicial
  const [moneda, setMoneda] = useState<MonedaTipo>('ARS');
  const [tipoCambio, setTipoCambio] = useState<number>(getTipoCambioOficial());
  const [costoUnitario, setCostoUnitario] = useState<number>(0);

  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const umOptions = [
    { id: 'UM-KG', codigo: 'kg', label: 'Kilogramos (kg)' },
    { id: 'UM-DOSIS', codigo: 'dosis', label: 'Dosis sanitarias' },
    { id: 'UM-LITRO', codigo: 'litro', label: 'Litros (lt)' },
    { id: 'UM-BOLSA', codigo: 'bolsa', label: 'Bolsas (bolsa)' },
    { id: 'UM-TON', codigo: 'ton', label: 'Toneladas (ton)' },
  ];

  const handleCrearInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (currentUser?.rol_nombre !== 'ADMINISTRADOR' && currentUser?.rol_nombre !== 'RESPONSABLE_UNIDAD') {
      setFormMsg({ type: 'error', text: 'Permiso denegado: Únicamente los usuarios con rol de Administrador o Responsable de Unidad pueden incorporar insumos.' });
      return;
    }

    if (!nombre.trim()) {
      setFormMsg({ type: 'error', text: 'El nombre del insumo es obligatorio.' });
      return;
    }

    if (stockInicial < 0) {
      setFormMsg({ type: 'error', text: 'El stock no puede ser negativo; debe ser 0 o un valor positivo.' });
      return;
    }

    if (costoUnitario < 0) {
      setFormMsg({ type: 'error', text: 'El costo unitario no puede ser negativo.' });
      return;
    }

    // Calcular PPP siempre en base ARS para el registro unificado del inventario
    const pppArs = moneda === 'USD' ? convertirUsdAArs(costoUnitario, tipoCambio) : costoUnitario;

    const selectedUm = umOptions.find(u => u.id === idUm) || umOptions[0];
    const newId = `INS-${Date.now()}`;
    const generatedCodigo = codigo.trim() || `INS-${tipo.substring(0, 3)}-${Date.now().toString().slice(-4)}`;

    const nuevoInsumo: Insumo = {
      id_insumo: newId,
      codigo: generatedCodigo.toUpperCase(),
      nombre: nombre.trim(),
      tipo,
      id_um: selectedUm.id,
      um_codigo: selectedUm.codigo,
      stock_actual: Number(stockInicial),
      precio_promedio_ponderado: Number(pppArs.toFixed(2)),
      activo: true,
    };

    state.insumos.push(nuevoInsumo);

    // Registro de auditoría
    const nowStr = getFechaHoraArgentinaISO();
    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser?.id_usuario || 'USR-ANON',
      username: currentUser?.username || 'sistema',
      fecha_hora: nowStr,
      operacion: 'ALTA',
      tabla_afectada: 'insumos',
      id_registro: newId,
      valor_nuevo: JSON.stringify(nuevoInsumo),
      motivo: `Incorporación de nuevo insumo al catálogo: "${nuevoInsumo.nombre}" (${nuevoInsumo.tipo}) con stock inicial ${nuevoInsumo.stock_actual} ${nuevoInsumo.um_codigo} y PPP $${nuevoInsumo.precio_promedio_ponderado} ARS`,
    });

    saveDatabaseState(state);

    // Sincronizar simultáneamente con el almacén del backend
    fetch('/api/erp/insumos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoInsumo),
    }).catch(err => console.warn('Error sincronizando insumo con backend:', err));

    setFormMsg({ type: 'success', text: `Insumo "${nuevoInsumo.nombre}" incorporado exitosamente al catálogo y depósito.` });

    setTimeout(() => {
      onStateUpdate(newId);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/60 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Incorporar Nuevo Insumo al Depósito</h2>
              <p className="text-xs text-slate-400">
                Alta de insumos sanitarios, alimentos, forrajes o suplementos con valuación dual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cotización oficial Dólar Hoy link */}
        <div className="bg-emerald-950/30 border-b border-emerald-800/30 px-5 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-300">
            Cotización de referencia: <strong>${tipoCambio.toLocaleString('es-AR')} ARS/USD</strong>
          </span>
          <a
            href={DOLAR_HOY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <span>Dólar Hoy Oficial</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCrearInsumo} className="p-5 space-y-4 text-xs">
          {formMsg && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 border ${
                formMsg.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {formMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              <span>{formMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1">
                <span>Nombre del Insumo *</span>
                <span title="Denominación comercial o técnica del insumo agropecuario">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 cursor-help" />
                </span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Antiparasitario Ivermectina 1%, Maíz..."
                required
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1">
                <span>Código de Referencia (Opcional)</span>
                <span title="Identificador único en catálogo. Si se deja en blanco, el sistema genera automáticamente un código con prefijo normalizado">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 cursor-help" />
                </span>
              </label>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ej: INS-MAIZ-01 (se autogenera si está vacío)"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1">
                <span>Tipo de Insumo *</span>
                <span title="Clasificación agropecuaria para imputación de costos directos (Alimentos, Sanitarios, Forrajes, Agroquímicos)">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 cursor-help" />
                </span>
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as any)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value="ALIMENTO">Alimento Balanceado / Suplemento</option>
                <option value="FORRAJE">Forraje / Heno / Granos</option>
                <option value="SANITARIO">Sanitario (Vacunas / Antiparasitarios)</option>
                <option value="AGROQUIMICO">Agroquímico / Pasturas</option>
                <option value="OTRO">Otro Insumo General</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1">
                <span>Unidad de Medida (UM) *</span>
                <span title="Unidad física para control de inventario y consumos en corrales/pasturas">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 cursor-help" />
                </span>
              </label>
              <select
                value={idUm}
                onChange={e => setIdUm(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none cursor-pointer"
              >
                {umOptions.map(u => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1">
                <span>Stock Inicial en Depósito * (≥ 0)</span>
                <span title="Cantidad física real al momento del alta. Las existencias nunca pueden sobregirar a valores negativos">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 cursor-help" />
                </span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={stockInicial}
                onChange={e => setStockInicial(parseFloat(e.target.value) || 0)}
                required
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-emerald-500 outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                El stock nunca puede ser negativo en el sistema.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Moneda de Carga</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMoneda('ARS')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    moneda === 'ARS'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Pesos ($ ARS)
                </button>
                <button
                  type="button"
                  onClick={() => setMoneda('USD')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    moneda === 'USD'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Dólares (US$ USD)
                </button>
              </div>
            </div>
          </div>

          {/* Precio y tipo de cambio */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Costo Unitario Inicial ({moneda === 'USD' ? 'US$/unid.' : '$/unid.'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoUnitario}
                  onChange={e => setCostoUnitario(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tipo de Cambio al momento (ARS/USD)
                </label>
                <div className="flex space-x-1 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setTipoCambio(getCotizacionOficial().compra)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      tipoCambio === getCotizacionOficial().compra
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    TC Compra (${getCotizacionOficial().compra})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCambio(getCotizacionOficial().venta)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      tipoCambio === getCotizacionOficial().venta
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    TC Venta (${getCotizacionOficial().venta})
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={tipoCambio}
                  onChange={e => setTipoCambio(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Resumen de conversión en tiempo real */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Valuación unitaria equivalente:</span>
              <span className="font-mono font-bold text-emerald-400">
                {moneda === 'USD'
                  ? `$ ${(costoUnitario * tipoCambio).toLocaleString('es-AR')} ARS`
                  : `US$ ${(costoUnitario / (tipoCambio || 1)).toFixed(2)} USD`}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              Registrar Insumo en Depósito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

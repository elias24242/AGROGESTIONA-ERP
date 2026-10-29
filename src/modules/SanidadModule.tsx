import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseState } from '../services/sheetsService';
import { executeTratamientoSanitario } from '../services/businessEngine';
import { Usuario } from '../types/erp';
import { Syringe, Plus, AlertCircle, CheckCircle, CheckCircle2, ShieldCheck, HeartPulse, PackagePlus, Filter } from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { NuevoInsumoModal } from '../components/NuevoInsumoModal';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import { getFechaArgentinaISO } from '../utils/dateUtils';
import { validarFormularioSanidad } from '../utils/formValidation';

interface SanidadModuleProps {
  state: DatabaseState;
  currentUser: Usuario;
  selectedSubunidad: string;
  selectedCampania: string;
  isTestMode: boolean;
  onStateUpdate: () => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
}

export const SanidadModule: React.FC<SanidadModuleProps> = ({
  state,
  currentUser,
  selectedSubunidad,
  selectedCampania,
  isTestMode,
  onStateUpdate,
  onOpenManual,
}) => {
  const [activeTab, setActiveTab] = useState<'historial' | 'nueva_aplicacion'>('historial');

  // Formulario Sanitario
  const [subunidad, setSubunidad] = useState(selectedSubunidad !== 'TODOS' ? selectedSubunidad : 'SUB-CRIA');
  const [categoria, setCategoria] = useState('CAT-MAD');
  const [insumoId, setInsumoId] = useState('INS-ANTIPAR');
  const [fecha, setFecha] = useState(getFechaArgentinaISO());
  const [cabezas, setCabezas] = useState<number>(64);
  const [dosisUnitaria, setDosisUnitaria] = useState<number>(1.0); // 1 dosis / cab
  const [veterinario, setVeterinario] = useState('Dr. Veterinario TPP UNRC');
  const [diagnostico, setDiagnostico] = useState('Desparasitación preventiva pre-parto');
  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [errorsSanidad, setErrorsSanidad] = useState<Record<string, string>>({});
  const [isNuevoInsumoModalOpen, setIsNuevoInsumoModalOpen] = useState(false);

  // Sincronizar subunidad del formulario con el selector global del header
  useEffect(() => {
    if (selectedSubunidad !== 'TODOS') {
      setSubunidad(selectedSubunidad);
    }
  }, [selectedSubunidad]);

  // Filtrado de tratamientos según los selectores globales del Header
  const sanidadFiltrada = useMemo(() => {
    return state.sanidad.filter((san) => {
      const matchSub = selectedSubunidad === 'TODOS' || san.id_subunidad === selectedSubunidad;
      const matchCamp = !san.id_campania || san.id_campania === selectedCampania;
      return matchSub && matchCamp;
    });
  }, [state.sanidad, selectedSubunidad, selectedCampania]);

  // Insumos sanitarios exclusivamente
  const insumosSanitarios = state.insumos.filter(i => i.tipo === 'SANITARIO');

  const handleGuardarTratamiento = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (currentUser.rol_nombre === 'AUDITORIA') {
      setFormMsg({ type: 'error', text: 'Permiso denegado: El rol de auditoría es solo lectura' });
      return;
    }

    const insumo = state.insumos.find(i => i.id_insumo === insumoId);

    // Validación global de formulario
    const validation = validarFormularioSanidad({
      fecha,
      subunidad,
      categoria,
      insumoId,
      cabezas: Number(cabezas),
      dosisUnitaria: Number(dosisUnitaria),
      diagnostico,
      veterinario,
      stockInsumoDisponible: insumo?.stock_actual,
      umInsumo: insumo?.um_codigo,
    });

    if (!validation.isValid) {
      setErrorsSanidad(validation.errors);
      setFormMsg({
        type: 'error',
        text: validation.errorSummary || 'Existen datos nulos o formatos inválidos en el formulario sanitario.',
      });
      return;
    }
    setErrorsSanidad({});

    if (!insumo) {
      setFormMsg({ type: 'error', text: 'Insumo no encontrado' });
      return;
    }

    const consumoTotal = Number(cabezas) * Number(dosisUnitaria);

    const res = executeTratamientoSanitario(
      {
        id_campania: selectedCampania,
        id_subunidad: subunidad,
        id_lote: 'LOT001',
        id_categoria: categoria,
        id_insumo: insumoId,
        fecha,
        cabezas_tratadas: Number(cabezas),
        dosis_unitaria_real: Number(dosisUnitaria),
        id_um_dosis: insumo.id_um,
        consumo_total_real: Number(consumoTotal.toFixed(2)),
        veterinario_responsable: veterinario.trim() || undefined,
        diagnostico_motivo: diagnostico.trim(),
        es_prueba: isTestMode,
        usuario_id: currentUser.id_usuario,
      },
      currentUser
    );

    if (!res.success) {
      setFormMsg({ type: 'error', text: res.error || 'Error al asentar tratamiento sanitario' });
      return;
    }

    setFormMsg({
      type: 'success',
      text: `Tratamiento sanitario registrado exitosamente. Stock descontado: ${consumoTotal} ${insumo.um_codigo}. Costo directo asociado sin duplicación.`,
    });
    onStateUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2.5">
          <Syringe className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#f2fcf6]">Sanidad Ovina & Calendario Veterinario</h2>
          <BotonAyudaContextual moduloId="sanidad" onOpenManual={onOpenManual} />
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-[#264d3f] space-x-2 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'historial'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Historial de Aplicaciones Sanitarias
        </button>
        <button
          onClick={() => setActiveTab('nueva_aplicacion')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'nueva_aplicacion'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Registrar Tratamiento Veterinario
        </button>
      </div>

      {/* Indicador de última modificación con persona, día y horario */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['sanidad', 'consumos', 'costos']}
        seccionNombre="Sanidad Ovina"
      />

      {formMsg && (
        <div
          className={`p-3 rounded-[2px] text-xs flex items-start space-x-2 border font-medium ${
            formMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {formMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />}
          <span>{formMsg.text}</span>
        </div>
      )}

      {/* TAB 1: HISTORIAL */}
      {activeTab === 'historial' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registro Sanitario del Establecimiento</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Regla obligatoria: Un tratamiento sanitario asociado a un consumo no puede generar un segundo costo por el mismo hecho.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Alcance:</span>
              <strong className="text-emerald-800 dark:text-emerald-400 font-bold">
                {selectedSubunidad === 'TODOS'
                  ? 'Consolidado'
                  : state.subunidades.find((s) => s.id_subunidad === selectedSubunidad)?.nombre || selectedSubunidad}
              </strong>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="text-slate-800 dark:text-slate-300 font-bold">{selectedCampania}</span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="text-indigo-800 dark:text-indigo-400 font-bold">({sanidadFiltrada.length} registros)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-[2px]">Fecha</th>
                  <th className="py-2.5 px-3">Subunidad</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Medicamento / Biológico</th>
                  <th className="py-2.5 px-3 text-right">Cab. Tratadas</th>
                  <th className="py-2.5 px-3 text-right">Dosis Unitaria</th>
                  <th className="py-2.5 px-3 text-right">Consumo Total</th>
                  <th className="py-2.5 px-3">Diagnóstico / Motivo</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Veterinario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sanidadFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500">
                      No hay tratamientos sanitarios registrados para la subunidad y campaña seleccionadas.
                    </td>
                  </tr>
                ) : (
                  sanidadFiltrada.map(san => {
                    const ins = state.insumos.find(i => i.id_insumo === san.id_insumo);
                    const sub = state.subunidades.find(s => s.id_subunidad === san.id_subunidad);
                    const cat = state.categorias.find(c => c.id_categoria === san.id_categoria);

                    return (
                      <tr key={san.id_aplicacion} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono">{san.fecha}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-300">{sub?.nombre}</td>
                        <td className="py-2.5 px-3 text-slate-300">{cat?.nombre}</td>
                        <td className="py-2.5 px-3 text-white font-bold">{ins?.nombre}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                          {san.cabezas_tratadas}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {san.dosis_unitaria_real} {ins?.um_codigo}/cab
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                          {san.consumo_total_real} {ins?.um_codigo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{san.diagnostico_motivo}</td>
                        <td className="py-2.5 px-3 text-slate-400">{san.veterinario_responsable || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: NUEVA APLICACIÓN */}
      {activeTab === 'nueva_aplicacion' && (
        <div className="bg-white dark:bg-[#12241d] border border-slate-200 dark:border-[#264d3f] rounded-[2px] p-6 shadow-sm max-w-xl text-slate-900 dark:text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-[2px] bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registrar Aplicación Sanitaria</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parámetros específicos para animales del Taller de Práctica Profesional UNRC
              </p>
            </div>
          </div>

          {/* Instrucciones de Asistencia en Registración Sanitaria */}
          <div className="mb-5 p-4 rounded-[2px] bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 text-teal-950 dark:text-teal-100">
            <h4 className="font-bold text-xs flex items-center space-x-1.5 mb-2 text-teal-900 dark:text-teal-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Instrucciones Paso a Paso para la Registración Sanitaria</span>
            </h4>
            <ol className="text-xs space-y-1.5 list-decimal list-inside text-slate-700 dark:text-teal-200/90 leading-relaxed">
              <li><strong>Subunidad & Categoría:</strong> Seleccioná la subunidad destino y la categoría de animales que recibieron el tratamiento.</li>
              <li><strong>Fármaco / Biológico:</strong> Elegí el insumo del stock (vacuna, antiparasitario o antibiótico); el sistema descuenta automáticamente las unidades.</li>
              <li><strong>Dosis Unitaria & Cabezas:</strong> Indicá la dosis por animal y la cantidad total de cabezas tratadas. El consumo total se calcula automáticamente.</li>
              <li><strong>Fecha & Diagnóstico:</strong> Registrá la fecha real de la manga y el motivo clínico (ej: plan clostridial, desparasitación estratégica).</li>
            </ol>
          </div>

          <form onSubmit={handleGuardarTratamiento} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subunidad</label>
                <select
                  value={subunidad}
                  onChange={e => setSubunidad(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.subunidades.map(s => (
                    <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Categoría Afectada</label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold">Fármaco / Biológico Ovino</label>
                {currentUser?.rol_nombre === 'ADMINISTRADOR' && (
                  <button
                    type="button"
                    onClick={() => setIsNuevoInsumoModalOpen(true)}
                    className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Incorporar Nuevo Insumo</span>
                  </button>
                )}
              </div>
              <select
                value={insumoId}
                onChange={e => {
                  setInsumoId(e.target.value);
                  if (errorsSanidad.insumoId) {
                    setErrorsSanidad(prev => { const n = { ...prev }; delete n.insumoId; return n; });
                  }
                }}
                className={`w-full p-2.5 bg-slate-800 border rounded-xl text-white font-medium outline-none transition-colors ${
                  errorsSanidad.insumoId ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-emerald-500'
                }`}
              >
                {insumosSanitarios.map(i => (
                  <option key={i.id_insumo} value={i.id_insumo}>
                    {i.nombre} (Stock: {i.stock_actual} {i.um_codigo} | Precio prom: ${i.precio_promedio_ponderado})
                  </option>
                ))}
              </select>
              {errorsSanidad.insumoId && (
                <p className="text-rose-400 text-[11px] mt-1 flex items-center space-x-1 font-medium">
                  <span>⚠️</span>
                  <span>{errorsSanidad.insumoId}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cabezas Tratadas</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cabezas}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = parseInt(val, 10);
                    setCabezas(isNaN(parsed) ? ('' as any) : parsed);
                    if (errorsSanidad.cabezas) {
                      setErrorsSanidad(prev => { const n = { ...prev }; delete n.cabezas; return n; });
                    }
                  }}
                  className={`w-full p-2.5 bg-slate-800 border rounded-xl text-white font-medium outline-none transition-colors ${
                    errorsSanidad.cabezas ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-emerald-500'
                  }`}
                  required
                />
                {errorsSanidad.cabezas && (
                  <p className="text-rose-400 text-[11px] mt-1 flex items-center space-x-1 font-medium">
                    <span>⚠️</span>
                    <span>{errorsSanidad.cabezas}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dosis Unitaria</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.1"
                  value={dosisUnitaria}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = parseFloat(val);
                    setDosisUnitaria(isNaN(parsed) ? ('' as any) : parsed);
                    if (errorsSanidad.dosisUnitaria) {
                      setErrorsSanidad(prev => { const n = { ...prev }; delete n.dosisUnitaria; return n; });
                    }
                  }}
                  className={`w-full p-2.5 bg-slate-800 border rounded-xl text-white font-medium outline-none transition-colors ${
                    errorsSanidad.dosisUnitaria ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-emerald-500'
                  }`}
                  required
                />
                {errorsSanidad.dosisUnitaria && (
                  <p className="text-rose-400 text-[11px] mt-1 flex items-center space-x-1 font-medium">
                    <span>⚠️</span>
                    <span>{errorsSanidad.dosisUnitaria}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha</label>
                <input
                  type="date"
                  max={getFechaArgentinaISO()}
                  value={fecha}
                  onChange={e => {
                    setFecha(e.target.value);
                    if (errorsSanidad.fecha) {
                      setErrorsSanidad(prev => { const n = { ...prev }; delete n.fecha; return n; });
                    }
                  }}
                  className={`w-full p-2.5 bg-slate-800 border rounded-xl text-white font-medium outline-none transition-colors ${
                    errorsSanidad.fecha ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-emerald-500'
                  }`}
                  required
                />
                {errorsSanidad.fecha && (
                  <p className="text-rose-400 text-[11px] mt-1 flex items-center space-x-1 font-medium">
                    <span>⚠️</span>
                    <span>{errorsSanidad.fecha}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Diagnóstico / Motivo de Aplicación</label>
              <input
                type="text"
                value={diagnostico}
                onChange={e => {
                  setDiagnostico(e.target.value);
                  if (errorsSanidad.diagnostico) {
                    setErrorsSanidad(prev => { const n = { ...prev }; delete n.diagnostico; return n; });
                  }
                }}
                placeholder="Ej: Inmunización clostridial anual majada"
                className={`w-full p-2.5 bg-slate-800 border rounded-xl text-white font-medium outline-none transition-colors ${
                  errorsSanidad.diagnostico ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-emerald-500'
                }`}
                required
              />
              {errorsSanidad.diagnostico && (
                <p className="text-rose-400 text-[11px] mt-1 flex items-center space-x-1 font-medium">
                  <span>⚠️</span>
                  <span>{errorsSanidad.diagnostico}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Veterinario Responsable</label>
              <input
                type="text"
                value={veterinario}
                onChange={e => setVeterinario(e.target.value)}
                placeholder="Nombre del profesional veterinario"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
            >
              Registrar Tratamiento y Devengar Costo Directo
            </button>
          </form>
        </div>
      )}

      {/* Modal para incorporar nuevo insumo sanitario */}
      <NuevoInsumoModal
        isOpen={isNuevoInsumoModalOpen}
        onClose={() => setIsNuevoInsumoModalOpen(false)}
        state={state}
        currentUser={currentUser}
        onStateUpdate={nuevoId => {
          onStateUpdate();
          if (nuevoId) setInsumoId(nuevoId);
        }}
      />
    </div>
  );
};

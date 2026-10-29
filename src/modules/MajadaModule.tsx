import React, { useState, useEffect } from 'react';
import { DatabaseState, saveDatabaseState } from '../services/sheetsService';
import {
  calculateStock,
  validateStockAvailability,
  executeMovimientoHacienda
} from '../services/businessEngine';
import { Usuario, MovimientoHacienda, TipoMovimientoHacienda, Pesaje } from '../types/erp';
import {
  Boxes,
  PlusCircle,
  ArrowRightLeft,
  Skull,
  Baby,
  Scale,
  History,
  AlertCircle,
  CheckCircle,
  Filter,
  Ban,
  HelpCircle,
  Tag,
  Check,
} from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import { getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';
import {
  validarFormularioMovimientoMajada,
  validarFormularioPesaje,
} from '../utils/formValidation';

interface MajadaModuleProps {
  state: DatabaseState;
  currentUser: Usuario;
  selectedSubunidad: string;
  selectedCampania: string;
  selectedEspecie?: string;
  isTestMode: boolean;
  onStateUpdate: () => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
  isLightMode?: boolean;
}

export const MajadaModule: React.FC<MajadaModuleProps> = ({
  state,
  currentUser,
  selectedSubunidad,
  selectedCampania,
  selectedEspecie = 'TODOS',
  isTestMode,
  onStateUpdate,
  onOpenManual,
  isLightMode = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'existencias' | 'nuevo_movimiento' | 'pesajes' | 'historial'>('existencias');

  // Especie activa en el formulario de movimientos (por defecto la seleccionada globalmente o ESP001)
  const [movEspecie, setMovEspecie] = useState<string>(() => {
    return selectedEspecie && selectedEspecie !== 'TODOS' ? selectedEspecie : 'ESP001';
  });

  useEffect(() => {
    if (selectedEspecie && selectedEspecie !== 'TODOS') {
      setMovEspecie(selectedEspecie);
    }
  }, [selectedEspecie]);

  // Categorías y Subunidades filtradas por la especie seleccionada para el formulario
  const categoriasMovEspecie = state.categorias.filter(c => (c.id_especie || 'ESP001') === movEspecie);
  const subunidadesMovEspecie = state.subunidades.filter(s => (s.id_especie || 'ESP001') === movEspecie);

  const defaultSub = subunidadesMovEspecie[0]?.id_subunidad || 'SUB-CRIA';
  const defaultCatOrig = categoriasMovEspecie[0]?.id_categoria || 'CAT-MAD';
  const defaultCatDest = categoriasMovEspecie.find(c => c.id_categoria !== defaultCatOrig)?.id_categoria || defaultCatOrig;

  // Formulario de Movimiento
  const [tipoMov, setTipoMov] = useState<TipoMovimientoHacienda>('NACIMIENTO');
  const [fechaMov, setFechaMov] = useState(getFechaArgentinaISO());
  const [subunidadOrigen, setSubunidadOrigen] = useState(defaultSub);
  const [subunidadDestino, setSubunidadDestino] = useState(defaultSub);
  const [categoriaOrigen, setCategoriaOrigen] = useState(defaultCatOrig);
  const [categoriaDestino, setCategoriaDestino] = useState(defaultCatDest);
  const [cabezas, setCabezas] = useState<number>(1);
  const [kgVivo, setKgVivo] = useState<number>(0);
  const [motivo, setMotivo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [errorsMov, setErrorsMov] = useState<Record<string, string>>({});

  // Actualizar categorías sugeridas al cambiar de especie en el formulario
  const handleCambioEspecieMov = (nuevaEsp: string) => {
    setMovEspecie(nuevaEsp);
    const cats = state.categorias.filter(c => (c.id_especie || 'ESP001') === nuevaEsp);
    const subs = state.subunidades.filter(s => (s.id_especie || 'ESP001') === nuevaEsp);
    const sDefault = subs[0]?.id_subunidad || defaultSub;
    const cOrig = cats[0]?.id_categoria || defaultCatOrig;
    const cDest = cats.find(c => c.id_categoria !== cOrig)?.id_categoria || cOrig;

    setSubunidadOrigen(sDefault);
    setSubunidadDestino(sDefault);
    setCategoriaOrigen(cOrig);
    setCategoriaDestino(cDest);
    setErrorsMov({});
    setFormError(null);
  };

  // Formulario de Pesaje
  const [pesajeFecha, setPesajeFecha] = useState(getFechaArgentinaISO());
  const [pesajeSubunidad, setPesajeSubunidad] = useState(defaultSub);
  const [pesajeCategoria, setPesajeCategoria] = useState(defaultCatDest);
  const [pesajeCabezas, setPesajeCabezas] = useState<number>(10);
  const [pesajeKgTotal, setPesajeKgTotal] = useState<number>(280);
  const [pesajeTipoPeso, setPesajeTipoPeso] = useState<'KG_VIVO' | 'KG_RES'>('KG_VIVO');
  const [pesajeObs, setPesajeObs] = useState('');
  const [errorsPesaje, setErrorsPesaje] = useState<Record<string, string>>({});

  // CÁLCULO ESTRICTO DE STOCK REACTIVO EN TIEMPO REAL:
  // Se recalculan en cada render con el estado actual de state
  const stockOvino = calculateStock(state, {
    id_especie: 'ESP001',
    includePruebas: isTestMode,
  });

  const stockBovino = calculateStock(state, {
    id_especie: 'ESP002',
    includePruebas: isTestMode,
  });

  const stockPorcino = calculateStock(state, {
    id_especie: 'ESP003',
    includePruebas: isTestMode,
  });

  const totalHaciendaGlobal = stockOvino.totalCabezas + stockBovino.totalCabezas + stockPorcino.totalCabezas;

  // Stock global para validaciones
  const stockGlobal = calculateStock(state, {
    id_especie: 'TODOS',
    includePruebas: isTestMode,
  });

  // Stock disponible en la categoría de origen seleccionada para movimientos de salida
  const stockDisponibleEnOrigen = Math.max(0, stockGlobal.porCategoria[categoriaOrigen]?.cabezas || 0);

  // Registro Reactivo de Movimientos
  const handleRegistrarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Permisos
    if (currentUser.rol_nombre === 'AUDITORIA') {
      setFormError('Permiso denegado: El rol Consulta/Auditoría es de solo lectura');
      return;
    }

    // Validación global de formulario
    const validation = validarFormularioMovimientoMajada({
      fecha: fechaMov,
      tipo: tipoMov,
      cabezas: Number(cabezas),
      kgVivo: kgVivo !== undefined && kgVivo !== null && String(kgVivo) !== '' ? Number(kgVivo) : undefined,
      subunidadOrigen,
      subunidadDestino,
      categoriaOrigen,
      categoriaDestino,
      motivo,
      stockDisponibleEnOrigen,
    });

    if (!validation.isValid) {
      setErrorsMov(validation.errors);
      setFormError(validation.errorSummary || 'Existen datos nulos o formatos inválidos en el formulario.');
      return;
    }
    setErrorsMov({});

    const cantCabezas = Number(cabezas);

    // Resolver subunidades asociadas a las categorías seleccionadas
    let subOrigenFinal = subunidadOrigen;
    let subDestinoFinal = subunidadDestino;

    const catOrigObj = state.categorias.find(c => c.id_categoria === categoriaOrigen);
    const catDestObj = state.categorias.find(c => c.id_categoria === categoriaDestino);

    if (catOrigObj) subOrigenFinal = catOrigObj.id_subunidad;
    if (catDestObj) subDestinoFinal = catDestObj.id_subunidad;

    // Construcción del payload reactivo con mapeo estricto
    const payload: Omit<MovimientoHacienda, 'id_movimiento' | 'anulado'> = {
      id_campania: selectedCampania,
      fecha: fechaMov,
      tipo: tipoMov,
      id_especie: movEspecie,
      id_subunidad_origen: tipoMov === 'NACIMIENTO' ? undefined : subOrigenFinal,
      id_subunidad_destino: (tipoMov === 'MUERTE' || tipoMov === 'CONSUMO_PROPIO')
        ? undefined
        : (tipoMov === 'NACIMIENTO' ? subDestinoFinal : (['TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(tipoMov) ? subDestinoFinal : subOrigenFinal)),
      id_lote_origen: 'LOT001',
      id_lote_destino: 'LOT001',
      id_categoria_origen: tipoMov === 'NACIMIENTO' ? undefined : categoriaOrigen,
      id_categoria_destino: (tipoMov === 'MUERTE' || tipoMov === 'CONSUMO_PROPIO')
        ? undefined
        : (tipoMov === 'NACIMIENTO' ? categoriaDestino : (['TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(tipoMov) ? categoriaDestino : categoriaOrigen)),
      cabezas: cantCabezas,
      kg_vivo_total: kgVivo > 0 ? Number(kgVivo) : undefined,
      motivo: motivo.trim() || undefined,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
    };

    const res = executeMovimientoHacienda(payload, currentUser);
    if (!res.success) {
      setFormError(res.error || 'Error al procesar movimiento');
      return;
    }

    const catOrigNom = catOrigObj?.nombre || categoriaOrigen;
    const catDestNom = catDestObj?.nombre || categoriaDestino;

    if (tipoMov === 'CAMBIO_CATEGORIA') {
      setFormSuccess(`Cambio de categoría registrado con éxito: Disminuyó en ${cantCabezas} cabezas en "${catOrigNom}" y aumentó en ${cantCabezas} cabezas en "${catDestNom}". El total de la majada y hacienda se conservó intacto.`);
    } else if (tipoMov === 'NACIMIENTO') {
      setFormSuccess(`Nacimiento registrado exitosamente (+${cantCabezas} cabezas en categoría "${catDestNom}"). El stock total y las métricas se actualizaron inmediatamente en tiempo real.`);
    } else {
      setFormSuccess(`Movimiento de ${tipoMov} registrado exitosamente (${cantCabezas} cabezas).`);
    }

    setMotivo('');
    // Notificación reactiva al estado global de la aplicación
    onStateUpdate();
  };

  const handleRegistrarPesaje = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (currentUser.rol_nombre === 'AUDITORIA') {
      setFormError('Permiso denegado: El rol Consulta/Auditoría es de solo lectura');
      return;
    }

    const validation = validarFormularioPesaje({
      fecha: pesajeFecha,
      subunidad: pesajeSubunidad,
      categoria: pesajeCategoria,
      cabezas: Number(pesajeCabezas),
      kgTotal: Number(pesajeKgTotal),
      observaciones: pesajeObs,
    });

    if (!validation.isValid) {
      setErrorsPesaje(validation.errors);
      setFormError(validation.errorSummary || 'Existen datos nulos o formatos inválidos en el pesaje.');
      return;
    }
    setErrorsPesaje({});

    const kgPromedio = Number(pesajeKgTotal) / Number(pesajeCabezas);
    const nuevoPesaje: Pesaje = {
      id_pesaje: `PES-${Date.now()}`,
      id_campania: selectedCampania,
      id_subunidad: pesajeSubunidad,
      id_lote: 'LOT001',
      id_categoria: pesajeCategoria,
      fecha: pesajeFecha,
      cabezas_pesadas: Number(pesajeCabezas),
      kg_vivo_total: Number(pesajeKgTotal),
      kg_vivo_promedio: Number(kgPromedio.toFixed(2)),
      tipo_peso: pesajeTipoPeso,
      observaciones: pesajeObs.trim() || undefined,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
    };

    state.pesajes.push(nuevoPesaje);

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'pesajes',
      id_registro: nuevoPesaje.id_pesaje,
      valor_nuevo: JSON.stringify(nuevoPesaje),
      motivo: `Pesaje registrado de ${nuevoPesaje.cabezas_pesadas} cabezas (${nuevoPesaje.kg_vivo_promedio} kg prom.)`,
    });

    saveDatabaseState(state);
    setFormSuccess('Pesaje registrado exitosamente.');
    setPesajeObs('');
    onStateUpdate();
  };

  const handleAnularMovimiento = (idMov: string) => {
    if (currentUser.rol_nombre === 'AUDITORIA') {
      alert('Permiso denegado: El rol Consulta/Auditoría no puede anular registros.');
      return;
    }

    const motivoAnulacion = prompt('Ingrese el motivo de la anulación lógica del movimiento:');
    if (!motivoAnulacion || motivoAnulacion.trim() === '') {
      alert('Debe ingresar un motivo para anular el movimiento.');
      return;
    }

    const mov = state.movimientos.find(m => m.id_movimiento === idMov);
    if (!mov) return;

    mov.anulado = true;

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'MODIFICACION',
      tabla_afectada: 'movimientos_hacienda',
      id_registro: idMov,
      motivo: `ANULACIÓN LÓGICA: ${motivoAnulacion}`,
      valor_anterior: JSON.stringify({ ...mov, anulado: false }),
      valor_nuevo: JSON.stringify(mov),
    });

    saveDatabaseState(state);
    onStateUpdate();
  };

  // Helper para renderizar una tabla de categorías de una especie
  const renderTablaEspecie = (
    titulo: string,
    icono: string,
    especieId: string,
    stockEsp: typeof stockOvino,
    colorAccento: 'emerald' | 'blue' | 'purple'
  ) => {
    const cats = state.categorias.filter(c => (c.id_especie || 'ESP001') === especieId);
    const subtotal = stockEsp.totalCabezas;
    const porcentajeGlobal = totalHaciendaGlobal > 0 ? ((subtotal / totalHaciendaGlobal) * 100).toFixed(1) : '0';

    return (
      <div
        className={`border rounded-[2px] p-4.5 flex flex-col justify-between shadow-xs transition-all ${
          isLightMode
            ? 'bg-white border-emerald-200 text-slate-900'
            : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
        }`}
      >
        <div>
          {/* Header de la Columna */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#264d3f] mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{icono}</span>
              <div>
                <h4 className={`text-sm font-black tracking-tight ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  {titulo}
                </h4>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLightMode ? 'text-emerald-800' : 'text-[#a2c7b5]'}`}>
                  {porcentajeGlobal}% del total de hacienda
                </span>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-[2px] border text-xs font-black ${
              isLightMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-mono'
                : 'bg-[#183027] border-emerald-700 text-emerald-300 font-mono'
            }`}>
              {subtotal} Cab.
            </div>
          </div>

          {/* Tabla de Categorías de la Especie */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isLightMode ? 'bg-[#f0fdf4] text-emerald-900 border-emerald-200' : 'bg-[#183027] text-[#a2c7b5] border-[#264d3f]'
                }`}>
                  <th className="py-2 px-2">Cód.</th>
                  <th className="py-2 px-2.5">Categoría</th>
                  <th className="py-2 px-2 text-right">Cab.</th>
                  <th className="py-2 px-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-[#1a382d]'}`}>
                {cats.map(cat => {
                  const cab = stockEsp.porCategoria[cat.id_categoria]?.cabezas || 0;
                  const isSnc = cat.id_categoria === 'CAT-SNC';

                  return (
                    <tr
                      key={cat.id_categoria}
                      className={`transition-colors ${
                        isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'
                      }`}
                    >
                      <td className={`py-2 px-2 font-mono font-bold text-[11px] ${
                        isLightMode ? 'text-emerald-900' : 'text-slate-300'
                      }`}>
                        {cat.codigo || cat.id_categoria}
                      </td>
                      <td className={`py-2 px-2.5 font-semibold ${isLightMode ? 'text-slate-900' : 'text-[#f2fcf6]'}`}>
                        <div className="leading-tight">
                          <span>{cat.nombre}</span>
                          <span className={`block text-[10px] font-normal ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                            {cat.es_reproductor ? 'Plantel Reproductor' : 'Hacienda General'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`font-black font-mono text-xs px-2 py-0.5 rounded-[2px] ${
                            cab > 0
                              ? isLightMode
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isLightMode
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-[#183027] text-[#759a88]'
                          }`}
                        >
                          {cab}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isSnc ? (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-[2px] font-bold ${
                            isLightMode ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            En Verif.
                          </span>
                        ) : (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-[2px] font-bold ${
                            isLightMode ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-950/80 text-emerald-300'
                          }`}>
                            Activo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie de la Columna */}
        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-bold ${
          isLightMode ? 'border-slate-200 text-slate-800' : 'border-[#264d3f] text-[#d1e7dc]'
        }`}>
          <span>Subtotal {titulo}:</span>
          <span className={`font-mono text-xs ${isLightMode ? 'text-emerald-900 font-black' : 'text-emerald-400 font-black'}`}>
            {subtotal} Cabezas
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo con Terminología Oficial Unificada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-[#264d3f]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-[#f2fcf6]'}`}>
              Majada & Hacienda
            </h2>
            <BotonAyudaContextual moduloId="majada" onOpenManual={onOpenManual} />
          </div>
          <p className={`text-xs mt-0.5 font-medium ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
            Control integral y reactivo de existencias físicas para las tres especies pecuarias: Ovino, Bovino y Porcino.
          </p>
        </div>

        {/* Badge de Hacienda Global */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-[2px] border ${
          isLightMode ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
        }`}>
          <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold">Total Hacienda:</span>
          <strong className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300">
            {totalHaciendaGlobal} Cabezas
          </strong>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-[#264d3f] space-x-2 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('existencias')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'existencias'
              ? 'bg-emerald-700 text-white shadow-xs'
              : isLightMode
              ? 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
              : 'text-[#a2c7b5] hover:text-white hover:bg-[#183027]'
          }`}
        >
          Existencias Actuales (3 Especies)
        </button>
        <button
          onClick={() => setActiveSubTab('nuevo_movimiento')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'nuevo_movimiento'
              ? 'bg-emerald-700 text-white shadow-xs'
              : isLightMode
              ? 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
              : 'text-[#a2c7b5] hover:text-white hover:bg-[#183027]'
          }`}
        >
          + Registrar Evento de Hacienda
        </button>
        <button
          onClick={() => setActiveSubTab('pesajes')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'pesajes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : isLightMode
              ? 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
              : 'text-[#a2c7b5] hover:text-white hover:bg-[#183027]'
          }`}
        >
          Pesajes & Ganancia Diaria
        </button>
        <button
          onClick={() => setActiveSubTab('historial')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'historial'
              ? 'bg-emerald-700 text-white shadow-xs'
              : isLightMode
              ? 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
              : 'text-[#a2c7b5] hover:text-white hover:bg-[#183027]'
          }`}
        >
          Libro de Movimientos Históricos
        </button>
      </div>

      {/* Indicador de última modificación con persona, día y horario */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['movimientos_hacienda', 'pesajes', 'inventario_inicial']}
        seccionNombre="Majada & Hacienda"
      />

      {/* ========================================================================= */}
      {/* SUBTAB 1: EXISTENCIAS ACTUALES - SEPARADO ESTRICTAMENTE EN 3 COLUMNAS       */}
      {/* ========================================================================= */}
      {activeSubTab === 'existencias' && (
        <div className="space-y-6">
          {/* Banner Resumen Consolidado */}
          <div className={`p-4 rounded-[2px] border ${
            isLightMode ? 'bg-[#f0fdf4] border-emerald-200 text-slate-900' : 'bg-[#152b22] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className={`text-sm font-bold ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Inventario Zootécnico Categorizado de Hacienda
                </h3>
                <p className={`text-xs mt-0.5 font-medium ${isLightMode ? 'text-emerald-800' : 'text-[#a2c7b5]'}`}>
                  Visualización segmentada en tres columnas por especie: <strong>Ovino, Bovino y Porcino</strong>.
                </p>
              </div>

              {/* Chips de conteo rápido por especie */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className={`px-2.5 py-1 rounded-[2px] border flex items-center space-x-1.5 ${
                  isLightMode ? 'bg-white border-emerald-300 text-emerald-950' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
                }`}>
                  <span>🐑 Ovinos:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{stockOvino.totalCabezas}</strong>
                </span>

                <span className={`px-2.5 py-1 rounded-[2px] border flex items-center space-x-1.5 ${
                  isLightMode ? 'bg-white border-emerald-300 text-emerald-950' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
                }`}>
                  <span>🐄 Bovinos:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{stockBovino.totalCabezas}</strong>
                </span>

                <span className={`px-2.5 py-1 rounded-[2px] border flex items-center space-x-1.5 ${
                  isLightMode ? 'bg-white border-emerald-300 text-emerald-950' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
                }`}>
                  <span>🐖 Porcinos:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{stockPorcino.totalCabezas}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ESTRUCTURA PRINCIPAL EN TRES COLUMNAS (OVINO, BOVINO, PORCINO) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* 1. COLUMNA OVINA */}
            {renderTablaEspecie('Ovino', '🐑', 'ESP001', stockOvino, 'emerald')}

            {/* 2. COLUMNA BOVINA */}
            {renderTablaEspecie('Bovino', '🐄', 'ESP002', stockBovino, 'blue')}

            {/* 3. COLUMNA PORCINA */}
            {renderTablaEspecie('Porcino', '🐖', 'ESP003', stockPorcino, 'purple')}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: REGISTRO DE EVENTO DE HACIENDA (REACTIVO Y MULTI-ESPECIE)         */}
      {/* ========================================================================= */}
      {activeSubTab === 'nuevo_movimiento' && (
        <div className={`border rounded-[2px] p-6 shadow-sm max-w-2xl mx-auto ${
          isLightMode
            ? 'bg-white border-emerald-200 text-slate-900'
            : 'bg-[#12241d] border-[#264d3f] text-white'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-[2px] bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Registrar Evento de Majada & Hacienda
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                Impacto directo y reactivo en el stock. Recalcula tablas, dashboards e indicadores automáticamente.
              </p>
            </div>
          </div>

          {currentUser.rol_nombre === 'AUDITORIA' && (
            <div className="mb-4 p-3 bg-blue-500/15 border border-blue-500/40 rounded-[2px] text-blue-700 dark:text-blue-300 text-xs flex items-center space-x-2">
              <span>👁️ <strong>Modo Consulta (Auditoría):</strong> Su rol tiene permisos exclusivamente de lectura. El formulario está bloqueado.</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-[2px] text-red-700 dark:text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-bold">Validación de Hacienda</p>
                <p>{formError}</p>
              </div>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-[2px] text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRegistrarMovimiento} className="space-y-4 text-xs">
            {/* 1. Selector de Especie */}
            <div>
              <label className={`block font-bold mb-1.5 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                Especie Pecuaria a Afectar:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ESP001', label: 'Ovino', icon: '🐑' },
                  { id: 'ESP002', label: 'Bovino', icon: '🐄' },
                  { id: 'ESP003', label: 'Porcino', icon: '🐖' },
                ].map(esp => (
                  <button
                    key={esp.id}
                    type="button"
                    onClick={() => handleCambioEspecieMov(esp.id)}
                    className={`py-2 px-3 rounded-[2px] border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      movEspecie === esp.id
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5] hover:text-white'
                    }`}
                  >
                    <span>{esp.icon}</span>
                    <span>{esp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tipo de Movimiento y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Tipo de Evento Zootécnico
                </label>
                <select
                  value={tipoMov}
                  onChange={e => {
                    const t = e.target.value as TipoMovimientoHacienda;
                    setTipoMov(t);
                    setFormError(null);
                  }}
                  className={`w-full p-2.5 rounded-[2px] font-bold border outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                  }`}
                >
                  <option value="NACIMIENTO">👶 Nacimiento / Procreo (Suma Stock)</option>
                  <option value="CAMBIO_CATEGORIA">🔄 Cambio de Categoría (Maduración)</option>
                  <option value="TRANSFERENCIA_SUBUNIDAD">🚚 Transferencia entre Subunidades</option>
                  <option value="MUERTE">💀 Mortandad (Baja de Stock)</option>
                  <option value="VENTA">💰 Venta Comercial (Baja de Stock)</option>
                  <option value="CONSUMO_PROPIO">🍖 Consumo Interno (Baja de Stock)</option>
                  <option value="COMPRA">🛒 Compra de Reproductores (Alta Stock)</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  max={getFechaArgentinaISO()}
                  value={fechaMov}
                  onChange={e => {
                    setFechaMov(e.target.value);
                    if (errorsMov.fecha) {
                      setErrorsMov(prev => { const n = { ...prev }; delete n.fecha; return n; });
                    }
                  }}
                  required
                  className={`w-full p-2.5 rounded-[2px] font-bold border outline-none ${
                    errorsMov.fecha
                      ? 'border-rose-500 bg-rose-50 text-rose-900'
                      : isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* 3. Categorías Origen / Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tipoMov !== 'NACIMIENTO' && (
                <div>
                  <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    {tipoMov === 'CAMBIO_CATEGORIA' ? 'Categoría Anterior (Disminuirá)' : 'Categoría Origen (Baja)'}
                  </label>
                  <select
                    value={categoriaOrigen}
                    onChange={e => setCategoriaOrigen(e.target.value)}
                    className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                    }`}
                  >
                    {categoriasMovEspecie.map(cat => {
                      const cab = stockGlobal.porCategoria[cat.id_categoria]?.cabezas || 0;
                      return (
                        <option key={cat.id_categoria} value={cat.id_categoria}>
                          {cat.nombre} (Stock actual: {cab} cab.)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {['TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA', 'NACIMIENTO', 'COMPRA'].includes(tipoMov) && (
                <div className={tipoMov === 'NACIMIENTO' || tipoMov === 'COMPRA' ? 'sm:col-span-2' : ''}>
                  <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    {tipoMov === 'NACIMIENTO'
                      ? 'Categoría a la que ingresa el Nacimiento (Aumentará Stock)'
                      : tipoMov === 'CAMBIO_CATEGORIA'
                      ? 'Nueva Categoría (Aumentará)'
                      : 'Categoría Destino (Alta)'}
                  </label>
                  <select
                    value={categoriaDestino}
                    onChange={e => {
                      setCategoriaDestino(e.target.value);
                      if (errorsMov.categoriaDestino) {
                        setErrorsMov(prev => { const n = { ...prev }; delete n.categoriaDestino; return n; });
                      }
                    }}
                    className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                      errorsMov.categoriaDestino
                        ? 'border-rose-500 bg-rose-50 text-rose-900'
                        : isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                    }`}
                  >
                    {categoriasMovEspecie.map(cat => {
                      const cab = stockGlobal.porCategoria[cat.id_categoria]?.cabezas || 0;
                      return (
                        <option key={cat.id_categoria} value={cat.id_categoria}>
                          {cat.nombre} (Stock actual: {cab} cab.)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* 4. Subunidades si es Transferencia */}
            {tipoMov === 'TRANSFERENCIA_SUBUNIDAD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Subunidad Origen
                  </label>
                  <select
                    value={subunidadOrigen}
                    onChange={e => setSubunidadOrigen(e.target.value)}
                    className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                    }`}
                  >
                    {subunidadesMovEspecie.map(s => (
                      <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Subunidad Destino
                  </label>
                  <select
                    value={subunidadDestino}
                    onChange={e => setSubunidadDestino(e.target.value)}
                    className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                    }`}
                  >
                    {subunidadesMovEspecie.map(s => (
                      <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 5. Cantidad de Cabezas y Peso Vivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Cantidad de Cabezas
                  </label>
                  {['MUERTE', 'VENTA', 'CONSUMO_PROPIO', 'TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(tipoMov) && (
                    <span className={`text-[11px] font-semibold ${isLightMode ? 'text-emerald-800' : 'text-emerald-400'}`}>
                      Disponible: {stockDisponibleEnOrigen} cab.
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cabezas}
                  onChange={e => {
                    const parsed = parseInt(e.target.value, 10);
                    setCabezas(isNaN(parsed) ? ('' as any) : parsed);
                  }}
                  required
                  className={`w-full p-2.5 rounded-[2px] font-bold border outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Peso Vivo Total Estimado (kg, opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={kgVivo || ''}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setKgVivo(isNaN(parsed) ? 0 : parsed);
                  }}
                  placeholder="0.0"
                  className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* 6. Motivo y Trazabilidad */}
            <div>
              <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                Motivo / Justificación de Auditoría
              </label>
              <input
                type="text"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: Parición estacional, mortandad por causa clínica, etc."
                className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={
                currentUser.rol_nombre === 'AUDITORIA' ||
                (['MUERTE', 'VENTA', 'CONSUMO_PROPIO', 'TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(tipoMov) && (stockDisponibleEnOrigen === 0 || Number(cabezas) > stockDisponibleEnOrigen)) ||
                (tipoMov === 'CAMBIO_CATEGORIA' && categoriaOrigen === categoriaDestino)
              }
              className={`w-full py-3 font-bold rounded-[2px] text-xs shadow-xs transition-colors mt-2 cursor-pointer ${
                currentUser.rol_nombre === 'AUDITORIA' ||
                (['MUERTE', 'VENTA', 'CONSUMO_PROPIO', 'TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(tipoMov) && (stockDisponibleEnOrigen === 0 || Number(cabezas) > stockDisponibleEnOrigen)) ||
                (tipoMov === 'CAMBIO_CATEGORIA' && categoriaOrigen === categoriaDestino)
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white'
              }`}
            >
              {currentUser.rol_nombre === 'AUDITORIA'
                ? 'Operación Bloqueada (Rol Solo Lectura)'
                : ['MUERTE', 'VENTA', 'CONSUMO_PROPIO', 'TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(tipoMov) && (stockDisponibleEnOrigen === 0 || Number(cabezas) > stockDisponibleEnOrigen)
                ? 'Bloqueado: Provocaría Stock Negativo'
                : tipoMov === 'CAMBIO_CATEGORIA' && categoriaOrigen === categoriaDestino
                ? 'Bloqueado: Seleccione Categorías Diferentes'
                : tipoMov === 'NACIMIENTO'
                ? `Confirmar Nacimiento (+${cabezas} cabezas)`
                : `Confirmar y Asentar Movimiento (${cabezas} cabezas)`}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: PESAJES & GANANCIA DIARIA                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'pesajes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`border rounded-[2px] p-5 shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-white'
          }`}>
            <h3 className={`text-sm font-bold mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Registrar Pesaje de Lote
            </h3>
            <p className={`text-xs mb-3 ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
              Distingue Kg Vivo vs Kg de Res y calcula la Ganancia Media Diaria (GMD).
            </p>

            <form onSubmit={handleRegistrarPesaje} className="space-y-3.5 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Fecha de Pesaje
                </label>
                <input
                  type="date"
                  max={getFechaArgentinaISO()}
                  value={pesajeFecha}
                  onChange={e => setPesajeFecha(e.target.value)}
                  required
                  className={`w-full p-2.5 rounded-[2px] font-bold border outline-none ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Subunidad
                </label>
                <select
                  value={pesajeSubunidad}
                  onChange={e => setPesajeSubunidad(e.target.value)}
                  className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                  }`}
                >
                  {state.subunidades.map(s => (
                    <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Categoría
                </label>
                <select
                  value={pesajeCategoria}
                  onChange={e => setPesajeCategoria(e.target.value)}
                  className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                  }`}
                >
                  {state.categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Cabezas Pesadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pesajeCabezas}
                    onChange={e => setPesajeCabezas(parseInt(e.target.value, 10) || 1)}
                    required
                    className={`w-full p-2.5 rounded-[2px] font-bold border outline-none ${
                      isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Kg Totales
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={pesajeKgTotal}
                    onChange={e => setPesajeKgTotal(parseFloat(e.target.value) || 0)}
                    required
                    className={`w-full p-2.5 rounded-[2px] font-bold border outline-none ${
                      isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Tipo de Medición
                </label>
                <select
                  value={pesajeTipoPeso}
                  onChange={e => setPesajeTipoPeso(e.target.value as any)}
                  className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                  }`}
                >
                  <option value="KG_VIVO">Kg Vivo (En pie con desbaste)</option>
                  <option value="KG_RES">Kg de Res (En gancho / faena)</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  Observaciones
                </label>
                <input
                  type="text"
                  value={pesajeObs}
                  onChange={e => setPesajeObs(e.target.value)}
                  placeholder="Ej: Pesaje post-destete"
                  className={`w-full p-2.5 rounded-[2px] font-medium border outline-none ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[2px] text-xs transition-colors cursor-pointer"
              >
                Guardar Pesaje
              </button>
            </form>
          </div>

          <div className={`lg:col-span-2 border rounded-[2px] p-5 shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-white'
          }`}>
            <h3 className={`text-sm font-bold mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Historial de Pesajes Realizados
            </h3>
            <p className={`text-xs mb-4 ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
              Evolución de peso individual y ganancia de peso zootécnica.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isLightMode ? 'bg-[#f0fdf4] text-emerald-900 border-emerald-200' : 'bg-[#183027] text-[#a2c7b5] border-[#264d3f]'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Subunidad</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3 text-right">Cab.</th>
                    <th className="py-2.5 px-3 text-right">Kg Tot.</th>
                    <th className="py-2.5 px-3 text-right">Kg Prom.</th>
                    <th className="py-2.5 px-3 text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-[#1a382d]'}`}>
                  {state.pesajes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`py-6 text-center ${isLightMode ? 'text-slate-500' : 'text-[#a2c7b5]'}`}>
                        No hay pesajes registrados en esta campaña.
                      </td>
                    </tr>
                  ) : (
                    state.pesajes.map(pes => (
                      <tr key={pes.id_pesaje} className={`transition-colors ${
                        isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'
                      }`}>
                        <td className="py-2.5 px-3 font-mono">{pes.fecha}</td>
                        <td className="py-2.5 px-3">
                          {state.subunidades.find(s => s.id_subunidad === pes.id_subunidad)?.nombre}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {state.categorias.find(c => c.id_categoria === pes.id_categoria)?.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">{pes.cabezas_pesadas}</td>
                        <td className="py-2.5 px-3 text-right">{pes.kg_vivo_total.toFixed(1)}</td>
                        <td className={`py-2.5 px-3 text-right font-black ${
                          isLightMode ? 'text-emerald-900' : 'text-emerald-400'
                        }`}>
                          {pes.kg_vivo_promedio.toFixed(2)} kg
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-[2px] font-mono ${
                            isLightMode ? 'bg-slate-100 text-slate-700' : 'bg-[#183027] text-slate-300'
                          }`}>
                            {pes.tipo_peso}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: HISTORIAL DE MOVIMIENTOS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'historial' && (
        <div className={`border rounded-[2px] p-5 shadow-xs ${
          isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Libro Diario de Movimientos de Majada & Hacienda
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                Trazabilidad inmutable de altas, pariciones, bajas y cambios de categoría.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                isLightMode ? 'bg-[#f0fdf4] text-emerald-900 border-emerald-200' : 'bg-[#183027] text-[#a2c7b5] border-[#264d3f]'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Tipo de Evento</th>
                  <th className="py-2.5 px-3 text-right">Cabezas</th>
                  <th className="py-2.5 px-3">Origen</th>
                  <th className="py-2.5 px-3">Destino</th>
                  <th className="py-2.5 px-3">Motivo / Trazabilidad</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-[#1a382d]'}`}>
                {state.movimientos.map(mov => {
                  const catOrig = state.categorias.find(c => c.id_categoria === mov.id_categoria_origen);
                  const catDest = state.categorias.find(c => c.id_categoria === mov.id_categoria_destino);

                  return (
                    <tr
                      key={mov.id_movimiento}
                      className={`transition-colors ${
                        isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'
                      } ${mov.anulado ? 'opacity-40 line-through' : ''}`}
                    >
                      <td className={`py-2.5 px-3 font-mono text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {mov.id_movimiento}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{mov.fecha}</td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-[2px] border ${
                          mov.tipo === 'NACIMIENTO'
                            ? isLightMode ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : mov.tipo === 'MUERTE'
                            ? isLightMode ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                            : isLightMode ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#183027] text-slate-200 border-[#264d3f]'
                        }`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black text-sm ${
                        isLightMode ? 'text-slate-900' : 'text-white'
                      }`}>
                        {mov.cabezas}
                      </td>
                      <td className={`py-2.5 px-3 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {catOrig?.nombre || '-'}
                      </td>
                      <td className={`py-2.5 px-3 font-semibold ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                        {catDest?.nombre || '-'}
                      </td>
                      <td className={`py-2.5 px-3 max-w-xs truncate ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`} title={mov.motivo}>
                        {mov.motivo || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {mov.anulado ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded-[2px] font-bold">
                            Anulado
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-[2px] font-bold">
                            Vigente
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!mov.anulado && (
                          <button
                            type="button"
                            onClick={() => handleAnularMovimiento(mov.id_movimiento)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Anular lógicamente movimiento"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

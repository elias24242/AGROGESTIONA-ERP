import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseState, saveDatabaseState } from '../services/sheetsService';
import { Usuario, Produccion, Consumo, DosisTecnica, Insumo } from '../types/erp';
import {
  Wheat,
  Plus,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Info,
  Package,
  PackagePlus,
  Search,
  Filter,
  BookOpen,
  DollarSign,
  HelpCircle,
  FileDown
} from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { NuevoInsumoModal } from '../components/NuevoInsumoModal';
import {
  formatearMoneda,
  convertirArsAUsd,
  MonedaTipo,
  getTipoCambioOficial
} from '../services/currencyService';
import { getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';
import { generateProduccionPdfReport } from '../services/pdfReportService';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';

interface ProduccionConsumosModuleProps {
  state: DatabaseState;
  currentUser: Usuario;
  selectedSubunidad: string;
  selectedCampania: string;
  isTestMode: boolean;
  onStateUpdate: () => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
  monedaVisualizacion?: MonedaTipo;
  tipoCambioOficial?: number;
}

export const ProduccionConsumosModule: React.FC<ProduccionConsumosModuleProps> = ({
  state,
  currentUser,
  selectedSubunidad,
  selectedCampania,
  isTestMode,
  onStateUpdate,
  onOpenManual,
  monedaVisualizacion = 'ARS',
  tipoCambioOficial = getTipoCambioOficial(),
}) => {
  const [activeTab, setActiveTab] = useState<
    'comparativa' | 'insumos_catalogo' | 'cargar_consumo' | 'cargar_produccion' | 'dosis_tecnicas'
  >('insumos_catalogo');

  // Modal para incorporar nuevo insumo
  const [isNuevoInsumoOpen, setIsNuevoInsumoOpen] = useState(false);
  const [filtroTipoInsumo, setFiltroTipoInsumo] = useState<string>('TODOS');
  const [searchInsumo, setSearchInsumo] = useState<string>('');

  const isConsolidado = selectedSubunidad === 'TODOS' || selectedSubunidad === 'todas' || !selectedSubunidad;

  // Formulario Producción
  const [prodSubunidad, setProdSubunidad] = useState(isConsolidado ? 'SUB-CRIA' : selectedSubunidad);
  const [prodProducto, setProdProducto] = useState('PROD-LANA');
  const [prodCantidad, setProdCantidad] = useState<number>(180);
  const [prodFecha, setProdFecha] = useState(getFechaArgentinaISO());
  const [prodObs, setProdObs] = useState('');

  // Formulario Consumo
  const [csmSubunidad, setCsmSubunidad] = useState(isConsolidado ? 'SUB-ENG' : selectedSubunidad);
  const [csmInsumo, setCsmInsumo] = useState('INS-BAL-ENG');
  const [csmCantidadReal, setCsmCantidadReal] = useState<number>(450);
  const [csmFecha, setCsmFecha] = useState(getFechaArgentinaISO());
  const [csmBaseReal, setCsmBaseReal] = useState<number>(25); // ej. 25 cabezas
  const [csmOrigen, setCsmOrigen] = useState<'ALIMENTACION' | 'SANIDAD' | 'OTRO'>('ALIMENTACION');

  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Sincronizar formularios si cambia la subunidad en el Header
  useEffect(() => {
    if (!isConsolidado) {
      setProdSubunidad(selectedSubunidad);
      setCsmSubunidad(selectedSubunidad);
    }
  }, [selectedSubunidad, isConsolidado]);

  // Consumos filtrados por subunidad y campaña
  const consumosFiltrados = useMemo(() => {
    return (state.consumos || []).filter((csm) => {
      const matchSub = isConsolidado || csm.id_subunidad === selectedSubunidad;
      const matchCamp = !selectedCampania || !csm.id_campania || csm.id_campania === selectedCampania;
      return matchSub && matchCamp;
    });
  }, [state.consumos, isConsolidado, selectedSubunidad, selectedCampania]);

  const handleGuardarProduccion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (currentUser.rol_nombre === 'AUDITORIA') {
      setFormMsg({ type: 'error', text: 'Permiso denegado: El rol de auditoría es solo lectura' });
      return;
    }

    if (prodCantidad <= 0) {
      setFormMsg({ type: 'error', text: 'La cantidad producida debe ser mayor a cero' });
      return;
    }

    const prod = state.productos.find(p => p.id_producto === prodProducto);
    const nuevaProd: Produccion = {
      id_produccion: `PRD-${Date.now()}`,
      id_campania: selectedCampania,
      id_subunidad: prodSubunidad,
      fecha: prodFecha,
      id_producto: prodProducto,
      cantidad: Number(prodCantidad),
      id_um: prod?.id_um || 'UM-KG',
      lote_origen: 'LOT001',
      observaciones: prodObs.trim() || undefined,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
    };

    state.produccion.push(nuevaProd);

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'produccion',
      id_registro: nuevaProd.id_produccion,
      valor_nuevo: JSON.stringify(nuevaProd),
      motivo: `Carga de producción física: ${nuevaProd.cantidad} ${prod?.um_codigo || 'kg'} de ${prod?.nombre}`,
    });

    saveDatabaseState(state);
    setFormMsg({ type: 'success', text: 'Producción registrada y computada en rendimientos.' });
    setProdObs('');
    onStateUpdate();
  };

  const handleGuardarConsumo = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (currentUser.rol_nombre === 'AUDITORIA') {
      setFormMsg({ type: 'error', text: 'Permiso denegado: El rol de auditoría es solo lectura' });
      return;
    }

    if (csmCantidadReal <= 0) {
      setFormMsg({ type: 'error', text: 'La cantidad consumida debe ser mayor a cero' });
      return;
    }

    const insumo = state.insumos.find(i => i.id_insumo === csmInsumo);
    if (!insumo) {
      setFormMsg({ type: 'error', text: 'Insumo no encontrado en el catálogo' });
      return;
    }

    // Regla fundamental de stock: el stock no puede ser negativo
    if (insumo.stock_actual < csmCantidadReal) {
      setFormMsg({
        type: 'error',
        text: `Stock insuficiente: El depósito cuenta con ${insumo.stock_actual} ${insumo.um_codigo} de "${insumo.nombre}", pero se solicitaron ${csmCantidadReal}. El stock nunca puede ser negativo.`,
      });
      return;
    }

    // Buscar dosis técnica de referencia
    const dosisRef = state.dosis.find(
      d => d.id_insumo === csmInsumo && d.id_subunidad === csmSubunidad
    );

    const cantidadEsperada = dosisRef ? dosisRef.dosis_valor * csmBaseReal : csmCantidadReal;
    const desvio = csmCantidadReal - cantidadEsperada;

    const tienePrecio = insumo.precio_promedio_ponderado > 0;
    const costoUnit = tienePrecio ? insumo.precio_promedio_ponderado : null;
    const costoTotal = tienePrecio && costoUnit ? csmCantidadReal * costoUnit : null;

    // Descontar stock de insumo garantizando que no sea negativo
    insumo.stock_actual = Math.max(0, Number((insumo.stock_actual - csmCantidadReal).toFixed(2)));

    const nuevoCsm: Consumo = {
      id_consumo: `CSM-${Date.now()}`,
      id_campania: selectedCampania,
      id_subunidad: csmSubunidad,
      id_insumo: csmInsumo,
      fecha: csmFecha,
      cantidad_real: Number(csmCantidadReal),
      cantidad_esperada: Number(cantidadEsperada.toFixed(2)),
      desvio_cantidad: Number(desvio.toFixed(2)),
      costo_unitario_real: costoUnit,
      costo_total_real: costoTotal,
      origen_evento: csmOrigen,
      estado_precio: tienePrecio ? 'CON_PRECIO' : 'PENDIENTE_FALTA_PRECIO',
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
    };

    state.consumos.push(nuevoCsm);

    // Si tiene costo, registrar inmediatamente en costos directos
    if (costoTotal !== null && costoTotal > 0) {
      state.costos.push({
        id_costo: `CST-DIR-${Date.now()}`,
        id_campania: selectedCampania,
        id_cuenta: 'CTA-5-1-01', // Costos Directos Insumos
        fecha: csmFecha,
        concepto: `Consumo ${insumo.nombre} (${csmCantidadReal} ${insumo.um_codigo})`,
        clasificacion: 'DIRECTO',
        importe_total: costoTotal,
        id_consumo_asociado: nuevoCsm.id_consumo,
        es_prueba: isTestMode,
        usuario_id: currentUser.id_usuario,
      });

      state.distribuciones_costos.push({
        id_distribucion: `DST-${Date.now()}`,
        id_costo: `CST-DIR-${Date.now()}`,
        id_subunidad: csmSubunidad,
        porcentaje: 100,
        importe_asignado: costoTotal,
      });
    }

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'consumos',
      id_registro: nuevoCsm.id_consumo,
      valor_nuevo: JSON.stringify(nuevoCsm),
      motivo: `Consumo registrado: ${csmCantidadReal} ${insumo.um_codigo} de ${insumo.nombre}. Stock restante: ${insumo.stock_actual}`,
    });

    saveDatabaseState(state);
    setFormMsg({
      type: 'success',
      text: `Consumo guardado. Se descontaron ${csmCantidadReal} ${insumo.um_codigo} del depósito (Stock remanente: ${insumo.stock_actual} ${insumo.um_codigo}).`,
    });
    onStateUpdate();
  };

  // Filtrado de Insumos para la pestaña de Catálogo
  const insumosFiltrados = state.insumos.filter(ins => {
    const matchTipo = filtroTipoInsumo === 'TODOS' || ins.tipo === filtroTipoInsumo;
    const matchSearch =
      searchInsumo.trim() === '' ||
      ins.nombre.toLowerCase().includes(searchInsumo.toLowerCase()) ||
      ins.codigo.toLowerCase().includes(searchInsumo.toLowerCase());
    return matchTipo && matchSearch;
  });

  const [generandoPdf, setGenerandoPdf] = useState(false);

  const handleDescargarReportePdf = () => {
    try {
      setGenerandoPdf(true);
      generateProduccionPdfReport(
        state,
        currentUser,
        selectedSubunidad,
        selectedCampania,
        isTestMode,
        monedaVisualizacion,
        tipoCambioOficial
      );
      setFormMsg({
        type: 'success',
        text: 'Reporte PDF de Producción y Consumos generado y descargado correctamente.'
      });
    } catch (err: any) {
      setFormMsg({
        type: 'error',
        text: `Error al generar el reporte PDF: ${err?.message || 'Error inesperado'}`
      });
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#f2fcf6]">Producción & Consumos de Insumos</h2>
          <BotonAyudaContextual moduloId="produccion" onOpenManual={onOpenManual} />
        </div>
      </div>

      {/* Tab Navigation & Botón Generar Reporte PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#264d3f] pb-2">
        <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('insumos_catalogo')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'insumos_catalogo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-[#a2c7b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Depósito & Insumos</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/60 rounded-full font-mono text-emerald-200 border border-emerald-400/30">
              {state.insumos.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('comparativa')}
            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'comparativa'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            Comparativa Consumo Real vs Esperado
          </button>
          <button
            onClick={() => setActiveTab('cargar_consumo')}
            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cargar_consumo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            Registrar Consumo Real
          </button>
          <button
            onClick={() => setActiveTab('cargar_produccion')}
            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cargar_produccion'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            Registrar Producción Física
          </button>
          <button
            onClick={() => setActiveTab('dosis_tecnicas')}
            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dosis_tecnicas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            Dosis Técnicas (Parámetros)
          </button>
        </div>

        {/* Botón para generar reporte PDF con filtros actuales */}
        <button
          onClick={handleDescargarReportePdf}
          disabled={generandoPdf}
          className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-[2px] text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
          title={`Descargar reporte en formato PDF con la información filtrada por Subunidad (${selectedSubunidad}) y Campaña (${selectedCampania})`}
        >
          <FileDown className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${generandoPdf ? 'animate-bounce' : ''}`} />
          <span>{generandoPdf ? 'Generando PDF...' : 'Reporte PDF (Subunidad / Campaña)'}</span>
        </button>
      </div>

      {/* Indicador de última modificación con persona, día y horario */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['insumos', 'produccion', 'consumos', 'dosis_tecnicas', 'costos']}
        seccionNombre="Producción, Insumos & Consumos"
      />

      {/* Barra de Filtro Activo del Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold uppercase text-slate-400">Alcance de Datos:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
            {isConsolidado
              ? 'Consolidado (Todas las Subunidades)'
              : state.subunidades.find((s) => s.id_subunidad === selectedSubunidad)?.nombre || selectedSubunidad}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono">
            Campaña {state.campanias.find((c) => c.id_campania === selectedCampania)?.codigo || selectedCampania}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {!isConsolidado
            ? 'Filtrando consumos y asignación de insumos por la subunidad seleccionada'
            : 'Mostrando consumos e insumos de todas las etapas zootécnicas'}
        </span>
      </div>

      {formMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
            formMsg.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {formMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{formMsg.text}</span>
        </div>
      )}

      {/* TAB NUEVA: DEPÓSITO & CATÁLOGO DE INSUMOS */}
      {activeTab === 'insumos_catalogo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Inventario de Insumos en Depósito</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Stock ≥ 0 (No negativo)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Valuación a Precio Promedio Ponderado (PPP). Incorpora nuevos insumos veterinarios, forrajes o suplementos.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenManual && (
                <button
                  onClick={() => onOpenManual('Precio Promedio Ponderado')}
                  className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
                  title="¿Qué es el Precio Promedio Ponderado (PPP)?"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>¿Qué es PPP?</span>
                </button>
              )}

              <button
                onClick={() => setIsNuevoInsumoOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Incorporar Nuevo Insumo</span>
              </button>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInsumo}
                onChange={e => setSearchInsumo(e.target.value)}
                placeholder="Buscar insumo por nombre o código..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'TODOS', label: 'Todos los Tipos' },
                { id: 'ALIMENTO', label: 'Alimentos' },
                { id: 'FORRAJE', label: 'Forrajes' },
                { id: 'SANITARIO', label: 'Sanitarios' },
                { id: 'AGROQUIMICO', label: 'Agroquímicos' },
              ].map(filtro => (
                <button
                  key={filtro.id}
                  onClick={() => setFiltroTipoInsumo(filtro.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filtroTipoInsumo === filtro.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Insumos */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Código</th>
                  <th className="py-2.5 px-3">Nombre del Insumo</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Stock Actual</th>
                  <th className="py-2.5 px-3">Unidad</th>
                  <th className="py-2.5 px-3 text-right">PPP ($ ARS)</th>
                  <th className="py-2.5 px-3 text-right">PPP (US$ USD)</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Valuación Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {insumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No se encontraron insumos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  insumosFiltrados.map(ins => {
                    const pppUsd = convertirArsAUsd(ins.precio_promedio_ponderado, tipoCambioOficial);
                    const totalValuacionArs = ins.stock_actual * ins.precio_promedio_ponderado;
                    const totalValuacionUsd = convertirArsAUsd(totalValuacionArs, tipoCambioOficial);

                    return (
                      <tr key={ins.id_insumo} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-white">{ins.codigo}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-white">{ins.nombre}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ins.tipo === 'SANITARIO'
                                ? 'bg-purple-500/20 text-purple-300'
                                : ins.tipo === 'ALIMENTO'
                                ? 'bg-amber-500/20 text-amber-300'
                                : ins.tipo === 'FORRAJE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {ins.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-sm text-white">
                          {ins.stock_actual.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-400">{ins.um_codigo}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                          ${ins.precio_promedio_ponderado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-300">
                          US$ {pppUsd.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-400">
                          {monedaVisualizacion === 'USD'
                            ? `US$ ${totalValuacionUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : `$ ${Math.round(totalValuacionArs).toLocaleString('es-AR')}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: COMPARATIVA */}
      {activeTab === 'comparativa' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Análisis de Desvíos de Consumo</h3>
              <p className="text-xs text-slate-400">
                Fórmula: Consumo Esperado = Dosis Técnica × Base Real | Desvío = Real − Esperado
              </p>
            </div>
            {onOpenManual && (
              <button
                onClick={() => onOpenManual('Dosis Técnica y Desvío de Consumo')}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>¿Cómo se calcula el desvío?</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Fecha</th>
                  <th className="py-2.5 px-3">Subunidad</th>
                  <th className="py-2.5 px-3">Insumo Utilizado</th>
                  <th className="py-2.5 px-3 text-right">Consumo Real</th>
                  <th className="py-2.5 px-3 text-right">Consumo Esperado</th>
                  <th className="py-2.5 px-3 text-right">Desvío</th>
                  <th className="py-2.5 px-3">Estado de Precio</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">
                    Costo Total ({monedaVisualizacion === 'USD' ? 'US$ USD' : '$ ARS'})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {consumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      No hay consumos registrados para los filtros seleccionados ({isConsolidado ? 'Consolidado' : selectedSubunidad} · Campaña {selectedCampania}).
                    </td>
                  </tr>
                ) : (
                  consumosFiltrados.map(csm => {
                    const ins = state.insumos.find(i => i.id_insumo === csm.id_insumo);
                    const sub = state.subunidades.find(s => s.id_subunidad === csm.id_subunidad);
                    const isSobreconsumo = csm.desvio_cantidad > 0;

                    const costoFinal =
                      csm.costo_total_real !== null
                        ? monedaVisualizacion === 'USD'
                          ? `US$ ${convertirArsAUsd(csm.costo_total_real, tipoCambioOficial).toFixed(2)}`
                          : `$ ${Math.round(csm.costo_total_real).toLocaleString('es-AR')}`
                        : 'Pendiente Precio';

                    return (
                      <tr key={csm.id_consumo} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono">{csm.fecha}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-300">{sub?.nombre}</td>
                        <td className="py-2.5 px-3 text-white">{ins?.nombre}</td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {csm.cantidad_real} {ins?.um_codigo}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {csm.cantidad_esperada} {ins?.um_codigo}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              isSobreconsumo
                                ? 'bg-red-500/20 text-red-300'
                                : csm.desvio_cantidad < 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {csm.desvio_cantidad > 0 ? `+${csm.desvio_cantidad}` : csm.desvio_cantidad} {ins?.um_codigo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              csm.estado_precio === 'CON_PRECIO'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400 animate-pulse'
                            }`}
                          >
                            {csm.estado_precio === 'CON_PRECIO' ? 'Valuado' : 'Falta Precio'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                          {costoFinal}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CARGAR CONSUMO */}
      {activeTab === 'cargar_consumo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Registrar Consumo Real de Insumos</h3>
              <p className="text-xs text-slate-400">
                Descuenta unidades del inventario de insumos (Stock ≥ 0) y computa el costo directo real.
              </p>
            </div>
            <button
              onClick={() => setIsNuevoInsumoOpen(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Insumo</span>
            </button>
          </div>

          <form onSubmit={handleGuardarConsumo} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subunidad Destino</label>
              <select
                value={csmSubunidad}
                onChange={e => setCsmSubunidad(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              >
                {state.subunidades.map(s => (
                  <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Insumo Utilizado</label>
              <select
                value={csmInsumo}
                onChange={e => setCsmInsumo(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              >
                {state.insumos.map(i => (
                  <option key={i.id_insumo} value={i.id_insumo}>
                    {i.nombre} — Stock en depósito: {i.stock_actual} {i.um_codigo} (PPP: ${i.precio_promedio_ponderado})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cantidad Consumida Real</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={csmCantidadReal}
                  onChange={e => setCsmCantidadReal(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha de Aplicación</label>
                <input
                  type="date"
                  value={csmFecha}
                  onChange={e => setCsmFecha(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Base Real de Animales / Ha</label>
                <input
                  type="number"
                  min="1"
                  value={csmBaseReal}
                  onChange={e => setCsmBaseReal(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  placeholder="Ej: 25 cabezas tratadas"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origen del Evento</label>
                <select
                  value={csmOrigen}
                  onChange={e => setCsmOrigen(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  <option value="ALIMENTACION">Alimentación / Suplementación</option>
                  <option value="SANIDAD">Sanidad Animal</option>
                  <option value="OTRO">Otro Manejo</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
            >
              Registrar Consumo y Descontar de Depósito
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CARGAR PRODUCCIÓN FÍSICA */}
      {activeTab === 'cargar_produccion' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-xl">
          <h3 className="text-sm font-bold text-white mb-1">Registrar Producción Física de la Explotación</h3>
          <p className="text-xs text-slate-400 mb-4">
            Ingreso de lana obtenida o peso generado para análisis de productividad física.
          </p>

          <form onSubmit={handleGuardarProduccion} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subunidad Generadora</label>
              <select
                value={prodSubunidad}
                onChange={e => setProdSubunidad(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              >
                {state.subunidades.map(s => (
                  <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Producto Obtenido</label>
                <select
                  value={prodProducto}
                  onChange={e => setProdProducto(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.productos.map(p => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} ({p.um_codigo || 'kg'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha</label>
                <input
                  type="date"
                  value={prodFecha}
                  onChange={e => setProdFecha(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cantidad Física Producida</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={prodCantidad}
                onChange={e => setProdCantidad(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Observaciones</label>
              <input
                type="text"
                value={prodObs}
                onChange={e => setProdObs(e.target.value)}
                placeholder="Ej: Esquila pre-parto lote LOT001"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
            >
              Guardar Registro de Producción
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: DOSIS TÉCNICAS */}
      {activeTab === 'dosis_tecnicas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Catálogo de Dosis Técnicas Vigentes</h3>
              <p className="text-xs text-slate-400">
                Regla obligatoria: Modificar la dosis es prospectivo; nunca altera retrospectivamente consumos reales.
              </p>
            </div>
            {onOpenManual && (
              <button
                onClick={() => onOpenManual('Dosis Técnica')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Concepto de Dosis Técnica</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Protocolo / Insumo</th>
                  <th className="py-2.5 px-3">Subunidad</th>
                  <th className="py-2.5 px-3 text-right">Dosis Valor</th>
                  <th className="py-2.5 px-3">Base de Aplicación</th>
                  <th className="py-2.5 px-3">Fuente Técnica</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Vigencia Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.dosis.map(dos => {
                  const ins = state.insumos.find(i => i.id_insumo === dos.id_insumo);
                  const sub = state.subunidades.find(s => s.id_subunidad === dos.id_subunidad);

                  return (
                    <tr key={dos.id_dosis} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <p className="font-bold text-white">{dos.nombre_protocolo}</p>
                        <p className="text-[11px] text-slate-400">{ins?.nombre}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">{sub?.nombre}</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                        {dos.dosis_valor} {ins?.um_codigo}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {dos.base_aplicacion}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{dos.fuente}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{dos.vigencia_desde}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Incorporar Nuevo Insumo */}
      <NuevoInsumoModal
        isOpen={isNuevoInsumoOpen}
        onClose={() => setIsNuevoInsumoOpen(false)}
        state={state}
        currentUser={currentUser}
        onStateUpdate={nuevoId => {
          if (nuevoId) setCsmInsumo(nuevoId);
          onStateUpdate();
        }}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseState, saveDatabaseState } from '../services/sheetsService';
import { validateAndSaveDistribucionCosto, executeMovimientoHacienda } from '../services/businessEngine';
import { Usuario, Compra, Venta, Cobro, Pago, Costo } from '../types/erp';
import {
  DOLAR_HOY_URL,
  getTipoCambioOficial,
  convertirArsAUsd,
  convertirUsdAArs,
  formatearMoneda,
  MonedaTipo,
  getCotizacionOficial,
  CotizacionDolar
} from '../services/currencyService';
import { getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';
import { NuevoInsumoModal } from '../components/NuevoInsumoModal';
import {
  CircleDollarSign,
  ShoppingCart,
  Receipt,
  CreditCard,
  PieChart,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Coins,
  PackagePlus,
  DollarSign,
  FileDown
} from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import { generateEconomiaPdfReport } from '../services/pdfReportService';

interface OperacionesEconomicasModuleProps {
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

export const OperacionesEconomicasModule: React.FC<OperacionesEconomicasModuleProps> = ({
  state,
  currentUser,
  selectedSubunidad,
  selectedCampania,
  isTestMode,
  onStateUpdate,
  onOpenManual,
  monedaVisualizacion: propMonedaVisualizacion = 'ARS',
  tipoCambioOficial = getTipoCambioOficial(),
}) => {
  const [activeTab, setActiveTab] = useState<'ventas' | 'compras' | 'tesoreria' | 'distribucion_costos'>('ventas');
  
  // Preferencia local de visualización de moneda (puede heredar la global)
  const [monedaVista, setMonedaVista] = useState<MonedaTipo>(propMonedaVisualizacion);

  const isConsolidado = selectedSubunidad === 'TODOS' || selectedSubunidad === 'todas' || !selectedSubunidad;

  // Modal para incorporar nuevo insumo desde Compras
  const [isNuevoInsumoModalOpen, setIsNuevoInsumoModalOpen] = useState(false);

  // ----------------------------------------------------
  // Formulario de Venta (Con Moneda Dual y Tipo de Cambio)
  // ----------------------------------------------------
  const [vtaSubunidad, setVtaSubunidad] = useState(isConsolidado ? 'SUB-ENG' : selectedSubunidad);

  // Sincronizar subunidad de venta si el usuario cambia el selector global
  useEffect(() => {
    if (!isConsolidado) {
      setVtaSubunidad(selectedSubunidad);
    }
  }, [selectedSubunidad, isConsolidado]);

  // Ventas filtradas por subunidad y campaña
  const ventasFiltradas = useMemo(() => {
    return (state.ventas || []).filter((v) => {
      const matchSub = isConsolidado || v.id_subunidad === selectedSubunidad;
      const matchCamp = !selectedCampania || !v.id_campania || v.id_campania === selectedCampania;
      return matchSub && matchCamp;
    });
  }, [state.ventas, isConsolidado, selectedSubunidad, selectedCampania]);

  // Compras filtradas por campaña
  const comprasFiltradas = useMemo(() => {
    return (state.compras || []).filter((c) => {
      const matchCamp = !selectedCampania || !c.id_campania || c.id_campania === selectedCampania;
      return matchCamp;
    });
  }, [state.compras, selectedCampania]);

  // Costos filtrados por subunidad y campaña
  const costosFiltrados = useMemo(() => {
    return (state.costos || []).filter((c) => {
      const matchCamp = !selectedCampania || !c.id_campania || c.id_campania === selectedCampania;
      if (isConsolidado) return matchCamp;
      const tieneSub = (state.distribuciones_costos || []).some(
        (d) => d.id_costo === c.id_costo && d.id_subunidad === selectedSubunidad
      );
      return matchCamp && tieneSub;
    });
  }, [state.costos, state.distribuciones_costos, isConsolidado, selectedSubunidad, selectedCampania]);
  const [vtaTercero, setVtaTercero] = useState('TER-FRIG-01');
  const [vtaComprobante, setVtaComprobante] = useState('FC-A-0001-000012');
  const [vtaFecha, setVtaFecha] = useState(getFechaArgentinaISO());
  const [vtaProducto, setVtaProducto] = useState('PROD-COR-PES');
  const [vtaCategoria, setVtaCategoria] = useState('CAT-COR-ENG');
  const [vtaCabezas, setVtaCabezas] = useState<number>(10);
  const [vtaKgTotal, setVtaKgTotal] = useState<number>(310);
  
  // Moneda y TC para la Venta
  const [vtaMoneda, setVtaMoneda] = useState<MonedaTipo>('ARS');
  const [vtaTipoCambio, setVtaTipoCambio] = useState<number>(tipoCambioOficial);
  const [vtaPrecioUnitario, setVtaPrecioUnitario] = useState<number>(1800); // $/kg o US$/kg

  // Cálculos de venta en vivo
  const vtaTotalMoneda = vtaKgTotal * vtaPrecioUnitario;
  const vtaTotalArs = vtaMoneda === 'USD' ? convertirUsdAArs(vtaTotalMoneda, vtaTipoCambio) : vtaTotalMoneda;
  const vtaTotalUsd = vtaMoneda === 'USD' ? vtaTotalMoneda : convertirArsAUsd(vtaTotalMoneda, vtaTipoCambio);

  // ----------------------------------------------------
  // Formulario de Compra (Con Moneda Dual y Tipo de Cambio)
  // ----------------------------------------------------
  const [cmpTercero, setCmpTercero] = useState('TER-VET-01');
  const [cmpComprobante, setCmpComprobante] = useState('FC-B-0003-000088');
  const [cmpFecha, setCmpFecha] = useState(getFechaArgentinaISO());
  const [cmpInsumo, setCmpInsumo] = useState('INS-BAL-ENG');
  const [cmpCantidad, setCmpCantidad] = useState<number>(1000); // 1000 kg
  
  // Moneda y TC para la Compra
  const [cmpMoneda, setCmpMoneda] = useState<MonedaTipo>('ARS');
  const [cmpTipoCambio, setCmpTipoCambio] = useState<number>(tipoCambioOficial);
  const [cmpPrecioUnitario, setCmpPrecioUnitario] = useState<number>(380); // $ o US$

  // Cálculos de compra en vivo
  const cmpTotalMoneda = cmpCantidad * cmpPrecioUnitario;
  const cmpTotalArs = cmpMoneda === 'USD' ? convertirUsdAArs(cmpTotalMoneda, cmpTipoCambio) : cmpTotalMoneda;
  const cmpTotalUsd = cmpMoneda === 'USD' ? cmpTotalMoneda : convertirArsAUsd(cmpTotalMoneda, cmpTipoCambio);

  // ----------------------------------------------------
  // Formulario de Cobro
  // ----------------------------------------------------
  const [cobroVentaId, setCobroVentaId] = useState('');
  const [cobroImporte, setCobroImporte] = useState<number>(0);
  const [cobroMedio, setCobroMedio] = useState<'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE'>('TRANSFERENCIA');

  // ----------------------------------------------------
  // Formulario de Pago
  // ----------------------------------------------------
  const [pagoCompraId, setPagoCompraId] = useState('');
  const [pagoImporte, setPagoImporte] = useState<number>(0);
  const [pagoMedio, setPagoMedio] = useState<'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE'>('TRANSFERENCIA');

  // ----------------------------------------------------
  // Formulario de Distribución de Costos (Con Moneda Dual)
  // ----------------------------------------------------
  const [costoConcepto, setCostoConcepto] = useState('Mantenimiento alambrados e instalaciones ovina');
  const [costoMoneda, setCostoMoneda] = useState<MonedaTipo>('ARS');
  const [costoTipoCambio, setCostoTipoCambio] = useState<number>(tipoCambioOficial);
  const [costoImporteMoneda, setCostoImporteMoneda] = useState<number>(100000);
  const [costoClasificacion, setCostoClasificacion] = useState<'DIRECTO' | 'INDIRECTO'>('INDIRECTO');
  const [distCria, setDistCria] = useState<number>(50000);
  const [distRecria, setDistRecria] = useState<number>(30000);
  const [distEngorde, setDistEngorde] = useState<number>(20000);

  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const handleDescargarReportePdf = () => {
    try {
      setGenerandoPdf(true);
      generateEconomiaPdfReport(
        state,
        currentUser,
        selectedSubunidad,
        selectedCampania,
        isTestMode,
        monedaVista,
        tipoCambioOficial
      );
      setFormMsg({
        type: 'success',
        text: 'Reporte PDF de Operaciones Económicas & Tesorería generado y descargado correctamente.'
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

  // Suma distribuida calculada en vivo
  const sumaDistribuida = distCria + distRecria + distEngorde;
  const diferenciaDistribucion = Math.abs(sumaDistribuida - costoImporteMoneda);
  const esDistribucionEquilibrada = diferenciaDistribucion <= 0.01;

  // Registrar Venta con salida física, devengamiento económico y soporte ARS / USD
  const handleRegistrarVenta = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (currentUser.rol_nombre === 'OPERADOR' || currentUser.rol_nombre === 'AUDITORIA') {
      setFormMsg({ type: 'error', text: 'Permiso denegado: Solo Administrador y Responsable de Unidad pueden registrar ventas' });
      return;
    }

    if (vtaTipoCambio <= 0) {
      setFormMsg({ type: 'error', text: 'El tipo de cambio debe ser mayor a 0.' });
      return;
    }

    // 1. Validar y registrar salida física de hacienda
    const movRes = executeMovimientoHacienda(
      {
        id_campania: selectedCampania,
        fecha: vtaFecha,
        tipo: 'VENTA',
        id_subunidad_origen: vtaSubunidad,
        id_categoria_origen: vtaCategoria,
        id_lote_origen: 'LOT001',
        cabezas: Number(vtaCabezas),
        kg_vivo_total: Number(vtaKgTotal),
        motivo: `Venta comprobante ${vtaComprobante} a Frigorífico (${vtaMoneda})`,
        es_prueba: isTestMode,
        usuario_id: currentUser.id_usuario,
      },
      currentUser
    );

    if (!movRes.success) {
      setFormMsg({ type: 'error', text: movRes.error || 'Error al validar stock de venta' });
      return;
    }

    const idVenta = `VTA-${Date.now()}`;
    const nuevaVenta: Venta = {
      id_venta: idVenta,
      id_campania: selectedCampania,
      id_subunidad: vtaSubunidad,
      id_tercero: vtaTercero,
      comprobante_nro: vtaComprobante,
      fecha: vtaFecha,
      importe_total: Number(vtaTotalArs.toFixed(2)),
      saldo_pendiente: Number(vtaTotalArs.toFixed(2)),
      estado_cobro: 'PENDIENTE',
      anulado: false,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
      moneda: vtaMoneda,
      tipo_cambio: Number(vtaTipoCambio),
      importe_total_usd: Number(vtaTotalUsd.toFixed(2)),
    };
    state.ventas.push(nuevaVenta);

    state.detalles_ventas.push({
      id_detalle_venta: `DET-VTA-${Date.now()}`,
      id_venta: idVenta,
      id_producto: vtaProducto,
      id_categoria: vtaCategoria,
      cabezas: Number(vtaCabezas),
      kg_total: Number(vtaKgTotal),
      precio_unitario: Number(vtaPrecioUnitario),
      subtotal: Number(vtaTotalArs.toFixed(2)),
    });

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'ventas',
      id_registro: idVenta,
      valor_nuevo: JSON.stringify(nuevaVenta),
      motivo: `Venta devengada: ${vtaCabezas} cabezas por ${vtaMoneda === 'USD' ? `US$ ${vtaTotalUsd.toFixed(2)} USD` : `$ ${vtaTotalArs.toLocaleString('es-AR')} ARS`} (TC Oficial: $${vtaTipoCambio})`,
    });

    saveDatabaseState(state);
    setFormMsg({
      type: 'success',
      text: `Venta registrada exitosamente. Salida física de ${vtaCabezas} cabezas efectuada e ingreso devengado por $${vtaTotalArs.toLocaleString('es-AR')} ARS (equivale a US$ ${vtaTotalUsd.toFixed(2)} USD a TC $${vtaTipoCambio}).`,
    });
    onStateUpdate();
  };

  // Registrar Compra de Insumos con moneda dual y actualización de stock
  const handleRegistrarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (currentUser.rol_nombre === 'OPERADOR' || currentUser.rol_nombre === 'AUDITORIA') {
      setFormMsg({ type: 'error', text: 'Permiso denegado: Solo Administrador y Responsable de Unidad pueden registrar compras' });
      return;
    }

    if (cmpTipoCambio <= 0) {
      setFormMsg({ type: 'error', text: 'El tipo de cambio debe ser mayor a 0.' });
      return;
    }

    const insumo = state.insumos.find(i => i.id_insumo === cmpInsumo);
    if (!insumo) {
      setFormMsg({ type: 'error', text: 'Seleccione un insumo válido.' });
      return;
    }

    // Actualizar stock de insumo y recalcular precio promedio ponderado (PPP en base ARS)
    const stockPrevio = insumo.stock_actual;
    const valorPrevio = stockPrevio * insumo.precio_promedio_ponderado;
    const nuevoStock = stockPrevio + cmpCantidad;
    const nuevoPPP = nuevoStock > 0 ? (valorPrevio + cmpTotalArs) / nuevoStock : (cmpTotalArs / cmpCantidad);

    insumo.stock_actual = Number(nuevoStock.toFixed(2));
    insumo.precio_promedio_ponderado = Number(nuevoPPP.toFixed(2));

    const idCompra = `CMP-${Date.now()}`;
    const nuevaCompra: Compra = {
      id_compra: idCompra,
      id_campania: selectedCampania,
      id_tercero: cmpTercero,
      comprobante_tipo: 'FACTURA_A',
      comprobante_nro: cmpComprobante,
      fecha: cmpFecha,
      importe_total: Number(cmpTotalArs.toFixed(2)),
      saldo_pendiente: Number(cmpTotalArs.toFixed(2)),
      estado_pago: 'PENDIENTE',
      anulado: false,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
      moneda: cmpMoneda,
      tipo_cambio: Number(cmpTipoCambio),
      importe_total_usd: Number(cmpTotalUsd.toFixed(2)),
    };
    state.compras.push(nuevaCompra);

    state.detalles_compras.push({
      id_detalle_compra: `DET-CMP-${Date.now()}`,
      id_compra: idCompra,
      id_insumo: cmpInsumo,
      cantidad: Number(cmpCantidad),
      id_um: insumo.id_um,
      precio_unitario: Number(cmpPrecioUnitario),
      subtotal: Number(cmpTotalArs.toFixed(2)),
    });

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'compras',
      id_registro: idCompra,
      valor_nuevo: JSON.stringify(nuevaCompra),
      motivo: `Compra de insumos: ${cmpCantidad} ${insumo.um_codigo} de ${insumo.nombre} cargada en ${cmpMoneda} (Total: $${cmpTotalArs.toLocaleString('es-AR')} ARS / US$ ${cmpTotalUsd.toFixed(2)} USD, TC: $${cmpTipoCambio})`,
    });

    saveDatabaseState(state);
    setFormMsg({
      type: 'success',
      text: `Compra registrada. Stock en depósito actualizado a ${insumo.stock_actual} ${insumo.um_codigo} (nuevo PPP: $${insumo.precio_promedio_ponderado} ARS). Deuda comercial registrada por $${cmpTotalArs.toLocaleString('es-AR')} ARS (US$ ${cmpTotalUsd.toFixed(2)} USD).`,
    });
    onStateUpdate();
  };

  // Registrar Cobro de Venta
  const handleRegistrarCobro = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const venta = state.ventas.find(v => v.id_venta === cobroVentaId);
    if (!venta) {
      setFormMsg({ type: 'error', text: 'Seleccione una venta para cobrar' });
      return;
    }

    if (cobroImporte <= 0 || cobroImporte > venta.saldo_pendiente) {
      setFormMsg({
        type: 'error',
        text: `El importe debe ser mayor a 0 y no superar el saldo pendiente ($${venta.saldo_pendiente.toLocaleString('es-AR')} ARS)`,
      });
      return;
    }

    venta.saldo_pendiente = Number((venta.saldo_pendiente - cobroImporte).toFixed(2));
    venta.estado_cobro = venta.saldo_pendiente === 0 ? 'COBRADO' : 'COBRO_PARCIAL';

    const nuevoCobro: Cobro = {
      id_cobro: `COB-${Date.now()}`,
      id_venta: venta.id_venta,
      id_cuenta_cobro: 'CTA-1-1-01', // Caja/Bancos UNRC
      fecha: getFechaArgentinaISO(),
      importe: Number(cobroImporte),
      medio_pago: cobroMedio,
      recibo_nro: `REC-${Date.now()}`,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
    };
    state.cobros.push(nuevoCobro);

    saveDatabaseState(state);
    setFormMsg({
      type: 'success',
      text: `Cobro de $${cobroImporte.toLocaleString('es-AR')} ARS registrado en tesorería. Saldo pendiente de la venta: $${venta.saldo_pendiente.toLocaleString('es-AR')} ARS.`,
    });
    onStateUpdate();
  };

  // Registrar Pago a Proveedor
  const handleRegistrarPago = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const compra = state.compras.find(c => c.id_compra === pagoCompraId);
    if (!compra) {
      setFormMsg({ type: 'error', text: 'Seleccione una factura de compra para pagar' });
      return;
    }

    if (pagoImporte <= 0 || pagoImporte > compra.saldo_pendiente) {
      setFormMsg({
        type: 'error',
        text: `El importe a pagar no puede superar el saldo pendiente de la compra ($${compra.saldo_pendiente.toLocaleString('es-AR')} ARS)`,
      });
      return;
    }

    compra.saldo_pendiente = Number((compra.saldo_pendiente - pagoImporte).toFixed(2));
    compra.estado_pago = compra.saldo_pendiente === 0 ? 'PAGADO' : 'PAGO_PARCIAL';

    const nuevoPago: Pago = {
      id_pago: `PAG-${Date.now()}`,
      id_compra: compra.id_compra,
      id_cuenta_pago: 'CTA-1-1-01',
      fecha: getFechaArgentinaISO(),
      importe: Number(pagoImporte),
      medio_pago: pagoMedio,
      orden_pago_nro: `OP-${Date.now()}`,
      es_prueba: isTestMode,
      usuario_id: currentUser.id_usuario,
    };
    state.pagos.push(nuevoPago);

    saveDatabaseState(state);
    setFormMsg({
      type: 'success',
      text: `Pago de $${pagoImporte.toLocaleString('es-AR')} ARS asentado en tesorería. Saldo pendiente de la deuda: $${compra.saldo_pendiente.toLocaleString('es-AR')} ARS.`,
    });
    onStateUpdate();
  };

  // Registrar Distribución de Costos con moneda dual y regla estricta de suma exacta
  const handleRegistrarDistribucion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!esDistribucionEquilibrada) {
      setFormMsg({
        type: 'error',
        text: `Error de distribución: La suma distribuida (${sumaDistribuida.toLocaleString('es-AR')}) difiere del costo original (${costoImporteMoneda.toLocaleString('es-AR')}).`,
      });
      return;
    }

    // Convertir a ARS si fue ingresado en USD
    const totalArs = costoMoneda === 'USD' ? convertirUsdAArs(costoImporteMoneda, costoTipoCambio) : costoImporteMoneda;
    const totalUsd = costoMoneda === 'USD' ? costoImporteMoneda : convertirArsAUsd(costoImporteMoneda, costoTipoCambio);

    const factorArs = costoMoneda === 'USD' ? costoTipoCambio : 1;

    const distPayload = [
      { id_subunidad: 'SUB-CRIA', porcentaje: (distCria / costoImporteMoneda) * 100, importe_asignado: distCria * factorArs },
      { id_subunidad: 'SUB-REC', porcentaje: (distRecria / costoImporteMoneda) * 100, importe_asignado: distRecria * factorArs },
      { id_subunidad: 'SUB-ENG', porcentaje: (distEngorde / costoImporteMoneda) * 100, importe_asignado: distEngorde * factorArs },
    ].filter(d => d.importe_asignado > 0);

    const res = validateAndSaveDistribucionCosto(
      {
        id_campania: selectedCampania,
        id_cuenta: 'CTA-5-2-01',
        fecha: getFechaArgentinaISO(),
        concepto: `${costoConcepto} [${costoMoneda}]`,
        clasificacion: costoClasificacion,
        importe_total: Number(totalArs),
        es_prueba: isTestMode,
        usuario_id: currentUser.id_usuario,
        moneda: costoMoneda,
        tipo_cambio: Number(costoTipoCambio),
        importe_total_usd: Number(totalUsd.toFixed(2)),
      },
      distPayload,
      currentUser
    );

    if (!res.success) {
      setFormMsg({ type: 'error', text: res.error || 'Error en distribución de costos' });
      return;
    }

    setFormMsg({
      type: 'success',
      text: `Costo de $${totalArs.toLocaleString('es-AR')} ARS (US$ ${totalUsd.toFixed(2)} USD) distribuido y asentado con balance exacto.`,
    });
    onStateUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#f2fcf6]">Operaciones Económicas & Tesorería</h2>
          <BotonAyudaContextual moduloId="economia" onOpenManual={onOpenManual} />
        </div>
      </div>

      {/* Tab Navigation & Selector de Visualización Moneda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#264d3f] pb-2 gap-3">
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ventas' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-[#a2c7b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            Ventas de Hacienda
          </button>
          <button
            onClick={() => setActiveTab('compras')}
            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compras' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-[#a2c7b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
            }`}
          >
            Compras de Insumos
          </button>
          <button
            onClick={() => setActiveTab('tesoreria')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tesoreria' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tesorería (Cobros / Pagos)
          </button>
          <button
            onClick={() => setActiveTab('distribucion_costos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'distribucion_costos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Distribución de Costos
          </button>
        </div>

        {/* Control de Moneda de Visualización de Tablas & Cotización Oficial */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Ver en:</span>
            <button
              onClick={() => setMonedaVista('ARS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                monedaVista === 'ARS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              $ Pesos
            </button>
            <button
              onClick={() => setMonedaVista('USD')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                monedaVista === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              US$ Dólares
            </button>
          </div>

          <a
            href={DOLAR_HOY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-colors"
            title="Consultar cotización oficial en Dólar Hoy (dolarhoy.com/cotizaciondolaroficial)"
          >
            <span>Dólar Hoy Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Botón para generar reporte PDF con filtros actuales de Subunidad y Campaña */}
          <button
            onClick={handleDescargarReportePdf}
            disabled={generandoPdf}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title={`Descargar reporte en formato PDF con la información económica filtrada por Subunidad (${selectedSubunidad}) y Campaña (${selectedCampania})`}
          >
            <FileDown className={`w-4 h-4 text-emerald-400 ${generandoPdf ? 'animate-bounce' : ''}`} />
            <span>{generandoPdf ? 'Generando PDF...' : 'Reporte PDF (Subunidad / Campaña)'}</span>
          </button>
        </div>
      </div>

      {/* Indicador de última modificación con persona, día y horario */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['ventas', 'compras', 'cobros', 'pagos', 'costos', 'distribucion_costos']}
        seccionNombre="Operaciones Económicas & Tesorería"
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
            ? 'Filtrando ventas y costos imputados por la subunidad seleccionada'
            : 'Mostrando la totalidad de operaciones económicas y tesorería del establecimiento'}
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

      {/* TAB 1: VENTAS DE HACIENDA */}
      {activeTab === 'ventas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white">Registrar Venta de Hacienda</h3>
              {onOpenManual && (
                <button
                  type="button"
                  onClick={() => onOpenManual('Ingresos Reales')}
                  className="text-slate-400 hover:text-emerald-300"
                  title="¿Qué son los Ingresos Reales?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Carga en Dólares (USD) o Pesos (ARS) con tipo de cambio en el momento de la venta.
            </p>

            <form onSubmit={handleRegistrarVenta} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subunidad Vendedora</label>
                <select
                  value={vtaSubunidad}
                  onChange={e => setVtaSubunidad(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.subunidades.map(s => (
                    <option key={s.id_subunidad} value={s.id_subunidad}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cliente (Tercero)</label>
                <select
                  value={vtaTercero}
                  onChange={e => setVtaTercero(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.terceros.map(t => (
                    <option key={t.id_tercero} value={t.id_tercero}>
                      {t.razon_social} ({t.cuit_cuil})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° Comprobante / Factura</label>
                  <input
                    type="text"
                    value={vtaComprobante}
                    onChange={e => setVtaComprobante(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={vtaFecha}
                    onChange={e => setVtaFecha(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Categoría a Descargar</label>
                <select
                  value={vtaCategoria}
                  onChange={e => setVtaCategoria(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cabezas Vendidas</label>
                  <input
                    type="number"
                    min="1"
                    value={vtaCabezas}
                    onChange={e => setVtaCabezas(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kg Total Balanza</label>
                  <input
                    type="number"
                    min="1"
                    value={vtaKgTotal}
                    onChange={e => setVtaKgTotal(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
              </div>

              {/* Selector de Moneda y Tipo de Cambio de la Operación */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Moneda de Facturación:</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setVtaMoneda('ARS')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                        vtaMoneda === 'ARS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      $ ARS
                    </button>
                    <button
                      type="button"
                      onClick={() => setVtaMoneda('USD')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                        vtaMoneda === 'USD'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      US$ USD
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">
                      Precio ({vtaMoneda === 'USD' ? 'USD/kg' : 'ARS/kg'})
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={vtaPrecioUnitario}
                      onChange={e => setVtaPrecioUnitario(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-slate-400 text-[11px]">Tipo de Cambio</label>
                      <a
                        href={DOLAR_HOY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-400 hover:underline flex items-center"
                        title="Ver cotización oficial en Dólar Hoy"
                      >
                        <span>Dólar Hoy</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    </div>
                    <div className="flex space-x-1 mb-1">
                      <button
                        type="button"
                        onClick={() => setVtaTipoCambio(getCotizacionOficial().venta)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          vtaTipoCambio === getCotizacionOficial().venta
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title="Aplicar Cotización Venta oficial de Dólar Hoy"
                      >
                        Venta: ${getCotizacionOficial().venta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVtaTipoCambio(getCotizacionOficial().compra)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          vtaTipoCambio === getCotizacionOficial().compra
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title="Aplicar Cotización Compra oficial de Dólar Hoy"
                      >
                        Compra: ${getCotizacionOficial().compra}
                      </button>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={vtaTipoCambio}
                      onChange={e => setVtaTipoCambio(parseFloat(e.target.value) || 1)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Importe Total Calculado con Dualidad */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Total Venta:</span>
                  <div className="text-right">
                    <p className="text-base font-black text-emerald-400">
                      ${vtaTotalArs.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ARS
                    </p>
                    <p className="text-[11px] font-mono font-bold text-blue-300">
                      US$ {vtaTotalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Emitir Venta y Descontar Hacienda
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white">Libro de Ventas Realizadas</h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Visualizando en: <strong className="text-white">{monedaVista === 'USD' ? 'Dólares (US$)' : 'Pesos ($)'}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Cada venta registra la moneda pactada y el tipo de cambio oficial del momento.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Comprobante</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Moneda / TC</th>
                    <th className="py-2.5 px-3 text-right">Importe Total</th>
                    <th className="py-2.5 px-3 text-right">Saldo Pend.</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Estado Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No hay ventas registradas para los filtros seleccionados ({isConsolidado ? 'Consolidado' : selectedSubunidad} · Campaña {selectedCampania}).
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map(v => {
                    const ter = state.terceros.find(t => t.id_tercero === v.id_tercero);
                    const tcOp = v.tipo_cambio || tipoCambioOficial;
                    const totalUsd = v.importe_total_usd || convertirArsAUsd(v.importe_total, tcOp);
                    const saldoUsd = convertirArsAUsd(v.saldo_pendiente, tcOp);

                    return (
                      <tr key={v.id_venta} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{v.comprobante_nro}</td>
                        <td className="py-2.5 px-3 font-mono">{v.fecha}</td>
                        <td className="py-2.5 px-3 text-slate-300">{ter?.razon_social}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">
                            {v.moneda || 'ARS'} (TC ${tcOp})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                          {monedaVista === 'USD'
                            ? `US$ ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : `$ ${v.importe_total.toLocaleString('es-AR')}`}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {monedaVista === 'USD'
                            ? `US$ ${saldoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : `$ ${v.saldo_pendiente.toLocaleString('es-AR')}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              v.estado_cobro === 'COBRADO'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {v.estado_cobro}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPRAS DE INSUMOS */}
      {activeTab === 'compras' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white">Registrar Compra de Insumos</h3>
              <button
                type="button"
                onClick={() => setIsNuevoInsumoModalOpen(true)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                title="Incorporar un nuevo insumo no catalogado previamente"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Insumo</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa al inventario de insumos en depósito y genera pasivo comercial.
            </p>

            <form onSubmit={handleRegistrarCompra} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Proveedor Comercial</label>
                <select
                  value={cmpTercero}
                  onChange={e => setCmpTercero(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.terceros.map(t => (
                    <option key={t.id_tercero} value={t.id_tercero}>{t.razon_social}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° Comprobante</label>
                  <input
                    type="text"
                    value={cmpComprobante}
                    onChange={e => setCmpComprobante(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={cmpFecha}
                    onChange={e => setCmpFecha(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Insumo a Comprar</label>
                  <button
                    type="button"
                    onClick={() => setIsNuevoInsumoModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Crear nuevo insumo
                  </button>
                </div>
                <select
                  value={cmpInsumo}
                  onChange={e => setCmpInsumo(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  {state.insumos.map(i => (
                    <option key={i.id_insumo} value={i.id_insumo}>
                      {i.nombre} (Stock actual: {i.stock_actual} {i.um_codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cantidad Comprada</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={cmpCantidad}
                  onChange={e => setCmpCantidad(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                />
              </div>

              {/* Selector de Moneda y Tipo de Cambio de la Compra */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Moneda de Compra:</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setCmpMoneda('ARS')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                        cmpMoneda === 'ARS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      $ ARS
                    </button>
                    <button
                      type="button"
                      onClick={() => setCmpMoneda('USD')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                        cmpMoneda === 'USD'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      US$ USD
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">
                      Precio Unitario ({cmpMoneda === 'USD' ? 'US$' : '$'})
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={cmpPrecioUnitario}
                      onChange={e => setCmpPrecioUnitario(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-slate-400 text-[11px]">Tipo de Cambio</label>
                      <a
                        href={DOLAR_HOY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-400 hover:underline flex items-center"
                        title="Ver cotización oficial en Dólar Hoy"
                      >
                        <span>Dólar Hoy</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    </div>
                    <div className="flex space-x-1 mb-1">
                      <button
                        type="button"
                        onClick={() => setCmpTipoCambio(getCotizacionOficial().compra)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          cmpTipoCambio === getCotizacionOficial().compra
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title="Aplicar Cotización Compra oficial de Dólar Hoy"
                      >
                        Compra: ${getCotizacionOficial().compra}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCmpTipoCambio(getCotizacionOficial().venta)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          cmpTipoCambio === getCotizacionOficial().venta
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title="Aplicar Cotización Venta oficial de Dólar Hoy"
                      >
                        Venta: ${getCotizacionOficial().venta}
                      </button>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={cmpTipoCambio}
                      onChange={e => setCmpTipoCambio(parseFloat(e.target.value) || 1)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Total Factura con Dualidad */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Total Pasivo:</span>
                  <div className="text-right">
                    <p className="text-base font-black text-amber-400">
                      ${cmpTotalArs.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ARS
                    </p>
                    <p className="text-[11px] font-mono font-bold text-blue-300">
                      US$ {cmpTotalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ingresar a Depósito y Registrar Pasivo
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white">Historial de Compras de Insumos</h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Visualizando en: <strong className="text-white">{monedaVista === 'USD' ? 'Dólares (US$)' : 'Pesos ($)'}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Control de cuentas comerciales a pagar en moneda dual</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Factura</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Proveedor</th>
                    <th className="py-2.5 px-3">Moneda / TC</th>
                    <th className="py-2.5 px-3 text-right">Importe Total</th>
                    <th className="py-2.5 px-3 text-right">Saldo Deuda</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Estado Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {comprasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No hay facturas de compras cargadas en la campaña {selectedCampania}.
                      </td>
                    </tr>
                  ) : (
                    comprasFiltradas.map(c => {
                      const ter = state.terceros.find(t => t.id_tercero === c.id_tercero);
                      const tcOp = c.tipo_cambio || tipoCambioOficial;
                      const totalUsd = c.importe_total_usd || convertirArsAUsd(c.importe_total, tcOp);
                      const saldoUsd = convertirArsAUsd(c.saldo_pendiente, tcOp);

                      return (
                        <tr key={c.id_compra} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">{c.comprobante_nro}</td>
                          <td className="py-2.5 px-3 font-mono">{c.fecha}</td>
                          <td className="py-2.5 px-3 text-slate-300">{ter?.razon_social}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">
                              {c.moneda || 'ARS'} (TC ${tcOp})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-amber-400">
                            {monedaVista === 'USD'
                              ? `US$ ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : `$ ${c.importe_total.toLocaleString('es-AR')}`}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {monedaVista === 'USD'
                              ? `US$ ${saldoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : `$ ${c.saldo_pendiente.toLocaleString('es-AR')}`}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
                              {c.estado_pago}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TESORERÍA (COBROS & PAGOS) */}
      {activeTab === 'tesoreria' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cobros */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">Registrar Cobranza a Clientes</h3>
            <p className="text-xs text-slate-400 mb-4">
              Cancela crédito por ventas sin generar doble ingreso en el ejercicio
            </p>

            <form onSubmit={handleRegistrarCobro} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Venta con Saldo Pendiente</label>
                <select
                  value={cobroVentaId}
                  onChange={e => {
                    setCobroVentaId(e.target.value);
                    const v = state.ventas.find(x => x.id_venta === e.target.value);
                    if (v) setCobroImporte(v.saldo_pendiente);
                  }}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                >
                  <option value="">Seleccione una venta...</option>
                  {state.ventas
                    .filter(v => v.saldo_pendiente > 0)
                    .map(v => (
                      <option key={v.id_venta} value={v.id_venta}>
                        {v.comprobante_nro} (Saldo: ${v.saldo_pendiente.toLocaleString('es-AR')} ARS)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Importe a Cobrar ($ ARS)</label>
                <input
                  type="number"
                  min="1"
                  value={cobroImporte}
                  onChange={e => setCobroImporte(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medio de Pago</label>
                <select
                  value={cobroMedio}
                  onChange={e => setCobroMedio(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="EFECTIVO">Efectivo / Caja Chica</option>
                  <option value="CHEQUE">Cheque de Pago Diferido</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                Emitir Recibo de Cobranza
              </button>
            </form>
          </div>

          {/* Pagos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">Registrar Pago a Proveedores</h3>
            <p className="text-xs text-slate-400 mb-4">
              Extingue pasivo comercial sin duplicar el costo ya devengado
            </p>

            <form onSubmit={handleRegistrarPago} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Factura de Compra Pendiente</label>
                <select
                  value={pagoCompraId}
                  onChange={e => {
                    setPagoCompraId(e.target.value);
                    const c = state.compras.find(x => x.id_compra === e.target.value);
                    if (c) setPagoImporte(c.saldo_pendiente);
                  }}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                >
                  <option value="">Seleccione una compra...</option>
                  {state.compras
                    .filter(c => c.saldo_pendiente > 0)
                    .map(c => (
                      <option key={c.id_compra} value={c.id_compra}>
                        {c.comprobante_nro} (Saldo: ${c.saldo_pendiente.toLocaleString('es-AR')} ARS)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Importe a Pagar ($ ARS)</label>
                <input
                  type="number"
                  min="1"
                  value={pagoImporte}
                  onChange={e => setPagoImporte(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medio de Pago</label>
                <select
                  value={pagoMedio}
                  onChange={e => setPagoMedio(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                Emitir Orden de Pago
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: DISTRIBUCIÓN DE COSTOS (REGLA DE SUMA EXACTA & MONEDA DUAL) */}
      {activeTab === 'distribucion_costos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Distribución de Costos entre Subunidades</h3>
                {onOpenManual && (
                  <button
                    type="button"
                    onClick={() => onOpenManual('Costo Indirecto')}
                    className="text-slate-400 hover:text-emerald-300"
                    title="¿Qué es un Costo Indirecto?"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Regla obligatoria del ERP: SUMA DISTRIBUIDA = COSTO ORIGINAL (Error estricto si difieren).
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                esDistribucionEquilibrada
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              }`}
            >
              {esDistribucionEquilibrada ? 'Equilibrio 100% OK' : 'Desbalanceado'}
            </div>
          </div>

          <form onSubmit={handleRegistrarDistribucion} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Concepto del Costo</label>
              <input
                type="text"
                value={costoConcepto}
                onChange={e => setCostoConcepto(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clasificación</label>
                <select
                  value={costoClasificacion}
                  onChange={e => setCostoClasificacion(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                >
                  <option value="DIRECTO">Costo Directo</option>
                  <option value="INDIRECTO">Costo Indirecto (Prorrateo)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Moneda del Costo</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setCostoMoneda('ARS')}
                    className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                      costoMoneda === 'ARS'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    $ ARS
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostoMoneda('USD')}
                    className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                      costoMoneda === 'USD'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    US$ USD
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Costo Total ({costoMoneda === 'USD' ? 'US$' : '$'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={costoImporteMoneda}
                  onChange={e => setCostoImporteMoneda(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-extrabold text-sm"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Tipo de Cambio</label>
                  <a
                    href={DOLAR_HOY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center"
                    title="Ver cotización oficial en Dólar Hoy"
                  >
                    <span>Dólar Hoy</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                </div>
                <div className="flex space-x-1 mb-1">
                  <button
                    type="button"
                    onClick={() => setCostoTipoCambio(getCotizacionOficial().compra)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      costoTipoCambio === getCotizacionOficial().compra
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Aplicar Cotización Compra oficial"
                  >
                    TC Compra (${getCotizacionOficial().compra})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostoTipoCambio(getCotizacionOficial().venta)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      costoTipoCambio === getCotizacionOficial().venta
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Aplicar Cotización Venta oficial"
                  >
                    TC Venta (${getCotizacionOficial().venta})
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={costoTipoCambio}
                  onChange={e => setCostoTipoCambio(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
              <span className="font-bold text-slate-300 block">
                Prorrateo por Subunidad (en {costoMoneda}):
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Cría Ovina</label>
                  <input
                    type="number"
                    min="0"
                    value={distCria}
                    onChange={e => setDistCria(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Recría Ovina</label>
                  <input
                    type="number"
                    min="0"
                    value={distRecria}
                    onChange={e => setDistRecria(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Engorde</label>
                  <input
                    type="number"
                    min="0"
                    value={distEngorde}
                    onChange={e => setDistEngorde(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                <span>
                  Suma Distribuida: <strong className="text-white">{sumaDistribuida.toLocaleString('es-AR')} {costoMoneda}</strong>
                </span>
                <span className={esDistribucionEquilibrada ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                  Diferencia: {diferenciaDistribucion.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!esDistribucionEquilibrada}
              className={`w-full py-3 font-bold rounded-xl text-xs transition-colors cursor-pointer ${
                esDistribucionEquilibrada
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {esDistribucionEquilibrada
                ? 'Validar y Asentar Distribución de Costos'
                : 'Error: La suma debe ser exactamente igual al costo'}
            </button>
          </form>
        </div>
      )}

      {/* Modal para Incorporar Nuevo Insumo desde Compras */}
      <NuevoInsumoModal
        isOpen={isNuevoInsumoModalOpen}
        onClose={() => setIsNuevoInsumoModalOpen(false)}
        state={state}
        currentUser={currentUser}
        onStateUpdate={nuevoId => {
          if (nuevoId) setCmpInsumo(nuevoId);
          onStateUpdate();
        }}
      />
    </div>
  );
};

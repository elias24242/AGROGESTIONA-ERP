import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatabaseState } from './sheetsService';
import { Usuario } from '../types/erp';
import { MonedaTipo, convertirArsAUsd } from './currencyService';
import { formatFechaArg, formatHoraArg, getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';

interface ReportFilterMeta {
  subunidadNombre: string;
  subunidadCodigo: string;
  campaniaCodigo: string;
  campaniaNombre: string;
  fechaEmision: string;
  horaEmision: string;
  usuarioNombre: string;
  usuarioRol: string;
  isTestMode: boolean;
  monedaVisualizacion: MonedaTipo;
  tipoCambioOficial: number;
}

function getFilterMeta(
  state: DatabaseState,
  currentUser: Usuario,
  selectedSubunidad: string,
  selectedCampania: string,
  isTestMode: boolean,
  monedaVisualizacion: MonedaTipo,
  tipoCambioOficial: number
): ReportFilterMeta {
  const sub = state.subunidades.find(s => s.id_subunidad === selectedSubunidad);
  const camp = state.campanias.find(c => c.id_campania === selectedCampania);
  const now = new Date();

  return {
    subunidadNombre: selectedSubunidad === 'TODOS' ? 'Consolidado Ovinos (Toda la Majada)' : (sub?.nombre || selectedSubunidad),
    subunidadCodigo: selectedSubunidad,
    campaniaCodigo: camp?.codigo || selectedCampania,
    campaniaNombre: camp?.nombre || `Campaña ${camp?.codigo || selectedCampania}`,
    fechaEmision: formatFechaArg(now),
    horaEmision: formatHoraArg(now),
    usuarioNombre: currentUser.nombre_completo,
    usuarioRol: currentUser.rol_nombre,
    isTestMode,
    monedaVisualizacion,
    tipoCambioOficial,
  };
}

function renderHeader(doc: jsPDF, tituloReporte: string, meta: ReportFilterMeta) {
  // Barra superior decorativa verde institucional
  doc.setFillColor(6, 95, 70); // emerald-800
  doc.rect(0, 0, 210, 18, 'F');

  // Letra blanca de cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ESTABLECIMIENTO POZO DEL CARRIL — ERP OVINOS', 14, 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Taller de Práctica Profesional • Universidad Nacional de Río Cuarto (UNRC)', 14, 13);

  // Fecha y hora en cabecera
  doc.text(`ART: ${meta.fechaEmision} ${meta.horaEmision} hs`, 196, 11, { align: 'right' });

  // Título del Reporte
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(tituloReporte, 14, 27);

  // Recuadro de metadatos del filtro
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, 31, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('Alcance / Subunidad:', 18, 37);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${meta.subunidadNombre} (${meta.subunidadCodigo})`, 54, 37);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Campaña Productiva:', 18, 43);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${meta.campaniaNombre} (${meta.campaniaCodigo})`, 54, 43);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Generado por:', 18, 49);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${meta.usuarioNombre} • Rol: ${meta.usuarioRol}`, 54, 49);

  // Columna derecha de metadatos
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('TC Oficial:', 125, 37);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${meta.tipoCambioOficial.toLocaleString('es-AR')} ARS/USD`, 146, 37);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Moneda Visualizada:', 125, 43);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${meta.monedaVisualizacion === 'USD' ? 'Dólares (US$)' : 'Pesos Argentinos ($ ARS)'}`, 157, 43);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Tipo de Entorno:', 125, 49);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(meta.isTestMode ? 180 : 22, meta.isTestMode ? 83 : 101, meta.isTestMode ? 9 : 52);
  doc.text(meta.isTestMode ? 'Modo Pruebas (Sandbox)' : 'Datos Reales de Producción', 150, 49);
}

function renderFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistema ERP Ovinos Pozo del Carril • Taller de Práctica Profesional UNRC • Documento Técnico Oficial', 14, 290);
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
  }
}

/**
 * Genera y descarga el reporte PDF técnico del módulo de Producción y Consumos
 */
export function generateProduccionPdfReport(
  state: DatabaseState,
  currentUser: Usuario,
  selectedSubunidad: string,
  selectedCampania: string,
  isTestMode: boolean,
  monedaVisualizacion: MonedaTipo = 'ARS',
  tipoCambioOficial: number = 1540
) {
  const meta = getFilterMeta(state, currentUser, selectedSubunidad, selectedCampania, isTestMode, monedaVisualizacion, tipoCambioOficial);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  renderHeader(doc, 'INFORME DE PRODUCCIÓN FÍSICA & CONSUMOS', meta);

  // 1. Filtrar producciones según subunidad y campaña
  const produccionesFiltradas = state.produccion.filter(p => {
    const matchCamp = p.id_campania === selectedCampania;
    const matchSub = selectedSubunidad === 'TODOS' || p.id_subunidad === selectedSubunidad;
    const matchPrueba = isTestMode ? true : !p.es_prueba;
    return matchCamp && matchSub && matchPrueba;
  });

  // 2. Filtrar consumos según subunidad y campaña
  const consumosFiltrados = state.consumos.filter(c => {
    const matchCamp = c.id_campania === selectedCampania;
    const matchSub = selectedSubunidad === 'TODOS' || c.id_subunidad === selectedSubunidad;
    const matchPrueba = isTestMode ? true : !c.es_prueba;
    return matchCamp && matchSub && matchPrueba;
  });

  // Resumen numérico
  let startY = 57;

  // Cajas resumen KPI
  const totalCostoConsumosArs = consumosFiltrados.reduce((acc, c) => acc + (c.costo_total_real || 0), 0);
  const totalCostoConsumosUsd = convertirArsAUsd(totalCostoConsumosArs, tipoCambioOficial);
  const cantSobreconsumos = consumosFiltrados.filter(c => c.desvio_cantidad > 0).length;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 13, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Registros de Producción: ${produccionesFiltradas.length}`, 18, startY + 5);
  doc.text(`Registros de Consumo: ${consumosFiltrados.length}`, 75, startY + 5);
  doc.text(`Desvíos en Exceso: ${cantSobreconsumos}`, 140, startY + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Costo Total de Consumos: $${Math.round(totalCostoConsumosArs).toLocaleString('es-AR')} ARS (US$ ${totalCostoConsumosUsd.toFixed(2)} USD)`,
    18,
    startY + 10
  );

  startY += 18;

  // TABLA 1: PRODUCCIÓN FÍSICA OBTENIDA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Producción Física Obtenida', 14, startY);

  const prodTableBody = produccionesFiltradas.length > 0
    ? produccionesFiltradas.map(p => {
        const prod = state.productos.find(pr => pr.id_producto === p.id_producto);
        const sub = state.subunidades.find(s => s.id_subunidad === p.id_subunidad);
        const um = prod?.um_codigo || p.id_um;
        return [
          formatFechaArg(p.fecha),
          sub?.nombre || p.id_subunidad,
          prod?.nombre || p.id_producto,
          `${p.cantidad.toLocaleString('es-AR')} ${um}`,
          p.lote_origen || 'LOT001',
          p.observaciones || '-'
        ];
      })
    : [['Sin registros', '-', '-', '-', '-', 'No se encontraron eventos de producción para los filtros aplicados.']];

  autoTable(doc, {
    startY: startY + 3,
    head: [['Fecha', 'Subunidad', 'Producto', 'Cantidad', 'Lote', 'Observaciones']],
    body: prodTableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 32 },
      2: { cellWidth: 38 },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 20 },
      5: { cellWidth: 'auto' },
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // TABLA 2: CONSUMOS REALES VS ESPERADOS (ANÁLISIS DE DESVÍOS)
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Consumos Reales vs. Esperados (Análisis de Desvíos)', 14, currentY);

  const csmTableBody = consumosFiltrados.length > 0
    ? consumosFiltrados.map(c => {
        const ins = state.insumos.find(i => i.id_insumo === c.id_insumo);
        const sub = state.subunidades.find(s => s.id_subunidad === c.id_subunidad);
        const costoArs = c.costo_total_real !== null ? `$${Math.round(c.costo_total_real).toLocaleString('es-AR')}` : 'Sin precio';
        const costoUsd = c.costo_total_real !== null ? `US$ ${convertirArsAUsd(c.costo_total_real, tipoCambioOficial).toFixed(2)}` : '-';
        const desvioText = c.desvio_cantidad > 0 ? `+${c.desvio_cantidad} ${ins?.um_codigo || ''}` : `${c.desvio_cantidad} ${ins?.um_codigo || ''}`;
        return [
          formatFechaArg(c.fecha),
          sub?.nombre || c.id_subunidad,
          ins?.nombre || c.id_insumo,
          `${c.cantidad_real} ${ins?.um_codigo || ''}`,
          `${c.cantidad_esperada} ${ins?.um_codigo || ''}`,
          desvioText,
          c.estado_precio === 'CON_PRECIO' ? 'Valuado' : 'Falta Precio',
          monedaVisualizacion === 'USD' ? costoUsd : costoArs
        ];
      })
    : [['Sin registros', '-', '-', '-', '-', '-', '-', 'No se registraron consumos para los filtros seleccionados.']];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Fecha', 'Subunidad', 'Insumo', 'Real', 'Esperado', 'Desvío', 'Estado', `Costo (${monedaVisualizacion})`]],
    body: csmTableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 28 },
      2: { cellWidth: 38 },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 'auto', halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // TABLA 3: ESTADO ACTUAL DEL DEPÓSITO & STOCK DE INSUMOS
  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Inventario y Valuación de Insumos en Depósito (PPP)', 14, currentY);

  const insumosTableBody = state.insumos.map(ins => {
    const pppArs = `$${ins.precio_promedio_ponderado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const pppUsd = `US$ ${convertirArsAUsd(ins.precio_promedio_ponderado, tipoCambioOficial).toFixed(2)}`;
    const valTotalArs = ins.stock_actual * ins.precio_promedio_ponderado;
    const valTotalUsd = convertirArsAUsd(valTotalArs, tipoCambioOficial);
    const valFinal = monedaVisualizacion === 'USD' ? `US$ ${valTotalUsd.toFixed(2)}` : `$${Math.round(valTotalArs).toLocaleString('es-AR')}`;

    return [
      ins.codigo,
      ins.nombre,
      ins.tipo,
      `${ins.stock_actual.toLocaleString('es-AR')} ${ins.um_codigo}`,
      monedaVisualizacion === 'USD' ? pppUsd : pppArs,
      valFinal
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Código', 'Insumo', 'Tipo', 'Stock Físico', `PPP (${monedaVisualizacion})`, `Valuación Total (${monedaVisualizacion})`]],
    body: insumosTableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 50 },
      2: { cellWidth: 24 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 'auto', halign: 'right' },
    },
  });

  // Espacio para firmas institucionales al pie
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 260) {
    doc.setDrawColor(148, 163, 184);
    doc.line(20, finalY + 12, 80, finalY + 12);
    doc.line(130, finalY + 12, 190, finalY + 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Firma Responsable Zootécnico / Unidad', 22, finalY + 16);
    doc.text('Firma Auditor / Cátedra UNRC', 138, finalY + 16);
  }

  renderFooter(doc);

  // Nombre de archivo limpio y descriptivo
  const safeSub = meta.subunidadCodigo.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeCamp = meta.campaniaCodigo.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `Reporte_Produccion_Consumos_${safeSub}_${safeCamp}_${getFechaArgentinaISO()}.pdf`;
  doc.save(fileName);
}

/**
 * Genera y descarga el reporte PDF técnico del módulo de Operaciones Económicas & Tesorería
 */
export function generateEconomiaPdfReport(
  state: DatabaseState,
  currentUser: Usuario,
  selectedSubunidad: string,
  selectedCampania: string,
  isTestMode: boolean,
  monedaVisualizacion: MonedaTipo = 'ARS',
  tipoCambioOficial: number = 1540
) {
  const meta = getFilterMeta(state, currentUser, selectedSubunidad, selectedCampania, isTestMode, monedaVisualizacion, tipoCambioOficial);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  renderHeader(doc, 'REPORTE DE OPERACIONES ECONÓMICAS & TESORERÍA', meta);

  // 1. Filtrar ventas por campaña y subunidad
  const ventasFiltradas = state.ventas.filter(v => {
    const matchCamp = v.id_campania === selectedCampania;
    const matchSub = selectedSubunidad === 'TODOS' || v.id_subunidad === selectedSubunidad;
    const matchPrueba = isTestMode ? true : !v.es_prueba;
    return matchCamp && matchSub && matchPrueba && !v.anulado;
  });

  // 2. Filtrar compras por campaña
  const comprasFiltradas = state.compras.filter(c => {
    const matchCamp = c.id_campania === selectedCampania;
    const matchPrueba = isTestMode ? true : !c.es_prueba;
    return matchCamp && matchPrueba && !c.anulado;
  });

  // 3. Filtrar cobros y pagos asociados
  const idsVentas = new Set(ventasFiltradas.map(v => v.id_venta));
  const cobrosFiltrados = state.cobros.filter(c => idsVentas.has(c.id_venta) && (isTestMode ? true : !c.es_prueba));

  const idsCompras = new Set(comprasFiltradas.map(c => c.id_compra));
  const pagosFiltrados = state.pagos.filter(p => idsCompras.has(p.id_compra) && (isTestMode ? true : !p.es_prueba));

  // Cálculos de totales económicos
  const totalVentasArs = ventasFiltradas.reduce((acc, v) => acc + v.importe_total, 0);
  const totalVentasUsd = ventasFiltradas.reduce((acc, v) => acc + (v.importe_total_usd || convertirArsAUsd(v.importe_total, v.tipo_cambio || tipoCambioOficial)), 0);

  const saldoVentasPendArs = ventasFiltradas.reduce((acc, v) => acc + v.saldo_pendiente, 0);
  const totalCobradoArs = cobrosFiltrados.reduce((acc, c) => acc + c.importe, 0);

  const totalComprasArs = comprasFiltradas.reduce((acc, c) => acc + c.importe_total, 0);
  const totalComprasUsd = comprasFiltradas.reduce((acc, c) => acc + (c.importe_total_usd || convertirArsAUsd(c.importe_total, c.tipo_cambio || tipoCambioOficial)), 0);

  const saldoComprasPendArs = comprasFiltradas.reduce((acc, c) => acc + c.saldo_pendiente, 0);
  const totalPagadoArs = pagosFiltrados.reduce((acc, p) => acc + p.importe, 0);

  // Cuadro de Resumen Ejecutivo
  let startY = 57;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 19, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, startY, 182, 19, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70); // Verde ingresos
  doc.text(`Ingresos Totales por Ventas: $${Math.round(totalVentasArs).toLocaleString('es-AR')} ARS (US$ ${totalVentasUsd.toFixed(2)})`, 18, startY + 5);

  doc.setTextColor(180, 83, 9); // Ámbar cobranzas
  doc.text(`Total Cobrado: $${Math.round(totalCobradoArs).toLocaleString('es-AR')} ARS | A Cobrar: $${Math.round(saldoVentasPendArs).toLocaleString('es-AR')} ARS`, 18, startY + 10);

  doc.setTextColor(190, 24, 93); // Rojo compras
  doc.text(`Compras Totales de Insumos: $${Math.round(totalComprasArs).toLocaleString('es-AR')} ARS (US$ ${totalComprasUsd.toFixed(2)})`, 18, startY + 14);

  doc.setTextColor(71, 85, 105);
  doc.text(`Total Pagado: $${Math.round(totalPagadoArs).toLocaleString('es-AR')} ARS | A Pagar: $${Math.round(saldoComprasPendArs).toLocaleString('es-AR')} ARS`, 18, startY + 18);

  startY += 24;

  // TABLA 1: LIBRO DE VENTAS DE HACIENDA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ventas de Hacienda Registradas', 14, startY);

  const ventasTableBody = ventasFiltradas.length > 0
    ? ventasFiltradas.map(v => {
        const ter = state.terceros.find(t => t.id_tercero === v.id_tercero);
        const sub = state.subunidades.find(s => s.id_subunidad === v.id_subunidad);
        const tcOp = v.tipo_cambio || tipoCambioOficial;
        const totalUsd = v.importe_total_usd || convertirArsAUsd(v.importe_total, tcOp);
        const saldoUsd = convertirArsAUsd(v.saldo_pendiente, tcOp);

        const importeMostrar = monedaVisualizacion === 'USD'
          ? `US$ ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
          : `$${Math.round(v.importe_total).toLocaleString('es-AR')}`;

        const saldoMostrar = monedaVisualizacion === 'USD'
          ? `US$ ${saldoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
          : `$${Math.round(v.saldo_pendiente).toLocaleString('es-AR')}`;

        return [
          v.comprobante_nro,
          formatFechaArg(v.fecha),
          sub?.nombre || v.id_subunidad,
          ter?.razon_social || v.id_tercero,
          `${v.moneda || 'ARS'} (TC $${tcOp})`,
          importeMostrar,
          saldoMostrar,
          v.estado_cobro
        ];
      })
    : [['Sin registros', '-', '-', '-', '-', '-', '-', 'No se encontraron ventas con los filtros aplicados.']];

  autoTable(doc, {
    startY: startY + 3,
    head: [['Comprobante', 'Fecha', 'Subunidad', 'Cliente', 'Moneda / TC', `Total (${monedaVisualizacion})`, `Saldo Pend.`, 'Estado']],
    body: ventasTableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18 },
      2: { cellWidth: 22 },
      3: { cellWidth: 34 },
      4: { cellWidth: 24 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 'auto', halign: 'center' },
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // TABLA 2: LIBRO DE COMPRAS DE INSUMOS
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Compras de Insumos', 14, currentY);

  const comprasTableBody = comprasFiltradas.length > 0
    ? comprasFiltradas.map(c => {
        const ter = state.terceros.find(t => t.id_tercero === c.id_tercero);
        const tcOp = c.tipo_cambio || tipoCambioOficial;
        const totalUsd = c.importe_total_usd || convertirArsAUsd(c.importe_total, tcOp);
        const saldoUsd = convertirArsAUsd(c.saldo_pendiente, tcOp);

        const importeMostrar = monedaVisualizacion === 'USD'
          ? `US$ ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
          : `$${Math.round(c.importe_total).toLocaleString('es-AR')}`;

        const saldoMostrar = monedaVisualizacion === 'USD'
          ? `US$ ${saldoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
          : `$${Math.round(c.saldo_pendiente).toLocaleString('es-AR')}`;

        return [
          c.comprobante_nro,
          formatFechaArg(c.fecha),
          c.comprobante_tipo,
          ter?.razon_social || c.id_tercero,
          `${c.moneda || 'ARS'} (TC $${tcOp})`,
          importeMostrar,
          saldoMostrar,
          c.estado_pago
        ];
      })
    : [['Sin registros', '-', '-', '-', '-', '-', '-', 'No se encontraron compras en el período.']];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Comprobante', 'Fecha', 'Tipo', 'Proveedor', 'Moneda / TC', `Total (${monedaVisualizacion})`, `Saldo Pend.`, 'Estado']],
    body: comprasTableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
      3: { cellWidth: 38 },
      4: { cellWidth: 24 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 'auto', halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // TABLA 3: DISTRIBUCIÓN DE COSTOS INDIRECTOS Y DIRECTOS POR SUBUNIDAD
  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Distribución de Costos por Subunidad de Negocio', 14, currentY);

  const costosFiltrados = state.costos.filter(c => c.id_campania === selectedCampania && (isTestMode ? true : !c.es_prueba));

  const distTableBody = costosFiltrados.length > 0
    ? costosFiltrados.map(costo => {
        const dists = state.distribuciones_costos.filter(d => d.id_costo === costo.id_costo);
        const distCria = dists.find(d => d.id_subunidad === 'SUB-CRIA')?.importe_asignado || 0;
        const distRecria = dists.find(d => d.id_subunidad === 'SUB-REC')?.importe_asignado || 0;
        const distEngorde = dists.find(d => d.id_subunidad === 'SUB-ENG')?.importe_asignado || 0;

        const formatVal = (val: number) => monedaVisualizacion === 'USD'
          ? `US$ ${convertirArsAUsd(val, tipoCambioOficial).toFixed(2)}`
          : `$${Math.round(val).toLocaleString('es-AR')}`;

        return [
          costo.concepto,
          costo.clasificacion,
          formatVal(costo.importe_total),
          formatVal(distCria),
          formatVal(distRecria),
          formatVal(distEngorde)
        ];
      })
    : [['Sin costos registrados', '-', '-', '-', '-', 'No se encontraron asignaciones de costos en la campaña.']];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Concepto del Costo', 'Clasificación', `Total (${monedaVisualizacion})`, 'Asig. Cría', 'Asig. Recría', 'Asig. Engorde/Cabaña']],
    body: distTableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 54 },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 'auto', halign: 'right' },
    },
  });

  // Espacio para firmas institucionales al pie
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 260) {
    doc.setDrawColor(148, 163, 184);
    doc.line(20, finalY + 12, 80, finalY + 12);
    doc.line(130, finalY + 12, 190, finalY + 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Firma Administración Económica / Tesorería', 20, finalY + 16);
    doc.text('Firma Responsable Contable RT 54 / UNRC', 132, finalY + 16);
  }

  renderFooter(doc);

  const safeSub = meta.subunidadCodigo.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeCamp = meta.campaniaCodigo.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `Reporte_Operaciones_Economicas_${safeSub}_${safeCamp}_${getFechaArgentinaISO()}.pdf`;
  doc.save(fileName);
}

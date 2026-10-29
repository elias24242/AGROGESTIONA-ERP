/**
 * ERP Ovinos - Establecimiento Pozo del Carril (UNRC)
 * Servicio de Exportación Global a Archivos Excel (.xlsx) usando SheetJS (XLSX)
 * Facilita el análisis zootécnico, sanitario y económico externo del establecimiento.
 */

import * as XLSX from 'xlsx';
import { DatabaseState } from './sheetsService';
import { Usuario } from '../types/erp';
import { calculateStock } from './businessEngine';
import { formatFechaArg, formatHoraArg, getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';
import { convertirArsAUsd } from './currencyService';

export interface ExportExcelOptions {
  state: DatabaseState;
  currentUser: Usuario;
  selectedSubunidad: string;
  selectedCampania: string;
  isTestMode: boolean;
  monedaVisualizacion?: 'ARS' | 'USD';
  tipoCambioOficial?: number;
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  resumen: {
    totalCabezas: number;
    totalMovimientos: number;
    totalConsumos: number;
    totalSanidad: number;
    totalProduccion: number;
  };
  error?: string;
}

/**
 * Exporta todos los datos filtrados (Majada, Consumos, Sanidad y Producción)
 * a un archivo Excel (.xlsx) multihistorial formateado profesionalmente.
 */
export function exportarDatosFiltradosExcel({
  state,
  currentUser,
  selectedSubunidad,
  selectedCampania,
  isTestMode,
  monedaVisualizacion = 'ARS',
  tipoCambioOficial = 1420.0,
}: ExportExcelOptions): ExportResult {
  try {
    const now = new Date();
    const fechaEmisionStr = formatFechaArg(now);
    const horaEmisionStr = formatHoraArg(now);
    const fechaIsoStr = getFechaArgentinaISO();

    // Obtener nombres amigables de filtros
    const subObj = state.subunidades.find(s => s.id_subunidad === selectedSubunidad);
    const subunidadNombre =
      selectedSubunidad === 'TODOS'
        ? 'Consolidado Ovinos (Todas las Subunidades)'
        : (subObj?.nombre || selectedSubunidad);

    const campObj = state.campanias.find(c => c.id_campania === selectedCampania);
    const campaniaNombre = campObj
      ? `Campaña ${campObj.codigo} (${campObj.anio_inicio}-${campObj.anio_fin || campObj.anio_inicio})`
      : selectedCampania;

    // 1. Filtrar Datos de Majada (Stock y Movimientos)
    const stockCalculado = calculateStock(state, {
      id_subunidad: selectedSubunidad !== 'TODOS' ? selectedSubunidad : undefined,
      includePruebas: isTestMode,
    });

    const movimientosFiltrados = state.movimientos.filter(m => {
      if (m.anulado) return false;
      if (!isTestMode && m.es_prueba) return false;
      const matchCamp = m.id_campania === selectedCampania;
      const matchSub =
        selectedSubunidad === 'TODOS' ||
        m.id_subunidad_origen === selectedSubunidad ||
        m.id_subunidad_destino === selectedSubunidad;
      return matchCamp && matchSub;
    });

    // 2. Filtrar Datos de Consumos
    const consumosFiltrados = state.consumos.filter(c => {
      if (!isTestMode && c.es_prueba) return false;
      const matchCamp = c.id_campania === selectedCampania;
      const matchSub = selectedSubunidad === 'TODOS' || c.id_subunidad === selectedSubunidad;
      return matchCamp && matchSub;
    });

    // 3. Filtrar Datos de Sanidad
    const sanidadFiltrada = state.sanidad.filter(s => {
      if (!isTestMode && s.es_prueba) return false;
      const matchCamp = s.id_campania === selectedCampania;
      const matchSub = selectedSubunidad === 'TODOS' || s.id_subunidad === selectedSubunidad;
      return matchCamp && matchSub;
    });

    // 4. Filtrar Datos de Producción Física
    const produccionFiltrada = state.produccion.filter(p => {
      if (!isTestMode && p.es_prueba) return false;
      const matchCamp = p.id_campania === selectedCampania;
      const matchSub = selectedSubunidad === 'TODOS' || p.id_subunidad === selectedSubunidad;
      return matchCamp && matchSub;
    });

    // Crear Workbook
    const wb = XLSX.utils.book_new();

    // ----------------------------------------------------
    // HOJA 1: Portada_Resumen
    // ----------------------------------------------------
    const rowsPortada: (string | number)[][] = [
      ['ESTABLECIMIENTO POZO DEL CARRIL — UNIVERSIDAD NACIONAL DE RÍO CUARTO (UNRC)'],
      ['SISTEMA ERP INTEGRAL DE GESTIÓN OVINA — INFORME OFICIAL DE EXPORTACIÓN'],
      [''],
      ['PARÁMETROS Y METADATOS DEL REPORTE'],
      ['Establecimiento', 'Establecimiento Pozo del Carril (UNRC)'],
      ['Unidad Académica', 'Taller de Práctica Profesional - Ovinos'],
      ['Subunidad Filtrada', subunidadNombre],
      ['Código Subunidad', selectedSubunidad],
      ['Campaña Filtrada', campaniaNombre],
      ['Código Campaña', selectedCampania],
      ['Fecha de Emisión', `${fechaEmisionStr} a las ${horaEmisionStr} hs (ART)`],
      ['Usuario Emisor', `${currentUser.nombre_completo} (@${currentUser.username})`],
      ['Rol de Seguridad (RBAC)', currentUser.rol_nombre],
      ['Modo de Datos', isTestMode ? 'MODO PRUEBAS / SANDBOX' : 'PRODUCCIÓN REAL / CORTE OFICIAL'],
      ['Moneda de Análisis', `${monedaVisualizacion} (Tipo de Cambio Oficial: $ ${tipoCambioOficial.toLocaleString('es-AR')} ARS/USD)`],
      [''],
      ['RESUMEN EJECUTIVO DE DATOS FILTRADOS'],
      ['Concepto', 'Cantidad / Valor', 'Unidad'],
      ['Existencias Totales de Hacienda', stockCalculado.totalCabezas, 'cabezas'],
      ['Movimientos de Hacienda en Período', movimientosFiltrados.length, 'registros'],
      ['Registros de Consumos Reales', consumosFiltrados.length, 'registros'],
      [
        'Total Costo de Consumos Directos (ARS)',
        Math.round(consumosFiltrados.reduce((acc, c) => acc + (c.costo_total_real || 0), 0)),
        '$ ARS'
      ],
      [
        'Total Costo de Consumos Directos (USD)',
        Number(consumosFiltrados.reduce((acc, c) => acc + convertirArsAUsd(c.costo_total_real || 0, tipoCambioOficial), 0).toFixed(2)),
        'US$ USD'
      ],
      ['Tratamientos Sanitarios Aplicados', sanidadFiltrada.length, 'aplicaciones'],
      ['Total Cabezas Tratadas en Sanidad', sanidadFiltrada.reduce((acc, s) => acc + s.cabezas_tratadas, 0), 'cabezas acumuladas'],
      ['Registros de Producción Física', produccionFiltrada.length, 'registros'],
      [''],
      ['Nota:', 'Este archivo fue generado automáticamente con la librería XLSX para auditoría y análisis externo.']
    ];

    const wsPortada = XLSX.utils.aoa_to_sheet(rowsPortada);
    wsPortada['!cols'] = [{ wch: 38 }, { wch: 45 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsPortada, 'Portada_Resumen');

    // ----------------------------------------------------
    // HOJA 2: Majada_Existencias
    // ----------------------------------------------------
    const headersExistencias = [
      'Subunidad Código',
      'Subunidad Nombre',
      'Categoría Código',
      'Categoría Nombre',
      'Lote',
      'Cabezas Actuales',
      '% s/ Total Filtrado',
      'Es Reproductor',
    ];

    const dataExistencias = Object.entries(stockCalculado.porCategoria).map(([catId, info]) => {
      const catObj = state.categorias.find(c => c.id_categoria === catId);
      const subObjCat = state.subunidades.find(s => s.id_subunidad === info.subunidad_id);
      const porcentaje = stockCalculado.totalCabezas > 0 ? (info.cabezas / stockCalculado.totalCabezas) * 100 : 0;

      return [
        info.subunidad_id,
        subObjCat?.nombre || info.subunidad_nombre,
        catId,
        info.nombre,
        'LOT001',
        info.cabezas,
        `${porcentaje.toFixed(1)}%`,
        catObj?.es_reproductor ? 'SÍ (Activo Biológico)' : 'NO',
      ];
    });

    // Fila de Total Majada
    dataExistencias.push([
      selectedSubunidad,
      subunidadNombre,
      'TOTAL',
      'TOTAL EXISTENCIAS MAJADA',
      'LOT001',
      stockCalculado.totalCabezas,
      '100.0%',
      '-',
    ]);

    const wsExistencias = XLSX.utils.aoa_to_sheet([headersExistencias, ...dataExistencias]);
    wsExistencias['!cols'] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
      { wch: 32 },
      { wch: 12 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsExistencias, 'Majada_Existencias');

    // ----------------------------------------------------
    // HOJA 3: Majada_Movimientos
    // ----------------------------------------------------
    const headersMovimientos = [
      'ID Movimiento',
      'Fecha',
      'Campaña Código',
      'Tipo Movimiento',
      'Subunidad Origen',
      'Subunidad Destino',
      'Categoría Origen',
      'Categoría Destino',
      'Cabezas',
      'Kg Vivo Total',
      'Motivo / Observaciones',
      'Usuario',
      'Modo',
    ];

    const dataMovimientos = movimientosFiltrados.map(m => {
      const camp = state.campanias.find(c => c.id_campania === m.id_campania);
      const subOrig = state.subunidades.find(s => s.id_subunidad === m.id_subunidad_origen);
      const subDest = state.subunidades.find(s => s.id_subunidad === m.id_subunidad_destino);
      const catOrig = state.categorias.find(c => c.id_categoria === m.id_categoria_origen);
      const catDest = state.categorias.find(c => c.id_categoria === m.id_categoria_destino);
      const usr = state.usuarios.find(u => u.id_usuario === m.usuario_id);

      return [
        m.id_movimiento,
        m.fecha,
        camp?.codigo || m.id_campania,
        m.tipo,
        subOrig ? subOrig.nombre : (m.id_subunidad_origen || '-'),
        subDest ? subDest.nombre : (m.id_subunidad_destino || '-'),
        catOrig ? catOrig.nombre : (m.id_categoria_origen || '-'),
        catDest ? catDest.nombre : (m.id_categoria_destino || '-'),
        m.cabezas,
        m.kg_vivo_total || 0,
        m.motivo || '',
        usr ? `${usr.nombre_completo} (@${usr.username})` : (m.usuario_id || 'admin'),
        m.es_prueba ? 'PRUEBA' : 'OFICIAL',
      ];
    });

    const wsMovimientos = XLSX.utils.aoa_to_sheet([headersMovimientos, ...dataMovimientos]);
    wsMovimientos['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 26 },
      { wch: 26 },
      { wch: 12 },
      { wch: 14 },
      { wch: 40 },
      { wch: 24 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Majada_Movimientos');

    // ----------------------------------------------------
    // HOJA 4: Consumos_Insumos
    // ----------------------------------------------------
    const headersConsumos = [
      'ID Consumo',
      'Fecha',
      'Campaña Código',
      'Subunidad',
      'Insumo Código',
      'Insumo Nombre',
      'Tipo Insumo',
      'Cantidad Real',
      'Unidad Medida',
      'Cantidad Esperada (Dosis)',
      'Desvío Físico (Real - Esp)',
      '% Desvío',
      'Costo Unitario ($ ARS)',
      'Costo Total ($ ARS)',
      'Costo Total (US$ USD)',
      'Estado Precio',
      'Origen Evento',
      'Usuario',
    ];

    const dataConsumos = consumosFiltrados.map(c => {
      const ins = state.insumos.find(i => i.id_insumo === c.id_insumo);
      const sub = state.subunidades.find(s => s.id_subunidad === c.id_subunidad);
      const camp = state.campanias.find(cp => cp.id_campania === c.id_campania);
      const usr = state.usuarios.find(u => u.id_usuario === c.usuario_id);
      const desvioPorc = c.cantidad_esperada > 0 ? (c.desvio_cantidad / c.cantidad_esperada) * 100 : 0;
      const costoUsd = convertirArsAUsd(c.costo_total_real || 0, tipoCambioOficial);

      return [
        c.id_consumo,
        c.fecha,
        camp?.codigo || c.id_campania,
        sub ? sub.nombre : c.id_subunidad,
        ins?.codigo || c.id_insumo,
        ins?.nombre || 'Insumo',
        ins?.tipo || 'GENERAL',
        c.cantidad_real,
        ins?.um_codigo || 'UN',
        c.cantidad_esperada,
        c.desvio_cantidad,
        `${desvioPorc >= 0 ? '+' : ''}${desvioPorc.toFixed(1)}%`,
        c.costo_unitario_real,
        c.costo_total_real,
        Number(costoUsd.toFixed(2)),
        c.estado_precio,
        c.origen_evento,
        usr ? `${usr.nombre_completo} (@${usr.username})` : (c.usuario_id || 'admin'),
      ];
    });

    const wsConsumos = XLSX.utils.aoa_to_sheet([headersConsumos, ...dataConsumos]);
    wsConsumos['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsConsumos, 'Consumos_Insumos');

    // ----------------------------------------------------
    // HOJA 5: Sanidad_Tratamientos
    // ----------------------------------------------------
    const headersSanidad = [
      'ID Aplicación',
      'Fecha',
      'Campaña Código',
      'Subunidad',
      'Categoría Ovina',
      'Medicamento / Biológico',
      'Código Insumo',
      'Diagnóstico / Motivo',
      'Cabezas Tratadas',
      'Dosis Unitaria Real',
      'Unidad Dosis',
      'Consumo Total Físico',
      'Veterinario Responsable',
      'Costo Directo ($ ARS)',
      'Costo Directo (US$ USD)',
      'Usuario',
    ];

    const dataSanidad = sanidadFiltrada.map(s => {
      const ins = state.insumos.find(i => i.id_insumo === s.id_insumo);
      const sub = state.subunidades.find(subu => subu.id_subunidad === s.id_subunidad);
      const cat = state.categorias.find(c => c.id_categoria === s.id_categoria);
      const camp = state.campanias.find(cp => cp.id_campania === s.id_campania);
      const usr = state.usuarios.find(u => u.id_usuario === s.usuario_id);

      // Calcular costo directo asociado al tratamiento
      const costoUnitario = ins?.precio_promedio_ponderado || 0;
      const costoTotalArs = s.consumo_total_real * costoUnitario;
      const costoTotalUsd = convertirArsAUsd(costoTotalArs, tipoCambioOficial);

      return [
        s.id_aplicacion,
        s.fecha,
        camp?.codigo || s.id_campania,
        sub ? sub.nombre : s.id_subunidad,
        cat ? cat.nombre : s.id_categoria,
        ins?.nombre || 'Medicamento',
        ins?.codigo || s.id_insumo,
        s.diagnostico_motivo,
        s.cabezas_tratadas,
        s.dosis_unitaria_real,
        ins?.um_codigo || s.id_um_dosis,
        s.consumo_total_real,
        s.veterinario_responsable || 'No especificado',
        Math.round(costoTotalArs),
        Number(costoTotalUsd.toFixed(2)),
        usr ? `${usr.nombre_completo} (@${usr.username})` : (s.usuario_id || 'admin'),
      ];
    });

    const wsSanidad = XLSX.utils.aoa_to_sheet([headersSanidad, ...dataSanidad]);
    wsSanidad['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 32 },
      { wch: 16 },
      { wch: 36 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 28 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSanidad, 'Sanidad_Tratamientos');

    // ----------------------------------------------------
    // HOJA 6: Stock_Deposito_Insumos
    // ----------------------------------------------------
    const headersStockInsumos = [
      'Insumo Código',
      'Nombre Insumo',
      'Tipo Insumo',
      'Stock Físico Actual',
      'Unidad Medida',
      'PPP ($ ARS)',
      'PPP (US$ USD)',
      'Valuación Total ($ ARS)',
      'Valuación Total (US$ USD)',
      'Activo',
    ];

    const dataStockInsumos = state.insumos.map(ins => {
      const pppUsd = convertirArsAUsd(ins.precio_promedio_ponderado, tipoCambioOficial);
      const totalArs = ins.stock_actual * ins.precio_promedio_ponderado;
      const totalUsd = convertirArsAUsd(totalArs, tipoCambioOficial);

      return [
        ins.codigo,
        ins.nombre,
        ins.tipo,
        ins.stock_actual,
        ins.um_codigo,
        ins.precio_promedio_ponderado,
        Number(pppUsd.toFixed(2)),
        Math.round(totalArs),
        Number(totalUsd.toFixed(2)),
        ins.activo ? 'ACTIVO' : 'INACTIVO',
      ];
    });

    const wsStockInsumos = XLSX.utils.aoa_to_sheet([headersStockInsumos, ...dataStockInsumos]);
    wsStockInsumos['!cols'] = [
      { wch: 16 },
      { wch: 32 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStockInsumos, 'Stock_Deposito_Insumos');

    // ----------------------------------------------------
    // HOJA 7: Produccion_Fisica
    // ----------------------------------------------------
    const headersProduccion = [
      'ID Producción',
      'Fecha',
      'Campaña Código',
      'Subunidad',
      'Producto',
      'Cantidad Física',
      'Unidad Medida',
      'Lote Origen',
      'Observaciones',
      'Usuario',
    ];

    const dataProduccion = produccionFiltrada.map(p => {
      const prod = state.productos.find(pr => pr.id_producto === p.id_producto);
      const sub = state.subunidades.find(s => s.id_subunidad === p.id_subunidad);
      const camp = state.campanias.find(cp => cp.id_campania === p.id_campania);
      const usr = state.usuarios.find(u => u.id_usuario === p.usuario_id);

      return [
        p.id_produccion,
        p.fecha,
        camp?.codigo || p.id_campania,
        sub ? sub.nombre : p.id_subunidad,
        prod?.nombre || p.id_producto,
        p.cantidad,
        prod?.um_codigo || p.id_um,
        p.lote_origen,
        p.observaciones || '',
        usr ? `${usr.nombre_completo} (@${usr.username})` : (p.usuario_id || 'admin'),
      ];
    });

    const wsProduccion = XLSX.utils.aoa_to_sheet([headersProduccion, ...dataProduccion]);
    wsProduccion['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 36 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsProduccion, 'Produccion_Fisica');

    // ----------------------------------------------------
    // Generar archivo y descargar en el navegador
    // ----------------------------------------------------
    const subClean = selectedSubunidad.replace(/[^a-zA-Z0-9_-]/g, '');
    const campClean = (campObj?.codigo || selectedCampania).replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `ERP_Ovinos_PozoDelCarril_${subClean}_Campania${campClean}_${fechaIsoStr}.xlsx`;

    // Escribir a array buffer y descargar mediante Blob seguro para React en iframe
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      fileName,
      resumen: {
        totalCabezas: stockCalculado.totalCabezas,
        totalMovimientos: movimientosFiltrados.length,
        totalConsumos: consumosFiltrados.length,
        totalSanidad: sanidadFiltrada.length,
        totalProduccion: produccionFiltrada.length,
      },
    };
  } catch (error: any) {
    console.error('Error generando archivo Excel con XLSX:', error);
    return {
      success: false,
      fileName: '',
      resumen: {
        totalCabezas: 0,
        totalMovimientos: 0,
        totalConsumos: 0,
        totalSanidad: 0,
        totalProduccion: 0,
      },
      error: error?.message || 'Error desconocido al exportar a Excel',
    };
  }
}

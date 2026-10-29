/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Tipos de datos normalizados para el modelo de datos agropecuario
 */

export type RolNombre = 'ADMINISTRADOR' | 'RESPONSABLE_UNIDAD' | 'OPERADOR' | 'AUDITORIA';

export interface Usuario {
  id_usuario: string;
  username: string;
  password_hash: string;
  nombre_completo: string;
  email: string;
  id_rol: string;
  rol_nombre: RolNombre;
  activo: boolean;
  inhabilitado: boolean; // Estado explícito requerido por el sistema: true si está suspendido/inhabilitado, false si está habilitado
  pendiente_aprobacion?: boolean; // Requiere aprobación del administrador para ingresar al sistema
  permisos_personalizados?: Record<string, any>;
  fecha_alta: string;
  fecha_modificacion: string;
}

export interface Rol {
  id_rol: string;
  codigo: RolNombre;
  nombre: string;
  descripcion: string;
}

export interface Permiso {
  id_permiso: string;
  modulo: string;
  accion: 'LEER' | 'CREAR' | 'EDITAR' | 'ANULAR' | 'SINCRONIZAR' | 'ADMINISTRAR';
  descripcion: string;
}

export interface RolPermiso {
  id_rp: string;
  id_rol: string;
  id_permiso: string;
  permitido: boolean;
}

/**
 * Tabla Maestra de Especies (D_Especie)
 * PK: EspecieID (id_especie)
 * Registros Canónicos:
 * ESP001 | OVI | Ovinos
 * ESP002 | BOV | Bovinos
 * ESP003 | POR | Porcinos
 */
export interface Especie {
  id_especie: string; // ESP001 | ESP002 | ESP003
  codigo: 'OVI' | 'BOV' | 'POR' | string;
  nombre: string;
  icono?: string; // 🐑 | 🐄 | 🐖 | 📊
  activo: boolean;
  orden_visual: number;
}
export type D_Especie = Especie;
export type EspecieID = 'ESP001' | 'ESP002' | 'ESP003' | string;
export type EspecieSelectorValue = 'TODOS' | 'ESP001' | 'ESP002' | 'ESP003';

export interface UnidadNegocio {
  id_unidad: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Subunidad {
  id_subunidad: string;
  id_unidad: string;
  id_especie?: string; // FK a D_Especie (ESP001, ESP002, ESP003)
  codigo: 'CRIA' | 'RECRIA' | 'ENGORDE' | string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Campania {
  id_campania: string;
  codigo: string;
  nombre: string;
  anio_inicio: number;
  anio_fin: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface Lote {
  id_lote: string;
  id_subunidad: string;
  codigo: string; // ej: LOT001
  nombre: string;
  superficie_ha: number;
  observaciones?: string;
  activo: boolean;
}

export interface Categoria {
  id_categoria: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie (ESP001, ESP002, ESP003)
  codigo: string; // MAD, CAR, BOR, COR_DES, COR_ENG, SNC, VAC, TOR, CER, PAD, etc.
  nombre: string;
  genero: 'HEMBRA' | 'MACHO' | 'MIXTO';
  edad_meses_min: number;
  edad_meses_max: number;
  es_reproductor: boolean;
  activo: boolean;
}

export interface UnidadMedida {
  id_um: string;
  codigo: string; // CAB, KG, LITRO, DOSIS, TON, BOLSA
  nombre: string;
  tipo: 'CANTIDAD' | 'PESO' | 'VOLUMEN';
}

export interface Conversion {
  id_conversion: string;
  id_um_origen: string;
  id_um_destino: string;
  factor: number;
  fuente: string;
  fecha_vigencia: string;
}

export interface Moneda {
  id_moneda: string;
  codigo: string; // ARS, USD
  nombre: string;
  simbolo: string;
  es_moneda_base: boolean;
}

export interface Insumo {
  id_insumo: string;
  codigo: string;
  nombre: string;
  tipo: 'SANITARIO' | 'ALIMENTO' | 'FORRAJE' | 'AGROQUIMICO' | 'OTRO';
  id_um: string;
  um_codigo?: string;
  stock_actual: number;
  precio_promedio_ponderado: number;
  activo: boolean;
}

export interface Producto {
  id_producto: string;
  codigo: string;
  nombre: string;
  tipo: 'CARNE_VIVO' | 'CARNE_GANCHO' | 'LANA' | 'DESCARTE' | 'REPRODUCTOR';
  id_um: string;
  um_codigo?: string;
  activo: boolean;
}

export interface Tercero {
  id_tercero: string;
  cuit_cuil: string;
  razon_social: string;
  tipo: 'PROVEEDOR' | 'CLIENTE' | 'AMBOS';
  telefono?: string;
  email?: string;
  localidad?: string;
  activo: boolean;
}

export interface CuentaContable {
  id_cuenta: string;
  codigo_plan: string; // ej: 1.1.03.01
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO_NETO' | 'INGRESO' | 'COSTO';
  id_cuenta_padre?: string;
  activo: boolean;
}

export interface InventarioInicial {
  id_inventario: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie (ESP001, ESP002, ESP003)
  id_lote: string;
  id_categoria: string;
  fecha: string; // 2026-08-30
  cabezas: number;
  kg_vivo_total: number;
  valor_unitario: number;
  valor_total: number;
  estado_confirmacion: 'CONFIRMADO' | 'PENDIENTE_CONFIRMACION';
  observaciones?: string;
}

export type TipoMovimientoHacienda = 
  | 'INVENTARIO_INICIAL'
  | 'NACIMIENTO'
  | 'MUERTE'
  | 'VENTA'
  | 'COMPRA'
  | 'TRANSFERENCIA_SUBUNIDAD'
  | 'CAMBIO_CATEGORIA'
  | 'CONSUMO_PROPIO';

export interface MovimientoHacienda {
  id_movimiento: string;
  id_campania: string;
  id_especie?: string; // FK a D_Especie (ESP001, ESP002, ESP003)
  fecha: string;
  tipo: TipoMovimientoHacienda;
  id_subunidad_origen?: string;
  id_subunidad_destino?: string;
  id_lote_origen?: string;
  id_lote_destino?: string;
  id_categoria_origen?: string;
  id_categoria_destino?: string;
  cabezas: number;
  kg_vivo_total?: number;
  id_operacion_relacionada?: string; // id_venta, id_compra, etc.
  motivo?: string;
  anulado: boolean;
  es_prueba: boolean;
  usuario_id: string;
}

export interface Pesaje {
  id_pesaje: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie
  id_lote: string;
  id_categoria: string;
  fecha: string;
  cabezas_pesadas: number;
  kg_vivo_total: number;
  kg_vivo_promedio: number;
  tipo_peso: 'KG_VIVO' | 'KG_RES';
  observaciones?: string;
  es_prueba: boolean;
  usuario_id: string;
}

export interface Produccion {
  id_produccion: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie
  fecha: string;
  id_producto: string;
  cantidad: number;
  id_um: string;
  lote_origen?: string;
  observaciones?: string;
  es_prueba: boolean;
  usuario_id: string;
}

export interface ReferenciaRendimiento {
  id_referencia: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie
  indicador: 'PORC_PARICION' | 'PORC_DESTETE' | 'PORC_MORTANDAD_MADRES' | 'PORC_MORTANDAD_CORDERO' | 'GMD_G_DIA' | string;
  valor_referencia: number;
  unidad: '%' | 'g/dia' | 'kg/cab' | string;
  numerador_def: string;
  denominador_def: string;
  fuente: string;
  fecha_vigencia: string;
}

export interface DosisTecnica {
  id_dosis: string;
  id_insumo: string;
  id_subunidad: string;
  id_campania: string;
  id_especie?: string; // FK a D_Especie
  dosis_valor: number;
  id_um: string;
  base_aplicacion: 'POR_CAB_MADRE' | 'POR_CAB_TOTAL' | 'POR_KG_VIVO' | 'POR_HA';
  nombre_protocolo: string;
  fuente: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
}

export interface SanidadAplicacion {
  id_aplicacion: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie
  id_lote: string;
  id_categoria: string;
  id_insumo: string;
  id_dosis?: string;
  fecha: string;
  cabezas_tratadas: number;
  dosis_unitaria_real: number;
  id_um_dosis: string;
  consumo_total_real: number;
  id_consumo_asociado: string;
  id_costo_asociado: string;
  veterinario_responsable?: string;
  diagnostico_motivo: string;
  es_prueba: boolean;
  usuario_id: string;
}

export interface Consumo {
  id_consumo: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie
  id_insumo: string;
  fecha: string;
  cantidad_real: number;
  cantidad_esperada: number;
  desvio_cantidad: number;
  costo_unitario_real: number | null; // null si falta precio
  costo_total_real: number | null;   // null si falta precio
  origen_evento: 'SANIDAD' | 'ALIMENTACION' | 'MANTENIMIENTO' | 'OTRO';
  id_evento_origen?: string;
  estado_precio: 'CON_PRECIO' | 'PENDIENTE_FALTA_PRECIO';
  es_prueba: boolean;
  usuario_id: string;
}

export interface Compra {
  id_compra: string;
  id_campania: string;
  id_tercero: string;
  comprobante_tipo: 'FACTURA_A' | 'FACTURA_B' | 'REMITO' | 'TICKET';
  comprobante_nro: string;
  fecha: string;
  importe_total: number;
  saldo_pendiente: number;
  estado_pago: 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADO';
  anulado: boolean;
  es_prueba: boolean;
  usuario_id: string;
  moneda?: 'ARS' | 'USD';
  tipo_cambio?: number;
  importe_total_usd?: number;
}

export interface DetalleCompra {
  id_detalle_compra: string;
  id_compra: string;
  id_insumo: string;
  cantidad: number;
  id_um: string;
  precio_unitario: number;
  subtotal: number;
}

export interface Venta {
  id_venta: string;
  id_campania: string;
  id_subunidad: string;
  id_especie?: string; // FK a D_Especie
  id_tercero: string;
  comprobante_nro: string; // ej: VTA-2026-0001 (unificación VEN001 y OP011)
  fecha: string;
  importe_total: number;
  saldo_pendiente: number;
  estado_cobro: 'PENDIENTE' | 'COBRO_PARCIAL' | 'COBRADO';
  anulado: boolean;
  es_prueba: boolean;
  usuario_id: string;
  moneda?: 'ARS' | 'USD';
  tipo_cambio?: number;
  importe_total_usd?: number;
}

export interface DetalleVenta {
  id_detalle_venta: string;
  id_venta: string;
  id_producto: string;
  id_categoria: string;
  cabezas: number;
  kg_total: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Costo {
  id_costo: string;
  id_campania: string;
  id_cuenta: string;
  id_especie?: string; // FK a D_Especie
  id_subunidad?: string; // FK opcional a D_Subunidad
  fecha: string;
  concepto: string;
  clasificacion: 'DIRECTO' | 'INDIRECTO';
  importe_total: number;
  id_consumo_asociado?: string;
  es_prueba: boolean;
  usuario_id: string;
  moneda?: 'ARS' | 'USD';
  tipo_cambio?: number;
  importe_total_usd?: number;
}

export interface DistribucionCosto {
  id_distribucion: string;
  id_costo: string;
  id_subunidad: string;
  porcentaje: number;
  importe_asignado: number;
}

export interface Cobro {
  id_cobro: string;
  id_venta: string;
  id_cuenta_cobro: string; // ej: Banco Nación / Caja Chica
  fecha: string;
  importe: number;
  medio_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE';
  recibo_nro: string;
  es_prueba: boolean;
  usuario_id: string;
}

export interface Pago {
  id_pago: string;
  id_compra: string;
  id_cuenta_pago: string;
  fecha: string;
  importe: number;
  medio_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE';
  orden_pago_nro: string;
  es_prueba: boolean;
  usuario_id: string;
}

export interface CampoModificado {
  campo: string;
  etiqueta?: string;
  valor_anterior: any;
  valor_nuevo: any;
  tipo_dato?: 'texto' | 'numero' | 'moneda' | 'booleano' | 'fecha';
}

export interface Auditoria {
  id_auditoria: string;
  id_usuario: string;
  username: string;
  nombre_usuario?: string;
  rol_usuario?: string;
  fecha_hora: string;
  operacion: 'ALTA' | 'MODIFICACION' | 'ANULACION' | 'SINCRONIZACION';
  tabla_afectada: string;
  id_registro: string;
  valor_anterior?: string; // JSON serializado
  valor_nuevo: string;     // JSON serializado
  motivo: string;
  cambios_campos?: CampoModificado[];
}

export interface IndicadoresSubunidad {
  subunidad_id: string;
  subunidad_nombre: string;
  existencia_cabezas: number;
  ingresos_reales: number;
  costos_directos_reales: number;
  costos_indirectos_reales: number;
  margen_bruto: number;
  porcentaje_sobre_cd: number | null; // null si CD es 0
  produccion_fisica_kg: number;
  rendimiento_real: number;
  rendimiento_referencia: number | null;
  desvio_rendimiento: number | null;
  estado_precios: 'COMPLETO' | 'PENDIENTE_FALTA_PRECIO';
}

export interface IndicadoresConsolidados {
  campania_id: string;
  existencia_total_cabezas: number;
  cabezas_por_categoria: { categoria_nombre: string; cabezas: number; codigo: string }[];
  cabezas_por_subunidad: { subunidad_nombre: string; cabezas: number }[];
  ingresos_totales: number;
  costos_directos_totales: number;
  costos_indirectos_totales: number;
  margen_bruto_total: number;
  porcentaje_sobre_cd_total: number | null;
  cuentas_por_cobrar: number;
  cuentas_por_pagar: number;
  alertas: Array<{ tipo: 'DANGER' | 'WARNING' | 'INFO'; mensaje: string; modulo: string }>;
  datos_pendientes: string[];
}

export interface ConceptoGlosario {
  id_concepto: string;
  termino: string;
  categoria: 'ECONOMICO' | 'ZOOTECNICO' | 'CONTABLE' | 'SISTEMAS';
  definicion_simple: string;
  formula_o_calculo?: string;
  ejemplo_practico?: string;
  fecha_modificacion: string;
  usuario_modificacion: string;
}

export interface SesionAuditoria {
  id_sesion: string;
  id_usuario: string;
  username: string;
  nombre_completo: string;
  rol_nombre: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  fecha_cierre?: string | null;
  timestamp_inicio?: number;
  timestamp_cierre?: number;
  duracion_segundos?: number;
  duracion_minutos?: number | null;
  duracion_formateada?: string;
  dispositivo?: string;
  estado: 'ACTIVA' | 'CERRADA';
}

export type RegistroSesion = SesionAuditoria;

export interface ResumenGanaderoPorEspecie {
  especie: Especie;
  stockActual: number;
  altas: {
    nacimientos: number;
    compras: number;
    entradasTransferencia: number;
    total: number;
  };
  bajas: {
    muertes: number;
    ventas: number;
    consumoPropio: number;
    salidasTransferencia: number;
    total: number;
  };
  produccionFisicaKg: number;
  ingresosVentas: number;
  costosDirectos: number;
  costosIndirectos: number;
  costosTotales: number;
  margenBruto: number;
  tasaMortalidadPorc: number | null;
  gastosSanitarios: number;
  categoriasStock: Array<{
    categoriaId: string;
    categoriaNombre: string;
    codigo: string;
    cabezas: number;
  }>;
  indicadoresEspecificos: Array<{
    nombre: string;
    valor: string;
    unidad: string;
    estado: 'ACTIVO' | 'PENDIENTE_DEFINICION';
    observacion?: string;
  }>;
}

export interface IndicadorComparableItem {
  indicador: string;
  categoria: 'STOCK' | 'ECONOMICO' | 'ZOOTECNICO';
  ovinos: string | number;
  bovinos: string | number;
  porcinos: string | number;
  totalConsolidado: string | number;
  unidad: string;
  comparable: true;
  interpretacion: string;
}

export interface IndicadorEspecificoItem {
  especieNombre: string;
  especieCodigo: string;
  indicador: string;
  valor: string;
  unidad: string;
  estado: 'ACTIVO' | 'PENDIENTE_DEFINICION';
  justificacionNoComparable: string;
}

export interface ResumenGanaderoConsolidado {
  campaniaId: string;
  stockTotalCabezas: number;
  totalAltas: number;
  totalBajas: number;
  totalNacimientos: number;
  totalMuertes: number;
  totalVentasCabezas: number;
  totalComprasCabezas: number;
  totalTransferencias: number;
  ingresosTotales: number;
  costosTotales: number;
  margenBrutoTotal: number;
  gastosSanitariosTotales: number;
  tasaMortalidadGlobal: number | null;
  porEspecie: Record<string, ResumenGanaderoPorEspecie>;
  indicadoresComparables: IndicadorComparableItem[];
  indicadoresEspecificos: IndicadorEspecificoItem[];
  auditoriaOrigen?: {
    totalAltasAuditadas: number;
    totalBajasAuditadas: number;
    campania: string;
    desgloseEspecies: Array<{
      codigo: string;
      nombre: string;
      icono: string;
      nacimientos: number;
      compras: number;
      ventas: number;
      muertes: number;
      fuente: string;
    }>;
    aclaracionMetodologica: string;
  };
}

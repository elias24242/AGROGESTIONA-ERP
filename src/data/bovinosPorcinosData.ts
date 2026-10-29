/**
 * Datos Técnicos y Estructuras Documentadas de Bovinos y Porcinos
 * Establecimiento Pozo del Carril – La Aguada (UNRC)
 * Fuentes documentales:
 * - "Estructura Subunidades Porcinas Existencias y Costos" (Grupo 2, TPP UNRC)
 * - "Primera entrega — Parte general y específica" (Bovinos, La Aguada)
 * 
 * Cumple estrictamente con las reglas:
 * 1. Sin invención de datos (pendientes claramente identificados).
 * 2. Precios de mercado como referencias, no valuación automática contable.
 * 3. Datos históricos y ejemplos identificados como simulaciones/referencias sin alterar stock actual.
 * 4. Cuentas contables normalizadas según los documentos oficiales.
 */

export interface FasePorcina {
  id: string;
  nombreFase: string;
  categoriaSenasa: string;
  pesoReferenciaKg: string;
  periodoDias: string;
  duracionDias: number;
  cuentaContableCodigo: string;
  cuentaContableNombre: string;
  alimentacion: {
    maizPropioPct: number;
    concentradoCompradoPct: number;
    sojaPeleteadaPct: number;
    tipoConcentrado: string;
  };
  criterioValuacion: string;
}

export interface CostoDocumentadoPorcino {
  concepto: string;
  montoArs?: number;
  porcentaje?: number;
  distribucion?: string;
  observaciones: string;
  cuentaContable: string;
}

export interface FaseBovina {
  id: string;
  nombreFase: string;
  duracionDias: number;
  duracionMeses: number;
  pesoReferenciaKg: string;
  consumoDiarioKg: number;
  descripcion: string;
  eventoAsociado: string;
  criterioCambio: string;
}

export interface PrecioReferenciaBovino {
  categoria: string;
  precioArs: number;
  unidad: string;
  fecha: string;
  fuente: string;
  tipoAnimal?: 'ESPECIAL' | 'REGULAR' | 'GENERAL' | 'CONSERVA';
  rangoPeso?: string;
}

export interface CostoErogacionBovina {
  rubro: string;
  porcentaje: number;
  descripcion: string;
  observacionesCualitativas: string;
  cuentaContable?: string;
}

export interface ReconstruccionExistenciaBovina {
  categoria: string;
  stockInicial: number;
  compras: number;
  nacimientos: number;
  ingresos: number;
  egresos: number;
  ventas: number;
  muertes: number;
  stockFinal: number;
}

export interface EjemploVentaBovina {
  concepto: string;
  cabezas: number;
  pesoIndividualKg: number;
  pesoTotalKg: number;
  precioPorKgArs: number;
  importeBrutoArs: number;
  costosVenta: {
    comisionFeriaArs: number;
    fleteJaulaArs: number;
    derechosPistaPesajeArs: number;
    arancelesSenasaDteGuiasArs: number;
    totalCostosVentaArs: number;
  };
  ivaDebitoFiscalPct: number;
  ivaDebitoFiscalArs: number;
  vnrNetoArs: number;
  advertencia: string;
}

// ==========================================
// 1. DATOS DE LA UNIDAD PORCINA (GRUPO 2)
// ==========================================

export const FASES_PORCINAS: FasePorcina[] = [
  {
    id: 'POR-CRIA',
    nombreFase: 'Cría',
    categoriaSenasa: 'Lechón',
    pesoReferenciaKg: '0–15 kg',
    periodoDias: 'Día 0 al día 31 desde el nacimiento',
    duracionDias: 31,
    cuentaContableCodigo: '1.3.03.01',
    cuentaContableNombre: 'Lechones',
    alimentacion: {
      maizPropioPct: 0,
      concentradoCompradoPct: 100,
      sojaPeleteadaPct: 0,
      tipoConcentrado: 'Concentrado comprado preiniciador (100%)',
    },
    criterioValuacion: 'Costo de producción acumulado',
  },
  {
    id: 'POR-DESTETE',
    nombreFase: 'Destete',
    categoriaSenasa: 'Cachorro / Cachorra',
    pesoReferenciaKg: '15–50 kg',
    periodoDias: 'Día 31 al día 86',
    duracionDias: 55,
    cuentaContableCodigo: '1.3.03.02',
    cuentaContableNombre: 'Cachorro',
    alimentacion: {
      maizPropioPct: 80,
      concentradoCompradoPct: 10,
      sojaPeleteadaPct: 10,
      tipoConcentrado: 'Concentrado comprado de desarrollo (10%)',
    },
    criterioValuacion: 'Costo de producción acumulado, incluido costo transferido desde Cría ($26.377.259,25 de referencia)',
  },
  {
    id: 'POR-ENGORDE',
    nombreFase: 'Engorde / Terminación',
    categoriaSenasa: 'Capón terminado',
    pesoReferenciaKg: '50–105 kg',
    periodoDias: 'Día 86 al día 165',
    duracionDias: 79,
    cuentaContableCodigo: '1.3.03.03',
    cuentaContableNombre: 'Capones terminados',
    alimentacion: {
      maizPropioPct: 70,
      concentradoCompradoPct: 0,
      sojaPeleteadaPct: 30,
      tipoConcentrado: 'Sin concentrado comprado comercial',
    },
    criterioValuacion: 'Valor Neto de Realización (VNR) con referencia cotización ROSPORC',
  },
];

export const COSTOS_PORCINOS_DOCUMENTADOS: CostoDocumentadoPorcino[] = [
  {
    concepto: 'Alimentación Porcina Integral',
    porcentaje: 78,
    observaciones: 'Representa aproximadamente el 78% del costo total de producción porcina.',
    cuentaContable: '4.3.01 / 4.3.02 / 4.3.03',
  },
  {
    concepto: 'Mano de Obra Directa (MOD)',
    montoArs: 3000000,
    distribucion: '60% Cría ($1.800.000), 30% Destete ($900.000) y 10% Engorde ($300.000)',
    observaciones: 'Estimación técnica del grupo según la intensidad del manejo en cada etapa.',
    cuentaContable: '4.3.06',
  },
  {
    concepto: 'Energía Eléctrica',
    montoArs: 800000,
    distribucion: '100% Cría (Maternidad y lámparas infrarrojas)',
    observaciones: 'Asignados íntegramente a la fase de Cría por requerimiento térmico de los lechones.',
    cuentaContable: '4.3.08',
  },
  {
    concepto: 'Inseminación Artificial y Genética',
    montoArs: 1487500,
    distribucion: 'Prorrateo en plantel reproductor activo',
    observaciones: 'Incluida en el prorrateo del plantel reproductor; vida útil productiva estimada de 3,5 años.',
    cuentaContable: '4.3.07',
  },
  {
    concepto: 'Transferencia de costos de Cría a Destete',
    montoArs: 26377259.25,
    distribucion: 'Transferencia entre etapas productivas',
    observaciones: 'Costo acumulado que se traslada con los animales al salir de maternidad hacia recría.',
    cuentaContable: '1.3.03.02 (Activo) / 4.3 (Costo)',
  },
];

export const CUENTAS_CONTABLES_PORCINAS = [
  { codigo: '1.3.03', nombre: 'Existencias: hacienda porcina', tipo: 'ACTIVO_BIOLOGICO_VENTA' },
  { codigo: '1.3.03.01', nombre: 'Lechones (0–15 kg)', tipo: 'ACTIVO_BIOLOGICO_VENTA' },
  { codigo: '1.3.03.02', nombre: 'Cachorros / Cachorras (15–50 kg)', tipo: 'ACTIVO_BIOLOGICO_VENTA' },
  { codigo: '1.3.03.03', nombre: 'Capones terminados (50–105 kg)', tipo: 'ACTIVO_BIOLOGICO_VENTA' },
  { codigo: '1.4.01', nombre: 'Plantel de madres porcinas en producción', tipo: 'ACTIVO_BIOLOGICO_REPRODUCTOR' },
  { codigo: '1.4.02', nombre: 'Padrillos porcinos reproductores', tipo: 'ACTIVO_BIOLOGICO_REPRODUCTOR' },
  { codigo: '1.4.03', nombre: 'Amortización acumulada reproductores porcinos', tipo: 'REGULARIZADORA_ACTIVO' },
  { codigo: '1.4.04', nombre: 'Cerdas de descarte', tipo: 'ACTIVO_DESCARTE' },
  { codigo: '1.4.05', nombre: 'Padrillos de descarte', tipo: 'ACTIVO_DESCARTE' },
  { codigo: '4.3', nombre: 'Costos ganadería porcina', tipo: 'RESULTADO_NEGATIVO' },
  { codigo: '4.3.01.01', nombre: 'Maíz propio — Madres', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.01.02', nombre: 'Maíz propio — Engorde', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.01.03', nombre: 'Maíz propio — Destete', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.02.01', nombre: 'Concentrado preiniciador — Lechones', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.02.02', nombre: 'Concentrado desarrollo — Destete', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.03.01', nombre: 'Soja peleteada — Destete', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.03.02', nombre: 'Soja peleteada — Engorde', tipo: 'COSTO_ALIMENTACION' },
  { codigo: '4.3.04', nombre: 'Sanidad: vacunas y tratamientos porcinos', tipo: 'COSTO_SANIDAD' },
  { codigo: '4.3.06', nombre: 'Mano de obra directa porcina', tipo: 'COSTO_LABORAL' },
  { codigo: '4.3.07', nombre: 'Amortización / prorrateo plantel reproductor porcino', tipo: 'COSTO_AMORTIZACION' },
  { codigo: '4.3.08', nombre: 'Energía eléctrica porcina', tipo: 'COSTO_ENERGIA' },
  { codigo: '4.3.09', nombre: 'Comercialización porcina', tipo: 'GASTO_COMERCIAL' },
  { codigo: '4.3.10', nombre: 'Mortandad porcina (subcuentas por fase)', tipo: 'PERDIDA_EXTRAORDINARIA' },
  { codigo: '4.3.11', nombre: 'Mantenimiento de instalaciones porcinas', tipo: 'COSTO_MANTENIMIENTO' },
  { codigo: '4.3.12', nombre: 'Costo de mercadería vendida — Porcinos', tipo: 'COSTO_VENTAS' },
];

// ==========================================
// 2. DATOS DE LA UNIDAD BOVINA (LA AGUADA)
// ==========================================

export const FASES_BOVINAS: FaseBovina[] = [
  {
    id: 'BOV-CRIA',
    nombreFase: 'Cría Bovina',
    duracionDias: 180,
    duracionMeses: 6,
    pesoReferenciaKg: 'Hasta 160 kg',
    consumoDiarioKg: 10,
    descripcion: 'Lactancia al pie de la madre, pasturas y rastrojos, hasta alcanzar el peso de destete.',
    eventoAsociado: 'Parición',
    criterioCambio: 'Destete por peso (160 kg) o edad (6 meses)',
  },
  {
    id: 'BOV-RECRIA',
    nombreFase: 'Recría',
    duracionDias: 120,
    duracionMeses: 4,
    pesoReferenciaKg: '160–280 kg',
    consumoDiarioKg: 6,
    descripcion: 'Crecimiento en pasturas de alfalfa, con aporte de fibra para desarrollar estructura ósea sin engrase.',
    eventoAsociado: 'Destete',
    criterioCambio: 'Alcanzar 280 kg o 10 meses de vida',
  },
  {
    id: 'BOV-ADAPT',
    nombreFase: 'Adaptación Ruminal',
    duracionDias: 30,
    duracionMeses: 1,
    pesoReferenciaKg: '280–320 kg',
    consumoDiarioKg: 7,
    descripcion: 'Acostumbramiento ruminal progresivo, incorporando maíz y rollos para prevenir acidosis y timpanismo.',
    eventoAsociado: 'Ingreso a corral',
    criterioCambio: 'Por kilogramo (320 kg) o por tiempo (30 días)',
  },
  {
    id: 'BOV-ENGORDE',
    nombreFase: 'Engorde / Terminación',
    duracionDias: 60,
    duracionMeses: 2,
    pesoReferenciaKg: '320–450 kg',
    consumoDiarioKg: 10,
    descripcion: 'Alimentación intensiva en corral con ración balanceada de maíz, soja y concentrado hasta terminación comercial.',
    eventoAsociado: 'Venta o faena',
    criterioCambio: 'Por kilogramo (450 kg) o por tiempo (60 días)',
  },
];

export const CATEGORIAS_BOVINAS_OFICIALES = [
  { codigo: 'VAC', nombre: 'Vacas', senasa: 'Vaca', esReproductor: true },
  { codigo: 'VAC_SEC', nombre: 'Vacas secas', senasa: 'Vaca', esReproductor: true },
  { codigo: 'VAC_PRE', nombre: 'Vacas preñadas', senasa: 'Vaca', esReproductor: true },
  { codigo: 'VAQ_1', nombre: 'Vaquillona 1', senasa: 'Vaquillona', esReproductor: false },
  { codigo: 'VAQ_2', nombre: 'Vaquillona 2', senasa: 'Vaquillona', esReproductor: false },
  { codigo: 'TER_M', nombre: 'Terneros', senasa: 'Ternero', esReproductor: false },
  { codigo: 'TER_H', nombre: 'Terneras', senasa: 'Ternera', esReproductor: false },
  { codigo: 'DES', nombre: 'Destete', senasa: 'Ternero/a destetado', esReproductor: false },
  { codigo: 'NOV_TOS', nombre: 'Novillitos', senasa: 'Novillito', esReproductor: false },
  { codigo: 'NOV', nombre: 'Novillos', senasa: 'Novillo', esReproductor: false },
  { codigo: 'TOR', nombre: 'Toros', senasa: 'Toro', esReproductor: true },
  { codigo: 'TOR_TOS', nombre: 'Toritos', senasa: 'Torito', esReproductor: false },
];

export const PRECIOS_REFERENCIA_BOVINOS_MAG: PrecioReferenciaBovino[] = [
  {
    categoria: 'Vaquillona',
    precioArs: 4662.75,
    unidad: '$/kg',
    fecha: '08/09 (Sin año explícito en origen)',
    fuente: 'Mercado Agroganadero (MAG Cañuelas)',
    tipoAnimal: 'GENERAL',
  },
  {
    categoria: 'Vaca',
    precioArs: 3354.18,
    unidad: '$/kg',
    fecha: '08/09 (Sin año explícito en origen)',
    fuente: 'Mercado Agroganadero (MAG Cañuelas)',
    tipoAnimal: 'GENERAL',
  },
  {
    categoria: 'Toro',
    precioArs: 3429.47,
    unidad: '$/kg',
    fecha: '08/09 (Sin año explícito en origen)',
    fuente: 'Mercado Agroganadero (MAG Cañuelas)',
    tipoAnimal: 'GENERAL',
  },
  {
    categoria: 'Novillo',
    precioArs: 4496.34,
    unidad: '$/kg',
    fecha: '08/09 (Sin año explícito en origen)',
    fuente: 'Mercado Agroganadero (MAG Cañuelas)',
    tipoAnimal: 'GENERAL',
  },
  {
    categoria: 'Ternero',
    precioArs: 0,
    unidad: '$/kg',
    fecha: '08/09',
    fuente: 'Mercado Agroganadero (MAG Cañuelas)',
    tipoAnimal: 'GENERAL',
    rangoPeso: 'Sin precio consignado en tabla original',
  },
];

export const PRECIOS_REFERENCIA_BOVINOS_CONSIGNATARIAS: PrecioReferenciaBovino[] = [
  { categoria: 'Novillos especiales jóvenes', rangoPeso: '> 430 kg', precioArs: 4262, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Novillos regulares', rangoPeso: '<= 430 kg', precioArs: 3841, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
  { categoria: 'Novillos regulares', rangoPeso: '> 430 kg', precioArs: 3918, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
  { categoria: 'Novillitos especiales', rangoPeso: '<= 390 kg', precioArs: 4516, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Novillitos especiales', rangoPeso: '> 390 kg', precioArs: 4401, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Novillitos regulares', rangoPeso: 'General', precioArs: 4132, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
  { categoria: 'Vaquillonas especiales', rangoPeso: '<= 390 kg', precioArs: 4521, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Vaquillonas especiales', rangoPeso: '> 390 kg', precioArs: 3912, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Vaquillonas regulares', rangoPeso: 'General', precioArs: 3786, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
  { categoria: 'Vacas especiales jóvenes', rangoPeso: '<= 430 kg', precioArs: 2966, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Vacas especiales jóvenes', rangoPeso: '> 430 kg', precioArs: 3424, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Vacas regulares', rangoPeso: 'General', precioArs: 2992, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
  { categoria: 'Vacas conserva buena', rangoPeso: 'General', precioArs: 2674, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'CONSERVA' },
  { categoria: 'Vacas conserva inferior', rangoPeso: 'General', precioArs: 2739, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'CONSERVA' },
  { categoria: 'Toros especiales', rangoPeso: 'General', precioArs: 3698, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'Toros regulares', rangoPeso: 'General', precioArs: 3192, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
  { categoria: 'MEJ especiales (Macho Entero Joven)', rangoPeso: '<= 430 kg', precioArs: 4165, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'ESPECIAL' },
  { categoria: 'MEJ regulares', rangoPeso: 'General', precioArs: 3471, unidad: '$/kg', fecha: '08/09', fuente: 'consignatarias.com.ar (Cañuelas)', tipoAnimal: 'REGULAR' },
];

export const COSTOS_EROGACIONES_BOVINAS: CostoErogacionBovina[] = [
  {
    rubro: 'Alimentación — granos',
    porcentaje: 70,
    descripcion: 'Maíz propio, grano de soja y concentrados energéticos.',
    observacionesCualitativas: 'Insumo determinante del costo de terminación.',
    cuentaContable: '1.3.02.01 / 4.2.01',
  },
  {
    rubro: 'Reservas forrajeras — silaje de maíz',
    porcentaje: 8,
    descripcion: 'Silaje de maíz en bolsón / puente forrajero.',
    observacionesCualitativas: 'Aporte de fibra digestible y energía voluminosa.',
    cuentaContable: '1.3.02.04',
  },
  {
    rubro: 'Reservas forrajeras — rollos de alfalfa',
    porcentaje: 7,
    descripcion: 'Rollos de pastura / alfalfa de calidad.',
    observacionesCualitativas: 'Mantenimiento ruminal y balance proteico.',
    cuentaContable: '1.3.02.05',
  },
  {
    rubro: 'Flete ganadero compartido',
    porcentaje: 5,
    descripcion: 'Transporte a feria en camión jaula.',
    observacionesCualitativas: 'Se comparte con otro productor local debido a la baja escala del lote.',
    cuentaContable: '4.2.09',
  },
  {
    rubro: 'Comisiones de feria',
    porcentaje: 5,
    descripcion: 'Comisión de la casa consignataria de feria ganadera.',
    observacionesCualitativas: 'Arancel de intermediación y liquidación en remate.',
    cuentaContable: '4.2.09',
  },
  {
    rubro: 'Sanidad — honorarios veterinarios',
    porcentaje: 0,
    descripcion: 'Atención clínica y asesoramiento reproductivo.',
    observacionesCualitativas: 'Corresponden a profesionales docentes e investigadores de la UNRC ($0 arancel).',
    cuentaContable: '4.2.04',
  },
  {
    rubro: 'Sanidad — vacunación',
    porcentaje: 2,
    descripcion: 'Planes sanitarios obligatorios y preventivos.',
    observacionesCualitativas: 'Se estima en alrededor de $2.000 por vacuna por cabeza.',
    cuentaContable: '1.3.02.06 / 4.2.04',
  },
  {
    rubro: 'Mano de obra',
    porcentaje: 3,
    descripcion: 'Mantenimiento del establecimiento.',
    observacionesCualitativas: 'Se relaciona principalmente con el mantenimiento del campo: postes, varillas y alambres.',
    cuentaContable: '4.2.06',
  },
];

export const CUENTAS_CONTABLES_BOVINAS = [
  { codigo: '1.3.01.01', nombre: 'Terneros al pie de la madre', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.02', nombre: 'Terneras al pie de la madre', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.03', nombre: 'Novillitos recría a pasto', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.04', nombre: 'Novillos en adaptación ruminal', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.05', nombre: 'Novillos terminación corral (450 kg)', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.06', nombre: 'Vaquillonas descarte comercial', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.07', nombre: 'Vacas descarte (rechazo tacto)', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.01.08', nombre: 'Toros de descarte', tipo: 'EXISTENCIAS_HACIENDA' },
  { codigo: '1.3.02.01', nombre: 'Maíz grano propio almacenado', tipo: 'INSUMOS_RESERVAS' },
  { codigo: '1.3.02.02', nombre: 'Núcleo mineral y premezclas', tipo: 'INSUMOS_RESERVAS' },
  { codigo: '1.3.02.03', nombre: 'Grano de soja suplemento', tipo: 'INSUMOS_RESERVAS' },
  { codigo: '1.3.02.04', nombre: 'Silaje de maíz en bolsón', tipo: 'INSUMOS_RESERVAS' },
  { codigo: '1.3.02.05', nombre: 'Rollos de pastura / forrajes', tipo: 'INSUMOS_RESERVAS' },
  { codigo: '1.3.02.06', nombre: 'Productos veterinarios y vacunas', tipo: 'INSUMOS_RESERVAS' },
  { codigo: '1.3.03', nombre: 'Hacienda de terceros (no computable patrimonio propio)', tipo: 'CUENTAS_DE_ORDEN' },
  { codigo: '1.4.01.01', nombre: 'Vacas madres Angus PC en producción', tipo: 'ACTIVOS_BIOLOGICOS_CABANA' },
  { codigo: '1.4.01.02', nombre: 'Vaquillonas reposición para cabaña', tipo: 'ACTIVOS_BIOLOGICOS_CABANA' },
  { codigo: '1.4.01.03', nombre: 'Toros padres de cabaña', tipo: 'ACTIVOS_BIOLOGICOS_CABANA' },
];

/**
 * Reconstrucción histórica de existencias bovinas (22/06/2026 al 30/09/2026).
 * ADVERTENCIA OBLIGATORIA: El documento señala inconsistencias en la planilla original
 * entre el stock inicial y el final. Se conserva exclusivamente como dato histórico
 * de referencia y auditoría, sin reemplazar el stock operativo de Agrogestiona.
 */
export const RECONSTRUCCION_BOVINA_HISTORICA: {
  periodo: string;
  totalInicial: number;
  totalCompras: number;
  totalIngresos: number;
  totalVentas: number;
  totalMuertes: number;
  totalFinal: number;
  notaAuditoria: string;
  detalle: ReconstruccionExistenciaBovina[];
} = {
  periodo: '22/06/2026 al 30/09/2026',
  totalInicial: 129,
  totalCompras: 40,
  totalIngresos: 6,
  totalVentas: 1,
  totalMuertes: 0,
  totalFinal: 174,
  notaAuditoria: 'Existencias bovinas auditadas y validadas al 30/09/2026. Los ajustes de traspaso e inventario han sido auditados conforme a la documentación del establecimiento La Aguada. Las 174 cabezas se consolidan y computan formalmente en el stock actual confirmado e indicadores de gestión.',
  detalle: [
    { categoria: 'Vacas', stockInicial: 57, compras: 10, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 67 },
    { categoria: 'Vacas secas', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
    { categoria: 'Vacas preñadas', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
    { categoria: 'Vaquillona 1', stockInicial: 11, compras: 30, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 41 },
    { categoria: 'Vaquillona 2', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
    { categoria: 'Terneros', stockInicial: 41, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 41 },
    { categoria: 'Terneras', stockInicial: 16, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 16 },
    { categoria: 'Destete', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
    { categoria: 'Novillitos', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
    { categoria: 'Novillos', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
    { categoria: 'Toros', stockInicial: 4, compras: 0, nacimientos: 0, ingresos: 6, egresos: 0, ventas: 1, muertes: 0, stockFinal: 9 },
    { categoria: 'Toritos', stockInicial: 0, compras: 0, nacimientos: 0, ingresos: 0, egresos: 0, ventas: 0, muertes: 0, stockFinal: 0 },
  ],
};

/**
 * Ejemplo documentado de liquidación de venta bovina y valuación.
 * ADVERTENCIA OBLIGATORIA: Se conserva como ejemplo didáctico/simulación de la fuente original.
 * No constituye una venta real devengada en el ejercicio operativo.
 */
export const EJEMPLO_VENTA_BOVINA_DOCUMENTADA: EjemploVentaBovina = {
  concepto: 'Ejemplo de venta de 15 novillos terminados a corral',
  cabezas: 15,
  pesoIndividualKg: 450,
  pesoTotalKg: 6750,
  precioPorKgArs: 4496.34,
  importeBrutoArs: 30350295,
  costosVenta: {
    comisionFeriaArs: 910508.85,
    fleteJaulaArs: 1200000,
    derechosPistaPesajeArs: 151751.48,
    arancelesSenasaDteGuiasArs: 35000,
    totalCostosVentaArs: 2297260.33,
  },
  ivaDebitoFiscalPct: 10.5,
  ivaDebitoFiscalArs: 3186780.98,
  vnrNetoArs: 28053034.68,
  advertencia: 'Ejemplo documentado en la parte específica bovina. No registrado como venta real operativa para no alterar el stock ni las cuentas corrientes.',
};

/**
 * Parámetros y decisión de engorde bovino documentados
 */
export const DECISION_ENGORDE_BOVINO = {
  pesoVentaLivianoKg: 140,
  pesoObjetivoTerminadoKg: 450,
  diferenciaPesoKg: 310,
  decisionDocumentada: 'VENDER LIVIANO',
  advertenciaHojaOriginal: 'Existe error de referencia (#REF!) en la planilla de cálculo original y datos incompletos. Se conserva el resultado original de esa hoja sin validarlo como recomendación económica vigente.',
};

/**
 * Catálogo de datos pendientes de confirmación según documento
 */
export const DATOS_BOVINOS_PENDIENTES_CONFIRMACION = [
  'Cabezas por categoría a la fecha actual de cierre',
  'Terneros nacidos por año y porcentaje de destete real',
  'Precio del ternero de 140 kg con fecha y plaza',
  'Precio del novillo terminado con fecha exacta de cierre',
  'Composición de la ración y costo por kilogramo auditado',
  'Kilogramos de ración por kilogramo de peso ganado (conversión alimenticia)',
  'Gasto anual de sanidad por cabeza ejecutado',
  'Mortandad por categoría discriminada',
  'Comisiones y gastos de venta en feria vigentes',
  'Destino de reproductores y valor de venta',
  'Superficie forestada y producción de madera',
  'Criterio unificado de valuación de la hacienda en existencia',
];

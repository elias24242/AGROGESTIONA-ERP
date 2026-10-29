/**
 * AGROGESTIONA ERP - DATOS PRODUCTIVOS Y ZOOTÉCNICOS OFICIALES
 * Fuente: Inventario de Datos — Unidad Porcina y Unidad Bovina
 * Establecimiento: Pozo del Carril – La Aguada | UNRC
 */

export interface FasePorcina {
  fase: 'Cría' | 'Destete' | 'Engorde';
  categoriaSenasa: string;
  rangoPeso: string;
  periodoDias: string;
  duracionDias: number;
  cuentaContable: string;
  composicionRacion: {
    maizPropio: number;
    concentradoPreiniciador?: number;
    concentradoDesarrollo?: number;
    sojaPeleteada: number;
  };
  distribucionManoObraPct: number;
}

export interface FaseBovina {
  fase: 'Cría' | 'Recría' | 'Adaptación' | 'Engorde';
  descripcion: string;
  duracionDias: number;
  duracionMeses: number;
  consumoDiarioAlimentoKg: number;
  pesoReferenciaKg: string;
  eventoAsociado: string;
  criterioCambio: string;
}

export const DATOS_UNIDAD_PORCINA = {
  establecimiento: 'Pozo del Carril – La Aguada',
  grupo: 'Grupo 2 | Taller de Práctica Profesional UNRC',
  fasesProductivas: [
    {
      fase: 'Cría',
      categoriaSenasa: 'Lechón',
      rangoPeso: '0–15 kg',
      periodoDias: 'Día 0 al 31 desde nacimiento',
      duracionDias: 31,
      cuentaContable: '1.3.03.01 — Lechones',
      composicionRacion: {
        maizPropio: 0,
        concentradoPreiniciador: 100,
        sojaPeleteada: 0,
      },
      distribucionManoObraPct: 60,
    },
    {
      fase: 'Destete',
      categoriaSenasa: 'Cachorro/Cachorra',
      rangoPeso: '15–50 kg',
      periodoDias: 'Día 31 al 86 desde nacimiento',
      duracionDias: 55,
      cuentaContable: '1.3.03.02 — Cachorro',
      composicionRacion: {
        maizPropio: 80,
        concentradoDesarrollo: 10,
        sojaPeleteada: 10,
      },
      distribucionManoObraPct: 30,
    },
    {
      fase: 'Engorde',
      categoriaSenasa: 'Capón',
      rangoPeso: '50–105 kg',
      periodoDias: 'Día 86 al 165 desde nacimiento',
      duracionDias: 79,
      cuentaContable: '1.3.03.03 — Capones terminados',
      composicionRacion: {
        maizPropio: 70,
        concentradoDesarrollo: 0,
        sojaPeleteada: 30,
      },
      distribucionManoObraPct: 10,
    },
  ] as FasePorcina[],

  costosEImportes: {
    alimentacionPctTotal: 78, // Representa aprox 78% del costo total
    manoObraDirectaTotalArs: 3000000,
    energiaArs: 800000, // Asignados íntegramente a Cría
    inseminacionArs: 1487500, // Prorrateo del plantel reproductor
    vidaUtilProductivaPlantelAnios: 3.5,
    transferenciaCostoCriaDesteteArs: 26377259.25,
  },

  planCuentasReproductores: [
    { cuenta: '1.4.01', nombre: 'Plantel de madres', clasificacion: 'Activo biológico de producción (hembras en actividad)' },
    { cuenta: '1.4.02', nombre: 'Padrillos', clasificacion: 'Activo biológico de producción (machos en actividad)' },
    { cuenta: '1.4.03', nombre: 'Amortización acumulada de reproductores', clasificacion: 'Cuenta regularizadora de activos biológicos' },
    { cuenta: '1.4.04', nombre: 'Cerdas de descarte', clasificacion: 'Bienes retirados del plantel para comercialización' },
    { cuenta: '1.4.05', nombre: 'Padrillos de descarte', clasificacion: 'Machos retirados del plantel para comercialización' },
  ],

  criteriosValuacion: [
    { categoria: 'Lechones', criterio: 'Costo de producción acumulado' },
    { categoria: 'Cachorros/Cachorras', criterio: 'Costo acumulado incluyendo transferencia desde Cría ($26.377.259,25)' },
    { categoria: 'Capones terminados', criterio: 'Valor Neto de Realización (VNR) según ROSPORC' },
    { categoria: 'Madres y padrillos en actividad', criterio: 'Costo acumulado neto de amortización (3,5 años)' },
    { categoria: 'Cerdas y padrillos de descarte', criterio: 'Costo de producción acumulado para faena' },
  ],

  otrasPartidasCostos: [
    { cuenta: '4.3.06', nombre: 'Mano de obra directa porcina' },
    { cuenta: '4.3.07', nombre: 'Amortización / prorrateo plantel reproductor' },
    { cuenta: '4.3.08', nombre: 'Energía eléctrica unidad porcina' },
    { cuenta: '4.3.09', nombre: 'Comercialización porcina (Flete y tipificación; sin comisión por venta directa a frigorífico)' },
    { cuenta: '4.3.10', nombre: 'Mortandad porcina por fase' },
    { cuenta: '4.3.11', nombre: 'Mantenimiento de parideras y comederos' },
    { cuenta: '4.3.12', nombre: 'Costo de mercadería vendida — Porcinos' },
  ]
};

export const DATOS_UNIDAD_BOVINA = {
  establecimiento: 'Pozo del Carril – La Aguada',
  duracionCicloTotalDias: 390, // 13 meses
  fasesProductivas: [
    {
      fase: 'Cría',
      descripcion: 'Lactancia al pie de la madre sobre pasturas y rastrojos hasta alcanzar peso destete',
      duracionDias: 180,
      duracionMeses: 6,
      consumoDiarioAlimentoKg: 10,
      pesoReferenciaKg: 'Hasta 160 kg',
      eventoAsociado: 'Parición',
      criterioCambio: 'Peso o tiempo',
    },
    {
      fase: 'Recría',
      descripcion: 'Crecimiento en pasturas de alfalfa con fibra para estructura ósea sin engrase prematuro',
      duracionDias: 120,
      duracionMeses: 4,
      consumoDiarioAlimentoKg: 6,
      pesoReferenciaKg: '160–280 kg',
      eventoAsociado: 'Destete',
      criterioCambio: 'Peso o tiempo',
    },
    {
      fase: 'Adaptación',
      descripcion: 'Acostumbramiento ruminal progresivo con maíz y rollos para prevenir timpanismo',
      duracionDias: 30,
      duracionMeses: 1,
      consumoDiarioAlimentoKg: 7,
      pesoReferenciaKg: '280–320 kg',
      eventoAsociado: 'Paso a corral',
      criterioCambio: 'Criterio físico/técnico',
    },
    {
      fase: 'Engorde',
      descripcion: 'Alimentación intensiva en corral con ración de maíz, soja y concentrado hasta terminación',
      duracionDias: 60,
      duracionMeses: 2,
      consumoDiarioAlimentoKg: 10,
      pesoReferenciaKg: '320–450 kg',
      eventoAsociado: 'Terminación comercial',
      criterioCambio: 'Peso de mercado (450 kg)',
    },
  ] as FaseBovina[],

  participacionInsumosCostos: [
    { concepto: 'Alimentación — granos (Maíz propio / Soja)', porcentaje: 70 },
    { concepto: 'Reservas forrajeras — silaje de maíz en bolsón', porcentaje: 8 },
    { concepto: 'Reservas forrajeras — rollos de pastura / alfalfa', porcentaje: 7 },
    { concepto: 'Flete ganadero compartido en camión jaula', porcentaje: 5 },
    { concepto: 'Comisiones de feria y consignataria', porcentaje: 5 },
    { concepto: 'Sanidad — vacunaciones ($2.000/vacuna/cabeza)', porcentaje: 2 },
    { concepto: 'Sanidad — honorarios veterinarios (UNRC)', porcentaje: 0 },
    { concepto: 'Mano de obra (Alambrados, mangas y aguadas)', porcentaje: 3 },
  ],

  preciosReferenciaMAG: [
    { categoria: 'Vaquillona', precioKgArs: 4662.75, fuente: 'Mercado Agroganadero (MAG Cañuelas al 08/09)' },
    { categoria: 'Novillo', precioKgArs: 4496.34, fuente: 'Mercado Agroganadero' },
    { categoria: 'Novillitos', precioKgArs: 4088.37, fuente: 'Mercado Agroganadero' },
    { categoria: 'Toro', precioKgArs: 3429.47, fuente: 'Mercado Agroganadero' },
    { categoria: 'Vaca', precioKgArs: 3354.18, fuente: 'Mercado Agroganadero' },
  ],

  reconstruccionExistencias: {
    periodo: '22/06/2026 al 30/09/2026',
    stockInicialCabezas: 129,
    comprasCabezas: 40,
    ingresosCabezas: 6,
    ventasCabezas: 1,
    muertesCabezas: 0,
    stockFinalCabezas: 174,
    detallePorCategoria: [
      { categoria: 'Vacas', inicial: 57, compras: 10, final: 67 },
      { categoria: 'Vaquillona 1', inicial: 11, compras: 30, final: 41 },
      { categoria: 'Terneros', inicial: 41, compras: 0, final: 41 },
      { categoria: 'Terneras', inicial: 16, compras: 0, final: 16 },
      { categoria: 'Toros', inicial: 4, ingresos: 6, ventas: 1, final: 9 },
    ]
  },

  ejemploVentaVNR: {
    cantidadCabezas: 15,
    categoria: 'Novillos terminados',
    pesoPromedioKg: 450,
    pesoTotalKg: 6750,
    precioKgArs: 4496.34,
    importeBrutoArs: 30350295,
    costosVenta: {
      comisionConsignataria: 910508.85,
      fleteFeriaCamionJaula: 1200000.00,
      derechosPistaYPesaje: 151751.48,
      arancelesSenasaDteGuias: 35000.00,
      totalCostosVentaArs: 2297260.33,
    },
    ivaDebitoFiscal10_5Ars: 3186780.98,
    valorNetoRealizacionVnrArs: 28053034.68,
  },

  parametrosDecisionEngorde: {
    pesoVentaLivianoKg: 140,
    pesoObjetivoTerminadoKg: 450,
    diferenciaPesoKg: 310,
    criterio: 'Evaluación de margen incremental vs costo de ración por kilo ganado',
  }
};

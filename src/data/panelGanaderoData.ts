/**
 * Datos del Panel Ganadero Integral (Pozo del Carril – La Aguada)
 * Extraídos de: public/assets/aistudio/Gestion_Ganadera_Integral.xlsx_-_Panel_a6add9d4.csv
 */

export interface SerieMensualGanadera {
  mes: string;
  ventas: number;
  margenOperativo: number;
  cobros: number;
  pagos: number;
}

export interface EspecieResumenFinanciero {
  codigo: 'OVI' | 'POR' | 'BOV';
  nombre: string;
  icono: string;
  ventasNetas: number;
  margenOperativo: number;
  stockCabezas: number;
  participacionVentasPct: number;
}

export interface PanelGanaderoData {
  resumenGlobal: {
    ventasNetas: number;
    costosVariables: number;
    margenContribucion: number;
    costosFijos: number;
    margenOperativo: number;
    produccionValorizada: number;
    costoHaciendaVendida: number;
    perdidaMortandad: number;
    resultadoRegistrado: number;
    cobrosPeriodo: number;
    pagosPeriodo: number;
    flujoOperativo: number;
    stockCierreCabezas: number;
    ventasCabezas: number;
    margenOperativoVentasPct: number;
  };
  resumenPorEspecie: Record<'OVI' | 'POR' | 'BOV', EspecieResumenFinanciero>;
  seriesMensuales: SerieMensualGanadera[];
}

export const PANEL_GANADERO_INTEGRAL: PanelGanaderoData = {
  "resumenGlobal": {
    "ventasNetas": 59986834,
    "costosVariables": 41505061,
    "margenContribucion": 18481773,
    "costosFijos": 12141700,
    "margenOperativo": 6340073,
    "produccionValorizada": 47198500,
    "costoHaciendaVendida": 42151500,
    "perdidaMortandad": 834000,
    "resultadoRegistrado": 10553073,
    "cobrosPeriodo": 52886921,
    "pagosPeriodo": 44071287,
    "flujoOperativo": 8815634,
    "stockCierreCabezas": 170,
    "ventasCabezas": 671,
    "margenOperativoVentasPct": 10.6
  },
  "resumenPorEspecie": {
    "OVI": {
      "codigo": "OVI",
      "nombre": "Ovinos",
      "icono": "🐑",
      "ventasNetas": 160000,
      "margenOperativo": -1477300,
      "stockCabezas": 18,
      "participacionVentasPct": 0.27
    },
    "POR": {
      "codigo": "POR",
      "nombre": "Porcinos",
      "icono": "🐖",
      "ventasNetas": 33523245,
      "margenOperativo": -3915524,
      "stockCabezas": 125,
      "participacionVentasPct": 55.88
    },
    "BOV": {
      "codigo": "BOV",
      "nombre": "Bovinos",
      "icono": "🐄",
      "ventasNetas": 26303589,
      "margenOperativo": 11732896,
      "stockCabezas": 27,
      "participacionVentasPct": 43.85
    }
  },
  "seriesMensuales": [
    {
      "mes": "2024-07",
      "ventas": 0,
      "margenOperativo": -320793.2,
      "cobros": 0,
      "pagos": 59750.09
    },
    {
      "mes": "2024-08",
      "ventas": 0,
      "margenOperativo": -401710.4,
      "cobros": 0,
      "pagos": 309672.71
    },
    {
      "mes": "2024-09",
      "ventas": 0,
      "margenOperativo": -481244.4,
      "cobros": 0,
      "pagos": 377038
    },
    {
      "mes": "2024-10",
      "ventas": 0,
      "margenOperativo": -670534.8,
      "cobros": 0,
      "pagos": 525034.66
    },
    {
      "mes": "2024-11",
      "ventas": 675675,
      "margenOperativo": -43518.48,
      "cobros": 597296.7,
      "pagos": 925061.81
    },
    {
      "mes": "2024-12",
      "ventas": 532350,
      "margenOperativo": -278430.76,
      "cobros": 470597.4,
      "pagos": 954187.82
    },
    {
      "mes": "2025-01",
      "ventas": 1059030,
      "margenOperativo": 6872.01,
      "cobros": 433840.68,
      "pagos": 1110276.4
    },
    {
      "mes": "2025-02",
      "ventas": 955710,
      "margenOperativo": -12186.43,
      "cobros": 1347189.48,
      "pagos": 1425580.4
    },
    {
      "mes": "2025-03",
      "ventas": 1730610,
      "margenOperativo": 254539.23,
      "cobros": 1529859.24,
      "pagos": 1215459.82
    },
    {
      "mes": "2025-04",
      "ventas": 2298870,
      "margenOperativo": 821660.25,
      "cobros": 1529859.24,
      "pagos": 1231061.98
    },
    {
      "mes": "2025-05",
      "ventas": 2298870,
      "margenOperativo": 653087.77,
      "cobros": 2055034.8,
      "pagos": 1765269.15
    },
    {
      "mes": "2025-06",
      "ventas": 1446480,
      "margenOperativo": -113406,
      "cobros": 1758196.44,
      "pagos": 1087810.99
    },
    {
      "mes": "2025-07",
      "ventas": 1859760,
      "margenOperativo": 27771.76,
      "cobros": 1461358.08,
      "pagos": 1472182.28
    },
    {
      "mes": "2025-08",
      "ventas": 1808100,
      "margenOperativo": -534732.66,
      "cobros": 981849.96,
      "pagos": 1242956.98
    },
    {
      "mes": "2025-09",
      "ventas": 2221380,
      "margenOperativo": 20538.54,
      "cobros": 2077868.52,
      "pagos": 1288238.23
    },
    {
      "mes": "2025-10",
      "ventas": 2066400,
      "margenOperativo": -214807.2,
      "cobros": 1552692.96,
      "pagos": 1919313.59
    },
    {
      "mes": "2025-11",
      "ventas": 1317330,
      "margenOperativo": -279044.77,
      "cobros": 1370023.2,
      "pagos": 1299381.08
    },
    {
      "mes": "2025-12",
      "ventas": 1188180,
      "margenOperativo": -289116.42,
      "cobros": 1552692.96,
      "pagos": 2074273.83
    },
    {
      "mes": "2026-01",
      "ventas": 1638000,
      "margenOperativo": -1311593.52,
      "cobros": 1699162.92,
      "pagos": 2849501
    },
    {
      "mes": "2026-02",
      "ventas": 1386000,
      "margenOperativo": -2142669.68,
      "cobros": 779688,
      "pagos": 2067309.57
    },
    {
      "mes": "2026-03",
      "ventas": 2173500,
      "margenOperativo": -1400828.94,
      "cobros": 1197378,
      "pagos": 2821759.99
    },
    {
      "mes": "2026-04",
      "ventas": 2142000,
      "margenOperativo": -1097665.44,
      "cobros": 2868138,
      "pagos": 2703100.41
    },
    {
      "mes": "2026-05",
      "ventas": 1102500,
      "margenOperativo": -1926050.5,
      "cobros": 1169532,
      "pagos": 2553922.09
    },
    {
      "mes": "2026-06",
      "ventas": 1703500,
      "margenOperativo": -2051155.5,
      "cobros": 1364454,
      "pagos": 2770181.96
    },
    {
      "mes": "2026-07",
      "ventas": 1197000,
      "margenOperativo": -2488409,
      "cobros": 779688,
      "pagos": 2767890.38
    },
    {
      "mes": "2026-08",
      "ventas": 882000,
      "margenOperativo": -3173278,
      "cobros": 1058148,
      "pagos": 3045318.78
    },
    {
      "mes": "2026-09",
      "ventas": 0,
      "margenOperativo": -1475760,
      "cobros": 0,
      "pagos": 1229388.72
    },
    {
      "mes": "2026-10",
      "ventas": 26303589,
      "margenOperativo": 25262539.27,
      "cobros": 23252372.68,
      "pagos": 980364.12
    }
  ]
};

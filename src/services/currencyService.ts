/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Servicio de Gestión Monetaria Dual (ARS / USD) y Cotización Oficial (Compra / Venta)
 * 
 * Enlace oficial de referencia: https://dolarhoy.com/cotizaciondolaroficial
 */

export type MonedaTipo = 'ARS' | 'USD';
export type TipoOperacionCotizacion = 'COMPRA' | 'VENTA';
export type TipoCotizacionUsd = 'COMPRADOR' | 'VENDEDOR';

export const DOLAR_HOY_URL = 'https://dolarhoy.com/cotizaciondolaroficial';

export interface CotizacionDolar {
  compra: number;
  venta: number;
  ultimaActualizacion?: string;
  fuente: string;
}

export const DEFAULT_COTIZACION_OFICIAL: CotizacionDolar = {
  compra: 1490.00,
  venta: 1540.00,
  ultimaActualizacion: 'Actualizado según Dólar Hoy',
  fuente: DOLAR_HOY_URL,
};

const TC_COMPRA_KEY = 'erp_ovinos_tc_compra_v2';
const TC_VENTA_KEY = 'erp_ovinos_tc_venta_v2';
const TC_UPDATE_KEY = 'erp_ovinos_tc_update_v2';
const DISPLAY_CURRENCY_KEY = 'erp_ovinos_display_currency_v1';
const TIPO_COTIZACION_USD_KEY = 'erp_ovinos_tipo_usd_rate_v1';

/**
 * Obtiene la cotización oficial guardada en memoria local o los valores por defecto
 */
export function getCotizacionOficial(): CotizacionDolar {
  try {
    const rawCompra = localStorage.getItem(TC_COMPRA_KEY);
    const rawVenta = localStorage.getItem(TC_VENTA_KEY);
    const rawUpdate = localStorage.getItem(TC_UPDATE_KEY);

    if (rawCompra && rawVenta) {
      const parsedCompra = parseFloat(rawCompra);
      const parsedVenta = parseFloat(rawVenta);
      if (!isNaN(parsedCompra) && parsedCompra > 0 && !isNaN(parsedVenta) && parsedVenta > 0) {
        return {
          compra: parsedCompra,
          venta: parsedVenta,
          ultimaActualizacion: rawUpdate || DEFAULT_COTIZACION_OFICIAL.ultimaActualizacion,
          fuente: DOLAR_HOY_URL,
        };
      }
    }
  } catch (e) {}
  return DEFAULT_COTIZACION_OFICIAL;
}

/**
 * Guarda una nueva cotización oficial (Compra y Venta)
 */
export function saveCotizacionOficial(cot: CotizacionDolar): void {
  try {
    if (cot.compra > 0 && cot.venta > 0) {
      localStorage.setItem(TC_COMPRA_KEY, cot.compra.toString());
      localStorage.setItem(TC_VENTA_KEY, cot.venta.toString());
      if (cot.ultimaActualizacion) {
        localStorage.setItem(TC_UPDATE_KEY, cot.ultimaActualizacion);
      }
    }
  } catch (e) {}
}

/**
 * Consulta la cotización en vivo desde el backend (que parsea directamente dolarhoy.com)
 */
export async function fetchCotizacionEnVivo(): Promise<CotizacionDolar> {
  try {
    const res = await fetch('/api/cotizacion-dolar');
    if (res.ok) {
      const data = await res.json();
      if (data && data.compra > 0 && data.venta > 0) {
        const nuevaCot: CotizacionDolar = {
          compra: data.compra,
          venta: data.venta,
          ultimaActualizacion: data.ultimaActualizacion || new Date().toLocaleTimeString('es-AR'),
          fuente: DOLAR_HOY_URL,
        };
        saveCotizacionOficial(nuevaCot);
        return nuevaCot;
      }
    }
  } catch (e) {
    console.warn('Fallback a cotización guardada localmente:', e);
  }
  return getCotizacionOficial();
}

/**
 * Obtiene la preferencia de tipo de cambio para visualización en USD: 'COMPRADOR' o 'VENDEDOR'
 */
export function getTipoCotizacionUsd(): TipoCotizacionUsd {
  try {
    const val = localStorage.getItem(TIPO_COTIZACION_USD_KEY);
    if (val === 'COMPRADOR' || val === 'VENDEDOR') return val;
  } catch (e) {}
  return 'VENDEDOR'; // Por defecto Vendedor
}

/**
 * Guarda la preferencia de tipo de cambio para visualización en USD
 */
export function saveTipoCotizacionUsd(tipo: TipoCotizacionUsd): void {
  try {
    localStorage.setItem(TIPO_COTIZACION_USD_KEY, tipo);
  } catch (e) {}
}

/**
 * Retorna el valor del tipo de cambio según el modo elegido ('COMPRADOR' -> compra, 'VENDEDOR' -> venta)
 */
export function getTipoCambioPorModo(
  cotizacion: CotizacionDolar = getCotizacionOficial(),
  tipo: TipoCotizacionUsd = getTipoCotizacionUsd()
): number {
  return tipo === 'COMPRADOR' ? cotizacion.compra : cotizacion.venta;
}

/**
 * Obtiene el tipo de cambio de referencia simplificado según la preferencia activa
 */
export function getTipoCambioOficial(): number {
  return getTipoCambioPorModo();
}

/**
 * Guarda un tipo de cambio simple (manteniendo spread proporcional)
 */
export function saveTipoCambioOficial(tcVenta: number): void {
  const actual = getCotizacionOficial();
  const ratio = actual.compra > 0 ? actual.compra / actual.venta : 0.967;
  saveCotizacionOficial({
    compra: Number((tcVenta * ratio).toFixed(2)),
    venta: Number(tcVenta.toFixed(2)),
    ultimaActualizacion: new Date().toLocaleTimeString('es-AR'),
    fuente: DOLAR_HOY_URL,
  });
}

/**
 * Obtiene la moneda de visualización seleccionada (ARS por defecto)
 */
export function getMonedaVisualizacion(): MonedaTipo {
  try {
    const val = localStorage.getItem(DISPLAY_CURRENCY_KEY);
    if (val === 'USD' || val === 'ARS') return val;
  } catch (e) {}
  return 'ARS';
}

/**
 * Guarda la preferencia de moneda de visualización
 */
export function saveMonedaVisualizacion(moneda: MonedaTipo): void {
  try {
    localStorage.setItem(DISPLAY_CURRENCY_KEY, moneda);
  } catch (e) {}
}

/**
 * Convierte un monto en ARS a USD según el tipo de cambio especificado o el activo
 */
export function convertirArsAUsd(montoArs: number, tipoCambio: number = getTipoCambioOficial()): number {
  if (!tipoCambio || tipoCambio <= 0) return 0;
  return Number((montoArs / tipoCambio).toFixed(2));
}

/**
 * Convierte un monto en USD a ARS según el tipo de cambio especificado o el activo
 */
export function convertirUsdAArs(montoUsd: number, tipoCambio: number = getTipoCambioOficial()): number {
  return Number((montoUsd * tipoCambio).toFixed(2));
}

/**
 * Formatea un valor numérico según la moneda indicada
 */
export function formatearMoneda(
  monto: number,
  moneda: MonedaTipo = 'ARS',
  incluirCodigo: boolean = false
): string {
  if (isNaN(monto) || monto === null || monto === undefined) return moneda === 'USD' ? 'US$ 0,00' : '$ 0';

  if (moneda === 'USD') {
    const formatted = monto.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return incluirCodigo ? `US$ ${formatted} USD` : `US$ ${formatted}`;
  } else {
    const formatted = Math.round(monto).toLocaleString('es-AR');
    return incluirCodigo ? `$ ${formatted} ARS` : `$ ${formatted}`;
  }
}

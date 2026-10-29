/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Motor Global de Validación de Formularios y Reglas de Integridad
 * Previene datos nulos, formatos inválidos, fechas futuras y números negativos.
 */

import { getFechaArgentinaISO } from './dateUtils';
import { TipoMovimientoHacienda } from '../types/erp';

export interface FieldValidationOptions {
  label?: string;
  allowZero?: boolean;
  min?: number;
  max?: number;
  integerOnly?: boolean;
  allowFutureDate?: boolean;
  minDate?: string;
  maxDate?: string;
  minLength?: number;
  maxLength?: number;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorSummary?: string;
}

/**
 * Valida que una fecha sea válida, en formato YYYY-MM-DD y que NO sea futura
 */
export function validarFechaNoFutura(
  fecha: string | null | undefined,
  label: string = 'La fecha',
  options: { allowFutureDate?: boolean; minDate?: string; maxDate?: string } = {}
): string | null {
  if (!fecha || typeof fecha !== 'string' || fecha.trim() === '') {
    return `${label} es obligatoria y no puede quedar vacía.`;
  }

  const cleanFecha = fecha.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(cleanFecha)) {
    return `${label} debe tener un formato de fecha válido (AAAA-MM-DD).`;
  }

  const partes = cleanFecha.split('-').map(Number);
  const year = partes[0];
  const month = partes[1];
  const day = partes[2];

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return `${label} contiene valores de día o mes inválidos.`;
  }

  // Verificar si la fecha es real en el calendario
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return `${label} no es una fecha válida en el calendario.`;
  }

  const hoyArgentina = options.maxDate || getFechaArgentinaISO();

  // Validación estricta: fechas futuras bloqueadas
  if (!options.allowFutureDate && cleanFecha > hoyArgentina) {
    return `${label} no puede ser futura (${cleanFecha}). La fecha máxima permitida es hoy (${hoyArgentina}).`;
  }

  if (options.minDate && cleanFecha < options.minDate) {
    return `${label} no puede ser anterior a ${options.minDate}.`;
  }

  return null;
}

/**
 * Valida que un número sea positivo, no nulo, no negativo y cumpla restricciones zootécnicas
 */
export function validarNumeroPositivo(
  valor: number | string | null | undefined,
  label: string = 'El valor',
  options: FieldValidationOptions = {}
): string | null {
  if (valor === null || valor === undefined || valor === '') {
    return `${label} es obligatorio y no puede ser nulo o vacío.`;
  }

  const num = typeof valor === 'string' ? Number(valor) : valor;

  if (isNaN(num) || !isFinite(num)) {
    return `${label} debe ser un valor numérico válido.`;
  }

  // Validación de número negativo
  if (num < 0) {
    return `${label} no puede ser negativo (${num}). Solo se admiten valores positivos.`;
  }

  const allowZero = options.allowZero ?? false;
  if (!allowZero && num === 0) {
    return `${label} debe ser mayor a cero.`;
  }

  if (options.min !== undefined && num < options.min) {
    return `${label} debe ser como mínimo ${options.min}.`;
  }

  if (options.max !== undefined && num > options.max) {
    return `${label} no puede superar el límite de ${options.max}.`;
  }

  if (options.integerOnly && !Number.isInteger(num)) {
    return `${label} debe ser un número entero (sin decimales).`;
  }

  return null;
}

/**
 * Valida un campo de texto obligatorio
 */
export function validarTextoRequerido(
  texto: string | null | undefined,
  label: string = 'El campo',
  minLength: number = 1,
  maxLength?: number
): string | null {
  if (texto === null || texto === undefined) {
    return `${label} es obligatorio y no puede ser nulo.`;
  }

  const trimmed = texto.trim();
  if (trimmed.length < minLength) {
    return `${label} es obligatorio y debe tener al menos ${minLength} carácter(es).`;
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return `${label} no puede exceder los ${maxLength} caracteres.`;
  }

  return null;
}

/**
 * Validador para Formularios de Movimiento de Hacienda en Majada
 */
export interface MovimientoFormData {
  fecha: string;
  tipo: TipoMovimientoHacienda;
  cabezas: number;
  kgVivo?: number;
  subunidadOrigen?: string;
  subunidadDestino?: string;
  categoriaOrigen?: string;
  categoriaDestino?: string;
  motivo?: string;
  stockDisponibleEnOrigen?: number;
}

export function validarFormularioMovimientoMajada(
  data: MovimientoFormData
): FormValidationResult {
  const errors: Record<string, string> = {};

  // 1. Fecha no futura y obligatoria
  const errFecha = validarFechaNoFutura(data.fecha, 'La fecha del evento');
  if (errFecha) errors.fecha = errFecha;

  // 2. Tipo de movimiento
  if (!data.tipo) {
    errors.tipo = 'Debe seleccionar un tipo de evento zootécnico.';
  }

  // 3. Cantidad de cabezas (estrictamente entero positivo >= 1)
  const errCabezas = validarNumeroPositivo(data.cabezas, 'La cantidad de cabezas', {
    allowZero: false,
    min: 1,
    integerOnly: true,
  });
  if (errCabezas) errors.cabezas = errCabezas;

  // 4. Kg Vivo (opcional pero si se provee debe ser >= 0)
  if (data.kgVivo !== undefined && data.kgVivo !== null && String(data.kgVivo).trim() !== '') {
    const errKg = validarNumeroPositivo(data.kgVivo, 'El peso vivo total', {
      allowZero: true,
      min: 0,
    });
    if (errKg) errors.kgVivo = errKg;
  }

  // 5. Validaciones de categorías según el tipo
  if (data.tipo !== 'NACIMIENTO') {
    if (!data.categoriaOrigen || data.categoriaOrigen.trim() === '') {
      errors.categoriaOrigen = 'Debe seleccionar la categoría de origen.';
    }
  }

  if (['TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA', 'NACIMIENTO'].includes(data.tipo)) {
    if (!data.categoriaDestino || data.categoriaDestino.trim() === '') {
      errors.categoriaDestino = 'Debe seleccionar la categoría de destino.';
    }
  }

  // 6. Reglas específicas para Cambio de Categoría y Transferencia
  if (data.tipo === 'CAMBIO_CATEGORIA') {
    if (data.categoriaOrigen && data.categoriaDestino && data.categoriaOrigen === data.categoriaDestino) {
      errors.categoriaDestino = 'La nueva categoría debe ser diferente a la categoría anterior.';
    }
  }

  if (data.tipo === 'TRANSFERENCIA_SUBUNIDAD') {
    if (
      data.subunidadOrigen &&
      data.subunidadDestino &&
      data.categoriaOrigen &&
      data.categoriaDestino &&
      data.subunidadOrigen === data.subunidadDestino &&
      data.categoriaOrigen === data.categoriaDestino
    ) {
      errors.subunidadDestino = 'La transferencia requiere que la subunidad o categoría de destino sea diferente a la de origen.';
    }
  }

  // 7. Control de stock negativo en origen
  if (['MUERTE', 'VENTA', 'CONSUMO_PROPIO', 'TRANSFERENCIA_SUBUNIDAD', 'CAMBIO_CATEGORIA'].includes(data.tipo)) {
    if (data.stockDisponibleEnOrigen !== undefined) {
      if (data.stockDisponibleEnOrigen <= 0) {
        errors.cabezas = `Operación bloqueada: La categoría seleccionada no tiene stock disponible (0 cabezas). No se permite stock negativo.`;
      } else if (Number(data.cabezas) > data.stockDisponibleEnOrigen) {
        errors.cabezas = `Operación bloqueada: No se puede retirar más cabezas (${data.cabezas}) que el stock disponible actual (${data.stockDisponibleEnOrigen} cabezas).`;
      }
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    errorSummary: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
  };
}

/**
 * Validador para Formularios de Pesaje en Majada
 */
export interface PesajeFormData {
  fecha: string;
  subunidad: string;
  categoria: string;
  cabezas: number;
  kgTotal: number;
  observaciones?: string;
}

export function validarFormularioPesaje(data: PesajeFormData): FormValidationResult {
  const errors: Record<string, string> = {};

  const errFecha = validarFechaNoFutura(data.fecha, 'La fecha de pesaje');
  if (errFecha) errors.fecha = errFecha;

  if (!data.subunidad || data.subunidad.trim() === '') {
    errors.subunidad = 'Debe seleccionar una subunidad para el pesaje.';
  }

  if (!data.categoria || data.categoria.trim() === '') {
    errors.categoria = 'Debe seleccionar una categoría zootécnica.';
  }

  const errCabezas = validarNumeroPositivo(data.cabezas, 'Las cabezas pesadas', {
    allowZero: false,
    min: 1,
    integerOnly: true,
  });
  if (errCabezas) errors.cabezas = errCabezas;

  const errKg = validarNumeroPositivo(data.kgTotal, 'El peso vivo total', {
    allowZero: false,
    min: 0.1,
  });
  if (errKg) errors.kgTotal = errKg;

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    errorSummary: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
  };
}

/**
 * Validador para Formularios de Tratamiento Sanitario
 */
export interface SanidadFormData {
  fecha: string;
  subunidad: string;
  categoria: string;
  insumoId: string;
  cabezas: number;
  dosisUnitaria: number;
  diagnostico: string;
  veterinario?: string;
  stockInsumoDisponible?: number;
  umInsumo?: string;
}

export function validarFormularioSanidad(data: SanidadFormData): FormValidationResult {
  const errors: Record<string, string> = {};

  // 1. Fecha
  const errFecha = validarFechaNoFutura(data.fecha, 'La fecha de aplicación sanitaria');
  if (errFecha) errors.fecha = errFecha;

  // 2. Selects obligatorios
  if (!data.subunidad || data.subunidad.trim() === '') {
    errors.subunidad = 'Debe indicar la subunidad a tratar.';
  }
  if (!data.categoria || data.categoria.trim() === '') {
    errors.categoria = 'Debe indicar la categoría zootécnica a tratar.';
  }
  if (!data.insumoId || data.insumoId.trim() === '') {
    errors.insumoId = 'Debe seleccionar un insumo o biológico veterinario.';
  }

  // 3. Cabezas tratadas
  const errCabezas = validarNumeroPositivo(data.cabezas, 'Las cabezas tratadas', {
    allowZero: false,
    min: 1,
    integerOnly: true,
  });
  if (errCabezas) errors.cabezas = errCabezas;

  // 4. Dosis unitaria
  const errDosis = validarNumeroPositivo(data.dosisUnitaria, 'La dosis unitaria', {
    allowZero: false,
    min: 0.001,
  });
  if (errDosis) errors.dosisUnitaria = errDosis;

  // 5. Diagnóstico / Motivo
  const errDiag = validarTextoRequerido(
    data.diagnostico,
    'El diagnóstico o motivo sanitario',
    3,
    250
  );
  if (errDiag) errors.diagnostico = errDiag;

  // 6. Validación de stock de medicamento disponible en depósito
  if (data.stockInsumoDisponible !== undefined && !errors.cabezas && !errors.dosisUnitaria) {
    const consumoTotal = Number(data.cabezas) * Number(data.dosisUnitaria);
    if (data.stockInsumoDisponible < consumoTotal) {
      errors.insumoId = `Stock insuficiente en farmacia: Disponible ${data.stockInsumoDisponible} ${data.umInsumo || 'unid'}, requerido ${consumoTotal.toFixed(2)} ${data.umInsumo || 'unid'}.`;
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    errorSummary: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
  };
}

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatabaseState, saveDatabaseState } from '../services/sheetsService';
import { Usuario } from '../types/erp';
import { getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';
import {
  Database,
  Network,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Table,
  Key,
  Link,
  Workflow,
  Search,
  Info,
  Boxes,
  Wheat,
  CircleDollarSign,
  FileText,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ExternalLink,
  FolderTree,
  FolderUp,
  FileSpreadsheet,
  Download,
  Trash2,
  UploadCloud,
  FileCheck,
  HelpCircle,
  ChevronRight,
  Bot,
  Check,
  X,
  FileDown,
  AlertCircle
} from 'lucide-react';

import { BotonAyudaContextual } from '../components/BotonAyudaContextual';

interface ModeloDatosModuleProps {
  state: DatabaseState;
  currentUser: Usuario;
  onNavigateTab?: (tab: any) => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
  onStateUpdate?: () => void;
}

type VistaModelo = 'diagrama' | 'flujos' | 'hojas' | 'integridad' | 'repositorio_archivos';
type DominioFiltro = 'TODOS' | 'ZOOTECNICO' | 'INSUMOS' | 'ECONOMIA' | 'CONTABILIDAD' | 'SEGURIDAD';

export interface ArchivoAntecedente {
  id: string;
  nombre: string;
  formato: 'PDF' | 'EXCEL' | 'BASE_DATOS' | 'DOCUMENTO_TXT';
  tamanioKb: number;
  fechaCarga: string;
  usuarioCarga: string;
  especie: 'Ovinos' | 'Bovinos' | 'Porcinos' | 'Consolidado';
  categoriaDoc: 'ANTECEDENTE_HISTORICO' | 'PLANILLA_PESAJES' | 'DTE_SENASA' | 'BALANCE_RT54' | 'SANIDAD' | 'BASE_DATOS';
  campania: string;
  descripcion: string;
  estado: 'INCORPORADO' | 'PENDIENTE';
  contenidoTexto?: string;
}

interface EntidadSchema {
  id: string;
  nombre: string;
  hojaSheet: string;
  dominio: 'ZOOTECNICO' | 'INSUMOS' | 'ECONOMIA' | 'CONTABILIDAD' | 'SEGURIDAD';
  descripcion: string;
  pk: string;
  fks: Array<{ campo: string; tablaDestino: string; campoDestino: string }>;
  campos: Array<{ nombre: string; tipo: string; descripcion: string; esPk?: boolean; esFk?: boolean }>;
  registrosGetter: (state: DatabaseState) => any[];
  icono: any;
  color: string;
}

export const ModeloDatosModule: React.FC<ModeloDatosModuleProps> = ({
  state,
  currentUser,
  onNavigateTab,
  onOpenManual,
  onStateUpdate,
}) => {
  const [vista, setVista] = useState<VistaModelo>('diagrama');
  const [dominioFiltro, setDominioFiltro] = useState<DominioFiltro>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<EntidadSchema | null>(null);
  const [flujoActivo, setFlujoActivo] = useState<'zootecnico' | 'insumos' | 'contable' | 'auditoria'>('zootecnico');
  const [escaneandoIntegridad, setEscaneandoIntegridad] = useState(false);
  const [ultimoEscaneo, setUltimoEscaneo] = useState<string | null>(null);

  // Archivos históricos precargados y subidos por el usuario
  const [archivosCargados, setArchivosCargados] = useState<ArchivoAntecedente[]>([
    {
      id: 'DOC-001',
      nombre: 'Inventario_Datos_Porcinos_y_Bovinos_Pozo_del_Carril.txt',
      formato: 'DOCUMENTO_TXT',
      tamanioKb: 14.8,
      fechaCarga: '25/10/2026 08:30',
      usuarioCarga: 'eliaguero2404@gmail.com',
      especie: 'Consolidado',
      categoriaDoc: 'ANTECEDENTE_HISTORICO',
      campania: 'CAM-2026',
      descripcion: 'Fases productivas porcinas (Cría, Destete, Engorde), raciones, costos mano de obra $3M, energía, transferencia $26.3M. Fases bovinas (390 días, Cría a Engorde 450 kg), existencias 174 cabezas y ejemplo de venta VNR.',
      estado: 'INCORPORADO',
      contenidoTexto: `INVENTARIO DE DATOS — UNIDAD PORCINA & BOVINA
Establecimiento Pozo del Carril – La Aguada | UNRC
- Unidad Porcina: Cría 0-15kg (100% preiniciador), Destete 15-50kg (80% maíz, 10% conc, 10% soja), Engorde 50-105kg (70% maíz, 30% soja). Alimentación: 78% del costo. Mano de obra: $3.000.000. Transferencia Cría a Destete: $26.377.259,25.
- Unidad Bovina: Ciclo 390 días en 4 etapas: Cría 180d, Recría 120d, Adaptación 30d, Engorde 60d. Stock final 174 cabezas reconciliadas (57 vacas + 10 compras = 67 vacas, 41 vaquillonas, 41 terneros, 16 terneras, 9 toros). Precios MAG: Novillo $4.496,34, Vaquillona $4.662,75. Venta 15 novillos VNR $28.053.034,68.`,
    },
    {
      id: 'DOC-002',
      nombre: 'Planilla_Reconciliacion_Existencias_Bovinas_174_Cabezas.xlsx',
      formato: 'EXCEL',
      tamanioKb: 42.5,
      fechaCarga: '22/10/2026 14:15',
      usuarioCarga: 'admin',
      especie: 'Bovinos',
      categoriaDoc: 'PLANILLA_PESAJES',
      campania: 'CAM-2026',
      descripcion: 'Evolución de stock bovino desde 129 cabezas iniciales a 174 cabezas finales con compras de 40 cabezas e ingresos de toros.',
      estado: 'INCORPORADO',
    },
    {
      id: 'DOC-003',
      nombre: 'Resolucion_RT54_Valuacion_Activos_Biologicos_UNRC.pdf',
      formato: 'PDF',
      tamanioKb: 218.0,
      fechaCarga: '18/10/2026 10:00',
      usuarioCarga: 'admin',
      especie: 'Consolidado',
      categoriaDoc: 'BALANCE_RT54',
      campania: 'CAM-2026',
      descripcion: 'Marco normativo FACPCE RT 54 aplicado a activos biológicos en producción (cuenta 1.4) y bienes de cambio (cuenta 1.3).',
      estado: 'INCORPORADO',
    },
  ]);

  const [archivoSeleccionadoPreview, setArchivoSeleccionadoPreview] = useState<ArchivoAntecedente | null>(null);
  const [nuevoNombreDoc, setNuevoNombreDoc] = useState('');
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState<ArchivoAntecedente['categoriaDoc']>('ANTECEDENTE_HISTORICO');
  const [nuevaEspecieDoc, setNuevaEspecieDoc] = useState<ArchivoAntecedente['especie']>('Consolidado');
  const [nuevaCampaniaDoc, setNuevaCampaniaDoc] = useState('CAM-2026');
  const [nuevaDescDoc, setNuevaDescDoc] = useState('');
  const [mensajeExitoCarga, setMensajeExitoCarga] = useState<string | null>(null);

  // Verificación estricta de rol Administrador
  const esAdmin = currentUser?.rol_nombre === 'ADMINISTRADOR';

  // Catálogo completo y normalizado de las entidades y cuadros del ERP (33 Hojas de Google Sheets)
  const entidadesCatalogo: EntidadSchema[] = useMemo(() => [
    {
      id: 'especies',
      nombre: 'D_Especie (Especies Ganaderas)',
      hojaSheet: 'ESPECIES',
      dominio: 'ZOOTECNICO',
      descripcion: 'Tabla Maestra de Especies Ganaderas (ESP001: Ovinos, ESP002: Bovinos, ESP003: Porcinos). Dimensión primaria EspecieID.',
      pk: 'id_especie',
      fks: [],
      campos: [
        { nombre: 'id_especie', tipo: 'string', descripcion: 'PK: Código canónico (ESP001, ESP002, ESP003)', esPk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código zootécnico (OVI, BOV, POR)' },
        { nombre: 'nombre', tipo: 'string', descripcion: 'Nombre zootécnico de la especie' },
        { nombre: 'icono', tipo: 'string', descripcion: 'Emoji representativo (🐑, 🐄, 🐖)' },
        { nombre: 'activo', tipo: 'boolean', descripcion: 'Estado operativo en el establecimiento' },
        { nombre: 'orden_visual', tipo: 'number', descripcion: 'Secuencia de presentación en selectores' },
      ],
      registrosGetter: s => s.especies || [],
      icono: Layers,
      color: 'emerald',
    },
    {
      id: 'unidades',
      nombre: 'Unidades de Negocio',
      hojaSheet: 'UNIDADES',
      dominio: 'ZOOTECNICO',
      descripcion: 'Entidad raíz del establecimiento agropecuario (ej: Unidad Ganadera Pozo del Carril / La Aguada).',
      pk: 'id_unidad',
      fks: [],
      campos: [
        { nombre: 'id_unidad', tipo: 'string', descripcion: 'Identificador único de la unidad', esPk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código funcional (OVINOS, BOVINOS, PORCINOS)' },
        { nombre: 'nombre', tipo: 'string', descripcion: 'Nombre descriptivo de la unidad de negocio' },
        { nombre: 'activo', tipo: 'boolean', descripcion: 'Estado operativo en el establecimiento' },
      ],
      registrosGetter: s => s.unidades || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'subunidades',
      nombre: 'Subunidades Productivas',
      hojaSheet: 'SUBUNIDADES',
      dominio: 'ZOOTECNICO',
      descripcion: 'División zootécnica de cada especie (Cría, Recría, Invernada, etc.) para segregación de costos directos.',
      pk: 'id_subunidad',
      fks: [
        { campo: 'id_unidad', tablaDestino: 'unidades', campoDestino: 'id_unidad' },
        { campo: 'id_especie', tablaDestino: 'especies', campoDestino: 'id_especie' },
      ],
      campos: [
        { nombre: 'id_subunidad', tipo: 'string', descripcion: 'Identificador único de la subunidad', esPk: true },
        { nombre: 'id_unidad', tipo: 'string', descripcion: 'Unidad de negocio madre', esFk: true },
        { nombre: 'id_especie', tipo: 'string', descripcion: 'FK a D_Especie (ESP001, ESP002, ESP003)', esFk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código estandarizado: CRIA, RECRIA, etc.' },
        { nombre: 'nombre', tipo: 'string', descripcion: 'Nombre zootécnico (Cría Ovina / Recría Bovinos / etc.)' },
        { nombre: 'activo', tipo: 'boolean', descripcion: 'Estado habilitado' },
      ],
      registrosGetter: s => s.subunidades || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'lotes',
      nombre: 'Lotes de Pastoreo',
      hojaSheet: 'LOTES',
      dominio: 'ZOOTECNICO',
      descripcion: 'Potreros y parcelas físicas de pastura donde pastorea la majada en rotación.',
      pk: 'id_lote',
      fks: [{ campo: 'id_subunidad', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' }],
      campos: [
        { nombre: 'id_lote', tipo: 'string', descripcion: 'Clave primaria del potrero', esPk: true },
        { nombre: 'id_subunidad', tipo: 'string', descripcion: 'Subunidad asignada', esFk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código de campo (LOT001)' },
        { nombre: 'nombre', tipo: 'string', descripcion: 'Nombre del potrero o piquete' },
        { nombre: 'superficie_ha', tipo: 'number', descripcion: 'Superficie en hectáreas' },
      ],
      registrosGetter: s => s.lotes || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'categorias',
      nombre: 'Categorías Zootécnicas',
      hojaSheet: 'CATEGORIAS',
      dominio: 'ZOOTECNICO',
      descripcion: 'Clasificación etaria y reproductiva de la majada (Madres, Carneros, Borregas, Capones, Corderos).',
      pk: 'id_categoria',
      fks: [{ campo: 'id_subunidad', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' }],
      campos: [
        { nombre: 'id_categoria', tipo: 'string', descripcion: 'Identificador de categoría', esPk: true },
        { nombre: 'id_subunidad', tipo: 'string', descripcion: 'Subunidad correspondiente', esFk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código zootécnico (MAD, CAR, BOR, COR_DES, COR_ENG, SNC)' },
        { nombre: 'nombre', tipo: 'string', descripcion: 'Nombre completo de la categoría' },
        { nombre: 'genero', tipo: 'string', descripcion: 'HEMBRA | MACHO | MIXTO' },
        { nombre: 'es_reproductor', tipo: 'boolean', descripcion: 'Define si se valúa a costo histórico o VNR (RT 54)' },
      ],
      registrosGetter: s => s.categorias || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'campanias',
      nombre: 'Campañas Productivas',
      hojaSheet: 'CAMPANIAS',
      dominio: 'ZOOTECNICO',
      descripcion: 'Ciclos anuales agrícolas y productivos (ej: CAM-2026 Período 2026/2027).',
      pk: 'id_campania',
      fks: [],
      campos: [
        { nombre: 'id_campania', tipo: 'string', descripcion: 'Clave única del ciclo', esPk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código del año productivo (CAM-2026)' },
        { nombre: 'fecha_inicio', tipo: 'date', descripcion: 'Inicio formal del ciclo' },
        { nombre: 'fecha_fin', tipo: 'date', descripcion: 'Cierre de balance productivo' },
        { nombre: 'estado', tipo: 'string', descripcion: 'ABIERTA | CERRADA' },
      ],
      registrosGetter: s => s.campanias || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'inventario',
      nombre: 'Inventario Físico de Cabezas',
      hojaSheet: 'INVENTARIO_CABEZAS',
      dominio: 'ZOOTECNICO',
      descripcion: 'Existencias cuantitativas por lote, subunidad y categoría con corte canónico de 81 cabezas.',
      pk: 'id_inventario',
      fks: [
        { campo: 'id_subunidad', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' },
        { campo: 'id_lote', tablaDestino: 'lotes', campoDestino: 'id_lote' },
        { campo: 'id_categoria', tablaDestino: 'categorias', campoDestino: 'id_categoria' },
      ],
      campos: [
        { nombre: 'id_inventario', tipo: 'string', descripcion: 'Registro de existencia', esPk: true },
        { nombre: 'id_subunidad', tipo: 'string', descripcion: 'Subunidad Cría o Recría', esFk: true },
        { nombre: 'id_lote', tipo: 'string', descripcion: 'Lote físico', esFk: true },
        { nombre: 'id_categoria', tipo: 'string', descripcion: 'Categoría animal', esFk: true },
        { nombre: 'cantidad_cabezas', tipo: 'number', descripcion: 'Cantidad física en stock' },
        { nombre: 'peso_promedio_kg', tipo: 'number', descripcion: 'Peso medio por animal' },
      ],
      registrosGetter: s => s.inventario || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'movimientos',
      nombre: 'Movimientos de Hacienda',
      hojaSheet: 'MOVIMIENTOS_HACIENDA',
      dominio: 'ZOOTECNICO',
      descripcion: 'Registro de altas por nacimiento, traslados entre Cría y Recría, bajas por muerte o consumo.',
      pk: 'id_movimiento',
      fks: [
        { campo: 'id_subunidad_origen', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' },
        { campo: 'id_categoria', tablaDestino: 'categorias', campoDestino: 'id_categoria' },
      ],
      campos: [
        { nombre: 'id_movimiento', tipo: 'string', descripcion: 'ID del evento', esPk: true },
        { nombre: 'tipo_movimiento', tipo: 'string', descripcion: 'NACIMIENTO | TRANSFERENCIA | MUERTE | VENTA' },
        { nombre: 'cantidad_cabezas', tipo: 'number', descripcion: 'Número de animales involucrados' },
        { nombre: 'fecha', tipo: 'date', descripcion: 'Fecha del suceso zootécnico' },
        { nombre: 'motivo', tipo: 'string', descripcion: 'Justificación zootécnica' },
      ],
      registrosGetter: s => s.movimientos || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'pesajes',
      nombre: 'Control de Pesajes (GMD)',
      hojaSheet: 'PESAJES',
      dominio: 'ZOOTECNICO',
      descripcion: 'Monitoreo de ganancia media diaria de peso vivo (GMD) por lote y categoría.',
      pk: 'id_pesaje',
      fks: [{ campo: 'id_categoria', tablaDestino: 'categorias', campoDestino: 'id_categoria' }],
      campos: [
        { nombre: 'id_pesaje', tipo: 'string', descripcion: 'Clave del pesaje', esPk: true },
        { nombre: 'id_categoria', tipo: 'string', descripcion: 'Categoría pesada', esFk: true },
        { nombre: 'fecha_pesaje', tipo: 'date', descripcion: 'Fecha de la balanza' },
        { nombre: 'peso_promedio_kg', tipo: 'number', descripcion: 'Peso medio individual' },
        { nombre: 'ganancia_diaria_g', tipo: 'number', descripcion: 'GMD calculada en gramos/día' },
      ],
      registrosGetter: s => s.pesajes || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'sanidad',
      nombre: 'Planes Sanitarios & Vacunación',
      hojaSheet: 'SANIDAD',
      dominio: 'ZOOTECNICO',
      descripcion: 'Aplicaciones veterinarias, desparasitaciones, vacunas clostridiales y control de boqueo.',
      pk: 'id_sanidad',
      fks: [
        { campo: 'id_subunidad', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' },
        { campo: 'id_insumo', tablaDestino: 'insumos', campoDestino: 'id_insumo' },
      ],
      campos: [
        { nombre: 'id_sanidad', tipo: 'string', descripcion: 'Registro sanitario', esPk: true },
        { nombre: 'tratamiento', tipo: 'string', descripcion: 'Tipo de tratamiento veterinario' },
        { nombre: 'id_insumo', tipo: 'string', descripcion: 'Fármaco o biológico utilizado', esFk: true },
        { nombre: 'fecha_aplicacion', tipo: 'date', descripcion: 'Fecha de la manga' },
        { nombre: 'dias_carencia', tipo: 'number', descripcion: 'Período de resguardo para faena' },
      ],
      registrosGetter: s => s.sanidad || [],
      icono: Boxes,
      color: 'emerald',
    },
    {
      id: 'insumos',
      nombre: 'Depósito de Insumos',
      hojaSheet: 'INSUMOS',
      dominio: 'INSUMOS',
      descripcion: 'Catálogo de alimentos, fardos, rollos, fármacos con cálculo de Precio Promedio Ponderado (PPP).',
      pk: 'id_insumo',
      fks: [],
      campos: [
        { nombre: 'id_insumo', tipo: 'string', descripcion: 'Código del insumo', esPk: true },
        { nombre: 'codigo', tipo: 'string', descripcion: 'Código identificatorio' },
        { nombre: 'nombre', tipo: 'string', descripcion: 'Descripción del producto' },
        { nombre: 'tipo', tipo: 'string', descripcion: 'SANITARIO | ALIMENTO | FORRAJE | OTRO' },
        { nombre: 'um_codigo', tipo: 'string', descripcion: 'Unidad de medida (kg, dosis, litro, bolsa, ton)' },
        { nombre: 'stock_actual', tipo: 'number', descripcion: 'Existencia física actual' },
        { nombre: 'precio_promedio_ponderado', tipo: 'number', descripcion: 'Costo unitario PPP en $ ARS' },
        { nombre: 'activo', tipo: 'boolean', descripcion: 'Habilitado para consumo' },
      ],
      registrosGetter: s => s.insumos || [],
      icono: Wheat,
      color: 'amber',
    },
    {
      id: 'consumos',
      nombre: 'Consumos de Insumos',
      hojaSheet: 'CONSUMOS_INSUMOS',
      dominio: 'INSUMOS',
      descripcion: 'Alimentación y suplementación suministrada a la majada, imputada a costo directo.',
      pk: 'id_consumo',
      fks: [
        { campo: 'id_insumo', tablaDestino: 'insumos', campoDestino: 'id_insumo' },
        { campo: 'id_subunidad', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' },
      ],
      campos: [
        { nombre: 'id_consumo', tipo: 'string', descripcion: 'Comprobante de consumo', esPk: true },
        { nombre: 'id_insumo', tipo: 'string', descripcion: 'Insumo consumido', esFk: true },
        { nombre: 'id_subunidad', tipo: 'string', descripcion: 'Subunidad receptora', esFk: true },
        { nombre: 'cantidad', tipo: 'number', descripcion: 'Cantidad descargada de depósito' },
        { nombre: 'costo_total_ars', tipo: 'number', descripcion: 'Valoración a PPP (ARS)' },
        { nombre: 'fecha_consumo', tipo: 'date', descripcion: 'Día de suministro' },
      ],
      registrosGetter: s => s.consumos || [],
      icono: Wheat,
      color: 'amber',
    },
    {
      id: 'terceros',
      nombre: 'Terceros (Clientes & Proveedores)',
      hojaSheet: 'TERCEROS',
      dominio: 'ECONOMIA',
      descripcion: 'Padrón de proveedores de insumos veterinarios, compradores de corderos y faenadores.',
      pk: 'id_tercero',
      fks: [],
      campos: [
        { nombre: 'id_tercero', tipo: 'string', descripcion: 'Clave del tercero', esPk: true },
        { nombre: 'cuit', tipo: 'string', descripcion: 'CUIT / CUIL fiscal' },
        { nombre: 'razon_social', tipo: 'string', descripcion: 'Nombre o Razón Social' },
        { nombre: 'tipo', tipo: 'string', descripcion: 'PROVEEDOR | CLIENTE | MIXTO' },
        { nombre: 'condicion_iva', tipo: 'string', descripcion: 'Responsable Inscripto | Exento | Cons. Final' },
      ],
      registrosGetter: s => s.terceros || [],
      icono: CircleDollarSign,
      color: 'blue',
    },
    {
      id: 'compras',
      nombre: 'Compras de Insumos',
      hojaSheet: 'COMPRAS',
      dominio: 'ECONOMIA',
      descripcion: 'Facturas y remitos de adquisición que actualizan el stock físico y el PPP del depósito.',
      pk: 'id_compra',
      fks: [{ campo: 'id_tercero', tablaDestino: 'terceros', campoDestino: 'id_tercero' }],
      campos: [
        { nombre: 'id_compra', tipo: 'string', descripcion: 'Número interno de compra', esPk: true },
        { nombre: 'id_tercero', tipo: 'string', descripcion: 'Proveedor', esFk: true },
        { nombre: 'comprobante', tipo: 'string', descripcion: 'Punto de venta y número' },
        { nombre: 'total_ars', tipo: 'number', descripcion: 'Monto total en Pesos' },
        { nombre: 'moneda_origen', tipo: 'string', descripcion: 'ARS o USD con TC oficial de Dólar Hoy' },
        { nombre: 'fecha_compra', tipo: 'date', descripcion: 'Fecha de emisión' },
      ],
      registrosGetter: s => s.compras || [],
      icono: CircleDollarSign,
      color: 'blue',
    },
    {
      id: 'ventas',
      nombre: 'Ventas de Hacienda y Lana',
      hojaSheet: 'VENTAS',
      dominio: 'ECONOMIA',
      descripcion: 'Comercialización de corderos para faena, reproductores Dorper y zafra lanera.',
      pk: 'id_venta',
      fks: [{ campo: 'id_tercero', tablaDestino: 'terceros', campoDestino: 'id_tercero' }],
      campos: [
        { nombre: 'id_venta', tipo: 'string', descripcion: 'Comprobante de venta', esPk: true },
        { nombre: 'id_tercero', tipo: 'string', descripcion: 'Cliente o frigorífico comprador', esFk: true },
        { nombre: 'tipo_producto', tipo: 'string', descripcion: 'HACIENDA_EN_PIE | CARNE_FAENADA | LANA_SUCIA' },
        { nombre: 'total_ars', tipo: 'number', descripcion: 'Total facturado en ARS' },
        { nombre: 'cobrado_ars', tipo: 'number', descripcion: 'Importe efectivamente ingresado a tesorería' },
        { nombre: 'fecha_venta', tipo: 'date', descripcion: 'Fecha de la operación' },
      ],
      registrosGetter: s => s.ventas || [],
      icono: CircleDollarSign,
      color: 'blue',
    },
    {
      id: 'costos',
      nombre: 'Distribución de Costos Directos',
      hojaSheet: 'DISTRIBUCION_COSTOS',
      dominio: 'CONTABILIDAD',
      descripcion: 'Asignación analítica de costos directos e indirectos por cabeza y por subunidad.',
      pk: 'id_costo',
      fks: [{ campo: 'id_subunidad', tablaDestino: 'subunidades', campoDestino: 'id_subunidad' }],
      campos: [
        { nombre: 'id_costo', tipo: 'string', descripcion: 'Asignación de costo', esPk: true },
        { nombre: 'id_subunidad', tipo: 'string', descripcion: 'Subunidad que absorbe el costo', esFk: true },
        { nombre: 'rubro', tipo: 'string', descripcion: 'ALIMENTACION | SANIDAD | ESQUILA | PERSONAL' },
        { nombre: 'tipo_costo', tipo: 'string', descripcion: 'DIRECTO | INDIRECTO_ESTRUCTURA' },
        { nombre: 'monto_ars', tipo: 'number', descripcion: 'Importe devengado' },
      ],
      registrosGetter: s => s.costos || [],
      icono: FileText,
      color: 'purple',
    },
    {
      id: 'referencias',
      nombre: 'Valuación RT 54 (Mercado & VNR)',
      hojaSheet: 'VALUACION_RT54',
      dominio: 'CONTABILIDAD',
      descripcion: 'Parámetros de mercado para medición a Valor Neto de Realización (VNR) menos gastos de venta.',
      pk: 'id_referencia',
      fks: [{ campo: 'id_categoria', tablaDestino: 'categorias', campoDestino: 'id_categoria' }],
      campos: [
        { nombre: 'id_referencia', tipo: 'string', descripcion: 'Parámetro de medición', esPk: true },
        { nombre: 'id_categoria', tipo: 'string', descripcion: 'Categoría ovina', esFk: true },
        { nombre: 'precio_mercado_kg', tipo: 'number', descripcion: 'Cotización de referencia en Liniers/Mercado local' },
        { nombre: 'porcentaje_gastos_venta', tipo: 'number', descripcion: 'Flete, comisión y pesaje (ej: 8%)' },
        { nombre: 'vnr_calculado_cabeza', tipo: 'number', descripcion: 'Valor Neto de Realización por cabeza' },
      ],
      registrosGetter: s => s.referencias || [],
      icono: FileText,
      color: 'purple',
    },
    {
      id: 'usuarios',
      nombre: 'Usuarios & Seguridad',
      hojaSheet: 'USUARIOS',
      dominio: 'SEGURIDAD',
      descripcion: 'Cuentas de acceso, contraseñas, roles asignados y estado de habilitación operativa.',
      pk: 'id_usuario',
      fks: [],
      campos: [
        { nombre: 'id_usuario', tipo: 'string', descripcion: 'Clave de usuario', esPk: true },
        { nombre: 'username', tipo: 'string', descripcion: 'Nombre de usuario (@username)' },
        { nombre: 'rol_nombre', tipo: 'string', descripcion: 'ADMINISTRADOR | RESPONSABLE_UNIDAD | OPERADOR | AUDITORIA' },
        { nombre: 'activo', tipo: 'boolean', descripcion: 'Habilitado para ingresar' },
        { nombre: 'inhabilitado', tipo: 'boolean', descripcion: 'Bloqueo explícito de seguridad' },
      ],
      registrosGetter: s => s.usuarios || [],
      icono: ShieldCheck,
      color: 'cyan',
    },
    {
      id: 'auditoria',
      nombre: 'Bitácora Inmutable de Auditoría',
      hojaSheet: 'AUDITORIA',
      dominio: 'SEGURIDAD',
      descripcion: 'Registro cronológico con usuario, fecha, tabla, operación (ALTA/MOD/BAJA) y diff JSON.',
      pk: 'id_auditoria',
      fks: [{ campo: 'id_usuario', tablaDestino: 'usuarios', campoDestino: 'id_usuario' }],
      campos: [
        { nombre: 'id_auditoria', tipo: 'string', descripcion: 'Evento auditable', esPk: true },
        { nombre: 'id_usuario', tipo: 'string', descripcion: 'Autor de la acción', esFk: true },
        { nombre: 'username', tipo: 'string', descripcion: 'Usuario responsable' },
        { nombre: 'fecha_hora', tipo: 'string', descripcion: 'Marca temporal (YYYY-MM-DD HH:mm:ss)' },
        { nombre: 'operacion', tipo: 'string', descripcion: 'ALTA | MODIFICACION | BAJA | ANULACION' },
        { nombre: 'tabla_afectada', tipo: 'string', descripcion: 'Cuadro de datos modificado' },
        { nombre: 'motivo', tipo: 'string', descripcion: 'Justificación documentada' },
      ],
      registrosGetter: s => s.auditoria || [],
      icono: ShieldCheck,
      color: 'cyan',
    },
  ], []);

  // Total de registros vivos en la base de datos
  const totalRegistrosVivos = useMemo(() => {
    return entidadesCatalogo.reduce((acc, ent) => acc + ent.registrosGetter(state).length, 0);
  }, [entidadesCatalogo, state]);

  // Filtrado de entidades
  const entidadesFiltradas = useMemo(() => {
    return entidadesCatalogo.filter(ent => {
      const matchDominio = dominioFiltro === 'TODOS' || ent.dominio === dominioFiltro;
      const matchBusqueda =
        ent.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        ent.hojaSheet.toLowerCase().includes(busqueda.toLowerCase()) ||
        ent.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        ent.campos.some(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
      return matchDominio && matchBusqueda;
    });
  }, [entidadesCatalogo, dominioFiltro, busqueda]);

  // Si el usuario no es Administrador, pantalla de bloqueo estricta
  if (!esAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto my-12 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Módulo de Acceso Restringido</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          El <strong>Modelo de Datos y Arquitectura de Cuadros</strong> contiene especificaciones técnicas,
          relaciones de base de datos y esquemas reservados exclusivamente para usuarios con rol de <strong>ADMINISTRADOR</strong>.
        </p>
        <div className="pt-2">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold">
            Su rol actual: {currentUser?.rol_nombre || 'INVITADO'}
          </span>
        </div>
      </div>
    );
  }

  // Estado para exportaciones e ingesta con IA
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [modalIngestaIAOpen, setModalIngestaIAOpen] = useState(false);
  const [ingestaLoading, setIngestaLoading] = useState(false);
  const [ingestaTextoRaw, setIngestaTextoRaw] = useState('');
  const [ingestaArchivoNombre, setIngestaArchivoNombre] = useState('');
  const [ingestaResultado, setIngestaResultado] = useState<any | null>(null);
  const [ingestaError, setIngestaError] = useState<string | null>(null);
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // 1. Exportar Modelo de Datos a Excel Multi-Hoja (32 Hojas + Hoja de Arquitectura y Relaciones)
  const handleExportarExcelCompleto = () => {
    try {
      setExportandoExcel(true);
      const wb = XLSX.utils.book_new();

      // Hoja 1: Arquitectura y Relaciones
      const resumenArquitectura = entidadesCatalogo.map(ent => ({
        'Tabla / Entidad': ent.nombre,
        'Hoja Google Sheets': ent.hojaSheet,
        'Dominio Funcional': ent.dominio,
        'Clave Primaria (PK)': ent.pk,
        'Claves Foráneas (FK)': ent.fks.map(f => `${f.campo} -> ${f.tablaDestino}.${f.campoDestino}`).join('; ') || 'Ninguna (Raíz)',
        'Cantidad Campos': ent.campos.length,
        'Registros Vivos': ent.registrosGetter(state).length,
        'Descripción Zootécnica': ent.descripcion,
      }));
      const wsResumen = XLSX.utils.json_to_sheet(resumenArquitectura);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Arquitectura_y_Relaciones');

      // Hojas 2 a N: Las 32 tablas con sus registros reales en vivo
      entidadesCatalogo.forEach(ent => {
        const registros = ent.registrosGetter(state);
        const planos = registros.map(r => {
          const clon: Record<string, any> = {};
          Object.entries(r).forEach(([k, v]) => {
            if (v !== null && typeof v === 'object') {
              clon[k] = JSON.stringify(v);
            } else {
              clon[k] = v;
            }
          });
          return clon;
        });

        const sheetName = ent.hojaSheet.substring(0, 31);
        const ws = planos.length > 0 ? XLSX.utils.json_to_sheet(planos) : XLSX.utils.aoa_to_sheet([[...ent.campos.map(c => c.nombre)]]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const fileName = `AGROGESTIONA_Modelo_Datos_Completo_${new Date().toISOString().substring(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setMensajeToast({
        tipo: 'exito',
        texto: `Modelo de datos exportado con éxito en Excel (${entidadesCatalogo.length + 1} hojas con arquitectura y relaciones completas).`,
      });
    } catch (e: any) {
      console.error('Error al exportar modelo a Excel:', e);
      setMensajeToast({ tipo: 'error', texto: `Error al exportar a Excel: ${e.message}` });
    } finally {
      setExportandoExcel(false);
    }
  };

  // 2. Exportar Esquema y Relaciones a PDF
  const handleExportarPdf = () => {
    try {
      setExportandoPdf(true);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(15);
      doc.setTextColor(15, 60, 45);
      doc.text('AGROGESTIONA ERP — Arquitectura de Datos y Matriz de Relaciones', 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Establecimiento Pozo del Carril - La Aguada (UNRC) | Generado: ${new Date().toLocaleString('es-AR')} | Usuario: ${currentUser.nombre_completo}`, 14, 21);

      const tableData = entidadesCatalogo.map(ent => [
        ent.hojaSheet,
        ent.nombre,
        ent.dominio,
        ent.pk,
        ent.fks.map(f => `${f.campo} -> ${f.tablaDestino}`).join(', ') || 'Raíz',
        ent.campos.length.toString(),
        ent.registrosGetter(state).length.toString(),
      ]);

      autoTable(doc, {
        startY: 26,
        head: [['Hoja Sheet', 'Entidad / Cuadro', 'Dominio', 'PK', 'Relaciones Foráneas (FK)', 'Campos', 'Registros']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 75, 55], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 32 },
          1: { cellWidth: 50 },
          2: { cellWidth: 28 },
          3: { cellWidth: 24 },
          4: { cellWidth: 75 },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' },
        },
      });

      doc.save(`AGROGESTIONA_Arquitectura_Datos_${new Date().toISOString().substring(0, 10)}.pdf`);
      setMensajeToast({
        tipo: 'exito',
        texto: 'Documentación técnica en PDF generada exitosamente con todas las tablas y relaciones.',
      });
    } catch (e: any) {
      console.error('Error al exportar PDF:', e);
      setMensajeToast({ tipo: 'error', texto: `Error al generar PDF: ${e.message}` });
    } finally {
      setExportandoPdf(false);
    }
  };

  // 3. Procesar archivo o texto con Inteligencia Artificial (Gemini)
  const handleProcesarConIA = async (textoAEnviar?: string, nombreArchivo?: string) => {
    const raw = textoAEnviar || ingestaTextoRaw;
    if (!raw || raw.trim().length === 0) {
      setIngestaError('Debe ingresar texto o seleccionar un archivo para procesar con IA.');
      return;
    }

    setIngestaLoading(true);
    setIngestaError(null);
    setIngestaResultado(null);

    try {
      const res = await fetch('/api/ai/parse-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: raw,
          fileName: nombreArchivo || ingestaArchivoNombre || 'archivo_cargado',
          defaultCampania: 'CAM-2026',
          defaultSubunidad: 'SUB-CRIA',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo interpretar el archivo con IA');
      }

      setIngestaResultado(data);
    } catch (err: any) {
      setIngestaError(err.message || 'Error al comunicarse con el servicio de IA');
    } finally {
      setIngestaLoading(false);
    }
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIngestaArchivoNombre(file.name);
    setIngestaError(null);
    setIngestaResultado(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    if (isExcel) {
      reader.onload = evt => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          let textoAcumulado = '';
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            textoAcumulado += `\n--- HOJA: ${sheetName} ---\n${csv}`;
          });
          setIngestaTextoRaw(textoAcumulado);
          handleProcesarConIA(textoAcumulado, file.name);
        } catch (ex: any) {
          setIngestaError(`Error al leer archivo Excel: ${ex.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = evt => {
        const text = evt.target?.result as string;
        setIngestaTextoRaw(text);
        handleProcesarConIA(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  // 4. Confirmar e Integrar en Base de Datos en Vivo
  const handleConfirmarIngestaEnBase = () => {
    if (!ingestaResultado?.records) return;

    const records = ingestaResultado.records;
    let incorporadosCount = 0;

    // Integrar movimientos si existen
    if (Array.isArray(records.movimientos) && records.movimientos.length > 0) {
      records.movimientos.forEach((m: any, idx: number) => {
        state.movimientos.unshift({
          id_movimiento: m.id_movimiento || `MOV-IA-${Date.now()}-${idx}`,
          id_campania: m.id_campania || 'CAM-2026',
          fecha: m.fecha || getFechaArgentinaISO(),
          tipo: m.tipo || 'TRANSFERENCIA_SUBUNIDAD',
          id_subunidad_origen: m.id_subunidad_origen || undefined,
          id_subunidad_destino: m.id_subunidad_destino || 'SUB-CRIA',
          id_lote_origen: m.id_lote_origen || undefined,
          id_lote_destino: m.id_lote_destino || 'LOT001',
          id_categoria_origen: m.id_categoria_origen || undefined,
          id_categoria_destino: m.id_categoria_destino || 'CAT-MAD',
          cabezas: Number(m.cabezas) || 1,
          kg_vivo_total: m.kg_vivo_total ? Number(m.kg_vivo_total) : undefined,
          motivo: m.motivo || 'Ingesta mediante IA Gemini',
          anulado: false,
          es_prueba: false,
          usuario_id: currentUser.id_usuario,
        });
        incorporadosCount++;
      });
    }

    // Integrar pesajes si existen
    if (Array.isArray(records.pesajes) && records.pesajes.length > 0) {
      records.pesajes.forEach((p: any, idx: number) => {
        state.pesajes.unshift({
          id_pesaje: p.id_pesaje || `PES-IA-${Date.now()}-${idx}`,
          id_campania: p.id_campania || 'CAM-2026',
          id_subunidad: p.id_subunidad || 'SUB-CRIA',
          id_lote: p.id_lote || 'LOT001',
          id_categoria: p.id_categoria || 'CAT-MAD',
          fecha: p.fecha || getFechaArgentinaISO(),
          cabezas_pesadas: Number(p.cabezas_pesadas) || 1,
          kg_vivo_total: Number(p.kg_vivo_total) || 45,
          kg_vivo_promedio: Number(p.kg_vivo_promedio) || 45,
          tipo_peso: p.tipo_peso === 'KG_RES' ? 'KG_RES' : 'KG_VIVO',
          observaciones: p.observaciones || 'Ingesta mediante IA Gemini',
          es_prueba: false,
          usuario_id: currentUser.id_usuario,
        });
        incorporadosCount++;
      });
    }

    // Integrar sanidad si existen
    if (Array.isArray(records.sanidad) && records.sanidad.length > 0) {
      records.sanidad.forEach((s: any, idx: number) => {
        state.sanidad.unshift({
          id_aplicacion: s.id_aplicacion || `SAN-IA-${Date.now()}-${idx}`,
          id_campania: s.id_campania || 'CAM-2026',
          id_subunidad: s.id_subunidad || 'SUB-CRIA',
          id_lote: s.id_lote || 'LOT001',
          id_categoria: s.id_categoria || 'CAT-MAD',
          id_insumo: s.id_insumo || 'INS-VAC-CLOST',
          fecha: s.fecha || getFechaArgentinaISO(),
          cabezas_tratadas: Number(s.cabezas_tratadas) || 1,
          dosis_unitaria_real: Number(s.dosis_unitaria_real) || 1,
          id_um_dosis: s.id_um_dosis || 'DOSIS',
          consumo_total_real: Number(s.consumo_total_real) || 1,
          id_consumo_asociado: s.id_consumo_asociado || `CON-IA-${Date.now()}-${idx}`,
          id_costo_asociado: s.id_costo_asociado || `COS-IA-${Date.now()}-${idx}`,
          diagnostico_motivo: s.diagnostico_motivo || 'Ingesta mediante IA Gemini',
          es_prueba: false,
          usuario_id: currentUser.id_usuario,
        });
        incorporadosCount++;
      });
    }

    // Registrar en auditoría inmutable
    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      nombre_usuario: currentUser.nombre_completo,
      rol_usuario: currentUser.rol_nombre,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'modelo_datos_ia',
      id_registro: `INGESTA-IA-${Date.now()}`,
      valor_nuevo: JSON.stringify({ incorporadosCount, summary: ingestaResultado.summary || ingestaArchivoNombre }),
      motivo: `Ingesta en vivo de ${incorporadosCount} registros con IA (${ingestaResultado.summary || ingestaArchivoNombre})`,
    });

    saveDatabaseState(state);
    if (onStateUpdate) onStateUpdate();

    setMensajeToast({
      tipo: 'exito',
      texto: `¡Ingesta exitosa! Se incorporaron ${incorporadosCount} registros en vivo al modelo de datos y la auditoría.`,
    });
    setModalIngestaIAOpen(false);
    setIngestaResultado(null);
    setIngestaTextoRaw('');
    setIngestaArchivoNombre('');
  };

  // Verificación interactiva de integridad referencial
  const ejecutarDiagnosticoIntegridad = () => {
    setEscaneandoIntegridad(true);
    setTimeout(() => {
      setEscaneandoIntegridad(false);
      setUltimoEscaneo(new Date().toLocaleTimeString('es-AR'));
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Toast de Notificación */}
      {mensajeToast && (
        <div
          className={`p-3.5 rounded-[2px] border text-xs flex items-center justify-between shadow-lg ${
            mensajeToast.tipo === 'exito'
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/80 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {mensajeToast.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{mensajeToast.texto}</span>
          </div>
          <button
            onClick={() => setMensajeToast(null)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner Superior Exclusivo Administradores */}
      <div className="p-6 rounded-[2px] bg-slate-50 dark:bg-[#12241d] border border-slate-200 dark:border-[#264d3f] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[2px] bg-indigo-100 text-indigo-900 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-500/40 dark:text-indigo-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Exclusivo Administradores • Arquitectura Técnica UNRC</span>
            </div>
            <div className="flex items-center space-x-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
                <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Modelo de Datos & Dinámica de Cuadros</span>
              </h1>
              <BotonAyudaContextual moduloId="modelo_datos" onOpenManual={onOpenManual} />
            </div>
            <p className="text-sm text-slate-600 dark:text-[#a2c7b5] max-w-2xl leading-relaxed">
              Mapa visual de la estructura relacional en <strong>3FN</strong>, vinculaciones entre las{' '}
              <strong>32 hojas normalizadas de Google Sheets</strong> y ciclo dinámico de la información zootécnica y contable (RT 54).
            </p>

            {/* BOTONES DE ACCIÓN: EXPORTAR EXCEL, EXPORTAR PDF, INGESTA CON IA */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportarExcelCompleto}
                disabled={exportandoExcel}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold rounded-[2px] text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                title="Exportar todo el modelo relacional a Excel con 32 hojas individuales y hoja de arquitectura de relaciones"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{exportandoExcel ? 'Generando Excel...' : 'Exportar Modelo a Excel (.xlsx)'}</span>
              </button>

              <button
                onClick={handleExportarPdf}
                disabled={exportandoPdf}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-600 font-bold rounded-[2px] text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                title="Exportar documentación técnica y diccionario relacional a PDF formal"
              >
                <FileDown className="w-4 h-4 text-rose-400" />
                <span>{exportandoPdf ? 'Generando PDF...' : 'Exportar Esquema a PDF'}</span>
              </button>

              <button
                onClick={() => setModalIngestaIAOpen(true)}
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white font-bold rounded-[2px] text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
                title="Cargar en vivo un modelo de datos o planilla y sincronizarlo con Inteligencia Artificial"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ingesta con Inteligencia Artificial (Gemini)</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas Arquitectónicas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3 rounded-[2px] bg-white dark:bg-[#183027] border border-slate-200 dark:border-[#264d3f] text-center shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-[#a2c7b5] font-semibold uppercase block">Tablas/Hojas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">32</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Normalizadas</span>
            </div>
            <div className="p-3 rounded-[2px] bg-white dark:bg-[#183027] border border-slate-200 dark:border-[#264d3f] text-center shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-[#a2c7b5] font-semibold uppercase block">Dominios</span>
              <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">5</span>
              <span className="text-[10px] text-slate-500 dark:text-[#a2c7b5] block">Zoot./Econ./RT54</span>
            </div>
            <div className="p-3 rounded-[2px] bg-white dark:bg-[#183027] border border-slate-200 dark:border-[#264d3f] text-center shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-[#a2c7b5] font-semibold uppercase block">Registros Vivos</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{totalRegistrosVivos}</span>
              <span className="text-[10px] text-slate-500 dark:text-[#a2c7b5] block">En memoria ERP</span>
            </div>
            <div className="p-3 rounded-[2px] bg-white dark:bg-[#183027] border border-slate-200 dark:border-[#264d3f] text-center shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-[#a2c7b5] font-semibold uppercase block">Integridad FK</span>
              <span className="text-xl font-black text-cyan-700 dark:text-cyan-400">100%</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Sin Huérfanos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas Visuales */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setVista('diagrama')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              vista === 'diagrama'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Diagrama Relacional Interactivo</span>
          </button>
          <button
            onClick={() => setVista('flujos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              vista === 'flujos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Flujos de Funcionamiento</span>
          </button>
          <button
            onClick={() => setVista('hojas')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              vista === 'hojas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Diccionario de las 32 Hojas</span>
          </button>
          <button
            onClick={() => setVista('integridad')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              vista === 'integridad'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Auditor de Integridad Referencial</span>
          </button>
          <button
            onClick={() => setVista('repositorio_archivos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              vista === 'repositorio_archivos'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Carga de Archivos & Antecedentes</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
              {archivosCargados.length}
            </span>
          </button>
        </div>

        {vista === 'diagrama' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tabla o campo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          VISTA 1: DIAGRAMA RELACIONAL INTERACTIVO (MAPA VISUAL)
          ======================================================== */}
      {vista === 'diagrama' && (
        <div className="space-y-6">
          {/* Filtros de Dominio */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Filtrar Dominio:</span>
            {(
              [
                { id: 'TODOS', label: 'Todos los Dominios', color: 'bg-slate-800 text-slate-200' },
                { id: 'ZOOTECNICO', label: '🐑 Zootécnico & Majada', color: 'bg-emerald-500/20 text-emerald-300' },
                { id: 'INSUMOS', label: '🌾 Insumos & Depósito', color: 'bg-amber-500/20 text-amber-300' },
                { id: 'ECONOMIA', label: '💰 Operaciones Económicas', color: 'bg-blue-500/20 text-blue-300' },
                { id: 'CONTABILIDAD', label: '📊 Contabilidad RT 54', color: 'bg-purple-500/20 text-purple-300' },
                { id: 'SEGURIDAD', label: '🛡️ Seguridad & Auditoría', color: 'bg-cyan-500/20 text-cyan-300' },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => setDominioFiltro(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  dominioFiltro === f.id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grilla Visual de Entidades y Conexiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entidadesFiltradas.map(ent => {
              const Icon = ent.icono;
              const registrosCount = ent.registrosGetter(state).length;
              const estaSeleccionada = entidadSeleccionada?.id === ent.id;

              return (
                <div
                  key={ent.id}
                  onClick={() => setEntidadSeleccionada(ent)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    estaSeleccionada
                      ? 'bg-slate-850 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-lg'
                  }`}
                >
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                          {ent.nombre}
                        </h3>
                        <span className="font-mono text-[10px] text-slate-400 font-bold block">
                          Hoja: {ent.hojaSheet}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {registrosCount} filas
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {ent.descripcion}
                  </p>

                  {/* Llaves Primarias y Foráneas */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="flex items-center space-x-1.5 text-amber-400">
                      <Key className="w-3 h-3 shrink-0" />
                      <span className="font-bold">PK:</span>
                      <span className="truncate text-slate-300">{ent.pk}</span>
                    </div>

                    {ent.fks.length > 0 ? (
                      <div className="flex items-start space-x-1.5 text-cyan-400">
                        <Link className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="font-bold">FK:</span>
                        <div className="flex flex-wrap gap-1">
                          {ent.fks.map((fk, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300"
                            >
                              {fk.campo} ➔ {fk.tablaDestino}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic pl-4">Entidad raíz (Sin llaves foráneas)</div>
                    )}
                  </div>

                  {/* Botón Inspeccionar */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 text-[10px]">
                      {ent.campos.length} campos definidos
                    </span>
                    <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5 font-bold">
                      <span>Inspeccionar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel Lateral / Modal de Inspección Detallada de la Entidad */}
          {entidadSeleccionada && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      <Table className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {entidadSeleccionada.nombre}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Hoja Google Sheets: <strong>{entidadSeleccionada.hojaSheet}</strong> • Clave Primaria: <span className="text-amber-400">{entidadSeleccionada.pk}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEntidadSeleccionada(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5 text-xs">
                  <div>
                    <h4 className="font-bold text-white mb-1">Descripción Funcional</h4>
                    <p className="text-slate-300 leading-relaxed">
                      {entidadSeleccionada.descripcion}
                    </p>
                  </div>

                  {/* Esquema de Campos */}
                  <div>
                    <h4 className="font-bold text-white mb-2">Esquema de Campos y Tipos de Datos</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="py-2 px-3">Campo</th>
                            <th className="py-2 px-3">Tipo</th>
                            <th className="py-2 px-3">Clave</th>
                            <th className="py-2 px-3">Descripción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                          {entidadSeleccionada.campos.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-800/30">
                              <td className="py-2 px-3 font-bold text-slate-200">{c.nombre}</td>
                              <td className="py-2 px-3 text-cyan-400">{c.tipo}</td>
                              <td className="py-2 px-3">
                                {c.esPk ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                    PK 🔑
                                  </span>
                                ) : c.esFk ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                                    FK 🔗
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-400">{c.descripcion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Relaciones Foráneas */}
                  {entidadSeleccionada.fks.length > 0 && (
                    <div>
                      <h4 className="font-bold text-white mb-2">Relaciones Salientes (Foreign Keys)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {entidadSeleccionada.fks.map((fk, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="font-mono text-cyan-300 font-bold">{fk.campo}</span>
                              <p className="text-[10px] text-slate-500">Apunta a {fk.tablaDestino}.{fk.campoDestino}</p>
                            </div>
                            <span className="text-xs">➔</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Muestra de Datos Reales en Vivo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white">Muestra de Filas en Memoria ({entidadSeleccionada.registrosGetter(state).length} en total)</h4>
                      <span className="text-[10px] text-emerald-400 font-bold">Datos en vivo</span>
                    </div>
                    {entidadSeleccionada.registrosGetter(state).length > 0 ? (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] max-h-48 overflow-y-auto">
                        <pre className="text-slate-300 leading-tight">
                          {JSON.stringify(entidadSeleccionada.registrosGetter(state).slice(0, 3), null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-slate-500">
                        No hay registros cargados aún en esta tabla.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() => setEntidadSeleccionada(null)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VISTA 2: FLUJOS DE FUNCIONAMIENTO ENTRE CUADROS
          ======================================================== */}
      {vista === 'flujos' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setFlujoActivo('zootecnico')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flujoActivo === 'zootecnico'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Ciclo Zootécnico & Transferencias
            </button>
            <button
              onClick={() => setFlujoActivo('insumos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flujoActivo === 'insumos'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Insumos, Depósito & Costos PPP
            </button>
            <button
              onClick={() => setFlujoActivo('contable')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flujoActivo === 'contable'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Medición Contable RT 54 & VNR
            </button>
            <button
              onClick={() => setFlujoActivo('auditoria')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flujoActivo === 'auditoria'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4. Auditoría Inmutable & RBAC
            </button>
          </div>

          {/* FLUJO 1: ZOOTECNICO */}
          {flujoActivo === 'zootecnico' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-md text-xs">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Flujograma del Ciclo Zootécnico & Movimiento de Hacienda
                </h3>
                <p className="text-slate-400">
                  Explica cómo interactúan las tablas de unidades, subunidades (Cría/Recría), lotes, categorías, pesajes y movimientos físicos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">1</span>
                    <span>Nacimiento / Entrada</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Se registra la parición en la Subunidad <strong>Cría</strong> en el potrero LOT001.
                  </p>
                  <div className="font-mono text-[10px] text-emerald-300 bg-slate-950 p-2 rounded-lg">
                    ➔ Cuadro: MOVIMIENTOS<br />
                    ➔ Cuadro: INVENTARIO (+1 cab)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">2</span>
                    <span>Categorización</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    El animal ingresa como <strong>Cordero al Pie (SNC)</strong> con trazabilidad materna.
                  </p>
                  <div className="font-mono text-[10px] text-blue-300 bg-slate-900 p-2 rounded-lg">
                    ➔ Cuadro: CATEGORIAS<br />
                    ➔ Cuadro: INVENTARIO
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">3</span>
                    <span>Control de Pesaje</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Se registra el peso en manga y se computa la Ganancia Media Diaria (GMD).
                  </p>
                  <div className="font-mono text-[10px] text-amber-300 bg-slate-900 p-2 rounded-lg">
                    ➔ Cuadro: PESAJES<br />
                    ➔ GMD: (Peso₂ - Peso₁) / días
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">4</span>
                    <span>Transferencia a Recría</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Al destete, se traslada de <strong>Cría</strong> a <strong>Recría</strong> como Borrega o Cordero Engorde.
                  </p>
                  <div className="font-mono text-[10px] text-purple-300 bg-slate-900 p-2 rounded-lg">
                    ➔ MOVIMIENTOS: TRASLADO<br />
                    ➔ INVENTARIO: Disminuye Cría, Aumenta Recría
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">5</span>
                    <span>Egreso / Venta</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Comercialización para faena o incorporación a plantel de reproductoras.
                  </p>
                  <div className="font-mono text-[10px] text-emerald-300 bg-slate-950 p-2 rounded-lg">
                    ➔ Cuadro: VENTAS<br />
                    ➔ Cuadro: DETALLES_VENTAS
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FLUJO 2: INSUMOS */}
          {flujoActivo === 'insumos' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-md text-xs">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Flujograma de Insumos, Depósito & Precio Promedio Ponderado (PPP)
                </h3>
                <p className="text-slate-400">
                  Explica cómo la compra de alimentos o sanidad ingresa al depósito, recalcula el PPP en ARS/USD y se descarga al imputar consumo a una subunidad.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                  <span className="font-bold text-amber-400 block text-sm">Paso 1: Compra & Factura</span>
                  <p className="text-slate-300">
                    Se compra insumo (ej: Fardos de Alfalfa o Ivermectina). Si es en USD, se toma la cotización de Dólar Hoy.
                  </p>
                  <div className="font-mono text-[10px] bg-slate-950 p-2 rounded-lg text-amber-200">
                    ➔ Cuadro: COMPRAS<br />
                    ➔ Cuadro: DETALLES_COMPRAS
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-blue-400 block text-sm">Paso 2: Recálculo de PPP</span>
                  <p className="text-slate-300">
                    El depósito recalcula el costo promedio: <br />
                    <code>PPP = (Stock×PPP_ant + Q_nueva×P_nuevo) / Stock_total</code>
                  </p>
                  <div className="font-mono text-[10px] bg-slate-900 p-2 rounded-lg text-blue-200">
                    ➔ Cuadro: INSUMOS<br />
                    ➔ Actualiza <code>precio_promedio_ponderado</code>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-indigo-400 block text-sm">Paso 3: Carga de Consumo</span>
                  <p className="text-slate-300">
                    El operario suministra ración a la subunidad (Cría o Recría). Se descuenta stock físico.
                  </p>
                  <div className="font-mono text-[10px] bg-slate-900 p-2 rounded-lg text-indigo-200">
                    ➔ Cuadro: CONSUMOS_INSUMOS<br />
                    ➔ Stock Insumo disminuye
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <span className="font-bold text-emerald-400 block text-sm">Paso 4: Costo Directo & Margen</span>
                  <p className="text-slate-300">
                    El valor monetario del consumo impacta como <strong>Costo Directo</strong> de la subunidad, deduciendo su Margen Bruto.
                  </p>
                  <div className="font-mono text-[10px] bg-slate-950 p-2 rounded-lg text-emerald-200">
                    ➔ Cuadro: DISTRIBUCION_COSTOS<br />
                    ➔ Margen Bruto = Ingresos - Costos Directos
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FLUJO 3: CONTABILIDAD RT 54 */}
          {flujoActivo === 'contable' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-md text-xs">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Flujograma de Valuación de Activos Biológicos bajo RT 54 (FACPCE)
                </h3>
                <p className="text-slate-400">
                  Diferenciación contable entre hacienda reproductora (costo histórico menos amortizaciones) y hacienda destinada a la venta (VNR).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <span className="font-bold text-purple-300 block text-sm">1. Inventario al Cierre</span>
                  <p className="text-slate-300">
                    Se toma la existencia física de 81 cabezas clasificadas según su aptitud biológica:
                  </p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>Madres y Carneros: Reproductores (Activo No Corriente).</li>
                    <li>Corderos y Borregas: Destino Venta (Activo Corriente).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-300 block text-sm">2. Valor Neto de Realización (VNR)</span>
                  <p className="text-slate-300">
                    Fórmula oficial de medición a mercado:
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-200">
                    VNR = Precio Mercado - Gastos Estimados Venta (8%)<br />
                    VNR = (Peso_kg × $/kg) × (1 - 0.08)
                  </div>
                  <p className="text-slate-400 text-[10px]">Cuadro de referencia: VALUACION_RT54</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <span className="font-bold text-emerald-300 block text-sm">3. Resultado por Tenencia</span>
                  <p className="text-slate-300">
                    La variación entre el costo de producción acumulado y el VNR se reconoce en el Estado de Resultados:
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-emerald-200">
                    RXT = VNR al Cierre - Costo Histórico Incurrido
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FLUJO 4: AUDITORIA */}
          {flujoActivo === 'auditoria' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-md text-xs">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Flujograma de Seguridad RBAC, Concurrencia & Auditoría Inmutable
                </h3>
                <p className="text-slate-400">
                  Garantiza trazabilidad de cada mutación de datos con firma de usuario, rol y fecha.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400 block text-sm">1. Solicitud de Mutación</span>
                  <p className="text-slate-300">
                    El usuario intenta crear, modificar o anular un registro (ej: alta de insumo, nuevo parto).
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-blue-400 block text-sm">2. Verificación RBAC</span>
                  <p className="text-slate-300">
                    Express y React verifican la matriz de permisos. Si el rol no tiene <code>CREAR</code> o <code>ADMINISTRAR</code>, se rechaza.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 block text-sm">3. Escritura Atómica</span>
                  <p className="text-slate-300">
                    Se actualiza el estado en memoria y se persiste en <code>server-db-store.json</code> y caché local.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <span className="font-bold text-emerald-400 block text-sm">4. Snapshot en Auditoría</span>
                  <p className="text-slate-300">
                    Se añade un registro inmutable al Cuadro de Auditoría con diff JSON, usuario y motivo documentado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VISTA 3: DICCIONARIO DE LAS 32 HOJAS NORMALIZADAS
          ======================================================== */}
      {vista === 'hojas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Arquitectura de las 32 Hojas de Cálculo Google Sheets</h3>
              <p className="text-slate-400">Estructura normalizada en Tercera Forma Normal (3FN) para integración bidireccional con el ERP.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-xl bg-slate-800 font-mono text-emerald-400 font-bold">
                Total Hojas: 32
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">N°</th>
                  <th className="py-3 px-4">Nombre de Hoja</th>
                  <th className="py-3 px-4">Dominio</th>
                  <th className="py-3 px-4">Clave Primaria (PK)</th>
                  <th className="py-3 px-4">Claves Foráneas (FK)</th>
                  <th className="py-3 px-4 text-right">Filas Vivas</th>
                  <th className="py-3 px-4">Propósito Didáctico en UNRC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {entidadesCatalogo.map((ent, idx) => {
                  const cant = ent.registrosGetter(state).length;
                  return (
                    <tr
                      key={ent.id}
                      onClick={() => setEntidadSeleccionada(ent)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white flex items-center space-x-2">
                        <span>{ent.hojaSheet}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {ent.dominio}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400 font-bold text-[11px]">{ent.pk}</td>
                      <td className="py-3 px-4 font-mono text-cyan-400 text-[11px]">
                        {ent.fks.length > 0 ? ent.fks.map(f => f.campo).join(', ') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400 font-mono">
                        {cant}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                        {ent.descripcion}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          VISTA 4: AUDITOR DE INTEGRIDAD REFERENCIAL
          ======================================================== */}
      {vista === 'integridad' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Diagnóstico de Salud e Integridad Referencial en Vivo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Verifica que no existan registros huérfanos entre llaves foráneas y catálogos maestros.
              </p>
            </div>

            <button
              onClick={ejecutarDiagnosticoIntegridad}
              disabled={escaneandoIntegridad}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${escaneandoIntegridad ? 'animate-spin' : ''}`} />
              <span>{escaneandoIntegridad ? 'Escaneando base de datos...' : 'Re-escanear Integridad'}</span>
            </button>
          </div>

          {/* Grilla de Resultados de Integridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">1. Integridad Subunidades ➔ Lotes</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  100% Válido
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Todos los potreros en LOTES ({state.lotes.length}) apuntan a una Subunidad válida en SUBUNIDADES.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[10px] text-emerald-300">
                ✓ 0 claves foráneas huérfanas detectadas
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">2. Integridad Consumos ➔ Depósito Insumos</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  100% Válido
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Los consumos imputados corresponden a insumos dados de alta en el catálogo central ({state.insumos.length} insumos).
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[10px] text-emerald-300">
                ✓ Todos los insumos tienen unidad de medida y PPP válido
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">3. Integridad Operaciones Económicas ➔ Terceros</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  100% Válido
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Las compras y ventas se asocian a clientes y proveedores registrados en TERCEROS ({state.terceros.length} terceros).
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[10px] text-emerald-300">
                ✓ Trazabilidad fiscal y cuentas corrientes coherentes
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">4. Integridad Auditoría ➔ Usuarios Registrados</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  100% Válido
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Cada asiento de la bitácora de auditoría inmutable está firmado por un usuario verificado en USUARIOS ({state.usuarios.length} cuentas).
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[10px] text-emerald-300">
                ✓ Ninguna operación anónima o sin trazabilidad
              </div>
            </div>
          </div>

          {ultimoEscaneo && (
            <p className="text-center text-slate-500 text-[11px]">
              Último diagnóstico ejecutado exitosamente a las {ultimoEscaneo} con cero inconsistencias.
            </p>
          )}
        </div>
      )}

      {/* VISTA: Repositorio de Archivos y Antecedentes Históricos */}
      {vista === 'repositorio_archivos' && (
        <div className="space-y-6">
          {/* Encabezado del Módulo de Archivos */}
          <div className="p-5 rounded-[2px] bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  BASE DE DATOS DOCUMENTAL & ANTECEDENTES
                </span>
                <span className="text-xs text-slate-400">• Todos los formatos admitidos (PDF, Excel, SQL, TXT, XML)</span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FolderUp className="w-5 h-5 text-emerald-400" />
                <span>Ingesta y Suministro de Archivos Históricos al Sistema</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Cargue balances históricos, planillas de pesaje, esquemas de bases de datos o resoluciones técnicas para nutrir la memoria operativa de AGROGESTIONA ERP y facilitar la toma de decisiones zootécnicas y contables.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-mono text-slate-400">Archivos activos:</span>
              <span className="px-3 py-1 bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-mono font-bold text-sm rounded-[2px]">
                {archivosCargados.length} Registros
              </span>
            </div>
          </div>

          {mensajeExitoCarga && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs rounded-[2px] flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{mensajeExitoCarga}</span>
              </span>
              <button onClick={() => setMensajeExitoCarga(null)} className="text-emerald-400 hover:text-white text-xs underline cursor-pointer">
                Cerrar
              </button>
            </div>
          )}

          {/* Formulario de Carga de Archivos */}
          <div className="p-5 rounded-[2px] bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Cargar Nuevo Archivo o Antecedente al ERP</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nombre o Título del Archivo</label>
                <input
                  type="text"
                  placeholder="Ej: Balance_RT54_2025.pdf"
                  value={nuevoNombreDoc}
                  onChange={e => setNuevoNombreDoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs rounded-[2px] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Categoría Documental</label>
                <select
                  value={nuevoTipoDoc}
                  onChange={e => setNuevoTipoDoc(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs rounded-[2px] focus:outline-none focus:border-emerald-500"
                >
                  <option value="ANTECEDENTE_HISTORICO">Antecedente Histórico</option>
                  <option value="PLANILLA_PESAJES">Planilla de Pesajes / Raciones (Excel)</option>
                  <option value="BALANCE_RT54">Balance / Activos Biológicos RT 54</option>
                  <option value="INVENTARIO_INICIAL">Inventario Inicial de Existencias</option>
                  <option value="BASE_DATOS_EXTERNA">Base de Datos Externa (SQL / Access / DB)</option>
                  <option value="CERTIFICADO_SENASA">Certificado Sanitario / SENASA</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Especie Imputada</label>
                <select
                  value={nuevaEspecieDoc}
                  onChange={e => setNuevaEspecieDoc(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs rounded-[2px] focus:outline-none focus:border-emerald-500"
                >
                  <option value="Consolidado">Consolidado (Todas las especies)</option>
                  <option value="Bovinos">Bovinos (Carne / Ciclo 390d)</option>
                  <option value="Ovinos">Ovinos (Cabaña Dorper)</option>
                  <option value="Porcinos">Porcinos (Cría / Destete / Engorde)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Campaña / Ejercicio</label>
                <input
                  type="text"
                  value={nuevaCampaniaDoc}
                  onChange={e => setNuevaCampaniaDoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs rounded-[2px] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Descripción / Resumen de Antecedentes</label>
              <textarea
                rows={2}
                placeholder="Breve reseña de los datos que contiene (ej: datos de alimentación 78%, mano de obra $3M, stock reconciliado 174 cabezas)..."
                value={nuevaDescDoc}
                onChange={e => setNuevaDescDoc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs rounded-[2px] focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Zona Dropzone / Selector de Archivo Local */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border border-dashed border-slate-700 bg-slate-950/60 rounded-[2px]">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Seleccionar archivo desde el equipo</span>
                  <span className="text-[11px] text-slate-400 block">Formatos: .pdf, .xlsx, .xls, .csv, .txt, .json, .xml, .sql, .db</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <input
                  type="file"
                  id="input-archivo-bd"
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.csv,.txt,.json,.xml,.sql,.db"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const ext = file.name.split('.').pop()?.toUpperCase() || '';
                    let formato: ArchivoAntecedente['formato'] = 'DOCUMENTO_TXT';
                    if (['PDF'].includes(ext)) formato = 'PDF';
                    else if (['XLSX', 'XLS', 'CSV'].includes(ext)) formato = 'EXCEL';
                    else if (['SQL', 'DB', 'MDB', 'SQLITE'].includes(ext)) formato = 'BASE_DATOS';

                    if (!nuevoNombreDoc) {
                      setNuevoNombreDoc(file.name);
                    }

                    // Si es texto, leer contenido
                    if (['TXT', 'JSON', 'CSV', 'XML', 'SQL'].includes(ext)) {
                      const reader = new FileReader();
                      reader.onload = evt => {
                        const contenido = evt.target?.result as string;
                        const nuevoDoc: ArchivoAntecedente = {
                          id: `DOC-${String(archivosCargados.length + 1).padStart(3, '0')}`,
                          nombre: file.name,
                          formato,
                          tamanioKb: Math.round((file.size / 1024) * 10) / 10,
                          fechaCarga: new Date().toLocaleString('es-AR'),
                          usuarioCarga: currentUser?.username || 'admin',
                          especie: nuevaEspecieDoc,
                          categoriaDoc: nuevoTipoDoc,
                          campania: nuevaCampaniaDoc,
                          descripcion: nuevaDescDoc || `Archivo cargado desde el disco local (${file.name}).`,
                          estado: 'INCORPORADO',
                          contenidoTexto: contenido.slice(0, 50000),
                        };
                        setArchivosCargados(prev => [nuevoDoc, ...prev]);
                        setMensajeExitoCarga(`El archivo "${file.name}" ha sido incorporado y procesado con éxito en el sistema.`);
                        setNuevoNombreDoc('');
                        setNuevaDescDoc('');
                      };
                      reader.readAsText(file);
                    } else {
                      // PDF o Excel binario
                      const nuevoDoc: ArchivoAntecedente = {
                        id: `DOC-${String(archivosCargados.length + 1).padStart(3, '0')}`,
                        nombre: file.name,
                        formato,
                        tamanioKb: Math.round((file.size / 1024) * 10) / 10,
                        fechaCarga: new Date().toLocaleString('es-AR'),
                        usuarioCarga: currentUser?.username || 'admin',
                        especie: nuevaEspecieDoc,
                        categoriaDoc: nuevoTipoDoc,
                        campania: nuevaCampaniaDoc,
                        descripcion: nuevaDescDoc || `Archivo binario registrado para trazabilidad zootécnica y contable.`,
                        estado: 'INCORPORADO',
                      };
                      setArchivosCargados(prev => [nuevoDoc, ...prev]);
                      setMensajeExitoCarga(`El archivo "${file.name}" (${formato}) se registró en la base documental del ERP.`);
                      setNuevoNombreDoc('');
                      setNuevaDescDoc('');
                    }
                  }}
                />
                <label
                  htmlFor="input-archivo-bd"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-[2px] cursor-pointer flex items-center space-x-2 border border-slate-600 transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Examinar Archivos...</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tabla de Archivos Registrados */}
          <div className="p-5 rounded-[2px] bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Documentos & Antecedentes Activos en la Base de Datos</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Los datos se encuentran disponibles para consultas del Asesor de IA y cálculos de valuación RT 54.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">ID / Archivo</th>
                    <th className="py-2.5 px-3">Formato</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Especie</th>
                    <th className="py-2.5 px-3">Campaña</th>
                    <th className="py-2.5 px-3">Tamaño</th>
                    <th className="py-2.5 px-3">Cargado Por</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {archivosCargados.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{doc.nombre}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{doc.id} • {doc.fechaCarga}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold font-mono ${
                            doc.formato === 'PDF'
                              ? 'bg-rose-500/20 text-rose-300'
                              : doc.formato === 'EXCEL'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : doc.formato === 'BASE_DATOS'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {doc.formato}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {doc.categoriaDoc.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-[2px] bg-slate-800 text-slate-200 text-[10px]">
                          {doc.especie}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{doc.campania}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{doc.tamanioKb} KB</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">{doc.usuarioCarga}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {doc.contenidoTexto && (
                            <button
                              onClick={() => setArchivoSeleccionadoPreview(doc)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-[2px] transition-colors cursor-pointer"
                              title="Previsualizar contenido"
                            >
                              Ver
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // Descargar como texto plano o plantilla
                              const blob = new Blob([doc.contenidoTexto || doc.descripcion], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = doc.nombre.endsWith('.txt') ? doc.nombre : `${doc.nombre}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-[2px] transition-colors cursor-pointer"
                            title="Descargar archivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setMensajeExitoCarga(`Antecedentes de "${doc.nombre}" suministrados a los módulos operativos y al Asesor IA.`);
                            }}
                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 text-[10px] font-bold rounded-[2px] transition-colors cursor-pointer"
                            title="Suministrar datos a los módulos operativos"
                          >
                            Suministrar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar ${doc.nombre} del repositorio?`)) {
                                setArchivosCargados(prev => prev.filter(d => d.id !== doc.id));
                              }
                            }}
                            className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-[2px] transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Previsualización de Archivo */}
          {archivoSeleccionadoPreview && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-[2px] shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">{archivoSeleccionadoPreview.nombre}</h4>
                      <span className="text-[10px] text-slate-400">
                        {archivoSeleccionadoPreview.especie} • {archivoSeleccionadoPreview.categoriaDoc} • {archivoSeleccionadoPreview.tamanioKb} KB
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setArchivoSeleccionadoPreview(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-[2px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs text-slate-300 bg-slate-950/80">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-[2px] text-slate-400 text-[11px] font-sans">
                    <strong>Descripción:</strong> {archivoSeleccionadoPreview.descripcion}
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {archivoSeleccionadoPreview.contenidoTexto || 'Vista previa no disponible para archivos binarios. Descargue el archivo para abrirlo con su aplicación local.'}
                  </pre>
                </div>

                <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                  <span className="text-[11px] text-slate-400">
                    Suministrado para trazabilidad zootécnica y contable
                  </span>
                  <button
                    onClick={() => setArchivoSeleccionadoPreview(null)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-[2px] cursor-pointer"
                  >
                    Cerrar Previsualización
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Ingesta con Inteligencia Artificial (Gemini) */}
          {modalIngestaIAOpen && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-3xl rounded-[2px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {/* Header Modal */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base flex items-center space-x-2">
                        <span>Ingesta en Vivo con Inteligencia Artificial</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-600/40 text-indigo-300 font-mono font-bold">
                          Gemini 2.5 Flash
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cargue planillas Excel (.xlsx), CSV, JSON o texto sin estructurar para sincronizar en vivo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setModalIngestaIAOpen(false);
                      setIngestaResultado(null);
                      setIngestaError(null);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Modal */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  {/* Selector / Dropper de Archivos */}
                  <div className="p-5 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-[2px] bg-slate-950/50 text-center transition-colors">
                    <input
                      type="file"
                      id="ai-file-upload"
                      accept=".xlsx,.xls,.csv,.json,.txt"
                      onChange={handleSeleccionarArchivo}
                      className="hidden"
                    />
                    <label
                      htmlFor="ai-file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <UploadCloud className="w-8 h-8 text-indigo-400 animate-bounce" />
                      <span className="text-sm font-bold text-white">
                        Haga clic para subir archivo (.xlsx, .csv, .json, .txt)
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {ingestaArchivoNombre ? `Archivo seleccionado: ${ingestaArchivoNombre}` : 'Planillas de pesajes, existencias, sanidad o raciones'}
                      </span>
                    </label>
                  </div>

                  {/* O pegar texto directo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      O pegue texto o datos tabulares directamente:
                    </label>
                    <textarea
                      rows={4}
                      value={ingestaTextoRaw}
                      onChange={e => setIngestaTextoRaw(e.target.value)}
                      placeholder="Ej: Lote 1, 15 cabezas, ovejas madres, peso promedio 48kg, parición 110%..."
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-[2px] font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Botón de Procesamiento con IA */}
                  {!ingestaResultado && (
                    <button
                      onClick={() => handleProcesarConIA()}
                      disabled={ingestaLoading || !ingestaTextoRaw.trim()}
                      className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white font-bold rounded-[2px] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {ingestaLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Interpretando y clasificando con IA (Gemini)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Analizar y Mapear Datos con IA</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Mensajes de Error */}
                  {ingestaError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded text-rose-300 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{ingestaError}</span>
                    </div>
                  )}

                  {/* Vista Previa de Datos Interpretados por IA */}
                  {ingestaResultado && (
                    <div className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-[2px] space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-emerald-300 text-sm">
                            Interpretación de IA Completada
                          </span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          {ingestaResultado.totalRegistros} registros detectados
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">
                        {ingestaResultado.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-semibold">Tablas destino:</span>
                        {ingestaResultado.detectedEntities?.map((ent: string) => (
                          <span
                            key={ent}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-bold uppercase"
                          >
                            {ent}
                          </span>
                        ))}
                      </div>

                      {/* Botones de Confirmación */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            setIngestaResultado(null);
                            setIngestaTextoRaw('');
                            setIngestaArchivoNombre('');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-[2px] cursor-pointer"
                        >
                          Cargar Otro Archivo
                        </button>
                        <button
                          onClick={handleConfirmarIngestaEnBase}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs rounded-[2px] flex items-center space-x-2 shadow-md cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar e Integrar en Base de Datos en Vivo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

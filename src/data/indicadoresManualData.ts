/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Fichas Técnicas, Fórmulas e Interpretaciones de Indicadores Ejecutivos (Cuadro de Mando Integral)
 * Metodología Balanced Scorecard (Norton & Kaplan) - 4 Perspectivas Estratégicas
 */

export type PerspectivaIndicador = 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE' | 'ZOOTECNICA';
export type SentidoIndicador = 'MAYOR_MEJOR' | 'MENOR_MEJOR';

export interface InfoPerspectivaCMI {
  id: PerspectivaIndicador;
  nombre: string;
  preguntaEstrategica: string;
  enfoque: string;
  color: string;
  colorBg: string;
  colorBorder: string;
}

export const PERSPECTIVAS_CMI_INFO: Record<string, InfoPerspectivaCMI> = {
  FINANCIERA: {
    id: 'FINANCIERA',
    nombre: 'Perspectiva Financiera',
    preguntaEstrategica: '¿Cómo deberíamos aparecer ante nuestros accionistas / financiadores para tener éxito financiero?',
    enfoque: 'Rentabilidad económica, control estricto de costos directos, margen bruto y solvencia en flujo de caja.',
    color: 'text-indigo-400',
    colorBg: 'bg-indigo-500/10',
    colorBorder: 'border-indigo-500/30',
  },
  CLIENTES: {
    id: 'CLIENTES',
    nombre: 'Perspectiva de Clientes',
    preguntaEstrategica: '¿Cómo deberíamos aparecer ante nuestros clientes para alcanzar nuestra visión?',
    enfoque: 'Satisfacción y fidelización de compradores de carne y genética, precio medio obtenido y tasa de cobranza oportuna.',
    color: 'text-blue-400',
    colorBg: 'bg-blue-500/10',
    colorBorder: 'border-blue-500/30',
  },
  PROCESOS: {
    id: 'PROCESOS',
    nombre: 'Perspectiva de Procesos Internos',
    preguntaEstrategica: '¿En qué procesos debemos ser excelentes para satisfacer a nuestros clientes y accionistas?',
    enfoque: 'Excelencia en procesos zootécnicos clave (mortalidad, carga, parición, peso) y gestión operativa (sanidad, pesajes, pasturas y mermas).',
    color: 'text-emerald-400',
    colorBg: 'bg-emerald-500/10',
    colorBorder: 'border-emerald-500/30',
  },
  APRENDIZAJE: {
    id: 'APRENDIZAJE',
    nombre: 'Perspectiva de Aprendizaje y Desarrollo',
    preguntaEstrategica: '¿Qué capacidades necesitamos fortalecer?',
    enfoque: 'Capacitación del personal, horas de prácticas zootécnicas de estudiantes UNRC, evaluación de competencias técnicas y cumplimiento de protocolos de mejora.',
    color: 'text-purple-400',
    colorBg: 'bg-purple-500/10',
    colorBorder: 'border-purple-500/30',
  },
};

export interface FichaIndicador {
  id: string;
  perspectiva: PerspectivaIndicador;
  subcategoria?: 'ZOOTECNICA' | 'OPERATIVA';
  preguntaEstrategica?: string;
  nombre: string;
  abreviatura: string;
  unidad: string;
  sentido: SentidoIndicador;
  definicion: string;
  formula: string;
  variables: Array<{ variable: string; descripcion: string; origen: string }>;
  interpretacion: string;
  umbralCriticoDefecto: number;
  umbralMinimoDefecto: number;
  rangoOptimoTexto: string;
  rangoRevisarTexto: string;
  rangoCriticoTexto: string;
  accionesRecomendadas: {
    enAmarillo: string;
    enRojo: string;
  };
}

export const INDICADORES_MANUAL_DATA: FichaIndicador[] = [
  // ==========================================
  // 1. PERSPECTIVA DE PROCESOS INTERNOS: EFICIENCIA ZOOTÉCNICA
  // ¿En qué procesos debemos ser excelentes para satisfacer a nuestros clientes y accionistas?
  // ==========================================
  {
    id: 'tasa_mortalidad',
    perspectiva: 'PROCESOS',
    subcategoria: 'ZOOTECNICA',
    nombre: 'Tasa de Mortalidad Mensual',
    abreviatura: 'TMM %',
    unidad: '%',
    sentido: 'MENOR_MEJOR',
    definicion:
      'Porcentaje de bajas registradas por muerte biológica en el mes en relación al stock base total de la majada. Monitorea la supervivencia general y la sanidad del rebaño.',
    formula: 'TMM (%) = (Bajas por Muerte en el Mes / Existencia Total de la Majada) × 100',
    variables: [
      { variable: 'Bajas por Muerte', descripcion: 'Cabezas fallecidas en el mes', origen: 'Movimientos de tipo MUERTE' },
      { variable: 'Existencia Total', descripcion: 'Cabezas vivas iniciales o promedio del mes', origen: 'Inventario / calculateStock' },
    ],
    interpretacion:
      'Indica pérdidas biológicas de capital ovino. En majadas bien manejadas debe mantenerse debajo del 2.0% mensual. Valores superiores al 4.0% implican brotes parasitarios, predación severa o fallas de manejo.',
    umbralCriticoDefecto: 4.0,
    umbralMinimoDefecto: 2.0,
    rangoOptimoTexto: '≤ 2.0% (Verde - Óptimo)',
    rangoRevisarTexto: '2.0% a 4.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '> 4.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Intensificar monitoreo de HPG en heces (Famacha/parasitológico) y chequear condiciones de encierres nocturnos.',
      enRojo: 'Activar cuarentena y necropsia veterinaria urgente. Revisar ataque de carnívoros/predadores o intoxicación forrajera.',
    },
  },
  {
    id: 'carga_animal_ha',
    perspectiva: 'PROCESOS',
    subcategoria: 'ZOOTECNICA',
    nombre: 'Carga Animal por Hectárea',
    abreviatura: 'CARGA CAB/HA',
    unidad: 'cab/ha',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Relación entre la cantidad de ovinos presentes en el establecimiento y la superficie forrajera total activa en hectáreas.',
    formula: 'Carga (cab/ha) = Existencia Total de Cabezas / Superficie Total Activa (ha)',
    variables: [
      { variable: 'Existencia Total', descripcion: 'Cabezas vivas en pastoreo', origen: 'Inventario de Lote LOT001' },
      { variable: 'Superficie Total', descripcion: 'Hectáreas asignadas a ovinos (45.0 ha)', origen: 'Lotes activos' },
    ],
    interpretacion:
      'Determina la presión sobre la pastura polifítica. La receptividad óptima en el predio UNRC oscila entre 2.5 y 3.5 cab/ha (aprox. 0.4 a 0.6 EV/ha). Cargas inferiores a 1.5 desaprovechan forraje; mayores a 4.5 provocan sobrepastoreo.',
    umbralCriticoDefecto: 1.5,
    umbralMinimoDefecto: 3.0,
    rangoOptimoTexto: '≥ 3.0 cab/ha (Verde - Óptimo)',
    rangoRevisarTexto: '1.5 a 3.0 cab/ha (Amarillo - A revisar)',
    rangoCriticoTexto: '< 1.5 cab/ha (Rojo - Crítico por subutilización)',
    accionesRecomendadas: {
      enAmarillo: 'Evaluar incorporación de borregas de reposición o acelerar destete de corderos para regular presión forrajera.',
      enRojo: 'Subocupación del potrero: clausurar parcelas para henificación o ajustar rotación con otras especies.',
    },
  },
  {
    id: 'tasa_paricion',
    perspectiva: 'PROCESOS',
    subcategoria: 'ZOOTECNICA',
    nombre: 'Tasa de Parición Mensual',
    abreviatura: 'TP %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de corderos nacidos vivos en el mes con relación al número de ovejas madres puestas a servicio (vientres expuestos).',
    formula: 'TP (%) = (Nacimientos en el Mes / Vientres Expuestos a Carnero) × 100',
    variables: [
      { variable: 'Nacimientos', descripcion: 'Corderos nacidos en el período', origen: 'Movimientos de tipo NACIMIENTO' },
      { variable: 'Vientres Expuestos', descripcion: 'Ovejas madres en servicio de la subunidad de cría', origen: 'Inventario CAT-MAD (64 madres)' },
    ],
    interpretacion:
      'Evalúa la fertilidad de la majada y la prolificidad del rodeo ovino. Un desempeño óptimo supera el 95%. Valores menores al 75% revelan infertilidad en carneros, mala condición corporal al servicio o abortos infecciosos.',
    umbralCriticoDefecto: 75.0,
    umbralMinimoDefecto: 95.0,
    rangoOptimoTexto: '≥ 95.0% (Verde - Óptimo)',
    rangoRevisarTexto: '75.0% a 95.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 75.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Evaluar suplementación energética pre-servicio (flushing) y verificar condición corporal (mínimo 3.0 escala 1-5).',
      enRojo: 'Efectuar revisación andrológica a carneros reproductores y serología para brucelosis ovina (Brucella ovis).',
    },
  },
  {
    id: 'gdp_peso',
    perspectiva: 'PROCESOS',
    subcategoria: 'ZOOTECNICA',
    nombre: 'Ganancia Diaria de Peso (GDP)',
    abreviatura: 'GDP g/d',
    unidad: 'g/día',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Incremento medio diario de peso vivo registrado en los lotes de corderos en recría y engorde a partir de pesajes consecutivos.',
    formula: 'GDP (g/día) = ((Peso Final - Peso Inicial) / Días Transcurridos) × 1000',
    variables: [
      { variable: 'Pesajes', descripcion: 'Kilos vivos promedio por cabeza', origen: 'Módulo Pesajes / pesajes' },
      { variable: 'Intervalo', descripcion: 'Días entre pesadas de control', origen: 'Diferencia de fechas entre pesajes' },
    ],
    interpretacion:
      'Mide la tasa de conversión alimenticia. Para corderos de raza carnicera en pastoreo suplementado, el objetivo es superar los 180 g/día para lograr animales terminados de 30-35 kg en tiempo y forma.',
    umbralCriticoDefecto: 120.0,
    umbralMinimoDefecto: 180.0,
    rangoOptimoTexto: '≥ 180 g/día (Verde - Óptimo)',
    rangoRevisarTexto: '120 a 180 g/día (Amarillo - A revisar)',
    rangoCriticoTexto: '< 120 g/día (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Ajustar oferta de grano o suplemento proteico (pellet de soja/maíz) y desparasitar lote de recría.',
      enRojo: 'Revisar calidad nutricional del forraje base y chequear presencia de coccidiosis o neumonías en corderos.',
    },
  },

  // ==========================================
  // PERSPECTIVA DE CLIENTES / MERCADO
  // ¿Cómo deberíamos aparecer ante nuestros clientes para alcanzar nuestra visión?
  // ==========================================
  {
    id: 'ventas_mes',
    perspectiva: 'CLIENTES',
    nombre: 'Facturación Mensual por Ventas',
    abreviatura: 'VTAS $',
    unidad: 'ARS/USD',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Monto total bruto devengado por ventas de corderos de descarte, borregos terminados, lana e insumos zootécnicos en el mes.',
    formula: 'Ventas ($) = ∑ Importe Total de Facturas de Venta Emitidas en el Mes',
    variables: [
      { variable: 'Ventas Registradas', descripcion: 'Comprobantes emitidos en el módulo Ventas', origen: 'Ventas / ventas' },
      { variable: 'Filtro Temporal', descripcion: 'Fechas dentro del mes en análisis', origen: 'Venta.fecha' },
    ],
    interpretacion:
      'Evalúa la tracción comercial y el cumplimiento del plan de despachos. Asegura el ingreso corriente requerido para el sostenimiento de la unidad productiva.',
    umbralCriticoDefecto: 200000,
    umbralMinimoDefecto: 600000,
    rangoOptimoTexto: '≥ $600.000 (Verde - Óptimo)',
    rangoRevisarTexto: '$200.000 a $600.000 (Amarillo - A revisar)',
    rangoCriticoTexto: '< $200.000 (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Contactar frigoríficos y carnicerías zonales para cerrar lotes de entrega escalonada.',
      enRojo: 'Urgente: verificar si hay corderos listos para faena sin comprador y ofrecer promociones de lote cerrado.',
    },
  },
  {
    id: 'clientes_activos',
    perspectiva: 'CLIENTES',
    nombre: 'Cartera de Clientes Activos',
    abreviatura: 'CLI ACT',
    unidad: 'clientes',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Cantidad de compradores únicos con transacciones de compra registradas en el mes calendario evaluado.',
    formula: 'Clientes Activos = Count(Distinct(Cliente_ID con ventas en el mes))',
    variables: [
      { variable: 'Clientes Registrados', descripcion: 'Clientes con facturas emitidas', origen: 'Ventas / cliente_nombre' },
    ],
    interpretacion:
      'Evita la dependencia monopólica de un único frigorífico o comprador informal. Una cartera diversificada reduce el riesgo de crédito y mejora el poder de negociación.',
    umbralCriticoDefecto: 1,
    umbralMinimoDefecto: 2,
    rangoOptimoTexto: '≥ 2 clientes activos (Verde - Óptimo)',
    rangoRevisarTexto: '1 cliente activo (Amarillo - A revisar)',
    rangoCriticoTexto: '0 clientes activos (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Ampliar canal de comercialización con productores locales y particulares para venta directa.',
      enRojo: 'Reactiva de inmediato el contacto comercial con compradores históricos de carne ovina.',
    },
  },
  {
    id: 'precio_promedio_cab',
    perspectiva: 'CLIENTES',
    nombre: 'Precio Promedio por Cabeza Comercializada',
    abreviatura: 'P.MEDIO $/CAB',
    unidad: 'ARS/USD',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Ingreso monetario medio obtenido por cada ovino vendido durante el mes analizado.',
    formula: 'Precio Medio = Facturación Total Hacienda / Total Cabezas Vendidas',
    variables: [
      { variable: 'Total Facturado', descripcion: 'Importe de ventas de majada y hacienda', origen: 'Ventas / items venta' },
      { variable: 'Cabezas Vendidas', descripcion: 'Animales despachados', origen: 'DetalleVenta / cantidad' },
    ],
    interpretacion:
      'Refleja la valorización de la genética y el peso de terminación de los corderos. Precios menores a $30.000 indican corderos livianos o mala negociación en gancho.',
    umbralCriticoDefecto: 30000,
    umbralMinimoDefecto: 42000,
    rangoOptimoTexto: '≥ $42.000 / cab (Verde - Óptimo)',
    rangoRevisarTexto: '$30.000 a $42.000 / cab (Amarillo - A revisar)',
    rangoCriticoTexto: '< $30.000 / cab (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Retener corderos livianos 15 días más a pastura y grano para mejorar conformación carnicera.',
      enRojo: 'Revisar canal de venta; no comercializar a pie de potrero sin pesaje previo individual.',
    },
  },
  {
    id: 'tasa_cobranza',
    perspectiva: 'CLIENTES',
    nombre: 'Efectividad y Tasa de Cobranza',
    abreviatura: 'COB %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de los importes facturados que han sido efectivamente percibidos en caja y bancos dentro del período.',
    formula: 'Tasa Cobranza (%) = (Total Cobrado en el Mes / Total Facturado en el Mes) × 100',
    variables: [
      { variable: 'Cobros Efectivos', descripcion: 'Recibos de cobro asentados', origen: 'Cobros / cobros' },
      { variable: 'Ventas Facturadas', descripcion: 'Facturación bruta del mes', origen: 'Ventas / ventas' },
    ],
    interpretacion:
      'Mide la liquidez comercial y la morosidad de los clientes. Mantener la cobranza sobre el 95% garantiza flujo de caja para pagar alimentos y sueldos.',
    umbralCriticoDefecto: 70.0,
    umbralMinimoDefecto: 95.0,
    rangoOptimoTexto: '≥ 95.0% (Verde - Óptimo)',
    rangoRevisarTexto: '70.0% a 95.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 70.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Reiterar avisos de vencimiento y suspender nuevos despachos a plazo.',
      enRojo: 'Exigir cobro contado contra entrega o transferencia previa a la carga del camión.',
    },
  },

  // ==========================================
  // PERSPECTIVA DE PROCESOS INTERNOS: GESTIÓN OPERATIVA Y SANITARIA
  // ¿En qué procesos debemos ser excelentes para satisfacer a nuestros clientes y accionistas?
  // ==========================================
  {
    id: 'cumplimiento_sanitario',
    perspectiva: 'PROCESOS',
    subcategoria: 'OPERATIVA',
    nombre: 'Cumplimiento del Plan Sanitario',
    abreviatura: 'SAN %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de tratamientos preventivos y obligatorios (vacunas clostridiales, desparasitaciones, ectoparasiticidas) ejecutados en fecha.',
    formula: 'Sanidad (%) = (Tratamientos Aplicados en el Mes / Tratamientos Programados) × 100',
    variables: [
      { variable: 'Aplicaciones Reales', descripcion: 'Tratamientos registrados con veterinario', origen: 'Sanidad / sanidad' },
      { variable: 'Dosis Programadas', descripcion: 'Protocolos vigentes de campaña', origen: 'Dosis Técnicas / dosis' },
    ],
    interpretacion:
      'El calendario sanitario ovino previene epidemias fulminantes como enterotoxemia y parasitosis gastrointestinal. Mantenerlo sobre 95% es indispensable.',
    umbralCriticoDefecto: 80.0,
    umbralMinimoDefecto: 95.0,
    rangoOptimoTexto: '≥ 95.0% (Verde - Óptimo)',
    rangoRevisarTexto: '80.0% a 95.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 80.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Programar de inmediato la aplicación de dosis pendientes en la manga central.',
      enRojo: 'Alerta zoosanitaria: aplicar vacuna clostridial y antiparasitario de choque a toda la majada.',
    },
  },
  {
    id: 'cobertura_pesajes',
    perspectiva: 'PROCESOS',
    subcategoria: 'OPERATIVA',
    nombre: 'Cobertura de Control Biométrico / Pesajes',
    abreviatura: 'PESAJE %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de lotes y animales en recría que han pasado por la balanza de pesaje en el mes para control de ganancia de peso.',
    formula: 'Cobertura (%) = (Cabezas Pesadas en el Mes / Total Animales en Lotes de Recría) × 100',
    variables: [
      { variable: 'Pesajes Realizados', descripcion: 'Registros individuales en balanza electrónica', origen: 'Pesajes / pesajes' },
      { variable: 'Animales en Control', descripcion: 'Población activa de corderos y borregos', origen: 'Lotes y categorías' },
    ],
    interpretacion:
      'El pesaje sistemático es la única herramienta para validar la eficiencia de conversión y la fecha exacta de despacho a faena. Un mínimo de 80% asegura datos zootécnicos confiables.',
    umbralCriticoDefecto: 60.0,
    umbralMinimoDefecto: 80.0,
    rangoOptimoTexto: '≥ 80.0% (Verde - Óptimo)',
    rangoRevisarTexto: '60.0% a 80.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 60.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Encerrar lote de corderos en corral con balanza en el próximo turno matutino.',
      enRojo: 'Falta crítica de control: calibrar balanza y realizar pesaje general de lotes de terminación.',
    },
  },
  {
    id: 'eficiencia_procesos',
    perspectiva: 'PROCESOS',
    subcategoria: 'OPERATIVA',
    nombre: 'Eficiencia de Procesos y Control de Mermas',
    abreviatura: 'EF.PROC %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de consumos de insumos, raciones y movimientos zootécnicos realizados sin desvíos ni mermas extraordinarias.',
    formula: 'Eficiencia (%) = 100 - ((Costos por Mermas / Consumo Total de Insumos) × 100)',
    variables: [
      { variable: 'Consumos Directos', descripcion: 'Granos, fardos y medicamentos imputados', origen: 'ConsumosInsumo' },
      { variable: 'Mermas y Pérdidas', descripcion: 'Desperdicio de ración o rotura de envases', origen: 'Ajustes de inventario' },
    ],
    interpretacion:
      'Monitorea el uso racional de comederos y bebederos. Valores superiores al 90% indican excelente disciplina operativa del personal.',
    umbralCriticoDefecto: 70.0,
    umbralMinimoDefecto: 90.0,
    rangoOptimoTexto: '≥ 90.0% (Verde - Óptimo)',
    rangoRevisarTexto: '70.0% a 90.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 70.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Inspeccionar comederos tipo tolva para evitar que los ovinos tiren ración al suelo.',
      enRojo: 'Auditar galpón de alimentos y almacenamiento de bolsas; controlar humedad y roedores.',
    },
  },
  {
    id: 'rotacion_pasturas',
    perspectiva: 'PROCESOS',
    subcategoria: 'OPERATIVA',
    nombre: 'Descanso y Rotación de Potreros',
    abreviatura: 'ROT.PAST %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de la superficie forrajera que se encuentra en período de descanso biológico y rebrote vegetativo.',
    formula: 'Rotación (%) = (Hectáreas en Descanso / Superficie Total Forrajera) × 100',
    variables: [
      { variable: 'Lotes en Descanso', descripcion: 'Potreros sin animales en pastoreo', origen: 'Lotes / estado lote' },
      { variable: 'Superficie Total', descripcion: '45.0 hectáreas de pastura polifítica', origen: 'Lotes.superficie_ha' },
    ],
    interpretacion:
      'La rotación de potreros rompe el ciclo biológico de los parásitos gastrointestinales (Haemonchus contortus) y permite recuperar el volumen de forraje. El descanso ideal supera el 80% de la superficie total.',
    umbralCriticoDefecto: 60.0,
    umbralMinimoDefecto: 80.0,
    rangoOptimoTexto: '≥ 80.0% (Verde - Óptimo)',
    rangoRevisarTexto: '60.0% a 80.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 60.0% (Rojo - Crítico)',
    accionesRecomendadas: {
      enAmarillo: 'Planificar rotación al potrero contiguo antes de que la altura del pasto baje de 5 cm.',
      enRojo: 'Dividir potrero con hilo electroplástico y retirar hacienda a corral con suplementación.',
    },
  },

  // ==========================================
  // PERSPECTIVA FINANCIERA
  // ¿Cómo deberíamos aparecer ante nuestros accionistas / financiadores para tener éxito financiero?
  // ==========================================
  {
    id: 'margen_bruto',
    perspectiva: 'FINANCIERA',
    nombre: 'Margen Bruto Mensual (MB)',
    abreviatura: 'MB $',
    unidad: 'ARS/USD',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Diferencia entre los ingresos devengados por ventas y los costos directos totales incurridos en el mes. Mide la contribución marginal de la actividad ovina.',
    formula: 'MB ($) = Ventas Devengadas - Costos Directos del Mes',
    variables: [
      { variable: 'Ventas Devengadas', descripcion: 'Ingresos por venta de carne y lana', origen: 'Ventas / importe_total' },
      { variable: 'Costos Directos', descripcion: 'Insumos sanitarios, alimentos, raciones y labores', origen: 'Costos DIRECTO / importe_total' },
    ],
    interpretacion:
      'Métrica económica cardinal. Un Margen Bruto positivo y superior a $350.000 permite absorber los costos indirectos de estructura y generar ganancia neta.',
    umbralCriticoDefecto: 100000,
    umbralMinimoDefecto: 350000,
    rangoOptimoTexto: '≥ $350.000 (Verde - Óptimo)',
    rangoRevisarTexto: '$100.000 a $350.000 (Amarillo - A revisar)',
    rangoCriticoTexto: '< $100.000 (Rojo - Crítico / Pérdida)',
    accionesRecomendadas: {
      enAmarillo: 'Revisar estructura de compras de suplementos y negociar precio de lote de corderos.',
      enRojo: 'Detener gastos operativos no esenciales; auditar posibles desvíos en consumos de ración o mermas.',
    },
  },
  {
    id: 'costos_directos',
    perspectiva: 'FINANCIERA',
    nombre: 'Costos Directos del Mes (CD)',
    abreviatura: 'CD $',
    unidad: 'ARS/USD',
    sentido: 'MENOR_MEJOR',
    definicion:
      'Suma de todos los costos que varían directamente con el nivel de producción ovina (medicamentos, alimentos, forrajes, esquila y mano de obra temporal).',
    formula: 'CD ($) = ∑ Costos Clasificación DIRECTO en el Mes',
    variables: [
      { variable: 'Costos Directos', descripcion: 'Egresos directos devengados', origen: 'Costos / costos clasificacion DIRECTO' },
    ],
    interpretacion:
      'Permite controlar que el costo de producción por oveja y por cordero se mantenga dentro del presupuesto. Superar los $550.000 mensuales pone en riesgo el punto de equilibrio.',
    umbralCriticoDefecto: 550000,
    umbralMinimoDefecto: 400000,
    rangoOptimoTexto: '≤ $400.000 (Verde - Óptimo)',
    rangoRevisarTexto: '$400.000 a $550.000 (Amarillo - A revisar)',
    rangoCriticoTexto: '> $550.000 (Rojo - Crítico / Exceso Presupuestario)',
    accionesRecomendadas: {
      enAmarillo: 'Comparar precios entre proveedores de insumos veterinarios y comprar ración a granel.',
      enRojo: 'Auditar gastos de urgencia y suspender compras no autorizadas de insumos.',
    },
  },
  {
    id: 'margen_sobre_cd',
    perspectiva: 'FINANCIERA',
    nombre: 'Margen sobre Costos Directos',
    abreviatura: 'MB/CD %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de retorno que genera la actividad por cada peso invertido en costos directos.',
    formula: 'Margen sobre CD (%) = (Margen Bruto / Costos Directos) × 100',
    variables: [
      { variable: 'Margen Bruto', descripcion: 'Ingresos menos Costos Directos', origen: 'Cálculo de MB' },
      { variable: 'Costos Directos', descripcion: 'Capital operativo devengado', origen: 'Costos DIRECTO' },
    ],
    interpretacion:
      'Indica la eficiencia en la utilización del capital operativo. Un valor de 50% significa que por cada $100 de costo directo, el negocio ovino devuelve $150 de ingreso ($50 de margen limpio).',
    umbralCriticoDefecto: 20.0,
    umbralMinimoDefecto: 50.0,
    rangoOptimoTexto: '≥ 50.0% (Verde - Óptimo)',
    rangoRevisarTexto: '20.0% a 50.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 20.0% (Rojo - Crítico / Baja Eficiencia)',
    accionesRecomendadas: {
      enAmarillo: 'Ajustar la curva de peso de faena para maximizar ingreso marginal sobre ración.',
      enRojo: 'Reestructurar la dieta y revisar si la genética responde a la intensificación alimentaria.',
    },
  },
  {
    id: 'flujo_caja_neto',
    perspectiva: 'FINANCIERA',
    nombre: 'Flujo de Caja Neto Operativo',
    abreviatura: 'CASH FLOW $',
    unidad: 'ARS/USD',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Diferencia entre los cobros efectivos percibidos y los pagos efectivamente desembolsados en el mes.',
    formula: 'Flujo de Caja ($) = Cobros Efectivos del Mes - Pagos Realizados del Mes',
    variables: [
      { variable: 'Cobros Reales', descripcion: 'Fondos ingresados en caja y bancos', origen: 'Módulo Cobros / cobros' },
      { variable: 'Pagos Reales', descripcion: 'Desembolsos por compras y gastos', origen: 'Módulo Pagos / pagos' },
    ],
    interpretacion:
      'Refleja la liquidez y capacidad de pago inmediata. A diferencia del margen devengado, el flujo de caja muestra la solvencia real en la cuenta bancaria.',
    umbralCriticoDefecto: 0,
    umbralMinimoDefecto: 100000,
    rangoOptimoTexto: '≥ $100.000 (Verde - Óptimo)',
    rangoRevisarTexto: '$0 a $100.000 (Amarillo - A revisar)',
    rangoCriticoTexto: '< $0 (Rojo - Crítico / Déficit de Caja)',
    accionesRecomendadas: {
      enAmarillo: 'Acelerar cobro de cuentas por cobrar y pactar pagos a proveedores a 30 días.',
      enRojo: 'Déficit operativo: postergar pagos no críticos o solicitar acuerdo de descubierto bancario transitorio.',
    },
  },

  // ==========================================
  // PERSPECTIVA DE APRENDIZAJE Y DESARROLLO (4TA PERSPECTIVA CMI)
  // ¿Qué capacidades necesitamos fortalecer?
  // ==========================================
  {
    id: 'horas_capacitacion_practicas',
    perspectiva: 'APRENDIZAJE',
    nombre: 'Capacitación y Horas de Prácticas Zootécnicas',
    abreviatura: 'CAPACITACIÓN HS',
    unidad: 'hs/mes',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Total mensual acumulado de horas dedicadas a capacitaciones técnicas, ateneos zootécnicos y prácticas a campo realizadas por estudiantes universitarios (Agronomía/Veterinaria UNRC) y operarios del establecimiento.',
    formula: 'Horas de Capacitación = ∑ Horas de Prácticas y Cursos en el Mes',
    variables: [
      { variable: 'Horas Prácticas Estudiantes', descripcion: 'Horas efectivas en manga, corrales y pasturas', origen: 'Registro de docencia y prácticas UNRC' },
      { variable: 'Horas Formación Operarios', descripcion: 'Capacitación técnica en sanidad, nutrición y esquila', origen: 'Planes de capacitación de personal' },
    ],
    interpretacion:
      'Monitorea el fortalecimiento del capital humano y el rol formativo de la universidad. Un mínimo de 40 horas mensuales garantiza transferencia de conocimiento y mano de obra calificada en el manejo ovino.',
    umbralCriticoDefecto: 20.0,
    umbralMinimoDefecto: 40.0,
    rangoOptimoTexto: '≥ 40 hs/mes (Verde - Óptimo)',
    rangoRevisarTexto: '20 a 40 hs/mes (Amarillo - A revisar)',
    rangoCriticoTexto: '< 20 hs/mes (Rojo - Crítico / Déficit Formativo)',
    accionesRecomendadas: {
      enAmarillo: 'Coordinar talleres de manejo reproductivo y reforzar cronogramas de pasantías con cátedras de Producción Ovina.',
      enRojo: 'Alerta formativa: reactivar convenios de prácticas supervisadas y programar jornadas técnicas de actualización a campo.',
    },
  },
  {
    id: 'cumplimiento_protocolos_mejora',
    perspectiva: 'APRENDIZAJE',
    nombre: 'Cumplimiento de Planes de Mejora y Protocolos Técnicos',
    abreviatura: 'PROTOCOLOS %',
    unidad: '%',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Porcentaje de procedimientos operativos estandarizados (POEs) y metas de planes de mejora continua ejecutados conforme a las normas técnicas establecidas para el predio (bioseguridad, bienestar animal y registro digital).',
    formula: 'Cumplimiento POEs (%) = (Protocolos y Mejoras Ejecutados / Total Protocolos Programados) × 100',
    variables: [
      { variable: 'Protocolos Ejecutados', descripcion: 'POEs auditados y completados satisfactoriamente', origen: 'Auditorías internas y listas de chequeo' },
      { variable: 'Total Programados', descripcion: 'Protocolos técnicos requeridos para la etapa zootécnica', origen: 'Manual de Procedimientos UNRC' },
    ],
    interpretacion:
      'Mide la disciplina operacional y la adopción de mejoras zootécnicas. Valores sobre 85% aseguran procesos estandarizados y repetibles en la majada.',
    umbralCriticoDefecto: 65.0,
    umbralMinimoDefecto: 85.0,
    rangoOptimoTexto: '≥ 85.0% (Verde - Óptimo)',
    rangoRevisarTexto: '65.0% a 85.0% (Amarillo - A revisar)',
    rangoCriticoTexto: '< 65.0% (Rojo - Crítico / Falla de Adopción)',
    accionesRecomendadas: {
      enAmarillo: 'Revisar cuellos de botella en la ejecución de POEs y capacitar al personal en los puntos críticos de control.',
      enRojo: 'Auditoría inmediata: simplificar listas de chequeo, designar responsables operativos y corregir desvíos de bienestar y bioseguridad.',
    },
  },
  {
    id: 'evaluacion_competencias_tecnicas',
    perspectiva: 'APRENDIZAJE',
    nombre: 'Evaluación de Competencias en Manejo Zootécnico y Sanitario',
    abreviatura: 'COMPETENCIAS PTS',
    unidad: 'pts',
    sentido: 'MAYOR_MEJOR',
    definicion:
      'Calificación promedio (escala 0 a 100) en la evaluación periódica de destrezas operativas del equipo de trabajo: dosificación de fármacos, evaluación de condición corporal, manejo en corrales y registro en software.',
    formula: 'Índice de Competencias = ∑ Puntajes Obtenidos en Rúbricas / Número de Habilidades Evaluadas',
    variables: [
      { variable: 'Puntajes Obtenidos', descripcion: 'Calificaciones de destrezas observadas a campo', origen: 'Evaluación de desempeño y rúbricas zootécnicas' },
      { variable: 'Habilidades Auditadas', descripcion: 'Habilidades clave: Famacha, esquila descole, pesaje, lectura caravanas', origen: 'Rúbrica de competencias UNRC' },
    ],
    interpretacion:
      'Garantiza que quienes operan con la majada posean las habilidades zootécnicas requeridas para evitar mermas por mal manejo o errores de dosificación sanitaria.',
    umbralCriticoDefecto: 60.0,
    umbralMinimoDefecto: 75.0,
    rangoOptimoTexto: '≥ 75 pts (Verde - Óptimo)',
    rangoRevisarTexto: '60 a 75 pts (Amarillo - A revisar)',
    rangoCriticoTexto: '< 60 pts (Rojo - Crítico / Brecha de Habilidades)',
    accionesRecomendadas: {
      enAmarillo: 'Organizar clínicas de práctica guiada para nivelar técnicas de sujeción, condición corporal y dosificación.',
      enRojo: 'Supervisión directa obligatoria en tratamientos sanitarios y re-capacitación intensiva antes de faenas o partos.',
    },
  },
];

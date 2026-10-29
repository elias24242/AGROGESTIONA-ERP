/**
 * ERP Ovinos - Pozo del Carril (UNRC)
 * Guía Didáctica y Modular del Sistema y sus Herramientas
 * Estructura extensible y sujeta a modificaciones y ampliaciones futuras
 */

export interface HerramientaSistema {
  id: string;
  nombre: string;
  categoria: 'ZOOTECNICA' | 'GESTION' | 'CONTABLE_FINANCIERA' | 'CONTROL_SEGURIDAD';
  badge: string;
  descripcion: string;
  comoFunciona: string;
  accionesPrincipales: string[];
  rolesHabilitados: string;
  ejemploPractico: string;
  consejoClave: string;
}

export const GUIA_HERRAMIENTAS_SISTEMA: HerramientaSistema[] = [
  {
    id: 'dashboard',
    nombre: 'Dashboard General & Tablero de Control',
    categoria: 'GESTION',
    badge: 'Monitoreo Global',
    descripcion: 'Centro neurálgico del establecimiento que sintetiza los principales indicadores productivos, zootécnicos y económicos en tiempo real.',
    comoFunciona: 'Agrupa en un solo panel la existencia total de cabezas (81 cabezas canónicas), desglose por categorías (Madres, Carneros, Sin Clasificar), cálculo automático del Margen Bruto, estado del inventario de insumos en depósito y avisos tempranos.',
    accionesPrincipales: [
      'Visualizar existencias globales y por subunidad (Cría / Recría / Engorde).',
      'Monitorear el Margen Bruto proyectado y ejecutado en ARS o USD.',
      'Consultar alertas de tratamientos sanitarios y stock crítico de insumos.',
      'Acceso directo a todos los módulos y manuales didácticos.',
    ],
    rolesHabilitados: 'Todos los roles (Administrador, Responsable de Unidad, Operador, Auditoría).',
    ejemploPractico: 'Al ingresar por la mañana, el operario verifica si hay alertas sanitarias pendientes y confirma el total de cabezas registradas en el campo.',
    consejoClave: 'Utilice el selector de Moneda Dual (ARS/USD) en la cabecera para comparar los resultados frente a la cotización oficial de Dólar Hoy.',
  },
  {
    id: 'majada',
    nombre: 'Majada & Hacienda',
    categoria: 'ZOOTECNICA',
    badge: 'Control Biológico',
    descripcion: 'Gestión física del rodeo ovino: control estricto de cabezas vivas, pariciones, pesajes periódicos, transferencias de categoría y egresos.',
    comoFunciona: 'Mantiene la trazabilidad animal lote a lote (potrero LOT001) y etapa por etapa. Cada evento (nacimiento, muerte, cambio a reproductor o venta) recalcula el inventario de cabezas y genera un comprobante inmutable en auditoría.',
    accionesPrincipales: [
      'Registrar nacimientos y altas de corderos.',
      'Cargar pesajes periódicos para calcular la Ganancia Media Diaria de Peso (GMD).',
      'Efectuar transferencias entre subunidades (ej: destete de corderos a recría).',
      'Declarar bajas con justificación veterinaria y anulación lógica.',
    ],
    rolesHabilitados: 'Administrador y Responsable de Unidad (creación/edición); Operador (carga de partes diarios); Auditoría (lectura).',
    ejemploPractico: 'Al destetar 15 corderos de las madres en Cría, se registra una transferencia zootécnica hacia la etapa de Recría o Engorde sin alterar el total de hacienda.',
    consejoClave: 'Ningún movimiento elimina físicamente datos: todas las operaciones cuentan con trazabilidad auditada para evitar discrepancias.',
  },
  {
    id: 'produccion',
    nombre: 'Producción & Consumos de Insumos',
    categoria: 'ZOOTECNICA',
    badge: 'Inventario & Depósito',
    descripcion: 'Administración del depósito central de insumos (alimentos, forrajes, vacunas, antiparasitarios) y cómputo de consumos reales frente a dosis técnicas.',
    comoFunciona: 'Cada consumo imputado a una subunidad descuenta unidades físicas del inventario y multiplica la cantidad por el Precio Promedio Ponderado (PPP) del insumo, determinando el costo directo real absorbido por los animales.',
    accionesPrincipales: [
      'Controlar existencias en depósito (Stock siempre ≥ 0).',
      'Incorporar nuevos insumos al catálogo con costo dual ARS/USD (Administradores).',
      'Cargar partes de consumo diario de maíz, forraje o suplementos.',
      'Comparar consumos reales frente a la Dosis Técnica recomendada y analizar desvíos.',
    ],
    rolesHabilitados: 'Administrador (creación de insumos y modificación); Responsable de Unidad y Operador (carga de consumos).',
    ejemploPractico: 'Si la dosis técnica de maíz es 0.5 kg/día por oveja y se suministraron 0.6 kg, el módulo alerta un desvío positivo del +20% en el costo de alimentación.',
    consejoClave: 'Mantenga actualizado el Precio Promedio Ponderado (PPP) cargando las compras en Operaciones Económicas para que los costos directos sean exactos.',
  },
  {
    id: 'sanidad',
    nombre: 'Sanidad Ovina & Calendario Veterinario',
    categoria: 'ZOOTECNICA',
    badge: 'Planes Sanitarios',
    descripcion: 'Planificación y registro de aplicaciones veterinarias (vacunaciones clostridiales, desparasitaciones, tratamientos antibióticos y baños sarnífugos).',
    comoFunciona: 'Asocia el fármaco aplicado al lote y categoría ovina, computando la dosis por cabeza, descontando el stock del insumo sanitario y derivando automáticamente el gasto al rubro de costos directos de sanidad.',
    accionesPrincipales: [
      'Consultar el historial cronológico de tratamientos aplicados.',
      'Registrar nuevas aplicaciones sanitarias con diagnóstico y veterinario responsable.',
      'Incorporar fármacos nuevos al catálogo oficial (Administradores).',
      'Monitorear alertas de revacunación y tratamientos pre-parto.',
    ],
    rolesHabilitados: 'Administrador, Responsable de Unidad y Veterinario a cargo.',
    ejemploPractico: 'Se aplica vacuna anticlostridial preventiva a las 64 madres pre-parto en Cría. El sistema descuenta 64 dosis de depósito y computa el costo correspondiente.',
    consejoClave: 'Complete siempre el diagnóstico y nombre del veterinario interviniente para cumplir con los requerimientos sanitarios de SENASA y UNRC.',
  },
  {
    id: 'economia',
    nombre: 'Operaciones Económicas & Tesorería',
    categoria: 'CONTABLE_FINANCIERA',
    badge: 'Finanzas & Moneda Dual',
    descripcion: 'Libro de compras de insumos, facturación de ventas (hacienda en pie, carne faenada, lana sucia), cuentas corrientes de terceros y tesorería.',
    comoFunciona: 'Opera bajo esquema de moneda dual (Pesos ARS y Dólares USD). Permite fijar precios y condiciones de cobro, asociando compras al depósito y registrando cobros y pagos bancarios o en efectivo.',
    accionesPrincipales: [
      'Emitir facturas de venta de corderos, ovejas de refugo o lana.',
      'Cargar facturas de compra de insumos con ingreso directo al inventario.',
      'Gestionar cobros, pagos pendientes y cuentas corrientes de clientes/proveedores.',
      'Alternar y liquidar con Tipo de Cambio Comprador (Ventas) y Vendedor (Compras).',
    ],
    rolesHabilitados: 'Administrador y Responsable de Unidad.',
    ejemploPractico: 'Se venden 15 corderos pesados por US$ 2.000 pactados a TC Comprador ($1.490). El sistema registra US$ 2.000 en moneda dura y $2.980.000 ARS en tesorería.',
    consejoClave: 'Utilice siempre TC Comprador para ventas y TC Vendedor para compras, respetando el principio de prudencia contable.',
  },
  {
    id: 'contabilidad',
    nombre: 'Medición Contable (Norma RT 54)',
    categoria: 'CONTABLE_FINANCIERA',
    badge: 'Valuación Biológica',
    descripcion: 'Valuación patrimonial de la majada según la Resolución Técnica 54 de la FACPCE para entes agropecuarios.',
    comoFunciona: 'Distingue entre activos biológicos reproductores (madres y carneros valuados a VNR o costo amortizado) y activos en crecimiento para la venta (corderos a VNR menos gastos de venta como fletes y comisiones).',
    accionesPrincipales: [
      'Calcular el Valor Neto de Realización (VNR) unitario y total por categoría.',
      'Computar el Resultado por Producción y el Resultado por Tenencia (inflación/mercado).',
      'Analizar los cuadros patrimoniales requeridos para balances formales de la UNRC.',
      'Simular escenarios con cotizaciones de hacienda en el Mercado Agroganadero.',
    ],
    rolesHabilitados: 'Administrador y Responsable de Unidad (Auditoría tiene lectura completa).',
    ejemploPractico: '64 madres valuadas a $85.000 con un 8% estimado de gastos de comercialización (flete y comisiones) registran un VNR patrimonial de $4.992.000.',
    consejoClave: 'Ajuste periódicamente los gastos de venta estimados (porcentaje de flete) para reflejar la realidad del mercado regional.',
  },
  {
    id: 'modelo_datos',
    nombre: 'Modelo de Datos & Arquitectura de Cuadros',
    categoria: 'CONTROL_SEGURIDAD',
    badge: 'Exclusivo Administradores',
    descripcion: 'Mapeo visual relacional en Tercera Forma Normal (3FN), catálogo de las 32 hojas de cálculo de Google Sheets y análisis de flujos.',
    comoFunciona: 'Permite a los administradores inspeccionar la estructura interna del ERP, visualizar las claves primarias (PK), foráneas (FK), tipos de campos, flujos de datos dinámicos y ejecutar auditorías de integridad referencial en vivo.',
    accionesPrincipales: [
      'Explorar el Diagrama Relacional Interactivo por dominios (Zootécnico, Insumos, Economía, RT 54, Seguridad).',
      'Comprender los 4 flujos dinámicos de información entre tablas.',
      'Consultar el Diccionario de las 32 Hojas normalizadas del sistema.',
      'Ejecutar el escáner de Integridad Referencial para descartar registros huérfanos.',
    ],
    rolesHabilitados: 'Exclusivamente ADMINISTRADOR.',
    ejemploPractico: 'Un administrador verifica que todos los consumos apunten a insumos dados de alta válidos y que las ventas correspondan a clientes registrados.',
    consejoClave: 'Consulte esta herramienta para entender con precisión qué tablas y hojas de cálculo se afectan ante cada operación del establecimiento.',
  },
  {
    id: 'auditoria',
    nombre: 'Registro de Auditoría Inmutable & Sesiones',
    categoria: 'CONTROL_SEGURIDAD',
    badge: 'Trazabilidad Total',
    descripcion: 'Bitácora inalterable que documenta cada movimiento, inicio de sesión, alta, modificación o anulación realizada en el sistema.',
    comoFunciona: 'Registra de manera automática el usuario responsable, fecha y hora oficial argentina (ART), tabla afectada, clave de registro, motivo declarado y payload JSON antes y después del cambio.',
    accionesPrincipales: [
      'Filtrar eventos por tabla, tipo de operación (ALTA, MODIFICACION, ANULACION) o usuario.',
      'Ver el detalle técnico completo y diferencial de datos de cada registro.',
      'Monitorear los inicios de sesión, tiempo de permanencia y usuarios activos.',
      'Garantizar la transparencia y seguridad de los datos de la Universidad Nacional de Río Cuarto.',
    ],
    rolesHabilitados: 'Administrador y Auditoría (visualización completa).',
    ejemploPractico: 'Si un operario corrige el stock de un insumo, queda registrado: usuario @operador, 08/10/2026 10:15 hs ART, tabla insumos, motivo del ajuste y valores cambiados.',
    consejoClave: 'Los asientos de auditoría son inmutables: no pueden ser borrados ni modificados por ningún usuario, garantizando validez legal y académica.',
  },
  {
    id: 'configuracion',
    nombre: 'Configuración, Usuarios & Conexión Sheets',
    categoria: 'CONTROL_SEGURIDAD',
    badge: 'Parámetros del Sistema',
    descripcion: 'Panel de administración general: alta y baja de usuarios, asignación de roles RBAC, sincronización con Google Sheets y maestros.',
    comoFunciona: 'Centraliza las credenciales de acceso, estado de habilitación operativa (activo / inhabilitado), vinculación con el Spreadsheet ID oficial y catálogo maestro de insumos y categorías.',
    accionesPrincipales: [
      'Crear y editar usuarios (@username, contraseña, rol, estado activo/inhabilitado).',
      'Gestionar permisos de cada rol (Administrador, Responsable, Operador, Auditor).',
      'Configurar y sincronizar el Spreadsheet ID de Google Sheets.',
      'Consultar y gestionar el catálogo maestro de insumos y depósito central.',
    ],
    rolesHabilitados: 'Administrador (edición completa); otros roles tienen acceso restringido o lectura.',
    ejemploPractico: 'El administrador crea una nueva cuenta para un pasante con rol OPERADOR, permitiéndole cargar consumos pero restringiendo el acceso a finanzas y modelo de datos.',
    consejoClave: 'Asegúrese de asignar roles adecuados a cada persona según sus responsabilidades reales en el campo.',
  },
  {
    id: 'pruebas',
    nombre: 'Casos de Prueba & Validaciones Zootécnicas',
    categoria: 'GESTION',
    badge: 'Banco de Ensayos UNRC',
    descripcion: 'Entorno de simulación controlada y validación formal de los casos de prueba operativos y contables exigidos por la cátedra.',
    comoFunciona: 'Permite ejecutar los 5 escenarios canónicos de prueba (CP01: Nacimiento de corderos; CP02: Consumo y stock no negativo; CP03: Venta dual con TC oficial; CP04: Vacunación clostridial; CP05: Control estricto de accesos RBAC), verificando cálculos y trazabilidad.',
    accionesPrincipales: [
      'Ejecutar baterías de pruebas unitarias y de integración sobre datos simulados.',
      'Comprobar la regla de oro: el stock físico nunca puede ser negativo.',
      'Verificar la conversión matemática exacta entre ARS y USD al tipo de cambio oficial.',
      'Auditar el bloqueo preventivo a roles de solo lectura ante intentos de escritura.',
    ],
    rolesHabilitados: 'Administrador y Responsable de Unidad.',
    ejemploPractico: 'Se ejecuta el caso CP02 para comprobar que al intentar suministrar 1.000 kg de forraje teniendo 800 kg en depósito, el sistema bloquea la transacción con aviso formal.',
    consejoClave: 'Utilice este módulo como entorno sandbox para capacitar a nuevos alumnos y operarios antes de registrar transacciones en el rodeo real.',
  },
  {
    id: 'ganaderia',
    nombre: 'Ganadería Integral & Resumen Unificado',
    categoria: 'GESTION',
    badge: 'Multi-Especie Unificada',
    descripcion: 'Módulo central multi-especie para la supervisión integrada de Ovinos, Bovinos y Porcinos con tablero unificado y comparativa homogénea.',
    comoFunciona: 'Reacciona en tiempo real al selector global superior de EspecieID (ESP001 Ovinos, ESP002 Bovinos, ESP003 Porcinos o TODOS). Calcula existencias, altas, bajas, ventas, costos y márgenes comparables sin mezclar procesos biológicamente heterogéneos.',
    accionesPrincipales: [
      'Visualizar el Resumen Ganadero Unificado adaptado automáticamente a la especie activa.',
      'Auditar la Matriz de Comparabilidad Homogénea (Stock, Altas, Bajas, Ingresos, Costos, Margen, Mortalidad).',
      'Consultar indicadores específicos no comparables con su debida justificación biológica.',
      'Revisar las existencias y categorías de cada especie sin salir de la plataforma.',
    ],
    rolesHabilitados: 'Todos los roles (Administrador, Responsable, Operador, Auditoría).',
    ejemploPractico: 'Al seleccionar Bovinos en el selector superior, toda la sección de Resumen Ganadero se actualiza al rodeo vacuno de La Aguada sin requerir clics adicionales.',
    consejoClave: 'Recuerde que métricas como conversión porcina o destete bovino no deben compararse directamente; use siempre la pestaña Comparativa para contrastar variables homogéneas.',
  },
  {
    id: 'proc_bovinos',
    nombre: 'Procedimiento: Registro en Unidad Bovina (La Aguada)',
    categoria: 'ZOOTECNICA',
    badge: 'Procedimiento Paso a Paso',
    descripcion: 'Protocolo normalizado para el registro de movimientos, pesajes, fases y costos del rodeo bovino.',
    comoFunciona: 'Estructura el ciclo en 4 fases técnicas: Cría (180 días, ≤160 kg, 10 kg/d), Recría (120 días, 160–280 kg, 6 kg/d), Adaptación (30 días, 280–320 kg, 7 kg/d) y Engorde (60 días, 320–450 kg, 10 kg/d) con una duración total de 390 días (13 meses).',
    accionesPrincipales: [
      'Paso 1: Asignar categoría zootécnica oficial (Vacas, Vaquillonas 1 y 2, Terneros/as, Destete, Novillitos, Novillos, Toros, Toritos).',
      'Paso 2: Registrar pesaje periódico distinguiendo Kg Vivo (pie con desbaste) y control de ganancia de peso diaria.',
      'Paso 3: Asentar traslados de fase (ej. Destete a Recría o Corral de Adaptación) verificando disponibilidad en lote origen.',
      'Paso 4: Consultar referencias de mercado MAG Cañuelas y consignatarias.com.ar sin imputarlas como valuación contable automática.',
      'Paso 5: Registrar ventas con desglose de costos (comisión feria 5%, flete camión jaula 5%, pista/pesaje y aranceles SENASA).',
    ],
    rolesHabilitados: 'Administrador, Responsable de Unidad Bovina, Operador.',
    ejemploPractico: 'Para registrar la terminación de un lote de novillos de 450 kg, se asienta la liquidación testigo: 15 novillos x 450 kg = 6.750 kg a $4.496,34/kg con VNR neto de $28.053.034,68 tras descontar flete y comisiones.',
    consejoClave: 'La reconstrucción histórica de 174 cabezas vacunas está documentada como referencia histórica sujeta a confirmación por inconsistencias de planilla; no reemplaza el stock operativo.',
  },
  {
    id: 'proc_porcinos',
    nombre: 'Procedimiento: Registro en Unidad Porcina (Pozo del Carril)',
    categoria: 'ZOOTECNICA',
    badge: 'Procedimiento Paso a Paso',
    descripcion: 'Protocolo normalizado para la gestión de maternidad, recría y terminación porcina en confinamiento.',
    comoFunciona: 'Organiza la piara en 3 fases secuenciales con transferencia de costos: Cría (Lechón 0–15 kg, d 0–31, cta 1.3.03.01), Destete (Cachorro/a 15–50 kg, d 31–86, cta 1.3.03.02) y Engorde (Capón 50–105 kg, d 86–165, cta 1.3.03.03).',
    accionesPrincipales: [
      'Paso 1: Registrar pariciones y lechones nacidos en la subunidad Maternidad & Reproducción (cuenta 1.3.03.01).',
      'Paso 2: Imputar consumos de alimentación según la fórmula de la fase: Cría (100% concentrado preiniciador), Destete (80% maíz propio, 10% concentrado desarrollo, 10% soja peleteada) y Engorde (70% maíz, 30% soja peleteada).',
      'Paso 3: Al pasar de Cría a Destete, asentar la transferencia de animales y su costo acumulado (referencia documentada $26.377.259,25).',
      'Paso 4: Distribuir Mano de Obra Directa ($3.000.000 totales: 60% Cría, 30% Destete, 10% Engorde) y Energía ($800.000 asignados a Cría).',
      'Paso 5: Valuar capones terminados a Valor Neto de Realización (VNR) con referencia a cotización ROSPORC.',
    ],
    rolesHabilitados: 'Administrador, Responsable de Unidad Porcina, Operador.',
    ejemploPractico: 'Al suministrar ración de engorde a 40 capones, se registra el parte de consumo con 70% maíz propio y 30% soja peleteada, imputando a las cuentas 4.3.01.02 y 4.3.03.02 respectivamente.',
    consejoClave: 'Las madres y padrillos en producción son activos biológicos reproductores (cuentas 1.4.01 y 1.4.02) con vida útil estimada de 3,5 años; no deben mezclarse con las existencias de animales para venta.',
  },
  {
    id: 'proc_ovinos',
    nombre: 'Procedimiento: Registro en Majada Ovina (Pozo del Carril)',
    categoria: 'ZOOTECNICA',
    badge: 'Procedimiento Paso a Paso',
    descripcion: 'Protocolo canónico para el control de la majada Dorper y cruzas del establecimiento.',
    comoFunciona: 'Respeta la base oficial canónica de 81 cabezas al corte del 30/08/2026 (64 Madres, 2 Carneros y 15 Sin Clasificar en Lote LOT001). Aplica la regla estricta de stock ≥ 0 y trazabilidad inmutable.',
    accionesPrincipales: [
      'Paso 1: Registro de pariciones en Lote LOT001 con alta inmediata de corderos.',
      'Paso 2: Registro de pesajes periódicos distinguiendo Kg Vivo para evaluación de GDP.',
      'Paso 3: Aplicación sanitaria preventiva (clostridial polivalente e ivermectina) respetando el período de carencia antes de venta.',
      'Paso 4: Esquila y zafra lanera PROLANA diferenciando vellón de barriga.',
      'Paso 5: Venta a frigorífico o particulares con liquidación dual ARS/USD a Tipo de Cambio Comprador.',
    ],
    rolesHabilitados: 'Administrador, Responsable Ovino, Operador.',
    ejemploPractico: 'Se registra el destete de 20 corderos: se transfieren de CAT-MAD a CAT-COR-DES en Lote LOT001, sin permitir en ningún momento que el saldo de origen sea inferior a las cabezas movidas.',
    consejoClave: 'La venta histórica previa de 15 corderos (VEN001 / OP011) ocurrió antes del corte del 30/08/2026 y no descuenta de las 81 cabezas de inventario inicial.',
  },
  {
    id: 'proc_sheets',
    nombre: 'Procedimiento: Conexión & Sincronización con Google Sheets',
    categoria: 'CONTROL_SEGURIDAD',
    badge: 'Procedimiento Paso a Paso',
    descripcion: 'Guía paso a paso para vincular, importar, exportar y sincronizar datos bidireccionalmente con Google Sheets API v4.',
    comoFunciona: 'Utiliza el Spreadsheet ID provisto por la administración, mapea las 32 tablas relacionales del ERP y permite operaciones Pull (leer de Sheets) y Push (escribir a Sheets) con respaldo local fuera de línea.',
    accionesPrincipales: [
      'Paso 1: Ingresar a Configuración o hacer clic en el botón de Google Sheets de la cabecera superior.',
      'Paso 2: Pegar el Spreadsheet ID de la planilla compartida de Google Drive.',
      'Paso 3: Presionar "Verificar y Vincular Planilla" para comprobar permisos y estructura de pestañas.',
      'Paso 4: Ejecutar "Importar Datos (Pull)" para cargar la información de Sheets al sistema.',
      'Paso 5: Ejecutar "Sincronizar hacia Sheets (Push)" para respaldar los movimientos y transacciones en la nube.',
    ],
    rolesHabilitados: 'Administrador y Responsable de Unidad.',
    ejemploPractico: 'Al finalizar la jornada operativa, el administrador presiona el botón "Sincronizar" en la barra superior; el sistema envía los nuevos movimientos asentados y actualiza el indicador de estado a "ONLINE Sincronizado".',
    consejoClave: 'Si se pierde la conexión a internet, el motor de caché local retiene las transacciones y las pone en cola para sincronizarlas automáticamente al recuperar señal.',
  },
];

const LOCAL_STORAGE_KEY_GUIA = 'erp_guia_herramientas_custom_v1';

export const loadHerramientasSistema = (): HerramientaSistema[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_GUIA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error al cargar guía personalizada de herramientas:', e);
  }
  return [...GUIA_HERRAMIENTAS_SISTEMA];
};

export const saveHerramientasSistema = (herramientas: HerramientaSistema[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_GUIA, JSON.stringify(herramientas));
  } catch (e) {
    console.warn('Error al guardar guía de herramientas:', e);
  }
};

export const resetHerramientasSistema = (): HerramientaSistema[] => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_GUIA);
  } catch (e) {
    console.warn('Error al restablecer guía:', e);
  }
  return [...GUIA_HERRAMIENTAS_SISTEMA];
};

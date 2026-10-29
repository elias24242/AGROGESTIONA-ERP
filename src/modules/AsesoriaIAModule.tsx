import React, { useState, useMemo } from 'react';
import { Usuario } from '../types/erp';
import { DatabaseState } from '../services/sheetsService';
import {
  BrainCircuit,
  Sparkles,
  HelpCircle,
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Wheat,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  Send,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Database
} from 'lucide-react';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import { DATOS_UNIDAD_PORCINA, DATOS_UNIDAD_BOVINA } from '../data/datosProductivosOficiales';

interface AsesoriaIAModuleProps {
  currentUser?: Usuario | null;
  state?: DatabaseState;
  onNavigateTab?: (tab: any) => void;
  onOpenManual?: (term?: string) => void;
  isLightMode?: boolean;
}

interface ItemFAQ {
  id: string;
  categoria: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONTABILIDAD_RT54' | 'NUTRICION' | 'SENASA';
  pregunta: string;
  respuestaCorta: string;
  explicacionDetallada: string;
  antecedentesOficiales: string[];
  etiquetas: string[];
}

export const AsesoriaIAModule: React.FC<AsesoriaIAModuleProps> = ({
  currentUser,
  state,
  onNavigateTab,
  onOpenManual,
  isLightMode = false,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [faqExpandido, setFaqExpandido] = useState<string | null>('FAQ-01');

  // Pregunta libre del usuario al motor IA
  const [consultaLibre, setConsultaLibre] = useState('');
  const [respuestasConsultas, setRespuestasConsultas] = useState<Array<{
    pregunta: string;
    respuesta: string;
    fecha: string;
    fuente: string;
  }>>([]);
  const [procesandoIA, setProcesandoIA] = useState(false);

  // Banco de Preguntas Frecuentes y Decisiones Técnicas del Ente
  const itemsFAQ: ItemFAQ[] = useMemo(() => [
    {
      id: 'FAQ-01',
      categoria: 'PORCINOS',
      pregunta: '¿Cómo se organiza el ciclo productivo porcino y cómo se transfieren los costos entre fases?',
      respuestaCorta: 'El ciclo se organiza en 3 fases consecutivas: Cría (0–31 días, 0–15 kg) → Destete (31–86 días, 15–50 kg) → Engorde (86–165 días, 50–105 kg). El costo acumulado se transfiere en bloque.',
      explicacionDetallada: 'En la Unidad Porcina de Pozo del Carril, el costo acumulado de cada lechón se transfiere de una fase a la siguiente. Los lechones y cachorros se valúan al costo de producción acumulado (incluyendo la transferencia de Cría a Destete informada en $26.377.259,25), mientras que los capones terminados (50–105 kg) se valúan al Valor Neto de Realización (VNR) según la referencia de mercado ROSPORC.',
      antecedentesOficiales: [
        'Fase Cría: 0–15 kg, duración 31 días, ración 100% preiniciador, cuenta 1.3.03.01.',
        'Fase Destete: 15–50 kg, duración 55 días, ración 80% maíz / 10% concentrado / 10% soja, cuenta 1.3.03.02.',
        'Fase Engorde: 50–105 kg, duración 79 días, ración 70% maíz / 30% soja peleteada, cuenta 1.3.03.03.',
        'Mano de obra directa: $3.000.000 (Cría 60%, Destete 30%, Engorde 10%).',
        'Energía eléctrica: $800.000 asignados íntegramente a Cría.',
      ],
      etiquetas: ['Porcinos', 'Fases', 'Costos', 'Transferencia'],
    },
    {
      id: 'FAQ-02',
      categoria: 'NUTRICION',
      pregunta: '¿Por qué la alimentación representa el 78% del costo en la producción porcina y cómo varía la ración?',
      respuestaCorta: 'El costo nutricional es el insumo preponderante (78%). La ración cambia de 100% concentrado comprado en lechón a 70% maíz propio en capón.',
      explicacionDetallada: 'Durante la Cría, el lechón requiere alimento preiniciador altamente digestible (100% comprado). En el Destete (Cachorro) se pasa a 80% de maíz producido en el campo propio, complementado con 10% de concentrado y 10% de soja peleteada. Finalmente en Engorde, la ración se compone de 70% maíz propio y 30% soja peleteada. Esto disminuye el costo monetario erogado al aprovechar los granos propios del establecimiento.',
      antecedentesOficiales: [
        'Cría: Maíz 0% • Concentrado preiniciador 100% • Soja 0%.',
        'Destete: Maíz 80% • Concentrado desarrollo 10% • Soja peleteada 10%.',
        'Engorde: Maíz 70% • Concentrado 0% • Soja peleteada 30%.',
        'Participación de la alimentación: ~78% de la estructura de costos directos.',
      ],
      etiquetas: ['Alimentación', 'Maíz', 'Soja', 'Ración'],
    },
    {
      id: 'FAQ-03',
      categoria: 'BOVINOS',
      pregunta: '¿Cuáles son las 4 fases productivas bovinas y cuál es la duración total del ciclo de engorde?',
      respuestaCorta: 'Son Cría (180 días), Recría (120 días), Adaptación (30 días) y Engorde (60 días). El ciclo total abarca 390 días (13 meses).',
      explicacionDetallada: 'El ciclo bovino en Pozo del Carril inicia con la Cría al pie de la madre en pasturas hasta 160 kg (consumo ~10 kg/día). Sigue la Recría en pasturas de alfalfa (160–280 kg, consumo ~6 kg/día) para estructura ósea sin engrase. Luego se realiza una Adaptación ruminal de 30 días con maíz y rollos (280–320 kg, consumo ~7 kg/día) para evitar timpanismo, y se finaliza con el Engorde intensivo a corral de 60 días hasta 450 kg (consumo ~10 kg/día).',
      antecedentesOficiales: [
        'Duración total: 390 días (13 meses) desde parición a terminación.',
        'Peso objetivo liviano: 140 kg vs Peso objetivo terminado: 450 kg (310 kg diferencia).',
        'Alimentación: granos representan 70%, silaje 8%, rollos de alfalfa 7%.',
      ],
      etiquetas: ['Bovinos', 'Cría', 'Recría', 'Adaptación', 'Engorde'],
    },
    {
      id: 'FAQ-04',
      categoria: 'BOVINOS',
      pregunta: '¿Cuál es la reconciliación oficial de existencias bovinas de 129 a 174 cabezas?',
      respuestaCorta: 'Se parte de un stock inicial de 129 cabezas, más 40 compradas y 6 ingresadas, menos 1 vendida = 174 cabezas finales.',
      explicacionDetallada: 'En el período 22/06/2026 al 30/09/2026 se reconstruyeron las existencias bovinas: Vacas (57 iniciales + 10 compras = 67 finales), Vaquillona 1 (11 iniciales + 30 compras = 41 finales), Terneros (41 iniciales = 41 finales), Terneras (16 iniciales = 16 finales), y Toros (4 iniciales + 6 ingresos - 1 venta = 9 finales). No hubo muertes registradas en ese período.',
      antecedentesOficiales: [
        'Stock Inicial Propio: 129 cabezas.',
        'Compras: 40 cabezas (10 vacas, 30 vaquillonas).',
        'Ingresos: 6 toros • Ventas: 1 toro • Muertes: 0.',
        'Stock Final Reconciliado: 174 cabezas.',
      ],
      etiquetas: ['Bovinos', 'Stock', 'Reconciliación', '174 Cabezas'],
    },
    {
      id: 'FAQ-05',
      categoria: 'CONTABILIDAD_RT54',
      pregunta: '¿Qué diferencia establece la norma contable RT 54 entre Bienes de Cambio y Activos Biológicos de Producción?',
      respuestaCorta: 'Los destinados a la venta son Bienes de Cambio (valuados al VNR o costo acumulado); los reproductores en servicio son Activos Biológicos de Producción (valuados al costo neto de amortizaciones).',
      explicacionDetallada: 'Según la RT 54 de la FACPCE, los animales para faena o venta (ej: capones terminados, novillos de 450 kg, corderos pesados) son existencias comerciales. En cambio, las madres y reproductores en servicio (ej: plantel de madres porcinas cuenta 1.4.01, padrillos cuenta 1.4.02, vacas PC cuenta 1.4.01.01) se clasifican como activos biológicos en producción y se amortizan según su vida útil (3,5 años en cerdos). Cuando un reproductor se retira del servicio, pasa a la cuenta de descarte.',
      antecedentesOficiales: [
        'Cuenta 1.3: Bienes de Cambio (Lechones, Capones, Novillos, Vaquillonas descarte).',
        'Cuenta 1.4: Activos Biológicos en Producción (Madres, Padrillos, Toros cabaña).',
        'Cuenta 1.4.03: Amortización acumulada de reproductores (regularizadora).',
        'Ejemplo venta VNR: 15 novillos terminados (VNR $28.053.034,68 deducidos fletes y comisiones).',
      ],
      etiquetas: ['RT 54', 'Contabilidad', 'VNR', 'Amortización'],
    },
    {
      id: 'FAQ-06',
      categoria: 'OVINOS',
      pregunta: '¿Cuál es la base zootécnica de la majada ovina Dorper en Pozo del Carril?',
      respuestaCorta: 'La majada cuenta con 18 cabezas activas en el módulo principal (raza Dorper de pelo), con antecedentes históricos auditados de 81 cabezas al 30/08/2026.',
      explicacionDetallada: 'La explotación ovina está orientada a la producción de carne ovina desestacionalizada mediante ovejas y carneros Dorper. No requiere esquila de lana tradicional, optimizando la mano de obra. Se realiza pastoreo rotativo sobre pasturas consociadas y suplementación estratégica en épocas de encaste y pre-parto.',
      antecedentesOficiales: [
        'Stock activo actual: 18 cabezas (Ovejas madres, borregas y carneros).',
        'Baseline canónico histórico auditado: 81 cabezas al 30/08/2026.',
        'Subunidades: Ovinos Pozo del Carril (SUB-001) y La Aguada (SUB-002).',
      ],
      etiquetas: ['Ovinos', 'Dorper', 'Majada', 'Pasturas'],
    },
    {
      id: 'FAQ-07',
      categoria: 'SENASA',
      pregunta: '¿Qué documentación y costos intervienen en la comercialización de hacienda y emisión de DTe?',
      respuestaCorta: 'Intervienen el DTe (Documento de Tránsito electrónico), guía de traslado provincial, aranceles SENASA, pesaje de pista y flete jaula.',
      explicacionDetallada: 'Toda salida de hacienda del establecimiento Pozo del Carril requiere la emisión previa del DTe con destino a frigorífico o feria consignataria. En el caso porcino, el documento informa que no hay comisión de mercado por ser venta directa a faenador (solo flete y tipificación en cuenta 4.3.09). En el caso bovino, para un lote de 15 novillos terminados, los costos incluyeron $910.508 de comisión, $1.200.000 de flete jaula compartido, $151.751 de pesaje y $35.000 de aranceles SENASA y guías.',
      antecedentesOficiales: [
        'DTe SENASA obligatorio para todo movimiento inter e intradepartamental.',
        'Venta directa a frigorífico: sin comisión de feria consignataria.',
        'Venta en remate feria: 5% comisión consignataria + derechos de pista.',
      ],
      etiquetas: ['SENASA', 'DTe', 'Flete', 'Comercialización'],
    },
  ], []);

  const categoriasDisponibles = [
    { id: 'TODAS', label: 'Todas las Consultas' },
    { id: 'PORCINOS', label: '🐖 Porcinos' },
    { id: 'BOVINOS', label: '🐄 Bovinos' },
    { id: 'OVINOS', label: '🐑 Ovinos' },
    { id: 'CONTABILIDAD_RT54', label: '📊 RT 54 Contabilidad' },
    { id: 'NUTRICION', label: '🌾 Nutrición & Raciones' },
    { id: 'SENASA', label: '📑 SENASA & DTe' },
  ];

  const faqsFiltrados = useMemo(() => {
    return itemsFAQ.filter(item => {
      const matchCat = categoriaSeleccionada === 'TODAS' || item.categoria === categoriaSeleccionada;
      const matchBusqueda =
        !busqueda.trim() ||
        item.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.respuestaCorta.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.etiquetas.some(t => t.toLowerCase().includes(busqueda.toLowerCase()));
      return matchCat && matchBusqueda;
    });
  }, [itemsFAQ, categoriaSeleccionada, busqueda]);

  // Procesar consulta libre con el conocimiento oficial del ente
  const handleProcesarConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaLibre.trim()) return;

    setProcesandoIA(true);

    setTimeout(() => {
      const q = consultaLibre.toLowerCase();
      let r = '';
      let f = 'Base de Conocimiento Zootécnico & Contable Pozo del Carril';

      if (q.includes('porc') || q.includes('cerd') || q.includes('lech') || q.includes('capon')) {
        r = `Para la Unidad Porcina, los antecedentes registran 3 fases productivas: Cría (0–15 kg, 31 días, ración 100% preiniciador), Destete (15–50 kg, 55 días, 80% maíz / 10% concentrado / 10% soja) y Engorde (50–105 kg, 79 días, 70% maíz / 30% soja). La alimentación representa el 78% del costo total. La mano de obra asciende a $3.000.000 (distribuida 60% Cría, 30% Destete, 10% Engorde). La transferencia de costos de Cría a Destete informada es de $26.377.259,25. Madres y padrillos en actividad se clasifican como activos biológicos en cuenta 1.4.01 y 1.4.02 amortizables a 3,5 años.`;
        f = 'Inventario Porcino Oficial — Pozo del Carril (UNRC)';
      } else if (q.includes('bov') || q.includes('vaca') || q.includes('novill') || q.includes('terner')) {
        r = `En la Unidad Bovina, el ciclo abarca 390 días (13 meses) en 4 fases: Cría (180 días, lactancia al pie de la madre hasta 160 kg), Recría (120 días, alfalfa hasta 280 kg), Adaptación (30 días, acostumbramiento con maíz y rollos hasta 320 kg) y Engorde (60 días, corral hasta 450 kg terminados). Las existencias reconstruidas arrojaron 174 cabezas (57 vacas iniciales + 10 compras = 67 vacas, 41 vaquillonas, 41 terneros, 16 terneras, 9 toros). Los precios de referencia del MAG Cañuelas fueron: Novillo $4.496,34, Vaquillona $4.662,75, Vaca $3.354,18. Un ejemplo de venta de 15 novillos (6.750 kg) arrojó un VNR de $28.053.034,68.`;
        f = 'Inventario Bovino Oficial — Pozo del Carril (UNRC)';
      } else if (q.includes('ovin') || q.includes('oveja') || q.includes('dorper') || q.includes('cordero')) {
        r = `En la Unidad Ovina, el establecimiento opera con la raza Dorper (ovinos deslanados de carne), con 18 cabezas activas en los lotes principales y una base canónica histórica auditada de 81 cabezas al 30/08/2026. La producción se orienta al cordero pesado para consumo con alta rusticidad y sin costos de esquila de lana.`;
        f = 'Inventario Ovino Canónico — Pozo del Carril / La Aguada';
      } else if (q.includes('rt 54') || q.includes('contab') || q.includes('valuacion') || q.includes('vnr')) {
        r = `Conforme a la Resolución Técnica 54 de la FACPCE, los activos destinados a la comercialización (bienes de cambio) se valúan al costo de producción acumulado en etapas iniciales (lechones y cachorros) o al Valor Neto de Realización (VNR) en categorías con mercado activo y cotización transparente (capones terminados según ROSPORC y novillos terminados según MAG Cañuelas). Los reproductores en servicio (vacas PC, madres y padrillos) se valúan como activos biológicos en producción netos de amortización acumulada.`;
        f = 'Criterios Contables RT 54 FACPCE & Plan de Cuentas Agrogestiona';
      } else {
        r = `De acuerdo con la información institucional de AGROGESTIONA ERP y el establecimiento Pozo del Carril – La Aguada (UNRC), el ente administra 170 cabezas integradas (18 ovinos, 27 bovinos y 125 porcinos), con registros zootécnicos discriminados por especie y subunidad, sincronización en vivo con Google Sheets y cumplimiento estricto de las normas RT 54 y SENASA.`;
        f = 'Manual Técnico Operativo AGROGESTIONA ERP';
      }

      setRespuestasConsultas(prev => [
        {
          pregunta: consultaLibre.trim(),
          respuesta: r,
          fecha: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          fuente: f,
        },
        ...prev,
      ]);

      setConsultaLibre('');
      setProcesandoIA(false);
    }, 400);
  };

  return (
    <div className="space-y-5 m3-view-enter">
      {/* Encabezado del Módulo de Asesoría */}
      <div className={`p-4 sm:p-5 border rounded-[2px] transition-colors ${
        isLightMode
          ? 'bg-white border-slate-300 shadow-xs'
          : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[2px] bg-purple-700 flex items-center justify-center text-white shadow-xs shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Asesoría Zootécnica & FAQ Inteligente con IA
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  Grounded Knowledge
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                Preguntas frecuentes técnicas, reglas de manejo y motor de respuestas basado estrictamente en el inventario y antecedentes de Pozo del Carril.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <BotonAyudaContextual moduloId="analytics" onOpenManual={onOpenManual} />
          </div>
        </div>

        {/* Recordatorio de Asistente Flotante */}
        <div className="mt-3.5 p-2.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Asistente IA General:</strong> Puedes utilizar también el botón flotante de la barra superior en cualquier momento para consultas en vivo mientras navegas por otros módulos.
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONSULTA INTERACTIVA AL ENTE */}
      <div className={`p-4 sm:p-5 border rounded-[2px] space-y-3 ${
        isLightMode ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#141414] border-[#262626]'
      }`}>
        <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-400">
          <Lightbulb className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-wider">
            Consultar al Cerebro de Datos del Establecimiento
          </h3>
        </div>

        <form onSubmit={handleProcesarConsulta} className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={consultaLibre}
              onChange={e => setConsultaLibre(e.target.value)}
              placeholder="Escribe tu consulta zootécnica o contable... Ej: ¿Cuál es el costo de alimentación en porcinos y qué ración llevan?"
              className="flex-1 px-3 py-2 text-xs rounded-[2px] border focus:outline-none focus:border-purple-600 font-medium"
            />
            <button
              type="submit"
              disabled={procesandoIA || !consultaLibre.trim()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs rounded-[2px] transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{procesandoIA ? 'Analizando...' : 'Consultar'}</span>
            </button>
          </div>
        </form>

        {/* Historial de respuestas en vivo */}
        {respuestasConsultas.length > 0 && (
          <div className="space-y-2.5 pt-2">
            {respuestasConsultas.map((r, idx) => (
              <div
                key={idx}
                className={`p-3.5 border rounded-[2px] space-y-1.5 m3-modal-open ${
                  isLightMode
                    ? 'bg-purple-50/70 border-purple-200 text-slate-800'
                    : 'bg-[#181520] border-purple-900/50 text-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-purple-800 dark:text-purple-300">
                    Q: "{r.pregunta}"
                  </span>
                  <span className="text-[10px] opacity-70">{r.fecha}</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {r.respuesta}
                </p>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 flex items-center space-x-1 pt-1">
                  <Database className="w-3 h-3 text-purple-500" />
                  <span>Fuente: {r.fuente}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTROS POR CATEGORÍA DE PREGUNTAS FRECUENTES */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-slate-800' : 'text-neutral-200'}`}>
            Preguntas Frecuentes & Decisiones Clave ({faqsFiltrados.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar en preguntas frecuentes..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-[2px] border focus:outline-none"
            />
          </div>
        </div>

        {/* Botones de categoría */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          {categoriasDisponibles.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaSeleccionada(cat.id)}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                categoriaSeleccionada === cat.id
                  ? 'bg-purple-700 text-white shadow-xs'
                  : isLightMode
                  ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#181818] border border-[#2a2a2a] text-neutral-300 hover:bg-[#222222]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* LISTADO DE FAQS EXPANDIBLES */}
        <div className="space-y-2">
          {faqsFiltrados.map(faq => {
            const isExpanded = faqExpandido === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-[2px] transition-colors ${
                  isLightMode
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-[#141414] border-[#262626]'
                }`}
              >
                <button
                  onClick={() => setFaqExpandido(isExpanded ? null : faq.id)}
                  className={`w-full text-left p-3.5 flex items-start justify-between gap-3 cursor-pointer ${
                    isExpanded
                      ? isLightMode ? 'bg-slate-50/80' : 'bg-[#181818]'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-[2px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        {faq.categoria}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                        {faq.pregunta}
                      </h4>
                    </div>
                    {!isExpanded && (
                      <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-neutral-400'}`}>
                        {faq.respuestaCorta}
                      </p>
                    )}
                  </div>

                  <div className="pt-0.5 shrink-0 text-slate-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-black/5 dark:border-white/5 space-y-3 animate-in fade-in-50 duration-150">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block mb-0.5">
                        Resumen Ejecutivo
                      </span>
                      <p className={`text-xs font-semibold ${isLightMode ? 'text-slate-800' : 'text-neutral-200'}`}>
                        {faq.respuestaCorta}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-0.5">
                        Explicación Técnica y Criterio Productivo
                      </span>
                      <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-neutral-300'}`}>
                        {faq.explicacionDetallada}
                      </p>
                    </div>

                    {/* Antecedentes oficiales documentados */}
                    <div className={`p-3 rounded-[2px] border ${
                      isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#181818] border-[#2c2c2c]'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block mb-1">
                        📋 Antecedentes Verificados de Pozo del Carril:
                      </span>
                      <ul className="space-y-1">
                        {faq.antecedentesOficiales.map((ant, aIdx) => (
                          <li key={aIdx} className="text-xs flex items-start space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{ant}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Etiquetas */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      {faq.etiquetas.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-black/5 dark:bg-white/5 text-slate-500 dark:text-neutral-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

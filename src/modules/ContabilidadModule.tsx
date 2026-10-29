import React, { useState } from 'react';
import { DatabaseState } from '../services/sheetsService';
import {
  FileText,
  BookOpen,
  Info,
  Scale,
  TrendingUp,
  Boxes,
  Layers,
  Wheat,
  ShieldCheck,
  ExternalLink,
  ClipboardList,
  Sparkles,
  Search,
  BookMarked
} from 'lucide-react';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import { DOLAR_HOY_URL, MonedaTipo, getTipoCambioOficial } from '../services/currencyService';

interface ContabilidadModuleProps {
  state: DatabaseState;
  selectedCampania: string;
  isTestMode: boolean;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
  monedaVisualizacion?: MonedaTipo;
  tipoCambioOficial?: number;
  isLightMode?: boolean;
}

type CapituloRT54 = 'fundamentos' | 'valuacion' | 'punto_cosecha' | 'exposicion' | 'cuadro_sinoptico';

export const ContabilidadModule: React.FC<ContabilidadModuleProps> = ({
  state,
  selectedCampania,
  isTestMode,
  onOpenManual,
  monedaVisualizacion = 'ARS',
  tipoCambioOficial = getTipoCambioOficial(),
  isLightMode = false,
}) => {
  const [capituloActivo, setCapituloActivo] = useState<CapituloRT54>('fundamentos');
  const [filtroEspecie, setFiltroEspecie] = useState<'TODAS' | 'OVINOS' | 'BOVINOS' | 'PORCINOS'>('TODAS');
  const [busquedaGlosario, setBusquedaGlosario] = useState<string>('');

  const glosarioTerminos = [
    {
      termino: 'Activo Biológico',
      definicion: 'Animal o planta viviente controlado por el ente agropecuario como resultado de eventos pasados, del cual se esperan beneficios económicos futuros.',
      norma: 'RT 54 FACPCE - Cap. V'
    },
    {
      termino: 'Transformación Biológica',
      definicion: 'Procesos de crecimiento, degeneración, producción y procreación que causan cambios cualitativos o cuantitativos en un activo biológico.',
      norma: 'RT 54 FACPCE - Cap. V'
    },
    {
      termino: 'Valor Neto de Realización (VNR)',
      definicion: 'Precio de venta estimado en el curso ordinario del negocio en un mercado activo, menos los gastos directos necesarios para realizar la venta (comisiones de remate, flete al frigorífico, guías DTE).',
      norma: 'RT 54 FACPCE - Cap. IV y V'
    },
    {
      termino: 'Costo Histórico Amortizado',
      definicion: 'Valor original de adquisición o costo atribuido zootécnico acumulado, deducida la depreciación acumulada calculada según la vida útil económica estimada del reproductor y su valor residual.',
      norma: 'RT 54 FACPCE - Cap. V'
    },
    {
      termino: 'Punto de Cosecha / Recolección',
      definicion: 'Momento de separación física del producto del activo biológico (esquila de lana, ordeñe de leche, destete de corderos/terneros) o cesación de sus funciones vitales (faena).',
      norma: 'RT 54 FACPCE - Cap. V'
    },
    {
      termino: 'Resultado de la Producción Agropecuaria (RPA)',
      definicion: 'Incremento de valor económico generado por el crecimiento biológico, nacimientos y producción de productos biológicos durante el ejercicio, reconocido antes de la venta.',
      norma: 'RT 54 FACPCE - Cap. VII'
    },
    {
      termino: 'Resultado por Tenencia de Hacienda',
      definicion: 'Variación en la valuación de los activos biológicos mantenidos en stock debido a cambios en los precios de cotización de mercado entre dos fechas determinadas.',
      norma: 'RT 54 FACPCE - Cap. VII'
    },
    {
      termino: 'Partida en Suspenso Zootécnico',
      definicion: 'Hacienda cuya tipificación (edad, categoría, aptitud reproductiva) está pendiente de confirmación en campo; se mantiene cautelarmente al costo sin reconocer resultados anticipados.',
      norma: 'Principio de Prudencia RT 54'
    }
  ];

  const glosarioFiltrado = glosarioTerminos.filter(
    t => t.termino.toLowerCase().includes(busquedaGlosario.toLowerCase()) ||
         t.definicion.toLowerCase().includes(busquedaGlosario.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Institucional Normativo RT 54 */}
      <div className={`p-4 rounded-[2px] border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isLightMode
          ? 'bg-white border-emerald-200 text-slate-900'
          : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-[2px] border ${
            isLightMode ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-[#183027] border-[#264d3f] text-emerald-400'
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className={`text-base font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Normativa Contable RT 54 (FACPCE) — Valuación y Exposición en Entes Agropecuarios
              </h2>
              <BotonAyudaContextual moduloId="contabilidad" onOpenManual={onOpenManual} />
            </div>
            <p className={`text-xs mt-0.5 font-medium ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
              Compendio formativo y técnico sobre los métodos de medición y presentación para la actividad agropecuaria argentina (Norma Unificada FACPCE RT 54 / NUA).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className={`px-2.5 py-1 rounded-[2px] border text-[11px] font-semibold ${
            isLightMode ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5]'
          }`}>
            <span>Módulo Informativo & Didáctico</span>
          </div>
          <a
            href={DOLAR_HOY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-1 px-3 py-1 border rounded-[2px] text-xs font-semibold ${
              isLightMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6] hover:bg-[#1f3d32]'
            }`}
            title="Ver cotización oficial del dólar en Dólar Hoy"
          >
            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black">TC: ${tipoCambioOficial}</span>
            <ExternalLink className="w-3 h-3 text-slate-500 dark:text-[#a2c7b5]" />
          </a>
        </div>
      </div>

      {/* Navegación por Capítulos de Aprendizaje Normativo */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-[#264d3f] gap-1 pb-2">
        {[
          { id: 'fundamentos', label: '1. Fundamentos & Alcance', icon: BookOpen },
          { id: 'valuacion', label: '2. Métodos de Valuación', icon: Boxes },
          { id: 'punto_cosecha', label: '3. Punto de Cosecha & Resultados', icon: Wheat },
          { id: 'exposicion', label: '4. Exposición en Estados Contables', icon: FileText },
          { id: 'cuadro_sinoptico', label: '5. Cuadro Sinóptico & Casos de Estudio', icon: Layers },
        ].map(item => {
          const Icon = item.icon;
          const isSelected = capituloActivo === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCapituloActivo(item.id as CapituloRT54)}
              className={`px-3 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : isLightMode
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
                  : 'text-[#a2c7b5] hover:text-white hover:bg-[#183027]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Indicador de auditoría normativa */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['referencias_rendimiento', 'inventario_inicial', 'movimientos_hacienda', 'costos']}
        seccionNombre="Guía Normativa Contable RT 54"
      />

      {/* ========================================================================= */}
      {/* CAPÍTULO 1: FUNDAMENTOS Y ALCANCE DE LA RT 54                             */}
      {/* ========================================================================= */}
      {capituloActivo === 'fundamentos' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-[2px] border shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Normas Contables Profesionales Argentinas • FACPCE</span>
            </div>
            <h3 className={`text-lg font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Resolución Técnica N° 54: Marco Unificado para Entes Agropecuarios
            </h3>
            <p className={`text-xs mt-2 leading-relaxed max-w-4xl ${isLightMode ? 'text-slate-700 font-medium' : 'text-[#a2c7b5]'}`}>
              La <strong>Resolución Técnica N° 54</strong> de la Federación Argentina de Consejos Profesionales de Ciencias Económicas (FACPCE) —junto a la RT 56 y el texto ordenado de la Norma Unificada Argentina (NUA)— establece el cuerpo integral de normas contables profesionales aplicable a entes que desarrollan actividad agrícola-ganadera. Su propósito es reflejar fielmente la realidad económica originada por los ciclos biológicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pilar 1 */}
            <div className={`p-4 rounded-[2px] border space-y-2.5 ${
              isLightMode ? 'bg-[#f0fdf4] border-emerald-200 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-300 dark:border-[#264d3f]">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  El Hecho Económico Biológico
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                A diferencia de la actividad comercial tradicional, en el agro la generación de riqueza ocurre durante el <strong>crecimiento, procreación y desarrollo de los animales y cultivos</strong>, y no únicamente en el instante de la venta.
              </p>
              <div className={`p-2 rounded-[2px] text-[11px] font-semibold border ${
                isLightMode ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-[#12241d] border-[#264d3f] text-[#a2c7b5]'
              }`}>
                Principio: El valor se genera biológicamente a campo; la venta es un mero acto de liquidación financiera.
              </div>
            </div>

            {/* Pilar 2 */}
            <div className={`p-4 rounded-[2px] border space-y-2.5 ${
              isLightMode ? 'bg-[#f0fdf4] border-emerald-200 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-300 dark:border-[#264d3f]">
                <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Distinción según Destino
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                La norma exige clasificar los activos biológicos según su <strong>función y destino económico</strong> en la explotación:
              </p>
              <ul className={`list-disc list-inside text-[11px] space-y-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                <li><strong>Bienes de Cambio:</strong> Hacienda para comercialización (corderos, novillos, capones, lechones).</li>
                <li><strong>Bienes de Uso Biológicos:</strong> Reproductores retenidos para producir crías o lana (madres, carneros, toros, padrillos).</li>
              </ul>
            </div>

            {/* Pilar 3 */}
            <div className={`p-4 rounded-[2px] border space-y-2.5 ${
              isLightMode ? 'bg-[#f0fdf4] border-emerald-200 text-slate-900' : 'bg-[#183027] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-300 dark:border-[#264d3f]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Criterio de Prudencia & Fe
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                La valuación requiere basarse en mercados activos y transparentes comprobables. Si no existe mercado activo en la condición actual o no hay certeza zootécnica de clasificación, se prohíbe anticipar ganancias no verificables.
              </p>
              <div className={`p-2 rounded-[2px] text-[11px] font-semibold border ${
                isLightMode ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-[#12241d] border-[#264d3f] text-[#a2c7b5]'
              }`}>
                Las partidas sin tipificar se valúan al costo histórico incurrido hasta su verificación fenotípica.
              </div>
            </div>
          </div>

          {/* Glosario Normativo Didáctico */}
          <div className={`p-5 rounded-[2px] border shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className={`text-sm font-black ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Glosario Técnico Oficial RT 54 (Conceptos Clave para el Productor y Contador)
                </h4>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={busquedaGlosario}
                  onChange={e => setBusquedaGlosario(e.target.value)}
                  placeholder="Buscar término o definición..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-[2px] text-xs border outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#183027] border-[#264d3f] text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {glosarioFiltrado.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-[2px] border transition-colors ${
                    isLightMode
                      ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-300'
                      : 'bg-[#183027]/70 border-[#264d3f] hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isLightMode ? 'text-emerald-950' : 'text-emerald-400'}`}>
                      {item.termino}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] border ${
                      isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#12241d] border-[#264d3f] text-[#a2c7b5]'
                    }`}>
                      {item.norma}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                    {item.definicion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAPÍTULO 2: MÉTODOS DE VALUACIÓN DE ACTIVOS BIOLÓGICOS                    */}
      {/* ========================================================================= */}
      {capituloActivo === 'valuacion' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-[2px] border shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <h3 className={`text-base font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Criterios de Valuación al Cierre de Ejercicio según RT 54
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isLightMode ? 'text-slate-600 font-medium' : 'text-[#a2c7b5]'}`}>
              La norma establece un tratamiento diferenciado para los activos biológicos según su destino productivo y comercial, garantizando la prudencia y uniformidad del balance contable.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Método 1: Bienes de Cambio Biológicos */}
            <div className={`p-5 rounded-[2px] border space-y-4 shadow-xs ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2.5 pb-2 border-b border-emerald-200 dark:border-[#264d3f]">
                <div className={`p-1.5 rounded-[2px] ${isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-[#183027] text-emerald-400'}`}>
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                    1. Bienes de Cambio Biológicos (Hacienda para Venta)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-[#a2c7b5]">Corderos de faena, novillos, capones, terneros comerciales, lechones</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`p-3 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs font-bold mb-1 ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Regla General: Valor Neto de Realización (VNR)
                  </strong>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Cuando exista un <strong>mercado activo</strong> en su condición actual (ej: Mercado de Cañuelas, ferias de remate locales, frigoríficos de la zona):
                  </p>
                  <div className={`mt-2 p-2 rounded-[2px] font-mono text-[11px] font-bold border ${
                    isLightMode ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-[#12241d] border-[#264d3f] text-emerald-400'
                  }`}>
                    VNR = Cotización de Mercado - Gastos Directos en el Punto de Venta
                  </div>
                  <ul className={`list-disc list-inside text-[11px] mt-2 space-y-0.5 ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                    <li><strong>Precio de Referencia:</strong> Precio por kilo vivo o cabeza en la plaza relevante al cierre.</li>
                    <li><strong>Gastos Deducibles:</strong> Comisión del consignatario/martillero, flete hasta planta de faena, guías SENASA y pesaje.</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-[2px] border ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#152b22] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs font-bold mb-1 ${isLightMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    Excepción: Hacienda en Etapa Inicial sin Mercado Activo
                  </strong>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#a2c7b5]'}`}>
                    Para animales en crecimiento que no poseen un mercado activo en su estado presente (ej: corderos o lechones lactantes al pie de la madre):
                  </p>
                  <p className={`text-[11px] mt-1 font-semibold ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                    ➔ Se valúan al <strong>Costo de Reposición</strong> acumulado de los insumos y labores consumidas hasta la fecha del balance.
                  </p>
                </div>
              </div>
            </div>

            {/* Método 2: Bienes de Uso Biológicos */}
            <div className={`p-5 rounded-[2px] border space-y-4 shadow-xs ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2.5 pb-2 border-b border-emerald-200 dark:border-[#264d3f]">
                <div className={`p-1.5 rounded-[2px] ${isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-[#183027] text-emerald-400'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                    2. Bienes de Uso Biológicos (Activos de Producción / Reproductores)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-[#a2c7b5]">Ovejas madres, carneros de servicio, vacas de cría, toros reproductores, cerdas madres</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`p-3 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs font-bold mb-1 ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Opción A: Costo Histórico Amortizado (Método Tradicional Preferido)
                  </strong>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Los animales reproductores se mantienen en el activo no corriente al costo original de compra o incorporación zootécnica, amortizándose a lo largo de su vida útil productiva:
                  </p>
                  <div className={`mt-2 p-2 rounded-[2px] font-mono text-[11px] font-bold border ${
                    isLightMode ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-[#12241d] border-[#264d3f] text-emerald-400'
                  }`}>
                    Valor Residual = Costo Original - Amortizaciones Acumuladas
                  </div>
                  <ul className={`list-disc list-inside text-[11px] mt-2 space-y-0.5 ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                    <li><strong>Vida Útil Técnica:</strong> Típicamente entre 5 y 6 años para vientres ovinos/bovinos, o número de pariciones programadas.</li>
                    <li><strong>Valor de Rezago:</strong> Estimación del valor de recupero al descarte (faena para consumo o conserva).</li>
                    <li><strong>Ventaja Técnica:</strong> Evita la volatilidad de los precios de mercado en el patrimonio neto de la explotación.</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-[2px] border ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#152b22] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs font-bold mb-1 ${isLightMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    Opción B: Modelo del Valor Razonable (VNR al Cierre)
                  </strong>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#a2c7b5]'}`}>
                    La RT 54 permite valuar los reproductores a su <strong>Valor Neto de Realización</strong> al cierre del ejercicio, reconociendo las fluctuaciones de precio en los resultados del período o en el superávit de revaluación según política del ente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque Especial: Partidas en Suspenso Zootécnico */}
          <div className={`p-4 rounded-[2px] border ${
            isLightMode ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
          }`}>
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider mb-1">
                  Tratamiento de Partidas en Suspenso Zootécnico (Hacienda Sin Clasificar)
                </h4>
                <p className="text-xs leading-relaxed">
                  Cuando existen lotes de hacienda cuyo destino o categoría zootécnica no ha podido ser confirmada mediante pesaje, boqueo dental o control de fertilidad (por ejemplo, ovinos en recría o terneros en transición):
                </p>
                <div className="mt-2 text-xs font-semibold space-y-1">
                  <p>• <strong>Criterio de Prudencia RT 54:</strong> No se pueden imputar a valor de venta ni reconocer resultados por producción hasta su tipificación fehaciente.</p>
                  <p>• <strong>Medición:</strong> Se exponen temporalmente al costo incurrido comprobable bajo nota explicativa en los Estados Contables.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAPÍTULO 3: PUNTO DE COSECHA Y RECONOCIMIENTO DE RESULTADOS               */}
      {/* ========================================================================= */}
      {capituloActivo === 'punto_cosecha' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-[2px] border shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Wheat className="w-4 h-4" />
              <span>Cese de Vida Vegetativa o Separación Biológica</span>
            </div>
            <h3 className={`text-base font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Medición en el Punto de Cosecha, Esquila o Extracción
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isLightMode ? 'text-slate-600 font-medium' : 'text-[#a2c7b5]'}`}>
              El punto de recolección representa el momento contable en el cual el producto se independiza del activo biológico que lo produjo (esquila del vellón ovino, ordeñe de leche, destete de corderos/terneros o cosecha de pasturas/granos).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Paso 1 */}
            <div className={`p-4 rounded-[2px] border space-y-2.5 ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs pb-2 border-b border-slate-200 dark:border-[#264d3f]">
                <span className="w-5 h-5 rounded-[2px] bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                <span>Medición Inicial Obligatoria</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                Los productos obtenidos se valúan al <strong>Valor Neto de Realización (VNR)</strong> estimado al momento exacto de la cosecha o esquila.
              </p>
              <div className={`p-2.5 rounded-[2px] text-[11px] border ${
                isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold' : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5]'
              }`}>
                Ejemplo: Lana vellón esquilada se mide al precio de plaza PROLANA menos costo de enfardado y flete al polo lanero de Trelew o Buenos Aires.
              </div>
            </div>

            {/* Paso 2 */}
            <div className={`p-4 rounded-[2px] border space-y-2.5 ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs pb-2 border-b border-slate-200 dark:border-[#264d3f]">
                <span className="w-5 h-5 rounded-[2px] bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                <span>Reconocimiento del RPA</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                La diferencia entre el VNR del producto en el punto de recolección y los costos devengados en el proceso productivo se imputa al Estado de Resultados:
              </p>
              <div className={`p-2.5 rounded-[2px] text-[11px] font-mono border ${
                isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold' : 'bg-[#183027] border-[#264d3f] text-emerald-400'
              }`}>
                RPA = VNR Cosecha - Costos de Explotación Devengados
              </div>
            </div>

            {/* Paso 3 */}
            <div className={`p-4 rounded-[2px] border space-y-2.5 ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs pb-2 border-b border-slate-200 dark:border-[#264d3f]">
                <span className="w-5 h-5 rounded-[2px] bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                <span>Ingreso a Inventario</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                Ese VNR inicial se transforma en el <strong>Costo Atribuido</strong> del producto agropecuario en el inventario comercial (Bienes de Cambio) para su posterior venta o consumo en el campo.
              </p>
              <div className={`p-2.5 rounded-[2px] text-[11px] border ${
                isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold' : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5]'
              }`}>
                Si el producto permanece en galpón al cierre, se revalúa a su nuevo VNR de fecha de balance reconociendo Resultado por Tenencia.
              </div>
            </div>
          </div>

          {/* Comparativa Crítica: Margen Operativo vs. Medición Patrimonial RT 54 */}
          <div className={`p-5 rounded-[2px] border shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <h4 className={`text-sm font-black mb-2 ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
              Distinción Conceptual: Margen Operativo de Gestión vs. Medición Patrimonial RT 54
            </h4>
            <p className={`text-xs mb-4 ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
              Uno de los errores más frecuentes en la administración ganadera es confundir el resultado financiero o margen de gestión con el resultado contable bajo RT 54.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className={`p-4 rounded-[2px] border ${
                isLightMode ? 'bg-slate-50 border-slate-300' : 'bg-[#183027] border-[#264d3f]'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-slate-500 dark:text-[#a2c7b5]" />
                  <strong className={`text-xs font-black uppercase ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Margen Operativo de Gestión (Enfoque de Caja y Explotación)
                  </strong>
                </div>
                <ul className={`list-disc list-inside space-y-1.5 ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                  <li>Mide exclusivamente las <strong>ventas efectivas facturadas y cobradas</strong> en el ejercicio.</li>
                  <li>Deduce los costos directos devengados (alimentación, sanidad, sueldos del personal de campo).</li>
                  <li><strong>Limitación:</strong> Si un establecimiento retuvo 200 corderos y crecieron en peso pero no se vendieron, el margen operativo mostraría pérdida o ganancia cero, ocultando el verdadero crecimiento económico de la majada.</li>
                </ul>
              </div>

              <div className={`p-4 rounded-[2px] border ${
                isLightMode ? 'bg-[#f0fdf4] border-emerald-300' : 'bg-[#152b22] border-emerald-700'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <strong className={`text-xs font-black uppercase ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Medición Patrimonial RT 54 (Enfoque Económico Real)
                  </strong>
                </div>
                <ul className={`list-disc list-inside space-y-1.5 ${isLightMode ? 'text-slate-800' : 'text-[#d1e7dc]'}`}>
                  <li>Reconoce el <strong>crecimiento zootécnico en kilos y cabezas</strong> como ganancia biológica del ejercicio (Resultado de la Producción Agropecuaria).</li>
                  <li>Refleja la retención de vientres y la reposición de reproductores como inversión de capital biológico.</li>
                  <li><strong>Aporte Profesional:</strong> Los Estados Contables muestran fielmente la capacidad de generación de riqueza del campo, independientemente de la fecha elegida para comercializar los lotes.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAPÍTULO 4: EXPOSICIÓN EN LOS ESTADOS CONTABLES                           */}
      {/* ========================================================================= */}
      {capituloActivo === 'exposicion' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-[2px] border shadow-xs ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
          }`}>
            <h3 className={`text-base font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Estructura Obligatoria de Presentación según RT 54 (FACPCE)
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isLightMode ? 'text-slate-600 font-medium' : 'text-[#a2c7b5]'}`}>
              La RT 54 normaliza la estructura del Estado de Situación Patrimonial, Estado de Resultados y las Notas a los Estados Contables con desagregación técnica específica para empresas agrícolas y ganaderas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Estado de Situación Patrimonial */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200 dark:border-[#264d3f]">
                <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  1. Estado de Situación Patrimonial
                </h4>
              </div>
              <div className="space-y-2">
                <div className={`p-2.5 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Activo Corriente
                  </strong>
                  <ul className={`list-disc list-inside text-[11px] mt-1 space-y-0.5 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    <li><strong>Bienes de Cambio Biológicos:</strong> Animales para venta o faena dentro de los próximos 12 meses.</li>
                    <li><strong>Productos Agropecuarios:</strong> Lana, granos y rollos almacenados en galpón al cierre.</li>
                  </ul>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Activo No Corriente
                  </strong>
                  <ul className={`list-disc list-inside text-[11px] mt-1 space-y-0.5 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    <li><strong>Bienes de Uso Biológicos:</strong> Animales reproductores que permanecen en el plantel por más de un ejercicio económico.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Estado de Resultados */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200 dark:border-[#264d3f]">
                <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  2. Estado de Resultados
                </h4>
              </div>
              <div className="space-y-2">
                <div className={`p-2.5 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Línea Obligatoria Específica
                  </strong>
                  <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Se debe exponer de forma autónoma el <strong>Resultado de la Producción Agropecuaria</strong>, separándolo nítidamente de los ingresos por venta de hacienda y de los costos operativos.
                  </p>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Resultados por Tenencia
                  </strong>
                  <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Diferencia entre el valor de mercado al cierre y el valor contable inicial de los animales conservados, desagregado de los resultados netamente biológicos.
                  </p>
                </div>
              </div>
            </div>

            {/* Información Complementaria */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200 dark:border-[#264d3f]">
                <ClipboardList className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  3. Notas y Anexos Cuantitativos
                </h4>
              </div>
              <div className="space-y-2">
                <div className={`p-2.5 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Conciliación Cuantitativa de Hacienda
                  </strong>
                  <div className={`font-mono text-[10px] mt-1 p-1.5 rounded-[2px] border ${
                    isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#12241d] border-[#264d3f] text-[#a2c7b5]'
                  }`}>
                    Stock Inicial + Nacimientos + Compras - Muertes - Consumos - Ventas = Stock Final
                  </div>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${
                  isLightMode ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#183027] border-[#264d3f]'
                }`}>
                  <strong className={`block text-xs ${isLightMode ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    Revelación de Supuestos Técnicos
                  </strong>
                  <p className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    Identificación de las plazas de mercado de referencia utilizadas, estimación de gastos directos de comercialización y métodos de amortización aplicados a reproductores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAPÍTULO 5: CUADRO SINÓPTICO Y CASOS PRÁCTICOS DE ESTUDIO                 */}
      {/* ========================================================================= */}
      {capituloActivo === 'cuadro_sinoptico' && (
        <div className="space-y-6">
          {/* Selector de filtros didácticos por especie */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className={`text-sm font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Cuadro Sinóptico Integrado de Valuación Ganadera (RT 54 FACPCE)
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                Criterios contables aplicados a las especies productivas: Ovinos, Bovinos y Porcinos.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs">
              {(['TODAS', 'OVINOS', 'BOVINOS', 'PORCINOS'] as const).map(esp => (
                <button
                  key={esp}
                  onClick={() => setFiltroEspecie(esp)}
                  className={`px-2.5 py-1 rounded-[2px] font-bold border transition-colors cursor-pointer text-[11px] ${
                    filtroEspecie === esp
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : isLightMode
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-emerald-50'
                      : 'bg-[#183027] border-[#264d3f] text-[#a2c7b5] hover:text-white'
                  }`}
                >
                  {esp}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla Comparativa de Medición */}
          <div className={`border rounded-[2px] shadow-xs overflow-hidden ${
            isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-white'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isLightMode ? 'bg-[#f0fdf4] text-emerald-900 border-emerald-200' : 'bg-[#183027] text-[#a2c7b5] border-[#264d3f]'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Especie / Categoría</th>
                    <th className="py-2.5 px-3">Rubro en el Balance</th>
                    <th className="py-2.5 px-3">Criterio Primario RT 54</th>
                    <th className="py-2.5 px-3">Criterio Secundario / Alternativa</th>
                    <th className="py-2.5 px-3">Reconocimiento del Resultado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-[#1a382d]'}`}>
                  {(filtroEspecie === 'TODAS' || filtroEspecie === 'OVINOS') && (
                    <>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">🐑 Ovinos • Corderos de Engorde</td>
                        <td className="py-2.5 px-3">Activo Corriente (Bienes de Cambio)</td>
                        <td className="py-2.5 px-3 font-semibold">Valor Neto de Realización (VNR)</td>
                        <td className="py-2.5 px-3 text-slate-500">Costo de reposición de insumos</td>
                        <td className="py-2.5 px-3">Resultado de la Producción Agropecuaria</td>
                      </tr>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">🐑 Ovinos • Ovejas Madres & Carneros</td>
                        <td className="py-2.5 px-3">Activo No Corriente (Bienes de Uso)</td>
                        <td className="py-2.5 px-3 font-semibold">Costo Histórico Amortizado (5-6 años)</td>
                        <td className="py-2.5 px-3 text-slate-500">Modelo del Valor Razonable (VNR)</td>
                        <td className="py-2.5 px-3">Amortización anual al costo de producción</td>
                      </tr>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">🐑 Ovinos • Lana Vellón en Galpón</td>
                        <td className="py-2.5 px-3">Activo Corriente (Productos Agropecuarios)</td>
                        <td className="py-2.5 px-3 font-semibold">VNR al momento de esquila</td>
                        <td className="py-2.5 px-3 text-slate-500">Costo atribuido de inventario</td>
                        <td className="py-2.5 px-3">Resultado por Tenencia al cierre</td>
                      </tr>
                    </>
                  )}

                  {(filtroEspecie === 'TODAS' || filtroEspecie === 'BOVINOS') && (
                    <>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">🐂 Bovinos • Terneros / Novillitos</td>
                        <td className="py-2.5 px-3">Activo Corriente (Bienes de Cambio)</td>
                        <td className="py-2.5 px-3 font-semibold">VNR en Mercado de Cañuelas / Plaza</td>
                        <td className="py-2.5 px-3 text-slate-500">Costo de reposición acumulado</td>
                        <td className="py-2.5 px-3">Resultado de la Producción Agropecuaria</td>
                      </tr>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">🐂 Bovinos • Vacas de Cría & Toros</td>
                        <td className="py-2.5 px-3">Activo No Corriente (Bienes de Uso)</td>
                        <td className="py-2.5 px-3 font-semibold">Costo Histórico Amortizado (6-8 años)</td>
                        <td className="py-2.5 px-3 text-slate-500">Modelo del Valor Razonable</td>
                        <td className="py-2.5 px-3">Amortización anual deducido rezago</td>
                      </tr>
                    </>
                  )}

                  {(filtroEspecie === 'TODAS' || filtroEspecie === 'PORCINOS') && (
                    <>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-rose-700 dark:text-rose-400">🐖 Porcinos • Capones para Faena</td>
                        <td className="py-2.5 px-3">Activo Corriente (Bienes de Cambio)</td>
                        <td className="py-2.5 px-3 font-semibold">VNR según cotización porcina MAGyP</td>
                        <td className="py-2.5 px-3 text-slate-500">Costo estándar de conversión alimenticia</td>
                        <td className="py-2.5 px-3">Resultado de la Producción Agropecuaria</td>
                      </tr>
                      <tr className={isLightMode ? 'hover:bg-emerald-50/50' : 'hover:bg-[#183027]/70'}>
                        <td className="py-2.5 px-3 font-bold text-rose-700 dark:text-rose-400">🐖 Porcinos • Cerdas Madres & Padrillos</td>
                        <td className="py-2.5 px-3">Activo No Corriente (Bienes de Uso)</td>
                        <td className="py-2.5 px-3 font-semibold">Costo Amortizado (3-4 años / pariciones)</td>
                        <td className="py-2.5 px-3 text-slate-500">VNR al cierre</td>
                        <td className="py-2.5 px-3">Cuota de amortización por camada producida</td>
                      </tr>
                    </>
                  )}

                  <tr className={isLightMode ? 'hover:bg-amber-50/50' : 'hover:bg-[#183027]/70'}>
                    <td className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-400">⚠️ Partida en Suspenso Zootécnico</td>
                    <td className="py-2.5 px-3">Activo Corriente con Nota Explicativa</td>
                    <td className="py-2.5 px-3 font-semibold">Valuación preventiva al costo incurrido</td>
                    <td className="py-2.5 px-3 text-slate-500">Reclasificación zootécnica obligatoria</td>
                    <td className="py-2.5 px-3">Prohibido anticipar ganancias hasta tipificación</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Fichas Didácticas de Casos Prácticos de Estudio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={`p-4 rounded-[2px] border space-y-2.5 shadow-xs ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs pb-2 border-b border-slate-200 dark:border-[#264d3f]">
                <BookOpen className="w-4 h-4" />
                <h4 className={`text-xs font-black uppercase ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Caso de Estudio 1: Nacimiento y Crecimiento de Corderos Dorper
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                <strong>Situación:</strong> Una majada ovina registra el nacimiento de 50 corderos. Al destete, alcanzan un promedio de 22 kg vivos. El precio de plaza es de $3.200/kg y los fletes más comisiones representan el 7%.
              </p>
              <div className={`p-2.5 rounded-[2px] text-[11px] space-y-1 border ${
                isLightMode ? 'bg-[#f0fdf4] border-emerald-200 text-slate-800' : 'bg-[#183027] border-[#264d3f] text-[#d1e7dc]'
              }`}>
                <p>• <strong>Tratamiento RT 54:</strong> Se reconoce en el momento del destete como un incremento de Bienes de Cambio Biológicos a su VNR ($65.472 por cordero).</p>
                <p>• <strong>Impacto Contable:</strong> Se acredita en el Estado de Resultados la cuenta <em>"Resultado de la Producción Agropecuaria - Ovinos"</em> por el total generado, compensando los costos forrajeros devengados.</p>
              </div>
            </div>

            <div className={`p-4 rounded-[2px] border space-y-2.5 shadow-xs ${
              isLightMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs pb-2 border-b border-slate-200 dark:border-[#264d3f]">
                <BookOpen className="w-4 h-4" />
                <h4 className={`text-xs font-black uppercase ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Caso de Estudio 2: Incorporación y Amortización de Carnero Reproductor
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-[#d1e7dc]'}`}>
                <strong>Situación:</strong> Se adquiere un carnero reproductor pedigree por $400.000 para servicio de la majada. Se estima una vida útil técnica de 5 campañas y un valor de recupero final a faena del 20% ($80.000).
              </p>
              <div className={`p-2.5 rounded-[2px] text-[11px] space-y-1 border ${
                isLightMode ? 'bg-[#f0fdf4] border-emerald-200 text-slate-800' : 'bg-[#183027] border-[#264d3f] text-[#d1e7dc]'
              }`}>
                <p>• <strong>Tratamiento RT 54:</strong> Se clasifica en el Activo No Corriente como <em>"Bienes de Uso Biológicos - Reproductores"</em>.</p>
                <p>• <strong>Cálculo de Amortización:</strong> Valor a depreciar = ($400.000 - $80.000) / 5 años = $64.000 anuales imputados al costo de producción de crías del ejercicio.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

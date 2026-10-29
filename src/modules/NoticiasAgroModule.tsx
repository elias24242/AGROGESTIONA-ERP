import React, { useState, useMemo } from 'react';
import { Usuario } from '../types/erp';
import {
  Newspaper,
  TrendingUp,
  Globe,
  Flag,
  DollarSign,
  Wheat,
  Scale,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';

interface NoticiasAgroModuleProps {
  currentUser?: Usuario | null;
  onOpenManual?: (term?: string) => void;
  isLightMode?: boolean;
}

interface NoticiaAgro {
  id: string;
  ambito: 'NACIONAL' | 'INTERNACIONAL';
  categoria: 'MERCADO_GANADERO' | 'GRANOS_INSUMOS' | 'MACROECONOMIA' | 'POLITICA_AGRO' | 'CLIMA_SANIDAD';
  titulo: string;
  bajada: string;
  fuente: string;
  fecha: string;
  impactoEnte: string;
  nivelRelevancia: 'ALTA' | 'MEDIA' | 'ESTRATEGICA';
  urlReferencia?: string;
}

export const NoticiasAgroModule: React.FC<NoticiasAgroModuleProps> = ({
  currentUser,
  onOpenManual,
  isLightMode = false,
}) => {
  const [ambitoFiltro, setAmbitoFiltro] = useState<'TODOS' | 'NACIONAL' | 'INTERNACIONAL'>('TODOS');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');

  // Ticker de cotizaciones clave del agro argentino
  const cotizacionesAgro = [
    { indicador: 'Novillo MAG Cañuelas', valor: '$4.496,34 / kg', cambio: '+1.8%', positivo: true },
    { indicador: 'Vaquillona Especial', valor: '$4.662,75 / kg', cambio: '+0.9%', positivo: true },
    { indicador: 'Capón Magro ROSPORC', valor: '$1.840,00 / kg', cambio: '+2.1%', positivo: true },
    { indicador: 'Maíz Rosario Disponible', valor: '$198.500 / tn', cambio: '-0.5%', positivo: false },
    { indicador: 'Soja Fábrica Rosario', valor: '$325.000 / tn', cambio: '+1.2%', positivo: true },
    { indicador: 'Dólar Exportador (80/20)', valor: '$1.120,50', cambio: '+0.3%', positivo: true },
  ];

  // Noticias del Sector Agropecuario
  const noticias: NoticiaAgro[] = useMemo(() => [
    {
      id: 'NOT-01',
      ambito: 'NACIONAL',
      categoria: 'MERCADO_GANADERO',
      titulo: 'Mercado Agroganadero de Cañuelas: Sostenida demanda por novillos pesados y vaquillonas especiales',
      bajada: 'Los lotes terminados a corral de más de 430 kg alcanzaron valores destacados con un promedio de $4.496,34/kg ante la reducida oferta de animales gordos de calidad.',
      fuente: 'Mercado Agroganadero (MAG) / Consignatarias',
      fecha: 'Hoy • 08:30 hs',
      impactoEnte: 'Impacto directo en la valuación al VNR de los 15 novillos en engorde de Pozo del Carril y define el momento óptimo de comercialización.',
      nivelRelevancia: 'ALTA',
    },
    {
      id: 'NOT-02',
      ambito: 'NACIONAL',
      categoria: 'GRANOS_INSUMOS',
      titulo: 'Bolsa de Cereales de Rosario proyecta estabilidad en el precio del maíz con cosecha récord en Córdoba',
      bajada: 'La abundante oferta regional de maíz grano en el centro-sur de Córdoba asegura disponibilidad de grano forrajero con fletes cortos para establecimientos ganaderos.',
      fuente: 'Bolsa de Comercio de Rosario (BCR)',
      fecha: 'Ayer • 16:45 hs',
      impactoEnte: 'Favorable: La alimentación representa el 78% del costo porcino (70% maíz en engorde) y el 70% del costo bovino. Abarata la reposición en silo.',
      nivelRelevancia: 'ALTA',
    },
    {
      id: 'NOT-03',
      ambito: 'NACIONAL',
      categoria: 'MERCADO_GANADERO',
      titulo: 'ROSPORC: Crece el consumo per cápita de carne porcina en Argentina superando los 17,5 kg anuales',
      bajada: 'La brecha favorable de precios al consumidor frente a la carne vacuna impulsa las ventas directas de capones terminados hacia los frigoríficos de la región centro.',
      fuente: 'Mercado Digital de Cerdos ROSPORC',
      fecha: '24/10/2026',
      impactoEnte: 'Refuerza la decisión de terminación comercial de capones (50–105 kg) en 79 días y la venta directa a faena sin comisiones de intermediación.',
      nivelRelevancia: 'ESTRATEGICA',
    },
    {
      id: 'NOT-04',
      ambito: 'INTERNACIONAL',
      categoria: 'MACROECONOMIA',
      titulo: 'USDA proyecta suba del 3% en las exportaciones de carne vacuna del Mercosur impulsadas por China y EE.UU.',
      bajada: 'La liquidación del rodeo en Estados Unidos y la recuperación de la demanda asiática abren nuevas cuotas de carne magra de alta calidad.',
      fuente: 'Departamento de Agricultura de EE.UU. (USDA)',
      fecha: '23/10/2026',
      impactoEnte: 'Mejora las expectativas de precios en pie para categorías de novillitos y vaquillonas de reposición con destino a cuotas de exportación.',
      nivelRelevancia: 'MEDIA',
    },
    {
      id: 'NOT-05',
      ambito: 'NACIONAL',
      categoria: 'POLITICA_AGRO',
      titulo: 'SENASA actualiza el calendario unificado de vacunación antiaftosa y brucelosis para zona centro',
      bajada: 'Se establecen los plazos perentorios para la carga digital del DTe y la constancia de vacunación por parte de veterinarios acreditados de las universidades nacionales.',
      fuente: 'Boletín Oficial de la República Argentina / SENASA',
      fecha: '22/10/2026',
      impactoEnte: 'Requiere coordinar las fechas de manga con el equipo veterinario de la UNRC y mantener actualizados los aranceles de $2.000 por dosis.',
      nivelRelevancia: 'ALTA',
    },
    {
      id: 'NOT-06',
      ambito: 'INTERNACIONAL',
      categoria: 'CLIMA_SANIDAD',
      titulo: 'El Instituto Internacional del Clima prevé lluvias regulares en el sur de Córdoba con transición a fase neutra',
      bajada: 'Las precipitaciones de primavera aseguran una adecuada recarga de los perfiles en lotes de pasturas de alfalfa y silajes de maíz en bolsón.',
      fuente: 'IRI Columbia / Servicio Meteorológico Nacional',
      fecha: '21/10/2026',
      impactoEnte: 'Garantiza las reservas forrajeras (rollos de pastura y silaje) reduciendo la necesidad de comprar suplementos de fibra en invierno.',
      nivelRelevancia: 'MEDIA',
    },
  ], []);

  const noticiasFiltradas = useMemo(() => {
    return noticias.filter(n => {
      const matchAmbito = ambitoFiltro === 'TODOS' || n.ambito === ambitoFiltro;
      const matchCat = categoriaFiltro === 'TODAS' || n.categoria === categoriaFiltro;
      return matchAmbito && matchCat;
    });
  }, [noticias, ambitoFiltro, categoriaFiltro]);

  return (
    <div className="space-y-5 m3-view-enter">
      {/* Cabecera del Módulo */}
      <div className={`p-4 sm:p-5 border rounded-[2px] transition-colors ${
        isLightMode
          ? 'bg-white border-slate-300 shadow-xs'
          : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[2px] bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Noticias del Sector Agropecuario & Mercados
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Actualidad Nacional e Internacional
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                Información económica, cotizaciones del MAG Cañuelas y ROSPORC, políticas agropecuarias y su impacto directo en Pozo del Carril.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <BotonAyudaContextual moduloId="economia" onOpenManual={onOpenManual} />
          </div>
        </div>

        {/* Ticker de Cotizaciones Clave en Vivo */}
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0">
              MERCADOS HOY:
            </span>
            {cotizacionesAgro.map((c, i) => (
              <div
                key={i}
                className={`px-2.5 py-1 rounded-[2px] border flex items-center space-x-2 text-xs shrink-0 ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-[#181818] border-[#262626] text-neutral-200'
                }`}
              >
                <span className="font-semibold text-[11px]">{c.indicador}:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.valor}</span>
                <span className={`text-[10px] font-bold flex items-center ${
                  c.positivo ? 'text-emerald-600' : 'text-rose-500'
                }`}>
                  {c.positivo ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {c.cambio}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTROS POR ÁMBITO Y CATEGORÍA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Ámbito: Nacional vs Internacional */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setAmbitoFiltro('TODOS')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer ${
              ambitoFiltro === 'TODOS'
                ? 'bg-emerald-700 text-white shadow-xs'
                : isLightMode
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#181818] border border-[#2a2a2a] text-neutral-300 hover:bg-[#222222]'
            }`}
          >
            Todas ({noticias.length})
          </button>
          <button
            onClick={() => setAmbitoFiltro('NACIONAL')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
              ambitoFiltro === 'NACIONAL'
                ? 'bg-blue-700 text-white shadow-xs'
                : isLightMode
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#181818] border border-[#2a2a2a] text-neutral-300 hover:bg-[#222222]'
            }`}
          >
            <Flag className="w-3 h-3 text-sky-400" />
            <span>Nacionales (Argentina)</span>
          </button>
          <button
            onClick={() => setAmbitoFiltro('INTERNACIONAL')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
              ambitoFiltro === 'INTERNACIONAL'
                ? 'bg-purple-700 text-white shadow-xs'
                : isLightMode
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#181818] border border-[#2a2a2a] text-neutral-300 hover:bg-[#222222]'
            }`}
          >
            <Globe className="w-3 h-3 text-purple-400" />
            <span>Internacionales & Mercados</span>
          </button>
        </div>

        {/* Categorías Temáticas */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'TODAS', label: 'Todos los Rubros' },
            { id: 'MERCADO_GANADERO', label: '🐂 Hacienda & VNR' },
            { id: 'GRANOS_INSUMOS', label: '🌾 Maíz & Raciones' },
            { id: 'MACROECONOMIA', label: '💵 Macroeconomía' },
            { id: 'POLITICA_AGRO', label: '📑 SENASA & Normativa' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategoriaFiltro(c.id)}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                categoriaFiltro === c.id
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-black font-black'
                  : isLightMode
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#1c1c1c] text-neutral-400 hover:bg-[#242424]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* FEED DE NOTICIAS CON IMPACTO DIRECTO EN POZO DEL CARRIL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {noticiasFiltradas.map(n => (
          <article
            key={n.id}
            className={`p-4 border rounded-[2px] flex flex-col justify-between space-y-3 transition-colors ${
              isLightMode
                ? 'bg-white border-slate-300 shadow-xs hover:border-slate-400'
                : 'bg-[#141414] border-[#242424] hover:border-[#303030]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className={`font-black uppercase tracking-wider px-1.5 py-0.2 rounded-[2px] ${
                    n.ambito === 'NACIONAL'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                      : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  }`}>
                    {n.ambito}
                  </span>
                  <span className="text-slate-400 font-semibold">{n.fuente}</span>
                </div>
                <span className="text-slate-400">{n.fecha}</span>
              </div>

              <h3 className={`text-sm font-bold tracking-tight leading-snug ${
                isLightMode ? 'text-slate-900' : 'text-neutral-100'
              }`}>
                {n.titulo}
              </h3>

              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-neutral-400'}`}>
                {n.bajada}
              </p>
            </div>

            {/* SECCIÓN CRÍTICA: IMPACTO DIRECTO EN POZO DEL CARRIL */}
            <div className={`p-2.5 rounded-[2px] border text-xs space-y-1 ${
              isLightMode
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-[#131b15] border-emerald-900/50 text-emerald-200'
            }`}>
              <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Impacto en la Gestión de Pozo del Carril:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {n.impactoEnte}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import {
  Calendar,
  Clock,
  HeartHandshake,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface WidgetProximosServiciosProps {
  isLightMode?: boolean;
  onNavigateTab: (tab: any) => void;
}

interface EventoReproductivo {
  id: string;
  titulo: string;
  subtitulo: string;
  fecha: string;
  diasRestantes: string;
  estado: 'PROXIMO' | 'PROGRAMADO' | 'PLANIFICADO';
  categoriaAfectada: string;
  lote: string;
  responsable: string;
}

export const WidgetProximosServicios: React.FC<WidgetProximosServiciosProps> = ({
  isLightMode = false,
  onNavigateTab,
}) => {
  const eventos: EventoReproductivo[] = [
    {
      id: 'EVT-ANDRO-01',
      titulo: 'Revisación Andrológica y Clínica de Carneros',
      subtitulo: 'Aptitud seminal, circunferencia escrotal y condición corporal de 2 carneros reproductores.',
      fecha: '25/10/2026',
      diasRestantes: 'En 15 días',
      estado: 'PROXIMO',
      categoriaAfectada: '2 Carneros (CAR001, CAR002)',
      lote: 'Lote LOT001',
      responsable: 'Cátedra Reproducción UNRC',
    },
    {
      id: 'EVT-FLUSH-01',
      titulo: 'Flushing Nutricional Pre-Servicio',
      subtitulo: 'Suplementación estratégica a las 64 madres para elevar ovulación y tasa de melliceras.',
      fecha: '01/11/2026',
      diasRestantes: 'En 22 días',
      estado: 'PROGRAMADO',
      categoriaAfectada: '64 Madres Ovinas',
      lote: 'Potrero LOT001',
      responsable: 'Manejo Alimenticio',
    },
    {
      id: 'EVT-SERV-01',
      titulo: 'Inicio de Servicio y Encaste a Campo',
      subtitulo: 'Ingreso de carneros con las ovejas. Duración de 42 días (2.5 ciclos estrales de 17 días).',
      fecha: '15/11/2026',
      diasRestantes: 'En 36 días',
      estado: 'PROGRAMADO',
      categoriaAfectada: 'Majada Completa (3.1% carneros)',
      lote: 'Potrero LOT001',
      responsable: 'Responsable Unidad Ovinos',
    },
    {
      id: 'EVT-ECO-01',
      titulo: 'Diagnóstico de Gestación (Ecografía)',
      subtitulo: 'Ultrasonografía a los 45-60 días post-servicio para evaluar preñez y fecundidad.',
      fecha: '15/01/2027',
      diasRestantes: 'Campaña 2027',
      estado: 'PLANIFICADO',
      categoriaAfectada: 'Vientres Servidos',
      lote: 'Manga de Manejo',
      responsable: 'Veterinario UNRC',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Resumen del Ciclo de Servicio Actual */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLightMode
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm">Servicio de Primavera/Verano</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30 uppercase">
                En Preparación
              </span>
            </div>
            <p className="text-xs opacity-85 mt-0.5">
              Proporción planificada: 2 carneros para 64 madres (3.1%) • Meta de parición: ≥ 92%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('majada')}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs flex items-center space-x-1"
        >
          <span>Registrar en Majada</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lista de Hitos Reproductivos */}
      <div className="space-y-2.5">
        {eventos.map(evt => {
          const badgeColor =
            evt.estado === 'PROXIMO'
              ? isLightMode
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : evt.estado === 'PROGRAMADO'
              ? isLightMode
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : isLightMode
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : 'bg-slate-800 text-slate-300 border-slate-700';

          return (
            <div
              key={evt.id}
              className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className={`font-bold text-xs ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                    {evt.titulo}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase ${badgeColor}`}>
                    {evt.diasRestantes}
                  </span>
                </div>
                <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {evt.subtitulo}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                  <span>📍 {evt.lote}</span>
                  <span>•</span>
                  <span>👥 {evt.categoriaAfectada}</span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline">👨‍⚕️ {evt.responsable}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                <div className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold ${
                  isLightMode ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-slate-200'
                }`}>
                  {evt.fecha}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

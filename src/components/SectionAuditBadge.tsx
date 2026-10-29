import React, { useState } from 'react';
import { Auditoria } from '../types/erp';
import { Clock, ShieldCheck, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatFechaArg, formatHoraArg } from '../utils/dateUtils';

interface SectionAuditBadgeProps {
  auditoriaList: Auditoria[];
  tablasAfectadas?: string[];
  seccionNombre: string;
}

export const SectionAuditBadge: React.FC<SectionAuditBadgeProps> = ({
  auditoriaList,
  tablasAfectadas,
  seccionNombre,
}) => {
  const [descartado, setDescartado] = useState(false);
  const [expandido, setExpandido] = useState(false);

  if (descartado) return null;

  // Encontrar el registro más reciente correspondiente a esta sección
  const ultimoMovimiento = auditoriaList.find(a => {
    if (!tablasAfectadas || tablasAfectadas.length === 0) return true;
    return tablasAfectadas.includes(a.tabla_afectada);
  });

  if (!ultimoMovimiento) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 rounded-[2px] bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-400 text-[11px]">
        <div className="flex items-center space-x-1.5 truncate">
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">
            Auditoría en <strong className="text-slate-900 dark:text-slate-300 font-bold">{seccionNombre}</strong>: Sin cambios recientes.
          </span>
        </div>
        <button
          onClick={() => setDescartado(true)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer transition-colors"
          title="Ocultar aviso de auditoría"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const rawFechaHora = ultimoMovimiento.fecha_hora || '';
  const diaArg = formatFechaArg(rawFechaHora);
  const horarioArg = formatHoraArg(rawFechaHora);

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-[2px] bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800/70 text-[11px] text-slate-700 dark:text-slate-400 transition-all">
      <div className="flex items-center space-x-2 truncate">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-500/80 shrink-0" />
        <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">Último cambio:</span>
        <span className="font-mono text-slate-900 dark:text-slate-200 font-bold shrink-0">
          @{ultimoMovimiento.username}
        </span>
        <span className="text-slate-400 dark:text-slate-600 shrink-0">·</span>
        <span className="font-mono text-slate-700 dark:text-slate-400 tabular-nums shrink-0">
          {diaArg} {horarioArg} hs
        </span>
        <span className="text-slate-400 dark:text-slate-600 hidden sm:inline shrink-0">·</span>
        <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono text-[10px] hidden sm:inline shrink-0 font-bold">
          {ultimoMovimiento.operacion}
        </span>
        {ultimoMovimiento.motivo && !expandido && (
          <>
            <span className="text-slate-400 dark:text-slate-600 hidden md:inline shrink-0">·</span>
            <span
              className="text-slate-600 dark:text-slate-400 truncate max-w-sm italic hidden md:inline"
              title={ultimoMovimiento.motivo}
            >
              "{ultimoMovimiento.motivo}"
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2 shrink-0 ml-2">
        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono hidden lg:inline font-semibold">
          {ultimoMovimiento.tabla_afectada}
        </span>
        {ultimoMovimiento.motivo && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            title={expandido ? 'Contraer detalle' : 'Ver motivo completo'}
          >
            {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        <button
          onClick={() => setDescartado(true)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer transition-colors"
          title="Ocultar aviso de auditoría"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {expandido && ultimoMovimiento.motivo && (
        <div className="w-full mt-1.5 pt-1.5 border-t border-slate-300 dark:border-slate-800/80 text-[11px] text-slate-800 dark:text-slate-300 italic">
          Motivo asentado: "{ultimoMovimiento.motivo}"
        </div>
      )}
    </div>
  );
};

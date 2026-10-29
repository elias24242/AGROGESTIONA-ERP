import React, { useState, useMemo } from 'react';
import { DatabaseState } from '../services/sheetsService';
import {
  ShieldCheck,
  Search,
  Filter,
  History,
  Eye,
  ArrowRight,
  Clock,
  User,
  Monitor,
  FileSpreadsheet,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { formatFechaHoraArg } from '../utils/dateUtils';
import {
  obtenerTodosLosEventosDeCampo,
  EventoCambioCampo,
  TABLAS_ETIQUETAS,
  exportarEventosACSV,
} from '../utils/auditUtils';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';

interface AuditoriaModuleProps {
  state: DatabaseState;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
}

export const AuditoriaModule: React.FC<AuditoriaModuleProps> = ({ state, onOpenManual }) => {
  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'eventos' | 'auditoria' | 'sesiones'>('eventos');

  // Filtros de Log de Eventos Detallado (Cambios de Campo)
  const [filtroUsuarioEvento, setFiltroUsuarioEvento] = useState('TODOS');
  const [filtroTablaEvento, setFiltroTablaEvento] = useState('TODAS');
  const [filtroCampoEvento, setFiltroCampoEvento] = useState('TODOS');
  const [filtroOperacionEvento, setFiltroOperacionEvento] = useState('TODAS');
  const [busquedaEvento, setBusquedaEvento] = useState('');

  // Paginación de Eventos
  const [paginaActualEventos, setPaginaActualEventos] = useState(1);
  const [elementosPorPaginaEventos, setElementosPorPaginaEventos] = useState(20);

  // Filtros de Auditoría general (Libro Mayor)
  const [filtroTabla, setFiltroTabla] = useState('TODAS');
  const [filtroOperacion, setFiltroOperacion] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Filtros de Sesiones
  const [filtroUsuarioSesion, setFiltroUsuarioSesion] = useState('TODOS');
  const [busquedaSesion, setBusquedaSesion] = useState('');

  // Generar eventos detallados de cambio de campo
  const todosLosEventos = useMemo(() => {
    return obtenerTodosLosEventosDeCampo(state.auditoria, state.usuarios);
  }, [state.auditoria, state.usuarios]);

  // Listas para selects de filtros
  const usuariosEventos = useMemo(() => {
    return Array.from(new Set(todosLosEventos.map(e => e.username))).sort();
  }, [todosLosEventos]);

  const tablasEventos = useMemo(() => {
    return Array.from(new Set(todosLosEventos.map(e => e.tabla_afectada))).sort();
  }, [todosLosEventos]);

  const camposEventos = useMemo(() => {
    const map = new Map<string, string>();
    todosLosEventos.forEach(e => {
      if (!map.has(e.campo)) {
        map.set(e.campo, e.etiqueta_campo);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [todosLosEventos]);

  // Filtrado de eventos de campo
  const eventosFiltrados = useMemo(() => {
    return todosLosEventos.filter(ev => {
      if (filtroUsuarioEvento !== 'TODOS' && ev.username !== filtroUsuarioEvento) return false;
      if (filtroTablaEvento !== 'TODAS' && ev.tabla_afectada !== filtroTablaEvento) return false;
      if (filtroCampoEvento !== 'TODOS' && ev.campo !== filtroCampoEvento) return false;
      if (filtroOperacionEvento !== 'TODAS' && ev.operacion !== filtroOperacionEvento) return false;

      if (busquedaEvento.trim() !== '') {
        const q = busquedaEvento.toLowerCase();
        const matchUser = ev.username.toLowerCase().includes(q);
        const matchName = ev.nombre_usuario.toLowerCase().includes(q);
        const matchCampo = ev.campo.toLowerCase().includes(q) || ev.etiqueta_campo.toLowerCase().includes(q);
        const matchValAnt = ev.valor_anterior_formateado.toLowerCase().includes(q);
        const matchValPost = ev.valor_nuevo_formateado.toLowerCase().includes(q);
        const matchMotivo = ev.motivo.toLowerCase().includes(q);
        const matchReg = ev.id_registro.toLowerCase().includes(q);

        if (!matchUser && !matchName && !matchCampo && !matchValAnt && !matchValPost && !matchMotivo && !matchReg) {
          return false;
        }
      }
      return true;
    });
  }, [todosLosEventos, filtroUsuarioEvento, filtroTablaEvento, filtroCampoEvento, filtroOperacionEvento, busquedaEvento]);

  // Paginación calculada
  const totalPaginasEventos = Math.max(1, Math.ceil(eventosFiltrados.length / elementosPorPaginaEventos));
  const eventosPaginados = useMemo(() => {
    const inicio = (paginaActualEventos - 1) * elementosPorPaginaEventos;
    return eventosFiltrados.slice(inicio, inicio + elementosPorPaginaEventos);
  }, [eventosFiltrados, paginaActualEventos, elementosPorPaginaEventos]);

  // Reset de filtros de eventos
  const hayFiltrosActivosEventos =
    filtroUsuarioEvento !== 'TODOS' ||
    filtroTablaEvento !== 'TODAS' ||
    filtroCampoEvento !== 'TODOS' ||
    filtroOperacionEvento !== 'TODAS' ||
    busquedaEvento.trim() !== '';

  const handleResetFiltrosEventos = () => {
    setFiltroUsuarioEvento('TODOS');
    setFiltroTablaEvento('TODAS');
    setFiltroCampoEvento('TODOS');
    setFiltroOperacionEvento('TODAS');
    setBusquedaEvento('');
    setPaginaActualEventos(1);
  };

  // Filtrado de Auditoría General (Libro Mayor)
  const auditoriasFiltradas = state.auditoria.filter(a => {
    if (filtroTabla !== 'TODAS' && a.tabla_afectada !== filtroTabla) return false;
    if (filtroOperacion !== 'TODAS' && a.operacion !== filtroOperacion) return false;
    if (busqueda.trim() !== '') {
      const q = busqueda.toLowerCase();
      const matchUsername = a.username.toLowerCase().includes(q);
      const matchMotivo = a.motivo.toLowerCase().includes(q);
      const matchRegistro = a.id_registro.toLowerCase().includes(q);
      if (!matchUsername && !matchMotivo && !matchRegistro) return false;
    }
    return true;
  });

  const selectedAudit = state.auditoria.find(a => a.id_auditoria === selectedAuditId);
  const tablasUnicas = Array.from(new Set(state.auditoria.map(a => a.tabla_afectada)));

  // Filtrado de Sesiones
  const sesiones = state.sesiones || [];
  const sesionesFiltradas = sesiones.filter(s => {
    if (filtroUsuarioSesion !== 'TODOS' && s.username !== filtroUsuarioSesion) return false;
    if (busquedaSesion.trim() !== '') {
      const q = busquedaSesion.toLowerCase();
      const matchUser = s.username.toLowerCase().includes(q);
      const matchName = s.nombre_completo.toLowerCase().includes(q);
      const matchRole = s.rol_nombre.toLowerCase().includes(q);
      if (!matchUser && !matchName && !matchRole) return false;
    }
    return true;
  });

  const sesionesActivasCount = sesiones.filter(s => s.estado === 'ACTIVA').length;
  const usuariosUnicosSesiones = Array.from(new Set(sesiones.map(s => s.username)));

  // Métricas del Log Detallado
  const totalModificaciones = todosLosEventos.filter(e => e.operacion === 'MODIFICACION').length;
  const usuariosModificadores = Array.from(new Set(todosLosEventos.map(e => e.username))).length;
  const ultimoEvento = todosLosEventos[0];

  return (
    <div className="space-y-4">
      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#f2fcf6]">Registro de Auditoría & Trazabilidad</h2>
          <BotonAyudaContextual moduloId="auditoria" onOpenManual={onOpenManual} />
        </div>
      </div>

      {/* Barra de navegación de subpestañas - Limpia y estilizada */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#264d3f] pb-2">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-[#183027] rounded-[2px] border border-slate-200 dark:border-[#264d3f]">
          <button
            onClick={() => setActiveTab('eventos')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'eventos'
                ? 'bg-white dark:bg-[#1f3d32] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#a2c7b5] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Modificaciones por Campo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
              {todosLosEventos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'auditoria'
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Libro Mayor de Transacciones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
              {state.auditoria.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sesiones')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'sesiones'
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inicios de Sesión</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
              {sesiones.length}
            </span>
            {sesionesActivasCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span>Trazabilidad UNRC Activa</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: LOG DETALLADO DE MODIFICACIONES POR CAMPO (PROLIJO Y ORDENADO) */}
      {/* ========================================================================= */}
      {activeTab === 'eventos' && (
        <div className="space-y-4">
          {/* Tira Ejecutiva de Métricas: compacta, prolija, sin brillos invasivos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
            <div className="px-2">
              <span className="text-[11px] text-slate-400 block">Modificaciones de Campo</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-bold text-white tabular-nums">{totalModificaciones}</span>
                <span className="text-[10px] text-slate-400">con historial diff</span>
              </div>
            </div>

            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block">Usuarios con Cambios</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-bold text-cyan-300 tabular-nums">{usuariosModificadores}</span>
                <span className="text-[10px] text-slate-400">operadores</span>
              </div>
            </div>

            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block">Entidades Auditadas</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-bold text-amber-300 tabular-nums">{tablasEventos.length}</span>
                <span className="text-[10px] text-slate-400">tablas monitoreadas</span>
              </div>
            </div>

            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block">Último Registro</span>
              <div className="mt-0.5 truncate">
                <span className="text-xs font-semibold text-emerald-400">
                  {ultimoEvento ? `@${ultimoEvento.username}` : 'Sin datos'}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                  {ultimoEvento ? formatFechaHoraArg(ultimoEvento.fecha_hora) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Panel Principal: Contenedor ordenado con Toolbar integrado */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-xs overflow-hidden">
            {/* Cabecera & Barra de Herramientas Compacta */}
            <div className="p-3.5 border-b border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Historial de Modificaciones por Campo
                  </h3>
                  <span className="text-xs text-slate-400">
                    ({eventosFiltrados.length} registros)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {hayFiltrosActivosEventos && (
                    <button
                      onClick={handleResetFiltrosEventos}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Restablecer todos los filtros"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpiar filtros</span>
                    </button>
                  )}

                  <button
                    onClick={() => exportarEventosACSV(eventosFiltrados)}
                    className="px-2.5 py-1 text-xs text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/70 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Exportar registros filtrados a CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </div>

              {/* Filtros en una fila armónica y prolija */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                {/* 1. Búsqueda libre */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={busquedaEvento}
                    onChange={e => {
                      setBusquedaEvento(e.target.value);
                      setPaginaActualEventos(1);
                    }}
                    placeholder="Buscar usuario, campo, valor..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800/90 border border-slate-700/70 rounded-lg text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  {busquedaEvento && (
                    <button
                      onClick={() => setBusquedaEvento('')}
                      className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 2. Filtro Usuario */}
                <div>
                  <select
                    value={filtroUsuarioEvento}
                    onChange={e => {
                      setFiltroUsuarioEvento(e.target.value);
                      setPaginaActualEventos(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="TODOS">Todos los usuarios ({usuariosEventos.length})</option>
                    {usuariosEventos.map(u => (
                      <option key={u} value={u}>
                        @{u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Filtro Entidad */}
                <div>
                  <select
                    value={filtroTablaEvento}
                    onChange={e => {
                      setFiltroTablaEvento(e.target.value);
                      setPaginaActualEventos(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="TODAS">Todas las entidades ({tablasEventos.length})</option>
                    {tablasEventos.map(t => (
                      <option key={t} value={t}>
                        {TABLAS_ETIQUETAS[t] || t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Filtro Campo */}
                <div>
                  <select
                    value={filtroCampoEvento}
                    onChange={e => {
                      setFiltroCampoEvento(e.target.value);
                      setPaginaActualEventos(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="TODOS">Todos los campos ({camposEventos.length})</option>
                    {camposEventos.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Filtro Operación */}
                <div>
                  <select
                    value={filtroOperacionEvento}
                    onChange={e => {
                      setFiltroOperacionEvento(e.target.value);
                      setPaginaActualEventos(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="TODAS">Todas las operaciones</option>
                    <option value="MODIFICACION">Solo Modificaciones</option>
                    <option value="ALTA">Altas / Creaciones</option>
                    <option value="ANULACION">Anulaciones</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla Limpia, Ordenada y Profesional */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Entidad & ID</th>
                    <th className="py-2.5 px-3">Campo Modificado</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Trazabilidad (Anterior → Posterior)</th>
                    <th className="py-2.5 px-3 max-w-[220px]">Motivo / Justificación</th>
                    <th className="py-2.5 px-3 text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {eventosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <AlertCircle className="w-7 h-7 text-slate-500 mx-auto mb-1.5" />
                        <p className="font-medium text-slate-300">
                          No hay eventos que coincidan con los filtros aplicados.
                        </p>
                        {hayFiltrosActivosEventos && (
                          <button
                            onClick={handleResetFiltrosEventos}
                            className="mt-2 text-emerald-400 hover:text-emerald-300 text-xs underline cursor-pointer"
                          >
                            Restablecer criterios de búsqueda
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    eventosPaginados.map(ev => {
                      const esModif = ev.operacion === 'MODIFICACION';
                      const esAlta = ev.operacion === 'ALTA';
                      const esBaja = ev.operacion === 'ANULACION';

                      return (
                        <tr
                          key={ev.id_evento}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. Fecha / Hora */}
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                            {formatFechaHoraArg(ev.fecha_hora)}
                          </td>

                          {/* 2. Usuario Autor */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-200">@{ev.username}</span>
                              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                                {ev.rol_usuario || 'Operador'}
                              </span>
                            </div>
                          </td>

                          {/* 3. Entidad & ID */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="leading-tight">
                              <span className="text-slate-300 font-medium">
                                {TABLAS_ETIQUETAS[ev.tabla_afectada] || ev.tabla_afectada}
                              </span>
                              <span className="block font-mono text-[10px] text-slate-400">
                                {ev.id_registro}
                              </span>
                            </div>
                          </td>

                          {/* 4. Campo Modificado */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="leading-tight">
                              <span className="text-slate-200 font-medium block">
                                {ev.etiqueta_campo}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {ev.campo}
                              </span>
                            </div>
                          </td>

                          {/* 5. Trazabilidad: Valor Anterior -> Posterior (Limpio, elegante, sin bloques invasivos) */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-2 text-xs font-mono">
                              {/* Valor Anterior */}
                              {esAlta ? (
                                <span className="text-slate-500 italic text-[11px] shrink-0">
                                  (Nuevo)
                                </span>
                              ) : (
                                <span
                                  className="text-slate-400 line-through truncate max-w-[140px] font-normal"
                                  title={`Valor anterior: ${ev.valor_anterior_formateado}`}
                                >
                                  {ev.valor_anterior_formateado}
                                </span>
                              )}

                              {/* Flecha indicadora sutil */}
                              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />

                              {/* Valor Posterior */}
                              {esBaja ? (
                                <span className="text-rose-400/90 italic text-[11px] shrink-0">
                                  (Anulado)
                                </span>
                              ) : (
                                <span
                                  className="text-emerald-300 font-semibold truncate max-w-[160px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50"
                                  title={`Valor posterior: ${ev.valor_nuevo_formateado}`}
                                >
                                  {ev.valor_nuevo_formateado}
                                </span>
                              )}

                              {/* Delta de Variación si existe */}
                              {ev.delta && (
                                <span
                                  className="text-[10px] font-mono font-medium text-cyan-300 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800/40 shrink-0"
                                  title="Variación neta"
                                >
                                  {ev.delta}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Motivo */}
                          <td className="py-2 px-3">
                            <p
                              className="text-slate-400 text-xs italic truncate max-w-[200px]"
                              title={ev.motivo}
                            >
                              "{ev.motivo}"
                            </p>
                          </td>

                          {/* 7. Botón Inspeccionar */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedAuditId(ev.id_auditoria)}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              title="Inspeccionar transacción completa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación y Resumen Inferior Prolijo */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-800/30 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <span>
                  Mostrando{' '}
                  <strong className="text-slate-200">
                    {eventosFiltrados.length === 0
                      ? 0
                      : (paginaActualEventos - 1) * elementosPorPaginaEventos + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="text-slate-200">
                    {Math.min(paginaActualEventos * elementosPorPaginaEventos, eventosFiltrados.length)}
                  </strong>{' '}
                  de <strong className="text-slate-200">{eventosFiltrados.length}</strong> eventos
                </span>

                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span>Por página:</span>
                  <select
                    value={elementosPorPaginaEventos}
                    onChange={e => {
                      setElementosPorPaginaEventos(Number(e.target.value));
                      setPaginaActualEventos(1);
                    }}
                    className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                  >
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Botones de Paginación */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setPaginaActualEventos(p => Math.max(1, p - 1))}
                  disabled={paginaActualEventos <= 1}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <span className="px-2 py-0.5 text-xs text-slate-300 font-mono">
                  {paginaActualEventos} / {totalPaginasEventos}
                </span>

                <button
                  onClick={() => setPaginaActualEventos(p => Math.min(totalPaginasEventos, p + 1))}
                  disabled={paginaActualEventos >= totalPaginasEventos}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: LIBRO MAYOR DE AUDITORÍA Y TRANSACCIONES GENERALES             */}
      {/* ========================================================================= */}
      {activeTab === 'auditoria' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-xs overflow-hidden space-y-0">
          <div className="p-3.5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Libro Mayor de Transacciones Inmutables</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Registra la operación global con usuario autor, fecha/hora, entidad y justificación.
              </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filtroTabla}
                onChange={e => setFiltroTabla(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="TODAS">Todas las tablas ({state.auditoria.length})</option>
                {tablasUnicas.map(t => (
                  <option key={t} value={t}>
                    {TABLAS_ETIQUETAS[t] || t}
                  </option>
                ))}
              </select>

              <select
                value={filtroOperacion}
                onChange={e => setFiltroOperacion(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="TODAS">Todas las operaciones</option>
                <option value="ALTA">Altas (Inserciones)</option>
                <option value="MODIFICACION">Modificaciones</option>
                <option value="ANULACION">Anulaciones</option>
                <option value="SINCRONIZACION">Sincronizaciones</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar usuario o motivo..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="pl-7 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 w-48 text-xs focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3 text-center">Operación</th>
                  <th className="py-2.5 px-3">Tabla Afectada</th>
                  <th className="py-2.5 px-3">ID Registro</th>
                  <th className="py-2.5 px-3">Motivo / Explicación</th>
                  <th className="py-2.5 px-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {auditoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron registros de auditoría con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  auditoriasFiltradas.map(aud => (
                    <tr key={aud.id_auditoria} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {formatFechaHoraArg(aud.fecha_hora)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-200">@{aud.username}</span>
                        {aud.rol_usuario && (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                            {aud.rol_usuario}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            aud.operacion === 'ALTA'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : aud.operacion === 'ANULACION'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {aud.operacion}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-300">
                        {TABLAS_ETIQUETAS[aud.tabla_afectada] || aud.tabla_afectada}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{aud.id_registro}</td>
                      <td className="py-2 px-3 text-slate-300 max-w-sm truncate italic" title={aud.motivo}>
                        "{aud.motivo}"
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => setSelectedAuditId(aud.id_auditoria)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CONTROL DE INICIOS DE SESIÓN Y PERMANENCIA                     */}
      {/* ========================================================================= */}
      {activeTab === 'sesiones' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-xs overflow-hidden space-y-0">
          <div className="p-3.5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Registro de Inicios de Sesión y Permanencia</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de accesos con fecha/hora de ingreso, permanencia y estado de sesión.
              </p>
            </div>

            {/* Filtros de Sesiones */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filtroUsuarioSesion}
                onChange={e => setFiltroUsuarioSesion(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="TODOS">Todos los usuarios ({usuariosUnicosSesiones.length})</option>
                {usuariosUnicosSesiones.map(u => (
                  <option key={u} value={u}>
                    @{u}
                  </option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar usuario o rol..."
                  value={busquedaSesion}
                  onChange={e => setBusquedaSesion(e.target.value)}
                  className="pl-7 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 w-48 text-xs focus:outline-none focus:border-cyan-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </div>
            </div>
          </div>

          {/* Tabla de Sesiones */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Usuario & Nombre</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Inicio de Sesión</th>
                  <th className="py-2.5 px-3">Cierre de Sesión</th>
                  <th className="py-2.5 px-3">Tiempo Activo</th>
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sesionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se registran sesiones archivadas con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  sesionesFiltradas.map(ses => (
                    <tr key={ses.id_sesion} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-white">@{ses.username}</span>
                          <span className="text-[11px] text-slate-400">({ses.nombre_completo})</span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {ses.rol_nombre}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-mono text-emerald-400/90 text-[11px]">
                        {formatFechaHoraArg(ses.fecha_inicio)}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                        {ses.fecha_cierre ? (
                          formatFechaHoraArg(ses.fecha_cierre)
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>En curso...</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-mono text-cyan-300 text-[11px]">
                        {ses.duracion_formateada || 'Calculando...'}
                      </td>

                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        <span className="flex items-center space-x-1">
                          <Monitor className="w-3 h-3 text-slate-500" />
                          <span>{ses.dispositivo}</span>
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        {ses.estado === 'ACTIVA' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Activa</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 text-[10px]">
                            Cerrada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DETALLE COMPLETO DE AUDITORÍA (SOBRIO, ORDENADO Y ELEGANTE)     */}
      {/* ========================================================================= */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl p-5 shadow-2xl text-slate-100 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Detalle de Transacción
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  #{selectedAudit.id_auditoria}
                </span>
              </div>
              <button
                onClick={() => setSelectedAuditId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3.5 text-xs">
              {/* Metadatos del Operador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Usuario</span>
                  <p className="font-semibold text-white">@{selectedAudit.username}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Rol</span>
                  <p className="font-medium text-emerald-400">
                    {selectedAudit.rol_usuario || 'Registrado'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Operación</span>
                  <p className="font-medium text-cyan-300 font-mono">{selectedAudit.operacion}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Fecha y Hora</span>
                  <p className="font-mono text-slate-300">
                    {formatFechaHoraArg(selectedAudit.fecha_hora)}
                  </p>
                </div>
              </div>

              {/* Entidad afectada */}
              <div className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-400">Entidad / Registro:</span>
                <span className="font-mono text-slate-200">
                  {TABLAS_ETIQUETAS[selectedAudit.tabla_afectada] || selectedAudit.tabla_afectada} ({selectedAudit.id_registro})
                </span>
              </div>

              {/* Motivo asentado */}
              <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Motivo / Justificación asentada:
                </span>
                <p className="text-slate-200 mt-1 italic">
                  "{selectedAudit.motivo}"
                </p>
              </div>

              {/* Desglose de Campos Modificados si existen */}
              {selectedAudit.cambios_campos && selectedAudit.cambios_campos.length > 0 && (
                <div className="p-2.5 bg-slate-800/30 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 block flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Campos Alterados en esta Operación:</span>
                  </span>
                  <div className="space-y-1">
                    {selectedAudit.cambios_campos.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-200 block">
                            {c.etiqueta || c.campo}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{c.campo}</span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-xs">
                          <span className="text-slate-400 line-through">
                            {String(c.valor_anterior ?? '(nulo)')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-emerald-300 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            {String(c.valor_nuevo ?? '(nulo)')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

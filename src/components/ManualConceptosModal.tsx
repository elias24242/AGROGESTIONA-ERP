import React, { useState, useEffect, useRef } from 'react';
import { ConceptoGlosario, Usuario } from '../types/erp';
import { DatabaseState, saveDatabaseState } from '../services/sheetsService';
import { getFechaHoraArgentinaISO } from '../utils/dateUtils';
import {
  HerramientaSistema,
  loadHerramientasSistema,
  saveHerramientasSistema,
  resetHerramientasSistema,
} from '../data/sistemaGuiaData';
import {
  BookOpen,
  X,
  Search,
  Plus,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Calculator,
  Lightbulb,
  Boxes,
  Wheat,
  CircleDollarSign,
  FileSpreadsheet,
  Compass,
  Check,
  BarChart3,
  Target,
  Copy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Menu,
  Sliders,
  DollarSign,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
} from 'lucide-react';
import {
  INDICADORES_MANUAL_DATA,
  FichaIndicador,
  PerspectivaIndicador,
  PERSPECTIVAS_CMI_INFO,
} from '../data/indicadoresManualData';
import { IndicadorSimulator } from './manual/IndicadorSimulator';

interface ManualConceptosModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: DatabaseState;
  currentUser: Usuario | null;
  initialHighlightTerm?: string;
  initialTab?: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES';
  initialIndicadorId?: string;
  onStateUpdate: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ManualConceptosModal: React.FC<ManualConceptosModalProps> = ({
  isOpen,
  onClose,
  state,
  currentUser,
  initialHighlightTerm,
  initialTab,
  initialIndicadorId,
  onStateUpdate,
  onNavigateTab,
}) => {
  // Pestaña principal: 'SISTEMA' | 'GLOSARIO' | 'INDICADORES'
  const [activeTab, setActiveTab] = useState<'SISTEMA' | 'GLOSARIO' | 'INDICADORES'>('SISTEMA');

  // Subsección activa dentro del panel lateral
  const [activeSubSection, setActiveSubSection] = useState<string>('TODOS');

  // Control responsive del Sidebar en pantallas pequeñas
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Búsqueda global unificada
  const [globalSearch, setGlobalSearch] = useState('');

  // Estados para GLOSARIO
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [isEditing, setIsEditing] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState<Partial<ConceptoGlosario> | null>(null);
  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Estados para APARTADO SISTEMA & HERRAMIENTAS
  const [herramientas, setHerramientas] = useState<HerramientaSistema[]>(() => loadHerramientasSistema());
  const [searchHerramienta, setSearchHerramienta] = useState<string>('');
  const [categoriaHerramienta, setCategoriaHerramienta] = useState<string>('TODAS');
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  // Estados para APARTADO INDICADORES & FÓRMULAS
  const [searchIndicador, setSearchIndicador] = useState<string>('');
  const [filtroPerspectiva, setFiltroPerspectiva] = useState<string>('TODAS');
  const [expandedIndicadorId, setExpandedIndicadorId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estado para el Simulador Interactivo de Fórmulas
  const [activeSimulatorId, setActiveSimulatorId] = useState<string | null>(null);

  // Estado para modificación de herramientas del sistema (Administrador)
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [editingTool, setEditingTool] = useState<Partial<HerramientaSistema> | null>(null);
  const [toolMsg, setToolMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Referencia al contenedor de lectura para scroll fluido
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Inicialización inteligente según parámetro de apertura y pestaña solicitada
  useEffect(() => {
    if (!isOpen) return;

    if (initialIndicadorId) {
      setActiveTab('INDICADORES');
      const match = INDICADORES_MANUAL_DATA.find(
        (i) => i.id.toLowerCase() === initialIndicadorId.toLowerCase()
      );
      if (match) {
        setSearchIndicador(match.nombre);
        setExpandedIndicadorId(match.id);
        setActiveSimulatorId(null); // Exhibir ficha técnica completa en primer término (sin ocultar por simulador)
        setActiveSubSection(match.perspectiva);
        setTimeout(() => {
          const el = document.getElementById(`indicador-${match.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
      return;
    }

    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'INDICADORES') {
        if (initialHighlightTerm && initialHighlightTerm.toUpperCase() !== 'INDICADORES') {
          const term = initialHighlightTerm.replace(/^INDICADOR:/i, '').trim();
          setSearchIndicador(term);
          const match = INDICADORES_MANUAL_DATA.find(
            (i) => i.id.toLowerCase() === term.toLowerCase() || i.nombre.toLowerCase().includes(term.toLowerCase())
          );
          if (match) {
            setExpandedIndicadorId(match.id);
            setActiveSimulatorId(match.id);
            setActiveSubSection(match.perspectiva);
            setTimeout(() => {
              const el = document.getElementById(`indicador-${match.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
          }
        }
      } else if (initialTab === 'SISTEMA') {
        if (initialHighlightTerm && initialHighlightTerm.toUpperCase() !== 'SISTEMA') {
          const matchTool = herramientas.find(
            (h) => h.id.toLowerCase() === initialHighlightTerm.toLowerCase() ||
                  h.nombre.toLowerCase().includes(initialHighlightTerm.toLowerCase())
          );
          if (matchTool) {
            setSearchHerramienta(matchTool.nombre);
            setExpandedToolId(matchTool.id);
            setActiveSubSection('HERRAMIENTAS');
            setTimeout(() => {
              const el = document.getElementById(`tool-${matchTool.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
          }
        }
      } else {
        if (initialHighlightTerm && initialHighlightTerm.toUpperCase() !== 'GLOSARIO') {
          setSearchTerm(initialHighlightTerm);
          setActiveSubSection('CONCEPTOS');
        }
      }
    } else if (initialHighlightTerm) {
      if (initialHighlightTerm.toUpperCase() === 'INDICADORES' || initialHighlightTerm.startsWith('INDICADOR:')) {
        setActiveTab('INDICADORES');
        const term = initialHighlightTerm.replace(/^INDICADOR:/i, '').trim();
        setSearchIndicador(term === 'INDICADORES' ? '' : term);
        const match = INDICADORES_MANUAL_DATA.find(
          (i) => i.id.toLowerCase() === term.toLowerCase() || i.nombre.toLowerCase().includes(term.toLowerCase())
        );
        if (match) {
          setExpandedIndicadorId(match.id);
          setActiveSimulatorId(match.id);
          setActiveSubSection(match.perspectiva);
          setTimeout(() => {
            const el = document.getElementById(`indicador-${match.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      } else if (initialHighlightTerm.toUpperCase() === 'SISTEMA') {
        setActiveTab('SISTEMA');
        setActiveSubSection('TODOS');
      } else {
        const matchInd = INDICADORES_MANUAL_DATA.find(
          (i) => i.id.toLowerCase() === initialHighlightTerm.toLowerCase() ||
                i.nombre.toLowerCase().includes(initialHighlightTerm.toLowerCase())
        );
        const matchTool = herramientas.find(
          (h) => h.id.toLowerCase() === initialHighlightTerm.toLowerCase() ||
                h.nombre.toLowerCase().includes(initialHighlightTerm.toLowerCase())
        );
        if (matchInd) {
          setActiveTab('INDICADORES');
          setSearchIndicador(matchInd.nombre);
          setExpandedIndicadorId(matchInd.id);
          setActiveSimulatorId(matchInd.id);
          setActiveSubSection(matchInd.perspectiva);
          setTimeout(() => {
            const el = document.getElementById(`indicador-${matchInd.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        } else if (matchTool) {
          setActiveTab('SISTEMA');
          setSearchHerramienta(matchTool.nombre);
          setExpandedToolId(matchTool.id);
          setActiveSubSection('HERRAMIENTAS');
        } else {
          setActiveTab('GLOSARIO');
          setSearchTerm(initialHighlightTerm);
          setActiveSubSection('CONCEPTOS');
        }
      }
    }
  }, [isOpen, initialHighlightTerm, initialTab, initialIndicadorId]);

  const isAdmin = currentUser?.rol_nombre === 'ADMINISTRADOR';

  // ----------------------------------------------------
  // GESTIÓN DE CONCEPTOS DEL GLOSARIO
  // ----------------------------------------------------
  const conceptos = state.glosario || [];
  const queryGlosario = globalSearch.trim() || searchTerm.trim();

  const conceptosFiltrados = conceptos.filter((c) => {
    const matchCat = selectedCategoria === 'TODAS' || c.categoria === selectedCategoria;
    const matchSearch =
      queryGlosario === '' ||
      c.termino.toLowerCase().includes(queryGlosario.toLowerCase()) ||
      c.definicion_simple.toLowerCase().includes(queryGlosario.toLowerCase()) ||
      (c.formula_o_calculo && c.formula_o_calculo.toLowerCase().includes(queryGlosario.toLowerCase())) ||
      (c.ejemplo_practico && c.ejemplo_practico.toLowerCase().includes(queryGlosario.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleOpenCrearConcepto = () => {
    if (!isAdmin) return;
    setEditingConcepto({
      id_concepto: `GLOS-${Date.now()}`,
      termino: '',
      categoria: 'ECONOMICO',
      definicion_simple: '',
      formula_o_calculo: '',
      ejemplo_practico: '',
    });
    setFormMsg(null);
    setIsEditing(true);
  };

  const handleOpenEditarConcepto = (concepto: ConceptoGlosario) => {
    if (!isAdmin) return;
    setEditingConcepto({ ...concepto });
    setFormMsg(null);
    setIsEditing(true);
  };

  const handleGuardarConcepto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentUser) {
      setFormMsg({ type: 'error', text: 'Solo los usuarios administradores pueden incorporar o modificar conceptos.' });
      return;
    }

    if (!editingConcepto?.termino?.trim() || !editingConcepto?.definicion_simple?.trim()) {
      setFormMsg({ type: 'error', text: 'El término y la definición simple son obligatorios.' });
      return;
    }

    const id = editingConcepto.id_concepto?.trim() || `GLOS-${Date.now()}`;
    const existeIndex = state.glosario.findIndex((c) => c.id_concepto === id);

    const nowStr = getFechaHoraArgentinaISO();

    const conceptoGuardado: ConceptoGlosario = {
      id_concepto: id,
      termino: editingConcepto.termino.trim(),
      categoria: (editingConcepto.categoria as any) || 'ECONOMICO',
      definicion_simple: editingConcepto.definicion_simple.trim(),
      formula_o_calculo: editingConcepto.formula_o_calculo?.trim() || 'No aplica cálculo matemático formal.',
      ejemplo_practico: editingConcepto.ejemplo_practico?.trim() || 'Aplicación directa en la operatoria del establecimiento.',
      fecha_modificacion: nowStr,
      usuario_modificacion: currentUser.username,
    };

    if (existeIndex >= 0) {
      state.glosario[existeIndex] = conceptoGuardado;
      state.auditoria.unshift({
        id_auditoria: `AUD-${Date.now()}`,
        id_usuario: currentUser.id_usuario,
        username: currentUser.username,
        fecha_hora: nowStr,
        operacion: 'MODIFICACION',
        tabla_afectada: 'glosario',
        id_registro: id,
        valor_nuevo: JSON.stringify(conceptoGuardado),
        motivo: `Actualización de manual y definición técnica del término: "${conceptoGuardado.termino}"`,
      });
    } else {
      state.glosario.unshift(conceptoGuardado);
      state.auditoria.unshift({
        id_auditoria: `AUD-${Date.now()}`,
        id_usuario: currentUser.id_usuario,
        username: currentUser.username,
        fecha_hora: nowStr,
        operacion: 'ALTA',
        tabla_afectada: 'glosario',
        id_registro: id,
        valor_nuevo: JSON.stringify(conceptoGuardado),
        motivo: `Incorporación de nuevo concepto al manual del sistema: "${conceptoGuardado.termino}"`,
      });
    }

    saveDatabaseState(state);
    onStateUpdate();
    setFormMsg({ type: 'success', text: `Concepto "${conceptoGuardado.termino}" guardado y auditado con éxito.` });
    setTimeout(() => {
      setIsEditing(false);
      setEditingConcepto(null);
      setFormMsg(null);
    }, 900);
  };

  // ----------------------------------------------------
  // GESTIÓN DE HERRAMIENTAS Y APARTADO SISTEMA
  // ----------------------------------------------------
  const queryHerramienta = globalSearch.trim() || searchHerramienta.trim();

  const herramientasFiltradas = herramientas.filter((h) => {
    const matchCat = categoriaHerramienta === 'TODAS' || h.categoria === categoriaHerramienta;
    const matchSearch =
      queryHerramienta === '' ||
      h.nombre.toLowerCase().includes(queryHerramienta.toLowerCase()) ||
      h.descripcion.toLowerCase().includes(queryHerramienta.toLowerCase()) ||
      h.comoFunciona.toLowerCase().includes(queryHerramienta.toLowerCase()) ||
      h.rolesHabilitados.toLowerCase().includes(queryHerramienta.toLowerCase()) ||
      h.ejemploPractico.toLowerCase().includes(queryHerramienta.toLowerCase()) ||
      h.consejoClave.toLowerCase().includes(queryHerramienta.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenCrearHerramienta = () => {
    if (!isAdmin) return;
    setEditingTool({
      id: `tool-${Date.now()}`,
      nombre: '',
      categoria: 'GESTION',
      badge: 'Nueva Herramienta',
      descripcion: '',
      comoFunciona: '',
      accionesPrincipales: ['Acción o tarea inicial 1', 'Acción o tarea 2'],
      rolesHabilitados: 'Administrador y Responsable de Unidad',
      ejemploPractico: '',
      consejoClave: '',
    });
    setToolMsg(null);
    setIsEditingTool(true);
  };

  const handleOpenEditarHerramienta = (tool: HerramientaSistema) => {
    if (!isAdmin) return;
    setEditingTool({ ...tool });
    setToolMsg(null);
    setIsEditingTool(true);
  };

  const handleGuardarHerramienta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentUser) {
      setToolMsg({ type: 'error', text: 'Solo los administradores pueden modificar o incorporar herramientas en la guía.' });
      return;
    }

    if (!editingTool?.nombre?.trim() || !editingTool?.descripcion?.trim() || !editingTool?.comoFunciona?.trim()) {
      setToolMsg({ type: 'error', text: 'El nombre, descripción y funcionamiento de la herramienta son obligatorios.' });
      return;
    }

    const id = editingTool.id?.trim() || `tool-${Date.now()}`;
    const existeIndex = herramientas.findIndex((h) => h.id === id);

    let accionesArr: string[] = [];
    if (Array.isArray(editingTool.accionesPrincipales)) {
      accionesArr = editingTool.accionesPrincipales;
    } else if (typeof editingTool.accionesPrincipales === 'string') {
      accionesArr = (editingTool.accionesPrincipales as string)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const herramientaGuardada: HerramientaSistema = {
      id,
      nombre: editingTool.nombre.trim(),
      categoria: (editingTool.categoria as any) || 'GESTION',
      badge: editingTool.badge?.trim() || 'Módulo Oficial',
      descripcion: editingTool.descripcion.trim(),
      comoFunciona: editingTool.comoFunciona.trim(),
      accionesPrincipales: accionesArr.length > 0 ? accionesArr : ['Uso y operación diaria del módulo.'],
      rolesHabilitados: editingTool.rolesHabilitados?.trim() || 'Todos los roles habilitados.',
      ejemploPractico: editingTool.ejemploPractico?.trim() || 'Operación diaria en el establecimiento.',
      consejoClave: editingTool.consejoClave?.trim() || 'Consulte al administrador ante dudas de operación.',
    };

    let updated: HerramientaSistema[];
    const nowStr = getFechaHoraArgentinaISO();

    if (existeIndex >= 0) {
      updated = [...herramientas];
      updated[existeIndex] = herramientaGuardada;

      state.auditoria.unshift({
        id_auditoria: `AUD-${Date.now()}`,
        id_usuario: currentUser.id_usuario,
        username: currentUser.username,
        fecha_hora: nowStr,
        operacion: 'MODIFICACION',
        tabla_afectada: 'guia_sistema',
        id_registro: id,
        valor_nuevo: JSON.stringify(herramientaGuardada),
        motivo: `Actualización de manual y guía técnica de la herramienta: "${herramientaGuardada.nombre}"`,
      });
    } else {
      updated = [herramientaGuardada, ...herramientas];

      state.auditoria.unshift({
        id_auditoria: `AUD-${Date.now()}`,
        id_usuario: currentUser.id_usuario,
        username: currentUser.username,
        fecha_hora: nowStr,
        operacion: 'ALTA',
        tabla_afectada: 'guia_sistema',
        id_registro: id,
        valor_nuevo: JSON.stringify(herramientaGuardada),
        motivo: `Incorporación de nueva herramienta a la guía del sistema: "${herramientaGuardada.nombre}"`,
      });
    }

    setHerramientas(updated);
    saveHerramientasSistema(updated);
    saveDatabaseState(state);
    onStateUpdate();

    setToolMsg({ type: 'success', text: `Herramienta "${herramientaGuardada.nombre}" guardada y auditada con éxito.` });
    setTimeout(() => {
      setIsEditingTool(false);
      setEditingTool(null);
      setToolMsg(null);
    }, 900);
  };

  const handleRestablecerHerramientas = () => {
    if (!isAdmin || !currentUser) return;
    if (!confirm('¿Confirma restablecer la guía de herramientas a los valores canónicos del sistema?')) return;

    const can = resetHerramientasSistema();
    setHerramientas(can);

    const nowStr = getFechaHoraArgentinaISO();
    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: nowStr,
      operacion: 'MODIFICACION',
      tabla_afectada: 'guia_sistema',
      id_registro: 'RESET_CANONICO',
      valor_nuevo: JSON.stringify({ reset: true, count: can.length }),
      motivo: 'Restablecimiento de la guía de herramientas a los contenidos canónicos de UNRC',
    });

    saveDatabaseState(state);
    onStateUpdate();
  };

  // ----------------------------------------------------
  // GESTIÓN DE INDICADORES
  // ----------------------------------------------------
  const queryIndicador = globalSearch.trim() || searchIndicador.trim();

  const indicadoresFiltrados = INDICADORES_MANUAL_DATA.filter((ind) => {
    const matchPersp =
      filtroPerspectiva === 'TODAS' ||
      ind.perspectiva === filtroPerspectiva ||
      (filtroPerspectiva === 'ZOOTECNICA' && ind.subcategoria === 'ZOOTECNICA');
    const matchSearch =
      queryIndicador === '' ||
      ind.nombre.toLowerCase().includes(queryIndicador.toLowerCase()) ||
      ind.abreviatura.toLowerCase().includes(queryIndicador.toLowerCase()) ||
      ind.formula.toLowerCase().includes(queryIndicador.toLowerCase()) ||
      ind.definicion.toLowerCase().includes(queryIndicador.toLowerCase()) ||
      ind.interpretacion.toLowerCase().includes(queryIndicador.toLowerCase());
    return matchPersp && matchSearch;
  });

  // Manejo de scroll suave a elementos al hacer clic en el índice
  const scrollToAnchor = (anchorId: string) => {
    setIsSidebarOpenMobile(false);
    setTimeout(() => {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (readerContainerRef.current) {
        readerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR EJECUTIVA: Breadcrumbs, Buscador Global y Controles        */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Botón Drawer para pantallas móviles */}
            <button
              onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Abrir índice de contenidos"
            >
              {isSidebarOpenMobile ? <PanelLeftClose className="w-5 h-5 text-indigo-400" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
                <span>Manual ERP Pozo del Carril</span>
                <span>/</span>
                <span className="text-indigo-400 font-semibold truncate">
                  {activeTab === 'SISTEMA'
                    ? '1. Arquitectura & Módulos'
                    : activeTab === 'GLOSARIO'
                    ? '2. Glosario Didáctico'
                    : '3. Fichas de Indicadores & Simulador'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                Manual de Conceptos, Herramientas y Fórmulas
              </h2>
            </div>
          </div>

          {/* Buscador Global Rápido */}
          <div className="hidden sm:flex items-center relative max-w-xs flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar concepto, módulo o fórmula..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Acciones de la Barra Superior */}
          <div className="flex items-center space-x-2 shrink-0">
            {isAdmin ? (
              <span className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Activo</span>
              </span>
            ) : (
              <span className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 text-[11px] font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Lectura</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUERPO DEL MODAL: Layout de 2 Columnas (Sidebar Índice + Viewport Fluido)  */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* ======================================================================= */}
          {/* COLUMNA 1: PANEL LATERAL CON ÍNDICE Y ACCESOS RÁPIDOS                   */}
          {/* ======================================================================= */}
          <aside
            className={`
              absolute inset-y-0 left-0 z-30 w-72 bg-slate-950/95 border-r border-slate-800 p-3 sm:p-4 flex flex-col space-y-4 overflow-y-auto transition-transform duration-200 ease-in-out
              md:relative md:translate-x-0 md:bg-slate-950/70 md:z-0 shrink-0
              ${isSidebarOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            `}
          >
            {/* Buscador visible solo en móvil */}
            <div className="sm:hidden relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar término..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">
              Índice de Navegación
            </div>

            {/* SECCIÓN 1: SISTEMA & ARQUITECTURA */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('SISTEMA');
                  setActiveSubSection('TODOS');
                  scrollToAnchor('seccion-sistema-top');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'SISTEMA'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>1. Apartado Sistema</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {herramientas.length} mód.
                </span>
              </button>

              {activeTab === 'SISTEMA' && (
                <div className="pl-6 pr-1 py-1 space-y-1 text-xs border-l-2 border-indigo-500/30 ml-3 animate-in fade-in">
                  <button
                    onClick={() => scrollToAnchor('seccion-induccion')}
                    className="w-full text-left py-1 text-slate-400 hover:text-indigo-300 transition-colors block truncate"
                  >
                    · Inducción Oficial ERP
                  </button>
                  <button
                    onClick={() => scrollToAnchor('seccion-pilares')}
                    className="w-full text-left py-1 text-slate-400 hover:text-indigo-300 transition-colors block truncate"
                  >
                    · 4 Pilares (RT 54 & PPP)
                  </button>
                  <button
                    onClick={() => scrollToAnchor('seccion-catalogo-herramientas')}
                    className="w-full text-left py-1 text-slate-400 hover:text-indigo-300 transition-colors block truncate"
                  >
                    · Módulos del Sistema ({herramientasFiltradas.length})
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: GLOSARIO DIDÁCTICO */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('GLOSARIO');
                  setActiveSubSection('TODOS');
                  scrollToAnchor('seccion-glosario-top');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'GLOSARIO'
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. Glosario Didáctico</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {conceptos.length} térm.
                </span>
              </button>

              {activeTab === 'GLOSARIO' && (
                <div className="pl-6 pr-1 py-1 space-y-1 text-xs border-l-2 border-emerald-500/30 ml-3 animate-in fade-in">
                  <button
                    onClick={() => scrollToAnchor('seccion-tipo-cambio')}
                    className="w-full text-left py-1 text-slate-400 hover:text-emerald-300 transition-colors block truncate"
                  >
                    · Guía: TC Comprador vs. Vendedor
                  </button>
                  <button
                    onClick={() => scrollToAnchor('seccion-conceptos-list')}
                    className="w-full text-left py-1 text-slate-400 hover:text-emerald-300 transition-colors block truncate"
                  >
                    · Fichas de Conceptos ({conceptosFiltrados.length})
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: INDICADORES & SIMULADOR */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('INDICADORES');
                  setActiveSubSection('TODOS');
                  scrollToAnchor('seccion-indicadores-top');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'INDICADORES'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>3. Fichas de Indicadores</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {INDICADORES_MANUAL_DATA.length} fichas
                </span>
              </button>

              {activeTab === 'INDICADORES' && (
                <div className="pl-6 pr-1 py-1 space-y-1 text-xs border-l-2 border-amber-500/30 ml-3 animate-in fade-in">
                  <button
                    onClick={() => {
                      setFiltroPerspectiva('TODAS');
                      scrollToAnchor('seccion-indicadores-list');
                    }}
                    className={`w-full text-left py-1 block truncate transition-colors ${
                      filtroPerspectiva === 'TODAS' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    · Todos ({INDICADORES_MANUAL_DATA.length} indicadores)
                  </button>
                  <button
                    onClick={() => {
                      setFiltroPerspectiva('FINANCIERA');
                      scrollToAnchor('seccion-indicadores-list');
                    }}
                    className={`w-full text-left py-1 block truncate transition-colors ${
                      filtroPerspectiva === 'FINANCIERA' ? 'text-indigo-300 font-bold' : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    · 1. Financiera (4)
                  </button>
                  <button
                    onClick={() => {
                      setFiltroPerspectiva('CLIENTES');
                      scrollToAnchor('seccion-indicadores-list');
                    }}
                    className={`w-full text-left py-1 block truncate transition-colors ${
                      filtroPerspectiva === 'CLIENTES' ? 'text-blue-300 font-bold' : 'text-slate-400 hover:text-blue-300'
                    }`}
                  >
                    · 2. Clientes / Mercado (4)
                  </button>
                  <button
                    onClick={() => {
                      setFiltroPerspectiva('PROCESOS');
                      scrollToAnchor('seccion-indicadores-list');
                    }}
                    className={`w-full text-left py-1 block truncate transition-colors ${
                      filtroPerspectiva === 'PROCESOS' ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    · 3. Procesos Internos (8)
                  </button>
                  <button
                    onClick={() => {
                      setFiltroPerspectiva('APRENDIZAJE');
                      scrollToAnchor('seccion-indicadores-list');
                    }}
                    className={`w-full text-left py-1 block truncate transition-colors ${
                      filtroPerspectiva === 'APRENDIZAJE' ? 'text-purple-300 font-bold' : 'text-slate-400 hover:text-purple-300'
                    }`}
                  >
                    · 4. Aprendizaje & Crecimiento (3)
                  </button>
                  <button
                    onClick={() => {
                      setFiltroPerspectiva('ZOOTECNICA');
                      scrollToAnchor('seccion-indicadores-list');
                    }}
                    className={`w-full text-left py-1 block truncate transition-colors ${
                      filtroPerspectiva === 'ZOOTECNICA' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    · Eje Zootécnico (4)
                  </button>
                </div>
              )}
            </div>

            {/* Acceso Rápido al Simulador de Fórmulas */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setActiveTab('INDICADORES');
                  setActiveSimulatorId('gdp_peso');
                  scrollToAnchor('indicador-gdp_peso');
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between hover:border-indigo-400 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <span>Simulador de Fórmulas</span>
                </div>
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <p className="text-[10px] text-slate-400 px-1 mt-1.5 leading-tight">
                Permite cambiar variables de pesos, parición o costos y ver el resultado exacto en vivo.
              </p>
            </div>

            {/* Accesos Rápidos de Administración */}
            {isAdmin && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                  Acciones Administrador
                </span>
                {activeTab === 'GLOSARIO' && (
                  <button
                    onClick={handleOpenCrearConcepto}
                    className="w-full py-1.5 px-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Concepto</span>
                  </button>
                )}
                {activeTab === 'SISTEMA' && (
                  <button
                    onClick={handleOpenCrearHerramienta}
                    className="w-full py-1.5 px-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Herramienta</span>
                  </button>
                )}
              </div>
            )}
          </aside>

          {/* ======================================================================= */}
          {/* COLUMNA 2: VIEWPORT PRINCIPAL DE LECTURA FLUIDA                         */}
          {/* ======================================================================= */}
          <main
            ref={readerContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-slate-900/60"
          >
            {/* ===================================================================== */}
            {/* VISTA 1: APARTADO SISTEMA & DISTINTAS HERRAMIENTAS                    */}
            {/* ===================================================================== */}
            {activeTab === 'SISTEMA' && (
              <div id="seccion-sistema-top" className="space-y-6 max-w-4xl mx-auto">
                {/* 1. INDUCCIÓN OFICIAL */}
                <section
                  id="seccion-induccion"
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono">
                    <span className="font-bold">INDUCCIÓN OFICIAL</span>
                    <span>·</span>
                    <span className="text-slate-400">UNRC Taller de Práctica Profesional</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    ¿Es tu primera vez en el sistema y no sabés cómo funciona?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    El ERP Ovinos Pozo del Carril integra en un único entorno la gestión física de la majada, el control de inventarios de alimentos y medicamentos, las operaciones comerciales en moneda dual (ARS / USD al Tipo de Cambio Oficial del Banco Nación y Dólar Hoy), y la medición contable bajo la Resolución Técnica 54 de la FACPCE. Todo movimiento queda asentado en una bitácora de auditoría inmutable en Hora Argentina (ART).
                  </p>
                </section>

                {/* Formulario de Modificación de Herramienta si está activo */}
                {isEditingTool && editingTool && (
                  <div className="bg-slate-950 border border-indigo-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                        <Edit3 className="w-4 h-4" />
                        <span>
                          {herramientas.some((h) => h.id === editingTool.id)
                            ? `Modificar Herramienta: "${editingTool.nombre}"`
                            : 'Incorporar Nueva Herramienta / Módulo Futuro'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTool(false);
                          setEditingTool(null);
                        }}
                        className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
                      >
                        Cancelar
                      </button>
                    </div>

                    {toolMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                          toolMsg.type === 'error'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {toolMsg.type === 'error' ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                        <span>{toolMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleGuardarHerramienta} className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">ID de Herramienta *</label>
                          <input
                            type="text"
                            value={editingTool.id || ''}
                            onChange={(e) => setEditingTool({ ...editingTool, id: e.target.value })}
                            placeholder="ej: dashboard, majada, rfid..."
                            required
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Nombre de la Herramienta *</label>
                          <input
                            type="text"
                            value={editingTool.nombre || ''}
                            onChange={(e) => setEditingTool({ ...editingTool, nombre: e.target.value })}
                            placeholder="ej: Majada & Hacienda"
                            required
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Categoría Técnica *</label>
                          <select
                            value={editingTool.categoria || 'GESTION'}
                            onChange={(e) => setEditingTool({ ...editingTool, categoria: e.target.value as any })}
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-indigo-500 outline-none cursor-pointer"
                          >
                            <option value="ZOOTECNICA">Zootécnica & Biológica</option>
                            <option value="GESTION">Gestión & Control</option>
                            <option value="CONTABLE_FINANCIERA">Contable & Financiera (RT 54)</option>
                            <option value="CONTROL_SEGURIDAD">Seguridad, Auditoría & Datos</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Descripción General *</label>
                        <textarea
                          rows={2}
                          value={editingTool.descripcion || ''}
                          onChange={(e) => setEditingTool({ ...editingTool, descripcion: e.target.value })}
                          placeholder="Propósito y objetivo de la herramienta..."
                          required
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">¿Cómo Funciona Paso a Paso? *</label>
                        <textarea
                          rows={3}
                          value={editingTool.comoFunciona || ''}
                          onChange={(e) => setEditingTool({ ...editingTool, comoFunciona: e.target.value })}
                          placeholder="Explicación detallada del flujo de datos, tablas afectadas y funcionamiento..."
                          required
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingTool(false);
                            setEditingTool(null);
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                        >
                          Descartar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-950/40 cursor-pointer"
                        >
                          Guardar Herramienta y Auditar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. LOS 4 PILARES DEL SISTEMA (DISEÑO EJECUTIVO LIMPIO) */}
                <section id="seccion-pilares" className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4" />
                    <span>Los 4 Pilares del ERP Pozo del Carril</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Pilar 1 */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                        <Boxes className="w-4 h-4 shrink-0" />
                        <span>1. Circuito Zootécnico & Hacienda (81 Cabezas Canónicas)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        El rodeo se compone de <strong>81 cabezas canónicas</strong> en el Lote LOT001, organizadas en tres subunidades: <strong>Cría</strong> (madres y carneros), <strong>Recría</strong> (corderos post-destete) y <strong>Engorde</strong>. Cada nacimiento, muerte o cambio de categoría conserva la coherencia matemática y física del rodeo.
                      </p>
                      <div className="text-[11px] font-mono text-slate-400 pt-1">
                        Trazabilidad animal · Ganancia Media Diaria (GMD) · Pesajes periódicos.
                      </div>
                    </div>

                    {/* Pilar 2 */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                        <Wheat className="w-4 h-4 shrink-0" />
                        <span>2. Depósito de Insumos & Costos Directos con PPP</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        El inventario opera bajo la <strong>regla estricta de stock no negativo (≥ 0)</strong>. Al cargar compras se recalcula el <strong>Precio Promedio Ponderado (PPP)</strong>. Al consumir forraje, concentrado o fármacos, se imputa el gasto zootécnico exacto a la subunidad y se audita contra la Dosis Técnica recomendada.
                      </p>
                      <div className="text-[11px] font-mono text-slate-400 pt-1">
                        Control de desvíos de dosis · PPP automático · Alertas de stock crítico.
                      </div>
                    </div>

                    {/* Pilar 3 */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                      <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                        <CircleDollarSign className="w-4 h-4 shrink-0" />
                        <span>3. Moneda Dual (ARS / USD) y Cotización Banco Nación</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Todas las transacciones económicas y valuaciones operan con doble moneda. El sistema se sincroniza con el <strong>Mercado Oficial y Dólar Hoy</strong>. Por criterio de prudencia contable: se emplea <strong>TC Comprador</strong> para ventas/ingresos y <strong>TC Vendedor</strong> para compras/costos.
                      </p>
                      <div className="text-[11px] font-mono text-slate-400 pt-1">
                        Moneda dual en tiempo real · Libro de compras y ventas · Cuentas corrientes.
                      </div>
                    </div>

                    {/* Pilar 4 */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                      <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                        <FileSpreadsheet className="w-4 h-4 shrink-0" />
                        <span>4. Medición Patrimonial (RT 54) & Auditoría en ART</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        La hacienda se valúa bajo la <strong>Resolución Técnica 54 de FACPCE</strong> (Valor Neto de Realización menos gastos directos de venta). Ningún dato se borra físicamente: cada alta, ajuste o anulación genera un comprobante inmutable con fecha/hora oficial de Argentina (ART).
                      </p>
                      <div className="text-[11px] font-mono text-slate-400 pt-1">
                        Cuadros patrimoniales UNRC · Auditoría inmutable · Modelo relacional 3FN.
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. CATÁLOGO DE MÓDULOS DEL SISTEMA */}
                <section id="seccion-catalogo-herramientas" className="space-y-4 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>Catálogo de Módulos Operativos ({herramientasFiltradas.length})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Guía de uso para cada herramienta, roles autorizados y consejos de campo.
                      </p>
                    </div>

                    {isAdmin && !isEditingTool && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={handleOpenCrearHerramienta}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Módulo</span>
                        </button>
                        <button
                          onClick={handleRestablecerHerramientas}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                          title="Restablecer guía a valores canónicos"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Listado de Tarjetas de Herramientas */}
                  <div className="space-y-3">
                    {herramientasFiltradas.map((tool) => {
                      const isExpanded = expandedToolId === tool.id;
                      return (
                        <div
                          key={tool.id}
                          id={`tool-${tool.id}`}
                          className={`rounded-xl border transition-all ${
                            isExpanded
                              ? 'bg-slate-900 border-indigo-500/40 shadow-lg'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div
                            onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                            className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                                  <span>{tool.categoria}</span>
                                  <span>·</span>
                                  <span>{tool.rolesHabilitados}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                                  {tool.nombre}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditarHerramienta(tool);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Editar herramienta"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button type="button" className="p-1 text-slate-400 hover:text-white">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 text-xs">
                              <div className="text-slate-300 leading-relaxed pt-2">
                                <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                                  Propósito y Descripción:
                                </span>
                                <p>{tool.descripcion}</p>
                              </div>

                              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                                <span className="font-bold text-indigo-400 block text-[10px] uppercase tracking-wider mb-1">
                                  ¿Cómo funciona en el ERP?
                                </span>
                                <p className="text-slate-200 leading-relaxed">{tool.comoFunciona}</p>
                              </div>

                              {tool.accionesPrincipales && tool.accionesPrincipales.length > 0 && (
                                <div>
                                  <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1.5">
                                    Acciones Principales:
                                  </span>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                                    {tool.accionesPrincipales.map((acc, i) => (
                                      <li key={i} className="flex items-start space-x-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{acc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                                  <span className="font-bold text-emerald-400 block mb-0.5">Ejemplo en el Campo:</span>
                                  <p className="text-slate-300">{tool.ejemploPractico}</p>
                                </div>
                                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                                  <span className="font-bold text-amber-400 block mb-0.5">Consejo Clave:</span>
                                  <p className="text-slate-300">{tool.consejoClave}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VISTA 2: GLOSARIO DIDÁCTICO & GUÍA CAMBIARIA                           */}
            {/* ===================================================================== */}
            {activeTab === 'GLOSARIO' && (
              <div id="seccion-glosario-top" className="space-y-6 max-w-4xl mx-auto">
                {/* Formulario de Alta / Modificación de Concepto (Solo Administrador) */}
                {isEditing && editingConcepto && (
                  <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                        <Edit3 className="w-4 h-4" />
                        <span>
                          {conceptos.some((c) => c.id_concepto === editingConcepto.id_concepto)
                            ? `Modificar Concepto: "${editingConcepto.termino}"`
                            : 'Nuevo Concepto del Glosario'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
                      >
                        Cancelar
                      </button>
                    </div>

                    {formMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                          formMsg.type === 'error'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {formMsg.type === 'error' ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                        <span>{formMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleGuardarConcepto} className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Término o Concepto *</label>
                          <input
                            type="text"
                            value={editingConcepto.termino || ''}
                            onChange={(e) => setEditingConcepto({ ...editingConcepto, termino: e.target.value })}
                            placeholder="ej: Margen Bruto Ovino, VNR..."
                            required
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Categoría Técnica *</label>
                          <select
                            value={editingConcepto.categoria || 'ECONOMICO'}
                            onChange={(e) => setEditingConcepto({ ...editingConcepto, categoria: e.target.value as any })}
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none cursor-pointer"
                          >
                            <option value="ECONOMICO">Económico & Comercial</option>
                            <option value="ZOOTECNICO">Zootécnico & Biológico</option>
                            <option value="CONTABLE">Contable & RT 54 (FACPCE)</option>
                            <option value="SISTEMAS">Sistemas & Auditoría ART</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Definición Sencilla *</label>
                        <textarea
                          rows={2}
                          value={editingConcepto.definicion_simple || ''}
                          onChange={(e) => setEditingConcepto({ ...editingConcepto, definicion_simple: e.target.value })}
                          placeholder="Explicación clara en palabras sencillas..."
                          required
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Fórmula o Cálculo Matemático Formal</label>
                        <textarea
                          rows={2}
                          value={editingConcepto.formula_o_calculo || ''}
                          onChange={(e) => setEditingConcepto({ ...editingConcepto, formula_o_calculo: e.target.value })}
                          placeholder="ej: MB = Ingreso Bruto - Costos Directos..."
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                        >
                          Descartar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer"
                        >
                          Guardar y Auditar en ART
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 1. GUÍA DIDÁCTICA: TIPO DE CAMBIO COMPRADOR VS. VENDEDOR */}
                <section
                  id="seccion-tipo-cambio"
                  className="rounded-2xl border p-5 bg-slate-950/90 border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold uppercase tracking-wider">Pizarra Cambiaria Agropecuaria</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Banco Nación · Dólar Hoy · RT 54
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Tipo de Cambio Comprador vs. Tipo de Cambio Vendedor: ¿Cuál utilizar?
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      En las finanzas agropecuarias argentinas, las cotizaciones siempre se publican desde la perspectiva de la <strong>Entidad Bancaria</strong> (no del productor):
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    {/* Tarjeta TC Comprador */}
                    <div className="p-4 rounded-xl border bg-emerald-950/20 border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 text-xs">
                          💵 Tipo de Cambio Comprador
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300">
                          Al Vender Hacienda / Lana
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        <strong>Significado:</strong> Es el precio al que el banco te <strong>compra</strong> tus dólares. Siempre es la cotización <strong>más baja</strong> de la pizarra.
                      </p>
                      <div className="text-[11px] bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                        <strong className="text-emerald-400">¿Cuándo usarlo?:</strong> Al liquidar cobros por venta de corderos/lana o al valuar existencias en dólares en el activo patrimonial.
                      </div>
                    </div>

                    {/* Tarjeta TC Vendedor */}
                    <div className="p-4 rounded-xl border bg-blue-950/20 border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-400 text-xs">
                          💳 Tipo de Cambio Vendedor
                        </span>
                        <span className="text-[10px] font-mono text-blue-300">
                          Al Comprar Insumos / Sanidad
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        <strong>Significado:</strong> Es el precio al que el banco te <strong>vende</strong> los dólares. Siempre es la cotización <strong>más alta</strong>.
                      </p>
                      <div className="text-[11px] bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                        <strong className="text-blue-400">¿Cuándo usarlo?:</strong> Al cancelar facturas de vacunas, concentrados importados cotizados en USD o proyectar presupuestos de compras.
                      </div>
                    </div>
                  </div>

                  {/* Criterio de Prudencia RT 54 */}
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-[11px] text-slate-300 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-purple-300">Criterio de Prudencia (RT 54 FACPCE): </strong>
                      Para no sobreestimar ingresos, valúa tus ventas en USD al <strong>TC Comprador</strong>. Para no subestimar costos, presupuesta tus insumos en USD al <strong>TC Vendedor</strong>.
                    </div>
                  </div>
                </section>

                {/* 2. CATÁLOGO DE CONCEPTOS */}
                <section id="seccion-conceptos-list" className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>Fichas de Conceptos del Glosario ({conceptosFiltrados.length})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Definiciones claras, fórmulas matemáticas y aplicaciones a campo.
                      </p>
                    </div>

                    {/* Filtro por Categoría */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: 'TODAS', label: 'Todos' },
                        { id: 'ECONOMICO', label: 'Económicos' },
                        { id: 'ZOOTECNICO', label: 'Zootécnicos' },
                        { id: 'CONTABLE', label: 'Contables RT 54' },
                        { id: 'SISTEMAS', label: 'Sistemas' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoria(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategoria === cat.id
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listado de Tarjetas de Conceptos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {conceptosFiltrados.map((concepto) => (
                      <div
                        key={concepto.id_concepto}
                        className="rounded-xl p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                {concepto.categoria}
                              </div>
                              <h4 className="text-sm font-bold text-white tracking-tight">
                                {concepto.termino}
                              </h4>
                            </div>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenEditarConcepto(concepto)}
                                className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Editar concepto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 leading-relaxed mt-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                              En palabras simples:
                            </span>
                            <p>{concepto.definicion_simple}</p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-800/80">
                          {concepto.formula_o_calculo && (
                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto select-all">
                              {concepto.formula_o_calculo}
                            </div>
                          )}

                          {concepto.ejemplo_practico && (
                            <div className="text-[11px] text-slate-400 italic">
                              <strong>Ejemplo:</strong> {concepto.ejemplo_practico}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VISTA 3: FICHAS DE INDICADORES & SIMULADOR INTERACTIVO                */}
            {/* ===================================================================== */}
            {activeTab === 'INDICADORES' && (
              <div id="seccion-indicadores-top" className="space-y-6 max-w-4xl mx-auto">
                {/* Header de la Sección con Filtros de Perspectiva */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span>Fichas Técnicas de Indicadores ({indicadoresFiltrados.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fórmulas formales, rangos de semáforo y simulador interactivo en tiempo real.
                    </p>
                  </div>

                  {/* Selector de Perspectivas */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: 'TODAS', label: `Todas (${INDICADORES_MANUAL_DATA.length})` },
                      { id: 'FINANCIERA', label: '1. Financiera' },
                      { id: 'CLIENTES', label: '2. Clientes' },
                      { id: 'PROCESOS', label: '3. Procesos' },
                      { id: 'APRENDIZAJE', label: '4. Aprendizaje & Crecimiento' },
                      { id: 'ZOOTECNICA', label: 'Eje Zootécnico' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setFiltroPerspectiva(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          filtroPerspectiva === p.id
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner de Pregunta Estratégica si hay perspectiva seleccionada */}
                {filtroPerspectiva !== 'TODAS' && PERSPECTIVAS_CMI_INFO[filtroPerspectiva] && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start space-x-3 animate-in fade-in ${PERSPECTIVAS_CMI_INFO[filtroPerspectiva].colorBg} ${PERSPECTIVAS_CMI_INFO[filtroPerspectiva].colorBorder}`}
                  >
                    <Compass className={`w-4 h-4 shrink-0 mt-0.5 ${PERSPECTIVAS_CMI_INFO[filtroPerspectiva].color}`} />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${PERSPECTIVAS_CMI_INFO[filtroPerspectiva].color}`}>
                          {PERSPECTIVAS_CMI_INFO[filtroPerspectiva].nombre}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">· Metodología Balanced Scorecard</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white italic">
                        «{PERSPECTIVAS_CMI_INFO[filtroPerspectiva].preguntaEstrategica}»
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {PERSPECTIVAS_CMI_INFO[filtroPerspectiva].enfoque}
                      </p>
                    </div>
                  </div>
                )}

                {/* Listado de Fichas de Indicadores */}
                <div id="seccion-indicadores-list" className="space-y-4">
                  {indicadoresFiltrados.map((ind) => {
                    const isExpanded = expandedIndicadorId === '__ALL__' || expandedIndicadorId === ind.id;
                    const isSimulatorOpen = activeSimulatorId === ind.id;

                    const handleCopyFormula = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(ind.formula);
                      setCopiadoId(ind.id);
                      setTimeout(() => setCopiadoId(null), 1800);
                    };

                    return (
                      <div
                        key={ind.id}
                        id={`indicador-${ind.id}`}
                        className={`rounded-xl border transition-all ${
                          isExpanded || isSimulatorOpen
                            ? 'bg-slate-900 border-amber-500/40 shadow-xl'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Cabecera de la Ficha Técnica */}
                        <div
                          onClick={() => setExpandedIndicadorId(isExpanded ? null : ind.id)}
                          className="p-4 sm:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                        >
                          <div className="flex items-start sm:items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                              <Target className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              {/* Kicker Tipográfico Limpio (Sin Pills superfluas) */}
                              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 flex-wrap">
                                <span className="font-bold text-amber-400">{ind.perspectiva}</span>
                                <span>·</span>
                                <span>{ind.abreviatura}</span>
                                <span>·</span>
                                <span>Unidad: {ind.unidad}</span>
                                <span>·</span>
                                <span>{ind.sentido === 'MAYOR_MEJOR' ? 'Mayor es Mejor' : 'Menor es Mejor'}</span>
                              </div>
                              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                                {ind.nombre}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2.5 shrink-0">
                            <div className="text-right hidden sm:block">
                              <span className="text-[10px] text-slate-400 block font-mono">Meta Óptima:</span>
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {ind.rangoOptimoTexto}
                              </span>
                            </div>

                            {/* Botón para Abrir / Cerrar Simulador Interactivo */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSimulatorId(isSimulatorOpen ? null : ind.id);
                                if (!isExpanded) setExpandedIndicadorId(ind.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                                isSimulatorOpen
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-slate-800 text-indigo-300 border-indigo-500/40 hover:bg-slate-700'
                              }`}
                              title="Simular fórmula matemática con valores variables en tiempo real"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isSimulatorOpen ? 'Ocultar Simulador' : 'Simular'}</span>
                            </button>

                            {/* Botón Copiar Fórmula */}
                            <button
                              type="button"
                              onClick={handleCopyFormula}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                              title="Copiar fórmula matemática"
                            >
                              {copiadoId === ind.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>

                            <button type="button" className="p-1 text-slate-400 hover:text-white">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* DETALLE TÉCNICO DE LA FICHA (SIEMPRE VISIBLE AL EXPANDIR) */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs animate-in fade-in">
                            {/* Pregunta Estratégica CMI (Norton & Kaplan) */}
                            <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-500/30 flex items-start space-x-2.5">
                              <Compass className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                                  Pregunta Estratégica del CMI (Balanced Scorecard):
                                </span>
                                <p className="text-xs text-indigo-200 italic font-semibold mt-0.5">
                                  «{ind.preguntaEstrategica || PERSPECTIVAS_CMI_INFO[ind.perspectiva]?.preguntaEstrategica || '¿Cómo optimizar este proceso estratégico para el establecimiento?'}»
                                </p>
                              </div>
                            </div>

                            {/* Definición e Importancia Operativa */}
                            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Definición e Importancia en el Establecimiento:
                              </span>
                              <p className="text-slate-200 leading-relaxed">{ind.definicion}</p>
                            </div>

                            {/* Fórmula Formal Matemática */}
                            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                                  <Calculator className="w-3.5 h-3.5" />
                                  <span>Fórmula Formal Matemática:</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCopyFormula}
                                  className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center space-x-1 font-mono"
                                >
                                  {copiadoId === ind.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 font-bold overflow-x-auto select-all">
                                {ind.formula}
                              </div>

                              {/* Variables Desglosadas y Origen en el ERP */}
                              <div className="pt-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                  Variables y Origen en el Sistema ERP:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {ind.variables.map((v) => (
                                    <div
                                      key={v.variable}
                                      className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px]"
                                    >
                                      <strong className="text-white block">{v.variable}</strong>
                                      <span className="text-slate-300 block">{v.descripcion}</span>
                                      <span className="text-[10px] text-emerald-400/90 font-mono mt-0.5 block">
                                        Origen: {v.origen}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Semáforo & Rangos de Interpretación */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                  Óptimo (Verde)
                                </span>
                                <div className="font-mono text-xs font-bold text-emerald-300">
                                  {ind.rangoOptimoTexto}
                                </div>
                              </div>

                              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                  A Revisar (Amarillo)
                                </span>
                                <div className="font-mono text-xs font-bold text-amber-300">
                                  {ind.rangoRevisarTexto}
                                </div>
                                <p className="text-[10px] text-slate-400 pt-1">
                                  {ind.accionesRecomendadas.enAmarillo}
                                </p>
                              </div>

                              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                                  Crítico (Rojo)
                                </span>
                                <div className="font-mono text-xs font-bold text-rose-300">
                                  {ind.rangoCriticoTexto}
                                </div>
                                <p className="text-[10px] text-slate-400 pt-1">
                                  {ind.accionesRecomendadas.enRojo}
                                </p>
                              </div>
                            </div>

                            {/* Interpretación Zootécnica y de Gestión */}
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                              <strong className="text-white block mb-0.5">Criterio de Gestión e Interpretación:</strong>
                              <p>{ind.interpretacion}</p>
                            </div>

                            {/* SIMULADOR DINÁMICO EN TIEMPO REAL SI EL USUARIO LO ABRIÓ */}
                            {isSimulatorOpen && (
                              <div className="mt-4 pt-4 border-t border-indigo-500/30">
                                <div className="flex items-center justify-between mb-3 bg-indigo-950/30 px-3 py-2 rounded-xl border border-indigo-500/20">
                                  <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs">
                                    <Calculator className="w-4 h-4 text-indigo-400" />
                                    <span>Simulador Dinámico de Escenarios (Previsión en Tiempo Real)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveSimulatorId(null)}
                                    className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Cerrar Simulador
                                  </button>
                                </div>
                                <IndicadorSimulator indicador={ind} onClose={() => setActiveSimulatorId(null)} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

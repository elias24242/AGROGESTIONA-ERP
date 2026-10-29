import React, { useState, useEffect } from 'react';
import {
  DatabaseState,
  saveDatabaseState,
  getInitialState,
  createERPGoogleSpreadsheet,
  pushAllDataToGoogleSheets,
  pullAllDataFromGoogleSheets,
  getSavedSpreadsheetId,
  setSavedSpreadsheetId,
  getSheetsVinculacionMetadata,
  saveSheetsVinculacionMetadata,
  subscribeToVinculacionMetadata,
  verificarConexionGoogleSheets,
  SheetsVinculacionMetadata
} from '../services/sheetsService';
import { getAccessToken, googleSignIn } from '../services/firebase';
import { Usuario, Subunidad, Lote, Categoria, Insumo } from '../types/erp';
import { loadRolePermissions, saveRolePermissions, MODULOS_SISTEMA } from '../services/permissionService';
import {
  Settings,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Users,
  Shield,
  Layers,
  Database,
  Trash2,
  Clock,
  Wifi,
  WifiOff,
  PackagePlus,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Activity,
  Unlink
} from 'lucide-react';
import {
  getCacheMetadata,
  setSimulatedOfflineMode,
  isSimulatedOfflineForced,
  cacheStateSnapshot,
  getOfflineQueue
} from '../services/offlineCacheService';
import { SectionAuditBadge } from '../components/SectionAuditBadge';
import { NuevoInsumoModal } from '../components/NuevoInsumoModal';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';
import { getFechaArgentinaISO, getFechaHoraArgentinaISO } from '../utils/dateUtils';

interface ConfiguracionModuleProps {
  state: DatabaseState;
  currentUser: Usuario;
  spreadsheetId: string | null;
  onSpreadsheetIdChange: (id: string | null) => void;
  onStateUpdate: () => void;
  onOpenManual?: (term?: string, tab?: 'SISTEMA' | 'GLOSARIO') => void;
}

export const ConfiguracionModule: React.FC<ConfiguracionModuleProps> = ({
  state,
  currentUser,
  spreadsheetId,
  onSpreadsheetIdChange,
  onStateUpdate,
  onOpenManual,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'subunidades' | 'categorias' | 'insumos' | 'usuarios'>('sheets');

  // Input de Spreadsheet ID manual
  const [inputSheetId, setInputSheetId] = useState(spreadsheetId || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isNuevoInsumoModalOpen, setIsNuevoInsumoModalOpen] = useState(false);

  // Metadata en vivo de la vinculación con Google Sheets
  const [vinculacionMeta, setVinculacionMeta] = useState<SheetsVinculacionMetadata>(() => getSheetsVinculacionMetadata());

  useEffect(() => {
    const unsubscribe = subscribeToVinculacionMetadata(meta => {
      setVinculacionMeta(meta);
    });
    return () => unsubscribe();
  }, []);

  const handleCopySheetId = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (e) {
      console.warn('Error al copiar ID:', e);
    }
  };

  const handleVerificarConexion = async () => {
    const targetId = spreadsheetId || inputSheetId.trim();
    if (!targetId) {
      setStatusMsg({ type: 'error', text: 'Debe ingresar o vincular un ID de Google Spreadsheet primero.' });
      return;
    }
    setIsVerifying(true);
    setStatusMsg(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        try {
          const authRes = await googleSignIn();
          token = authRes?.accessToken || null;
        } catch (e) {}
      }
      const res = await verificarConexionGoogleSheets(token, targetId);
      setStatusMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Error al verificar conexión con Google Sheets',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDesvincularHoja = () => {
    if (confirm('¿Está seguro de desvincular la hoja de Google Sheets? El sistema continuará trabajando con la base local (LocalStorage) sin perder ningún dato.')) {
      setSavedSpreadsheetId(null);
      onSpreadsheetIdChange(null);
      setInputSheetId('');
      setStatusMsg({
        type: 'success',
        text: 'Hoja de Google Sheets desvinculada exitosamente.',
      });
    }
  };

  // Formulario Nueva Subunidad (Extensibilidad sin tocar código fuente - Sección 1)
  const [nuevaSubCodigo, setNuevaSubCodigo] = useState('');
  const [nuevaSubNombre, setNuevaSubNombre] = useState('');
  const [nuevaSubDesc, setNuevaSubDesc] = useState('');

  // 1. Crear nuevo Google Spreadsheet en Google Drive
  const handleCrearHojaGoogle = async () => {
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        // Pedir login interactivo de Google si falta token
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }

      if (!token) {
        throw new Error('Debe iniciar sesión con su cuenta de Google para crear la hoja en Google Drive.');
      }

      const res = await createERPGoogleSpreadsheet(token, 'ERP Ovinos - Pozo del Carril (UNRC)');
      onSpreadsheetIdChange(res.spreadsheetId);
      setInputSheetId(res.spreadsheetId);

      setStatusMsg({
        type: 'success',
        text: `¡Google Spreadsheet creado con éxito! ID: ${res.spreadsheetId}. Se inicializaron las 32 hojas normalizadas en su Google Drive.`,
      });
      onStateUpdate();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Error al conectar con Google Sheets API.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Vincular Sheet ID existente
  const handleVincularSheetExistente = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    let cleanId = inputSheetId.trim();
    // Extraer ID si pegó la URL completa
    if (cleanId.includes('/spreadsheets/d/')) {
      const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }

    if (!cleanId) {
      setStatusMsg({ type: 'error', text: 'Ingrese un ID o URL válida de Google Spreadsheet.' });
      return;
    }

    setSavedSpreadsheetId(cleanId);
    onSpreadsheetIdChange(cleanId);
    setInputSheetId(cleanId);
    setStatusMsg({
      type: 'success',
      text: `Archivo de Google Sheets vinculado (${cleanId}). Ahora puede sincronizar en ambos sentidos.`,
    });
  };

  // 3. Forzar sincronización desde Google Sheets (Pull)
  const handlePullDesdeGoogle = async () => {
    if (!spreadsheetId) {
      setStatusMsg({ type: 'error', text: 'No hay ningún Google Spreadsheet vinculado aún.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }
      if (!token) throw new Error('Se requiere autorización de Google');

      await pullAllDataFromGoogleSheets(token, spreadsheetId);
      setStatusMsg({
        type: 'success',
        text: 'Datos actualizados desde Google Sheets exitosamente.',
      });
      onStateUpdate();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al leer Google Sheets' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Volcar todo hacia Google Sheets (Push)
  const handlePushHaciaGoogle = async () => {
    if (!spreadsheetId) {
      setStatusMsg({ type: 'error', text: 'No hay ningún Google Spreadsheet vinculado.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }
      if (!token) throw new Error('Se requiere autorización de Google');

      await pushAllDataToGoogleSheets(token, spreadsheetId, state);
      setStatusMsg({
        type: 'success',
        text: 'Todos los registros locales fueron guardados en Google Sheets.',
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al escribir en Google Sheets' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Restablecer datos iniciales de fábrica
  const handleRestablecerFabrica = () => {
    if (confirm('¿Desea restablecer la base de datos al corte oficial de 81 cabezas de Pozo del Carril? Se limpiarán los movimientos de prueba.')) {
      const init = getInitialState();
      saveDatabaseState(init);
      onStateUpdate();
      setStatusMsg({
        type: 'success',
        text: 'Base de datos restaurada al inventario canónico: 81 cabezas al 30/08/2026 en LOT001.',
      });
    }
  };

  // 6. Agregar nueva subunidad dinámicamente (Sección 1)
  const handleCrearSubunidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaSubCodigo || !nuevaSubNombre) return;

    const nuevaSub: Subunidad = {
      id_subunidad: `SUB-${nuevaSubCodigo.toUpperCase()}`,
      id_unidad: 'UN-OVINOS',
      codigo: nuevaSubCodigo.toUpperCase(),
      nombre: nuevaSubNombre.trim(),
      descripcion: nuevaSubDesc.trim() || 'Subunidad adicional agregada dinámicamente',
      activo: true,
    };

    state.subunidades.push(nuevaSub);

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'subunidades',
      id_registro: nuevaSub.id_subunidad,
      valor_nuevo: JSON.stringify(nuevaSub),
      motivo: `Alta de nueva subunidad de gestión: ${nuevaSub.nombre}`,
    });

    saveDatabaseState(state);
    setNuevaSubCodigo('');
    setNuevaSubNombre('');
    setNuevaSubDesc('');
    setStatusMsg({
      type: 'success',
      text: `Subunidad "${nuevaSub.nombre}" creada y disponible en todo el sistema sin tocar código fuente.`,
    });
    onStateUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2.5">
          <Settings className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#f2fcf6]">Configuración del Sistema & Seguridad</h2>
          <BotonAyudaContextual moduloId="configuracion" onOpenManual={onOpenManual} />
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-[#264d3f] space-x-2 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sheets' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-[#a2c7b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Google Sheets Persistencia
        </button>
        <button
          onClick={() => setActiveTab('subunidades')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subunidades'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Subunidades Dinámicas
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categorias'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Categoría de animales
        </button>
        <button
          onClick={() => setActiveTab('insumos')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'insumos'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Catálogo Insumos
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'usuarios'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-[#a2c7b5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#183027]'
          }`}
        >
          Usuarios & Roles
        </button>
      </div>

      {/* Indicador de última modificación con persona, día y horario */}
      <SectionAuditBadge
        auditoriaList={state.auditoria}
        tablasAfectadas={['usuarios', 'subunidades', 'categorias', 'insumos', 'roles_permisos']}
        seccionNombre="Configuración & Maestros"
      />

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
            statusMsg.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* TAB 1: GOOGLE SHEETS */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          {/* PANEL DESTACADO: ESTADO Y HORARIO DE ÚLTIMA ACTUALIZACIÓN DE LA VINCULACIÓN */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Vinculación con Google Sheets
                    </h3>
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        vinculacionMeta.estado === 'CONECTADO'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : vinculacionMeta.estado === 'OFFLINE'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : vinculacionMeta.estado === 'ERROR'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          vinculacionMeta.estado === 'CONECTADO'
                            ? 'bg-emerald-400 animate-pulse'
                            : vinculacionMeta.estado === 'OFFLINE'
                            ? 'bg-cyan-400'
                            : vinculacionMeta.estado === 'ERROR'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        {vinculacionMeta.estado === 'CONECTADO'
                          ? 'CONECTADO'
                          : vinculacionMeta.estado === 'OFFLINE'
                          ? 'MODO LOCAL (OFFLINE)'
                          : vinculacionMeta.estado === 'ERROR'
                          ? 'ATENCIÓN REQUERIDA'
                          : 'SIN VINCULAR'}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Almacenamiento persistente en la nube (29 tablas normalizadas en Tercera Forma Normal)
                  </p>
                </div>
              </div>

              {/* Botones de acción rápida: Probar conexión y Desvincular */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleVerificarConexion}
                  disabled={isVerifying}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Verificar comunicación y acceso al Google Spreadsheet"
                >
                  <Activity className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                  <span>{isVerifying ? 'Verificando...' : 'Verificar Conexión Ahora'}</span>
                </button>

                {spreadsheetId && (
                  <button
                    type="button"
                    onClick={handleDesvincularHoja}
                    className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Desvincular hoja de cálculo actual"
                  >
                    <Unlink className="w-3.5 h-3.5 text-rose-400" />
                    <span>Desvincular</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fila de Métricas Clave de Vinculación: Fecha, Horario, Tipo de Operación y Tablas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. FECHA DE ÚLTIMA ACTUALIZACIÓN */}
              <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Fecha Última Act.
                  </span>
                  <span className="text-sm font-black font-mono text-white tabular-nums">
                    {vinculacionMeta.ultimaFecha || '-'}
                  </span>
                </div>
              </div>

              {/* 2. HORARIO DE ÚLTIMA ACTUALIZACIÓN */}
              <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Horario Oficial (ART)
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-400 tabular-nums">
                    {vinculacionMeta.ultimaHora || '-'}
                  </span>
                </div>
              </div>

              {/* 3. TIPO DE ÚLTIMA OPERACIÓN */}
              <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Tipo de Operación
                  </span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    {vinculacionMeta.tipoOperacion === 'VINCULACION'
                      ? 'Vínculo Registrado'
                      : vinculacionMeta.tipoOperacion === 'VERIFICACION'
                      ? 'Verificación en Vivo'
                      : vinculacionMeta.tipoOperacion === 'PULL'
                      ? 'Sheets → App (Pull)'
                      : vinculacionMeta.tipoOperacion === 'PUSH'
                      ? 'App → Sheets (Push)'
                      : vinculacionMeta.tipoOperacion === 'CREACION'
                      ? 'Creación en Drive'
                      : 'Desvinculado'}
                  </span>
                </div>
              </div>

              {/* 4. TOTAL TABLAS NORMALIZADAS */}
              <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Tablas Normalizadas
                  </span>
                  <span className="text-sm font-black font-mono text-amber-300">
                    {vinculacionMeta.tablasVerificadas || 29} / 29 Hojas
                  </span>
                </div>
              </div>
            </div>

            {/* Detalle del archivo vinculado: ID, Enlace directo y Mensaje del Sistema */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="font-semibold text-slate-400 shrink-0">Spreadsheet ID:</span>
                  {spreadsheetId ? (
                    <span className="font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate select-all">
                      {spreadsheetId}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">No hay archivo vinculado actualmente</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  <strong>Estado:</strong> {vinculacionMeta.mensaje || 'Listo para operar'}
                </p>
              </div>

              {spreadsheetId && (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopySheetId(spreadsheetId)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
                  </button>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Operaciones de Vinculación y Sincronización</h3>
                  <p className="text-slate-400">
                    Opciones para conectar su Google Drive o transferir datos
                  </p>
                </div>
              </div>

              {/* Crear automático */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2.5">
                <span className="font-bold text-white block">Opción 1: Crear nuevo Google Sheet en su Drive</span>
                <p className="text-slate-300 text-[11px]">
                  Crea un archivo nuevo estructurado automáticamente con las 29 hojas maestras y transaccionales con encabezados normalizados en snake_case.
                </p>
                <button
                  onClick={handleCrearHojaGoogle}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Procesando en Google...' : 'Crear Google Sheet con las 29 Tablas'}</span>
                </button>
              </div>

              {/* Vincular existente */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2.5">
                <span className="font-bold text-white block">Opción 2: Vincular hoja existente por ID o URL</span>
                <form onSubmit={handleVincularSheetExistente} className="space-y-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/... o ID"
                    value={inputSheetId}
                    onChange={e => setInputSheetId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Guardar Vínculo
                  </button>
                </form>
              </div>

              {/* Acciones de Sincronización */}
              {spreadsheetId && (
                <div className="pt-2 space-y-2">
                  <span className="font-bold text-slate-300 block">Sincronización Bidireccional Manual:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePullDesdeGoogle}
                      disabled={isProcessing}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-semibold flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>Sheets → App</span>
                    </button>
                    <button
                      onClick={handlePushHaciaGoogle}
                      disabled={isProcessing}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-semibold flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>App → Sheets</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    * Cada sincronización actualiza automáticamente la fecha y horario oficial registrado.
                  </p>
                </div>
              )}
            </div>

            {/* Información Técnica y Reset */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Estado del Motor y Almacenamiento</span>
              </h3>

              <div className="space-y-2 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-300">
                <p>• <strong>ID Vinculado:</strong> {spreadsheetId || 'Sin vincular (operando en memoria local)'}</p>
                <p>• <strong>Última Actualización / Vinculación:</strong> <span className="font-mono text-emerald-400 font-bold">{vinculacionMeta.ultimaFechaHoraCompleta}</span></p>
                <p>• <strong>Tipo de Última Operación:</strong> <span className="font-mono text-cyan-300 font-bold">{vinculacionMeta.tipoOperacion}</span></p>
                <p>• <strong>Tablas Normalizadas:</strong> 29 hojas estructuradas (3FN)</p>
                <p>• <strong>Idempotencia:</strong> Activa (Prevención de doble clic y reintentos)</p>
                <p>• <strong>Trazabilidad:</strong> Auditoría inmutable de todas las mutaciones</p>
              </div>

            {/* Panel de Service Worker & Caché Offline LocalStorage */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <span>Caché Local & Service Worker (Offline)</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isSimulatedOfflineForced()
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isSimulatedOfflineForced() ? 'Modo Offline Forzado' : 'En Línea / Caché Activa'}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <p>• <strong>Último Snapshot en LocalStorage:</strong> {getCacheMetadata().ultimoSnapshot}</p>
                <p>• <strong>Tablas en Caché:</strong> {getCacheMetadata().totalTablas} tablas sincronizadas</p>
                <p>• <strong>Mutaciones en Cola Offline:</strong> {getOfflineQueue().length} operaciones pendientes</p>
                <p className="text-[10px] text-slate-400">
                  Si no hay conexión a Google Sheets, el sistema sirve automáticamente los datos cargados previamente desde LocalStorage sin interrumpir el trabajo.
                </p>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const current = isSimulatedOfflineForced();
                    setSimulatedOfflineMode(!current);
                    onStateUpdate();
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                    isSimulatedOfflineForced()
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                      : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isSimulatedOfflineForced() ? (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Reconectar con Red</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Simular Corte de Conexión</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cacheStateSnapshot(state, spreadsheetId);
                    setStatusMsg({
                      type: 'success',
                      text: 'Instantánea de base de datos actualizada en el caché local del Service Worker.',
                    });
                  }}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  title="Respaldar estado actual en caché local"
                >
                  Guardar Snapshot
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="font-bold text-rose-400 mb-1">Zona de Mantenimiento Académico</h4>
              <p className="text-slate-400 text-[11px] mb-3">
                Restaura las existencias originales de Pozo del Carril (64 Madres, 2 Carneros, 15 Sin Clasificar = 81 cabezas) y limpia pruebas temporales.
              </p>
              <button
                onClick={handleRestablecerFabrica}
                className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Base Canónica (81 Cabezas)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* TAB 2: SUBUNIDADES DINÁMICAS */}
      {activeTab === 'subunidades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">Agregar Nueva Subunidad</h3>
            <p className="text-xs text-slate-400 mb-4">
              Requisito Sección 1: Crear nuevas subunidades sin modificar código fuente
            </p>

            <form onSubmit={handleCrearSubunidad} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Código (Ej: CABAÑA, INVERNADA)</label>
                <input
                  type="text"
                  value={nuevaSubCodigo}
                  onChange={e => setNuevaSubCodigo(e.target.value.toUpperCase())}
                  required
                  placeholder="CABANA"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  value={nuevaSubNombre}
                  onChange={e => setNuevaSubNombre(e.target.value)}
                  required
                  placeholder="Cabaña Ovina Pedigree"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción</label>
                <input
                  type="text"
                  value={nuevaSubDesc}
                  onChange={e => setNuevaSubDesc(e.target.value)}
                  placeholder="Objetivos productivos de la etapa"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                Dar de Alta Subunidad
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">Subunidades Activas en el Establecimiento</h3>
            <p className="text-xs text-slate-400 mb-4">Etapas de gestión y análisis para consolidación</p>

            <div className="space-y-2 text-xs">
              {state.subunidades.map(sub => (
                <div
                  key={sub.id_subunidad}
                  className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{sub.nombre}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {sub.codigo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub.descripcion}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">
                    Activa
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORÍAS */}
      {activeTab === 'categorias' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Categoría de animales</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Estructura biológica de las unidades productivas (Ovinos, Bovinos y Porcinos)</p>

          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3 rounded-l-[2px]">Código</th>
                <th className="py-2.5 px-3">Nombre</th>
                <th className="py-2.5 px-3">Subunidad</th>
                <th className="py-2.5 px-3">Género</th>
                <th className="py-2.5 px-3">Rango Edad</th>
                <th className="py-2.5 px-3 rounded-r-[2px]">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {state.categorias.map(cat => {
                const sub = state.subunidades.find(s => s.id_subunidad === cat.id_subunidad);
                return (
                  <tr key={cat.id_categoria} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{cat.codigo}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{cat.nombre}</td>
                    <td className="py-2.5 px-3 text-slate-400">{sub?.nombre}</td>
                    <td className="py-2.5 px-3 text-slate-300">{cat.genero}</td>
                    <td className="py-2.5 px-3 text-slate-400">{cat.edad_meses_min} a {cat.edad_meses_max} meses</td>
                    <td className="py-2.5 px-3">
                      {cat.es_reproductor ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Reproductor
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Engorde / Recría
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: INSUMOS */}
      {activeTab === 'insumos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">Catálogo Maestro de Insumos y Depósito Central</h3>
              <p className="text-slate-400">Control de stock físico, rubro sanitario/alimenticio y Precio Promedio Ponderado (PPP)</p>
            </div>
            {currentUser?.rol_nombre === 'ADMINISTRADOR' && (
              <button
                onClick={() => setIsNuevoInsumoModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer self-start sm:self-auto"
                title="Incorporar un nuevo insumo al catálogo oficial del establecimiento"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Incorporar Nuevo Insumo</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Código</th>
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Rubro</th>
                  <th className="py-2.5 px-3 text-right">Stock Actual</th>
                  <th className="py-2.5 px-3 text-right">Precio Promedio ($)</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  {currentUser?.rol_nombre === 'ADMINISTRADOR' && (
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.insumos.map(ins => (
                  <tr key={ins.id_insumo} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{ins.codigo}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{ins.nombre}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold">
                        {ins.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                      {ins.stock_actual} {ins.um_codigo}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                      ${ins.precio_promedio_ponderado.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          ins.activo !== false
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {ins.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {currentUser?.rol_nombre === 'ADMINISTRADOR' && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            ins.activo = ins.activo === false ? true : false;
                            saveDatabaseState(state);
                            onStateUpdate();
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            ins.activo !== false
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {ins.activo !== false ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: USUARIOS Y ROLES (INCORPORAR USUARIOS, EDITARLOS Y DEFINIR PERMISOS) */}
      {activeTab === 'usuarios' && (
        <UsuariosRolesManager
          state={state}
          currentUser={currentUser}
          onStateUpdate={onStateUpdate}
          setStatusMsg={setStatusMsg}
        />
      )}

      {/* Modal para que Administradores puedan incorporar insumos nuevos */}
      <NuevoInsumoModal
        isOpen={isNuevoInsumoModalOpen}
        onClose={() => setIsNuevoInsumoModalOpen(false)}
        state={state}
        currentUser={currentUser}
        onStateUpdate={() => {
          onStateUpdate();
          setStatusMsg({ type: 'success', text: 'Insumo incorporado exitosamente al catálogo del ERP.' });
        }}
      />
    </div>
  );
};

// Componente Especializado en Gestión de Usuarios, Roles y Permisos
interface UsuariosRolesManagerProps {
  state: DatabaseState;
  currentUser: Usuario;
  onStateUpdate: () => void;
  setStatusMsg: (msg: { type: 'error' | 'success'; text: string } | null) => void;
}

const UsuariosRolesManager: React.FC<UsuariosRolesManagerProps> = ({
  state,
  currentUser,
  onStateUpdate,
  setStatusMsg,
}) => {
  const [subSection, setSubSection] = useState<'lista_usuarios' | 'nuevo_usuario' | 'matriz_roles'>('lista_usuarios');

  // Estado para crear nuevo usuario
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRol, setNewRol] = useState<'ADMINISTRADOR' | 'RESPONSABLE_UNIDAD' | 'OPERADOR' | 'AUDITORIA'>('OPERADOR');
  const [newActivo, setNewActivo] = useState(true);
  const [newRequiereAprobacion, setNewRequiereAprobacion] = useState(false);

  // Filtro de estado de usuarios: Todos, Pendientes de Aprobación, Activos, Inactivos
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState<'TODOS' | 'PENDIENTES' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Estado para editar usuario existente
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Matriz de permisos conectada al servicio centralizado RBAC
  const [permMatrix, setPermMatrix] = useState(() => loadRolePermissions());

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newNombre) {
      setStatusMsg({ type: 'error', text: 'Complete los campos obligatorios para el usuario' });
      return;
    }

    if (state.usuarios.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setStatusMsg({ type: 'error', text: `El nombre de usuario "${newUsername}" ya existe` });
      return;
    }

    const idRolMap: Record<string, string> = {
      ADMINISTRADOR: 'ROL-ADMIN',
      RESPONSABLE_UNIDAD: 'ROL-RESP',
      OPERADOR: 'ROL-OPER',
      AUDITORIA: 'ROL-AUDIT',
    };

    const idUser = `USR-${Date.now()}`;
    const today = getFechaArgentinaISO();
    const nuevoUsuario: Usuario = {
      id_usuario: idUser,
      username: newUsername.trim(),
      password_hash: newPassword.trim(),
      nombre_completo: newNombre.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@unrc.edu.ar`,
      id_rol: idRolMap[newRol] || 'ROL-OPER',
      rol_nombre: newRol,
      activo: newRequiereAprobacion ? false : newActivo,
      inhabilitado: newRequiereAprobacion ? true : !newActivo,
      pendiente_aprobacion: newRequiereAprobacion,
      fecha_alta: today,
      fecha_modificacion: today,
    };

    state.usuarios.push(nuevoUsuario);

    // Auditoría
    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'ALTA',
      tabla_afectada: 'usuarios',
      id_registro: idUser,
      valor_nuevo: JSON.stringify({ username: nuevoUsuario.username, rol: nuevoUsuario.rol_nombre, activo: nuevoUsuario.activo }),
      motivo: `Incorporación de nuevo usuario: ${nuevoUsuario.nombre_completo} (@${nuevoUsuario.username}) con rol ${nuevoUsuario.rol_nombre}`,
    });

    saveDatabaseState(state);

    // También enviar al backend y persistir
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoUsuario,
          password: newPassword.trim(),
        }),
      });
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: state.usuarios }),
      });
    } catch (e) {}

    setStatusMsg({
      type: 'success',
      text: `Usuario @${nuevoUsuario.username} incorporado exitosamente con rol ${nuevoUsuario.rol_nombre}.`,
    });

    setNewUsername('');
    setNewPassword('');
    setNewNombre('');
    setNewEmail('');
    setSubSection('lista_usuarios');
    onStateUpdate();
  };

  const handleGuardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const user = state.usuarios.find(u => u.id_usuario === editingUser.id_usuario);
    if (!user) return;

    const prevRol = user.rol_nombre;
    const prevActivo = user.activo;

    user.nombre_completo = editingUser.nombre_completo;
    user.email = editingUser.email;
    user.rol_nombre = editingUser.rol_nombre;
    user.activo = editingUser.activo;
    user.inhabilitado = !editingUser.activo;
    if (editingUser.password_hash && editingUser.password_hash.trim() !== '') {
      user.password_hash = editingUser.password_hash.trim();
    }
    user.fecha_modificacion = getFechaArgentinaISO();

    const cambios: any[] = [];
    if (prevRol !== user.rol_nombre) {
      cambios.push({ campo: 'rol_nombre', etiqueta: 'Rol de Usuario', valor_anterior: prevRol, valor_nuevo: user.rol_nombre, tipo_dato: 'texto' });
    }
    if (prevActivo !== user.activo) {
      cambios.push({ campo: 'activo', etiqueta: 'Estado de Cuenta', valor_anterior: prevActivo, valor_nuevo: user.activo, tipo_dato: 'booleano' });
    }

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      nombre_usuario: currentUser.nombre_completo,
      rol_usuario: currentUser.rol_nombre,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'MODIFICACION',
      tabla_afectada: 'usuarios',
      id_registro: user.id_usuario,
      valor_anterior: JSON.stringify({ rol: prevRol, activo: prevActivo }),
      valor_nuevo: JSON.stringify({ rol: user.rol_nombre, activo: user.activo }),
      motivo: `Modificación de usuario @${user.username}: rol=${user.rol_nombre}, activo=${user.activo}`,
      cambios_campos: cambios.length > 0 ? cambios : undefined,
    });

    saveDatabaseState(state);

    try {
      await fetch(`/api/users/${user.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingUser,
          inhabilitado: !editingUser.activo,
          password: editingUser.password_hash,
        }),
      });
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: state.usuarios }),
      });
    } catch (e) {}

    setStatusMsg({
      type: 'success',
      text: `Usuario @${user.username} actualizado exitosamente.`,
    });
    setEditingUser(null);
    onStateUpdate();
  };

  const handleToggleActivoUsuario = async (userId: string, nuevoEstado: boolean) => {
    const user = state.usuarios.find(u => u.id_usuario === userId);
    if (!user) return;

    if (user.username.toLowerCase() === 'admin' && !nuevoEstado) {
      setStatusMsg({ type: 'error', text: 'Seguridad: No se puede deshabilitar la cuenta del Administrador (@admin).' });
      return;
    }

    user.activo = nuevoEstado;
    user.inhabilitado = !nuevoEstado;
    user.fecha_modificacion = getFechaArgentinaISO();

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      nombre_usuario: currentUser.nombre_completo,
      rol_usuario: currentUser.rol_nombre,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'MODIFICACION',
      tabla_afectada: 'usuarios',
      id_registro: user.id_usuario,
      valor_anterior: JSON.stringify({ activo: !nuevoEstado }),
      valor_nuevo: JSON.stringify({ activo: nuevoEstado }),
      motivo: `${nuevoEstado ? 'Habilitación' : 'Deshabilitación'} de acceso para usuario @${user.username} (${user.nombre_completo})`,
      cambios_campos: [
        {
          campo: 'activo',
          etiqueta: 'Estado de Cuenta',
          valor_anterior: !nuevoEstado,
          valor_nuevo: nuevoEstado,
          tipo_dato: 'booleano',
        },
      ],
    });

    state.usuarios = [...state.usuarios];
    saveDatabaseState(state);

    try {
      await fetch(`/api/users/toggle-active/${user.id_usuario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado, password: user.password_hash }),
      });
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: state.usuarios }),
      });
    } catch (e) {
      console.warn('Error al persistir toggle de usuario en backend:', e);
    }

    setStatusMsg({
      type: 'success',
      text: `Usuario @${user.username} ${nuevoEstado ? 'HABILITADO' : 'DESHABILITADO'} correctamente. Puede acceder de inmediato con sus credenciales.`,
    });
    onStateUpdate();
  };

  const handleAprobarUsuario = async (userId: string) => {
    const user = state.usuarios.find(u => u.id_usuario === userId);
    if (!user) return;
    user.pendiente_aprobacion = false;
    user.activo = true;
    user.inhabilitado = false;
    user.fecha_modificacion = getFechaArgentinaISO();

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      nombre_usuario: currentUser.nombre_completo,
      rol_usuario: currentUser.rol_nombre,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'MODIFICACION',
      tabla_afectada: 'usuarios',
      id_registro: user.id_usuario,
      valor_anterior: JSON.stringify({ pendiente_aprobacion: true, activo: false }),
      valor_nuevo: JSON.stringify({ pendiente_aprobacion: false, activo: true }),
      motivo: `Aprobación formal de cuenta de usuario @${user.username} (${user.nombre_completo}) por Administrador @${currentUser.username}`,
    });

    state.usuarios = [...state.usuarios];
    saveDatabaseState(state);

    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: state.usuarios }),
      });
    } catch (e) {}

    setStatusMsg({
      type: 'success',
      text: `Cuenta de @${user.username} APROBADA y habilitada exitosamente.`,
    });
    onStateUpdate();
  };

  const handleRechazarUsuario = async (userId: string) => {
    const user = state.usuarios.find(u => u.id_usuario === userId);
    if (!user) return;
    user.pendiente_aprobacion = true;
    user.activo = false;
    user.inhabilitado = true;
    user.fecha_modificacion = getFechaArgentinaISO();

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      nombre_usuario: currentUser.nombre_completo,
      rol_usuario: currentUser.rol_nombre,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'MODIFICACION',
      tabla_afectada: 'usuarios',
      id_registro: user.id_usuario,
      valor_anterior: JSON.stringify({ activo: true }),
      valor_nuevo: JSON.stringify({ pendiente_aprobacion: true, activo: false, inhabilitado: true }),
      motivo: `Suspensión o rechazo de cuenta para @${user.username} (${user.nombre_completo}) por Administrador @${currentUser.username}`,
    });

    state.usuarios = [...state.usuarios];
    saveDatabaseState(state);

    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: state.usuarios }),
      });
    } catch (e) {}

    setStatusMsg({
      type: 'success',
      text: `Cuenta de @${user.username} rechazada / suspendida.`,
    });
    onStateUpdate();
  };

  const togglePermission = (role: string, module: string, action: string) => {
    if (module === 'contabilidad' && role !== 'ADMINISTRADOR') {
      setStatusMsg({
        type: 'error',
        text: 'La normativa contable RT 54 es de acceso exclusivo para el rol ADMINISTRADOR.',
      });
      return;
    }

    const updated = { ...permMatrix };
    if (!updated[role]) updated[role] = {};
    if (!updated[role][module]) updated[role][module] = {};
    updated[role][module][action] = !updated[role][module][action];
    setPermMatrix(updated);
    saveRolePermissions(updated);

    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      nombre_usuario: currentUser.nombre_completo,
      rol_usuario: currentUser.rol_nombre,
      fecha_hora: getFechaHoraArgentinaISO(),
      operacion: 'MODIFICACION',
      tabla_afectada: 'roles_permisos',
      id_registro: `${role}-${module}-${action}`,
      valor_anterior: JSON.stringify({ permitido: !updated[role][module][action] }),
      valor_nuevo: JSON.stringify({ role, module, action, permitido: updated[role][module][action] }),
      motivo: `Actualización de permiso RBAC: Rol ${role} en módulo ${module} (${action}) = ${updated[role][module][action]}`,
      cambios_campos: [
        {
          campo: 'permitido',
          etiqueta: `Permiso ${module} (${action})`,
          valor_anterior: !updated[role][module][action],
          valor_nuevo: updated[role][module][action],
          tipo_dato: 'booleano',
        },
      ],
    });
    saveDatabaseState(state);

    setStatusMsg({
      type: 'success',
      text: `Permiso actualizado para rol ${role} en módulo ${module} (${action}). El acceso se adapta inmediatamente en toda la app.`,
    });
    onStateUpdate();
  };

  const handleEliminarUsuario = async (userId: string) => {
    const user = state.usuarios.find(u => u.id_usuario === userId);
    if (!user) return;

    if (user.username.toLowerCase() === 'admin') {
      setStatusMsg({ type: 'error', text: 'Seguridad: No se puede eliminar la cuenta principal de Administrador (@admin).' });
      return;
    }

    if (user.id_usuario === currentUser.id_usuario) {
      setStatusMsg({ type: 'error', text: 'No puede eliminar su propia cuenta en uso activo. Cambie de usuario primero.' });
      return;
    }

    if (!confirm(`¿Confirma eliminar definitivamente la cuenta de @${user.username} (${user.nombre_completo})? Esta acción se registrará en la auditoría inmutable con fecha y horario exacto.`)) {
      return;
    }

    const index = state.usuarios.findIndex(u => u.id_usuario === userId);
    if (index !== -1) {
      state.usuarios.splice(index, 1);
    }

    const now = getFechaHoraArgentinaISO();
    state.auditoria.unshift({
      id_auditoria: `AUD-${Date.now()}`,
      id_usuario: currentUser.id_usuario,
      username: currentUser.username,
      fecha_hora: now,
      operacion: 'ANULACION',
      tabla_afectada: 'usuarios',
      id_registro: userId,
      valor_anterior: JSON.stringify({ username: user.username, nombre: user.nombre_completo, rol: user.rol_nombre }),
      valor_nuevo: JSON.stringify({ eliminado: true }),
      motivo: `Eliminación definitiva de cuenta de usuario @${user.username} (${user.nombre_completo}) realizada por @${currentUser.username} el ${now}`,
    });

    saveDatabaseState(state);

    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: state.usuarios }),
      });
    } catch (e) {}

    setStatusMsg({
      type: 'success',
      text: `Cuenta de usuario @${user.username} eliminada permanentemente del sistema y registrada en Auditoría.`,
    });
    setEditingUser(null);
    onStateUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Sub-navegación dentro de Usuarios & Roles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSubSection('lista_usuarios')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subSection === 'lista_usuarios' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Usuarios Activos e Inactivos
          </button>
          <button
            onClick={() => setSubSection('nuevo_usuario')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              subSection === 'nuevo_usuario' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Incorporar Usuario</span>
          </button>
          <button
            onClick={() => setSubSection('matriz_roles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              subSection === 'matriz_roles' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Definir Roles y Permisos (RBAC)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Total: <strong>{state.usuarios.length} usuarios registrados</strong>
        </span>
      </div>

      {/* SECCIÓN 1: LISTADO DE USUARIOS Y CONTROL DE ESTADO */}
      {subSection === 'lista_usuarios' && (() => {
        const pendientesCount = state.usuarios.filter(u => u.pendiente_aprobacion === true).length;
        const activosCount = state.usuarios.filter(u => u.activo === true && !u.pendiente_aprobacion).length;
        const inactivosCount = state.usuarios.filter(u => !u.activo && !u.pendiente_aprobacion).length;

        const usuariosFiltrados = state.usuarios.filter(u => {
          if (filtroEstadoUsuario === 'PENDIENTES') return u.pendiente_aprobacion === true;
          if (filtroEstadoUsuario === 'ACTIVOS') return u.activo === true && !u.pendiente_aprobacion;
          if (filtroEstadoUsuario === 'INACTIVOS') return !u.activo && !u.pendiente_aprobacion;
          return true;
        });

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Nómina y Aprobación de Usuarios del ERP</span>
                  {pendientesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] animate-pulse">
                      {pendientesCount} por aprobar
                    </span>
                  )}
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Control de altas, aprobaciones formales, bajas y asignación de permisos RBAC
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSubSection('nuevo_usuario')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>
            </div>

            {/* Filtros de Estado */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setFiltroEstadoUsuario('TODOS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroEstadoUsuario === 'TODOS'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Todos ({state.usuarios.length})
              </button>
              <button
                onClick={() => setFiltroEstadoUsuario('PENDIENTES')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  filtroEstadoUsuario === 'PENDIENTES'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <span>⏳ Pendientes de Aprobación</span>
                <span className="px-1.5 py-0.2 bg-amber-500/30 rounded text-[10px] font-mono">
                  {pendientesCount}
                </span>
              </button>
              <button
                onClick={() => setFiltroEstadoUsuario('ACTIVOS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroEstadoUsuario === 'ACTIVOS'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Activos ({activosCount})
              </button>
              <button
                onClick={() => setFiltroEstadoUsuario('INACTIVOS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroEstadoUsuario === 'INACTIVOS'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Inactivos / Bloqueados ({inactivosCount})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Usuario</th>
                    <th className="py-2.5 px-3">Nombre Completo</th>
                    <th className="py-2.5 px-3">Email Institucional</th>
                    <th className="py-2.5 px-3">Rol Asignado</th>
                    <th className="py-2.5 px-3">Fecha y Horario</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usuariosFiltrados.map(u => (
                    <tr key={u.id_usuario} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">@{u.username}</td>
                      <td className="py-3 px-3 font-semibold text-white">{u.nombre_completo}</td>
                      <td className="py-3 px-3 text-slate-400">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-slate-200">
                          {u.rol_nombre}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {u.fecha_modificacion || u.fecha_alta}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {u.pendiente_aprobacion ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            ⏳ Pendiente Aprobación
                          </span>
                        ) : u.activo ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            ✅ Activo
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                            ⛔ Inactivo (Bloqueado)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Flujo de Aprobación */}
                          {u.pendiente_aprobacion && (
                            <>
                              <button
                                onClick={() => handleAprobarUsuario(u.id_usuario)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                                title="Aprobar cuenta y otorgar acceso de inmediato"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Aprobar</span>
                              </button>
                              <button
                                onClick={() => handleRechazarUsuario(u.id_usuario)}
                                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-xs"
                                title="Rechazar cuenta"
                              >
                                Rechazar
                              </button>
                            </>
                          )}

                          {!u.pendiente_aprobacion && u.username.toLowerCase() !== 'admin' && (
                            <button
                              onClick={() => handleToggleActivoUsuario(u.id_usuario, !u.activo)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                u.activo
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-950/40 border border-rose-500/80'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/40 border border-emerald-500/80'
                              }`}
                              title={u.activo ? 'Deshabilitar acceso al sistema de inmediato' : 'Habilitar acceso al sistema de inmediato'}
                            >
                              {u.activo ? 'Deshabilitar' : 'Habilitar Acceso'}
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUser({ ...u })}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Editar datos, rol o estado"
                          >
                            Editar
                          </button>
                          {u.username.toLowerCase() !== 'admin' && u.id_usuario !== currentUser.id_usuario && (
                            <button
                              onClick={() => handleEliminarUsuario(u.id_usuario)}
                              className="p-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 hover:text-red-200 border border-red-800/50 rounded-lg transition-colors cursor-pointer"
                              title={`Eliminar permanentemente la cuenta de @${u.username}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* SECCIÓN 2: FORMULARIO INCORPORAR NUEVO USUARIO */}
      {subSection === 'nuevo_usuario' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-xl text-xs">
          <h3 className="text-sm font-bold text-white mb-1">Incorporar Nuevo Usuario al ERP</h3>
          <p className="text-slate-400 mb-4">
            Defina credenciales, nombre, rol y circuito de aprobación.
          </p>

          <form onSubmit={handleCrearUsuario} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase().trim())}
                  required
                  placeholder="ej: veterinario_campo"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nombre Completo y Cargo</label>
              <input
                type="text"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                required
                placeholder="Dr. Juan Perez - Asesor Zootécnico"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Institucional</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="usuario@unrc.edu.ar"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rol a Asignar</label>
                <select
                  value={newRol}
                  onChange={e => setNewRol(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="ADMINISTRADOR">👑 Administrador (Acceso Total)</option>
                  <option value="RESPONSABLE_UNIDAD">🧑‍🌾 Responsable de Unidad (Gestión)</option>
                  <option value="OPERADOR">📋 Operador (Carga de Campo)</option>
                  <option value="AUDITORIA">🔍 Consulta / Auditoría (Solo Lectura)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estado Inicial</label>
                <select
                  value={newActivo ? 'true' : 'false'}
                  onChange={e => setNewActivo(e.target.value === 'true')}
                  disabled={newRequiereAprobacion}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold disabled:opacity-50"
                >
                  <option value="true">✅ Activo (Habilitado)</option>
                  <option value="false">⛔ Inactivo (Bloqueado)</option>
                </select>
              </div>
            </div>

            {/* Checkbox para circuito de aprobación */}
            <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequiereAprobacion}
                  onChange={e => {
                    setNewRequiereAprobacion(e.target.checked);
                    if (e.target.checked) setNewActivo(false);
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-slate-200 font-medium">
                  Marcar como <strong>Pendiente de Aprobación</strong> (el usuario no podrá ingresar hasta que el Administrador valide la cuenta).
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Guardar e Incorporar Usuario
              </button>
              <button
                type="button"
                onClick={() => setSubSection('lista_usuarios')}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECCIÓN 3: MATRIZ DE DEFINICIÓN DE ROLES Y PERMISOS DINÁMICA */}
      {subSection === 'matriz_roles' && (() => {
        // Aplanar los módulos del sistema y sus acciones para construir la matriz completa
        const todosLosPermisos = MODULOS_SISTEMA.flatMap(mod =>
          mod.acciones.map(act => ({
            id: mod.id,
            nombre: mod.nombre,
            descripcion: mod.descripcion,
            action: act.id,
            actionLabel: act.label,
            isExclusiveAdmin: mod.id === 'contabilidad',
          }))
        );

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Matriz de Definición de Roles y Permisos Granulares (RBAC)</span>
              </h3>
              <p className="text-slate-400 mt-0.5">
                Configure qué módulos o apartados puede ver o ejecutar cada rol. Los cambios impactan en vivo en el menú y en las rutas del sistema.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3 rounded-l-lg">Módulo del Sistema & Acción</th>
                    <th className="py-3 px-3 text-center">👑 Administrador</th>
                    <th className="py-3 px-3 text-center">🧑‍🌾 Responsable de Unidad</th>
                    <th className="py-3 px-3 text-center">📋 Operador de Campo</th>
                    <th className="py-3 px-3 text-center rounded-r-lg">🔍 Consulta / Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {todosLosPermisos.map((item, idx) => {
                    const adminAllowed = permMatrix['ADMINISTRADOR']?.[item.id]?.[item.action] ?? true;
                    const respAllowed = permMatrix['RESPONSABLE_UNIDAD']?.[item.id]?.[item.action] ?? false;
                    const operAllowed = permMatrix['OPERADOR']?.[item.id]?.[item.action] ?? false;
                    const auditAllowed = permMatrix['AUDITORIA']?.[item.id]?.[item.action] ?? false;

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">{item.nombre}:</span>
                            <span className="text-slate-300">{item.actionLabel}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {item.action}
                            </span>
                            {item.isExclusiveAdmin && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                🔒 Exclusivo Administrador
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Administrador */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => togglePermission('ADMINISTRADOR', item.id, item.action)}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs cursor-pointer transition-colors ${
                              adminAllowed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-600'
                            }`}
                            title="Alternar permiso para Administrador"
                          >
                            {adminAllowed ? '✓' : '✗'}
                          </button>
                        </td>

                        {/* Responsable de Unidad */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => togglePermission('RESPONSABLE_UNIDAD', item.id, item.action)}
                            disabled={item.isExclusiveAdmin}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs transition-colors ${
                              item.isExclusiveAdmin
                                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-40'
                                : respAllowed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-pointer'
                                : 'bg-slate-800 text-slate-600 cursor-pointer'
                            }`}
                            title={item.isExclusiveAdmin ? 'Módulo reservado a Administradores' : 'Alternar permiso para Responsable de Unidad'}
                          >
                            {item.isExclusiveAdmin ? '🔒' : respAllowed ? '✓' : '✗'}
                          </button>
                        </td>

                        {/* Operador */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => togglePermission('OPERADOR', item.id, item.action)}
                            disabled={item.isExclusiveAdmin}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs transition-colors ${
                              item.isExclusiveAdmin
                                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-40'
                                : operAllowed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-pointer'
                                : 'bg-slate-800 text-slate-600 cursor-pointer'
                            }`}
                            title={item.isExclusiveAdmin ? 'Módulo reservado a Administradores' : 'Alternar permiso para Operador'}
                          >
                            {item.isExclusiveAdmin ? '🔒' : operAllowed ? '✓' : '✗'}
                          </button>
                        </td>

                        {/* Auditoría */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => togglePermission('AUDITORIA', item.id, item.action)}
                            disabled={item.isExclusiveAdmin}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs transition-colors ${
                              item.isExclusiveAdmin
                                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-40'
                                : auditAllowed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-pointer'
                                : 'bg-slate-800 text-slate-600 cursor-pointer'
                            }`}
                            title={item.isExclusiveAdmin ? 'Módulo reservado a Administradores' : 'Alternar permiso para Auditoría'}
                          >
                            {item.isExclusiveAdmin ? '🔒' : auditAllowed ? '✓' : '✗'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE EDICIÓN DE USUARIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 text-xs">
            <h3 className="text-base font-bold text-white mb-1">
              Editar Usuario @{editingUser.username}
            </h3>
            <p className="text-slate-400 mb-4">
              Modifique el rol asignado, actualice datos o active/desactive el usuario.
            </p>

            <form onSubmit={handleGuardarEdicionUsuario} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editingUser.nombre_completo}
                  onChange={e => setEditingUser({ ...editingUser, nombre_completo: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Institucional</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rol Asignado</label>
                <select
                  value={editingUser.rol_nombre}
                  onChange={e => setEditingUser({ ...editingUser, rol_nombre: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="ADMINISTRADOR">👑 Administrador (Acceso Total)</option>
                  <option value="RESPONSABLE_UNIDAD">🧑‍🌾 Responsable de Unidad (Gestión)</option>
                  <option value="OPERADOR">📋 Operador (Carga de Campo)</option>
                  <option value="AUDITORIA">🔍 Consulta / Auditoría (Solo Lectura)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estado de Acceso</label>
                <select
                  value={editingUser.activo ? 'true' : 'false'}
                  onChange={e => setEditingUser({ ...editingUser, activo: e.target.value === 'true' })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="true">✅ Activo (Puede ingresar al ERP)</option>
                  <option value="false">⛔ Inactivo (Bloqueado en login de servidor)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  onChange={e => setEditingUser({ ...editingUser, password_hash: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
                {editingUser.username.toLowerCase() !== 'admin' && editingUser.id_usuario !== currentUser.id_usuario && (
                  <button
                    type="button"
                    onClick={() => handleEliminarUsuario(editingUser.id_usuario)}
                    className="px-3 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-1"
                    title="Eliminar esta cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Cuenta</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

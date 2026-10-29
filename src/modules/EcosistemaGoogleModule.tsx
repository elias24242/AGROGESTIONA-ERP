import React, { useState } from 'react';
import { Usuario } from '../types/erp';
import {
  Calendar,
  Mail,
  FileSpreadsheet,
  HardDrive,
  Send,
  Plus,
  ExternalLink,
  Clock,
  MapPin,
  CheckCircle2,
  Bookmark,
  Share2,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  CalendarCheck,
  Tag
} from 'lucide-react';
import { BotonAyudaContextual } from '../components/BotonAyudaContextual';

interface EcosistemaGoogleModuleProps {
  currentUser: Usuario;
  spreadsheetId?: string | null;
  onOpenManual?: (term?: string) => void;
  isLightMode?: boolean;
}

interface EventoGanadero {
  id: string;
  titulo: string;
  tipo: 'SANIDAD' | 'MANEJO' | 'COMERCIAL' | 'CONTABLE' | 'SENASA';
  especie: 'Ovinos' | 'Bovinos' | 'Porcinos' | 'General';
  fecha: string;
  hora: string;
  duracionHoras: number;
  descripcion: string;
  lugar: string;
  estado: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO';
}

interface PlantillaMail {
  id: string;
  nombre: string;
  destinatarioDefault: string;
  asunto: string;
  cuerpo: string;
  categoria: 'VETERINARIA' | 'DIRECCION_UNRC' | 'CONSIGNATARIA' | 'PROVEEDORES';
}

export const EcosistemaGoogleModule: React.FC<EcosistemaGoogleModuleProps> = ({
  currentUser,
  spreadsheetId,
  onOpenManual,
  isLightMode = false,
}) => {
  const [tabActiva, setTabActiva] = useState<'calendar' | 'gmail' | 'workspace'>('calendar');

  // Eventos ganaderos precargados con fechas de campaña
  const [eventos, setEventos] = useState<EventoGanadero[]>([
    {
      id: 'EVT-001',
      titulo: 'Campaña Vacunación Aftosa y Carbunclo (Bovinos)',
      tipo: 'SANIDAD',
      especie: 'Bovinos',
      fecha: '2026-11-05',
      hora: '08:00',
      duracionHoras: 4,
      descripcion: 'Vacunación preventiva obligatoria SENASA en mangas de Pozo del Carril. Honorarios veterinarios UNRC.',
      lugar: 'Manga Principal, Pozo del Carril',
      estado: 'PROGRAMADO',
    },
    {
      id: 'EVT-002',
      titulo: 'Destete y Traslado de Lechones (31 días)',
      tipo: 'MANEJO',
      especie: 'Porcinos',
      fecha: '2026-11-10',
      hora: '07:30',
      duracionHoras: 3,
      descripcion: 'Pasaje de fase Cría (0-15 kg) a fase Destete (15-50 kg). Transferencia de costos acumulados y pesaje testigo.',
      lugar: 'Parideras y Pistas de Destete',
      estado: 'PROGRAMADO',
    },
    {
      id: 'EVT-003',
      titulo: 'Pesaje Mensual Lotes Ovinos & Clasificación Dorper',
      tipo: 'MANEJO',
      especie: 'Ovinos',
      fecha: '2026-11-15',
      hora: '09:00',
      duracionHoras: 3,
      descripcion: 'Control de ganancia diaria de peso (GDP), estado de condición corporal de borregas y carneros.',
      lugar: 'Corrales Ovinos La Aguada',
      estado: 'PROGRAMADO',
    },
    {
      id: 'EVT-004',
      titulo: 'Emisión DTe SENASA y Venta 15 Novillos a Frigorífico',
      tipo: 'COMERCIAL',
      especie: 'Bovinos',
      fecha: '2026-11-20',
      hora: '06:00',
      duracionHoras: 5,
      descripcion: 'Carga en camión jaula compartido. 15 novillos x 450 kg terminados. VNR estimado $28.053.034,68.',
      lugar: 'Báscula y Embarcadero Pozo del Carril',
      estado: 'PROGRAMADO',
    },
    {
      id: 'EVT-005',
      titulo: 'Cierre Mensual RT 54 y Valuación al VNR',
      tipo: 'CONTABLE',
      especie: 'General',
      fecha: '2026-11-30',
      hora: '17:00',
      duracionHoras: 2,
      descripcion: 'Medición periódica de activos biológicos en producción y existencias para comercialización.',
      lugar: 'Oficina de Administración UNRC',
      estado: 'PROGRAMADO',
    },
  ]);

  // Formulario nuevo evento
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('2026-11-25');
  const [nuevaHora, setNuevaHora] = useState('08:00');
  const [nuevaEspecie, setNuevaEspecie] = useState<'Ovinos' | 'Bovinos' | 'Porcinos' | 'General'>('Bovinos');
  const [nuevoTipo, setNuevoTipo] = useState<'SANIDAD' | 'MANEJO' | 'COMERCIAL' | 'CONTABLE' | 'SENASA'>('SANIDAD');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevoLugar, setNuevoLugar] = useState('Pozo del Carril – La Aguada');
  const [showFormEvento, setShowFormEvento] = useState(false);

  // Plantillas de Correo Electrónico para gestión ganadera
  const plantillasMail: PlantillaMail[] = [
    {
      id: 'PL-01',
      nombre: 'Parte Diario Ganadero a Dirección UNRC',
      destinatarioDefault: 'taller2@unrc.edu.ar',
      categoria: 'DIRECCION_UNRC',
      asunto: 'AGROGESTIONA ERP — Parte Diario Operativo Pozo del Carril',
      cuerpo: `Estimada Dirección del Establecimiento Pozo del Carril – La Aguada,

Por medio del presente se remite el resumen operativo de la jornada:
- Stock Activo Ganadero: 170 cabezas (18 Ovinos, 27 Bovinos, 125 Porcinos).
- Estado Sanitario: Sin novedades clínicas adversas; protocolos al día.
- Consumo de Raciones: Maíz y concentrado en parámetros estándar de conversión.
- Novedades de Campo: Manga e instalaciones perimetrales en correcto estado.

Sincronizado automáticamente desde AGROGESTIONA ERP.
Operador a cargo: ${currentUser.nombre_completo} (${currentUser.rol_nombre})`,
    },
    {
      id: 'PL-02',
      nombre: 'Solicitud de Intervención Veterinaria (UNRC)',
      destinatarioDefault: 'veterinaria.practicas@unrc.edu.ar',
      categoria: 'VETERINARIA',
      asunto: 'Solicitud de Asistencia Veterinaria — Unidad Ganadera Pozo del Carril',
      cuerpo: `Estimados Profesionales Veterinarios UNRC,

Se solicita su presencia o supervisión para el siguiente protocolo sanitario en el establecimiento:
- Unidad / Especie: [Indicar Especie: Ovinos / Bovinos / Porcinos]
- Actividad: Vacunación preventiva / Revisión reproductiva / Tacto
- Lote / Caravana: Lote de recría en pasturas
- Fecha prevista: [Indicar Fecha]

El stock de insumos veterinarios (jeringas, antisépticos y vacunas) se encuentra disponible en botiquín de campo.
Quedamos a la espera de su confirmación de visita.`,
    },
    {
      id: 'PL-03',
      nombre: 'Orden de Flete y Aviso de Carga a Transportista Jaula',
      destinatarioDefault: 'flete.ganadero@cordoba.com.ar',
      categoria: 'CONSIGNATARIA',
      asunto: 'Aviso de Carga y Flete Ganadero Compartido — Pozo del Carril',
      cuerpo: `Estimado transportista,

Se confirma la reserva de espacio en camión jaula compartido para el traslado de hacienda:
- Origen: Embarcadero Pozo del Carril – La Aguada (Ruta 36, Río Cuarto).
- Destino: Frigorífico / Mercado Concentrador.
- Cantidad de animales: 15 novillos terminados (peso estimado 450 kg/cabeza).
- DTe SENASA y guía de traslado: En trámite y disponibles previo a la carga.
- Hora de carga solicitada: 06:00 hs.

Agradecemos confirmar disponibilidad de la unidad.`,
    },
  ];

  const [mailSeleccionado, setMailSeleccionado] = useState<PlantillaMail>(plantillasMail[0]);
  const [destinatario, setDestinatario] = useState(plantillasMail[0].destinatarioDefault);
  const [asunto, setAsunto] = useState(plantillasMail[0].asunto);
  const [cuerpo, setCuerpo] = useState(plantillasMail[0].cuerpo);

  const handleSeleccionarPlantilla = (p: PlantillaMail) => {
    setMailSeleccionado(p);
    setDestinatario(p.destinatarioDefault);
    setAsunto(p.asunto);
    setCuerpo(p.cuerpo);
  };

  const handleCrearEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;

    const nuevo: EventoGanadero = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      titulo: nuevoTitulo.trim(),
      tipo: nuevoTipo,
      especie: nuevaEspecie,
      fecha: nuevaFecha,
      hora: nuevaHora,
      duracionHoras: 2,
      descripcion: nuevaDesc.trim() || 'Actividad programada en AGROGESTIONA ERP',
      lugar: nuevoLugar.trim(),
      estado: 'PROGRAMADO',
    };

    setEventos([nuevo, ...eventos]);
    setNuevoTitulo('');
    setNuevaDesc('');
    setShowFormEvento(false);
  };

  // Generar URL directa de Google Calendar
  const generarGoogleCalendarUrl = (ev: EventoGanadero) => {
    const fechaLimpia = ev.fecha.replace(/-/g, '');
    const horaLimpia = ev.hora.replace(/:/g, '') + '00';
    const horaFin = (parseInt(ev.hora.split(':')[0]) + ev.duracionHoras).toString().padStart(2, '0') + ev.hora.split(':')[1] + '00';
    const dates = `${fechaLimpia}T${horaLimpia}/${fechaLimpia}T${horaFin}`;
    const text = encodeURIComponent(`[AGROGESTIONA] ${ev.titulo}`);
    const details = encodeURIComponent(`${ev.descripcion}\n\nEspecie: ${ev.especie}\nTipo: ${ev.tipo}\nEstablecimiento: ${ev.lugar}`);
    const location = encodeURIComponent(ev.lugar);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  };

  // Generar URL directa para redactar en Gmail
  const generarGmailUrl = () => {
    const to = encodeURIComponent(destinatario);
    const su = encodeURIComponent(asunto);
    const body = encodeURIComponent(cuerpo);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
  };

  return (
    <div className="space-y-5 m3-view-enter">
      {/* Cabecera del Módulo con Iconografía y Accesos Rápidos */}
      <div className={`p-4 sm:p-5 border rounded-[2px] transition-colors ${
        isLightMode
          ? 'bg-white border-slate-300 shadow-xs'
          : 'bg-[#12241d] border-[#264d3f] text-[#f2fcf6]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[2px] bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Ecosistema Google Workspace Ganadero
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  Integración 1P
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-[#a2c7b5]'}`}>
                Sincronización de calendario zootécnico, redacción de partes diarios en Gmail y vinculación con Google Drive & Sheets.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <BotonAyudaContextual moduloId="configuracion" onOpenManual={onOpenManual} />
          </div>
        </div>

        {/* Pestañas Superiores */}
        <div className="flex items-center space-x-1.5 mt-4 pt-3 border-t border-black/5 dark:border-white/5">
          <button
            onClick={() => setTabActiva('calendar')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              tabActiva === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#183027] text-[#a2c7b5] hover:bg-[#1f3d32] hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Google Calendar Ganadero</span>
          </button>

          <button
            onClick={() => setTabActiva('gmail')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              tabActiva === 'gmail'
                ? 'bg-rose-600 text-white shadow-xs'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#183027] text-[#a2c7b5] hover:bg-[#1f3d32] hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail & Partes Operativos</span>
          </button>

          <button
            onClick={() => setTabActiva('workspace')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              tabActiva === 'workspace'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#181818] text-neutral-300 hover:bg-[#222222]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Drive, Sheets & Docs</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: GOOGLE CALENDAR GANADERO */}
      {tabActiva === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isLightMode ? 'text-slate-800' : 'text-neutral-200'}`}>
                Cronograma Zootécnico & Sanitario
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                Eventos programados de campo listos para agendar en tu Google Calendar personal o de equipo.
              </p>
            </div>
            <button
              onClick={() => setShowFormEvento(!showFormEvento)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-[2px] transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showFormEvento ? 'Cerrar Formulario' : 'Nuevo Evento Ganadero'}</span>
            </button>
          </div>

          {/* Formulario de creación rápida */}
          {showFormEvento && (
            <form onSubmit={handleCrearEvento} className={`p-4 border rounded-[2px] space-y-3 m3-modal-open ${
              isLightMode ? 'bg-white border-slate-300' : 'bg-[#161616] border-[#262626]'
            }`}>
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Registrar Nuevo Evento en el Cronograma
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Título del Evento</label>
                  <input
                    type="text"
                    required
                    value={nuevoTitulo}
                    onChange={e => setNuevoTitulo(e.target.value)}
                    placeholder="Ej: Pesaje de Capones terminados"
                    className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Especie</label>
                  <select
                    value={nuevaEspecie}
                    onChange={e => setNuevaEspecie(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border focus:outline-none"
                  >
                    <option value="Bovinos">🐄 Bovinos</option>
                    <option value="Porcinos">🐖 Porcinos</option>
                    <option value="Ovinos">🐑 Ovinos</option>
                    <option value="General">📊 Toda la Ganadería</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Tipo de Actividad</label>
                  <select
                    value={nuevoTipo}
                    onChange={e => setNuevoTipo(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border focus:outline-none"
                  >
                    <option value="SANIDAD">💉 Sanidad & Vacunación</option>
                    <option value="MANEJO">🌾 Manejo, Pesaje y Destete</option>
                    <option value="COMERCIAL">💰 Comercialización / Venta</option>
                    <option value="SENASA">📑 SENASA & DTe</option>
                    <option value="CONTABLE">📊 Cierre Contable RT 54</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Fecha y Hora</label>
                  <div className="flex space-x-1">
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={e => setNuevaFecha(e.target.value)}
                      className="w-2/3 px-2 py-1.5 text-xs rounded-[2px] border"
                    />
                    <input
                      type="time"
                      value={nuevaHora}
                      onChange={e => setNuevaHora(e.target.value)}
                      className="w-1/3 px-1.5 py-1.5 text-xs rounded-[2px] border"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Ubicación / Sector</label>
                  <input
                    type="text"
                    value={nuevoLugar}
                    onChange={e => setNuevoLugar(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Detalles / Instrucciones</label>
                  <input
                    type="text"
                    value={nuevaDesc}
                    onChange={e => setNuevaDesc(e.target.value)}
                    placeholder="Instrucciones para el personal de campo..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFormEvento(false)}
                  className="px-3 py-1.5 border rounded-[2px] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-[2px]"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          )}

          {/* Lista de Eventos */}
          <div className="space-y-2">
            {eventos.map(ev => {
              const urlCalendar = generarGoogleCalendarUrl(ev);
              return (
                <div
                  key={ev.id}
                  className={`p-3.5 border rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      : 'bg-[#141414] border-[#242424] hover:border-[#2e2e2e]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] uppercase ${
                        ev.tipo === 'SANIDAD'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : ev.tipo === 'COMERCIAL'
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                          : ev.tipo === 'SENASA'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                      }`}>
                        {ev.tipo}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400">
                        {ev.especie}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                        {ev.titulo}
                      </h4>
                    </div>

                    <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-neutral-400'}`}>
                      {ev.descripcion}
                    </p>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-500 dark:text-neutral-400 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{ev.fecha} • {ev.hora} hs ({ev.duracionHoras}h)</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{ev.lugar}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={urlCalendar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-[2px] transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      title="Agregar este evento directamente a tu Google Calendar"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Agendar en Google Calendar</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: GMAIL & PARTES GANADEROS */}
      {tabActiva === 'gmail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Columna Izquierda: Plantillas Rápidas */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-slate-700' : 'text-neutral-300'}`}>
              Plantillas de Comunicación Operativa
            </h3>
            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-neutral-400'}`}>
              Selecciona una plantilla para preparar el correo con los datos oficiales del ERP:
            </p>

            <div className="space-y-1.5 pt-1">
              {plantillasMail.map(p => {
                const isSelected = mailSeleccionado.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSeleccionarPlantilla(p)}
                    className={`w-full text-left p-3 rounded-[2px] border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300 font-bold'
                        : isLightMode
                        ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        : 'bg-[#141414] border-[#262626] hover:bg-[#1a1a1a] text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold block">{p.nombre}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-black/10 dark:bg-white/10 uppercase">
                        {p.categoria}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-70 block truncate mt-0.5">
                      {p.destinatarioDefault}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Editor y Despacho en Gmail */}
          <div className={`lg:col-span-8 p-4 sm:p-5 border rounded-[2px] space-y-3.5 ${
            isLightMode ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#141414] border-[#262626]'
          }`}>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Redactor de Correo Ganadero
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400">
                Apertura directa en Gmail Web
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Destinatario (Para)</label>
              <input
                type="text"
                value={destinatario}
                onChange={e => setDestinatario(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Asunto</label>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-[2px] border focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Contenido del Mensaje</label>
              <textarea
                rows={8}
                value={cuerpo}
                onChange={e => setCuerpo(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-[2px] border font-mono leading-relaxed focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                Al presionar el botón se abrirá la interfaz nativa de Gmail con todos los campos precompletados.
              </span>
              <a
                href={generarGmailUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-[2px] transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir y Enviar en Gmail</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: DRIVE, SHEETS Y ACCESOS GOOGLE WORKSPACE */}
      {tabActiva === 'workspace' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 border rounded-[2px] space-y-3 ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#262626]'
          }`}>
            <div className="flex items-center space-x-2 text-emerald-600">
              <FileSpreadsheet className="w-5 h-5" />
              <h4 className="text-sm font-bold">Google Sheets Oficial</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Hoja de cálculo en la nube vinculada con las 33 tablas del ERP ganadero.
            </p>
            <div className="text-[11px] font-mono bg-black/5 dark:bg-white/5 p-2 rounded-[2px] break-all">
              ID: {spreadsheetId || '1X_QkF4xK8gU5uO6pW7y... (Conectado)'}
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-[2px]"
            >
              <span>Abrir en Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className={`p-4 border rounded-[2px] space-y-3 ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#262626]'
          }`}>
            <div className="flex items-center space-x-2 text-blue-600">
              <HardDrive className="w-5 h-5" />
              <h4 className="text-sm font-bold">Google Drive Ganadero</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Almacén en la nube para comprobantes fiscales, DTe SENASA en PDF y balances históricos.
            </p>
            <div className="text-[11px] font-mono bg-black/5 dark:bg-white/5 p-2 rounded-[2px]">
              Carpeta: /UNRC/PozoDelCarril_Hacienda
            </div>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-[2px]"
            >
              <span>Ir a Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className={`p-4 border rounded-[2px] space-y-3 ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#262626]'
          }`}>
            <div className="flex items-center space-x-2 text-amber-600">
              <Bookmark className="w-5 h-5" />
              <h4 className="text-sm font-bold">Google Keep & Notas Manga</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Notas rápidas capturadas en el corral durante pesajes o aplicación de tratamientos veterinarios.
            </p>
            <div className="text-[11px] font-mono bg-black/5 dark:bg-white/5 p-2 rounded-[2px]">
              Etiqueta: #Hacienda_UNRC
            </div>
            <a
              href="https://keep.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-[2px]"
            >
              <span>Abrir Google Keep</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

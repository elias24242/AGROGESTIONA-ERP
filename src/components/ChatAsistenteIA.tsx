import React, { useState, useRef, useEffect } from 'react';
import { DatabaseState } from '../services/sheetsService';
import { Usuario } from '../types/erp';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Trash2,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  X,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Boxes,
  Syringe,
  FileText,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  error?: boolean;
}

interface ChatAsistenteIAProps {
  isOpen: boolean;
  onClose: () => void;
  state: DatabaseState;
  currentUser: Usuario;
  selectedSubunidad: string;
  selectedCampania: string;
  isLightMode?: boolean;
  activeTab?: string;
}

// Catálogo didáctico de módulos del ERP Ovinos Pozo del Carril (UNRC)
export const MODULOS_ERP_MAP: Record<string, { label: string; desc: string; icon: any }> = {
  dashboard: {
    label: 'Dashboard General',
    desc: 'Panel ejecutivo con existencias globales, balance operativo y cotización Dólar Hoy en vivo.',
    icon: BarChart3,
  },
  graficos: {
    label: 'Gráficos & Estadísticas',
    desc: 'Curvas de evolución histórica de existencias, zafra de lana y distribución por potreros.',
    icon: BarChart3,
  },
  majada: {
    label: 'Majada & Hacienda',
    desc: 'Inventario físico por potreros, altas por parición/compra, bajas, traslados y reclasificaciones.',
    icon: Boxes,
  },
  produccion: {
    label: 'Producción & Consumos',
    desc: 'Zafra lanera PROLANA (vellón, barriga) y suministros de raciones, alfalfa y granos por lote.',
    icon: FileText,
  },
  sanidad: {
    label: 'Sanidad Ovina',
    desc: 'Planes sanitarios (clostridiales, ecto/endoparásitos), cálculo de dosis y períodos de carencia.',
    icon: Syringe,
  },
  economia: {
    label: 'Operaciones Económicas',
    desc: 'Compras de insumos con Precio Promedio Ponderado (PPP), ventas de corderos/lana y margen bruto.',
    icon: FileText,
  },
  contabilidad: {
    label: 'Medición Contable (RT 54)',
    desc: 'Valuación de activos biológicos (VNR para venta vs Reposición para reproductores) bajo norma FACPCE.',
    icon: FileText,
  },
  auditoria: {
    label: 'Registro de Auditoría',
    desc: 'Trazabilidad inmutable de cada transacción con log campo por campo, usuario y valores anterior/posterior.',
    icon: CheckCircle2,
  },
  pruebas: {
    label: 'Casos de Aceptación',
    desc: 'Suite de 12 pruebas automatizadas para verificar integridad de datos y bloqueo de saldos negativos.',
    icon: HelpCircle,
  },
  configuracion: {
    label: 'Configuración & Usuarios',
    desc: 'Gestión de roles RBAC (Administrador, Operador, Auditor), credenciales y sincronización con Sheets.',
    icon: Lightbulb,
  },
  modelo_datos: {
    label: 'Modelo de Datos',
    desc: 'Diccionario de tablas y diagrama relacional normalizado del sistema ovino.',
    icon: Layers,
  },
};

export const ChatAsistenteIA: React.FC<ChatAsistenteIAProps> = ({
  isOpen,
  onClose,
  state,
  currentUser,
  selectedSubunidad,
  selectedCampania,
  isLightMode = false,
  activeTab = 'dashboard',
}) => {
  // Información del módulo actualmente en pantalla
  const activeModuleInfo = MODULOS_ERP_MAP[activeTab] || {
    label: 'Módulo Actual',
    desc: 'Vista activa del sistema ERP',
    icon: Lightbulb,
  };

  // Mensajes sugeridos principales requeridos por el usuario
  const suggestedQueries = [
    {
      id: 'sug-modulo-actual',
      title: 'Explicar el módulo actual',
      badge: activeModuleInfo.label,
      description: `Qué hace ${activeModuleInfo.label}, cómo usarlo paso a paso y qué reglas aplica.`,
      icon: BookOpen,
      prompt: `Explicar en detalle el módulo actual '${activeModuleInfo.label}' (${activeTab}): cuál es su propósito en Pozo del Carril (UNRC), cómo se utiliza paso a paso, qué datos gestiona y qué reglas de negocio o controles aplica.`,
    },
    {
      id: 'sug-nuevo-movimiento',
      title: '¿Cómo realizar un nuevo movimiento?',
      badge: 'Guía Operativa',
      description: 'Paso a paso para registrar traslados, altas, bajas o reclasificaciones sin saldo negativo.',
      icon: Boxes,
      prompt: `¿Cómo realizar un nuevo movimiento de majada y hacienda en el sistema? Explicame el paso a paso: selección de origen y destino, categorías o lotes involucrados, validación de stock disponible para evitar saldos negativos y cómo queda registrado en el log de auditoría.`,
    },
    {
      id: 'sug-situacion-zootecnica',
      title: 'Resumen de la situación zootécnica',
      badge: 'Diagnóstico Majada',
      description: 'Existencias totales, desglose de madres/carneros/corderos, ratio de servicio y alertas.',
      icon: Activity,
      prompt: `Brindame un resumen de la situación zootécnica actual en Pozo del Carril: existencias totales de cabezas, estructura de la majada (madres, carneros, reposición y corderos), relación carnero/vientre, indicadores productivos y alertas sanitarias o de manejo.`,
    },
  ];

  // Sugerencias secundarias complementarias
  const secondarySuggestions = [
    {
      label: '📑 RT 54 Contabilidad',
      prompt: 'Explicame cómo funciona la medición de activos biológicos bajo RT 54 en este sistema y cómo se calcula el VNR frente al costo de reposición.',
      icon: FileText,
    },
    {
      label: '💉 Sanidad & Dosis',
      prompt: '¿Cómo funciona el módulo de Sanidad Ovina, el cálculo de dosis y el período de carencia en el establecimiento?',
      icon: Syringe,
    },
    {
      label: '📦 Stock de Insumos',
      prompt: 'Analizá el inventario de insumos veterinarios y alimentos, indicando si hay productos con stock crítico o bajo punto de reposición.',
      icon: AlertTriangle,
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      // 1. Intentar cargar historial previo desde localStorage (por usuario o clave general)
      const userKey = currentUser?.id_usuario ? `erp_chat_messages_v1_${currentUser.id_usuario}` : null;
      const savedLocal = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('erp_chat_messages_v1');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // 2. Respaldo y migración desde sessionStorage si existía una sesión previa
      const savedSession = sessionStorage.getItem('erp_chat_messages_v1');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (Array.isArray(parsed) && parsed.length > 0) {
          try {
            localStorage.setItem('erp_chat_messages_v1', savedSession);
          } catch (_) {}
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error al cargar historial del chat desde localStorage:', e);
    }
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `👋 **¡Hola ${currentUser.nombre_completo || currentUser.username}!** Soy el Asesor Técnico y Analista Inteligente del **ERP Ovinos - Pozo del Carril (UNRC)**.\n\nEstoy preparado para asistirte en dos áreas clave:\n1. 📖 **Entender el sistema y su funcionamiento:** Explicarte qué hace cada módulo, las reglas de negocio (movimientos de hacienda, dosis sanitarias, RT 54) y cómo operar paso a paso.\n2. 📊 **Interpretar los datos en tiempo real:** Diagnosticar las existencias de la majada, analizar el stock de insumos, evaluar costos, detectar alertas y brindar recomendaciones prácticas.\n\n💡 **Mensajes sugeridos al abrir el asistente:** Haz clic en cualquiera de los botones rápidos a continuación para consultar de inmediato:`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickPills, setShowQuickPills] = useState(false);
  const [aiMode, setAiMode] = useState<'interpretative' | 'fast'>(() => {
    try {
      const savedMode = localStorage.getItem('erp_chat_ai_mode_v1');
      if (savedMode === 'interpretative' || savedMode === 'fast') return savedMode;
    } catch (_) {}
    return 'interpretative';
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Guardar preferencia de modo de IA en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('erp_chat_ai_mode_v1', aiMode);
    } catch (_) {}
  }, [aiMode]);

  // Guardar historial de mensajes en localStorage para que el usuario pueda retomar consultas previas al refrescar
  useEffect(() => {
    try {
      const dataStr = JSON.stringify(messages);
      const userKey = currentUser?.id_usuario ? `erp_chat_messages_v1_${currentUser.id_usuario}` : null;
      if (userKey) {
        localStorage.setItem(userKey, dataStr);
      }
      localStorage.setItem('erp_chat_messages_v1', dataStr);
    } catch (e) {
      console.warn('Error al guardar historial del chat en localStorage:', e);
      // Si se excede la cuota de localStorage, conservar al menos los últimos 20 mensajes
      try {
        if (messages.length > 20) {
          const trimmed = [messages[0], ...messages.slice(-19)];
          localStorage.setItem('erp_chat_messages_v1', JSON.stringify(trimmed));
        }
      } catch (_) {}
    }
  }, [messages, currentUser?.id_usuario]);

  // Scroll automático hacia el final del chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus en el input cuando se abre el chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    const defaultWelcome: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: `Conversación reiniciada. Estoy listo para ayudarte a entender el sistema e interpretar los datos del establecimiento Pozo del Carril (UNRC).\n\n💡 **Accesos rápidos:**`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: aiMode === 'interpretative' ? 'gemini-3.5-flash' : 'gemini-3.1-flash-lite',
    };
    setMessages([defaultWelcome]);
    try {
      if (currentUser?.id_usuario) {
        localStorage.removeItem(`erp_chat_messages_v1_${currentUser.id_usuario}`);
      }
      localStorage.removeItem('erp_chat_messages_v1');
      sessionStorage.removeItem('erp_chat_messages_v1');
    } catch (e) {
      console.warn('Error al limpiar historial del chat en localStorage:', e);
    }
  };

  // Resumen del contexto local actual para enriquecer el prompt
  const calcularContextoResumido = () => {
    const inventario = state.inventario || [];
    const movimientos = state.movimientos || [];
    const insumos = state.insumos || [];
    const categorias = state.categorias || [];
    const subunidades = state.subunidades || [];

    // Existencias por categoría
    const existenciasPorCat: Record<string, number> = {};
    inventario.forEach(inv => {
      const cat = categorias.find(c => c.id_categoria === inv.id_categoria)?.nombre || inv.id_categoria;
      existenciasPorCat[cat] = (existenciasPorCat[cat] || 0) + (inv.cabezas || 0);
    });

    const totalCabezas = Object.values(existenciasPorCat).reduce((a, b) => a + b, 0);

    // Insumos críticos
    const insumosCriticos = insumos
      .filter(i => (i.stock_actual || 0) <= 60)
      .map(i => `${i.nombre} (${i.stock_actual} ${i.um_codigo || ''})`);

    return {
      subunidadActiva: selectedSubunidad,
      campaniaActiva: selectedCampania,
      moduloActual: activeTab,
      moduloNombre: activeModuleInfo.label,
      totalCabezas,
      existenciasPorCat,
      insumosCriticos,
      usuarioActivo: currentUser.username,
      rolUsuario: currentUser.rol_nombre,
    };
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setInputPrompt('');
    setShowQuickPills(false);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const contextSummary = calcularContextoResumido();

      // Transformar para el formato de la API de backend
      const apiMessages = newHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: aiMode,
          context: contextSummary,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor (${res.status})`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Sin respuesta del asistente.',
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || (aiMode === 'interpretative' ? 'gemini-3.5-flash' : 'gemini-3.1-flash-lite'),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error al enviar mensaje al chat:', err);
      // Fallback local enriquecido
      const fallbackText = generarRespuestaLocalFallback(text, calcularContextoResumido());
      const fallbackMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'motor-interpretativo-local',
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Motor de respuesta interpretativa local de respaldo
  const generarRespuestaLocalFallback = (query: string, ctx: any) => {
    const q = query.toLowerCase();

    // 1. SUGERENCIA: EXPLICAR EL MÓDULO ACTUAL
    if (q.includes('módulo actual') || q.includes('explicar el módulo') || q.includes('modulo actual') || q.includes('este módulo') || q.includes('esta pantalla')) {
      const mod = activeModuleInfo;
      return `### 📖 Guía Operativa: Módulo ${mod.label}\n\n**Propósito en Pozo del Carril (UNRC):**\n${mod.desc}\n\n**¿Cómo operar este módulo paso a paso?**\n1. **Filtros de Contexto:** Utiliza el selector superior de **Subunidad** (${ctx.subunidadActiva}) y **Campaña** (${ctx.campaniaActiva}) para acotar los datos.\n2. **Visualización y Búsqueda:** Cada tabla incluye barra de búsqueda rápida y paginación para auditar registros con precisión.\n3. **Acciones de Edición o Alta:** Solo los roles autorizados (Administrador y Operador) pueden crear o modificar datos; cada cambio solicita motivo o confirmación.\n4. **Reglas de Control:** El módulo cuenta con validaciones estrictas en tiempo real: no permite saldos de stock negativos, valida formatos y registra cada evento en el **Libro de Auditoría** inmutable.\n5. **Exportación:** Puedes exportar los listados directamente a Excel (XLSX) con trazabilidad oficial.`;
    }

    // 2. SUGERENCIA: ¿CÓMO REALIZAR UN NUEVO MOVIMIENTO?
    if (q.includes('nuevo movimiento') || q.includes('realizar un nuevo movimiento') || q.includes('cómo registrar un movimiento') || q.includes('como realizar un movimiento')) {
      return `### 🔄 ¿Cómo realizar un nuevo movimiento de majada y hacienda?\n\nPara registrar un movimiento de animales en el sistema de gestión ganadera, seguí estos pasos:\n\n1. **Acceder a Majada & Hacienda:**\n   - Dirigite al módulo **Majada & Hacienda** en la barra lateral izquierda y hacé clic en el botón superior **"+ Registrar Evento de Hacienda"**.\n\n2. **Seleccionar el Tipo de Movimiento:**\n   - **Altas:** Nacimientos (ingreso directo a la categoría de cría o lechones/terneros/corderos) o compras de reproductores/vientres.\n   - **Bajas:** Mortandad (con motivo zootécnico o necropsia), ventas o consumo del establecimiento.\n   - **Traslados:** Desplazamiento entre subunidades o instalaciones.\n   - **Cambio de Categoría:** Maduración zootécnica (aumenta en la nueva categoría y disminuye en la anterior, conservando el stock global).\n\n3. **Definir Origen y Destino:**\n   - Seleccioná la categoría y subunidad correspondiente.\n\n4. **Ingresar Cantidad de Cabezas y Validaciones:**\n   - Especificá las cabezas a registrar. El sistema valida que el stock disponible en origen sea igual o superior a la cantidad indicada para evitar saldos negativos.\n\n5. **Confirmación y Reactividad Global:**\n   - Al registrar el movimiento, el stock físico se actualiza inmediatamente en todas las columnas (Ovino, Bovino y Porcino) y dashboards asociados, y se graba un asiento inmutable en el **Libro de Auditoría** con tu usuario (**${ctx.usuarioActivo}**), fecha y hora.`;
    }

    // 3. SUGERENCIA: RESUMEN DE LA SITUACIÓN ZOOTÉCNICA
    if (q.includes('situación zootécnica') || q.includes('situacion zootecnica') || q.includes('resumen zootécnico') || q.includes('diagnóstico zootécnico') || q.includes('diagnostico zootecnico')) {
      const breakdown = Object.entries(ctx.existenciasPorCat)
        .map(([cat, qty]) => `• **${cat}**: ${qty} cabezas`)
        .join('\n');

      let madres = 0;
      let carneros = 0;
      Object.entries(ctx.existenciasPorCat).forEach(([cat, qty]) => {
        const cLower = cat.toLowerCase();
        if (cLower.includes('oveja') || cLower.includes('madre') || cLower.includes('vientre')) madres += (qty as number);
        if (cLower.includes('carnero') || cLower.includes('reproductor')) carneros += (qty as number);
      });

      const ratioCarneros = madres > 0 ? ((carneros / madres) * 100).toFixed(1) : 'N/D';

      return `### 🐑 Resumen de la Situación Zootécnica - Pozo del Carril (UNRC)\n\n**Existencias y Composición Poblacional (Campaña ${ctx.campaniaActiva}):**\n• **Total Majada:** **${ctx.totalCabezas} cabezas** registradas.\n\n**Desglose por Categorías:**\n${breakdown || '• Sin registros cargados.'}\n\n**Indicadores Zootécnicos Clave:**\n• **Vientres Productivos:** ${madres} madres en stock.\n• **Carneros en Servicio:** ${carneros} reproductores.\n• **Relación Carnero / Vientre:** **${ratioCarneros}%** (Recomendación técnica ovina: entre 3% y 4% para servicio a campo en condiciones extensivas).\n\n**Recomendaciones Zootécnicas & Sanitarias:**\n1. **Condición Corporal (CC):** Monitorear la escala 1-5 en vientres pre-servicio y en el último tercio de gestación.\n2. **Plan Sanitario:** Verificar el refuerzo de la vacuna clostridial polivalente y desparasitaciones estratégicas pre-parto.\n3. **Alimentación y Suplementación:** Garantizar oferta de rollos de alfalfa y grano de maíz para sostener los requerimientos del lote ovino.`;
    }

    // 4. BOVINOS (RODEO, FASES, PRECIOS MAG, 174 CABEZAS, AUDITORÍA)
    if (q.includes('bovin') || q.includes('vaca') || q.includes('novillo') || q.includes('ternero') || q.includes('invernada') || q.includes('cañuelas') || q.includes('mag')) {
      return `### 🐄 Rodeo Bovino Pozo del Carril – La Aguada (EspecieID: ESP002)

**1. Ciclo Productivo de 4 Fases (390 días):**
• **Fase 1 (Cría 0-210d):** Pastoreo natural, destete objetivo a los 180 kg.
• **Fase 2 (Recría Inicial 211-270d):** Pasturas consociadas + suplementación, peso objetivo 250 kg (GDPV 0,750 kg/d).
• **Fase 3 (Recría Avanzada 271-330d):** Pastura + silaje de maíz, peso objetivo 340 kg (GDPV 0,850 kg/d).
• **Fase 4 (Engorde/Terminación 331-390d):** Ración de alta energía (granos 70%, silaje 8%), peso de faena 420-450 kg (GDPV 1,200 kg/d).

**2. Precios de Referencia Mercado Agroganadero (MAG Cañuelas & Consignatarias):**
• **Novillitos (300-390 kg):** ~$4.300 - $4.500 / kg vivo.
• **Terneros de Invernada (160-200 kg):** ~$4.400 - $4.600 / kg vivo.
• *Nota normativa:* Son cotizaciones testigo de mercado para proyectar el VNR, no sustituyen la registración contable en libros.

**3. Auditoría de Existencias Históricas (174 cabezas al 30/09/2026):**
• Desglose documentado: 63 vacas, 4 toros, 42 novillos, 35 terneros, 30 vaquillonas.
• **Alerta de Auditoría:** Existe una inconsistencia documentada de 13 cabezas entre el subdiario de hacienda y las cuentas contables 1.3.01 / 1.3.02 y 1.4.01. Su estado es **EN REVISIÓN DE AUDITORÍA CONTABLE (PENDIENTE DE CONFIRMACIÓN)** y no debe forzarse en el stock operativo en vivo.`;
    }

    // 5. PORCINOS (PIARA, 3 FASES, RACIONES, COSTOS DOCUMENTADOS, ROSPORC)
    if (q.includes('porcin') || q.includes('cerd') || q.includes('piara') || q.includes('lechón') || q.includes('lechon') || q.includes('capón') || q.includes('capon') || q.includes('rosporc')) {
      return `### 🐖 Piara Porcina Pozo del Carril (EspecieID: ESP003)

**1. Ciclo Intensivo de 3 Fases (165 días a faena 110-115 kg):**
• **Fase 1 (Cría 0-21d):** Lactancia en Maternidad, lechón a 6,5 kg. Ración: 100% Preiniciador.
• **Fase 2 (Destete/Recría 22-70d):** Transición a 30 kg (GDPV 0,480 kg/d). Ración: **80% Maíz / 10% Soja / 10% Núcleo vitamínico-mineral**.
• **Fase 3 (Engorde/Terminación 71-165d):** Pista de terminación hasta 110-115 kg (GDPV 0,850 kg/d). Ración: **70% Maíz / 30% Expeller Soja**.

**2. Importes y Costos Documentados del Ejercicio:**
• **Mano de Obra Directa (MOD):** $3.000.000 (encargado y operario de pista).
• **Energía Eléctrica:** $800.000 (bombeo de agua y ventilación forzada).
• **Inseminación Artificial & Genética:** $1.487.000 (dosis seminales y genética terminal).
• **Transferencia Inter-Subunidad Documentada:** $26.377.259,25.

**3. Valuación Contable:**
• Valuación a Valor Neto de Realización (VNR) referenciado al mercado digital **ROSPORC (Bolsa de Comercio de Rosario)**, imputado a la cuenta **1.3.03 Hacienda Porcina**.`;
    }

    // 6. GOOGLE SHEETS & SINCRONIZACIÓN
    if (q.includes('sheet') || q.includes('sincroniz') || q.includes('drive') || q.includes('excel') || q.includes('nube') || q.includes('exportar')) {
      return `### 📊 Vinculación y Sincronización con Google Sheets

El sistema cuenta con un motor de integración directa con hojas de cálculo de Google:

1. **Estructura Normalizada:**
   - Hojas dimensionales Maestras: \`D_Especie\`, \`D_Categoria\`, \`D_Subunidad\`, \`D_Lote\`, \`D_Campania\`, \`D_Insumo\`, \`D_Usuario\`.
   - Hojas de Hechos (Facts): \`F_InventarioInicial\`, \`F_MovimientoHacienda\`, \`F_ConsumoInsumo\`, \`F_Sanidad\`, \`F_OperacionEconomica\`, \`F_LogAuditoria\`.

2. **Mecanismo de Sincronización:**
   - **Lectura/Carga Inicial:** Descarga y normaliza los registros mapeando claves foráneas (EspecieID, CategoriaID, SubunidadID).
   - **Escritura y Resguardo:** Toda transacción confirmada se persiste en el almacenamiento local y se sincroniza con el endpoint de Sheets de forma idempotente.
   - **Auditoría Inmutable:** Cada sincronización genera un evento en el log con usuario, timestamp y hash de control.`;
    }

    // 7. MANUAL DEL USUARIO Y PROCEDIMIENTOS
    if (q.includes('manual') || q.includes('procedimiento') || q.includes('cómo registrar') || q.includes('paso a paso') || q.includes('guía') || q.includes('guia')) {
      return `### 📘 Procedimientos Oficiales del Manual del Usuario

El Manual del Sistema detalla los siguientes procedimientos normativos:

1. **Procedimiento P-01 (Partes Ganaderos Diarios):**
   - Ingresar a *Majada & Hacienda*, seleccionar la Especie (\`ESP001\` Ovino, \`ESP002\` Bovino, \`ESP003\` Porcino), indicar subunidad y lote, registrar altas/bajas con documento de respaldo.
2. **Procedimiento P-02 (Cierre Mensual de Existencias):**
   - Validar que el stock inicial + altas - bajas = stock final exacto. Verificar que no haya saldos negativos.
3. **Procedimiento P-03 (Imputación de Costos Directos e Indirectos):**
   - Asignar raciones y gastos de sanidad por especie según la estructura contable oficial (cuentas 4.1 Ovinos, 4.2 Bovinos, 4.3 Porcinos).
4. **Procedimiento P-04 (Control de Parámetros Pendientes):**
   - Cualquier parámetro sin medición de campo o estándar técnico INTA auditado se etiqueta transparentemente como *PENDIENTE DE DEFINICIÓN*.`;
    }

    // Otros tópicos
    if (q.includes('rt 54') || q.includes('contab') || q.includes('valuac')) {
      return `### 📑 Medición Contable bajo Norma RT 54\n\nEn el sistema ganadero integrado, la **Resolución Técnica 54 (FACPCE)** establece los siguientes criterios para activos biológicos:\n\n1. **Activos Biológicos destinados a la Venta (Bienes de Cambio):**\n   - Corderos, capones y novillos para faena se valúan a **Valor Neto de Realización (VNR)** = Precio de mercado de referencia menos gastos directos de venta (flete y comisiones).\n2. **Activos Biológicos de Producción (Bienes de Uso Biológico):**\n   - Madres, toros, carneros y padrillos reproductores se valúan al **Costo de Reposición** o costo histórico amortizado según vida útil zootécnica.\n3. **Resultados por Tenencia y Producción:**\n   - El incremento de peso y los nacimientos se reconocen en el ejercicio como **Resultado por Producción Agropecuaria**, reflejando la generación de valor real del campo.`;
    }

    if (q.includes('sanidad') || q.includes('vacun') || q.includes('dosis') || q.includes('medicament')) {
      return `### 💉 Módulo de Sanidad Animal y Dosificación\n\nEl módulo de Sanidad del ERP permite planificar y registrar tratamientos en todas las especies:\n\n• **Cálculo de Dosis:** Se calcula multiplicando la dosis por cabeza o por kg según el prospecto técnico de cada insumo (ej. Vacuna Clostridial Polivalente, Ivermectina 1%, Aftosa/Carbunclo en bovinos).\n• **Período de Carencia:** Bloquea o alerta sobre animales tratados para evitar la venta o faena antes de que se cumpla el tiempo de eliminación del fármaco.\n• **Descarga Automática de Stock:** Al registrar una aplicación sanitaria, el sistema descuenta automáticamente los frascos o dosis del stock de insumos veterinarios.`;
    }

    if (q.includes('insumo') || q.includes('alimento') || q.includes('grano') || q.includes('stock')) {
      const criticos = ctx.insumosCriticos?.length
        ? ctx.insumosCriticos.join(', ')
        : 'Todos los insumos se encuentran en niveles adecuados.';
      return `### 📦 Diagnóstico de Insumos y Alimentación Ganadera\n\n• **Insumos en atención o bajo stock:** ${criticos}\n• **Gestión:** Al ingresar compras en el módulo de *Operaciones Económicas*, el stock físico se incrementa y se recalcula el Precio Promedio Ponderado (PPP).\n• **Consumos por Especie:** Los suministros de maíz, rollos de alfalfa, silaje y balanceado se asocian al lote y a la subunidad respectiva para imputar con precisión el costo directo de alimentación.`;
    }

    // RESPUESTA GENERAL ABIERTA CON CONSISTENCIA NORMATIVA
    return `### 🌾 Asistente de Gestión Ganadera - Pozo del Carril / La Aguada

He analizado tu consulta sobre **"${query}"** en el marco del sistema normativo y las directrices del Manual del Usuario:

1. **Contexto Operativo Actual:**
   - **Módulo activo:** ${ctx.moduloNombre} (\`${ctx.moduloActual}\`).
   - **Subunidad / Campaña:** ${ctx.subunidadActiva} • ${ctx.campaniaActiva}.
   - **Usuario y Permisos:** ${ctx.usuarioActivo} (${ctx.rolUsuario}).

2. **Lineamientos Normativos Aplicables:**
   - **Integración Multiespecie:** Toda información se estructura bajo la dimensión \`D_Especie\` (Ovinos \`ESP001\`, Bovinos \`ESP002\`, Porcinos \`ESP003\`, o Toda la Ganadería).
   - **Inventario Canónico Ovino:** Base fija e inalterable de **81 cabezas al 30/08/2026** (64 Madres, 2 Carneros, 15 Sin clasificar).
   - **Rodeo Bovino:** Ciclo de 4 fases (390 días), 12 categorías oficiales SENASA, precios MAG Cañuelas y auditoría de 174 cabezas históricas con alerta de 13 cabezas en revisión.
   - **Piara Porcina:** Ciclo de 3 fases (165 días), raciones de precisión, costos documentados ($3M MOD, $800k energía) y valuación ROSPORC.
   - **Regla Anti-Invención:** Ningún dato no relevado se inventa; se muestra con transparencia como **PENDIENTE DE DEFINICIÓN**.

¿Deseas profundizar sobre el procedimiento operativo de algún módulo, la imputación contable o la situación de una especie en particular?`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col shadow-2xl border backdrop-blur-md overflow-hidden ${
        isExpanded
          ? 'inset-3 sm:inset-6 md:inset-10 rounded-2xl'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[500px] h-[670px] max-h-[90vh] rounded-2xl'
      } ${
        isLightMode
          ? 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-900/20'
          : 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/80'
      }`}
    >
      {/* ================= ENCABEZADO DEL CHAT ================= */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isLightMode ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-800/80 border-slate-700'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <h3 className="font-bold text-sm tracking-tight truncate">
                Asistente ERP Ovinos IA
              </h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {activeModuleInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Pozo del Carril (UNRC) • Campaña {selectedCampania}
            </p>
          </div>
        </div>

        {/* Acciones del Encabezado */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Selector de Modo Rápido / Interpretativo */}
          <div className="hidden sm:flex items-center rounded-lg bg-black/10 dark:bg-black/30 p-0.5 border border-slate-300 dark:border-slate-700 text-[10px]">
            <button
              onClick={() => setAiMode('interpretative')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                aiMode === 'interpretative'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-current'
              }`}
              title="Modo Interpretativo con gemini-3.5-flash: Análisis profundo y zootécnico"
            >
              🧠 Interpretativo
            </button>
            <button
              onClick={() => setAiMode('fast')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                aiMode === 'fast'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-current'
              }`}
              title="Modo Rápido con gemini-3.1-flash-lite: Respuestas ágiles e instantáneas"
            >
              ⚡ Rápido
            </button>
          </div>

          {/* Limpiar Historial */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            title="Reiniciar conversación y borrar historial guardado de localStorage"
            aria-label="Reiniciar conversación y borrar historial guardado de localStorage"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Maximizar / Minimizar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            title={isExpanded ? 'Restaurar tamaño' : 'Maximizar ventana'}
            aria-label={isExpanded ? 'Restaurar tamaño' : 'Maximizar ventana'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Cerrar */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Cerrar chat"
            aria-label="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= HILO DE MENSAJES CON SCROLL VERTICAL (SIN BARRAS HORIZONTALES) ================= */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 no-scrollbar">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isFirstAssistantMessage = !isUser && index === 0;

          return (
            <div key={msg.id} className="space-y-3">
              <div
                className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Burbuja de Mensaje */}
                <div
                  className={`relative group max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs transition-colors ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : isLightMode
                      ? 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-xs'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {/* Formateo de Texto con soporte Markdown simple */}
                  <div className="prose-xs space-y-1.5 whitespace-pre-line">
                    {msg.content.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4
                            key={pIdx}
                            className={`font-bold text-[13px] mt-1 mb-1 pb-1 border-b ${
                              isUser
                                ? 'text-white border-white/20'
                                : isLightMode
                                ? 'text-slate-900 border-slate-300'
                                : 'text-emerald-400 border-slate-700'
                            }`}
                          >
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      return <p key={pIdx}>{paragraph}</p>;
                    })}
                  </div>

                  {/* ================= BOTONES DE ACCESO RÁPIDO DENTRO DEL MENSAJE INICIAL ================= */}
                  {isFirstAssistantMessage && (
                    <div className="mt-3.5 pt-3 border-t border-slate-300/40 dark:border-slate-700/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mensajes sugeridos de acceso rápido:</span>
                      </div>

                      {/* 3 Botones Principales Solicitados */}
                      <div className="flex flex-col gap-1.5">
                        {suggestedQueries.map(sug => {
                          const Icon = sug.icon;
                          return (
                            <button
                              key={sug.id}
                              onClick={() => sendMessage(sug.prompt)}
                              disabled={isLoading}
                              className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isLightMode
                                  ? 'bg-white hover:bg-emerald-50/80 border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-xs text-slate-800'
                                  : 'bg-slate-900/90 hover:bg-slate-900 border-slate-700/70 hover:border-emerald-500 text-slate-100 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[11px] tracking-tight truncate">
                                    {sug.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {sug.description}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </button>
                          );
                        })}
                      </div>

                      {/* Chips secundarios en flex-wrap (sin scroll horizontal) */}
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {secondarySuggestions.map((sug, idx) => {
                          const Icon = sug.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => sendMessage(sug.prompt)}
                              disabled={isLoading}
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                                isLightMode
                                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-2xs'
                                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-700/60 text-slate-300 shadow-2xs'
                              }`}
                            >
                              <Icon className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{sug.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pie de Mensaje con Timestamp y Acciones */}
                  <div
                    className={`mt-2 pt-1 border-t flex items-center justify-between text-[10px] opacity-75 ${
                      isUser ? 'border-white/20 text-white/80' : 'border-slate-300/40 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && !isUser && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/10 dark:bg-black/30">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity cursor-pointer"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Indicador de "Pensando / Formulando" */}
        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div
              className={`rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center space-x-2 ${
                isLightMode ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Interpretando datos y formulando respuesta con {aiMode === 'interpretative' ? 'gemini-3.5-flash' : 'gemini-3.1-flash-lite'}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Popover discreto de sugerencias si el usuario quiere abrirlas durante la charla */}
      {showQuickPills && (
        <div
          className={`p-2.5 border-t shrink-0 flex flex-col gap-1.5 ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/90 border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Accesos rápidos sugeridos:</span>
            </span>
            <button
              onClick={() => setShowQuickPills(false)}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {suggestedQueries.map(sug => {
              const Icon = sug.icon;
              return (
                <button
                  key={sug.id}
                  onClick={() => sendMessage(sug.prompt)}
                  disabled={isLoading}
                  className={`flex items-center justify-between p-1.5 px-2 rounded-lg text-[11px] font-semibold border text-left cursor-pointer transition-all ${
                    isLightMode
                      ? 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-800'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{sug.title}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= ÁREA DE ENTRADA DE TEXTO ================= */}
      <div
        className={`p-3 border-t shrink-0 ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-end space-x-2">
          {/* Botón rápido para abrir sugerencias si el usuario quiere */}
          <button
            onClick={() => setShowQuickPills(!showQuickPills)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              showQuickPills
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Ver mensajes sugeridos rápidos"
            aria-label="Ver mensajes sugeridos rápidos"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntale al Asistente cómo funciona el sistema o pedile interpretar datos..."
              disabled={isLoading}
              className={`w-full rounded-xl px-3 py-2 text-xs resize-none focus:outline-hidden transition-all ${
                isLightMode
                  ? 'bg-slate-100 focus:bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder:text-slate-500'
              }`}
            />
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md ${
              inputPrompt.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
            }`}
            title="Enviar consulta (Enter)"
            aria-label="Enviar consulta"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>
            Presiona <kbd className="px-1 py-0.2 bg-black/10 dark:bg-white/10 rounded font-mono">Enter</kbd> para enviar
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
            <Bot className="w-3 h-3 inline text-emerald-500" />
            <span>Gemini IA + UNRC</span>
          </span>
        </div>
      </div>
    </div>
  );
};

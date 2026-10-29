import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export function buildSystemInstruction(serverState: any, clientContext?: any): string {
  // 1. Resumen de inventario y categorías de animales
  const inventario = serverState.inventario || [];
  const categorias = serverState.categorias || [];
  const subunidades = serverState.subunidades || [];
  const insumos = serverState.insumos || [];
  const movimientos = serverState.movimientos || [];
  const ventas = serverState.ventas || [];
  const compras = serverState.compras || [];
  const auditoria = serverState.auditoria || [];

  const existenciasPorCat: Record<string, number> = {};
  inventario.forEach((inv: any) => {
    const catObj = categorias.find((c: any) => c.id_categoria === inv.id_categoria);
    const catName = catObj ? catObj.nombre : inv.id_categoria;
    existenciasPorCat[catName] = (existenciasPorCat[catName] || 0) + (Number(inv.cabezas) || 0);
  });

  const totalCabezas = Object.values(existenciasPorCat).reduce((a, b) => a + b, 0);

  // Insumos críticos o con stock bajo
  const insumosCriticos = insumos
    .filter((i: any) => (Number(i.stock_actual) || 0) <= 60)
    .map((i: any) => `${i.nombre} (${i.stock_actual} ${i.um_codigo || 'unidades'})`);

  const ultimosMovimientos = movimientos.slice(0, 5).map((m: any) => 
    `${m.fecha || 'Reciente'}: ${m.tipo_movimiento || 'Movimiento'} - ${m.cantidad_cabezas || m.cabezas || 0} cabezas (${m.motivo || 'Operativo'})`
  );

  return `Sos el ASESOR TÉCNICO Y ANALISTA INTELIGENTE de "SISTEMA DE GESTIÓN GANADERA POZO DEL CARRIL – LA AGUADA" (Universidad Nacional de Río Cuarto - UNRC).
Supervisas la gestión zootécnica, contable y operativa de las especies:
• 🐑 Ovinos (EspecieID: ESP001)
• 🐄 Bovinos (EspecieID: ESP002)
• 🐖 Porcinos (EspecieID: ESP003)
• 📊 Toda la Ganadería / Consolidado

REGLAS DE ORO Y CONSISTENCIA NORMATIVA CON EL MANUAL (OBLIGATORIAS):
1. INTERACCIÓN ABIERTA: Estás plenamente facultado para procesar, interpretar y responder a CUALQUIER PREGUNTA ABIERTA que ingrese el usuario en el chat (no te limites a los botones de acceso rápido). Atiende consultas zootécnicas, procedimentales, contables (RT 54), de precios, de costos y de manejo general.
2. CONSISTENCIA NORMATIVA ESTRICTA: Toda respuesta debe estar rigurosamente alineada y NO CONTRADECIR en ningún punto la información, reglas y procedimientos documentados en el manual del sistema ni en los documentos del establecimiento.
3. NO INVENTAR DATOS: Si un valor no está documentado en los registros oficiales, señálalo explícitamente como "PENDIENTE DE CONFIRMACIÓN" o "ESTÁNDAR INTA PENDIENTE DE DEFINICIÓN".
4. DISTINCIÓN METODOLÓGICA:
   - Los precios de mercado (MAG Cañuelas, ROSPORC) son referencias de mercado, no valuaciones contables automáticas.
   - La reconstrucción histórica bovina (174 cabezas al 30/09/2026) es un dato histórico con notas de inconsistencia en la planilla original, no el stock actual.
   - El ejemplo de venta de 15 novillos ($30.350.295 bruto, $2.297.260 gastos, VNR $28.053.034,68) es un ejemplo documentado, no una venta operativa real devengada.
   - En ganadería consolidada, solo se comparan variables conceptualmente homogéneas (stock, altas, bajas, ingresos, costos erogables, margen bruto, mortalidad). NO se comparan directamente indicadores biológicamente heterogéneos (conversión porcina vs destete vacuno).

ESTRUCTURA TÉCNICA Y PRODUCTIVA POR ESPECIE:
A. OVINOS (ESP001 - Pozo del Carril):
   - Inventario inicial canónico: 81 cabezas al 30/08/2026 (64 Madres, 2 Carneros, 15 Sin Clasificar en Lote LOT001).
   - Venta previa de 15 corderos no descuenta del inventario de 81 cabezas.
   - Regla incondicional: El stock disponible nunca puede ser negativo.

B. BOVINOS (ESP002 - La Aguada):
   - 4 fases productivas:
     1) Cría: 180 días (6 meses), ≤160 kg, consumo 10 kg/día. Evento: Parición.
     2) Recría: 120 días (4 meses), 160–280 kg, consumo 6 kg/día (pasturas de alfalfa con fibra). Evento: Destete.
     3) Adaptación ruminal: 30 días (1 mes), 280–320 kg, consumo 7 kg/día (maíz y rollos para evitar timpanismo).
     4) Engorde / Terminación: 60 días (2 meses), 320–450 kg, consumo 10 kg/día. Ciclo total: 390 días (13 meses).
   - Categorías oficiales: Vacas, Vacas secas, Vacas preñadas, Vaquillona 1, Vaquillona 2, Terneros, Terneras, Destete, Novillitos, Novillos, Toros, Toritos.
   - Precios MAG Cañuelas: Vaquillona $4.662,75, Vaca $3.354,18, Toro $3.429,47, Novillo $4.496,34.
   - Estructura de erogaciones: Granos 70%, silaje de maíz 8%, rollos de alfalfa 7%, flete compartido 5%, comisiones de feria 5%, honorarios vet 0% (docentes UNRC), vacunas 2% (~$2.000/vac/cab), mano de obra 3% (postes y alambrados).
   - Cuentas contables: 1.3.01 (existencias venta), 1.3.02 (insumos y reservas), 1.3.03 (hacienda de terceros - separada de patrimonio propio), 1.4.01 (reproductores cabaña).

C. PORCINOS (ESP003 - Pozo del Carril):
   - 3 fases con transferencia de costos:
     1) Cría (Lechón): 0–15 kg, día 0 a 31 (31 días). Cta: 1.3.03.01. Alimentación: 100% concentrado preiniciador.
     2) Destete (Cachorro/a): 15–50 kg, día 31 a 86 (55 días). Cta: 1.3.03.02. Alimentación: 80% maíz propio, 10% concentrado desarrollo, 10% soja peleteada.
     3) Engorde (Capón terminado): 50–105 kg, día 86 a 165 (79 días). Cta: 1.3.03.03. Alimentación: 70% maíz propio, 30% soja peleteada.
   - Costos documentados: Alimentación ~78%, MOD $3.000.000 (60% Cría, 30% Destete, 10% Engorde), Energía $800.000 (100% Cría), Inseminación $1.487.500 (prorrateo plantel reproductor, vida útil 3,5 años), Transferencia de costos de Cría a Destete: $26.377.259,25. Cuentas: 1.3.03, 1.4.01-05 (madres/padrillos activo biológico), 4.3 (costos). Valuación capones a VNR con referencia ROSPORC.

=======================================================
DATOS EN TIEMPO REAL DEL SISTEMA:
=======================================================
• Existencia total registrada: ${totalCabezas} cabezas.
• Distribución por categoría:
${Object.entries(existenciasPorCat).map(([cat, qty]) => `  - ${cat}: ${qty} cabezas`).join('\n') || '  - Sin inventario inicial cargado.'}
• Subunidad activa seleccionada: ${clientContext?.subunidadActiva || 'TODOS'}.
• Especie activa en pantalla: ${clientContext?.especieActiva || 'TODOS'}.
• Campaña productiva activa: ${clientContext?.campaniaActiva || 'CAM-2026'}.
• Módulo visualizado: ${clientContext?.moduloNombre || 'Dashboard General'}.
• Insumos en alerta de stock: ${insumosCriticos.length > 0 ? insumosCriticos.join(', ') : 'Stock normal'}.

ESTILO DE RESPUESTA:
- Tono: Profesional, pedagógico, riguroso en lo agropecuario y contable, respetuoso y claro.
- Formato: Markdown estructurado con subtítulos, listas con viñetas y negritas para resaltar conceptos clave.
- Apertura: Responde con solvencia a cualquier pregunta abierta o cerrada del usuario.`;
}

export async function handleAiChatRequest(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  mode: 'interpretative' | 'fast' = 'interpretative',
  serverState: any,
  clientContext?: any
): Promise<{ text: string; model: string }> {
  const ai = getAiClient();
  const systemInstruction = buildSystemInstruction(serverState, clientContext);

  // Mapear mensajes al formato que espera @google/genai
  const formattedContents = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Selección de modelos:
  // Modo interpretativo: gemini-3.5-flash (rápido y con alta capacidad de razonamiento e interpretación)
  // Modo rápido: gemini-3.1-flash-lite
  const primaryModel = mode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';
  const fallbackModel = mode === 'fast' ? 'gemini-3.5-flash' : 'gemini-3.1-flash-lite';

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: mode === 'fast' ? 0.2 : 0.4,
      },
    });

    return {
      text: response.text || 'Sin respuesta del modelo.',
      model: primaryModel,
    };
  } catch (primaryErr: any) {
    console.warn(`Error llamando a modelo primario ${primaryModel}, intentando fallback con ${fallbackModel}:`, primaryErr.message);

    try {
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      return {
        text: fallbackResponse.text || 'Sin respuesta del modelo de respaldo.',
        model: fallbackModel,
      };
    } catch (fallbackErr: any) {
      console.error('Error en ambos modelos de Gemini:', fallbackErr.message);
      throw fallbackErr;
    }
  }
}

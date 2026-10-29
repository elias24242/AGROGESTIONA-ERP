# Visualización de Benchmarking y Metas Regionales en Business Analytics

Incorporación de una pestaña especializada de **Benchmarking y Metas Regionales** en el módulo de Business Analytics, permitiendo contrastar el rendimiento productivo, operativo y económico de la unidad de negocio contra dos líneas de referencia clave: **Promedios Históricos UNRC** y **Estándares Regionales INTA (Centro-Sur de Córdoba)**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> A partir de las respuestas confirmadas en la fase de consulta:
> 1. **Referencias de Comparación**: Se habilitan **ambas referencias con selector dinámico**:
>    - *Promedio Histórico UNRC*: Basado en el registro multianual acumulado del establecimiento Pozo del Carril.
>    - *Estándar Regional INTA / CREA*: Parámetros zootécnicos y económicos recomendados para la cuenca mixta centro-sur de Córdoba (INTA Manfredi / Marcos Juárez).
> 2. **Formato Visual Principal**: Combinación de **gráfico de radar multidimensional (Spider Chart)** para la visión integral de las 4 perspectivas y **barras comparativas de brecha (Gap Analysis)** para el análisis cuantitativo por indicador.
> 3. **Ubicación en el Módulo**: Se incorpora como la 4ta pestaña principal en el módulo de Business Analytics: `activeSubTab = 'benchmarking'`.

---

## 1. Overview & Core Concept

### A. Propósito de la Herramienta
Permitir a los directores técnicos, docentes de la UNRC y administradores evaluar la competitividad relativa del establecimiento respecto a los estándares de la región pampeana semiárida y a su propio desempeño histórico. Responde preguntas clave como:
* *¿Estamos produciendo por encima o por debajo del estándar zonal del INTA?*
* *¿En qué áreas zootécnicas o de capacitación tenemos una ventaja competitiva y dónde existe una brecha crítica que cerrar?*

### B. Indicadores Comparados en el Benchmark
1. **Zootécnicos & Procesos**: Tasa de Parición (%), Ganancia Diaria de Peso (g/d), Tasa de Mortalidad (%), Carga Animal (cab/ha), Cumplimiento Sanitario (%).
2. **Desarrollo & Capacitación**: Horas de Prácticas y Capacitación (hs/mes), Adopción de Protocolos POEs (%), Competencias Operativas (pts).
3. **Económicos & Clientes**: Margen Bruto sobre Costos Directos (%), Precio Medio Obtenido ($/cab), Tasa de Efectividad en Cobranzas (%).

---

## 2. User Experience & Visual Design

### A. Lineamientos Estéticos y Cumplimiento de Anti-Slop
* **Paleta Semántica 60-30-10**:
  * Curva Actual (UNRC Pozo del Carril): Azul/Índigo `#6366F1` (Área semitransparente con trazo sólido).
  * Curva de Benchmark (INTA / Histórico): Ámbar `#F59E0B` o Esmeralda `#10B981` (Trazo discontinuo punteado).
  * Brechas Positivas (Superávit): Esmeralda `#10B981` con signo `+`.
  * Brechas Negativas (Déficit): Carmesí `#EF4444` con signo `-`.
* **Cero-Pills**: Separadores tipográficos limpios (`·`), sin etiquetas cápsula innecesarias en los títulos.
* **Tipografía Numérica**: Todos los valores, metas de referencia y brechas numéricas utilizarán `font-mono tabular-nums`.

### B. Componentes de la Pestaña 'Benchmarking'
1. **Barra de Control de Referencias**:
   - Selector segmentado: `Estándar Regional INTA / CREA` vs `Promedio Histórico UNRC` vs `Vista Superpuesta (Ambos)`.
   - Selector de subunidad o majada total consolidada.
2. **Gráfico de Radar Multidimensional (Spider Chart)**:
   - Polígono vectorial SVG interactivo de 8 ejes normalizados (0% a 150% del valor de referencia).
   - Tooltips interactivos al posar el cursor sobre cada vértice mostrando el valor actual vs el benchmark.
3. **Panel de Análisis de Brecha (Gap Analysis)**:
   - Listado de barras comparativas duales horizontales mostrando la posición actual frente a la meta zonal.
   - Clasificación directa: **Liderazgo Zonal** (supera al benchmark), **En Rango Esperado** ($\pm 5\%$), y **Brecha a Superar** (déficit $> 5\%$).
4. **Tarjetas de Diagnóstico de Competitividad Regional**:
   - Diagnóstico narrativo de las principales fortalezas y cuellos de botella competitivos.

---

## 3. Key Product Decisions & Trade-Offs

* **Decisión 1: Renderizado SVG Nativo para el Gráfico de Radar**:
  * *Enfoque*: Generación de geometría SVG interactiva y responsiva propia, sin dependencias externas pesadas.
  * *Por qué*: Carga instantánea, estricto apego a las variables de tema claro/oscuro, cero incompatibilidades de librerías y total soporte offline.
* **Decisión 2: Normalización Poligonal de Ejes de Diferente Escala**:
  * *Enfoque*: Cada eje del radar se normaliza al 100% como el valor del benchmark, donde valores $>100\%$ indican superación de la referencia (invirtiendo el cálculo para indicadores donde 'menor es mejor', como mortalidad).
  * *Por qué*: Permite comparar en un solo polígono porcentajes, gramos/día, cabezas/ha y montos en pesos sin distorsión geométrica.

---

## 4. Technical Architecture & Data Strategy

### A. Diagrama de Arquitectura

```
┌────────────────────────────────────────────────────────────────────────┐
│                      BusinessAnalyticsModule.tsx                       │
│  (Pestañas: Decisiones | Explicaciones | Mapa Cruzado | Benchmarking)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     businessAnalyticsService.ts                        │
│   - BENCHMARKS_REGIONALES_INTA (metas zonales Córdoba Centro-Sur)      │
│   - PROMEDIOS_HISTORICOS_UNRC (registro multianual del campo)          │
│   - generarAnalisisBenchmarking(state, year, month, tipoBenchmark)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│     RadarChartBenchmark.tsx     │ │    GapAnalysisBarsTable.tsx     │
│   (Polígono SVG interactivo)    │ │   (Barras comparativas duales)  │
└─────────────────────────────────┘ └─────────────────────────────────┘
```

### B. Módulos y Componentes a Modificar
1. `src/services/businessAnalyticsService.ts`:
   - Incorporar constantes tipadas con las referencias INTA Manfredi y promedios históricos UNRC.
   - Función `generarAnalisisBenchmarking` que computa el valor actual, valor de referencia, brecha porcentual y clasificación de competitividad.
2. `src/modules/BusinessAnalyticsModule.tsx`:
   - Agregar la 4ta opción al selector de pestañas: `activeSubTab = 'benchmarking'`.
   - Renderizar el gráfico de radar interactivo con controles de referencia.
   - Renderizar las barras comparativas de brecha organizadas por perspectiva.
   - Renderizar el resumen ejecutivo de competitividad agropecuaria.

---

## 5. Plan de Verificación

* **Compilación y Linteo**: Ejecución de `lint_applet` y `compile_applet` para asegurar cero errores de TypeScript.
* **Prueba de Interactividad del Radar**: Verificar que el cambio de referencia (INTA vs Histórico UNRC) redibuje suavemente el polígono y recalcule las brechas.
* **Verificación de Inversión en 'Menor es Mejor'**: Confirmar que una menor mortalidad compute como una brecha positiva (ventaja competitiva).

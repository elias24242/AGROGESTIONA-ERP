# Plan de Implementación: Sistema de Gestión Ganadera Pozo del Carril – La Aguada

Evolución arquitectónica e incremental de la plataforma ERP existente hacia un sistema ganadero integral multi-especie (Ovinos, Bovinos, Porcinos y Consolidado), integrando datos transaccionales reales, indicadores del Cuadro de Mando Integral (CMI) y comparativa de tres niveles (Real vs. Pozo del Carril vs. INTA).

---

## Decisiones Críticas y Preferencias Confirmadas (Fase 1)

> [!IMPORTANT]
> Se han incorporado las preferencias de arquitectura y UX validadas en la fase de clarificación interactiva:
> - **Integración de Datos Reales**: Se integran de forma completa e inmediata los 569 movimientos ganaderos y las series mensuales (ventas, costos, márgenes y existencias) de Porcinos y Bovinos provistos en los archivos adjuntos (`Gestion_Ganadera_Integral_724bf9a1.csv` y `Gestion_Ganadera_Integral.xlsx_-_Panel_a6add9d4.csv`).
> - **Navegación**: Menú lateral agrupado en 9 secciones funcionales expandibles/colapsables, garantizando un encabezado limpio y libre de botones de acción descontextualizados.
> - **Tratamiento de Estándares Externos**: Para cualquier indicador sin estándar técnico INTA oficial verificado, se exhibe la etiqueta explícita `"ESTÁNDAR INTA PENDIENTE DE DEFINICIÓN"` con desvío inactivo, sin inferir ni hardcodear valores externos ficticios.

---

## Diagnóstico y Auditoría Previa Obligatoria

| Elemento actual | Problema | Se conserva | Se modifica | Se agrega | Riesgo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Identidad & Branding** (`ERP Ovinos`) | Restringe la visión a una sola especie en header y pantallas. | Lógica de usuario, perfil y sesión institucional UNRC. | Header (`Header.tsx`), metadata, título web e inicio (`PantallaInicio.tsx`). | Denominación `"Sistema de Gestión Ganadera Pozo del Carril – La Aguada"`. | Muy Bajo. |
| **Contexto Global de Especie** | No existía selector multi-especie con impacto transversal. | Modelo reactivo de estado en `App.tsx` y filtros por subunidad/campaña. | Selector de subunidades en Header (se traslada a filtros locales). | Selector global superior derecho: `🐑 Ovinos`, `🐄 Bovinos`, `🐖 Porcinos`, `📊 Toda la Ganadería`. | Bajo (requiere propagar `selectedEspecie` a queries). |
| **Modelo de Datos Hacienda** | Tablas y movimientos centrados en ovinos (madres, carneros, borregas). | Esquema base `MovimientoHacienda`, `Pesaje`, `Produccion`, `Consumo`. | Tipos en `src/types/erp.ts` para aceptar `id_especie` (`ESP001`, `ESP002`, `ESP003`). | Tabla maestra `D_Especie`, categorías bovinas (`BO-MAD`, `BO-TOR`, `BO-TER`, `BO-REC`, `BO-ENG`, `BO-ADA`, `BO-REP`) y porcinas (`PO-MAD`, `PO-LAC`, `PO-DES`, `PO-ENG`). | Medio (debe resguardar datos históricos ovinos). |
| **Datos Transaccionales Bovinos & Porcinos** | Ausencia de historial real para vacunos y cerdos. | Historial ovino preexistente en `initialData.ts`. | `initialData.ts` y almacén local de backend (`server-db-store.json`). | Ingesta de 569 registros reales desde `Gestion_Ganadera_Integral_724bf9a1.csv` y series financieras del Panel. | Bajo (se integra sin sobreescribir ovinos). |
| **Benchmarking e Indicadores** | Comparativa dual (UNRC vs INTA) sin diferenciación de 3 niveles formales. | Lógica de cálculo en `businessAnalyticsService.ts` y componentes de CMI. | `IndicadorSimulator`, `WidgetKpis` y fichas de indicadores CMI. | Estructura de 3 niveles: **1. Real**, **2. Estándar Pozo del Carril**, **3. Estándar INTA** con tabla `F_EstandarIndicador` y trazabilidad de fuente. | Bajo. |
| **Menú y Navegación** | Módulos dispersos en barra lateral plana sin agrupación lógica. | Rutas y componentes funcionales de cada módulo. | `Sidebar.tsx` reorganizado en 9 macro-grupos expandibles. | Subnavegación modular jerárquica y badges de contexto. | Bajo. |
| **Botones en Header** | Botones de subunidades (`Consolidado`, `Cría`, `Recría`, `Engorde`) visibles globalmente. | Lógica de filtrado por subunidad. | `Header.tsx` queda limpio; los selectores de subunidad/lote se mueven al módulo correspondiente. | Control contextual exclusivo en pantallas que lo requieren. | Bajo. |
| **Scroll Horizontal Innecesario** | Contenedores rígidos con anchos fijos forzaban scroll horizontal en viewport de escritorio estándar. | Estructura de tablas y cards informativas. | Clases CSS globales en `index.css` y contenedores en módulos (`table-responsive`, `overflow-x-auto` acotado). | Grid y flex responsive adaptativo al 100% del ancho disponible sin overflow general. | Bajo. |
| **Nómina de Usuarios (Botón Deshabilitar)** | El botón rojo "Deshabilitar" en `ConfiguracionModule` no persistía la inhabilitación. | Listado y permisos RBAC. | Manejador `handleToggleInhabilitarUsuario` en `ConfiguracionModule.tsx`. | Sincronización inmediata con backend (`/api/users`) y actualización de estado `inhabilitado: true`. | Muy Bajo. |

---

## 1. Arquitectura Técnica

### A. Arquitectura Actual
- **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS.
- **Persistencia**: Google Sheets / API Server local (`server-db-store.json`) + caché en `localStorage`.
- **Estructura**: Modelo fuertemente ligado a ovinos (`MajadaModule`, campos `id_subunidad` ovinos).
- **Alcance**: Unidimensional (Ovinos Pozo del Carril).

### B. Arquitectura Objetivo
- **Multi-Tenancy por Dimensión `EspecieID`**:
  - `ESP001` (OVI): Ovinos (Pozo del Carril / La Aguada).
  - `ESP002` (BOV): Bovinos (Cría, Recría, Adaptación, Engorde, Reposición).
  - `ESP003` (POR): Porcinos (Madres, Lactancia, Destete, Engorde).
  - `TODOS`: Toda la Ganadería (Consolidado integral de operaciones y CMI).
- **Desacoplamiento Contextual**:
  - Encabezado global: Selector de Especie + Perfil + Cotización Dólar + Acceso a Ayuda.
  - Filtros locales jerárquicos: Especie $\rightarrow$ Subunidad $\rightarrow$ Categoría $\rightarrow$ Lote $\rightarrow$ Período.
- **Tres Niveles de Análisis**:
  - **Real**: Calculado directamente desde las tablas de hechos (`F_MovimientoAnimal`, `F_Venta`, `F_Costo`).
  - **Estándar Pozo del Carril**: Promedio histórico propio y metas fijadas por el establecimiento.
  - **Estándar INTA**: Documento técnico externo con cita y verificación metodológica.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HEADER GLOBAL (Sistema Ganadero)                     │
│  [Logo UNRC / Marca]  —  [ESPECIE / VISTA: 🐑 OVI | 🐄 BOV | 🐖 POR | 📊 TODOS]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Propaga EspecieID
┌───────────────────────────────────▼────────────────────────────────────┐
│                    SIDEBAR: 9 MACRO-MÓDULOS EXPANDIBLES                │
│  1. Inicio          2. Ganadería    3. Producción     4. Operaciones   │
│  5. Economía & Cble 6. Indicadores  7. Reportes       8. Admin         │
│  9. Manual & Ayuda                                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Renderiza vista
┌───────────────────────────────────▼────────────────────────────────────┐
│                 CONTENEDOR DINÁMICO MULTI-ESPECIE                     │
│  • Resumen Ganadero Consolidado (Métricas compatibles)                 │
│  • Vistas específicas por Especie (Categorías, Pesajes, Sanidad)       │
│  • CMI & Benchmarking 3 Niveles (Real vs Pozo del Carril vs INTA)      │
│  • Registro Unificado de Operaciones Físicas y Contables               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Reorganización de Módulos (9 Macro-Grupos)

1. **INICIO**:
   - Saludo al usuario, estado de la explotación, KPIs consolidados, accesos rápidos y alertas del sistema.
2. **GANADERÍA**:
   - **Resumen Ganadero**: Vista consolidada (Ovinos vs Bovinos vs Porcinos en métricas comparables).
   - **Stock & Existencias**: Inventario por categoría y lote según la especie activa.
   - **Movimientos de Hacienda**: Altas, bajas, traslados, nacimientos y muertes.
   - **Pesajes & Evolución de Peso**: Ganancia diaria de peso vivo (ADPV), pesajes por lote.
3. **PRODUCCIÓN**:
   - Producción física valorizada, sanidad y tratamientos veterinarios, consumos de insumos y parámetros técnicos.
4. **OPERACIONES**:
   - Registro unificado de operaciones, compras de insumos, ventas de hacienda y tesorería (cobros/pagos).
5. **ECONOMÍA Y CONTABILIDAD**:
   - Costos directos e indirectos, margen bruto y operativo por especie, plan de cuentas, devengamiento patrimonial y valuación al VNR.
6. **INDICADORES & CMI**:
   - Cuadro de Mando Integral (4 perspectivas Norton & Kaplan), Benchmarking de 3 niveles (Real vs Pozo del Carril vs INTA), matriz de decisiones prescriptivas y simulador de metas.
7. **REPORTES**:
   - Centro de exportación ejecutiva (PDF autotable, Excel multi-hoja XLSX, trazabilidad por especie).
8. **ADMINISTRACIÓN**:
   - Nómina de usuarios y roles RBAC, catálogo de especies, centros de costo, configuración contable y auditoría de cambios.
9. **MANUAL Y AYUDA**:
   - Manual didáctico interactivo, guía paso a paso "Cómo registrar una operación", glosario conceptual y fichas de indicadores.

---

## 3. Modelo de Datos y Migraciones

### A. Tablas Maestras y de Configuración
- **`D_Especie`** (Nueva):
  - `id_especie` (PK): `ESP001`, `ESP002`, `ESP003`.
  - `codigo`: `OVI`, `BOV`, `POR`.
  - `nombre`: `Ovinos`, `Bovinos`, `Porcinos`.
  - `activo`: `true`.
  - `orden_visual`: `1`, `2`, `3`.
- **`D_CategoriaAnimal`** (Generalizada):
  - `id_categoria` (PK), `id_especie` (FK), `nombre`, `etapa_productiva`, `activo`.
  - Ovinos: `OV-MAD` (Madres), `OV-CAR` (Carneros), `OV-COR` (Corderos/as), `OV-REP` (Reposición).
  - Bovinos: `BO-MAD` (Vacas), `BO-TOR` (Toros), `BO-TER` (Terneros/as), `BO-REC` (Recría), `BO-ADA` (Adaptación), `BO-ENG` (Engorde), `BO-REP` (Reposición).
  - Porcinos: `PO-MAD` (Cerdas madres), `PO-LAC` (Lechones en lactancia), `PO-DES` (Lechones destetados), `PO-ENG` (Cerdos en terminación/engorde).
- **`D_SubunidadProductiva`** (Generalizada con `id_especie`):
  - Subunidades Ovinas (`SUB_CRIA`, `SUB_RECRIA`, `SUB_ENGORDE`).
  - Subunidades Bovinas (`BOV-CRIA`, `BOV-ENG`, `BOV-H0001`).
  - Subunidades Porcinas (`POR-MAD`, `POR-ENG`, `POR-C002` a `POR-C096`).

### B. Tablas Transaccionales
- **`F_MovimientoAnimal`**:
  - Ampliada con `id_especie`, `id_operacion`, `fuente`, `origen`, `tipo_dato` (`REAL`, `SIMULADO`).
  - Se incorporan los 569 registros integrados del archivo CSV.
- **`F_EstandarIndicador`** (Nueva):
  - `id_estandar` (PK), `id_indicador` (FK), `id_especie` (FK), `tipo_estandar` (`POZO_CARRIL` | `INTA` | `OTRO_TECNICO`), `valor`, `unidad`, `fuente`, `documento`, `url`, `fecha_fuente`, `observaciones`, `activo`.

---

## 4. Plan de Implementación por Etapas

### Etapa 1: Corrección UI/UX y selector global de especie
1. Reemplazar texto "ERP Ovinos" en `Header.tsx` por el selector de contexto `ESPECIE / VISTA` con opciones: `🐑 Ovinos`, `🐄 Bovinos`, `🐖 Porcinos`, `📊 Toda la Ganadería`.
2. Limpiar el encabezado global eliminando botones de subunidades; reubicarlos como filtros contextuales locales.
3. Eliminar barras de scroll horizontal general ajustando el contenedor principal y tablas con `table-responsive`.
4. Corregir el botón "Deshabilitar" en `ConfiguracionModule.tsx` para sincronizar con la API de usuarios y persistir el estado inhabilitado.

### Etapa 2: Maestro de Especies y Generalización del Modelo
1. Crear la tabla `D_Especie` en `src/types/erp.ts` e `initialData.ts`.
2. Actualizar las interfaces de entidades (`Categoria`, `Subunidad`, `MovimientoHacienda`, `Pesaje`, `Produccion`, `Consumo`, `Venta`, `Costo`) con `id_especie` FK.
3. Cargar las categorías productivas formales de Bovinos y Porcinos.

### Etapa 3: Ingesta de Datos Reales de Bovinos y Porcinos
1. Integrar los 569 movimientos de hacienda del CSV `Gestion_Ganadera_Integral_724bf9a1.csv`.
2. Incorporar las series mensuales de ventas, costos, cobros y pagos del panel `Gestion_Ganadera_Integral.xlsx_-_Panel_a6add9d4.csv`.
3. Sincronizar existencias acumuladas por especie ($18$ ovinos, $125$ porcinos, $27$ bovinos; total $170$ cabezas al cierre).

### Etapa 4: Módulo Ganadería y Resumen Consolidado
1. Crear el componente `ResumenGanaderoConsolidado.tsx` con comparación estricta de métricas compatibles (stock, ingresos, costos, margen, mortandad).
2. Proporcionar vistas filtradas por especie para ovinos, bovinos y porcinos.
3. Asegurar que las métricas específicas (destete bovino, supervivencia ovina, lechones/cerda porcinos) no se sumen indebidamente en la vista consolidada.

### Etapa 5: Benchmarking de 3 Niveles (Real vs Pozo del Carril vs INTA)
1. Implementar la tabla `F_EstandarIndicador` con los tres niveles de análisis.
2. Adaptar `BusinessAnalyticsModule.tsx` y widgets para mostrar las tres columnas: **Real**, **Pozo del Carril** y **INTA**.
3. Incorporar la etiqueta `"ESTÁNDAR INTA PENDIENTE DE DEFINICIÓN"` cuando no haya documento externo cargado.

### Etapa 6: Reorganización del Menú Lateral y Manual de Operaciones
1. Reestructurar `Sidebar.tsx` en los 9 macro-grupos con paneles colapsables/expandibles.
2. Crear la sección "Cómo Registrar una Operación" dentro del módulo de Ayuda, con ejemplos pedagógicos identificados como `EJEMPLO`.
3. Agregar tooltips explicativos (`?`) en formularios y modales complejos.

### Etapa 7: Verificación, Pruebas y Auditoría
1. Verificar compilación completa (`compile_applet`) y reglas de linter (`lint_applet`).
2. Validar que ninguna funcionalidad, cálculo o filtro ovino previo haya sufrido regresiones.
3. Validar consistencia de los datos consolidados frente a los valores provistos en el panel Excel.

---

## Verificación y Criterios de Aceptación
- **Navegación**: El selector superior derecho conmuta instantáneamente toda la aplicación entre OVI, BOV, POR y CONSOLIDADO.
- **Integridad**: Ningún dato ovino previo se pierde; los 569 movimientos y las series mensuales de panel quedan accesibles.
- **Diseño**: Cero barras de scroll horizontal no deseadas en el layout principal; modales enriquecidos con textos de ayuda; botón de inhabilitar usuarios 100% operativo.
- **Rigor metodológico**: Ningún valor técnico inventado; estándares no homologados se marcan como pendientes de definición.

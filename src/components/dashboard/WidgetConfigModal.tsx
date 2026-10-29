import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  GripVertical,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Move,
  Info,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  WidgetId,
  WidgetDefinition,
  AVAILABLE_WIDGETS,
  UserWidgetPreference,
  DEFAULT_WIDGET_PREFERENCES,
} from './dashboardWidgets';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserWidgetPreference[];
  onSavePreferences: (updated: UserWidgetPreference[]) => void;
  isLightMode?: boolean;
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  isLightMode = false,
}) => {
  // Estado local para manipulación en vivo
  const [items, setItems] = useState<UserWidgetPreference[]>(preferences);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Arrastre del propio modal en pantalla
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Sincronizar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setItems(preferences);
      // Centrar posición
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, preferences]);

  // Manejador del arrastre del modal flotante
  const handleModalMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo permitir arrastrar si se hizo clic en la cabecera y no en botones
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDraggingModal(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingModal) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy,
      });
    };

    const handleMouseUp = () => {
      if (isDraggingModal) {
        setIsDraggingModal(false);
      }
    };

    if (isDraggingModal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingModal]);

  if (!isOpen) return null;

  // Mapa de definiciones
  const widgetDefsMap = new Map<WidgetId, WidgetDefinition>(
    AVAILABLE_WIDGETS.map(w => [w.id, w])
  );

  const visiblesCount = items.filter(i => i.visible).length;
  const totalCount = items.length;

  // Toggle visibilidad de un widget
  const handleToggleVisibility = (id: WidgetId) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    setItems(updated);
    onSavePreferences(updated);
  };

  // Mover arriba
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setItems(newItems);
    onSavePreferences(newItems);
  };

  // Mover abajo
  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setItems(newItems);
    onSavePreferences(newItems);
  };

  // Drag and drop de la lista de widgets
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Soportar Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // No limpiar si sigue dentro del contenedor
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    setItems(newItems);
    onSavePreferences(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Acciones rápidas
  const handleActivarTodos = () => {
    const updated = items.map(i => ({ ...i, visible: true }));
    setItems(updated);
    onSavePreferences(updated);
  };

  const handleSoloEsenciales = () => {
    const esenciales: WidgetId[] = ['resumen_ejecutivo', 'stock_actual', 'proximos_servicios', 'alertas_criticas', 'kpis'];
    const updated = items.map(i => ({
      ...i,
      visible: esenciales.includes(i.id),
    }));
    setItems(updated);
    onSavePreferences(updated);
  };

  const handleRestablecerDefecto = () => {
    const def = [...DEFAULT_WIDGET_PREFERENCES];
    setItems(def);
    onSavePreferences(def);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      {/* Contenedor flotante con posición arrastrable */}
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden transition-shadow ${
          isLightMode
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Cabecera Arrastrable del Modal */}
        <div
          onMouseDown={handleModalMouseDown}
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 cursor-move select-none ${
            isLightMode
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-slate-850 border-slate-800 text-white'
          }`}
          title="Arrastrá esta barra para mover la ventana flotante en tu pantalla"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Personalizar Resúmenes del Dashboard
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold flex items-center space-x-1">
                  <Move className="w-2.5 h-2.5" />
                  <span>Arrastrable</span>
                </span>
              </div>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Seleccioná los resúmenes y arrastrá los módulos para personalizar el orden de visualización
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isLightMode
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Cerrar panel de configuración"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de estado y filtros rápidos */}
        <div
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`font-semibold px-2.5 py-1 rounded-lg border ${
                visiblesCount > 0
                  ? isLightMode
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {visiblesCount} de {totalCount} widgets visibles
            </span>
            <span className={`text-[11px] hidden sm:inline ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              • Los cambios se aplican automáticamente en tiempo real
            </span>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleActivarTodos}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                isLightMode
                  ? 'text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
                  : 'text-indigo-300 hover:bg-indigo-950/60 border border-indigo-500/30'
              }`}
            >
              Activar Todos
            </button>
            <button
              type="button"
              onClick={handleSoloEsenciales}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                isLightMode
                  ? 'text-slate-700 hover:bg-slate-200 border border-slate-200'
                  : 'text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
              title="Activar solo Stock actual, Próximos servicios, Alertas y KPIs"
            >
              Solo Esenciales
            </button>
            <button
              type="button"
              onClick={handleRestablecerDefecto}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center space-x-1 ${
                isLightMode
                  ? 'text-slate-600 hover:bg-slate-200'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Restablecer el orden y selección recomendados de fábrica"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Por defecto</span>
            </button>
          </div>
        </div>

        {/* Lista Arrastrable de Widgets */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 max-h-[60vh]">
          {items.map((item, index) => {
            const def = widgetDefsMap.get(item.id);
            if (!def) return null;

            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group rounded-xl border p-3 sm:p-3.5 transition-all flex items-center justify-between gap-3 ${
                  isDragging
                    ? 'opacity-40 border-dashed border-indigo-500 scale-[0.98]'
                    : isDragOver
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md ring-2 ring-indigo-500/30'
                    : item.visible
                    ? isLightMode
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                    : isLightMode
                    ? 'bg-slate-100/60 border-slate-200/60 opacity-60'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-50'
                }`}
              >
                {/* Agarradera de arrastre y número de orden */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-colors ${
                      isLightMode
                        ? 'text-slate-400 group-hover:text-slate-700 hover:bg-slate-200'
                        : 'text-slate-500 group-hover:text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Arrastrá para reordenar la secuencia"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Número de posición */}
                  <span
                    className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                      item.visible
                        ? isLightMode
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-700 text-slate-200'
                        : isLightMode
                        ? 'bg-slate-200 text-slate-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Información del Widget */}
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4
                        className={`text-sm font-bold truncate ${
                          item.visible
                            ? isLightMode
                              ? 'text-slate-900'
                              : 'text-white'
                            : isLightMode
                            ? 'text-slate-500 line-through'
                            : 'text-slate-400 line-through'
                        }`}
                      >
                        {def.titulo}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${
                          isLightMode
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {def.categoria}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 line-clamp-1 ${
                        isLightMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {def.descripcion}
                    </p>
                  </div>
                </div>

                {/* Controles: Flechas manuales y Toggle Switch */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Flechas para mover paso a paso */}
                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                        isLightMode
                          ? 'text-slate-500 hover:bg-slate-200'
                          : 'text-slate-400 hover:bg-slate-700'
                      }`}
                      title="Subir de posición"
                      aria-label="Subir"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                        isLightMode
                          ? 'text-slate-500 hover:bg-slate-200'
                          : 'text-slate-400 hover:bg-slate-700'
                      }`}
                      title="Bajar de posición"
                      aria-label="Bajar"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interruptor tipo Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(item.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                      item.visible
                        ? 'bg-emerald-600'
                        : isLightMode
                        ? 'bg-slate-300'
                        : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={item.visible}
                    title={item.visible ? 'Ocultar widget' : 'Mostrar widget'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.visible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie del modal con confirmación */}
        <div
          className={`px-5 py-4 border-t flex items-center justify-between gap-3 text-xs ${
            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-850 border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
              Arrastrá las tarjetas usando el ícono de puntos para reordenar
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Listo, Ver Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

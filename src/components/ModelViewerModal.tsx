'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Ruler,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Box,
  Camera,
  Loader2,
  Smartphone,
  Move,
  Calculator,
  Sparkles,
  Check,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { Product } from '@/types';
import WhatsAppButton from './WhatsAppButton';
import { parseImageTransform } from '@/lib/imageUtils';
import { createProcedural3DModel, ProceduralModelType } from '@/lib/modelConverter';
import {
  extractScaleRatio,
  calculatePriceForScale,
  formatMeasurement
} from '@/lib/scaleCalculator';

interface ModelViewerModalProps {
  product: Product | null;
  onClose: () => void;
  isInQuote?: boolean;
  onToggleQuote?: () => void;
}

type ViewMode = 'photo' | '3d';

// ── Lista completa de todas las escalas arquitectónicas y de modelismo ───────
export const ALL_STANDARD_SCALES = [
  'Escala 1:20',
  'Escala 1:25',
  'Escala 1:50',
  'Escala 1:75',
  'Escala 1:100',
  'Escala 1:125',
  'Escala 1:150',
  'Escala 1:200',
  'Escala 1:250',
  'Escala 1:500',
  'Escala Personalizada'
];

// ─── Inyecta el script de model-viewer una sola vez ─────────────────────────
let modelViewerScriptInjected = false;
function ensureModelViewerScript() {
  if (typeof window === 'undefined') return;
  if (modelViewerScriptInjected) return;
  if (customElements.get('model-viewer')) { modelViewerScriptInjected = true; return; }
  const s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
  document.head.appendChild(s);
  modelViewerScriptInjected = true;
}

export default function ModelViewerModal({
  product,
  onClose,
  isInQuote = false,
  onToggleQuote
}: ModelViewerModalProps) {
  const [selectedScale, setSelectedScale] = useState<string>('Personalizada');
  const [customScaleText, setCustomScaleText] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('photo');
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);

  // ── Modelo 3D activo / generado ───────────────────────────────────────────
  const [preview3DUrl, setPreview3DUrl] = useState<string>('');
  const [isGeneratingModal3D, setIsGeneratingModal3D] = useState<boolean>(false);

  // ── Estado de simulador de otra escala ─────────────────────────────────────
  const [showCustomScaleCalc, setShowCustomScaleCalc] = useState(false);
  const [customScaleInput, setCustomScaleInput] = useState('1:64');

  // ── Estado de zoom / pan de la imagen ──────────────────────────────────────
  const [zoomExtra, setZoomExtra] = useState(1);       // multiplicador extra sobre la escala del admin
  const [panX, setPanX] = useState(0);                 // desplazamiento horizontal en px
  const [panY, setPanY] = useState(0);                 // desplazamiento vertical en px
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const modelViewerRef = useRef<HTMLElement | null>(null);

  /* Parsea el encuadre guardado por el admin */
  const imgTransform = product ? parseImageTransform(product.image_position) : { position: '50% 50%', x: 50, y: 50, scale: 1 };

  // La escala total visible = escala-admin × zoom-extra del usuario
  const totalZoom = imgTransform.scale * zoomExtra;

  // Lista de escalas disponibles para este producto (o el catálogo estándar si no se especificaron)
  const availableScales = (product?.scales && product.scales.length > 0)
    ? product.scales
    : ALL_STANDARD_SCALES;

  // ── Reinicia todo al cambiar de producto ────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    setSelectedScale('Personalizada');
    setCustomScaleText('');
    setViewMode('photo');
    setZoomExtra(1);
    setPanX(0);
    setPanY(0);
    setModelLoading(true);
    setModelError(false);
    setPreview3DUrl('');
    setIsGeneratingModal3D(false);
    setShowCustomScaleCalc(false);
    setCustomScaleInput('1:64');
    ensureModelViewerScript();
  }, [product]);

  // Generar figura 3D automática a escala para que el cliente la pueda ver en 3D
  const handleGenerateFallback3D = async () => {
    if (!product) return;
    setIsGeneratingModal3D(true);
    setModelLoading(true);
    setModelError(false);

    try {
      let type: ProceduralModelType = 'box';
      const nameLower = product.name.toLowerCase();
      const catLower = (product.category || '').toLowerCase();

      if (nameLower.includes('persona') || nameLower.includes('humano') || nameLower.includes('gente') || nameLower.includes('figura')) {
        type = 'human';
      } else if (nameLower.includes('farol') || nameLower.includes('poste') || nameLower.includes('luz') || catLower.includes('alumbrado')) {
        type = 'lamp';
      } else if (nameLower.includes('banca') || nameLower.includes('banco') || nameLower.includes('asiento') || catLower.includes('mobiliario')) {
        type = 'bench';
      } else if (nameLower.includes('iglesia') || nameLower.includes('fachada') || nameLower.includes('edificio') || catLower.includes('arquitectura')) {
        type = 'building';
      }

      const result = await createProcedural3DModel(type, product.real_dimensions || { x: 60, y: 120, z: 600 });
      const objectUrl = URL.createObjectURL(result.glbBlob);
      setPreview3DUrl(objectUrl);
      setViewMode('3d');
    } catch (err) {
      console.error('Error al generar modelo 3D en visor:', err);
      setModelError(true);
    } finally {
      setIsGeneratingModal3D(false);
    }
  };

  // ── Eventos de model-viewer usando ref ─────────────────────────────────────
  const attachModelViewerEvents = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    modelViewerRef.current = el;
    const onLoad  = () => { setModelLoading(false); setModelError(false); };
    const onError = () => { setModelLoading(false); setModelError(true); };
    el.addEventListener('load',  onLoad);
    el.addEventListener('error', onError);
    return () => { el.removeEventListener('load', onLoad); el.removeEventListener('error', onError); };
  }, []);

  // ── Selección de escala ───────────────────────────────────────────────────
  const handleScaleSelect = (scaleName: string) => {
    setSelectedScale(scaleName);
  };

  // ── Zoom con la rueda del ratón ─────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoomExtra((prev) => {
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      return Math.min(5, Math.max(0.5, parseFloat((prev + delta).toFixed(2))));
    });
  }, []);

  // ── Pan (arrastrar imagen) ─────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, px: panX, py: panY };
  };
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPanX(dragStart.current.px + (e.clientX - dragStart.current.x));
    setPanY(dragStart.current.py + (e.clientY - dragStart.current.y));
  }, [panX, panY]);
  const handleMouseUp = () => { isDragging.current = false; };

  // ── Reset de vista de imagen ────────────────────────────────────────────────
  const resetImageView = () => { setZoomExtra(1); setPanX(0); setPanY(0); };

  // ── Cerrar al hacer clic en el fondo ───────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!product) return null;

  const hasScales = Boolean(product.scales?.length);
  const activeModelUrl = product.model_url || preview3DUrl;
  const has3D     = Boolean(activeModelUrl);
  const ModelViewerTag = 'model-viewer' as React.ElementType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl bg-[#1B1D21] border border-[#25272C] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[92vh]">

        {/* ── Botón Cerrar ── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-[#111214]/90 hover:bg-[#E50920] text-neutral-300 hover:text-white transition-colors border border-[#25272C] focus:outline-none"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ═══════════════════════════════════════
            PANEL IZQUIERDO — Visualizador
        ═══════════════════════════════════════ */}
        <div className="w-full lg:w-3/5 bg-[#111214] flex flex-col border-b lg:border-b-0 lg:border-r border-[#25272C]">

          {/* Tabs Foto / Visor 3D */}
          <div className="flex items-center gap-1.5 p-3 border-b border-[#25272C]">
            <button
              onClick={() => setViewMode('photo')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'photo'
                  ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/30'
                  : 'bg-[#1B1D21] text-[#A1A1AA] hover:text-white border border-[#25272C]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto</span>
            </button>

            <button
              onClick={() => { setViewMode('3d'); setModelLoading(true); setModelError(false); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/30'
                  : 'bg-[#1B1D21] text-[#A1A1AA] hover:text-white border border-[#25272C]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Visor 3D</span>
            </button>

            {product.category && (
              <span className="ml-auto px-2.5 py-1 rounded-full bg-[#1B1D21] border border-[#25272C] text-[11px] font-bold text-[#E50920] hidden sm:block truncate max-w-[150px]">
                {product.category}
              </span>
            )}
          </div>

          {/* ── Vista FOTO con zoom y pan ── */}
          {viewMode === 'photo' && (
            <div className="flex flex-col flex-1">
              {/* Área de imagen interactiva */}
              <div
                className={`relative overflow-hidden flex items-center justify-center bg-[#0d0d0f] h-[280px] sm:h-[360px] lg:h-[400px] ${isDragging.current ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    draggable={false}
                    className="max-w-none select-none transition-transform duration-150"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: imgTransform.position,
                      transform: `scale(${totalZoom}) translate(${panX / totalZoom}px, ${panY / totalZoom}px)`,
                      transformOrigin: imgTransform.position,
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#1B1D21] border border-[#25272C] flex items-center justify-center">
                      <Camera className="w-8 h-8 text-[#E50920]" />
                    </div>
                    <p className="text-xs font-bold text-white">Sin imagen disponible</p>
                  </div>
                )}

                {/* Indicador de zoom flotante */}
                <div className="absolute top-3 right-3 bg-[#111214]/90 border border-[#25272C] text-[11px] font-mono text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {Math.round(totalZoom * 100)}%
                </div>
              </div>

              {/* Barra de controles */}
              <div className="flex items-center gap-2 py-2.5 px-4 border-t border-[#25272C] bg-[#111214]">
                {/* Zoom out */}
                <button
                  onClick={() => setZoomExtra((z) => Math.max(0.5 / imgTransform.scale, parseFloat((z - 0.15).toFixed(2))))}
                  className="p-2 rounded-xl bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] text-white transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Slider de zoom */}
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.05}
                  value={zoomExtra}
                  onChange={(e) => { setZoomExtra(parseFloat(e.target.value)); setPanX(0); setPanY(0); }}
                  className="flex-1 h-1.5 rounded-full accent-[#E50920] cursor-pointer"
                  title="Zoom"
                />

                {/* Zoom in */}
                <button
                  onClick={() => setZoomExtra((z) => Math.min(5, parseFloat((z + 0.15).toFixed(2))))}
                  className="p-2 rounded-xl bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] text-white transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-[#25272C] mx-1" />

                {/* Reset */}
                <button
                  onClick={resetImageView}
                  className="p-2 rounded-xl bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] text-[#A1A1AA] hover:text-white transition-colors"
                  title="Restablecer vista"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <span className="text-[10px] text-[#A1A1AA] ml-1 hidden sm:flex items-center gap-1">
                  <Move className="w-3 h-3" /> Arrastra · Rueda = zoom
                </span>
              </div>
            </div>
          )}

          {/* ── Vista VISOR 3D ── */}
          {viewMode === '3d' && (
            <div className="relative flex-1 h-[280px] sm:h-[360px] lg:h-[460px] bg-[#111214]">

              {has3D ? (
                <>
                  {/* Spinner de carga */}
                  {modelLoading && !modelError && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#111214]">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-[#1B1D21] border border-[#25272C] flex items-center justify-center">
                          <Box className="w-7 h-7 text-[#E50920]" />
                        </div>
                        <Loader2 className="absolute -top-2 -right-2 w-5 h-5 text-[#E50920] animate-spin" />
                      </div>
                      <p className="text-xs font-bold text-white">Cargando modelo 3D…</p>
                      <p className="text-[11px] text-[#A1A1AA]">Puede tardar unos segundos</p>
                    </div>
                  )}

                  {/* Error de carga */}
                  {modelError && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-8 text-center bg-[#111214]">
                      <div className="w-16 h-16 rounded-2xl bg-[#1B1D21] border border-[#25272C] flex items-center justify-center">
                        <Box className="w-7 h-7 text-[#A1A1AA]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-1">No se pudo cargar el modelo 3D</p>
                        <p className="text-xs text-[#A1A1AA] max-w-xs leading-relaxed">
                          Puede deberse a la conexión o a que el archivo aún no está disponible. Revisa la foto del producto.
                        </p>
                      </div>
                      <button
                        onClick={() => setViewMode('photo')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#E50920] hover:bg-[#f01c31] text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Ver Foto del Producto</span>
                      </button>
                    </div>
                  )}

                  {/* model-viewer — siempre renderizado para que el custom element funcione */}
                  <ModelViewerTag
                    ref={attachModelViewerEvents}
                    src={activeModelUrl}
                    alt={`Modelo 3D de ${product.name}`}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    auto-rotate
                    shadow-intensity="1.2"
                    exposure="1"
                    poster={product.image_url || ''}
                    loading="eager"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '280px',
                      display: 'block',
                      '--poster-color': '#111214',
                    } as React.CSSProperties}
                  />

                  {/* Instrucciones flotantes */}
                  {!modelLoading && !modelError && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2 rounded-full bg-[#1B1D21]/90 border border-[#25272C] text-[10px] text-[#A1A1AA] backdrop-blur-md whitespace-nowrap shadow-md pointer-events-none">
                      <span className="flex items-center gap-1 text-white">
                        <RotateCcw className="w-3 h-3 text-[#E50920]" />
                        Arrastra para girar
                      </span>
                      <span className="text-[#25272C]">•</span>
                      <span className="flex items-center gap-1 text-white">
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                        AR en celular
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Sin modelo 3D cargado aún: opción de generarlo o ver foto */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 text-center p-6 bg-[#111214]">
                  <div className="w-16 h-16 rounded-2xl bg-[#1B1D21] border border-[#25272C] flex items-center justify-center">
                    <Box className="w-8 h-8 text-[#E50920]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Visualizador 3D Interactivo</p>
                    <p className="text-xs text-[#A1A1AA] max-w-xs leading-relaxed">
                      Este producto no tiene archivo 3D asignado aún. Puedes generar una figura 3D a escala ahora mismo para examinarla en 360° o ver la foto real.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateFallback3D}
                      disabled={isGeneratingModal3D}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E50920] to-[#b30718] hover:from-[#f01c31] hover:to-[#E50920] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#E50920]/30 disabled:opacity-50"
                    >
                      {isGeneratingModal3D ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-white" />
                      )}
                      <span>{isGeneratingModal3D ? 'Creando figura 3D...' : '✨ Generar figura 3D de este producto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('photo')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1B1D21] hover:bg-[#25272C] text-[#A1A1AA] hover:text-white text-xs font-semibold rounded-xl border border-[#25272C] transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ver Foto</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════
            PANEL DERECHO — Detalles y Cotización
        ═══════════════════════════════════════ */}
        <div className="w-full lg:w-2/5 p-6 lg:p-7 flex flex-col justify-between bg-[#1B1D21] overflow-y-auto">
          <div className="space-y-5">

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight pr-8">
              {product.name}
            </h2>

            {/* Información de cotización */}
            <div className="p-4 rounded-2xl bg-[#111214] border border-[#25272C] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#A1A1AA] tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#E50920]" />
                  <span>Escala seleccionada: <strong className="text-white text-sm font-black">{selectedScale}</strong></span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                  {selectedScale === 'Personalizada' ? 'A tu medida' : 'Escala común'}
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-white">Precio a consultar</span>
                <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                  Fabricamos este modelo en cualquiera de las escalas más comunes o a tu medida. Contáctanos por WhatsApp para darte el precio exacto y fecha de entrega.
                </p>
              </div>
            </div>

            {/* Selector de Escalas Más Comunes & Personalizada */}
            <div className="space-y-2.5 pt-1 border-t border-[#25272C]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#E50920]" />
                  <span>Elige tu escala:</span>
                </label>
                <span className="text-[10px] text-[#A1A1AA]">Más comunes</span>
              </div>

              {/* Botones de las escalas más comunes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200', 'Personalizada'].map((sc) => {
                  const isSelected = selectedScale === sc;
                  const label = sc === 'Personalizada' ? '✨ Personalizada' : sc;

                  return (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => {
                        setSelectedScale(sc);
                        if (sc !== 'Personalizada') setCustomScaleText('');
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center text-center border ${
                        isSelected
                          ? 'bg-[#E50920] text-white border-[#E50920] shadow-md shadow-[#E50920]/30 font-black'
                          : 'bg-[#111214] text-[#A1A1AA] hover:text-white border-[#25272C] hover:border-[#E50920]/50'
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Si elige Personalizada, permitir escribir medida opcional */}
              {selectedScale === 'Personalizada' && (
                <div className="pt-2 space-y-1.5">
                  <input
                    type="text"
                    value={customScaleText}
                    onChange={(e) => setCustomScaleText(e.target.value)}
                    placeholder="Escribe tu medida (ej. 1:25, 1:125, o cm deseados)..."
                    className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-[#A1A1AA]">
                    Opcional: puedes escribirla aquí o decirnos directamente en WhatsApp.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[#A1A1AA] text-xs leading-relaxed border-t border-[#25272C] pt-3">
              {product.description}
            </p>

            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E50920] shrink-0" />
                <span>Fabricación personalizada y acabado de alta precisión</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E50920] shrink-0" />
                <span>Escala: <strong className="text-white font-mono">{selectedScale === 'Personalizada' && customScaleText.trim() ? customScaleText.trim() : selectedScale}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E50920] shrink-0" />
                <span>Atención directa con el taller y envíos a todo México</span>
              </li>
            </ul>
          </div>

          {/* Cotización directa por WhatsApp y cotización múltiple */}
          <div className="mt-6 pt-4 border-t border-[#25272C] space-y-2.5">
            {/* Opción para agregar a cotización múltiple */}
            {onToggleQuote && (
              <button
                type="button"
                onClick={onToggleQuote}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  isInQuote
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-[#111214] hover:bg-[#25272C] text-[#E4E4E7] hover:text-white border-[#25272C] hover:border-[#E50920]/50'
                }`}
              >
                {isInQuote ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>✓ En tu lista de cotización (clic para quitar)</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-[#E50920]" />
                    <span>+ Agregar a mi lista para cotizar varios</span>
                  </>
                )}
              </button>
            )}

            <WhatsAppButton
              productName={
                selectedScale === 'Personalizada' && customScaleText.trim()
                  ? `${product.name} (Escala: ${customScaleText.trim()})`
                  : `${product.name} (${selectedScale})`
              }
              variant="full"
              label="Cotizar solo este por WhatsApp"
            />
            <p className="text-[10px] text-center text-[#A1A1AA]">
              Respuesta directa del encargado.{' '}
              <span className="text-white font-bold">Lun–Sáb 8–20 hrs.</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

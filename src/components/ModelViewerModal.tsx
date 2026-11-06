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
} from 'lucide-react';
import { Product } from '@/types';
import WhatsAppButton from './WhatsAppButton';
import { parseImageTransform } from '@/lib/imageUtils';

interface ModelViewerModalProps {
  product: Product | null;
  onClose: () => void;
}

type ViewMode = 'photo' | '3d';

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

export default function ModelViewerModal({ product, onClose }: ModelViewerModalProps) {
  const [selectedScale, setSelectedScale] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('photo');
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);

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

  // ── Reinicia todo al cambiar de producto ────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    const firstScale = product.scales?.length ? product.scales[0] : '';
    setSelectedScale(firstScale);
    setCurrentPrice(product.price);
    setViewMode('photo');
    setZoomExtra(1);
    setPanX(0);
    setPanY(0);
    setModelLoading(true);
    setModelError(false);
    ensureModelViewerScript();
  }, [product]);

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

  // ── Actualiza precio al cambiar escala ──────────────────────────────────────
  const handleScaleSelect = (scaleName: string) => {
    setSelectedScale(scaleName);
    const match = product?.scale_prices?.find((sp) => sp.scale === scaleName);
    setCurrentPrice(match ? match.price : (product?.price ?? 0));
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
  const has3D     = Boolean(product.model_url);
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
                    src={product.model_url}
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
                /* Sin modelo 3D disponible */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-20 h-20 rounded-3xl bg-[#1B1D21] border border-[#25272C] flex items-center justify-center">
                    <Box className="w-9 h-9 text-[#E50920]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Modelo 3D en preparación</p>
                    <p className="text-xs text-[#A1A1AA] max-w-xs leading-relaxed">
                      Este producto aún no tiene modelo 3D cargado. Puedes ver la fotografía con detalle en la pestaña <strong className="text-white">Foto</strong>.
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

            {/* Precio dinámico */}
            <div className="p-4 rounded-2xl bg-[#111214] border border-[#25272C]">
              <span className="block text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider mb-1">
                {hasScales ? `Precio para ${selectedScale || 'escala base'}` : 'Precio base'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#E50920]">${currentPrice.toFixed(2)}</span>
                <span className="text-xs text-[#A1A1AA] font-bold">MXN</span>
              </div>
            </div>

            {/* Selector de Escalas */}
            {hasScales && (
              <div className="space-y-2.5 pt-1 border-t border-[#25272C]">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#E50920]" />
                  <span>Selecciona la Escala:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.scales!.map((sc) => {
                    const priceMatch = product.scale_prices?.find((sp) => sp.scale === sc);
                    const itemPrice  = priceMatch ? priceMatch.price : product.price;
                    return (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => handleScaleSelect(sc)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border ${
                          selectedScale === sc
                            ? 'bg-[#E50920] text-white border-[#E50920] shadow-md shadow-[#E50920]/30'
                            : 'bg-[#111214] text-[#A1A1AA] hover:text-white border-[#25272C] hover:border-[#E50920]/50'
                        }`}
                      >
                        <span className="truncate max-w-[110px]">{sc}</span>
                        <span className={`text-[11px] font-black ${selectedScale === sc ? 'text-white' : 'text-[#E50920]'}`}>
                          ${itemPrice.toFixed(2)} MXN
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[#A1A1AA] text-xs leading-relaxed border-t border-[#25272C] pt-3">
              {product.description}
            </p>

            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E50920] shrink-0" />
                <span>Fabricación personalizada y acabado de alta precisión</span>
              </li>
              {selectedScale && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Escala: <strong className="text-white">{selectedScale}</strong></span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E50920] shrink-0" />
                <span>Envíos protegidos a todo México</span>
              </li>
            </ul>
          </div>

          {/* Cotización WhatsApp */}
          <div className="mt-6 pt-4 border-t border-[#25272C] space-y-2.5">
            <WhatsAppButton
              productName={
                selectedScale
                  ? `${product.name} (${selectedScale} — $${currentPrice.toFixed(2)} MXN)`
                  : `${product.name} ($${currentPrice.toFixed(2)} MXN)`
              }
              variant="full"
              label={`Cotizar — $${currentPrice.toFixed(2)} MXN`}
            />
            <p className="text-[10px] text-center text-[#A1A1AA]">
              Respuesta en minutos.{' '}
              <span className="text-white font-bold">Lun–Sáb 8–20 hrs.</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

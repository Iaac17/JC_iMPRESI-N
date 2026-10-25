'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Box, RotateCcw, Smartphone, CheckCircle, Ruler } from 'lucide-react';
import { Product, ScalePrice } from '@/types';
import WhatsAppButton from './WhatsAppButton';

interface ModelViewerModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ModelViewerModal({ product, onClose }: ModelViewerModalProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [selectedScale, setSelectedScale] = useState<string>('Escala 1:50');
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    if (product) {
      if (product.scales && product.scales.length > 0) {
        setSelectedScale(product.scales[0]);
      }
      setCurrentPrice(product.price);
    }
  }, [product]);

  // Actualizar el precio dinámicamente según la escala elegida
  const handleScaleSelect = (scaleName: string) => {
    setSelectedScale(scaleName);
    if (product && product.scale_prices) {
      const match = product.scale_prices.find((sp) => sp.scale === scaleName);
      if (match) {
        setCurrentPrice(match.price);
        return;
      }
    }
    if (product) {
      setCurrentPrice(product.price);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  if (!product) return null;

  const ModelViewerTag = 'model-viewer' as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]">
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700"
          aria-label="Cerrar visor"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visor 3D */}
        <div className="w-full lg:w-3/5 h-[350px] lg:h-auto bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-neutral-800">
          {/* Badge AR */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-800/60 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-xs font-bold text-red-300">Visor 3D + Realidad Aumentada (AR)</span>
          </div>

          {/* Componente <model-viewer> */}
          {product.model_url ? (
            <ModelViewerTag
              src={product.model_url}
              alt={`Modelo 3D de ${product.name}`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1.5"
              shadow-softness="0.8"
              exposure="1"
              poster={product.image_url}
              loading="lazy"
              style={{ width: '100%', height: '100%', minHeight: '300px' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
              <Box className="w-16 h-16 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                Modelo 3D para maqueta en renderizado.
              </p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-1.5 rounded-full bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 backdrop-blur-sm">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-red-400" /> Arrastra 360°
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" /> Probar AR en cel
            </span>
          </div>
        </div>

        {/* Detalles del Producto de Maqueta */}
        <div className="w-full lg:w-2/5 p-6 lg:p-8 flex flex-col justify-between bg-neutral-900 overflow-y-auto">
          <div className="space-y-4">
            {product.category && (
              <span className="inline-block px-3 py-1 rounded-md bg-neutral-800 text-red-400 text-xs font-bold uppercase tracking-wider">
                {product.category}
              </span>
            )}
            <h2 className="text-2xl font-bold text-white tracking-tight">{product.name}</h2>
            
            {/* PRECIO DINÁMICO SEGÚN LA ESCALA SELECCIONADA */}
            <div className="flex items-baseline gap-2 bg-neutral-950/70 p-3 rounded-2xl border border-neutral-800">
              <div>
                <span className="block text-[10px] uppercase font-bold text-red-400">Precio en {selectedScale}:</span>
                <span className="text-3xl font-black text-red-500">${currentPrice.toFixed(2)}</span>
              </div>
              <span className="text-xs text-neutral-400 font-semibold">USD</span>
            </div>

            {/* SELECTOR DE ESCALAS Y SUS PRECIOS */}
            {product.scales && product.scales.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-red-400" /> Selecciona la Escala de la Maqueta:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.scales.map((sc) => {
                    const priceMatch = product.scale_prices?.find((sp) => sp.scale === sc);
                    const itemPrice = priceMatch ? priceMatch.price : product.price;

                    return (
                      <button
                        key={sc}
                        onClick={() => handleScaleSelect(sc)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                          selectedScale === sc
                            ? 'bg-red-600 text-white shadow-md shadow-red-950/60 ring-2 ring-red-400 border-red-500'
                            : 'bg-neutral-950 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span>{sc}</span>
                        <span className={`text-[11px] font-black ${selectedScale === sc ? 'text-white' : 'text-red-400'}`}>
                          ${itemPrice.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-neutral-300 text-xs leading-relaxed border-t border-b border-neutral-800 py-3">
              {product.description}
            </p>

            <div className="space-y-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Impresión 3D de alta definición para maquetas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Escala: <strong className="text-white font-bold">{selectedScale}</strong> (${currentPrice.toFixed(2)})</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-800 space-y-3">
            <WhatsAppButton
              productName={`${product.name} en ${selectedScale} (Precio: $${currentPrice.toFixed(2)})`}
              variant="full"
              label={`Pedir ${selectedScale} ($${currentPrice.toFixed(2)}) a 967 371 8208`}
            />
            <p className="text-[11px] text-center text-neutral-500">
              Se enviará la especificación de <strong className="text-white">{selectedScale}</strong> con su precio de <strong className="text-red-400">${currentPrice.toFixed(2)}</strong> directamente a WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

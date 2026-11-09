'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Move, ZoomIn, ZoomOut, RotateCcw, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { parseImageTransform, formatImageTransform } from '@/lib/imageUtils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ImagePositionEditorProps {
  imageUrl: string;
  imagePosition: string; // formato "X% Y%|zoom" o "center"
  onImageUrlChange: (newUrl: string) => void;
  onPositionChange: (newPositionString: string) => void;
}

export default function ImagePositionEditor({
  imageUrl,
  imagePosition,
  onImageUrlChange,
  onPositionChange
}: ImagePositionEditorProps) {
  const initial = parseImageTransform(imagePosition);

  const [posX, setPosX] = useState<number>(initial.x);
  const [posY, setPosY] = useState<number>(initial.y);
  const [scale, setScale] = useState<number>(initial.scale || 1);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Referencia para drag interactivo con el ratón sobre la imagen
  const previewRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startDragRef = useRef<{ x: number; y: number; initialPosX: number; initialPosY: number }>({
    x: 0,
    y: 0,
    initialPosX: initial.x,
    initialPosY: initial.y
  });

  // Sincronizar si cambia externamente (ej. al editar otro producto)
  useEffect(() => {
    const parsed = parseImageTransform(imagePosition);
    setPosX(parsed.x);
    setPosY(parsed.y);
    setScale(parsed.scale || 1);
  }, [imagePosition, imageUrl]);

  // Actualizar el valor padre formateado
  const updateTransform = (newX: number, newY: number, newScale: number) => {
    setPosX(newX);
    setPosY(newY);
    setScale(newScale);
    const formatted = formatImageTransform(newX, newY, newScale);
    onPositionChange(formatted);
  };

  // Subida de imagen genérica (para input file o drag & drop)
  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo debe ser una imagen válida (JPG, PNG o WebP).');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // 1. Si Supabase está configurado, subir directamente a Supabase Storage (evita el límite de 4.5 MB de Vercel)
      if (isSupabaseConfigured()) {
        try {
          const sanitizedBase = (file.name || 'foto.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileName = `${Date.now()}_${sanitizedBase}`;
          const targetBuckets = ['product-images', 'images', 'models'];
          
          for (const bucketName of targetBuckets) {
            const { error: uploadErr } = await supabase.storage
              .from(bucketName)
              .upload(`uploads/${fileName}`, file, {
                contentType: file.type || 'image/jpeg',
                upsert: true
              });

            if (!uploadErr) {
              const publicUrl = supabase.storage
                .from(bucketName)
                .getPublicUrl(`uploads/${fileName}`).data.publicUrl;
              onImageUrlChange(publicUrl);
              updateTransform(50, 50, 1);
              return;
            }
          }
        } catch (storageErr) {
          console.warn('Subida directa de imagen a Supabase falló, usando API del servidor:', storageErr);
        }
      }

      // 2. Si no hay Supabase o falló la subida directa, verificar tamaño antes de enviar al servidor
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > 4.2) {
        throw new Error(
          `La imagen (${fileSizeMb.toFixed(1)} MB) supera el límite de 4.5 MB del servidor (Error 413). ` +
          `Por favor selecciona una imagen más ligera o habilita Supabase Storage.`
        );
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('La imagen es demasiado pesada para el servidor (Error 413). Selecciona una imagen menor a 4.5 MB.');
        }
        let msg = 'Error al subir la imagen';
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {
          const txt = await res.text().catch(() => '');
          if (txt) msg = `Error ${res.status}: ${txt.slice(0, 80)}`;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      onImageUrlChange(data.imageUrl);
      updateTransform(50, 50, 1);
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      setUploadError(err.message || 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImageFile(file);
  };

  // Eventos de arrastre con el ratón para mover el encuadre libremente
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewRef.current) return;
    isDraggingRef.current = true;
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPosX: posX,
      initialPosY: posY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const deltaX = e.clientX - startDragRef.current.x;
    const deltaY = e.clientY - startDragRef.current.y;

    const percentChangeX = -(deltaX / rect.width) * 100;
    const percentChangeY = -(deltaY / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, Math.round(startDragRef.current.initialPosX + percentChangeX)));
    const newY = Math.max(0, Math.min(100, Math.round(startDragRef.current.initialPosY + percentChangeY)));

    updateTransform(newX, newY, scale);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleReset = () => {
    updateTransform(50, 50, 1);
  };

  const handleRemovePhoto = () => {
    onImageUrlChange('');
    handleReset();
  };

  return (
    <div className="space-y-4">
      {/* 1. ZONA DE CARGA VISUAL */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#E50920]" />
            <span>Fotografía del Producto *</span>
          </label>
          <span className="text-[11px] text-[#A1A1AA]">Formatos: JPG, PNG, WebP</span>
        </div>

        {!imageUrl ? (
          /* Zona de arrastrar y soltar o explorar cuando no hay imagen */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              isDragOver
                ? 'border-[#E50920] bg-[#E50920]/10'
                : 'border-[#25272C] hover:border-[#E50920]/70 bg-[#111214]'
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-[#E50920]">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="text-xs font-medium text-white">Subiendo fotografía...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 rounded-full bg-[#1B1D21] border border-[#25272C] text-[#E50920] shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Arrastra tu imagen aquí o <span className="text-[#E50920] underline font-bold">haz clic para examinar</span>
                  </p>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Recomendado: fotografía clara con buena iluminación
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Cabecera cuando ya hay foto cargada con opciones para cambiar o eliminar */
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111214] border border-[#25272C]">
            <div className="flex items-center gap-2 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{imageUrl.split('/').pop()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] px-2.5 py-1 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-white cursor-pointer transition-colors flex items-center gap-1 font-medium">
                <Upload className="w-3 h-3 text-[#E50920]" />
                <span>Cambiar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[11px] px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center gap-1"
                title="Quitar foto"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Quitar</span>
              </button>
            </div>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl mt-2">
            ⚠️ {uploadError}
          </p>
        )}

        {/* Opción secundaria: link manual */}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-[11px] text-[#A1A1AA] hover:text-white underline transition-colors"
          >
            {showManualUrl ? 'Ocultar enlace web' : '¿Prefieres ingresar una URL o ruta web?'}
          </button>
        </div>

        {showManualUrl && (
          <div className="mt-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg o /images/..."
              className="w-full px-3 py-2 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs focus:outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* 2. EDITOR INTERACTIVO DE ENCUADRE Y TAMAÑO */}
      {imageUrl && (
        <div className="space-y-3 p-3.5 rounded-xl bg-[#111214] border border-[#25272C]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Move className="w-3.5 h-3.5 text-[#E50920]" />
              <span>Ajuste de Encuadre & Tamaño (Zoom)</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-white bg-[#1B1D21] hover:bg-[#25272C] px-2 py-1 rounded-lg border border-[#25272C] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Centrar</span>
            </button>
          </div>

          {/* Lienzo Interactivo con Arrastre libre */}
          <div
            ref={previewRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full h-48 rounded-xl overflow-hidden border border-[#25272C] bg-[#111214] cursor-grab active:cursor-grabbing select-none"
            title="Haz clic y arrastra para encuadrar la pieza"
          >
            <img
              src={imageUrl}
              alt="Ajuste de encuadre"
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-75 pointer-events-none"
              style={{
                objectPosition: `${posX}% ${posY}%`,
                transform: `scale(${scale})`
              }}
            />

            {/* Ayuda flotante */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <span className="bg-[#111214]/85 backdrop-blur-sm text-neutral-300 text-[10px] px-2 py-0.5 rounded border border-[#25272C]">
                Arrastra para mover
              </span>
              <span className="bg-[#111214]/85 backdrop-blur-sm text-white font-mono text-[10px] px-2 py-0.5 rounded border border-[#25272C]">
                Zoom: {Math.round(scale * 100)}% | X:{posX}% Y:{posY}%
              </span>
            </div>
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#A1A1AA] flex items-center gap-1 shrink-0">
              <ZoomIn className="w-3.5 h-3.5 text-[#E50920]" />
              <span>Zoom</span>
            </span>

            <button
              type="button"
              onClick={() => updateTransform(posX, posY, Math.max(0.5, scale - 0.1))}
              className="p-1 rounded-lg bg-[#1B1D21] hover:bg-[#25272C] text-neutral-300 border border-[#25272C]"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => updateTransform(posX, posY, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#25272C] rounded-lg appearance-none cursor-pointer accent-[#E50920]"
            />

            <button
              type="button"
              onClick={() => updateTransform(posX, posY, Math.min(2.5, scale + 0.1))}
              className="p-1 rounded-lg bg-[#1B1D21] hover:bg-[#25272C] text-neutral-300 border border-[#25272C]"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs font-mono font-bold text-white w-10 text-right shrink-0">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

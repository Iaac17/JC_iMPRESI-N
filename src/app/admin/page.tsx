'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import {
  Box,
  PlusCircle,
  FileSpreadsheet,
  MessageSquare,
  LogOut,
  Upload,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Check,
  Package,
  Loader2,
  ExternalLink,
  Save,
  X,
  Move,
  Download,
  FileCode,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Product, Review } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { convertModelToGlb } from '@/lib/modelConverter';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'reviews'>('single');

  // Estados para Carga / Edición Individual
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Maquetas - Alumbrado');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosition, setImagePosition] = useState('center');
  const [modelUrl, setModelUrl] = useState('');
  const [rawModelUrl, setRawModelUrl] = useState('');
  const [rawModelName, setRawModelName] = useState('');
  const [isConvertingModel, setIsConvertingModel] = useState(false);
  const [conversionStatus, setConversionStatus] = useState('');
  const [modelUploadError, setModelUploadError] = useState('');
  const [productScales, setProductScales] = useState('Escala 1:50, Escala 1:75, Escala 1:100, Escala 1:200');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productSuccessMsg, setProductSuccessMsg] = useState('');

  // Estados para Carga Masiva (CSV)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvData, setParsedCsvData] = useState<any[]>([]);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Estados para Productos y Reseñas
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem('taller3d_admin_authenticated');
    if (!isAuth) {
      router.push('/admin/login');
    } else {
      setAuthenticated(true);
      fetchDashboardData();
    }
  }, [router]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const resProd = await fetch('/api/products');
      if (resProd.ok) {
        const prodData = await resProd.json();
        setProductsList(prodData);
      }

      const resRev = await fetch('/api/reviews?includePending=true');
      if (resRev.ok) {
        const revData: Review[] = await resRev.json();
        setPendingReviews(revData.filter((r) => !r.approved));
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('taller3d_admin_authenticated');
    router.push('/admin/login');
  };

  // Subida y conversión automática de STL / OBJ a GLB en el momento de subirlo
  const handleModelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConvertingModel(true);
    setConversionStatus(`Analizando ${file.name}...`);
    setModelUploadError('');

    try {
      setConversionStatus(`Convirtiendo ${file.name} a formato web (.glb)...`);
      const result = await convertModelToGlb(file);

      setConversionStatus('Guardando archivo original y versión 3D en el servidor...');
      const formData = new FormData();
      formData.append('rawFile', result.originalFile);
      formData.append('glbFile', result.glbBlob, `${file.name.replace(/\.[^/.]+$/, '')}.glb`);
      formData.append('rawName', result.originalName);

      const res = await fetch('/api/upload-model', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el archivo 3D');

      setModelUrl(data.model_url);
      setRawModelUrl(data.raw_model_url);
      setRawModelName(data.raw_model_name);
      setConversionStatus(`¡Diseño ${result.originalName} procesado y listo!`);
    } catch (err: any) {
      console.error('Error al procesar modelo 3D:', err);
      setModelUploadError(err.message || 'Error al procesar el archivo 3D');
    } finally {
      setIsConvertingModel(false);
    }
  };

  // Cargar datos en el formulario para editar
  const startEditingProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductDesc(prod.description);
    setProductPrice(prod.price.toString());
    setProductCategory(prod.category || 'Maquetas');
    setImageUrl(prod.image_url);
    setImagePosition(prod.image_position || 'center');
    setModelUrl(prod.model_url || '');
    setRawModelUrl(prod.raw_model_url || '');
    setRawModelName(prod.raw_model_name || '');
    setConversionStatus('');
    setModelUploadError('');
    setProductScales(prod.scales ? prod.scales.join(', ') : 'Escala 1:50, Escala 1:100, Escala 1:200');
    setProductSuccessMsg('');
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setProductName('');
    setProductDesc('');
    setProductPrice('');
    setImageUrl('');
    setImagePosition('center');
    setModelUrl('');
    setRawModelUrl('');
    setRawModelName('');
    setConversionStatus('');
    setModelUploadError('');
    setProductScales('Escala 1:50, Escala 1:75, Escala 1:100, Escala 1:200');
    setProductSuccessMsg('');
  };

  // Guardar (Nuevo o Editado)
  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    setProductSuccessMsg('');

    try {
      const scalesArray = productScales
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        id: editingProduct ? editingProduct.id : undefined,
        name: productName,
        description: productDesc,
        price: parseFloat(productPrice),
        category: productCategory,
        image_url: imageUrl || '/images/maquetas/maqueta_farolas.jpg',
        image_position: imagePosition,
        model_url: modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb',
        raw_model_url: rawModelUrl || undefined,
        raw_model_name: rawModelName || undefined,
        scales: scalesArray
      };

      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProductSuccessMsg(
          editingProduct
            ? '¡Encuadre, foto y datos actualizados correctamente!'
            : '¡Nuevo producto de maqueta agregado al catálogo!'
        );
        cancelEditing();
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error al guardar producto:', err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error al borrar producto:', err);
    }
  };

  // Carga Masiva (CSV)
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedCsvData(results.data);
        }
      });
    }
  };

  const handleBulkImportSubmit = async () => {
    if (parsedCsvData.length === 0) return;
    setIsImportingBulk(true);
    setBulkSuccessMsg('');

    try {
      const formattedItems = parsedCsvData.map((row) => ({
        name: row.nombre || row.name || 'Producto Maqueta',
        description: row.descripcion || row.description || '',
        price: parseFloat(row.precio || row.price || '0'),
        category: row.categoria || row.category || 'Maquetas',
        image_url: row.imagen_url || row.image_url || '/images/maquetas/maqueta_farolas.jpg',
        image_position: row.imagen_posicion || row.image_position || 'center',
        model_url: row.modelo_url || row.model_url || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb',
        scales: ['Escala 1:50', 'Escala 1:100', 'Escala 1:200']
      }));

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedItems)
      });

      if (res.ok) {
        setBulkSuccessMsg(`¡${formattedItems.length} productos de maquetas importados correctamente!`);
        setCsvFile(null);
        setParsedCsvData([]);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error en carga masiva:', err);
    } finally {
      setIsImportingBulk(false);
    }
  };

  // Moderación de Reseñas
  const handleApproveReview = async (id: string) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved: true })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error al aprobar reseña:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error al borrar reseña:', err);
    }
  };

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header del Panel */}
      <header className="bg-neutral-900 border-b border-red-900/30 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 text-white shadow-md shadow-red-950/50">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                JC_iMPRESIÓN 3D <span className="text-red-500 font-bold text-xs">| Panel de Administración</span>
              </h1>
              <p className="text-xs text-neutral-400">Edición de Fotos, Posición/Encuadre, Descripciones y Precios</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <span>Ver Sitio Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-rose-300 hover:text-rose-200 border border-neutral-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <div className="bg-neutral-900/50 border-b border-neutral-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'single'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Gestión & Encuadre de Productos</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bulk'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Carga Masiva (CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'reviews'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Moderación de Comentarios</span>
            {pendingReviews.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                {pendingReviews.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Pestaña 1: Carga y Edición Individual con Ajuste de Posición */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario de Creación / Edición */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {editingProduct ? (
                    <>
                      <Edit className="w-5 h-5 text-amber-400" />
                      <span>Editar Producto & Posición de Foto</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5 text-red-500" />
                      <span>Agregar Producto de Maqueta</span>
                    </>
                  )}
                </h2>
                {editingProduct && (
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2.5 py-1 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
              </div>

              {productSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{productSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSingleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej. Farolas de Alumbrado Público (Maqueta)"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Categoría de Maqueta</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="Maquetas - Alumbrado">Maquetas - Alumbrado</option>
                    <option value="Maquetas - Mobiliario Urbano">Maquetas - Mobiliario Urbano</option>
                    <option value="Maquetas - Arquitectura">Maquetas - Arquitectura</option>
                    <option value="Maquetas - Transporte">Maquetas - Transporte</option>
                    <option value="Maquetas - Sets Completos">Maquetas - Sets Completos</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Precio Base (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="35.00"
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Escalas Disponibles</label>
                    <input
                      type="text"
                      value={productScales}
                      onChange={(e) => setProductScales(e.target.value)}
                      placeholder="Escala 1:50, Escala 1:100, Escala 1:200"
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Descripción de la Maqueta *</label>
                  <textarea
                    rows={3}
                    required
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Descripción detallada de la maqueta, escalas, colores y materiales..."
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>

                {/* Ruta de Fotografía y Selector de Encuadre/Posición */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Ruta o URL Imagen Fotográfica</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/maquetas/maqueta_farolas.jpg"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />

                  {/* CONTROL DE POSICIÓN / ENCUADRE DE FOTO */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-amber-400" /> Posición / Encuadre de la Foto (para ocultar bordes o centrar):
                    </label>
                    <select
                      value={imagePosition}
                      onChange={(e) => setImagePosition(e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-amber-500/50 rounded-xl text-amber-300 font-semibold text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="center">Centro (por defecto)</option>
                      <option value="top">Arriba (Enfocar parte superior)</option>
                      <option value="bottom">Abajo (Enfocar parte inferior)</option>
                      <option value="left">Izquierda (Enfocar parte izquierda)</option>
                      <option value="right">Derecha (Enfocar parte derecha)</option>
                      <option value="top left">Arriba Izquierda</option>
                      <option value="top right">Arriba Derecha</option>
                      <option value="bottom left">Abajo Izquierda</option>
                      <option value="bottom right">Abajo Derecha</option>
                      <option value="center 20%">Centro ligeramente arriba</option>
                      <option value="center 80%">Centro ligeramente abajo</option>
                    </select>
                  </div>

                  {/* Previsualización en Vivo del Encuadre */}
                  {imageUrl && (
                    <div className="mt-2 space-y-1">
                      <span className="block text-[10px] text-neutral-400">Previsualización del encuadre guardado:</span>
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-amber-500/30 bg-neutral-950 shadow-inner">
                        <img
                          src={imageUrl}
                          alt="Previsualización"
                          className="w-full h-full object-cover transition-all"
                          style={{ objectPosition: imagePosition }}
                        />
                        <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-amber-400 font-bold border border-amber-500/30">
                          Posición: {imagePosition}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECCIÓN DE SUBIDA DIRECTA Y CONVERSIÓN DE MODELO 3D (.STL, .OBJ, .GLB) */}
                <div className="space-y-3 pt-3 border-t border-neutral-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-red-500" /> Diseño 3D (.stl, .obj o .glb)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Convierte directo a .GLB
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Sube tu archivo <strong className="text-white">.stl</strong> o <strong className="text-white">.obj</strong> desde tu computadora. La plataforma lo convierte al instante a <strong className="text-white">.glb</strong> para el visor web y guarda el original para que solo tú como administrador lo descargues.
                  </p>

                  {/* Botón / Área de arrastrar y soltar archivo */}
                  <div className="relative border-2 border-dashed border-neutral-700 hover:border-red-500/60 bg-neutral-950/70 rounded-2xl p-4 text-center transition-all">
                    <input
                      type="file"
                      accept=".stl,.obj,.glb"
                      onChange={handleModelFileChange}
                      disabled={isConvertingModel}
                      className="hidden"
                      id="modelFileInput"
                    />
                    <label
                      htmlFor="modelFileInput"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      {isConvertingModel ? (
                        <div className="flex flex-col items-center gap-2 py-3">
                          <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
                          <span className="text-xs text-amber-300 font-bold animate-pulse">
                            {conversionStatus || 'Procesando y convirtiendo diseño 3D...'}
                          </span>
                          <span className="text-[10px] text-neutral-400">Esto toma solo unos segundos...</span>
                        </div>
                      ) : (
                        <>
                          <div className="p-2.5 rounded-full bg-red-950/50 border border-red-800/50 text-red-400 shadow-inner">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white hover:text-red-400 transition-colors">
                              Haz clic para seleccionar tu diseño (.stl, .obj, .glb)
                            </span>
                            <span className="block text-[10px] text-neutral-500 mt-0.5">
                              Formatos compatibles: STL de impresión 3D, OBJ o GLB web
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Estado de éxito de conversión */}
                  {conversionStatus && !isConvertingModel && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{conversionStatus}</span>
                    </div>
                  )}

                  {/* Error si ocurre alguno */}
                  {modelUploadError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{modelUploadError}</span>
                    </div>
                  )}

                  {/* Archivos vinculados actualmente */}
                  {(rawModelName || modelUrl) && (
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
                      {rawModelName && (
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-emerald-400" /> Archivo Original (Descargable por ti):
                          </span>
                          <span className="font-bold text-emerald-400 text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            {rawModelName}
                          </span>
                        </div>
                      )}
                      {modelUrl && (
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-red-400" /> Modelo Web Visor (.glb):
                          </span>
                          <span className="font-mono text-[10px] text-neutral-400 truncate max-w-[180px]">
                            {modelUrl.split('/').pop()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Opción avanzada: escribir URL manual */}
                  <details className="text-[11px] text-neutral-500 group">
                    <summary className="cursor-pointer hover:text-neutral-400 select-none">
                      O pegar URL manual de modelo .glb
                    </summary>
                    <input
                      type="text"
                      value={modelUrl}
                      onChange={(e) => setModelUrl(e.target.value)}
                      placeholder="https://.../modelo.glb"
                      className="mt-1.5 w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 text-xs focus:outline-none focus:border-red-500"
                    />
                  </details>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className={`w-full flex items-center justify-center gap-2 py-3 font-bold text-xs rounded-xl transition-all disabled:opacity-50 ${
                    editingProduct
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50'
                  }`}
                >
                  {isSubmittingProduct ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingProduct ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios y Posición</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Agregar Producto de Maqueta</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Lista de Productos con Indicación de Encuadre */}
            <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-500" /> Catálogo de Maquetas ({productsList.length})
                </span>
                <span className="text-xs font-normal text-neutral-400">Haz clic en Editar para encuadrar fotos</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Foto & Posición</th>
                      <th className="p-3">Categoría / Escalas</th>
                      <th className="p-3">Diseño 3D (Descarga Admin)</th>
                      <th className="p-3">Precio</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {productsList.map((prod) => (
                      <tr key={prod.id} className={`hover:bg-neutral-850 ${editingProduct?.id === prod.id ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''}`}>
                        <td className="p-3 font-semibold text-white flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0 relative border border-neutral-700 shadow-inner">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: prod.image_position || 'center' }}
                            />
                          </div>
                          <div>
                            <span className="block text-white font-bold">{prod.name}</span>
                            <span className="block text-[10px] text-amber-400">Posición: {prod.image_position || 'center'}</span>
                            <span className="block text-[10px] text-neutral-400 truncate max-w-xs">{prod.description}</span>
                          </div>
                        </td>
                        <td className="p-3 text-neutral-400">
                          <span className="block font-semibold text-neutral-200">{prod.category || 'Maquetas'}</span>
                          <span className="block text-[10px] text-red-400">{prod.scales ? prod.scales.join(', ') : '1:50, 1:100'}</span>
                        </td>
                        <td className="p-3">
                          {prod.raw_model_url ? (
                            <a
                              href={`/api/download-model?url=${encodeURIComponent(prod.raw_model_url)}&name=${encodeURIComponent(prod.raw_model_name || prod.name + '.stl')}`}
                              download
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition-all shadow-sm"
                              title={`Descargar archivo de taller: ${prod.raw_model_name || 'STL/OBJ'}`}
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Descargar {prod.raw_model_name ? prod.raw_model_name.split('.').pop()?.toUpperCase() : 'STL'}</span>
                            </a>
                          ) : prod.model_url ? (
                            <a
                              href={prod.model_url}
                              target="_blank"
                              download
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-[10px] border border-neutral-700 transition-colors"
                              title="Descargar archivo .GLB"
                            >
                              <Download className="w-3 h-3 text-neutral-400" />
                              <span>Descargar GLB</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-neutral-500 italic">Sin archivo 3D</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-red-400">${prod.price.toFixed(2)}</td>
                        <td className="p-3 text-right space-x-1.5">
                          {/* Botón EDITAR */}
                          <button
                            onClick={() => startEditingProduct(prod)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                            title="Editar imagen, encuadre y descripción"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Botón ELIMINAR */}
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 2: Carga Masiva (CSV) */}
        {activeTab === 'bulk' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-red-500" />
                <span>Importación Masiva de Modelos para Maquetas (CSV)</span>
              </h2>
              <p className="text-neutral-400 text-xs mt-1">
                Sube una lista en CSV con los campos: <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">nombre</code>, <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">descripcion</code>, <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">precio</code>, <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">imagen_url</code>, <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">imagen_posicion</code>, <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">modelo_url</code>.
              </p>
            </div>

            {bulkSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-neutral-700 hover:border-red-600/50 rounded-2xl p-8 text-center bg-neutral-950/50 transition-colors">
              <Upload className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white mb-1">Selecciona tu archivo .CSV de maquetas</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="hidden"
                id="csvInput"
              />
              <label
                htmlFor="csvInput"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                <span>Explorar Archivos CSV</span>
              </label>
            </div>

            {parsedCsvData.length > 0 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Previsualización del Archivo ({parsedCsvData.length} maquetas listas)
                  </h3>
                  <button
                    onClick={handleBulkImportSubmit}
                    disabled={isImportingBulk}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg"
                  >
                    {isImportingBulk ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar e Importar {parsedCsvData.length} Productos</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto max-h-80 border border-neutral-800 rounded-xl bg-neutral-950">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Precio</th>
                        <th className="p-3">Posición Foto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {parsedCsvData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-neutral-900/50">
                          <td className="p-3 font-semibold text-white">{row.nombre || row.name}</td>
                          <td className="p-3 text-neutral-400 truncate max-w-xs">{row.descripcion || row.description}</td>
                          <td className="p-3 text-red-400 font-bold">${row.precio || row.price}</td>
                          <td className="p-3 text-amber-400">{row.imagen_posicion || row.image_position || 'center'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña 3: Moderación de Reseñas */}
        {activeTab === 'reviews' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-red-500" />
                  <span>Moderación de Comentarios y Reseñas Pendientes</span>
                </h2>
                <p className="text-neutral-400 text-xs mt-1">
                  Los comentarios de los estudiantes y arquitectos entran con estado <code className="text-red-400 bg-neutral-950 px-1 py-0.5 rounded">aprobado = false</code>.
                </p>
              </div>
              <span className="px-3 py-1 bg-red-950 text-red-400 border border-red-800/60 rounded-full text-xs font-semibold">
                {pendingReviews.length} pendientes
              </span>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-neutral-950/50 border border-neutral-800 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">¡No hay opiniones pendientes!</h3>
                <p className="text-xs text-neutral-400">Todas las reseñas han sido moderadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{rev.author_name}</span>
                        <span className="text-xs text-red-400 font-semibold">★ {rev.rating} / 5</span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 italic">"{rev.comment}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveReview(rev.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprobar y Publicar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs rounded-xl transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

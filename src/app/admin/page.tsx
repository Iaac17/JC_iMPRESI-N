'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import {
  Box,
  PlusCircle,
  FileSpreadsheet,
  MessageSquare,
  LogOut,
  Upload,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
  Package,
  Loader2,
  ExternalLink,
  Save,
  X,
  Download,
  FileCode,
  AlertCircle,
  Sparkles,
  Mail,
  Phone,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  HelpCircle,
  ShieldCheck,
  User,
  CheckCheck,
  Calculator,
  Ruler,
  Info
} from 'lucide-react';
import { Product, Review, ContactMessage, ScalePrice } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { convertModelToGlb } from '@/lib/modelConverter';
import ImagePositionEditor from '@/components/ImagePositionEditor';
import { parseImageTransform } from '@/lib/imageUtils';

// Categorías sugeridas para facilitar la selección a principiantes
const SUGGESTED_CATEGORIES = [
  'Refrigeración & Línea Blanca',
  'Maquetas - Alumbrado',
  'Maquetas - Mobiliario Urbano',
  'Maquetas - Arquitectura',
  'Maquetas - Transporte',
  'Maquetas - Sets Completos',
  'Hogar & Organización',
  'Herramientas & Repuestos',
  'Coleccionables & Figuras'
];

// Escalas comunes sugeridas para maquetas y piezas
const QUICK_SCALES = ['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200', 'Universal', 'A Medida'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'bulk' | 'reviews' | 'messages'>('products');

  // Estados para Carga / Edición Individual de Productos
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Refrigeración & Línea Blanca');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productScales, setProductScales] = useState('Escala 1:50, Escala 1:100, Escala 1:200');
  const [scalePrices, setScalePrices] = useState<ScalePrice[]>([
    { scale: 'Escala 1:50', price: 0 },
    { scale: 'Escala 1:100', price: 0 },
    { scale: 'Escala 1:200', price: 0 }
  ]);
  const [showScaleGuide, setShowScaleGuide] = useState(false);
  const [productDesc, setProductDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosition, setImagePosition] = useState('50% 50%|1.0');

  // Estados para Modelo 3D
  const [modelUrl, setModelUrl] = useState('');
  const [rawModelUrl, setRawModelUrl] = useState('');
  const [rawModelName, setRawModelName] = useState('');
  const [isConvertingModel, setIsConvertingModel] = useState(false);
  const [conversionStatus, setConversionStatus] = useState('');
  const [modelUploadError, setModelUploadError] = useState('');
  const [showManual3DUrl, setShowManual3DUrl] = useState(false);

  // Estados de Formulario y Notificaciones
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados del Catálogo (Filtros, Búsqueda, Orden y Paginación)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'name-asc' | 'price-asc' | 'price-desc'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Estados para Modales de Acción (Eliminar y Vista Previa)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewingProduct, setPreviewingProduct] = useState<Product | null>(null);

  // Estados para Carga Masiva (CSV)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvData, setParsedCsvData] = useState<any[]>([]);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para Productos, Reseñas y Mensajes
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Verificación de autenticación
  useEffect(() => {
    const isAuth = localStorage.getItem('taller3d_admin_authenticated');
    if (!isAuth) {
      router.push('/admin/login');
    } else {
      setAuthenticated(true);
      fetchDashboardData();
    }
  }, [router]);

  // Carga de datos de la plataforma
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

      const resMsg = await fetch('/api/contact');
      if (resMsg.ok) {
        const msgData: ContactMessage[] = await resMsg.json();
        setContactMessages(msgData);
      }
    } catch (err) {
      console.error('Error al cargar datos del panel:', err);
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

  // Subida y conversión automática de STL / OBJ a GLB
  const handleModelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConvertingModel(true);
    setConversionStatus(`Analizando ${file.name}...`);
    setModelUploadError('');

    try {
      setConversionStatus(`Optimizando ${file.name} para visualización 3D web...`);
      const result = await convertModelToGlb(file);

      setConversionStatus('Guardando modelo y preparando visor 3D...');
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
      setConversionStatus(`¡Modelo 3D "${result.originalName}" listo para tus clientes!`);
    } catch (err: any) {
      console.error('Error al procesar modelo 3D:', err);
      setModelUploadError(err.message || 'Error al procesar el archivo 3D. Asegúrate de que sea .stl, .obj o .glb');
    } finally {
      setIsConvertingModel(false);
    }
  };

  const handleRemove3DModel = () => {
    setModelUrl('');
    setRawModelUrl('');
    setRawModelName('');
    setConversionStatus('');
    setModelUploadError('');
  };

  // Cálculo inteligente de precios por escala según los porcentajes recomendados
  const calculateSuggestedPrices = (basePriceNum: number, scalesString: string): ScalePrice[] => {
    const scalesArr = scalesString
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (scalesArr.length === 0) return [];
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      return scalesArr.map((sc) => ({ scale: sc, price: 0 }));
    }

    return scalesArr.map((scaleName) => {
      let multiplier = 1.0;
      const lower = scaleName.toLowerCase();

      if (lower.includes('1:50') || lower.includes('1/50')) {
        multiplier = 1.6; // +60% por mayor volumen y horas de impresión
      } else if (lower.includes('1:75') || lower.includes('1/75')) {
        multiplier = 1.25; // +25%
      } else if (lower.includes('1:100') || lower.includes('1/100')) {
        multiplier = 1.0; // Precio Base estándar (100%)
      } else if (lower.includes('1:200') || lower.includes('1/200')) {
        multiplier = 0.7; // -30% (pieza más pequeña)
      } else if (lower.includes('grande') || lower.includes('familiar')) {
        multiplier = 1.35; // +35% para refri o piezas de línea blanca
      } else if (lower.includes('medida') || lower.includes('personalizad')) {
        multiplier = 1.5; // +50% por ajuste de diseño 3D a medida
      }

      // Redondear a números limpios
      const calculated = Math.round(basePriceNum * multiplier);
      return { scale: scaleName, price: calculated };
    });
  };

  // Actualizar precio de una escala específica
  const handleScalePriceChange = (scaleName: string, newPrice: number) => {
    setScalePrices((prev) =>
      prev.map((sp) => (sp.scale === scaleName ? { ...sp, price: Math.max(0, newPrice) } : sp))
    );
  };

  // Preparar producto para edición
  const startEditingProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductDesc(prod.description);
    setProductPrice(prod.price.toString());

    const cat = prod.category || 'General';
    if (SUGGESTED_CATEGORIES.includes(cat)) {
      setProductCategory(cat);
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setProductCategory('custom');
      setIsCustomCategory(true);
      setCustomCategoryInput(cat);
    }

    const scalesStr = prod.scales ? prod.scales.join(', ') : 'Escala 1:50, Escala 1:100, Escala 1:200';
    setProductScales(scalesStr);

    if (prod.scale_prices && prod.scale_prices.length > 0) {
      setScalePrices(prod.scale_prices);
    } else {
      setScalePrices(calculateSuggestedPrices(prod.price, scalesStr));
    }

    setImageUrl(prod.image_url);
    setImagePosition(prod.image_position || '50% 50%|1.0');
    setModelUrl(prod.model_url || '');
    setRawModelUrl(prod.raw_model_url || '');
    setRawModelName(prod.raw_model_name || '');
    setConversionStatus('');
    setModelUploadError('');
    setFormFeedback(null);

    // Scroll suave hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setProductName('');
    setProductDesc('');
    setProductPrice('');
    setProductCategory('Refrigeración & Línea Blanca');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setImageUrl('');
    setImagePosition('50% 50%|1.0');
    setModelUrl('');
    setRawModelUrl('');
    setRawModelName('');
    setConversionStatus('');
    setModelUploadError('');
    const defaultScales = 'Escala 1:50, Escala 1:100, Escala 1:200';
    setProductScales(defaultScales);
    setScalePrices(calculateSuggestedPrices(0, defaultScales));
    setFormFeedback(null);
  };

  // Guardar producto (Crear o Actualizar)
  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    // Validaciones amigables
    if (!productName.trim()) {
      setFormFeedback({ type: 'error', message: 'Por favor ingresa un nombre para el producto.' });
      return;
    }

    const priceNum = parseFloat(productPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormFeedback({ type: 'error', message: 'Por favor ingresa un precio base válido.' });
      return;
    }

    if (!imageUrl.trim()) {
      setFormFeedback({ type: 'error', message: 'Por favor sube una fotografía del producto para tus clientes.' });
      return;
    }

    setIsSubmittingProduct(true);

    try {
      const finalCategory = isCustomCategory
        ? (customCategoryInput.trim() || 'General')
        : productCategory;

      const scalesArray = productScales
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const finalScalePrices = scalePrices.length > 0
        ? scalePrices
        : calculateSuggestedPrices(priceNum, productScales);

      const payload = {
        id: editingProduct ? editingProduct.id : undefined,
        name: productName.trim(),
        description: productDesc.trim(),
        price: priceNum,
        scale_prices: finalScalePrices,
        category: finalCategory,
        image_url: imageUrl,
        image_position: imagePosition,
        model_url: modelUrl || '',
        raw_model_url: rawModelUrl || undefined,
        raw_model_name: rawModelName || undefined,
        scales: scalesArray.length > 0 ? scalesArray : ['Medida Estándar']
      };

      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo guardar el producto');
      }

      setFormFeedback({
        type: 'success',
        message: editingProduct
          ? `¡"${productName}" actualizado correctamente!`
          : `¡"${productName}" agregado al catálogo con éxito!`
      });

      cancelEditing();
      fetchDashboardData();
    } catch (err: any) {
      console.error('Error al guardar producto:', err);
      setFormFeedback({ type: 'error', message: err.message || 'Error al guardar el producto. Intenta nuevamente.' });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Confirmación y eliminación de producto
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/products?id=${productToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProductsList((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setProductToDelete(null);
      } else {
        alert('No se pudo eliminar el producto.');
      }
    } catch (err) {
      console.error('Error al borrar producto:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Carga Masiva (CSV)
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setBulkFeedback(null);
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
    setBulkFeedback(null);

    try {
      const formattedItems = parsedCsvData.map((row) => ({
        name: row.nombre || row.name || 'Producto Nuevo',
        description: row.descripcion || row.description || '',
        price: parseFloat(row.precio || row.price || '0'),
        category: row.categoria || row.category || 'General',
        image_url: row.imagen_url || row.image_url || '/images/maquetas/maqueta_farolas.jpg',
        image_position: row.imagen_posicion || row.image_position || '50% 50%|1.0',
        model_url: row.modelo_url || row.model_url || '',
        scales: ['Escala 1:50', 'Escala 1:100', 'Escala 1:200']
      }));

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedItems)
      });

      if (res.ok) {
        setBulkFeedback({
          type: 'success',
          message: `¡Se importaron ${formattedItems.length} productos correctamente al catálogo!`
        });
        setCsvFile(null);
        setParsedCsvData([]);
        fetchDashboardData();
      } else {
        throw new Error('Error al guardar los registros en el servidor');
      }
    } catch (err: any) {
      console.error('Error en carga masiva:', err);
      setBulkFeedback({
        type: 'error',
        message: err.message || 'Error al procesar el archivo CSV. Revisa el formato de las columnas.'
      });
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
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Error al aprobar reseña:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Error al borrar reseña:', err);
    }
  };

  // Eliminación de Mensaje de Contacto
  const handleDeleteContactMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/contact?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Error al borrar mensaje:', err);
    }
  };

  // Alternar escalas rápidas con un clic y actualizar precios sugeridos
  const toggleQuickScale = (scaleName: string) => {
    const currentScales = productScales
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let updated: string[];
    if (currentScales.includes(scaleName)) {
      updated = currentScales.filter((s) => s !== scaleName);
    } else {
      updated = [...currentScales, scaleName];
    }
    const newScalesStr = updated.join(', ');
    setProductScales(newScalesStr);

    const priceNum = parseFloat(productPrice) || 0;
    if (priceNum > 0) {
      setScalePrices(calculateSuggestedPrices(priceNum, newScalesStr));
    }
  };

  // Filtrado, Búsqueda y Ordenamiento de Productos en el Catálogo
  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    // Filtro por Categoría
    if (filterCategory !== 'all') {
      result = result.filter((p) => (p.category?.trim() || 'General') === filterCategory);
    }

    // Buscador por Nombre o Descripción
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      // date-desc por defecto
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [productsList, filterCategory, searchQuery, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Lista de categorías únicas para el filtro
  const availableCategories = useMemo(() => {
    return Array.from(new Set(productsList.map((p) => p.category?.trim() || 'General'))).filter(Boolean);
  }, [productsList]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#111214] text-white flex flex-col font-sans selection:bg-[#E50920] selection:text-white">

      {/* 1. ENCABEZADO SUPERIOR */}
      <header className="bg-[#1B1D21] border-b border-[#25272C] px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo y Nombre de Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50920] text-white flex items-center justify-center shadow-lg shadow-[#E50920]/25 font-black text-sm tracking-wider">
              JC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-tight">JC_IMPRESIÓN 3D</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#25272C] text-[#A1A1AA] text-[10px] font-semibold uppercase tracking-wider border border-[#25272C]">
                  Panel Admin
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] hidden sm:block">
                Gestión de Catálogo, Modelos 3D y Atención a Clientes
              </p>
            </div>
          </div>

          {/* Acciones y Perfil */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-xs font-medium text-white transition-colors border border-[#25272C]"
              title="Abrir la tienda en una nueva pestaña"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#A1A1AA]" />
            </a>

            {/* Identificación de Usuario */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#25272C]">
              <div className="w-8 h-8 rounded-full bg-[#25272C] flex items-center justify-center text-xs font-bold text-white border border-[#32353B]">
                <User className="w-4 h-4 text-[#A1A1AA]" />
              </div>
              <div className="text-left text-xs">
                <span className="block font-semibold text-white leading-tight">Administrador</span>
                <span className="block text-[10px] text-emerald-400 font-mono">En línea</span>
              </div>
            </div>

            {/* Botón Salir */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-300 hover:text-rose-200 border border-rose-500/20 transition-colors"
              title="Cerrar sesión de forma segura"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BARRA DE NAVEGACIÓN PRINCIPAL */}
      <nav className="bg-[#1B1D21]/80 backdrop-blur-md border-b border-[#25272C] px-4 sm:px-8 py-2.5 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">

          {/* Pestaña: Productos */}
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'products'
                ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/25'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#25272C]'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'products' ? 'bg-black/30 text-white' : 'bg-[#25272C] text-[#A1A1AA]'
              }`}>
              {productsList.length}
            </span>
          </button>

          {/* Pestaña: Carga Masiva CSV */}
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'bulk'
                ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/25'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#25272C]'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Carga Masiva (CSV)</span>
          </button>

          {/* Pestaña: Comentarios */}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${activeTab === 'reviews'
                ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/25'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#25272C]'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comentarios</span>
            {pendingReviews.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                {pendingReviews.length}
              </span>
            )}
          </button>

          {/* Pestaña: Mensajes */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${activeTab === 'messages'
                ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/25'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#25272C]'
              }`}
          >
            <Mail className="w-4 h-4" />
            <span>Mensajes</span>
            {contactMessages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E50920] text-white font-bold">
                {contactMessages.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-8">

        {/* ======================================================== */}
        {/* PESTAÑA 1: GESTIÓN DE PRODUCTOS (FORMULARIO + CATÁLOGO) */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ÁREA A: FORMULARIO PARA AGREGAR O EDITAR PRODUCTOS */}
            <div className="lg:col-span-5 bg-[#1B1D21] border border-[#25272C] rounded-2xl p-6 shadow-xl space-y-5 lg:sticky lg:top-[135px]">

              {/* Título del Formulario */}
              <div className="flex items-center justify-between pb-3 border-b border-[#25272C]">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {editingProduct ? (
                      <>
                        <Edit3 className="w-5 h-5 text-amber-400" />
                        <span>Editar Producto</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5 text-[#E50920]" />
                        <span>Agregar Nuevo Producto</span>
                      </>
                    )}
                  </h2>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    {editingProduct
                      ? 'Modifica los datos, encuadre o archivo 3D de esta pieza'
                      : 'Completa la información para publicar en el catálogo web'}
                  </p>
                </div>

                {editingProduct && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-white bg-[#25272C] hover:bg-[#32353B] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                )}
              </div>

              {/* Notificación de Éxito / Error */}
              {formFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 transition-all ${formFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                >
                  {formFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1 font-medium leading-relaxed">{formFeedback.message}</span>
                  <button
                    type="button"
                    onClick={() => setFormFeedback(null)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleSingleProductSubmit} className="space-y-5">

                {/* 1. SECCIÓN: INFORMACIÓN GENERAL */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                    <span className="w-1.5 h-3.5 bg-[#E50920] rounded-full" />
                    <span>1. Información General</span>
                  </div>

                  {/* Nombre del Producto */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ej. Estante Modular para Refrigerador"
                      className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Categoría y Subcategoría */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-300">
                        Categoría / Sección *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(!isCustomCategory);
                          if (!isCustomCategory) setCustomCategoryInput('');
                        }}
                        className="text-[11px] text-[#E50920] hover:underline font-medium"
                      >
                        {isCustomCategory ? '← Elegir de la lista' : '+ Nueva categoría personalizada'}
                      </button>
                    </div>

                    {isCustomCategory ? (
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Escribe el nombre de la nueva categoría (ej. Refri, Figuras, etc.)"
                        className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#E50920]/70 rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                      />
                    ) : (
                      <select
                        value={productCategory}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsCustomCategory(true);
                          } else {
                            setProductCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs focus:outline-none transition-colors"
                      >
                        {SUGGESTED_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="custom">+ Escribir otra categoría personalizada...</option>
                      </select>
                    )}
                  </div>

                  {/* Precio Base y Escalas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-neutral-300">
                          Precio Base (MXN) *
                        </label>
                        <span className="text-[10px] text-[#A1A1AA]">Escala 1:100</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A1A1AA]">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={productPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProductPrice(val);
                            const num = parseFloat(val) || 0;
                            setScalePrices(calculateSuggestedPrices(num, productScales));
                          }}
                          placeholder="350.00"
                          className="w-full pl-7 pr-12 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A1A1AA]">
                          MXN
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Escalas / Medidas
                      </label>
                      <input
                        type="text"
                        value={productScales}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductScales(val);
                          const num = parseFloat(productPrice) || 0;
                          setScalePrices(calculateSuggestedPrices(num, val));
                        }}
                        placeholder="1:50, 1:100, Universal"
                        className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Atajos de Escalas Frecuentes */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#A1A1AA]">Haz clic para agregar o quitar escalas rápidas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SCALES.map((sc) => {
                        const isIncluded = productScales.toLowerCase().includes(sc.toLowerCase());
                        return (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => toggleQuickScale(sc)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border ${isIncluded
                                ? 'bg-[#E50920]/20 border-[#E50920]/50 text-white font-semibold'
                                : 'bg-[#111214] border-[#25272C] text-[#A1A1AA] hover:text-white'
                              }`}
                          >
                            {isIncluded ? '✓ ' : '+ '}
                            {sc}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DESGLOSE AUTOMÁTICO DE PRECIOS POR ESCALA */}
                  {scalePrices.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#111214] border border-[#25272C] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-[#E50920]" />
                          <span>Precios calculados por escala:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseFloat(productPrice) || 0;
                            setScalePrices(calculateSuggestedPrices(num, productScales));
                          }}
                          className="text-[10px] text-[#A1A1AA] hover:text-white underline flex items-center gap-1"
                          title="Volver a calcular automáticamente según porcentajes sugeridos"
                        >
                          <Sparkles className="w-3 h-3 text-[#E50920]" />
                          <span>Recalcular</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {scalePrices.map((sp) => (
                          <div
                            key={sp.scale}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#1B1D21] border border-[#25272C]"
                          >
                            <span className="text-[11px] font-medium text-neutral-300 truncate max-w-[120px]">
                              {sp.scale}:
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-[#A1A1AA]">$</span>
                              <input
                                type="number"
                                step="1"
                                value={sp.price || ''}
                                onChange={(e) => handleScalePriceChange(sp.scale, parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-0.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded text-right text-xs font-bold text-white focus:outline-none"
                              />
                              <span className="text-[10px] text-[#A1A1AA]">MXN</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#A1A1AA]">
                        💡 Tip: Se calculan con +60% en 1:50 (pieza grande), precio base en 1:100 y -30% en 1:200 (pieza chica). Puedes editar cualquier casilla si quieres redondear el precio.
                      </p>
                    </div>
                  )}

                  {/* GUÍA DE TAMAÑOS EN CM / MM (DESPLEGABLE) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowScaleGuide(!showScaleGuide)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#111214] hover:bg-[#1B1D21] border border-[#25272C] text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-[#E50920]" />
                        <span>📐 ¿Cuánto mide cada escala en cm y cómo imprimirla?</span>
                      </span>
                      <span className="text-[11px] text-[#E50920]">
                        {showScaleGuide ? 'Ocultar guía ▲' : 'Ver guía ▼'}
                      </span>
                    </button>

                    {showScaleGuide && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-[#111214] border border-[#25272C] space-y-3 text-xs text-neutral-300">
                        <div className="p-2.5 rounded-lg bg-[#1B1D21] border border-[#25272C] space-y-1">
                          <p className="font-bold text-white flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-[#E50920]" />
                            <span>La fórmula mágica para saber el tamaño:</span>
                          </p>
                          <p className="text-[11px] text-[#A1A1AA] font-mono bg-[#111214] p-1.5 rounded border border-[#25272C]">
                            Tamaño real (en cm) ÷ Número de escala = Tamaño en la maqueta (en cm)
                          </p>
                        </div>

                        {/* Tabla de Referencia de Tamaños Típicos */}
                        <div className="overflow-x-auto rounded-lg border border-[#25272C]">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-[#1B1D21] text-[#A1A1AA] uppercase text-[9px] border-b border-[#25272C]">
                              <tr>
                                <th className="p-2">Objeto en la vida real</th>
                                <th className="p-2 text-center text-amber-300 font-bold">Escala 1:50</th>
                                <th className="p-2 text-center text-white font-bold">Escala 1:100</th>
                                <th className="p-2 text-center text-emerald-300 font-bold">Escala 1:200</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#25272C]">
                              <tr>
                                <td className="p-2 font-medium text-white">Persona (1.70 m)</td>
                                <td className="p-2 text-center">3.4 cm (34 mm)</td>
                                <td className="p-2 text-center">1.7 cm (17 mm)</td>
                                <td className="p-2 text-center">0.85 cm (8.5 mm)</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-white">Farola / Poste (6 m)</td>
                                <td className="p-2 text-center">12 cm (120 mm)</td>
                                <td className="p-2 text-center">6 cm (60 mm)</td>
                                <td className="p-2 text-center">3 cm (30 mm)</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-white">Banca de parque (2 m)</td>
                                <td className="p-2 text-center">4 cm (40 mm)</td>
                                <td className="p-2 text-center">2 cm (20 mm)</td>
                                <td className="p-2 text-center">1 cm (10 mm)</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-white">Automóvil (4.5 m)</td>
                                <td className="p-2 text-center">9 cm (90 mm)</td>
                                <td className="p-2 text-center">4.5 cm (45 mm)</td>
                                <td className="p-2 text-center">2.2 cm (22 mm)</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-white">Refrigerador (1.80 m)</td>
                                <td className="p-2 text-center">3.6 cm (36 mm)</td>
                                <td className="p-2 text-center">1.8 cm (18 mm)</td>
                                <td className="p-2 text-center">0.9 cm (9 mm)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Cómo ponerlo en Cura / Bambu Studio */}
                        <div className="space-y-1 text-[11px] text-[#A1A1AA] pt-1">
                          <p className="font-semibold text-white">¿Cómo escalarlo en tu programa de impresión 3D (Cura / Bambu)?</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li><strong>Opción más fácil:</strong> Mide la altura deseada con la tabla (ej. 6 cm para farola 1:100) y en la casilla Z de tamaño pon <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded">60 mm</code> con la opción "Escala uniforme" activada.</li>
                            <li><strong>Si el archivo original está en tamaño real (1 metro = 1000 mm):</strong> Pon en escala porcentual <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded">2%</code> para 1:50, <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded">1%</code> para 1:100, y <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded">0.5%</code> para 1:200.</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descripción del Producto */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Descripción del Producto *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      placeholder="Explica detalles del producto: material (PLA, resina, PETG), resistencia, colores y acabados..."
                      className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* 2. SECCIÓN: FOTOGRAFÍA DEL PRODUCTO (CARGA, ENCUADRE Y ZOOM) */}
                <div className="pt-3 border-t border-[#25272C] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                    <span className="w-1.5 h-3.5 bg-[#E50920] rounded-full" />
                    <span>2. Fotografía & Encuadre Visual</span>
                  </div>

                  <ImagePositionEditor
                    imageUrl={imageUrl}
                    imagePosition={imagePosition}
                    onImageUrlChange={(newUrl) => setImageUrl(newUrl)}
                    onPositionChange={(newPos) => setImagePosition(newPos)}
                  />
                </div>

                {/* 3. SECCIÓN: MODELO 3D (STL, OBJ, GLB) */}
                <div className="pt-3 border-t border-[#25272C] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <span className="w-1.5 h-3.5 bg-[#E50920] rounded-full" />
                      <span>3. Modelo 3D Interactivo</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full font-medium">
                      Opcional pero recomendado
                    </span>
                  </div>

                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Sube el archivo <strong>.STL</strong>, <strong>.OBJ</strong> o <strong>.GLB</strong> de tu pieza. El sistema lo optimiza automáticamente para el visor web y guarda el original para que lo descargues cuando lo necesites.
                  </p>

                  {/* Estado si ya hay un modelo 3D cargado */}
                  {(rawModelName || modelUrl) ? (
                    <div className="p-3.5 rounded-xl bg-[#111214] border border-[#25272C] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="truncate max-w-[200px]">{rawModelName || 'modelo_web.glb'}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#25272C] text-emerald-300">
                          3D LISTO
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#25272C]">
                        {rawModelUrl && (
                          <a
                            href={`/api/download-model?url=${encodeURIComponent(rawModelUrl)}&name=${encodeURIComponent(rawModelName || 'pieza.stl')}`}
                            download
                            className="text-[11px] text-[#A1A1AA] hover:text-white flex items-center gap-1 underline"
                          >
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>Descargar archivo</span>
                          </a>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <label className="text-[11px] px-2.5 py-1 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-white cursor-pointer font-medium transition-colors">
                            Reemplazar
                            <input
                              type="file"
                              accept=".stl,.obj,.glb"
                              disabled={isConvertingModel}
                              onChange={handleModelFileChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemove3DModel}
                            className="text-[11px] px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Zona de Carga de Modelo 3D */
                    <label className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isConvertingModel
                        ? 'border-[#E50920] bg-[#E50920]/10'
                        : 'border-[#25272C] hover:border-[#E50920]/60 bg-[#111214]'
                      }`}>
                      <input
                        type="file"
                        accept=".stl,.obj,.glb"
                        disabled={isConvertingModel}
                        onChange={handleModelFileChange}
                        className="hidden"
                      />

                      {isConvertingModel ? (
                        <div className="flex flex-col items-center gap-2 text-center text-white py-1">
                          <Loader2 className="w-6 h-6 animate-spin text-[#E50920]" />
                          <span className="text-xs font-bold">{conversionStatus || 'Procesando archivo 3D...'}</span>
                          <span className="text-[10px] text-[#A1A1AA]">Esto puede tardar unos segundos</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-1.5 py-1">
                          <div className="p-2.5 rounded-full bg-[#1B1D21] border border-[#25272C] text-[#E50920]">
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Seleccionar archivo 3D (.STL, .OBJ o .GLB)
                            </span>
                            <span className="text-[11px] text-[#A1A1AA]">
                              Haz clic aquí para buscar el modelo en tu computadora
                            </span>
                          </div>
                        </div>
                      )}
                    </label>
                  )}

                  {modelUploadError && (
                    <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl">
                      ⚠️ {modelUploadError}
                    </p>
                  )}

                  {/* Enlace manual opcional de modelo .glb */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManual3DUrl(!showManual3DUrl)}
                      className="text-[11px] text-[#A1A1AA] hover:text-white underline transition-colors"
                    >
                      {showManual3DUrl ? 'Ocultar enlace web 3D' : '¿Ya tienes un enlace URL de archivo .glb?'}
                    </button>
                    {showManual3DUrl && (
                      <input
                        type="text"
                        value={modelUrl}
                        onChange={(e) => setModelUrl(e.target.value)}
                        placeholder="https://.../mi_modelo.glb"
                        className="mt-2 w-full px-3 py-2 bg-[#111214] border border-[#25272C] rounded-xl text-white text-xs focus:outline-none focus:border-[#E50920]"
                      />
                    )}
                  </div>
                </div>

                {/* BOTÓN PRINCIPAL DE REGISTRO */}
                <div className="pt-4 border-t border-[#25272C]">
                  <button
                    type="submit"
                    disabled={isSubmittingProduct || isConvertingModel}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 ${editingProduct
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/30'
                        : 'bg-[#E50920] hover:bg-[#E50920]/90 text-white shadow-[#E50920]/30 active:scale-[0.99]'
                      }`}
                  >
                    {isSubmittingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando en el Catálogo...</span>
                      </>
                    ) : editingProduct ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar Cambios del Producto</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Agregar Producto al Catálogo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ÁREA B: CATÁLOGO DE PRODUCTOS REGISTRADOS (CARDS MODERNAS) */}
            <div className="lg:col-span-7 space-y-5">

              {/* Barra de Filtros y Control del Catálogo */}
              <div className="bg-[#1B1D21] border border-[#25272C] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#25272C]">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#E50920]" />
                      <span>Catálogo Registrado</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#25272C] text-[#A1A1AA] text-xs font-mono">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
                      </span>
                    </h2>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Visualiza, edita el encuadre o descarga los archivos 3D de tus piezas
                    </p>
                  </div>
                </div>

                {/* Filtros: Buscador, Categoría y Orden */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">

                  {/* Buscador */}
                  <div className="sm:col-span-5 relative">
                    <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Buscar por nombre o palabra..."
                      className="w-full pl-9 pr-7 py-2 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA] hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtro por Categoría */}
                  <div className="sm:col-span-4 relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => {
                        setFilterCategory(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs focus:outline-none transition-colors"
                    >
                      <option value="all">Todas las categorías ({productsList.length})</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c} ({productsList.filter((p) => (p.category?.trim() || 'General') === c).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ordenamiento */}
                  <div className="sm:col-span-3 relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs focus:outline-none transition-colors"
                    >
                      <option value="date-desc">Más recientes</option>
                      <option value="name-asc">Nombre (A-Z)</option>
                      <option value="price-asc">Precio: menor a mayor</option>
                      <option value="price-desc">Precio: mayor a menor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LISTA DE TARJETAS DE PRODUCTOS (GRID RESPONSIVE MODERNO) */}
              {paginatedProducts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#1B1D21] border border-[#25272C] space-y-3">
                  <Package className="w-10 h-10 text-neutral-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No se encontraron productos</h3>
                  <p className="text-xs text-[#A1A1AA]">
                    {searchQuery || filterCategory !== 'all'
                      ? 'No hay productos que coincidan con la búsqueda o filtro actual.'
                      : 'Aún no has registrado ningún producto. Utiliza el formulario a la izquierda para empezar.'}
                  </p>
                  {(searchQuery || filterCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25272C] hover:bg-[#32353B] text-xs font-semibold text-white transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedProducts.map((prod) => {
                    const imgTransform = parseImageTransform(prod.image_position);
                    const isSelectedForEditing = editingProduct?.id === prod.id;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-[#1B1D21] border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between group ${isSelectedForEditing
                            ? 'border-amber-400 ring-2 ring-amber-400/20'
                            : 'border-[#25272C] hover:border-[#E50920]/60'
                          }`}
                      >
                        {/* Cabecera / Fotografía con Encuadre exacto */}
                        <div className="relative h-44 w-full bg-[#111214] overflow-hidden select-none">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={{
                              objectPosition: imgTransform.position,
                              transform: `scale(${imgTransform.scale})`
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1B1D21] via-transparent to-black/30 pointer-events-none" />

                          {/* Badge de Categoría */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="bg-[#111214]/85 backdrop-blur-md border border-[#25272C] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                              {prod.category || 'General'}
                            </span>
                          </div>

                          {/* Badge de Estado del Modelo 3D */}
                          <div className="absolute top-2.5 right-2.5">
                            {prod.model_url ? (
                              <span className="bg-emerald-950/80 backdrop-blur-md border border-emerald-800/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                <Box className="w-3 h-3 text-emerald-400" />
                                <span>3D Listo</span>
                              </span>
                            ) : (
                              <span className="bg-[#111214]/80 backdrop-blur-md border border-[#25272C] text-[#A1A1AA] text-[10px] px-2 py-0.5 rounded-md">
                                Sin 3D
                              </span>
                            )}
                          </div>

                          {/* Indicador de Encuadre */}
                          <div className="absolute bottom-2 left-2.5 pointer-events-none">
                            <span className="text-[10px] font-mono text-neutral-300 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                              Zoom: {Math.round(imgTransform.scale * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Información del Producto */}
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3
                                onClick={() => setPreviewingProduct(prod)}
                                className="font-bold text-white text-sm hover:text-[#E50920] transition-colors cursor-pointer line-clamp-1"
                                title={prod.name}
                              >
                                {prod.name}
                              </h3>
                              <span className="font-extrabold text-[#E50920] text-sm shrink-0">
                                ${prod.price.toFixed(2)} <span className="text-[10px] text-[#A1A1AA]">MXN</span>
                              </span>
                            </div>

                            <p className="text-[#A1A1AA] text-xs line-clamp-2 leading-relaxed">
                              {prod.description}
                            </p>
                          </div>

                          {/* Escalas Disponibles */}
                          {prod.scales && prod.scales.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1">
                              {prod.scales.slice(0, 3).map((sc) => (
                                <span
                                  key={sc}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#25272C] text-neutral-300 font-mono"
                                >
                                  {sc}
                                </span>
                              ))}
                              {prod.scales.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#25272C] text-[#A1A1AA]">
                                  +{prod.scales.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Barra de Acciones de la Tarjeta */}
                        <div className="p-3 pt-0 border-t border-[#25272C] mt-2 flex items-center justify-between gap-1">

                          {/* Botón Ver Detalles / Preview */}
                          <button
                            type="button"
                            onClick={() => setPreviewingProduct(prod)}
                            className="p-2 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-neutral-300 hover:text-white text-xs transition-colors"
                            title="Ver información completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Descargar 3D si existe */}
                          {prod.raw_model_url ? (
                            <a
                              href={`/api/download-model?url=${encodeURIComponent(prod.raw_model_url)}&name=${encodeURIComponent(prod.raw_model_name || prod.name + '.stl')}`}
                              download
                              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs transition-colors flex items-center gap-1 font-semibold"
                              title={`Descargar archivo de taller: ${prod.raw_model_name || 'STL'}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="text-[11px] hidden sm:inline">Descargar 3D</span>
                            </a>
                          ) : prod.model_url ? (
                            <a
                              href={prod.model_url}
                              target="_blank"
                              download
                              className="p-2 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-neutral-300 text-xs transition-colors"
                              title="Descargar archivo web .glb"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          ) : null}

                          <div className="flex items-center gap-1.5 ml-auto">
                            {/* Botón Editar */}
                            <button
                              type="button"
                              onClick={() => startEditingProduct(prod)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/20 transition-colors"
                              title="Editar este producto y reencuadrar foto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-[#1B1D21] border border-[#25272C] rounded-2xl text-xs">
                  <span className="text-[#A1A1AA]">
                    Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg bg-[#25272C] hover:bg-[#32353B] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: CARGA MASIVA DE PRODUCTOS (CSV) */}
        {/* ======================================================== */}
        {activeTab === 'bulk' && (
          <div className="bg-[#1B1D21] border border-[#25272C] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto">
            <div className="pb-4 border-b border-[#25272C]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-[#E50920]" />
                <span>Carga Masiva de Productos con Archivo CSV</span>
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                Permite registrar varios productos simultáneamente desde una hoja de cálculo (Excel, Google Sheets). Las columnas soportadas son: <code className="text-[#E50920] bg-[#111214] px-1.5 py-0.5 rounded font-mono">nombre</code>, <code className="text-[#E50920] bg-[#111214] px-1.5 py-0.5 rounded font-mono">descripcion</code>, <code className="text-[#E50920] bg-[#111214] px-1.5 py-0.5 rounded font-mono">precio</code>, <code className="text-[#E50920] bg-[#111214] px-1.5 py-0.5 rounded font-mono">categoria</code>, <code className="text-[#E50920] bg-[#111214] px-1.5 py-0.5 rounded font-mono">imagen_url</code>.
              </p>
            </div>

            {bulkFeedback && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${bulkFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
              >
                {bulkFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-medium">{bulkFeedback.message}</span>
              </div>
            )}

            {/* Zona de Carga de CSV */}
            <div className="border-2 border-dashed border-[#25272C] hover:border-[#E50920]/70 rounded-2xl p-8 text-center bg-[#111214] transition-all">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-full bg-[#1B1D21] border border-[#25272C] text-[#E50920] mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {csvFile ? csvFile.name : 'Haz clic aquí para seleccionar tu archivo .CSV'}
                  </span>
                  <span className="text-xs text-[#A1A1AA]">
                    {parsedCsvData.length > 0
                      ? `Se detectaron ${parsedCsvData.length} registros listos para importar`
                      : 'Archivo de texto delimitado por comas (.csv)'}
                  </span>
                </div>
              </label>
            </div>

            {/* Vista Previa de Registros Detectados */}
            {parsedCsvData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Vista Previa de Productos ({parsedCsvData.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleBulkImportSubmit}
                    disabled={isImportingBulk}
                    className="px-5 py-2.5 bg-[#E50920] hover:bg-[#E50920]/90 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isImportingBulk ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Confirmar e Importar {parsedCsvData.length} Productos</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#25272C]">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-[#111214] text-[#A1A1AA] uppercase text-[10px] tracking-wider border-b border-[#25272C]">
                      <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Precio (MXN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#25272C]">
                      {parsedCsvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#111214]/60">
                          <td className="p-3 font-semibold text-white">{row.nombre || row.name || 'Sin nombre'}</td>
                          <td className="p-3 text-[#A1A1AA]">{row.categoria || row.category || 'General'}</td>
                          <td className="p-3 text-[#A1A1AA] truncate max-w-xs">{row.descripcion || row.description}</td>
                          <td className="p-3 text-[#E50920] font-bold">${row.precio || row.price || 0} MXN</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedCsvData.length > 5 && (
                    <div className="p-2.5 text-center text-[11px] text-[#A1A1AA] bg-[#111214] border-t border-[#25272C]">
                      ... y {parsedCsvData.length - 5} productos más en la lista.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: MODERACIÓN DE COMENTARIOS */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (
          <div className="bg-[#1B1D21] border border-[#25272C] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#25272C]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-[#E50920]" />
                  <span>Moderación de Reseñas de Clientes</span>
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Revisa y aprueba las opiniones antes de que se publiquen en la página principal
                </p>
              </div>
              <span className="px-3 py-1 bg-[#25272C] text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
                {pendingReviews.length} pendientes
              </span>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#111214] border border-[#25272C] space-y-3">
                <CheckCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">¡No hay comentarios pendientes!</h3>
                <p className="text-xs text-[#A1A1AA]">Todas las opiniones han sido revisadas y aprobadas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-xl bg-[#111214] border border-[#25272C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white">{rev.author_name}</span>
                        <span className="text-xs text-amber-400 font-semibold">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                        <span className="text-[10px] text-[#A1A1AA]">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 italic">"{rev.comment}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveReview(rev.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprobar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Descartar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 4: BANDEJA DE MENSAJES Y COTIZACIONES */}
        {/* ======================================================== */}
        {activeTab === 'messages' && (
          <div className="bg-[#1B1D21] border border-[#25272C] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#25272C]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="w-6 h-6 text-[#E50920]" />
                  <span>Bandeja de Mensajes de Clientes</span>
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Consultas directas enviadas por clientes desde el formulario de contacto web
                </p>
              </div>
              <span className="px-3 py-1 bg-[#25272C] text-[#E50920] border border-[#E50920]/20 rounded-full text-xs font-semibold">
                {contactMessages.length} recibidos
              </span>
            </div>

            {contactMessages.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#111214] border border-[#25272C] space-y-3">
                <Mail className="w-10 h-10 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No tienes mensajes nuevos</h3>
                <p className="text-xs text-[#A1A1AA]">
                  Cuando un cliente te escriba desde la página web, su mensaje aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-5 rounded-xl bg-[#111214] border border-[#25272C] flex flex-col md:flex-row md:items-start justify-between gap-5"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-white">{msg.name}</span>
                        <span className="text-xs text-[#A1A1AA] flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-[#E50920]" />
                          <span>{msg.email}</span>
                        </span>
                        {msg.phone && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            <Phone className="w-3 h-3" />
                            <span>{msg.phone}</span>
                          </span>
                        )}
                        <span className="text-[10px] text-[#A1A1AA]">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#1B1D21] border border-[#25272C] text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 shrink-0">
                      {msg.phone && (
                        <a
                          href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(msg.name)},%20te%20escribo%20de%20JC%20Impresi%C3%B3n%203D%20respecto%20a%20tu%20mensaje.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm w-full justify-center"
                          title="Contactar al WhatsApp del cliente"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <a
                        href={`mailto:${msg.email}?subject=Respuesta a tu consulta - JC Impresión 3D&body=Hola ${encodeURIComponent(msg.name)}, gracias por comunicarte con JC Impresión 3D.`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25272C] hover:bg-[#32353B] text-white text-xs font-semibold rounded-lg transition-colors border border-[#25272C] w-full justify-center"
                        title="Responder por correo electrónico"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        <span>Email</span>
                      </a>

                      <button
                        onClick={() => handleDeleteContactMessage(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg transition-colors w-full justify-center"
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: CONFIRMACIÓN PARA ELIMINAR PRODUCTO */}
      {/* ======================================================== */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1B1D21] border border-[#25272C] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">¿Eliminar este producto?</h3>
                <p className="text-xs text-[#A1A1AA]">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-[#111214] p-3 rounded-xl border border-[#25272C]">
              Estás a punto de eliminar <strong className="text-white">"{productToDelete.name}"</strong> del catálogo. Los clientes ya no podrán verlo ni solicitar pedidos de esta pieza.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#25272C] hover:bg-[#32353B] text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteProduct}
                className="px-4 py-2 rounded-xl bg-[#E50920] hover:bg-[#E50920]/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#E50920]/30"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Eliminar definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: VISTA PREVIA Y DETALLES DEL PRODUCTO */}
      {/* ======================================================== */}
      {previewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1B1D21] border border-[#25272C] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

            {/* Foto con Encuadre */}
            <div className="relative h-60 w-full bg-[#111214] overflow-hidden shrink-0">
              {(() => {
                const tr = parseImageTransform(previewingProduct.image_position);
                return (
                  <img
                    src={previewingProduct.image_url}
                    alt={previewingProduct.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: tr.position,
                      transform: `scale(${tr.scale})`
                    }}
                  />
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1D21] via-transparent to-black/40 pointer-events-none" />

              <button
                onClick={() => setPreviewingProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-4">
                <span className="bg-[#E50920] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                  {previewingProduct.category || 'General'}
                </span>
              </div>
            </div>

            {/* Información Completa */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-white">{previewingProduct.name}</h3>
                <span className="text-lg font-black text-[#E50920] shrink-0">
                  ${previewingProduct.price.toFixed(2)} MXN
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Descripción:</span>
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#111214] p-3 rounded-xl border border-[#25272C]">
                  {previewingProduct.description}
                </p>
              </div>

              {previewingProduct.scales && previewingProduct.scales.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Escalas Disponibles:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewingProduct.scales.map((sc) => (
                      <span key={sc} className="text-xs px-2.5 py-1 rounded-lg bg-[#25272C] text-white font-mono">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado de Modelo 3D */}
              <div className="p-3 rounded-xl bg-[#111214] border border-[#25272C] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#E50920]" />
                  <span className="text-neutral-300">
                    {previewingProduct.raw_model_name || (previewingProduct.model_url ? 'Modelo web (.glb) disponible' : 'Sin modelo 3D')}
                  </span>
                </div>
                {previewingProduct.raw_model_url && (
                  <a
                    href={`/api/download-model?url=${encodeURIComponent(previewingProduct.raw_model_url)}&name=${encodeURIComponent(previewingProduct.raw_model_name || 'pieza.stl')}`}
                    download
                    className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar archivo</span>
                  </a>
                )}
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="p-4 bg-[#111214] border-t border-[#25272C] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const prod = previewingProduct;
                  setPreviewingProduct(null);
                  startEditingProduct(prod);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar este producto</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewingProduct(null)}
                className="px-4 py-2 bg-[#25272C] hover:bg-[#32353B] text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

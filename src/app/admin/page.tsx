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
  EyeOff,
  Layers,
  HelpCircle,
  ShieldCheck,
  User,
  CheckCheck,
  Calculator,
  Ruler,
  Info,
  Tag
} from 'lucide-react';
import { Product, Review, ContactMessage, ScalePrice, ProductDimensions } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  convertModelToGlb,
  createProcedural3DModel,
  PRESET_3D_MODELS,
  ProceduralModelType
} from '@/lib/modelConverter';
import ImagePositionEditor from '@/components/ImagePositionEditor';
import { parseImageTransform } from '@/lib/imageUtils';
import {
  extractScaleRatio,
  calculateModelDimensions,
  calculatePriceForScale,
  POPULAR_SCALES,
  formatMeasurement
} from '@/lib/scaleCalculator';

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

// Lista completa de todas las escalas arquitectónicas y de maquetas para selección rápida
const ALL_ADMIN_SCALES = [
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'bulk' | 'categories' | 'reviews' | 'messages'>('products');

  // Estados para Gestión de Categorías
  const [categoriesList, setCategoriesList] = useState<string[]>(SUGGESTED_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [isRenamingCategory, setIsRenamingCategory] = useState(false);
  const [categoryActionFeedback, setCategoryActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para Carga / Edición Individual de Productos
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Refrigeración & Línea Blanca');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [productPrice, setProductPrice] = useState('0');
  const [productScales, setProductScales] = useState('Escala 1:50, Escala 1:75, Escala 1:100, Escala 1:200, Personalizada');
  const [newCustomScaleInput, setNewCustomScaleInput] = useState('');
  const [showInternalPriceField, setShowInternalPriceField] = useState(false);
  const [scalePrices, setScalePrices] = useState<ScalePrice[]>([]);
  const [showScaleGuide, setShowScaleGuide] = useState(false);

  // Estados para Dimensiones Reales (X, Y, Z en cm) y Calculadora de Escalas
  const [realDimX, setRealDimX] = useState<string>('60');
  const [realDimY, setRealDimY] = useState<string>('120');
  const [realDimZ, setRealDimZ] = useState<string>('600');
  const [realDimObjectName, setRealDimObjectName] = useState<string>('');
  const [realDimExplanation, setRealDimExplanation] = useState<string>('');
  const [isEstimatingDimensions, setIsEstimatingDimensions] = useState<boolean>(false);
  const [customTestScale, setCustomTestScale] = useState<string>('1:64');
  const [productDesc, setProductDesc] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosition, setImagePosition] = useState('50% 50%|1.0');
  const [isHidden, setIsHidden] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);

  // Estados para Modelo 3D
  const [modelUrl, setModelUrl] = useState('');
  const [rawModelUrl, setRawModelUrl] = useState('');
  const [rawModelName, setRawModelName] = useState('');
  const [isConvertingModel, setIsConvertingModel] = useState(false);
  const [conversionStatus, setConversionStatus] = useState('');
  const [modelUploadError, setModelUploadError] = useState('');
  const [showManual3DUrl, setShowManual3DUrl] = useState(false);
  const [showPreset3DModal, setShowPreset3DModal] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);

  // Estados de Formulario y Notificaciones
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados del Catálogo (Filtros, Búsqueda, Orden y Paginación)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden' | 'no-3d' | 'with-3d'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'name-asc' | 'price-asc' | 'price-desc'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

      const resCat = await fetch('/api/categories');
      if (resCat.ok) {
        const catData = await resCat.json();
        if (Array.isArray(catData.categories) && catData.categories.length > 0) {
          setCategoriesList(catData.categories);
        }
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

  // Función para subir archivos 3D con soporte directo a Supabase Storage (evita el error 413 de Vercel)
  const upload3DModelFiles = async (
    rawFile: File | Blob,
    glbBlob: Blob,
    rawName: string
  ): Promise<{ model_url: string; raw_model_url?: string; raw_model_name: string }> => {
    const sanitizedBase = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const rawFileName = `${timestamp}_${sanitizedBase}`;
    const glbFileName = `${timestamp}_${sanitizedBase.replace(/\.[^/.]+$/, '')}.glb`;

    // 1. Subida directa a Supabase Storage desde el navegador si está disponible
    // Esto se salta el límite de 4.5 MB de Vercel para Serverless Functions
    if (isSupabaseConfigured()) {
      try {
        setConversionStatus('Subiendo archivos 3D a la nube (Supabase Storage)...');
        const targetBuckets = ['models', 'product-images', 'images'];
        for (const bucket of targetBuckets) {
          const { error: rawErr } = await supabase.storage
            .from(bucket)
            .upload(`raw/${rawFileName}`, rawFile, {
              contentType: 'application/octet-stream',
              upsert: true
            });

          const { error: glbErr } = await supabase.storage
            .from(bucket)
            .upload(`glb/${glbFileName}`, glbBlob, {
              contentType: 'model/gltf-binary',
              upsert: true
            });

          if (!rawErr && !glbErr) {
            const rawUrl = supabase.storage.from(bucket).getPublicUrl(`raw/${rawFileName}`).data.publicUrl;
            const glbUrl = supabase.storage.from(bucket).getPublicUrl(`glb/${glbFileName}`).data.publicUrl;
            return {
              model_url: glbUrl,
              raw_model_url: rawUrl,
              raw_model_name: rawName
            };
          } else {
            console.warn(`Intento en bucket ${bucket}:`, rawErr?.message || glbErr?.message);
          }
        }
      } catch (storageErr) {
        console.warn('Fallo en subida directa a Supabase Storage, probando vía servidor:', storageErr);
      }
    }

    // 2. Si no hay Supabase o falló la subida directa:
    // Comprobar el peso total. En plataformas serverless como Vercel el límite por petición HTTP es 4.5 MB
    const totalSizeMb = ((rawFile.size || 0) + glbBlob.size) / (1024 * 1024);
    if (totalSizeMb > 4.2) {
      throw new Error(
        `El archivo 3D mide ${totalSizeMb.toFixed(1)} MB y supera el límite de 4.5 MB del servidor (Error 413: Request Entity Too Large). ` +
        `Para modelos de este tamaño, asegúrate de tener creado el bucket 'models' en Supabase Storage o sube un archivo 3D más ligero.`
      );
    }

    setConversionStatus('Guardando archivo 3D en el servidor...');
    const formData = new FormData();
    formData.append('rawFile', rawFile);
    formData.append('glbFile', glbBlob, `${rawName.replace(/\.[^/.]+$/, '')}.glb`);
    formData.append('rawName', rawName);

    const res = await fetch('/api/upload-model', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error(
          'El archivo 3D es demasiado grande para el servidor (Error 413: límite de 4.5 MB superado). ' +
          'Para archivos pesados, habilita el bucket "models" en Supabase Storage.'
        );
      }
      let errorMsg = 'Error al guardar el archivo 3D';
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errorMsg;
      } catch {
        const rawText = await res.text().catch(() => '');
        if (rawText) {
          errorMsg = `Error del servidor (${res.status}): ${rawText.slice(0, 100)}`;
        }
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      model_url: data.model_url,
      raw_model_url: data.raw_model_url,
      raw_model_name: data.raw_model_name
    };
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
      const uploadResult = await upload3DModelFiles(
        result.originalFile,
        result.glbBlob,
        result.originalName
      );

      setModelUrl(uploadResult.model_url);
      setRawModelUrl(uploadResult.raw_model_url || '');
      setRawModelName(uploadResult.raw_model_name);
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

  // Crear o asignar diseño 3D directamente desde la página
  const handleSelect3DPreset = async (presetId: string, directUrl?: string) => {
    setIsGenerating3D(true);
    setModelUploadError('');
    setConversionStatus('Generando diseño 3D para tu producto...');

    try {
      if (directUrl) {
        setModelUrl(directUrl);
        setRawModelUrl(directUrl);
        setRawModelName(presetId + '.glb');
        setConversionStatus('¡Modelo 3D asignado con éxito!');
        setShowPreset3DModal(false);
        return;
      }

      // Generar proceduralmente con Three.js
      const xNum = parseFloat(realDimX) || 60;
      const yNum = parseFloat(realDimY) || 120;
      const zNum = parseFloat(realDimZ) || 600;

      const result = await createProcedural3DModel(presetId as ProceduralModelType, {
        x: xNum,
        y: yNum,
        z: zNum
      });

      setConversionStatus('Guardando diseño 3D en la base de datos...');
      const uploadResult = await upload3DModelFiles(
        result.originalFile,
        result.glbBlob,
        result.originalName
      );

      setModelUrl(uploadResult.model_url);
      setRawModelUrl(uploadResult.raw_model_url || '');
      setRawModelName(uploadResult.raw_model_name);
      setConversionStatus(`¡Diseño 3D "${result.originalName}" creado con éxito!`);
      setShowPreset3DModal(false);
    } catch (err: any) {
      console.error('Error al generar modelo 3D:', err);
      setModelUploadError(err.message || 'Error al generar el diseño 3D.');
    } finally {
      setIsGenerating3D(false);
    }
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

  // Generar descripción atractiva y comercial con Inteligencia Artificial (Gemini)
  const handleGenerateDescription = async () => {
    if (!productName.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Por favor escribe primero el "Nombre del Producto" arriba para que la Inteligencia Artificial sepa qué redactar.'
      });
      return;
    }

    setIsGeneratingDesc(true);
    setFormFeedback(null);

    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName.trim(),
          category: isCustomCategory ? customCategoryInput : productCategory,
          scales: productScales
        })
      });

      const data = await res.json();
      if (res.ok && data.description) {
        setProductDesc(data.description);
        setFormFeedback({
          type: 'success',
          message: '¡Descripción atractiva generada exitosamente con Inteligencia Artificial!'
        });
      } else {
        throw new Error(data.error || 'No se pudo generar la descripción');
      }
    } catch (err: any) {
      console.error('Error al generar descripción:', err);
      setFormFeedback({
        type: 'error',
        message: 'No se pudo conectar con el servicio de IA: ' + (err.message || 'Error desconocido')
      });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // Consultar medidas reales típicas (X, Y, Z en cm) a la Inteligencia Artificial
  const handleEstimateDimensions = async () => {
    if (!productName.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Por favor escribe primero el "Nombre del Producto" arriba para que la IA sepa qué objeto analizar.'
      });
      return;
    }

    setIsEstimatingDimensions(true);
    setFormFeedback(null);

    try {
      const res = await fetch('/api/estimate-dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          category: isCustomCategory ? customCategoryInput : productCategory,
          description: productDesc
        })
      });

      const data = await res.json();
      if (res.ok && data.x && data.y && data.z) {
        setRealDimX(data.x.toString());
        setRealDimY(data.y.toString());
        setRealDimZ(data.z.toString());
        setRealDimObjectName(data.object_name || '');
        setRealDimExplanation(data.explanation || '');
        setShowScaleGuide(true); // Abrir la calculadora automáticamente para que el usuario vea los cálculos
        setFormFeedback({
          type: 'success',
          message: `¡Medidas calculadas para "${data.object_name}"! Ancho (X): ${data.x} cm, Fondo (Y): ${data.y} cm, Alto (Z): ${data.z} cm.`
        });
      } else {
        throw new Error(data.error || 'No se pudieron estimar las dimensiones');
      }
    } catch (err: any) {
      console.error('Error al estimar dimensiones con IA:', err);
      setFormFeedback({
        type: 'error',
        message: 'No se pudo consultar el servicio de medidas: ' + (err.message || 'Error desconocido')
      });
    } finally {
      setIsEstimatingDimensions(false);
    }
  };

  // Agregar una escala adicional (o personalizada) con su precio calculado al producto
  const handleAddCustomScale = (scaleNameToAdd: string, priceToAdd: number) => {
    const currentScales = productScales
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const exists = currentScales.some(
      (s) => s.toLowerCase() === scaleNameToAdd.toLowerCase()
    );

    if (!exists) {
      const updatedScales = [...currentScales, scaleNameToAdd];
      const newScalesStr = updatedScales.join(', ');
      setProductScales(newScalesStr);

      setScalePrices((prev) => {
        const found = prev.some((p) => p.scale.toLowerCase() === scaleNameToAdd.toLowerCase());
        if (found) {
          return prev.map((p) =>
            p.scale.toLowerCase() === scaleNameToAdd.toLowerCase() ? { ...p, price: priceToAdd } : p
          );
        }
        return [...prev, { scale: scaleNameToAdd, price: priceToAdd }];
      });

      setFormFeedback({
        type: 'success',
        message: `¡Se agregó "${scaleNameToAdd}" con precio de $${priceToAdd.toFixed(2)} MXN al producto!`
      });
    } else {
      setScalePrices((prev) =>
        prev.map((p) =>
          p.scale.toLowerCase() === scaleNameToAdd.toLowerCase() ? { ...p, price: priceToAdd } : p
        )
      );
      setFormFeedback({
        type: 'success',
        message: `El precio de "${scaleNameToAdd}" se actualizó a $${priceToAdd.toFixed(2)} MXN.`
      });
    }
  };

  // Preparar producto para edición
  const startEditingProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductDesc(prod.description);
    setProductPrice(prod.price.toString());

    if (prod.real_dimensions) {
      setRealDimX(prod.real_dimensions.x?.toString() || '60');
      setRealDimY(prod.real_dimensions.y?.toString() || '120');
      setRealDimZ(prod.real_dimensions.z?.toString() || '600');
      setRealDimObjectName(prod.real_dimensions.object_name || '');
      setRealDimExplanation(prod.real_dimensions.explanation || '');
    } else {
      setRealDimX('60');
      setRealDimY('120');
      setRealDimZ('600');
      setRealDimObjectName('');
      setRealDimExplanation('');
    }

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
    setIsHidden(prod.is_hidden === true);
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
    setProductPrice('0');
    setProductCategory('Refrigeración & Línea Blanca');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setImageUrl('');
    setImagePosition('50% 50%|1.0');
    setIsHidden(false);
    setModelUrl('');
    setRawModelUrl('');
    setRawModelName('');
    setConversionStatus('');
    setModelUploadError('');
    setRealDimX('60');
    setRealDimY('120');
    setRealDimZ('600');
    setRealDimObjectName('');
    setRealDimExplanation('');
    setCustomTestScale('1:64');
    const defaultScales = 'Escala 1:50, Escala 1:75, Escala 1:100, Escala 1:200, Personalizada';
    setProductScales(defaultScales);
    setNewCustomScaleInput('');
    setShowInternalPriceField(false);
    setScalePrices([]);
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

    const priceNum = parseFloat(productPrice) || 0;

    if (!imageUrl.trim()) {
      setFormFeedback({ type: 'error', message: 'Por favor sube una fotografía del producto para tus clientes.' });
      return;
    }

    setIsSubmittingProduct(true);

    try {
      const finalCategory = isCustomCategory
        ? (customCategoryInput.trim() || 'General')
        : productCategory;

      // Si se escribió una nueva categoría personalizada, guardarla en la base de datos
      if (isCustomCategory && customCategoryInput.trim()) {
        const catToAdd = customCategoryInput.trim();
        fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catToAdd })
        }).catch((err) => console.warn('Aviso al guardar categoría:', err));

        setCategoriesList((prev) =>
          Array.from(new Set([...prev, catToAdd])).sort((a, b) => a.localeCompare(b))
        );
      }

      const scalesArray = productScales
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const finalScalePrices = scalePrices.length > 0
        ? scalePrices
        : calculateSuggestedPrices(priceNum, productScales);

      const xNum = parseFloat(realDimX) || 0;
      const yNum = parseFloat(realDimY) || 0;
      const zNum = parseFloat(realDimZ) || 0;

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
        scales: scalesArray.length > 0 ? scalesArray : ['Medida Estándar'],
        real_dimensions: (xNum > 0 || yNum > 0 || zNum > 0) ? {
          x: xNum,
          y: yNum,
          z: zNum,
          object_name: realDimObjectName || undefined,
          explanation: realDimExplanation || undefined
        } : undefined,
        is_hidden: isHidden
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

  // Alternar visibilidad de un producto con un clic (Ocultar / Mostrar)
  const handleToggleVisibility = async (prod: Product) => {
    const nextHiddenState = !prod.is_hidden;

    // Actualización inmediata en el estado visual (UI optimista)
    setProductsList((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, is_hidden: nextHiddenState } : p))
    );

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prod.id,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          scale_prices: prod.scale_prices,
          category: prod.category,
          image_url: prod.image_url,
          image_position: prod.image_position,
          model_url: prod.model_url,
          raw_model_url: prod.raw_model_url,
          raw_model_name: prod.raw_model_name,
          scales: prod.scales,
          is_hidden: nextHiddenState
        })
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el estado de visibilidad en el servidor');
      }

      const updated = await res.json();
      setProductsList((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, ...updated, is_hidden: nextHiddenState } : p))
      );
    } catch (err: any) {
      console.error('Error al cambiar visibilidad:', err);
      fetchDashboardData();
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

  // ========================================================
  // ACCIONES DEL APARTADO DE CATEGORÍAS (CREAR, RENOMBRAR, ELIMINAR)
  // ========================================================

  // 1. Agregar nueva categoría guardada en base de datos
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setIsAddingCategory(true);
    setCategoryActionFeedback(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la categoría');

      setCategoriesList((prev) =>
        Array.from(new Set([...prev, trimmed])).sort((a, b) => a.localeCompare(b))
      );
      setNewCategoryName('');
      setCategoryActionFeedback({
        type: 'success',
        message: `¡Categoría "${trimmed}" guardada en la base de datos con éxito!`
      });
    } catch (err: any) {
      setCategoryActionFeedback({
        type: 'error',
        message: err.message || 'Error al agregar la categoría.'
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  // 2. Renombrar categoría en base de datos y en todos los productos asociados
  const handleRenameCategory = async () => {
    if (!renamingCategory) return;
    const { oldName, newName } = renamingCategory;
    const trimmedNew = newName.trim();

    if (!trimmedNew) {
      setCategoryActionFeedback({
        type: 'error',
        message: 'El nuevo nombre de la categoría no puede estar vacío.'
      });
      return;
    }

    if (trimmedNew === oldName) {
      setRenamingCategory(null);
      return;
    }

    setIsRenamingCategory(true);
    setCategoryActionFeedback(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: trimmedNew })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al renombrar la categoría');

      // Actualizar lista de categorías
      setCategoriesList((prev) =>
        Array.from(new Set(prev.map((c) => (c === oldName ? trimmedNew : c)))).sort((a, b) => a.localeCompare(b))
      );

      // Actualizar todos los productos locales que pertenecían a la categoría anterior
      setProductsList((prev) =>
        prev.map((p) => ((p.category?.trim() || 'General') === oldName ? { ...p, category: trimmedNew } : p))
      );

      // Si el selector del formulario tenía esta categoría seleccionada
      if (productCategory === oldName) {
        setProductCategory(trimmedNew);
      }
      if (filterCategory === oldName) {
        setFilterCategory(trimmedNew);
      }

      setCategoryActionFeedback({
        type: 'success',
        message: data.message || `Categoría "${oldName}" renombrada a "${trimmedNew}" exitosamente.`
      });
      setRenamingCategory(null);
    } catch (err: any) {
      setCategoryActionFeedback({
        type: 'error',
        message: err.message || 'Error al renombrar la categoría.'
      });
    } finally {
      setIsRenamingCategory(false);
    }
  };

  // 3. Eliminar categoría y reasignar productos a "General"
  const handleDeleteCategory = async (catName: string) => {
    const prodsCount = productsList.filter((p) => (p.category?.trim() || 'General') === catName).length;
    const confirmMsg = prodsCount > 0
      ? `¿Deseas eliminar la categoría "${catName}"? Sus ${prodsCount} producto(s) serán reasignados a "General".`
      : `¿Deseas eliminar la categoría "${catName}" de la base de datos?`;

    if (!confirm(confirmMsg)) return;

    setCategoryActionFeedback(null);
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(catName)}&reassignTo=General`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar la categoría');

      setCategoriesList((prev) => prev.filter((c) => c !== catName));
      setProductsList((prev) =>
        prev.map((p) => ((p.category?.trim() || 'General') === catName ? { ...p, category: 'General' } : p))
      );

      if (productCategory === catName) {
        setProductCategory('General');
      }
      if (filterCategory === catName) {
        setFilterCategory('all');
      }

      setCategoryActionFeedback({
        type: 'success',
        message: data.message || `Categoría "${catName}" eliminada correctamente.`
      });
    } catch (err: any) {
      setCategoryActionFeedback({
        type: 'error',
        message: err.message || 'Error al eliminar la categoría.'
      });
    }
  };

  // Alternar escalas disponibles con un solo clic
  const toggleScale = (scaleName: string) => {
    const currentScales = productScales
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let updated: string[];
    const exists = currentScales.some(
      (s) => s.toLowerCase() === scaleName.toLowerCase()
    );

    if (exists) {
      updated = currentScales.filter(
        (s) => s.toLowerCase() !== scaleName.toLowerCase()
      );
    } else {
      updated = [...currentScales, scaleName];
    }
    setProductScales(updated.join(', '));
  };

  const handleSelectAllScales = () => {
    setProductScales(ALL_ADMIN_SCALES.join(', '));
  };

  const handleSelectCommonScales = () => {
    setProductScales(['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200', 'Escala Personalizada'].join(', '));
  };

  const handleClearScales = () => {
    setProductScales('');
  };

  const handleAddCustomScaleToList = () => {
    if (!newCustomScaleInput.trim()) return;
    const name = newCustomScaleInput.trim();
    const currentScales = productScales
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!currentScales.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setProductScales([...currentScales, name].join(', '));
    }
    setNewCustomScaleInput('');
  };

  // Filtrado, Búsqueda y Ordenamiento de Productos en el Catálogo
  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    // Filtro por Estado (Visibilidad y Modelo 3D)
    if (filterVisibility === 'visible') {
      result = result.filter((p) => !p.is_hidden);
    } else if (filterVisibility === 'hidden') {
      result = result.filter((p) => p.is_hidden);
    } else if (filterVisibility === 'no-3d') {
      result = result.filter((p) => !p.model_url);
    } else if (filterVisibility === 'with-3d') {
      result = result.filter((p) => !!p.model_url);
    }

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
  }, [productsList, filterCategory, filterVisibility, searchQuery, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Lista de categorías únicas para el filtro y la selección
  const availableCategories = useMemo(() => {
    const set = new Set<string>(categoriesList);
    productsList.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categoriesList, productsList]);

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

          {/* Pestaña: Categorías */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'categories'
              ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/25'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#25272C]'
              }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categorías</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'categories' ? 'bg-black/30 text-white' : 'bg-[#25272C] text-[#A1A1AA]'
              }`}>
              {availableCategories.length}
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
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-neutral-300">
                          Categoría / Sección *
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('categories')}
                          className="text-[10px] text-[#A1A1AA] hover:text-[#E50920] flex items-center gap-1 font-medium transition-colors underline"
                          title="Ir al apartado de categorías para crear o renombrar"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>Gestionar / Renombrar</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(!isCustomCategory);
                          if (!isCustomCategory) setCustomCategoryInput('');
                        }}
                        className="text-[11px] text-[#E50920] hover:underline font-medium"
                      >
                        {isCustomCategory ? '← Elegir de la lista' : '+ Nueva personalizada'}
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
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="custom">+ Escribir otra categoría personalizada...</option>
                      </select>
                    )}
                  </div>

                  {/* ESCALAS MÁS COMUNES & PERSONALIZADA */}
                  <div className="p-4 rounded-2xl bg-[#111214] border border-[#25272C] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-[#E50920]" />
                        <span>Escalas Disponibles:</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
                        Más comunes & Personalizada
                      </span>
                    </div>

                    {/* Botones de las escalas más comunes */}
                    <div className="flex flex-wrap gap-2">
                      {['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200', 'Personalizada'].map((sc) => {
                        const isIncluded = productScales.toLowerCase().includes(sc.toLowerCase());

                        return (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => toggleScale(sc)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                              isIncluded
                                ? 'bg-[#E50920] text-white border-[#E50920] shadow-md shadow-[#E50920]/25'
                                : 'bg-[#1B1D21] text-[#A1A1AA] hover:text-white border-[#25272C]'
                            }`}
                          >
                            {isIncluded ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-xs">+</span>}
                            <span>{sc}</span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-[#A1A1AA]">
                      💡 Por defecto están activas las más comunes (<strong>1:50, 1:75, 1:100, 1:200 y Personalizada</strong>). Puedes hacer clic para activar o desactivar cualquiera rápidamente.
                    </p>
                  </div>

                  {/* PRECIO REFERENCIAL INTERNO (OPCIONAL - NO OBLIGATORIO) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInternalPriceField(!showInternalPriceField)}
                      className="text-[11px] text-[#A1A1AA] hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>{showInternalPriceField ? '▼ Ocultar precio de referencia interno' : '▶ ¿Deseas registrar un precio de referencia interno? (Opcional - No se muestra al público)'}</span>
                    </button>

                    {showInternalPriceField && (
                      <div className="mt-2 p-3 rounded-xl bg-[#111214] border border-[#25272C] space-y-2">
                        <label className="block text-xs font-semibold text-neutral-300">
                          Precio Referencial Base (MXN)
                        </label>
                        <div className="relative max-w-xs">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A1A1AA]">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-12 py-2 bg-[#1B1D21] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A1A1AA]">MXN</span>
                        </div>
                        <p className="text-[10px] text-[#A1A1AA]">
                          💡 Este precio es solo para tu control privado en caso de querer conservarlo. En la página web pública los clientes no ven ningún precio y se cotiza por WhatsApp.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CALCULADORA MÁGICA DE MEDIDAS (X, Y, Z), ESCALAS Y PRECIOS */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowScaleGuide(!showScaleGuide)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[#111214] hover:bg-[#1B1D21] border border-[#25272C] text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-[#E50920]" />
                        <span className="font-bold text-white">📐 Calculadora Mágica: Medidas (X, Y, Z), Escalas y Precios</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#E50920]">
                        {showScaleGuide ? 'Ocultar calculadora ▲' : 'Abrir calculadora ▼'}
                      </span>
                    </button>

                    {showScaleGuide && (
                      <div className="mt-2.5 p-4 rounded-2xl bg-[#111214] border border-[#25272C] space-y-4 text-xs text-neutral-300">
                        {/* Fórmula destacada */}
                        <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] space-y-1.5">
                          <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-4 h-4 text-[#E50920]" />
                            <span>La fórmula mágica para saber el tamaño:</span>
                          </p>
                          <p className="text-[11px] text-amber-300 font-mono bg-[#111214] p-2 rounded-lg border border-[#25272C]">
                            Tamaño real (en cm) ÷ Número de escala = Tamaño en la maqueta (en cm)
                          </p>
                          <p className="text-[10px] text-[#A1A1AA]">
                            💡 Ejemplo: Si una farola mide 600 cm (6 m) en la vida real, en Escala 1:100 mide <code className="text-white">600 ÷ 100 = 6 cm (60 mm)</code>.
                          </p>
                        </div>

                        {/* PASO 1: Medidas reales del objeto en cm */}
                        <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-white text-xs block">1. Medidas Reales en la Vida Real (cm):</span>
                              <span className="text-[10px] text-[#A1A1AA]">Indica las medidas del objeto real o pídele a la IA que las estime</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleEstimateDimensions}
                              disabled={isEstimatingDimensions}
                              className="px-3 py-1.5 rounded-lg bg-[#E50920]/20 hover:bg-[#E50920]/30 text-[#E50920] hover:text-white font-bold text-xs border border-[#E50920]/40 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                              title="La IA estima cuánto mide este objeto en la vida real (X, Y, Z en cm)"
                            >
                              {isEstimatingDimensions ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-[#E50920]" />
                              )}
                              <span>{isEstimatingDimensions ? 'Consultando IA...' : '✨ Preguntar medidas a la IA'}</span>
                            </button>
                          </div>

                          {/* Inputs de X, Y, Z */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-neutral-300 mb-1">
                                Ancho / Frente (X)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={realDimX}
                                  onChange={(e) => setRealDimX(e.target.value)}
                                  placeholder="60"
                                  className="w-full pl-2.5 pr-7 py-1.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-lg text-white text-xs font-bold focus:outline-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#A1A1AA]">cm</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-neutral-300 mb-1">
                                Fondo / Largo (Y)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={realDimY}
                                  onChange={(e) => setRealDimY(e.target.value)}
                                  placeholder="120"
                                  className="w-full pl-2.5 pr-7 py-1.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-lg text-white text-xs font-bold focus:outline-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#A1A1AA]">cm</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-neutral-300 mb-1">
                                Altura (Z)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={realDimZ}
                                  onChange={(e) => setRealDimZ(e.target.value)}
                                  placeholder="600"
                                  className="w-full pl-2.5 pr-7 py-1.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-lg text-white text-xs font-bold focus:outline-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#A1A1AA]">cm</span>
                              </div>
                            </div>
                          </div>

                          {/* Mensaje de objeto asemejado por la IA */}
                          {realDimObjectName && (
                            <div className="p-2 rounded-lg bg-[#111214] border border-[#25272C] text-[11px] text-[#A1A1AA] flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 text-[#E50920] shrink-0 mt-0.5" />
                              <div>
                                <span className="text-white font-semibold">Se asemeja a: </span>
                                <span className="text-neutral-200">{realDimObjectName}. </span>
                                {realDimExplanation && <span className="text-neutral-400">{realDimExplanation}</span>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* PASO 2: Medidas resultantes en LAS ESCALAS QUE TIENES */}
                        <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#E50920]" />
                              <span>2. Tamaño en la maqueta de las escalas que tienes:</span>
                            </span>
                            <span className="text-[10px] text-[#A1A1AA]">Fórmula aplicada a tus escalas</span>
                          </div>

                          {/* Tarjetas de escalas actuales */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {productScales
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((sc) => {
                                const ratio = extractScaleRatio(sc);
                                const priceMatch = scalePrices.find(
                                  (sp) => sp.scale.toLowerCase() === sc.toLowerCase()
                                );
                                const curPrice = priceMatch ? priceMatch.price : (parseFloat(productPrice) || 0);

                                if (!ratio) {
                                  return (
                                    <div
                                      key={sc}
                                      className="p-2.5 rounded-lg bg-[#111214] border border-[#25272C] flex items-center justify-between text-xs"
                                    >
                                      <span className="font-bold text-white truncate">{sc}</span>
                                      <span className="text-xs text-[#E50920] font-bold">${curPrice} MXN</span>
                                    </div>
                                  );
                                }

                                const xCm = (parseFloat(realDimX) || 0) / ratio;
                                const yCm = (parseFloat(realDimY) || 0) / ratio;
                                const zCm = (parseFloat(realDimZ) || 0) / ratio;

                                return (
                                  <div
                                    key={sc}
                                    className="p-2.5 rounded-lg bg-[#111214] border border-[#25272C] space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between border-b border-[#25272C] pb-1">
                                      <span className="font-bold text-white text-xs truncate max-w-[130px]">{sc}</span>
                                      <span className="text-xs font-black text-[#E50920]">${curPrice.toFixed(0)} MXN</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-neutral-300 font-mono">
                                      <div className="bg-[#1B1D21] p-1 rounded text-center">
                                        <span className="block text-[#A1A1AA] text-[9px]">X (ancho)</span>
                                        <span className="font-bold text-white">{formatMeasurement(xCm)}</span>
                                      </div>
                                      <div className="bg-[#1B1D21] p-1 rounded text-center">
                                        <span className="block text-[#A1A1AA] text-[9px]">Y (fondo)</span>
                                        <span className="font-bold text-white">{formatMeasurement(yCm)}</span>
                                      </div>
                                      <div className="bg-[#1B1D21] p-1 rounded text-center">
                                        <span className="block text-[#A1A1AA] text-[9px]">Z (alto)</span>
                                        <span className="font-bold text-amber-300">{formatMeasurement(zCm)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* PASO 3: SIMULADOR DE OTRA ESCALA Y SU PRECIO CALCULADO */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1B1D21] to-[#16171a] border border-[#E50920]/40 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div>
                              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-[#E50920]" />
                                <span>3. ¿Quieres otra escala? Simula tamaño y precio si no la tienes:</span>
                              </span>
                              <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                                Escribe o elige cualquier escala no registrada para ver cuánto mediría y cuánto cobrarías
                              </p>
                            </div>
                          </div>

                          {/* Selector / Input de otra escala */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-[#111214] border border-[#25272C] focus-within:border-[#E50920] rounded-xl px-3 py-1.5">
                              <span className="text-xs font-bold text-[#A1A1AA]">Escala 1 :</span>
                              <input
                                type="text"
                                value={customTestScale.replace(/^1:/, '').replace(/^Escala 1:/i, '').trim()}
                                onChange={(e) => setCustomTestScale(`1:${e.target.value.trim()}`)}
                                placeholder="64"
                                className="w-full bg-transparent text-white text-xs font-bold focus:outline-none"
                              />
                            </div>

                            {/* Botones rápidos de escalas no comunes */}
                            <div className="flex flex-wrap gap-1">
                              {[
                                { r: 25, label: '1:25' },
                                { r: 35, label: '1:35' },
                                { r: 64, label: '1:64' },
                                { r: 87, label: '1:87 HO' },
                                { r: 120, label: '1:120' },
                                { r: 150, label: '1:150' },
                                { r: 500, label: '1:500' }
                              ].map((item) => (
                                <button
                                  key={item.r}
                                  type="button"
                                  onClick={() => setCustomTestScale(`1:${item.r}`)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                                    extractScaleRatio(customTestScale) === item.r
                                      ? 'bg-[#E50920] text-white border-[#E50920]'
                                      : 'bg-[#111214] text-[#A1A1AA] hover:text-white border-[#25272C]'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cálculo en vivo de la otra escala */}
                          {(() => {
                            const ratio = extractScaleRatio(customTestScale) || 64;
                            const basePriceNum = parseFloat(productPrice) || 0;
                            const estimatedPrice = calculatePriceForScale(basePriceNum, ratio);
                            const xCm = (parseFloat(realDimX) || 0) / ratio;
                            const yCm = (parseFloat(realDimY) || 0) / ratio;
                            const zCm = (parseFloat(realDimZ) || 0) / ratio;
                            const scaleNameFormatted = `Escala 1:${ratio}`;
                            const isAlreadyInProduct = productScales
                              .toLowerCase()
                              .includes(scaleNameFormatted.toLowerCase());

                            return (
                              <div className="p-3 rounded-xl bg-[#111214] border border-[#25272C] space-y-2.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div>
                                    <span className="text-xs font-bold text-white block">
                                      Resultado para <span className="text-amber-300">{scaleNameFormatted}</span>
                                    </span>
                                    <span className="text-[10px] text-[#A1A1AA]">
                                      {isAlreadyInProduct ? '✓ Ya la tienes en tu lista de escalas' : '⚠️ No la tienes agregada aún'}
                                    </span>
                                  </div>

                                  <div className="flex items-baseline gap-1.5 bg-[#1B1D21] px-3 py-1.5 rounded-lg border border-[#25272C]">
                                    <span className="text-[10px] text-[#A1A1AA] uppercase font-bold">Precio estimado:</span>
                                    <span className="text-base font-black text-[#E50920]">${estimatedPrice.toFixed(0)}</span>
                                    <span className="text-[10px] text-[#A1A1AA] font-bold">MXN</span>
                                  </div>
                                </div>

                                {/* Medidas resultantes X, Y, Z */}
                                <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                                  <div className="bg-[#1B1D21] p-1.5 rounded-lg border border-[#25272C]">
                                    <span className="block text-[9px] text-[#A1A1AA]">Ancho X maqueta</span>
                                    <span className="font-bold text-white text-xs">{formatMeasurement(xCm)}</span>
                                  </div>
                                  <div className="bg-[#1B1D21] p-1.5 rounded-lg border border-[#25272C]">
                                    <span className="block text-[9px] text-[#A1A1AA]">Fondo Y maqueta</span>
                                    <span className="font-bold text-white text-xs">{formatMeasurement(yCm)}</span>
                                  </div>
                                  <div className="bg-[#1B1D21] p-1.5 rounded-lg border border-[#25272C]">
                                    <span className="block text-[9px] text-[#A1A1AA]">Alto Z maqueta</span>
                                    <span className="font-bold text-amber-300 text-xs">{formatMeasurement(zCm)}</span>
                                  </div>
                                </div>

                                {/* Botón para agregar la escala con su precio */}
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomScale(scaleNameFormatted, estimatedPrice)}
                                  className="w-full py-2 px-3 rounded-xl bg-[#E50920] hover:bg-[#f01c31] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#E50920]/25"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>
                                    {isAlreadyInProduct
                                      ? `Actualizar precio de ${scaleNameFormatted} a $${estimatedPrice} MXN`
                                      : `+ Agregar ${scaleNameFormatted} ($${estimatedPrice} MXN) a este Producto`}
                                  </span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Cómo ponerlo en Cura / Bambu Studio */}
                        <div className="space-y-1.5 text-[11px] text-[#A1A1AA] pt-1 border-t border-[#25272C]">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-[#E50920]" />
                            <span>¿Cómo configurar la escala en Cura / Bambu Studio?</span>
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-[10px]">
                            <li>
                              <strong>Opción más rápida:</strong> Fíjate en la casilla <strong className="text-amber-300">Z (alto)</strong> calculada arriba y en tu programa pon esa altura en milímetros en el eje Z con la casilla "Escala uniforme" activada.
                            </li>
                            <li>
                              <strong>Si el archivo STL original está en tamaño real 1:1 (metros a milímetros):</strong> Pon en escala porcentual:
                              <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded mx-1">2%</code> para 1:50,
                              <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded mx-1">1%</code> para 1:100, y
                              <code className="text-white bg-[#1B1D21] px-1 py-0.5 rounded mx-1">0.5%</code> para 1:200.
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descripción del Producto con Asistente de IA */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-300">
                        Descripción del Producto *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDesc}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#E50920]/15 hover:bg-[#E50920]/25 text-[#E50920] hover:text-white font-bold border border-[#E50920]/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Generar automáticamente con Inteligencia Artificial"
                      >
                        {isGeneratingDesc ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-[#E50920]" />
                        )}
                        <span>{isGeneratingDesc ? 'Generando con IA...' : '✨ Generar con IA'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      required
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      placeholder="Explica detalles del producto o haz clic en '✨ Generar con IA' para redactar una descripción vendedora al instante..."
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

                {/* 3. SECCIÓN: MODELO 3D (STL, OBJ, GLB O CREACIÓN DIRECTA) */}
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
                    Sube tu archivo <strong>.STL / .OBJ / .GLB</strong> o <strong>crea el diseño 3D directamente desde la página</strong> (ej. figura de persona a escala, farola, banca o bloque con tus medidas).
                  </p>

                  {/* Botón destacado: Crear diseño 3D desde la página */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreset3DModal(!showPreset3DModal)}
                      disabled={isConvertingModel || isGenerating3D}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#E50920]/20 to-[#E50920]/10 hover:from-[#E50920]/30 hover:to-[#E50920]/20 border border-[#E50920]/40 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-[#E50920]" />
                      <span>✨ Crear diseño 3D desde la página o elegir de Galería</span>
                    </button>
                  </div>

                  {/* Selector desplegable de Modelos 3D y Diseños Procedurales */}
                  {showPreset3DModal && (
                    <div className="p-3.5 rounded-2xl bg-[#111214] border border-[#E50920]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Box className="w-4 h-4 text-[#E50920]" />
                          <span>Elige qué diseño 3D deseas asignar:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPreset3DModal(false)}
                          className="text-xs text-[#A1A1AA] hover:text-white"
                        >
                          ✕ Cerrar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                        {PRESET_3D_MODELS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelect3DPreset(preset.id, preset.directUrl)}
                            disabled={isGenerating3D}
                            className="p-2.5 rounded-xl bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] hover:border-[#E50920]/60 text-left transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white group-hover:text-[#E50920] transition-colors truncate">
                                  {preset.name}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#111214] text-[#A1A1AA]">
                                  {preset.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
                                {preset.description}
                              </p>
                            </div>
                            <span className="text-[10px] text-[#E50920] font-bold mt-2 flex items-center gap-1">
                              {isGenerating3D ? 'Generando...' : '+ Asignar este 3D'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                        {rawModelUrl && !rawModelUrl.startsWith('data:') && (
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
                            Subir otro STL/OBJ
                            <input
                              type="file"
                              accept=".stl,.obj,.glb"
                              disabled={isConvertingModel || isGenerating3D}
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
                    <label className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isConvertingModel || isGenerating3D
                      ? 'border-[#E50920] bg-[#E50920]/10'
                      : 'border-[#25272C] hover:border-[#E50920]/60 bg-[#111214]'
                      }`}>
                      <input
                        type="file"
                        accept=".stl,.obj,.glb"
                        disabled={isConvertingModel || isGenerating3D}
                        onChange={handleModelFileChange}
                        className="hidden"
                      />

                      {isConvertingModel || isGenerating3D ? (
                        <div className="flex flex-col items-center gap-2 text-center text-white py-1">
                          <Loader2 className="w-6 h-6 animate-spin text-[#E50920]" />
                          <span className="text-xs font-bold">{conversionStatus || 'Procesando archivo 3D...'}</span>
                          <span className="text-[10px] text-[#A1A1AA]">Esto puede tardar unos segundos</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-1.5 py-1">
                          <div className="p-2.5 rounded-full bg-[#1B1D21] border border-[#25272C] text-[#E50920]">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              O sube tu archivo 3D desde tu equipo (.STL, .OBJ o .GLB)
                            </span>
                            <span className="text-[11px] text-[#A1A1AA]">
                              Haz clic aquí para buscar el archivo en tu computadora
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

                {/* 4. SECCIÓN: VISIBILIDAD / OCULTAR EN CATÁLOGO */}
                <div className="pt-3 border-t border-[#25272C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <span className="w-1.5 h-3.5 bg-[#E50920] rounded-full" />
                      <span>4. Visibilidad en Catálogo</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#111214] border border-[#25272C] flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {isHidden ? (
                          <EyeOff className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-xs font-bold text-white">
                          {isHidden ? 'Producto Oculto para Clientes' : 'Producto Visible en la Tienda'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                        {isHidden
                          ? 'No se mostrará en la página principal (ideal si se agotó, no tienes material o deseas guardarlo sin borrar).'
                          : 'Se mostrará con normalidad a cualquier visitante en la página web.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsHidden(!isHidden)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                        isHidden
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Oculto (Clic para mostrar)</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible (Clic para ocultar)</span>
                        </>
                      )}
                    </button>
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

                {/* Filtros: Buscador, Categoría, Visibilidad y Orden */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">

                  {/* Buscador */}
                  <div className="sm:col-span-4 relative">
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
                  <div className="sm:col-span-3 relative">
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

                  {/* Filtro por Visibilidad (Ocultos / Visibles) */}
                  <div className="sm:col-span-2 relative">
                    <select
                      value={filterVisibility}
                      onChange={(e) => {
                        setFilterVisibility(e.target.value as any);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2.5 py-2 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs focus:outline-none transition-colors"
                    >
                      <option value="all">Estado: Todos</option>
                      <option value="visible">👁️ Visibles ({productsList.filter((p) => !p.is_hidden).length})</option>
                      <option value="hidden">🚫 Ocultos ({productsList.filter((p) => p.is_hidden).length})</option>
                      <option value="no-3d">📦 Sin 3D ({productsList.filter((p) => !p.model_url).length})</option>
                      <option value="with-3d">🧊 Con 3D ({productsList.filter((p) => !!p.model_url).length})</option>
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
                    {searchQuery || filterCategory !== 'all' || filterVisibility !== 'all'
                      ? 'No hay productos que coincidan con la búsqueda o filtro actual.'
                      : 'Aún no has registrado ningún producto. Utiliza el formulario a la izquierda para empezar.'}
                  </p>
                  {(searchQuery || filterCategory !== 'all' || filterVisibility !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                        setFilterVisibility('all');
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

                          {/* Badge de Visibilidad (Oculto o Visible) */}
                          <div className="absolute bottom-2 right-2.5">
                            {prod.is_hidden ? (
                              <span className="bg-amber-950/90 backdrop-blur-md border border-amber-600/70 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                <EyeOff className="w-3 h-3 text-amber-400" />
                                <span>Oculto</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-950/80 backdrop-blur-md border border-emerald-800/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                <Eye className="w-3 h-3 text-emerald-400" />
                                <span>Visible</span>
                              </span>
                            )}
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
                            <div className="pt-2 text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="text-[#A1A1AA] font-bold text-[11px] flex items-center gap-1 shrink-0">
                                <Ruler className="w-3 h-3 text-[#E50920]" />
                                <span>Escala:</span>
                              </span>
                              <span className="text-white font-mono text-[11px] truncate max-w-full">
                                {prod.scales.map((s) => s.replace(/escala\s*/i, '').trim()).join(', ')}
                              </span>
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
                            {/* Botón Rápido Ocultar / Mostrar */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(prod)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                prod.is_hidden
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-[#25272C] hover:bg-[#32353B] text-neutral-300 hover:text-white border-transparent'
                              }`}
                              title={prod.is_hidden ? 'Hacer visible en la tienda' : 'Ocultar del catálogo para los clientes'}
                            >
                              {prod.is_hidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="hidden sm:inline">Mostrar</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-[#A1A1AA]" />
                                  <span className="hidden sm:inline">Ocultar</span>
                                </>
                              )}
                            </button>

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

        {/* ======================================================== */}
        {/* PESTAÑA: APARTADO DE GESTIÓN DE CATEGORÍAS */}
        {/* ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
            {/* Encabezado del Apartado */}
            <div className="p-6 rounded-2xl bg-[#1B1D21] border border-[#25272C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E50920]/10 border border-[#E50920]/30 text-[#E50920] flex items-center justify-center font-bold">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">Apartado de Categorías</h2>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
                  Administra las secciones de tu catálogo. Las nuevas categorías se guardan directamente en la base de datos.
                  Si decides renombrar una categoría, todos los productos que pertenezcan a ella se actualizarán automáticamente.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('products')}
                className="px-3.5 py-2 rounded-xl bg-[#25272C] hover:bg-[#32353B] text-xs font-semibold text-white transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-center"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Volver a Productos</span>
              </button>
            </div>

            {/* Notificación de Éxito o Error */}
            {categoryActionFeedback && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150 ${
                  categoryActionFeedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {categoryActionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{categoryActionFeedback.message}</span>
                </div>
                <button
                  onClick={() => setCategoryActionFeedback(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Formulario para Agregar Nueva Categoría */}
            <div className="p-6 rounded-2xl bg-[#1B1D21] border border-[#25272C] space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#E50920]" />
                <span>Crear y Guardar Nueva Categoría</span>
              </h3>

              <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Escribe el nombre de la nueva categoría (ej. Maquetas - Vegetación, Autos a escala, etc.)"
                  className="flex-1 px-4 py-2.5 bg-[#111214] border border-[#25272C] focus:border-[#E50920] rounded-xl text-white text-xs placeholder-[#A1A1AA]/50 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isAddingCategory || !newCategoryName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#E50920] hover:bg-[#c4081b] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-[#E50920]/25 flex items-center justify-center gap-2 shrink-0"
                >
                  {isAddingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Guardar en Base de Datos</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Listado de Categorías Existentes */}
            <div className="p-6 rounded-2xl bg-[#1B1D21] border border-[#25272C] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#25272C]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#E50920]" />
                  <span>Categorías Registradas ({availableCategories.length})</span>
                </h3>
                <span className="text-[11px] text-[#A1A1AA]">
                  Pulsa el botón de lápiz ✏️ para renombrar una categoría y sus productos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableCategories.map((cat) => {
                  const prodsCount = productsList.filter(
                    (p) => (p.category?.trim() || 'General') === cat
                  ).length;
                  const isBeingRenamed = renamingCategory?.oldName === cat;

                  return (
                    <div
                      key={cat}
                      className={`p-4 rounded-xl border transition-all ${
                        isBeingRenamed
                          ? 'bg-[#16181B] border-[#E50920] shadow-lg shadow-[#E50920]/10'
                          : 'bg-[#111214] border-[#25272C] hover:border-[#383B42]'
                      }`}
                    >
                      {isBeingRenamed ? (
                        // Vista de Edición / Renombrado
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-[#A1A1AA] flex items-center gap-1">
                            <span>Nuevo nombre para:</span>
                            <span className="text-white truncate">"{cat}"</span>
                          </label>
                          <input
                            type="text"
                            autoFocus
                            value={renamingCategory.newName}
                            onChange={(e) =>
                              setRenamingCategory({ ...renamingCategory, newName: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCategory();
                              if (e.key === 'Escape') setRenamingCategory(null);
                            }}
                            className="w-full px-3 py-2 bg-[#1B1D21] border border-[#E50920] rounded-lg text-white text-xs focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleRenameCategory}
                              disabled={isRenamingCategory || !renamingCategory.newName.trim()}
                              className="flex-1 py-1.5 px-3 bg-[#E50920] hover:bg-[#c4081b] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              {isRenamingCategory ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingCategory(null)}
                              className="py-1.5 px-3 bg-[#25272C] hover:bg-[#32353B] text-neutral-300 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Vista Normal de la Tarjeta de Categoría
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{cat}</span>
                            </div>
                            <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                              {prodsCount === 1 ? '1 producto asociado' : `${prodsCount} productos asociados`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setRenamingCategory({ oldName: cat, newName: cat })}
                              className="p-1.5 rounded-lg bg-[#1B1D21] hover:bg-[#25272C] text-[#A1A1AA] hover:text-white border border-[#25272C] transition-colors"
                              title="Renombrar esta categoría"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg bg-[#1B1D21] hover:bg-rose-500/10 text-[#A1A1AA] hover:text-rose-400 border border-[#25272C] hover:border-rose-500/30 transition-colors"
                              title="Eliminar esta categoría"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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

              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="bg-[#E50920] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                  {previewingProduct.category || 'General'}
                </span>
                {previewingProduct.is_hidden ? (
                  <span className="bg-amber-950/90 border border-amber-600/70 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <EyeOff className="w-3 h-3 text-amber-400" />
                    <span>Oculto para clientes</span>
                  </span>
                ) : (
                  <span className="bg-emerald-950/90 border border-emerald-600/70 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Visible en tienda</span>
                  </span>
                )}
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

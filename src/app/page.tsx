'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Box,
  Sparkles,
  ArrowRight,
  Eye,
  MessageCircle,
  Clock,
  Phone,
  CheckCircle2,
  Zap,
  Settings,
  PackageCheck,
  Wrench,
  Palette,
  Droplets,
  Cpu,
  RotateCcw,
  Shield,
  Ruler,
  Search,
  Grid,
  Tag,
  MapPin,
  Printer,
  Layers,
  PlusCircle,
  Trash2,
  X,
  ShoppingCart,
  Send
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ModelViewerModal from '@/components/ModelViewerModal';
import WhatsAppButton from '@/components/WhatsAppButton';
import ContactForm from '@/components/ContactForm';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/sampleData';
import { parseImageTransform } from '@/lib/imageUtils';

interface QuoteItem {
  id: string;
  name: string;
  category?: string;
  image_url: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryPage, setCategoryPage] = useState<number>(1);

  // Estados para cotización múltiple (seleccionar varios productos a la vez)
  const [quoteList, setQuoteList] = useState<QuoteItem[]>([]);
  const [showQuoteDrawer, setShowQuoteDrawer] = useState<boolean>(false);

  // Cargar lista de cotización guardada si existe
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jc_quote_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setQuoteList(parsed);
      }
    } catch (e) {
      // Ignorar errores de localStorage
    }
  }, []);

  const saveQuoteList = (newList: QuoteItem[]) => {
    setQuoteList(newList);
    try {
      localStorage.setItem('jc_quote_cart', JSON.stringify(newList));
    } catch (e) {
      // Ignorar
    }
  };

  const isProductInQuote = (id: string) => quoteList.some((item) => item.id === id);

  const toggleProductInQuote = (prod: Product) => {
    const exists = quoteList.some((item) => item.id === prod.id);
    let updated: QuoteItem[];
    if (exists) {
      updated = quoteList.filter((item) => item.id !== prod.id);
    } else {
      updated = [
        ...quoteList,
        {
          id: prod.id,
          name: prod.name,
          category: prod.category,
          image_url: prod.image_url,
        }
      ];
    }
    saveQuoteList(updated);
  };

  const removeFromQuote = (id: string) => {
    const updated = quoteList.filter((item) => item.id !== id);
    saveQuoteList(updated);
  };

  const clearQuoteList = () => {
    saveQuoteList([]);
    setShowQuoteDrawer(false);
  };

  const getMultiQuoteWhatsappUrl = () => {
    if (quoteList.length === 0) {
      return 'https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20gustar%C3%ADa%20cotizar%20un%20proyecto.';
    }

    const itemsText = quoteList
      .map((item, idx) => `• ${idx + 1}. ${item.name}${item.category ? ` (${item.category})` : ''}`)
      .join('\n');

    const msg = `Hola JC_iMPRESIÓN 3D, me gustaría consultar precios y cotizar estos ${quoteList.length} diseños para mi proyecto:\n\n${itemsText}\n\n¿Me podrían apoyar con el presupuesto y tiempo de entrega? ¡Muchas gracias!`;

    return `https://wa.me/529673718208?text=${encodeURIComponent(msg)}`;
  };

  // Reiniciar la página de paginación al cambiar de filtro
  useEffect(() => {
    setCategoryPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  // Filtrar únicamente los productos visibles (no ocultos)
  const visibleProducts = products.filter((prod) => !prod.is_hidden);

  // Lista única de categorías
  const categoriesList = Array.from(
    new Set(visibleProducts.map((p) => p.category?.trim() || 'General'))
  ).filter(Boolean);

  // Filtrado de productos por texto y categoría
  const filteredProducts = visibleProducts.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.category && prod.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Agrupación por categorías para vista de "Todas las Secciones"
  const groupedByCategory = categoriesList.reduce((acc, cat) => {
    const prodsInCat = filteredProducts.filter((p) => (p.category?.trim() || 'General') === cat);
    if (prodsInCat.length > 0) {
      acc[cat] = prodsInCat;
    }
    return acc;
  }, {} as Record<string, Product[]>);

  // Paginación para vista individual de categoría (9 productos por página)
  const PRODUCTS_PER_CATEGORY_PAGE = 9;
  const totalPagesForFiltered = Math.ceil(filteredProducts.length / PRODUCTS_PER_CATEGORY_PAGE) || 1;
  const paginatedFilteredProducts = filteredProducts.slice(
    (categoryPage - 1) * PRODUCTS_PER_CATEGORY_PAGE,
    categoryPage * PRODUCTS_PER_CATEGORY_PAGE
  );

  return (
    <div className="min-h-screen bg-[#111214] text-[#E4E4E7] flex flex-col font-sans selection:bg-[#E50920] selection:text-white">
      {/* 1. BARRA DE NAVEGACIÓN */}
      <Navbar />

      {/* 2. HERO / PORTADA COMERCIAL DE ALTO IMPACTO */}
      <section id="inicio" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b border-[#25272C]">
        {/* Luz ambiental sutil roja de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#E50920]/15 via-[#E50920]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#E50920]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Columna Izquierda: Mensaje Comercial & Llamados a la Acción */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge superior */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1D21] border border-[#25272C] text-[#E50920] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#E50920]" />
                <span>TALLER DE FABRICACIÓN DIGITAL & SERVICIOS INTEGRALES</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                JC <span className="text-[#E50920]">IMPRESIÓN 3D</span>
              </h1>

              {/* Slogan de Marca */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1B1D21] border-l-4 border-[#E50920] border-y border-r border-[#25272C] shadow-lg">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#E50920] mb-1">
                  MODELOS PERSONALIZADOS A ESCALA
                </p>
                <p className="text-xl sm:text-2xl font-black text-white italic tracking-wide">
                  &ldquo;¡TÚ LO IMAGINAS, NOSOTROS LO CREAMOS!&rdquo;
                </p>
              </div>

              {/* Explicación de la oferta de valor */}
              <p className="text-[#A1A1AA] text-sm sm:text-base leading-relaxed">
                Diseño y fabricación de <strong className="text-white">modelos a escala para maquetas arquitectónicas y urbanas</strong> con visor 3D interactivo y Realidad Aumentada desde el celular. Además, ofrecemos <strong className="text-white">impresión convencional de planos técnicos</strong> y <strong className="text-white">mantenimiento especializado de computadoras e impresoras</strong> en San Cristóbal de Las Casas con envíos seguros a todo México.
              </p>

              {/* Botones de Acción Comercial */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#catalogo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#E50920] hover:bg-[#f01c31] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#E50920]/25 transition-all duration-200"
                >
                  <Box className="w-4 h-4" />
                  <span>Explorar Catálogo 3D</span>
                </a>

                <WhatsAppButton
                  variant="secondary"
                  label="Cotizar Proyecto por WhatsApp"
                  className="w-full sm:w-auto text-sm py-3.5 px-6"
                />
              </div>

              {/* Indicadores de Confianza Verificables */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#25272C]">
                <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] text-left">
                  <div className="flex items-center gap-2 text-[#E50920] mb-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">Atención Directa</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">WhatsApp 967 371 8208</p>
                </div>

                <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] text-left">
                  <div className="flex items-center gap-2 text-[#E50920] mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">Visor 3D & AR</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">Visualiza antes de comprar</p>
                </div>

                <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] text-left">
                  <div className="flex items-center gap-2 text-[#E50920] mb-1">
                    <Ruler className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">Escalas Exactas</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">1:50, 1:75, 1:100, 1:200</p>
                </div>

                <div className="p-3 rounded-xl bg-[#1B1D21] border border-[#25272C] text-left">
                  <div className="flex items-center gap-2 text-[#E50920] mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">Envíos Seguros</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">A todo el país</p>
                </div>
              </div>

            </div>

            {/* Columna Derecha: Tarjeta Visual de Identidad de Marca */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-[#25272C] shadow-2xl bg-[#1B1D21] p-3">
                
                {/* Tarjeta Principal con Logo y Servicios */}
                <div className="relative rounded-2xl overflow-hidden bg-[#111214] min-h-[400px] flex flex-col">
                  
                  {/* Fondo decorativo con gradiente y luces */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#E50920]/12 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#E50920]/8 rounded-full blur-2xl" />
                    {/* Cuadrícula decorativa */}
                    <div className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage: 'linear-gradient(#E50920 1px, transparent 1px), linear-gradient(to right, #E50920 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                      }}
                    />
                  </div>

                  {/* Contenido Principal */}
                  <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-8 gap-6 text-center">

                    {/* Logo Grande */}
                    <div className="relative w-36 h-36 rounded-2xl bg-[#1B1D21] border border-[#25272C] p-3 shadow-2xl shadow-[#E50920]/10">
                      <Image
                        src="/images/jc_brand.png"
                        alt="JC Impresión 3D"
                        fill
                        sizes="144px"
                        className="object-contain p-1"
                        priority
                      />
                    </div>

                    {/* Nombre y Slogan */}
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        JC <span className="text-[#E50920]">IMPRESIÓN 3D</span>
                      </h2>
                      <p className="text-xs font-bold text-[#A1A1AA] italic">
                        &ldquo;¡Tú lo imaginas, nosotros lo creamos!&rdquo;
                      </p>
                    </div>

                    {/* Píldoras de servicios */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                      {[
                        { icon: '🧱', label: 'Maquetas a Escala' },
                        { icon: '🖨️', label: 'Impresión 3D' },
                        { icon: '📐', label: 'Planos Técnicos' },
                        { icon: '🔧', label: 'Mantenimiento de Equipos' },
                        { icon: '🏷️', label: 'Stickers & Vinil' },
                        { icon: '📦', label: 'Envíos a México' },
                      ].map((item) => (
                        <span
                          key={item.label}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B1D21] border border-[#25272C] text-[11px] font-semibold text-[#E4E4E7]"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                      ))}
                    </div>

                    {/* WhatsApp directo */}
                    <a
                      href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20gustar%C3%ADa%20cotizar%20un%20proyecto."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50920] hover:bg-[#f01c31] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#E50920]/25 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>967 371 8208 — Escríbenos</span>
                    </a>

                  </div>
                </div>

                {/* Pie de tarjeta */}
                <div className="pt-3 px-2 flex justify-end">
                  <a
                    href="#catalogo"
                    className="px-3.5 py-1.5 bg-[#25272C] hover:bg-[#E50920] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Ver catálogo</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CATÁLOGO 3D INTERACTIVO CON VISOR Y TODAS LAS ESCALAS */}
      <section id="catalogo" className="py-24 bg-[#111214] relative border-b border-[#25272C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Encabezado del Catálogo */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[#E50920] text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Box className="w-4 h-4 text-[#E50920]" />
              <span>Catálogo 3D & Maquetas a Escala</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Modelos, Maquetas & Repuestos 3D</h2>
            <p className="text-[#A1A1AA] text-sm">
              Explora nuestros modelos disponibles. Fabricamos cada pieza en <strong className="text-white">todas las escalas</strong> arquitectónicas y a medida. Abre el <strong className="text-white">visor 3D interactivo</strong> para examinar cada detalle y contáctanos por WhatsApp para consultar el precio directamente con nosotros.
            </p>
          </div>

          {/* Barra de Búsqueda y Pestañas de Categoría */}
          <div className="mb-12 space-y-4">
            {/* Buscador */}
            <div className="max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, maqueta, refrigerador, etc..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1B1D21] border border-[#25272C] focus:border-[#E50920] rounded-2xl text-xs text-white placeholder-[#A1A1AA] focus:outline-none transition-colors shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA] hover:text-white"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pestañas de Categorías */}
            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedCategory === 'all'
                    ? 'bg-[#E50920] text-white shadow-lg shadow-[#E50920]/25'
                    : 'bg-[#1B1D21] hover:bg-[#25272C] text-[#E4E4E7] border border-[#25272C]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Todas las Secciones</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono">
                  {visibleProducts.length}
                </span>
              </button>

              {categoriesList.map((cat) => {
                const count = visibleProducts.filter((p) => (p.category?.trim() || 'General') === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#E50920] text-white shadow-lg shadow-[#E50920]/25'
                        : 'bg-[#1B1D21] hover:bg-[#25272C] text-[#E4E4E7] border border-[#25272C]'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 text-[#E50920]" />
                    <span>{cat}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISTA 1: AGRUPADA POR SECCIONES (3 productos por categoría al ver 'all' y sin búsqueda) */}
          {selectedCategory === 'all' && !searchQuery ? (
            <div className="space-y-16">
              {Object.entries(groupedByCategory).map(([categoryName, prods]) => (
                <div key={categoryName} className="space-y-6">
                  {/* Encabezado de la Sección */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#25272C]">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-6 bg-[#E50920] rounded-full" />
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                        {categoryName}
                      </h3>
                      <span className="text-xs text-[#A1A1AA] bg-[#1B1D21] px-2.5 py-1 rounded-full border border-[#25272C]">
                        {prods.length > 3 ? `Mostrando 3 de ${prods.length} productos` : `${prods.length} ${prods.length === 1 ? 'producto' : 'productos'}`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCategory(categoryName);
                        const el = document.getElementById('catalogo');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs text-[#E50920] hover:text-[#f01c31] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Ver toda esta sección</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cuadrícula de 3 productos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {prods.slice(0, 3).map((prod) => {
                      const imgTransform = parseImageTransform(prod.image_position);

                      return (
                        <div
                          key={prod.id}
                          className="bg-[#1B1D21] border border-[#25272C] rounded-3xl overflow-hidden hover:border-[#E50920]/60 transition-all duration-300 shadow-xl group flex flex-col justify-between"
                        >
                          <div>
                            {/* Fotografía con zoom y posición exactos */}
                            <div
                              className="relative h-64 w-full bg-[#111214] overflow-hidden cursor-pointer select-none"
                              onClick={() => setSelectedProduct(prod)}
                            >
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                style={{
                                  objectPosition: imgTransform.position,
                                  transform: `scale(${imgTransform.scale})`
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1D21] via-transparent to-transparent opacity-80 pointer-events-none" />

                              {/* Badge de selección si está en la lista de cotización */}
                              {isProductInQuote(prod.id) && (
                                <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10 animate-in fade-in duration-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>En tu lista</span>
                                </div>
                              )}

                              {/* Badge de Visor 3D */}
                              <div className="absolute top-3 right-3 bg-[#111214]/90 backdrop-blur-md border border-[#25272C] text-[#E50920] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg group-hover:bg-[#E50920] group-hover:text-white transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver en 3D / AR</span>
                              </div>

                              {prod.category && !isProductInQuote(prod.id) && (
                                <span className="absolute bottom-3 left-3 bg-[#111214]/90 border border-[#25272C] text-[#E4E4E7] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                                  {prod.category}
                                </span>
                              )}
                            </div>

                            {/* Información del Producto */}
                            <div className="p-6 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  onClick={() => setSelectedProduct(prod)}
                                  className="text-base font-bold text-white group-hover:text-[#E50920] transition-colors cursor-pointer line-clamp-1"
                                >
                                  {prod.name}
                                </h4>
                                <span className="text-xs font-semibold text-neutral-300 bg-[#25272C] px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border border-[#25272C]">
                                  <MessageCircle className="w-3 h-3 text-[#E50920]" />
                                  <span>Precio a consultar</span>
                                </span>
                              </div>

                              <p className="text-[#A1A1AA] text-xs leading-relaxed line-clamp-2">
                                {prod.description}
                              </p>

                              {/* Escala */}
                              <div className="pt-2">
                                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#111214] border border-[#25272C] text-xs">
                                  <Ruler className="w-3.5 h-3.5 text-[#E50920] shrink-0" />
                                  <span className="font-bold text-white shrink-0">Escala:</span>
                                  <span className="text-[#E4E4E7] font-semibold text-[11px] truncate">1:50, 1:75, 1:100, 1:200 y Personalizada</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Acciones Comerciales */}
                          <div className="p-6 pt-0 space-y-2">
                            {/* Botón para cotizar varios productos a la vez */}
                            <button
                              type="button"
                              onClick={() => toggleProductInQuote(prod)}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                                isProductInQuote(prod.id)
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                                  : 'bg-[#1B1D21] hover:bg-[#25272C] text-[#E4E4E7] hover:text-white border-[#25272C] hover:border-[#E50920]/60'
                              }`}
                            >
                              {isProductInQuote(prod.id) ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                  <span>✓ Seleccionado para cotizar</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-4 h-4 text-[#E50920]" />
                                  <span>+ Agregar a mi lista para cotizar</span>
                                </>
                              )}
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setSelectedProduct(prod)}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#25272C] hover:bg-[#2f3238] border border-[#25272C] hover:border-[#E50920]/40 text-white font-bold text-xs rounded-xl transition-all"
                              >
                                <Box className="w-3.5 h-3.5 text-[#E50920]" />
                                <span>Ver 3D</span>
                              </button>

                              <WhatsAppButton
                                productName={prod.name}
                                variant="full"
                                label="Solo este"
                                className="text-xs py-2.5 px-2"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón para ver más de la sección si tiene más de 3 */}
                  {prods.length > 3 && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(categoryName);
                          const el = document.getElementById('catalogo');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] hover:border-[#E50920]/60 text-[#E4E4E7] hover:text-white text-xs font-bold transition-all shadow-lg group"
                      >
                        <span>Ver los {prods.length} productos de {categoryName}</span>
                        <ArrowRight className="w-4 h-4 text-[#E50920] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* VISTA 2: FILTRADA (Categoría seleccionada o búsqueda activa) - 9 productos por página */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#25272C]">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#A1A1AA]">Mostrando:</span>
                  <span className="text-sm font-bold text-white bg-[#1B1D21] border border-[#25272C] px-3 py-1 rounded-full text-[#E50920]">
                    {selectedCategory === 'all' ? `Búsqueda: "${searchQuery}"` : selectedCategory}
                  </span>
                  <span className="text-xs text-[#A1A1AA]">({filteredProducts.length} disponibles)</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#E50920] hover:underline"
                >
                  Ver todas las secciones
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-[#1B1D21] border border-[#25272C] space-y-3">
                  <Box className="w-10 h-10 text-[#A1A1AA] mx-auto" />
                  <p className="text-sm font-bold text-white">No se encontraron productos en esta categoría o búsqueda.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-5 py-2.5 bg-[#E50920] hover:bg-[#f01c31] text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Regresar al catálogo completo
                  </button>
                </div>
              ) : (
                <>
                  {/* Cuadrícula de 9 productos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {paginatedFilteredProducts.map((prod) => {
                      const imgTransform = parseImageTransform(prod.image_position);

                      return (
                        <div
                          key={prod.id}
                          className="bg-[#1B1D21] border border-[#25272C] rounded-3xl overflow-hidden hover:border-[#E50920]/60 transition-all duration-300 shadow-xl group flex flex-col justify-between"
                        >
                          <div>
                            {/* Fotografía */}
                            <div
                              className="relative h-64 w-full bg-[#111214] overflow-hidden cursor-pointer select-none"
                              onClick={() => setSelectedProduct(prod)}
                            >
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                style={{
                                  objectPosition: imgTransform.position,
                                  transform: `scale(${imgTransform.scale})`
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1D21] via-transparent to-transparent opacity-80 pointer-events-none" />

                              {/* Badge 3D */}
                              <div className="absolute top-3 right-3 bg-[#111214]/90 backdrop-blur-md border border-[#25272C] text-[#E50920] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg group-hover:bg-[#E50920] group-hover:text-white transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver en 3D / AR</span>
                              </div>

                              {prod.category && (
                                <span className="absolute bottom-3 left-3 bg-[#111214]/90 border border-[#25272C] text-[#E4E4E7] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                                  {prod.category}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-6 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  onClick={() => setSelectedProduct(prod)}
                                  className="text-base font-bold text-white group-hover:text-[#E50920] transition-colors cursor-pointer line-clamp-1"
                                >
                                  {prod.name}
                                </h4>
                                <span className="text-xs font-semibold text-neutral-300 bg-[#25272C] px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border border-[#25272C]">
                                  <MessageCircle className="w-3 h-3 text-[#E50920]" />
                                  <span>Precio a consultar</span>
                                </span>
                              </div>

                              <p className="text-[#A1A1AA] text-xs leading-relaxed line-clamp-2">
                                {prod.description}
                              </p>

                              {/* Escala */}
                              <div className="pt-2">
                                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#111214] border border-[#25272C] text-xs">
                                  <Ruler className="w-3.5 h-3.5 text-[#E50920] shrink-0" />
                                  <span className="font-bold text-white shrink-0">Escala:</span>
                                  <span className="text-[#E4E4E7] font-semibold text-[11px] truncate">1:50, 1:75, 1:100, 1:200 y Personalizada</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="p-6 pt-0 space-y-2">
                            <button
                              onClick={() => setSelectedProduct(prod)}
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25272C] hover:bg-[#2f3238] border border-[#25272C] text-white font-bold text-xs rounded-xl transition-all"
                            >
                              <Box className="w-4 h-4 text-[#E50920]" />
                              <span>Abrir Visor 3D</span>
                            </button>

                            <WhatsAppButton
                              productName={prod.name}
                              variant="full"
                              label="Consultar precio por WhatsApp"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginación */}
                  {totalPagesForFiltered > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C] text-xs mt-6">
                      <span className="text-[#A1A1AA]">
                        Mostrando <strong className="text-white">{Math.min(filteredProducts.length, (categoryPage - 1) * PRODUCTS_PER_CATEGORY_PAGE + 1)}-{Math.min(filteredProducts.length, categoryPage * PRODUCTS_PER_CATEGORY_PAGE)}</strong> de <strong className="text-white">{filteredProducts.length}</strong> productos (9 por página)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCategoryPage((p) => Math.max(1, p - 1));
                            const el = document.getElementById('catalogo');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          disabled={categoryPage === 1}
                          className="px-3 py-1.5 rounded-xl bg-[#25272C] hover:bg-[#2f3238] disabled:opacity-40 text-white font-bold transition-colors"
                        >
                          ← Anterior
                        </button>

                        {Array.from({ length: totalPagesForFiltered }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              setCategoryPage(num);
                              const el = document.getElementById('catalogo');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-xl font-bold transition-all ${
                              categoryPage === num
                                ? 'bg-[#E50920] text-white shadow-md shadow-[#E50920]/30'
                                : 'bg-[#25272C] hover:bg-[#2f3238] text-[#E4E4E7]'
                            }`}
                          >
                            {num}
                          </button>
                        ))}

                        <button
                          onClick={() => {
                            setCategoryPage((p) => Math.min(totalPagesForFiltered, p + 1));
                            const el = document.getElementById('catalogo');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          disabled={categoryPage === totalPagesForFiltered}
                          className="px-3 py-1.5 rounded-xl bg-[#25272C] hover:bg-[#2f3238] disabled:opacity-40 text-white font-bold transition-colors"
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </section>

      {/* 4. SERVICIOS COMERCIALES: 3 LÍNEAS DE NEGOCIO CLARAS */}
      <section id="servicios" className="py-24 bg-[#1B1D21] relative border-b border-[#25272C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[#E50920] text-xs font-extrabold uppercase tracking-widest">
              Líneas de Servicio Profesional
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Servicios de Impresión & Fabricación
            </h2>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">
              Soluciones integrales de alta precisión tanto en el mundo digital y físico 3D como en impresión en papel, planos técnicos y terminados.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SERVICIO 1: MODELOS E IMPRESIÓN 3D */}
            <div className="p-8 rounded-3xl bg-[#111214] border border-[#25272C] hover:border-[#E50920]/60 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#E50920]/10 border border-[#E50920]/30 flex items-center justify-center text-[#E50920]">
                  <Box className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs text-[#E50920] font-bold uppercase tracking-wider">Línea Principal</span>
                  <h3 className="text-xl font-bold text-white mt-1">Modelos & Impresión 3D</h3>
                  <p className="text-[#A1A1AA] text-xs leading-relaxed mt-2">
                    Fabricación de maquetas arquitectónicas y urbanismo, piezas a escala milimétrica, prototipos de ingeniería y refacciones personalizadas.
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs text-neutral-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Escalas normalizadas: 1:50, 1:75, 1:100, 1:200</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Visor 3D y Realidad Aumentada para clientes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Materiales resistentes: PLA de alta tenacidad y resina</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Mobiliario urbano, farolas, fachadas y vehículos</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#25272C] mt-6">
                <a
                  href="#catalogo"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25272C] hover:bg-[#E50920] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <span>Explorar Catálogo de Piezas</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* SERVICIO 2: IMPRESIÓN CONVENCIONAL DE PLANOS Y DOCUMENTOS */}
            <div className="p-8 rounded-3xl bg-[#111214] border border-[#25272C] hover:border-[#E50920]/60 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#E50920]/10 border border-[#E50920]/30 flex items-center justify-center text-[#E50920]">
                  <Printer className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs text-[#E50920] font-bold uppercase tracking-wider">Documentación Técnica</span>
                  <h3 className="text-xl font-bold text-white mt-1">Impresión de Planos & Papel</h3>
                  <p className="text-[#A1A1AA] text-xs leading-relaxed mt-2">
                    Servicio completo para estudiantes y arquitectos: planos técnicos de alta resolución, opalinas, documentos y terminados profesionales.
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs text-neutral-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Planos técnicos: carta, oficio, doble carta, pliego 90x60</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Hojas opalinas, papel bond y fotográfico premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Tesis, reportes y proyectos escolares a color o B/N</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Empastado térmico, engargolado y laminado</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#25272C] mt-6">
                <a
                  href="#contacto"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25272C] hover:bg-[#E50920] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <span>Cotizar Planos & Copias</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* SERVICIO 3: STICKERS, VINIL Y TERMINADOS */}
            <div className="p-8 rounded-3xl bg-[#111214] border border-[#25272C] hover:border-[#E50920]/60 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#E50920]/10 border border-[#E50920]/30 flex items-center justify-center text-[#E50920]">
                  <Palette className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs text-[#E50920] font-bold uppercase tracking-wider">Diseño y Personalización</span>
                  <h3 className="text-xl font-bold text-white mt-1">Stickers, Vinil & Publicidad</h3>
                  <p className="text-[#A1A1AA] text-xs leading-relaxed mt-2">
                    Material publicitario y elementos adhesivos para marcas, empaques, eventos personales o maquetas gráficas.
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs text-neutral-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Stickers y pegatinas troqueladas a color</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Vinil adhesivo de alta durabilidad para negocio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Etiquetas personalizadas para productos y empaques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                    <span>Carteles, pósters e invitaciones especiales</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#25272C] mt-6">
                <a
                  href="#contacto"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25272C] hover:bg-[#E50920] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <span>Solicitar Etiquetas / Vinil</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CÓMO TRABAJAMOS: PROCESO EN 4 PASOS */}
      <section className="py-24 bg-[#111214] relative border-b border-[#25272C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[#E50920] text-xs font-extrabold uppercase tracking-widest">
              Flujo Transparente
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              ¿Cómo Trabajamos en JC Impresión 3D?
            </h2>
            <p className="text-[#A1A1AA] text-sm">
              Desde tu primera idea hasta la entrega de tu maqueta o equipo reparado, mantenemos una comunicación directa y sin sorpresas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Paso 1 */}
            <div className="p-6 rounded-3xl bg-[#1B1D21] border border-[#25272C] relative space-y-4">
              <span className="text-4xl font-black text-[#E50920]/30">01</span>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Envíanos tu Idea o Archivo</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Comparte tu archivo en formato STL, OBJ, CAD, plano arquitectónico o simplemente descríbenos la pieza o problema a resolver.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#E50920]">
                Vía WhatsApp o Formulario
              </div>
            </div>

            {/* Paso 2 */}
            <div className="p-6 rounded-3xl bg-[#1B1D21] border border-[#25272C] relative space-y-4">
              <span className="text-4xl font-black text-[#E50920]/30">02</span>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Asesoría & Cotización Directa</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Te orientamos sobre la escala adecuada (1:20, 1:50, 1:100, etc.), material de fabricación y te entregamos tu presupuesto personalizado de inmediato.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#E50920]">
                Atención directa por WhatsApp
              </div>
            </div>

            {/* Paso 3 */}
            <div className="p-6 rounded-3xl bg-[#1B1D21] border border-[#25272C] relative space-y-4">
              <span className="text-4xl font-black text-[#E50920]/30">03</span>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Muestra Digital & Aprobación</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Revisa tu diseño en el visor 3D interactivo o confirma los parámetros y tiempos antes de iniciar la impresión o mantenimiento.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#E50920]">
                Validación previa al 100%
              </div>
            </div>

            {/* Paso 4 */}
            <div className="p-6 rounded-3xl bg-[#1B1D21] border border-[#25272C] relative space-y-4">
              <span className="text-4xl font-black text-[#E50920]/30">04</span>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Fabricación & Entrega</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Imprimimos con calibración micrométrica, post-procesamos las piezas y realizamos entrega local o envío protegido a todo México.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#E50920]">
                Empaque seguro y seguimiento
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. MANTENIMIENTO TÉCNICO DE EQUIPOS (#mantenimiento) */}
      <section id="mantenimiento" className="py-24 bg-[#1B1D21] relative border-b border-[#25272C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[#E50920] text-xs font-extrabold uppercase tracking-widest">
              Soporte Técnico Especializado
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Mantenimiento de Computadoras & Impresoras
            </h2>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">
              ¿Tu equipo se sobrecalienta, va lento o tu impresora presenta fallas? Realizamos diagnóstico honesto, mantenimiento preventivo y correctivo con garantía técnica.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* Tarjeta 1: Computadoras y Laptops */}
            <div className="p-8 rounded-3xl bg-[#111214] border border-[#25272C] hover:border-[#E50920]/50 transition-all duration-300 shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#E50920]/10 border border-[#E50920]/30 flex items-center justify-center text-[#E50920]">
                  <Cpu className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mantenimiento de Computadoras</h3>
                  <p className="text-xs text-[#E50920] font-bold uppercase tracking-wider">Laptops, PC de Escritorio & All-in-One</p>
                </div>
              </div>

              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                Optimización integral de rendimiento para estudiantes y profesionistas que necesitan su equipo trabajando al 100% sin trabas ni sobrecalentamiento.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Limpieza profunda interna de polvo, disipadores y ventiladores</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Cambio de pasta térmica de alto rendimiento (CPU y GPU)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Eliminación de virus, troyanos, spyware y software basura</span>
                </li>
                <li className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Reinstalación limpia de Windows, paquetería y controladores</span>
                </li>
                <li className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Actualización a disco sólido SSD y ampliación de memoria RAM</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[#25272C]">
                <a
                  href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20requiero%20mantenimiento%20para%20mi%20computadora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#E50920] hover:bg-[#f01c31] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Solicitar Servicio de Computadora</span>
                </a>
              </div>
            </div>

            {/* Tarjeta 2: Impresoras Convencionales y 3D */}
            <div className="p-8 rounded-3xl bg-[#111214] border border-[#25272C] hover:border-[#E50920]/50 transition-all duration-300 shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#E50920]/10 border border-[#E50920]/30 flex items-center justify-center text-[#E50920]">
                  <Wrench className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mantenimiento de Impresoras</h3>
                  <p className="text-xs text-[#E50920] font-bold uppercase tracking-wider">Inyección de Tinta, Láser & Equipos 3D</p>
                </div>
              </div>

              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                Reparación, limpieza y calibración de impresoras de oficina y de taller. Solución a atascos de papel, problemas de inyectores o fallas de extrusión 3D.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Destape ultrasónico y limpieza profunda de cabezales e inyectores</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Mantenimiento de sistemas de tinta continua y almohadillas</span>
                </li>
                <li className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Revisión y lubricación de rodillos de arrastre y engranes</span>
                </li>
                <li className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Calibración de cama, cambio de boquillas (nozzle) y correas 3D</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#E50920] shrink-0" />
                  <span>Pruebas de impresión de alineación antes de entrega</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[#25272C]">
                <a
                  href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20requiero%20mantenimiento%20para%20mi%20impresora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#E50920] hover:bg-[#f01c31] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Solicitar Mantenimiento de Impresora</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. NOSOTROS (#nosotros) */}
      <section id="nosotros" className="py-24 bg-[#111214] relative border-b border-[#25272C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Fotografía Auténtica del Taller */}
            <div className="relative rounded-3xl overflow-hidden border border-[#25272C] shadow-2xl bg-[#1B1D21] p-3 group">
              <div className="relative h-[380px] w-full rounded-2xl overflow-hidden bg-[#111214]">
                <Image
                  src="/images/workshop_main.jpg"
                  alt="Taller de JC Impresión 3D"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-transparent to-transparent opacity-70" />
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#111214]/90 backdrop-blur-md border border-[#25272C]">
                  <p className="text-xs font-bold text-white">Taller de Fabricación & Pruebas</p>
                  <p className="text-[11px] text-[#A1A1AA]">San Cristóbal de Las Casas, Chiapas</p>
                </div>
              </div>
            </div>

            {/* Historia y Filosofía del Taller */}
            <div className="space-y-6">
              <span className="text-[#E50920] text-xs font-bold uppercase tracking-widest">
                Sobre JC Impresión 3D
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Pasión por el Detalle, el Modelismo y la Tecnología
              </h2>

              <p className="text-neutral-300 text-sm leading-relaxed">
                En <strong className="text-white font-bold">JC IMPRESIÓN 3D</strong> nacimos con una misión clara: brindar a estudiantes de arquitectura, profesionistas, diseñadores y negocios locales una alternativa confiable para materializar sus proyectos con máxima precisión y precios justos.
              </p>

              <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
                Combinamos herramientas digitales avanzadas —como visores 3D en línea y Realidad Aumentada— con la dedicación de un taller artesanal que revisa cada capa, cuida la escala milimétrica y ofrece soporte técnico cercano en cómputo e impresión.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C]">
                  <div className="p-2.5 rounded-xl bg-[#E50920]/10 text-[#E50920] shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Diseño & Escala Personalizada</h4>
                    <p className="text-xs text-[#A1A1AA]">Trabajamos sobre tus requerimientos específicos, bocetos, fotos o modelos CAD/STL.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C]">
                  <div className="p-2.5 rounded-xl bg-[#E50920]/10 text-[#E50920] shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Precisión & Calibración Fina</h4>
                    <p className="text-xs text-[#A1A1AA]">Materiales resistentes y tolerancias exactas para que tus piezas ensamblen a la perfección.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C]">
                  <div className="p-2.5 rounded-xl bg-[#E50920]/10 text-[#E50920] shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Atención Ágil & Envíos Directos</h4>
                    <p className="text-xs text-[#A1A1AA]">Respuesta directa por WhatsApp para resolver dudas, revisar avances y confirmar entregas.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 8. OPINIONES DE CLIENTES (#opiniones) */}
      <section id="opiniones" className="py-24 bg-[#1B1D21] relative border-b border-[#25272C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#E50920] text-xs font-bold uppercase tracking-widest">
              Opiniones Reales
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Lo que Dicen Nuestros Clientes
            </h2>
            <p className="text-[#A1A1AA] text-sm">
              Conoce las experiencias de estudiantes, profesionistas y talleres que han cotizado maquetas, piezas 3D y servicios técnicos con nosotros.
            </p>
          </div>

          <div className="space-y-6">
            <ReviewList />
          </div>

          <div className="pt-8 max-w-3xl mx-auto">
            <ReviewForm />
          </div>
        </div>
      </section>

      {/* 9. CONTACTO Y COTIZACIONES (#contacto) */}
      <section id="contacto" className="py-24 bg-[#111214] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Información Directa */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-[#E50920] text-xs font-bold uppercase tracking-widest">
                  Cotización Rápida & Contacto
                </span>
                <h2 className="text-3xl font-extrabold text-white mt-1">JC IMPRESIÓN 3D</h2>
                <p className="text-[#A1A1AA] text-sm mt-3 leading-relaxed">
                  ¿Tienes un proyecto en mente, una maqueta por entregar o un equipo por reparar? Escríbenos o llena el formulario y te responderemos a la brevedad.
                </p>
              </div>

              <div className="space-y-4 text-sm text-neutral-300">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C]">
                  <Phone className="w-5 h-5 text-[#E50920] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">WhatsApp & Llamadas</span>
                    <span className="block text-sm font-extrabold text-[#E50920]">+52 967 371 8208</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C]">
                  <MapPin className="w-5 h-5 text-[#E50920] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">Ubicación del Taller</span>
                    <span className="block text-xs text-[#A1A1AA]">San Cristóbal de Las Casas, Chiapas, México</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1B1D21] border border-[#25272C]">
                  <Clock className="w-5 h-5 text-[#E50920] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">Horario de Atención</span>
                    <span className="block text-xs text-[#A1A1AA]">Lunes a Sábado: 8:00 - 20:00 hrs</span>
                  </div>
                </div>
              </div>

              <WhatsAppButton
                phone="529673718208"
                variant="full"
                label="Iniciar Chat en WhatsApp Ahora"
              />
            </div>

            {/* Formulario Estructurado de Cotización */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>

          </div>
        </div>
      </section>

      {/* 10. PIE DE PÁGINA (FOOTER) */}
      <footer className="bg-[#111214] border-t border-[#25272C] py-12 text-xs text-[#A1A1AA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#25272C]">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#1B1D21] border border-[#25272C] p-1">
                <Image src="/images/jc_brand.png" alt="JC Impresión 3D" fill sizes="36px" className="object-contain" />
              </div>
              <div>
                <span className="block font-black text-white text-sm">JC IMPRESIÓN 3D</span>
                <span className="text-[11px] text-[#A1A1AA]">Modelos a Escala & Mantenimiento</span>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs" aria-label="Navegación del pie de página">
              <a href="#inicio" className="hover:text-white transition-colors">Inicio</a>
              <a href="#catalogo" className="hover:text-white transition-colors">Catálogo 3D</a>
              <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
              <a href="#mantenimiento" className="hover:text-white transition-colors">Mantenimiento</a>
              <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
              <a href="#opiniones" className="hover:text-white transition-colors">Opiniones</a>
              <a href="#contacto" className="hover:text-white transition-colors">Contacto</a>
              <a href="/admin" className="text-[#E50920] font-semibold hover:underline">Panel Admin</a>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} JC IMPRESIÓN 3D. Todos los derechos reservados.</p>
            <p className="text-neutral-500 italic">&ldquo;¡Tú lo imaginas, nosotros lo creamos!&rdquo;</p>
          </div>
        </div>
      </footer>

      {/* Modal del Visor 3D Interactivo */}
      <ModelViewerModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isInQuote={selectedProduct ? isProductInQuote(selectedProduct.id) : false}
        onToggleQuote={selectedProduct ? () => toggleProductInQuote(selectedProduct) : undefined}
      />

      {/* ========== BOTÓN FLOTANTE DE LISTA DE COTIZACIÓN ========== */}
      {quoteList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <button
            onClick={() => setShowQuoteDrawer(true)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-[#E50920] text-white shadow-2xl shadow-red-900/50 hover:bg-red-700 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              {/* Ícono con badge de cantidad */}
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-[#E50920] text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {quoteList.length}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold leading-tight">
                  {quoteList.length === 1 ? '1 diseño en tu lista' : `${quoteList.length} diseños en tu lista`}
                </span>
                <span className="block text-[11px] text-red-200">Toca para revisar y cotizar</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5">
              <Send className="w-4 h-4" />
              <span className="text-xs font-bold">Ver lista</span>
            </div>
          </button>
        </div>
      )}

      {/* ========== DRAWER / MODAL DE REVISIÓN DE LISTA ========== */}
      {showQuoteDrawer && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Fondo oscuro */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowQuoteDrawer(false)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-lg bg-[#111214] border border-[#25272C] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[85vh] flex flex-col">

            {/* Encabezado */}
            <div className="flex items-center justify-between p-5 border-b border-[#25272C]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E50920]/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-[#E50920]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Mi Lista de Cotización</h3>
                  <p className="text-xs text-[#A1A1AA]">{quoteList.length} {quoteList.length === 1 ? 'diseño seleccionado' : 'diseños seleccionados'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuoteDrawer(false)}
                className="w-8 h-8 rounded-full bg-[#1B1D21] flex items-center justify-center hover:bg-[#25272C] transition-colors"
              >
                <X className="w-4 h-4 text-[#A1A1AA]" />
              </button>
            </div>

            {/* Lista de productos */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {quoteList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#1B1D21] border border-[#25272C]"
                >
                  {/* Imagen miniatura */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#25272C]">
                    <Image
                      src={item.image_url || '/images/placeholder.png'}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                    {item.category && (
                      <p className="text-xs text-[#A1A1AA] truncate">{item.category}</p>
                    )}
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#E50920] bg-[#E50920]/10 px-2 py-0.5 rounded-full">
                      Precio a consultar
                    </span>
                  </div>

                  {/* Botón quitar */}
                  <button
                    onClick={() => {
                      const updated = quoteList.filter((q) => q.id !== item.id);
                      saveQuoteList(updated);
                      if (updated.length === 0) setShowQuoteDrawer(false);
                    }}
                    className="w-8 h-8 rounded-full bg-[#25272C] hover:bg-red-900/40 flex items-center justify-center transition-colors shrink-0"
                    title="Quitar de la lista"
                  >
                    <Trash2 className="w-4 h-4 text-[#A1A1AA] hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* Acciones del pie */}
            <div className="p-4 border-t border-[#25272C] space-y-3">
              {/* Botón principal: Cotizar todo por WhatsApp */}
              <a
                href={getMultiQuoteWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe59] text-white font-black text-sm transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.86L.054 23.447a.75.75 0 0 0 .916.916l5.587-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75A9.73 9.73 0 0 1 6.53 20.1l-.38-.23-3.943 1.043 1.043-3.818-.247-.394A9.72 9.72 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                Cotizar todos por WhatsApp
              </a>

              {/* Botón secundario: Limpiar lista */}
              <button
                onClick={clearQuoteList}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#25272C] text-[#A1A1AA] hover:text-red-400 hover:border-red-900/50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Vaciar lista completa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

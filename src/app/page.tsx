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
  Mail,
  Phone,
  CheckCircle2,
  Zap,
  Settings,
  PackageCheck,
  Layers,
  Wrench,
  Palette,
  Droplets,
  Wind,
  Cpu,
  RotateCcw,
  Shield,
  Ruler
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ModelViewerModal from '@/components/ModelViewerModal';
import WhatsAppButton from '@/components/WhatsAppButton';
import ContactForm from '@/components/ContactForm';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/sampleData';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Navbar Fijo con Logo de JC IMPRESIÓN 3D */}
      <Navbar />

      {/* 1. HERO SECTION ESTILO JC IMPRESIÓN 3D */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden border-b border-red-950/40">
        {/* Luces ambiental en rojo metálico */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-red-600/20 via-rose-700/10 to-neutral-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Texto y Slogan Principal con Logo */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-bold backdrop-blur-md shadow-inner">
                <Sparkles className="w-4 h-4 animate-pulse text-red-400" />
                <span>MODELOS PERSONALIZADOS EN IMPRESIÓN 3D</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
                JC <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">IMPRESIÓN 3D</span>
              </h1>

              {/* Frase Emblemática */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border-l-4 border-red-600 border-y border-r border-neutral-800 backdrop-blur-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-red-400 mb-1">
                  MODELOS PERSONALIZADOS
                </p>
                <p className="text-xl sm:text-2xl font-black text-white italic tracking-wide">
                  "¡TÚ LO IMAGINAS, NOSOTROS LO CREAMOS!"
                </p>
              </div>

              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-light">
                Fabricamos tus proyectos con máxima precisión digital, acabado profesional y visor 3D interactivo en la web para que pruebes tu diseño en Realidad Aumentada desde tu celular.
              </p>

              {/* Botones Limpios (Solo 'Enviar Mensaje') */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <WhatsAppButton
                  phone="529673718208"
                  variant="full"
                  label="Enviar Mensaje"
                  className="w-full sm:w-auto text-base py-4 px-8 shadow-red-900/60"
                />

                <a
                  href="#catalogo"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  <Box className="w-4 h-4 text-red-500" />
                  <span>Ver Catálogo 3D</span>
                </a>
              </div>

              {/* 3 Pilares */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-neutral-800/80">
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <PackageCheck className="w-5 h-5 text-red-500 mx-auto" />
                  <span className="block text-[11px] font-extrabold text-white uppercase tracking-wider">DISEÑO PERSONALIZADO</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <Settings className="w-5 h-5 text-red-500 mx-auto" />
                  <span className="block text-[11px] font-extrabold text-white uppercase tracking-wider">ALTA CALIDAD</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <Zap className="w-5 h-5 text-red-500 mx-auto" />
                  <span className="block text-[11px] font-extrabold text-white uppercase tracking-wider">ENTREGA RÁPIDA</span>
                </div>
              </div>

            </div>

            {/* Logo Oficial Panorámico Limpio en el Lado Derecho */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-red-600/60 shadow-2xl shadow-red-950/60 group bg-neutral-900 p-2">
                <div className="relative h-[440px] w-full rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                  <Image
                    src="/images/jc_brand.png"
                    alt="JC_iMPRESIÓN 3D Logo Oficial"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
                <div className="p-4 bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950 rounded-b-2xl flex items-center justify-between border-t border-red-900/40">
                  <span className="text-xs font-bold text-neutral-300">JC IMPRESIÓN 3D</span>
                  <a
                    href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20interesa%20un%20pedido"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Enviar Mensaje</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CATÁLOGO INTERACTIVO 3D */}
      <section id="catalogo" className="py-24 bg-neutral-950 relative border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-red-500 text-xs font-extrabold uppercase tracking-widest">Modelado & Fabricación</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Catálogo de Piezas 3D</h2>
            <p className="text-neutral-400 text-sm">
              Haz clic en cualquier tarjeta para desplegar el visor 3D interactivo (.glb). Puedes rotar 360°, hacer zoom y solicitar tu pedido personalizado a WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-neutral-900/90 border border-neutral-800 rounded-3xl overflow-hidden hover:border-red-600/60 transition-all duration-300 shadow-xl group flex flex-col justify-between"
              >
                <div>
                  {/* Foto miniatura con posición/encuadre dinámico */}
                  <div className="relative h-64 w-full bg-neutral-950 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                    <Image
                      src={prod.image_url}
                      alt={prod.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-all duration-500"
                      style={{ objectPosition: prod.image_position || 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />
                    
                    {/* Badge 3D */}
                    <div className="absolute top-3 right-3 bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver en 3D / AR</span>
                    </div>

                    {prod.category && (
                      <span className="absolute bottom-3 left-3 bg-red-950/80 border border-red-800/60 text-red-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {prod.category}
                      </span>
                    )}
                  </div>

                  {/* Info Producto */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => setSelectedProduct(prod)}
                        className="text-lg font-bold text-white group-hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {prod.name}
                      </h3>
                      <span className="text-lg font-extrabold text-red-500 shrink-0">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                      {prod.description}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-6 pt-0 space-y-2">
                  <button
                    onClick={() => setSelectedProduct(prod)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    <Box className="w-4 h-4 text-red-500" />
                    <span>Abrir Visor 3D (.glb)</span>
                  </button>

                  <WhatsAppButton
                    productName={prod.name}
                    variant="full"
                    label="Enviar Mensaje"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. IMPRESIÓN CONVENCIONAL */}
      <section id="servicios" className="py-24 bg-neutral-900/60 relative border-b border-neutral-900 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-red-500 text-xs font-extrabold uppercase tracking-widest">Más Servicios de Impresión</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Impresión Convencional</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Además de impresión 3D, también ofrecemos servicios de impresión en papel: planos, documentos, opalinas y más.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Planos técnicos */}
            <div className="group relative p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Ruler className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Planos Técnicos</h3>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Arquitectura & Ingeniería</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">Impresión de planos arquitectónicos, estructurales y técnicos en tamaños carta, oficio, pliego y más. Alta resolución.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Carta', 'Oficio', 'Pliego', 'Color', 'B/N'].map(m => (
                    <span key={m} className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">{m}</span>
                  ))}
                </div>
                <a href="#contacto" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Opalinas y materiales especiales */}
            <div className="group relative p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Layers className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Opalinas & Especiales</h3>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Materiales Premium</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">Impresión sobre hojas opalinas, cartulina, papel fotográfico y otros sustratos especiales para presentaciones y proyectos.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Opalina', 'Cartulina', 'Fotográfico', 'Brillante'].map(m => (
                    <span key={m} className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">{m}</span>
                  ))}
                </div>
                <a href="#contacto" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Documentos e impresiones generales */}
            <div className="group relative p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <PackageCheck className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Documentos & Copias</h3>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Impresión General</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">Tesis, trabajos escolares, reportes, tareas y copias. Impresión en blanco y negro o color a precio accesible y entrega rápida.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Tesis', 'Tareas', 'Reportes', 'Copias'].map(m => (
                    <span key={m} className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">{m}</span>
                  ))}
                </div>
                <a href="#contacto" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Fotografías */}
            <div className="group relative p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Palette className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Fotografías & Diseños</h3>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Impresión a Color</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">Impresiones fotográficas de alta calidad, diseños gráficos, logo, cartel, invitaciones y material publicitario.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Fotos', 'Logos', 'Carteles', 'Invitaciones'].map(m => (
                    <span key={m} className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">{m}</span>
                  ))}
                </div>
                <a href="#contacto" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Empastados y terminados */}
            <div className="group relative p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Cpu className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Empastado & Terminados</h3>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Acabado Profesional</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">Empastado térmico, engargolado, encuadernado y laminado para darle un acabado profesional a tus documentos y presentaciones.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Empastado', 'Engargolado', 'Laminado'].map(m => (
                    <span key={m} className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">{m}</span>
                  ))}
                </div>
                <a href="#contacto" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Viniles / Pegatinas */}
            <div className="group relative p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Stickers & Etiquetas</h3>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Personalizados</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">Stickers, etiquetas, pegatinas y vinil adhesivo personalizados. Ideales para negocios, eventos o uso personal.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Stickers', 'Etiquetas', 'Vinil', 'Personalizado'].map(m => (
                    <span key={m} className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">{m}</span>
                  ))}
                </div>
                <a href="#contacto" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. MANTENIMIENTO DE EQUIPOS */}
      <section id="mantenimiento" className="py-24 bg-neutral-950 relative border-b border-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-neutral-950 to-neutral-950 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-red-500 text-xs font-extrabold uppercase tracking-widest">Soporte Técnico</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Mantenimiento de Equipos</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              ¿Tu computadora, laptop o impresora falla? Ofrecemos mantenimiento técnico preventivo y correctivo para tus equipos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

            {/* Mantenimiento de computadoras */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-red-600/40 transition-all duration-300 shadow-2xl overflow-hidden group">
              <div className="absolute top-4 right-4 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center">
                    <Cpu className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Mantenimiento de Computadoras</h3>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">PC, Laptop & All-in-One</p>
                  </div>
                </div>

                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  ¿Tu equipo va lento, no enciende o tiene virus? Hacemos diagnóstico, limpieza interna, reinstalación de sistema y más.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    { icon: <RotateCcw className="w-4 h-4" />, text: 'Limpieza interna de polvo y ventiladores' },
                    { icon: <Shield className="w-4 h-4" />, text: 'Eliminación de virus y malware' },
                    { icon: <Cpu className="w-4 h-4" />, text: 'Reinstalación de Windows / controladores' },
                    { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Cambio de pasta térmica y optimización' },
                    { icon: <Wrench className="w-4 h-4" />, text: 'Reparación de pantalla, teclado y puertos' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                      <span className="text-red-500">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-900/40"
                >
                  <MessageCircle className="w-4 h-4" />
                  Solicitar Servicio Técnico
                </a>
              </div>
            </div>

            {/* Mantenimiento de impresoras */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-red-600/40 transition-all duration-300 shadow-2xl overflow-hidden group">
              <div className="absolute top-4 right-4 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center">
                    <Wrench className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Mantenimiento de Impresoras</h3>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Convencionales & 3D</p>
                  </div>
                </div>

                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  Servicio técnico para impresoras de inyección de tinta, láser e impresoras 3D. Limpieza de cabezales, recarga de tinta y más.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    { icon: <RotateCcw className="w-4 h-4" />, text: 'Limpieza y desconexión de cabezales' },
                    { icon: <Droplets className="w-4 h-4" />, text: 'Recarga y cambio de cartuchos de tinta' },
                    { icon: <Shield className="w-4 h-4" />, text: 'Revisión mecánica de rodillos y charola' },
                    { icon: <Wrench className="w-4 h-4" />, text: 'Calibración y mantenimiento de impresoras 3D' },
                    { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Prueba de impresión post-mantenimiento' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                      <span className="text-red-500">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-900/40"
                >
                  <MessageCircle className="w-4 h-4" />
                  Solicitar Mantenimiento
                </a>
              </div>
            </div>
          </div>

          {/* Banner de proceso */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-r from-red-950/60 via-neutral-900 to-neutral-900 border border-red-900/40 shadow-xl overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-950/20 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-lg font-black text-white mb-2">¿Cómo funciona el servicio?</h3>
              <p className="text-neutral-400 text-sm mb-6">Simple, rápido y transparente</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { num: '01', title: 'Nos contactas', desc: 'Por WhatsApp o formulario' },
                  { num: '02', title: 'Diagnóstico', desc: 'Revisamos tu equipo sin costo' },
                  { num: '03', title: 'Cotizamos', desc: 'Te damos precio antes de empezar' },
                  { num: '04', title: 'Entregamos', desc: 'Tu equipo listo en tiempo récord' },
                ].map((step) => (
                  <div key={step.num} className="flex flex-col gap-2">
                    <span className="text-4xl font-black text-red-600/30">{step.num}</span>
                    <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    <p className="text-xs text-neutral-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECCIÓN QUIÉNES SOMOS */}
      <section id="quienes-somos" className="py-24 bg-neutral-900/40 relative border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Logo Oficial Limpio */}
            <div className="relative rounded-3xl overflow-hidden border border-red-900/40 shadow-2xl group bg-neutral-950 p-2">
              <div className="relative h-[380px] w-full rounded-2xl overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/jc_brand.png"
                  alt="JC_iMPRESIÓN 3D Marca"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Historia y Pilares */}
            <div className="space-y-6">
              <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Sobre JC Impresión 3D</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Modelos Personalizados de Alta Calidad & Entrega Rápida
              </h2>

              <p className="text-neutral-300 text-sm leading-relaxed font-light">
                En <strong className="text-white font-bold">JC IMPRESIÓN 3D</strong> nos especializamos en convertir tus ideas más complejas en modelos 3D tangibles para maquetas y prototipos. Aplicamos rigurosos estándares de impresión y acabado.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Diseño Personalizado</h4>
                    <p className="text-xs text-neutral-400">Trabajamos mano a mano con tus planos, bocetos o archivos CAD/STL.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Alta Calidad de Fabricación</h4>
                    <p className="text-xs text-neutral-400">Materiales resistentes y calibración micromanual en cada capa de impresión.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Entrega Rápida</h4>
                    <p className="text-xs text-neutral-400">Tiempos récord de producción y envíos directos.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. OPINIONES DE CLIENTES */}
      <section id="opiniones" className="py-24 bg-neutral-950 relative border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Experiencias Verificadas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Opiniones de Nuestros Clientes</h2>
            <p className="text-neutral-400 text-sm">
              Revisa los testimonios de estudiantes y arquitectos que han realizado sus maquetas con nosotros.
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

      {/* 5. CONTACTO CON RESEND & WHATSAPP */}
      <section id="contacto" className="py-24 bg-neutral-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Contacto Directo</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">JC IMPRESIÓN 3D</h2>
                <p className="text-neutral-400 text-sm mt-3 font-light leading-relaxed">
                  ¿Tienes una idea en mente? Recuerda: <strong className="text-white font-bold font-italic">¡TÚ LO IMAGINAS, NOSOTROS LO CREAMOS!</strong>
                </p>
              </div>

              <div className="space-y-4 text-sm text-neutral-300">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <Phone className="w-5 h-5 text-red-500" />
                  <div>
                    <span className="block text-xs font-bold text-white">Pedidos Vía WhatsApp</span>
                    <span className="block text-sm font-extrabold text-red-400">Atención Instantánea</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <Mail className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="block text-xs font-bold text-white">Correo Electrónico (Resend)</span>
                    <span className="block text-xs text-neutral-400">pedidos@jcimpresion3d.com</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <Clock className="w-5 h-5 text-neutral-400" />
                  <div>
                    <span className="block text-xs font-bold text-white">Horario del Taller</span>
                    <span className="block text-xs text-neutral-400">Lunes a Sábado: 8:00 - 20:00 hrs</span>
                  </div>
                </div>
              </div>

              <WhatsAppButton
                phone="529673718208"
                variant="full"
                label="Enviar Mensaje"
              />
            </div>

            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-red-600/40 p-0.5">
              <Image src="/images/jc_brand.png" alt="JC Impresión 3D" fill sizes="32px" className="object-contain" />
            </div>
            <div>
              <span className="block font-bold text-white text-sm">JC IMPRESIÓN 3D</span>
              <span className="text-[11px] text-neutral-400">Modelos a Escala</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#catalogo" className="hover:text-neutral-300 transition-colors">Catálogo</a>
            <a href="#servicios" className="hover:text-neutral-300 transition-colors">Servicios</a>
            <a href="#mantenimiento" className="hover:text-neutral-300 transition-colors">Mantenimiento</a>
            <a href="#quienes-somos" className="hover:text-neutral-300 transition-colors">Quiénes Somos</a>
            <a href="#opiniones" className="hover:text-neutral-300 transition-colors">Opiniones</a>
            <a href="#contacto" className="hover:text-neutral-300 transition-colors">Contacto</a>
            <a href="/admin" className="text-red-500 font-semibold hover:underline">Panel Admin</a>
          </div>

          <p>© {new Date().getFullYear()} JC IMPRESIÓN 3D. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modal Visor 3D */}
      <ModelViewerModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

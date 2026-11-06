'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Layers,
  Wrench,
  Users,
  MessageSquare,
  Mail,
  Lock,
  Menu,
  X,
  MessageCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Inicio', href: '#inicio', icon: Sparkles },
    { label: 'Catálogo 3D', href: '#catalogo', icon: Box },
    { label: 'Servicios', href: '#servicios', icon: Layers },
    { label: 'Mantenimiento', href: '#mantenimiento', icon: Wrench },
    { label: 'Nosotros', href: '#nosotros', icon: Users },
    { label: 'Opiniones', href: '#opiniones', icon: MessageSquare },
    { label: 'Contacto', href: '#contacto', icon: Mail },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#111214]/95 backdrop-blur-md border-b border-[#25272C] shadow-2xl py-3'
          : 'bg-gradient-to-b from-[#111214] via-[#111214]/90 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logotipo Oficial JC IMPRESIÓN 3D */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#E50920] rounded-xl p-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#1B1D21] border border-[#25272C] group-hover:border-[#E50920]/60 p-1 shadow-md transition-all duration-300">
            <Image
              src="/images/jc_brand.png"
              alt="JC_iMPRESIÓN 3D Logo Oficial"
              fill
              sizes="44px"
              priority
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              JC <span className="text-[#E50920] font-black">IMPRESIÓN 3D</span>
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-[#A1A1AA] uppercase -mt-0.5">
              Modelos a Escala & Taller
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación en Escritorio */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#1B1D21]/90 p-1.5 rounded-full border border-[#25272C] backdrop-blur-sm shadow-inner" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#A1A1AA] hover:text-white hover:bg-[#25272C] rounded-full transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#E50920]"
              >
                <Icon className="w-3.5 h-3.5 text-[#E50920]" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Acceso Directo a Cotización & Panel Admin */}
        <div className="hidden sm:flex items-center gap-2.5">
          <a
            href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20interesa%20solicitar%20una%20cotizaci%C3%B3n."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E50920] hover:bg-[#E50920]/90 rounded-full shadow-lg shadow-[#E50920]/25 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E50920]"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>Cotizar Proyecto</span>
          </a>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A1A1AA] hover:text-white bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] rounded-full transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            title="Panel de Administración"
          >
            <Lock className="w-3 h-3 text-[#A1A1AA]" />
            <span className="hidden xl:inline">Admin</span>
          </Link>
        </div>

        {/* Botón Menú Móvil */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-[#1B1D21] border border-[#25272C] text-neutral-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#E50920]"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Menú Desplegable Accesible para Móviles */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111214]/98 border-b border-[#25272C] px-4 pt-3 pb-6 mt-3 space-y-2 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-200 hover:text-white bg-[#1B1D21] hover:bg-[#25272C] border border-[#25272C] rounded-xl transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#E50920]" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#25272C] space-y-2">
            <a
              href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20interesa%20solicitar%20una%20cotizaci%C3%B3n."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-[#E50920] hover:bg-[#E50920]/90 rounded-xl shadow-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Solicitar Cotización por WhatsApp</span>
            </a>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-[#A1A1AA] hover:text-white bg-[#1B1D21] border border-[#25272C] rounded-xl transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso al Panel de Administración</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

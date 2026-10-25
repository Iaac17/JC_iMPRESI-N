'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Info, MessageSquare, Mail, Lock, Menu, X, MessageCircle } from 'lucide-react';

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
    { label: 'Catálogo 3D', href: '#catalogo', icon: ShoppingBag },
    { label: 'Quiénes Somos', href: '#quienes-somos', icon: Info },
    { label: 'Opiniones', href: '#opiniones', icon: MessageSquare },
    { label: 'Contacto', href: '#contacto', icon: Mail },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-neutral-950/90 backdrop-blur-md border-b border-red-900/30 shadow-2xl py-3'
          : 'bg-gradient-to-b from-neutral-950/95 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logotipo Oficial JC IMPRESIÓN 3D */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-red-600/50 p-0.5 shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/images/jc_brand.png"
              alt="JC_iMPRESIÓN 3D Logo"
              fill
              sizes="48px"
              priority
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              JC <span className="text-red-500 font-extrabold">IMPRESIÓN 3D</span>
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-neutral-400 uppercase -mt-1">
              Modelos a Escala
            </span>
          </div>
        </Link>

        {/* Enlaces Rápidos en Escritorio */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/80 p-1.5 rounded-full border border-neutral-800 backdrop-blur-sm shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-red-950/50 hover:border-red-900/30 rounded-full transition-all duration-200"
              >
                <Icon className="w-3.5 h-3.5 text-red-500" />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Acceso Directo Pedidos & Panel Admin */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20interesa%20un%20pedido"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-full shadow-lg shadow-red-950/50 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>Enviar Mensaje</span>
          </a>

          <Link
            href="/admin"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-full transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            Admin
          </Link>
        </div>

        {/* Botón Menú Móvil */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          aria-label="Abrir Menú"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú desplegable para móviles */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950/98 border-b border-red-900/40 px-4 pt-3 pb-6 mt-3 space-y-2 backdrop-blur-xl animate-in slide-in-from-top-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-900 rounded-xl"
              >
                <Icon className="w-4 h-4 text-red-500" />
                {item.label}
              </a>
            );
          })}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <a
              href="https://wa.me/529673718208"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-red-600 rounded-xl"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar Mensaje
            </a>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-neutral-400 bg-neutral-900 rounded-xl"
            >
              <Lock className="w-3.5 h-3.5" />
              Acceso Administrador
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

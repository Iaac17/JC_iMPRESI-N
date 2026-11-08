'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  productName?: string;
  phone?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'full';
  label?: string;
}

export default function WhatsAppButton({
  productName,
  phone = '529673718208',
  className = '',
  variant = 'primary',
  label
}: WhatsAppButtonProps) {
  const defaultText = productName
    ? `Hola JC_iMPRESIÓN 3D, me gustaría consultar el precio y cotizar: ${productName}`
    : 'Hola JC_iMPRESIÓN 3D, me gustaría cotizar un proyecto o consultar precios.';

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`;
  const defaultLabel = label || 'Consultar precio por WhatsApp';

  if (variant === 'full') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#E50920] hover:bg-[#f01c31] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#E50920]/25 transition-all duration-200 transform active:scale-[0.99] ${className}`}
      >
        <MessageCircle className="w-4 h-4 fill-current" />
        <span>{defaultLabel}</span>
      </a>
    );
  }

  if (variant === 'secondary') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1B1D21] hover:bg-[#25272C] text-white border border-[#25272C] hover:border-[#E50920]/60 text-xs font-bold rounded-xl transition-all duration-200 ${className}`}
      >
        <MessageCircle className="w-4 h-4 text-[#E50920] fill-current" />
        <span>{defaultLabel}</span>
      </a>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E50920] hover:bg-[#f01c31] text-white text-xs font-bold rounded-xl shadow-md shadow-[#E50920]/20 transition-all duration-200 ${className}`}
    >
      <MessageCircle className="w-4 h-4 fill-current" />
      <span>{defaultLabel}</span>
    </a>
  );
}

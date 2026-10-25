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
    ? `Hola JC_iMPRESIÓN 3D, me interesa el producto: ${productName}`
    : 'Hola JC_iMPRESIÓN 3D, me interesa realizar un pedido de un modelo personalizado.';

  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    defaultText
  )}`;

  const defaultLabel = label || 'Enviar Mensaje';

  if (variant === 'full') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-950/50 hover:shadow-red-600/40 transition-all duration-300 transform active:scale-98 ${className}`}
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span>{defaultLabel}</span>
      </a>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-red-600/40 transition-all duration-200 ${className}`}
    >
      <MessageCircle className="w-4 h-4 fill-current" />
      <span>{defaultLabel}</span>
    </a>
  );
}

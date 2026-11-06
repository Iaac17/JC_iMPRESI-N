'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, MessageSquare, Phone, Sparkles } from 'lucide-react';
import { ContactFormData } from '@/types';

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [serviceType, setServiceType] = useState('Modelos 3D & Maquetas');
  const [projectScale, setProjectScale] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setResponseMsg('');

    // Estructurar el mensaje con el tipo de servicio y escala de forma ordenada
    const formattedMessage = `[Servicio: ${serviceType}]${projectScale ? ` [Escala/Medidas: ${projectScale.trim()}]` : ''}\n\n${formData.message.trim()}`;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          message: formattedMessage
        })
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setResponseMsg(data.message || '¡Tu mensaje ha sido enviado exitosamente! Te responderemos muy pronto.');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setProjectScale('');
      } else {
        setStatus('error');
        setResponseMsg(data.error || 'Ocurrió un error al enviar el mensaje.');
      }
    } catch (err) {
      setStatus('error');
      setResponseMsg('Error de conexión. Inténtalo nuevamente o contáctanos por WhatsApp.');
    }
  };

  return (
    <div className="bg-[#1B1D21] border border-[#25272C] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      
      {/* Título de la sección */}
      <div className="space-y-2 mb-6">
        <span className="text-[#E50920] text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solicitud de Cotización & Consulta</span>
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white">Cuéntanos sobre tu proyecto</h3>
        <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
          Completa los datos para recibir una cotización clara, sin compromiso y adaptada a tus necesidades.
        </p>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{responseMsg}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{responseMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Nombre Completo *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Ana Martínez"
              className="w-full px-3.5 py-3 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Correo Electrónico *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ana@ejemplo.com"
              className="w-full px-3.5 py-3 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Teléfono / WhatsApp (Recomendado)
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej. 967 123 4567"
              className="w-full px-3.5 py-3 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="service" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Servicio de Interés *
            </label>
            <select
              id="service"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#111214] border border-[#25272C] rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-[#E50920] transition-colors"
            >
              <option value="Modelos 3D & Maquetas">Modelos 3D & Maquetas</option>
              <option value="Pieza Personalizada o Repuesto">Pieza Personalizada o Repuesto 3D</option>
              <option value="Impresión de Planos & Documentos">Impresión de Planos & Documentos</option>
              <option value="Mantenimiento de Computadoras / Laptops">Mantenimiento de PC / Laptop</option>
              <option value="Mantenimiento de Impresoras (Tinta / 3D)">Mantenimiento de Impresora</option>
              <option value="Otro Proyecto">Otro Proyecto</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="scale" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
            Medidas o Escala Deseada (Opcional)
          </label>
          <input
            id="scale"
            type="text"
            value={projectScale}
            onChange={(e) => setProjectScale(e.target.value)}
            placeholder="Ej. Escala 1:100, 15 cm de largo, a medida..."
            className="w-full px-3.5 py-3 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
            Detalles de tu Idea o Proyecto *
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Explícanos brevemente qué necesitas fabricar, para cuándo lo requieres o cualquier detalle relevante..."
            className="w-full px-3.5 py-3 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#E50920] hover:bg-[#E50920]/90 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#E50920]/25 transition-all duration-300 active:scale-98 disabled:opacity-50"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando tu consulta...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enviar Solicitud de Cotización</span>
            </>
          )}
        </button>

        <div className="pt-3 text-center border-t border-[#25272C] mt-4">
          <p className="text-[11px] text-[#A1A1AA] mb-2">¿Necesitas una respuesta más rápida?</p>
          <a
            href="https://wa.me/529673718208?text=Hola%20JC_iMPRESI%C3%93N%203D%2C%20me%20gustar%C3%ADa%20cotizar%20un%20proyecto."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-colors"
          >
            <span>📱 Escríbenos directamente a WhatsApp (967 371 8208)</span>
          </a>
        </div>
      </form>
    </div>
  );
}

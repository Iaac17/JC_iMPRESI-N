'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ContactFormData } from '@/types';

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setResponseMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setResponseMsg(data.message || 'Mensaje enviado exitosamente.');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
        setResponseMsg(data.error || 'Ocurrió un error al enviar el mensaje.');
      }
    } catch (err) {
      setStatus('error');
      setResponseMsg('Error de conexión. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Fondo con brillo suave */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <h3 className="text-2xl font-bold text-white mb-2">Envíanos un Mensaje Directo</h3>
      <p className="text-neutral-400 text-sm mb-6">
        ¿Tienes un proyecto especial o consulta sobre nuestros modelos 3D? Completa el formulario y te responderemos a la brevedad.
      </p>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{responseMsg}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{responseMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Nombre Completo *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Ana Martínez"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Correo Electrónico *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ana@ejemplo.com"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
            Teléfono / WhatsApp (Opcional)
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+52 55 1234 5678"
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
            Mensaje *
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Describe tu consulta o requerimiento de modelo 3D..."
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 active:scale-98 disabled:opacity-50"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando mensaje...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Enviar Mensaje con Resend</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

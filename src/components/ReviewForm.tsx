'use client';

import React, { useState } from 'react';
import { Star, Send, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

interface ReviewFormProps {
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ onReviewSubmitted }: ReviewFormProps) {
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName,
          comment,
          rating
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setAuthorName('');
        setComment('');
        setRating(5);
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        setErrorMsg(data.error || 'Ocurrió un error al enviar tu reseña.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión al enviar la reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1B1D21] border border-[#25272C] rounded-3xl p-6 sm:p-8 shadow-xl">
      <h4 className="text-xl font-bold text-white mb-1.5">Comparte tu Experiencia</h4>
      <p className="text-[#A1A1AA] text-xs mb-6 leading-relaxed">
        Tu opinión ayuda a otros clientes a conocer nuestro trabajo. Para mantener un espacio respetuoso, las reseñas son revisadas antes de publicarse.
      </p>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-[#E50920]/10 border border-[#E50920]/30 text-center space-y-3 animate-in fade-in">
          <CheckCircle2 className="w-10 h-10 text-[#E50920] mx-auto" />
          <h5 className="text-lg font-bold text-white">¡Muchas gracias por tu opinión!</h5>
          <p className="text-[#A1A1AA] text-xs leading-relaxed max-w-md mx-auto">
            Tu comentario ha sido recibido correctamente. Se publicará en esta sección en cuanto sea validado por nuestro equipo.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 text-xs font-semibold text-[#E50920] hover:underline"
          >
            Escribir otra opinión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Selector de Calificación (Estrellas) */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-2 uppercase tracking-wider">
              Calificación
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-[#25272C] hover:scale-110 transition-transform focus:outline-none"
                  aria-label={`Calificar con ${star} estrellas`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#25272C]'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-amber-400">
                {rating} de 5 estrellas
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="authorName" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Tu Nombre *
            </label>
            <input
              id="authorName"
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej. Roberto Sánchez"
              className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="comment" className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Tu Comentario o Experiencia *
            </label>
            <textarea
              id="comment"
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos qué te pareció el modelo 3D, la calidad o la atención recibida..."
              className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#25272C] rounded-xl text-white placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#E50920] text-xs sm:text-sm transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E50920]" />
              <span>Filtro de moderación activo antes de publicar</span>
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E50920] hover:bg-[#E50920]/90 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar para Revisión</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

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
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <h4 className="text-xl font-bold text-white mb-2">Deja tu Reseña u Opinión</h4>
      <p className="text-neutral-400 text-xs mb-6">
        Tu experiencia es muy importante para nosotros. Por motivos de seguridad y calidad, todas las opiniones se revisan antes de ser publicadas.
      </p>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3 animate-in fade-in">
          <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto" />
          <h5 className="text-lg font-bold text-white">¡Gracias por tu opinión!</h5>
          <p className="text-neutral-300 text-xs leading-relaxed max-w-md mx-auto">
            Tu reseña ha sido registrada exitosamente con el estado <span className="font-semibold text-amber-400">pendiente de aprobación</span>. Aparecerá en nuestro sitio tan pronto como el administrador la verifique.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
          >
            Escribir otra reseña
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
            <label className="block text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">
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
                  className="p-1 text-neutral-600 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-700'
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
            <label htmlFor="authorName" className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Tu Nombre *
            </label>
            <input
              id="authorName"
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej. Roberto Sánchez"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="comment" className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Tu Comentario o Experiencia *
            </label>
            <textarea
              id="comment"
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos qué te pareció el modelo 3D, la calidad o la atención..."
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 text-sm resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Filtro de moderación activo
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
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

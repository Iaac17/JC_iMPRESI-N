'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquareQuote, CheckCircle, Clock } from 'lucide-react';
import { Review } from '@/types';
import { INITIAL_REVIEWS } from '@/lib/sampleData';

export default function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApprovedReviews();
  }, []);

  const fetchApprovedReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      }
    } catch (err) {
      console.error('Error fetching approved reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-[#1B1D21] border border-[#25272C] hover:border-[#E50920]/40 rounded-2xl p-6 relative flex flex-col justify-between transition-all duration-300 shadow-xl"
          >
            <MessageSquareQuote className="absolute top-5 right-5 w-7 h-7 text-[#25272C] pointer-events-none" />

            <div className="space-y-3">
              {/* Estrellas de Calificación */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rev.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#25272C]'
                    }`}
                  />
                ))}
              </div>

              {/* Comentario del Cliente */}
              <p className="text-neutral-200 text-xs sm:text-sm leading-relaxed italic">
                "{rev.comment}"
              </p>
            </div>

            {/* Autor y Fecha */}
            <div className="mt-5 pt-3.5 border-t border-[#25272C] flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-white">{rev.author_name}</span>
                <span className="block text-[10px] text-[#A1A1AA]">Opinión de cliente</span>
              </div>
              {rev.created_at && (
                <span className="text-[10px] text-[#A1A1AA] font-mono">
                  {formatDate(rev.created_at)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center p-3.5 rounded-xl bg-[#1B1D21] border border-[#25272C] max-w-xl mx-auto text-[11px] text-[#A1A1AA]">
        <span>🔒 Las opiniones publicadas pasan por un filtro de moderación para garantizar comentarios reales y respetuosos.</span>
      </div>
    </div>
  );
}

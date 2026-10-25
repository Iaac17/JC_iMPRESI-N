'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquareQuote, CheckCircle } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-lg"
          >
            <MessageSquareQuote className="absolute top-4 right-4 w-8 h-8 text-neutral-800 pointer-events-none" />

            <div className="space-y-3">
              {/* Estrellas */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rev.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>

              {/* Comentario */}
              <p className="text-neutral-300 text-xs italic leading-relaxed">
                "{rev.comment}"
              </p>
            </div>

            {/* Autor y badge */}
            <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-white">{rev.author_name}</span>
                <span className="block text-[10px] text-neutral-400">Cliente Verificado</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, ExternalLink, ShieldCheck, Camera } from 'lucide-react';
import { INSTAGRAM_POSTS } from '@/lib/sampleData';

function InstagramIcon({ className = "w-5 h-5 text-pink-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export default function InstagramEmbed() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InstagramIcon className="w-5 h-5 text-pink-500" />
          <h3 className="text-xl font-bold text-white">Entregas Reales en Instagram</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Clientes Verificados
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INSTAGRAM_POSTS.map((post) => (
          <div
            key={post.id}
            className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all duration-300 shadow-xl group flex flex-col justify-between"
          >
            {/* Header Post */}
            <div className="p-3.5 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/40">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-pink-500/50">
                  <Image
                    src={post.userAvatar}
                    alt={post.username}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">{post.username}</span>
                  <span className="block text-[10px] text-neutral-400">{post.date}</span>
                </div>
              </div>
              <InstagramIcon className="w-4 h-4 text-neutral-500 group-hover:text-pink-400 transition-colors" />
            </div>

            {/* Imagen del Post */}
            <div className="relative h-64 w-full bg-neutral-950 overflow-hidden">
              <Image
                src={post.imageUrl}
                alt="Entrega a cliente"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />
            </div>

            {/* Contenido & Likes */}
            <div className="p-4 space-y-3 bg-neutral-900 flex-1 flex flex-col justify-between">
              <p className="text-neutral-300 text-xs leading-relaxed line-clamp-3">
                {post.caption}
              </p>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-1.5 text-pink-400 font-semibold">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{post.likes} Me gusta</span>
                </div>
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Ver Post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_REVIEWS } from '@/lib/sampleData';
import { Review } from '@/types';

// Almacenamiento local temporal en memoria para demostración cuando Supabase no está configurado aún
let localReviews: Review[] = [...INITIAL_REVIEWS];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includePending = searchParams.get('includePending') === 'true';

    if (isSupabaseConfigured()) {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!includePending) {
        query = query.eq('approved', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Fallback local
    const filtered = includePending
      ? localReviews
      : localReviews.filter((r) => r.approved);
    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { author_name, comment, rating } = body;

    if (!author_name || !comment || !rating) {
      return NextResponse.json(
        { error: 'Todos los campos (nombre, comentario y calificación) son obligatorios.' },
        { status: 400 }
      );
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      author_name,
      comment,
      rating: Number(rating),
      approved: false, // Moderación por defecto: entra con aprobado = false
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          author_name: newReview.author_name,
          comment: newReview.comment,
          rating: newReview.rating,
          approved: false
        }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Fallback local
    localReviews.unshift(newReview);
    return NextResponse.json(newReview);
  } catch (error: any) {
    console.error('Error posting review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, approved } = body;

    if (!id || approved === undefined) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (id y approved).' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('reviews')
        .update({ approved })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Fallback local
    const target = localReviews.find((r) => r.id === id);
    if (target) {
      target.approved = approved;
    }
    return NextResponse.json(target);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Fallback local
    localReviews = localReviews.filter((r) => r.id !== id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

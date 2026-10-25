import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PRODUCTS } from '@/lib/sampleData';
import { Product } from '@/types';

// Almacenamiento local en memoria cuando Supabase no está configurado aún
let localProducts: Product[] = [...INITIAL_PRODUCTS];

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json(localProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Soporte para inserción única o masiva (array)
    const items: Partial<Product>[] = Array.isArray(body) ? body : [body];

    const processedProducts: Product[] = items.map((item, index) => ({
      id: item.id || `prod-${Date.now()}-${index}`,
      name: item.name || 'Producto Sin Nombre',
      description: item.description || '',
      price: Number(item.price) || 0,
      scale_prices: item.scale_prices || [
        { scale: 'Escala 1:50', price: (Number(item.price) || 0) * 1.5 },
        { scale: 'Escala 1:100', price: Number(item.price) || 0 },
        { scale: 'Escala 1:200', price: (Number(item.price) || 0) * 0.7 }
      ],
      image_url: item.image_url || '/images/maquetas/maqueta_farolas.jpg',
      image_position: item.image_position || 'center',
      model_url: item.model_url || '',
      raw_model_url: item.raw_model_url || '',
      raw_model_name: item.raw_model_name || '',
      category: item.category || 'Maquetas',
      scales: item.scales || ['Escala 1:50', 'Escala 1:100', 'Escala 1:200'],
      created_at: new Date().toISOString()
    }));

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .insert(processedProducts)
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Fallback local
    localProducts = [...processedProducts, ...localProducts];
    return NextResponse.json(processedProducts);
  } catch (error: any) {
    console.error('Error creating product(s):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, price, scale_prices, category, image_url, image_position, model_url, raw_model_url, raw_model_name, scales } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido para editar.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name,
          description,
          price: Number(price),
          scale_prices,
          category,
          image_url,
          image_position,
          model_url,
          raw_model_url,
          raw_model_name,
          scales
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Fallback local
    const index = localProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      localProducts[index] = {
        ...localProducts[index],
        name,
        description,
        price: Number(price),
        scale_prices: scale_prices || localProducts[index].scale_prices,
        category,
        image_url,
        image_position: image_position || localProducts[index].image_position || 'center',
        model_url: model_url !== undefined ? model_url : localProducts[index].model_url,
        raw_model_url: raw_model_url !== undefined ? raw_model_url : localProducts[index].raw_model_url,
        raw_model_name: raw_model_name !== undefined ? raw_model_name : localProducts[index].raw_model_name,
        scales: scales || localProducts[index].scales
      };
      return NextResponse.json(localProducts[index]);
    }

    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  } catch (error: any) {
    console.error('Error al editar producto:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de producto no proporcionado.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Fallback local
    localProducts = localProducts.filter((p) => p.id !== id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

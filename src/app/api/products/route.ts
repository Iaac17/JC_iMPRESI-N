import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PRODUCTS } from '@/lib/sampleData';
import { Product } from '@/types';

// Archivo de persistencia local para asegurar que los productos ocultos nunca se pierdan al recargar
const HIDDEN_FILE_PATH = path.join(process.cwd(), 'data', 'hidden_products.json');
const HIDDEN_PRICES_FILE_PATH = path.join(process.cwd(), 'data', 'hidden_prices.json');

function getHiddenIds(): string[] {
  try {
    if (fs.existsSync(HIDDEN_FILE_PATH)) {
      const raw = fs.readFileSync(HIDDEN_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error al leer productos ocultos:', err);
  }
  return [];
}

function setHiddenId(id: string, hidden: boolean) {
  try {
    const ids = new Set(getHiddenIds());
    if (hidden) {
      ids.add(id);
    } else {
      ids.delete(id);
    }
    const dir = path.dirname(HIDDEN_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HIDDEN_FILE_PATH, JSON.stringify(Array.from(ids)), 'utf-8');
  } catch (err) {
    console.error('Error al guardar producto oculto:', err);
  }
}

function getHiddenPriceIds(): string[] {
  try {
    if (fs.existsSync(HIDDEN_PRICES_FILE_PATH)) {
      const raw = fs.readFileSync(HIDDEN_PRICES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error al leer precios ocultos:', err);
  }
  return [];
}

function setHiddenPriceId(id: string, hide: boolean) {
  try {
    const ids = new Set(getHiddenPriceIds());
    if (hide) {
      ids.add(id);
    } else {
      ids.delete(id);
    }
    const dir = path.dirname(HIDDEN_PRICES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HIDDEN_PRICES_FILE_PATH, JSON.stringify(Array.from(ids)), 'utf-8');
  } catch (err) {
    console.error('Error al guardar precio oculto:', err);
  }
}

// Almacenamiento local en memoria cuando Supabase no está configurado aún
let localProducts: Product[] = [...INITIAL_PRODUCTS];

export async function GET() {
  try {
    const hiddenSet = new Set(getHiddenIds());
    const hiddenPriceSet = new Set(getHiddenPriceIds());

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Garantizar persistencia multi-capa para is_hidden y hide_price
      const enriched = (data || []).map((p: any) => {
        const isHidden =
          p.is_hidden === true ||
          hiddenSet.has(p.id) ||
          (typeof p.image_position === 'string' && p.image_position.includes('#hidden'));

        const hidePrice =
          p.hide_price === true ||
          hiddenPriceSet.has(p.id) ||
          (typeof p.image_position === 'string' && p.image_position.includes('#noprice'));

        return {
          ...p,
          is_hidden: isHidden,
          hide_price: hidePrice
        };
      });

      return NextResponse.json(enriched);
    }

    const localEnriched = localProducts.map((p) => ({
      ...p,
      is_hidden: p.is_hidden === true || hiddenSet.has(p.id),
      hide_price: p.hide_price === true || hiddenPriceSet.has(p.id)
    }));

    return NextResponse.json(localEnriched);
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

    const processedProducts: Product[] = items.map((item, index) => {
      const prodId = item.id || `prod-${Date.now()}-${index}`;
      const isHidden = item.is_hidden === true;
      const hidePrice = item.hide_price === true;

      if (isHidden) {
        setHiddenId(prodId, true);
      }
      if (hidePrice) {
        setHiddenPriceId(prodId, true);
      }

      let imgPos = item.image_position || 'center';
      imgPos = imgPos.replace('#hidden', '').replace('#noprice', '');
      if (isHidden) imgPos += '#hidden';
      if (hidePrice) imgPos += '#noprice';

      return {
        id: prodId,
        name: item.name || 'Producto Sin Nombre',
        description: item.description || '',
        price: Number(item.price) || 0,
        scale_prices: item.scale_prices || [
          { scale: 'Escala 1:50', price: (Number(item.price) || 0) * 1.5 },
          { scale: 'Escala 1:100', price: Number(item.price) || 0 },
          { scale: 'Escala 1:200', price: (Number(item.price) || 0) * 0.7 }
        ],
        image_url: item.image_url || '/images/maquetas/maqueta_farolas.jpg',
        image_position: imgPos,
        model_url: item.model_url || '',
        raw_model_url: item.raw_model_url || '',
        raw_model_name: item.raw_model_name || '',
        category: item.category || 'Maquetas',
        scales: item.scales || ['Escala 1:50', 'Escala 1:100', 'Escala 1:200'],
        real_dimensions: item.real_dimensions || undefined,
        hide_price: hidePrice,
        is_hidden: isHidden,
        created_at: new Date().toISOString()
      };
    });

    if (isSupabaseConfigured()) {
      let { data, error } = await supabase
        .from('products')
        .insert(processedProducts)
        .select();

      // Si alguna columna opcional aún no está creada en Supabase, reintentar limpiando
      if (error) {
        const fallbackList = processedProducts.map(({ is_hidden, hide_price, real_dimensions, ...rest }) => rest);
        const retry = await supabase.from('products').insert(fallbackList).select();
        if (retry.error) throw retry.error;
        data = retry.data;
      }

      const formatted = (data || []).map((p: any, idx: number) => ({
        ...p,
        is_hidden: processedProducts[idx]?.is_hidden ?? false,
        hide_price: processedProducts[idx]?.hide_price ?? false,
        real_dimensions: processedProducts[idx]?.real_dimensions
      }));

      return NextResponse.json(formatted);
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
    const { id, name, description, price, scale_prices, category, image_url, image_position, model_url, raw_model_url, raw_model_name, scales, real_dimensions, hide_price, is_hidden } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido para editar.' }, { status: 400 });
    }

    // Actualizar persistencia de ID oculto y precio oculto
    if (is_hidden !== undefined) {
      setHiddenId(id, Boolean(is_hidden));
    }
    if (hide_price !== undefined) {
      setHiddenPriceId(id, Boolean(hide_price));
    }

    // Preparar posición de imagen con marcas #hidden y #noprice
    let finalImagePosition = image_position || 'center';
    finalImagePosition = finalImagePosition.replace('#hidden', '').replace('#noprice', '');
    if (is_hidden) finalImagePosition += '#hidden';
    if (hide_price) finalImagePosition += '#noprice';

    if (isSupabaseConfigured()) {
      const updateData: Record<string, any> = {
        name,
        description,
        price: Number(price),
        scale_prices,
        category,
        image_url,
        image_position: finalImagePosition,
        model_url,
        raw_model_url,
        raw_model_name,
        scales,
        real_dimensions
      };
      if (is_hidden !== undefined) {
        updateData.is_hidden = Boolean(is_hidden);
      }
      if (hide_price !== undefined) {
        updateData.hide_price = Boolean(hide_price);
      }

      let { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      // Si alguna columna opcional aún no está creada en Supabase, reintentar sin ella
      if (error) {
        delete updateData.is_hidden;
        delete updateData.hide_price;
        delete updateData.real_dimensions;
        const retry = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (retry.error) throw retry.error;
        data = retry.data;
      }

      return NextResponse.json({
        ...data,
        real_dimensions: real_dimensions || data?.real_dimensions,
        hide_price: hide_price !== undefined ? Boolean(hide_price) : Boolean(data?.hide_price),
        is_hidden: is_hidden !== undefined ? Boolean(is_hidden) : Boolean(data?.is_hidden)
      });
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
        image_position: finalImagePosition,
        model_url: model_url !== undefined ? model_url : localProducts[index].model_url,
        raw_model_url: raw_model_url !== undefined ? raw_model_url : localProducts[index].raw_model_url,
        raw_model_name: raw_model_name !== undefined ? raw_model_name : localProducts[index].raw_model_name,
        scales: scales || localProducts[index].scales,
        real_dimensions: real_dimensions !== undefined ? real_dimensions : localProducts[index].real_dimensions,
        hide_price: hide_price !== undefined ? Boolean(hide_price) : localProducts[index].hide_price,
        is_hidden: is_hidden !== undefined ? Boolean(is_hidden) : localProducts[index].is_hidden
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

    setHiddenId(id, false);

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

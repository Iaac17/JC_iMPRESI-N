import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES = [
  'Refrigeración & Línea Blanca',
  'Maquetas - Alumbrado',
  'Maquetas - Mobiliario Urbano',
  'Maquetas - Arquitectura',
  'Maquetas - Transporte',
  'Maquetas - Sets Completos',
  'Hogar & Organización',
  'Herramientas & Repuestos',
  'Coleccionables & Figuras'
];

const CATEGORIES_FILE_PATH = path.join(process.cwd(), 'data', 'categories.json');

function getLocalCategories(): string[] {
  try {
    if (fs.existsSync(CATEGORIES_FILE_PATH)) {
      const raw = fs.readFileSync(CATEGORIES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error al leer categorías locales:', err);
  }
  return [];
}

function saveLocalCategories(categories: string[]) {
  try {
    const dir = path.dirname(CATEGORIES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CATEGORIES_FILE_PATH, JSON.stringify(categories, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al guardar categorías locales:', err);
  }
}

// 1. OBTENER TODAS LAS CATEGORÍAS (GET)
export async function GET() {
  try {
    const categorySet = new Set<string>(DEFAULT_CATEGORIES);

    // Leer categorías guardadas en archivo local de respaldo
    const localSaved = getLocalCategories();
    localSaved.forEach((c) => {
      if (c && c.trim()) categorySet.add(c.trim());
    });

    if (isSupabaseConfigured()) {
      // 1. Intentar consultar la tabla dedicada 'categories'
      try {
        const { data: dbCategories, error: catError } = await supabase
          .from('categories')
          .select('name')
          .order('name');

        if (!catError && Array.isArray(dbCategories)) {
          dbCategories.forEach((item: any) => {
            if (item.name && item.name.trim()) categorySet.add(item.name.trim());
          });
        }
      } catch (err) {
        // Si la tabla categories aún no existe en Supabase, no interrumpir
        console.warn('Tabla categories no disponible aún en Supabase:', err);
      }

      // 2. Extraer también todas las categorías que ya estén asignadas a productos existentes
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('category');

        if (Array.isArray(prodData)) {
          prodData.forEach((p: any) => {
            if (p.category && p.category.trim()) categorySet.add(p.category.trim());
          });
        }
      } catch (err) {
        console.warn('Error al consultar categorías de productos:', err);
      }
    }

    const sortedCategories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ categories: sortedCategories });
  } catch (error: any) {
    console.error('Error al obtener categorías:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. CREAR / AGREGAR UNA NUEVA CATEGORÍA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'El nombre de la categoría es obligatorio.' }, { status: 400 });
    }

    // Guardar en archivo local
    const local = getLocalCategories();
    if (!local.includes(name)) {
      local.push(name);
      saveLocalCategories(local);
    }

    // Si Supabase está disponible, registrar en la tabla 'categories'
    if (isSupabaseConfigured()) {
      try {
        const categoryId = `cat_${Date.now()}`;
        await supabase
          .from('categories')
          .upsert([{ id: categoryId, name }], { onConflict: 'name' });
      } catch (dbErr) {
        console.warn('Aviso al insertar en tabla categories de Supabase:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Categoría "${name}" guardada con éxito.`,
      name
    });
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. RENOMBRAR UNA CATEGORÍA Y ACTUALIZAR SUS PRODUCTOS (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const oldName = (body.oldName || '').trim();
    const newName = (body.newName || '').trim();

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: 'Debes proporcionar tanto el nombre actual como el nuevo nombre de la categoría.' },
        { status: 400 }
      );
    }

    if (oldName.toLowerCase() === newName.toLowerCase()) {
      return NextResponse.json({ success: true, message: 'El nombre es idéntico.', oldName, newName, updatedCount: 0 });
    }

    let updatedCount = 0;

    // 1. Actualizar en Supabase si está disponible
    if (isSupabaseConfigured()) {
      // Actualizar TODOS los productos que tenían la categoría anterior
      const { data: updatedProducts, error: updateProdErr } = await supabase
        .from('products')
        .update({ category: newName })
        .eq('category', oldName)
        .select('id');

      if (updateProdErr) {
        console.error('Error al actualizar productos en Supabase:', updateProdErr);
        throw new Error(`Error al actualizar productos: ${updateProdErr.message}`);
      }

      updatedCount = updatedProducts?.length || 0;

      // Actualizar el nombre en la tabla 'categories' si existe
      try {
        await supabase
          .from('categories')
          .update({ name: newName })
          .eq('name', oldName);
      } catch (catErr) {
        console.warn('Aviso al renombrar en tabla categories de Supabase:', catErr);
      }
    }

    // 2. Actualizar en el archivo local de categorías
    const local = getLocalCategories();
    const updatedLocal = local.map((cat) => (cat === oldName ? newName : cat));
    if (!updatedLocal.includes(newName)) {
      updatedLocal.push(newName);
    }
    saveLocalCategories(updatedLocal);

    return NextResponse.json({
      success: true,
      message: `Categoría "${oldName}" renombrada a "${newName}" con éxito. Se actualizaron ${updatedCount} producto(s).`,
      oldName,
      newName,
      updatedCount
    });
  } catch (error: any) {
    console.error('Error al renombrar categoría:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. ELIMINAR UNA CATEGORÍA (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get('name') || '').trim();
    const reassignTo = (searchParams.get('reassignTo') || 'General').trim();

    if (!name) {
      return NextResponse.json({ error: 'Nombre de categoría requerido para eliminar.' }, { status: 400 });
    }

    let reassignedCount = 0;

    if (isSupabaseConfigured()) {
      // Reasignar los productos a la categoría elegida (por defecto 'General')
      const { data: updatedProds } = await supabase
        .from('products')
        .update({ category: reassignTo })
        .eq('category', name)
        .select('id');

      reassignedCount = updatedProds?.length || 0;

      // Eliminar de la tabla categories
      try {
        await supabase
          .from('categories')
          .delete()
          .eq('name', name);
      } catch (err) {
        console.warn('Aviso al eliminar de tabla categories:', err);
      }
    }

    // Eliminar del archivo local
    const local = getLocalCategories();
    saveLocalCategories(local.filter((c) => c !== name));

    return NextResponse.json({
      success: true,
      message: `Categoría "${name}" eliminada. ${reassignedCount} producto(s) fueron reasignados a "${reassignTo}".`
    });
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

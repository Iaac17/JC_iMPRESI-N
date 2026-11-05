import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se envió ningún archivo de imagen.' },
        { status: 400 }
      );
    }

    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP, etc.).' },
        { status: 400 }
      );
    }

    // Limpiar el nombre del archivo para que sea seguro
    const originalName = file.name || 'foto.jpg';
    const sanitizedBase = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const fileName = `${timestamp}_${sanitizedBase}`;

    // 1. Si Supabase está configurado, guardar en la nube (Supabase Storage)
    if (isSupabaseConfigured()) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Intentar guardar en el bucket 'product-images' o 'images'
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`uploads/${fileName}`, buffer, {
            contentType: file.type,
            upsert: true
          });

        if (!uploadError) {
          const publicUrl = supabase.storage
            .from('product-images')
            .getPublicUrl(`uploads/${fileName}`).data.publicUrl;

          return NextResponse.json({
            success: true,
            imageUrl: publicUrl,
            fileName: originalName
          });
        }
      } catch (storageErr) {
        console.warn('No se pudo subir a Supabase Storage, usando guardado local:', storageErr);
      }
    }

    // 2. Guardado en carpeta local (public/uploads/images)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    await fs.mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, fileName), buffer);

    const localUrl = `/uploads/images/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl: localUrl,
      fileName: originalName
    });
  } catch (error: any) {
    console.error('Error al procesar la imagen:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar la imagen.' },
      { status: 500 }
    );
  }
}


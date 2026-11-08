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
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Si Supabase está configurado, intentar guardar en Supabase Storage (nube)
    if (isSupabaseConfigured()) {
      try {
        // Intentar asegurar que el bucket exista
        try {
          await supabase.storage.createBucket('product-images', { public: true });
        } catch (_) {
          // Si ya existe o no hay permiso de creación, continuamos
        }

        // Probar los buckets estándar de Supabase
        const targetBuckets = ['product-images', 'images', 'models'];
        for (const bucketName of targetBuckets) {
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`uploads/${fileName}`, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true
            });

          if (!uploadError) {
            const publicUrl = supabase.storage
              .from(bucketName)
              .getPublicUrl(`uploads/${fileName}`).data.publicUrl;

            return NextResponse.json({
              success: true,
              imageUrl: publicUrl,
              fileName: originalName
            });
          }
        }
      } catch (storageErr) {
        console.warn('Aviso: Supabase Storage no disponible, guardando como Data URL en base de datos:', storageErr);
      }
    }

    // 2. Solución 100% compatible con Vercel y Base de Datos (sin tocar Git ni disco local):
    // Convertimos la imagen a Data URL Base64 para guardarla directamente en el campo `image_url` de Supabase.
    // Esto evita escribir archivos en el repositorio de Git y garantiza que nunca se pierda en Vercel.
    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
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


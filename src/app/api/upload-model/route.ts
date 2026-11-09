import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFile = formData.get('rawFile') as File | null;
    const glbFile = formData.get('glbFile') as File | null;
    const rawName = (formData.get('rawName') as string) || (rawFile ? rawFile.name : 'modelo_3d.stl');

    if (!rawFile || !glbFile) {
      return NextResponse.json(
        { error: 'Se requiere tanto el archivo original como el modelo convertido (.glb).' },
        { status: 400 }
      );
    }

    // Limpiar el nombre para almacenamiento seguro
    const sanitizedBase = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const rawFileName = `${timestamp}_${sanitizedBase}`;
    const glbFileName = `${timestamp}_${sanitizedBase.replace(/\.[^/.]+$/, '')}.glb`;

    const rawBuffer = Buffer.from(await rawFile.arrayBuffer());
    const glbBuffer = Buffer.from(await glbFile.arrayBuffer());

    // 1. Si Supabase está configurado, guardar en la nube (Supabase Storage) para Vercel
    if (isSupabaseConfigured()) {
      try {
        // Intentar asegurar que el bucket 'models' exista
        try {
          await supabase.storage.createBucket('models', { public: true });
        } catch (_) {}

        const targetBuckets = ['models', 'product-images', 'images'];
        for (const bucket of targetBuckets) {
          const { error: rawUploadError } = await supabase.storage
            .from(bucket)
            .upload(`raw/${rawFileName}`, rawBuffer, {
              contentType: 'application/octet-stream',
              upsert: true
            });

          const { error: glbUploadError } = await supabase.storage
            .from(bucket)
            .upload(`glb/${glbFileName}`, glbBuffer, {
              contentType: 'model/gltf-binary',
              upsert: true
            });

          if (!rawUploadError && !glbUploadError) {
            const rawUrl = supabase.storage.from(bucket).getPublicUrl(`raw/${rawFileName}`).data.publicUrl;
            const glbUrl = supabase.storage.from(bucket).getPublicUrl(`glb/${glbFileName}`).data.publicUrl;

            return NextResponse.json({
              success: true,
              raw_model_url: rawUrl,
              model_url: glbUrl,
              raw_model_name: rawName
            });
          }
        }
      } catch (storageErr) {
        console.warn('Fallo en Supabase Storage, preparando almacenamiento directo como Data URL:', storageErr);
      }
    }

    // 2. Solución 100% compatible con Vercel:
    // Si Supabase Storage no está listo o estamos en entorno serverless (Vercel),
    // convertimos el modelo 3D optimizado (.glb) a Data URI en Base64 para guardarlo directo en la base de datos.
    const glbBase64 = glbBuffer.toString('base64');
    const glbDataUrl = `data:model/gltf-binary;base64,${glbBase64}`;

    return NextResponse.json({
      success: true,
      raw_model_url: undefined,
      model_url: glbDataUrl,
      raw_model_name: rawName
    });
  } catch (error: any) {
    console.error('Error al subir modelo 3D:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar el archivo.' }, { status: 500 });
  }
}

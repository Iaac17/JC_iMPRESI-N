import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

    // 1. Si Supabase está configurado, guardar en la nube (Supabase Storage) para Vercel
    if (isSupabaseConfigured()) {
      try {
        const rawBuffer = Buffer.from(await rawFile.arrayBuffer());
        const glbBuffer = Buffer.from(await glbFile.arrayBuffer());

        const { error: rawUploadError } = await supabase.storage
          .from('models')
          .upload(`raw/${rawFileName}`, rawBuffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });

        const { error: glbUploadError } = await supabase.storage
          .from('models')
          .upload(`glb/${glbFileName}`, glbBuffer, {
            contentType: 'model/gltf-binary',
            upsert: true
          });

        if (!rawUploadError && !glbUploadError) {
          const rawUrl = supabase.storage.from('models').getPublicUrl(`raw/${rawFileName}`).data.publicUrl;
          const glbUrl = supabase.storage.from('models').getPublicUrl(`glb/${glbFileName}`).data.publicUrl;

          return NextResponse.json({
            success: true,
            raw_model_url: rawUrl,
            model_url: glbUrl,
            raw_model_name: rawName
          });
        }
      } catch (storageErr) {
        console.warn('Fallo en Supabase Storage, usando guardado local como respaldo:', storageErr);
      }
    }

    // 2. Fallback local para desarrollo en PC
    const uploadsBase = path.join(process.cwd(), 'public', 'uploads', 'models');
    const rawDir = path.join(uploadsBase, 'raw');
    const glbDir = path.join(uploadsBase, 'glb');

    await fs.mkdir(rawDir, { recursive: true });
    await fs.mkdir(glbDir, { recursive: true });

    const rawBuffer = Buffer.from(await rawFile.arrayBuffer());
    await fs.writeFile(path.join(rawDir, rawFileName), rawBuffer);

    const glbBuffer = Buffer.from(await glbFile.arrayBuffer());
    await fs.writeFile(path.join(glbDir, glbFileName), glbBuffer);

    return NextResponse.json({
      success: true,
      raw_model_url: `/uploads/models/raw/${rawFileName}`,
      model_url: `/uploads/models/glb/${glbFileName}`,
      raw_model_name: rawName
    });
  } catch (error: any) {
    console.error('Error al subir modelo 3D:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar el archivo.' }, { status: 500 });
  }
}

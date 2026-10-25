import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const customName = searchParams.get('name') || 'diseno_3d.stl';

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL de archivo no proporcionada.' }, { status: 400 });
    }

    // 1. Si es una URL externa o de Supabase Storage en la nube
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const externalRes = await fetch(fileUrl);
      if (!externalRes.ok) {
        return NextResponse.json({ error: 'No se pudo obtener el archivo desde el almacenamiento en la nube.' }, { status: 404 });
      }

      const fileBuffer = Buffer.from(await externalRes.arrayBuffer());
      const headers = new Headers();
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(customName)}"`);
      headers.set('Content-Type', 'application/octet-stream');
      headers.set('Content-Length', fileBuffer.length.toString());

      return new NextResponse(fileBuffer, { status: 200, headers });
    }

    // 2. Si es una ruta local en public/
    const normalizedUrl = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    const filePath = path.join(process.cwd(), 'public', normalizedUrl);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'El archivo 3D no fue encontrado en el servidor local.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(customName)}"`);
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error: any) {
    console.error('Error al descargar archivo 3D:', error);
    return NextResponse.json({ error: error.message || 'Error al descargar el archivo.' }, { status: 500 });
  }
}

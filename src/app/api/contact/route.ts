import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos (nombre, email y mensaje) deben estar completos.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && apiKey !== 'placeholder-key') {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Taller3D Contacto <onboarding@resend.dev>',
        to: process.env.CONTACT_EMAIL || 'contacto@taller3d.com',
        subject: `Nuevo mensaje de contacto de ${name}`,
        html: `
          <h2>Nuevo Mensaje de Contacto desde Taller3D</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
          <p><strong>Mensaje:</strong></p>
          <blockquote style="background: #f4f4f4; padding: 10px; border-left: 4px solid #f59e0b;">
            ${message}
          </blockquote>
        `,
      });
      return NextResponse.json({ success: true, message: 'Correo enviado con éxito.' });
    }

    // Modo simulación cuando no hay API Key configurada aún
    console.log('[Resend Mock Mode] Mensaje recibido:', { name, email, phone, message });
    return NextResponse.json({
      success: true,
      message: 'Mensaje recibido con éxito (Modo Simulación: Configura RESEND_API_KEY para envío real).'
    });
  } catch (error: any) {
    console.error('Error al enviar correo:', error);
    return NextResponse.json(
      { error: 'Hubo un problema al enviar el mensaje. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}

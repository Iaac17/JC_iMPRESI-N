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

    const recipientEmail = process.env.CONTACT_EMAIL || 'irvingac89@gmail.com';
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && apiKey !== 'placeholder-key') {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'JC Impresión 3D <onboarding@resend.dev>',
        to: recipientEmail,
        replyTo: email,
        subject: `Nuevo mensaje de cotización de ${name} (JC Impresión 3D)`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px;">
            <h2 style="color: #dc2626; margin-top: 0;">Nuevo Mensaje de Contacto - JC Impresión 3D</h2>
            <p>Has recibido una nueva consulta de un cliente desde tu tienda web:</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />
            <p><strong>👤 Nombre:</strong> ${name}</p>
            <p><strong>✉️ Correo del cliente:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>📱 Teléfono / WhatsApp:</strong> ${phone || 'No proporcionado'}</p>
            <p><strong>💬 Mensaje o requerimiento de maqueta:</strong></p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #dc2626; border-radius: 4px; font-size: 14px; line-height: 1.5;">
              ${message}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">Puedes responder directamente a este correo para contestarle al cliente.</p>
          </div>
        `,
      });
      return NextResponse.json({ success: true, message: '¡Mensaje enviado con éxito! Te responderemos muy pronto.' });
    }

    // Modo registro cuando aún no hay clave de Resend configurada en Vercel
    console.log('[Contacto JC Impresión 3D] Mensaje recibido para irvingac89@gmail.com:', { name, email, phone, message });
    return NextResponse.json({
      success: true,
      message: '¡Mensaje recibido con éxito! Nos pondremos en contacto contigo a la brevedad.'
    });
  } catch (error: any) {
    console.error('Error al enviar correo:', error);
    return NextResponse.json(
      { error: 'Hubo un problema al enviar el mensaje. Por favor intenta de nuevo o escríbenos directamente a WhatsApp.' },
      { status: 500 }
    );
  }
}

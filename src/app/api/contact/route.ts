import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ContactMessage } from '@/types';

// Almacenamiento local temporal en caso de que Supabase esté fuera de línea
let localMessages: ContactMessage[] = [];

// GET: Obtener todos los mensajes de clientes para el panel de administración
export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no ha sido creada en Supabase todavía, retornamos array vacío
        if (error.code === '42P01') {
          return NextResponse.json(localMessages);
        }
        throw error;
      }
      return NextResponse.json(data || []);
    }

    return NextResponse.json(localMessages);
  } catch (error: any) {
    console.error('Error al obtener mensajes de contacto:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Guardar una nueva consulta o cotización enviada por un cliente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Por favor completa tu nombre, correo y mensaje.' },
        { status: 400 }
      );
    }

    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([{
          id: newMessage.id,
          name: newMessage.name,
          email: newMessage.email,
          phone: newMessage.phone,
          message: newMessage.message,
          created_at: newMessage.created_at
        }])
        .select();

      if (error) {
        console.warn('Advertencia al guardar en Supabase, usando respaldo local:', error);
        localMessages.unshift(newMessage);
      } else {
        return NextResponse.json({
          success: true,
          message: '¡Tu mensaje ha sido enviado con éxito! Nos comunicaremos contigo muy pronto.'
        });
      }
    } else {
      localMessages.unshift(newMessage);
    }

    return NextResponse.json({
      success: true,
      message: '¡Tu mensaje ha sido enviado con éxito! Nos comunicaremos contigo muy pronto.'
    });
  } catch (error: any) {
    console.error('Error al guardar mensaje de contacto:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al enviar tu mensaje. Inténtalo nuevamente o contáctanos por WhatsApp.' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un mensaje desde el panel de administración
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de mensaje requerido.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    localMessages = localMessages.filter((m) => m.id !== id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al borrar mensaje:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

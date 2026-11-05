import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, category, scales } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Por favor escribe el nombre del producto para generar la descripción.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clave de API de Gemini no configurada en las variables de entorno.' },
        { status: 500 }
      );
    }

    // Instrucción para la Inteligencia Artificial (persuasiva, enfocada en el producto y completa)
    const promptText = `
Eres el redactor especialista en ventas de "JC_IMPRESIÓN 3D".
Tu misión es redactar una descripción completa, atractiva, vendedora y muy enfocada en las ventajas reales del siguiente producto:

- Nombre del producto: "${name.trim()}"
- Categoría: "${category || 'Modelos en Impresión 3D'}"
${scales ? `- Medidas / Escalas disponibles: "${scales}"` : ''}

PAUTAS DE REDACCIÓN OBLIGATORIAS:
1. Enfoque directo en el producto: explica claramente qué es, su función práctica, su resistencia y por qué es la mejor solución para el comprador.
2. Si es una pieza para refrigerador, hogar o repuesto: destaca que encaja a la perfección, que resiste el uso diario o bajas temperaturas, que ahorra dinero frente a costosos repuestos de fábrica y que se puede pedir a la medida exacta de su equipo.
3. Si es para maquetas o arquitectura: destaca el realismo visual, la precisión de la escala arquitectónica, la facilidad para colocarlo en avenidas, parques o dioramas, y lo profesional que lucirá en sus entregas escolares o proyectos urbanísticos.
4. Tono comercial: persuasivo, amigable, confiable y positivo. NO utilices tecnicismos complicados ni aburridos (evita palabras raras de laboratorio o porcentajes de relleno).
5. Longitud ideal: Entre 65 y 95 palabras bien desarrolladas (aproximadamente 3 a 4 oraciones fluidas).
6. REGLA FUNDAMENTAL: Termina SIEMPRE la última oración de forma completa con punto final (.) Nunca dejes ideas cortadas o frases a medias.
7. Devuelve ÚNICAMENTE el texto final de la descripción en español, sin títulos, sin asteriscos de formato markdown y sin comillas.
`.trim();

    // Intentar con los modelos más recientes y compatibles de Gemini
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
    let generatedText = '';
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500 // Espacio amplio para evitar que se corte la oración
            }
          })
        });

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        if (res.ok && parts.length > 0) {
          // Extraer la parte de texto final (ignorando bloques internos de pensamiento si existieran)
          const textPart = parts.find((p: any) => !p.thought && p.text) || parts[parts.length - 1];
          if (textPart?.text) {
            generatedText = textPart.text.trim();
            // Limpiar comillas iniciales o finales si vinieran
            generatedText = generatedText.replace(/^["']|["']$/g, '').trim();
            // Asegurar que termine en punto final si le faltara
            if (!/[.!?]$/.test(generatedText)) {
              generatedText += '.';
            }
            break;
          }
        } else {
          lastError = data.error?.message || `Error con modelo ${model}`;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!generatedText) {
      // Fallback bien estructurado y completo si hubiera intermitencia en la red
      generatedText = `El modelo de ${name} fabricado en JC_IMPRESIÓN 3D ofrece un acabado impecable y de alta definición, diseñado para garantizar máxima durabilidad y precisión. Su estructura resistente y encaje exacto lo convierten en la solución ideal para tus proyectos o reemplazos diarios. Personaliza tu pedido a la medida y dale a tus piezas el toque profesional y confiable que necesitas.`;
    }

    return NextResponse.json({ description: generatedText });
  } catch (error: any) {
    console.error('Error al generar descripción con IA:', error);
    return NextResponse.json(
      { error: error.message || 'No se pudo generar la descripción.' },
      { status: 500 }
    );
  }
}

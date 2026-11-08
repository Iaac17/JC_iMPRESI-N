import { NextResponse } from 'next/server';

interface HeuristicMatch {
  object_name: string;
  explanation: string;
  x: number;
  y: number;
  z: number;
}

// Banco de datos heurístico de referencia para maquetas de uso común
const HEURISTIC_PATTERNS: { regex: RegExp; match: HeuristicMatch }[] = [
  {
    regex: /farol|poste|luminaria|luz|alumbrado/i,
    match: {
      object_name: 'Farola de alumbrado público estándar',
      explanation: 'Las farolas y postes de luz para avenidas y calles suelen medir entre 5 y 7 metros de alto.',
      x: 60,
      y: 120,
      z: 600
    }
  },
  {
    regex: /banca|banco|asiento|silla de parque/i,
    match: {
      object_name: 'Banca ornamental de parque o plaza',
      explanation: 'Una banca típica de parque para 3 o 4 personas mide 1.80 a 2 metros de largo por 80 cm de alto.',
      x: 180,
      y: 60,
      z: 80
    }
  },
  {
    regex: /iglesia|catedral|templo|fachada/i,
    match: {
      object_name: 'Fachada o templo arquitectónico',
      explanation: 'Las iglesias y edificios institucionales coloniales tienen una altura promedio de 12 a 18 metros.',
      x: 1200,
      y: 2000,
      z: 1500
    }
  },
  {
    regex: /auto|carro|coche|veh[ií]culo|sedan|camioneta/i,
    match: {
      object_name: 'Automóvil sedán o familiar',
      explanation: 'Un coche de tamaño medio mide cerca de 4.5 metros de largo, 1.8 metros de ancho y 1.5 metros de altura.',
      x: 180,
      y: 450,
      z: 150
    }
  },
  {
    regex: /bici|bicicleta|ciclista/i,
    match: {
      object_name: 'Bicicleta urbana',
      explanation: 'Una bicicleta para adulto mide aproximadamente 1.8 metros de largo por 1 metro de alto.',
      x: 50,
      y: 180,
      z: 100
    }
  },
  {
    regex: /persona|figura humana|peat[oó]n|humano/i,
    match: {
      object_name: 'Persona adulta promedio',
      explanation: 'La estatura de referencia estándar en arquitectura para una persona es de 1.70 metros.',
      x: 45,
      y: 25,
      z: 170
    }
  },
  {
    regex: /estante|anaquel|repisa|caj[oó]n/i,
    match: {
      object_name: 'Repuesto de estante o charola',
      explanation: 'Los estantes de refrigerador o mobiliario suelen medir entre 50 y 60 cm de ancho por 35 cm de fondo.',
      x: 55,
      y: 35,
      z: 6
    }
  },
  {
    regex: /refrigerador|nevera|refri/i,
    match: {
      object_name: 'Refrigerador doméstico de 2 puertas',
      explanation: 'Un refrigerador estándar mide aproximadamente 70 cm de frente, 70 cm de fondo y 1.75 a 1.80 metros de altura.',
      x: 70,
      y: 70,
      z: 180
    }
  },
  {
    regex: /[aá]rbol|palmera|arbusto|vegetaci[oó]n/i,
    match: {
      object_name: 'Árbol urbano o de parque',
      explanation: 'Un árbol ornamental mediano para avenidas y parques tiene una copa de 3 a 4 metros y 5 a 6 metros de altura.',
      x: 350,
      y: 350,
      z: 550
    }
  },
  {
    regex: /edificio|casa|departamento|torre/i,
    match: {
      object_name: 'Edificio o casa habitación',
      explanation: 'Una casa o pequeña edificación de dos niveles suele tener entre 6 y 8 metros de altura.',
      x: 800,
      y: 1000,
      z: 700
    }
  }
];

function getHeuristicDimensions(productName: string): HeuristicMatch {
  for (const item of HEURISTIC_PATTERNS) {
    if (item.regex.test(productName)) {
      return item.match;
    }
  }

  // Medida predeterminada neutral (1 metro cúbico aprox)
  return {
    object_name: 'Objeto de escala general',
    explanation: 'Estimación basada en proporciones estándar para modelismo y maquetas.',
    x: 100,
    y: 100,
    z: 100
  };
}

export async function POST(request: Request) {
  try {
    const { productName, category, description } = await request.json();

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      return NextResponse.json(
        { error: 'Por favor proporciona el nombre del producto para estimar sus medidas reales.' },
        { status: 400 }
      );
    }

    const fallback = getHeuristicDimensions(productName);
    const apiKey = process.env.GEMINI_API_KEY || '';

    // Si no hay API key configurada, responder directamente con la heurística inteligente
    if (!apiKey) {
      return NextResponse.json({
        object_name: fallback.object_name,
        explanation: fallback.explanation + ' (Estimado con base de datos de referencias de maquetas)',
        x: fallback.x,
        y: fallback.y,
        z: fallback.z
      });
    }

    const promptText = `
Eres un experto en maquetas de arquitectura, modelismo a escala e ingeniería 3D.
El usuario tiene un producto para maquetas o impresión 3D llamado: "${productName.trim()}".
Categoría: "${category || 'Maquetas'}".
${description ? `Descripción: "${description}"` : ''}

Tu tarea:
1. Identifica qué objeto de la vida real representa o a cuál se asemeja más (por ejemplo: si es una farola, a qué tipo de poste de luz; si es una banca, a una banca de parque; si es un repuesto, a una pieza real).
2. Determina las dimensiones REALES típicas que tiene ese objeto en la vida real en CENTÍMETROS (cm):
   - X: Ancho o frente real en centímetros
   - Y: Profundidad, largo o fondo real en centímetros
   - Z: Altura real en centímetros
3. Explica brevemente en una sola oración amigable y clara por qué elegiste esas medidas.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA (sin comillas invertidas, sin markdown y sin texto previo o posterior):
{
  "object_name": "Nombre amigable del objeto real",
  "explanation": "Explicación breve de 1 oración sencilla",
  "x": 60,
  "y": 120,
  "z": 600
}
`.trim();

    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
    let aiResult: HeuristicMatch | null = null;

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
              temperature: 0.2, // Baja temperatura para respuestas lógicas y numéricas consistentes
              maxOutputTokens: 600
            }
          })
        });

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        if (res.ok && parts.length > 0) {
          const textPart = parts.find((p: any) => !p.thought && p.text) || parts[parts.length - 1];
          if (textPart?.text) {
            let rawText = textPart.text.trim();
            // Limpiar posibles bloques markdown ```json ... ```
            rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

            const parsed = JSON.parse(rawText);
            const x = Math.round(Number(parsed.x)) || fallback.x;
            const y = Math.round(Number(parsed.y)) || fallback.y;
            const z = Math.round(Number(parsed.z)) || fallback.z;

            aiResult = {
              object_name: parsed.object_name || fallback.object_name,
              explanation: parsed.explanation || fallback.explanation,
              x: Math.max(1, x),
              y: Math.max(1, y),
              z: Math.max(1, z)
            };
            break;
          }
        }
      } catch (err) {
        // Continuar intentando con el siguiente modelo
      }
    }

    const finalResult = aiResult || fallback;

    return NextResponse.json({
      object_name: finalResult.object_name,
      explanation: finalResult.explanation,
      x: finalResult.x,
      y: finalResult.y,
      z: finalResult.z
    });
  } catch (error: any) {
    console.error('Error al estimar dimensiones con IA:', error);
    return NextResponse.json(
      { error: error.message || 'Error al calcular dimensiones' },
      { status: 500 }
    );
  }
}


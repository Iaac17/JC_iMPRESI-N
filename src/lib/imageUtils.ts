// Utilidades para manejar la posición y escala (zoom) de las imágenes de los productos

export interface ImageTransform {
  position: string; // ej. "50% 50%" o "center"
  x: number;        // Porcentaje horizontal (0 a 100)
  y: number;        // Porcentaje vertical (0 a 100)
  scale: number;    // Escala/zoom (ej. 1.0 = 100%, 1.5 = 150%)
}

/**
 * Parsea el string guardado en la base de datos (image_position)
 * Admite formatos clásicos ("center", "top", "50% 50%")
 * y el nuevo formato enriquecido: "X% Y%|escala" (ej: "45% 20%|1.3")
 */
export function parseImageTransform(imagePosition?: string): ImageTransform {
  if (!imagePosition) {
    return { position: '50% 50%', x: 50, y: 50, scale: 1 };
  }

  // Remover marca interna de control (#hidden) para no afectar CSS ni el encuadre
  const cleanPosition = imagePosition.replace('#hidden', '').trim();
  if (!cleanPosition || cleanPosition === 'center') {
    return { position: '50% 50%', x: 50, y: 50, scale: 1 };
  }

  // Si incluye escala separada por "|"
  if (cleanPosition.includes('|')) {
    const [posPart, scalePart] = cleanPosition.split('|');
    const scale = parseFloat(scalePart) || 1;
    const { x, y, position } = parsePositionOnly(posPart);
    return { position, x, y, scale };
  }

  // Formato tradicional sin escala
  const { x, y, position } = parsePositionOnly(cleanPosition);
  return { position, x, y, scale: 1 };
}

/**
 * Parsea únicamente la coordenada de posición (ej: "50% 50%", "top", "left")
 */
function parsePositionOnly(pos: string): { x: number; y: number; position: string } {
  const p = pos.trim().toLowerCase();

  // Valores predefinidos comunes de CSS
  if (p === 'center') return { x: 50, y: 50, position: '50% 50%' };
  if (p === 'top') return { x: 50, y: 0, position: '50% 0%' };
  if (p === 'bottom') return { x: 50, y: 100, position: '50% 100%' };
  if (p === 'left') return { x: 0, y: 50, position: '0% 50%' };
  if (p === 'right') return { x: 100, y: 50, position: '100% 50%' };
  if (p === 'top left' || p === 'left top') return { x: 0, y: 0, position: '0% 0%' };
  if (p === 'top right' || p === 'right top') return { x: 100, y: 0, position: '100% 0%' };
  if (p === 'bottom left' || p === 'left bottom') return { x: 0, y: 100, position: '0% 100%' };
  if (p === 'bottom right' || p === 'right bottom') return { x: 100, y: 100, position: '100% 100%' };

  // Formatos con porcentajes: "X% Y%"
  const match = p.match(/(\d+(?:\.\d+)?)\s*%\s+(\d+(?:\.\d+)?)\s*%/);
  if (match) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    return { x, y, position: `${x}% ${y}%` };
  }

  return { x: 50, y: 50, position: p || '50% 50%' };
}

/**
 * Convierte valores numéricos X, Y y Escala en la cadena para guardar en base de datos
 */
export function formatImageTransform(x: number, y: number, scale: number = 1): string {
  const clampedX = Math.round(Math.max(0, Math.min(100, x)));
  const clampedY = Math.round(Math.max(0, Math.min(100, y)));
  const clampedScale = Math.max(0.5, Math.min(3, parseFloat(scale.toFixed(2))));

  return `${clampedX}% ${clampedY}%|${clampedScale}`;
}


/**
 * Utilidades para cálculo de tamaños en maquetas y precios según escala.
 * 
 * Fórmula Mágica:
 * Tamaño real (en cm) ÷ Número de escala = Tamaño en la maqueta (en cm)
 * Milímetros = Centímetros × 10
 */

export interface ModelSizeResult {
  cm: number;
  mm: number;
  formatted: string;
}

export interface ModelDimensionsResult {
  x: ModelSizeResult;
  y: ModelSizeResult;
  z: ModelSizeResult;
  scaleRatio: number;
  scaleName: string;
}

/**
 * Escalas estándar más utilizadas en arquitectura, dioramas, ferromodelismo e impresión 3D.
 */
export const POPULAR_SCALES = [
  { ratio: 25, label: 'Escala 1:25', desc: 'Interiores y gran detalle' },
  { ratio: 35, label: 'Escala 1:35', desc: 'Dioramas militares y figuras' },
  { ratio: 50, label: 'Escala 1:50', desc: 'Arquitectura detallada' },
  { ratio: 64, label: 'Escala 1:64', desc: 'Autos coleccionables' },
  { ratio: 75, label: 'Escala 1:75', desc: 'Arquitectura y paisajismo' },
  { ratio: 87, label: 'Escala 1:87', desc: 'Ferromodelismo HO' },
  { ratio: 100, label: 'Escala 1:100', desc: 'Estándar de arquitectura' },
  { ratio: 120, label: 'Escala 1:120', desc: 'Modelismo TT' },
  { ratio: 150, label: 'Escala 1:150', desc: 'Urbanismo compacto' },
  { ratio: 160, label: 'Escala 1:160', desc: 'Ferromodelismo N' },
  { ratio: 200, label: 'Escala 1:200', desc: 'Planes maestros y conjuntos' },
  { ratio: 500, label: 'Escala 1:500', desc: 'Topografía y urbanismo general' }
];

/**
 * Extrae el número divisor de la escala (ej. 'Escala 1:50' -> 50, '1/100' -> 100, '87' -> 87)
 */
export function extractScaleRatio(scaleStr: string): number | null {
  if (!scaleStr || typeof scaleStr !== 'string') return null;

  // Busca patrones como 1:50, 1/50, 1 : 50, etc.
  const matchRatio = scaleStr.match(/1\s*[:/]\s*(\d+)/);
  if (matchRatio && matchRatio[1]) {
    const val = parseInt(matchRatio[1], 10);
    return val > 0 ? val : null;
  }

  // Si solo viene el número (ej. "50")
  const matchNumber = scaleStr.match(/\b(\d+)\b/);
  if (matchNumber && matchNumber[1]) {
    const val = parseInt(matchNumber[1], 10);
    return val > 0 ? val : null;
  }

  return null;
}

/**
 * Formatea una medida en cm y mm de manera amigable
 */
export function formatMeasurement(cm: number): string {
  if (isNaN(cm) || cm <= 0) return '0 cm';
  const mm = cm * 10;
  if (cm >= 1) {
    const cmStr = cm % 1 === 0 ? cm.toFixed(0) : cm.toFixed(1);
    const mmStr = mm % 1 === 0 ? mm.toFixed(0) : mm.toFixed(1);
    return `${cmStr} cm (${mmStr} mm)`;
  }
  const mmStr = mm % 1 === 0 ? mm.toFixed(0) : mm.toFixed(1);
  return `${mmStr} mm`;
}

/**
 * Calcula el tamaño en la maqueta para una dimensión real en centímetros
 */
export function calculateModelSize(realCm: number, scaleRatio: number): ModelSizeResult {
  if (isNaN(realCm) || realCm <= 0 || !scaleRatio || scaleRatio <= 0) {
    return { cm: 0, mm: 0, formatted: '0 cm' };
  }

  // La fórmula mágica: Tamaño real ÷ Número de escala
  const cm = parseFloat((realCm / scaleRatio).toFixed(2));
  const mm = parseFloat((cm * 10).toFixed(1));

  return {
    cm,
    mm,
    formatted: formatMeasurement(cm)
  };
}

/**
 * Calcula todas las dimensiones (X, Y, Z) en maqueta para una escala determinada
 */
export function calculateModelDimensions(
  real: { x: number; y: number; z: number },
  scaleRatio: number,
  scaleName: string = `Escala 1:${scaleRatio}`
): ModelDimensionsResult {
  return {
    x: calculateModelSize(real.x, scaleRatio),
    y: calculateModelSize(real.y, scaleRatio),
    z: calculateModelSize(real.z, scaleRatio),
    scaleRatio,
    scaleName
  };
}

/**
 * Calcula un precio estimado justo para cualquier escala arbitraria,
 * tomando como punto de referencia la escala 1:100 (precio base).
 *
 * Escalas más grandes (1:50) usan más material y tiempo de impresión (+60%).
 * Escalas más pequeñas (1:200) usan menos material (-30%).
 */
export function calculatePriceForScale(basePrice: number, scaleRatio: number): number {
  if (!basePrice || basePrice <= 0 || !scaleRatio || scaleRatio <= 0) return 0;

  // Curva de escala de impresión 3D: Factor = (100 / escala)^0.7
  // Ejemplo:
  // 1:50  -> (100/50)^0.7 = 2^0.7 ≈ 1.62 (+62%)
  // 1:75  -> (100/75)^0.7 ≈ 1.22 (+22%)
  // 1:100 -> (100/100)^0.7 = 1.0 (Base)
  // 1:200 -> (100/200)^0.7 ≈ 0.62 (-38%)
  const factor = Math.pow(100 / scaleRatio, 0.7);

  // Limitar los factores extremos para mantener precios realistas en taller
  const boundedFactor = Math.min(4.5, Math.max(0.35, factor));
  const calculated = Math.round(basePrice * boundedFactor);

  return Math.max(10, calculated); // Precio mínimo de 10 MXN por pieza
}


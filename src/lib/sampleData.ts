import { Product, Review, InstagramPost } from '@/types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-maqueta-1',
    name: 'Farolas de Alumbrado Público (Maquetas)',
    description: 'Postes de luz y luminarias detalladas en 3D para maquetas arquitectónicas y proyectos de urbanismo. Precios diferenciados según escala.',
    price: 28.00,
    image_url: '/images/maquetas/maqueta_farolas.jpg',
    image_position: 'center',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    category: 'Maquetas - Alumbrado',
    scales: ['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200'],
    real_dimensions: {
      x: 60,
      y: 120,
      z: 600,
      object_name: 'Farola de alumbrado público estándar',
      explanation: 'Una farola típica para avenidas y calles públicas mide aprox. 6 metros de altura.'
    },
    scale_prices: [
      { scale: 'Escala 1:50', price: 45.00 },
      { scale: 'Escala 1:75', price: 35.00 },
      { scale: 'Escala 1:100', price: 28.00 },
      { scale: 'Escala 1:200', price: 20.00 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-maqueta-2',
    name: 'Bancas de Parque a Escala (Blancas y Negras)',
    description: 'Bancas ornamentales y mobiliario urbano impreso en 3D. Precios diferenciados por escala de maqueta.',
    price: 22.00,
    image_url: '/images/maquetas/maqueta_bancas.jpg',
    image_position: 'center',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb',
    category: 'Maquetas - Mobiliario Urbano',
    scales: ['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200'],
    real_dimensions: {
      x: 180,
      y: 60,
      z: 80,
      object_name: 'Banca ornamental de parque',
      explanation: 'Banca para parque de 1.8 metros de largo por 80 cm de altura.'
    },
    scale_prices: [
      { scale: 'Escala 1:50', price: 35.00 },
      { scale: 'Escala 1:75', price: 28.00 },
      { scale: 'Escala 1:100', price: 22.00 },
      { scale: 'Escala 1:200', price: 15.00 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-maqueta-3',
    name: 'Fachada de Iglesia & Edificaciones a Escala',
    description: 'Estructuras arquitectónicas de iglesias y fachadas a escala para estudiantes de arquitectura y proyectos urbanos.',
    price: 130.00,
    image_url: '/images/maquetas/maqueta_iglesia.jpg',
    image_position: 'center',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Astronaut/glTF-Binary/Astronaut.glb',
    category: 'Maquetas - Arquitectura',
    scales: ['Escala 1:50', 'Escala 1:100', 'Escala 1:200', 'Escala Personalizada'],
    real_dimensions: {
      x: 1200,
      y: 2000,
      z: 1500,
      object_name: 'Fachada y templo colonial',
      explanation: 'Templo o iglesia colonial con 15 metros de altura en torre.'
    },
    scale_prices: [
      { scale: 'Escala 1:50', price: 180.00 },
      { scale: 'Escala 1:100', price: 130.00 },
      { scale: 'Escala 1:200', price: 90.00 },
      { scale: 'Escala Personalizada', price: 220.00 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-maqueta-4',
    name: 'Set de Vehículos & Bicicletas para Maqueta',
    description: 'Autos de diversos modelos y bicicletas de colores en escala micro para estacionamientos, ciclovías y vías públicas en maquetas.',
    price: 40.00,
    image_url: '/images/maquetas/maqueta_bicicletas_autos.jpg',
    image_position: 'center',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb',
    category: 'Maquetas - Transporte',
    scales: ['Escala 1:50', 'Escala 1:75', 'Escala 1:100', 'Escala 1:200'],
    scale_prices: [
      { scale: 'Escala 1:50', price: 65.00 },
      { scale: 'Escala 1:75', price: 50.00 },
      { scale: 'Escala 1:100', price: 40.00 },
      { scale: 'Escala 1:200', price: 30.00 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-maqueta-5',
    name: 'Set Completo Plaza & Entorno Urbano',
    description: 'Kit integral para maquetas: incluye farolas, bancas, vegetación, vehículos, figuras humanas a escala y módulos de parque.',
    price: 280.00,
    image_url: '/images/maquetas/maqueta_plaza_general.jpg',
    image_position: 'center',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Astronaut/glTF-Binary/Astronaut.glb',
    category: 'Maquetas - Sets Completos',
    scales: ['Escala 1:50', 'Escala 1:100', 'Escala 1:200', 'Escala Personalizada'],
    scale_prices: [
      { scale: 'Escala 1:50', price: 380.00 },
      { scale: 'Escala 1:100', price: 280.00 },
      { scale: 'Escala 1:200', price: 190.00 },
      { scale: 'Escala Personalizada', price: 450.00 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-refri-1',
    name: 'Organizador y Soporte para Refrigerador',
    description: 'Soporte organizador modular para botellas, latas o bandejas de refrigerador. Fabricado en material resistente a bajas temperaturas.',
    price: 35.00,
    image_url: '/images/product_lamp.jpg',
    image_position: '50% 50%|1.0',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb',
    category: 'Refrigeración & Línea Blanca',
    scales: ['Medida Estándar', 'Medida Grande', 'A Medida'],
    scale_prices: [
      { scale: 'Medida Estándar', price: 35.00 },
      { scale: 'Medida Grande', price: 48.00 },
      { scale: 'A Medida', price: 60.00 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-refri-2',
    name: 'Manija Reforzada para Puerta de Refri',
    description: 'Tirador y manija de repuesto de alta resistencia para puertas de refrigeradores y congeladores. Personalizable con medidas exactas.',
    price: 25.00,
    image_url: '/images/product_chair.jpg',
    image_position: '50% 50%|1.0',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    category: 'Refrigeración & Línea Blanca',
    scales: ['Universal 15cm', 'Universal 22cm', 'A Medida'],
    scale_prices: [
      { scale: 'Universal 15cm', price: 25.00 },
      { scale: 'Universal 22cm', price: 32.00 },
      { scale: 'A Medida', price: 40.00 }
    ],
    created_at: new Date().toISOString()
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author_name: 'Arq. Mateo Morales',
    comment: 'Compré el set de farolas y bancas a escala 1:100 para mi entrega final de arquitectura. ¡La precisión de las piezas es insuperable! Pedidos facilísimos al 967 371 8208.',
    rating: 5,
    approved: true,
    created_at: '2026-09-10T14:30:00Z'
  },
  {
    id: 'rev-2',
    author_name: 'Sofía Domínguez',
    comment: 'Me hicieron la fachada de la iglesia a escala 1:50 personalizada. Todo impecable y entregado a tiempo. Recomendadísimos en JC_iMPRESIÓN 3D.',
    rating: 5,
    approved: true,
    created_at: '2026-09-12T10:15:00Z'
  },
  {
    id: 'rev-3',
    author_name: 'Ing. Rodrigo Castillo',
    comment: 'Las bicicletas y autos a escala 1:200 le dieron un realismo impresionante a mi maqueta vial. La atención por WhatsApp al 9673718208 es excelente.',
    rating: 5,
    approved: true,
    created_at: '2026-09-15T18:00:00Z'
  }
];

export const INSTAGRAM_POSTS: InstagramPost[] = [];

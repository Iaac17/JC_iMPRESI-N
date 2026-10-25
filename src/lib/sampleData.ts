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

export interface ScalePrice {
  scale: string; // ej. 'Escala 1:50'
  price: number; // ej. 45.00
}

export interface ProductDimensions {
  x: number; // Ancho / Frente real en centímetros (cm)
  y: number; // Profundidad / Largo real en centímetros (cm)
  z: number; // Altura real en centímetros (cm)
  object_name?: string; // Nombre o descripción del objeto real al que se asemeja
  explanation?: string; // Breve explicación de la estimación de la IA
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  scale_prices?: ScalePrice[]; // Escalas con su precio individual
  image_url: string;
  image_position?: string;
  model_url?: string; // Modelo 3D optimizado para visor web (.glb)
  raw_model_url?: string; // Archivo original de diseño/impresión (.stl / .obj)
  raw_model_name?: string; // Nombre original del archivo (ej. pieza.stl)
  category?: string;
  scales?: string[];
  real_dimensions?: ProductDimensions; // Dimensiones reales en cm para calcular maquetas
  hide_price?: boolean; // Si es true, oculta el precio al público (muestra 'Precio a cotizar')
  is_hidden?: boolean; // Indica si el producto está oculto del catálogo público
  created_at?: string;
}

export interface Review {
  id: string;
  author_name: string;
  comment: string;
  rating: number; // 1 - 5
  approved: boolean;
  created_at: string;
}

export interface InstagramPost {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  postUrl: string;
  date: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
}


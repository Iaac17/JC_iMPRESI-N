export interface ScalePrice {
  scale: string; // ej. 'Escala 1:50'
  price: number; // ej. 45.00
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


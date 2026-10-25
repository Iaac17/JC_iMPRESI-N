-- ========================================================
-- SCRIPT DE INICIALIZACIÓN PARA SUPABASE
-- JC_IMPRESIÓN 3D: Catálogo, Modelos 3D y Reseñas
-- ========================================================

-- 1. CREACIÓN DE LA TABLA DE PRODUCTOS (MAQUETAS Y 3D)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  scale_prices JSONB,
  image_url TEXT,
  image_position TEXT DEFAULT 'center',
  model_url TEXT,
  raw_model_url TEXT,
  raw_model_name TEXT,
  category TEXT DEFAULT 'Maquetas',
  scales JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREACIÓN DE LA TABLA DE RESEÑAS
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating INTEGER NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para PRODUCTOS
CREATE POLICY "Lectura publica de productos"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Insertar productos"
  ON public.products FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualizar productos"
  ON public.products FOR UPDATE USING (true);

CREATE POLICY "Eliminar productos"
  ON public.products FOR DELETE USING (true);

-- Políticas de acceso para RESEÑAS
CREATE POLICY "Lectura publica de reseñas aprobadas"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Publicar nueva reseña"
  ON public.reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Moderar o aprobar reseña"
  ON public.reviews FOR UPDATE USING (true);

CREATE POLICY "Eliminar reseña"
  ON public.reviews FOR DELETE USING (true);

-- 4. INSERTAR PRODUCTOS INICIALES DE MAQUETA EN EL CATÁLOGO
INSERT INTO public.products (id, name, description, price, category, image_url, image_position, model_url, scales, scale_prices)
VALUES
(
  'prod-maqueta-1',
  'Farolas de Alumbrado Público (Maquetas)',
  'Postes de luz y luminarias detalladas en 3D para maquetas arquitectónicas y proyectos de urbanismo. Precios diferenciados según escala.',
  28.00,
  'Maquetas - Alumbrado',
  '/images/maquetas/maqueta_farolas.jpg',
  'center',
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
  '["Escala 1:50", "Escala 1:75", "Escala 1:100", "Escala 1:200"]'::jsonb,
  '[{"scale": "Escala 1:50", "price": 45.00}, {"scale": "Escala 1:75", "price": 35.00}, {"scale": "Escala 1:100", "price": 28.00}, {"scale": "Escala 1:200", "price": 20.00}]'::jsonb
),
(
  'prod-maqueta-2',
  'Bancas de Parque a Escala (Blancas y Negras)',
  'Bancas ornamentales y mobiliario urbano impreso en 3D. Precios diferenciados por escala de maqueta.',
  22.00,
  'Maquetas - Mobiliario Urbano',
  '/images/maquetas/maqueta_bancas.jpg',
  'center',
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb',
  '["Escala 1:50", "Escala 1:75", "Escala 1:100", "Escala 1:200"]'::jsonb,
  '[{"scale": "Escala 1:50", "price": 35.00}, {"scale": "Escala 1:75", "price": 28.00}, {"scale": "Escala 1:100", "price": 22.00}, {"scale": "Escala 1:200", "price": 15.00}]'::jsonb
),
(
  'prod-maqueta-3',
  'Fachada de Iglesia & Edificaciones a Escala',
  'Estructuras arquitectónicas de iglesias y fachadas a escala para estudiantes de arquitectura y proyectos urbanos.',
  130.00,
  'Maquetas - Arquitectura',
  '/images/maquetas/maqueta_iglesia.jpg',
  'center',
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Astronaut/glTF-Binary/Astronaut.glb',
  '["Escala 1:50", "Escala 1:100", "Escala 1:200", "Escala Personalizada"]'::jsonb,
  '[{"scale": "Escala 1:50", "price": 180.00}, {"scale": "Escala 1:100", "price": 130.00}, {"scale": "Escala 1:200", "price": 90.00}, {"scale": "Escala Personalizada", "price": 220.00}]'::jsonb
),
(
  'prod-maqueta-4',
  'Set de Vehículos & Bicicletas para Maqueta',
  'Autos, bicicletas y elementos de transporte a escala para ambientación de calles en maquetas de arquitectura y diseño.',
  38.00,
  'Maquetas - Transporte',
  '/images/maquetas/maqueta_bicicletas.jpg',
  'center',
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
  '["Escala 1:50", "Escala 1:100", "Escala 1:200"]'::jsonb,
  '[{"scale": "Escala 1:50", "price": 55.00}, {"scale": "Escala 1:100", "price": 38.00}, {"scale": "Escala 1:200", "price": 25.00}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 5. CREACIÓN DEL BUCKET DE ALMACENAMIENTO PARA ARCHIVOS 3D
INSERT INTO storage.buckets (id, name, public)
VALUES ('models', 'models', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para permitir ver y subir modelos al bucket
CREATE POLICY "Lectura publica de archivos 3D"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'models');

CREATE POLICY "Subida de archivos 3D"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'models');

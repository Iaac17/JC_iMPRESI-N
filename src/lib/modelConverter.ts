import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export interface ConversionResult {
  glbBlob: Blob;
  originalFile: File;
  originalName: string;
  format: 'stl' | 'obj' | 'glb';
}

/**
 * Convierte un archivo 3D (.stl, .obj o .glb) a formato .glb binario listo para model-viewer.
 * Mantiene intacto el archivo original (.stl / .obj) para que el administrador pueda descargarlo.
 */
export async function convertModelToGlb(file: File): Promise<ConversionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. Si el archivo ya es .glb, no necesita conversión
  if (extension === 'glb') {
    return {
      glbBlob: file,
      originalFile: file,
      originalName: file.name,
      format: 'glb'
    };
  }

  // 2. Si el archivo es .stl (formato común de impresión 3D)
  if (extension === 'stl') {
    const arrayBuffer = await file.arrayBuffer();
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);

    // Centrar la figura y calcular las luces/sombras (normales)
    geometry.computeVertexNormals();
    geometry.center();

    // Crear un material elegante y neutro tipo maqueta (gris claro satinado)
    const material = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.35,
      metalness: 0.15
    });

    const mesh = new THREE.Mesh(geometry, material);
    const scene = new THREE.Scene();
    scene.add(mesh);

    // Exportar a .glb binario
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => resolve(result as ArrayBuffer),
        (error) => reject(error),
        { binary: true }
      );
    });

    const glbBlob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
    return {
      glbBlob,
      originalFile: file,
      originalName: file.name,
      format: 'stl'
    };
  }

  // 3. Si el archivo es .obj (formato de diseño 3D con mallas)
  if (extension === 'obj') {
    const text = await file.text();
    const loader = new OBJLoader();
    const obj = loader.parse(text);

    // Centrar y asegurar que todos los objetos hijos tengan un material visible
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);

    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.35,
      metalness: 0.15
    });

    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (!m.material) {
          m.material = defaultMaterial;
        }
        if (m.geometry) {
          m.geometry.computeVertexNormals();
        }
      }
    });

    // Exportar a .glb binario
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        obj,
        (result) => resolve(result as ArrayBuffer),
        (error) => reject(error),
        { binary: true }
      );
    });

    const glbBlob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
    return {
      glbBlob,
      originalFile: file,
      originalName: file.name,
      format: 'obj'
    };
  }

  throw new Error(`Extensión no soportada: .${extension}. Por favor sube un archivo .stl, .obj o .glb`);
}

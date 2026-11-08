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

export type ProceduralModelType = 'human' | 'lamp' | 'bench' | 'building' | 'box';

export interface ProceduralPreset {
  id: ProceduralModelType | 'astronaut' | 'chair' | 'modern_chair';
  name: string;
  category: string;
  description: string;
  iconName: string;
  directUrl?: string;
}

export const PRESET_3D_MODELS: ProceduralPreset[] = [
  {
    id: 'human',
    name: 'Figura Humana a Escala (Persona)',
    category: 'Escala & Dioramas',
    description: 'Silueta estilizada de persona adulta (1.70 m) para dar escala a maquetas.',
    iconName: 'User'
  },
  {
    id: 'lamp',
    name: 'Farola de Alumbrado Público',
    category: 'Urbanismo',
    description: 'Poste de luz con brazo curvo y luminaria para avenidas y calles.',
    iconName: 'Lightbulb'
  },
  {
    id: 'bench',
    name: 'Banca de Parque',
    category: 'Mobiliario Urbano',
    description: 'Banca con tablones y soportes laterales para plazas y parques.',
    iconName: 'Armchair'
  },
  {
    id: 'building',
    name: 'Fachada / Edificación',
    category: 'Arquitectura',
    description: 'Módulo de fachada arquitectónica con accesos y tejado.',
    iconName: 'Building'
  },
  {
    id: 'box',
    name: 'Cubo / Pieza Paramétrica (X, Y, Z)',
    category: 'Medidas',
    description: 'Bloque con las medidas exactas de ancho, largo y alto configuradas.',
    iconName: 'Box'
  },
  {
    id: 'astronaut',
    name: 'Persona / Traje 3D Completo',
    category: 'Detalle Alto',
    description: 'Modelo 3D detallado de figura humana completa para visor web.',
    iconName: 'UserCheck',
    directUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Astronaut/glTF-Binary/Astronaut.glb'
  },
  {
    id: 'chair',
    name: 'Silla / Asiento de Detalle',
    category: 'Mobiliario',
    description: 'Silla 3D texturizada de alta definición.',
    iconName: 'Armchair',
    directUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Chair/glTF-Binary/Chair.glb'
  }
];

/**
 * Crea un diseño 3D procedural directamente en el navegador sin necesitar programas externos.
 * Genera un archivo .glb que se puede ver inmediatamente en model-viewer y guardar en la base de datos.
 */
export async function createProcedural3DModel(
  type: ProceduralModelType,
  dimensions?: { x?: number; y?: number; z?: number }
): Promise<ConversionResult> {
  const scene = new THREE.Scene();

  const standardMaterial = new THREE.MeshStandardMaterial({
    color: 0xdcdcdc,
    roughness: 0.35,
    metalness: 0.15
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xE50920,
    roughness: 0.25,
    metalness: 0.2
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x333338,
    roughness: 0.5,
    metalness: 0.4
  });

  let modelName = 'diseño_3d.glb';

  if (type === 'human') {
    modelName = 'figura_humana_escala.glb';
    // 1. Base / pedestal
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.04, 32);
    const baseMesh = new THREE.Mesh(baseGeo, darkMaterial);
    baseMesh.position.y = 0.02;
    scene.add(baseMesh);

    // 2. Piernas
    const legGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.75, 16);
    const leftLeg = new THREE.Mesh(legGeo, standardMaterial);
    leftLeg.position.set(-0.08, 0.41, 0);
    const rightLeg = new THREE.Mesh(legGeo, standardMaterial);
    rightLeg.position.set(0.08, 0.41, 0);
    scene.add(leftLeg, rightLeg);

    // 3. Torso / Pecho
    const torsoGeo = new THREE.BoxGeometry(0.26, 0.55, 0.14);
    const torso = new THREE.Mesh(torsoGeo, accentMaterial);
    torso.position.y = 1.05;
    scene.add(torso);

    // 4. Brazos
    const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.5, 16);
    const leftArm = new THREE.Mesh(armGeo, standardMaterial);
    leftArm.position.set(-0.18, 1.05, 0);
    const rightArm = new THREE.Mesh(armGeo, standardMaterial);
    rightArm.position.set(0.18, 1.05, 0);
    scene.add(leftArm, rightArm);

    // 5. Cabeza
    const headGeo = new THREE.SphereGeometry(0.09, 32, 24);
    const head = new THREE.Mesh(headGeo, standardMaterial);
    head.position.y = 1.45;
    scene.add(head);

  } else if (type === 'lamp') {
    modelName = 'farola_alumbrado_3d.glb';
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.15, 0.22, 0.1, 24);
    const base = new THREE.Mesh(baseGeo, darkMaterial);
    base.position.y = 0.05;
    scene.add(base);

    // Poste vertical
    const poleGeo = new THREE.CylinderGeometry(0.03, 0.045, 2.2, 20);
    const pole = new THREE.Mesh(poleGeo, darkMaterial);
    pole.position.y = 1.15;
    scene.add(pole);

    // Brazo horizontal
    const armGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 16);
    const arm = new THREE.Mesh(armGeo, darkMaterial);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.25, 2.22, 0);
    scene.add(arm);

    // Luminaria / lámpara
    const lampGeo = new THREE.BoxGeometry(0.3, 0.06, 0.14);
    const lamp = new THREE.Mesh(lampGeo, accentMaterial);
    lamp.position.set(0.5, 2.2, 0);
    scene.add(lamp);

  } else if (type === 'bench') {
    modelName = 'banca_parque_3d.glb';
    // Patas laterales
    const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.4);
    const leg1 = new THREE.Mesh(legGeo, darkMaterial);
    leg1.position.set(-0.6, 0.225, 0);
    const leg2 = new THREE.Mesh(legGeo, darkMaterial);
    leg2.position.set(0.6, 0.225, 0);
    scene.add(leg1, leg2);

    // Tablones de asiento
    for (let i = 0; i < 4; i++) {
      const slatGeo = new THREE.BoxGeometry(1.4, 0.03, 0.07);
      const slat = new THREE.Mesh(slatGeo, standardMaterial);
      slat.position.set(0, 0.45, -0.15 + i * 0.1);
      scene.add(slat);
    }

    // Tablones de respaldo
    for (let j = 0; j < 3; j++) {
      const backSlatGeo = new THREE.BoxGeometry(1.4, 0.07, 0.03);
      const backSlat = new THREE.Mesh(backSlatGeo, standardMaterial);
      backSlat.position.set(0, 0.58 + j * 0.1, -0.18);
      scene.add(backSlat);
    }

  } else if (type === 'building') {
    modelName = 'fachada_edificacion_3d.glb';
    // Cuerpo principal
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 0.8);
    const body = new THREE.Mesh(bodyGeo, standardMaterial);
    body.position.y = 0.7;
    scene.add(body);

    // Tejado a 2 aguas
    const roofGeo = new THREE.ConeGeometry(1.0, 0.5, 4);
    const roof = new THREE.Mesh(roofGeo, accentMaterial);
    roof.position.y = 1.65;
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);

    // Puerta
    const doorGeo = new THREE.BoxGeometry(0.28, 0.55, 0.05);
    const door = new THREE.Mesh(doorGeo, darkMaterial);
    door.position.set(0, 0.275, 0.41);
    scene.add(door);

  } else {
    // Caja proporcional basada en X, Y, Z
    modelName = 'pieza_proporcional_3d.glb';
    const rawX = (dimensions?.x || 60) / 100;
    const rawY = (dimensions?.y || 120) / 100;
    const rawZ = (dimensions?.z || 600) / 100;

    // Normalizar para que quepa cómodamente en el visor (~1.5 unidades de alto máximo)
    const maxDim = Math.max(rawX, rawY, rawZ) || 1;
    const scaleFactor = 1.5 / maxDim;

    const w = Math.max(0.1, rawX * scaleFactor);
    const d = Math.max(0.1, rawY * scaleFactor);
    const h = Math.max(0.1, rawZ * scaleFactor);

    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const boxMesh = new THREE.Mesh(boxGeo, accentMaterial);
    boxMesh.position.y = h / 2;
    scene.add(boxMesh);

    // Marco exterior para dar estilo de diseño arquitectónico
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.LineSegments(wireGeo, lineMat);
    line.position.y = h / 2;
    scene.add(line);
  }

  // Exportar a .glb binario en el navegador
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
  const virtualFile = new File([glbBlob], modelName, { type: 'model/gltf-binary' });

  return {
    glbBlob,
    originalFile: virtualFile,
    originalName: modelName,
    format: 'glb'
  };
}

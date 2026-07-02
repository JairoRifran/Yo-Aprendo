import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { MINI_ISLAND_GLB_URLS, NAVIGATOR_CONFIG } from "./config.js";

const TEXTURE_KEYS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
  "alphaMap",
  "displacementMap",
  "envMap"
];

const modelBox = new THREE.Box3();
const modelSize = new THREE.Vector3();
const modelCenter = new THREE.Vector3();

function disposeMaterial(material) {
  const disposedTextures = new Set();
  TEXTURE_KEYS.forEach((key) => {
    const texture = material[key];
    if (texture?.dispose && !disposedTextures.has(texture)) {
      texture.dispose();
      disposedTextures.add(texture);
    }
  });
  material.dispose?.();
}

function disposeObjectResources(root) {
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(disposeMaterial);
    }
  });
}

function prepareIslandModel(model, missionState, accent) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.renderOrder = 1;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      material.roughness = Math.max(material.roughness ?? 0.68, NAVIGATOR_CONFIG.islandModel.materialRoughness);
      material.metalness = Math.min(material.metalness ?? 0.02, 0.08);
      if (material.emissive && material.emissiveIntensity > 0) {
        material.emissive.lerp(new THREE.Color(accent), 0.18);
      }
    });
  });
}

function normalizeIslandModel(model) {
  modelBox.setFromObject(model);
  modelBox.getSize(modelSize);
  modelBox.getCenter(modelCenter);
  const longestSide = Math.max(modelSize.x, modelSize.z, 0.001);
  const scale = NAVIGATOR_CONFIG.islandModel.diameter / longestSide;
  model.scale.setScalar(scale);
  model.position.set(
    -modelCenter.x * scale,
    NAVIGATOR_CONFIG.islandModel.waterlineY - modelBox.min.y * scale,
    -modelCenter.z * scale
  );
  model.rotation.y += NAVIGATOR_CONFIG.islandModel.rotationY;
}

async function loadIslandModel(url, island, renderer) {
  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/basis/");
  if (renderer) ktx2Loader.detectSupport(renderer);
  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.setKTX2Loader(ktx2Loader);
    const gltf = await loader.loadAsync(url);
    prepareIslandModel(gltf.scene, island.userData.missionState, island.userData.layout.accent);
    normalizeIslandModel(gltf.scene);
    return gltf.scene;
  } finally {
    ktx2Loader.dispose();
  }
}

function createIslandShell(mission, index, missionState) {
  const layout = NAVIGATOR_CONFIG.islands[index % NAVIGATOR_CONFIG.islands.length];
  const group = new THREE.Group();
  group.position.set(layout.x, 0, layout.z);
  group.scale.setScalar(layout.scale);
  group.userData = {
    mission,
    missionState,
    layout,
    hasModel: Boolean(MINI_ISLAND_GLB_URLS[index])
  };

  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(6.4, 6.4, 4, 28),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.y = 1.8;
  hit.userData.isIslandHit = true;
  hit.userData.island = group;
  group.add(hit);
  group.userData.hit = hit;

  return group;
}

export function createIslands(world, getMissionState, { renderer } = {}) {
  const group = new THREE.Group();
  let disposed = false;
  const pendingLoads = [];
  const islands = world.missions.map((mission, index) => {
    const hasModel = Boolean(MINI_ISLAND_GLB_URLS[index]);
    const missionState = hasModel ? getMissionState(world, index) : "locked";
    const island = createIslandShell(mission, index, missionState);
    group.add(island);
    return island;
  });

  function loadModels() {
    const loadPromise = (async () => {
      for (let index = 0; index < islands.length; index += 1) {
        const island = islands[index];
        const url = MINI_ISLAND_GLB_URLS[index];
        if (!url) continue;
        try {
          const model = await loadIslandModel(url, island, renderer);
          if (disposed || !group.parent) {
            disposeObjectResources(model);
            return;
          }
          const visualRoot = island.userData.visualRoot;
          if (visualRoot) {
            island.remove(visualRoot);
            disposeObjectResources(visualRoot);
          }
          model.name = `micro-island-model-${index + 1}`;
          island.userData.visualRoot = model;
          island.userData.loadedModel = model;
          island.add(model);
        } catch (error) {
          console.warn(`Could not load GLB island ${index + 1}; no procedural fallback will be shown.`, error);
        }
      }
    })();
    pendingLoads.push(loadPromise);
  }

  function destroy() {
    disposed = true;
  }

  return { group, islands, loadModels, destroy, pendingLoads };
}

export function updateIslands(islands, elapsed) {
  islands.forEach((island, index) => {
    const visualRoot = island.userData.visualRoot;
    if (visualRoot?.userData?.proceduralFloat) {
      visualRoot.position.y = Math.sin(elapsed * 1.2 + index * 0.5) * 0.025;
    }
  });
}

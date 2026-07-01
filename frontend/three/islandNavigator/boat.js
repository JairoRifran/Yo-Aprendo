import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { BOAT_GLB_URL, NAVIGATOR_CONFIG } from "./config.js";

const modelBox = new THREE.Box3();
const modelSize = new THREE.Vector3();
const modelCenter = new THREE.Vector3();
const sampleOffsets = [
  [0, 0],
  [0, 1.6],
  [0, -1.6],
  [0.9, 0],
  [-0.9, 0]
];

function createPlaceholderBoat() {
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.58, 2.4, 5, 12),
    new THREE.MeshStandardMaterial({ color: 0x9b552f, roughness: 0.64, metalness: 0.02 })
  );
  hull.scale.set(1.1, 0.42, 0.72);
  hull.rotation.z = Math.PI / 2;
  hull.position.y = 0.38;
  hull.castShadow = true;
  boat.add(hull);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.16, 1.45),
    new THREE.MeshStandardMaterial({ color: 0xffd17a, roughness: 0.72 })
  );
  deck.position.y = 0.72;
  deck.castShadow = true;
  boat.add(deck);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 1.75, 8),
    new THREE.MeshStandardMaterial({ color: 0x6c3b20, roughness: 0.8 })
  );
  mast.position.y = 1.45;
  mast.castShadow = true;
  boat.add(mast);

  const sail = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 1.2, 3),
    new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.42 })
  );
  sail.position.set(0.22, 1.42, 0);
  sail.rotation.z = -Math.PI / 2;
  sail.castShadow = true;
  boat.add(sail);

  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.22, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x2f8cff, emissive: 0x143f7c, emissiveIntensity: 0.22 })
  );
  flag.position.set(0.34, 2.18, 0);
  flag.castShadow = true;
  boat.add(flag);

  boat.userData.placeholder = true;
  return boat;
}

function normalizeBoatModel(model) {
  modelBox.setFromObject(model);
  modelBox.getSize(modelSize);
  modelBox.getCenter(modelCenter);
  const longestSide = Math.max(modelSize.x, modelSize.z, 0.001);
  const scale = NAVIGATOR_CONFIG.boat.modelLength / longestSide;
  model.scale.setScalar(scale);
  model.position.sub(modelCenter.multiplyScalar(scale));
  model.rotation.y += NAVIGATOR_CONFIG.boat.modelRotationY;
}

export async function createBoat(renderer) {
  const boat = new THREE.Group();
  boat.position.set(
    NAVIGATOR_CONFIG.boat.spawnX,
    NAVIGATOR_CONFIG.boat.waterlineOffset,
    NAVIGATOR_CONFIG.boat.spawnZ
  );
  boat.rotation.y = NAVIGATOR_CONFIG.boat.spawnRotationY;
  boat.userData.velocity = new THREE.Vector3();
  boat.userData.floatY = boat.position.y;
  boat.userData.floatRoll = 0;
  boat.userData.floatPitch = 0;
  boat.renderOrder = 2;

  const placeholder = createPlaceholderBoat();
  placeholder.scale.setScalar(NAVIGATOR_CONFIG.boat.placeholderScale);
  boat.add(placeholder);

  if (BOAT_GLB_URL) {
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/basis/");
    if (renderer) ktx2Loader.detectSupport(renderer);
    try {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.setKTX2Loader(ktx2Loader);
      const gltf = await loader.loadAsync(BOAT_GLB_URL);
      boat.clear();
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.renderOrder = 2;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
              material.roughness = Math.min(material.roughness ?? 0.72, 0.86);
              material.metalness = material.metalness ?? 0.04;
            });
          }
        }
      });
      normalizeBoatModel(gltf.scene);
      boat.add(gltf.scene);
      boat.userData.placeholder = false;
    } catch (error) {
      console.warn("Falling back to procedural boat", error);
      boat.userData.placeholder = true;
    } finally {
      ktx2Loader.dispose();
    }
  }

  return boat;
}

export function updateBoatFloat(boat, elapsed, water, delta = 0.016) {
  if (!boat) return;
  const config = NAVIGATOR_CONFIG.boat;
  const getHeight = water?.userData.getHeight;
  let centerHeight = 0;
  let frontHeight = 0;
  let backHeight = 0;
  let rightHeight = 0;
  let leftHeight = 0;

  if (getHeight) {
    const sinYaw = Math.sin(boat.rotation.y);
    const cosYaw = Math.cos(boat.rotation.y);
    for (let i = 0; i < sampleOffsets.length; i += 1) {
      const [side, forward] = sampleOffsets[i];
      const x = boat.position.x + side * cosYaw + forward * sinYaw;
      const z = boat.position.z - side * sinYaw + forward * cosYaw;
      const sampleHeight = getHeight(x, z, elapsed);
      if (i === 0) centerHeight = sampleHeight;
      if (i === 1) frontHeight = sampleHeight;
      if (i === 2) backHeight = sampleHeight;
      if (i === 3) rightHeight = sampleHeight;
      if (i === 4) leftHeight = sampleHeight;
    }
  }

  const averageWave = (centerHeight + frontHeight + backHeight + rightHeight + leftHeight) / sampleOffsets.length;
  const clampedWave = Math.max(-config.maxWaveLift, Math.min(config.maxWaveLift, averageWave));
  const bob = Math.sin(elapsed * 1.45 + boat.position.x * 0.012 + boat.position.z * 0.01) * config.bobAmount;
  const targetY = config.waterlineOffset + clampedWave * config.waveFollow + bob;
  const damping = 1 - Math.pow(1 - config.floatDamping, delta * 60);
  boat.userData.floatY += (targetY - boat.userData.floatY) * damping;
  boat.position.y = boat.userData.floatY;

  const waveRoll = Math.max(-config.waveTilt, Math.min(config.waveTilt, (leftHeight - rightHeight) * 0.18));
  const wavePitch = Math.max(-config.waveTilt, Math.min(config.waveTilt, (backHeight - frontHeight) * 0.16));
  const targetRoll = waveRoll + Math.sin(elapsed * 1.25 + boat.position.x * 0.02) * config.rollAmount;
  const targetPitch = wavePitch + Math.sin(elapsed * 1.05 + boat.position.z * 0.018) * config.pitchAmount;
  boat.userData.floatRoll += (targetRoll - boat.userData.floatRoll) * damping;
  boat.userData.floatPitch += (targetPitch - boat.userData.floatPitch) * damping;
  boat.rotation.z = boat.userData.floatRoll;
  boat.rotation.x = boat.userData.floatPitch;
}

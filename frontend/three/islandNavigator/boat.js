import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { BOAT_GLB_URL, NAVIGATOR_CONFIG } from "./config.js";

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

export async function createBoat() {
  const boat = new THREE.Group();
  boat.position.set(0, 0.75, 44);
  boat.rotation.y = Math.PI;
  boat.userData.velocity = new THREE.Vector3();
  boat.userData.baseY = boat.position.y;

  const placeholder = createPlaceholderBoat();
  placeholder.scale.setScalar(NAVIGATOR_CONFIG.boat.placeholderScale);
  boat.add(placeholder);

  if (BOAT_GLB_URL) {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(BOAT_GLB_URL);
      boat.clear();
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      boat.add(gltf.scene);
      boat.userData.placeholder = false;
    } catch {
      boat.userData.placeholder = true;
    }
  }

  return boat;
}

export function updateBoatFloat(boat, elapsed) {
  boat.position.y = boat.userData.baseY + Math.sin(elapsed * 2.6) * NAVIGATOR_CONFIG.boat.bobAmount;
  boat.rotation.z = Math.sin(elapsed * 2.1) * 0.035;
}

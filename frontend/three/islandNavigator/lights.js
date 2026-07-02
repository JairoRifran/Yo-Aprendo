import * as THREE from "three";

export function addLights(scene) {
  // Use a clean, realistic hemisphere light (sky: white, ground: soft blue-grey reflected from ocean)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8bb9d5, 1.45);
  scene.add(hemi);

  // Strong, warm primary sun light
  const sun = new THREE.DirectionalLight(0xfff5db, 3.8);
  sun.position.set(-38, 52, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = 150;
  scene.add(sun);

  const sunDisk = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.8 })
  );
  sunDisk.position.set(-75, 62, -112);
  scene.add(sunDisk);

  return { hemi, sun, sunDisk };
}

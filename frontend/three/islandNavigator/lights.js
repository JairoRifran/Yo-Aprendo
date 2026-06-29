import * as THREE from "three";

export function addLights(scene) {
  const hemi = new THREE.HemisphereLight(0xdff7ff, 0x2f7c68, 2.8);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3c2, 4.2);
  sun.position.set(-26, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = 90;
  scene.add(sun);

  const oceanGlow = new THREE.PointLight(0x7df2ff, 1.4, 70);
  oceanGlow.position.set(8, 9, 4);
  scene.add(oceanGlow);

  return { hemi, sun, oceanGlow };
}

import * as THREE from "three";

export function addLights(scene) {
  const hemi = new THREE.HemisphereLight(0xe7fbff, 0x2b7465, 2.35);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0b8, 4.25);
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

  const oceanGlow = new THREE.PointLight(0x7df2ff, 1.05, 110);
  oceanGlow.position.set(12, 12, 18);
  scene.add(oceanGlow);

  const sunDisk = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff0a5, transparent: true, opacity: 0.72 })
  );
  sunDisk.position.set(-75, 62, -112);
  scene.add(sunDisk);

  return { hemi, sun, oceanGlow, sunDisk };
}

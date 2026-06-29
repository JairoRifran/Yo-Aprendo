import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function createEffects(renderer, scene, camera, container) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const size = new THREE.Vector2(container.clientWidth, container.clientHeight);
  const bloom = new UnrealBloomPass(size, 0.18, 0.55, 0.82);
  composer.addPass(bloom);
  return composer;
}

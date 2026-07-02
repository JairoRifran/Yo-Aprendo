import * as THREE from "three";
import { getMissionState } from "../../utils/progress.js";
import { NAVIGATOR_CONFIG } from "./config.js";
import { createAdventureCamera, createCameraInput, updateAdventureCamera } from "./camera.js";
import { createRenderer, resizeRenderer } from "./renderer.js";
import { addLights } from "./lights.js";
import { createWater } from "./water.js";
import { createIslands, updateIslands } from "./islands.js";
import { createBoat, updateBoatFloat } from "./boat.js";
import { createBoatNavigation } from "./navigation.js";
import { createNavigatorHud } from "./hud.js";
import { createEffects } from "./effects.js";
import { createWakeParticles } from "./wakeParticles.js";

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

function disposeMaterial(material) {
  const disposedTextures = new Set();
  TEXTURE_KEYS.forEach((key) => {
    const texture = material[key];
    if (texture?.dispose && !disposedTextures.has(texture)) {
      texture.dispose();
      disposedTextures.add(texture);
    }
  });
  if (material.uniforms) {
    Object.values(material.uniforms).forEach((uniform) => {
      const texture = uniform?.value;
      if (texture?.isTexture && !disposedTextures.has(texture)) {
        texture.dispose();
        disposedTextures.add(texture);
      }
    });
  }
  material.dispose?.();
}

function disposeObjectResources(root) {
  root.traverse((object) => {
    object.userData.dispose?.();
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(disposeMaterial);
    }
  });
}

export function initIslandNavigatorScene(container, { world, onMissionReady } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9eeaff);
  scene.fog = new THREE.Fog(
    NAVIGATOR_CONFIG.world.fogColor,
    NAVIGATOR_CONFIG.world.fogNear,
    NAVIGATOR_CONFIG.world.fogFar
  );

  const camera = createAdventureCamera(container);
  const renderer = createRenderer(container);
  const composer = createEffects(renderer, scene, camera, container);
  const clock = new THREE.Clock();
  const hud = createNavigatorHud(document);
  const cameraInput = createCameraInput(renderer.domElement);
  const resetButton = document.getElementById("islandNavigatorResetBtn");
  let animationFrameId = 0;
  let isDisposed = false;
  let eventsAttached = false;
  let boat = null;
  let navigation = null;
  let islandBundle = null;
  const wakeParticles = createWakeParticles();
  scene.add(wakeParticles);

  function disposeSceneResources() {
    wakeParticles.userData.dispose?.();
    disposeObjectResources(scene);
    composer.dispose?.();
    renderer.dispose();
    renderer.domElement.remove();
  }

  function destroy() {
    if (isDisposed) return;
    isDisposed = true;
    cancelAnimationFrame(animationFrameId);
    islandBundle?.destroy?.();
    if (eventsAttached) {
      navigation?.destroy();
      cameraInput.destroy();
      resetButton?.removeEventListener("click", onResetBoat);
      window.removeEventListener("resize", onResize);
      eventsAttached = false;
    }
    disposeSceneResources();
  }

  addLights(scene);

  const water = createWater();
  scene.add(water);

  islandBundle = createIslands(
    world,
    (entry, index) => getMissionState(entry, index, [world]),
    { renderer }
  );
  const { group: islandsGroup, islands } = islandBundle;
  hud.setIslands(islands);
  scene.add(islandsGroup);

  function onResetBoat() {
    if (!boat || !navigation) return;
    const destination = navigation.getDestination();
    const position = new THREE.Vector3(
      NAVIGATOR_CONFIG.boat.spawnX,
      boat.position.y,
      NAVIGATOR_CONFIG.boat.spawnZ
    );
    let rotationY = NAVIGATOR_CONFIG.boat.spawnRotationY;

    if (destination) {
      const offsetX = NAVIGATOR_CONFIG.boat.spawnX - destination.position.x;
      const offsetZ = NAVIGATOR_CONFIG.boat.spawnZ - destination.position.z;
      const length = Math.max(1, Math.hypot(offsetX, offsetZ));
      position.x = destination.position.x + (offsetX / length) * NAVIGATOR_CONFIG.world.resetDistanceFromTarget;
      position.z = destination.position.z + (offsetZ / length) * NAVIGATOR_CONFIG.world.resetDistanceFromTarget;
      rotationY = Math.atan2(destination.position.x - position.x, destination.position.z - position.z);
    }

    navigation.resetTo(position, rotationY);
    cameraInput.reset();
    hud.updateNavigation(navigation.state);
    hud.updateCompass(boat, navigation.getDestination(), islands, navigation.state);
  }

  async function start() {
    const loadedBoat = await createBoat(renderer);
    if (isDisposed) {
      disposeObjectResources(loadedBoat);
      return;
    }
    boat = loadedBoat;
    scene.add(boat);
    islandBundle.loadModels?.();

    navigation = createBoatNavigation(boat, {
      onDestinationChange(mission) {
        hud.setDestination(mission);
      },
      onArrive(mission) {
        hud.showArrival(mission);
        onMissionReady?.(mission);
      },
      onStateChange(state) {
        hud.updateNavigation(state);
      }
    });

    const firstAvailableIsland =
      islands.find((island) => island.userData.missionState === "available") ||
      islands.find((island) => island.userData.missionState !== "locked") ||
      islands[0] ||
      null;
    if (firstAvailableIsland) {
      navigation.setDestination(firstAvailableIsland);
      onResetBoat();
    }

    navigation.attach();
    cameraInput.attach();
    resetButton?.addEventListener("click", onResetBoat);
    window.addEventListener("resize", onResize);
    eventsAttached = true;
    onResize();
    animate();
  }

  function onResize() {
    resizeRenderer(renderer, camera, composer, container);
  }

  function animate() {
    if (isDisposed) return;
    const delta = Math.min(clock.getDelta(), 0.04);
    const elapsed = clock.elapsedTime;

    water.userData.update(elapsed, boat, navigation?.state);
    updateIslands(islands, elapsed);
    navigation?.update(delta);
    updateBoatFloat(boat, elapsed, water, delta);
    wakeParticles.userData.update(elapsed, boat, navigation?.state, delta);
    updateAdventureCamera(camera, boat, delta, cameraInput.state);
    hud.updateCompass(boat, navigation?.getDestination(), islands, navigation?.state);

    composer.render(delta);
    animationFrameId = requestAnimationFrame(animate);
  }

  return {
    destroy,
    ready: start()
  };
}

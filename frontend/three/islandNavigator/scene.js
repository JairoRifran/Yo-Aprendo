import * as THREE from "three";
import { getMissionState } from "../../utils/progress.js";
import { NAVIGATOR_CONFIG } from "./config.js";
import { createAdventureCamera, updateAdventureCamera } from "./camera.js";
import { createRenderer, resizeRenderer } from "./renderer.js";
import { addLights } from "./lights.js";
import { createWater } from "./water.js";
import { createIslands, updateIslands } from "./islands.js";
import { createBoat, updateBoatFloat } from "./boat.js";
import { createBoatNavigation } from "./navigation.js";
import { createNavigatorHud } from "./hud.js";
import { createEffects } from "./effects.js";

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
  TEXTURE_KEYS.forEach((key) => {
    material[key]?.dispose?.();
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
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hud = createNavigatorHud(document);
  let animationFrameId = 0;
  let isDisposed = false;
  let eventsAttached = false;
  let boat = null;
  let navigation = null;

  function disposeSceneResources() {
    disposeObjectResources(scene);
    composer.dispose?.();
    renderer.dispose();
    renderer.domElement.remove();
  }

  function destroy() {
    if (isDisposed) return;
    isDisposed = true;
    cancelAnimationFrame(animationFrameId);
    if (eventsAttached) {
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      eventsAttached = false;
    }
    disposeSceneResources();
  }

  addLights(scene);

  const water = createWater();
  scene.add(water);

  const { group: islandsGroup, islands } = createIslands(
    world,
    (entry, index) => getMissionState(entry, index, [world])
  );
  scene.add(islandsGroup);

  async function start() {
    const loadedBoat = await createBoat();
    if (isDisposed) {
      disposeObjectResources(loadedBoat);
      return;
    }
    boat = loadedBoat;
    scene.add(boat);

    navigation = createBoatNavigation(boat, {
      onDestinationChange(mission) {
        hud.setDestination(mission);
      },
      onArrive(mission) {
        hud.showArrival(mission);
        onMissionReady?.(mission);
      }
    });

    const firstAvailableIsland =
      islands.find((island) => island.userData.missionState !== "locked") || islands[0] || null;
    if (firstAvailableIsland) {
      navigation.setDestination(firstAvailableIsland);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    eventsAttached = true;
    onResize();
    animate();
  }

  function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(islandsGroup.children, true);
    const hit = hits.find((item) => item.object.userData.isIslandHit);
    if (hit?.object.userData.island) {
      navigation?.setDestination(hit.object.userData.island);
    }
  }

  function onResize() {
    resizeRenderer(renderer, camera, composer, container);
  }

  function animate() {
    if (isDisposed) return;
    const delta = Math.min(clock.getDelta(), 0.04);
    const elapsed = clock.elapsedTime;

    water.userData.update(elapsed);
    updateIslands(islands, elapsed);
    navigation?.update(delta);
    updateBoatFloat(boat, elapsed);
    updateAdventureCamera(camera, boat, delta);
    hud.updateCompass(boat, navigation?.getDestination());

    composer.render(delta);
    animationFrameId = requestAnimationFrame(animate);
  }

  return {
    destroy,
    ready: start()
  };
}

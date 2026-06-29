import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

const worldUp = new THREE.Vector3(0, 1, 0);
const followOffsetVector = new THREE.Vector3();
const lookAheadVector = new THREE.Vector3();
const desiredPosition = new THREE.Vector3();
const lookAtPosition = new THREE.Vector3();

export function createAdventureCamera(container) {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  const camera = new THREE.PerspectiveCamera(
    NAVIGATOR_CONFIG.camera.fov,
    width / height,
    NAVIGATOR_CONFIG.camera.near,
    NAVIGATOR_CONFIG.camera.far
  );
  camera.position.set(0, 15, 24);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function updateAdventureCamera(camera, boat, delta) {
  if (!boat) return;

  const { followOffset, lookAhead, followLerp } = NAVIGATOR_CONFIG.camera;
  followOffsetVector.set(followOffset.x, followOffset.y, followOffset.z);
  lookAheadVector.set(lookAhead.x, lookAhead.y, lookAhead.z);
  followOffsetVector.applyAxisAngle(worldUp, boat.rotation.y);
  lookAheadVector.applyAxisAngle(worldUp, boat.rotation.y);

  desiredPosition.copy(boat.position).add(followOffsetVector);
  lookAtPosition.copy(boat.position).add(lookAheadVector);
  const smooth = 1 - Math.pow(1 - followLerp, delta * 60);
  camera.position.lerp(desiredPosition, smooth);
  camera.lookAt(lookAtPosition);
}

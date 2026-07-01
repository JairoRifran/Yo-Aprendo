import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

const worldUp = new THREE.Vector3(0, 1, 0);
const pitchAxis = new THREE.Vector3(1, 0, 0);
const followOffsetVector = new THREE.Vector3();
const lookAheadVector = new THREE.Vector3();
const desiredPosition = new THREE.Vector3();
const lookAtPosition = new THREE.Vector3();
const baseOffset = new THREE.Vector3();

export function createAdventureCamera(container) {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  const camera = new THREE.PerspectiveCamera(
    NAVIGATOR_CONFIG.camera.fov,
    width / height,
    NAVIGATOR_CONFIG.camera.near,
    NAVIGATOR_CONFIG.camera.far
  );
  camera.position.set(0, 8, 20);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function createCameraInput(domElement) {
  const config = NAVIGATOR_CONFIG.camera;
  const state = {
    yawOffset: 0,
    targetYawOffset: 0,
    pitch: config.pitchDefault,
    targetPitch: config.pitchDefault,
    dragging: false,
    lastX: 0,
    lastY: 0
  };

  function onPointerDown(event) {
    state.dragging = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    domElement.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!state.dragging) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.targetYawOffset = Math.max(
      -config.maxYawOffset,
      Math.min(config.maxYawOffset, state.targetYawOffset - dx * config.dragSensitivity)
    );
    state.targetPitch = Math.max(
      config.pitchMin,
      Math.min(config.pitchMax, state.targetPitch + dy * config.dragSensitivity)
    );
  }

  function endDrag(event) {
    state.dragging = false;
    domElement.releasePointerCapture?.(event.pointerId);
  }

  function attach() {
    domElement.addEventListener("pointerdown", onPointerDown);
    domElement.addEventListener("pointermove", onPointerMove);
    domElement.addEventListener("pointerup", endDrag);
    domElement.addEventListener("pointercancel", endDrag);
  }

  function destroy() {
    domElement.removeEventListener("pointerdown", onPointerDown);
    domElement.removeEventListener("pointermove", onPointerMove);
    domElement.removeEventListener("pointerup", endDrag);
    domElement.removeEventListener("pointercancel", endDrag);
  }

  function reset() {
    state.targetYawOffset = 0;
    state.yawOffset = 0;
    state.targetPitch = config.pitchDefault;
  }

  return { state, attach, destroy, reset };
}

export function updateAdventureCamera(camera, boat, delta, inputState) {
  if (!boat) return;

  const config = NAVIGATOR_CONFIG.camera;
  if (inputState) {
    if (!inputState.dragging) {
      inputState.targetYawOffset += (0 - inputState.targetYawOffset) * (1 - Math.pow(1 - config.yawReturn, delta * 60));
    }
    const inputSmooth = 1 - Math.pow(1 - config.yawLerp, delta * 60);
    inputState.yawOffset += (inputState.targetYawOffset - inputState.yawOffset) * inputSmooth;
    inputState.pitch += (inputState.targetPitch - inputState.pitch) * inputSmooth;
  }

  const yaw = boat.rotation.y + (inputState?.yawOffset || 0);
  const pitch = inputState?.pitch ?? config.pitchDefault;
  baseOffset.set(0, config.chaseHeight, -config.chaseDistance);
  followOffsetVector
    .copy(baseOffset)
    .applyAxisAngle(pitchAxis, pitch)
    .applyAxisAngle(worldUp, yaw);
  lookAheadVector.set(0, config.lookHeight, config.lookAhead).applyAxisAngle(worldUp, boat.rotation.y);

  desiredPosition.copy(boat.position).add(followOffsetVector);
  if (desiredPosition.y < config.minHeight) desiredPosition.y = config.minHeight;
  lookAtPosition.copy(boat.position).add(lookAheadVector);
  const smooth = 1 - Math.pow(1 - config.followLerp, delta * 60);
  camera.position.lerp(desiredPosition, smooth);
  camera.lookAt(lookAtPosition);
}

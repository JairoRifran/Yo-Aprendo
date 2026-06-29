import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

export function createBoatNavigation(boat, { onDestinationChange, onArrive } = {}) {
  const state = {
    destination: null,
    arrivedMissionId: "",
    isMoving: false
  };
  const target = new THREE.Vector3();
  const toTarget = new THREE.Vector3();

  function setDestination(island) {
    if (!island || island.userData.missionState === "locked") return;
    state.destination = island;
    state.arrivedMissionId = "";
    state.isMoving = true;
    onDestinationChange?.(island.userData.mission, island);
  }

  function update(delta) {
    if (!state.destination) return;

    target.copy(state.destination.position);
    target.y = boat.position.y;
    toTarget.copy(target).sub(boat.position);
    const distance = toTarget.length();

    if (distance <= NAVIGATOR_CONFIG.world.arrivalDistance) {
      state.isMoving = false;
      const missionId = state.destination.userData.mission.id;
      if (state.arrivedMissionId !== missionId) {
        state.arrivedMissionId = missionId;
        onArrive?.(state.destination.userData.mission, state.destination);
      }
      return;
    }

    toTarget.normalize();
    const step = Math.min(distance, NAVIGATOR_CONFIG.boat.speed * delta);
    boat.position.addScaledVector(toTarget, step);

    const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
    let yawDelta = desiredYaw - boat.rotation.y;
    yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
    boat.rotation.y += yawDelta * NAVIGATOR_CONFIG.boat.turnLerp;
  }

  return {
    state,
    setDestination,
    update,
    getDestination: () => state.destination
  };
}

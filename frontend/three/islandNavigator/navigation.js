import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

const forwardVector = new THREE.Vector3();
const centerVector = new THREE.Vector3();

export function createBoatNavigation(boat, { onDestinationChange, onArrive, onStateChange } = {}) {
  const state = {
    destination: null,
    arrivedMissionId: "",
    status: "navigating",
    speed: 0,
    distance: 0,
    edgeWarning: false
  };
  const target = new THREE.Vector3();
  const toTarget = new THREE.Vector3();
  const keys = {
    forward: false,
    reverse: false,
    left: false,
    right: false
  };

  function setKey(event, active) {
    if (event.repeat && active) return;
    const key = event.key.toLowerCase();
    const handled = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key);
    if (!handled) return;
    event.preventDefault();
    if (key === "w" || key === "arrowup") keys.forward = active;
    if (key === "s" || key === "arrowdown") keys.reverse = active;
    if (key === "a" || key === "arrowleft") keys.left = active;
    if (key === "d" || key === "arrowright") keys.right = active;
    if (active && (key === "w" || key === "arrowup")) {
      state.speed = Math.min(NAVIGATOR_CONFIG.boat.maxSpeed, state.speed + NAVIGATOR_CONFIG.boat.acceleration * 0.18);
    }
    if (active && (key === "s" || key === "arrowdown")) {
      state.speed = Math.max(-NAVIGATOR_CONFIG.boat.reverseSpeed, state.speed - NAVIGATOR_CONFIG.boat.brakeAcceleration * 0.12);
    }
    if (active && (key === "a" || key === "arrowleft")) {
      boat.rotation.y += NAVIGATOR_CONFIG.boat.turnSpeed * 0.055;
    }
    if (active && (key === "d" || key === "arrowright")) {
      boat.rotation.y -= NAVIGATOR_CONFIG.boat.turnSpeed * 0.055;
    }
  }

  function onKeyDown(event) {
    setKey(event, true);
  }

  function onKeyUp(event) {
    setKey(event, false);
  }

  function setDestination(island) {
    if (!island || island.userData.missionState === "locked") return;
    state.destination = island;
    state.arrivedMissionId = "";
    state.status = "navigating";
    onDestinationChange?.(island.userData.mission, island);
  }

  function update(delta) {
    const config = NAVIGATOR_CONFIG.boat;
    const input = (keys.forward ? 1 : 0) - (keys.reverse ? 1 : 0);
    const maxForward = config.maxSpeed;
    const maxReverse = -config.reverseSpeed;

    if (input > 0) {
      state.speed = Math.min(maxForward, state.speed + config.acceleration * delta);
    } else if (input < 0) {
      state.speed = Math.max(maxReverse, state.speed - config.brakeAcceleration * delta);
    } else {
      const dragStep = config.drag * delta;
      if (Math.abs(state.speed) <= dragStep) state.speed = 0;
      else state.speed -= Math.sign(state.speed) * dragStep;
    }

    const steering = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    const steeringPower = Math.min(1, Math.abs(state.speed) / maxForward + 0.24);
    boat.rotation.y += steering * config.turnSpeed * steeringPower * delta;

    forwardVector.set(Math.sin(boat.rotation.y), 0, Math.cos(boat.rotation.y));
    boat.position.addScaledVector(forwardVector, state.speed * delta);
    centerVector.set(boat.position.x, 0, boat.position.z);
    const distanceFromCenter = centerVector.length();
    state.edgeWarning = distanceFromCenter > NAVIGATOR_CONFIG.world.edgeWarningRadius;
    if (state.edgeWarning && state.speed > 0) {
      state.speed *= 0.94;
    }
    if (distanceFromCenter > NAVIGATOR_CONFIG.world.playableRadius) {
      centerVector.multiplyScalar(NAVIGATOR_CONFIG.world.playableRadius / distanceFromCenter);
      boat.position.x = centerVector.x;
      boat.position.z = centerVector.z;
      state.speed = Math.min(0, state.speed);
    }

    if (!state.destination) {
      state.distance = 0;
      onStateChange?.(state);
      return;
    }

    target.copy(state.destination.position);
    target.y = boat.position.y;
    toTarget.copy(target).sub(boat.position);
    state.distance = toTarget.length();

    if (state.distance <= NAVIGATOR_CONFIG.world.arrivalDistance) {
      state.speed = 0;
      state.status = "ready";
      const missionId = state.destination.userData.mission.id;
      if (state.arrivedMissionId !== missionId) {
        state.arrivedMissionId = missionId;
        onArrive?.(state.destination.userData.mission, state.destination);
      }
      onStateChange?.(state);
      return;
    }

    if (state.status === "ready") {
      state.arrivedMissionId = "";
    }
    state.status = state.distance <= NAVIGATOR_CONFIG.world.nearDistance ? "near" : "navigating";
    onStateChange?.(state);
  }

  function attach() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }

  function destroy() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }

  function stop() {
    state.speed = 0;
    keys.forward = false;
    keys.reverse = false;
    keys.left = false;
    keys.right = false;
  }

  function resetTo(position, rotationY) {
    stop();
    boat.position.x = position.x;
    boat.position.z = position.z;
    boat.rotation.y = rotationY;
    state.arrivedMissionId = "";
    state.status = "navigating";
    state.edgeWarning = false;
  }

  return {
    state,
    attach,
    destroy,
    setDestination,
    update,
    resetTo,
    stop,
    getDestination: () => state.destination,
    getKeys: () => keys
  };
}

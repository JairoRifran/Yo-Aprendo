import { NAVIGATOR_CONFIG } from "./config.js";

const MAP_CENTER = 50;
const MAP_RADIUS = 43;

const LEARNING_BY_CHALLENGE = {
  reorder: "Ordenar instrucciones en una secuencia logica, como un algoritmo.",
  "path-program": "Planificar una ruta paso a paso y probar si cada instruccion funciona.",
  "multiple-choice": "Elegir la opcion correcta comparando reglas, errores y consecuencias.",
  default: "Resolver un reto de pensamiento computacional paso a paso."
};

function getLearningText(mission) {
  if (mission?.final) {
    return "Usar lo aprendido en esta isla para resolver un desafio mas completo.";
  }
  return LEARNING_BY_CHALLENGE[mission?.challenge?.type] || LEARNING_BY_CHALLENGE.default;
}

function getWhyText(mission) {
  if (mission?.final) {
    return "Completarla demuestra que Bit ya domina este tramo de la aventura.";
  }
  return "Completarla ayuda a Bit a avanzar por la isla y te prepara para retos mas dificiles.";
}

function getRewardText(mission) {
  const coins = mission?.coins || 0;
  const gems = mission?.gems || 0;
  const parts = [];
  if (coins) parts.push(`${coins} monedas`);
  if (gems) parts.push(`${gems} gema${gems === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" + ") : "Progreso en tu aventura";
}

export function createNavigatorHud(root) {
  const destinationEl = root.querySelector("#islandNavigatorDestination");
  const detailEl = root.querySelector("#islandNavigatorDetail");
  const statusEl = root.querySelector("#islandNavigatorStatus");
  const bearingEl = root.querySelector("#islandNavigatorBearing");
  const mapHintEl = root.querySelector("#islandNavigatorMapHint");
  const mapRoute = root.querySelector("#islandNavigatorMapRoute");
  const mapBoat = root.querySelector("#islandNavigatorMapBoat");
  const mapTargetPulse = root.querySelector("#islandNavigatorMapTargetPulse");
  const mapIslands = root.querySelector("#islandNavigatorMapIslands");
  const card = root.querySelector("#islandNavigatorMissionCard");
  const title = root.querySelector("#islandNavigatorMissionTitle");
  const prompt = root.querySelector("#islandNavigatorMissionPrompt");
  const learn = root.querySelector("#islandNavigatorMissionLearn");
  const why = root.querySelector("#islandNavigatorMissionWhy");
  const reward = root.querySelector("#islandNavigatorMissionReward");
  const enter = root.querySelector("#islandNavigatorEnterBtn");
  const hudLeft = root.querySelector(".island-navigator-hud-left");

  let islandMarkers = [];
  let previousDistance = 0;

  function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  function toDegrees(angle) {
    return Math.round(((angle * 180) / Math.PI + 360) % 360);
  }

  function toCardinal(angle) {
    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const index = Math.round(toDegrees(angle) / 45) % directions.length;
    return directions[index];
  }

  function worldToMap(position) {
    const radius = NAVIGATOR_CONFIG.world.playableRadius;
    return {
      x: MAP_CENTER + Math.max(-1, Math.min(1, position.x / radius)) * MAP_RADIUS,
      y: MAP_CENTER + Math.max(-1, Math.min(1, position.z / radius)) * MAP_RADIUS
    };
  }

  function guidanceText(relativeBearing, isMovingAway, status) {
    if (status === "ready") return "Llegaste";
    if (isMovingAway) return "Volvé a la ruta";
    const degrees = toDegrees(relativeBearing);
    const signed = degrees > 180 ? degrees - 360 : degrees;
    if (Math.abs(signed) <= 18) return "Seguí derecho";
    if (Math.abs(signed) >= 150) return "Da la vuelta";
    return signed > 0 ? "Girá a la derecha" : "Girá a la izquierda";
  }

  function setIslands(islands) {
    if (!mapIslands) return;
    islandMarkers = islands.map((island) => {
      const point = worldToMap(island.position);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("cx", point.x.toFixed(1));
      marker.setAttribute("cy", point.y.toFixed(1));
      marker.setAttribute("r", "3.2");
      marker.setAttribute("class", "island-navigator-map-island");
      mapIslands.appendChild(marker);
      return { island, marker };
    });
  }

  function setDestination(mission) {
    if (destinationEl) destinationEl.textContent = mission?.title || "Busca una isla disponible";
    if (detailEl) detailEl.textContent = "Usa WASD o flechas para navegar";
    if (bearingEl) bearingEl.textContent = "Objetivo al frente";
    if (mapHintEl) mapHintEl.textContent = "Seguí derecho";
    if (statusEl) statusEl.textContent = "Navegando";
    if (card) card.hidden = true;
    if (hudLeft) hudLeft.classList.remove("is-arrived");
  }

  function showArrival(mission) {
    const missionLabel = mission?.number ? `Mision ${mission.number}: ` : "";
    if (title) title.textContent = `${missionLabel}${mission?.title || "Micro-mision"}`;
    if (prompt) prompt.textContent = mission?.challenge?.prompt || "Toca ingresar para abrir la tarea.";
    if (learn) learn.textContent = getLearningText(mission);
    if (why) why.textContent = getWhyText(mission);
    if (reward) reward.textContent = getRewardText(mission);
    if (enter) enter.dataset.missionId = mission?.id || "";
    if (card) card.hidden = false;
    if (hudLeft) hudLeft.classList.add("is-arrived");
  }

  function updateCompass(boat, island, islands = [], state) {
    if (!boat || !island) return;

    if (!islandMarkers.length && islands.length) setIslands(islands);

    const boatPoint = worldToMap(boat.position);
    const targetPoint = worldToMap(island.position);
    const dx = island.position.x - boat.position.x;
    const dz = island.position.z - boat.position.z;
    const boatHeading = Math.atan2(Math.sin(boat.rotation.y), -Math.cos(boat.rotation.y));
    const targetBearing = Math.atan2(dx, -dz);
    const relativeBearing = normalizeAngle(targetBearing - boatHeading);
    const distance = Math.max(0, Math.round(state?.distance || Math.hypot(dx, dz)));
    const movingAway = previousDistance > 0 && distance > previousDistance + 3 && state?.status !== "ready";
    previousDistance = distance;
    const hint = guidanceText(relativeBearing, movingAway, state?.status);

    if (mapBoat) {
      const boatDegrees = toDegrees(boatHeading);
      mapBoat.setAttribute("transform", `translate(${boatPoint.x.toFixed(1)} ${boatPoint.y.toFixed(1)}) rotate(${boatDegrees})`);
    }
    if (mapRoute) {
      mapRoute.setAttribute("x1", boatPoint.x.toFixed(1));
      mapRoute.setAttribute("y1", boatPoint.y.toFixed(1));
      mapRoute.setAttribute("x2", targetPoint.x.toFixed(1));
      mapRoute.setAttribute("y2", targetPoint.y.toFixed(1));
      mapRoute.classList.toggle("is-warning", movingAway);
    }
    if (mapTargetPulse) {
      mapTargetPulse.setAttribute("cx", targetPoint.x.toFixed(1));
      mapTargetPulse.setAttribute("cy", targetPoint.y.toFixed(1));
      mapTargetPulse.classList.toggle("is-ready", state?.status === "ready");
    }

    islandMarkers.forEach(({ island: markerIsland, marker }) => {
      const isTarget = markerIsland === island;
      marker.classList.toggle("is-target", isTarget);
      marker.classList.toggle("is-locked", markerIsland.userData.missionState === "locked");
      marker.classList.toggle("is-missing-model", !markerIsland.userData.hasModel);
      marker.setAttribute("r", isTarget ? "4.8" : "3.2");
    });

    if (bearingEl) bearingEl.textContent = `${hint} - ${distance} m`;
    if (mapHintEl) {
      mapHintEl.textContent = hint;
      mapHintEl.classList.toggle("is-warning", movingAway);
      mapHintEl.classList.toggle("is-ready", state?.status === "ready");
    }
  }

  function updateNavigation(state) {
    if (!state) return;
    const distance = Math.max(0, Math.round(state.distance || 0));
    if (detailEl) detailEl.textContent = distance ? `${distance} m hasta la isla` : "Buscando destino";
    if (card && state.status !== "ready") {
      card.hidden = true;
      if (hudLeft) hudLeft.classList.remove("is-arrived");
    }
    if (statusEl) {
      if (state.status === "ready") statusEl.textContent = "Listo para ingresar";
      else if (state.edgeWarning) statusEl.textContent = "Volvé hacia las islas";
      else if (state.status === "near") statusEl.textContent = "Cerca";
      else statusEl.textContent = "Navegando";
    }
  }

  return { setDestination, setIslands, showArrival, updateCompass, updateNavigation };
}

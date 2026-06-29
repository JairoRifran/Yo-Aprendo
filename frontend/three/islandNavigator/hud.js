export function createNavigatorHud(root) {
  const destinationEl = root.querySelector("#islandNavigatorDestination");
  const card = root.querySelector("#islandNavigatorMissionCard");
  const title = root.querySelector("#islandNavigatorMissionTitle");
  const prompt = root.querySelector("#islandNavigatorMissionPrompt");
  const enter = root.querySelector("#islandNavigatorEnterBtn");
  const compass = root.querySelector(".island-navigator-hud-icon .ui-icon");

  function setDestination(mission) {
    if (destinationEl) destinationEl.textContent = mission?.title || "Busca una isla disponible";
    if (card) card.hidden = true;
  }

  function showArrival(mission) {
    if (title) title.textContent = mission?.title || "Micro-misión";
    if (prompt) prompt.textContent = mission?.challenge?.prompt || "Toca entrar para abrir la tarea.";
    if (enter) enter.dataset.missionId = mission?.id || "";
    if (card) card.hidden = false;
  }

  function updateCompass(boat, island) {
    if (!boat || !island || !compass) return;
    const dx = island.position.x - boat.position.x;
    const dz = island.position.z - boat.position.z;
    const angle = Math.atan2(dx, dz);
    compass.style.transform = `rotate(${angle}rad)`;
  }

  return { setDestination, showArrival, updateCompass };
}

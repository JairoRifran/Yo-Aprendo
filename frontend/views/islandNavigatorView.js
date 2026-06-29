import { grade4Data } from "../data/grade4.js";
import { appState } from "../state/appState.js";
import { goToMission, goToWorldMap } from "../utils/navigation.js";
import { playMissionOpen, playUiClick, setAmbientMode } from "../utils/audio.js";
import { uiIcon } from "../utils/icons.js";
import { initIslandNavigatorScene } from "../three/islandNavigator/scene.js";

let islandNavigatorRuntime = null;
let islandNavigatorMountId = 0;

function getCurrentWorld() {
  return (
    grade4Data.worlds.find((world) => world.id === appState.selectedWorldId) ||
    grade4Data.worlds[0] ||
    null
  );
}

export function destroyIslandNavigator() {
  islandNavigatorMountId += 1;
  if (islandNavigatorRuntime?.destroy) {
    islandNavigatorRuntime.destroy();
  }
  islandNavigatorRuntime = null;
}

export function renderIslandNavigator() {
  const appShell = document.querySelector(".app-shell");
  const world = getCurrentWorld();
  if (!appShell || !world) return;

  destroyIslandNavigator();
  setAmbientMode("submap");

  appShell.innerHTML = `
    <main class="island-navigator-screen">
      <section class="island-navigator-stage" aria-label="Navegación 3D de micro-misiones">
        <div class="island-navigator-canvas-wrap" id="islandNavigatorCanvasWrap">
          <div class="island-navigator-loading">
            <strong>Preparando viaje...</strong>
            <span>Bit está revisando el mapa de mini islas.</span>
          </div>
        </div>

        <aside class="island-navigator-hud island-navigator-hud-left" aria-label="Destino actual">
          <span class="island-navigator-hud-icon" aria-hidden="true">${uiIcon("compass")}</span>
          <div>
            <small>Destino actual</small>
            <strong id="islandNavigatorDestination">Busca una isla disponible</strong>
          </div>
        </aside>

        <aside class="island-navigator-hud island-navigator-hud-right" aria-label="Mundo y progreso">
          <button class="island-navigator-icon-btn" id="islandNavigatorBackBtn" type="button" aria-label="Volver al mapa">
            ${uiIcon("arrow-left")}
          </button>
          <div>
            <small>${world.short || "Mundo"}</small>
            <strong>${world.title}</strong>
          </div>
        </aside>

        <section class="island-navigator-mission-card" id="islandNavigatorMissionCard" hidden>
          <div>
            <small>Has llegado</small>
            <strong id="islandNavigatorMissionTitle">Micro-misión</strong>
            <p id="islandNavigatorMissionPrompt">Toca entrar para abrir la tarea.</p>
          </div>
          <button class="btn btn-primary" id="islandNavigatorEnterBtn" type="button">
            Entrar a la misión
          </button>
        </section>
      </section>
    </main>
  `;

  const backBtn = document.getElementById("islandNavigatorBackBtn");
  const enterBtn = document.getElementById("islandNavigatorEnterBtn");
  const canvasWrap = document.getElementById("islandNavigatorCanvasWrap");

  backBtn?.addEventListener("click", () => {
    playUiClick();
    destroyIslandNavigator();
    goToWorldMap();
    window.renderApp();
  });

  enterBtn?.addEventListener("click", () => {
    const missionId = enterBtn.dataset.missionId;
    if (!missionId) return;
    playMissionOpen();
    destroyIslandNavigator();
    goToMission(world.id, missionId);
    window.renderApp();
  });

  if (canvasWrap) {
    const mountId = islandNavigatorMountId;
    const runtime = initIslandNavigatorScene(canvasWrap, {
      world,
      onMissionReady(mission) {
        if (enterBtn) {
          enterBtn.dataset.missionId = mission.id;
        }
      }
    });
    islandNavigatorRuntime = runtime;

    runtime.ready
      .then(() => {
        if (mountId !== islandNavigatorMountId || appState.currentView !== "island-navigator") return;
        canvasWrap.querySelector(".island-navigator-loading")?.remove();
      })
      .catch(() => {
        if (mountId !== islandNavigatorMountId || appState.currentView !== "island-navigator") return;
        const loading = canvasWrap.querySelector(".island-navigator-loading");
        if (loading) {
          loading.innerHTML = `
            <strong>No pudimos abrir la escena 3D.</strong>
            <span>Revisá tu conexión o volvé al mapa para continuar.</span>
          `;
        }
      });
  }
}

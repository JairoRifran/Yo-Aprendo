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
          <div class="island-navigator-mini-map" aria-label="Mini mapa nautico">
            <svg viewBox="0 0 100 100" role="img" aria-label="Mapa de barco e islas">
              <rect class="island-navigator-map-sea" x="4" y="4" width="92" height="92" rx="13"></rect>
              <path class="island-navigator-map-grid" d="M18 9 L18 91 M34 7 L34 93 M50 6 L50 94 M66 7 L66 93 M82 9 L82 91 M9 18 L91 18 M7 34 L93 34 M6 50 L94 50 M7 66 L93 66 M9 82 L91 82"></path>
              <circle class="island-navigator-map-range" cx="50" cy="50" r="39"></circle>
              <path class="island-navigator-map-compass" d="M50 13 L53 24 L50 21 L47 24 Z M50 87 L47 76 L50 79 L53 76 Z M13 50 L24 47 L21 50 L24 53 Z M87 50 L76 53 L79 50 L76 47 Z"></path>
              <line class="island-navigator-map-route" id="islandNavigatorMapRoute" x1="50" y1="50" x2="50" y2="20"></line>
              <g id="islandNavigatorMapIslands"></g>
              <polygon class="island-navigator-map-boat" id="islandNavigatorMapBoat" points="0,-9 6,8 0,5 -6,8"></polygon>
              <circle class="island-navigator-map-target-pulse" id="islandNavigatorMapTargetPulse" cx="50" cy="20" r="5"></circle>
            </svg>
            <span class="island-navigator-map-label" id="islandNavigatorMapHint">Seguí derecho</span>
          </div>
          <div class="island-navigator-hud-copy">
            <small>Destino actual</small>
            <strong id="islandNavigatorDestination">Busca una isla disponible</strong>
            <span class="island-navigator-hud-detail" id="islandNavigatorDetail">Usá WASD o flechas para navegar</span>
            <span class="island-navigator-hud-bearing" id="islandNavigatorBearing">Rumbo N - objetivo al frente</span>
          </div>
        </aside>

        <aside class="island-navigator-hud island-navigator-hud-right" aria-label="Mundo y progreso">
          <button class="island-navigator-icon-btn" id="islandNavigatorBackBtn" type="button" aria-label="Volver al mapa">
            ${uiIcon("arrow-left")}
          </button>
          <div>
            <small>${world.short || "Mundo"}</small>
            <strong>${world.title}</strong>
            <span class="island-navigator-hud-detail" id="islandNavigatorStatus">Navegando</span>
            <button class="island-navigator-reset-btn" id="islandNavigatorResetBtn" type="button">Reubicar barco</button>
          </div>
        </aside>

        <section class="island-navigator-mission-card" id="islandNavigatorMissionCard" hidden>
          <div class="island-navigator-mission-card-copy">
            <small>Listo para desembarcar</small>
            <strong id="islandNavigatorMissionTitle">Micro-misión</strong>
            <p id="islandNavigatorMissionPrompt">Toca entrar para abrir la tarea.</p>
            <dl class="island-navigator-mission-details">
              <div>
                <dt>Vas a aprender</dt>
                <dd id="islandNavigatorMissionLearn">Pensamiento computacional paso a paso.</dd>
              </div>
              <div>
                <dt>Por que completarla</dt>
                <dd id="islandNavigatorMissionWhy">Ayuda a Bit a desbloquear la siguiente parte del mapa.</dd>
              </div>
              <div>
                <dt>Recompensa</dt>
                <dd id="islandNavigatorMissionReward">Monedas y gemas para tu aventura.</dd>
              </div>
            </dl>
          </div>
          <button class="btn btn-primary" id="islandNavigatorEnterBtn" type="button">
            Entrar a la misión
          </button>
        </section>

        <div class="island-navigator-transition" id="islandNavigatorTransition" hidden>
          <div>
            <small>Preparando desafio</small>
            <strong id="islandNavigatorTransitionTitle">Entrando a la mision...</strong>
            <span>El barco llega al muelle y Bit abre la tarea.</span>
          </div>
        </div>
      </section>
    </main>
  `;

  const backBtn = document.getElementById("islandNavigatorBackBtn");
  const enterBtn = document.getElementById("islandNavigatorEnterBtn");
  const canvasWrap = document.getElementById("islandNavigatorCanvasWrap");
  const transitionOverlay = document.getElementById("islandNavigatorTransition");
  const transitionTitle = document.getElementById("islandNavigatorTransitionTitle");

  backBtn?.addEventListener("click", () => {
    playUiClick();
    destroyIslandNavigator();
    goToWorldMap();
    window.renderApp();
  });

  enterBtn?.addEventListener("click", () => {
    const missionId = enterBtn.dataset.missionId;
    if (!missionId) return;
    const missionTitle = enterBtn.dataset.missionTitle || "la mision";
    playMissionOpen();
    enterBtn.disabled = true;
    enterBtn.classList.add("is-transitioning");
    if (transitionTitle) transitionTitle.textContent = `Entrando a ${missionTitle}`;
    if (transitionOverlay) {
      transitionOverlay.hidden = false;
      requestAnimationFrame(() => transitionOverlay.classList.add("is-active"));
    }
    window.setTimeout(() => {
      destroyIslandNavigator();
      goToMission(world.id, missionId);
      window.renderApp();
    }, 820);
  });

  if (canvasWrap) {
    const mountId = islandNavigatorMountId;
    const runtime = initIslandNavigatorScene(canvasWrap, {
      world,
      onMissionReady(mission) {
        if (enterBtn) {
          enterBtn.dataset.missionId = mission.id;
          enterBtn.dataset.missionTitle = mission.title || "la mision";
        }
      }
    });
    islandNavigatorRuntime = runtime;

    runtime.ready
      .then(() => {
        if (mountId !== islandNavigatorMountId || appState.currentView !== "island-navigator") return;
        canvasWrap.querySelector(".island-navigator-loading")?.remove();
      })
      .catch((error) => {
        if (mountId !== islandNavigatorMountId || appState.currentView !== "island-navigator") return;
        console.error("Island navigator scene failed", error);
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

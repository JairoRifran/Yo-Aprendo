import { grade4Data } from "../data/grade4.js";
import { appState } from "../state/appState.js";
import { goToDashboard, goToMission, goToStart, goToSubmap } from "../utils/navigation.js";
import { unlockAudio, playUiClick, playSuccess, playError, playCoinCount } from "../utils/audio.js";
import { uiIcon } from "../utils/icons.js";

const RESULT_ROBOT_ART = "./img/mission-robot-pirate.png";
const RESULT_ROBOT_MODEL = "./img/bit-dance-result.glb";
const RESULT_TOP_PANEL_ART = "./img/path-guided-top-panel.png";

function getResultPlayerName() {
  return appState.session?.display_name?.trim() || appState.currentUserName?.trim() || "explorador";
}

function getNextMission() {
  const world = grade4Data.worlds.find((item) => item.id === appState.selectedWorldId);
  if (!world) return null;

  const missionIndex = world.missions.findIndex((item) => item.id === appState.selectedMissionId);
  if (missionIndex === -1) return null;

  return world.missions[missionIndex + 1] || null;
}

function renderCelebrationParticles() {
  return `
    <div class="result-confetti" aria-hidden="true">
      ${Array.from({ length: 26 }, (_, index) => `
        <span class="result-confetti-piece piece-${(index % 5) + 1}" style="--confetti-left:${4 + (index % 13) * 7}%; --confetti-delay:${index * 0.11}s; --confetti-drift:${(index % 4) - 1.5};"></span>
      `).join("")}
      ${Array.from({ length: 12 }, (_, index) => `
        <span class="result-streamer streamer-${(index % 3) + 1}" style="--streamer-left:${8 + index * 7}%; --streamer-delay:${index * 0.16}s;"></span>
      `).join("")}
    </div>
  `;
}

function renderVictoryScene(result) {
  return `
    <div class="result-victory-scene" aria-hidden="true">
      <span class="result-victory-flash"></span>
      <div class="result-victory-sparkles">
        ${Array.from({ length: 14 }, (_, index) => `
          <span class="result-victory-spark sparkle-${(index % 4) + 1}" style="--spark-left:${14 + (index % 7) * 11}%; --spark-top:${8 + Math.floor(index / 2) * 11}%; --spark-delay:${index * 0.18}s;"></span>
        `).join("")}
      </div>

      <div class="result-victory-reward result-victory-reward-coins">
        <span class="currency-icon gold"></span>
        <strong><span class="result-count-number" data-count-target="${result.coins}" data-count-prefix="+">0</span></strong>
        <small>monedas</small>
      </div>

      <div class="result-victory-reward result-victory-reward-gems">
        <span class="currency-icon gems"></span>
        <strong><span class="result-count-number" data-count-target="${result.gems}" data-count-prefix="+">0</span></strong>
        <small>gemas</small>
      </div>

      <div class="result-victory-robot">
        <span class="result-victory-platform"></span>
        <span class="result-victory-robot-shadow"></span>
        <span class="result-victory-smoke smoke-a"></span>
        <span class="result-victory-smoke smoke-b"></span>
        <span class="result-victory-smoke smoke-c"></span>
        <span class="result-victory-smoke smoke-d"></span>
        <model-viewer
          class="result-robot-model"
          src="${RESULT_ROBOT_MODEL}"
          alt="Bit festejando en 3D"
          autoplay
          interaction-prompt="none"
          shadow-intensity="0"
          exposure="1.08"
          camera-orbit="0deg 78deg 2.35m"
          field-of-view="26deg"
        >
          <img class="result-robot-model-fallback" src="${RESULT_ROBOT_ART}" alt="" />
        </model-viewer>
      </div>
    </div>
  `;
}

function renderFailScene() {
  return `
    <div class="result-fail-scene" aria-hidden="true">
      <span class="result-fail-flash"></span>
      <div class="result-fail-sparkles">
        ${Array.from({ length: 10 }, (_, index) => `
          <span class="result-fail-spark sparkle-${(index % 3) + 1}" style="--spark-left:${18 + (index % 5) * 12}%; --spark-top:${16 + Math.floor(index / 2) * 11}%; --spark-delay:${index * 0.22}s;"></span>
        `).join("")}
      </div>
      <div class="result-fail-portal-glow"></div>
      <div class="result-fail-portal-rings">
        <span class="ring ring-a"></span>
        <span class="ring ring-b"></span>
        <span class="ring ring-c"></span>
        <span class="ring ring-d"></span>
      </div>
      <div class="result-fail-portal-lights">
        <span class="light light-a"></span>
        <span class="light light-b"></span>
        <span class="light light-c"></span>
        <span class="light light-d"></span>
      </div>
      <div class="result-fail-robot">
        <span class="result-fail-platform"></span>
        <span class="result-fail-robot-shadow"></span>
        <span class="result-fail-smoke smoke-a"></span>
        <span class="result-fail-smoke smoke-b"></span>
        <span class="result-fail-smoke smoke-c"></span>
        <span class="result-fail-robot-aura aura-a"></span>
        <span class="result-fail-robot-aura aura-b"></span>
        <span class="result-fail-robot-aura aura-c"></span>
        <img src="${RESULT_ROBOT_ART}" alt="" />
      </div>
    </div>
  `;
}

function animateResultCounters() {
  const counters = document.querySelectorAll("[data-count-target]");
  counters.forEach((node, index) => {
    const target = Number(node.getAttribute("data-count-target") || "0");
    const prefix = node.getAttribute("data-count-prefix") || "";
    const duration = 1050 + index * 180;
    const startAt = performance.now() + 240 + index * 140;

    function tick(now) {
      if (now < startAt) {
        requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = `${prefix}${Math.round(target * eased)}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else if (target > 0) {
        playCoinCount();
      }
    }

    requestAnimationFrame(tick);
  });
}

export function renderResult() {
  const appShell = document.querySelector(".app-shell");
  const result = appState.missionResult;

  if (!appShell || !result) return;

  const playerName = getResultPlayerName();
  const nextMission = result.success ? getNextMission() : null;
  const continueLabel = nextMission ? `Seguir con ${nextMission.title}` : "Volver al submapa";

  unlockAudio();
  if (result.success) {
    playSuccess();
  } else {
    playError();
  }

  appShell.innerHTML = `
    <main class="result-screen result-screen-celebration result-screen-guided ${result.success ? "result-screen-guided-success" : "result-screen-guided-fail"}">
      <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Resultado de la mision">
        <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span>
        <span class="mission-guided-side-copy">
          <strong>Resultado</strong>
          <small>${result.success ? "Mision superada" : "Ajusta y prueba"}</small>
        </span>
        <b><span class="mission-guided-coin-icon" aria-hidden="true"></span>${result.coins || 0}</b>
      </aside>
      <aside class="mission-guided-side-card mission-guided-side-card-right" aria-label="Premios acumulados y volver">
        <span class="mission-guided-wallet">
          <span><i class="mission-guided-coin-icon" aria-hidden="true"></i>${appState.coins}</span>
          <span><i class="mission-guided-gem-icon" aria-hidden="true"></i>${appState.gems}</span>
        </span>
        <button id="resultHudBackBtn" type="button" aria-label="Volver a las islas de secuencias">
          <span class="mission-guided-back-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
          <small>Volver</small>
        </button>
      </aside>
      <section class="mission-guided-top result-guided-top" aria-label="Estado del resultado">
        <img src="${RESULT_TOP_PANEL_ART}" alt="" aria-hidden="true" />
        <div class="mission-guided-top-copy">
          <h1>${result.title}</h1>
          <p>${result.message}</p>
          <div class="mission-guided-progress result-guided-progress">
            <span class="mission-guided-star" aria-hidden="true"></span>
            <strong>${result.success ? "Recompensa" : "Intento"}</strong>
            <div class="mission-guided-progress-track">
              <span style="width:${result.success ? 100 : 35}%;"></span>
            </div>
            <b>${result.success ? `${result.coins || 0} / ${result.gems || 0}` : "0 / 1"}</b>
          </div>
        </div>
      </section>
      <section class="result-panel ${result.success ? "result-panel-success" : "result-panel-fail"}">
        ${result.success ? renderCelebrationParticles() : ""}

        ${
          result.success
            ? `
              <div class="result-victory-layout">
                <div class="result-victory-copy result-copy-shell">
                  <div class="eyebrow">Resultado</div>
                  <h1>${result.title}</h1>
                  <p class="result-lead">${result.message}</p>
                  <p class="result-cheer">${playerName}, lo hiciste genial. El robot festeja contigo y te anima a seguir con las demas misiones.</p>

                  <div class="result-next-note">
                    <strong>Sigue explorando</strong>
                    <span>${nextMission ? `Tu siguiente reto es ${nextMission.title}. Vamos por la proxima mision.` : "Todavia puedes explorar mas retos en esta isla."}</span>
                  </div>
                </div>
                ${renderVictoryScene(result)}
              </div>
            `
            : `
              <div class="result-fail-layout">
                <div class="result-fail-copy result-copy-shell">
                  <div class="eyebrow">Resultado</div>
                  <h1>${result.title}</h1>
                  <p class="result-lead">${result.message}</p>
                  <p class="result-cheer">${playerName}, no pasa nada. Mira un paso con calma, prueba otra vez y veras que el robot puede lograrlo.</p>

                  <div class="result-fail-note">
                    <strong>Probemos de nuevo</strong>
                    <span>Revisa el orden, cambia una sola parte y vuelve a probar. A veces un ajuste pequeno hace toda la diferencia.</span>
                  </div>
                </div>
                ${renderFailScene()}
              </div>
            `
        }

        <div class="mission-actions result-actions">
          ${
            result.success
              ? `
                <button id="backToSubmapBtn" class="btn btn-secondary">Volver al submapa</button>
                <button id="continueMissionBtn" class="btn btn-primary">${continueLabel}</button>
              `
              : `<button id="retryMissionBtn" class="btn btn-primary">Intentar otra vez</button>`
          }
        </div>
      </section>
    </main>
  `;

  if (result.success) {
    animateResultCounters();

    document.getElementById("resultHudBackBtn")?.addEventListener("click", () => {
      playUiClick();
      goToSubmap(appState.selectedWorldId);
      window.renderApp();
    });

    document.getElementById("backToSubmapBtn")?.addEventListener("click", () => {
      playUiClick();
      goToSubmap(appState.selectedWorldId);
      window.renderApp();
    });

    document.getElementById("continueMissionBtn")?.addEventListener("click", () => {
      playUiClick();
      if (nextMission) {
        goToMission(appState.selectedWorldId, nextMission.id);
      } else {
        goToSubmap(appState.selectedWorldId);
      }
      window.renderApp();
    });
  } else {
    document.getElementById("resultHudBackBtn")?.addEventListener("click", () => {
      playUiClick();
      goToSubmap(appState.selectedWorldId);
      window.renderApp();
    });

    document.getElementById("retryMissionBtn")?.addEventListener("click", () => {
      playUiClick();
      goToMission(appState.selectedWorldId, appState.selectedMissionId);
      window.renderApp();
    });
  }

  document.getElementById("openDashboardBtn")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    goToDashboard("student");
    window.renderApp();
  });

  document.getElementById("goHomeBtn")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    goToStart();
    window.renderApp();
  });
}

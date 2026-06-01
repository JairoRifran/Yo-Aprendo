import { grade4Data } from "../data/grade4.js";
import { appState } from "../state/appState.js";
import { goToDashboard, goToMission, goToStart, goToWorldMap } from "../utils/navigation.js";
import { getMissionState, getWorldProgress } from "../utils/progress.js";
import { unlockAudio, playUiClick, playHoverTick, playSelect } from "../utils/audio.js";

const SUBMAP_VISUALS = [
  { x: 13, y: 65, size: 154, art: "./img/start-island-treasure.png", depth: 5 },
  { x: 43, y: 71, size: 148, art: "./img/mision1.png", depth: 5 },
  { x: 67, y: 69, size: 144, art: "./img/mision2.png", depth: 5 },
  { x: 74, y: 52, size: 154, art: "./img/mision3.png", depth: 4 },
  { x: 62, y: 31, size: 164, art: "./img/start-waterfall-island.png", depth: 3 },
  { x: 42, y: 48, size: 158, art: "./img/mision2.png", depth: 4 },
  { x: 19, y: 42, size: 164, art: "./img/mision4.png", depth: 4 }
];

function getMissionStatusLabel(state) {
  if (state === "completed") return "Completada";
  if (state === "available") return "Disponible";
  return "Bloqueada";
}

function getMissionStatusClass(state) {
  if (state === "completed") return "is-completed";
  if (state === "available") return "is-available";
  return "is-locked";
}

function getSelectedMission(world) {
  const selectedId = appState.selectedMissionId;
  if (selectedId) {
    const selected = world.missions.find((mission) => mission.id === selectedId);
    if (selected) return selected;
  }

  return world.missions.find((mission, index) => {
    const state = getMissionState(world, index, grade4Data.worlds);
    return state === "available";
  }) || world.missions[0] || null;
}

function getSubmapGuideCopy(world, selectedMission, worldProgress) {
  const copies = {
    "world-sequences": {
      title: "Bit te explica",
      body:
        "Esta isla ensena secuencias: ordenar pasos para cumplir una meta. Un algoritmo claro dice que accion va primero, cual viene despues y como llegar al resultado.",
      now:
        "Elige una mini isla disponible y entra a la mision para recuperar energia del faro."
    },
    "world-loops": {
      title: "Bit te explica",
      body:
        "Esta isla ensena bucles: cuando una accion se repite, puedes convertir muchos pasos en una instruccion mas corta.",
      now:
        "Elige una mision, detecta la repeticion y arma el bucle."
    },
    "world-decisions": {
      title: "Bit te explica",
      body:
        "Esta isla ensena decisiones: si una condicion se cumple, eliges una accion; si no, eliges otra.",
      now:
        "Elige una mision y compara las opciones antes de decidir."
    },
    "world-data": {
      title: "Bit te explica",
      body:
        "Esta isla ensena datos: ordenar, clasificar y comparar informacion para crear una solucion.",
      now:
        "Elige una mision, organiza las pistas y usa la informacion para avanzar."
    }
  };

  const copy = copies[world.id] || copies["world-sequences"];
  return {
    ...copy,
    reward: `Ruta: ${worldProgress.completed}/${worldProgress.total}. Hasta ${world.reward.coins} monedas y ${world.reward.gems} gemas.`,
    selected: selectedMission
      ? `Siguiente reto sugerido: ${selectedMission.title}.`
      : "Selecciona una mision para ver su reto."
  };
}

function getMissionNodes(world) {
  return world.missions.map((mission, index) => {
    const visual = SUBMAP_VISUALS[index] || SUBMAP_VISUALS[SUBMAP_VISUALS.length - 1];
    return {
      ...mission,
      ...visual,
      index,
      missionState: getMissionState(world, index, grade4Data.worlds)
    };
  });
}

function renderMapNode(node, isSelected) {
  return `
    <div
      class="submap-v2-node ${getMissionStatusClass(node.missionState)} ${isSelected ? "is-selected" : ""}"
      style="left:${node.x}%; top:${node.y}%; width:${node.size}px; z-index:${node.depth}; --node-order:${node.index};"
    >
      <button
        class="submap-v2-node-button"
        type="button"
        data-mission-id="${node.id}"
        aria-label="${node.title}"
      >
        <span class="submap-v2-node-aura" aria-hidden="true"></span>
        <span class="submap-v2-node-focus-ring" aria-hidden="true"></span>
        <img class="submap-v2-node-art" src="${node.art}" alt="" />
        <span class="submap-v2-node-badge">${node.number || node.index + 1}</span>
        <span class="submap-v2-node-status">${getMissionStatusLabel(node.missionState)}</span>
        ${
          node.missionState === "locked"
            ? '<span class="submap-v2-node-lock" aria-hidden="true">🔒</span>'
            : ""
        }
      </button>
    </div>
  `;
}

export function renderSubmap() {
  const world = grade4Data.worlds.find((entry) => entry.id === appState.selectedWorldId);
  const appShell = document.querySelector(".app-shell");

  if (!world || !appShell) return;

  const worldProgress = getWorldProgress(world);
  const selectedMission = getSelectedMission(world);
  const missionNodes = getMissionNodes(world);
  const selectedNode =
    missionNodes.find((node) => node.id === selectedMission?.id) || missionNodes[0] || null;
  const guideCopy = getSubmapGuideCopy(world, selectedNode, worldProgress);

  appShell.innerHTML = `
    <header class="topbar submap-v2-topbar submap-v2-hidden-topbar">
      <div class="topbar-left submap-v2-topbar-left">
        <div class="pill level-pill submap-v2-level-pill">
          <span class="mission-header-badge">★</span>
          <span>Nivel 4</span>
        </div>
        <span class="mission-header-chevron" aria-hidden="true">›</span>
        <div class="pill title-pill mission-header-pill mission-header-pill-title submap-v2-title-pill">
          <img class="submap-v2-pill-art" src="./img/start-island-treasure.png" alt="" />
          <span>${world.title}</span>
        </div>
      </div>

      <div class="topbar-right submap-v2-topbar-right">
        <button class="pill nav-pill mission-header-pill" id="goHomeBtn" type="button">
          <span class="mission-header-icon">⌂</span>
          <span>Inicio</span>
        </button>
        <button class="pill nav-pill mission-header-pill" id="openDashboardBtn" type="button">
          <span class="mission-header-icon">▦</span>
          <span>Paneles</span>
        </button>
        <div class="pill currency-pill mission-header-pill">
          <span class="currency-icon gold"></span>
          <span>${appState.coins}</span>
        </div>
        <div class="pill currency-pill mission-header-pill">
          <span class="currency-icon gems"></span>
          <span>${appState.gems}</span>
        </div>
      </div>
    </header>

    <main class="submap-v2-screen submap-v2-fullscreen">
      <aside class="mission-guided-side-card mission-guided-side-card-left submap-v2-hud-card submap-v2-hud-card-left" aria-label="Mundo actual">
        <span class="mission-guided-map-icon" aria-hidden="true"></span>
        <span class="mission-guided-side-copy">
          <strong>Nivel 4</strong>
          <small>${world.title}</small>
        </span>
      </aside>
      <aside class="mission-guided-side-card mission-guided-side-card-right submap-v2-hud-card submap-v2-hud-card-right" aria-label="Navegacion y premios">
        <span class="mission-guided-wallet">
          <span><i class="mission-guided-coin-icon" aria-hidden="true"></i><span>${appState.coins}</span></span>
          <span><i class="mission-guided-gem-icon" aria-hidden="true"></i><span>${appState.gems}</span></span>
        </span>
        <button id="submapHudHomeBtn" type="button" aria-label="Inicio">
          <span class="mission-guided-map-icon" aria-hidden="true"></span>
          <small>Inicio</small>
        </button>
        <button id="submapHudDashboardBtn" type="button" aria-label="Paneles">
          <span class="mission-guided-grid-icon" aria-hidden="true"></span>
          <small>Paneles</small>
        </button>
      </aside>
      <section class="submap-v2-layout">
        <div class="submap-v2-stage">
          <div class="submap-v2-scene-backdrop"></div>
          <div class="submap-v2-sunbeam"></div>
          <div class="submap-v2-ambient" aria-hidden="true">
            <span class="submap-v2-bird bird-a"></span>
            <span class="submap-v2-bird bird-b"></span>
            <span class="submap-v2-bird bird-c"></span>
            <span class="submap-v2-bird bird-d"></span>
            <span class="submap-v2-bird bird-e"></span>
            <span class="submap-v2-bird bird-f"></span>
            <span class="submap-v2-bird bird-g"></span>
            <span class="submap-v2-bird bird-h"></span>
            <span class="submap-v2-glow glow-a"></span>
            <span class="submap-v2-glow glow-b"></span>
            <span class="submap-v2-glow glow-c"></span>
            <span class="submap-v2-glow glow-d"></span>
            <span class="submap-v2-ripple ripple-a"></span>
            <span class="submap-v2-ripple ripple-b"></span>
            <span class="submap-v2-ripple ripple-c"></span>
            <span class="submap-v2-ripple ripple-d"></span>
            <span class="submap-v2-ripple ripple-e"></span>
            <span class="submap-v2-breeze breeze-a"></span>
            <span class="submap-v2-breeze breeze-b"></span>
            <span class="submap-v2-breeze breeze-c"></span>
          </div>

          <div class="submap-v2-node-layer">
            ${missionNodes.map((node) => renderMapNode(node, node.id === selectedNode?.id)).join("")}
          </div>

          <div class="submap-v2-stage-callout">
            <span class="submap-v2-callout-icon">🧭</span>
            <span>Explorá las mini islas y elegí tu próxima misión.</span>
          </div>
        </div>

        <aside class="submap-v2-sidebar">
          <section class="submap-v2-card submap-v2-world-card">
            <div class="eyebrow">Mundo</div>
            <div class="submap-v2-world-head">
              <div>
                <h1>${world.title}</h1>
                <p>${world.description}</p>
              </div>
              <img class="submap-v2-world-art" src="./img/start-island-treasure.png" alt="" />
            </div>
            <div class="submap-v2-progress-chip">
              <span>Progreso</span>
              <strong>${worldProgress.completed}/${worldProgress.total}</strong>
            </div>
          </section>

          <section class="submap-v2-guide-card" id="submapGuideCard">
            <button
              class="submap-v2-guide-robot-button"
              id="submapGuideRobotBtn"
              type="button"
              aria-expanded="false"
              aria-controls="submapGuideBubble"
              aria-label="Abrir ayuda de Bit"
            >
              <img class="submap-v2-guide-robot" src="./img/mission-robot-pirate.png" alt="" />
              <span>Bit</span>
            </button>

            <div class="submap-v2-guide-copy" id="submapGuideBubble" role="status" aria-live="polite">
              <div class="submap-v2-guide-head">
                <div>
                  <div class="eyebrow">${guideCopy.title}</div>
                  <h2 id="submapGuideTitle">Que hago ahora?</h2>
                </div>
                <span class="submap-v2-guide-step" id="submapGuideStep">1/4</span>
              </div>
              <p id="submapGuideBody">${guideCopy.body}</p>

              <div class="submap-v2-dialog-mission" id="submapGuideMission">
                <div class="submap-v2-selected-number">${selectedNode?.number || 1}</div>
                <div class="submap-v2-selected-copy">
                  <h3 id="submapDialogMissionTitle">${selectedNode?.title || "Elegi una mision"}</h3>
                  <p id="submapDialogMissionDescription">
                    ${selectedNode?.challenge?.prompt || "Haz click en una mision para viajar a su isla."}
                  </p>
                  <p class="submap-v2-selected-status" id="submapDialogMissionStatus">
                    Estado: <strong>${selectedNode ? getMissionStatusLabel(selectedNode.missionState) : "-"}</strong>
                  </p>
                </div>
              </div>

              <div class="submap-v2-dialog-footer" id="submapGuideFooter">
                <div class="submap-v2-reward-grid" id="submapDialogRewardLine">
                  <div class="submap-v2-reward-pill">
                    <span class="currency-icon gold"></span>
                    <strong>${selectedNode?.coins || 0}</strong>
                  </div>
                  <div class="submap-v2-reward-pill">
                    <span class="currency-icon gems"></span>
                    <strong>${selectedNode?.gems || 0}</strong>
                  </div>
                </div>
                <div class="submap-v2-action-row">
                  <button
                    id="dialogEnterMissionBtn"
                    class="btn btn-primary submap-v2-enter-btn"
                    type="button"
                    ${!selectedNode || selectedNode.missionState === "locked" ? "disabled" : ""}
                  >
                    Entrar mision
                  </button>
                  <button id="dialogBackToWorldMapBtn" class="btn btn-secondary submap-v2-back-btn" type="button">
                    Volver
                  </button>
                </div>
              </div>

              <button class="submap-v2-guide-next-btn" id="submapGuideNextBtn" type="button">
                Seguir leyendo
              </button>
            </div>
          </section>

          <section class="submap-v2-card submap-v2-selected-card ${selectedNode ? getMissionStatusClass(selectedNode.missionState) : ""}">
            <div class="eyebrow">Misión seleccionada</div>
            <div class="submap-v2-selected-body">
              <div class="submap-v2-selected-number">${selectedNode?.number || 1}</div>
              <div class="submap-v2-selected-copy">
                <h2 id="submapMissionTitle">${selectedNode?.title || "Elegí una misión"}</h2>
                <p id="submapMissionDescription">
                  ${selectedNode?.challenge?.prompt || "Hacé click en una misión para viajar a su isla."}
                </p>
                <p class="submap-v2-selected-status" id="submapMissionStatus">
                  Estado: <strong>${selectedNode ? getMissionStatusLabel(selectedNode.missionState) : "-"}</strong>
                </p>
              </div>
              <img class="submap-v2-selected-robot" src="./img/mission-robot-pirate.png" alt="" />
            </div>

            <div class="submap-v2-action-row">
              <button
                id="enterMissionBtn"
                class="btn btn-primary submap-v2-enter-btn"
                type="button"
                ${!selectedNode || selectedNode.missionState === "locked" ? "disabled" : ""}
              >
                Entrar misión
              </button>
              <button id="backToWorldMapBtn" class="btn btn-secondary submap-v2-back-btn" type="button">
                Volver
              </button>
            </div>
          </section>

          <section class="submap-v2-card submap-v2-reward-card">
            <div class="eyebrow">Recompensas</div>
            <div class="submap-v2-reward-grid" id="submapRewardLine">
              <div class="submap-v2-reward-pill">
                <span class="currency-icon gold"></span>
                <strong>${selectedNode?.coins || 0}</strong>
              </div>
              <div class="submap-v2-reward-pill">
                <span class="currency-icon gems"></span>
                <strong>${selectedNode?.gems || 0}</strong>
              </div>
            </div>
          </section>

          <section class="submap-v2-card submap-v2-adventure-card">
            <div class="eyebrow">Aventura</div>
            <div class="submap-v2-adventure-body">
              <div>
                <p>
                  El bote llega al archipiélago y la ruta destaca la misión elegida para que
                  el recorrido se sienta más claro y jugable.
                </p>
              </div>
              <img class="submap-v2-adventure-art" src="./img/barco.png" alt="" />
            </div>
          </section>
        </aside>
      </section>
    </main>
  `;

  const goHomeBtn = document.getElementById("submapHudHomeBtn") || document.getElementById("goHomeBtn");
  const openDashboardBtn = document.getElementById("submapHudDashboardBtn") || document.getElementById("openDashboardBtn");
  const enterMissionBtn = document.getElementById("enterMissionBtn");
  const backToWorldMapBtn = document.getElementById("backToWorldMapBtn");
  const dialogEnterMissionBtn = document.getElementById("dialogEnterMissionBtn");
  const dialogBackToWorldMapBtn = document.getElementById("dialogBackToWorldMapBtn");
  const missionButtons = Array.from(document.querySelectorAll(".submap-v2-node-button"));
  const missionTitleEl = document.getElementById("submapMissionTitle");
  const missionDescriptionEl = document.getElementById("submapMissionDescription");
  const missionStatusEl = document.getElementById("submapMissionStatus");
  const rewardLineEl = document.getElementById("submapRewardLine");
  const dialogMissionTitleEl = document.getElementById("submapDialogMissionTitle");
  const dialogMissionDescriptionEl = document.getElementById("submapDialogMissionDescription");
  const dialogMissionStatusEl = document.getElementById("submapDialogMissionStatus");
  const dialogRewardLineEl = document.getElementById("submapDialogRewardLine");
  const guideCardEl = document.getElementById("submapGuideCard");
  const guideRobotBtn = document.getElementById("submapGuideRobotBtn");
  const guideTitleEl = document.getElementById("submapGuideTitle");
  const guideBodyEl = document.getElementById("submapGuideBody");
  const guideStepEl = document.getElementById("submapGuideStep");
  const guideNextBtn = document.getElementById("submapGuideNextBtn");
  const selectedCardEl = document.querySelector(".submap-v2-selected-card");

  let activeMissionId = selectedNode?.id || null;
  let guidePage = 0;
  let guidePages = [];

  function createGuidePages(node) {
    const status = node ? getMissionStatusLabel(node.missionState).toLowerCase() : "sin elegir";
    const missionText = node?.challenge?.prompt || "Haz click en una mini isla para elegir el proximo reto.";
    const rewardText = node
      ? `Si completas esta mision puedes ganar ${node.coins || 0} monedas y ${node.gems || 0} gemas.`
      : guideCopy.reward;

    return [
      {
        title: "La historia del faro",
        body: guideCopy.body
      },
      {
        title: "Que hago ahora?",
        body: guideCopy.now
      },
      {
        title: node ? node.title : "Elige una mision",
        body: `${missionText} Estado actual: ${status}.`
      },
      {
        title: "Premios y viaje",
        body: `${rewardText} Cuando estes listo, entra a la mision para seguir reparando el faro.`,
        final: true
      }
    ];
  }

  function renderGuidePage(nextPage = guidePage) {
    guidePages = guidePages.length ? guidePages : createGuidePages(selectedNode);
    guidePage = Math.max(0, Math.min(nextPage, guidePages.length - 1));
    const page = guidePages[guidePage];

    if (guideTitleEl) guideTitleEl.textContent = page.title;
    if (guideBodyEl) guideBodyEl.textContent = page.body;
    if (guideStepEl) guideStepEl.textContent = `${guidePage + 1}/${guidePages.length}`;
    if (guideNextBtn) {
      guideNextBtn.textContent =
        guidePage < guidePages.length - 1 ? "Seguir leyendo" : "Volver al inicio";
    }
    guideCardEl?.classList.toggle("is-final", Boolean(page.final));
  }

  function updateSelectedMission(nextMissionId) {
    const node = missionNodes.find((entry) => entry.id === nextMissionId) || null;
    activeMissionId = node?.id || null;

    missionButtons.forEach((button) => {
      const isSelected = button.dataset.missionId === activeMissionId;
      button.closest(".submap-v2-node")?.classList.toggle("is-selected", isSelected);
    });

    selectedCardEl?.classList.remove("is-locked", "is-available", "is-completed");

    if (!node) {
      missionTitleEl.textContent = "Elegí una misión";
      missionDescriptionEl.textContent = "Hacé click en una misión para viajar a su isla.";
      missionStatusEl.innerHTML = "Estado: <strong>-</strong>";
      if (dialogMissionTitleEl) dialogMissionTitleEl.textContent = "Elegi una mision";
      if (dialogMissionDescriptionEl) dialogMissionDescriptionEl.textContent = "Haz click en una mision para viajar a su isla.";
      if (dialogMissionStatusEl) dialogMissionStatusEl.innerHTML = "Estado: <strong>-</strong>";
      rewardLineEl.innerHTML = `
        <div class="submap-v2-reward-pill"><span class="currency-icon gold"></span><strong>0</strong></div>
        <div class="submap-v2-reward-pill"><span class="currency-icon gems"></span><strong>0</strong></div>
      `;
      if (dialogRewardLineEl) dialogRewardLineEl.innerHTML = rewardLineEl.innerHTML;
      enterMissionBtn.disabled = true;
      if (dialogEnterMissionBtn) dialogEnterMissionBtn.disabled = true;
      guidePages = createGuidePages(null);
      renderGuidePage(0);
      return;
    }

    selectedCardEl?.classList.add(getMissionStatusClass(node.missionState));
    missionTitleEl.textContent = node.title;
    missionDescriptionEl.textContent =
      node.challenge?.prompt || `Dificultad: ${node.difficulty || "Inicial"}`;
    missionStatusEl.innerHTML = `Estado: <strong>${getMissionStatusLabel(node.missionState)}</strong>`;
    if (dialogMissionTitleEl) dialogMissionTitleEl.textContent = node.title;
    if (dialogMissionDescriptionEl) {
      dialogMissionDescriptionEl.textContent =
        node.challenge?.prompt || `Dificultad: ${node.difficulty || "Inicial"}`;
    }
    if (dialogMissionStatusEl) {
      dialogMissionStatusEl.innerHTML = `Estado: <strong>${getMissionStatusLabel(node.missionState)}</strong>`;
    }
    rewardLineEl.innerHTML = `
      <div class="submap-v2-reward-pill">
        <span class="currency-icon gold"></span>
        <strong>${node.coins || 0}</strong>
      </div>
      <div class="submap-v2-reward-pill">
        <span class="currency-icon gems"></span>
        <strong>${node.gems || 0}</strong>
      </div>
    `;
    if (dialogRewardLineEl) dialogRewardLineEl.innerHTML = rewardLineEl.innerHTML;
    enterMissionBtn.disabled = node.missionState === "locked";
    if (dialogEnterMissionBtn) dialogEnterMissionBtn.disabled = node.missionState === "locked";
    guidePages = createGuidePages(node);
    renderGuidePage(0);
  }

  function onMissionSelect(event) {
    unlockAudio();
    const node = missionNodes.find((entry) => entry.id === event.currentTarget.dataset.missionId);
    if (!node) return;

    updateSelectedMission(node.id);

    if (node.missionState === "locked") {
      playSelect();
      return;
    }

    playUiClick();
    goToMission(world.id, node.id);
    window.renderApp();
  }

  function onMissionHover() {
    unlockAudio();
    playHoverTick();
  }

  function onEnterMission() {
    const node = missionNodes.find((entry) => entry.id === activeMissionId);
    if (!node || node.missionState === "locked") return;

    playUiClick();
    goToMission(world.id, node.id);
    window.renderApp();
  }

  function onBack() {
    playUiClick();
    goToWorldMap();
    window.renderApp();
  }

  function onOpenDashboard() {
    unlockAudio();
    playUiClick();
    goToDashboard("student");
    window.renderApp();
  }

  function onGoHome() {
    unlockAudio();
    playUiClick();
    goToStart();
    window.renderApp();
  }

  missionButtons.forEach((button) => {
    button.addEventListener("click", onMissionSelect);
    button.addEventListener("mouseenter", onMissionHover);
    button.addEventListener("focus", onMissionHover);
  });

  enterMissionBtn?.addEventListener("click", onEnterMission);
  backToWorldMapBtn?.addEventListener("click", onBack);
  dialogEnterMissionBtn?.addEventListener("click", onEnterMission);
  dialogBackToWorldMapBtn?.addEventListener("click", onBack);
  guideRobotBtn?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    const isOpen = !guideCardEl?.classList.contains("is-open");
    guideCardEl?.classList.toggle("is-open", isOpen);
    guideRobotBtn.setAttribute("aria-expanded", String(isOpen));
  });
  guideNextBtn?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    const nextPage = guidePage < guidePages.length - 1 ? guidePage + 1 : 0;
    renderGuidePage(nextPage);
  });
  openDashboardBtn?.addEventListener("click", onOpenDashboard);
  goHomeBtn?.addEventListener("click", onGoHome);

  updateSelectedMission(activeMissionId);
}

import { grade4Data } from "./data/grade4.js";
import { appState } from "./state/appState.js";
import { loadProgress, loadSession } from "./utils/storage.js";
import { goToDashboard, goToStart, goToSubmap } from "./utils/navigation.js";
import { renderSubmap } from "./views/submapView.js";
import { renderMission } from "./views/missionView.js";
import { renderResult } from "./views/resultView.js";
import { renderDashboard } from "./views/dashboardView.js";
import { renderStart } from "./views/startView.js";
import {
  isMissionCompleted,
  getWorldProgress,
  getWorldState,
  syncWalletWithProgress
} from "./utils/progress.js";
import {
  unlockAudio,
  playUiClick,
  playHoverTick,
  playSelect,
  playAmbient,
  setAmbientMode
} from "./utils/audio.js";
import { uiIcon } from "./utils/icons.js";

const worlds = grade4Data.worlds;
let hasGlobalAudioUnlock = false;

const saved = loadProgress();
const savedSession = loadSession();

if (saved) {
  appState.progress = saved.progress || appState.progress;
  appState.coins = saved.coins ?? appState.coins;
  appState.gems = saved.gems ?? appState.gems;
}

syncWalletWithProgress();

if (savedSession) {
  appState.currentUserRole = savedSession.currentUserRole || appState.currentUserRole;
  appState.currentUserName = savedSession.currentUserName || appState.currentUserName;
  appState.currentAccessCode = savedSession.currentAccessCode || appState.currentAccessCode;
  appState.selectedDashboardRole = savedSession.selectedDashboardRole || appState.selectedDashboardRole;
  appState.startAccessMode = savedSession.startAccessMode || appState.startAccessMode;
  appState.session = savedSession.session || appState.session;
}

let animationFrameId = null;
let detachWorldMapEvents = null;

/* =========================
   GLOBAL VISUAL SETTINGS
========================= */
const ISLAND_IMAGE_SCALE = 1.82;
const ISLAND_HITBOX_PADDING = 18;

const WORLD_CANVAS_LAYOUT = [
  { x: 0.22, y: 0.66, island: 0.98, deco: "garden", labelOffsetX: 8, labelOffsetY: 22 },
  { x: 0.43, y: 0.60, island: 0.95, deco: "mill", labelOffsetX: -8, labelOffsetY: 22 },
  { x: 0.64, y: 0.64, island: 0.98, deco: "totem", labelOffsetX: 0, labelOffsetY: 24 },
  { x: 0.79, y: 0.71, island: 1.0, deco: "house", labelOffsetX: -8, labelOffsetY: -34 }
];

/*
  Guía del eje del muelle.
*/
/*
  Posiciones finales.
  3 y 4 pasan al otro lado del camino como pediste.
  Todas con el mismo tamaño visual base que la 1.
*/
/* =========================
   ASSETS
========================= */
const worldImages = {
  mision1: new Image(),
  mision2: new Image(),
  mision3: new Image(),
  mision4: new Image()
};

worldImages.mision1.src = "./img/mision1.png";
worldImages.mision2.src = "./img/mision2.png";
worldImages.mision3.src = "./img/mision3.png";
worldImages.mision4.src = "./img/mision4.png";

const WORLD_STORY_COPY = {
  "world-sequences": {
    chapter: "Capitulo 1: La ruta despierta",
    story:
      "El Archipielago del Codigo perdio la energia de sus faros. Para encender el primero, {playerName} y Bit deben descubrir que toda aventura empieza con una secuencia: pasos claros, en el orden correcto.",
    theory:
      "Una secuencia es un algoritmo simple: una lista de instrucciones que se ejecutan una tras otra. Si cambiamos el orden, cambia el resultado.",
    objective:
      "Ordena acciones, encuentra errores y crea rutas paso a paso."
  },
  "world-loops": {
    chapter: "Capitulo 2: El molino de los patrones",
    story:
      "En esta isla, las olas, las aspas y las huellas repiten movimientos. El robot aprende a no dar la misma orden una y otra vez: puede usar bucles para ahorrar energia.",
    theory:
      "Un bucle repite una instruccion o grupo de instrucciones varias veces. Sirve cuando aparece un patron y queremos escribir menos pasos.",
    objective:
      "Detecta repeticiones y conviertelas en instrucciones mas cortas."
  },
  "world-decisions": {
    chapter: "Capitulo 3: Las puertas que piensan",
    story:
      "Los caminos se dividen y cada puerta pide una regla. Sofi debe leer las pistas del entorno para decidir: si pasa algo, toma un camino; si no, toma otro.",
    theory:
      "Una decision usa condiciones. En programacion se parece a decir: si se cumple esta regla, hago una accion; si no, hago otra.",
    objective:
      "Elige reglas, compara casos y resuelve caminos alternativos."
  },
  "world-data": {
    chapter: "Capitulo 4: El mapa de la creacion",
    story:
      "Para reparar el gran faro final, la tripulacion necesita ordenar objetos, contar pistas y transformar informacion en una solucion propia.",
    theory:
      "Los datos son informacion que podemos clasificar, contar y comparar. Cuando los organizamos bien, nos ayudan a tomar mejores decisiones.",
    objective:
      "Clasifica, cuenta, compara y crea una respuesta para toda la isla."
  }
};

function getWorldStoryCopy(world) {
  return WORLD_STORY_COPY[world?.id] || {
    chapter: "Nuevo capitulo",
    story:
      "Cada isla guarda una parte del pensamiento computacional. Explorarla ayuda al robot a recuperar el mapa completo.",
    theory:
      "Pensar como programador significa dividir un problema en partes, probar ideas y mejorar la solucion paso a paso.",
    objective: "Explora misiones y desbloquea el siguiente aprendizaje."
  };
}

const imageCropCache = new WeakMap();

function getImageOpaqueBounds(img) {
  if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) {
    return null;
  }

  const cached = imageCropCache.get(img);
  if (cached) return cached;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = img.naturalWidth;
  cropCanvas.height = img.naturalHeight;

  const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
  cropCtx.drawImage(img, 0, 0);

  const { data, width, height } = cropCtx.getImageData(
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  let bounds;

  if (maxX === -1) {
    bounds = { sx: 0, sy: 0, sw: width, sh: height };
  } else {
    const pad = 2;
    bounds = {
      sx: Math.max(0, minX - pad),
      sy: Math.max(0, minY - pad),
      sw: Math.min(width - Math.max(0, minX - pad), maxX - minX + 1 + pad * 2),
      sh: Math.min(height - Math.max(0, minY - pad), maxY - minY + 1 + pad * 2)
    };
  }

  imageCropCache.set(img, bounds);
  return bounds;
}

function getWorldImage(world) {
  if (!world) return null;

  if (world.number === 1) return worldImages.mision1;
  if (world.number === 2) return worldImages.mision2;
  if (world.number === 3) return worldImages.mision3;
  if (world.number === 4) return worldImages.mision4;

  return null;
}

function getWorldById(worldId) {
  return worlds.find((world) => world.id === worldId) || null;
}

function getDefaultWorld() {
  return (
    getWorldById(appState.selectedWorldId) ||
    worlds.find((world) => world.status === "current") ||
    worlds[0] ||
    null
  );
}

function getPlayerDisplayName() {
  return appState.session?.display_name?.trim() || appState.currentUserName?.trim() || "explorador";
}

function getMissionProgress(world) {
  return getWorldProgress(world);
}

function getGradeProgress() {
  const allMissions = worlds.flatMap((world) => world.missions);
  const total = allMissions.length;
  const completed = allMissions.filter((mission) => isMissionCompleted(mission.id)).length;

  return {
    completed,
    total,
    percent: total ? (completed / total) * 100 : 0
  };
}

function getWorldVisualStatus(world) {
  const worldIndex = worlds.findIndex((item) => item.id === world.id);
  const state = getWorldState(world, worldIndex, worlds);

  if (state === "completed") return "completed";
  if (state === "current") return "current";
  return "locked";
}

function setupGlobalAudioUnlock() {
  if (hasGlobalAudioUnlock) return;
  hasGlobalAudioUnlock = true;

  const unlock = () => {
    unlockAudio();
    playAmbient("adventure");
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
  };

  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
}

function getWorldStatusText(status) {
  if (status === "completed") return "Completado";
  if (status === "current") return "Disponible ahora";
  if (status === "locked") return "Bloqueado";
  return "Disponible";
}

function destroyWorldMapRuntime() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (detachWorldMapEvents) {
    detachWorldMapEvents();
    detachWorldMapEvents = null;
  }
}

function renderWorldMapShell() {
  const appShell = document.querySelector(".app-shell");
  if (!appShell) return;
  const playerName = getPlayerDisplayName();

  appShell.innerHTML = `
    <header class="topbar world-map-hidden-topbar">
      <div class="topbar-left">
        <div class="pill level-pill"><span class="mission-header-badge ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span><span>Nivel 4</span></div>
        <div class="pill title-pill"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("map")}</span><span>Mundos de 4.º</span></div>
      </div>

      <div class="topbar-right">
        <button class="pill nav-pill" id="goHomeBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("home")}</span><span>Inicio</span></button>
        <button class="pill nav-pill" id="openDashboardBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span><span>Paneles</span></button>
        <div class="pill currency-pill">
          <span class="currency-icon gold"></span>
          <span id="coinsValue">${appState.coins}</span>
        </div>
        <div class="pill currency-pill">
          <span class="currency-icon gems"></span>
          <span id="gemsValue">${appState.gems}</span>
        </div>
      </div>
    </header>

    <main class="layout world-map-full" id="worldMapLayout">
      <section class="scene-panel">
        <div id="sceneWrap">
          <img class="scene-backdrop" src="./img/worlds-ocean-story-bg.png" alt="" />
          <aside class="mission-guided-side-card mission-guided-side-card-left world-map-hud-card world-map-hud-card-left" aria-label="Nivel actual">
            <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("map")}</span>
            <span class="mission-guided-side-copy">
              <strong>Nivel 4</strong>
              <small>Mundos de 4.º</small>
            </span>
          </aside>
          <aside class="mission-guided-side-card mission-guided-side-card-right world-map-hud-card world-map-hud-card-right" aria-label="Navegacion y premios">
            <span class="mission-guided-wallet">
              <span><i class="mission-guided-coin-icon" aria-hidden="true"></i><span id="coinsValue">${appState.coins}</span></span>
              <span><i class="mission-guided-gem-icon" aria-hidden="true"></i><span id="gemsValue">${appState.gems}</span></span>
            </span>
            <button id="goHomeBtn" type="button" aria-label="Inicio">
              <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("home")}</span>
              <small>Inicio</small>
            </button>
            <button id="openDashboardBtn" type="button" aria-label="Paneles">
              <span class="mission-guided-grid-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span>
              <small>Paneles</small>
            </button>
          </aside>
          <canvas id="scene"></canvas>
          <div class="scene-bird-flock" aria-hidden="true">
            <span class="scene-bird bird-a"></span>
            <span class="scene-bird bird-b"></span>
            <span class="scene-bird bird-c"></span>
            <span class="scene-bird bird-d"></span>
            <span class="scene-bird bird-e"></span>
            <span class="scene-bird bird-f"></span>
            <span class="scene-bird bird-g"></span>
          </div>
          <div class="scene-fish-layer" aria-hidden="true">
            <span class="scene-fish fish-a"></span>
            <span class="scene-fish fish-b"></span>
            <span class="scene-fish fish-c"></span>
            <span class="scene-fish fish-d"></span>
          </div>
          <div class="scene-boat-wrap" aria-hidden="true">
            <span class="scene-boat-shadow"></span>
            <span class="scene-boat-wake wake-a"></span>
            <span class="scene-boat-wake wake-b"></span>
            <span class="scene-boat-wake wake-c"></span>
            <img class="scene-boat" src="./img/barco.png" alt="" />
          </div>
          <div class="scene-guide" aria-live="polite">
            <div class="scene-guide-bubble">
              <div class="scene-guide-kicker">Tu guia de aventura</div>
              <strong>Hola, ${playerName}</strong>
              <p id="sceneGuideText">Soy Bit, tu robot explorador. El gran faro del Archipielago del Codigo se apago, y cada isla guarda una idea para repararlo: ordenar, repetir, decidir y crear con datos.</p>
              <button class="scene-guide-help-btn" id="sceneGuideHelpBtn" type="button">Que hago ahora?</button>
            </div>
            <div class="scene-guide-avatar">
              <img src="./img/mission-robot-pirate.png" alt="Robot guia" />
            </div>
          </div>
          <div class="scene-vignette"></div>
          <div class="scene-glow"></div>
          <div class="scene-label">Explorá los mundos de 4.º y elegí tu próxima aventura ✨</div>
        </div>
      </section>

      <aside class="sidebar" id="worldSidebar" aria-hidden="true">
        <div class="sidebar-card mission-card">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px;">
            <div class="eyebrow">Mundo actual</div>
            <button
              id="closeSidebarBtn"
              type="button"
              style="
                border:none;
                cursor:pointer;
                border-radius:12px;
                padding:8px 12px;
                font-weight:800;
                color:#ecf5ff;
                background:linear-gradient(180deg, rgba(33,66,111,0.96), rgba(19,39,71,0.96));
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.18);
              "
            >
              Cerrar
            </button>
          </div>

          <h1 id="missionTitle">Seleccioná un mundo</h1>
          <div id="missionDescription">
            Hacé click en una isla del mapa para ver sus micro-misiones, su progreso y entrar a su aventura.
          </div>

          <div class="action-row" style="margin-top:16px;">
            <button id="playBtn" class="btn btn-primary" disabled>Entrar</button>
            <button class="btn btn-secondary" type="button">Asignar</button>
          </div>
        </div>

        <div class="sidebar-card progress-card">
          <div class="eyebrow">Progreso general</div>
          <div class="progress-stats">
            <div class="stat-box">
              <span class="stat-label">Micro-misiones</span>
              <strong id="completedValue">0 / 28</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label">Racha</span>
              <strong>3 días</strong>
            </div>
          </div>

          <div class="progress-bar">
            <div id="progressFill" class="progress-fill" style="width: 0%;"></div>
          </div>
        </div>

        <div class="sidebar-card tips-card">
          <div class="eyebrow">Consejo</div>
          <p>
            Cada isla representa un mundo de aprendizaje. Entrá a una isla para ver sus micro-misiones y avanzar paso a paso.
          </p>
        </div>
      </aside>
    </main>
  `;
}

function bootstrapWorldMap() {
  const canvas = document.getElementById("scene");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const layout = document.getElementById("worldMapLayout");
  const sidebar = document.getElementById("worldSidebar");

  const missionTitle = document.getElementById("missionTitle");
  const missionDescription = document.getElementById("missionDescription");
  const playBtn = document.getElementById("playBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const openDashboardBtn = document.querySelector(".world-map-hud-card-right #openDashboardBtn") || document.getElementById("openDashboardBtn");
  const goHomeBtn = document.querySelector(".world-map-hud-card-right #goHomeBtn") || document.getElementById("goHomeBtn");
  const sceneGuideHelpBtn = document.getElementById("sceneGuideHelpBtn");
  const sceneGuideText = document.getElementById("sceneGuideText");
  const completedValue = document.getElementById("completedValue");
  const progressFill = document.getElementById("progressFill");

  const tipsCard = document.querySelector(".tips-card p");
  const eyebrow = document.querySelector(".mission-card .eyebrow");
  const sceneLabel = document.querySelector(".scene-label");
  const titlePill = document.querySelector(".title-pill");

  if (playBtn) playBtn.textContent = "Entrar";
  if (eyebrow) eyebrow.textContent = "Mundo actual";
  if (sceneLabel) sceneLabel.textContent = "Recupera el mapa del codigo: cada isla enseÃ±a una pieza de la aventura";
  if (titlePill) {
    titlePill.innerHTML =
      `<span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("map")}</span><span>Mundos de 4.º</span>`;
  }
  if (sceneLabel) sceneLabel.textContent = "Explorá los mundos de 4.º y elegí tu próxima aventura ✨";
  if (tipsCard) {
    tipsCard.textContent =
      "Cada isla representa un mundo de aprendizaje. Entrá a una isla para ver sus micro-misiones y avanzar paso a paso.";
  }

  if (sceneLabel) sceneLabel.textContent = "Recupera el mapa del codigo: cada isla ensena una pieza de la aventura";
  if (tipsCard) {
    tipsCard.textContent =
      "La historia avanza con cada mision: primero ordenas pasos, despues reconoces patrones, luego tomas decisiones y finalmente usas datos para crear soluciones.";
  }

  let selectedWorld = null;
  let hoveredWorld = null;
  let time = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const worldFx = {};
  worlds.forEach((world) => {
    worldFx[world.id] = {
      hover: 0,
      select: 0
    };
  });

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function applySidebarState(isOpen) {
    if (!sidebar || !layout) return;

    if (isOpen) {
      sidebar.style.display = "block";
      layout.style.gridTemplateColumns = "minmax(0, 1fr) 320px";
      sidebar.setAttribute("aria-hidden", "false");
    } else {
      sidebar.style.display = "none";
      layout.style.gridTemplateColumns = "minmax(0, 1fr)";
      sidebar.setAttribute("aria-hidden", "true");
    }

    requestAnimationFrame(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resizeCanvas();
    });
  }

  function worldAnchors() {
    return worlds.map((world, index) => {
      const stop =
        WORLD_CANVAS_LAYOUT[index] || {
          x: 0.5,
          y: 0.58,
          island: 1,
          deco: "palm",
          labelOffsetX: 0,
          labelOffsetY: 28
        };

      return {
        world,
        x: canvas.clientWidth * stop.x,
        y: canvas.clientHeight * stop.y,
        islandScale: stop.island,
        deco: stop.deco,
        labelOffsetX: stop.labelOffsetX || 0,
        labelOffsetY: stop.labelOffsetY || 28
      };
    });
  }

  function worldToCanvas(world) {
    const entry = worldAnchors().find((item) => item.world.id === world.id);
    return entry
      ? { x: entry.x, y: entry.y }
      : { x: canvas.clientWidth * 0.5, y: canvas.clientHeight * 0.5 };
  }

  function getWorldMeta(world) {
    return worldAnchors().find((item) => item.world.id === world.id) || null;
  }

  function getWorldImageMetrics(world, hoverT = 0, selectedT = 0) {
    const img = getWorldImage(world);
    if (!img || !img.complete || !img.naturalWidth) return null;

    const meta = getWorldMeta(world);
    const baseScale = meta?.islandScale || 1;
    const baseWidth = 110;
    const localScale = 1 + hoverT * 0.05 + selectedT * 0.03;
    const drawWidth = baseWidth * ISLAND_IMAGE_SCALE * baseScale * localScale;
    const aspect = img.naturalHeight / img.naturalWidth;
    const drawHeight = drawWidth * aspect;
    const lift = hoverT * 4 + selectedT * 2;

    return {
      drawWidth,
      drawHeight,
      lift
    };
  }

  function chipStyle(bg, text, border) {
    return `
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:8px 12px;
      border-radius:999px;
      font-weight:800;
      font-size:12px;
      line-height:1;
      color:${text};
      background:${bg};
      border:1px solid ${border};
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
    `;
  }

  function updateSidebar(world) {
    if (!world) {
      missionTitle.textContent = "Seleccioná un mundo";
      missionDescription.innerHTML = `
        <p style="margin:0; color:#dce9f9; line-height:1.6;">
          Hacé click en una isla del mapa para ver sus micro-misiones, su progreso y entrar a su aventura.
        </p>
      `;
      playBtn.disabled = true;
      return;
    }

    const progress = getMissionProgress(world);
    const visualStatus = getWorldVisualStatus(world);
    const storyCopy = getWorldStoryCopy(world);
    const storyText = storyCopy.story.replace("{playerName}", getPlayerDisplayName());

    missionTitle.textContent = world.title;
    missionDescription.innerHTML = `
      <p style="margin:0 0 10px 0; color:#ffe6a8; line-height:1.45; font-weight:900;">
        ${storyCopy.chapter}
      </p>

      <p style="margin:0 0 12px 0; color:#e8f3ff; line-height:1.55;">
        ${storyText}
      </p>

      <div style="
        margin-bottom:12px;
        padding:12px 14px;
        border-radius:16px;
        background:linear-gradient(180deg, rgba(89,212,255,0.12), rgba(17,53,82,0.18));
        border:1px solid rgba(89,212,255,0.18);
        color:#d9f3ff;
        line-height:1.48;
        font-weight:750;
      ">
        <strong style="display:block; color:#f7fbff; margin-bottom:4px;">Idea computacional</strong>
        ${storyCopy.theory}
      </div>

      <p style="margin:0 0 14px 0; color:#dce9f9; line-height:1.55;">
        <strong style="color:#ffe4a0;">Objetivo:</strong> ${storyCopy.objective}
      </p>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
        <span style="${chipStyle("rgba(242,195,91,0.18)", "#ffe8a5", "rgba(242,195,91,0.35)")}">
          ⭐ ${progress.completed}/${progress.total} misiones
        </span>
        <span style="${chipStyle("rgba(82,223,174,0.18)", "#b9ffe8", "rgba(82,223,174,0.34)")}">
          🪙 ${world.reward.coins} monedas
        </span>
        <span style="${chipStyle("rgba(92,193,255,0.16)", "#d7f4ff", "rgba(92,193,255,0.34)")}">
          💎 ${world.reward.gems} gemas
        </span>
      </div>

      <div style="
        padding:12px 14px;
        border-radius:16px;
        background:linear-gradient(180deg, rgba(18,38,69,0.9), rgba(11,26,49,0.9));
        border:1px solid rgba(255,255,255,0.07);
        color:#dce9f9;
        font-weight:700;
      ">
        Estado actual: <span style="color:#ffe4a0;">${getWorldStatusText(visualStatus)}</span>
      </div>
    `;

    playBtn.disabled = visualStatus === "locked";
    updateSidebarTheme(visualStatus);
  }

  function updateSidebarTheme(status) {
    if (!sidebar) return;

    let color = "rgba(89,212,255,0.12)";
    if (status === "current") color = "rgba(242,195,91,0.18)";
    if (status === "completed") color = "rgba(69,211,156,0.16)";
    if (status === "locked") color = "rgba(135,164,191,0.14)";

    sidebar.style.setProperty("--sidebar-accent", color);
  }

  function updateProgress() {
    const progress = getGradeProgress();
    completedValue.textContent = `${progress.completed} / ${progress.total}`;
    progressFill.style.width = `${progress.percent}%`;
  }

  function drawSky(w, h) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.56);
    skyGrad.addColorStop(0, "#9be8ff");
    skyGrad.addColorStop(0.35, "#73d0f3");
    skyGrad.addColorStop(0.7, "#4ea8da");
    skyGrad.addColorStop(1, "#2c88c4");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    const sunX = w * 0.12;
    const sunY = h * 0.18;
    const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.14);
    sun.addColorStop(0, "rgba(255,245,190,0.95)");
    sun.addColorStop(0.35, "rgba(255,231,148,0.75)");
    sun.addColorStop(1, "rgba(255,230,120,0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, h * 0.14, 0, Math.PI * 2);
    ctx.fill();

    drawCloud(w * 0.08 + Math.sin(time * 0.2) * 8, h * 0.18, 1.08);
    drawCloud(w * 0.73 + Math.cos(time * 0.15) * 6, h * 0.16, 0.92);
    drawCloud(w * 0.56 - Math.sin(time * 0.18) * 8, h * 0.09, 0.62);
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    blob(-22, 6, 18);
    blob(0, 0, 23);
    blob(24, 8, 17);
    blob(8, 10, 20);
    ctx.restore();

    function blob(bx, by, r) {
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawOcean(w, h) {
    const horizon = h * 0.42;

    const oceanGrad = ctx.createLinearGradient(0, horizon, 0, h);
    oceanGrad.addColorStop(0, "#2492cf");
    oceanGrad.addColorStop(0.32, "#167ebf");
    oceanGrad.addColorStop(0.7, "#0f73b0");
    oceanGrad.addColorStop(1, "#0b4d83");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    for (let i = 0; i < 9; i++) {
      const yy = horizon + 20 + i * 30;
      drawWaveLine(yy, 1.1 + i * 0.18, 22 + i * 2, `rgba(255,255,255,${0.14 - i * 0.012})`);
    }

    drawOceanHighlights(w, h, horizon);
  }

  function drawOceanHighlights(w, h, horizon) {
    for (let i = 0; i < 18; i++) {
      const x = (i / 18) * w + Math.sin(time * 0.4 + i) * 18;
      const y = horizon + 24 + (i % 6) * 36 + Math.sin(time * 1.7 + i) * 6;
      const width = 40 + (i % 3) * 18;

      ctx.save();
      ctx.globalAlpha = 0.06 + ((Math.sin(time * 2 + i * 1.4) + 1) * 0.5) * 0.07;
      const grad = ctx.createLinearGradient(x - width / 2, y, x + width / 2, y);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, "rgba(255,255,255,1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, y);
      ctx.lineTo(x + width / 2, y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawMapWaterMotion(w, h) {
    const horizon = h * 0.35;

    for (let i = 0; i < 8; i++) {
      const yy = horizon + 22 + i * ((h - horizon) / 9);
      drawWaveLine(
        yy,
        0.7 + i * 0.13,
        16 + i * 1.4,
        `rgba(255,255,255,${0.075 - i * 0.004})`
      );
    }

    drawOceanHighlights(w, h, horizon);
  }

  function drawWaveLine(y, speed, amp, strokeStyle) {
    const w = canvas.clientWidth;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const yy = y + Math.sin(x * 0.02 + time * speed) * amp * 0.18;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawAmbientParticles() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    for (let i = 0; i < 20; i++) {
      const px = w * (0.08 + ((i * 0.11) % 0.84)) + Math.sin(time * 0.6 + i * 1.3) * 14;
      const py = h * (0.20 + ((i * 0.07) % 0.54)) + Math.cos(time * 0.8 + i * 1.8) * 10;
      const size = 0.9 + (i % 3) * 0.5;

      ctx.save();
      ctx.globalAlpha = 0.04 + ((Math.sin(time * 2.6 + i) + 1) * 0.5) * 0.06;
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#fff4bf";
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPalm(x, y, s = 1, lean = 0) {
    const sway = Math.sin(time * 1.7 + x * 0.01) * 0.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.rotate(lean + sway);

    ctx.strokeStyle = "#7b4d25";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(2, -10, 0, -42);
    ctx.stroke();

    ctx.translate(0, -42);

    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(-0.95 + i * 0.38 + Math.sin(time * 1.7 + i) * 0.02);
      const leaf = ctx.createLinearGradient(0, 0, 36, 0);
      leaf.addColorStop(0, "#83e06f");
      leaf.addColorStop(1, "#2b973f");
      ctx.fillStyle = leaf;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(22, -9, 38, 0);
      ctx.quadraticCurveTo(22, 9, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawTotem(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    ctx.fillStyle = "#8b5b2e";
    roundRectPath(-7, -24, 14, 48, 6);
    ctx.fill();

    ctx.fillStyle = "#f2c35b";
    roundRectPath(-9, -20, 18, 9, 4);
    ctx.fill();

    ctx.fillStyle = "#17304f";
    ctx.beginPath();
    ctx.arc(-3, -15, 1.6, 0, Math.PI * 2);
    ctx.arc(3, -15, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#17304f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(4, -6);
    ctx.stroke();

    ctx.restore();
  }

  function drawHouse(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    ctx.fillStyle = "#f0dfb5";
    roundRectPath(-18, 0, 36, 26, 8);
    ctx.fill();

    ctx.fillStyle = "#d26c3c";
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.lineTo(0, -16);
    ctx.lineTo(22, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#8b4a28";
    roundRectPath(-5, 10, 10, 16, 4);
    ctx.fill();

    ctx.fillStyle = "#8fe7ff";
    roundRectPath(-13, 8, 7, 7, 3);
    ctx.fill();
    roundRectPath(6, 8, 7, 7, 3);
    ctx.fill();

    ctx.restore();
  }

  function drawMill(x, y, s = 1) {
    const spin = time * 2.2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    ctx.fillStyle = "#8c6b42";
    roundRectPath(-8, -10, 16, 34, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(0, -4);
    ctx.rotate(spin);

    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = i % 2 === 0 ? "#e8f2ff" : "#b8d0e8";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, -4);
      ctx.lineTo(26, 0);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    ctx.fillStyle = "#5d84ad";
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawGarden(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    ctx.fillStyle = "#8b5b2e";
    roundRectPath(-18, 4, 36, 12, 5);
    ctx.fill();

    for (let i = -1; i <= 1; i++) {
      const cx = i * 10;

      ctx.fillStyle = "#f28d26";
      ctx.beginPath();
      ctx.ellipse(cx, 0, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#54b844";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, -7);
      ctx.lineTo(cx - 4, -15);
      ctx.moveTo(cx, -7);
      ctx.lineTo(cx + 4, -15);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawIslandDecoration(meta, x, y, scale) {
    switch (meta.deco) {
      case "garden":
        drawGarden(x, y + 2, 0.92 * scale);
        drawPalm(x - 26 * scale, y + 12, 0.44 * scale, -0.08);
        drawPalm(x + 26 * scale, y + 10, 0.44 * scale, 0.06);
        break;
      case "mill":
        drawMill(x, y + 8, 0.82 * scale);
        break;
      case "totem":
        drawTotem(x, y + 8, 0.86 * scale);
        break;
      case "house":
        drawHouse(x, y + 8, 0.76 * scale);
        break;
      case "palm":
      default:
        drawPalm(x, y + 14, 0.62 * scale, 0.05);
        break;
    }
  }

  function drawWorldIsland(world) {
    const img = getWorldImage(world);

    if (img && img.complete && img.naturalWidth) {
      return;
    }

    const meta = getWorldMeta(world);
    if (!meta) return;

    const bob = Math.sin(time * 2 + world.number) * 1.4;
    const x = meta.x;
    const y = meta.y + 28 + bob;
    const scale = meta.islandScale || 0.84;

    const rx = 54 * scale;
    const ry = 30 * scale;

    ctx.save();

    const shadow = ctx.createRadialGradient(x, y + 30, 8, x, y + 30, rx * 1.45);
    shadow.addColorStop(0, "rgba(0,0,0,0.18)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(x, y + 28, rx * 1.2, ry * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.globalAlpha = 0.06 + i * 0.03;
      ctx.strokeStyle = "#dcffff";
      ctx.lineWidth = 5 - i;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y + 6 + i * 2,
        rx * (1.12 + i * 0.08),
        ry * (1.08 + i * 0.08),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }

    const sand = ctx.createLinearGradient(x, y - ry, x, y + ry);
    sand.addColorStop(0, "#fdeab8");
    sand.addColorStop(0.4, "#f5d98c");
    sand.addColorStop(1, "#d59c40");
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, -0.02, 0, Math.PI * 2);
    ctx.fill();

    const grass = ctx.createRadialGradient(x, y - 4, 4, x, y - 4, rx * 0.82);
    grass.addColorStop(0, "#9aef88");
    grass.addColorStop(0.52, "#65d25f");
    grass.addColorStop(1, "#2e9340");
    ctx.fillStyle = grass;
    ctx.beginPath();
    ctx.ellipse(x, y - 3, rx * 0.72, ry * 0.6, -0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(x + 8, y - 7, rx * 0.28, ry * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    drawIslandDecoration(meta, x, y - 10, scale);

    ctx.restore();
  }

  function worldPalette(world) {
    const visualStatus = getWorldVisualStatus(world);

    if (visualStatus === "completed") {
      return {
        primary: "#45d39c",
        secondary: "#dcfff2",
        glow: "rgba(69,211,156,0.26)",
        ring: "#1f8f68"
      };
    }

    if (visualStatus === "current" || visualStatus === "available") {
      return {
        primary: "#59d4ff",
        secondary: "#f1fcff",
        glow: "rgba(89,212,255,0.28)",
        ring: "#1778a3"
      };
    }

    return {
      primary: "#88a4bf",
      secondary: "#eef4f9",
      glow: "rgba(136,164,191,0.14)",
      ring: "#5e7994"
    };
  }

  function markerPalette(world) {
    const status = getWorldVisualStatus(world);

    if (status === "current") {
      return {
        boardTop: "#ffe0a0",
        boardBottom: "#c9812f",
        boardEdge: "#6b4316",
        boardShadow: "rgba(0,0,0,0.20)",
        text: "#2f1f0b",
        subtext: "#6b4c1a",
        progressBg: "rgba(48, 28, 8, 0.18)",
        progressFill: "#33deab",
        badgeTop: "#ffe79e",
        badgeBottom: "#f2bf52",
        badgeText: "#5c4614",
        post: "#845628",
        glow: "rgba(255, 207, 104, 0.32)",
        chipBg: "#f2c35b",
        chipStroke: "#82590e",
        chipIcon: "#5a4210",
        ribbonBg: "#f2c35b",
        ribbonText: "#5a4210"
      };
    }

    if (status === "completed") {
      return {
        boardTop: "#f2e3b8",
        boardBottom: "#aa7440",
        boardEdge: "#6e4a23",
        boardShadow: "rgba(0,0,0,0.18)",
        text: "#2b1f0f",
        subtext: "#2e6d52",
        progressBg: "rgba(40, 30, 14, 0.16)",
        progressFill: "#43d39b",
        badgeTop: "#d9ffd7",
        badgeBottom: "#5fcb71",
        badgeText: "#1f5f37",
        post: "#845628",
        glow: "rgba(67, 211, 155, 0.22)",
        chipBg: "#6ed08a",
        chipStroke: "#2d8b50",
        chipIcon: "#173d25",
        ribbonBg: "#6ed08a",
        ribbonText: "#173d25"
      };
    }

    if (status === "locked") {
      return {
        boardTop: "#dfe5ed",
        boardBottom: "#8fa1b7",
        boardEdge: "#4b5c70",
        boardShadow: "rgba(0,0,0,0.18)",
        text: "#203142",
        subtext: "#526170",
        progressBg: "rgba(25, 39, 53, 0.14)",
        progressFill: "#a7b6c7",
        badgeTop: "#eef4fa",
        badgeBottom: "#b0bccb",
        badgeText: "#455566",
        post: "#708293",
        glow: "rgba(155, 176, 201, 0.16)",
        chipBg: "#c8d1dc",
        chipStroke: "#66788c",
        chipIcon: "#374858",
        ribbonBg: "#bfcad6",
        ribbonText: "#334454"
      };
    }

    return {
      boardTop: "#f0debb",
      boardBottom: "#b1733c",
      boardEdge: "#6d4923",
      boardShadow: "rgba(0,0,0,0.18)",
      text: "#2c1f10",
      subtext: "#1e6d72",
      progressBg: "rgba(39, 28, 14, 0.16)",
      progressFill: "#47cfe0",
      badgeTop: "#d7fbff",
      badgeBottom: "#64d6e8",
      badgeText: "#164852",
      post: "#845628",
      glow: "rgba(89, 212, 255, 0.18)",
      chipBg: "#7be1ef",
      chipStroke: "#257988",
      chipIcon: "#11444b",
      ribbonBg: "#7be1ef",
      ribbonText: "#11444b"
    };
  }

  function markerTitle(world) {
    const raw = world.short || world.title || `Mundo ${world.number}`;
    return raw.length > 17 ? `${raw.slice(0, 16)}…` : raw;
  }

  function markerStateText(world) {
    const status = getWorldVisualStatus(world);
    if (status === "current") return "Actual";
    if (status === "completed") return "Completa";
    if (status === "locked") return "Bloqueada";
    return "Lista";
  }

  function drawCheckIcon(x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4 * s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - 4 * s, y + 0 * s);
    ctx.lineTo(x - 1 * s, y + 3 * s);
    ctx.lineTo(x + 5 * s, y - 4 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawLockIcon(x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(x, y - 2.2 * s, 3.2 * s, Math.PI, 0);
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    roundRectPath(x - 4.3 * s, y - 1 * s, 8.6 * s, 7.4 * s, 2.1 * s);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkIcon(x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x, y - 5 * s);
    ctx.lineTo(x, y + 5 * s);
    ctx.moveTo(x - 5 * s, y);
    ctx.lineTo(x + 5 * s, y);
    ctx.moveTo(x - 3.3 * s, y - 3.3 * s);
    ctx.lineTo(x + 3.3 * s, y + 3.3 * s);
    ctx.moveTo(x + 3.3 * s, y - 3.3 * s);
    ctx.lineTo(x - 3.3 * s, y + 3.3 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawStateChip(world, x, y, palette) {
    const status = getWorldVisualStatus(world);

    ctx.save();
    ctx.fillStyle = palette.chipBg;
    ctx.strokeStyle = palette.chipStroke;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (status === "locked") {
      drawLockIcon(x, y + 1, 0.9, palette.chipIcon);
    } else if (status === "completed") {
      drawCheckIcon(x, y, 1, palette.chipIcon);
    } else {
      drawSparkIcon(x, y, 0.7, palette.chipIcon);
    }

    ctx.restore();
  }

  function drawCurrentRibbon(x, y, palette) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = palette.ribbonBg;
    roundRectPath(-18, -8, 36, 16, 8);
    ctx.fill();

    ctx.fillStyle = palette.ribbonText;
    ctx.font = "800 8px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ACTUAL", 0, 0.5);

    ctx.restore();
  }

  function drawWorldMarker(world, x, y, selected, hovered, hoverT = 0) {
    const palette = markerPalette(world);
    const progress = getMissionProgress(world);
    const status = getWorldVisualStatus(world);
    const title = markerTitle(world);

    const width =
      (selected || status === "current" ? 144 : 130) +
      hoverT * 6;
    const height =
      (selected || status === "current" ? 56 : 50) +
      hoverT * 2;

    const safeX = clamp(
      x,
      width / 2 + 18,
      canvas.clientWidth - width / 2 - 18
    );
    const markerFloat =
      Math.sin(time * 2.1 + world.number * 0.7) *
      (status === "current" ? 1.6 : 0.85);
    const safeY = clamp(
      y + markerFloat,
      height + 24,
      canvas.clientHeight - 28
    );

    const left = safeX - width / 2;
    const top = safeY - height;
    const percent = progress.percent || 0;

    const activePower =
      (hovered ? 0.65 : 0) +
      (selected ? 0.85 : 0) +
      (status === "current" ? 0.45 : 0);

    if (activePower > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.18 + activePower * 0.08, 0.28);
      ctx.fillStyle = palette.glow;
      roundRectPath(left - 8, top - 8, width + 16, height + 16, 13);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.beginPath();
    ctx.ellipse(safeX, safeY + 18, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = palette.post;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(safeX, safeY + 2);
    ctx.lineTo(safeX, safeY + 20);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = palette.boardShadow;
    roundRectPath(left + 3, top + 4, width, height, 10);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const board = ctx.createLinearGradient(0, top, 0, top + height);
    board.addColorStop(0, palette.boardTop);
    board.addColorStop(1, palette.boardBottom);
    ctx.shadowColor = "rgba(0, 22, 48, 0.28)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = board;
    ctx.strokeStyle = palette.boardEdge;
    ctx.lineWidth = selected || status === "current" ? 2.3 : 1.8;
    roundRectPath(left, top, width, height, 9);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = selected || status === "current"
      ? "rgba(255, 225, 128, 0.92)"
      : "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left + 14, top + 8);
    ctx.lineTo(left + 34, top + 8);
    ctx.moveTo(left + width - 34, top + 8);
    ctx.lineTo(left + width - 14, top + 8);
    ctx.moveTo(left + 14, top + height - 8);
    ctx.lineTo(left + 34, top + height - 8);
    ctx.moveTo(left + width - 34, top + height - 8);
    ctx.lineTo(left + width - 14, top + height - 8);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(left + 13, top + 11, 2.4, 0, Math.PI * 2);
    ctx.arc(left + width - 13, top + 11, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawStateChip(world, left + width - 18, top + 16, palette);

    ctx.save();
    ctx.fillStyle = palette.text;
    ctx.shadowColor = "rgba(0, 0, 0, 0.26)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    ctx.font = `${selected || status === "current" ? 900 : 800} 13px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(title, left + 13, top + 20);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = palette.subtext;
    ctx.shadowColor = "rgba(255, 255, 255, 0.16)";
    ctx.shadowBlur = 1;
    ctx.font = "900 9px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(markerStateText(world).toUpperCase(), left + 13, top + 35);

    ctx.textAlign = "right";
    ctx.fillText(`${progress.completed}/${progress.total}`, left + width - 34, top + 35);
    ctx.restore();

    ctx.save();
    roundRectPath(left + 13, top + height - 12, width - 26, 7, 3.5);
    ctx.fillStyle = palette.progressBg;
    ctx.fill();

    roundRectPath(left + 13, top + height - 12, (width - 26) * (percent / 100), 7, 3.5);
    ctx.fillStyle = palette.progressFill;
    ctx.fill();
    ctx.restore();

    ctx.save();
    const badgeW = selected || status === "current" ? 34 : 31;
    const badgeH = 24;
    const bx = safeX - badgeW / 2;
    const by = top - 20;

    const badge = ctx.createLinearGradient(0, by, 0, by + badgeH);
    badge.addColorStop(0, palette.badgeTop);
    badge.addColorStop(1, palette.badgeBottom);
    ctx.fillStyle = badge;
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 1;
    roundRectPath(bx, by, badgeW, badgeH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.badgeText;
    ctx.font = "900 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(world.number), safeX, by + badgeH / 2 + 0.5);
    ctx.restore();

    if (status === "current") {
      drawCurrentRibbon(left + 22, top - 22, palette);
    }
  }

  function drawHoverAura(x, y, palette, hoverT, selectedT, world) {
    const visualStatus = getWorldVisualStatus(world);
    const hasImage = !!getWorldImageMetrics(world);

    let power = clamp(hoverT * 0.8 + selectedT * 0.45, 0, 1);
    if (visualStatus === "current") {
      power = Math.max(power, 0.45 + Math.sin(time * 3.2) * 0.06);
    }
    if (visualStatus === "completed") power = Math.max(power, 0.24);

    if (power <= 0.01) return;

    const baseRadius = hasImage ? 56 : 44;
    const radius = baseRadius + Math.sin(time * 4.2) * 2 + power * 14;
    const aura = ctx.createRadialGradient(x, y, 0, x, y, radius);
    aura.addColorStop(0, palette.glow);
    aura.addColorStop(0.55, palette.glow);
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMagicRing(x, y, palette, hoverT, selectedT, world) {
    const visualStatus = getWorldVisualStatus(world);
    const hasImage = !!getWorldImageMetrics(world);

    let power = clamp(hoverT + selectedT * 0.45, 0, 1);
    if (visualStatus === "current") power = Math.max(power, 0.55);
    if (power <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = 0.18 + power * 0.22;
    ctx.strokeStyle = visualStatus === "current" ? "#ffe4a0" : palette.secondary;
    ctx.lineWidth = 2;
    const baseR = hasImage ? 48 : 36;
    const pulse = Math.sin(time * 5.2) * 1.8;

    ctx.beginPath();
    ctx.arc(x, y + 2, baseR + power * 6 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawOrbitSparkles(x, y, palette, hoverT, world) {
    const visualStatus = getWorldVisualStatus(world);

    let power = hoverT;
    if (visualStatus === "current") power = Math.max(power, 0.4);
    if (power <= 0.04) return;

    const count = visualStatus === "current" ? 6 : 4;

    for (let i = 0; i < count; i++) {
      const angle = time * (1.2 + i * 0.05) + (Math.PI * 2 * i) / count;
      const radius = 34 + Math.sin(time * 3 + i) * 2 + power * 5;
      const px = x + Math.cos(angle) * radius;
      const py = y - 3 + Math.sin(angle) * (radius * 0.52);

      ctx.save();
      ctx.globalAlpha = 0.12 + power * 0.28;
      ctx.fillStyle = visualStatus === "current" ? "#ffe4a0" : palette.secondary;
      ctx.beginPath();
      ctx.arc(px, py, 1.4 + power * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawObjectiveBeacon(x, y, palette, world, hoverT, selectedT) {
    const status = getWorldVisualStatus(world);
    const isLocked = status === "locked";
    const isCurrent = status === "current";
    const power = isLocked ? 0.28 : isCurrent ? 0.82 : 0.52;
    const pulse = Math.sin(time * (isCurrent ? 3.4 : 2.2) + world.number) * 0.5 + 0.5;
    const ringW = 88 + hoverT * 10 + selectedT * 8 + pulse * (isCurrent ? 8 : 4);
    const ringH = 26 + hoverT * 4 + selectedT * 3 + pulse * (isCurrent ? 4 : 2);

    ctx.save();
    ctx.globalAlpha = power;
    ctx.lineWidth = isCurrent ? 3 : 2;
    ctx.strokeStyle = isLocked ? "rgba(222,234,247,0.34)" : palette.secondary;
    ctx.setLineDash(isLocked ? [8, 7] : [12, 7]);
    ctx.lineDashOffset = -time * (isCurrent ? 18 : 10);
    ctx.beginPath();
    ctx.ellipse(x, y, ringW, ringH, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (!isLocked) {
      ctx.save();
      ctx.globalAlpha = isCurrent ? 0.18 + pulse * 0.12 : 0.12;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, ringW * 0.96);
      glow.addColorStop(0, palette.glow);
      glow.addColorStop(0.58, palette.glow);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(x, y, ringW * 0.98, ringH * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x + ringW * 0.78, y - ringH * 0.55);
    ctx.rotate(Math.sin(time * 2.4 + world.number) * 0.05);
    ctx.fillStyle = isLocked ? "rgba(192,207,224,0.82)" : isCurrent ? "#ffe39a" : palette.primary;
    ctx.strokeStyle = "rgba(20,43,73,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawWorldImage(world, x, y, hoverT = 0, selectedT = 0) {
    const img = getWorldImage(world);
    const metrics = getWorldImageMetrics(world, hoverT, selectedT);
    if (!img || !metrics) return false;

    const { drawWidth, drawHeight, lift } = metrics;
    const drawX = x - drawWidth / 2;
    const drawY = y - drawHeight + 36 - lift;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.beginPath();
    ctx.ellipse(
      x,
      y + 28,
      drawWidth * 0.22,
      drawHeight * 0.05,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.24)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    world.renderBounds = {
      x: drawX - ISLAND_HITBOX_PADDING,
      y: drawY - ISLAND_HITBOX_PADDING,
      width: drawWidth + ISLAND_HITBOX_PADDING * 2,
      height: drawHeight + ISLAND_HITBOX_PADDING * 2
    };

    return true;
  }

  function drawWorldPad(x, y, palette, selected = false, hoverT = 0, selectedT = 0, world) {
    const visualStatus = getWorldVisualStatus(world);
    const extra = hoverT * 3 + selectedT * 2;
    const radius = (selected ? 29 : 25) + extra + (visualStatus === "locked" ? -1.5 : 0);

    ctx.beginPath();
    ctx.ellipse(x, y + 22, 31 + hoverT * 2, 10 + hoverT, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fill();

    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.1);
    glow.addColorStop(0, palette.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.ring;
    ctx.beginPath();
    ctx.arc(x, y + 3, radius, 0, Math.PI * 2);
    ctx.fill();

    const top = ctx.createLinearGradient(x, y - radius, x, y + radius);
    top.addColorStop(0, "#f8fcff");
    top.addColorStop(1, "#bcc8d2");
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius * 0.75);
    core.addColorStop(0, palette.secondary);
    core.addColorStop(0.6, palette.primary);
    core.addColorStop(1, shade(palette.primary, -18));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.52, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPortalStructure(x, y, palette, selected, hoverT = 0, selectedT = 0, world) {
    const hasImage = drawWorldImage(world, x, y + 4, hoverT, selectedT);
    if (hasImage) return;

    const visualStatus = getWorldVisualStatus(world);
    const pulseBoost = visualStatus === "current" ? 0.1 : 0;
    const pulse =
      1 + Math.sin(time * 2.8) * 0.04 + hoverT * 0.06 + selectedT * 0.03 + pulseBoost;

    ctx.save();
    ctx.translate(x, y - 18);

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 32, 27 + hoverT * 2, 10 + hoverT, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shade(palette.primary, -18);
    ctx.beginPath();
    ctx.arc(0, 20, 22 + hoverT * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dbe9f4";
    ctx.beginPath();
    ctx.arc(0, 14, 18 + hoverT, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(0, 10, 2, 0, 10, 20 + hoverT * 3);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.45, palette.secondary);
    core.addColorStop(1, palette.primary);
    ctx.fillStyle = core;

    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 10, 12 + hoverT * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle =
      selected ? "#ffd978" : hoverT > 0.05 ? "#ffffff" : "rgba(255,255,255,0.52)";
    ctx.lineWidth = selected ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(0, -18 - hoverT * 1.5);
    ctx.lineTo(10, 8);
    ctx.stroke();

    ctx.restore();
  }

  function drawHouseStructure(x, y, palette, selected, hoverT = 0) {
    const bob = Math.sin(time * 2 + x * 0.01) * 1.3 + hoverT * 1.2;

    ctx.save();
    ctx.translate(x, y - 24 + bob);

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 34, 28 + hoverT, 10 + hoverT * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0dfb5";
    roundRectPath(-20, 2, 40, 30, 8);
    ctx.fill();

    ctx.fillStyle = "#d26c3c";
    ctx.beginPath();
    ctx.moveTo(-24, 4);
    ctx.lineTo(0, -18 - hoverT);
    ctx.lineTo(24, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#8b4a28";
    roundRectPath(-6, 14, 12, 18, 4);
    ctx.fill();

    ctx.fillStyle = "#8fe7ff";
    roundRectPath(-15, 10, 8, 8, 3);
    ctx.fill();
    roundRectPath(7, 10, 8, 8, 3);
    ctx.fill();

    if (selected || hoverT > 0.05) {
      ctx.strokeStyle = selected ? palette.primary : "rgba(255,255,255,0.72)";
      ctx.lineWidth = selected ? 3 : 2;
      roundRectPath(-24, -20, 48, 58, 12);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCrossroadStructure(x, y, palette, selected, hoverT = 0) {
    ctx.save();
    ctx.translate(x, y - 18 - hoverT);

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 24 + hoverT, 9 + hoverT * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#7b4d25";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(0, -22);
    ctx.stroke();

    ctx.fillStyle = "#f2df9f";
    roundRectPath(-22, -16, 18, 10, 4);
    ctx.fill();
    roundRectPath(4, -4, 20, 10, 4);
    ctx.fill();

    ctx.strokeStyle = "#8b6b2c";
    ctx.lineWidth = 2;
    roundRectPath(-22, -16, 18, 10, 4);
    ctx.stroke();
    roundRectPath(4, -4, 20, 10, 4);
    ctx.stroke();

    ctx.strokeStyle = selected ? "#ffd978" : hoverT > 0.05 ? "#ffffff" : palette.primary;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, -27, (selected ? 6 : 5) + hoverT, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawLoopStructure(x, y, palette, selected, hoverT = 0, world) {
    const visualStatus = getWorldVisualStatus(world);
    const spin = time * (1.5 + hoverT * 0.55 + (visualStatus === "current" ? 0.28 : 0));

    ctx.save();
    ctx.translate(x, y - 24 - hoverT * 1.2);

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 36, 28 + hoverT, 10 + hoverT * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8d5a2b";
    roundRectPath(-5, 2, 10, 34, 4);
    ctx.fill();

    ctx.save();
    ctx.translate(0, 4);
    ctx.rotate(spin);

    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = i % 2 === 0 ? palette.primary : "#f7ecbf";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10 + hoverT, -5 - hoverT * 0.6);
      ctx.lineTo(28 + hoverT * 1.4, 0);
      ctx.lineTo(10 + hoverT, 5 + hoverT * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    if (selected || hoverT > 0.05) {
      ctx.strokeStyle = selected ? "#ffd978" : "rgba(255,255,255,0.8)";
      ctx.lineWidth = selected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 4, 30 + hoverT * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function structureHeight(type, world) {
    const metrics = getWorldImageMetrics(world);
    if (metrics) {
      return Math.max(96, Math.min(118, metrics.drawHeight * 0.9));
    }

    switch (type) {
      case "portal":
        return 34;
      case "house":
        return 34;
      case "crossroad":
        return 30;
      case "loop":
        return 36;
      default:
        return 30;
    }
  }

  function drawWorldStructure(world) {
    const p = worldToCanvas(world);
    const selected = selectedWorld?.id === world.id;
    const hovered = hoveredWorld?.id === world.id;
    const palette = worldPalette(world);
    const visualStatus = getWorldVisualStatus(world);

    const fx = worldFx[world.id];
    const hoverT = easeOutBack(clamp(fx.hover, 0, 1));
    const selectedT = clamp(fx.select, 0, 1);

    const bobBase = Math.sin(time * 2 + world.number) * 1.45;
    const hoverLift = hoverT * 8;
    const selectedLift = selectedT * 2.5;
    const currentLift =
      visualStatus === "current" ? 1.6 + Math.sin(time * 3.4 + world.number) * 1.2 : 0;
    const bob = bobBase - hoverLift - selectedLift - currentLift;

    const scale =
      1 +
      hoverT * 0.06 +
      selectedT * 0.03 +
      (visualStatus === "current" ? 0.02 : 0) +
      (visualStatus === "locked" ? -0.015 : 0);

    const img = getWorldImage(world);
    const hasImage = img && img.complete && img.naturalWidth;

    drawHoverAura(p.x, p.y + bob + 2, palette, hoverT, selectedT, world);
    drawMagicRing(p.x, p.y + bob + 2, palette, hoverT, selectedT, world);
    drawOrbitSparkles(p.x, p.y + bob, palette, hoverT, world);
    drawObjectiveBeacon(p.x, p.y + bob + 42, palette, world, hoverT, selectedT);

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(scale, scale);
    ctx.translate(-p.x, -(p.y + bob));

    if (hasImage) {
      drawWorldImage(world, p.x, p.y + bob + 6, hoverT, selectedT);
    } else {
      world.renderBounds = null;
      drawWorldPad(p.x, p.y + bob + 12, palette, selected, hoverT, selectedT, world);

      if (world.type === "portal") {
        drawPortalStructure(p.x, p.y + bob, palette, selected, hoverT, selectedT, world);
      } else if (world.type === "house") {
        drawHouseStructure(p.x, p.y + bob, palette, selected, hoverT);
      } else if (world.type === "crossroad") {
        drawCrossroadStructure(p.x, p.y + bob, palette, selected, hoverT);
      } else if (world.type === "loop") {
        drawLoopStructure(p.x, p.y + bob, palette, selected, hoverT, world);
      } else {
        drawPortalStructure(p.x, p.y + bob, palette, selected, hoverT, selectedT, world);
      }
    }

    ctx.restore();

    const meta = getWorldMeta(world);
    const labelOffsetX = meta?.labelOffsetX ?? 0;
    const labelOffsetY = meta?.labelOffsetY ?? 28;

    drawWorldMarker(
      world,
      p.x + labelOffsetX,
      p.y + bob - structureHeight(world.type, world) - labelOffsetY - hoverT * 1.5,
      selected,
      hovered,
      hoverT
    );
  }

  function drawScene() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    drawMapWaterMotion(w, h);
    drawAmbientParticles();
    worlds.forEach(drawWorldIsland);
    worlds.forEach(drawWorldStructure);
  }

  function getWorldAt(mx, my) {
    for (let i = worlds.length - 1; i >= 0; i--) {
      const world = worlds[i];
      const img = getWorldImage(world);
      const hasImage = img && img.complete && img.naturalWidth;

      if (hasImage && world.renderBounds) {
        const b = world.renderBounds;
        if (
          mx >= b.x &&
          mx <= b.x + b.width &&
          my >= b.y &&
          my <= b.y + b.height
        ) {
          return world;
        }
        continue;
      }

      const p = worldToCanvas(world);
      const dx = mx - p.x;
      const dy = my - (p.y + 4);
      const radius = hasImage ? 78 : 58;

      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        return world;
      }
    }
    return null;
  }

  function updateWorldFx() {
    worlds.forEach((world) => {
      const fx = worldFx[world.id];
      const hoverTarget = hoveredWorld?.id === world.id ? 1 : 0;
      const selectTarget = selectedWorld?.id === world.id ? 1 : 0;

      fx.hover = lerp(fx.hover, hoverTarget, 0.16);
      fx.select = lerp(fx.select, selectTarget, 0.12);
    });
  }

  function animate() {
    time += 0.016;
    updateWorldFx();
    drawScene();
    animationFrameId = requestAnimationFrame(animate);
  }

  function clearSelectionAndHideSidebar() {
    selectedWorld = null;
    appState.selectedWorldId = null;
  }

  function onCanvasMouseMove(e) {
    unlockAudio();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nextHoveredWorld = getWorldAt(mx, my);
    if (nextHoveredWorld?.id !== hoveredWorld?.id && nextHoveredWorld) {
      playHoverTick();
    }
    hoveredWorld = nextHoveredWorld;
    canvas.style.cursor = hoveredWorld ? "pointer" : "default";
  }

  function onCanvasMouseLeave() {
    hoveredWorld = null;
    canvas.style.cursor = "default";
  }

  function onCanvasClick(e) {
    unlockAudio();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const world = getWorldAt(mx, my);

    if (!world) {
      clearSelectionAndHideSidebar();
      return;
    }

    playSelect();
    selectedWorld = world;
    appState.selectedWorldId = world.id;

    const visualStatus = getWorldVisualStatus(world);
    if (visualStatus === "locked") {
      if (sceneGuideText) {
        sceneGuideText.textContent =
          "Esa isla todavia esta bloqueada. Primero completa la isla disponible para reunir energia del faro; cuando avances, Bit abrira nuevos caminos del mapa.";
        sceneGuideText.classList.remove("is-helping");
        void sceneGuideText.offsetWidth;
        sceneGuideText.classList.add("is-helping");
      }
      return;
    }

    goToSubmap(world.id);
    window.renderApp();
  }

  function onPlayClick() {
    unlockAudio();
    if (!selectedWorld) return;

    const visualStatus = getWorldVisualStatus(selectedWorld);
    if (visualStatus === "locked") return;

    playUiClick();
    appState.selectedWorldId = selectedWorld.id;
    goToSubmap(selectedWorld.id);
    window.renderApp();
  }

  function onCloseSidebarClick() {
    playUiClick();
    clearSelectionAndHideSidebar();
  }

  function onOpenDashboardClick() {
    unlockAudio();
    playUiClick();
    goToDashboard("student");
    window.renderApp();
  }

  function onGoHomeClick() {
    unlockAudio();
    playUiClick();
    goToStart();
    window.renderApp();
  }

  function onSceneGuideHelpClick() {
    unlockAudio();
    playUiClick();

    const firstWorld = worlds[0] || null;
    if (firstWorld) {
      selectedWorld = firstWorld;
      appState.selectedWorldId = firstWorld.id;
    }

    if (sceneGuideText) {
      sceneGuideText.textContent =
        "Ahora toca la isla de Secuencias. Alli aprenderas a ordenar pasos como un algoritmo. Al entrar, te explicare la historia, que tienes que hacer y que premios puedes ganar.";
      sceneGuideText.classList.remove("is-helping");
      void sceneGuideText.offsetWidth;
      sceneGuideText.classList.add("is-helping");
    }

    if (sceneGuideHelpBtn) {
      sceneGuideHelpBtn.textContent = "Toca la isla 1";
    }
  }

  function onResize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resizeCanvas();
  }

  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mouseleave", onCanvasMouseLeave);
  canvas.addEventListener("click", onCanvasClick);
  playBtn.addEventListener("click", onPlayClick);
  closeSidebarBtn.addEventListener("click", onCloseSidebarClick);
  openDashboardBtn?.addEventListener("click", onOpenDashboardClick);
  goHomeBtn?.addEventListener("click", onGoHomeClick);
  sceneGuideHelpBtn?.addEventListener("click", onSceneGuideHelpClick);
  window.addEventListener("resize", onResize);

  detachWorldMapEvents = () => {
    canvas.removeEventListener("mousemove", onCanvasMouseMove);
    canvas.removeEventListener("mouseleave", onCanvasMouseLeave);
    canvas.removeEventListener("click", onCanvasClick);
    playBtn.removeEventListener("click", onPlayClick);
    closeSidebarBtn.removeEventListener("click", onCloseSidebarClick);
    openDashboardBtn?.removeEventListener("click", onOpenDashboardClick);
    goHomeBtn?.removeEventListener("click", onGoHomeClick);
    sceneGuideHelpBtn?.removeEventListener("click", onSceneGuideHelpClick);
    window.removeEventListener("resize", onResize);
  };

  applySidebarState(false);
  updateProgress();
  resizeCanvas();
  setAmbientMode("world");

  const preloadAssets = Object.values(worldImages);
  let pending = preloadAssets.length;

  if (!pending) {
    animate();
  } else {
    preloadAssets.forEach((img) => {
      if (img.complete) {
        pending -= 1;
        if (pending === 0) animate();
      } else {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          pending -= 1;
          if (pending === 0) animate();
        };
        img.addEventListener("load", done);
        img.addEventListener("error", done);
      }
    });
  }
}

function renderWorldMap() {
  destroyWorldMapRuntime();
  renderWorldMapShell();
  bootstrapWorldMap();
}

window.renderApp = function renderApp() {
  destroyWorldMapRuntime();
  setupGlobalAudioUnlock();

  if (appState.currentView === "start") {
    setAmbientMode("world");
    renderStart();
    return;
  }

  if (appState.currentView === "world-map") {
    setAmbientMode("world");
    renderWorldMap();
    return;
  }

  if (appState.currentView === "submap") {
    setAmbientMode("submap");
    renderSubmap();
    return;
  }

  if (appState.currentView === "mission") {
    setAmbientMode("mission");
    renderMission();
    return;
  }

  if (appState.currentView === "result") {
    setAmbientMode("mission");
    renderResult();
    return;
  }

  if (appState.currentView === "dashboard") {
    setAmbientMode("mission");
    renderDashboard();
    return;
  }

  renderWorldMap();
};

window.renderApp();

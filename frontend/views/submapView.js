import { grade4Data } from "../data/grade4.js";
import { appState } from "../state/appState.js";
import { goToDashboard, goToMission, goToStart, goToWorldMap } from "../utils/navigation.js";
import { getMissionState, getWorldProgress } from "../utils/progress.js";
import {
  unlockAudio,
  playUiClick,
  playHoverTick,
  playSelect,
  playLocked,
  playMissionOpen,
  playPanelOpen
} from "../utils/audio.js";
import { uiIcon } from "../utils/icons.js";

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
        "Esta isla enseña secuencias: ordenar pasos para cumplir una meta. Un algoritmo claro dice qué acción va primero, cuál viene después y cómo llegar al resultado.",
      now:
        "Elige una mini isla disponible y entrá a la misión para recuperar energía del faro."
    },
    "world-loops": {
      title: "Bit te explica",
      body:
        "Esta isla enseña bucles: cuando una acción se repite, puedes convertir muchos pasos en una instruccion más corta.",
      now:
        "Elige una misión, detecta la repeticion y arma el bucle."
    },
    "world-decisions": {
      title: "Bit te explica",
      body:
        "Esta isla enseña decisiones: si una condición se cumple, eliges una acción; si no, eliges otra.",
      now:
        "Elige una misión y compará las opciones antes de decidir."
    },
    "world-data": {
      title: "Bit te explica",
      body:
        "Esta isla enseña datos: ordenar, clasificar y comparar información para crear una solución.",
      now:
        "Elige una misión, organizá las pistas y usa la información para avanzar."
    }
  };

  const copy = copies[world.id] || copies["world-sequences"];
  return {
    ...copy,
    reward: `Ruta: ${worldProgress.completed}/${worldProgress.total}. Hasta ${world.reward.coins} monedas y ${world.reward.gems} gemas.`,
    selected: selectedMission
      ? `Siguiente reto sugerido: ${selectedMission.title}.`
      : "Selecciona una misión para ver su reto."
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

function renderIslandSvg(worldId, index, state) {
  const isLocked = state === "locked";
  const isCompleted = state === "completed";
  let content = "";
  let defs = "";

  defs += `
    <defs>
      <radialGradient id="grad-shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
  `;

  if (worldId === "world-sequences") {
    defs += `
      <linearGradient id="grad-seq-grass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4ade80" />
        <stop offset="100%" stop-color="#15803d" />
      </linearGradient>
      <linearGradient id="grad-seq-soil" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#854d0e" />
        <stop offset="100%" stop-color="#451a03" />
      </linearGradient>
      <linearGradient id="grad-seq-portal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa" />
        <stop offset="100%" stop-color="#2563eb" />
      </linearGradient>
    </defs>
    `;

    content += `
      <ellipse cx="60" cy="85" rx="55" ry="22" fill="url(#grad-seq-soil)" />
      <path d="M 5,85 Q 60,105 115,85 L 115,92 Q 60,112 5,92 Z" fill="#291205" />
      <ellipse cx="60" cy="82" rx="53" ry="19" fill="url(#grad-seq-grass)" />
      <ellipse cx="60" cy="90" rx="6" ry="3.5" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
      <ellipse cx="50" cy="86" rx="5" ry="2.8" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
      <ellipse cx="42" cy="81" rx="4.5" ry="2.5" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
      <ellipse cx="48" cy="76" rx="4" ry="2.2" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
      <path d="M 35,76 L 35,42 Q 35,32 60,32 Q 85,32 85,42 L 85,76" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
      <path d="M 35,76 L 35,42 Q 35,32 60,32 Q 85,32 85,42 L 85,76" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
      <rect x="30" y="72" width="10" height="5" rx="2" fill="#475569" />
      <rect x="80" y="72" width="10" height="5" rx="2" fill="#475569" />
      <ellipse cx="60" cy="54" rx="18" ry="18" fill="url(#grad-seq-portal)" opacity="0.8" class="portal-energy-core" />
      <ellipse cx="60" cy="54" rx="10" ry="10" fill="#e0f2fe" opacity="0.9" class="portal-energy-glow" filter="url(#glow-light)" />
    `;
  } else if (worldId === "world-loops") {
    defs += `
      <linearGradient id="grad-loop-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b45309" />
        <stop offset="50%" stop-color="#78350f" />
        <stop offset="100%" stop-color="#451a03" />
      </linearGradient>
      <linearGradient id="grad-loop-neon" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
    </defs>
    `;

    content += `
      <ellipse cx="60" cy="90" rx="50" ry="15" fill="rgba(0,0,0,0.3)" />
      <ellipse cx="60" cy="85" rx="52" ry="18" fill="url(#grad-loop-metal)" stroke="#d97706" stroke-width="2" />
      <path d="M 10,85 L 8,82 L 12,82 Z M 110,85 L 112,82 L 108,82 Z M 60,67 L 57,65 L 63,65 Z M 60,103 L 63,105 L 57,105 Z" fill="#d97706" />
      <path d="M 22,76 L 19,73 L 23,72 Z M 98,76 L 101,73 L 97,72 Z M 32,94 L 29,97 L 33,98 Z M 88,94 L 91,97 L 87,98 Z" fill="#d97706" />
      <ellipse cx="60" cy="85" rx="36" ry="11" fill="#1e1b4b" stroke="url(#grad-loop-neon)" stroke-width="3" />
      <g class="vertical-waterwheel" style="transform-origin: 60px 60px;">
        <circle cx="60" cy="60" r="24" fill="none" stroke="#d97706" stroke-width="4" />
        <circle cx="60" cy="60" r="16" fill="none" stroke="#b45309" stroke-width="2" />
        <line x1="60" y1="36" x2="60" y2="84" stroke="#d97706" stroke-width="2.5" />
        <line x1="36" y1="60" x2="84" y2="60" stroke="#d97706" stroke-width="2.5" />
        <line x1="43" y1="43" x2="77" y2="77" stroke="#d97706" stroke-width="2" />
        <line x1="43" y1="77" x2="77" y2="43" stroke="#d97706" stroke-width="2" />
        <rect x="57" y="32" width="6" height="6" fill="#f59e0b" />
        <rect x="57" y="82" width="6" height="6" fill="#f59e0b" />
        <rect x="32" y="57" width="6" height="6" fill="#f59e0b" />
        <rect x="82" y="57" width="6" height="6" fill="#f59e0b" />
      </g>
      <path d="M 20,83 C 20,93 100,93 100,83" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="4,6" class="piping-glow" />
    `;
  } else if (worldId === "world-decisions") {
    defs += `
      <linearGradient id="grad-dec-stone" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#475569" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <linearGradient id="grad-dec-lava" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="50%" stop-color="#047857" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>
    </defs>
    `;

    content += `
      <ellipse cx="60" cy="85" rx="54" ry="20" fill="url(#grad-dec-stone)" stroke="#334155" stroke-width="2" />
      <ellipse cx="60" cy="88" rx="46" ry="15" fill="#0f172a" />
      <path d="M 60,100 L 60,86 L 38,72 M 60,86 L 82,72" fill="none" stroke="url(#grad-dec-lava)" stroke-width="6" stroke-linecap="round" filter="url(#glow-light)" class="split-path-neon" />
      <path d="M 60,100 L 60,86 L 38,72 M 60,86 L 82,72" fill="none" stroke="#a7f3d0" stroke-width="2.5" stroke-linecap="round" />
      <g>
        <path d="M 28,72 L 28,54 A 10,10 0 0 1 48,54 L 48,72" fill="none" stroke="#1e293b" stroke-width="4" />
        <path d="M 72,72 L 72,54 A 10,10 0 0 1 92,54 L 92,72" fill="none" stroke="#1e293b" stroke-width="4" />
      </g>
      <g>
        <line x1="50" y1="94" x2="50" y2="84" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="50" cy="82" r="3.5" fill="#10b981" filter="url(#glow-light)" class="torch-fire" />
        <circle cx="50" cy="82" r="1.5" fill="#ecfdf5" />
        <line x1="70" y1="94" x2="70" y2="84" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="70" cy="82" r="3.5" fill="#10b981" filter="url(#glow-light)" class="torch-fire" />
        <circle cx="70" cy="82" r="1.5" fill="#ecfdf5" />
      </g>
    `;
  } else if (worldId === "world-data") {
    defs += `
      <linearGradient id="grad-data-plat" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
      <linearGradient id="grad-data-glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ec4899" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
      <linearGradient id="grad-crystal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#a5f3fc" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#0891b2" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    `;

    content += `
      <polygon points="60,65 105,75 105,92 60,104 15,92 15,75" fill="url(#grad-data-plat)" stroke="url(#grad-data-glow)" stroke-width="2.5" />
      <polygon points="60,67 100,76 100,88 60,99 20,88 20,76" fill="#030712" opacity="0.8"/>
      <g class="crystal-column-a">
        <rect x="34" y="60" width="10" height="24" rx="2" fill="url(#grad-crystal)" stroke="#06b6d4" stroke-width="1" />
        <polygon points="34,60 39,56 44,60 39,64" fill="#e0f7fa" opacity="0.6"/>
      </g>
      <g class="crystal-column-b">
        <rect x="48" y="48" width="12" height="38" rx="2" fill="url(#grad-crystal)" stroke="#06b6d4" stroke-width="1" />
        <polygon points="48,48 54,42 60,48 54,53" fill="#e0f7fa" opacity="0.8"/>
      </g>
      <g class="crystal-column-c">
        <rect x="64" y="54" width="10" height="30" rx="2" fill="url(#grad-crystal)" stroke="#06b6d4" stroke-width="1" />
        <polygon points="64,54 69,50 74,54 69,58" fill="#e0f7fa" opacity="0.7"/>
      </g>
      <polygon points="54,26 60,18 66,26 60,34" fill="#f43f5e" filter="url(#glow-light)" class="data-core-top" />
      <polygon points="54,26 60,34 66,26 60,30" fill="#db2777" class="data-core-bottom" />
      <polygon points="54,26 60,18 60,34" fill="#fda4af" opacity="0.6" />
    `;
  }

  if (isCompleted) {
    content += `
      <g filter="url(#glow-light)">
        <circle cx="60" cy="18" r="9" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
        <polygon points="60,11 62.5,15.5 67,16 63.5,19 64.5,23.5 60,21 55.5,23.5 56.5,19 53,16 57.5,15.5" fill="#fef08a" />
      </g>
    `;
  }

  if (isLocked) {
    content += `
      <g stroke="#475569" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.8">
        <path d="M 18,88 L 102,74" />
        <path d="M 22,74 L 98,88" />
      </g>
      <g stroke="#94a3b8" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9">
        <path d="M 18,88 L 102,74" stroke-dasharray="5,8" />
        <path d="M 22,74 L 98,88" stroke-dasharray="5,8" />
      </g>
      <rect x="47" y="70" width="26" height="22" rx="4" fill="#334155" stroke="#475569" stroke-width="2" />
      <path d="M 52,70 L 52,62 A 8,8 0 0 1 68,62 L 68,70" fill="none" stroke="#475569" stroke-width="3" />
      <circle cx="60" cy="79" r="2.5" fill="#0f172a" />
      <line x1="60" y1="81.5" x2="60" y2="87" stroke="#0f172a" stroke-width="2" stroke-linecap="round" />
    `;
  }

  defs += `</defs>`;
  const filterStyle = isLocked ? `filter: grayscale(0.8) brightness(0.6) contrast(0.9); opacity: 0.72;` : ``;

  return `
    <svg viewBox="0 0 120 120" width="100%" height="100%" style="${filterStyle}" xmlns="http://www.w3.org/2000/svg">
      ${defs}
      ${content}
    </svg>
  `;
}

function initSubmapCanvas(worldId, nodes) {
  const canvas = document.getElementById("submap-v2-canvas-bg");
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  let animationId = null;
  let width = 0;
  let height = 0;

  let primaryColor = "rgba(96, 165, 250, 0.4)";
  let secondaryColor = "rgba(224, 242, 254, 0.15)";
  let waterBgGrad = ["#0c2548", "#041226"];

  if (worldId === "world-loops") {
    primaryColor = "rgba(192, 132, 252, 0.45)";
    secondaryColor = "rgba(251, 146, 60, 0.2)";
    waterBgGrad = ["#1e1135", "#0a0418"];
  } else if (worldId === "world-decisions") {
    primaryColor = "rgba(16, 185, 129, 0.45)";
    secondaryColor = "rgba(139, 92, 246, 0.2)";
    waterBgGrad = ["#071926", "#020912"];
  } else if (worldId === "world-data") {
    primaryColor = "rgba(6, 182, 212, 0.45)";
    secondaryColor = "rgba(236, 72, 153, 0.22)";
    waterBgGrad = ["#0e0a26", "#040212"];
  } else if (worldId === "world-sequences") {
    primaryColor = "rgba(96, 165, 250, 0.45)";
    secondaryColor = "rgba(253, 224, 71, 0.2)";
    waterBgGrad = ["#0c2548", "#041226"];
  }

  const particles = [];
  const particleCount = 28;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 3 + 1,
      opacity: Math.random(),
      speed: Math.random() * 0.008 + 0.002,
      phase: Math.random() * Math.PI * 2
    });
  }

  const whale = {
    x: -200,
    y: 0,
    targetY: 0,
    speed: 0.8,
    active: false,
    timer: Math.random() * 200 + 100,
    scale: 0.6,
    angle: 0
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  let time = 0;

  function draw() {
    time += 0.02;

    if (!document.getElementById("submap-v2-canvas-bg")) {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      return;
    }

    const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
    baseGrad.addColorStop(0, waterBgGrad[0]);
    baseGrad.addColorStop(1, waterBgGrad[1]);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const waveHeight = 15 - layer * 3;
      const speed = 0.01 + layer * 0.005;
      ctx.fillStyle = `rgba(${layer === 0 ? 99 : 25}, ${layer === 0 ? 102 : 62}, ${layer === 0 ? 241 : 153}, ${0.03 - layer * 0.008})`;
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 40) {
        const y = height * 0.4 + layer * height * 0.18 + Math.sin(x * 0.004 + time + layer) * waveHeight * 1.5;
        if (x === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = primaryColor;

    ctx.beginPath();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 5;
    nodes.forEach((node, i) => {
      const px = (node.x / 100) * width;
      const py = (node.y / 100) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.shadowColor = primaryColor;

    const segmentCount = nodes.length - 1;
    for (let seg = 0; seg < segmentCount; seg++) {
      const nodeA = nodes[seg];
      const nodeB = nodes[seg + 1];
      const ax = (nodeA.x / 100) * width;
      const ay = (nodeA.y / 100) * height;
      const bx = (nodeB.x / 100) * width;
      const by = (nodeB.y / 100) * height;

      for (let p = 0; p < 2; p++) {
        const offsetVal = (time * 0.14 + p * 0.5 + seg * 0.3) % 1.0;
        const px = ax + (bx - ax) * offsetVal;
        const py = ay + (by - ay) * offsetVal;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.filter = "blur(10px)";
    nodes.forEach((node) => {
      const px = (node.x / 100) * width;
      const py = (node.y / 100) * height;

      const bobTime = time * 2.6 - node.index * 0.42;
      const bobOffset = Math.sin(bobTime);
      const shadowScale = 1.0 - bobOffset * 0.08;

      ctx.beginPath();
      ctx.ellipse(px, py + 25, 45 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.filter = "none";

    ctx.save();
    particles.forEach((p) => {
      p.phase += p.speed;
      const opacity = Math.abs(Math.sin(p.phase));
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.55})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.size * (0.6 + opacity * 0.4), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    if (!whale.active) {
      whale.timer--;
      if (whale.timer <= 0) {
        whale.active = true;
        whale.x = -150;
        whale.y = Math.random() * (height * 0.6) + height * 0.2;
        whale.targetY = whale.y + (Math.random() * 100 - 50);
        whale.scale = Math.random() * 0.4 + 0.4;
      }
    } else {
      whale.x += whale.speed;
      whale.y += (whale.targetY - whale.y) * 0.005;
      whale.angle = Math.sin(time * 0.2) * 0.08;

      ctx.save();
      ctx.translate(whale.x, whale.y);
      ctx.rotate(whale.angle);
      ctx.scale(whale.scale, whale.scale);

      ctx.fillStyle = "rgba(4, 25, 52, 0.16)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(40, -18, 90, -15);
      ctx.quadraticCurveTo(130, -5, 150, 5);
      ctx.quadraticCurveTo(165, 0, 175, -12);
      ctx.quadraticCurveTo(172, 10, 180, 15);
      ctx.quadraticCurveTo(172, 20, 175, 42);
      ctx.quadraticCurveTo(165, 30, 150, 25);
      ctx.quadraticCurveTo(110, 30, 80, 25);
      ctx.quadraticCurveTo(20, 22, 0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(80, 16);
      ctx.quadraticCurveTo(95, 36, 110, 38);
      ctx.quadraticCurveTo(95, 26, 80, 16);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      if (whale.x > width + 200) {
        whale.active = false;
        whale.timer = Math.random() * 400 + 300;
      }
    }

    ctx.save();
    const beamGrad = ctx.createLinearGradient(width * 0.8, 0, width * 0.5, height);
    const beamOpacity = 0.08 + Math.sin(time * 0.5) * 0.03;
    beamGrad.addColorStop(0, `rgba(255, 255, 255, ${beamOpacity * 1.5})`);
    beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = beamGrad;

    ctx.beginPath();
    ctx.moveTo(width * 0.7, 0);
    ctx.lineTo(width * 0.9, 0);
    ctx.lineTo(width * 0.7, height);
    ctx.lineTo(width * 0.3, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    animationId = requestAnimationFrame(draw);
  }

  draw();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    }
  };
}

function renderMapNode(node, isSelected, worldId) {
  const isSequences = worldId === "world-sequences";
  // La misión 1 (index 0) y todo el primer mundo deben mantener su arte de isla original
  const useOriginal = isSequences || node.index === 0;

  const artContent = useOriginal
    ? `<img class="submap-v2-node-art" src="${node.art}" alt="" />`
    : `<span class="submap-v2-node-art-wrap" aria-hidden="true">${renderIslandSvg(worldId, node.index, node.missionState)}</span>`;

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
        ${artContent}
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

  const isSequences = world.id === "world-sequences";
  const backdropHtml = isSequences
    ? `
      <div class="submap-v2-scene-backdrop"></div>
      <div class="submap-v2-sunbeam"></div>
      <div class="submap-v2-ambient" aria-hidden="true">
        <span class="submap-v2-cloud cloud-a"></span>
        <span class="submap-v2-cloud cloud-b"></span>
        <span class="submap-v2-cloud cloud-c"></span>
        <span class="submap-v2-cloud cloud-d"></span>
        <span class="submap-v2-sparkle sparkle-a"></span>
        <span class="submap-v2-sparkle sparkle-b"></span>
        <span class="submap-v2-sparkle sparkle-c"></span>
        <span class="submap-v2-sparkle sparkle-d"></span>
        <span class="submap-v2-sparkle sparkle-e"></span>
        <span class="submap-v2-sparkle sparkle-f"></span>
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
    `
    : `<canvas id="submap-v2-canvas-bg" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></canvas>`;

  appShell.innerHTML = `
    <div class="submap-view-wrapper world-theme-${world.id}">
      <header class="topbar submap-v2-topbar submap-v2-hidden-topbar">
        <div class="topbar-left submap-v2-topbar-left">
          <div class="pill level-pill submap-v2-level-pill">
            <span class="mission-header-badge ui-icon-wrap">${uiIcon("trophy")}</span>
            <span>Yo Aprendo</span>
          </div>
          <span class="mission-header-chevron" aria-hidden="true">${uiIcon("arrow-right")}</span>
          <div class="pill title-pill mission-header-pill mission-header-pill-title submap-v2-title-pill">
            <img class="submap-v2-pill-art" src="./img/start-island-treasure.png" alt="" />
            <span>${world.title}</span>
          </div>
        </div>

        <div class="topbar-right submap-v2-topbar-right">
          <button class="pill nav-pill mission-header-pill" id="goHomeBtn" type="button">
            <span class="mission-header-icon ui-icon-wrap">${uiIcon("home")}</span>
            <span>Inicio</span>
          </button>
          <button class="pill nav-pill mission-header-pill" id="openDashboardBtn" type="button">
            <span class="mission-header-icon ui-icon-wrap">${uiIcon("panels")}</span>
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
          <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("map")}</span>
          <span class="mission-guided-side-copy">
            <strong>Yo Aprendo</strong>
            <small>${world.title}</small>
          </span>
        </aside>
        <aside class="mission-guided-side-card mission-guided-side-card-right submap-v2-hud-card submap-v2-hud-card-right" aria-label="Navegacion y premios">
          <span class="mission-guided-wallet">
            <span><i class="mission-guided-coin-icon" aria-hidden="true"></i><span>${appState.coins}</span></span>
            <span><i class="mission-guided-gem-icon" aria-hidden="true"></i><span>${appState.gems}</span></span>
          </span>
          <button id="submapHudHomeBtn" type="button" aria-label="Inicio">
            <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("home")}</span>
            <small>Inicio</small>
          </button>
          <button id="submapHudDashboardBtn" type="button" aria-label="Paneles">
            <span class="mission-guided-grid-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span>
            <small>Paneles</small>
          </button>
        </aside>
        <section class="submap-v2-layout">
          <div class="submap-v2-stage">
            ${backdropHtml}

            <div class="submap-v2-node-layer" style="position: absolute; inset: 0; z-index: 3;">
              ${missionNodes.map((node) => renderMapNode(node, node.id === selectedNode?.id, world.id)).join("")}
            </div>

            <div class="submap-v2-stage-callout" style="z-index: 8;">
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
                    <h2 id="submapGuideTitle">¿Qué hago ahora?</h2>
                  </div>
                  <span class="submap-v2-guide-step" id="submapGuideStep">1/4</span>
                </div>
                <p id="submapGuideBody">${guideCopy.body}</p>

                <div class="submap-v2-dialog-mission" id="submapGuideMission">
                  <div class="submap-v2-selected-number">${selectedNode?.number || 1}</div>
                  <div class="submap-v2-selected-copy">
                    <h3 id="submapDialogMissionTitle">${selectedNode?.title || "Elegí una misión"}</h3>
                    <p id="submapDialogMissionDescription">
                      ${selectedNode?.challenge?.prompt || "Haz click en una misión para viajar a su isla."}
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
                      Entrar a la misión
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
                  Entrar a la misión
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
    </div>
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
    const missionText = node?.challenge?.prompt || "Haz click en una mini isla para elegir el próximo reto.";
    const rewardText = node
      ? `Si completas esta misión puedes ganar ${node.coins || 0} monedas y ${node.gems || 0} gemas.`
      : guideCopy.reward;

    return [
      {
        title: "La historia del faro",
        body: guideCopy.body
      },
      {
        title: "¿Qué hago ahora?",
        body: guideCopy.now
      },
      {
        title: node ? node.title : "Elige una misión",
        body: `${missionText} Estado actual: ${status}.`
      },
      {
        title: "Premios y viaje",
        body: `${rewardText} Cuando estés listo, entrá a la misión para seguir reparando el faro.`,
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
      if (dialogMissionTitleEl) dialogMissionTitleEl.textContent = "Elegí una misión";
      if (dialogMissionDescriptionEl) dialogMissionDescriptionEl.textContent = "Haz click en una misión para viajar a su isla.";
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
      playLocked();
      return;
    }

    playMissionOpen();
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

    playMissionOpen();
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
    const isOpen = !guideCardEl?.classList.contains("is-open");
    if (isOpen) {
      playPanelOpen();
    } else {
      playUiClick();
    }
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
  if (!isSequences) {
    initSubmapCanvas(world.id, missionNodes);
  }
}

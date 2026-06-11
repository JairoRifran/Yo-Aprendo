import { grade4Data } from "../data/grade4.js";
import { appState } from "../state/appState.js";
import { completeMission } from "../utils/progress.js";
import { goToDashboard, goToResult, goToStart, goToSubmap } from "../utils/navigation.js";
import {
  unlockAudio,
  playUiClick,
  playSelect,
  playSuccess,
  playError,
  playReward,
  playStep,
  playTurn,
  playBlocked,
  playPanelOpen,
  playCommandAdd,
  playCommandMove,
  playCommandUndo,
  playCommandReset,
  playProgramRun,
  playGoalBurst
} from "../utils/audio.js";
import { uiIcon } from "../utils/icons.js";

const DIRECTIONS = ["up", "right", "down", "left"];
const DIRECTION_DELTAS = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 }
};
const DIRECTION_ARROWS = {
  up: "↑",
  right: "→",
  down: "↓",
  left: "←"
};
const COMMAND_LABELS = {
  forward: "Avanzar",
  left: "Girar izquierda",
  right: "Girar derecha"
};

const COMMAND_SHORT_LABELS = {
  forward: "Avanza",
  left: "Izquierda",
  right: "Derecha"
};

const REORDER_ART = {
  robot: "./img/mission-robot-pirate.png",
  platform: "./img/mission-platform.png",
  notebook: "./img/mission-notebook.png",
  canteen: "./img/mission-canteen.png",
  backpackOpen: "./img/mission-backpack-open.png",
  backpackClosed: "./img/mission-backpack-closed.png",
  algorithm: {
    map: "./img/mission-algorithm-map.png",
    batteries: "./img/mission-algorithm-batteries.png",
    openFlashlight: "./img/mission-algorithm-open-flashlight.png",
    closeFlashlight: "./img/mission-algorithm-close-flashlight.png",
    lightOn: "./img/mission-algorithm-light-on.png"
  },
  orderCorrect: {
    soap: "./img/order-correct-paso1.png",
    towel: "./img/order-correct-paso2.png",
    faucet: "./img/order-correct-paso3.png",
    rinse: "./img/order-correct-paso4.png",
    wet: "./img/order-correct-paso5.png",
    scrub: "./img/order-correct-paso6.png"
  }
};

const PATH_GUIDED_ART = {
  bg: "./img/path-guided-bg.png",
  board: "./img/path-guided-board.png",
  robot: "./img/path-guided-robot.png",
  topPanel: "./img/path-guided-top-panel.png",
  commandsPanel: "./img/path-guided-commands-panel.png",
  routePanel: "./img/path-guided-route-panel.png",
  leftButton: "./img/path-guided-btn-left.png",
  forwardButton: "./img/path-guided-btn-forward.png",
  rightButton: "./img/path-guided-btn-right.png",
  runButton: "./img/path-guided-btn-run.png",
  undoButton: "./img/path-guided-btn-undo.png",
  resetButton: "./img/path-guided-btn-reset.png"
};

const PATH_GUIDED_COMMAND_ASSETS = {
  left: PATH_GUIDED_ART.leftButton,
  forward: PATH_GUIDED_ART.forwardButton,
  right: PATH_GUIDED_ART.rightButton
};

const MISSION4_STEP_ART = {
  "buscar jarra": "./img/mission4-find-pitcher.png?v=2",
  "exprimir limones": "./img/mission4-squeeze-lemon.png?v=2",
  "poner azucar": "./img/mission4-sugar.png?v=2",
  "poner agua": "./img/mission4-find-pitcher.png?v=2",
  mezclar: "./img/mission4-mix.png?v=2"
};

function getMission4StepArt(step) {
  return MISSION4_STEP_ART[String(step || "").toLowerCase()] || "";
}

const MISSION5_ART = {
  bg: "./img/mission5-ocean-bg.png?v=1",
  arrow: "./img/mission5-arrow.png?v=1",
  start: "./img/mission5-start-island.png?v=1",
  lighthouse: "./img/mission5-lighthouse-island.png?v=1",
  rock: "./img/mission5-rock.png?v=1",
  whirlpool: "./img/mission5-whirlpool.png?v=1",
  tile: "./img/mission5-path-tile.png?v=1",
  robot: REORDER_ART.robot
};

const MISSION5_ROUTES = [
  {
    id: "a",
    label: "Ruta A",
    result: "choca con la roca",
    verdict: "danger",
    steps: ["right", "up", "up", "right"],
    trail: [
      { x: 36, y: 48, w: 42, h: 8 }
    ],
    tiles: [
      { x: 20, y: 48, dir: "right" },
      { x: 27, y: 48, dir: "right" },
      { x: 34, y: 48, dir: "right" },
      { x: 41, y: 48, dir: "right" },
      { x: 48, y: 48, dir: "right" },
      { x: 55, y: 48, dir: "right", danger: "rock" }
    ],
    start: { x: 9, y: 48 },
    goal: { x: 69, y: 48 },
    hazard: { type: "rock", x: 56, y: 48 },
    robotEnd: { x: 55, y: 48 }
  },
  {
    id: "b",
    label: "Ruta B",
    result: "rodea el obstáculo",
    verdict: "success",
    steps: ["right", "up", "up", "right", "right"],
    trail: [
      { x: 27, y: 48, w: 22, h: 8 },
      { x: 38, y: 27, w: 8, h: 38 },
      { x: 52, y: 27, w: 28, h: 8 },
      { x: 66, y: 40, w: 8, h: 30 }
    ],
    tiles: [
      { x: 20, y: 48, dir: "right" },
      { x: 28, y: 48, dir: "right" },
      { x: 38, y: 48, dir: "up" },
      { x: 38, y: 27, dir: "right" },
      { x: 48, y: 27, dir: "right" },
      { x: 58, y: 27, dir: "right" },
      { x: 64, y: 48, dir: "right" }
    ],
    start: { x: 9, y: 48 },
    goal: { x: 69, y: 48 },
    hazard: { type: "rock", x: 50, y: 50 },
    robotEnd: { x: 62, y: 48 }
  },
  {
    id: "c",
    label: "Ruta C",
    result: "se pierde en el remolino",
    verdict: "danger",
    steps: ["up", "right", "right", "down"],
    trail: [
      { x: 31, y: 48, w: 30, h: 8 }
    ],
    start: { x: 9, y: 48 },
    goal: { x: 69, y: 48 },
    hazard: { type: "whirlpool", x: 58, y: 48 },
    robotEnd: { x: 51, y: 48 },
    tiles: [
      { x: 20, y: 48, dir: "right" },
      { x: 27, y: 48, dir: "right" },
      { x: 34, y: 48, dir: "right" },
      { x: 41, y: 48, dir: "right" },
      { x: 48, y: 48, dir: "right", danger: "whirlpool" }
    ]
  }
];

function getMission5ArrowRotation(direction) {
  if (direction === "up") return "-90deg";
  if (direction === "down") return "90deg";
  if (direction === "left") return "180deg";
  return "0deg";
}

function renderMission5Route(route, localState) {
  const selected = localState.selectedOptionId === route.id;
  const isCorrect = route.verdict === "success";

  return `
    <button
      class="mission5-route mission5-route-${route.id} ${selected ? "selected" : ""} ${selected && isCorrect ? "is-correct" : ""} ${selected && !isCorrect ? "is-danger" : ""}"
      data-option-id="${route.id}"
      type="button"
      style="--robot-start-x:${route.start.x + 7}%; --robot-start-y:${route.start.y + 1}%; --robot-end-x:${route.robotEnd.x}%; --robot-end-y:${route.robotEnd.y}%;"
      aria-label="${route.label}: ${route.result}"
    >
      <span class="mission5-route-label">${route.id.toUpperCase()}</span>
      <img
        class="mission5-start-island"
        src="${MISSION5_ART.start}"
        alt=""
        aria-hidden="true"
        style="--asset-x:${route.start.x}%; --asset-y:${route.start.y}%;"
      />
      <img
        class="mission5-goal-island"
        src="${MISSION5_ART.lighthouse}"
        alt=""
        aria-hidden="true"
        style="--asset-x:${route.goal.x}%; --asset-y:${route.goal.y}%;"
      />
      <span
        class="mission5-hazard mission5-hazard-${route.hazard.type}"
        style="--asset-x:${route.hazard.x}%; --asset-y:${route.hazard.y}%;"
        aria-hidden="true"
      >
        <img src="${route.hazard.type === "whirlpool" ? MISSION5_ART.whirlpool : MISSION5_ART.rock}" alt="" />
      </span>
      <span class="mission5-route-glow" aria-hidden="true"></span>
      ${(route.trail || [])
        .map(
          (segment, segmentIndex) => `
            <span
              class="mission5-trail-segment"
              style="--trail-x:${segment.x}%; --trail-y:${segment.y}%; --trail-w:${segment.w}%; --trail-h:${segment.h}%; --trail-delay:${segmentIndex};"
              aria-hidden="true"
            ></span>
          `
        )
        .join("")}
      ${route.tiles
        .map(
          (tile, tileIndex) => `
            <span
              class="mission5-tile ${tile.danger ? `mission5-tile-${tile.danger}` : ""}"
              style="--tile-x:${tile.x}%; --tile-y:${tile.y}%; --tile-delay:${tileIndex};"
              aria-hidden="true"
            >
              <img class="mission5-tile-base" src="${MISSION5_ART.tile}" alt="" />
              <img
                class="mission5-tile-arrow"
                src="${MISSION5_ART.arrow}"
                alt=""
                style="--arrow-rotation:${getMission5ArrowRotation(tile.dir)};"
              />
            </span>
          `
        )
        .join("")}
      <img class="mission5-route-robot" src="${MISSION5_ART.robot}" alt="" aria-hidden="true" />
      <span class="mission5-route-result" aria-hidden="true">
        ${isCorrect ? uiIcon("check") : uiIcon("x")}
      </span>
      <span class="mission5-route-caption">
        <strong>${route.label}</strong>
        <small>${selected ? route.result : "Toca para simular"}</small>
      </span>
    </button>
  `;
}

const PATH_GUIDED_BOARD_POINTS = [
  [
    { x: 24.2, y: 19.7 },
    { x: 40.7, y: 19.7 },
    { x: 57.3, y: 19.7 },
    { x: 73.7, y: 19.7 }
  ],
  [
    { x: 24.2, y: 38.6 },
    { x: 40.7, y: 38.6 },
    { x: 57.3, y: 38.6 },
    { x: 73.7, y: 38.6 }
  ],
  [
    { x: 24.2, y: 57.6 },
    { x: 40.7, y: 57.6 },
    { x: 57.3, y: 57.6 },
    { x: 73.7, y: 57.6 }
  ],
  [
    { x: 24.2, y: 76.3 },
    { x: 40.7, y: 76.3 },
    { x: 57.3, y: 76.3 },
    { x: 73.7, y: 76.3 }
  ]
];

function getPathBoardPoint(row = 0, col = 0) {
  return PATH_GUIDED_BOARD_POINTS[row]?.[col] || PATH_GUIDED_BOARD_POINTS[0][0];
}

function getPathBoardStyle(row = 0, col = 0) {
  const point = getPathBoardPoint(row, col);
  return `--tile-x:${point.x}%; --tile-y:${point.y}%;`;
}

function getPathBoardStyleForBoard(board = {}, row = 0, col = 0) {
  if ((board.rows || 0) <= 4 && (board.cols || 0) <= 4) {
    return getPathBoardStyle(row, col);
  }

  const rows = Math.max(board.rows || 1, 1);
  const cols = Math.max(board.cols || 1, 1);
  const x = 15.5 + (cols <= 1 ? 0 : (col * 69) / (cols - 1));
  const y = 16.5 + (rows <= 1 ? 0 : (row * 68) / (rows - 1));
  return `--tile-x:${x}%; --tile-y:${y}%;`;
}

function withAssistantState(state) {
  return {
    assistantPinned: false,
    ...state
  };
}

function getMissionPlayerName() {
  return (
    appState.session?.display_name?.trim() ||
    appState.currentUserName?.trim() ||
    "explorador"
  );
}

function getCurrentWorld() {
  return grade4Data.worlds.find((world) => world.id === appState.selectedWorldId) || null;
}

function getMissionStoryBeat(mission, challenge) {
  const world = getCurrentWorld();
  const worldName = world?.short || "esta isla";
  const missionName = mission?.title || "esta misión";

  if (challenge.type === "reorder") {
    return `En ${worldName}, ${missionName} ayuda a encender una pista del faro: cuando ordenas pasos, conviertes una idea grande en instrucciones pequeñas y claras.`;
  }

  if (challenge.type === "path-program") {
    return `En ${worldName}, ${missionName} prueba una ruta del mapa. Programar no es adivinar: es planear, ejecutar, mirar el resultado y ajustar.`;
  }

  if (challenge.type === "loop-builder") {
    return `En ${worldName}, ${missionName} revela un patrón repetido. Si el mismo paso vuelve muchas veces, el robot puede usar un bucle para ahorrar energía.`;
  }

  if (challenge.type === "multiple-choice") {
    return `En ${worldName}, ${missionName} abre una decisión del camino. Comparar opciones te ayuda a elegir la regla que mejor resuelve el problema.`;
  }

  if (challenge.type === "categorize") {
    return `En ${worldName}, ${missionName} ordena pistas del archipiélago. Clasificar datos permite entenderlos antes de decidir que hacer.`;
  }

  return `En ${worldName}, ${missionName} suma una pieza a la historia del faro y al mapa del código.`;
}

function getChallengeTheory(challenge) {
  if (challenge.type === "reorder") {
    return "Idea clave: una secuencia es un algoritmo. El orden importa porque cada paso prepara el siguiente.";
  }

  if (challenge.type === "path-program") {
    return "Idea clave: un programa es una lista de comandos que se puede probar. Si falla, se depura cambiando una parte.";
  }

  if (challenge.type === "loop-builder") {
    return "Idea clave: un bucle repite una acción. Sirve cuando detectas un patrón y quieres escribir menos instrucciones.";
  }

  if (challenge.type === "multiple-choice") {
    return "Idea clave: una condición ayuda a decidir. Lee cada caso y busca que regla se cumple.";
  }

  if (challenge.type === "categorize") {
    return "Idea clave: los datos se entienden mejor cuando se agrupan por una caracteristica comun.";
  }

  return "Idea clave: pensar como programador es dividir, probar y mejorar.";
}

function getMissionAssistantLines(mission, challenge) {
  const playerName = getMissionPlayerName();
  const prompt = challenge.prompt || "Vamos paso a paso y resolvamos este reto.";

  if (challenge.type === "reorder") {
    return {
      title: `Hola, ${playerName}`,
      body: `Toca una tarjeta y usa Antes o Después para ordenar la secuencia.`,
      hint: prompt
    };
  }

  if (challenge.type === "path-program") {
    return {
      title: `Vamos, ${playerName}`,
      body: "Agrega bloques de movimiento y luego ejecuta la ruta para ver si llega a la meta.",
      hint: prompt
    };
  }

  if (challenge.type === "multiple-choice") {
    return {
      title: `${playerName}, mira bien`,
      body: "Lee todas las opciones y elige la que tenga el orden correcto.",
      hint: prompt
    };
  }

  if (challenge.type === "categorize") {
    return {
      title: `${playerName}, organizá las tarjetas`,
      body: "Haz click en cada una hasta dejarla en la categoría correcta.",
      hint: prompt
    };
  }

  if (challenge.type === "loop-builder") {
    return {
      title: `Atento, ${playerName}`,
      body: "Elige cuántas veces se repite la acción y arma el bucle correcto.",
      hint: prompt
    };
  }

  return {
    title: `Hola, ${playerName}`,
    body: "Estoy aquí para guiarte en esta misión.",
    hint: prompt
  };
}

function getMissionAssistantContent(mission, challenge, topic = "task") {
  const playerName = getMissionPlayerName();
  const prompt = challenge.prompt || "Vamos paso a paso y resolvamos este reto.";
  const missionName = mission.title || "esta misión";
  const storyBeat = getMissionStoryBeat(mission, challenge);
  const theory = getChallengeTheory(challenge);

  if (challenge.type === "reorder") {
    if (topic === "hint") {
      return {
        title: `${playerName}, piensa primero`,
        body: "Busca la acción que debe pasar antes que todas y luego acomoda las demas sin apurarte.",
        hint: "No hace falta adivinar: toca una tarjeta y muévela de a un paso."
      };
    }

    if (topic === "chat") {
      return {
        title: `Estoy contigo, ${playerName}`,
        body: "Puedes abrirme cuando quieras. Yo te recuerdo la consigna y te doy una ayuda cortita sin romper el juego.",
        hint: `En ${missionName}, tu meta es ordenar bien los pasos para completar la secuencia.`
      };
    }

    return {
      title: `Hola, ${playerName}`,
      body: "Toca una tarjeta y usa Antes o Después para ordenar la secuencia en el orden correcto.",
      hint: prompt
    };
  }

  if (challenge.type === "path-program") {
    if (topic === "hint") {
      return {
        title: `${playerName}, mira el camino`,
        body: "Antes de ejecutar, imagina hacia dónde mira el personaje y cuenta cuántos movimientos necesita.",
        hint: "Si algo falla, cambia solo un bloque y vuelve a probar."
      };
    }

    if (topic === "chat") {
      return {
        title: `Te acompaño, ${playerName}`,
        body: "Puedes consultarme cuando quieras. Te ayudo a pensar la ruta sin resolverla por ti.",
        hint: `En ${missionName}, programa la ruta paso a paso hasta llegar a la meta.`
      };
    }

    return {
      title: `Vamos, ${playerName}`,
      body: "Agrega bloques de movimiento y luego ejecuta la ruta para ver si el personaje llega a la meta.",
      hint: prompt
    };
  }

  if (challenge.type === "multiple-choice") {
    if (topic === "hint") {
      return {
        title: `${playerName}, compará opciones`,
        body: "Lee cada opcion completa. Descarta primero las que tengan un paso fuera de lugar.",
        hint: "Cuando dudes, piensa qué acción necesariamente tiene que ocurrir primero."
      };
    }

    if (topic === "chat") {
      return {
        title: `Cuenta conmigo, ${playerName}`,
        body: "Si quieres, vuelve a tocarme y repasamos la consigna cuántas veces necesites.",
        hint: `En ${missionName}, hay que elegir la alternativa que mejor resuelve el reto.`
      };
    }

    return {
      title: `${playerName}, mira bien`,
      body: "Lee todas las opciones y elige la que tenga el orden correcto.",
      hint: prompt
    };
  }

  if (challenge.type === "categorize") {
    if (topic === "hint") {
      return {
        title: `${playerName}, ordena con calma`,
        body: "Busca una pista en cada tarjeta para decidir en qué grupo va mejor.",
        hint: "Puedes cambiar una tarjeta varias veces hasta que todo quede bien."
      };
    }

    if (topic === "chat") {
      return {
        title: `Hablemos, ${playerName}`,
        body: "Estoy aquí para recordarte la regla del reto cuando la necesites.",
        hint: `En ${missionName}, organizá cada elemento en su categoría correcta.`
      };
    }

    return {
      title: `${playerName}, organizá las tarjetas`,
      body: "Haz click en cada una hasta dejarla en la categoría correcta.",
      hint: prompt
    };
  }

  if (challenge.type === "loop-builder") {
    if (topic === "hint") {
      return {
        title: `${playerName}, busca la repetición`,
        body: "Piensa qué acción se repite igual varias veces y luego decide cuántas veces ocurre.",
        hint: "Si el patrón es siempre el mismo, seguramente conviene usar un bucle."
      };
    }

    if (topic === "chat") {
      return {
        title: `Seguimos juntos, ${playerName}`,
        body: "Puedes tocarme cuando quieras para repasar la misión o pedir una pista corta.",
        hint: `En ${missionName}, tienes que armar una repetición correcta.`
      };
    }

    return {
      title: `Atento, ${playerName}`,
      body: "Elige cuántas veces se repite la acción y arma el bucle correcto.",
      hint: prompt
    };
  }

  return getMissionAssistantLines(mission, challenge);
}

function renderMissionAssistant(mission, challenge, localState) {
  const topic = localState.assistantTopic || "task";
  let copy = getMissionAssistantContent(mission, challenge, topic);
  if (mission?.id === "4-1-final" && topic === "task") {
    copy = {
      title: `Vamos, ${getMissionPlayerName()}`,
      body: "Arma una ruta corta: avanza, gira y ejecuta para que Bit llegue al faro sin tocar la roca.",
      hint: "Cuenta las islas antes de tocar Ejecutar."
    };
  } else if (topic === "task") {
    copy = {
      ...copy,
      body: `${getMissionStoryBeat(mission, challenge)} ${getChallengeTheory(challenge)}`
    };
  }
  const openClass = localState.assistantPinned ? " open" : "";
  const titleLength = Math.max(copy.title.length, 12);
  const bodyLength = Math.max(copy.body.length, 24);

  return `
    <aside class="mission-assistant${openClass}" aria-label="Guía de misión">
      <div class="mission-assistant-bubble" role="status" aria-live="polite">
        <div class="mission-assistant-bubble-top">
          <span class="mission-assistant-kicker">Guía del robot</span>
          <button
            class="mission-assistant-close"
            type="button"
            data-assistant-close="true"
            aria-label="Cerrar mensaje del robot"
          >
            ×
          </button>
        </div>
        <strong
          class="mission-assistant-type-title"
          style="--type-steps:${titleLength}; --type-duration:${Math.min(Math.max(titleLength * 0.032, 0.45), 1)}s;"
        >
          <span>${copy.title}</span>
        </strong>
        <p
          class="mission-assistant-type-body"
          style="--type-steps:${bodyLength}; --type-duration:${Math.min(Math.max(bodyLength * 0.02, 0.7), 1.5)}s;"
        >
          <span>${copy.body}</span>
        </p>
        <small>${copy.hint}</small>
        <div class="mission-assistant-actions">
          <button
            class="mission-assistant-chip ${topic === "task" ? "active" : ""}"
            type="button"
            data-assistant-topic="task"
          >
            Qué hago
          </button>
          <button
            class="mission-assistant-chip ${topic === "hint" ? "active" : ""}"
            type="button"
            data-assistant-topic="hint"
          >
            Dame una pista
          </button>
          <button
            class="mission-assistant-chip ${topic === "chat" ? "active" : ""}"
            type="button"
            data-assistant-topic="chat"
          >
            Hablemos
          </button>
        </div>
      </div>

      <button
        class="mission-assistant-trigger"
        type="button"
        data-assistant-toggle="true"
        aria-expanded="${localState.assistantPinned ? "true" : "false"}"
        aria-label="Abrir ayuda del robot"
      >
        <span class="mission-assistant-ring" aria-hidden="true"></span>
        <span class="mission-assistant-spark" aria-hidden="true"></span>
        <img src="${REORDER_ART.robot}" alt="Robot guía" />
      </button>
    </aside>
  `;
}

function moveItem(arr, from, to) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function getCorrectCount(orderedItems, solution = []) {
  return orderedItems.reduce(
    (count, item, index) => count + (item === solution[index] ? 1 : 0),
    0
  );
}

function turnDirection(current, command) {
  const index = DIRECTIONS.indexOf(current);
  if (index === -1) return current;
  if (command === "left") return DIRECTIONS[(index + 3) % 4];
  if (command === "right") return DIRECTIONS[(index + 1) % 4];
  return current;
}

function simulatePathFrames(challenge, program) {
  const board = challenge.board || {};
  const obstacles = new Set((board.obstacles || []).map((item) => `${item.row}:${item.col}`));
  const frames = [
    {
      row: board.start?.row ?? 0,
      col: board.start?.col ?? 0,
      facing: board.start?.facing || "right",
      command: null,
      reason: "start"
    }
  ];

  let row = frames[0].row;
  let col = frames[0].col;
  let facing = frames[0].facing;

  for (const command of program) {
    if (command === "left" || command === "right") {
      facing = turnDirection(facing, command);
      if (!challenge.turnMoves) {
        frames.push({ row, col, facing, command, reason: "turn" });
        continue;
      }
    }

    if (command === "forward" || (challenge.turnMoves && (command === "left" || command === "right"))) {
      const delta = DIRECTION_DELTAS[facing];
      const nextRow = row + delta.row;
      const nextCol = col + delta.col;
      const outside =
        nextRow < 0 ||
        nextCol < 0 ||
        nextRow >= (board.rows || 0) ||
        nextCol >= (board.cols || 0);

      if (outside) {
        frames.push({ row, col, facing, command, reason: "outside" });
        return { frames, success: false, reason: "outside" };
      }

      if (obstacles.has(`${nextRow}:${nextCol}`)) {
        frames.push({ row: nextRow, col: nextCol, facing, command, reason: "obstacle", blockedRow: nextRow, blockedCol: nextCol });
        return { frames, success: false, reason: "obstacle" };
      }

      row = nextRow;
      col = nextCol;
      frames.push({ row, col, facing, command, reason: "move" });
    }
  }

  const goalReached = row === board.goal?.row && col === board.goal?.col;

  return {
    frames,
    success: goalReached,
    reason: goalReached ? "goal" : "incomplete"
  };
}

function renderAmbientParticles() {
  return `
    <div class="mission-ambient" aria-hidden="true">
      ${Array.from({ length: 16 }, (_, index) => `
        <span class="mission-spark spark-${(index % 4) + 1}" style="--spark-delay:${index * 0.22}s; --spark-x:${6 + (index % 8) * 11}%;">
        </span>
      `).join("")}
    </div>
  `;
}

function getReorderStepVisual(step, index) {
  const normalized = String(step || "").toLowerCase();

  if (normalized.includes("abrir") && normalized.includes("linterna")) {
    return {
      tone: "blue",
      label: "Abrir",
      art: REORDER_ART.algorithm.openFlashlight,
      badge: "1"
    };
  }

  if (normalized.includes("poner") && normalized.includes("pilas")) {
    return {
      tone: "teal",
      label: "Pilas",
      art: REORDER_ART.algorithm.batteries,
      badge: "2"
    };
  }

  if (normalized.includes("cerrar") && normalized.includes("tapa")) {
    return {
      tone: "gold",
      label: "Cerrar",
      art: REORDER_ART.algorithm.closeFlashlight,
      badge: "3"
    };
  }

  if (normalized.includes("encender") && normalized.includes("linterna")) {
    return {
      tone: "gold",
      label: "Encender",
      art: REORDER_ART.algorithm.lightOn,
      badge: "4"
    };
  }

  if (normalized.includes("mirar") && normalized.includes("camino")) {
    return {
      tone: "green",
      label: "Mapa",
      art: REORDER_ART.algorithm.map,
      badge: "5"
    };
  }

  if (normalized.includes("jabon")) {
    return {
      tone: "gold",
      label: "Jabon",
      art: REORDER_ART.orderCorrect.soap,
      badge: "1"
    };
  }

  if (normalized.includes("secar")) {
    return {
      tone: "teal",
      label: "Toalla",
      art: REORDER_ART.orderCorrect.towel,
      badge: "2"
    };
  }

  if (normalized.includes("canilla")) {
    return {
      tone: "blue",
      label: "Canilla",
      art: REORDER_ART.orderCorrect.faucet,
      badge: "3"
    };
  }

  if (normalized.includes("enjuagar")) {
    return {
      tone: "blue",
      label: "Enjuague",
      art: REORDER_ART.orderCorrect.rinse,
      badge: "4"
    };
  }

  if (normalized.includes("mojar")) {
    return {
      tone: "green",
      label: "Agua",
      art: REORDER_ART.orderCorrect.wet,
      badge: "5"
    };
  }

  if (normalized.includes("frotar")) {
    return {
      tone: "gold",
      label: "Frotar",
      art: REORDER_ART.orderCorrect.scrub,
      badge: "6"
    };
  }

  if (normalized.includes("cerrar") && normalized.includes("mochila")) {
    return {
      tone: "gold",
      label: "Mochila cerrada",
      art: REORDER_ART.backpackClosed,
      badge: "1"
    };
  }

  if (normalized.includes("abrir") && normalized.includes("mochila")) {
    return {
      tone: "blue",
      label: "Mochila abierta",
      art: REORDER_ART.backpackOpen,
      badge: "3"
    };
  }

  if (normalized.includes("cantimplora") || normalized.includes("botella")) {
    return {
      tone: "green",
      label: "Cantimplora",
      art: REORDER_ART.canteen,
      badge: "2"
    };
  }

  if (normalized.includes("cuaderno") || normalized.includes("libro")) {
    return {
      tone: "teal",
      label: "Cuaderno",
      art: REORDER_ART.notebook,
      badge: "4"
    };
  }

  return {
    tone: ["gold", "green", "blue", "teal"][index % 4],
    label: "Paso",
    art: REORDER_ART.backpackClosed,
    badge: String(index + 1)
  };
}

function getMissionViewModel(mission) {
  const challenge = mission.challenge || {};

  if (challenge.type === "reorder") {
    return {
      state: withAssistantState({
        assistantTopic: "task",
        orderedItems: [...challenge.items],
        selectedStepIndex: null
      }),
      validate(localState) {
        return JSON.stringify(localState.orderedItems) === JSON.stringify(challenge.solution || []);
      }
    };
  }

  if (challenge.type === "multiple-choice") {
    return {
      state: withAssistantState({
        assistantTopic: "task",
        selectedOptionId: null
      }),
      validate(localState) {
        return localState.selectedOptionId === challenge.correctOptionId;
      }
    };
  }

  if (challenge.type === "categorize") {
    const categories = challenge.categories || [];
    return {
      state: withAssistantState({
        assistantTopic: "task",
        assignments: Object.fromEntries(
          (challenge.items || []).map((item, index) => [index, categories[0] || ""])
        )
      }),
      validate(localState) {
        return (challenge.items || []).every(
          (item, index) => localState.assignments[index] === item.correctCategory
        );
      }
    };
  }

  if (challenge.type === "path-program") {
    return {
      state: withAssistantState({
        assistantPinned: mission.id === "4-1-final",
        assistantTopic: "task",
        program: [],
        previewFrameIndex: 0,
        isRunning: false
      }),
      validate(localState) {
        return simulatePathFrames(challenge, localState.program).success;
      }
    };
  }

  if (challenge.type === "loop-builder") {
    return {
      state: withAssistantState({
        assistantTopic: "task",
        repeatCount: challenge.repeatOptions?.[0] ?? 1,
        actionId: challenge.actionOptions?.[0]?.id ?? null,
        isRunning: false,
        animationStep: 0,
        hasRun: false,
        isSuccess: false
      }),
      validate(localState) {
        return (
          localState.repeatCount === challenge.correctLoop?.repeatCount &&
          localState.actionId === challenge.correctLoop?.actionId
        );
      }
    };
  }

  return {
    state: withAssistantState({}),
    validate() {
      return false;
    }
  };
}

function renderPathBoard(challenge, pathState) {
  const board = challenge.board || {};
  const simulation = simulatePathFrames(challenge, pathState.program);
  const frameIndex = Math.max(0, Math.min(pathState.previewFrameIndex, simulation.frames.length - 1));
  const activeFrame = simulation.frames[frameIndex] || simulation.frames[0];
  const goalKey = `${board.goal?.row}:${board.goal?.col}`;
  const obstacleSet = new Set((board.obstacles || []).map((item) => `${item.row}:${item.col}`));
  const trail = new Set(
    simulation.frames
      .slice(0, frameIndex + 1)
      .map((frame) => `${frame.row}:${frame.col}`)
  );
  const cells = [];

  for (let row = 0; row < (board.rows || 0); row += 1) {
    for (let col = 0; col < (board.cols || 0); col += 1) {
      const key = `${row}:${col}`;
      const isStart = row === board.start?.row && col === board.start?.col;
      const isGoal = key === goalKey;
      const isObstacle = obstacleSet.has(key);
      const isPlayer = row === activeFrame.row && col === activeFrame.col;
      const hasTrail = trail.has(key) && !isPlayer;

      let content = "";
      if (isGoal) content = "★";
      if (isObstacle) content = "█";
      if (isStart && !isPlayer) content = "S";
      if (hasTrail) content = "·";
      if (isPlayer) content = DIRECTION_ARROWS[activeFrame.facing] || "→";

      cells.push(`
        <div class="mission-grid-cell ${isGoal ? "goal" : ""} ${isObstacle ? "obstacle" : ""} ${isPlayer ? "player" : ""} ${hasTrail ? "trail" : ""}">
          ${content}
        </div>
      `);
    }
  }

  return `
    <div class="mission-grid-wrap">
      <div class="mission-stage-banner">
        <strong>${pathState.isRunning ? "Ejecutando programa..." : "Vista de la aventura"}</strong>
        <span>Paso ${frameIndex}/${Math.max(simulation.frames.length - 1, 0)}</span>
      </div>
      <div
        class="mission-grid-board"
        style="grid-template-columns: repeat(${board.cols || 1}, minmax(0, 1fr));"
      >
        ${cells.join("")}
      </div>
      <div class="mission-grid-legend">
        <span>Meta: estrella</span>
        <span>Bloqueo: muro</span>
        <span>Inicio: S</span>
      </div>
    </div>
  `;
}

function renderPathBoardGame(challenge, pathState) {
  const board = challenge.board || {};
  const simulation = simulatePathFrames(challenge, pathState.program);
  const frameIndex = Math.max(0, Math.min(pathState.previewFrameIndex, simulation.frames.length - 1));
  const activeFrame = simulation.frames[frameIndex] || simulation.frames[0];
  const goalKey = `${board.goal?.row}:${board.goal?.col}`;
  const obstacleSet = new Set((board.obstacles || []).map((item) => `${item.row}:${item.col}`));
  const trail = new Set(
    simulation.frames
      .slice(0, frameIndex + 1)
      .map((frame) => `${frame.row}:${frame.col}`)
  );
  const cells = [];

  for (let row = 0; row < (board.rows || 0); row += 1) {
    for (let col = 0; col < (board.cols || 0); col += 1) {
      const key = `${row}:${col}`;
      const isStart = row === board.start?.row && col === board.start?.col;
      const isGoal = key === goalKey;
      const isObstacle = obstacleSet.has(key);
      const isPlayer = row === activeFrame.row && col === activeFrame.col;
      const hasTrail = trail.has(key) && !isPlayer;
      let content = "";

      if (isGoal) content = '<span class="mission-grid-goal-icon" aria-hidden="true"></span>';
      if (isObstacle) content = '<span class="mission-grid-rock-icon" aria-hidden="true"></span>';
      if (isStart && !isPlayer) content = '<span class="mission-grid-start-icon" aria-hidden="true">S</span>';
      if (hasTrail) content = '<span class="mission-grid-trail-dot" aria-hidden="true"></span>';
      if (isPlayer) {
        content = `
          <span class="mission-grid-player-token facing-${activeFrame.facing}" aria-hidden="true">
            <img src="${REORDER_ART.robot}" alt="" />
          </span>
        `;
      }

      cells.push(`
        <div class="mission-grid-cell ${isGoal ? "goal" : ""} ${isObstacle ? "obstacle" : ""} ${isStart ? "start" : ""} ${isPlayer ? "player" : ""} ${hasTrail ? "trail" : ""}">
          ${content}
        </div>
      `);
    }
  }

  return `
    <div class="mission-grid-wrap mission-path-map">
      <div class="mission-stage-banner">
        <strong>${pathState.isRunning ? "Ejecutando ruta..." : "Mapa de la ruta"}</strong>
        <span>Paso ${frameIndex}/${Math.max(simulation.frames.length - 1, 0)}</span>
      </div>
      <div
        class="mission-grid-board"
        style="grid-template-columns: repeat(${board.cols || 1}, minmax(0, 1fr));"
      >
        ${cells.join("")}
      </div>
      <div class="mission-grid-legend">
        <span><i class="mission-legend-goal"></i>Faro</span>
        <span><i class="mission-legend-rock"></i>Roca</span>
        <span><i class="mission-legend-start"></i>Inicio</span>
      </div>
    </div>
  `;
}

function renderPathGuidedMission(challenge, localState, mission) {
  const isFinalPathMission = mission?.id === "4-1-final";
  const board = challenge.board || {};
  const simulation = simulatePathFrames(challenge, localState.program);
  const maxSteps = challenge.maxSteps || 5;
  const frameIndex = Math.max(0, Math.min(localState.previewFrameIndex, simulation.frames.length - 1));
  const activeFrame = simulation.frames[frameIndex] || simulation.frames[0] || board.start || { row: 0, col: 0, facing: "right" };
  const progress = Math.min(localState.program.length, maxSteps);
  const progressPercent = maxSteps ? (progress / maxSteps) * 100 : 0;
  const routeSlots = Array.from({ length: maxSteps }, (_, index) => localState.program[index] || null);
  const commandPalette = mission?.id === "4-1-3" ? ["left", "forward", "right"] : challenge.palette || ["forward", "left", "right"];
  const trailFrames = simulation.frames
    .slice(1, frameIndex + 1)
    .filter((frame) => frame.reason === "move")
    .map((frame, index) => ({ ...frame, index }));
  const showGoalBurst = simulation.success && !localState.isRunning && frameIndex >= simulation.frames.length - 1;
  const blockedFrame = activeFrame.reason === "obstacle" ? activeFrame : null;
  const getBoardPointStyle = (row = 0, col = 0) =>
    isFinalPathMission ? getPathBoardStyleForBoard(board, row, col) : getPathBoardStyle(row, col);
  const sideTitle = isFinalPathMission ? "Desafio final" : `Mision ${mission.number}`;
  const sideSubtitle = isFinalPathMission ? "Mision del robot" : "Ruta al faro";
  const topPrompt = isFinalPathMission
    ? "Programa al robot para salir del taller, esquivar el muro y llegar a la caja brillante."
    : "Lleva al robot pirata hasta el faro evitando la roca.";
  const activePointStyleFinal = getBoardPointStyle(activeFrame.row || 0, activeFrame.col || 0);
  const goalPointStyleFinal = getBoardPointStyle(board.goal?.row || 0, board.goal?.col || 0);

  return `
    <div class="mission-guided-stage ${isFinalPathMission ? "mission-guided-stage-final" : ""} ${showGoalBurst ? "mission-guided-stage-complete" : ""}">
      <div class="mission-guided-birds" aria-hidden="true">
        <span class="bird-a"></span>
        <span class="bird-b"></span>
        <span class="bird-c"></span>
        <span class="bird-d"></span>
      </div>
      <div class="mission-guided-fish-layer" aria-hidden="true">
        <span class="fish-a"></span>
        <span class="fish-b"></span>
        <span class="fish-c"></span>
      </div>
      <div class="mission-guided-boat-wrap" aria-hidden="true">
        <span class="mission-guided-boat-wake wake-a"></span>
        <span class="mission-guided-boat-wake wake-b"></span>
        <img class="mission-guided-boat" src="./img/barco.png" alt="" />
      </div>
      <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Datos de la misión">
        <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("route")}</span>
        <span class="mission-guided-side-copy">
          <strong>${sideTitle}</strong>
          <small>${sideSubtitle}</small>
        </span>
        <b><span class="mission-guided-coin-icon" aria-hidden="true"></span>${mission.coins || 0}</b>
      </aside>
      <aside class="mission-guided-side-card mission-guided-side-card-right" aria-label="Premios acumulados y volver">
        <span class="mission-guided-wallet">
          <span><i class="mission-guided-coin-icon" aria-hidden="true"></i>${appState.coins}</span>
          <span><i class="mission-guided-gem-icon" aria-hidden="true"></i>${appState.gems}</span>
        </span>
        <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver a las islas de secuencias">
          <span class="mission-guided-back-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
          <small>Volver</small>
        </button>
      </aside>
      <section class="mission-guided-top" aria-label="Estado de la misión">
        <img src="${PATH_GUIDED_ART.topPanel}" alt="" aria-hidden="true" />
        <div class="mission-guided-top-copy">
          <h1>${mission.title}</h1>
          <p>${topPrompt}</p>
          <div class="mission-guided-progress">
            <span class="mission-guided-star" aria-hidden="true"></span>
            <strong>Progreso</strong>
            <div class="mission-guided-progress-track">
              <span style="width:${progressPercent}%;"></span>
            </div>
            <b>${progress} / ${maxSteps}</b>
          </div>
        </div>
      </section>

      <section class="mission-guided-board-wrap" aria-label="Mapa de Camino guiado">
        <img class="mission-guided-board-img" src="${PATH_GUIDED_ART.board}" alt="Tablero de islas con inicio, roca y faro" />
        <span class="mission-guided-lighthouse-beam" style="${goalPointStyleFinal}" aria-hidden="true"></span>
        ${trailFrames
          .map(
            (frame) => `
              <span
                class="mission-guided-skate-trail trail-${frame.index % 4}"
                style="${getBoardPointStyle(frame.row || 0, frame.col || 0)}"
                aria-hidden="true"
              ></span>
              <span
                class="mission-guided-tile-pulse pulse-${frame.index % 4}"
                style="${getBoardPointStyle(frame.row || 0, frame.col || 0)}"
                aria-hidden="true"
              ></span>
            `
          )
          .join("")}
        <span
          class="mission-guided-player facing-${activeFrame.facing || "right"} ${localState.isRunning ? "is-running" : ""}"
          style="${activePointStyleFinal}"
          aria-hidden="true"
        >
          <img src="${PATH_GUIDED_ART.robot}" alt="" />
        </span>
        <span class="mission-guided-current-arrow" style="${activePointStyleFinal}" aria-hidden="true"></span>
        ${
          blockedFrame
            ? `
              <span
                class="mission-guided-blocked-burst"
                style="${getBoardPointStyle(blockedFrame.blockedRow || 0, blockedFrame.blockedCol || 0)}"
                aria-hidden="true"
              ></span>
            `
            : ""
        }
        ${showGoalBurst ? `<span class="mission-guided-goal-burst" style="${goalPointStyleFinal}" aria-hidden="true"></span>` : ""}
      </section>

      <section class="mission-guided-command-shell" aria-label="Comandos">
        <img class="mission-guided-panel-img" src="${PATH_GUIDED_ART.commandsPanel}" alt="" aria-hidden="true" />
        <div class="mission-guided-command-bank">
          ${commandPalette
            .map(
              (command) => `
                <button class="mission-guided-command-btn mission-guided-command-${command}" data-command="${command}" type="button" aria-label="${COMMAND_LABELS[command] || command}">
                  <img src="${PATH_GUIDED_COMMAND_ASSETS[command] || PATH_GUIDED_ART.forwardButton}" alt="" aria-hidden="true" />
                </button>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="mission-guided-route-shell" aria-label="Tu ruta">
        <img class="mission-guided-panel-img" src="${PATH_GUIDED_ART.routePanel}" alt="" aria-hidden="true" />
        <div class="mission-guided-route-list">
          ${routeSlots
            .map(
              (command, index) => `
                <div class="mission-guided-route-slot ${command ? "filled" : ""} ${index === frameIndex - 1 ? "active" : ""}">
                  <span>${index + 1}</span>
                  ${
                    command
                      ? `<img src="${PATH_GUIDED_COMMAND_ASSETS[command]}" alt="${COMMAND_SHORT_LABELS[command] || COMMAND_LABELS[command] || command}" />`
                      : `<i aria-hidden="true"></i>`
                  }
                </div>
              `
            )
            .join("")}
        </div>
      </section>

      <div class="mission-guided-actions-panel">
        <button class="mission-guided-run" id="runProgramBtn" type="button" aria-label="Ejecutar ruta">
          <img src="${PATH_GUIDED_ART.runButton}" alt="" aria-hidden="true" />
        </button>
        <button class="mission-guided-small-action" id="removeLastCommandBtn" type="button" aria-label="Borrar ultimo">
          <img src="${PATH_GUIDED_ART.undoButton}" alt="" aria-hidden="true" />
        </button>
        <button class="mission-guided-small-action" id="resetProgramBtn" type="button" aria-label="Reiniciar">
          <img src="${PATH_GUIDED_ART.resetButton}" alt="" aria-hidden="true" />
        </button>
      </div>

    </div>
  `;
}

function getActionSvgIcon(actionId) {
  if (actionId === "forward") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "turn-right") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 12a9 9 0 0 1-9 9m9-9V5m0 7H12" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3a9 9 0 0 1 7.54 4.1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "turn-left") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 12a9 9 0 0 0 9 9m-9-9V5m0 7h9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3a9 9 0 0 0-7.54 4.1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "jump") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 8a6 6 0 0 0-12 0c0 4-3 6-3 6h18s-3-2-3-6z" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "water") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "clap") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12h8M12 8v8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "spin") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3v9M12 12l6 6M12 12L6 18" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "stop") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "wave") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "patrol-step") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "rest") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-10-10z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (actionId === "turn") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  `;
}

function renderLoopSimulation(mission, challenge, localState) {
  if (mission.id === "4-2-2") {
    const tilesHtml = Array.from({ length: 5 }, (_, i) => {
      const isStart = i === 0;
      const isGoal = i === 4;
      const hasRobot = localState.isRunning ? (localState.animationStep === i) : (localState.repeatCount === 4 && localState.actionId === "forward" && localState.hasRun ? i === 4 : i === 0);
      
      let bubblesHtml = "";
      if (localState.isRunning && localState.animationStep === i) {
        bubblesHtml = Array.from({ length: 4 }, (_, idx) => {
          const drift = Math.random() * 20 - 10;
          const delay = Math.random() * 0.5;
          return `<div class="bubble-particle" style="--x-drift: ${drift}px; animation-delay: ${delay}s; left: ${20 + idx * 8}px;"></div>`;
        }).join("");
      }

      return `
        <div class="loop-sim-tile ${isStart ? "start" : ""} ${isGoal ? "goal" : ""} ${hasRobot ? "has-robot" : ""}">
          ${isGoal ? `
            <div class="oyster-goal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22a10 10 0 0 0 10-10C22 5.4 12 2 12 2S2 5.4 2 12a10 10 0 0 0 10 10z"/>
                <circle cx="12" cy="12" r="3" fill="#fff" stroke="#f2c35b" stroke-width="1.5"/>
              </svg>
            </div>
          ` : ""}
          ${hasRobot ? '<img class="loop-sim-robot-sprite" src="./img/mission-robot-pirate.png" alt="Bit" />' : ""}
          <span class="loop-sim-tile-index">${i + 1}</span>
          ${bubblesHtml}
        </div>
      `;
    }).join("");

    return `
      <div class="loop-sim-container loop-sim-walk">
        <div class="loop-sim-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 22v-3a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Camino de Baldosas del Eco
        </div>
        <div class="loop-sim-stage">
          ${tilesHtml}
        </div>
        <div class="loop-sim-status-msg">
          ${localState.isRunning ? `Bit está avanzando... Paso ${localState.animationStep + 1} de ${localState.repeatCount}` : (localState.hasRun ? (localState.isSuccess ? "¡Faro alcanzado con éxito!" : "El robot se quedó corto o se pasó.") : "Listo para iniciar la simulación.")}
        </div>
      </div>
    `;
  }

  if (mission.id === "4-2-4") {
    const potsHtml = Array.from({ length: 5 }, (_, i) => {
      const isWatered = localState.isRunning ? (localState.animationStep > i) : (localState.repeatCount === 5 && localState.actionId === "water" && localState.hasRun ? true : false);
      const isCurrent = localState.isRunning && localState.animationStep === i;
      
      let rainHtml = "";
      if (isCurrent) {
        rainHtml = Array.from({ length: 6 }, (_, idx) => {
          const delay = Math.random() * 0.4;
          return `<div class="rain-particle" style="animation-delay: ${delay}s; left: ${15 + idx * 8}px;"></div>`;
        }).join("");
      }

      let musicNoteHtml = "";
      if (isWatered && isCurrent) {
        const notes = ["🎵", "🎶", "♩", "🎹", "🎸"];
        const note = notes[i % notes.length];
        const drift = Math.random() * 30 - 15;
        musicNoteHtml = `<div class="music-note-particle" style="--drift-x: ${drift}px; --rot: ${Math.random() * 40 - 20}deg; left: 22px; color: hsl(${i * 60}, 90%, 65%);">${note}</div>`;
      }

      return `
        <div class="loop-sim-pot ${isWatered ? "watered" : ""} ${isCurrent ? "current" : ""}">
          <svg class="plant-svg" viewBox="0 0 44 56">
            <path class="plant-stem" d="M 22 56 L 22 24 C 22 24 24 16 22 10" />
            <path class="plant-leaf leaf-left" d="M 22 36 Q 10 32 8 24 Q 16 26 22 36" />
            <path class="plant-leaf leaf-right" d="M 22 36 Q 34 32 36 24 Q 28 26 22 36" />
            ${isWatered ? `
              <g class="plant-flower">
                <circle cx="22" cy="10" r="8" fill="#ec4899" />
                <circle cx="22" cy="10" r="4" fill="#fbbf24" />
                <circle cx="15" cy="5" r="5" fill="#f43f5e" />
                <circle cx="29" cy="5" r="5" fill="#f43f5e" />
                <circle cx="15" cy="15" r="5" fill="#f43f5e" />
                <circle cx="29" cy="15" r="5" fill="#f43f5e" />
              </g>
            ` : `
              <g class="plant-bud" style="transform: scale(0.7); transform-origin: 22px 10px;">
                <circle cx="22" cy="10" r="5" fill="#10b981" />
              </g>
            `}
          </svg>
          
          ${isCurrent ? `
            <svg class="watering-can-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h9a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            ${rainHtml}
          ` : ""}
          ${musicNoteHtml}
          <span class="loop-sim-pot-index">${i + 1}</span>
        </div>
      `;
    }).join("");

    return `
      <div class="loop-sim-container loop-sim-garden">
        <div class="loop-sim-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          El Invernadero Melódico
        </div>
        <div class="garden-shelf">
          ${potsHtml}
        </div>
        <div class="loop-sim-status-msg">
          ${localState.isRunning ? `Regando planta ${localState.animationStep + 1} de 5...` : (localState.hasRun ? (localState.isSuccess ? "¡Todas las plantas florecieron en armonía!" : "Algunas plantas quedaron sin agua.") : "Listo para regar.")}
        </div>
      </div>
    `;
  }

  if (mission.id === "4-2-6") {
    const bulbsHtml = Array.from({ length: 4 }, (_, i) => {
      const isLit = localState.isRunning ? (localState.animationStep > i) : (localState.repeatCount === 4 && localState.actionId === "spin" && localState.hasRun ? true : false);
      return `
        <div class="loop-sim-bulb ${isLit ? "lit" : ""}">
          <div class="bulb-glow-circle"></div>
          <svg class="bulb-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 18h6M10 22h4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="loop-sim-bulb-index">${i + 1}</span>
        </div>
      `;
    }).join("");

    const rotation = localState.isRunning ? (localState.animationStep * 90) : (localState.repeatCount === 4 && localState.actionId === "spin" && localState.hasRun ? 360 : 0);
    const activeStep = localState.isRunning ? localState.animationStep : (localState.repeatCount === 4 && localState.actionId === "spin" && localState.hasRun ? 4 : 0);
    
    return `
      <div class="loop-sim-container loop-sim-windmill">
        <div class="loop-sim-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          El Generador del Eco
        </div>
        <div class="loop-sim-stage">
          <div class="loop-sim-windmill-body">
            <div class="loop-sim-windmill-blades" style="transform: rotate(${rotation}deg); transition: transform 0.4s ease;">
              <div class="windmill-rotor-center"></div>
              <div class="blade blade-1"></div>
              <div class="blade blade-2"></div>
              <div class="blade blade-3"></div>
              <div class="blade blade-4"></div>
            </div>
          </div>
          
          <svg class="electric-cables-svg">
            <path class="cable-wire ${activeStep >= 1 ? "active" : ""}" d="M 30 50 Q 80 40 100 25" />
            <path class="cable-wire ${activeStep >= 2 ? "active" : ""}" d="M 30 50 Q 80 60 100 55" />
            <path class="cable-wire ${activeStep >= 3 ? "active" : ""}" d="M 30 50 Q 80 90 100 85" />
            <path class="cable-wire ${activeStep >= 4 ? "active" : ""}" d="M 30 50 Q 80 120 100 115" />
          </svg>

          <div class="loop-sim-bulbs-track">
            ${bulbsHtml}
          </div>
        </div>
        <div class="loop-sim-status-msg">
          ${localState.isRunning ? `Generando energía... Vuelta ${localState.animationStep + 1}` : (localState.hasRun ? (localState.isSuccess ? "¡Molino activado y luces encendidas!" : "Falta energía para encender el camino.") : "Listo para girar las aspas.")}
        </div>
      </div>
    `;
  }

  if (mission.id === "4-2-final") {
    const nodesHtml = Array.from({ length: 4 }, (_, i) => {
      const isActive = localState.isRunning ? (localState.animationStep >= i) : (localState.repeatCount === 4 && localState.actionId === "patrol-step" && localState.hasRun ? true : false);
      const isCurrent = localState.isRunning ? (localState.animationStep % 4) === i : (localState.repeatCount === 4 && localState.actionId === "patrol-step" && localState.hasRun ? i === 3 : i === 0);
      return `
        <div class="loop-sim-circle-node node-${i} ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}">
          <span class="node-glow"></span>
          ${isCurrent ? `
            <div class="guardian-drone">
              <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke-linecap="round"/>
              </svg>
            </div>
          ` : ""}
          <span class="node-index">${i + 1}</span>
        </div>
      `;
    }).join("");

    const isAllActive = localState.repeatCount === 4 && localState.actionId === "patrol-step" && localState.hasRun;

    return `
      <div class="loop-sim-container loop-sim-circuit">
        <div class="loop-sim-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m16.2 7.8-2.9 2.9-2.9-2.9m0 8.4 2.9-2.9 2.9 2.9" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Circuito de Patrulla del Templo
        </div>
        <div class="loop-sim-stage">
          <div class="loop-sim-circuit-track">
            ${nodesHtml}
          </div>
          <div class="temple-portal ${isAllActive ? "active" : ""}"></div>
        </div>
        <div class="loop-sim-status-msg">
          ${localState.isRunning ? `Patrullando tramo ${localState.animationStep + 1} de 4...` : (localState.hasRun ? (localState.isSuccess ? "¡Patrulla completada e iluminación del templo activada!" : "El circuito quedó incompleto.") : "Listo para patrullar.")}
        </div>
      </div>
    `;
  }

  return `
    <div class="loop-sim-container loop-sim-empty">
      <div class="loop-sim-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" stroke-linecap="round"/>
        </svg>
        Simulador de Bucles
      </div>
      <p>Armá el bucle en el panel lateral para ver la previsualización del código.</p>
      <div class="loop-sim-art">🌀</div>
    </div>
  `;
}function renderMultipleChoiceSimulation(mission, challenge, localState) {
  if (mission.id === "4-2-1") {
    const crabSvg = (color) => `
      <svg class="crab-svg" viewBox="0 0 120 95">
        <defs>
          <radialGradient id="crabBody${color}" cx="50%" cy="40%">
            <stop offset="0%" stop-color="${color === 'red' ? '#ff6b6b' : color === 'orange' ? '#ffad42' : '#ff8ec8'}" />
            <stop offset="100%" stop-color="${color === 'red' ? '#c0392b' : color === 'orange' ? '#e67e22' : '#c0588c'}" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="55" rx="34" ry="22" fill="url(#crabBody${color})" stroke="${color === 'red' ? '#922b21' : color === 'orange' ? '#a55b14' : '#8c3e66'}" stroke-width="1.5"/>
        <ellipse cx="60" cy="55" rx="28" ry="16" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
        <circle cx="44" cy="28" r="7" fill="#fff" stroke="#333" stroke-width="1"/>
        <circle cx="44" cy="28" r="3.5" fill="#1a1a2e"/>
        <circle cx="43" cy="27" r="1.2" fill="#fff"/>
        <circle cx="76" cy="28" r="7" fill="#fff" stroke="#333" stroke-width="1"/>
        <circle cx="76" cy="28" r="3.5" fill="#1a1a2e"/>
        <circle cx="75" cy="27" r="1.2" fill="#fff"/>
        <path d="M 44 35 L 44 40" stroke="${color === 'red' ? '#c0392b' : color === 'orange' ? '#d48a1d' : '#b04878'}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 76 35 L 76 40" stroke="${color === 'red' ? '#c0392b' : color === 'orange' ? '#d48a1d' : '#b04878'}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 26 55 Q 12 58 16 72" stroke="${color === 'red' ? '#e74c3c' : color === 'orange' ? '#f39c12' : '#e573a8'}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 28 66 Q 16 76 24 84" stroke="${color === 'red' ? '#e74c3c' : color === 'orange' ? '#f39c12' : '#e573a8'}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 94 55 Q 108 58 104 72" stroke="${color === 'red' ? '#e74c3c' : color === 'orange' ? '#f39c12' : '#e573a8'}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 92 66 Q 104 76 96 84" stroke="${color === 'red' ? '#e74c3c' : color === 'orange' ? '#f39c12' : '#e573a8'}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 35 42 Q 16 28 28 14" stroke="${color === 'red' ? '#e74c3c' : color === 'orange' ? '#f39c12' : '#e573a8'}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <circle cx="28" cy="14" r="5" fill="${color === 'red' ? '#ff6b6b' : color === 'orange' ? '#ffad42' : '#ff8ec8'}"/>
        <path d="M 85 42 Q 104 28 92 14" stroke="${color === 'red' ? '#e74c3c' : color === 'orange' ? '#f39c12' : '#e573a8'}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <circle cx="92" cy="14" r="5" fill="${color === 'red' ? '#ff6b6b' : color === 'orange' ? '#ffad42' : '#ff8ec8'}"/>
        <path d="M 50 62 Q 60 70 70 62" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </svg>
    `;

    // Floating sparkles
    const sparklesHtml = Array.from({ length: 12 }, (_, i) => {
      const left = 5 + Math.random() * 90;
      const top = 5 + Math.random() * 50;
      const delay = Math.random() * 4;
      const size = 2 + Math.random() * 4;
      return `<div class="beach-sparkle" style="left:${left}%; top:${top}%; animation-delay:${delay}s; width:${size}px; height:${size}px;"></div>`;
    }).join("");

    // Animated clouds
    const cloudsHtml = Array.from({ length: 4 }, (_, i) => {
      const top = 5 + i * 12;
      const delay = i * 8;
      const scale = 0.6 + Math.random() * 0.8;
      return `<div class="beach-cloud beach-cloud-${i}" style="top:${top}%; animation-delay:-${delay}s; transform:scale(${scale});"></div>`;
    }).join("");

    // Seagulls
    const seagullsHtml = Array.from({ length: 3 }, (_, i) => {
      const top = 8 + i * 10;
      const delay = i * 5 + 2;
      return `<div class="beach-seagull" style="top:${top}%; animation-delay:-${delay}s;"></div>`;
    }).join("");

    return `
      <div class="beach-stage">
        <div class="beach-sky"></div>
        <div class="beach-sun"></div>
        <div class="beach-sun-rays"></div>
        ${cloudsHtml}
        ${seagullsHtml}
        ${sparklesHtml}

        <div class="beach-ocean">
          <div class="beach-wave beach-wave-1"></div>
          <div class="beach-wave beach-wave-2"></div>
          <div class="beach-wave beach-wave-3"></div>
        </div>

        <div class="beach-foam-line"></div>

        <div class="beach-sands">
          <div class="beach-sand-detail sand-shell-1">🐚</div>
          <div class="beach-sand-detail sand-shell-2">⭐</div>
          <div class="beach-sand-detail sand-shell-3">🐚</div>
          <div class="beach-sand-detail sand-starfish">🌊</div>
        </div>

        <div class="palm-tree palm-tree-left">
          <svg viewBox="0 0 120 220" width="100%" height="100%">
            <path d="M 60 220 Q 50 150 52 60" stroke="#5d2f0e" stroke-width="12" fill="none" stroke-linecap="round"/>
            <path d="M 60 220 Q 50 150 52 60" stroke="#78350f" stroke-width="10" fill="none" stroke-linecap="round"/>
            <line x1="52" y1="80" x2="52" y2="85" stroke="#451a03" stroke-width="12" opacity="0.3"/>
            <line x1="51" y1="100" x2="51" y2="105" stroke="#451a03" stroke-width="12" opacity="0.3"/>
            <line x1="50" y1="120" x2="50" y2="125" stroke="#451a03" stroke-width="12" opacity="0.3"/>
            <g class="palm-leaves">
              <path d="M 52 60 Q 10 30 -5 50" fill="#15803d" stroke="#166534" stroke-width="1"/>
              <path d="M 52 60 Q 15 65 5 90" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
              <path d="M 52 60 Q 70 20 95 30" fill="#15803d" stroke="#166534" stroke-width="1"/>
              <path d="M 52 60 Q 80 70 75 100" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
              <path d="M 52 60 Q 45 10 30 15" fill="#16a34a" stroke="#15803d" stroke-width="1"/>
            </g>
            <circle cx="62" cy="65" r="5" fill="#92400e" stroke="#78350f"/>
            <circle cx="55" cy="70" r="4.5" fill="#a16207" stroke="#78350f"/>
          </svg>
        </div>

        <div class="palm-tree palm-tree-right">
          <svg viewBox="0 0 120 220" width="100%" height="100%">
            <path d="M 60 220 Q 65 150 58 60" stroke="#5d2f0e" stroke-width="12" fill="none" stroke-linecap="round"/>
            <path d="M 60 220 Q 65 150 58 60" stroke="#78350f" stroke-width="10" fill="none" stroke-linecap="round"/>
            <line x1="59" y1="80" x2="59" y2="85" stroke="#451a03" stroke-width="12" opacity="0.3"/>
            <line x1="60" y1="100" x2="60" y2="105" stroke="#451a03" stroke-width="12" opacity="0.3"/>
            <g class="palm-leaves">
              <path d="M 58 60 Q 20 30 5 50" fill="#15803d" stroke="#166534" stroke-width="1"/>
              <path d="M 58 60 Q 25 65 15 90" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
              <path d="M 58 60 Q 75 20 100 30" fill="#15803d" stroke="#166534" stroke-width="1"/>
              <path d="M 58 60 Q 85 70 80 100" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
              <path d="M 58 60 Q 50 10 35 15" fill="#16a34a" stroke="#15803d" stroke-width="1"/>
            </g>
            <circle cx="50" cy="65" r="5" fill="#92400e" stroke="#78350f"/>
            <circle cx="60" cy="72" r="4" fill="#a16207" stroke="#78350f"/>
          </svg>
        </div>

        <div class="beach-ship-silhouette"></div>

        <div class="crabs-group">
          <div class="crab-wrapper crab-1">
            <div class="crab-shadow"></div>
            ${crabSvg('red')}
            <span class="wood-sign">Cangrejo 1</span>
          </div>
          <div class="crab-wrapper crab-2">
            <div class="crab-shadow"></div>
            ${crabSvg('orange')}
            <span class="wood-sign">Cangrejo 2</span>
          </div>
          <div class="crab-wrapper crab-3">
            <div class="crab-shadow"></div>
            ${crabSvg('pink')}
            <span class="wood-sign">Cangrejo 3</span>
          </div>
        </div>

        <div class="beach-title-banner">
          <span class="beach-title-icon">🦀</span>
          <span>¡El Baile del Cangrejo!</span>
          <span class="beach-title-icon">🎵</span>
        </div>
      </div>
    `;
  }

  if (mission.id === "4-2-3") {
    // Twinkling Stars - varied sizes
    const starsHtml = Array.from({ length: 25 }, (_, idx) => {
      const top = Math.random() * 55;
      const left = Math.random() * 95;
      const delay = Math.random() * 3;
      const size = 1.5 + Math.random() * 3.5;
      return `<div class="twinkle-star" style="top:${top}%; left:${left}%; animation-delay:${delay}s; width:${size}px; height:${size}px;"></div>`;
    }).join("");

    // Shooting stars
    const shootingStarsHtml = Array.from({ length: 2 }, (_, i) => {
      const top = 10 + i * 20;
      const delay = i * 7 + 3;
      return `<div class="shooting-star" style="top:${top}%; animation-delay:${delay}s;"></div>`;
    }).join("");

    // Fireflies
    const firefliesHtml = Array.from({ length: 8 }, (_, i) => {
      const bottom = 20 + Math.random() * 40;
      const left = 5 + Math.random() * 90;
      const delay = Math.random() * 5;
      return `<div class="night-firefly" style="bottom:${bottom}%; left:${left}%; animation-delay:${delay}s;"></div>`;
    }).join("");

    return `
      <div class="lighthouse-stage">
        <div class="night-sky"></div>
        <div class="aurora-band aurora-band-1"></div>
        <div class="aurora-band aurora-band-2"></div>

        <div class="night-moon">
          <div class="moon-crater moon-crater-1"></div>
          <div class="moon-crater moon-crater-2"></div>
          <div class="moon-crater moon-crater-3"></div>
        </div>

        ${starsHtml}
        ${shootingStarsHtml}
        ${firefliesHtml}

        <div class="night-ocean">
          <div class="night-wave night-wave-1"></div>
          <div class="night-wave night-wave-2"></div>
        </div>

        <svg class="cliff-crags" viewBox="0 0 400 120" preserveAspectRatio="none">
          <path class="cliff-path" d="M 0 120 L 0 65 Q 40 55 80 70 T 160 50 Q 200 60 240 45 Q 300 55 360 40 L 400 50 L 400 120 Z" />
          <path class="cliff-detail" d="M 60 85 Q 80 78 100 85" />
          <path class="cliff-detail" d="M 200 65 Q 220 58 240 65" />
          <path class="cliff-detail" d="M 300 60 Q 320 53 340 60" />
        </svg>

        <div class="cliff-grass-patches">
          <span class="cliff-grass" style="left:5%; bottom:0;">🌿</span>
          <span class="cliff-grass" style="left:25%; bottom:5px;">🌱</span>
          <span class="cliff-grass" style="left:60%; bottom:2px;">🌿</span>
          <span class="cliff-grass" style="right:15%; bottom:0;">🌱</span>
        </div>

        <div class="lighthouse-tower">
          <div class="lighthouse-stripe"></div>
          <div class="lighthouse-stripe"></div>
          <div class="lighthouse-stripe"></div>
          <div class="lighthouse-window lh-win-1"></div>
          <div class="lighthouse-window lh-win-2"></div>
          <div class="lighthouse-cabin">
            <div class="lighthouse-lens"></div>
            <div class="lighthouse-beam lighthouse-beam-left"></div>
            <div class="lighthouse-beam lighthouse-beam-right"></div>
          </div>
          <div class="lighthouse-roof"></div>
          <div class="lighthouse-base-platform"></div>
        </div>

        <div class="lighthouse-title-banner">
          <span class="lighthouse-title-icon">🌟</span>
          <span>¡El Faro de Destellos!</span>
          <span class="lighthouse-title-icon">💡</span>
        </div>
      </div>
    `;
  }

  if (mission.id === "4-2-5") {
    const opt = localState.selectedOptionId;
    const isCorrect = opt === "a";
    const batteryClass = isCorrect ? "state-full" : (opt ? "state-empty" : "");
    const bitStateClass = isCorrect ? "happy" : (opt ? "sad" : "");

    // Steam puffs
    const steamHtml = Array.from({ length: 5 }, (_, idx) => {
      const left = 15 + idx * 12;
      const delay = idx * 0.6;
      const size = 18 + Math.random() * 14;
      return `<div class="steam-puff-effect" style="left:${left}%; bottom:25%; animation-delay:${delay}s; width:${size}px; height:${size}px;"></div>`;
    }).join("");

    // Underwater bubbles
    const bubblesHtml = Array.from({ length: 6 }, (_, i) => {
      const left = 10 + Math.random() * 80;
      const delay = Math.random() * 4;
      const size = 4 + Math.random() * 8;
      return `<div class="lab-bubble" style="left:${left}%; animation-delay:${delay}s; width:${size}px; height:${size}px;"></div>`;
    }).join("");

    // Electric sparks
    const sparksHtml = Array.from({ length: 3 }, (_, i) => {
      const left = 20 + i * 25;
      const top = 30 + Math.random() * 30;
      const delay = i * 1.5;
      return `<div class="electric-spark" style="left:${left}%; top:${top}%; animation-delay:${delay}s;"></div>`;
    }).join("");

    return `
      <div class="battery-stage">
        <div class="lab-workshop"></div>
        <div class="lab-grid-overlay"></div>

        <div class="lab-porthole lab-porthole-1">
          <div class="porthole-water"></div>
          <div class="porthole-fish">🐟</div>
        </div>
        <div class="lab-porthole lab-porthole-2">
          <div class="porthole-water"></div>
          <div class="porthole-fish porthole-fish-2">🐠</div>
        </div>

        <svg class="pipes-layout" viewBox="0 0 400 250">
          <path class="pipe-line" d="M 10 40 L 80 40 L 80 200" />
          <path class="pipe-line" d="M 390 30 L 320 30 L 320 130" />
          <path class="pipe-line" d="M 10 220 L 150 220 L 150 160" />
          <path class="pipe-line" d="M 390 210 L 280 210" />
          <circle class="pipe-joint" cx="80" cy="40" r="8" />
          <circle class="pipe-joint" cx="320" cy="30" r="8" />
          <circle class="pipe-joint" cx="150" cy="220" r="8" />
          <circle class="pipe-joint" cx="80" cy="200" r="6" />
          <rect class="pipe-valve" x="75" y="110" width="10" height="20" rx="2" />
          <rect class="pipe-valve" x="315" y="70" width="10" height="20" rx="2" />
        </svg>
        
        <div class="gauge-gauge gauge-gauge-1">
          <div class="gauge-arrow"></div>
          <div class="gauge-label">PSI</div>
        </div>
        <div class="gauge-gauge gauge-gauge-2">
          <div class="gauge-arrow" style="animation-delay: 0.5s;"></div>
          <div class="gauge-label">BAR</div>
        </div>

        ${steamHtml}
        ${bubblesHtml}
        ${sparksHtml}

        <div class="lab-warning-light ${opt ? (isCorrect ? 'light-green' : 'light-red') : ''}"></div>

        <div class="battery-cylinder ${batteryClass}" style="z-index: 5;">
          <div class="battery-cell-segment"></div>
          <div class="battery-cell-segment"></div>
          <div class="battery-cell-segment"></div>
          <div class="battery-cell-segment"></div>
          <div class="battery-energy-glow"></div>
        </div>
        <div class="battery-bit-wrapper" style="z-index: 5;">
          <img class="battery-bit-sprite ${bitStateClass}" src="./img/mission-robot-pirate.png" alt="Bit" />
          <span class="wood-sign">Batería de Bit</span>
        </div>

        <div class="lab-title-banner">
          <span class="lab-title-icon">⚡</span>
          <span>¡La Batería de Bit!</span>
          <span class="lab-title-icon">🔋</span>
        </div>
      </div>
    `;
  }

  return `
    <div style="display:flex; justify-content:center; align-items:center; height:100%; color:#fff;">
      <p>Simulación de Reto Teórico</p>
    </div>
  `;
}

function renderChallengeBody(challenge, localState, mission) {
  if (challenge.type === "reorder") {
    const isFirstStepsMission = mission?.id === "4-1-1";
    const isOrderCorrectMission = mission?.id === "4-1-2";
    const isAlgorithmMission = mission?.id === "4-1-6";
    const isFullScreenReorderMission = isFirstStepsMission || isOrderCorrectMission || isAlgorithmMission;
    const reorderStageClass = isFirstStepsMission
      ? "mission-first-steps-stage"
      : isAlgorithmMission
      ? "mission-algorithm-stage"
      : "mission-order-steps-stage";
    const reorderBannerTitle = isAlgorithmMission ? "Algoritmo de exploracion" : "Tablero del robot";
    const reorderBannerCopy = isAlgorithmMission
      ? "Ordena la linterna paso a paso para que el robot pueda revisar la cueva."
      : "Ordena los pasos para que el robot pueda preparar su mochila antes de salir.";
    const sideIconName = isAlgorithmMission ? "lightbulb" : "book";
    const solution = challenge.solution || [];
    const correctCount = getCorrectCount(localState.orderedItems, solution);
    const progressPercent = solution.length ? (correctCount / solution.length) * 100 : 0;
    const hasSelectedStep =
      Number.isInteger(localState.selectedStepIndex) &&
      localState.selectedStepIndex >= 0 &&
      localState.selectedStepIndex < localState.orderedItems.length;
    const selectedIndex = hasSelectedStep ? localState.selectedStepIndex : -1;
    const activeStep = hasSelectedStep ? localState.orderedItems[selectedIndex] : "";
    const activeVisual = hasSelectedStep
      ? getReorderStepVisual(activeStep, selectedIndex)
      : getReorderStepVisual(localState.orderedItems[0] || "", 0);

    const reorderBoard = `
      <div class="mission-reorder-shell mission-reorder-shell-art">
        <div class="mission-stage-banner mission-stage-banner-reorder mission-stage-banner-quest mission-stage-banner-arcade">
          <div class="mission-stage-copy">
            <strong>${reorderBannerTitle}</strong>
            <span>${reorderBannerCopy}</span>
          </div>
	          <div class="mission-stage-score mission-stage-score-arcade">
	            <b>${correctCount}/${solution.length}</b>
	            <span>pasos en la posicion correcta</span>
	          </div>
	        </div>
        <div class="mission-reorder-playfield">
          <div class="mission-reorder-ocean" aria-hidden="true"></div>
          <div class="mission-reorder-track-image" aria-hidden="true">
            <img src="${REORDER_ART.platform}" alt="" />
          </div>
          <div class="mission-reorder-progress-panel">
            <div class="mission-reorder-progress-title">PROGRESO</div>
            <strong>${correctCount}/${solution.length}</strong>
            <span>pasos en la posicion correcta</span>
            <div class="mission-reorder-progress mission-reorder-progress-arcade">
              <div class="mission-reorder-progress-fill" style="width:${progressPercent}%;"></div>
            </div>
          </div>
          <div
            class="mission-reorder-lane mission-reorder-lane-art"
            aria-label="Pista de secuencia"
            data-step-count="${localState.orderedItems.length}"
          >
            ${localState.orderedItems
              .map((step, index) => {
                const isSelected = selectedIndex === index;
                const isCorrect = step === solution[index];
                const visual = getReorderStepVisual(step, index);
                return `
                  <button
                    class="mission-sequence-card mission-sequence-card-art mission-card-animated mission-sequence-card-${visual.tone} ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""}"
                    data-step-index="${index}"
                    type="button"
                  >
                    <span class="mission-sequence-pin mission-sequence-pin-${visual.tone}">${index + 1}</span>
                    <span class="mission-sequence-card-frame">
                      <span class="mission-sequence-order">PASO ${index + 1}</span>
                      <span class="mission-sequence-label">${visual.label}</span>
                      <span class="mission-sequence-art-wrap">
                        <img src="${visual.art}" alt="${visual.label}" />
                      </span>
                      <strong>${step}</strong>
                    </span>
                  </button>
                `;
              })
	              .join("")}
	          </div>
            ${
              hasSelectedStep
                ? `
                  <div
                    class="mission-reorder-popover"
                    style="left:${((selectedIndex + 0.5) / Math.max(localState.orderedItems.length, 1)) * 100}%;"
                  >
                    <div class="mission-reorder-popover-card">
                      <div class="mission-reorder-popover-head">
                        <span class="eyebrow">Control activo</span>
                        <button class="mission-reorder-close" type="button" data-close-control="true" aria-label="Cerrar control">×</button>
                      </div>
                      <div class="mission-reorder-popover-main">
                        <span class="mission-reorder-popover-art">
                          <img src="${activeVisual.art}" alt="${activeVisual.label}" />
                        </span>
                        <div class="mission-reorder-popover-copy">
                          <strong>${activeStep}</strong>
                          <span>Mueve esta carta desde aquí.</span>
                        </div>
                      </div>
                      <div class="mission-reorder-popover-actions">
                        <button class="mission-reorder-mini-btn stepUpBtn" data-index="${selectedIndex}" type="button" ${selectedIndex <= 0 ? "disabled" : ""}>
                          <span class="mission-reorder-mini-arrow">←</span>
                          <span>Antes</span>
                        </button>
                        <button class="mission-reorder-mini-btn stepDownBtn" data-index="${selectedIndex}" type="button" ${selectedIndex >= localState.orderedItems.length - 1 ? "disabled" : ""}>
                          <span>Después</span>
                          <span class="mission-reorder-mini-arrow">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                `
                : ""
            }
	        </div>
        <div class="mission-reorder-controls mission-reorder-controls-art">
            <button class="mission-thruster-btn stepUpBtn" data-index="${selectedIndex}" type="button">
              <span class="mission-thruster-icon">←</span>
              <span>Antes</span>
            </button>
	            <div class="mission-reorder-console mission-reorder-console-quest mission-reorder-console-art">
              <div class="eyebrow">Control activo</div>
	              <div class="mission-reorder-console-main mission-reorder-console-main-art">
	                <span class="mission-reorder-console-art-wrap">
	                  <img src="${activeVisual.art}" alt="${activeVisual.label}" />
	                </span>
	                <div class="mission-reorder-console-copy">
	                  <strong>${activeStep}</strong>
	                  <span>Toca otra tarjeta para cambiar el bloque que quieres mover.</span>
	                </div>
	                <span class="mission-reorder-console-robot">
	                  <img src="${REORDER_ART.robot}" alt="" />
	                </span>
	              </div>
            </div>
            <button class="mission-thruster-btn stepDownBtn" data-index="${selectedIndex}" type="button">
              <span>Despues</span>
              <span class="mission-thruster-icon">→</span>
            </button>
          </div>
        </div>
    `;

    if (!isFullScreenReorderMission) return reorderBoard;

    return `
      <div class="mission-guided-stage mission-reorder-full-stage ${reorderStageClass}">
        <div class="mission-guided-birds" aria-hidden="true">
          <span class="bird-a"></span>
          <span class="bird-b"></span>
          <span class="bird-c"></span>
          <span class="bird-d"></span>
        </div>
        <div class="mission-guided-fish-layer" aria-hidden="true">
          <span class="fish-a"></span>
          <span class="fish-b"></span>
          <span class="fish-c"></span>
        </div>
        <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Datos de la misión">
          <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon(sideIconName)}</span>
          <span class="mission-guided-side-copy">
            <strong>Mision ${mission.number}</strong>
            <small>${mission.title}</small>
          </span>
          <b><span class="mission-guided-coin-icon" aria-hidden="true"></span>${mission.coins || 0}</b>
        </aside>
        <aside class="mission-guided-side-card mission-guided-side-card-right" aria-label="Premios acumulados y volver">
          <span class="mission-guided-wallet">
            <span><i class="mission-guided-coin-icon" aria-hidden="true"></i>${appState.coins}</span>
            <span><i class="mission-guided-gem-icon" aria-hidden="true"></i>${appState.gems}</span>
          </span>
          <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver a las islas de secuencias">
            <span class="mission-guided-back-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
            <small>Volver</small>
          </button>
        </aside>
        <section class="mission-guided-top mission-first-steps-top" aria-label="Estado de la misión">
          <img src="${PATH_GUIDED_ART.topPanel}" alt="" aria-hidden="true" />
          <div class="mission-guided-top-copy">
            <h1>${mission.title}</h1>
            <p>${challenge.prompt || "Ordena los pasos para ayudar al robot."}</p>
            <div class="mission-guided-progress">
              <span class="mission-guided-star" aria-hidden="true"></span>
              <strong>Progreso</strong>
              <div class="mission-guided-progress-track">
                <span style="width:${progressPercent}%;"></span>
              </div>
              <b>${correctCount} / ${solution.length}</b>
            </div>
          </div>
        </section>
        ${reorderBoard}
        <div class="mission-guided-actions-panel mission-reorder-full-actions">
          <button class="mission-first-steps-run" id="validateMissionBtn" type="button">
            Enviar al robot
          </button>
        </div>
      </div>
    `;
  }

  if (challenge.type === "multiple-choice") {
    if (mission?.id === "4-1-5") {
      const selectedRoute = MISSION5_ROUTES.find((route) => route.id === localState.selectedOptionId);

      return `
        <div class="mission5-stage">
          <div class="mission5-water-sheen" aria-hidden="true"></div>
          <div class="mission-guided-birds mission5-birds" aria-hidden="true">
            <span class="bird-a"></span>
            <span class="bird-b"></span>
            <span class="bird-c"></span>
            <span class="bird-d"></span>
          </div>
          <div class="mission-guided-fish-layer mission5-buoys" aria-hidden="true">
            <span class="fish-a"></span>
            <span class="fish-b"></span>
            <span class="fish-c"></span>
          </div>

          <aside class="mission-guided-side-card mission-guided-side-card-left mission5-top-card" aria-label="Datos de la misión">
            <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span>
            <span class="mission-guided-side-copy">
              <strong>Yo Aprendo</strong>
              <small>${mission.title}</small>
            </span>
            <b><span class="mission-guided-coin-icon" aria-hidden="true"></span>${mission.coins || 0}</b>
          </aside>
          <aside class="mission-guided-side-card mission-guided-side-card-right mission5-top-card" aria-label="Premios acumulados y volver">
            <span class="mission-guided-wallet">
              <span><i class="mission-guided-coin-icon" aria-hidden="true"></i>${appState.coins}</span>
              <span><i class="mission-guided-gem-icon" aria-hidden="true"></i>${appState.gems}</span>
            </span>
            <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver a las islas de secuencias">
              <span class="mission-guided-back-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
              <small>Volver</small>
            </button>
          </aside>

          <section class="mission5-board" aria-label="Rutas maritimas disponibles">
            ${MISSION5_ROUTES.map((route) => renderMission5Route(route, localState)).join("")}
          </section>

          <button class="mission5-scene-bit" type="button" aria-label="Consejo de Bit">
            <img src="${MISSION5_ART.robot}" alt="" aria-hidden="true" />
            <span class="mission5-bit-bubble" role="tooltip">
              <strong>Bit dice</strong>
              <span>Mira la roca y sigue las piedras. La ruta correcta la rodea con giros rectos antes de llegar al faro.</span>
            </span>
          </button>

          <aside class="mission5-hud" aria-label="Panel de la misión">
            <span class="mission5-hud-eyebrow">Micro-misión</span>
            <h1>${mission.title}</h1>
            <div class="mission5-hud-rule" aria-hidden="true"></div>
            <div class="mission5-hud-dialog">
              <p>Una roca bloquea el camino. Elige la ruta que evita el obstáculo y llega hasta el faro.</p>
            </div>
            <div class="mission5-robot-wrap" aria-hidden="true">
              <img src="${MISSION5_ART.robot}" alt="" />
            </div>
            <div class="mission5-answer">
              <p>Cual ruta es correcta?</p>
              <div class="mission5-answer-picks" aria-hidden="true">
                ${MISSION5_ROUTES.map(
                  (route) => `
                    <span class="${localState.selectedOptionId === route.id ? "active" : ""}">${route.id.toUpperCase()}</span>
                  `
                ).join("")}
              </div>
              <button class="mission-first-steps-run mission5-submit" id="validateMissionBtn" type="button" ${!localState.selectedOptionId ? "disabled" : ""}>
                Enviar respuesta
                <span class="ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-right")}</span>
              </button>
            </div>
          </aside>

          <div class="mission5-footer-hint" aria-live="polite">
            <span class="ui-icon-wrap" aria-hidden="true">${uiIcon("compass")}</span>
            <strong>${selectedRoute ? `${selectedRoute.label}: ${selectedRoute.result}` : "Observa, piensa y elige la mejor ruta."}</strong>
          </div>
        </div>
      `;
    }

    if (mission?.id === "4-1-4") {
      const selectedOption = (challenge.options || []).find((option) => option.id === localState.selectedOptionId);
      const selectedSteps = selectedOption?.text?.split("->").map((step) => step.trim()) || [];
      const progressPercent = localState.selectedOptionId ? 100 : 0;

      return `
        <div class="mission-guided-stage mission-error-hunt-stage">
          <div class="mission-guided-birds" aria-hidden="true">
            <span class="bird-a"></span>
            <span class="bird-b"></span>
            <span class="bird-c"></span>
            <span class="bird-d"></span>
          </div>
          <div class="mission-guided-fish-layer" aria-hidden="true">
            <span class="fish-a"></span>
            <span class="fish-b"></span>
            <span class="fish-c"></span>
          </div>
          <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Datos de la misión">
            <span class="mission-guided-map-icon ui-icon-wrap" aria-hidden="true">${uiIcon("book")}</span>
            <span class="mission-guided-side-copy">
              <strong>Mision ${mission.number}</strong>
              <small>${mission.title}</small>
            </span>
            <b><span class="mission-guided-coin-icon" aria-hidden="true"></span>${mission.coins || 0}</b>
          </aside>
          <aside class="mission-guided-side-card mission-guided-side-card-right" aria-label="Premios acumulados y volver">
            <span class="mission-guided-wallet">
              <span><i class="mission-guided-coin-icon" aria-hidden="true"></i>${appState.coins}</span>
              <span><i class="mission-guided-gem-icon" aria-hidden="true"></i>${appState.gems}</span>
            </span>
            <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver a las islas de secuencias">
              <span class="mission-guided-back-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
              <small>Volver</small>
            </button>
          </aside>
          <section class="mission-guided-top mission-error-hunt-top" aria-label="Estado de la misión">
            <img src="${PATH_GUIDED_ART.topPanel}" alt="" aria-hidden="true" />
            <div class="mission-guided-top-copy">
              <h1>${mission.title}</h1>
              <p>${challenge.prompt || "Elige la secuencia correcta."}</p>
              <div class="mission-guided-progress">
                <span class="mission-guided-star" aria-hidden="true"></span>
                <strong>Analisis</strong>
                <div class="mission-guided-progress-track">
                  <span style="width:${progressPercent}%;"></span>
                </div>
                <b>${localState.selectedOptionId ? "1 / 1" : "0 / 1"}</b>
              </div>
            </div>
          </section>

          <section class="mission-error-hunt-workbench" aria-label="Recetas posibles">
            <div class="mission-error-hunt-counter" aria-hidden="true">
              <span class="mission-error-hunt-jar"></span>
              <span class="mission-error-hunt-lemon lemon-a"></span>
              <span class="mission-error-hunt-lemon lemon-b"></span>
              <span class="mission-error-hunt-spoon"></span>
            </div>
            <div class="mission-error-hunt-options">
              ${(challenge.options || [])
                .map((option, optionIndex) => {
                  const selected = localState.selectedOptionId === option.id;
                  const steps = option.text.split("->").map((step) => step.trim());
                  return `
                    <button
                      class="mission-error-route ${selected ? "selected" : ""}"
                      data-option-id="${option.id}"
                      type="button"
                      style="--route-index:${optionIndex};"
                    >
                      <span class="mission-error-route-tag">Ruta ${option.id.toUpperCase()}</span>
                      <span class="mission-error-route-flow">
                        ${steps
                          .map(
                            (step, stepIndex) => `
                              <span class="mission-error-step">
                                <i>${stepIndex + 1}</i>
                                <img src="${getMission4StepArt(step)}" alt="" aria-hidden="true" />
                                <strong>${step}</strong>
                              </span>
                            `
                          )
                          .join('<span class="mission-error-arrow" aria-hidden="true"></span>')}
                      </span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </section>

          <section class="mission-error-hunt-preview" aria-label="Vista previa de la receta">
            <div class="mission-error-preview-card">
              <span class="eyebrow">Receta seleccionada</span>
              ${
                selectedSteps.length
                  ? `
                    <div class="mission-error-preview-steps">
                      ${selectedSteps
                        .map(
                          (step, index) => `
                            <span style="--step-index:${index};">
                              <i>${index + 1}</i>
                              <img src="${getMission4StepArt(step)}" alt="" aria-hidden="true" />
                              <b>${step}</b>
                            </span>
                          `
                        )
                        .join("")}
                    </div>
                  `
                  : `<p>Toca una ruta para que Bit revise si la limonada se puede preparar sin errores.</p>`
              }
            </div>
          </section>

          <div class="mission-guided-actions-panel mission-error-hunt-actions">
            <button class="mission-first-steps-run" id="validateMissionBtn" type="button" ${!localState.selectedOptionId ? "disabled" : ""}>
              Probar receta
            </button>
          </div>
        </div>
      `;
    }

    if (mission?.id.startsWith("4-2-")) {
      return `
        <div class="mission-loop-fullscreen-stage">
          <section class="mission-loop-visual-arena">
            ${renderMultipleChoiceSimulation(mission, challenge, localState)}
          </section>
          
          <aside class="mission-loop-hud-sidebar">
          <!-- Submarine Cabin Rivets -->
          <div class="hud-rivet hud-rivet-tl"></div>
          <div class="hud-rivet hud-rivet-tr"></div>
          <div class="hud-rivet hud-rivet-bl"></div>
          <div class="hud-rivet hud-rivet-br"></div>
            <div class="mission-loop-hud-header">
              <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver">
                <span class="ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
                Volver
              </button>
              <div class="wallet">
                <span><i class="currency-icon gold"></i>${appState.coins}</span>
                <span><i class="currency-icon gems"></i>${appState.gems}</span>
              </div>
            </div>
            
            <div class="mission-loop-hud-body">
              <span class="eyebrow" style="color:#fbbf24; font-weight:bold; font-size:11px; letter-spacing:1px; text-transform:uppercase;">Micro-misión ${mission.number}</span>
              <h1>${mission.title}</h1>
              <p class="mission-prompt">${challenge.prompt || "Elige la opción que mejor resuelve el reto."}</p>
              
              <div class="mission-options" style="margin-top:16px;">
                ${(challenge.options || [])
                  .map((option) => {
                    const selected = localState.selectedOptionId === option.id;
                    return `
                      <button
                        class="mission-option ${selected ? "selected" : ""}"
                        data-option-id="${option.id}"
                        type="button"
                      >
                        <strong>${option.id.toUpperCase()}</strong>
                        <span>${option.text}</span>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            </div>
            
            <div class="mission-loop-hud-actions">
              <button class="mission-loop-hud-submit" id="validateMissionBtn" type="button" ${!localState.selectedOptionId ? "disabled" : ""}>
                Probar respuesta
                <span class="ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-right")}</span>
              </button>
            </div>
          </aside>
        </div>
      `;
    }

    return `
      <p class="mission-helper">Elige la opcion que mejor resuelve el reto.</p>
      <div class="mission-options">
        ${(challenge.options || [])
          .map((option) => {
            const selected = localState.selectedOptionId === option.id;
            return `
              <button
                class="mission-option ${selected ? "selected" : ""}"
                data-option-id="${option.id}"
                type="button"
              >
                <strong>${option.id.toUpperCase()}</strong>
                <span>${option.text}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  if (challenge.type === "categorize") {
    return `
      <p class="mission-helper">Haz click en cada tarjeta para cambiarla de categoría hasta que todo quede bien organizado.</p>
      <div class="mission-categories">
        ${(challenge.items || [])
          .map((item, index) => `
            <button
              class="mission-category-card"
              data-category-index="${index}"
              type="button"
            >
              <strong>${item.label}</strong>
              <span>${localState.assignments[index] || "-"}</span>
            </button>
          `)
          .join("")}
      </div>
      <div class="mission-category-legend">
        Categorias: ${(challenge.categories || []).join(" / ")}
      </div>
    `;
  }

  if (challenge.type === "path-program" && (mission?.id === "4-1-3" || mission?.id === "4-1-final")) {
    return renderPathGuidedMission(challenge, localState, mission);
  }

  if (challenge.type === "path-program") {
    const simulation = simulatePathFrames(challenge, localState.program);
    const maxSteps = challenge.maxSteps || 6;
    const activeFrame = simulation.frames[Math.min(localState.previewFrameIndex, simulation.frames.length - 1)];
    const statusText =
      simulation.reason === "goal"
        ? "El personaje llega a la meta."
        : simulation.reason === "obstacle"
          ? "El personaje choca con un muro."
          : simulation.reason === "outside"
            ? "El personaje se sale del tablero."
            : "El programa aun necesita ajustes.";

    return `
      <div class="mission-path-game">
        <section class="mission-path-board-panel">
          <p class="mission-helper mission-path-helper">Elige comandos, arma tu ruta y pulsa ejecutar para ver al robot viajar por el mapa.</p>
          ${renderPathBoardGame(challenge, localState)}
        </section>
        <section class="mission-path-control-panel">
          <div class="mission-path-control-head">
            <span class="eyebrow">Controles</span>
            <strong>${localState.program.length}/${maxSteps}</strong>
          </div>
          <div class="mission-command-bank">
        ${(challenge.palette || ["forward", "left", "right"])
          .map(
            (command) => `
              <button class="mission-command-btn mission-command-${command}" data-command="${command}" type="button">
                <span class="mission-command-icon" aria-hidden="true"></span>
                <span>${COMMAND_SHORT_LABELS[command] || COMMAND_LABELS[command] || command}</span>
              </button>
            `
          )
          .join("")}
          </div>
          <div class="mission-program-panel">
        <div class="mission-program-header">
          <strong>Tu ruta</strong>
          <span>${maxSteps - localState.program.length} espacios libres</span>
        </div>
        <div class="mission-program-list">
          ${
            localState.program.length
              ? localState.program
                  .map(
                    (command, index) => `
                      <div class="mission-program-chip mission-program-chip-${command} ${index === localState.previewFrameIndex - 1 ? "active" : ""}">
                        <span class="mission-program-step">${index + 1}</span>
                        <span>${COMMAND_SHORT_LABELS[command] || COMMAND_LABELS[command] || command}</span>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="mission-program-empty">Todavia no agregaste instrucciones.</div>`
          }
        </div>
        <div class="mission-program-actions">
          <button class="btn btn-primary" id="runProgramBtn" type="button">Ejecutar</button>
          <button class="btn btn-secondary" id="removeLastCommandBtn" type="button">Borrar ultimo</button>
          <button class="btn btn-secondary" id="resetProgramBtn" type="button">Reiniciar</button>
        </div>
      </div>
      <div class="mission-preview-note ${simulation.success ? "success" : ""}">
        ${statusText}
      </div>
        </section>
      </div>
    `;
  }

  if (challenge.type === "loop-builder") {
    const isRunning = localState.isRunning || false;
    return `
      <div class="mission-loop-fullscreen-stage">
        <section class="mission-loop-visual-arena">
          ${renderLoopSimulation(mission, challenge, localState)}
        </section>
        
        <aside class="mission-loop-hud-sidebar">
          <div class="mission-loop-hud-header">
            <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver">
              <span class="ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span>
              Volver
            </button>
            <div class="wallet">
              <span><i class="currency-icon gold"></i>${appState.coins}</span>
              <span><i class="currency-icon gems"></i>${appState.gems}</span>
            </div>
          </div>
          
          <div class="mission-loop-hud-body">
            <span class="eyebrow" style="color:#fbbf24; font-weight:bold; font-size:11px; letter-spacing:1px; text-transform:uppercase;">Micro-misión ${mission.number}</span>
            <h1>${mission.title}</h1>
            <p class="mission-prompt">${challenge.prompt || "Consola del Capitán: Ajustá los diales mecánicos para configurar la repetición del patrón."}</p>
            
            <div class="mission-loop-layout">
              <div class="mission-loop-card">
                <div class="eyebrow">Diales de Ciclos (Repeticiones)</div>
                <div class="mission-loop-options">
                  ${(challenge.repeatOptions || [])
                    .map(
                      (count) => `
                        <button
                          class="mission-loop-choice ${localState.repeatCount === count ? "selected" : ""} ${isRunning ? "disabled" : ""}"
                          data-repeat-count="${count}"
                          type="button"
                          ${isRunning ? "disabled" : ""}
                        >
                          <span class="loop-choice-bullet"></span>
                          <span class="loop-choice-label">${count} ciclos</span>
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </div>
              
              <div class="mission-loop-card">
                <div class="eyebrow">Mecanismo de Acción</div>
                <div class="mission-loop-options">
                  ${(challenge.actionOptions || [])
                    .map(
                      (action) => `
                        <button
                          class="mission-loop-choice ${localState.actionId === action.id ? "selected" : ""} ${isRunning ? "disabled" : ""}"
                          data-action-id="${action.id}"
                          type="button"
                          ${isRunning ? "disabled" : ""}
                        >
                          <span class="loop-choice-bullet"></span>
                          <span class="loop-choice-label">${action.label}</span>
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </div>
            </div>
            
            <div class="mission-loop-preview">
              <div class="captain-preview-header">
                <span class="sonar-ping"></span>
                <strong>Holograma de Configuración</strong>
              </div>
              <div class="captain-preview-hologram">
                <div class="captain-hologram-gear">
                  <svg class="gear-svg" viewBox="0 0 100 100">
                    <path d="M50 30a20 20 0 1 0 0 40 20 20 0 0 0 0-40zm0 10a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" fill="currentColor"/>
                    <path d="M50 10l-4 8 8 0z M50 90l-4-8 8 0z M10 50l8-4 0 8z M90 50l-8-4 0 8z M22 22l6 6-6 0z M78 78l-6-6 6 0z M22 78l6-6-6 0z M78 22l-6 6 6 0z" fill="currentColor"/>
                  </svg>
                  <div class="gear-number">${localState.repeatCount || "?"}</div>
                  <div class="gear-label">CICLOS</div>
                </div>
                
                <div class="captain-hologram-link">
                  <svg class="arrow-connector" viewBox="0 0 60 20">
                    <path d="M 0 10 L 50 10 M 42 4 L 50 10 L 42 16" fill="none" stroke="#59d4ff" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                </div>

                <div class="captain-hologram-action">
                  <div class="action-icon-socket">
                    ${getActionSvgIcon(localState.actionId)}
                  </div>
                  <div class="action-label">${
                    (challenge.actionOptions || []).find((item) => item.id === localState.actionId)?.label || "Elegir acción..."
                  }</div>
                </div>
              </div>
            </div>
            
            <div class="mission-loop-track">
              ${Array.from({ length: localState.repeatCount || 0 }, (_, index) => `
                <div class="mission-loop-step ${localState.isRunning && localState.animationStep === index ? "active" : ""} ${localState.hasRun && localState.animationStep > index ? "done" : ""}" style="animation-delay:${index * 0.1}s;">
                  ${index + 1}
                </div>
              `).join("")}
            </div>
          </div>
          
          <div class="mission-loop-hud-actions">
            <button class="mission-loop-hud-submit" id="validateMissionBtn" type="button" ${isRunning ? "disabled" : ""}>
              Activar bucle
              <span class="ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-right")}</span>
            </button>
          </div>
        </aside>
      </div>
    `;
  }

  return `<p>No hay un reto configurado para esta misión.</p>`;
}

export function renderMission() {
  const appShell = document.querySelector(".app-shell");
  const world = grade4Data.worlds.find((w) => w.id === appState.selectedWorldId);
  const mission = world?.missions.find((m) => m.id === appState.selectedMissionId);

  if (!appShell || !world || !mission) return;

  const challenge = mission.challenge || {};
  const missionModel = getMissionViewModel(mission);
  const heroBadgeValue =
    challenge.type === "reorder"
      ? `${getCorrectCount(missionModel.state.orderedItems || [], challenge.solution || [])}/${(challenge.solution || []).length || 0}`
      : world.short;
  const isFullScreenMission = mission.id.startsWith("4-1-") || mission.id.startsWith("4-2-");
  const missionScreenClass =
    mission.id.startsWith("4-2-")
      ? " mission-screen-loop-fullscreen"
      : mission.id === "4-1-1"
      ? " mission-screen-path-guided mission-screen-first-steps"
      : mission.id === "4-1-2"
      ? " mission-screen-order-correct mission-screen-order-full"
      : mission.id === "4-1-3"
        ? " mission-screen-path-guided"
        : mission.id === "4-1-4"
        ? " mission-screen-path-guided mission-screen-error-hunt"
      : mission.id === "4-1-5"
        ? " mission-screen-path-guided mission-screen-obstacle-routes"
        : mission.id === "4-1-6"
        ? " mission-screen-order-correct mission-screen-order-full mission-screen-create-algorithm"
        : mission.id === "4-1-final"
        ? " mission-screen-path-guided mission-screen-final-path"
        : "";
  let localState = missionModel.state;
  let animationTimer = null;
  let completionTimer = null;

  function getValidateButtonLabel() {
    if (challenge.type === "reorder") return "Enviar al robot";
    if (challenge.type === "path-program") return mission.id === "4-1-3" ? "Completar" : "Confirmar ruta";
    if (challenge.type === "loop-builder") return "Activar bucle";
    return "Probar solución";
  }

  function stopAnimation() {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    if (completionTimer) {
      clearTimeout(completionTimer);
      completionTimer = null;
    }
  }

  function scheduleProgramPlayback() {
    stopAnimation();

    const simulation = simulatePathFrames(challenge, localState.program);
    if (simulation.frames.length <= 1) return;

    localState = {
      ...localState,
      isRunning: true,
      previewFrameIndex: 0
    };
    draw();

    function step(frameIndex) {
      const currentFrame = simulation.frames[frameIndex];
      if (currentFrame?.command === "forward" && currentFrame.reason === "move") {
        playStep();
      } else if (currentFrame?.command === "forward") {
        playBlocked();
      } else if (currentFrame?.command === "left" || currentFrame?.command === "right") {
        playTurn();
      }

      localState = {
        ...localState,
        previewFrameIndex: frameIndex
      };
      draw();

      if (frameIndex < simulation.frames.length - 1) {
        animationTimer = setTimeout(() => step(frameIndex + 1), 380);
      } else {
        animationTimer = setTimeout(() => {
          if (simulation.success) {
            playGoalBurst();
          } else if (simulation.reason === "obstacle" || simulation.reason === "outside") {
            playError();
          }
          localState = {
            ...localState,
            isRunning: false
          };
          draw();
        }, 240);
      }
    }

    animationTimer = setTimeout(() => step(1), 260);
  }

  function runLoopSimulationAnimation() {
    stopAnimation();
    
    localState = {
      ...localState,
      isRunning: true,
      animationStep: 0,
      hasRun: true,
      isSuccess: false
    };
    draw();

    const totalSteps = localState.repeatCount;
    
    function playStepSound(actionId) {
      if (actionId === "forward") {
        playStep();
      } else if (actionId === "water") {
        playSelect();
      } else if (actionId === "spin") {
        playTurn();
      } else {
        playSelect();
      }
    }

    function animStep(stepIndex) {
      localState = {
        ...localState,
        animationStep: stepIndex
      };
      playStepSound(localState.actionId);
      draw();

      if (stepIndex < totalSteps - 1) {
        animationTimer = setTimeout(() => animStep(stepIndex + 1), 600);
      } else {
        const correct = missionModel.validate(localState);
        localState = {
          ...localState,
          isRunning: false,
          isSuccess: correct
        };
        draw();

        animationTimer = setTimeout(() => {
          if (correct) {
            playGoalBurst();
            const reward = completeMission(mission);
            if (reward.awarded) playReward();

            goToResult({
              success: true,
              title: reward.awarded ? "Muy bien" : "Misión repasada",
              message: challenge.successMessage || "Superaste la misión.",
              coins: reward.coins,
              gems: reward.gems
            });
          } else {
            playError();
            goToResult({
              success: false,
              title: "Casi",
              message: "El bucle no es correcto para este desafío. Revisá los parámetros e intentá otra vez.",
              coins: 0,
              gems: 0
            });
          }
          window.renderApp();
        }, 1000);
      }
    }

    animationTimer = setTimeout(() => animStep(0), 400);
  }

  function draw() {
    appShell.innerHTML = `
      ${isFullScreenMission ? "" : `<header class="topbar">
        <div class="topbar-left">
          <div class="pill level-pill mission-header-pill">
          <span class="mission-header-badge ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span>
            <span>Yo Aprendo</span>
          </div>
          <div class="mission-header-chevron" aria-hidden="true">${uiIcon("arrow-right")}</div>
          <div class="pill title-pill mission-header-pill mission-header-pill-title"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("flag")}</span><span>${mission.title}</span></div>
        </div>

        <div class="topbar-right">
          <button class="pill nav-pill mission-header-pill" id="goHomeBtn" type="button">
            <span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("home")}</span>
            <span>Inicio</span>
          </button>
          <button class="pill nav-pill mission-header-pill" id="openDashboardBtn" type="button">
            <span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span>
            <span>Paneles</span>
          </button>
          <div class="pill currency-pill">
            <span class="currency-icon gold"></span>
            <span>${appState.coins}</span>
          </div>
          <div class="pill currency-pill">
            <span class="currency-icon gems"></span>
            <span>${appState.gems}</span>
          </div>
          <button class="pill nav-pill mission-header-pill mission-header-pill-icon" type="button" aria-label="Configuracion">
            <span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("settings")}</span>
          </button>
        </div>
      </header>`}

      <main class="mission-screen mission-screen-epic${missionScreenClass}">
        ${renderAmbientParticles()}
        <section class="mission-panel mission-panel-epic ${challenge.type === "reorder" ? "mission-panel-quest" : ""}">
          <div class="mission-hero">
            <div class="mission-hero-main">
              <div class="mission-hero-emblem mission-hero-emblem-${challenge.type === "reorder" ? "reorder" : "default"}" aria-hidden="true">
                ${
                  challenge.type === "reorder"
                    ? `<img src="${REORDER_ART.robot}" alt="" class="mission-hero-emblem-image" />`
                    : `<span class="mission-hero-emblem-core">M${mission.number}</span>`
                }
              </div>
              <div>
                <div class="eyebrow">Micro-misión</div>
                <h1>${mission.title}</h1>
                <p class="mission-prompt">${challenge.prompt || "Resuelve el reto para seguir avanzando."}</p>
                <div class="mission-meta-row mission-meta-row-hero">
                  <div class="mission-meta-chip">Mundo: ${world.short}</div>
                  <div class="mission-meta-chip">Dificultad: ${mission.difficulty}</div>
                  <div class="mission-meta-chip">Recompensa: ${mission.coins || 0} monedas / ${mission.gems || 0} gemas</div>
                </div>
              </div>
            </div>
            <div class="mission-hero-badge ${challenge.type === "reorder" ? "mission-hero-badge-progress" : ""}">
              <span>${challenge.type === "reorder" ? "Progreso" : "Mundo"}</span>
              <strong>${heroBadgeValue}</strong>
              <small>${challenge.type === "reorder" ? "bloques alineados" : world.short}</small>
            </div>
          </div>

          ${renderChallengeBody(challenge, localState, mission)}

          ${renderMissionAssistant(mission, challenge, localState)}

          ${
            isFullScreenMission
              ? ""
              : `
                <div class="mission-actions">
                  <button id="backToSubmapBtn" class="btn btn-secondary">Volver</button>
                  <button id="validateMissionBtn" class="btn btn-primary">${getValidateButtonLabel()}</button>
                </div>
              `
          }
        </section>
      </main>
    `;

    document.getElementById("backToSubmapBtn")?.addEventListener("click", () => {
      unlockAudio();
      playUiClick();
      stopAnimation();
      goToSubmap(world.id);
      window.renderApp();
    });

    document.getElementById("guidedBackToSubmapBtn")?.addEventListener("click", () => {
      unlockAudio();
      playUiClick();
      stopAnimation();
      goToSubmap(world.id);
      window.renderApp();
    });

    document.getElementById("openDashboardBtn")?.addEventListener("click", () => {
      unlockAudio();
      playUiClick();
      stopAnimation();
      goToDashboard("student");
      window.renderApp();
    });

    document.getElementById("goHomeBtn")?.addEventListener("click", () => {
      unlockAudio();
      playUiClick();
      stopAnimation();
      goToStart();
      window.renderApp();
    });

    document.getElementById("validateMissionBtn")?.addEventListener("click", () => {
      unlockAudio();
      stopAnimation();

      if (challenge.type === "loop-builder") {
        runLoopSimulationAnimation();
        return;
      }

      const correct = missionModel.validate(localState);

      if (correct) {
        playSuccess();
        const reward = completeMission(mission);
        if (reward.awarded) playReward();

        goToResult({
          success: true,
          title: reward.awarded ? "Muy bien" : "Mision repasada",
          message: reward.awarded
            ? challenge.successMessage || "Superaste la misión."
            : "Ya habías cobrado esta recompensa. El repaso mantiene tu progreso sin duplicar premios.",
          coins: reward.coins,
          gems: reward.gems
        });
      } else {
        playError();
        goToResult({
          success: false,
          title: "Casi",
          message: "Todavía no es la mejor solución. Revisá el reto y probá otra vez.",
          coins: 0,
          gems: 0
        });
      }

      window.renderApp();
    });

    document.querySelectorAll("[data-assistant-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        if (localState.assistantPinned) {
          playUiClick();
        } else {
          playPanelOpen();
        }
        localState = {
          ...localState,
          assistantPinned: !localState.assistantPinned
        };
        draw();
      });
    });

    document.querySelectorAll("[data-assistant-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playUiClick();
        localState = {
          ...localState,
          assistantPinned: false
        };
        draw();
      });
    });

    document.querySelectorAll("[data-assistant-topic]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playPanelOpen();
        localState = {
          ...localState,
          assistantPinned: true,
          assistantTopic: btn.dataset.assistantTopic || "task"
        };
        draw();
      });
    });

    document.querySelectorAll("[data-step-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playSelect();
        const nextIndex = Number(btn.dataset.stepIndex);
        localState = {
          ...localState,
          selectedStepIndex: localState.selectedStepIndex === nextIndex ? null : nextIndex
        };
        draw();
      });
    });

    document.querySelectorAll("[data-close-control]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playUiClick();
        localState = {
          ...localState,
          selectedStepIndex: null
        };
        draw();
      });
    });

    document.querySelectorAll(".stepUpBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        const index = Number(btn.dataset.index);
        if (index > 0) {
          playCommandMove();
          localState = {
            ...localState,
            orderedItems: moveItem(localState.orderedItems, index, index - 1),
            selectedStepIndex: index - 1
          };
          draw();
        }
      });
    });

    document.querySelectorAll(".stepDownBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        const index = Number(btn.dataset.index);
        if (index < localState.orderedItems.length - 1) {
          playCommandMove();
          localState = {
            ...localState,
            orderedItems: moveItem(localState.orderedItems, index, index + 1),
            selectedStepIndex: index + 1
          };
          draw();
        }
      });
    });

    document.querySelectorAll("[data-option-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playSelect();
        localState = {
          ...localState,
          selectedOptionId: btn.dataset.optionId
        };
        draw();
      });
    });

    document.querySelectorAll("[data-category-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        const index = Number(btn.dataset.categoryIndex);
        const categories = challenge.categories || [];
        const current = localState.assignments[index];
        const currentIndex = categories.indexOf(current);
        const nextCategory = categories[(currentIndex + 1) % categories.length];

        playSelect();
        localState = {
          ...localState,
          assignments: {
            ...localState.assignments,
            [index]: nextCategory
          }
        };
        draw();
      });
    });

    document.querySelectorAll("[data-command]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        const command = btn.dataset.command;
        const maxSteps = challenge.maxSteps || 6;
        if (!command || localState.program.length >= maxSteps || localState.isRunning) return;

        playCommandAdd();
        localState = {
          ...localState,
          program: [...localState.program, command],
          previewFrameIndex: 0
        };
        draw();
      });
    });

    document.getElementById("runProgramBtn")?.addEventListener("click", () => {
      unlockAudio();
      if (!localState.program.length || localState.isRunning) return;
      playProgramRun();
      const shouldCompleteAfterRun = (mission.id === "4-1-3" || mission.id === "4-1-final") && missionModel.validate(localState);
      scheduleProgramPlayback();

      if (shouldCompleteAfterRun) {
        const completionDelay = Math.max(1100, localState.program.length * 420 + 720);
        completionTimer = setTimeout(() => {
          playGoalBurst();
          const reward = completeMission(mission);
          if (reward.awarded) playReward();

          goToResult({
            success: true,
            title: reward.awarded ? "Muy bien" : "Mision repasada",
            message: reward.awarded
              ? challenge.successMessage || "Superaste la misión."
              : "Ya habías cobrado esta recompensa. El repaso mantiene tu progreso sin duplicar premios.",
            coins: reward.coins,
            gems: reward.gems
          });
          window.renderApp();
        }, completionDelay);
      }
    });

    document.getElementById("removeLastCommandBtn")?.addEventListener("click", () => {
      unlockAudio();
      if (localState.isRunning) return;
      playCommandUndo();
      stopAnimation();
      localState = {
        ...localState,
        program: localState.program.slice(0, -1),
        previewFrameIndex: 0
      };
      draw();
    });

    document.getElementById("resetProgramBtn")?.addEventListener("click", () => {
      unlockAudio();
      if (localState.isRunning) return;
      playCommandReset();
      stopAnimation();
      localState = {
        ...localState,
        program: [],
        previewFrameIndex: 0
      };
      draw();
    });

    document.querySelectorAll("[data-repeat-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playSelect();
        localState = {
          ...localState,
          repeatCount: Number(btn.dataset.repeatCount)
        };
        draw();
      });
    });

    document.querySelectorAll("[data-action-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playSelect();
        localState = {
          ...localState,
          actionId: btn.dataset.actionId
        };
        draw();
      });
    });
  }

  draw();
}

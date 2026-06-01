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
  playBlocked
} from "../utils/audio.js";

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
  const missionName = mission?.title || "esta mision";

  if (challenge.type === "reorder") {
    return `En ${worldName}, ${missionName} ayuda a encender una pista del faro: cuando ordenas pasos, conviertes una idea grande en instrucciones pequenas y claras.`;
  }

  if (challenge.type === "path-program") {
    return `En ${worldName}, ${missionName} prueba una ruta del mapa. Programar no es adivinar: es planear, ejecutar, mirar el resultado y ajustar.`;
  }

  if (challenge.type === "loop-builder") {
    return `En ${worldName}, ${missionName} revela un patron repetido. Si el mismo paso vuelve muchas veces, el robot puede usar un bucle para ahorrar energia.`;
  }

  if (challenge.type === "multiple-choice") {
    return `En ${worldName}, ${missionName} abre una decision del camino. Comparar opciones te ayuda a elegir la regla que mejor resuelve el problema.`;
  }

  if (challenge.type === "categorize") {
    return `En ${worldName}, ${missionName} ordena pistas del archipielago. Clasificar datos permite entenderlos antes de decidir que hacer.`;
  }

  return `En ${worldName}, ${missionName} suma una pieza a la historia del faro y al mapa del codigo.`;
}

function getChallengeTheory(challenge) {
  if (challenge.type === "reorder") {
    return "Idea clave: una secuencia es un algoritmo. El orden importa porque cada paso prepara el siguiente.";
  }

  if (challenge.type === "path-program") {
    return "Idea clave: un programa es una lista de comandos que se puede probar. Si falla, se depura cambiando una parte.";
  }

  if (challenge.type === "loop-builder") {
    return "Idea clave: un bucle repite una accion. Sirve cuando detectas un patron y quieres escribir menos instrucciones.";
  }

  if (challenge.type === "multiple-choice") {
    return "Idea clave: una condicion ayuda a decidir. Lee cada caso y busca que regla se cumple.";
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
      title: `${playerName}, organiza las tarjetas`,
      body: "Haz click en cada una hasta dejarla en la categoria correcta.",
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
    body: "Estoy aqui para guiarte en esta mision.",
    hint: prompt
  };
}

function getMissionAssistantContent(mission, challenge, topic = "task") {
  const playerName = getMissionPlayerName();
  const prompt = challenge.prompt || "Vamos paso a paso y resolvamos este reto.";
  const missionName = mission.title || "esta mision";
  const storyBeat = getMissionStoryBeat(mission, challenge);
  const theory = getChallengeTheory(challenge);

  if (challenge.type === "reorder") {
    if (topic === "hint") {
      return {
        title: `${playerName}, piensa primero`,
        body: "Busca la accion que debe pasar antes que todas y luego acomoda las demas sin apurarte.",
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
        title: `${playerName}, compara opciones`,
        body: "Lee cada opcion completa. Descarta primero las que tengan un paso fuera de lugar.",
        hint: "Cuando dudes, piensa qué accion necesariamente tiene que ocurrir primero."
      };
    }

    if (topic === "chat") {
      return {
        title: `Cuenta conmigo, ${playerName}`,
        body: "Si quieres, vuelve a tocarme y repasamos la consigna cuantas veces necesites.",
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
        body: "Estoy aqui para recordarte la regla del reto cuando la necesites.",
        hint: `En ${missionName}, organiza cada elemento en su categoria correcta.`
      };
    }

    return {
      title: `${playerName}, organiza las tarjetas`,
      body: "Haz click en cada una hasta dejarla en la categoria correcta.",
      hint: prompt
    };
  }

  if (challenge.type === "loop-builder") {
    if (topic === "hint") {
      return {
        title: `${playerName}, busca la repeticion`,
        body: "Piensa qué accion se repite igual varias veces y luego decide cuántas veces ocurre.",
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
  if (topic === "task") {
    copy = {
      ...copy,
      body: `${getMissionStoryBeat(mission, challenge)} ${getChallengeTheory(challenge)}`
    };
  }
  const openClass = localState.assistantPinned ? " open" : "";
  const titleLength = Math.max(copy.title.length, 12);
  const bodyLength = Math.max(copy.body.length, 24);

  return `
    <aside class="mission-assistant${openClass}" aria-label="Guia de mision">
      <div class="mission-assistant-bubble" role="status" aria-live="polite">
        <div class="mission-assistant-bubble-top">
          <span class="mission-assistant-kicker">Guia del robot</span>
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
            Que hago
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
        <img src="${REORDER_ART.robot}" alt="Robot guia" />
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
        actionId: challenge.actionOptions?.[0]?.id ?? null
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
  const board = challenge.board || {};
  const simulation = simulatePathFrames(challenge, localState.program);
  const maxSteps = challenge.maxSteps || 5;
  const frameIndex = Math.max(0, Math.min(localState.previewFrameIndex, simulation.frames.length - 1));
  const activeFrame = simulation.frames[frameIndex] || simulation.frames[0] || board.start || { row: 0, col: 0, facing: "right" };
  const progress = Math.min(localState.program.length, maxSteps);
  const progressPercent = maxSteps ? (progress / maxSteps) * 100 : 0;
  const activePointStyle = getPathBoardStyle(activeFrame.row || 0, activeFrame.col || 0);
  const goalPointStyle = getPathBoardStyle(board.goal?.row || 0, board.goal?.col || 0);
  const routeSlots = Array.from({ length: maxSteps }, (_, index) => localState.program[index] || null);
  const commandPalette = mission?.id === "4-1-3" ? ["left", "forward", "right"] : challenge.palette || ["forward", "left", "right"];
  const trailFrames = simulation.frames
    .slice(1, frameIndex + 1)
    .filter((frame) => frame.reason === "move")
    .map((frame, index) => ({ ...frame, index }));
  const showGoalBurst = simulation.success && !localState.isRunning && frameIndex >= simulation.frames.length - 1;
  const blockedFrame = activeFrame.reason === "obstacle" ? activeFrame : null;

  return `
    <div class="mission-guided-stage ${showGoalBurst ? "mission-guided-stage-complete" : ""}">
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
      <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Datos de la mision">
        <span class="mission-guided-map-icon" aria-hidden="true"></span>
        <span class="mission-guided-side-copy">
          <strong>Mision ${mission.number}</strong>
          <small>Ruta al faro</small>
        </span>
        <b><span class="mission-guided-coin-icon" aria-hidden="true"></span>${mission.coins || 0}</b>
      </aside>
      <aside class="mission-guided-side-card mission-guided-side-card-right" aria-label="Premios acumulados y volver">
        <span class="mission-guided-wallet">
          <span><i class="mission-guided-coin-icon" aria-hidden="true"></i>${appState.coins}</span>
          <span><i class="mission-guided-gem-icon" aria-hidden="true"></i>${appState.gems}</span>
        </span>
        <button id="guidedBackToSubmapBtn" type="button" aria-label="Volver a las islas de secuencias">
          <span class="mission-guided-back-icon" aria-hidden="true"></span>
          <small>Volver</small>
        </button>
      </aside>
      <section class="mission-guided-top" aria-label="Estado de la mision">
        <img src="${PATH_GUIDED_ART.topPanel}" alt="" aria-hidden="true" />
        <div class="mission-guided-top-copy">
          <h1>${mission.title}</h1>
          <p>Lleva al robot pirata hasta el faro evitando la roca.</p>
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
        <span class="mission-guided-lighthouse-beam" style="${goalPointStyle}" aria-hidden="true"></span>
        ${trailFrames
          .map(
            (frame) => `
              <span
                class="mission-guided-skate-trail trail-${frame.index % 4}"
                style="${getPathBoardStyle(frame.row || 0, frame.col || 0)}"
                aria-hidden="true"
              ></span>
              <span
                class="mission-guided-tile-pulse pulse-${frame.index % 4}"
                style="${getPathBoardStyle(frame.row || 0, frame.col || 0)}"
                aria-hidden="true"
              ></span>
            `
          )
          .join("")}
        <span
          class="mission-guided-player facing-${activeFrame.facing || "right"} ${localState.isRunning ? "is-running" : ""}"
          style="${activePointStyle}"
          aria-hidden="true"
        >
          <img src="${PATH_GUIDED_ART.robot}" alt="" />
        </span>
        <span class="mission-guided-current-arrow" style="${activePointStyle}" aria-hidden="true"></span>
        ${
          blockedFrame
            ? `
              <span
                class="mission-guided-blocked-burst"
                style="${getPathBoardStyle(blockedFrame.blockedRow || 0, blockedFrame.blockedCol || 0)}"
                aria-hidden="true"
              ></span>
            `
            : ""
        }
        ${showGoalBurst ? `<span class="mission-guided-goal-burst" style="${goalPointStyle}" aria-hidden="true"></span>` : ""}
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

function renderChallengeBody(challenge, localState, mission) {
  if (challenge.type === "reorder") {
    const isFirstStepsMission = mission?.id === "4-1-1";
    const isOrderCorrectMission = mission?.id === "4-1-2";
    const isFullScreenReorderMission = isFirstStepsMission || isOrderCorrectMission;
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
            <strong>Tablero del robot</strong>
            <span>Ordena los pasos para que el robot pueda preparar su mochila antes de salir.</span>
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
                          <span>Mueve esta carta desde aqui.</span>
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
      <div class="mission-guided-stage mission-reorder-full-stage ${isFirstStepsMission ? "mission-first-steps-stage" : "mission-order-steps-stage"}">
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
        <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Datos de la mision">
          <span class="mission-guided-map-icon" aria-hidden="true"></span>
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
            <span class="mission-guided-back-icon" aria-hidden="true"></span>
            <small>Volver</small>
          </button>
        </aside>
        <section class="mission-guided-top mission-first-steps-top" aria-label="Estado de la mision">
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
          <aside class="mission-guided-side-card mission-guided-side-card-left" aria-label="Datos de la mision">
            <span class="mission-guided-map-icon" aria-hidden="true"></span>
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
              <span class="mission-guided-back-icon" aria-hidden="true"></span>
              <small>Volver</small>
            </button>
          </aside>
          <section class="mission-guided-top mission-error-hunt-top" aria-label="Estado de la mision">
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
      <p class="mission-helper">Haz click en cada tarjeta para cambiarla de categoria hasta que todo quede bien organizado.</p>
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

  if (challenge.type === "path-program" && mission?.id === "4-1-3") {
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
    return `
      <p class="mission-helper">Arma un bucle eligiendo cuantas veces se repite la accion y que bloque se repite.</p>
      <div class="mission-loop-layout">
        <div class="mission-loop-card">
          <div class="eyebrow">Repetir</div>
          <div class="mission-loop-options">
            ${(challenge.repeatOptions || [])
              .map(
                (count) => `
                  <button
                    class="mission-loop-choice ${localState.repeatCount === count ? "selected" : ""}"
                    data-repeat-count="${count}"
                    type="button"
                  >
                    ${count} veces
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="mission-loop-card">
          <div class="eyebrow">Accion</div>
          <div class="mission-loop-options">
            ${(challenge.actionOptions || [])
              .map(
                (action) => `
                  <button
                    class="mission-loop-choice ${localState.actionId === action.id ? "selected" : ""}"
                    data-action-id="${action.id}"
                    type="button"
                  >
                    ${action.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="mission-loop-preview">
        <strong>Programa armado</strong>
        <p>Repetir ${localState.repeatCount} veces: ${
          (challenge.actionOptions || []).find((item) => item.id === localState.actionId)?.label || "-"
        }</p>
      </div>
      <div class="mission-loop-track">
        ${Array.from({ length: localState.repeatCount || 0 }, (_, index) => `
          <div class="mission-loop-step" style="animation-delay:${index * 0.1}s;">
            ${index + 1}
          </div>
        `).join("")}
      </div>
    `;
  }

  return `<p>No hay un reto configurado para esta mision.</p>`;
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
  const isFullScreenMission = mission.id === "4-1-1" || mission.id === "4-1-2" || mission.id === "4-1-3" || mission.id === "4-1-4";
  const missionScreenClass =
    mission.id === "4-1-1"
      ? " mission-screen-path-guided mission-screen-first-steps"
      : mission.id === "4-1-2"
      ? " mission-screen-order-correct mission-screen-order-full"
      : mission.id === "4-1-3"
        ? " mission-screen-path-guided"
        : mission.id === "4-1-4"
        ? " mission-screen-path-guided mission-screen-error-hunt"
        : "";
  let localState = missionModel.state;
  let animationTimer = null;
  let completionTimer = null;

  function getValidateButtonLabel() {
    if (challenge.type === "reorder") return "Enviar al robot";
    if (challenge.type === "path-program") return mission.id === "4-1-3" ? "Completar" : "Confirmar ruta";
    if (challenge.type === "loop-builder") return "Activar bucle";
    return "Probar solucion";
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
            playSuccess();
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

  function draw() {
    appShell.innerHTML = `
      ${isFullScreenMission ? "" : `<header class="topbar">
        <div class="topbar-left">
          <div class="pill level-pill mission-header-pill">
            <span class="mission-header-badge" aria-hidden="true">★</span>
            <span>Nivel 4</span>
          </div>
          <div class="mission-header-chevron" aria-hidden="true">›</div>
          <div class="pill title-pill mission-header-pill mission-header-pill-title"><span class="mission-header-icon" aria-hidden="true">&#9873;</span><span>${mission.title}</span></div>
        </div>

        <div class="topbar-right">
          <button class="pill nav-pill mission-header-pill" id="goHomeBtn" type="button">
            <span class="mission-header-icon" aria-hidden="true">⌂</span>
            <span>Inicio</span>
          </button>
          <button class="pill nav-pill mission-header-pill" id="openDashboardBtn" type="button">
            <span class="mission-header-icon" aria-hidden="true">▦</span>
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
            <span class="mission-header-icon" aria-hidden="true">&#9881;</span>
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
                <div class="eyebrow">Micro-mision</div>
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
      const correct = missionModel.validate(localState);

      if (correct) {
        playSuccess();
        const reward = completeMission(mission);
        if (reward.awarded) playReward();

        goToResult({
          success: true,
          title: reward.awarded ? "Muy bien" : "Mision repasada",
          message: reward.awarded
            ? challenge.successMessage || "Superaste la mision."
            : "Ya habias cobrado esta recompensa. El repaso mantiene tu progreso sin duplicar premios.",
          coins: reward.coins,
          gems: reward.gems
        });
      } else {
        playError();
        goToResult({
          success: false,
          title: "Casi",
          message: "Todavia no es la mejor solucion. Revisa el reto y prueba otra vez.",
          coins: 0,
          gems: 0
        });
      }

      window.renderApp();
    });

    document.querySelectorAll("[data-assistant-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playUiClick();
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
        playSelect();
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
          playUiClick();
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
          playUiClick();
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

        playUiClick();
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
      playSelect();
      const shouldCompleteAfterRun = mission.id === "4-1-3" && missionModel.validate(localState);
      scheduleProgramPlayback();

      if (shouldCompleteAfterRun) {
        const completionDelay = Math.max(1100, localState.program.length * 420 + 720);
        completionTimer = setTimeout(() => {
          playSuccess();
          const reward = completeMission(mission);
          if (reward.awarded) playReward();

          goToResult({
            success: true,
            title: reward.awarded ? "Muy bien" : "Mision repasada",
            message: reward.awarded
              ? challenge.successMessage || "Superaste la mision."
              : "Ya habias cobrado esta recompensa. El repaso mantiene tu progreso sin duplicar premios.",
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
      playUiClick();
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
      playUiClick();
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

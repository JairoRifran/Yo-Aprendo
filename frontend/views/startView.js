import { appState } from "../state/appState.js";
import { goToDashboard, goToWorldMap } from "../utils/navigation.js";
import { loginWithAccess, registerInstitution } from "../utils/api.js";
import { saveSession } from "../utils/storage.js";
import {
  unlockAudio,
  playUiClick,
  playHoverTick,
  playSelect,
  setAmbientMode
} from "../utils/audio.js";

const ROLE_META = {
  student: {
    title: "Jugador",
    subtitle: "Entrar al mapa y seguir la aventura.",
    helper: "Explora islas, resuelve retos y avanza jugando.",
    namePlaceholder: "Nombre del explorador",
    codeLabel: "Isla o grupo",
    codePlaceholder: "Nivel 4",
    cta: "Jugar ahora",
    loginNote: "Vas a entrar directo al mundo de juego.",
    demoName: "Sofi",
    demoCode: "Nivel 4"
  },
  parent: {
    title: "Familia",
    subtitle: "Ver progreso, aprendizajes y acompanamiento.",
    helper: "Segui avances, fortalezas y sugerencias para casa.",
    namePlaceholder: "Familia de...",
    codeLabel: "Codigo de seguimiento",
    codePlaceholder: "FAM-404",
    cta: "Ver panel",
    loginNote: "Vas a entrar al panel de familias.",
    demoName: "Familia de Sofi",
    demoCode: "FAM-404"
  },
  teacher: {
    title: "Docente",
    subtitle: "Gestionar grupos, alumnos y acompanamiento.",
    helper: "Organiza aulas, registra ninos y sigue el avance de tu grupo.",
    namePlaceholder: "Nombre docente",
    codeLabel: "Codigo docente",
    codePlaceholder: "DOC-4A",
    cta: "Abrir panel docente",
    loginNote: "Vas a entrar al panel docente de tus grupos.",
    demoName: "Profe Lucia",
    demoCode: "DOC-4A"
  },
  institution: {
    title: "Institucion",
    subtitle: "Abrir seguimiento del grupo y lectura pedagogica.",
    helper: "Consulta actividad, conceptos trabajados y estado del grupo.",
    namePlaceholder: "Escuela o grupo",
    codeLabel: "Clave institucional",
    codePlaceholder: "INST-4A",
    cta: "Abrir panel",
    loginNote: "Vas a entrar al panel institucional.",
    demoName: "Escuela Demo Uruguay",
    demoCode: "INST-4A"
  }
};

function roleCard(role, selectedRole) {
  const meta = ROLE_META[role];
  const active = selectedRole === role;

  return `
    <button class="start-art-role-card${active ? " active" : ""}" type="button" data-role-card="${role}">
      <span class="start-art-role-icon ${role}" aria-hidden="true"></span>
      <strong>${meta.title}</strong>
      <span>${meta.subtitle}</span>
      <em class="start-art-role-demo">${meta.demoName} &middot; ${meta.demoCode}</em>
      <span class="start-art-role-arrow">&#8594;</span>
    </button>
  `;
}

function renderChooserPanel(selectedRole) {
  return `
    <section class="start-art-login-panel chooser">
      <div class="start-art-side-label">Elige tu acceso</div>
      <h2>Quien va a entrar</h2>
      <p>Selecciona un perfil para abrir su acceso correspondiente.</p>
      <div class="start-art-access-grid chooser-grid">
        ${roleCard("student", selectedRole)}
        ${roleCard("parent", selectedRole)}
        ${roleCard("teacher", selectedRole)}
        ${roleCard("institution", selectedRole)}
      </div>
    </section>
  `;
}

function renderLoginPanel(meta, currentName, currentCode) {
  return `
    <section class="start-art-login-panel">
      <div class="start-art-login-top">
        <div class="start-art-side-label">Ingresa a la aventura</div>
        <button class="start-art-back-link" id="backToRoleChooser" type="button">Volver a elegir perfil</button>
      </div>
      <h2 id="startAccessTitle">${meta.title}</h2>
      <p id="startAccessHelper">${meta.helper}</p>

      <div class="start-art-login-row">
        <button class="start-art-login-link" type="button">Iniciar sesion</button>
        <button class="start-art-login-link secondary" type="button">Continuar</button>
      </div>

      <div class="start-art-form">
        <label class="start-field-label" for="startNameInput">Nombre o referencia</label>
        <input
          id="startNameInput"
          class="start-input"
          type="text"
          maxlength="40"
          value="${currentName}"
          placeholder="${meta.namePlaceholder}"
        />

        <label class="start-field-label" for="startCodeInput" id="startCodeLabel">${meta.codeLabel}</label>
        <input
          id="startCodeInput"
          class="start-input"
          type="text"
          maxlength="40"
          value="${currentCode}"
          placeholder="${meta.codePlaceholder}"
        />

        <button id="startEnterBtn" class="btn btn-primary start-art-submit" type="button">${meta.cta}</button>
        ${
          meta.title === "Institucion"
            ? `<button id="openInstitutionRegisterBtn" class="btn btn-secondary start-art-submit" type="button">Registrar institucion</button>`
            : ""
        }
        <div class="start-role-note start-art-role-note" id="startRoleNote">${meta.loginNote}</div>
        <div class="start-art-form-error" id="startAccessError"></div>
      </div>
    </section>
  `;
}

function renderInstitutionRegisterPanel() {
  return `
    <section class="start-art-login-panel start-art-register-panel">
      <div class="start-art-login-top">
        <div class="start-art-side-label">Alta institucional</div>
        <button class="start-art-back-link" id="backToInstitutionLogin" type="button">Ya tengo acceso</button>
      </div>
      <h2>Crear institucion</h2>
      <p>La institucion crea el espacio, queda en plan piloto y luego habilita docentes, aulas, alumnos y familias.</p>

      <form class="start-art-form" id="institutionRegisterForm">
        <label class="start-field-label" for="institutionNameInput">Nombre del centro</label>
        <input id="institutionNameInput" class="start-input" name="institution_name" type="text" maxlength="160" placeholder="Ej: Escuela Nro. 12" required />

        <label class="start-field-label" for="institutionCodeInput">Codigo institucional</label>
        <input id="institutionCodeInput" class="start-input" name="institution_code" type="text" maxlength="40" placeholder="Ej: ESC-12-UY" required />

        <label class="start-field-label" for="adminNameInput">Responsable institucional</label>
        <input id="adminNameInput" class="start-input" name="admin_name" type="text" maxlength="120" placeholder="Nombre del administrador" required />

        <label class="start-field-label" for="adminEmailInput">Email institucional</label>
        <input id="adminEmailInput" class="start-input" name="admin_email" type="email" maxlength="160" placeholder="admin@centro.edu.uy" required />

        <label class="start-field-label" for="adminCodeInput">Clave de administrador</label>
        <input id="adminCodeInput" class="start-input" name="admin_access_code" type="text" maxlength="80" placeholder="Minimo 6 caracteres" required />

        <label class="start-field-label" for="departmentInput">Departamento</label>
        <input id="departmentInput" class="start-input" name="department" type="text" maxlength="80" placeholder="Montevideo, Canelones..." />

        <button id="institutionRegisterBtn" class="btn btn-primary start-art-submit" type="submit">Crear piloto institucional</button>
        <div class="start-role-note start-art-role-note">Piloto inicial: 90 dias, hasta 50 alumnos y 2 docentes.</div>
        <div class="start-art-form-error" id="institutionRegisterError"></div>
      </form>
    </section>
  `;
}

function renderInstitutionLandingPanel() {
  return `
    <section class="institution-modal" role="dialog" aria-modal="true" aria-labelledby="institutionLandingTitle">
      <div class="institution-modal-backdrop"></div>
      <div class="institution-modal-panel">
        <div class="institution-modal-top">
          <div>
            <div class="start-art-side-label">Para instituciones</div>
            <h2 id="institutionLandingTitle">Una nueva forma de aprender pensamiento computacional</h2>
          </div>
          <button class="institution-modal-close" id="backToInstitutionLogin" type="button" aria-label="Cerrar">×</button>
        </div>

        <div class="institution-modal-body">
          <section class="institution-modal-intro">
            <p>Yo Aprendo convierte el aprendizaje en una aventura guiada: los ninos juegan, las docentes acompanan y la institucion obtiene una lectura clara del avance real.</p>
            <div class="institution-modal-proof">
              <span>4 mundos</span>
              <span>28 micro misiones</span>
              <span>paneles por rol</span>
            </div>
          </section>

          <div class="institution-value-grid">
            <div class="institution-value-item">
              <strong>Mas valor pedagogico</strong>
              <span>Misiones cortas, visuales y progresivas para trabajar secuencias, bucles, decisiones y datos.</span>
            </div>
            <div class="institution-value-item">
              <strong>Gestion ordenada</strong>
              <span>La institucion crea docentes, aulas, alumnos y accesos familiares desde un mismo espacio.</span>
            </div>
            <div class="institution-value-item">
              <strong>Seguimiento accionable</strong>
              <span>Paneles para ver avance, actividad, alertas y necesidades de apoyo sin planillas dispersas.</span>
            </div>
          </div>

          <div class="institution-modal-grid">
            <div class="institution-flow">
              <strong>Como empieza una institucion</strong>
              <span>1. Crea el centro</span>
              <span>2. Activa el piloto</span>
              <span>3. Carga docentes y aulas</span>
              <span>4. Invita familias cuando corresponde</span>
            </div>

            <div class="institution-plan-list">
              <article class="institution-plan-card featured">
                <div class="start-art-side-label small">Piloto</div>
                <h3>90 dias gratis</h3>
                <p>Para validar el uso en una escuela o grupo inicial.</p>
                <strong>50 alumnos · 2 docentes</strong>
              </article>
              <article class="institution-plan-card">
                <div class="start-art-side-label small">Escuela</div>
                <h3>Plan mensual</h3>
                <p>Para centros que ya quieren operar con varios grupos.</p>
                <strong>Hasta 300 alumnos</strong>
              </article>
              <article class="institution-plan-card">
                <div class="start-art-side-label small">Red educativa</div>
                <h3>A medida</h3>
                <p>Para Ceibal, redes, convenios y despliegues con SSO.</p>
                <strong>Integracion institucional</strong>
              </article>
            </div>
          </div>
        </div>

        <div class="institution-landing-actions">
          <button id="startInstitutionRegisterBtn" class="btn btn-primary start-art-submit" type="button">Crear piloto institucional</button>
          <button id="backToInstitutionAccessBtn" class="btn btn-secondary start-art-submit" type="button">Entrar con acceso existente</button>
        </div>
      </div>
    </section>
  `;
}

export function renderStart() {
  const appShell = document.querySelector(".app-shell");
  if (!appShell) return;

  const selectedRole = appState.currentUserRole || "student";
  const meta = ROLE_META[selectedRole];
  const currentName = appState.currentUserName || "";
  const currentCode = appState.currentAccessCode || "";
  const accessMode = appState.startAccessMode || "chooser";
  setAmbientMode("world");

  appShell.innerHTML = `
    <main class="start-art-screen">
      <section class="start-art-board">
        <div class="start-art-scene" aria-hidden="true">
          <img
            class="start-art-backdrop"
            src="./img/start-adventure-bg.png"
            alt=""
          />
          <div class="start-art-backdrop-tint"></div>
          <div class="start-art-sky-glow glow-left"></div>
          <div class="start-art-sky-glow glow-right"></div>
          <div class="start-art-light-rays"></div>

          <div class="start-art-bird bird-a"></div>
          <div class="start-art-bird bird-b"></div>
          <div class="start-art-bird bird-c"></div>
          <div class="start-art-bird bird-d"></div>
          <div class="start-art-bird bird-e"></div>
          <div class="start-art-bird bird-f"></div>
          <div class="start-art-bird bird-g"></div>
          <div class="start-art-bird bird-h"></div>
          <div class="start-art-bird bird-i"></div>
          <div class="start-art-bird bird-j"></div>

          <div class="start-art-sea">
            <div class="start-art-wave wave-back"></div>
            <div class="start-art-wave wave-mid"></div>
            <div class="start-art-wave wave-front"></div>
            <div class="start-art-foam foam-a"></div>
            <div class="start-art-foam foam-b"></div>
            <div class="start-art-foam foam-c"></div>
            <div class="start-art-foam foam-d"></div>
            <div class="start-art-glimmer glimmer-a"></div>
            <div class="start-art-glimmer glimmer-b"></div>
            <div class="start-art-glimmer glimmer-c"></div>
            <div class="start-art-glimmer glimmer-d"></div>
          </div>

          <div class="start-art-boat-wrap">
            <span class="start-art-boat-shadow"></span>
            <span class="start-art-boat-wake wake-a"></span>
            <span class="start-art-boat-wake wake-b"></span>
            <span class="start-art-boat-wake wake-c"></span>
            <img
              class="start-art-boat"
              src="./img/barco.png"
              alt=""
            />
          </div>
        </div>

        <div class="start-art-overlay">
          <div class="start-art-chip chip-map">Mapa de aventura</div>

          <div class="start-art-hero">
            <h1>
              <span>Zarpa hacia</span>
              <span>una isla y</span>
              <span class="accent">aprende jugando</span>
            </h1>
            <p>Una aventura para aprender jugando.</p>

            <div class="start-art-pill-row">
              <span class="start-art-pill green">4 islas</span>
              <span class="start-art-pill blue">28 micro misiones</span>
              <span class="start-art-pill purple">pensamiento computacional</span>
            </div>

            <div class="start-art-note">Explora, resuelve retos y desbloquea nuevos caminos.</div>
          </div>

          ${
            accessMode === "chooser"
              ? renderChooserPanel(selectedRole)
              : accessMode === "institution-landing"
                ? renderInstitutionLandingPanel()
                : accessMode === "institution-register"
                ? renderInstitutionRegisterPanel()
                : renderLoginPanel(meta, currentName, currentCode)
          }
        </div>
      </section>
    </main>
  `;

  const roleNote = document.getElementById("startRoleNote");
  const nameInput = document.getElementById("startNameInput");
  const codeInput = document.getElementById("startCodeInput");
  const accessTitle = document.getElementById("startAccessTitle");
  const accessHelper = document.getElementById("startAccessHelper");
  const codeLabel = document.getElementById("startCodeLabel");
  const startEnterBtn = document.getElementById("startEnterBtn");
  const accessError = document.getElementById("startAccessError");

  function updateRole(role) {
    appState.currentUserRole = role;
    const nextMeta = ROLE_META[role];

    document.querySelectorAll("[data-role-card]").forEach((button) => {
      button.classList.toggle("active", button.dataset.roleCard === role);
    });

    if (roleNote) roleNote.textContent = nextMeta.loginNote;
    if (accessTitle) accessTitle.textContent = nextMeta.title;
    if (accessHelper) accessHelper.textContent = nextMeta.helper;
    if (nameInput) nameInput.placeholder = nextMeta.namePlaceholder;
    if (codeLabel) codeLabel.textContent = nextMeta.codeLabel;
    if (codeInput) codeInput.placeholder = nextMeta.codePlaceholder;
    if (startEnterBtn) startEnterBtn.textContent = nextMeta.cta;
    if (accessError) accessError.textContent = "";
  }

  document.querySelectorAll("[data-role-card]").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      unlockAudio();
      playHoverTick();
    });

    button.addEventListener("click", () => {
      unlockAudio();
      playSelect();
      appState.currentUserRole = button.dataset.roleCard;
      appState.currentUserName = ROLE_META[button.dataset.roleCard].demoName;
      appState.currentAccessCode = ROLE_META[button.dataset.roleCard].demoCode;
      appState.startAccessMode = "login";
      window.renderApp();
    });
  });

  document.getElementById("backToRoleChooser")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    appState.startAccessMode = "chooser";
    window.renderApp();
  });

  document.getElementById("openInstitutionRegisterBtn")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    appState.startAccessMode = "institution-landing";
    window.renderApp();
  });

  document.getElementById("backToInstitutionLogin")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    appState.currentUserRole = "institution";
    appState.startAccessMode = "login";
    window.renderApp();
  });

  document.getElementById("backToInstitutionAccessBtn")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    appState.currentUserRole = "institution";
    appState.startAccessMode = "login";
    window.renderApp();
  });

  document.getElementById("startInstitutionRegisterBtn")?.addEventListener("click", () => {
    unlockAudio();
    playSelect();
    appState.startAccessMode = "institution-register";
    window.renderApp();
  });

  document.getElementById("institutionRegisterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    unlockAudio();
    playSelect();

    const form = new FormData(event.currentTarget);
    const errorNode = document.getElementById("institutionRegisterError");
    const submitButton = document.getElementById("institutionRegisterBtn");
    if (errorNode) errorNode.textContent = "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creando...";
    }

    try {
      const result = await registerInstitution({
        institution_name: form.get("institution_name"),
        institution_code: form.get("institution_code"),
        admin_name: form.get("admin_name"),
        admin_email: form.get("admin_email"),
        admin_access_code: form.get("admin_access_code"),
        department: form.get("department"),
        billing_email: form.get("admin_email")
      });
      const session = result.session;
      appState.currentUserRole = session.role;
      appState.selectedDashboardRole = session.role;
      appState.currentUserName = session.display_name;
      appState.currentAccessCode = form.get("admin_access_code");
      appState.session = session;
      appState.dashboardData = null;
      appState.dashboardError = "";
      appState.startAccessMode = "login";
      saveSession({
        currentUserRole: appState.currentUserRole,
        currentUserName: appState.currentUserName,
        currentAccessCode: appState.currentAccessCode,
        selectedDashboardRole: appState.selectedDashboardRole,
        startAccessMode: appState.startAccessMode,
        session: appState.session
      });
      goToDashboard("institution");
      window.renderApp();
    } catch (error) {
      if (errorNode) errorNode.textContent = error.message || "No pudimos crear la institucion.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Crear piloto institucional";
      }
    }
  });

  document.getElementById("startEnterBtn")?.addEventListener("click", async () => {
    unlockAudio();
    playUiClick();

    const role = appState.currentUserRole || "student";
    const name = nameInput?.value?.trim() || "";
    const code = codeInput?.value?.trim() || "";

    if (accessError) accessError.textContent = "";
    if (startEnterBtn) {
      startEnterBtn.disabled = true;
      startEnterBtn.textContent = "Entrando...";
    }

    try {
      const session = await loginWithAccess({ role, name, code });
      appState.currentUserRole = session.role;
      appState.selectedDashboardRole = session.role;
      appState.currentUserName = session.display_name;
      appState.currentAccessCode = code;
      appState.session = session;
      appState.dashboardData = null;
      appState.dashboardError = "";
      saveSession({
        currentUserRole: appState.currentUserRole,
        currentUserName: appState.currentUserName,
        currentAccessCode: appState.currentAccessCode,
        selectedDashboardRole: appState.selectedDashboardRole,
        startAccessMode: appState.startAccessMode,
        session: appState.session
      });

      if (session.role === "student") {
        goToWorldMap();
      } else {
        goToDashboard(session.role);
      }

      window.renderApp();
    } catch (error) {
      if (accessError) {
        accessError.textContent = error.message || "No pudimos validar ese acceso.";
      }
    } finally {
      if (startEnterBtn) {
        startEnterBtn.disabled = false;
        startEnterBtn.textContent = ROLE_META[role].cta;
      }
    }
  });
}

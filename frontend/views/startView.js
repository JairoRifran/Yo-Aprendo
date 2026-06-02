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
import { uiIcon } from "../utils/icons.js";

const ROLE_META = {
  student: {
    title: "Soy estudiante",
    subtitle: "Jugar misiones y avanzar en el mapa.",
    helper: "Entra a tus islas, resuelve retos y gana progreso paso a paso.",
    namePlaceholder: "Nombre del explorador",
    codeLabel: "Isla o grupo",
    codePlaceholder: "Nivel 4",
    cta: "Entrar a jugar",
    loginNote: "Vas a entrar directo al mundo de juego.",
    demoName: "Sofi",
    demoCode: "Nivel 4"
  },
  parent: {
    title: "Soy familia",
    subtitle: "Ver avances y acompanar desde casa.",
    helper: "Consulta progreso, fortalezas y sugerencias simples para acompanar.",
    namePlaceholder: "Familia de...",
    codeLabel: "Codigo familiar",
    codePlaceholder: "FAM-404",
    cta: "Ver seguimiento",
    loginNote: "Vas a entrar al panel de familias.",
    demoName: "Familia de Sofi",
    demoCode: "FAM-404"
  },
  teacher: {
    title: "Soy docente",
    subtitle: "Gestionar aulas y acompanamiento.",
    helper: "Revisa grupos asignados, registra alumnos y detecta quienes necesitan apoyo.",
    namePlaceholder: "Nombre docente",
    codeLabel: "Codigo docente",
    codePlaceholder: "DOC-4A",
    cta: "Abrir panel docente",
    loginNote: "Vas a entrar al panel docente de tus grupos.",
    demoName: "Profe Lucia",
    demoCode: "DOC-4A"
  },
  institution: {
    title: "Soy institucion",
    subtitle: "Administrar el centro y sus planes.",
    helper: "Consulta actividad, crea grupos, habilita familias y revisa el plan institucional.",
    namePlaceholder: "Escuela o grupo",
    codeLabel: "Clave institucional",
    codePlaceholder: "INST-4A",
    cta: "Abrir panel institucional",
    loginNote: "Vas a entrar al panel institucional.",
    demoName: "Escuela Demo Uruguay",
    demoCode: "INST-4A"
  },
  owner: {
    title: "Soy producto",
    subtitle: "Medir adopcion, uso y evidencia comercial.",
    helper: "Panel de metricas para venta, seguimiento y expansion institucional.",
    namePlaceholder: "rifranjairo@gmail.com",
    codeLabel: "Contrasena",
    codePlaceholder: "Tu contrasena",
    codeType: "password",
    cta: "Abrir metricas",
    loginNote: "Vas a entrar al panel del producto.",
    demoName: "rifranjairo@gmail.com",
    demoCode: "clave privada"
  }
};

function roleCard(role, selectedRole) {
  const meta = ROLE_META[role];
  const active = selectedRole === role;
  const iconByRole = {
    student: "user",
    parent: "heart",
    teacher: "monitor",
    institution: "school",
    owner: "bar-chart"
  };

  return `
    <button class="start-art-role-card${active ? " active" : ""}" type="button" data-role-card="${role}">
      <span class="start-art-role-icon ${role} ui-icon-wrap" aria-hidden="true">${uiIcon(iconByRole[role] || "sparkles")}</span>
      <strong>${meta.title}</strong>
      <span>${meta.subtitle}</span>
      <em class="start-art-role-demo">${meta.demoName} &middot; ${meta.demoCode}</em>
      <span class="start-art-role-arrow" aria-hidden="true">${uiIcon("arrow-right")}</span>
    </button>
  `;
}

function renderChooserPanel(selectedRole) {
  return `
    <section class="start-art-login-panel chooser">
      <div class="start-art-side-label">Acceso a Yo Aprendo</div>
      <h2>Elegí cómo querés entrar</h2>
      <p>Cada perfil abre una experiencia distinta: juego, seguimiento, gestión o métricas.</p>
      <div class="start-art-access-grid chooser-grid">
        ${roleCard("student", selectedRole)}
        ${roleCard("parent", selectedRole)}
        ${roleCard("teacher", selectedRole)}
        ${roleCard("institution", selectedRole)}
        ${roleCard("owner", selectedRole)}
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
          type="${meta.codeType || "text"}"
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
              <button class="institution-plan-card featured" type="button" data-institution-plan="trial">
                <div class="start-art-side-label small">Piloto</div>
                <h3>90 dias gratis</h3>
                <p>Para validar el uso en una escuela o grupo inicial.</p>
                <strong>50 alumnos · 2 docentes</strong>
                <em>Crear piloto</em>
              </button>
              <button class="institution-plan-card" type="button" data-institution-plan="school">
                <div class="start-art-side-label small">Escuela</div>
                <h3>Plan mensual</h3>
                <p>Para centros que ya quieren operar con varios grupos.</p>
                <strong>Hasta 300 alumnos</strong>
                <em>Solicitar incorporacion</em>
              </button>
              <button class="institution-plan-card" type="button" data-institution-plan="enterprise">
                <div class="start-art-side-label small">Red educativa</div>
                <h3>A medida</h3>
                <p>Para Ceibal, redes, convenios y despliegues con SSO.</p>
                <strong>Integracion institucional</strong>
                <em>Hablar con el equipo</em>
              </button>
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

function renderInstitutionPlanRequestPanel(planKey = "school") {
  const planCopy = {
    school: {
      eyebrow: "Plan Escuela",
      title: "Incorporar Yo Aprendo en tu centro",
      text: "Dejanos los datos de la institucion y preparamos una propuesta para operar con varios grupos, docentes y seguimiento familiar.",
      cta: "Solicitar plan escuela"
    },
    enterprise: {
      eyebrow: "Red educativa",
      title: "Despliegue para redes, convenios o Ceibal",
      text: "Armamos una conversacion institucional para evaluar volumen, integraciones, SSO, auditoria y condiciones de despliegue.",
      cta: "Solicitar reunion"
    }
  };
  const copy = planCopy[planKey] || planCopy.school;

  return `
    <section class="start-art-login-panel start-art-register-panel">
      <div class="start-art-login-top">
        <div class="start-art-side-label">${copy.eyebrow}</div>
        <button class="start-art-back-link" id="backToInstitutionLanding" type="button">Ver planes</button>
      </div>
      <h2>${copy.title}</h2>
      <p>${copy.text}</p>

      <form class="start-art-form" id="institutionPlanRequestForm">
        <label class="start-field-label" for="requestInstitutionNameInput">Nombre del centro o red</label>
        <input id="requestInstitutionNameInput" class="start-input" name="institution_name" type="text" maxlength="160" placeholder="Ej: Colegio, red educativa o programa" required />

        <label class="start-field-label" for="requestContactNameInput">Persona de contacto</label>
        <input id="requestContactNameInput" class="start-input" name="contact_name" type="text" maxlength="120" placeholder="Nombre y apellido" required />

        <label class="start-field-label" for="requestEmailInput">Email institucional</label>
        <input id="requestEmailInput" class="start-input" name="email" type="email" maxlength="160" placeholder="contacto@institucion.edu.uy" required />

        <label class="start-field-label" for="requestSizeInput">Cantidad estimada de alumnos</label>
        <input id="requestSizeInput" class="start-input" name="student_count" type="text" maxlength="80" placeholder="Ej: 450 alumnos" />

        <button id="institutionPlanRequestBtn" class="btn btn-primary start-art-submit" type="submit">${copy.cta}</button>
        <div class="start-role-note start-art-role-note">Te dejamos la solicitud preparada para contacto comercial. El piloto sigue disponible si queres probar hoy.</div>
        <div class="start-art-form-error" id="institutionPlanRequestResult"></div>
      </form>
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
          <div class="start-art-hero">
            <h1>
              <span>Yo Aprendo</span>
              <span class="accent">Nivel 4</span>
            </h1>
            <p>Pensamiento computacional para 4.º de primaria, con misiones cortas, seguimiento y evidencia para instituciones.</p>

            <div class="start-art-pill-row">
              <span class="start-art-pill green">4 islas</span>
              <span class="start-art-pill blue">28 micro misiones</span>
              <span class="start-art-pill purple">pensamiento computacional</span>
            </div>

            <div class="start-art-note">Elegí tu perfil para entrar al juego, al seguimiento o a la gestión institucional.</div>
          </div>

          ${
            accessMode === "chooser"
              ? renderChooserPanel(selectedRole)
              : accessMode === "institution-landing"
                ? renderInstitutionLandingPanel()
                : accessMode === "institution-plan-request"
                  ? renderInstitutionPlanRequestPanel(appState.selectedInstitutionPlan)
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
      appState.currentAccessCode = button.dataset.roleCard === "owner" ? "" : ROLE_META[button.dataset.roleCard].demoCode;
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

  document.querySelectorAll("[data-institution-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      unlockAudio();
      playSelect();
      const plan = button.dataset.institutionPlan;
      if (plan === "trial") {
        appState.startAccessMode = "institution-register";
      } else {
        appState.selectedInstitutionPlan = plan;
        appState.startAccessMode = "institution-plan-request";
      }
      window.renderApp();
    });
  });

  document.getElementById("backToInstitutionLanding")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    appState.startAccessMode = "institution-landing";
    window.renderApp();
  });

  document.getElementById("institutionPlanRequestForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockAudio();
    playSelect();
    const resultNode = document.getElementById("institutionPlanRequestResult");
    if (resultNode) {
      resultNode.textContent = "Solicitud registrada. El siguiente paso es coordinar contacto institucional.";
    }
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
      appState.currentAccessCode = session.role === "owner" ? "" : code;
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

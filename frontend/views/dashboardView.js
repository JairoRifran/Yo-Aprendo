import { appState } from "../state/appState.js";
import { grade4Data } from "../data/grade4.js";
import { goToStart, goToWorldMap } from "../utils/navigation.js";
import { clearSession } from "../utils/storage.js";
import { getMissionState, getWorldProgress, isMissionCompleted } from "../utils/progress.js";
import {
  createClassroom,
  createStudent,
  fetchDashboardByRole,
  linkGuardian
} from "../utils/api.js";
import {
  unlockAudio,
  playUiClick,
  playHoverTick,
  playSelect,
  setAmbientMode
} from "../utils/audio.js";
import { uiIcon } from "../utils/icons.js";

const DEMO_SESSION_BY_ROLE = {
  student: {
    role: "student",
    entity_id: "stu-sofi",
    display_name: "Sofi"
  },
  parent: {
    role: "parent",
    entity_id: "guardian-sofi",
    display_name: "Familia de Sofi"
  },
  teacher: {
    role: "teacher",
    entity_id: "teacher-lucia",
    display_name: "Profe Lucia"
  },
  institution: {
    role: "institution",
    entity_id: "inst-uy",
    display_name: "Escuela Demo Uruguay"
  },
  owner: {
    role: "owner",
    entity_id: "owner",
    display_name: "Jairo Rifran"
  }
};

function getLiveStudentDashboardData(data) {
  const worlds = grade4Data.worlds;
  const missions = worlds.flatMap((world) => world.missions);
  const completedMissions = missions.filter((mission) => isMissionCompleted(mission.id)).length;
  const totalMissions = missions.length;
  const progressPercent = totalMissions
    ? Math.round((completedMissions / totalMissions) * 100)
    : 0;
  const concepts = worlds.map((world) => {
    const progress = getWorldProgress(world);
    return {
      title: world.title.replace("Isla de las ", "").replace("Isla de los ", ""),
      completed: progress.completed,
      total: progress.total,
      percent: progress.percent
    };
  });
  const nextWorld = worlds.find((world) =>
    world.missions.some((mission, index) => getMissionState(world, index, worlds) === "available")
  );
  const nextMission = nextWorld?.missions.find(
    (mission, index) => getMissionState(nextWorld, index, worlds) === "available"
  );
  const earned = missions.reduce(
    (total, mission) => {
      if (!isMissionCompleted(mission.id)) return total;
      return {
        coins: total.coins + (mission.coins || 0),
        gems: total.gems + (mission.gems || 0)
      };
    },
    { coins: 0, gems: 0 }
  );

  return {
    ...data,
    student: {
      ...data.student,
      completed_missions: completedMissions,
      total_missions: totalMissions,
      progress_percent: progressPercent
    },
    concepts,
    next_mission: nextMission
      ? {
          world: nextWorld.title,
          title: nextMission.title,
          number: nextMission.number || nextMission.id
        }
      : data.next_mission,
    wallet: {
      coins: appState.coins,
      gems: appState.gems,
      earnedCoins: earned.coins,
      earnedGems: earned.gems
    }
  };
}

async function ensureDashboardData() {
  const role = appState.selectedDashboardRole || appState.currentUserRole || "student";
  const session = appState.session && appState.session.role === role
    ? appState.session
    : DEMO_SESSION_BY_ROLE[role];

  if (
    appState.dashboardData &&
    appState.dashboardData.role === role &&
    appState.dashboardData.entityId === session.entity_id
  ) {
    return appState.dashboardData.payload;
  }

  appState.dashboardLoading = true;
  appState.dashboardError = "";

  try {
    const payload = await fetchDashboardByRole(role, session.entity_id);
    appState.dashboardData = {
      role,
      entityId: session.entity_id,
      payload
    };
    return payload;
  } catch (error) {
    appState.dashboardError = error.message || "No pudimos cargar el panel.";
    throw error;
  } finally {
    appState.dashboardLoading = false;
  }
}

function renderLoadingShell(backLabel, showCurrency = true) {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="pill level-pill"><span class="mission-header-badge ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span><span>Nivel 4</span></div>
        <div class="pill title-pill"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span><span>Paneles de seguimiento</span></div>
      </div>

      <div class="topbar-right">
        <button class="pill nav-pill" id="backToMapBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span><span>${backLabel}</span></button>
        <button class="pill nav-pill" id="logoutBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("log-out")}</span><span>Cerrar sesion</span></button>
        ${
          showCurrency
            ? `
              <div class="pill currency-pill">
                <span class="currency-icon gold"></span>
                <span>${appState.coins}</span>
              </div>
              <div class="pill currency-pill">
                <span class="currency-icon gems"></span>
                <span>${appState.gems}</span>
              </div>
            `
            : ""
        }
      </div>
    </header>

    <main class="dashboard-screen">
      <section class="dashboard-panel">
        <div class="dashboard-loading-card">
          <strong>Cargando panel...</strong>
          <p>Estamos preparando la informacion del rol seleccionado.</p>
        </div>
      </section>
    </main>
  `;
}

function renderDashboardIcon(name) {
  return uiIcon(name, "dashboard-svg-icon ui-icon");

  const icons = {
    student: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="16" r="7" fill="#ffc94d"></circle>
        <path d="M13 35c2.8-6.5 6.8-9.8 11-9.8S32.3 28.5 35 35" fill="#2f8cff"></path>
        <path d="M16 14l8-4 8 4-8 4z" fill="#143f7c"></path>
      </svg>
    `,
    parent: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="16" cy="18" r="6" fill="#69c9a3"></circle>
        <circle cx="31" cy="20" r="5.5" fill="#ffc94d"></circle>
        <circle cx="24" cy="14" r="5" fill="#7cc9ff"></circle>
        <path d="M8 35c2.4-5.5 5.7-8 10-8 3.8 0 6.6 1.7 8.5 5.1" fill="#7cc9ff"></path>
        <path d="M20.5 35c1.8-4.6 4.7-6.8 8.6-6.8 4 0 7 2.2 8.9 6.8" fill="#b9e67b"></path>
      </svg>
    `,
    teacher: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <rect x="10" y="10" width="28" height="18" rx="4" fill="#2f8cff"></rect>
        <rect x="14" y="14" width="20" height="10" rx="2" fill="#eaf7ff"></rect>
        <rect x="19" y="31" width="10" height="3.8" rx="1.9" fill="#63cb95"></rect>
        <rect x="16" y="35" width="16" height="3.5" rx="1.75" fill="#143f7c"></rect>
      </svg>
    `,
    institution: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <path d="M10 21l14-9 14 9v2H10z" fill="#ffb564"></path>
        <rect x="12" y="23" width="24" height="13" rx="2.5" fill="#8bd3ff"></rect>
        <rect x="21" y="26" width="6" height="10" rx="2" fill="#ffffff"></rect>
        <rect x="9" y="36" width="30" height="3.5" rx="1.75" fill="#143f7c"></rect>
      </svg>
    `,
    groups: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="17" cy="17" r="5" fill="#69c9a3"></circle>
        <circle cx="31" cy="17" r="5" fill="#ffc94d"></circle>
        <path d="M10 33c2.2-4.9 5.8-7.2 10.2-7.2 4.3 0 7.6 2.1 9.8 6.3" fill="#7cc9ff"></path>
        <path d="M23 33c1.8-4.3 4.7-6.3 8.8-6.3 2.8 0 5.2 1 7.2 3" fill="none" stroke="#2f8cff" stroke-width="3" stroke-linecap="round"></path>
      </svg>
    `,
    students: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="18" cy="17" r="5.5" fill="#7cc9ff"></circle>
        <circle cx="30" cy="18" r="4.5" fill="#69c9a3"></circle>
        <path d="M10.5 34c2.6-5.5 6.3-8 11-8 4.8 0 8.6 2.5 11.1 8" fill="#2f8cff"></path>
      </svg>
    `,
    today: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="24" r="10" fill="#ffd45a"></circle>
        <path d="M24 8v6M24 34v6M8 24h6M34 24h6M13.3 13.3l4.2 4.2M30.5 30.5l4.2 4.2M34.7 13.3l-4.2 4.2M17.5 30.5l-4.2 4.2" stroke="#ffb22f" stroke-width="3" stroke-linecap="round"></path>
      </svg>
    `,
    progress: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <path d="M11 32h5l5-8 6 4 10-12" fill="none" stroke="#2f8cff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M33 16h4v4" fill="none" stroke="#63cb95" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `,
    energy: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <path d="M27 9L15 26h8l-2 13 12-17h-8z" fill="#63cb95"></path>
      </svg>
    `,
    spark: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <path d="M24 8l3.7 8.3 9.1.8-6.9 5.9 2.1 8.9L24 27.2l-8 4.7 2.1-8.9-6.9-5.9 9.1-.8z" fill="#ffc94d"></path>
      </svg>
    `,
    mission: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="24" r="12" fill="none" stroke="#2f8cff" stroke-width="4"></circle>
        <path d="M24 14l4.8 9.5L24 22l-4.8 1.5z" fill="#63cb95"></path>
      </svg>
    `,
    coins: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="24" r="14" fill="#ffc94d"></circle>
        <circle cx="24" cy="24" r="9" fill="none" stroke="#fff2b8" stroke-width="3"></circle>
        <path d="M24 15v18M19 20.5c1.4-2 8.4-2 9.8 0M18.2 27.5c1.6 2.2 8.9 2.2 10.6 0" fill="none" stroke="#9a641b" stroke-width="3" stroke-linecap="round"></path>
      </svg>
    `,
    gems: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <path d="M14 18l7-7h13l7 7-17 21z" fill="#5fd7ff"></path>
        <path d="M14 18h27M21 11l3 28M34 11l-10 28" fill="none" stroke="#e9fbff" stroke-width="2.4" stroke-linecap="round"></path>
        <path d="M21 11l-7 7 10 21 17-21-7-7z" fill="none" stroke="#1d87d8" stroke-width="3" stroke-linejoin="round"></path>
      </svg>
    `,
    family: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="17" cy="18" r="5.5" fill="#7cc9ff"></circle>
        <circle cx="31" cy="18" r="5.5" fill="#69c9a3"></circle>
        <path d="M9.5 34c2.7-5.6 6.8-8.2 12-8.2 5.3 0 9.5 2.6 12.3 8.2" fill="#2f8cff"></path>
      </svg>
    `,
    support: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="24" r="13" fill="none" stroke="#63cb95" stroke-width="4"></circle>
        <path d="M18.5 24.5l4.2 4.2 7.3-9" fill="none" stroke="#2f8cff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `,
    roster: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <rect x="12" y="10" width="24" height="28" rx="5" fill="#7cc9ff"></rect>
        <path d="M18 19h12M18 25h12M18 31h8" stroke="#143f7c" stroke-width="3" stroke-linecap="round"></path>
        <circle cx="17" cy="14.5" r="2" fill="#ffc94d"></circle>
      </svg>
    `,
    play: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="24" r="14" fill="#e6f7ff" stroke="#2f8cff" stroke-width="3"></circle>
        <path d="M21 17l11 7-11 7z" fill="#63cb95"></path>
      </svg>
    `,
    compass: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="24" r="14" fill="#eaf7ff" stroke="#2f8cff" stroke-width="3"></circle>
        <path d="M28.5 19.5L17 24l4.5 11 11.5-4.5z" fill="#63cb95"></path>
        <circle cx="24" cy="24" r="2.5" fill="#143f7c"></circle>
      </svg>
    `,
    badge: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="19" r="9" fill="#ffc94d"></circle>
        <path d="M18 28l6 10 6-10" fill="#2f8cff"></path>
      </svg>
    `,
    lightbulb: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <path d="M24 10c-6 0-10 4.4-10 9.8 0 3.7 2 6.1 4.5 8.4 1.4 1.3 2.1 2.5 2.3 4h6.4c.2-1.5.9-2.7 2.3-4 2.5-2.3 4.5-4.7 4.5-8.4C34 14.4 30 10 24 10z" fill="#ffc94d"></path>
        <rect x="20" y="33" width="8" height="4.5" rx="2.2" fill="#143f7c"></rect>
      </svg>
    `,
    timer: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <circle cx="24" cy="26" r="12" fill="#eaf7ff" stroke="#2f8cff" stroke-width="3"></circle>
        <path d="M24 26V19M24 26l5 4" stroke="#63cb95" stroke-width="3.5" stroke-linecap="round"></path>
        <rect x="20" y="10" width="8" height="4" rx="2" fill="#143f7c"></rect>
      </svg>
    `,
    chart: `
      <svg viewBox="0 0 48 48" class="dashboard-svg-icon" aria-hidden="true">
        <rect x="12" y="24" width="5.5" height="12" rx="2.75" fill="#7cc9ff"></rect>
        <rect x="21.2" y="18" width="5.5" height="18" rx="2.75" fill="#63cb95"></rect>
        <rect x="30.4" y="13" width="5.5" height="23" rx="2.75" fill="#ffc94d"></rect>
      </svg>
    `
  };

  return icons[name] || icons.spark;
}

function renderStatCard(iconClass, label, value, text, targetId = "") {
  return `
    <article class="dashboard-card stat dashboard-stat-card${targetId ? " dashboard-jump-card" : ""}" ${targetId ? `data-scroll-target="${targetId}"` : ""}>
      <div class="dashboard-stat-head">
        <span class="dashboard-stat-icon ${iconClass}" aria-hidden="true">${renderDashboardIcon(iconClass)}</span>
        <span>${label}</span>
      </div>
      <strong>${value}</strong>
      <p>${text}</p>
    </article>
  `;
}

function renderGuideCard(roleClass, title, text, bullets = []) {
  return `
    <article class="dashboard-card dashboard-guide-card ${roleClass}">
      <div class="dashboard-guide-head">
        <span class="dashboard-guide-icon ${roleClass}" aria-hidden="true">${renderDashboardIcon(roleClass)}</span>
        <div>
          <div class="eyebrow">Guia rapida</div>
          <h2>${title}</h2>
        </div>
      </div>
      <p>${text}</p>
      ${
        bullets.length
          ? `
            <ul class="dashboard-list compact">
              ${bullets.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          `
          : ""
      }
    </article>
  `;
}

function renderActionItem(iconClass, title, text, targetId = "") {
  return `
    <div class="dashboard-action-item${targetId ? " dashboard-jump-card" : ""}" ${targetId ? `data-scroll-target="${targetId}"` : ""}>
      <span class="dashboard-action-icon ${iconClass}" aria-hidden="true">${renderDashboardIcon(iconClass)}</span>
      <div>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function renderOwnerMetricCard(iconClass, label, value, text, metric) {
  return `
    <article class="dashboard-card stat dashboard-stat-card dashboard-jump-card" data-owner-module="${metric}">
      <div class="dashboard-stat-head">
        <span class="dashboard-stat-icon ${iconClass}" aria-hidden="true">${renderDashboardIcon(iconClass)}</span>
        <span>${label}</span>
      </div>
      <strong>${value}</strong>
      <p>${text}</p>
    </article>
  `;
}

function ownerModules() {
  return [
    { id: "overview", icon: "progress", label: "Resumen ejecutivo", hint: "Adopcion, planes y evidencia" },
    { id: "institutions", icon: "groups", label: "Instituciones", hint: "Centros, plan y traccion" },
    { id: "students", icon: "students", label: "Alumnos", hint: "Usuarios cargados por aula" },
    { id: "active", icon: "today", label: "Actividad", hint: "Uso real y recurrencia" },
    { id: "progress", icon: "progress", label: "Aprendizajes", hint: "Avance por concepto" },
    { id: "teachers", icon: "teacher", label: "Docentes", hint: "Equipos vinculados" },
    { id: "families", icon: "family", label: "Familias", hint: "Acompanamiento familiar" },
    { id: "minutes", icon: "timer", label: "Uso semanal", hint: "Minutos y adopcion" },
    { id: "alerts", icon: "support", label: "Alertas", hint: "Riesgos de seguimiento" }
  ];
}

function ownerMetricConfig(metric) {
  const configs = {
    institutions: {
      title: "Instituciones",
      subtitle: "Centros registrados, plan, estado y traccion.",
      columns: ["Institucion", "Plan", "Alumnos", "Docentes", "Familias", "Avance"],
      rows: (data) => (data.details?.institutions || data.institutions || []).map((item) => [
        item.name,
        item.plan,
        item.students,
        item.teachers,
        item.guardians,
        `${item.avg_completion}%`
      ])
    },
    students: {
      title: "Alumnos",
      subtitle: "Datos de estudiantes cargados por institucion y aula.",
      columns: ["Alumno", "Institucion", "Aula", "Codigo", "Estado", "Avance"],
      rows: (data) => (data.details?.students || []).map((item) => [
        item.name,
        item.institution,
        item.classroom,
        item.code,
        item.attendance,
        `${item.progress}%`
      ])
    },
    active: {
      title: "Alumnos activos",
      subtitle: "Usuarios con estado activo y senales de uso.",
      columns: ["Alumno", "Institucion", "Aula", "Minutos", "Avance"],
      rows: (data) => (data.details?.active || []).map((item) => [
        item.name,
        item.institution,
        item.classroom,
        item.weekly_minutes,
        `${item.progress}%`
      ])
    },
    progress: {
      title: "Avance promedio",
      subtitle: "Progreso agregado por concepto para evidencia pedagogica.",
      columns: ["Concepto", "Avance"],
      rows: (data) => (data.details?.progress || data.concept_overview || []).map((item) => [
        item.title,
        `${item.percent}%`
      ])
    },
    teachers: {
      title: "Docentes",
      subtitle: "Docentes vinculados y cantidad de aulas asignadas.",
      columns: ["Docente", "Email", "Institucion", "Aulas"],
      rows: (data) => (data.details?.teachers || []).map((item) => [
        item.name,
        item.email,
        item.institution,
        item.classrooms
      ])
    },
    families: {
      title: "Familias vinculadas",
      subtitle: "Observadores familiares vinculados a estudiantes.",
      columns: ["Familia", "Contacto", "Alumnos", "Ninos vinculados"],
      rows: (data) => (data.details?.families || []).map((item) => [
        item.name,
        item.contact || "Sin contacto",
        item.students,
        item.student_names || "-"
      ])
    },
    minutes: {
      title: "Minutos semanales",
      subtitle: "Ranking de uso para detectar adopcion y recurrencia.",
      columns: ["Alumno", "Institucion", "Minutos", "Avance"],
      rows: (data) => (data.details?.minutes || []).map((item) => [
        item.name,
        item.institution,
        item.weekly_minutes,
        `${item.progress}%`
      ])
    },
    alerts: {
      title: "Alertas",
      subtitle: "Alumnos que requieren seguimiento pedagogico o de adopcion.",
      columns: ["Alumno", "Institucion", "Aula", "Estado", "Necesita apoyo", "Mensaje"],
      rows: (data) => (data.details?.alerts || []).map((item) => [
        item.name,
        item.institution,
        item.classroom,
        item.attendance,
        item.needs_support,
        item.message
      ])
    }
  };
  return configs[metric] || configs.institutions;
}

function renderOwnerSidebar(activeModule) {
  return `
    <aside class="owner-sidebar" aria-label="Modulos del producto">
      <div class="owner-sidebar-brand">
        <span class="owner-brand-mark" aria-hidden="true">Y</span>
        <div>
          <strong>Yo Aprendo</strong>
          <span>Producto</span>
        </div>
      </div>
      <nav class="owner-nav">
        ${ownerModules()
          .map(
            (item) => `
              <button class="owner-nav-item${activeModule === item.id ? " active" : ""}" type="button" data-owner-module="${item.id}">
                <span class="owner-nav-icon ${item.icon}" aria-hidden="true">${renderDashboardIcon(item.icon)}</span>
                <span>
                  <strong>${item.label}</strong>
                  <small>${item.hint}</small>
                </span>
              </button>
            `
          )
          .join("")}
      </nav>
    </aside>
  `;
}

function renderOwnerTable(data, metric) {
  const config = ownerMetricConfig(metric);
  const rows = config.rows(data);
  return `
      <article class="dashboard-card owner-module-card">
        <div class="owner-module-head">
          <div>
            <div class="eyebrow">Modulo</div>
            <h2>${config.title}</h2>
            <p>${config.subtitle}</p>
          </div>
          <span class="owner-count-pill">${rows.length} registros</span>
        </div>
        <div class="dashboard-table owner-metric-table" style="--owner-cols:${config.columns.length};">
          <div class="dashboard-table-row dashboard-table-row-wide owner-metric-head">
            ${config.columns.map((column) => `<strong>${column}</strong>`).join("")}
          </div>
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `
                      <div class="dashboard-table-row dashboard-table-row-wide">
                        ${row.map((cell, index) => (index === 0 ? `<strong>${cell}</strong>` : `<span>${cell}</span>`)).join("")}
                      </div>
                    `
                  )
                  .join("")
              : `<div class="dashboard-mini-item"><span>Todavia no hay datos para esta metrica.</span></div>`
          }
        </div>
      </article>
  `;
}

function renderTeacherPanel(data) {
  return `
    <section class="dashboard-role-panel">
      <div class="dashboard-hero institution">
        <div>
          <div class="eyebrow">Panel docente</div>
          <h1>${data.teacher.name}</h1>
          <p>${data.institution.name}. Gestion de grupos, alumnos, familias vinculadas y alertas del aula.</p>
        </div>
        <div class="dashboard-hero-badge">
          <strong>${data.summary.active_today}</strong>
          <span>activos hoy</span>
        </div>
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        ${renderGuideCard(
          "teacher",
          "Tu tablero docente",
          "Este panel te muestra rapido como va el aula, donde conviene intervenir primero y desde donde abrir o actualizar accesos.",
          [
            "Empieza por activos hoy para medir presencia real.",
            "Suma alumnos desde el grupo correcto para evitar desorden.",
            "Abre acceso a familias cuando quieras extender el acompanamiento."
          ]
        )}

        <article class="dashboard-card dashboard-action-card">
          <div class="eyebrow">Que conviene hacer ahora</div>
          <h2>Pasos del dia</h2>
          <div class="dashboard-action-list">
            ${renderActionItem("roster", "Revisar grupos y codigos", "Confirma que cada aula tenga sus alumnos y acceso listos.", "teacher-groups")}
            ${renderActionItem("play", "Mirar alertas primero", "Empieza por quienes no entraron o muestran menor avance.", "teacher-alerts")}
            ${renderActionItem("family", "Abrir acompanamiento familiar", "Vincula familias para que observen y acompanen desde casa.", "teacher-guardian-access")}
          </div>
        </article>
      </div>

      <div class="dashboard-grid dashboard-grid-4">
        ${renderStatCard("groups", "Grupos a cargo", data.summary.classroom_count, "Asignados a esta docente.", "teacher-groups")}
        ${renderStatCard("students", "Alumnos", data.summary.student_count, "Total del aula bajo seguimiento.", "teacher-student-register")}
        ${renderStatCard("today", "Activos hoy", data.summary.active_today, "Entraron al menos una vez en el dia.", "teacher-alerts")}
        ${renderStatCard("progress", "Avance promedio", `${data.summary.avg_completion}%`, "Lectura rapida del ritmo del grupo.", "teacher-groups")}
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        <article class="dashboard-card" id="teacher-groups">
          <div class="eyebrow">Grupos del aula</div>
          <h2>Vista rapida</h2>
          <div class="dashboard-mini-list">
            ${data.classrooms
              .map(
                (classroom) => `
                  <div class="dashboard-mini-item">
                    <strong>${classroom.name}</strong>
                    <span>${classroom.student_count} alumnos - codigo ${classroom.group_code}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="dashboard-card" id="teacher-student-register">
          <div class="eyebrow">Alta de alumnos</div>
          <h2>Registro en el aula</h2>
          <form id="createStudentForm" class="dashboard-form-grid dashboard-form-grid-compact">
            <select class="dashboard-input" name="classroom_id" required>
              ${data.classrooms.map((classroom) => `<option value="${classroom.id}">${classroom.name}</option>`).join("")}
            </select>
            <input class="dashboard-input" name="name" type="text" placeholder="Nombre del alumno" required />
            <input class="dashboard-input" name="display_name" type="text" placeholder="Nombre visible (opcional)" />
            <input class="dashboard-input" name="student_code" type="text" placeholder="Codigo de acceso (opcional)" />
            <button class="btn btn-primary" type="submit">Registrar alumno</button>
          </form>
        </article>
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        <article class="dashboard-card" id="teacher-guardian-access">
          <div class="eyebrow">Vinculo con familias</div>
          <h2>Generar acceso observador</h2>
          <form id="linkGuardianForm" class="dashboard-form-grid dashboard-form-grid-compact">
            <select class="dashboard-input" name="student_id" required>
              ${data.available_students.map((student) => `<option value="${student.id}">${student.name} - ${student.classroom_name}</option>`).join("")}
            </select>
            <input class="dashboard-input" name="guardian_name" type="text" placeholder="Nombre de la familia" required />
            <input class="dashboard-input" name="guardian_code" type="text" placeholder="Codigo familiar" required />
            <input class="dashboard-input" name="contact" type="text" placeholder="Contacto opcional" />
            <button class="btn btn-primary" type="submit">Vincular familia</button>
          </form>
        </article>

        <article class="dashboard-card" id="teacher-alerts">
          <div class="eyebrow">Alertas docentes</div>
          <h2>A quien acompanar</h2>
          <div class="dashboard-mini-list">
            ${data.alerts
              .map(
                (alert) => `
                  <div class="dashboard-mini-item warn">
                    <strong>${alert.student_name}</strong>
                    <span>${alert.attendance} - ${alert.reason}</span>
                    <small>${alert.teacher_message}</small>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderStudentPanel(data) {
  data = getLiveStudentDashboardData(data);
  const student = data.student;
  const strongest = [...data.concepts].sort((a, b) => b.percent - a.percent)[0];
  const weakest = [...data.concepts].sort((a, b) => a.percent - b.percent)[0];

  return `
    <section class="dashboard-role-panel">
      <div class="dashboard-hero student">
        <div>
          <div class="eyebrow">Panel del alumno</div>
          <h1>${student.display_name}</h1>
          <p>${student.grade_label}. Este panel muestra tu progreso, tus logros y que aventura conviene jugar ahora.</p>
        </div>
        <div class="dashboard-hero-badge">
          <strong>${data.streak_days} dias</strong>
          <span>de racha</span>
        </div>
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        ${renderGuideCard(
          "student",
          "Tu mapa de avance",
          "Aqui ves tu progreso, lo que mejor te sale y cual es la siguiente aventura que mas te conviene jugar.",
          [
            "Mira progreso total para saber cuanto te falta.",
            "Sigue la siguiente aventura sugerida para avanzar mejor.",
            "Revisa tu vitrina para descubrir logros y zonas a reforzar."
          ]
        )}

        <article class="dashboard-card dashboard-action-card">
          <div class="eyebrow">Que puedes hacer ahora</div>
          <h2>Listo para seguir</h2>
          <div class="dashboard-action-list">
            ${renderActionItem("compass", "Ir a la siguiente mision", `${data.next_mission.world} - ${data.next_mission.title}`, "student-progress-map")}
            ${renderActionItem("badge", "Cuidar tu racha", `Llevas ${data.streak_days} dias. Una mision corta ya suma.`, "student-showcase")}
            ${renderActionItem("lightbulb", "Usar tu superpoder", `${strongest?.title || "Explorar"} es donde vienes resolviendo mejor.`, "student-showcase")}
          </div>
        </article>
      </div>

      <div class="dashboard-grid dashboard-grid-6 dashboard-student-wallet-grid">
        ${renderStatCard("progress", "Progreso total", `${student.completed_missions}/${student.total_missions}`, `${student.progress_percent}% del recorrido completado.`, "student-progress-map")}
        ${renderStatCard("coins", "Monedas", data.wallet.coins, `${data.wallet.earnedCoins} ganadas en misiones completadas.`, "student-showcase")}
        ${renderStatCard("gems", "Gemas", data.wallet.gems, `${data.wallet.earnedGems} ganadas en misiones completadas.`, "student-showcase")}
        ${renderStatCard("energy", "Energia de juego", `${data.energy}%`, "Buen nivel para sesiones cortas y con reto.", "student-showcase")}
        ${renderStatCard("spark", "Superpoder actual", strongest?.title || "Explorar", "Es el concepto donde viene mostrando mas seguridad.", "student-showcase")}
        ${renderStatCard("mission", "Siguiente aventura", data.next_mission.number, `${data.next_mission.world} - ${data.next_mission.title}`, "student-progress-map")}
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        <article class="dashboard-card" id="student-progress-map">
          <div class="eyebrow">Mapa de conceptos</div>
          <h2>Como va cada isla</h2>
          <div class="dashboard-progress-list">
            ${data.concepts
              .map(
                (item) => `
                  <div class="dashboard-progress-item">
                    <div class="dashboard-progress-head">
                      <strong>${item.title}</strong>
                      <span>${item.completed}/${item.total}</span>
                    </div>
                    <div class="dashboard-meter">
                      <div class="dashboard-meter-fill" style="width:${item.percent}%;"></div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="dashboard-card" id="student-showcase">
          <div class="eyebrow">Logros y foco</div>
          <h2>Tu vitrina</h2>
          <div class="dashboard-badge-row">
            ${data.badges.map((badge) => `<span class="dashboard-badge-chip">${badge}</span>`).join("")}
          </div>
          <div class="dashboard-highlight">
            <strong>Consejo del dia</strong>
            <p>${data.focus_tip}</p>
          </div>
          <div class="dashboard-highlight secondary">
            <strong>Zona a reforzar</strong>
            <p>${weakest?.title || "Sin datos aun"}. Conviene sumar mini-misiones guiadas y con recompensa rapida.</p>
          </div>
          <div class="dashboard-alert good">
            <strong>Mensaje de la docente</strong>
            <p>${data.teacher_message}</p>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderParentPanel(data) {
  const summary = data.summary;
  const child = data.selected_child.student;

  return `
    <section class="dashboard-role-panel">
      <div class="dashboard-hero parent">
        <div>
          <div class="eyebrow">Panel para familias</div>
          <h1>${data.guardian.name}</h1>
          <p>Traducimos el juego a aprendizaje real para que puedan acompanar sin volver la experiencia escolar o pesada.</p>
        </div>
        <div class="dashboard-hero-badge">
          <strong>${summary.weekly_minutes} min</strong>
          <span>esta semana</span>
        </div>
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        ${renderGuideCard(
          "parent",
          "Que mirar en casa",
          "Este panel convierte el juego en una lectura simple para familias. Aqui puedes ver que esta aprendiendo tu hijo, donde necesita apoyo y como ayudar sin quitarle autonomia.",
          [
            "Empieza por lo que ya le esta saliendo bien.",
            "Luego mira la zona que necesita apoyo sin llevarlo a examen.",
            "Usa las sugerencias como ideas cortas para conversar o jugar en casa."
          ]
        )}

        <article class="dashboard-card dashboard-action-card">
          <div class="eyebrow">Que conviene hacer hoy</div>
          <h2>Como ayudar hoy</h2>
          <div class="dashboard-action-list">
            ${renderActionItem("family", "Mirar la semana", `${summary.weekly_minutes} minutos jugados con foco en ${summary.strongest}.`, "parent-weekly-reading")}
            ${renderActionItem("timer", "Hablar dos minutos", "Una charla breve ayuda mas que corregirle la respuesta.", "parent-home-actions")}
            ${renderActionItem("lightbulb", "Guiar con preguntas", "Preguntas simples fortalecen autonomia y confianza.", "parent-home-actions")}
          </div>
        </article>
      </div>

      <div class="dashboard-grid dashboard-grid-3">
        ${renderStatCard("spark", "Que esta aprendiendo", summary.strongest, "Es el concepto donde muestra mas confianza.", "parent-weekly-reading")}
        ${renderStatCard("support", "Autonomia", child?.autonomy || "En observacion", "Se observa mejor respuesta cuando la mision tiene objetivo claro y visual.", "parent-home-actions")}
        ${renderStatCard("family", "Necesita apoyo en", summary.needs_support, "Conviene acompanar con preguntas cortas y sin anticipar la respuesta.", "parent-home-actions")}
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        <article class="dashboard-card" id="parent-weekly-reading">
          <div class="eyebrow">Ninos vinculados</div>
          <h2>Seguimiento familiar</h2>
          <div class="dashboard-mini-list">
            ${data.children
              .map(
                (student) => `
                  <div class="dashboard-mini-item">
                    <strong>${student.display_name}</strong>
                    <span>${student.classroom_name} - ${student.progress_percent}% completado</span>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="dashboard-highlight">
            <strong>Lectura de la semana</strong>
            <p>${data.selected_child.teacher_message}</p>
          </div>
        </article>

        <article class="dashboard-card" id="parent-home-actions">
          <div class="eyebrow">Acompanamiento</div>
          <h2>Que pueden hacer en casa</h2>
          <ul class="dashboard-list">
            ${data.selected_child.home_actions.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="dashboard-alert good">
            <strong>Senales positivas</strong>
            <p>${data.selected_child.observations[0]}</p>
          </div>
          <div class="dashboard-alert warn">
            <strong>Atencion suave</strong>
            <p>${data.selected_child.observations[1]}</p>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderInstitutionPanel(data) {
  const subscription = data.subscription || {
    plan_key: "trial",
    status: "trialing",
    student_limit: 50,
    teacher_limit: 2,
    student_count: data.summary.student_count,
    teacher_count: 0,
    can_add_students: true
  };
  const studentLimitLabel = subscription.plan_key === "enterprise" ? "sin limite" : subscription.student_limit;

  return `
    <section class="dashboard-role-panel">
      <div class="dashboard-hero institution">
        <div>
          <div class="eyebrow">Panel institucional</div>
          <h1>${data.institution.name}</h1>
          <p>${data.teacher.name}. Vista de progreso, actividad, altas y seguimiento pedagogico del centro.</p>
        </div>
        <div class="dashboard-hero-badge">
          <strong>${data.summary.avg_completion}%</strong>
          <span>avance promedio</span>
        </div>
      </div>

      <article class="dashboard-card">
        <div class="eyebrow">Plan institucional</div>
        <h2>${subscription.plan_key === "trial" ? "Piloto activo" : subscription.plan_key}</h2>
        <div class="dashboard-grid dashboard-grid-3">
          ${renderStatCard("students", "Uso de alumnos", `${subscription.student_count} / ${studentLimitLabel}`, "Alumnos habilitados en el centro.", "institution-student-register")}
          ${renderStatCard("teacher", "Docentes", `${subscription.teacher_count} / ${subscription.teacher_limit || "sin limite"}`, "Administrados por la institucion.", "institution-groups")}
          ${renderStatCard("support", "Estado", subscription.status, "La institucion conserva sus datos aunque cambie el plan.", "institution-groups")}
        </div>
        <div class="dashboard-highlight ${subscription.can_add_students ? "" : "secondary"}">
          <strong>Flujo recomendado</strong>
          <p>La institucion administra el espacio, crea docentes y aulas, registra alumnos y habilita familias por invitacion. El plan piloto permite validar el uso antes de contratar un plan escuela o convenio.</p>
        </div>
      </article>

      <div class="dashboard-grid dashboard-grid-2">
        ${renderGuideCard(
          "institution",
          "Vista general del centro",
          "Este panel te ayuda a ordenar grupos, registrar alumnos, abrir acceso para familias y detectar rapido donde conviene intervenir.",
          [
            "Valida grupos activos y alumnos cargados.",
            "Registra alumnos desde el aula correcta.",
            "Abre acceso familiar para ampliar el acompanamiento."
          ]
        )}

        <article class="dashboard-card dashboard-action-card">
          <div class="eyebrow">Que debe hacer la institucion</div>
          <h2>Gestion clara</h2>
          <div class="dashboard-action-list">
            ${renderActionItem("groups", "Ordenar la estructura", "La escuela y los docentes dan el alta; las familias solo observan.", "institution-groups")}
            ${renderActionItem("chart", "Mirar actividad y alertas", "Prioriza acompanamiento donde haya menos avance o asistencia baja.", "institution-alerts")}
            ${renderActionItem("family", "Invitar familias", "El acceso observador ayuda a casa sin desordenar el seguimiento escolar.", "institution-guardian-access")}
          </div>
        </article>
      </div>

      <div class="dashboard-grid dashboard-grid-4">
        ${renderStatCard("groups", "Grupos activos", data.summary.classroom_count, "Con codigos de acceso y asignacion visible.", "institution-groups")}
        ${renderStatCard("students", "Alumnos", data.summary.student_count, "Total del recorrido institucional.", "institution-student-register")}
        ${renderStatCard("today", "Activos hoy", data.summary.active_today, "Ingresaron y jugaron al menos una mision.", "institution-alerts")}
        ${renderStatCard("family", "Familias vinculadas", data.summary.linked_guardians, "Con acceso de observacion ya creado.", "institution-guardian-access")}
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        <article class="dashboard-card" id="institution-groups">
          <div class="eyebrow">Grupos y accesos</div>
          <h2>Organizacion escolar</h2>
          <div class="dashboard-mini-list">
            ${data.classrooms
              .map(
                (classroom) => `
                  <div class="dashboard-mini-item">
                    <strong>${classroom.name}</strong>
                    <span>${classroom.grade_label} - ${classroom.student_count} alumnos - codigo ${classroom.group_code}</span>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="dashboard-form-card">
            <strong>Crear grupo</strong>
            <form id="createClassroomForm" class="dashboard-form-grid">
              <input class="dashboard-input" name="name" type="text" placeholder="Ej: 4.o C" required />
              <input class="dashboard-input" name="grade_label" type="text" placeholder="Ej: 4.o de escuela" required />
              <button class="btn btn-primary" type="submit">Crear grupo</button>
            </form>
          </div>
        </article>

        <article class="dashboard-card" id="institution-student-register">
          <div class="eyebrow">Alta de alumnos</div>
          <h2>Registro y accesos</h2>
          <div class="dashboard-highlight">
            <strong>Como se registra un nino</strong>
            <p>La maestra crea el grupo, registra al alumno y el sistema genera o valida su codigo de acceso para entrar al juego.</p>
          </div>
          <form id="createStudentForm" class="dashboard-form-grid dashboard-form-grid-compact">
            <select class="dashboard-input" name="classroom_id" required>
              ${data.classrooms.map((classroom) => `<option value="${classroom.id}">${classroom.name}</option>`).join("")}
            </select>
            <input class="dashboard-input" name="name" type="text" placeholder="Nombre del alumno" required />
            <input class="dashboard-input" name="display_name" type="text" placeholder="Nombre visible (opcional)" />
            <input class="dashboard-input" name="student_code" type="text" placeholder="Codigo de acceso (opcional)" />
            <button class="btn btn-primary" type="submit">Registrar alumno</button>
          </form>
        </article>
      </div>

      <div class="dashboard-grid dashboard-grid-2">
        <article class="dashboard-card" id="institution-guardian-access">
          <div class="eyebrow">Vinculo con familias</div>
          <h2>Crear acceso de observacion</h2>
          <form id="linkGuardianForm" class="dashboard-form-grid dashboard-form-grid-compact">
            <select class="dashboard-input" name="student_id" required>
              ${data.available_students.map((student) => `<option value="${student.id}">${student.name} - ${student.classroom_name}</option>`).join("")}
            </select>
            <input class="dashboard-input" name="guardian_name" type="text" placeholder="Nombre de la familia" required />
            <input class="dashboard-input" name="guardian_code" type="text" placeholder="Codigo familiar" required />
            <input class="dashboard-input" name="contact" type="text" placeholder="Contacto opcional" />
            <button class="btn btn-primary" type="submit">Vincular familia</button>
          </form>
        </article>

        <article class="dashboard-card" id="institution-alerts">
          <div class="eyebrow">Alertas pedagogicas</div>
          <h2>A quien mirar primero</h2>
          <div class="dashboard-mini-list">
            ${data.alerts
              .map(
                (alert) => `
                  <div class="dashboard-mini-item warn">
                    <strong>${alert.student_name}</strong>
                    <span>${alert.attendance} - ${alert.reason}</span>
                    <small>${alert.teacher_message}</small>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="dashboard-highlight secondary">
            <strong>Vista por concepto</strong>
            <p>${data.concept_overview.map((item) => `${item.title}: ${item.percent}%`).join(" - ")}</p>
          </div>
        </article>
      </div>

      <article class="dashboard-card">
        <div class="eyebrow">Listado del grupo</div>
        <h2>Seguimiento rapido por alumno</h2>
        <div class="dashboard-table">
          ${data.students
            .map(
              (student) => `
                <div class="dashboard-table-row dashboard-table-row-wide">
                  <strong>${student.display_name}</strong>
                  <span>${student.classroom_name}</span>
                  <span>${student.progress_percent}%</span>
                  <span>${student.strong_concept}</span>
                  <span>${student.needs_support}</span>
                  <span>${student.student_code}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </article>
    </section>
  `;
}

function renderOwnerPanel(data) {
  const summary = data.summary;
  const activeModule = appState.selectedOwnerMetric || "overview";

  return `
    <section class="dashboard-role-panel owner-workspace">
      ${renderOwnerSidebar(activeModule)}

      <div class="owner-main">
        <div class="owner-topline">
          <div>
            <div class="eyebrow">Panel del producto</div>
            <h1>${data.owner.name}</h1>
            <p>Metricas agregadas para medir adopcion, demostrar valor pedagogico y preparar conversaciones con instituciones o Ceibal.</p>
          </div>
          <div class="owner-topline-actions">
            <span class="owner-health-pill">Piloto activo</span>
            <span class="owner-date-pill">Vista comercial</span>
          </div>
        </div>

        <div class="owner-kpi-strip">
          <div><span>Instituciones</span><strong>${summary.institutions}</strong></div>
          <div><span>Alumnos</span><strong>${summary.students}</strong></div>
          <div><span>Activos</span><strong>${summary.active_students}</strong></div>
          <div><span>Avance</span><strong>${summary.avg_completion}%</strong></div>
          <div><span>Minutos</span><strong>${summary.weekly_minutes}</strong></div>
        </div>

        ${
          activeModule === "overview"
            ? `
              <div class="owner-overview-grid">
                <section class="owner-summary-area">
                  <div class="dashboard-grid dashboard-grid-4 owner-stat-grid">
                    ${renderOwnerMetricCard("groups", "Instituciones", summary.institutions, "Centros registrados en la plataforma.", "institutions")}
                    ${renderOwnerMetricCard("students", "Alumnos", summary.students, "Usuarios de aprendizaje cargados.", "students")}
                    ${renderOwnerMetricCard("today", "Activos", summary.active_students, "Alumnos con estado activo.", "active")}
                    ${renderOwnerMetricCard("progress", "Avance promedio", `${summary.avg_completion}%`, "Progreso agregado de misiones.", "progress")}
                    ${renderOwnerMetricCard("teacher", "Docentes", summary.teachers, "Docentes vinculados a instituciones.", "teachers")}
                    ${renderOwnerMetricCard("family", "Familias vinculadas", summary.linked_guardians, "Seguimiento familiar activo.", "families")}
                    ${renderOwnerMetricCard("timer", "Minutos semanales", summary.weekly_minutes, "Uso acumulado reportado.", "minutes")}
                    ${renderOwnerMetricCard("support", "Alertas", summary.at_risk_students, "Alumnos para seguimiento.", "alerts")}
                  </div>

                  <div class="dashboard-grid dashboard-grid-2">
                    <article class="dashboard-card">
                      <div class="eyebrow">Embudo institucional</div>
                      <h2>Adopcion</h2>
                      <div class="dashboard-mini-list">
                        <div class="dashboard-mini-item"><strong>Registradas</strong><span>${data.funnel.registered_institutions} instituciones</span></div>
                        <div class="dashboard-mini-item"><strong>Con aulas</strong><span>${data.funnel.with_classrooms} instituciones ordenaron grupos</span></div>
                        <div class="dashboard-mini-item"><strong>Con alumnos</strong><span>${data.funnel.with_students} instituciones cargaron estudiantes</span></div>
                        <div class="dashboard-mini-item"><strong>Con familias</strong><span>${data.funnel.with_family_links} instituciones vincularon observadores</span></div>
                      </div>
                    </article>

                    <article class="dashboard-card">
                      <div class="eyebrow">Planes</div>
                      <h2>Estado comercial</h2>
                      <div class="dashboard-mini-list">
                        <div class="dashboard-mini-item"><strong>Piloto</strong><span>${data.plan_breakdown.trial || 0} instituciones</span></div>
                        <div class="dashboard-mini-item"><strong>Escuela</strong><span>${data.plan_breakdown.school || 0} instituciones</span></div>
                        <div class="dashboard-mini-item"><strong>Red educativa</strong><span>${data.plan_breakdown.enterprise || 0} instituciones</span></div>
                        <div class="dashboard-mini-item good"><strong>Candidatas a expansion</strong><span>${summary.expansion_candidates} pilotos con senales de traccion</span></div>
                      </div>
                    </article>
                  </div>
                </section>

                <aside class="owner-insight-rail">
                  <article class="dashboard-card">
                    <div class="eyebrow">Evidencia pedagogica</div>
                    <h2>Conceptos trabajados</h2>
                    <div class="dashboard-progress-list">
                      ${data.concept_overview
                        .map(
                          (item) => `
                            <div class="dashboard-progress-item">
                              <div class="dashboard-progress-head">
                                <strong>${item.title}</strong>
                                <span>${item.percent}%</span>
                              </div>
                              <div class="dashboard-meter">
                                <div class="dashboard-meter-fill" style="width:${item.percent}%;"></div>
                              </div>
                            </div>
                          `
                        )
                        .join("")}
                    </div>
                  </article>

                  <article class="dashboard-card">
                    <div class="eyebrow">Argumentos para vender</div>
                    <h2>Ceibal readiness</h2>
                    <ul class="dashboard-list compact">
                      ${data.ceibal_evidence.map((item) => `<li>${item}</li>`).join("")}
                    </ul>
                  </article>
                </aside>
              </div>
            `
            : renderOwnerTable(data, activeModule)
        }
      </div>
    </section>
  `;
}

function bindCommonEvents(role) {
  document.getElementById("backToMapBtn")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    if (role === "student") {
      goToWorldMap();
    } else {
      goToStart();
    }
    window.renderApp();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    unlockAudio();
    playUiClick();
    appState.currentUserRole = null;
    appState.currentUserName = "";
    appState.currentAccessCode = "";
    appState.session = null;
    appState.dashboardData = null;
    appState.dashboardError = "";
    appState.selectedOwnerMetric = "";
    appState.selectedDashboardRole = "student";
    clearSession();
    goToStart();
    window.renderApp();
  });
}

function bindInstitutionActions(data) {
  document.querySelectorAll(".dashboard-input, .dashboard-form-grid button").forEach((node) => {
    node.addEventListener("mouseenter", () => {
      unlockAudio();
      playHoverTick();
    });
  });

  document.getElementById("createClassroomForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    unlockAudio();
    playSelect();
    const form = new FormData(event.currentTarget);
    await createClassroom(data.institution.id, {
      name: form.get("name"),
      grade_label: form.get("grade_label")
    });
    appState.dashboardData = null;
    window.renderApp();
  });

  document.getElementById("createStudentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    unlockAudio();
    playSelect();
    const form = new FormData(event.currentTarget);
    await createStudent(form.get("classroom_id"), {
      classroom_id: form.get("classroom_id"),
      name: form.get("name"),
      display_name: form.get("display_name"),
      student_code: form.get("student_code")
    });
    appState.dashboardData = null;
    window.renderApp();
  });

  document.getElementById("linkGuardianForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    unlockAudio();
    playSelect();
    const form = new FormData(event.currentTarget);
    await linkGuardian(form.get("student_id"), {
      student_id: form.get("student_id"),
      guardian_name: form.get("guardian_name"),
      guardian_code: form.get("guardian_code"),
      contact: form.get("contact")
    });
    appState.dashboardData = null;
    window.renderApp();
  });
}

function bindDashboardJumpLinks() {
  document.querySelectorAll("[data-scroll-target]").forEach((node) => {
    node.addEventListener("click", () => {
      const targetId = node.getAttribute("data-scroll-target");
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      unlockAudio();
      playSelect();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

function bindOwnerMetricLinks() {
  document.querySelectorAll("[data-owner-module]").forEach((node) => {
    node.addEventListener("click", () => {
      unlockAudio();
      playSelect();
      const moduleId = node.getAttribute("data-owner-module") || "overview";
      appState.selectedOwnerMetric = moduleId === "overview" ? "" : moduleId;
      window.renderApp();
    });
  });
}

export function renderDashboard() {
  const appShell = document.querySelector(".app-shell");
  if (!appShell) return;

  const role = appState.selectedDashboardRole || appState.currentUserRole || "student";
  const backLabel = role === "student" ? "Volver al mapa" : "Cambiar acceso";
  setAmbientMode("mission");

  appShell.innerHTML = renderLoadingShell(backLabel, role !== "owner");
  bindCommonEvents(role);

  ensureDashboardData()
    .then((data) => {
      appShell.innerHTML = `
        <header class="topbar">
          <div class="topbar-left">
            <div class="pill level-pill"><span class="mission-header-badge ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span><span>Nivel 4</span></div>
            <div class="pill title-pill"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span><span>Paneles de seguimiento</span></div>
          </div>

          <div class="topbar-right">
            <button class="pill nav-pill" id="backToMapBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span><span>${backLabel}</span></button>
            <button class="pill nav-pill" id="logoutBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("log-out")}</span><span>Cerrar sesion</span></button>
            ${
              role !== "owner"
                ? `
                  <div class="pill currency-pill">
                    <span class="currency-icon gold"></span>
                    <span>${appState.coins}</span>
                  </div>
                  <div class="pill currency-pill">
                    <span class="currency-icon gems"></span>
                    <span>${appState.gems}</span>
                  </div>
                `
                : ""
            }
          </div>
        </header>

        <main class="dashboard-screen">
          <section class="dashboard-panel${role === "owner" ? " owner-dashboard-panel" : ""}">
            ${
              role === "student"
                ? renderStudentPanel(data)
                : role === "parent"
                  ? renderParentPanel(data)
                  : role === "owner"
                    ? renderOwnerPanel(data)
                    : role === "teacher"
                      ? renderTeacherPanel(data)
                      : renderInstitutionPanel(data)
            }
          </section>
        </main>
      `;

      bindCommonEvents(role);
      bindDashboardJumpLinks();
      if (role === "owner") {
        bindOwnerMetricLinks();
      }
      if (role === "institution" || role === "teacher") {
        bindInstitutionActions(data);
      }
    })
    .catch(() => {
      appShell.innerHTML = `
        <header class="topbar">
          <div class="topbar-left">
            <div class="pill level-pill"><span class="mission-header-badge ui-icon-wrap" aria-hidden="true">${uiIcon("trophy")}</span><span>Nivel 4</span></div>
            <div class="pill title-pill"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("panels")}</span><span>Paneles de seguimiento</span></div>
          </div>
          <div class="topbar-right">
            <button class="pill nav-pill" id="backToMapBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("arrow-left")}</span><span>${backLabel}</span></button>
            <button class="pill nav-pill" id="logoutBtn" type="button"><span class="mission-header-icon ui-icon-wrap" aria-hidden="true">${uiIcon("log-out")}</span><span>Cerrar sesion</span></button>
          </div>
        </header>
        <main class="dashboard-screen">
          <section class="dashboard-panel">
            <div class="dashboard-loading-card error">
              <strong>No pudimos cargar el panel.</strong>
              <p>${appState.dashboardError || "Revisa que el backend este levantado en el puerto 8000."}</p>
            </div>
          </section>
        </main>
      `;
      bindCommonEvents(role);
    });
}

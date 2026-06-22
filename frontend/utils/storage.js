const PROGRESS_KEY = "yoaprendo-progress";
const SESSION_KEY = "yoaprendo-session";

export function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

export function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error cargando progreso", error);
    return null;
  }
}

export function saveSession(data) {
  const safeData = {
    currentUserRole: data.currentUserRole || null,
    currentUserName: data.currentUserName || "",
    selectedDashboardRole: data.selectedDashboardRole || "student",
    startAccessMode: data.startAccessMode || "chooser"
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeData));
}

export function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    delete parsed.currentAccessCode;
    delete parsed.session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    return parsed;
  } catch (error) {
    console.error("Error cargando sesion", error);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

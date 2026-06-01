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
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error cargando sesion", error);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

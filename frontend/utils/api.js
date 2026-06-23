const API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
  ? "http://127.0.0.1:8000/api"
  : "/api";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeResponse(value) {
  if (typeof value === "string") return escapeHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeResponse);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeResponse(item)])
    );
  }
  return value;
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.detail || "No se pudo completar la solicitud.";
    throw new Error(message);
  }
  return sanitizeResponse(data);
}

export async function loginWithAccess(payload) {
  const response = await fetch(`${API_BASE}/access/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  return await readJson(response);
}

export async function registerInstitution(payload) {
  const response = await fetch(`${API_BASE}/institutions/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function requestInstitutionPlan(payload) {
  const response = await fetch(`${API_BASE}/institutions/plan-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function createBillingCheckout(institutionId, payload = {}) {
  const response = await fetch(
    `${API_BASE}/institutions/${encodeURIComponent(institutionId)}/billing/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(payload)
    }
  );
  return await readJson(response);
}

export async function fetchBillingStatus(institutionId) {
  const response = await fetch(
    `${API_BASE}/institutions/${encodeURIComponent(institutionId)}/billing/status`,
    { credentials: "include" }
  );
  return await readJson(response);
}

export async function fetchDashboardByRole(role, entityId) {
  const response = await fetch(
    `${API_BASE}/dashboard/${encodeURIComponent(role)}/${encodeURIComponent(entityId)}`,
    { credentials: "include" }
  );
  return await readJson(response);
}

export async function createClassroom(institutionId, payload) {
  const response = await fetch(`${API_BASE}/institutions/${encodeURIComponent(institutionId)}/classrooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function createStudent(classroomId, payload) {
  const response = await fetch(`${API_BASE}/classrooms/${encodeURIComponent(classroomId)}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function linkGuardian(studentId, payload) {
  const response = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/guardians`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function fetchCurrentSession() {
  const response = await fetch(`${API_BASE}/access/session`, { credentials: "include" });
  return await readJson(response);
}

export async function logoutSession() {
  const response = await fetch(`${API_BASE}/access/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  });
  return await readJson(response);
}

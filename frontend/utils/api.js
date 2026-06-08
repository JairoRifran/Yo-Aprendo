const API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
  ? "http://127.0.0.1:8000/api"
  : "/api";

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.detail || "No se pudo completar la solicitud.";
    throw new Error(message);
  }
  return data;
}

export async function fetchDemoAccess() {
  const response = await fetch(`${API_BASE}/access/demo`);
  return await readJson(response);
}

export async function loginWithAccess(payload) {
  const response = await fetch(`${API_BASE}/access/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function fetchDashboardByRole(role, entityId) {
  const response = await fetch(`${API_BASE}/dashboard/${role}/${entityId}`);
  return await readJson(response);
}

export async function createClassroom(institutionId, payload) {
  const response = await fetch(`${API_BASE}/institutions/${institutionId}/classrooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function createStudent(classroomId, payload) {
  const response = await fetch(`${API_BASE}/classrooms/${classroomId}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

export async function linkGuardian(studentId, payload) {
  const response = await fetch(`${API_BASE}/students/${studentId}/guardians`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return await readJson(response);
}

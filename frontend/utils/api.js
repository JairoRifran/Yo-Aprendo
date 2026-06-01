import {
  demoAccess,
  demoCreateClassroom,
  demoCreateStudent,
  demoInstitutionDashboard,
  demoLinkGuardian,
  demoLogin,
  demoOwnerDashboard,
  demoParentDashboard,
  demoStudentDashboard,
  demoTeacherDashboard
} from "../data/schoolDemoData.js";

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

function isNetworkError(error) {
  return error instanceof TypeError || /fetch/i.test(error?.message || "");
}

export async function fetchDemoAccess() {
  try {
    const response = await fetch(`${API_BASE}/access/demo`);
    return await readJson(response);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return demoAccess();
  }
}

export async function loginWithAccess(payload) {
  try {
    const response = await fetch(`${API_BASE}/access/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return await readJson(response);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return demoLogin(payload);
  }
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

export async function fetchDashboardByRole(role, entityId) {
  try {
    const response = await fetch(`${API_BASE}/dashboard/${role}/${entityId}`);
    return await readJson(response);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    if (role === "student") return demoStudentDashboard(entityId);
    if (role === "parent") return demoParentDashboard(entityId);
    if (role === "teacher") return demoTeacherDashboard(entityId);
    if (role === "institution") return demoInstitutionDashboard(entityId);
    if (role === "owner") return demoOwnerDashboard();
    throw error;
  }
}

export async function createClassroom(institutionId, payload) {
  try {
    const response = await fetch(`${API_BASE}/institutions/${institutionId}/classrooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await readJson(response);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return demoCreateClassroom(institutionId, payload);
  }
}

export async function createStudent(classroomId, payload) {
  try {
    const response = await fetch(`${API_BASE}/classrooms/${classroomId}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await readJson(response);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return demoCreateStudent(classroomId, payload);
  }
}

export async function linkGuardian(studentId, payload) {
  try {
    const response = await fetch(`${API_BASE}/students/${studentId}/guardians`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await readJson(response);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return demoLinkGuardian(studentId, payload);
  }
}

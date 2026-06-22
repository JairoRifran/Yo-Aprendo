import { appState } from "./state/appState.js";
import { renderDashboard } from "./views/dashboardView.js";
import { fetchCurrentSession, loginWithAccess } from "./utils/api.js";

const appShell = document.querySelector(".app-shell");

function openOwnerDashboard(session) {
  appState.currentView = "dashboard";
  appState.currentUserRole = "owner";
  appState.selectedDashboardRole = "owner";
  appState.currentUserName = session.display_name;
  appState.session = session;
  appState.dashboardData = null;
  appState.dashboardError = "";
  window.renderApp = renderDashboard;
  renderDashboard();
}

function renderOwnerLogin(message = "") {
  appShell.innerHTML = `
    <main class="start-art-screen">
      <section class="start-art-board">
        <div class="start-art-scene" aria-hidden="true">
          <img class="start-art-backdrop" src="./img/start-adventure-bg.png" alt="" />
          <div class="start-art-backdrop-tint"></div>
        </div>
        <div class="start-art-overlay">
          <section class="start-art-login-panel">
            <div class="start-art-side-label">Acceso privado</div>
            <h2>Dashboard del owner</h2>
            <p>Ingresa con las credenciales privadas configuradas para el producto.</p>
            <form class="start-art-form" id="ownerLoginForm">
              <label class="start-field-label" for="ownerEmailInput">Email</label>
              <input id="ownerEmailInput" class="start-input" type="email" autocomplete="username" required />
              <label class="start-field-label" for="ownerPasswordInput">Contraseña</label>
              <input id="ownerPasswordInput" class="start-input" type="password" autocomplete="current-password" required />
              <button class="btn btn-primary start-art-submit" id="ownerLoginBtn" type="submit">Entrar</button>
              <div class="start-art-form-error" id="ownerLoginError">${message}</div>
            </form>
          </section>
        </div>
      </section>
    </main>
  `;

  document.getElementById("ownerLoginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("ownerLoginBtn");
    const errorNode = document.getElementById("ownerLoginError");
    button.disabled = true;
    button.textContent = "Validando...";
    errorNode.textContent = "";
    try {
      const session = await loginWithAccess({
        role: "owner",
        name: document.getElementById("ownerEmailInput").value.trim(),
        code: document.getElementById("ownerPasswordInput").value
      });
      openOwnerDashboard(session);
    } catch (error) {
      errorNode.textContent = error.message || "No pudimos validar el acceso.";
      button.disabled = false;
      button.textContent = "Entrar";
    }
  });
}

try {
  const session = await fetchCurrentSession();
  if (session.role !== "owner") throw new Error("La sesión actual no tiene acceso de owner.");
  openOwnerDashboard(session);
} catch (error) {
  renderOwnerLogin(error.message === "Inicia sesion para continuar." ? "" : error.message);
}

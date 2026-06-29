import { appState } from "../state/appState.js";

export function goToStart() {
  appState.currentView = "start";
}

export function goToWorldMap() {
  appState.currentView = "world-map";
}

export function goToDashboard(role = appState.selectedDashboardRole || "student") {
  appState.currentView = "dashboard";
  appState.selectedDashboardRole = role;
}

export function goToSubmap(worldId) {
  appState.currentView = "submap";
  appState.selectedWorldId = worldId;
}

export function goToIslandNavigator(worldId) {
  appState.currentView = "island-navigator";
  appState.selectedWorldId = worldId;
}

export function goToMission(worldId, missionId) {
  appState.currentView = "mission";
  appState.selectedWorldId = worldId;
  appState.selectedMissionId = missionId;
}

export function goToResult(result) {
  appState.currentView = "result";
  appState.missionResult = result;
}

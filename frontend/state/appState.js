export const appState = {
  currentView: "start",
  selectedWorldId: "world-sequences",
  selectedMissionId: null,
  selectedDashboardRole: "student",
  currentUserRole: null,
  currentUserName: "",
  currentAccessCode: "",
  startAccessMode: "chooser",
  session: null,
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: "",
  startAccessData: null,
  selectedInstitutionPlan: "trial",
  selectedOwnerMetric: "",
  selectedDashboardModule: "",

  coins: 350,
  gems: 25,

  missionResult: null,

  progress: {
    missions: {
      "4-1-1": { completed: true },
      "4-1-2": { completed: false },
      "4-1-3": { completed: false },
      "4-1-4": { completed: false },
      "4-1-5": { completed: false },
      "4-1-6": { completed: false },
      "4-1-final": { completed: false }
    }
  }
};

import { grade4Data } from "../data/grade4.js";
import { appState } from "../state/appState.js";
import { saveProgress } from "./storage.js";

const STARTING_COINS = 350;
const STARTING_GEMS = 25;

function persist() {
  saveProgress({
    progress: appState.progress,
    coins: appState.coins,
    gems: appState.gems
  });
}

export function isMissionCompleted(missionId) {
  return !!appState.progress.missions[missionId]?.completed;
}

export function getEarnedRewards() {
  return grade4Data.worlds
    .flatMap((world) => world.missions)
    .reduce(
      (total, mission) => {
        if (!isMissionCompleted(mission.id)) return total;
        return {
          coins: total.coins + (mission.coins || 0),
          gems: total.gems + (mission.gems || 0)
        };
      },
      { coins: 0, gems: 0 }
    );
}

export function syncWalletWithProgress() {
  const earned = getEarnedRewards();
  appState.coins = STARTING_COINS + earned.coins;
  appState.gems = STARTING_GEMS + earned.gems;
  persist();
  return {
    coins: appState.coins,
    gems: appState.gems,
    earnedCoins: earned.coins,
    earnedGems: earned.gems
  };
}

export function completeMission(mission) {
  const alreadyCompleted = isMissionCompleted(mission.id);

  if (!alreadyCompleted) {
    appState.progress.missions[mission.id] = {
      completed: true
    };

    syncWalletWithProgress();
  }

  return {
    awarded: !alreadyCompleted,
    coins: alreadyCompleted ? 0 : mission.coins || 0,
    gems: alreadyCompleted ? 0 : mission.gems || 0
  };
}

export function getMissionAvailability(world, missionIndex, allWorlds = []) {
  const mission = world?.missions?.[missionIndex];
  if (!mission) return false;

  const worldIndex = allWorlds.findIndex((item) => item.id === world.id);
  const worldState = getWorldState(world, worldIndex, allWorlds);

  if (worldState === "locked") return false;

  if (missionIndex === 0) return true;

  const previousMission = world.missions[missionIndex - 1];
  return isMissionCompleted(previousMission.id);
}

export function getMissionState(world, missionIndex, allWorlds = []) {
  const mission = world?.missions?.[missionIndex];
  if (!mission) return "locked";

  if (isMissionCompleted(mission.id)) {
    return "completed";
  }

  if (getMissionAvailability(world, missionIndex, allWorlds)) {
    return "available";
  }

  return "locked";
}

export function getWorldCompletedCount(world) {
  if (!world?.missions?.length) return 0;
  return world.missions.filter((mission) => isMissionCompleted(mission.id)).length;
}

export function getWorldProgress(world) {
  const total = world?.missions?.length || 0;
  const completed = getWorldCompletedCount(world);

  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0
  };
}

export function isWorldCompleted(world) {
  return !!world?.missions?.length && world.missions.every((mission) => isMissionCompleted(mission.id));
}

export function getWorldState(world, worldIndex, allWorlds = []) {
  if (!world) return "locked";

  if (isWorldCompleted(world)) return "completed";

  if (worldIndex === 0) return "current";

  const previousWorld = allWorlds[worldIndex - 1];
  if (previousWorld && isWorldCompleted(previousWorld)) {
    return "current";
  }

  return "locked";
}

export function resetProgress() {
  appState.progress = {
    missions: {}
  };

  appState.coins = STARTING_COINS;
  appState.gems = STARTING_GEMS;

  persist();
}

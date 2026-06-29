export const THREE_VERSION = "0.168.0";
export const BOAT_GLB_URL = "";

export const NAVIGATOR_CONFIG = {
  camera: {
    fov: 48,
    near: 0.1,
    far: 220,
    followOffset: { x: 0, y: 12, z: 16 },
    lookAhead: { x: 0, y: 1.8, z: -4 },
    followLerp: 0.065
  },
  world: {
    oceanSize: 190,
    fogColor: 0x8bdcff,
    fogNear: 38,
    fogFar: 118,
    arrivalDistance: 3.2
  },
  boat: {
    speed: 8.2,
    turnLerp: 0.12,
    bobAmount: 0.22,
    placeholderScale: 1
  },
  islands: [
    { x: -18, z: -18, scale: 1.15, accent: 0x39c47a, deco: "palms" },
    { x: 2, z: -30, scale: 1, accent: 0xffc857, deco: "hut" },
    { x: 22, z: -18, scale: 1.08, accent: 0x67d5ff, deco: "lighthouse" },
    { x: -28, z: 8, scale: 0.98, accent: 0xff8fb4, deco: "palms" },
    { x: 0, z: 8, scale: 1.1, accent: 0x7be27c, deco: "hut" },
    { x: 28, z: 10, scale: 1, accent: 0xffa84d, deco: "palms" },
    { x: 10, z: 30, scale: 1.14, accent: 0xa98bff, deco: "lighthouse" }
  ]
};

export const THREE_VERSION = "0.168.0";
export const BOAT_GLB_URL = "./models/barco.glb";
export const MINI_ISLAND_GLB_URLS = ["./models/micro-isla-1.glb", "./models/micro-isla-2.glb"];

export const NAVIGATOR_CONFIG = {
  camera: {
    fov: 52,
    near: 0.1,
    far: 560,
    chaseDistance: 12.8,
    chaseHeight: 5.9,
    lookHeight: 1.55,
    lookAhead: 2.8,
    followLerp: 0.105,
    yawLerp: 0.12,
    yawReturn: 0.018,
    maxYawOffset: 1.35,
    pitchMin: -0.18,
    pitchMax: 0.34,
    pitchDefault: 0.08,
    minHeight: 3.2,
    dragSensitivity: 0.005
  },
  world: {
    oceanSize: 620,
    playableRadius: 260,
    edgeWarningRadius: 226,
    activeIslandCount: 2,
    resetDistanceFromTarget: 76,
    fogColor: 0x8eddf5,
    fogNear: 155,
    fogFar: 470,
    arrivalDistance: 11,
    nearDistance: 58
  },
  boat: {
    maxSpeed: 15.5,
    reverseSpeed: 4.2,
    acceleration: 10.5,
    brakeAcceleration: 9.2,
    drag: 3.4,
    turnSpeed: 1.75,
    turnLerp: 0.14,
    bobAmount: 0.09,
    rollAmount: 0.028,
    pitchAmount: 0.022,
    placeholderScale: 1.1,
    waterClearance: 0.82,
    waterlineOffset: 1.82,
    floatDamping: 0.18,
    maxWaveLift: 0.48,
    waveFollow: 0.92,
    waveTilt: 0.16,
    spawnX: 0,
    spawnZ: 172,
    spawnRotationY: Math.PI,
    modelLength: 4.2,
    modelRotationY: Math.PI / 2,
    wakeStrength: 1.15,
    wakeEffects: {
      sprayCount: 120,
      foamTrailCount: 80,
      sprayHeight: 1.8,
      spraySpread: 1.2,
      sprayLifetime: 1.5,
      foamLifetime: 3.0,
      kelvinAngle: 0.34,
      bowWaveIntensity: 1.2,
      turbulenceStrength: 0.8
    }
  },
  islandModel: {
    diameter: 11.8,
    waterlineY: -0.58,
    rotationY: 0,
    materialRoughness: 0.82
  },
  islands: [
    { x: -58, z: -88, scale: 1.28, accent: 0x39c47a },
    { x: 92, z: -198, scale: 1.2, accent: 0xffc857 },
    { x: 216, z: -70, scale: 1.18, accent: 0x67d5ff },
    { x: -214, z: -26, scale: 1.12, accent: 0xff8fb4 },
    { x: -92, z: 126, scale: 1.22, accent: 0x7be27c },
    { x: 194, z: 132, scale: 1.14, accent: 0xffa84d },
    { x: 30, z: 224, scale: 1.2, accent: 0xa98bff }
  ]
};

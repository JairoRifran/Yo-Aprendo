import { soundCatalog } from "./soundCatalog.js";

let audioContext = null;
let masterGain = null;
let ambientGain = null;
let currentAmbient = null;
let currentAmbientMode = null;
let unlocked = false;
let resumePromise = null;
const decodedSoundCache = new Map();

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    audioContext = new AudioCtx();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.34;
    masterGain.connect(audioContext.destination);

    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 0;
    ambientGain.connect(masterGain);
  }

  return audioContext;
}

function now() {
  return getAudioContext()?.currentTime || 0;
}

function ensureUnlocked() {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    if (!resumePromise) {
      resumePromise = ctx.resume().finally(() => {
        resumePromise = null;
      });
    }
  }

  unlocked = true;
  return true;
}

function runWhenReady(callback) {
  const ctx = getAudioContext();
  if (!ctx) return;

  ensureUnlocked();

  if (ctx.state === "running") {
    callback(ctx);
    return;
  }

  if (resumePromise) {
    resumePromise.then(() => {
      if (ctx.state === "running") {
        callback(ctx);
      }
    });
  }
}

async function loadSound(sound) {
  if (!sound?.file) return null;

  if (!decodedSoundCache.has(sound.file)) {
    decodedSoundCache.set(
      sound.file,
      fetch(sound.file)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Audio asset missing: ${sound.file}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => getAudioContext()?.decodeAudioData(arrayBuffer))
        .catch(() => null)
    );
  }

  return decodedSoundCache.get(sound.file);
}

function playSoundAsset(soundName, { fallback = null, volume = 1, loop = false } = {}) {
  const sound = soundCatalog[soundName];

  runWhenReady(async (ctx) => {
    const buffer = await loadSound(sound);

    if (!buffer) {
      fallback?.();
      return;
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    source.loop = loop || sound.loop || false;
    gainNode.gain.value = (sound.volume ?? 0.35) * volume;

    source.connect(gainNode);
    gainNode.connect(masterGain);
    source.start();
  });
}

async function startAmbientAsset(mode = "world") {
  const modeKey =
    mode === "mission" ? "ambientMission" : mode === "submap" ? "ambientSubmap" : "ambientWorld";
  const sound = soundCatalog[modeKey];

  if (currentAmbientMode === mode && currentAmbient) return;

  runWhenReady(async (ctx) => {
    const buffer = await loadSound(sound);

    if (!buffer) {
      stopAmbient(ctx);
      currentAmbientMode = mode;
      return;
    }

    stopAmbient(ctx, 0.55);

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const startAt = ctx.currentTime;
    const targetVolume = sound.volume ?? 0.12;

    source.buffer = buffer;
    source.loop = true;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(targetVolume, startAt + 1.2);

    source.connect(gainNode);
    gainNode.connect(ambientGain);
    source.start(startAt);

    currentAmbient = { source, gainNode };
    currentAmbientMode = mode;
  });
}

function stopAmbient(ctx = getAudioContext(), fadeSeconds = 0.35) {
  if (!ctx || !currentAmbient) return;

  const { source, gainNode } = currentAmbient;
  const stopAt = ctx.currentTime + fadeSeconds;

  gainNode.gain.cancelScheduledValues(ctx.currentTime);
  gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);
  source.stop(stopAt + 0.03);

  currentAmbient = null;
}

function withEnvelope(node, startAt, attack, decay, peak = 1, sustain = 0.0001) {
  node.gain.cancelScheduledValues(startAt);
  node.gain.setValueAtTime(0.0001, startAt);
  node.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  node.gain.exponentialRampToValueAtTime(sustain, startAt + attack + decay);
}

function playTone({
  type = "sine",
  frequency = 440,
  duration = 0.12,
  attack = 0.01,
  decay = 0.12,
  volume = 0.2,
  slideTo = null,
  when = 0,
  destination = null
}) {
  runWhenReady((ctx) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const startAt = ctx.currentTime + when;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (slideTo != null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), startAt + duration);
    }

    withEnvelope(gainNode, startAt, attack, decay, volume);

    oscillator.connect(gainNode);
    gainNode.connect(destination || masterGain);

    oscillator.start(startAt);
    oscillator.stop(startAt + duration + decay + 0.02);
  });
}

function playNoise({
  duration = 0.08,
  volume = 0.08,
  attack = 0.002,
  decay = 0.05,
  when = 0,
  highpass = 900
}) {
  runWhenReady((ctx) => {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    const startAt = ctx.currentTime + when;

    filter.type = "highpass";
    filter.frequency.value = highpass;

    source.buffer = buffer;
    withEnvelope(gainNode, startAt, attack, decay, volume);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(startAt);
    source.stop(startAt + duration + decay + 0.02);
  });
}

export function unlockAudio() {
  return ensureUnlocked();
}

export function playUiClick() {
  playSoundAsset("uiClick", {
    fallback: () => {
      playTone({
        type: "triangle",
        frequency: 780,
        slideTo: 620,
        duration: 0.06,
        attack: 0.003,
        decay: 0.07,
        volume: 0.09
      });
      playNoise({
        duration: 0.03,
        decay: 0.03,
        volume: 0.015,
        highpass: 1800
      });
    }
  });
}

export function playHoverTick() {
  playSoundAsset("hoverTick", {
    fallback: () =>
      playTone({
        type: "sine",
        frequency: 520,
        duration: 0.03,
        attack: 0.002,
        decay: 0.03,
        volume: 0.03
      })
  });
}

export function playSelect() {
  playSoundAsset("select", {
    fallback: () =>
      playTone({
        type: "triangle",
        frequency: 540,
        slideTo: 760,
        duration: 0.11,
        attack: 0.004,
        decay: 0.11,
        volume: 0.08
      })
  });
}

export function playError() {
  playSoundAsset("error", {
    fallback: () =>
      playTone({
        type: "sawtooth",
        frequency: 280,
        slideTo: 180,
        duration: 0.12,
        attack: 0.005,
        decay: 0.16,
        volume: 0.075
      })
  });
}

export function playSuccess() {
  playSoundAsset("success", {
    fallback: () => {
      playTone({
        type: "triangle",
        frequency: 520,
        duration: 0.12,
        attack: 0.004,
        decay: 0.12,
        volume: 0.08
      });
      playTone({
        type: "triangle",
        frequency: 660,
        duration: 0.14,
        attack: 0.004,
        decay: 0.14,
        volume: 0.08,
        when: 0.08
      });
      playTone({
        type: "triangle",
        frequency: 880,
        duration: 0.18,
        attack: 0.006,
        decay: 0.18,
        volume: 0.08,
        when: 0.16
      });
    }
  });
}

export function playReward() {
  playSoundAsset("reward", {
    fallback: () => {
      [880, 1170, 1400].forEach((frequency, index) => {
        playTone({
          type: "sine",
          frequency,
          duration: 0.1,
          attack: 0.002,
          decay: 0.09,
          volume: 0.05,
          when: index * 0.05
        });
      });
    }
  });
}

export function playStep() {
  playSoundAsset("step", {
    fallback: () =>
      playTone({
        type: "square",
        frequency: 200,
        slideTo: 150,
        duration: 0.04,
        attack: 0.002,
        decay: 0.05,
        volume: 0.025
      })
  });
}

export function playTurn() {
  playSoundAsset("turn", {
    fallback: () =>
      playTone({
        type: "triangle",
        frequency: 420,
        slideTo: 520,
        duration: 0.05,
        attack: 0.003,
        decay: 0.05,
        volume: 0.03
      })
  });
}

export function playBlocked() {
  playSoundAsset("blocked", {
    fallback: () => {
      playNoise({
        duration: 0.04,
        decay: 0.06,
        volume: 0.025,
        highpass: 1200
      });
      playTone({
        type: "sawtooth",
        frequency: 190,
        slideTo: 130,
        duration: 0.06,
        attack: 0.002,
        decay: 0.06,
        volume: 0.03
      });
    }
  });
}

export function playAmbient(mode = "adventure") {
  startAmbientAsset(mode === "adventure" ? "world" : mode);
}

export function setAmbientMode(mode = "mission") {
  const ctx = getAudioContext();
  if (!ctx || !ambientGain) return;

  startAmbientAsset(mode);

  const nextValue = mode === "mission" ? 0.9 : mode === "submap" ? 0.88 : 0.82;
  ambientGain.gain.cancelScheduledValues(ctx.currentTime);
  ambientGain.gain.linearRampToValueAtTime(nextValue, ctx.currentTime + 0.8);
}

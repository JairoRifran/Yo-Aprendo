import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

/**
 * Premium particle-based wake effects: bow spray, side spray, and foam trail.
 * Uses a single THREE.Points object with a recycling particle pool.
 */

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

function createSprayTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // soft radial gradient — bright center fading to transparent
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.2, "rgba(230, 245, 255, 0.9)");
  gradient.addColorStop(0.5, "rgba(200, 235, 255, 0.4)");
  gradient.addColorStop(0.8, "rgba(180, 225, 255, 0.1)");
  gradient.addColorStop(1, "rgba(160, 220, 255, 0.0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createFoamTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // irregular foam blob
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.3, "rgba(220, 240, 255, 0.6)");
  gradient.addColorStop(0.6, "rgba(190, 230, 250, 0.25)");
  gradient.addColorStop(1, "rgba(160, 220, 245, 0.0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size / 2, size / 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Each particle stores position, velocity, life, maxLife, type, and size */
class ParticlePool {
  constructor(count) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);       // current life remaining
    this.maxLife = new Float32Array(count);     // total lifespan
    this.sizes = new Float32Array(count);       // base size
    this.types = new Uint8Array(count);         // 0=inactive, 1=spray, 2=foam, 3=bubble
    this.opacities = new Float32Array(count);

    // start all dead
    this.life.fill(0);
    this.types.fill(0);
  }

  findInactive() {
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) return i;
    }
    return -1;
  }
}

export function createWakeParticles() {
  const config = NAVIGATOR_CONFIG.boat.wakeEffects;
  const totalParticles = config.sprayCount + config.foamTrailCount;
  const pool = new ParticlePool(totalParticles);

  const sprayTexture = createSprayTexture();
  const foamTexture = createFoamTexture();

  // geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pool.positions, 3));
  const sizeAttr = new THREE.BufferAttribute(pool.sizes, 1);
  geometry.setAttribute("aSize", sizeAttr);
  const opacityAttr = new THREE.BufferAttribute(pool.opacities, 1);
  geometry.setAttribute("aOpacity", opacityAttr);

  // shader material for particles
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSprayTexture: { value: sprayTexture },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.6) }
    },
    vertexShader: `
      attribute float aSize;
      attribute float aOpacity;
      varying float vOpacity;
      uniform float uPixelRatio;

      void main() {
        vOpacity = aOpacity;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (180.0 / -mvPos.z);
        gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D uSprayTexture;
      varying float vOpacity;

      void main() {
        vec4 tex = texture2D(uSprayTexture, gl_PointCoord);
        if (tex.a * vOpacity < 0.02) discard;
        gl_FragColor = vec4(tex.rgb, tex.a * vOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 5;

  // internal state
  let lastBoatX = 0;
  let lastBoatZ = 0;
  let emitTimer = 0;

  function emitSpray(boat, speed, delta) {
    if (speed < 2.0) return;

    const speedNorm = Math.min(speed / NAVIGATOR_CONFIG.boat.maxSpeed, 1.0);
    const emitRate = 25 * speedNorm; // particles per second
    emitTimer += delta * emitRate;

    const sinY = Math.sin(boat.rotation.y);
    const cosY = Math.cos(boat.rotation.y);

    // boat bow position (front)
    const bowX = boat.position.x + sinY * (NAVIGATOR_CONFIG.boat.modelLength * 0.5);
    const bowZ = boat.position.z + cosY * (NAVIGATOR_CONFIG.boat.modelLength * 0.5);
    const waterY = boat.position.y - 0.2;

    while (emitTimer >= 1.0) {
      emitTimer -= 1.0;

      // bow spray — shoots upward and outward
      const idx = pool.findInactive();
      if (idx === -1) break;

      const sideSign = Math.random() > 0.5 ? 1 : -1;
      const spreadAngle = (Math.random() * 0.6 + 0.2) * sideSign;
      const rightX = cosY;
      const rightZ = -sinY;

      const i3 = idx * 3;
      pool.positions[i3] = bowX + rightX * spreadAngle * config.spraySpread * 0.5;
      pool.positions[i3 + 1] = waterY + Math.random() * 0.3;
      pool.positions[i3 + 2] = bowZ + rightZ * spreadAngle * config.spraySpread * 0.5;

      // velocity: upward + outward + slightly forward
      const upSpeed = (0.8 + Math.random() * 1.2) * speedNorm * config.sprayHeight;
      const sideSpeed = spreadAngle * 1.5 * speedNorm;
      pool.velocities[i3] = sinY * speed * 0.2 + rightX * sideSpeed;
      pool.velocities[i3 + 1] = upSpeed;
      pool.velocities[i3 + 2] = cosY * speed * 0.2 + rightZ * sideSpeed;

      pool.life[idx] = config.sprayLifetime * (0.6 + Math.random() * 0.4);
      pool.maxLife[idx] = pool.life[idx];
      pool.sizes[idx] = 2.5 + Math.random() * 3.5;
      pool.types[idx] = 1;
      pool.opacities[idx] = 0.55 + Math.random() * 0.35;
    }
  }

  function emitFoamTrail(boat, speed, delta) {
    if (speed < 1.5) return;

    const speedNorm = Math.min(speed / NAVIGATOR_CONFIG.boat.maxSpeed, 1.0);
    const sinY = Math.sin(boat.rotation.y);
    const cosY = Math.cos(boat.rotation.y);
    const rightX = cosY;
    const rightZ = -sinY;

    // stern position (back)
    const sternX = boat.position.x - sinY * (NAVIGATOR_CONFIG.boat.modelLength * 0.35);
    const sternZ = boat.position.z - cosY * (NAVIGATOR_CONFIG.boat.modelLength * 0.35);
    const waterY = boat.position.y - 0.55;

    // emit foam blobs at the stern
    const foamRate = 15 * speedNorm;
    const foamCount = Math.floor(delta * foamRate + Math.random() * 0.5);

    for (let f = 0; f < foamCount; f++) {
      const idx = pool.findInactive();
      if (idx === -1) break;

      const sideOffset = (Math.random() - 0.5) * 2.0;
      const i3 = idx * 3;
      pool.positions[i3] = sternX + rightX * sideOffset;
      pool.positions[i3 + 1] = waterY;
      pool.positions[i3 + 2] = sternZ + rightZ * sideOffset;

      // foam drifts backward and slightly sideways
      const driftBack = (0.3 + Math.random() * 0.5) * speedNorm;
      pool.velocities[i3] = -sinY * driftBack + rightX * sideOffset * 0.15;
      pool.velocities[i3 + 1] = 0;
      pool.velocities[i3 + 2] = -cosY * driftBack + rightZ * sideOffset * 0.15;

      pool.life[idx] = config.foamLifetime * (0.5 + Math.random() * 0.5);
      pool.maxLife[idx] = pool.life[idx];
      pool.sizes[idx] = 4.0 + Math.random() * 5.0;
      pool.types[idx] = 2;
      pool.opacities[idx] = 0.35 + Math.random() * 0.25;
    }
  }

  function emitSideSplash(boat, speed, turnRate) {
    if (speed < 3.0 || Math.abs(turnRate) < 0.3) return;

    const speedNorm = Math.min(speed / NAVIGATOR_CONFIG.boat.maxSpeed, 1.0);
    const sinY = Math.sin(boat.rotation.y);
    const cosY = Math.cos(boat.rotation.y);
    const rightX = cosY;
    const rightZ = -sinY;

    // splash on the outer side of the turn
    const sideSign = turnRate > 0 ? -1 : 1;
    const hullSideX = boat.position.x + rightX * sideSign * 1.2;
    const hullSideZ = boat.position.z + rightZ * sideSign * 1.2;
    const waterY = boat.position.y;

    const idx = pool.findInactive();
    if (idx === -1) return;

    const i3 = idx * 3;
    pool.positions[i3] = hullSideX;
    pool.positions[i3 + 1] = waterY;
    pool.positions[i3 + 2] = hullSideZ;

    pool.velocities[i3] = rightX * sideSign * 2.0 * speedNorm;
    pool.velocities[i3 + 1] = (0.6 + Math.random() * 0.8) * speedNorm;
    pool.velocities[i3 + 2] = rightZ * sideSign * 2.0 * speedNorm;

    pool.life[idx] = 0.8 + Math.random() * 0.5;
    pool.maxLife[idx] = pool.life[idx];
    pool.sizes[idx] = 3.0 + Math.random() * 2.5;
    pool.types[idx] = 1;
    pool.opacities[idx] = 0.5 + Math.random() * 0.3;
  }

  function updateParticles(delta) {
    const gravity = -4.5;
    const drag = 0.96;
    const posAttr = geometry.attributes.position;
    const sizeA = geometry.attributes.aSize;
    const opacityA = geometry.attributes.aOpacity;

    for (let i = 0; i < pool.count; i++) {
      if (pool.life[i] <= 0) {
        // keep dead particles far away
        const i3 = i * 3;
        pool.positions[i3 + 1] = -100;
        pool.opacities[i] = 0;
        continue;
      }

      pool.life[i] -= delta;
      const lifeRatio = Math.max(0, pool.life[i] / pool.maxLife[i]);
      const i3 = i * 3;

      if (pool.types[i] === 1) {
        // spray: affected by gravity
        pool.velocities[i3 + 1] += gravity * delta;
        pool.positions[i3] += pool.velocities[i3] * delta;
        pool.positions[i3 + 1] += pool.velocities[i3 + 1] * delta;
        pool.positions[i3 + 2] += pool.velocities[i3 + 2] * delta;

        // kill if hits water
        if (pool.positions[i3 + 1] < 0.3) {
          pool.life[i] = 0;
        }

        pool.velocities[i3] *= drag;
        pool.velocities[i3 + 2] *= drag;

        // fade out as life decreases
        pool.opacities[i] = lifeRatio * lifeRatio * pool.opacities[i];
        pool.sizes[i] = pool.sizes[i] * (0.8 + lifeRatio * 0.2);
      } else if (pool.types[i] === 2) {
        // foam: stays on water, drifts, fades and grows
        pool.positions[i3] += pool.velocities[i3] * delta;
        pool.positions[i3 + 2] += pool.velocities[i3 + 2] * delta;

        pool.velocities[i3] *= 0.985;
        pool.velocities[i3 + 2] *= 0.985;

        // foam grows slightly as it dissipates
        pool.sizes[i] += delta * 0.8;

        // smooth fade: full opacity → 0
        pool.opacities[i] = lifeRatio * lifeRatio * 0.4;
      }

      if (pool.life[i] <= 0) {
        pool.types[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    sizeA.needsUpdate = true;
    opacityA.needsUpdate = true;
  }

  // track turn rate
  let prevYaw = 0;

  const group = new THREE.Group();
  group.add(points);

  group.userData.update = (elapsed, boat, navigationState, delta) => {
    if (!boat || !navigationState) return;

    const speed = Math.abs(navigationState.speed || 0);
    const currentYaw = boat.rotation.y;
    const turnRate = (currentYaw - prevYaw) / Math.max(delta, 0.001);
    prevYaw = currentYaw;

    emitSpray(boat, speed, delta);
    emitFoamTrail(boat, speed, delta);
    emitSideSplash(boat, speed, turnRate);
    updateParticles(delta);
  };

  group.userData.dispose = () => {
    geometry.dispose();
    material.dispose();
    sprayTexture.dispose();
    foamTexture.dispose();
  };

  return group;
}

import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "../../config.js";

const WATER_ASSET_PATH = "./assets/three/waterSky/";
const FAR_BOAT_POSITION = 10000;
const textureLoader = new THREE.TextureLoader();

function sampleWaveHeight(x, z, elapsed) {
  const waveA = Math.sin(x * 0.075 + elapsed * 1.05) * 0.34;
  const waveB = Math.cos(z * 0.105 - elapsed * 1.35) * 0.28;
  const swell = Math.sin((x + z) * 0.038 + elapsed * 0.58) * 0.66;
  const ripple = Math.sin((x * 0.26 - z * 0.16) + elapsed * 2.15) * 0.08;
  return waveA + waveB + swell + ripple;
}

function configureTexture(texture, { color = false, repeat = [1, 1] } = {}) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 4;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSkyDome() {
  const geometry = new THREE.SphereGeometry(540, 48, 24);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x4cc9f0) },
      uMid: { value: new THREE.Color(0x9feaff) },
      uHorizon: { value: new THREE.Color(0xffedbb) },
      uSun: { value: new THREE.Color(0xfff4b5) },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec3 vWorld;

      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = normalize(world.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      uniform float uTime;
      varying vec3 vWorld;

      void main() {
        float height = clamp(vWorld.y * 0.5 + 0.5, 0.0, 1.0);
        float horizon = smoothstep(0.18, 0.52, height);
        vec3 color = mix(uHorizon, uMid, horizon);
        color = mix(color, uTop, smoothstep(0.55, 1.0, height) * 0.76);
        vec3 sunDir = normalize(vec3(-0.38, 0.32, -0.86));
        float sun = pow(max(dot(vWorld, sunDir), 0.0), 520.0);
        float glow = pow(max(dot(vWorld, sunDir), 0.0), 12.0);
        float cloudA = sin(vWorld.x * 26.0 + vWorld.z * 11.0 + uTime * 0.025) * 0.5 + 0.5;
        float cloudB = sin(vWorld.x * -13.0 + vWorld.z * 18.0 - uTime * 0.02) * 0.5 + 0.5;
        float clouds = smoothstep(0.72, 0.96, cloudA * cloudB) * smoothstep(0.22, 0.48, height) * (1.0 - smoothstep(0.56, 0.82, height));
        color = mix(color, vec3(1.0, 0.97, 0.86), clouds * 0.13);
        color += uSun * (sun * 1.3 + glow * 0.12);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -10;
  return sky;
}

function createWaterPlane(textures) {
  const geometry = new THREE.PlaneGeometry(
    NAVIGATOR_CONFIG.world.oceanSize,
    NAVIGATOR_CONFIG.world.oceanSize,
    210,
    210
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x024b82) },
      uMid: { value: new THREE.Color(0x0792bd) },
      uShallow: { value: new THREE.Color(0x58e5ee) },
      uSun: { value: new THREE.Color(0xffeda2) },
      uNormalMap: { value: textures.normal },
      uFoamMap: { value: textures.foam },
      uCausticsMap: { value: textures.caustics },
      uBoatPos: { value: new THREE.Vector2(FAR_BOAT_POSITION, FAR_BOAT_POSITION) },
      uBoatForward: { value: new THREE.Vector2(0, 1) },
      uBoatSpeed: { value: 0 },
      uWakeStrength: { value: NAVIGATOR_CONFIG.boat.wakeStrength }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uBoatPos;
      uniform vec2 uBoatForward;
      uniform float uBoatSpeed;
      uniform float uWakeStrength;
      varying vec2 vUv;
      varying float vWave;
      varying vec3 vWorld;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float waveA = sin(pos.x * 0.075 + uTime * 1.05) * 0.34;
        float waveB = cos(pos.y * 0.105 - uTime * 1.35) * 0.28;
        float swell = sin((pos.x + pos.y) * 0.038 + uTime * 0.58) * 0.66;
        float ripple = sin((pos.x * 0.26 - pos.y * 0.16) + uTime * 2.15) * 0.08;

        vec2 toPoint = pos.xy - uBoatPos;
        vec2 forward = normalize(uBoatForward);
        float longitudinal = dot(toPoint, forward);
        float behind = -longitudinal;
        float side = abs(dot(toPoint, vec2(forward.y, -forward.x)));
        float speedFactor = clamp(uBoatSpeed / 9.0, 0.0, 1.0) * uWakeStrength;
        float rearMask = smoothstep(0.8, 5.5, behind);
        float wakeTrail = exp(-side * side * 0.18) * rearMask * (1.0 - smoothstep(24.0, 46.0, behind));
        float bowPush = exp(-dot(toPoint, toPoint) * 0.2) * (1.0 - smoothstep(0.5, 2.2, abs(longitudinal)));
        float wakeRipple = sin(behind * 2.3 - uTime * 5.2) * 0.24;

        pos.z += waveA + waveB + swell + ripple + (wakeTrail * wakeRipple + bowPush * 0.08) * speedFactor;
        vWave = pos.z;
        vWorld = (modelMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uMid;
      uniform vec3 uShallow;
      uniform vec3 uSun;
      uniform sampler2D uNormalMap;
      uniform sampler2D uFoamMap;
      uniform sampler2D uCausticsMap;
      uniform vec2 uBoatPos;
      uniform vec2 uBoatForward;
      uniform float uBoatSpeed;
      uniform float uWakeStrength;
      varying vec2 vUv;
      varying float vWave;
      varying vec3 vWorld;

      void main() {
        vec2 worldUv = vWorld.xz * 0.018;
        vec2 flowA = vec2(uTime * 0.018, -uTime * 0.012);
        vec2 flowB = vec2(-uTime * 0.01, uTime * 0.016);
        vec3 normalA = texture2D(uNormalMap, worldUv + flowA).rgb * 2.0 - 1.0;
        vec3 normalB = texture2D(uNormalMap, worldUv * 1.7 + flowB).rgb * 2.0 - 1.0;
        vec3 waterNormal = normalize(vec3((normalA.xy + normalB.xy) * 0.34, 1.0));

        float horizon = smoothstep(0.06, 1.0, vUv.y);
        float depth = smoothstep(-0.65, 1.15, vWave + waterNormal.x * 0.35);
        vec2 foamUv = vWorld.xz * 0.026 + waterNormal.xy * 0.055;
        float textureFoam = texture2D(uFoamMap, foamUv + vec2(uTime * 0.012, -uTime * 0.01)).r;
        float caustics = texture2D(uCausticsMap, vWorld.xz * 0.015 + vec2(-uTime * 0.018, uTime * 0.014)).r;

        vec2 toPoint = vWorld.xz - uBoatPos;
        vec2 forward = normalize(uBoatForward);
        float longitudinal = dot(toPoint, forward);
        float behind = -longitudinal;
        float side = abs(dot(toPoint, vec2(forward.y, -forward.x)));
        float rearMask = smoothstep(1.2, 6.0, behind);
        float trailFade = 1.0 - smoothstep(20.0, 48.0, behind);
        float wakeTrail = exp(-side * side * 0.115) * rearMask * trailFade;
        float bowFoam = exp(-dot(toPoint, toPoint) * 0.2) * (1.0 - smoothstep(0.4, 2.0, abs(longitudinal))) * 0.18;
        float wakeWave = sin(behind * 2.25 - uTime * 5.0) * 0.5 + 0.5;
        float boatWake = (wakeTrail * wakeWave + bowFoam) * clamp(uBoatSpeed / 9.0, 0.0, 1.0) * uWakeStrength;

        float crestFoam = smoothstep(0.78, 1.22, abs(vWave) + textureFoam * 0.22);
        float foam = max(crestFoam * 0.22, boatWake);
        vec3 color = mix(uDeep, uMid, horizon * 0.8 + depth * 0.2);
        color = mix(color, uShallow, depth * 0.24 + caustics * 0.07 + foam * 0.24);
        float sunPath = pow(max(0.0, 1.0 - abs(vUv.x - 0.56) * 2.2), 3.0) * smoothstep(0.26, 0.92, vUv.y);
        float fresnel = pow(1.0 - clamp(waterNormal.z, 0.0, 1.0), 1.8);
        color += uSun * sunPath * 0.13;
        color += vec3(0.72, 0.96, 1.0) * foam * 0.34;
        color += vec3(0.1, 0.32, 0.34) * caustics * 0.055;
        color += vec3(0.15, 0.3, 0.34) * fresnel * 0.18;
        color *= 0.88 + sin((vWorld.x + vWorld.z) * 0.07) * 0.028;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const water = new THREE.Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  return water;
}

export function createWaterSkyEnvironment() {
  const group = new THREE.Group();
  const textures = {
    normal: configureTexture(textureLoader.load(`${WATER_ASSET_PATH}waterNormal.png`), { repeat: [10, 10] }),
    foam: configureTexture(textureLoader.load(`${WATER_ASSET_PATH}waterFoam.png`), { color: true, repeat: [8, 8] }),
    caustics: configureTexture(textureLoader.load(`${WATER_ASSET_PATH}waterCaustics.png`), { color: true, repeat: [7, 7] })
  };

  const sky = createSkyDome();
  const water = createWaterPlane(textures);
  group.add(sky, water);

  group.userData.update = (elapsed, boat, navigationState) => {
    sky.material.uniforms.uTime.value = elapsed;
    water.material.uniforms.uTime.value = elapsed;
    if (boat) {
      water.material.uniforms.uBoatPos.value.set(boat.position.x, boat.position.z);
      water.material.uniforms.uBoatForward.value.set(Math.sin(boat.rotation.y), Math.cos(boat.rotation.y));
      water.material.uniforms.uBoatSpeed.value = Math.abs(navigationState?.speed || 0);
    } else {
      water.material.uniforms.uBoatPos.value.set(FAR_BOAT_POSITION, FAR_BOAT_POSITION);
      water.material.uniforms.uBoatSpeed.value = 0;
    }
  };

  group.userData.getHeight = sampleWaveHeight;
  group.userData.dispose = () => {
    textures.normal.dispose();
    textures.foam.dispose();
    textures.caustics.dispose();
  };

  return group;
}

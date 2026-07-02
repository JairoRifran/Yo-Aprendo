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
      uTop: { value: new THREE.Color(0x187bcd) },
      uMid: { value: new THREE.Color(0x56cbf9) },
      uHorizon: { value: new THREE.Color(0xfff2d6) },
      uSun: { value: new THREE.Color(0xfff5c0) },
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

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.52;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.15 + vec2(0.12, 0.28);
          a *= 0.48;
        }
        return v;
      }

      void main() {
        float height = clamp(vWorld.y * 0.6 + 0.4, 0.0, 1.0);
        float horizon = smoothstep(0.12, 0.55, height);
        vec3 color = mix(uHorizon, uMid, horizon);
        color = mix(color, uTop, smoothstep(0.52, 1.0, height) * 0.82);
        
        vec3 sunDir = normalize(vec3(-0.38, 0.35, -0.85));
        float sunDot = max(dot(vWorld, sunDir), 0.0);
        float sunCore = pow(sunDot, 640.0);
        float sunGlow = pow(sunDot, 18.0) * 0.4 + pow(sunDot, 4.5) * 0.18;
        
        if (vWorld.y > 0.04) {
          vec2 cloudUv = vWorld.xz / (vWorld.y + 0.14) * 2.2 + vec2(uTime * 0.018, uTime * 0.009);
          float cloudNoise = fbm(cloudUv);
          float cloudDensity = smoothstep(0.42, 0.78, cloudNoise) * smoothstep(0.04, 0.32, vWorld.y);
          vec3 cloudColor = mix(vec3(0.96, 0.98, 1.0), vec3(1.0, 0.92, 0.76), pow(sunDot, 2.5) * 0.85);
          color = mix(color, cloudColor, cloudDensity * 0.75);
        }

        float rayAngle = atan(vWorld.y - sunDir.y, vWorld.x - sunDir.x);
        float godRays = sin(rayAngle * 11.0 + uTime * 0.12) * sin(rayAngle * 17.0 - uTime * 0.08) * 0.5 + 0.5;
        float rayMask = pow(sunDot, 5.0) * (1.0 - smoothstep(0.4, 0.88, height));
        color += uSun * godRays * rayMask * 0.22;

        color += uSun * (sunCore * 1.5 + sunGlow);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -10;
  return sky;
}

function createVolumetricCloudsGroup() {
  const cloudsGroup = new THREE.Group();
  
  const cloudMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(-0.38, 0.35, -0.85).normalize() },
      uSunColor: { value: new THREE.Color(0xfff8e7) },
      uSkyColor: { value: new THREE.Color(0xdceeff) },
      uShadowColor: { value: new THREE.Color(0x8bc4e8) }
    },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vPosWorld;
      void main() {
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vPosWorld = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyColor;
      uniform vec3 uShadowColor;
      varying vec3 vNormalWorld;
      varying vec3 vPosWorld;

      void main() {
        vec3 norm = normalize(vNormalWorld);
        float sunDot = max(dot(norm, uSunDir), 0.0);
        float upDot = clamp(norm.y * 0.6 + 0.4, 0.0, 1.0);
        
        vec3 color = mix(uShadowColor, uSkyColor, upDot);
        color = mix(color, uSunColor, pow(sunDot, 1.8) * 0.65);
        
        vec3 viewDir = normalize(cameraPosition - vPosWorld);
        float rim = 1.0 - max(dot(norm, viewDir), 0.0);
        color += uSunColor * pow(clamp(rim, 0.0, 1.0), 3.0) * 0.3;

        gl_FragColor = vec4(color, 0.92);
      }
    `
  });

  const puffGeo = new THREE.SphereGeometry(1, 14, 10);
  const clusterCount = 18;

  for (let i = 0; i < clusterCount; i++) {
    const cluster = new THREE.Group();
    const puffCount = 6 + Math.floor(Math.random() * 5);
    const baseScale = 14 + Math.random() * 18;

    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(puffGeo, cloudMaterial);
      const scaleX = baseScale * (0.6 + Math.random() * 0.7);
      const scaleY = baseScale * (0.35 + Math.random() * 0.35);
      const scaleZ = baseScale * (0.5 + Math.random() * 0.6);
      puff.scale.set(scaleX, scaleY, scaleZ);

      const offsetX = (Math.random() - 0.5) * baseScale * 1.6;
      const offsetY = (Math.random() - 0.3) * baseScale * 0.4;
      const offsetZ = (Math.random() - 0.5) * baseScale * 1.4;
      puff.position.set(offsetX, offsetY, offsetZ);

      cluster.add(puff);
    }

    const angle = (i / clusterCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const distance = 140 + Math.random() * 260;
    cluster.position.set(
      Math.cos(angle) * distance,
      75 + Math.random() * 65,
      Math.sin(angle) * distance
    );
    cluster.rotation.y = Math.random() * Math.PI * 2;

    cluster.userData = {
      speedX: 1.8 + Math.random() * 2.2,
      speedZ: (Math.random() - 0.5) * 0.8,
      baseY: cluster.position.y,
      bobSpeed: 0.35 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2
    };

    cloudsGroup.add(cluster);
  }

  return { cloudsGroup, puffGeo, cloudMaterial };
}

function createWaterPlane(textures) {
  const geometry = new THREE.PlaneGeometry(
    NAVIGATOR_CONFIG.world.oceanSize,
    NAVIGATOR_CONFIG.world.oceanSize,
    210,
    210
  );

  const wakeConfig = NAVIGATOR_CONFIG.boat.wakeEffects;

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
      uWakeStrength: { value: NAVIGATOR_CONFIG.boat.wakeStrength },
      uKelvinAngle: { value: wakeConfig.kelvinAngle },
      uBowWaveIntensity: { value: wakeConfig.bowWaveIntensity },
      uTurbulenceStrength: { value: wakeConfig.turbulenceStrength }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uBoatPos;
      uniform vec2 uBoatForward;
      uniform float uBoatSpeed;
      uniform float uWakeStrength;
      uniform float uKelvinAngle;
      uniform float uBowWaveIntensity;
      uniform float uTurbulenceStrength;
      varying vec2 vUv;
      varying float vWave;
      varying vec3 vWorld;
      varying float vWakeIntensity;
      varying float vBowZone;

      // simple pseudo-noise for turbulence
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        vUv = uv;
        vec3 pos = position;

        // ---- natural ocean waves (unchanged) ----
        float waveA = sin(pos.x * 0.075 + uTime * 1.05) * 0.34;
        float waveB = cos(pos.y * 0.105 - uTime * 1.35) * 0.28;
        float swell = sin((pos.x + pos.y) * 0.038 + uTime * 0.58) * 0.66;
        float ripple = sin((pos.x * 0.26 - pos.y * 0.16) + uTime * 2.15) * 0.08;

        // ---- boat wake system ----
        vec2 toPoint = pos.xy - uBoatPos;
        vec2 forward = normalize(uBoatForward);
        vec2 right = vec2(forward.y, -forward.x);
        float longitudinal = dot(toPoint, forward);
        float lateral = dot(toPoint, right);
        float behind = -longitudinal;
        float side = abs(lateral);
        float speedFactor = clamp(uBoatSpeed / 9.0, 0.0, 1.0) * uWakeStrength;

        // -- bow wave: pushes water up at the front --
        float bowDist = length(toPoint);
        float bowMask = exp(-bowDist * bowDist * 0.12) * smoothstep(-1.0, 2.5, longitudinal);
        float bowWave = bowMask * uBowWaveIntensity * 0.35;

        // -- central depression: water sinks directly behind boat --
        float centralMask = exp(-side * side * 0.28) * smoothstep(0.5, 3.0, behind) * (1.0 - smoothstep(8.0, 22.0, behind));
        float depression = -centralMask * 0.18;

        // -- Kelvin V-wake: waves spreading at angle from stern --
        float rearMask = smoothstep(0.8, 5.5, behind);
        float trailFadeV = 1.0 - smoothstep(18.0, 62.0, behind);

        // primary V-arms
        float armAngle = uKelvinAngle;
        float leftArm = abs(lateral - behind * armAngle);
        float rightArm = abs(lateral + behind * armAngle);
        float vWakeLeft = exp(-leftArm * leftArm * 0.5) * rearMask * trailFadeV;
        float vWakeRight = exp(-rightArm * rightArm * 0.5) * rearMask * trailFadeV;
        float vWake = (vWakeLeft + vWakeRight) * 0.3;

        // transverse waves along V-arms
        float transverseWave = sin(behind * 1.8 - uTime * 4.5) * 0.18;
        float vWakeDisplacement = vWake * transverseWave;

        // -- central wake trail with ripples --
        float wakeTrail = exp(-side * side * 0.18) * rearMask * (1.0 - smoothstep(24.0, 46.0, behind));
        float wakeRipple = sin(behind * 2.3 - uTime * 5.2) * 0.24;

        // -- turbulence directly behind the boat --
        float turbZone = exp(-side * side * 0.4) * smoothstep(1.0, 4.0, behind) * (1.0 - smoothstep(6.0, 16.0, behind));
        float turbNoise = hash(pos.xy * 0.5 + uTime * 2.0) * 2.0 - 1.0;
        float turbulence = turbZone * turbNoise * uTurbulenceStrength * 0.12;

        // -- divergent side waves --
        float divWaveLeft = sin((lateral - behind * 0.15) * 1.4 + uTime * 3.0) * 0.08;
        float divWaveRight = sin((-lateral - behind * 0.15) * 1.4 + uTime * 3.0) * 0.08;
        float divMask = smoothstep(2.0, 6.0, behind) * (1.0 - smoothstep(30.0, 50.0, behind))
                       * smoothstep(1.5, 4.0, side) * (1.0 - smoothstep(8.0, 18.0, side));
        float divergentWaves = (divWaveLeft + divWaveRight) * divMask;

        // combine all wake effects
        float wakeTotal = (wakeTrail * wakeRipple + bowWave + depression + vWakeDisplacement + turbulence + divergentWaves) * speedFactor;

        pos.z += waveA + waveB + swell + ripple + wakeTotal;
        vWave = pos.z;
        vWorld = (modelMatrix * vec4(pos, 1.0)).xyz;

        // pass wake intensity to fragment for foam
        vWakeIntensity = (wakeTrail + vWake + turbZone * 0.8) * speedFactor;
        vBowZone = bowMask * speedFactor;

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
      uniform float uKelvinAngle;
      uniform float uTurbulenceStrength;
      varying vec2 vUv;
      varying float vWave;
      varying vec3 vWorld;
      varying float vWakeIntensity;
      varying float vBowZone;

      // procedural noise for foam dissolve
      float hash2D(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noisePattern(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash2D(i);
        float b = hash2D(i + vec2(1.0, 0.0));
        float c = hash2D(i + vec2(0.0, 1.0));
        float d = hash2D(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

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

        // ---- enhanced boat wake foam ----
        vec2 toPoint = vWorld.xz - uBoatPos;
        vec2 forward = normalize(uBoatForward);
        vec2 right = vec2(forward.y, -forward.x);
        float longitudinal = dot(toPoint, forward);
        float lateral = dot(toPoint, right);
        float behind = -longitudinal;
        float side = abs(lateral);
        float speedNorm = clamp(uBoatSpeed / 9.0, 0.0, 1.0);

        // bow foam — bright white splash at the front
        float bowFoam = vBowZone * 0.65;

        // central turbulent foam — churning water directly behind
        float turbZone = exp(-side * side * 0.35) * smoothstep(1.0, 4.0, behind) * (1.0 - smoothstep(6.0, 18.0, behind));
        float turbNoise = noisePattern(vWorld.xz * 1.8 + uTime * 1.5);
        float turbFoam = turbZone * turbNoise * uTurbulenceStrength * speedNorm * uWakeStrength * 0.7;

        // Kelvin V-pattern foam lines
        float rearMask = smoothstep(1.2, 6.0, behind);
        float trailFade = 1.0 - smoothstep(20.0, 58.0, behind);
        float leftArm = abs(lateral - behind * uKelvinAngle);
        float rightArm = abs(lateral + behind * uKelvinAngle);
        float vFoamLeft = exp(-leftArm * leftArm * 0.7) * rearMask * trailFade;
        float vFoamRight = exp(-rightArm * rightArm * 0.7) * rearMask * trailFade;
        float vFoam = (vFoamLeft + vFoamRight) * speedNorm * uWakeStrength * 0.35;

        // foam dissolve with noise — makes edges look organic
        float dissolveNoise = noisePattern(vWorld.xz * 3.5 - uTime * 0.3);
        float wakeWave = sin(behind * 2.25 - uTime * 5.0) * 0.5 + 0.5;

        // central trail foam (original but enhanced)
        float centralTrail = exp(-side * side * 0.115) * rearMask * trailFade;
        float centralFoam = centralTrail * wakeWave * speedNorm * uWakeStrength * 0.4;

        // combine all foam sources
        float totalBoatFoam = bowFoam + turbFoam + vFoam + centralFoam;
        // apply dissolve — foam breaks into patches at the edges
        totalBoatFoam *= smoothstep(0.08, 0.35, totalBoatFoam + dissolveNoise * 0.15);

        // natural wave crest foam
        float crestFoam = smoothstep(0.78, 1.22, abs(vWave) + textureFoam * 0.22);
        float foam = max(crestFoam * 0.22, totalBoatFoam);

        // ---- color composition ----
        vec3 color = mix(uDeep, uMid, horizon * 0.8 + depth * 0.2);
        color = mix(color, uShallow, depth * 0.24 + caustics * 0.07 + foam * 0.24);

        // aerated water in the wake — lighter turquoise tint
        float aeratedZone = (turbZone + centralTrail * 0.3) * speedNorm * uWakeStrength;
        color = mix(color, vec3(0.42, 0.82, 0.88), aeratedZone * 0.18);

        float sunPath = pow(max(0.0, 1.0 - abs(vUv.x - 0.56) * 2.2), 3.0) * smoothstep(0.26, 0.92, vUv.y);
        float fresnel = pow(1.0 - clamp(waterNormal.z, 0.0, 1.0), 1.8);
        color += uSun * sunPath * 0.13;

        // foam rendering — bright white with slight blue tint
        vec3 foamColor = mix(vec3(0.88, 0.96, 1.0), vec3(1.0, 1.0, 1.0), foam);
        color += foamColor * foam * 0.42;

        // extra sparkle in bow foam
        float sparkle = pow(dissolveNoise, 8.0) * bowFoam * 0.6;
        color += vec3(1.0, 0.98, 0.92) * sparkle;

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
  const { cloudsGroup, puffGeo, cloudMaterial } = createVolumetricCloudsGroup();
  const water = createWaterPlane(textures);
  group.add(sky, cloudsGroup, water);

  group.userData.update = (elapsed, boat, navigationState) => {
    sky.material.uniforms.uTime.value = elapsed;
    water.material.uniforms.uTime.value = elapsed;
    cloudsGroup.children.forEach((cluster) => {
      cluster.position.x += cluster.userData.speedX * 0.016;
      cluster.position.z += cluster.userData.speedZ * 0.016;
      cluster.position.y = cluster.userData.baseY + Math.sin(elapsed * cluster.userData.bobSpeed + cluster.userData.phase) * 2.2;
      if (cluster.position.x > 450) cluster.position.x = -450;
      if (cluster.position.x < -450) cluster.position.x = 450;
      if (cluster.position.z > 450) cluster.position.z = -450;
      if (cluster.position.z < -450) cluster.position.z = 450;
    });

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
    puffGeo.dispose();
    cloudMaterial.dispose();
  };

  return group;
}

import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

export function createWater() {
  const geometry = new THREE.PlaneGeometry(
    NAVIGATOR_CONFIG.world.oceanSize,
    NAVIGATOR_CONFIG.world.oceanSize,
    120,
    120
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x087eb9) },
      uShallow: { value: new THREE.Color(0x66e6ff) }
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float waveA = sin((pos.x * 0.18) + uTime * 1.3) * 0.42;
        float waveB = cos((pos.y * 0.22) - uTime * 1.7) * 0.28;
        float swell = sin((pos.x + pos.y) * 0.08 + uTime * 0.8) * 0.52;
        pos.z += waveA + waveB + swell;
        vWave = pos.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        float depth = smoothstep(0.08, 0.94, vUv.y);
        float foam = smoothstep(0.48, 0.92, abs(vWave));
        vec3 color = mix(uDeep, uShallow, depth * 0.72 + foam * 0.22);
        color += vec3(0.05, 0.12, 0.13) * foam;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const water = new THREE.Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  water.userData.update = (elapsed) => {
    material.uniforms.uTime.value = elapsed;
  };
  return water;
}

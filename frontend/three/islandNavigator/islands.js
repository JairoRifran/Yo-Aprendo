import * as THREE from "three";
import { NAVIGATOR_CONFIG } from "./config.js";

function makePalm() {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 2.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x9b6231, roughness: 0.85 })
  );
  trunk.position.y = 1.15;
  trunk.rotation.z = -0.14;
  trunk.castShadow = true;
  palm.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2fc472, roughness: 0.68 });
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.55, 5), leafMat);
    leaf.position.y = 2.45;
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = (Math.PI * 2 * i) / 6;
    leaf.castShadow = true;
    palm.add(leaf);
  }
  return palm;
}

function makeHut() {
  const hut = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.9, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xffdb8a, roughness: 0.72 })
  );
  body.position.y = 0.75;
  body.castShadow = true;
  hut.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xd9783a, roughness: 0.78 })
  );
  roof.position.y = 1.55;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  hut.add(roof);
  return hut;
}

function makeLighthouse(accent) {
  const lighthouse = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.42, 2.4, 14),
    new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.52 })
  );
  tower.position.y = 1.28;
  tower.castShadow = true;
  lighthouse.add(tower);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.38, 0.36, 14),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45, emissive: accent, emissiveIntensity: 0.12 })
  );
  cap.position.y = 2.65;
  cap.castShadow = true;
  lighthouse.add(cap);

  const beam = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfff0a8, emissive: 0xffd65c, emissiveIntensity: 1.7 })
  );
  beam.position.y = 2.93;
  lighthouse.add(beam);
  return lighthouse;
}

function createIslandShell(mission, index, missionState) {
  const layout = NAVIGATOR_CONFIG.islands[index % NAVIGATOR_CONFIG.islands.length];
  const group = new THREE.Group();
  group.position.set(layout.x, 0, layout.z);
  group.scale.setScalar(layout.scale);
  group.userData = { mission, missionState, layout };

  const sand = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 4.3, 1.15, 32),
    new THREE.MeshStandardMaterial({ color: 0xf5d98b, roughness: 0.95 })
  );
  sand.position.y = 0.12;
  sand.castShadow = true;
  sand.receiveShadow = true;
  group.add(sand);

  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.95, 0.52, 32),
    new THREE.MeshStandardMaterial({
      color: missionState === "locked" ? 0x8aa090 : layout.accent,
      roughness: 0.78
    })
  );
  grass.position.y = 0.94;
  grass.castShadow = true;
  grass.receiveShadow = true;
  group.add(grass);

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(3.55, 0.045, 8, 72),
    new THREE.MeshStandardMaterial({
      color: missionState === "locked" ? 0x9fb2c6 : 0xffeb8a,
      emissive: missionState === "locked" ? 0x000000 : 0xffd861,
      emissiveIntensity: missionState === "locked" ? 0 : 0.55
    })
  );
  marker.position.y = 1.24;
  marker.rotation.x = Math.PI / 2;
  group.add(marker);
  group.userData.marker = marker;

  if (layout.deco === "hut") {
    const hut = makeHut();
    hut.position.set(-0.2, 1.2, 0.1);
    group.add(hut);
  } else if (layout.deco === "lighthouse") {
    const lighthouse = makeLighthouse(layout.accent);
    lighthouse.position.set(-0.25, 1.05, 0.15);
    group.add(lighthouse);
  } else {
    const palmA = makePalm();
    palmA.position.set(-0.9, 1.05, 0.45);
    palmA.rotation.y = 0.4;
    group.add(palmA);
    const palmB = makePalm();
    palmB.position.set(0.85, 1.03, -0.2);
    palmB.scale.setScalar(0.78);
    palmB.rotation.y = -0.7;
    group.add(palmB);
  }

  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(4.5, 4.5, 3, 24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.y = 1.4;
  hit.userData.isIslandHit = true;
  hit.userData.island = group;
  group.add(hit);
  group.userData.hit = hit;

  return group;
}

export function createIslands(world, getMissionState) {
  const group = new THREE.Group();
  const islands = world.missions.map((mission, index) => {
    const missionState = getMissionState(world, index);
    const island = createIslandShell(mission, index, missionState);
    group.add(island);
    return island;
  });

  return { group, islands };
}

export function updateIslands(islands, elapsed) {
  islands.forEach((island, index) => {
    const marker = island.userData.marker;
    if (marker) {
      marker.rotation.z = elapsed * 0.35 + index * 0.4;
      marker.position.y = 1.22 + Math.sin(elapsed * 1.8 + index) * 0.06;
    }
  });
}

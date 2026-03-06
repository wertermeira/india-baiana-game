import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { PALETTE, TRAFFIC_CONFIG, WORLD_CONFIG } from './config.js';
import { chance, choice, clamp, rand, randInt } from './utils.js';
import { createVehicleModel } from './vehicle-models.js';

function laneCenter(laneIndex) {
  const roadWidth = WORLD_CONFIG.laneCount * WORLD_CONFIG.laneWidth;
  return -roadWidth / 2 + WORLD_CONFIG.laneWidth * laneIndex + WORLD_CONFIG.laneWidth / 2;
}

function pickType(difficulty) {
  const motoChance = clamp(
    TRAFFIC_CONFIG.motoChanceBase + difficulty * TRAFFIC_CONFIG.motoChanceRamp,
    TRAFFIC_CONFIG.motoChanceBase,
    0.4
  );

  if (chance(motoChance)) {
    return 'moto';
  }

  return chance(0.24) ? 'pickup' : 'car';
}

function pickBehavior(type, difficulty) {
  const chaosChance = clamp(
    TRAFFIC_CONFIG.chaosBaseChance + difficulty * TRAFFIC_CONFIG.chaosRamp,
    TRAFFIC_CONFIG.chaosBaseChance,
    0.72
  );
  const wrongWayChance = clamp(
    TRAFFIC_CONFIG.wrongWayBaseChance + difficulty * TRAFFIC_CONFIG.wrongWayRamp,
    TRAFFIC_CONFIG.wrongWayBaseChance,
    0.24
  );

  if (chance(wrongWayChance)) {
    return 'wrongWay';
  }

  if (!chance(chaosChance)) {
    return chance(0.38) ? 'slow' : 'normal';
  }

  if (type === 'moto' && chance(0.45)) {
    return 'swerve';
  }

  return choice(['slow', 'swerve', 'suddenStop', 'normal']);
}

function createNPCVehicle(type) {
  const palette = type === 'pickup' ? PALETTE.pickup : type === 'moto' ? PALETTE.moto : PALETTE.car;
  const bodyColor = choice(palette);

  return createVehicleModel({
    type,
    bodyColor,
    cabinColor: 0xe5f1ff,
    trimColor: 0x202020,
    accentColor: 0xffef9c,
  });
}

export function createTrafficSystem(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const vehicles = [];
  let spawnTimer = 0;

  function createVehicle(difficulty) {
    const type = pickType(difficulty);
    const behavior = pickBehavior(type, difficulty);
    const { group: mesh, halfWidth, halfDepth } = createNPCVehicle(type);

    const occupiedLanes = new Set(
      vehicles
        .filter((vehicle) => Math.abs(vehicle.mesh.position.z - TRAFFIC_CONFIG.spawnZMax) < TRAFFIC_CONFIG.minSpawnGapZ)
        .map((vehicle) => vehicle.lane)
    );
    const availableLanes = Array.from({ length: WORLD_CONFIG.laneCount }, (_, index) => index).filter(
      (lane) => !occupiedLanes.has(lane)
    );
    const lane = choice(availableLanes.length > 0 ? availableLanes : [randInt(0, WORLD_CONFIG.laneCount - 1)]);
    const x = laneCenter(lane);
    const z = rand(TRAFFIC_CONFIG.spawnZMax, TRAFFIC_CONFIG.spawnZMin);

    mesh.position.set(x, 0, z);
    mesh.rotation.y = behavior === 'wrongWay' ? Math.PI : 0;
    group.add(mesh);

    let speed = TRAFFIC_CONFIG.baseTrafficSpeed + rand(-1.5, 2.5) + difficulty * TRAFFIC_CONFIG.difficultySpeedRamp;
    if (behavior === 'slow') {
      speed *= 0.72;
    }
    if (behavior === 'wrongWay') {
      speed *= 1.28;
    }
    if (type === 'moto') {
      speed *= 1.12;
    }

    const vehicle = {
      mesh,
      type,
      behavior,
      lane,
      targetLane: lane,
      laneChangeCooldown: rand(0.6, 1.8),
      stopTimer: rand(0.5, 1.4),
      active: true,
      speed,
      baseSpeed: speed,
      halfWidth,
      halfDepth,
      swayPhase: rand(0, Math.PI * 2),
      bounds: {
        x,
        z,
        halfWidth,
        halfDepth,
      },
    };

    vehicles.push(vehicle);
  }

  function spawn(dt, difficulty) {
    spawnTimer -= dt;
    const spawnInterval = Math.max(
      TRAFFIC_CONFIG.minSpawnInterval,
      TRAFFIC_CONFIG.baseSpawnInterval - difficulty * TRAFFIC_CONFIG.difficultySpawnRamp
    );

    if (spawnTimer <= 0 && vehicles.length < TRAFFIC_CONFIG.maxVehicles) {
      createVehicle(difficulty);
      spawnTimer = spawnInterval;
    }
  }

  function updateVehicle(vehicle, dt, gameSpeed, playerState) {
    if (!vehicle.active) {
      return;
    }

    vehicle.bounds.x = vehicle.mesh.position.x;
    vehicle.bounds.z = vehicle.mesh.position.z;

    if (vehicle.behavior === 'swerve') {
      vehicle.laneChangeCooldown -= dt;
      if (vehicle.laneChangeCooldown <= 0) {
        vehicle.targetLane = clamp(vehicle.targetLane + randInt(-1, 1), 0, WORLD_CONFIG.laneCount - 1);
        vehicle.laneChangeCooldown = vehicle.type === 'moto' ? rand(0.35, 0.9) : rand(0.9, 1.6);
      }

      const targetX = laneCenter(vehicle.targetLane);
      const swayBoost = vehicle.type === 'moto' ? 1.5 : 1;
      const deltaX = targetX - vehicle.mesh.position.x;
      const moveX = clamp(
        deltaX,
        -TRAFFIC_CONFIG.laneSwitchSpeed * swayBoost * dt,
        TRAFFIC_CONFIG.laneSwitchSpeed * swayBoost * dt
      );
      vehicle.mesh.position.x += moveX;
      vehicle.lane = Math.round(
        (vehicle.mesh.position.x + (WORLD_CONFIG.laneCount * WORLD_CONFIG.laneWidth) / 2) / WORLD_CONFIG.laneWidth - 0.5
      );
    }

    if (vehicle.behavior === 'suddenStop') {
      const distanceToPlayer = playerState.position.z - vehicle.mesh.position.z;
      if (distanceToPlayer > 0 && distanceToPlayer < TRAFFIC_CONFIG.suddenStopDistance) {
        vehicle.stopTimer -= dt;
        if (vehicle.stopTimer <= 0) {
          vehicle.speed = Math.max(vehicle.baseSpeed * 0.18, 1.6);
        }
      } else {
        vehicle.speed += (vehicle.baseSpeed - vehicle.speed) * dt * 1.2;
      }
    }

    if (vehicle.type === 'moto') {
      vehicle.mesh.position.x += Math.sin(performance.now() * 0.005 + vehicle.swayPhase + vehicle.mesh.position.z) * 0.01;
      vehicle.mesh.rotation.z = Math.sin(performance.now() * 0.008 + vehicle.swayPhase) * 0.08;
    } else {
      vehicle.mesh.rotation.z += (0 - vehicle.mesh.rotation.z) * dt * 8;
    }

    if (vehicle.behavior === 'wrongWay') {
      vehicle.mesh.position.z += (gameSpeed + vehicle.speed) * dt;
    } else {
      vehicle.mesh.position.z += (gameSpeed - vehicle.speed) * dt;
    }

    vehicle.bounds.x = vehicle.mesh.position.x;
    vehicle.bounds.z = vehicle.mesh.position.z;
  }

  function cleanup() {
    for (let index = vehicles.length - 1; index >= 0; index -= 1) {
      const vehicle = vehicles[index];
      if (
        vehicle.mesh.position.z > WORLD_CONFIG.playerZ + TRAFFIC_CONFIG.despawnBehindPlayer ||
        vehicle.mesh.position.z < -WORLD_CONFIG.visibleAhead - 30
      ) {
        group.remove(vehicle.mesh);
        vehicles.splice(index, 1);
      }
    }
  }

  function update(dt, gameSpeed, playerState) {
    vehicles.forEach((vehicle) => updateVehicle(vehicle, dt, gameSpeed, playerState));
    cleanup();
  }

  function reset() {
    spawnTimer = 0;
    vehicles.forEach((vehicle) => group.remove(vehicle.mesh));
    vehicles.length = 0;
  }

  return {
    group,
    vehicles,
    spawn,
    update,
    reset,
  };
}

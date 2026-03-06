import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { PLAYER_CONFIG, WORLD_CONFIG } from './config.js';
import { clamp } from './utils.js';

export function createPlayer(scene) {
  const group = new THREE.Group();
  const materials = {
    body: new THREE.MeshLambertMaterial({ color: 0xf94144 }),
    cabin: new THREE.MeshLambertMaterial({ color: 0xffd166 }),
    wheel: new THREE.MeshLambertMaterial({ color: 0x1c1c1c }),
    detail: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  };

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.2), materials.body);
  body.position.y = 0.75;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.7), materials.cabin);
  cabin.position.set(0, 1.2, -0.1);
  group.add(cabin);

  const hoodDetail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.65), materials.detail);
  hoodDetail.position.set(0, 1.02, -1.45);
  group.add(hoodDetail);

  const wheelGeometry = new THREE.BoxGeometry(0.32, 0.36, 0.82);
  const wheelPositions = [
    [-1.08, 0.32, -1.25],
    [1.08, 0.32, -1.25],
    [-1.08, 0.32, 1.25],
    [1.08, 0.32, 1.25],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeometry, materials.wheel);
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  scene.add(group);

  const keys = {
    left: false,
    right: false,
    accelerate: false,
    brake: false,
  };

  let controlsEnabled = true;
  let lateralVelocity = 0;
  const startPosition = new THREE.Vector3(0, 0, WORLD_CONFIG.playerZ);

  function updateKey(event, isPressed) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = isPressed;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = isPressed;
        break;
      case 'ArrowUp':
      case 'KeyW':
        keys.accelerate = isPressed;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keys.brake = isPressed;
        break;
      default:
        break;
    }
  }

  window.addEventListener('keydown', (event) => updateKey(event, true));
  window.addEventListener('keyup', (event) => updateKey(event, false));

  function update(dt) {
    if (!controlsEnabled) {
      lateralVelocity = 0;
      group.rotation.z = 0;
      return;
    }

    let horizontalInput = 0;
    if (keys.left) {
      horizontalInput -= 1;
    }
    if (keys.right) {
      horizontalInput += 1;
    }

    lateralVelocity = horizontalInput * PLAYER_CONFIG.lateralSpeed;
    group.position.x += lateralVelocity * dt;

    const roadHalfWidth = (WORLD_CONFIG.laneCount * WORLD_CONFIG.laneWidth) / 2;
    const xLimit = roadHalfWidth - PLAYER_CONFIG.halfWidth - 0.3;
    group.position.x = clamp(group.position.x, -xLimit, xLimit);
    group.rotation.z = -horizontalInput * PLAYER_CONFIG.tiltStrength;
  }

  function reset() {
    group.position.copy(startPosition);
    group.rotation.set(0, 0, 0);
    lateralVelocity = 0;
  }

  function setControlsEnabled(enabled) {
    controlsEnabled = enabled;
    if (!enabled) {
      keys.left = false;
      keys.right = false;
      keys.accelerate = false;
      keys.brake = false;
    }
  }

  function getBounds() {
    return {
      x: group.position.x,
      z: group.position.z,
      halfWidth: PLAYER_CONFIG.halfWidth,
      halfDepth: PLAYER_CONFIG.halfDepth,
    };
  }

  reset();

  return {
    group,
    position: group.position,
    speedState: {
      keys,
    },
    bounds: getBounds(),
    update(dt) {
      update(dt);
      this.bounds = getBounds();
    },
    reset,
    setControlsEnabled,
  };
}

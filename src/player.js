import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { PLAYER_CONFIG, WORLD_CONFIG } from './config.js';
import { clamp } from './utils.js';
import { createVehicleModel } from './vehicle-models.js';

export function createPlayer(scene) {
  const { group, halfWidth, halfDepth } = createVehicleModel({
    type: 'car',
    bodyColor: 0xf94144,
    cabinColor: 0xfff1b8,
    trimColor: 0x1c1c1c,
  });

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.08, 2.5),
    new THREE.MeshLambertMaterial({ color: 0xfffef2 })
  );
  stripe.position.set(0, 0.86, 0.1);
  group.add(stripe);

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
    const xLimit = roadHalfWidth - halfWidth - 0.3;
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
      halfWidth,
      halfDepth,
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

import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { RENDER_CONFIG } from './config.js';
import { Game } from './game.js';

const root = document.getElementById('game-root');

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(RENDER_CONFIG.internalWidth, RENDER_CONFIG.internalHeight, false);
renderer.setClearColor(RENDER_CONFIG.backgroundColor, 1);
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, RENDER_CONFIG.internalWidth / RENDER_CONFIG.internalHeight, 0.1, 150);

const game = new Game({ scene, camera, renderer });
const clock = new THREE.Clock();

function resize() {
  const { width, height } = root.getBoundingClientRect();
  game.handleResize(width, height);
}

window.addEventListener('resize', resize);
resize();

function loop() {
  const dt = clock.getDelta();
  game.update(dt);
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
}

loop();

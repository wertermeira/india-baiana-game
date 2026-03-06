import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import {
  DIFFICULTY_CONFIG,
  PLAYER_CONFIG,
  RANKING_CONFIG,
  RENDER_CONFIG,
  SCORE_CONFIG,
  UI_MESSAGES,
} from './config.js';
import { checkPlayerVsTraffic } from './collisions.js';
import { createPlayer } from './player.js';
import { createRoad } from './road.js';
import {
  fetchTopRecords,
  getStoredUserProfile,
  isUsingFirebase,
  saveOrUpdateUserBestScore,
} from './records.js';
import { createTrafficSystem } from './traffic.js';
import { createUI } from './ui.js';
import { choice, clamp, rand } from './utils.js';

export class Game {
  constructor({ scene, camera, renderer }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.isRunning = false;
    this.isGameOver = false;
    this.elapsedTime = 0;
    this.score = 0;
    this.difficultyLevel = 0;
    this.forwardSpeed = PLAYER_CONFIG.startSpeed;
    this.nextMemeAt = rand(DIFFICULTY_CONFIG.memeMinDelay, DIFFICULTY_CONFIG.memeMaxDelay);
    this.recordSaved = false;
    this.lastFinishedScore = null;
    this.hasStoredProfile = false;
    this.rankingEnabled = Boolean(RANKING_CONFIG.enabled);

    this.ui = createUI();
    this.player = createPlayer(scene);
    this.road = createRoad(scene);
    this.traffic = createTrafficSystem(scene);

    this.setupScene();
    this.bindUI();
    if (this.rankingEnabled) {
      this.prefillUserName();
    }
    this.ui.setRankingVisible(this.rankingEnabled);
    this.reset();
    if (this.rankingEnabled) {
      this.refreshLeaderboard();
    }
  }

  setupScene() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.9);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff0bf, 1.35);
    sun.position.set(8, 16, 6);
    this.scene.add(sun);

    this.scene.fog = new THREE.Fog(0xf1a562, 32, 90);
  }

  prefillUserName() {
    const profile = getStoredUserProfile();
    if (profile?.name) {
      this.hasStoredProfile = true;
      this.ui.setPlayerName(profile.name);
    }
  }

  bindUI() {
    this.ui.bindStart(() => this.start());
    this.ui.bindShareGlobal(() => this.shareCurrentContext());
    this.ui.bindRestart(() => {
      this.reset();
      this.start();
    });
    this.ui.bindBackToMenu(() => {
      this.reset();
      this.ui.showStartScreen();
    });
    this.ui.bindSaveRecord(() => this.saveCurrentRecord());
  }

  async refreshLeaderboard() {
    if (!this.rankingEnabled) {
      return;
    }

    try {
      const topRecords = await fetchTopRecords();
      this.ui.renderLeaderboard(topRecords);
    } catch {
      this.ui.renderLeaderboard([]);
    }
  }

  reset() {
    this.isRunning = false;
    this.isGameOver = false;
    this.recordSaved = false;
    this.lastFinishedScore = null;
    this.elapsedTime = 0;
    this.score = 0;
    this.difficultyLevel = 0;
    this.forwardSpeed = PLAYER_CONFIG.startSpeed;
    this.nextMemeAt = rand(DIFFICULTY_CONFIG.memeMinDelay, DIFFICULTY_CONFIG.memeMaxDelay);

    this.player.reset();
    this.player.setControlsEnabled(false);
    this.road.reset();
    this.traffic.reset();
    this.exitMobileFullscreen();
    this.ui.hideGameOver();
    this.ui.showStartScreen();
    this.ui.setGameplayUIVisible(false);
    this.ui.setRecordFormVisible(this.rankingEnabled && !this.hasStoredProfile);
    this.ui.updateHUD(0, 0);
    this.ui.setSaveEnabled(true);
    this.ui.setSaveStatus(this.rankingEnabled ? '' : 'Ranking desativado nesta versão.');
    this.ui.setShareStatus('');
    this.ui.setShareButtonLabel('Compartilhar jogo');
    this.updateCamera();
  }

  start() {
    this.enterMobileFullscreen();
    this.isRunning = true;
    this.isGameOver = false;
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.setGameplayUIVisible(true);
    this.player.setControlsEnabled(true);
    this.ui.showMemeMessage(choice(UI_MESSAGES.memes));
  }

  update(dt) {
    const safeDt = Math.min(dt, 0.033);
    if (!this.isRunning || this.isGameOver) {
      this.updateCamera();
      return;
    }

    this.elapsedTime += safeDt;
    this.difficultyLevel = this.elapsedTime;

    this.updateSpeed(safeDt);
    this.player.update(safeDt, this.forwardSpeed);
    this.road.update(safeDt, this.forwardSpeed);
    this.traffic.spawn(safeDt, this.difficultyLevel, this.forwardSpeed);
    this.traffic.update(safeDt, this.forwardSpeed, this.player);

    this.score += this.forwardSpeed * safeDt * SCORE_CONFIG.distanceFactor + safeDt * SCORE_CONFIG.timeFactor;

    if (this.elapsedTime >= this.nextMemeAt) {
      this.ui.showMemeMessage(choice(UI_MESSAGES.memes));
      this.nextMemeAt = this.elapsedTime + rand(DIFFICULTY_CONFIG.memeMinDelay, DIFFICULTY_CONFIG.memeMaxDelay);
    }

    const collision = checkPlayerVsTraffic(this.player.bounds, this.traffic.vehicles);
    if (collision) {
      this.triggerGameOver();
    }

    this.ui.updateHUD(this.score, this.elapsedTime);
    this.updateCamera();
  }

  updateSpeed(dt) {
    const keys = this.player.speedState.keys;
    if (keys.accelerate) {
      this.forwardSpeed += PLAYER_CONFIG.accel * dt;
    } else if (keys.brake) {
      this.forwardSpeed -= PLAYER_CONFIG.brake * dt;
    } else {
      this.forwardSpeed -= PLAYER_CONFIG.drag * dt * 0.35;
    }

    const bonus = clamp(this.elapsedTime * 0.07, 0, 3.2);
    const maxSpeed = PLAYER_CONFIG.maxSpeed + bonus;
    const minSpeed = PLAYER_CONFIG.minSpeed;
    this.forwardSpeed = clamp(this.forwardSpeed, minSpeed, maxSpeed);
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this.recordSaved = false;
    this.lastFinishedScore = Math.floor(this.score);
    this.player.setControlsEnabled(false);
    this.ui.setGameplayUIVisible(false);
    this.ui.setRecordFormVisible(this.rankingEnabled && !this.hasStoredProfile);
    this.exitMobileFullscreen();

    if (this.rankingEnabled) {
      this.ui.setSaveEnabled(true);
      this.ui.setSaveStatus(
        isUsingFirebase()
          ? 'Pronto para salvar no Firebase.'
          : 'Firebase não configurado: salvando localmente neste navegador.'
      );
    }

    this.ui.showGameOver({
      score: this.score,
      time: this.elapsedTime,
      message: choice(UI_MESSAGES.gameOver),
    });
    this.ui.setShareButtonLabel('Compartilhar score');

    if (this.rankingEnabled && this.hasStoredProfile) {
      this.autoSaveBestScore();
    }
  }

  async saveCurrentRecord() {
    if (!this.rankingEnabled) {
      return;
    }

    if (!this.isGameOver) {
      return;
    }

    if (this.recordSaved) {
      this.ui.setSaveStatus('Esse recorde já foi salvo.', 'error');
      return;
    }

    const name = this.ui.getPlayerName();

    try {
      const result = await saveOrUpdateUserBestScore({
        name,
        score: Math.floor(this.score),
      });
      this.recordSaved = true;
      this.hasStoredProfile = true;
      this.ui.setSaveEnabled(false);
      this.ui.setPlayerName(result.profile.name);
      this.ui.setRecordFormVisible(false);
      this.ui.setSaveStatus(
        result.changed
          ? 'Recorde salvo/atualizado com sucesso.'
          : 'Seu recorde anterior já é maior ou igual.',
        result.changed ? 'ok' : 'info'
      );
      await this.refreshLeaderboard();
    } catch {
      this.ui.setSaveStatus('Falha ao salvar recorde. Confira o Firebase e tente de novo.', 'error');
    }
  }

  async autoSaveBestScore() {
    if (!this.rankingEnabled) {
      return;
    }

    try {
      const result = await saveOrUpdateUserBestScore({
        name: this.ui.getPlayerName(),
        score: Math.floor(this.score),
      });
      this.hasStoredProfile = true;
      this.ui.setPlayerName(result.profile.name);
      this.ui.setRecordFormVisible(false);
      await this.refreshLeaderboard();
    } catch {
      // No UI interruption for background sync failure.
    }
  }

  async shareText(text) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'India Baiana Driver',
          text,
        });
        this.ui.setShareStatus('Compartilhado com sucesso.', 'ok');
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.ui.setShareStatus('Texto copiado. Cole onde quiser compartilhar.', 'ok');
        return;
      }

      this.ui.setShareStatus('Não foi possível compartilhar neste dispositivo.', 'error');
    } catch {
      this.ui.setShareStatus('Compartilhamento cancelado ou indisponível.', 'error');
    }
  }

  async shareCurrentContext() {
    if (Number.isFinite(this.lastFinishedScore)) {
      const text = `Consegui ${this.lastFinishedScore} pontos no India Baiana Driver, agora é sua vez!`;
      await this.shareText(text);
      return;
    }

    const text =
      'Estou jogando India Baiana Driver em Irecê. Vem tentar sobreviver ao trânsito meme!';
    await this.shareText(text);
  }

  isMobileTouchDevice() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  enterMobileFullscreen() {
    if (!this.isMobileTouchDevice()) {
      return;
    }

    const target = document.documentElement;
    if (document.fullscreenElement || !target.requestFullscreen) {
      return;
    }

    target.requestFullscreen().catch(() => {});
  }

  exitMobileFullscreen() {
    if (!this.isMobileTouchDevice()) {
      return;
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  updateCamera() {
    const playerPosition = this.player.position;
    this.camera.position.set(playerPosition.x * 0.32, 12.4, playerPosition.z + 10.8);
    this.camera.lookAt(playerPosition.x * 0.18, 0.7, playerPosition.z - 15.5);
  }

  handleResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const scale = Math.max(
      1,
      Math.floor(Math.min(width / RENDER_CONFIG.internalWidth, height / RENDER_CONFIG.internalHeight))
    );
    this.renderer.domElement.style.width = `${RENDER_CONFIG.internalWidth * scale}px`;
    this.renderer.domElement.style.height = `${RENDER_CONFIG.internalHeight * scale}px`;
  }
}

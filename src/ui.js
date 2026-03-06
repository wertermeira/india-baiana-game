import { formatTime } from './utils.js';

export function createUI() {
  const scoreValue = document.getElementById('score-value');
  const timeValue = document.getElementById('time-value');
  const hudStats = document.getElementById('hud-stats');
  const touchControls = document.getElementById('touch-controls');
  const memeBanner = document.getElementById('meme-banner');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const recordSaveBox = document.getElementById('record-save-box');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const gameOverMessage = document.getElementById('game-over-message');
  const startButton = document.getElementById('start-button');
  const shareGlobalButton = document.getElementById('share-global-button');
  const restartButton = document.getElementById('restart-button');
  const menuButton = document.getElementById('menu-button');
  const saveRecordButton = document.getElementById('save-record-button');
  const playerNameInput = document.getElementById('player-name');
  const saveStatus = document.getElementById('save-status');
  const shareStatusGlobal = document.getElementById('share-status-global');
  const top5Home = document.getElementById('top5-home');

  let memeTimeoutId = null;

  function bindStart(handler) {
    startButton.addEventListener('click', handler);
  }

  function bindRestart(handler) {
    restartButton.addEventListener('click', handler);
  }

  function bindShareGlobal(handler) {
    shareGlobalButton.addEventListener('click', handler);
  }

  function bindBackToMenu(handler) {
    menuButton.addEventListener('click', handler);
  }

  function bindSaveRecord(handler) {
    saveRecordButton.addEventListener('click', handler);
  }

  function updateHUD(score, time) {
    scoreValue.textContent = Math.floor(score).toString().padStart(6, '0');
    timeValue.textContent = formatTime(time);
  }

  function showMemeMessage(text) {
    memeBanner.textContent = text;
    memeBanner.classList.add('is-visible');

    if (memeTimeoutId) {
      clearTimeout(memeTimeoutId);
    }

    memeTimeoutId = window.setTimeout(() => {
      memeBanner.classList.remove('is-visible');
    }, 2100);
  }

  function showStartScreen() {
    startScreen.classList.remove('overlay--hidden');
    startScreen.classList.add('overlay--visible');
  }

  function hideStartScreen() {
    startScreen.classList.remove('overlay--visible');
    startScreen.classList.add('overlay--hidden');
  }

  function showGameOver({ score, time, message }) {
    finalScore.textContent = Math.floor(score).toString().padStart(6, '0');
    finalTime.textContent = formatTime(time);
    gameOverMessage.textContent = message;
    gameOverScreen.classList.remove('overlay--hidden');
    gameOverScreen.classList.add('overlay--visible');
  }

  function hideGameOver() {
    gameOverScreen.classList.remove('overlay--visible');
    gameOverScreen.classList.add('overlay--hidden');
  }

  function getPlayerName() {
    return playerNameInput.value.trim();
  }

  function setPlayerName(name) {
    playerNameInput.value = name;
  }

  function setSaveStatus(message, kind = 'info') {
    saveStatus.textContent = message;
    saveStatus.classList.remove('save-status--ok', 'save-status--error');
    if (kind === 'ok') {
      saveStatus.classList.add('save-status--ok');
    }
    if (kind === 'error') {
      saveStatus.classList.add('save-status--error');
    }
  }

  function setSaveEnabled(enabled) {
    saveRecordButton.disabled = !enabled;
  }

  function setShareStatus(message, kind = 'info') {
    shareStatusGlobal.textContent = message;
    shareStatusGlobal.classList.remove('share-status--ok', 'share-status--error');
    if (kind === 'ok') {
      shareStatusGlobal.classList.add('share-status--ok');
    }
    if (kind === 'error') {
      shareStatusGlobal.classList.add('share-status--error');
    }
  }

  function setShareButtonLabel(text) {
    shareGlobalButton.textContent = text;
  }

  function setGameplayUIVisible(visible) {
    const method = visible ? 'remove' : 'add';
    hudStats.classList[method]('is-hidden');
    touchControls.classList[method]('is-hidden');

    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      document.body.classList.toggle('game-running-mobile', visible);
    }
  }

  function setRecordFormVisible(visible) {
    const method = visible ? 'remove' : 'add';
    recordSaveBox.classList[method]('is-hidden');
  }

  function renderLeaderboard(records) {
    top5Home.innerHTML = '';

    if (!records.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Nenhum recorde salvo ainda.';
      top5Home.appendChild(empty);
      return;
    }

    records.forEach((record, index) => {
      const entry = document.createElement('li');

      const text = `${index + 1}. ${record.name} - ${record.score} `;
      const meta = document.createElement('span');
      meta.className = 'leaderboard-meta';
      meta.textContent = `(${record.dateLabel})`;

      entry.append(document.createTextNode(text), meta);
      top5Home.appendChild(entry);
    });
  }

  return {
    bindStart,
    bindRestart,
    bindShareGlobal,
    bindBackToMenu,
    bindSaveRecord,
    updateHUD,
    showMemeMessage,
    showStartScreen,
    hideStartScreen,
    showGameOver,
    hideGameOver,
    getPlayerName,
    setPlayerName,
    setSaveStatus,
    setSaveEnabled,
    setShareStatus,
    setShareButtonLabel,
    setGameplayUIVisible,
    setRecordFormVisible,
    renderLeaderboard,
  };
}

import { formatTime } from './utils.js';

export function createUI() {
  const scoreValue = document.getElementById('score-value');
  const timeValue = document.getElementById('time-value');
  const memeBanner = document.getElementById('meme-banner');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const gameOverMessage = document.getElementById('game-over-message');
  const startButton = document.getElementById('start-button');
  const restartButton = document.getElementById('restart-button');
  const menuButton = document.getElementById('menu-button');
  const saveRecordButton = document.getElementById('save-record-button');
  const playerNameInput = document.getElementById('player-name');
  const saveStatus = document.getElementById('save-status');
  const top5Start = document.getElementById('top5-start');
  const top5GameOver = document.getElementById('top5-gameover');

  let memeTimeoutId = null;

  function bindStart(handler) {
    startButton.addEventListener('click', handler);
  }

  function bindRestart(handler) {
    restartButton.addEventListener('click', handler);
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

  function renderLeaderboard(records) {
    top5Start.innerHTML = '';
    top5GameOver.innerHTML = '';

    if (!records.length) {
      const empty1 = document.createElement('li');
      empty1.textContent = 'Nenhum recorde salvo ainda.';
      const empty2 = document.createElement('li');
      empty2.textContent = 'Nenhum recorde salvo ainda.';
      top5Start.appendChild(empty1);
      top5GameOver.appendChild(empty2);
      return;
    }

    records.forEach((record, index) => {
      const entryStart = document.createElement('li');
      const entryGameOver = document.createElement('li');

      const text = `${index + 1}. ${record.name} - ${record.score} `;
      const metaStart = document.createElement('span');
      metaStart.className = 'leaderboard-meta';
      metaStart.textContent = `(${record.dateLabel})`;

      const metaGameOver = document.createElement('span');
      metaGameOver.className = 'leaderboard-meta';
      metaGameOver.textContent = `(${record.dateLabel})`;

      entryStart.append(document.createTextNode(text), metaStart);
      entryGameOver.append(document.createTextNode(text), metaGameOver);

      top5Start.appendChild(entryStart);
      top5GameOver.appendChild(entryGameOver);
    });
  }

  return {
    bindStart,
    bindRestart,
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
    renderLeaderboard,
  };
}

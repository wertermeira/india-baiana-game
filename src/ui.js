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

  let memeTimeoutId = null;

  function bindStart(handler) {
    startButton.addEventListener('click', handler);
  }

  function bindRestart(handler) {
    restartButton.addEventListener('click', handler);
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

  return {
    bindStart,
    bindRestart,
    updateHUD,
    showMemeMessage,
    showStartScreen,
    hideStartScreen,
    showGameOver,
    hideGameOver,
  };
}

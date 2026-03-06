export const RENDER_CONFIG = {
  internalWidth: 400,
  internalHeight: 225,
  pixelScale: 3,
  backgroundColor: 0x87b1ff,
};

export const WORLD_CONFIG = {
  laneCount: 3,
  laneWidth: 3.2,
  roadLength: 54,
  segmentLength: 18,
  segmentCount: 4,
  roadWidthPadding: 1.4,
  sidewalkWidth: 3.1,
  playerZ: 7.8,
  visibleAhead: 58,
  visibleBehind: 16,
  roadScrollFactor: 1,
  buildingOffset: 8.8,
  roadsideDepth: 1.8,
};

export const PLAYER_CONFIG = {
  startSpeed: 10,
  maxSpeed: 21,
  minSpeed: 5,
  accel: 12,
  brake: 15,
  drag: 3,
  lateralSpeed: 11,
  halfWidth: 1.05,
  halfDepth: 1.75,
  tiltStrength: 0.16,
};

export const TRAFFIC_CONFIG = {
  maxVehicles: 15,
  baseSpawnInterval: 1.55,
  minSpawnInterval: 0.5,
  difficultySpawnRamp: 0.023,
  baseTrafficSpeed: 8.5,
  difficultySpeedRamp: 0.11,
  spawnZMin: -50,
  spawnZMax: -74,
  despawnBehindPlayer: 12,
  laneSwitchSpeed: 4.6,
  suddenStopDistance: 16,
  minSpawnGapZ: 13,
  chaosBaseChance: 0.2,
  chaosRamp: 0.015,
  wrongWayBaseChance: 0.08,
  wrongWayRamp: 0.008,
  motoChanceBase: 0.18,
  motoChanceRamp: 0.005,
};

export const SCORE_CONFIG = {
  distanceFactor: 11,
  timeFactor: 8,
};

export const DIFFICULTY_CONFIG = {
  bandOne: 20,
  bandTwo: 45,
  memeMinDelay: 4,
  memeMaxDelay: 8,
};

export const UI_MESSAGES = {
  memes: [
    'Moto Fantasma',
    'Seta Decorativa',
    'Ultrapassagem Impossivel',
    'Contramao Premium',
    'Discussao Iniciada',
    'Pickup da Pressa',
    'Freada Filosofica',
    'Mercadao em horario de pico',
  ],
  gameOver: [
    'Voce foi fechado por uma moto invisivel.',
    'Quem estava errado discutiu mais alto.',
    'A seta era apenas decorativa.',
    'Voce perdeu para a logica do transito local.',
    'A contramao confiou no destino.',
    'A pickup decidiu que duas faixas eram dela.',
  ],
};

export const IRECE_SIGNS = [
  'Praca Cleriston Andrade',
  'Praca Teotonio Marques',
  'Av. Primeiro de Janeiro',
  'Mercadao',
  'Irece',
  'Capital do Feijao',
  'Espaco Sao Joao',
];

export const PALETTE = {
  road: 0x3a4756,
  lane: 0xf3cf5a,
  curb: 0xd5b07f,
  grass: 0x8cb25e,
  pole: 0x5a4b4b,
  light: 0xfff3c7,
  building: [0xd95d39, 0xffc857, 0x5f7ad6, 0x47a36b, 0xb562d6],
  car: [0xff4f4f, 0x4cc4ff, 0xffd84d, 0x64e291, 0xff8c42],
  pickup: [0xf15bb5, 0x00bbf9, 0xfee440],
  moto: [0xffffff, 0xff5e5b, 0x7bdff2],
};

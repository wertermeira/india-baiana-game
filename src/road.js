import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { IRECE_SIGNS, PALETTE, WORLD_CONFIG } from './config.js';
import { choice, rand, randInt } from './utils.js';

function createPixelLabel(text, width = 160, height = 64, background = '#ffe57e', color = '#2d1c16') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#1a120f';
  ctx.fillRect(4, 4, width - 8, height - 8);
  ctx.fillStyle = background;
  ctx.fillRect(10, 10, width - 20, height - 20);
  ctx.fillStyle = color;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = text.split(' ');
  const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');
  ctx.fillText(firstLine, width / 2, secondLine ? height / 2 - 12 : height / 2);
  if (secondLine) {
    ctx.fillText(secondLine, width / 2, height / 2 + 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createBuilding() {
  const building = new THREE.Group();
  const width = rand(2.4, 4.2);
  const height = rand(3.6, 7.5);
  const depth = rand(2.2, 3.4);
  const color = choice(PALETTE.building);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial({ color })
  );
  base.position.y = height / 2;
  building.add(base);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.9, 0.3, depth * 0.6),
    new THREE.MeshLambertMaterial({ color: 0xf5e6c8 })
  );
  awning.position.set(0, Math.max(1.1, height * 0.28), depth * 0.2);
  building.add(awning);

  return building;
}

function createTree() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 1.1, 0.45),
    new THREE.MeshLambertMaterial({ color: 0x6d4c41 })
  );
  trunk.position.y = 0.55;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshLambertMaterial({ color: 0x4f9d69 })
  );
  crown.position.y = 1.7;
  tree.add(crown);

  return tree;
}

function createPole() {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 2.9, 0.18),
    new THREE.MeshLambertMaterial({ color: PALETTE.pole })
  );
  post.position.y = 1.45;
  group.add(post);

  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.24, 0.32),
    new THREE.MeshLambertMaterial({ color: PALETTE.light, emissive: 0x332211, emissiveIntensity: 0.1 })
  );
  lamp.position.set(0.3, 2.55, 0);
  group.add(lamp);

  return group;
}

function createRoadMark() {
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.02, 2),
    new THREE.MeshBasicMaterial({ color: PALETTE.lane })
  );
  mark.position.y = 0.03;
  return mark;
}

function createSign(text, style = 'sign') {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 1.9, 0.15),
    new THREE.MeshLambertMaterial({ color: 0x60423a })
  );
  pole.position.y = 0.95;
  group.add(pole);

  const bgColor = style === 'billboard' ? '#ffca5c' : '#7ee0ff';
  const fgColor = style === 'billboard' ? '#311b18' : '#103045';
  const texture = createPixelLabel(text, 170, 72, bgColor, fgColor);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(style === 'billboard' ? 3.8 : 2.8, style === 'billboard' ? 1.6 : 1.2),
    new THREE.MeshBasicMaterial({ map: texture, transparent: false })
  );
  panel.position.set(0, style === 'billboard' ? 2.7 : 2.2, 0);
  group.add(panel);

  return group;
}

function createMarket() {
  const market = new THREE.Group();
  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 3.1, 3.2),
    new THREE.MeshLambertMaterial({ color: 0xffa94d })
  );
  hall.position.y = 1.55;
  market.add(hall);

  const sign = createSign('Mercadao', 'billboard');
  sign.position.set(0, 0.2, 1.7);
  market.add(sign);

  return market;
}

function createPraza() {
  const plaza = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.16, 4.2),
    new THREE.MeshLambertMaterial({ color: 0xdac7a6 })
  );
  base.position.y = 0.08;
  plaza.add(base);

  for (let i = 0; i < 3; i += 1) {
    const tree = createTree();
    tree.position.set(rand(-1.3, 1.3), 0, rand(-1.1, 1.1));
    plaza.add(tree);
  }

  return plaza;
}

function createRoadSegment(index) {
  const segment = new THREE.Group();
  const { laneCount, laneWidth, segmentLength, sidewalkWidth, buildingOffset } = WORLD_CONFIG;
  const roadWidth = laneCount * laneWidth + WORLD_CONFIG.roadWidthPadding;
  const zOffset = -index * segmentLength;

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(roadWidth, 0.1, segmentLength),
    new THREE.MeshLambertMaterial({ color: PALETTE.road })
  );
  road.position.y = 0;
  segment.add(road);

  const leftSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(sidewalkWidth, 0.14, segmentLength),
    new THREE.MeshLambertMaterial({ color: PALETTE.curb })
  );
  leftSidewalk.position.set(-(roadWidth / 2 + sidewalkWidth / 2), 0.02, 0);
  segment.add(leftSidewalk);

  const rightSidewalk = leftSidewalk.clone();
  rightSidewalk.position.x *= -1;
  segment.add(rightSidewalk);

  const laneDividerCount = laneCount - 1;
  for (let laneIndex = 1; laneIndex <= laneDividerCount; laneIndex += 1) {
    const x = -roadWidth / 2 + laneWidth * laneIndex;
    for (let markIndex = 0; markIndex < 4; markIndex += 1) {
      const mark = createRoadMark();
      mark.position.set(x, 0.06, -segmentLength / 2 + 3 + markIndex * 4.2);
      segment.add(mark);
    }
  }

  for (let side = -1; side <= 1; side += 2) {
    const pole = createPole();
    pole.position.set(side * (roadWidth / 2 + 1.45), 0, -4.6);
    segment.add(pole);

    const building = createBuilding();
    building.position.set(side * buildingOffset, 0, rand(-5.5, 5.5));
    segment.add(building);

    const extraBuilding = createBuilding();
    extraBuilding.scale.set(0.8, 0.8, 0.8);
    extraBuilding.position.set(side * (buildingOffset + 3.7), 0, rand(-4.2, 5.4));
    segment.add(extraBuilding);

    const featureRoll = randInt(0, 4);
    let feature;
    if (featureRoll === 0) {
      feature = createSign(choice(IRECE_SIGNS));
    } else if (featureRoll === 1) {
      feature = createSign('Capital do Feijao', 'billboard');
    } else if (featureRoll === 2) {
      feature = createMarket();
    } else if (featureRoll === 3) {
      feature = createPraza();
    } else {
      feature = createSign('Irece', 'billboard');
    }

    feature.position.set(side * (buildingOffset - 1.2), 0, rand(-6.5, 6.5));
    if (side < 0) {
      feature.rotation.y = Math.PI * 0.12;
    } else {
      feature.rotation.y = -Math.PI * 0.12;
    }
    segment.add(feature);
  }

  segment.position.z = zOffset;
  return segment;
}

export function createRoad(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 120),
    new THREE.MeshLambertMaterial({ color: PALETTE.grass })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  group.add(ground);

  const segments = [];
  for (let index = 0; index < WORLD_CONFIG.segmentCount; index += 1) {
    const segment = createRoadSegment(index);
    segments.push(segment);
    group.add(segment);
  }

  function update(dt, gameSpeed) {
    const speed = gameSpeed * WORLD_CONFIG.roadScrollFactor;
    const recycleThreshold = WORLD_CONFIG.playerZ + WORLD_CONFIG.visibleBehind;
    const recycleOffset = WORLD_CONFIG.segmentLength * WORLD_CONFIG.segmentCount;

    segments.forEach((segment) => {
      segment.position.z += speed * dt;
      if (segment.position.z > recycleThreshold) {
        segment.position.z -= recycleOffset;
      }
    });
  }

  function reset() {
    segments.forEach((segment, index) => {
      segment.position.z = -index * WORLD_CONFIG.segmentLength;
    });
  }

  return {
    group,
    update,
    reset,
  };
}

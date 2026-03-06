import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';

function addWheel(group, geometry, material, x, y, z) {
  const wheel = new THREE.Mesh(geometry, material);
  wheel.position.set(x, y, z);
  group.add(wheel);
}

function createCarLikeVehicle({ type, bodyColor, cabinColor = 0xdcefff, trimColor = 0x1d1d1d }) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
  const cabinMaterial = new THREE.MeshLambertMaterial({ color: cabinColor });
  const trimMaterial = new THREE.MeshLambertMaterial({ color: trimColor });
  const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xfff3b0 });
  const tailLightMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });

  let width = 1.95;
  let length = 4.1;
  let halfWidth = 0.98;
  let halfDepth = 2.05;

  if (type === 'pickup') {
    width = 2.18;
    length = 4.9;
    halfWidth = 1.09;
    halfDepth = 2.45;
  }

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.52, length),
    bodyMaterial
  );
  base.position.y = 0.52;
  group.add(base);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, 0.22, type === 'pickup' ? 1.05 : 1.2),
    bodyMaterial
  );
  hood.position.set(0, 0.85, -length * 0.28);
  group.add(hood);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(type === 'pickup' ? width * 0.68 : width * 0.72, 0.76, type === 'pickup' ? 1.45 : 1.8),
    cabinMaterial
  );
  cabin.position.set(0, 1.12, type === 'pickup' ? -0.55 : -0.18);
  group.add(cabin);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(type === 'pickup' ? width * 0.6 : width * 0.64, 0.14, type === 'pickup' ? 1.15 : 1.4),
    trimMaterial
  );
  roof.position.set(0, 1.58, type === 'pickup' ? -0.58 : -0.2);
  group.add(roof);

  if (type === 'pickup') {
    const bedWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.46, 1.88),
      bodyMaterial
    );
    bedWallLeft.position.set(-0.88, 0.72, 1.02);
    group.add(bedWallLeft);

    const bedWallRight = bedWallLeft.clone();
    bedWallRight.position.x *= -1;
    group.add(bedWallRight);

    const tailgate = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.84, 0.46, 0.16),
      bodyMaterial
    );
    tailgate.position.set(0, 0.72, 1.9);
    group.add(tailgate);

    const bedFloor = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.8, 0.08, 1.9),
      trimMaterial
    );
    bedFloor.position.set(0, 0.48, 1);
    group.add(bedFloor);
  } else {
    const trunk = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.9, 0.3, 1.02),
      bodyMaterial
    );
    trunk.position.set(0, 0.83, 1.32);
    group.add(trunk);
  }

  const bumperFront = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.94, 0.12, 0.16),
    trimMaterial
  );
  bumperFront.position.set(0, 0.46, -length / 2 + 0.08);
  group.add(bumperFront);

  const bumperRear = bumperFront.clone();
  bumperRear.position.z = length / 2 - 0.08;
  group.add(bumperRear);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.56, 0.26, 0.12),
    cabinMaterial
  );
  windshield.position.set(0, 1.08, -0.86);
  windshield.rotation.x = -0.45;
  group.add(windshield);

  const rearGlass = windshield.clone();
  rearGlass.position.z = type === 'pickup' ? -0.12 : 0.52;
  rearGlass.rotation.x = 0.45;
  group.add(rearGlass);

  const headLightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), lightMaterial);
  headLightLeft.position.set(-width * 0.26, 0.75, -length / 2 + 0.05);
  group.add(headLightLeft);
  const headLightRight = headLightLeft.clone();
  headLightRight.position.x *= -1;
  group.add(headLightRight);

  const tailLightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.08), tailLightMaterial);
  tailLightLeft.position.set(-width * 0.26, 0.73, length / 2 - 0.05);
  group.add(tailLightLeft);
  const tailLightRight = tailLightLeft.clone();
  tailLightRight.position.x *= -1;
  group.add(tailLightRight);

  const wheelGeometry = new THREE.BoxGeometry(0.28, 0.36, 0.9);
  addWheel(group, wheelGeometry, trimMaterial, -width / 2 - 0.04, 0.24, -length / 2 + 0.76);
  addWheel(group, wheelGeometry, trimMaterial, width / 2 + 0.04, 0.24, -length / 2 + 0.76);
  addWheel(group, wheelGeometry, trimMaterial, -width / 2 - 0.04, 0.24, length / 2 - 0.76);
  addWheel(group, wheelGeometry, trimMaterial, width / 2 + 0.04, 0.24, length / 2 - 0.76);

  return { group, halfWidth, halfDepth };
}

function createMoto({ bodyColor, trimColor = 0x202020, accentColor = 0xfff3b0 }) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
  const trimMaterial = new THREE.MeshLambertMaterial({ color: trimColor });
  const accentMaterial = new THREE.MeshLambertMaterial({ color: accentColor });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 1.6), trimMaterial);
  frame.position.y = 0.42;
  group.add(frame);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.74), bodyMaterial);
  tank.position.set(0, 0.72, -0.1);
  group.add(tank);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.68), trimMaterial);
  seat.position.set(0, 0.74, 0.5);
  group.add(seat);

  const frontFork = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.12), trimMaterial);
  frontFork.position.set(0, 0.52, -0.88);
  frontFork.rotation.x = -0.24;
  group.add(frontFork);

  const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.08, 0.08), trimMaterial);
  handlebar.position.set(0, 1.04, -0.82);
  group.add(handlebar);

  const rearLight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), accentMaterial);
  rearLight.position.set(0, 0.72, 1.03);
  group.add(rearLight);

  const headLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.08), accentMaterial);
  headLight.position.set(0, 0.88, -1.02);
  group.add(headLight);

  const wheelGeometry = new THREE.BoxGeometry(0.14, 0.54, 0.54);
  addWheel(group, wheelGeometry, trimMaterial, 0, 0.3, -0.98);
  addWheel(group, wheelGeometry, trimMaterial, 0, 0.3, 0.96);

  return {
    group,
    halfWidth: 0.42,
    halfDepth: 1.18,
  };
}

export function createVehicleModel({ type, bodyColor, cabinColor, trimColor, accentColor }) {
  if (type === 'moto') {
    return createMoto({ bodyColor, trimColor, accentColor });
  }

  return createCarLikeVehicle({ type, bodyColor, cabinColor, trimColor });
}

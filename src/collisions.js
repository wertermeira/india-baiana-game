export function isColliding(a, b) {
  return (
    Math.abs(a.x - b.x) < a.halfWidth + b.halfWidth &&
    Math.abs(a.z - b.z) < a.halfDepth + b.halfDepth
  );
}

export function checkPlayerVsTraffic(playerBounds, vehicles) {
  for (const vehicle of vehicles) {
    if (!vehicle.active) {
      continue;
    }

    if (Math.abs(vehicle.bounds.z - playerBounds.z) > 8) {
      continue;
    }

    if (isColliding(playerBounds, vehicle.bounds)) {
      return vehicle;
    }
  }

  return null;
}

// Makes a random path in 1D, 2D, or 3D.

export function randomPath1d(steps: number) {
  let x = 0;

  for (let i = 0; i < steps; i++) {
    if (Math.random() < 0.5) x += 1;
    else x -= 1;

    if (x == 0) return true;
  }

  return false;
}

export function randomPath2d(steps: number) {
  let x = 0;
  let y = 0;

  for (let i = 0; i < steps; i++) {
    const val = Math.random();

    if (val < 0.25) x += 1;
    else if (val < 0.5) x -= 1;
    else if (val < 0.75) y += 1;
    else y -= 1;

    if (x == 0 && y == 0) return true;
  }

  return false;
}

export function randomPath3d(steps: number) {
  let x = 0;
  let y = 0;
  let z = 0;

  for (let i = 0; i < steps; i++) {
    const val = Math.random();

    if (val < 1 / 6) x += 1;
    else if (val < 1 / 3) x -= 1;
    else if (val < 0.5) y += 1;
    else if (val < 2 / 3) y -= 1;
    else if (val < 5 / 6) z += 1;
    else z -= 1;

    if (x == 0 && y == 0 && z == 0) return true;
  }

  return false;
}

export function repeat(
  path: (steps: number) => boolean,
  steps: number,
  attempts: number
) {
  let successes = 0;
  let failures = 0;

  for (let i = 0; i < attempts; i++) {
    if (path(steps)) {
      successes++;
    } else {
      failures++;
    }
  }

  return successes / (successes + failures);
}

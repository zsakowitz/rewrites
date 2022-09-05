// https://www.youtube.com/watch?v=1MtEUErz7Gg

export type Sandpile = number[][];

export function isNestedArray(array: unknown): array is unknown[][] {
  if (!Array.isArray(array)) {
    return false;
  }

  for (const row of array) {
    if (!Array.isArray(row)) {
      return false;
    }
  }

  return true;
}

export function isSandpile(pile: unknown): pile is Sandpile {
  if (!isNestedArray(pile) || !pile.length || !pile[0].length) {
    return false;
  }

  const size = pile[0].length;
  if (!size) {
    return false;
  }

  for (const row of pile) {
    if (!row.every((value): value is number => typeof value === "number")) {
      return false;
    }

    if (row.length !== size) {
      return false;
    }
  }

  return true;
}

export function needsPropogation(pile: Sandpile) {
  return pile.some((row) => row.some((cell) => cell > 3));
}

export function propogateOnce(pile: Sandpile) {
  const array: Sandpile = [];

  const numRows = pile.length;
  const numCols = pile[0].length;

  for (let row = 0; row < numRows; row++) {
    const subarray: number[] = Array<number>(numCols).fill(0);
    array[row] = subarray;
  }

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      let val = pile[row][col];

      while (val >= 4) {
        val -= 4;

        if (row !== 0) {
          array[row - 1][col]++;
        }

        if (row !== numRows - 1) {
          array[row + 1][col]++;
        }

        if (col !== 0) {
          array[row][col - 1]++;
        }

        if (col !== numCols - 1) {
          array[row][col + 1]++;
        }
      }

      array[row][col] += val;
    }
  }

  return array;
}

export function propogate(pile: Sandpile) {
  while (needsPropogation(pile)) {
    pile = propogateOnce(pile);
  }

  return pile;
}

export function addPiles(a: Sandpile, b: Sandpile) {
  const array: Sandpile = [];

  const numRows = a.length;
  const numCols = a[0].length;

  for (let row = 0; row < numRows; row++) {
    const subarray: number[] = [];
    array.push(subarray);

    for (let col = 0; col < numCols; col++) {
      subarray[col] = a[row][col] + b[row][col];
    }
  }

  return propogate(array);
}

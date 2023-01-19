// An engine to discover solutions to "Light the Bulbs" on zSnout.

export const lights: boolean[][] = []
export const clicks: boolean[][] = []
export let size = 0

export function reset(_size: number) {
  size = _size

  lights.splice(
    0,
    lights.length,
    ...Array.from({ length: size }, () => {
      return Array.from({ length: size }, () => false)
    })
  )

  clicks.splice(
    0,
    clicks.length,
    ...Array.from({ length: size }, () => {
      return Array.from({ length: size }, () => false)
    })
  )
}

function flipOne(row: number, col: number) {
  if (row >= 0 && row < size && col >= 0 && col < size) {
    lights[row]![col] = !lights[row]![col]
  }
}

export function click(row: number, col: number) {
  clicks[row]![col] = !clicks[row]![col]
  flipOne(row, col)
  flipOne(row - 1, col)
  flipOne(row + 1, col)
  flipOne(row, col - 1)
  flipOne(row, col + 1)
}

function randomCellIndex() {
  return Math.floor(Math.random() * size)
}

function isCellSolved(cell: boolean) {
  return cell
}

function isRowSolved(row: boolean[]) {
  return row.every(isCellSolved)
}

export function isSolved() {
  return lights.every(isRowSolved)
}

export function attemptByClickingRandomly(maxTimes: number) {
  for (let i = 0; i < maxTimes; i++) {
    click(randomCellIndex(), randomCellIndex())
    if (isSolved()) return i
  }

  return false
}

export function solveRow(row: number) {
  if (row <= 0 || row >= size) return

  for (let col = 0; col < size; col++) {
    if (!lights[row - 1]![col]) {
      click(row, col)
    }
  }
}

export function solveBoard(size: number, index?: number) {
  reset(size)

  if (index == undefined) {
    for (let col = 0; col < size; col++) {
      if (Math.random() < 0.5) {
        click(0, col)
      }
    }
  } else {
    for (let col = 0; col < size; col++) {
      if (index & (2 ** col)) {
        click(0, col)
      }
    }
  }

  for (let row = 1; row < size; row++) {
    solveRow(row)
  }

  return isSolved()
}

export function indexToText(index: number) {
  return index
    .toString(2)
    .replaceAll("0", "_")
    .replaceAll("1", "X")
    .padEnd(size, "_")
}

export function attemptBySolvingBoards(size: number) {
  const max = 2 ** size
  const solutions: [index: number, label: string][] = []

  for (let index = 0; index < max; index++) {
    if (solveBoard(size, index)) {
      solutions.push([index, indexToText(index)])
    }
  }

  return solutions
}

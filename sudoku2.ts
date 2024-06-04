export class UnknownCell {
  constructor(readonly values: number[]) {}

  clone() {
    return new UnknownCell(this.values.slice())
  }

  add(x: number) {
    if (!this.values.includes(x)) {
      this.values.push(x)
    }
  }

  remove(x: number) {
    const idx = this.values.indexOf(x)
    if (idx != -1) {
      this.values.splice(idx, 1)
    }
  }

  *[Symbol.iterator]() {
    yield* this.values
  }
}

export type Cell = number | UnknownCell

export class Board {
  static blank() {
    return new Board(
      Array.from({ length: 9 }, () =>
        Array.from(
          { length: 9 },
          () => new UnknownCell([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        ),
      ),
    )
  }

  constructor(readonly grid: readonly Cell[][]) {
    if (grid.length != 9 || !grid.every((x) => x.length == 9)) {
      throw new Error("check your grid size")
    }
  }

  clone() {
    return new Board(
      this.grid.map((x) =>
        x.map((x) => (typeof x == "number" ? x : x.clone())),
      ),
    )
  }

  solve(): Board | undefined {
    if (this.grid.every((x) => x.every((y) => typeof y == "number"))) {
      return this
    }

    for (const [i, j, cell] of this.grid
      .flatMap((row, i) => row.map((cell, j) => [i, j, cell] as const))
      .filter(
        (x): x is readonly [number, number, UnknownCell] =>
          x[2] instanceof UnknownCell,
      )
      .sort((a, b) => a[2].values.length - b[2].values.length)) {
      for (const value of cell) {
        const solution = this.clone().setCell(i, j, value).solve()
        if (solution) {
          return solution
        }
      }

      this.grid[i]![j] = cell
    }
  }

  setCell(i: number, j: number, value: number) {
    this.grid[i]![j] = value

    for (let a = 0; a < 9; a++) {
      const cell = this.grid[i]![a]
      if (cell instanceof UnknownCell) {
        cell.remove(value)
        if (cell.values.length == 1) {
          this.grid[i]![a] = cell.values[0]!
        }
      }
    }

    for (let a = 0; a < 9; a++) {
      const cell = this.grid[a]![j]
      if (cell instanceof UnknownCell) {
        cell.remove(value)
        if (cell.values.length == 1) {
          this.grid[a]![j] = cell.values[0]!
        }
      }
    }

    return this
  }
}

const grid = Board.blank()
const data = `005037000
084059037
067000900
700068000
000070000
000340008
079000510
040520780
000790300`
grid.setCell(0, 2, 5)
grid.setCell(0, 2, 5)

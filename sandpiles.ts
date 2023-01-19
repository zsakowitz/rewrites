// A library for adding sand piles as described in a Numberphile video.
// https://www.youtube.com/watch?v=1MtEUErz7Gg

export type SandpileLike = ArrayLike<ArrayLike<number>>

export class Sandpile extends Array<number[]> {
  static isSandpile(pile: unknown): pile is Sandpile {
    return pile instanceof Sandpile
  }

  static isSandpileLike(pile: SandpileLike) {
    if (this.isSandpile(pile)) {
      return true
    }

    if (!pile.length || !pile[0]!.length) {
      return false
    }

    const size = pile[0]!.length
    if (!size) {
      return false
    }

    for (let i = 0; i < pile.length; i++) {
      if (pile[i]!.length !== size) {
        return false
      }
    }

    return true
  }

  static from(pile: SandpileLike) {
    if (!this.isSandpileLike(pile)) {
      throw new Error("pile is not a properly formed SandpileLike.")
    }

    const numRows = pile.length
    const numCols = pile[0]!.length

    const realPile = new this(numRows, numCols)

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        realPile[row]![col] = pile[row]![col]!
      }
    }

    return realPile
  }

  static fillWith(value: number, numRows?: number, numCols?: number) {
    return new this(numRows, numCols).fill(value)
  }

  static empty(numRows?: number, numCols?: number) {
    return this.fillWith(0, numRows, numCols)
  }

  static min(numRows?: number, numCols?: number) {
    return this.fillWith(0, numRows, numCols)
  }

  static max(numRows?: number, numCols?: number) {
    return this.fillWith(3, numRows, numCols)
  }

  constructor(numRows = 1, numCols = 1) {
    if (!numRows || !numCols) {
      throw new Error("A sandpile must have positive and nonzero dimensions.")
    }

    super(numRows)

    for (let row = 0; row < numRows; row++) {
      this[row] = Array<number>(numCols).fill(0)
    }
  }

  get numRows() {
    return this.length
  }

  get numCols() {
    return this[0]!.length
  }

  clone() {
    return Sandpile.from(this)
  }

  fill(value: number): this
  fill(value: number[], start?: number, end?: number): this
  fill(value: number | number[], start?: number, end?: number) {
    if (value instanceof Array) {
      return super.fill(value, start, end)
    }

    const { numRows, numCols } = this

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        this[row]![col] = value
      }
    }

    return this
  }

  willTopple() {
    return this.some((row) => row.some((cell) => cell > 3))
  }

  toppleOnce() {
    const original = this.clone()
    const { numRows, numCols } = original

    this.fill(0)

    for (let row = 0; row < numRows; row++) {
      const subarray: number[] = Array<number>(numCols).fill(0)
      this[row] = subarray
    }

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        let val = original[row]![col]

        if (val! >= 4) {
          val! -= 4

          if (row !== 0) {
            this[row - 1]![col]++
          }

          if (row !== numRows - 1) {
            this[row + 1]![col]++
          }

          if (col !== 0) {
            this[row]![col - 1]++
          }

          if (col !== numCols - 1) {
            this[row]![col + 1]++
          }
        }

        this[row]![col] += val!
      }
    }

    return this
  }

  topple() {
    while (this.willTopple()) {
      this.toppleOnce()
    }

    return this
  }

  add(other: SandpileLike) {
    const { numRows, numCols } = this

    if (!Sandpile.isSandpileLike(other)) {
      throw new Error("The item being added is not a proper SandpileLike.")
    }

    if (other.length !== numRows || other[0]!.length !== numCols) {
      throw new Error("When adding sandpiles, their dimensions must match.")
    }

    const result = new Sandpile(numRows, numCols)

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        result[row]![col] = this[row]![col]! + other[row]![col]!
      }
    }

    return result.topple()
  }

  private static characters = [" ", "░", "▒", "▓", "█"]

  ascii() {
    return this.map((row) =>
      row
        .map((cell) =>
          (Sandpile.characters[cell] ?? Sandpile.characters[4]!).repeat(2)
        )
        .join("")
    ).join("\n")
  }

  randomize(chance = 0.05, max = 3) {
    const { numRows, numCols } = this

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (Math.random() < chance) {
          this[row]![col] = Math.floor(max * Math.random()) + 1
        }
      }
    }

    return this
  }

  async toppleVisually(fps = 10) {
    while (this.willTopple()) {
      this.toppleOnce()
      console.log(this.ascii())
      await wait(1000 / fps)
    }

    console.log(this.ascii())
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const magic3x3 = Sandpile.from([
  [2, 1, 2],
  [1, 0, 1],
  [2, 1, 2],
])

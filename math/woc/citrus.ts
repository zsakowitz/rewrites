/**
 * Problem description:
 *
 * A citrus crate is a NxN grid. Some squares are filled with either green or
 * red pomelos. Constraints:
 *
 * 1. Each row and column must start and end with a green pomelo.
 * 2. Each row and column must include at least one green pomelo.
 * 3. Green and red pomelos must alternate within a row or column.
 *
 * Some notes:
 *
 * 1. A red pomelo cannot be on the first or last row or column, since a green
 *    pomelo would then need to be placed outside of the box.
 *
 * Definitions:
 *
 * 1. C(n) = the number of possible crates of size n
 * 2. P(n,k) = the number of possible crates of size n with a green pomelo at (0,k)
 */

export class Crate {
  constructor(
    /**
     * `data` uses `0` for empty cell, `1` for green pomelo, and `2` for red
     * pomelo.
     */
    readonly data: Uint8Array,
    readonly size: number,
  ) {}

  isValid() {
    for (let r = 0; r < this.size; r++) {
      let expecting: 1 | 2 = 1

      for (let c = 0; c < this.size; c++) {
        const cell = this.data[r * this.size + c]
        if (cell == 0) continue
        if (cell != expecting) return false

        expecting = 3 - expecting
      }

      // this ensures we start and end with a green AND that at least one green exists
      if (expecting != 2) return false
    }

    for (let c = 0; c < this.size; c++) {
      let expecting: 1 | 2 = 1

      for (let r = 0; r < this.size; r++) {
        const cell = this.data[r * this.size + c]
        if (cell == 0) continue
        if (cell != expecting) return false

        expecting = 3 - expecting
      }

      // this ensures we start and end with a green AND that at least one green exists
      if (expecting != 2) return false
    }

    // console.log(this.log(), "\n")
    return true
  }

  log() {
    let ret = ""
    for (let r = 0; r < this.size; r++) {
      ret += ret ? "\n" : ""
      for (let c = 0; c < this.size; c++) {
        const cell = this.data[r * this.size + c]
        ret += cell == 1 ? "|" : cell == 2 ? "X" : "·"
      }
    }
    return this.hash()
  }

  hash() {
    let n = 0
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const i = r * this.size + c
        n += 3 ** i * this.data[i]!
      }
    }
    return n.toString(36)
  }

  hasConsecutiveRed() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size - 1; c++) {
        if (
          this.data[r * this.size + c] == 2 &&
          this.data[r * this.size + c + 1] == 2
        ) {
          return true
        }

        if (
          this.data[c * this.size + r] == 2 &&
          this.data[(c + 1) * this.size + r] == 2
        ) {
          return true
        }
      }
    }

    return false
  }
}

/* This simplified version does not work for many cases. */
function simpleP(size: number, requiredColumn: number) {
  if (size < 3) {
    throw new Error("Cannot check pomelo crates smaller than 3x3.")
  }

  if (requiredColumn == 0 || requiredColumn == size - 1) {
    throw new Error(
      "Required column cannot be 1 from either end (corners are annoying).",
    )
  }

  const n = 3 ** ((size - 2) ** 2)
  const crate = new Crate(new Uint8Array(size * size), size)
  let valid = new Set<string>()
  let total = 0

  const CORNER_BL = size * (size - 1)
  const CORNER_BR = size * size - 1

  for (let i = 0; i < n; i++) {
    crate.data.fill(0)
    crate.data[requiredColumn] = 1

    for (let r = 0; r < size - 2; r++) {
      for (let c = 0; c < size - 2; c++) {
        const idx = (r + 1) * size + (c + 1)
        const cell = 3 ** (r * size + c)
        crate.data[idx] = Math.floor(n / cell) % 3
      }
    }

    //     // corner bl + right edge somewhere
    //     crate.data[CORNER_BL] = 1
    //     for (let i = 1; i < size - 1; i++) {
    //       const c = i * size + (size - 1)
    //       crate.data[c] = 1
    //       if (crate.isValid()) {
    //         valid.push(crate.log())
    //       }
    //       crate.data[c] = 0
    //       total++
    //     }
    //     crate.data[CORNER_BL] = 0
    //
    //     // corner br + left edge somewhere
    //     crate.data[CORNER_BR] = 1
    //     for (let i = 1; i < size - 1; i++) {
    //       crate.data[i * size] = 1
    //       if (crate.isValid()) {
    //         valid.push(crate.log())
    //       }
    //       crate.data[i * size] = 0
    //       total++
    //     }
    //     crate.data[CORNER_BR] = 0

    // all three edges
    for (let i = 0; i < size; i++) {
      for (let j = 1; j < size; j++) {
        for (let k = 1; k < size; k++) {
          const c1 = i * size
          const c2 = j * size + (size - 1)
          const c3 = (size - 1) * size + k
          crate.data[c1] = 1
          crate.data[c2] = 1
          crate.data[c3] = 1
          if (crate.isValid()) {
            valid.add(crate.log())
          }
          total++
          crate.data[c1] = 0
          crate.data[c2] = 0
          crate.data[c3] = 0
        }
      }
    }
  }

  return valid
}

/** Assumes `1 <= col <= size`. */
function P(size: number, col: number) {
  switch (size) {
    case 0:
      return 1 // `col` cannot be any value here, so return 1 because why not

    case 1:
      return 1

    case 2:
      return 1
  }

  if (col == 0 || col == size - 1) {
    // A top-left green pomelo means there is a (size-1)^2 chunk left over, so
    // the number of crates is just the reduced (size-1)^2 version. Same for a
    // top-right green pomelo.
    return C(size - 1)
  }

  // All the preconditions for simpleP have now been met.
  return simpleP(size, col)
}

function C(size: number): number {
  switch (size) {
    case 0:
      return 1 // an empty 0x0 fills every requirement

    case 1:
      return 1 // only a 1x1

    case 2:
      return 2 // checked by hand
  }

  let sum = new Set()
  for (let k = 0; k < size; k++) {
    const p = P(size, k)
    if (p instanceof Set) {
      sum = sum.union(p)
    } else {
      sum.add(p)
    }
  }
  return sum
}

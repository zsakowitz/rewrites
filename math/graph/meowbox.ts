import { inspect } from "util"

class Meowbox {
  readonly rows: number
  readonly cols: number

  constructor(readonly cells: (0 | 1)[][]) {
    this.rows = cells.length
    this.cols = cells[0]?.length ?? 0
  }

  swap(i: number, j: number) {
    if (i != j) {
      const ri = this.cells[i]
      const rj = this.cells[j]
      if (!(ri && rj)) {
        throw new Error("Cannot swap rows of a meowbox which do not exist.")
      }
      this.cells[j] = ri
      this.cells[i] = rj
    }
  }

  crash(i: number, j: number) {
    if (i > this.rows || j > this.rows) {
      throw new Error("Cannot crash from or into a row which does not exist.")
    }

    if (i === j) {
      throw new Error("Cannot crash a row into itself.")
    }

    for (let c = 0; c < this.cols; c++) {
      // @ts-expect-error be quiet
      this.cells[j]![c] ^= this.cells[i]![c]
    }
  }

  untangle() {
    // iterate on rows
    for (let r = 0; r < this.rows; r++) {
      let lead = this.cols
      let leadRow = r

      // iterate on rows
      for (let r = leadRow; r < this.rows; r++) {
        const myLead = this.cells[r]!.indexOf(1) // iterate on cols
        if (myLead === -1 || myLead >= lead) continue

        lead = myLead
        leadRow = r
      }

      if (lead === this.cols) {
        break
      }

      this.swap(r, leadRow) // iterate on cols

      // iterate on rows
      for (let r2 = 0; r2 < this.rows; r2++) {
        if (r === r2 || this.cells[r2]![lead] === 0) continue
        this.crash(r, r2) // iterate on cols
      }
    }
  }

  [inspect.custom]() {
    return this.cells.map((x) => x.join(" ")).join("\n")
  }

  /** Assumes the meowbox has been untangled. */
  countSolutions() {
    let leads = 0
    for (let i = 0; i < this.rows; i++) {
      const lead = this.cells[i]!.indexOf(1)
      if (lead == this.cols - 1) {
        return 0
      }
      if (lead != -1) leads++
    }

    return 2 ** (this.cols - 1 - leads)
  }
}

const m = new Meowbox([
  [0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 0, 1],
  [0, 0, 1, 0, 0, 0],
])

m.untangle()

console.log(m)
console.log(m.countSolutions())

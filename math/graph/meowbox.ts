export class Meowbox {
  static zero(rows: number, cols: number) {
    return new Meowbox(new Uint8Array(rows * cols), rows, cols)
  }

  static scratch(size: number) {
    const cells = new Uint8Array(size * size)
    for (let i = 0; i < size; i++) {
      cells[i + i * size] = 1
    }
    return new Meowbox(cells, size, size)
  }

  static random(rows: number, cols: number) {
    return new Meowbox(
      Uint8Array.from({ length: rows * cols }, () =>
        Math.random() < 0.5 ? 0 : 1,
      ),
      rows,
      cols,
    )
  }

  constructor(
    readonly cells: Uint8Array,
    readonly rows: number,
    readonly cols: number,
  ) {}

  swap(i: number, j: number) {
    if (i == j) return

    const cols = this.cols
    const ri = i * cols
    const rj = j * cols
    for (let c = 0; c < cols; c++) {
      const temp = this.cells[ri + c]!
      this.cells[ri + c] = this.cells[rj + c]!
      this.cells[rj + c] = temp
    }
  }

  crash(i: number, j: number) {
    const rows = this.rows
    if (i > rows || j > rows) {
      throw new Error("Cannot crash from or into a row which does not exist.")
    }

    if (i === j) {
      throw new Error("Cannot crash a row into itself.")
    }

    const cols = this.cols
    const ri = i * cols
    const rj = j * cols
    for (let c = 0; c < cols; c++) {
      // @ts-expect-error be quiet
      this.cells[rj + c] ^= this.cells[ri + c]
    }
  }

  lead(row: number) {
    const cols = this.cols
    const o = row * cols
    for (let i = 0; i < cols; i++) {
      if (this.cells[o + i] === 1) {
        return i
      }
    }
    return -1
  }

  untangle() {
    const { rows, cols } = this
    // iterate on rows
    for (let r = 0; r < rows; r++) {
      let lead = cols
      let leadRow = r

      // iterate on rows
      for (let r = leadRow; r < rows; r++) {
        const myLead = this.lead(r) // iterate on cols
        if (myLead === -1 || myLead >= lead) continue

        lead = myLead
        leadRow = r
      }

      if (lead === cols) {
        break
      }

      this.swap(r, leadRow) // iterate on cols

      // iterate on rows
      for (let r2 = 0; r2 < rows; r2++) {
        if (r === r2 || this.cells[r2 * cols + lead] === 0) continue
        this.crash(r, r2) // iterate on cols
      }
    }
  }

  get(row: number, col: number) {
    return this.cells[row * this.cols + col]! as 0 | 1
  }

  set(row: number, col: number, value: 0 | 1) {
    this.cells[row * this.cols + col] = value
  }

  // [inspect.custom]() {
  //   let ret = ""
  //   return this.cells.map((x) => x.join(" ")).join("\n")
  // }

  /** Assumes the meowbox has been untangled. */
  countSolutions() {
    let leads = 0
    for (let i = 0; i < this.rows; i++) {
      const lead = this.lead(i)
      if (lead == this.cols - 1) {
        return 0
      }
      if (lead != -1) leads++
    }

    return 2 ** (this.cols - 1 - leads)
  }

  toString() {
    let ret = ""
    for (let i = 0; i < this.rows; i++) {
      ret += i == 0 ? "" : "\n"
      for (let j = 0; j < this.cols; j++) {
        ret += (j == 0 ? "" : " ") + this.get(i, j)
      }
    }
    return ret
  }
}

console.log(Meowbox.random(4, 4).toString())

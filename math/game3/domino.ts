import { Num } from "."

export class Domino {
  static from(data: string) {
    const rows = data.split("\n").filter((x) => x)
    const cols = rows.reduce((a, b) => Math.max(a, b.length), 0)
    const cells = new Uint8Array(cols * rows.length)
    cells.fill(1)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      for (let j = 0; j < row.length; j++) {
        if (row[j] == "x") {
          cells[i * cols + j] = 0
        }
      }
    }
    return new Domino(cells, rows.length, cols)
  }

  constructor(
    readonly cells: Uint8Array,
    readonly rows: number,
    readonly cols: number,
  ) {}

  eval(): Num {
    const lhs: Num[] = []
    for (let i = 0; i < this.rows - 1; i++) {
      for (let j = 0; j < this.cols; j++) {
        const c1 = i * this.cols + j
        const c2 = (i + 1) * this.cols + j
        if (!this.cells[c1] && !this.cells[c2]) {
          this.cells[c1] = 1
          this.cells[c2] = 1
          lhs.push(this.eval())
          this.cells[c1] = 0
          this.cells[c2] = 0
        }
      }
    }

    const rhs: Num[] = []
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols - 1; j++) {
        const c1 = i * this.cols + j
        const c2 = i * this.cols + (j + 1)
        if (!this.cells[c1] && !this.cells[c2]) {
          this.cells[c1] = 1
          this.cells[c2] = 1
          rhs.push(this.eval())
          this.cells[c1] = 0
          this.cells[c2] = 0
        }
      }
    }

    return new Num(lhs, rhs)
  }
}

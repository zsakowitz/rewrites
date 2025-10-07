import { mex, type Nimber } from "./nim"

class Grid {
  n = 0

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    if (w * h > 31) {
      throw new Error("grid is too big")
    }
  }

  get(x: number, y: number) {
    return this.n & (1 << (y * this.w + x))
  }

  set(x: number, y: number, on: boolean) {
    const cell = 1 << (y * this.w + x)
    this.n = (this.n & ~cell) | (+on * cell)
  }

  setRect(x1: number, y1: number, x2: number, y2: number, on: boolean) {
    let cell = 0
    for (let i = x1; i < x2; i++) {
      for (let j = y1; j < y2; j++) {
        cell |= 1 << (j * this.w + i)
      }
    }
    this.n = (this.n & ~cell) | (+on * cell)
  }

  getXorRect(x1: number, y1: number, x2: number, y2: number) {
    let cell = 0
    for (let i = x1; i < x2; i++) {
      for (let j = y1; j < y2; j++) {
        cell |= 1 << (j * this.w + i)
      }
    }
    return cell
  }

  cache: Record<number, number> = Object.create(null)
  calcRect(): number {
    if (this.n in this.cache) {
      return this.cache[this.n]!
    }
    const ret: Nimber[] = []

    for (let x2 = 1; x2 < this.w; x2++) {
      for (let y2 = 1; y2 < this.h; y2++) {
        if (!this.get(x2, y2)) continue

        for (let x1 = 1; x1 <= x2; x1++) {
          for (let y1 = 1; y1 <= y2; y1++) {
            const r = this.getXorRect(x1, y1, x2 + 1, y2 + 1)
            this.n ^= r
            ret.push(this.calcRect())
            this.n ^= r
          }
        }
      }
    }

    const m = mex(ret)
    this.cache[this.n] = m
    return m
  }

  get text() {
    return Array.from({ length: this.h }, (_, j) =>
      Array.from({ length: this.w }, (_, i) =>
        this.get(i, j) ? "x" : ".",
      ).join(""),
    ).join("\n")
  }

  set text(v) {
    const t = v.split("\n").map((r) => r.split(""))
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        this.set(x, y, t[y]?.[x] == "x")
      }
    }
  }
}

const I = new Grid(7, 4)
const q = Array.from({ length: 4 }, (_, j) =>
  Array.from({ length: 7 }, (_, i) => {
    I.text = ""
    I.set(i, j, true)
    return I.calcRect()
  }).join(" "),
).join("\n")
console.log(q)

import { mex, type Nimber } from "./nim"

class Grid {
  n = 0n

  constructor(
    readonly w: number,
    readonly h: number,
  ) {}

  get(x: number, y: number) {
    return this.n & (1n << BigInt(y * this.w + x))
  }

  set(x: number, y: number, on: boolean) {
    const cell = 1n << BigInt(y * this.w + x)
    this.n = (this.n & ~cell) | (BigInt(on) * cell)
  }

  getXorRect(x1: number, y1: number, x2: number, y2: number) {
    let cell = 0n
    for (let i = x1; i < x2; i++) {
      for (let j = y1; j < y2; j++) {
        cell |= 1n << BigInt(j * this.w + i)
      }
    }
    return cell
  }

  cache = new Map<bigint, number>()
  calcRect(): number {
    let ret = 0
    const n = this.n
    for (let i = 0n; i < this.w * this.h; i++) {
      if ((1n << i) & n) {
        this.n = 1n << i
        ret ^= this.calcInner()
      }
    }
    this.n = n
    return ret
  }
  calcInner(): number {
    if (this.cache.has(this.n)) {
      return this.cache.get(this.n)!
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
    this.cache.set(this.n, m)
    if (this.cache.size % 1e4 == 0) {
      console.error(this.cache.size)
    }
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

const n = 6
const I = new Grid(2 ** n + 1, 2 ** n + 1)
for (let y = 0; y <= n; y++) {
  for (let x = 0; x <= n; x++) {
    I.text = ""
    I.set(2 ** x, 2 ** y, true)
    const val = I.calcRect()
    console.write(val.toString().padStart(3) + " ")
  }
  console.log()
}

import { mex, type Nimber } from "./nim"

export class Grid {
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

class FillGame extends Grid {
  private cacheFillGame = new Map<bigint, number>()
  // calcRect(): number {
  //   let ret = 0
  //   const n = this.n
  //   for (let i = 0n; i < this.w * this.h; i++) {
  //     if ((1n << i) & n) {
  //       this.n = 1n << i
  //       ret ^= this.calcInner()
  //     }
  //   }
  //   this.n = n
  //   return ret
  // }

  // fill game is to pick a rectangle and flip all coins in it
  calcFillGame(): number {
    if (this.cacheFillGame.has(this.n)) {
      return this.cacheFillGame.get(this.n)!
    }
    const ret: Nimber[] = []

    for (let x2 = 1; x2 < this.w; x2++) {
      for (let y2 = 1; y2 < this.h; y2++) {
        if (!this.get(x2, y2)) continue

        for (let x1 = 1; x1 <= x2; x1++) {
          for (let y1 = 1; y1 <= y2; y1++) {
            const r = this.getXorRect(x1, y1, x2 + 1, y2 + 1)
            this.n ^= r
            ret.push(this.calcFillGame())
            this.n ^= r
          }
        }
      }
    }

    const m = mex(ret)
    this.cacheFillGame.set(this.n, m)
    if (this.cacheFillGame.size % 1e4 == 0) {
      console.error(this.cacheFillGame.size)
    }
    return m
  }

  getRow(n: number): bigint {
    let r = 0n
    for (let i = 0; i < 32; i++) {
      if (n & (1 << i)) {
        r += 1n << (1n << BigInt(i))
      }
    }
    return r
  }

  getCol(n: number): bigint {
    let r = 0n
    for (let i = 0; i < 32; i++) {
      if (n & (1 << i)) {
        r += 1n << ((1n << BigInt(i)) * BigInt(this.w))
      }
    }
    return r
  }
}

const I = new FillGame(9, 9)
for (let y = 0; y <= 7; y++) {
  for (let x = 0; x <= 7; x++) {
    I.n = I.getCol(y) * I.getRow(x)
    const val = I.calcFillGame()
    console.write(val.toString().padStart(3) + " ")
  }
  console.log()
}

import { ANSI } from "../../ansi"

export class Value {
  static ZERO = new Value([], [], "0")

  static int(value: number) {
    let ret = Value.ZERO

    if (value < 0) {
      for (let i = 0; i > value; i--) {
        ret = new Value([], [ret])
      }
    } else {
      for (let i = 0; i < value; i++) {
        ret = new Value([ret], [])
      }
    }

    return ret
  }

  static star(index: number) {
    let ret = Value.ZERO
    const sides: Value[] = [ret]

    for (let i = 0; i < index; i++) {
      ret = new Value(sides.slice(), sides.slice(), "*" + (i + 1))
      sides.push(ret)
    }

    return ret
  }

  constructor(
    readonly lhs: Value[],
    readonly rhs: Value[],
    readonly label?: string,
  ) {}

  lte(rhs: Value): boolean {
    return !(
      this.lhs.some((x) => rhs.lte(x)) || rhs.rhs.some((x) => x.lte(this))
    )
  }

  gte(rhs: Value): boolean {
    return rhs.lte(this)
  }

  lt(rhs: Value): boolean {
    return this.lte(rhs) && !rhs.lte(this)
  }

  gt(rhs: Value): boolean {
    return rhs.lte(this) && !this.lte(rhs)
  }

  eq(rhs: Value): boolean {
    return this.lte(rhs) && rhs.lte(this)
  }

  get gen() {
    let gen = 0
    for (const { gen: lgen } of this.lhs) {
      if (lgen + 1 > gen) gen = lgen + 1
    }
    for (const { gen: rgen } of this.rhs) {
      if (rgen + 1 > gen) gen = rgen + 1
    }
    return gen
  }

  toString(): string {
    const color = ANSI.cycleAll(this.gen)
    const r = ANSI.reset
    if (this.label) {
      return color + this.label + r
    }
    let ls = this.lhs.join(color + ",")
    if (ls) ls += color
    let rs = this.rhs.join(color + ",")
    if (ls) rs += color
    return `${color}{${ls}|${rs}}${r}`
  }

  log() {
    console.log(this.toString())
  }
}

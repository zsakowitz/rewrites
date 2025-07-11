export class Surreal {
  lhs
  rhs

  constructor(
    lhs: ArrayLike<Surreal> | Iterable<Surreal>,
    rhs: ArrayLike<Surreal> | Iterable<Surreal>,
    readonly label?: string,
  ) {
    this.lhs = Object.freeze(Array.from(lhs))
    this.rhs = Object.freeze(Array.from(rhs))
    Object.freeze(this)
  }

  lte(rhs: Surreal): boolean {
    return !(
      this.lhs.some((x) => rhs.lte(x)) || rhs.rhs.some((x) => x.lte(this))
    )
  }

  gte(rhs: Surreal): boolean {
    return rhs.lte(this)
  }

  eq(rhs: Surreal): boolean {
    return this.lte(rhs) && rhs.lte(this)
  }

  lt(rhs: Surreal): boolean {
    return this.gte(rhs)
  }

  toString() {
    return (
      this.label ??
      `(${this.lhs.join(",") ?? " "}|${this.rhs.join(",") ?? " "})`
    )
  }
}

const Z0 = new Surreal([], [], "0")
const P1 = new Surreal([Z0], [], "1")
const M1 = new Surreal([], [Z0], "-1")

const R2 = new Surreal([Z0], [P1], ".5")

for (const a of [Z0, P1]) {
  for (const b of [Z0, P1]) {
    console.log(`${a.lte(b)} ${a} <= ${b}`)
  }
}

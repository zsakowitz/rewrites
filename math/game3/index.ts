import { Cmp } from "./cmp"
import { Domino } from "./domino"
import { reduce } from "./reduce"
import { toString } from "./repr"

export class Num extends Cmp {
  constructor(
    readonly lhs: Num[],
    readonly rhs: Num[],
  ) {
    super()
    reduce(this)
  }

  le(rhs: Num): boolean {
    return !(this.lhs.some((x) => rhs.le(x)) || rhs.rhs.some((x) => x.le(this)))
  }

  is(rhs: Num): boolean {
    return (
      this.lhs.every((x) => rhs.lhs.some((y) => x.is(y)))
      && rhs.lhs.every((x) => this.lhs.some((y) => x.is(y)))
      && this.rhs.every((x) => rhs.rhs.some((y) => x.is(y)))
      && rhs.rhs.every((x) => this.rhs.some((y) => x.is(y)))
    )
  }

  birthday(): number {
    return Math.max(
      0,
      ...this.lhs.map((x) => x.birthday() + 1),
      ...this.rhs.map((x) => x.birthday() + 1),
    )
  }

  toString() {
    return toString(this)
  }

  neg(): Num {
    return new Num(
      this.rhs.map((x) => x.neg()),
      this.lhs.map((x) => x.neg()),
    )
  }

  add(rhs: Num): Num {
    return new Num(
      [...this.lhs.map((l) => l.add(rhs)), ...rhs.lhs.map((l) => this.add(l))],
      [...this.rhs.map((r) => r.add(rhs)), ...rhs.rhs.map((r) => this.add(r))],
    )
  }

  sub(rhs: Num): Num {
    return this.add(rhs.neg())
  }

  mul(rhs: Num): Num {
    const XL = this.lhs
    const XR = this.rhs
    const YL = rhs.lhs
    const YR = rhs.rhs
    const x = this
    const y = rhs

    return new Num(
      [
        ...XL.flatMap((XL) =>
          YL.map((YL) => XL.mul(y).add(x.mul(YL)).sub(XL.mul(YL))),
        ),
        ...XR.flatMap((XR) =>
          YR.map((YR) => XR.mul(y).add(x.mul(YR)).sub(XR.mul(YR))),
        ),
      ],
      [
        ...XL.flatMap((XL) =>
          YR.map((YR) => XL.mul(y).add(x.mul(YR)).sub(XL.mul(YR))),
        ),
        ...YL.flatMap((YL) =>
          XR.map((XR) => x.mul(YL).add(XR.mul(y)).sub(XR.mul(YL))),
        ),
      ],
    )
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return "" + this
  }
}

const b = Domino.from(`
xxx xx xx
x x x  xx
x   x
`)
console.log(b)
console.time()
for (let i = 0; i < 1e1; i++) {
  b.eval()
}
console.timeEnd()

import { Cmp } from "./cmp"
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

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return "" + this
  }
}

const N0 = new Num([], [])
const M1 = new Num([], [N0])
const N1 = new Num([N0], [])
const N2 = new Num([N0, N1], [])
const S0 = new Num([M1], [N1])
console.timeEnd()
console.log(N0)
console.log(N1)
console.log(N2)
console.log(S0)
console.log(new Num([N0, N1], [N2]))

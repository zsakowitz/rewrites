Array.prototype.unique = function () {
  return this.map((x) => Math.round(x * 10 ** 10) / 10 ** 10).filter(
    (x, i, a) => a.indexOf(x) == i,
  )
}

const OP_SQRT = (x: number) => {
  const sqrt = Math.sqrt(x)
  if (Number.isSafeInteger(sqrt)) return sqrt
  else return false
}

const OP_FRAC = (x: number) =>
  [
    1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600,
    6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000,
  ][x] ?? false

const OP_ADD = (a: number, b: number) => a + b
const OP_SUB = (a: number, b: number) => a - b
const OP_MUL = (a: number, b: number) => a * b
const OP_DIV = (a: number, b: number) => a / b
const OP_MOD = (a: number, b: number) => a % b
const OP_EXP = (a: number, b: number) => a ** b
const OP_IXP = (a: number, b: number) => a ** (1 / b)
const OP_LOG = (a: number, b: number) => {
  const v = Math.log(a) / Math.log(b)
  if (Number.isSafeInteger(v)) return v
  else return false
}

function prod<A, B>(a: A[], b: B[]): [A, B][] {
  return a.flatMap((a) => b.map((b) => [a, b] as [A, B]))
}

function run<T>(inputs: T[], ops: ((x: T) => number | false)[]): number[] {
  return inputs
    .flatMap((input) => ops.map((op) => op(input)))
    .filter((x) => x !== false)
}

function log(x: number[]) {
  const ints = x
    .filter((x) => Number.isSafeInteger(x))
    .map((a) => Math.abs(a))
    .unique()
    .sort((a, b) => a - b)
  const floats = x.filter((x) => !Number.isSafeInteger(x)).sort((a, b) => a - b)

  console.log(floats)
  console.log(ints)
}

const op1 = [OP_SQRT, OP_FRAC]

const a1 = [4, 0.4]
const a2 = a1.concat(run(a1, op1)).unique()
const a3 = a2.concat(run(a2, op1)).unique()
const a4 = a3.concat(run(a3, op1)).unique()

const op2 = [
  OP_ADD,
  OP_SUB,
  OP_MUL,
  OP_DIV,
  OP_MOD,
  OP_EXP,
  OP_IXP,
  OP_LOG,
].map(
  (x) =>
    ([a, b]: [number, number]) =>
      x(a, b),
)

const b1 = run(prod(a4, a4), op2).concat(44, 4.4, 0.44).unique()
const b2 = b1.concat(run(b1, op1)).unique()
const b3 = b2.concat(run(b2, op1)).unique()
const b4 = b3.concat(run(b3, op1)).unique()

const c1 = run(prod(a4, b4).concat(prod(b4, a4)), op2)
  .concat(444, 44.4, 4.44, 0.444)
  .unique()
const c2 = c1.concat(run(c1, op1)).unique()
const c3 = c2.concat(run(c2, op1)).unique()
const c4 = c3.concat(run(c3, op1)).unique()

const d1 = run(prod(a4, c4).concat(prod(c4, a4)).concat(prod(b4, b4)), op2)
  .concat(4444, 444.4, 44.44, 4.444, 0.4444)
  .unique()
const d2 = d1.concat(run(d1, op1)).unique()
const d3 = d2.concat(run(d2, op1)).unique()
const d4 = d3.concat(run(d3, op1)).unique()

for (const n of d4
  .map(Math.abs)
  .filter(Number.isSafeInteger)
  .unique()
  .sort((a, b) => a - b)) {
  console.log(n)
}

declare global {
  interface Array<T> {
    unique(): Array<T>
  }
}

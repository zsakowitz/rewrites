Array.prototype.unique = function (this: Val[]) {
  return this.map(
    (x): Val => [Math.round(x[0] * 10 ** 10) / 10 ** 10, x[1]],
  ).filter((x, i, a) => a.findIndex((y) => y[0] == x[0]) == i)
}

type Val = [value: number, label: string]

const OP_SQRT = (x: Val): Val | false => {
  const sqrt = Math.sqrt(x[0])
  if (Number.isSafeInteger(sqrt)) return [sqrt, `√(${x[1]})`]
  else return false
}

const OP_FACT = (x: Val): Val | false => {
  const v =
    [
      1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800,
      479001600, 6227020800, 87178291200, 1307674368000, 20922789888000,
      355687428096000,
    ][x[0]] ?? false
  if (v) {
    return [v, `(${x[1]})!`]
  }
  return false
}

const OP_ADD = (a: Val, b: Val): Val => [a[0] + b[0], `(${a[1]}) + (${b[1]})`]
const OP_SUB = (a: Val, b: Val): Val => [a[0] - b[0], `(${a[1]}) - (${b[1]})`]
const OP_MUL = (a: Val, b: Val): Val => [a[0] * b[0], `(${a[1]}) * (${b[1]})`]
const OP_DIV = (a: Val, b: Val): Val => [a[0] / b[0], `(${a[1]}) / (${b[1]})`]
const OP_EXP = (a: Val, b: Val): Val => [a[0] ** b[0], `(${a[1]}) ** (${b[1]})`]
// const OP_MOD = (a: number, b: number) => a % b
// const OP_IXP = (a: number, b: number) => a ** (1 / b)
// const OP_LOG = (a: number, b: number) => {
//   const v = Math.log(a) / Math.log(b)
//   if (Number.isSafeInteger(v)) return v
//   else return false
// }

function prod<A, B>(a: A[], b: B[]): [A, B][] {
  return a.flatMap((a) => b.map((b) => [a, b] as [A, B]))
}

function run<T>(inputs: T[], ops: ((x: T) => Val | false)[]): Val[] {
  return inputs
    .flatMap((input) => ops.map((op) => op(input)))
    .filter((x) => x !== false)
}

function log(x: Val[]) {
  const ints = x
    .filter((x) => Number.isSafeInteger(x[0]))
    .map((a): Val => [Math.abs(a[0]), a[1]])
    .unique()
    .sort((a, b) => a[0] - b[0])

  const floats = x
    .filter((x) => !Number.isSafeInteger(x[0]))
    .sort((a, b) => a[0] - b[0])

  console.log(floats)
  console.log(ints)
}

const op1 = [OP_SQRT, OP_FACT]

function n(strings: TemplateStringsArray): Val {
  return [+strings[0]!, strings[0]!]
}

const a1 = [n`4`, n`0.4`]
const a2 = a1.concat(run(a1, op1)).unique()
const a3 = a2.concat(run(a2, op1)).unique()
const a4 = a3.concat(run(a3, op1)).unique()

const op2 = [
  OP_ADD,
  OP_SUB,
  OP_MUL,
  OP_DIV,
  OP_EXP,
  // OP_MOD,
  // OP_IXP,
  // OP_LOG,
].map(
  (x) =>
    ([a, b]: [Val, Val]) =>
      x(a, b),
)

const b1 = run(prod(a4, a4), op2)
  .concat(n`44`, n`4.4`, n`0.44`)
  .unique()
const b2 = b1.concat(run(b1, op1)).unique()
const b3 = b2.concat(run(b2, op1)).unique()
const b4 = b3.concat(run(b3, op1)).unique()

const c1 = run(prod(a4, b4).concat(prod(b4, a4)), op2)
  .concat(n`444`, n`44.4`, n`4.44`, n`0.444`)
  .unique()
const c2 = c1.concat(run(c1, op1)).unique()
const c3 = c2.concat(run(c2, op1)).unique()
const c4 = c3.concat(run(c3, op1)).unique()

const d1 = run(prod(a4, c4).concat(prod(c4, a4)).concat(prod(b4, b4)), op2)
  .concat(n`4444`, n`444.4`, n`44.44`, n`4.444`, n`0.4444`)
  .unique()
const d2 = d1.concat(run(d1, op1)).unique()
const d3 = d2.concat(run(d2, op1)).unique()
const d4 = d3.concat(run(d3, op1)).unique()

for (const n of d4
  .map((v): Val => [Math.abs(v[0]), v[1]])
  .filter((x) => Number.isSafeInteger(x[0]))
  .unique()
  .sort((a, b) => a[0] - b[0])) {
  console.log(n[0].toString().padEnd(15, " ") + " " + n[1])
}

declare global {
  interface Array<T> {
    unique(): Array<T>
  }
}

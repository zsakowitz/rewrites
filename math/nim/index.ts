import { h } from "../../easy-jsx"

function mex(a: number[]): number {
  for (let i = 0; ; i++) {
    if (!a.includes(i)) {
      return i
    }
  }
}

function add(a: number, b: number): number {
  return a ^ b
}

const cache = new Map<number, number>()
function mul(a: number, b: number): number {
  const key = (a << 16) + b
  if (cache.has(key)) {
    return cache.get(key)!
  }

  const ret = new Set<number>()
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) {
      ret.add(add(add(mul(i, j), mul(i, b)), mul(a, j)))
    }
  }

  const val = mex(Array.from(ret))
  cache.set(key, val)
  return val
}

function mulpow2(a: number, b: number): number {
  // a is an exponent of 2
  // b is an exponent of 2
  // we return a plain number
}

const size = 2 ** (2 ** 2)
export const data = Array.from({ length: size }, (_, i) =>
  Array.from({ length: size }, (_, j) => mul(i, j)),
)
const rows = data.map((row) =>
  h(
    "tr",
    null,
    row.map((cell) =>
      h(
        "td",
        { style: "font-family:monospace;min-width:1em" },
        cell.toString(16).padStart(2, "0").toUpperCase(),
      ),
    ),
  ),
)
const table = h("table", null, h("tbody", null, rows))
document.body.appendChild(table)

Object.assign(globalThis, { mul })

import { h } from "../../nimbus/h"

const FERMATS = [
  2 ** (2 ** 5),
  2 ** (2 ** 4),
  2 ** (2 ** 3),
  2 ** (2 ** 2),
  2 ** (2 ** 1),
  2 ** (2 ** 0),
]

function split(n: number) {
  for (const f of FERMATS) {
    if (n >= f) {
      return { hi: Math.floor(n / f), lo: n % f, fermat: f }
    }
  }
  return { hi: 0, lo: n, fermat: 1 }
}

function cache(f: (a: number, b: number) => number) {
  const cache = new Map<number, number>()

  return (a: number, b: number): number => {
    const key = (a << 16) + b
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const val = f(a, b)
    cache.set(key, val)
    return val
  }
}

const mul = cache(function (a: number, b: number): number {
  if (a == 0 || b == 0) return 0
  if (a == 1) return b
  if (b == 1) return a
  const { hi: a1, fermat: Fm, lo: a2 } = split(a)
  const { hi: b1, fermat: Fn, lo: b2 } = split(b)
  if (Fm < Fn) {
    return (mul(a, b1) * Fn) ^ mul(a, b2)
  }
  if (Fn < Fm) {
    return (mul(b, a1) * Fm) ^ mul(b, a2)
  }
  return (
    mul(mul(a1, b1) ^ mul(a1, b2) ^ mul(a2, b1), Fn)
    ^ mul(a2, b2)
    ^ mul(mul(a1, b1), Fn / 2)
  )
})

console.time()
const data = Array.from({ length: 128 }, (_, a) =>
  Array.from({ length: 128 }, (_, b) => mul(a, b)),
)
console.timeEnd()

const rows = data.map((row, x) =>
  h(
    "tr",
    null,
    row.map((cell, y) => {
      cell = cell
      const td = h("td")
      const v = (360 * cell) / 128
      // td.style = `background-color:oklch(0.77 0.15 ${v})`
      td.style = `background-color:hsl(${v}, 100%, 50%)`
      return td
    }),
  ),
)
const table = h("table", null, h("tbody", null, rows))
document.body.appendChild(table)
document.body.appendChild(
  h(
    "style",
    null,
    "td{font-family:monospace;width:1em;height:1em;padding:0}table{border-collapse:collapse}",
  ),
)

Object.assign(globalThis, { mul })

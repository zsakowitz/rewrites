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

console.log(
  JSON.stringify(
    Array.from({ length: 16 }, (_, i) =>
      Array.from({ length: 16 }, (_, j) => mul(i, j)).join("\t"),
    ).join("\n"),
  ),
)

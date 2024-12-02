const OPS: ((...args: number[]) => number | false)[] = [
  (x) => x,
  (x) => (Number.isSafeInteger(Math.sqrt(x)) ? Math.sqrt(x) : false),
  (x) => [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][x] ?? false,
  (a, b) => a + b,
  (a, b) => a - b,
  (a, b) => a * b,
  (a, b) => a / b,
  (a, b) => a % b,
  (a, b) => ((a % b) + b) % b,
  (a, b) => a ** b,
]

const ops = Array.from({ length: 5 }, (_, i) =>
  OPS.filter((op) => op.length <= i),
)

function partitionsRaw(size: number, count: number): number[][] {
  if (count == 0) {
    return [Array.from({ length: size }, () => 0)]
  }

  return unique(
    Array.from({ length: size }, (_, i) => {
      const next = partitionsRaw(size, count - 1)
      for (const row of next) {
        row[i]!++
      }
      return next
    }).flat(),
  )

  function unique(nums: number[][]) {
    return nums
      .map((x) => x.join(" "))
      .filter((x, i, a) => a.indexOf(x) == i)
      .map((x) => x.split(" ").map((x) => +x))
  }
}

function go(fours: number, depth: number): number {
  if (fours == 0) {
    throw new Error("No fours left.")
  }

  if (depth == 0) {
    return 4
  }

  const list = ops[fours]!

  while (true) {
    const picked = list[Math.floor(Math.random() * list.length)]!

    const split = Array.from({ length: picked.length }, () => 1)
    for (let i = picked.length; i < fours; i++) {
      split[Math.floor(Math.random() * split.length)]!++
    }

    const value = picked(...split.map((fours) => go(fours, depth - 1)))
    if (typeof value == "number" && Math.abs(value) < 1000) return value
  }
}

const t0 = Date.now()
const vals = Array.from({ length: 1000000 }, () => go(4, 9))
const uniqs = Array.from(new Set(vals)).sort((a, b) => a - b)
console.log(uniqs)
const ints = uniqs
  .map(Math.abs)
  .sort((a, b) => a - b)
  .filter((x) => Number.isSafeInteger(x))
  .filter((x, i, a) => a.indexOf(x) == i)
console.log(ints)
console.log((Date.now() - t0) / 1000)
import { writeFileSync } from "fs"
writeFileSync("test.txt", ints.join("\n"))

// // part 1
// {
//   const b = `(input)`.split("\n").map((x) => x.split("   ").map((x) => +x))
//   const c = b.map((b) => b[0])
//   const d = b.map((b) => b[1])
//   c.sort((a, b) => a - b)
//   d.sort((a, b) => a - b)
//   let total = c.map((c, i) => Math.abs(c - d[i])).reduce((a, b) => a + b) // part 1 answer
// }
//
// // part 2
// {
//   let ss = 0
//   for (const [x] of b) {
//     ss += x * b.filter((a) => a[1] == x).length
//   }
//   // ss is answer
// }

import "../util.js"

// part 1 using utils
{
  const o = input`2024/in1.txt`
    .lines()
    .sws()
    .num()
    .tx()
    .map((x) => x.s())
    .tx()
    .sum(([a, b]) => a.dist(b))
  check(o, 1970720)
}

// part 2
{
  const b = input`2024/in1.txt`.lines().sws().num()
  const o = b.key(0).sum((x) => b.key(1).count(x) * x)
  check(o, 17191599)
}

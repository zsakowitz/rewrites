import "../util.js"

input(2024, 1)
  .lines()
  .sws()
  .num()
  .tx()
  .map((x) => x.s())
  .tx()
  .sum(([a, b]) => a.ud(b))
  .check(1970720)

const b = input(2024, 1).lines().sws().num()
const b1 = b.key(1)
b.key(0)
  .sum((x) => b1.count(x) * x)
  .check(17191599)

import "../util.js"

input`2024/in1.txt`
  .lines()
  .sws()
  .num()
  .tx()
  .map((x) => x.s())
  .tx()
  .sum(([a, b]) => a.ud(b))
  .check(1970720)

const b = input`2024/in1.txt`.lines().sws().num()
b.key(0)
  .sum((x) => b.key(1).count(x) * x)
  .check(17191599)

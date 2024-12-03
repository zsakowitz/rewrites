import "../util.js"

input`2024/in2.txt`
  .lines()
  .sws()
  .num()
  .count((row) => row.sd().everyany(ri(1, 3), ri(-3, -1)))
  .check(591)

input`2024/in2.txt`
  .lines()
  .sws()
  .num()
  .count(
    (row) =>
      row.sd().everyany(ri(1, 3), ri(-3, -1)) ||
      row.idxs().some((i) => row.wo(i).sd().everyany(ri(1, 3), ri(-3, -1))),
  )
  .check(621)

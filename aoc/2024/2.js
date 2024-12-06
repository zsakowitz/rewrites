import "../util.js"

input(2024, 2)
  .lines()
  .sws()
  .num()
  .count((row) => row.sd().everyany(ri(1, 3), ri(-3, -1)))
  .check(591)

input(2024, 2)
  .lines()
  .sws()
  .num()
  .count(
    (row) =>
      row.sd().everyany(ri(1, 3), ri(-3, -1)) ||
      row.k().some((i) => row.wo(i).sd().everyany(ri(1, 3), ri(-3, -1))),
  )
  .check(621)

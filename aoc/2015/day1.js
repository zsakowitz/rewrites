import "../util.js"

input(2015, 1)
  .do((x) => x.count("(") - x.count(")"))
  .check(74)

input(2015, 1)
  .chars()
  .reduce((a, b, idx) => (b == ")" ? (a == 0 ? br(idx + 1) : a - 1) : a + 1), 0)
  .check(1795)

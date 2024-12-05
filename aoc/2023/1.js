import "../util.js"

input(2023, 1)
  .lines()
  .sum((x) => 10 * x.digits()[0] + +x.digits().last)
  .check(55172)

input(2023, 1)
  .lines()
  .sum((x) => 10 * x.digitnamesfwd()[0] + +x.digitnamesrev()[0])
  .check(54925)

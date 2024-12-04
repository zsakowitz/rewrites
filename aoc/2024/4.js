import "../util.js"

// p1
const i = input(2024, 4)

const v =
  i
    .grid()
    .k()
    .sum(
      (q) =>
        q.diag(3, 3).join("").is("XMAS".mx()) +
        q.diag(3, -3).join("").is("XMAS".mx()),
    ) +
  i.count("XMAS".mx()) +
  i.tx().count("XMAS".mx())

v.check(2504)

// p2
const a = i.grid()
a.k()
  .sum(
    (pt) =>
      +(
        pt.tl().diag(2, 2).join("").is("SAM".mx()) &&
        pt.tr().diag(-2, 2).join("").is("SAM".mx())
      ),
  )
  .check(1923)

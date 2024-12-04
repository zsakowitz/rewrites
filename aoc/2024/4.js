import "../util.js"

// p1
{
  const i = input(2024, 4)
  const a = i.grid()

  ;(
    i
      .grid()
      .k()
      .sum(
        (q) =>
          (a.diag(q, 3, 3)?.join("") == "XMAS") +
          (a.diag(q, 3, 3)?.join("") == "SAMX") +
          (a.diag(q, 3, -3)?.join("") == "XMAS") +
          (a.diag(q, 3, -3)?.join("") == "SAMX"),
      ) +
    i.count("XMAS") +
    i.count("SAMX") +
    i.tx().do((i) => i.count("XMAS") + i.count("SAMX"))
  ).check(2504)
}

// p2
{
  const i = input(2024, 4)
  const a = i.grid()
  a.k()
    .sum((pt) => {
      const { i, j } = pt
      return +(
        (a.diag(pt.tl(), 2, 2)?.join("") == "MAS" ||
          a.diag(pt.tl(), 2, 2)?.join("") == "SAM") &&
        (a[i - 1]?.[j + 1] + a[i]?.[j] + a[i + 1]?.[j - 1] == "MAS" ||
          a[i - 1]?.[j + 1] + a[i]?.[j] + a[i + 1]?.[j - 1] == "SAM")
      )
    })
    .check(1923)
}

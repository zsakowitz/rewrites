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
  const i = input()
  const a = i.lines().map((x) => x.chars())
  let b = 0
  for (let i = 1; i < a.length - 1; i++) {
    for (let j = 1; j < a[0].length - 1; j++) {
      b += +(
        +(
          a[i - 1]?.[j - 1] + a[i]?.[j] + a[i + 1]?.[j + 1] == "MAS" ||
          a[i - 1]?.[j - 1] + a[i]?.[j] + a[i + 1]?.[j + 1] == "SAM"
        ) &&
        +(
          a[i - 1]?.[j + 1] + a[i]?.[j] + a[i + 1]?.[j - 1] == "MAS" ||
          a[i - 1]?.[j + 1] + a[i]?.[j] + a[i + 1]?.[j - 1] == "SAM"
        )
      )
    }
  }
  b.check(1923)
}

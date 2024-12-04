import "../util.js"

// p1
{
  const i = input(2024, 4)
  const a = i.grid()
  let b = 0
  for (const { i, j } of a.k()) {
    b +=
      +(
        a[i][j] + a[i + 1]?.[j + 1] + a[i + 2]?.[j + 2] + a[i + 3]?.[j + 3] ==
        "XMAS"
      ) +
      +(
        a[i][j] + a[i + 1]?.[j + 1] + a[i + 2]?.[j + 2] + a[i + 3]?.[j + 3] ==
        "SAMX"
      ) +
      +(
        a[i][j] + a[i - 1]?.[j + 1] + a[i - 2]?.[j + 2] + a[i - 3]?.[j + 3] ==
        "XMAS"
      ) +
      +(
        a[i][j] + a[i - 1]?.[j + 1] + a[i - 2]?.[j + 2] + a[i - 3]?.[j + 3] ==
        "SAMX"
      )
  }
  ;(
    b +
    i.match(/XMAS/g).length +
    i.match(/SAMX/g).length +
    i.tx().do((i) => i.match(/XMAS/g).length + i.match(/SAMX/g).length)
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

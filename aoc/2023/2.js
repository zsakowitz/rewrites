import "../util.js"

// p1
input(2023, 2)
  .lines()
  .sum((x) =>
    x.cap(
      /^Game (\d+): (.+)$/,
      ([, id, contents]) =>
        contents.on`; `.none((x) =>
          x.on`, `.some((x) =>
            x.on` `.do(
              ([n, kind]) =>
                (kind == "red" && +n > 12) ||
                (kind == "green" && +n > 13) ||
                (kind == "blue" && +n > 14),
            ),
          ),
        ) && +id,
    ),
  )
  .check(2369)

// p2
input(2023, 2)
  .lines()
  .sum((x) => {
    let r = 0,
      g = 0,
      b = 0

    x.cap(/^Game (\d+): (.+)$/, 2).on`; `.forEach((x) =>
      x.on`, `.forEach((x) =>
        x.on` `.do(
          ([n, kind]) =>
            (kind == "red" && (r = r.max(+n))) ||
            (kind == "green" && (g = g.max(+n))) ||
            (kind == "blue" && (b = b.max(+n))),
        ),
      ),
    )

    return r * g * b
  })
  .check(66363)

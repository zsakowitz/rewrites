import "../util.js"

// p1
input(2023, 2)
  .lines()
  .map((x) =>
    x
      .match(/^Game (\d+): (.+)$/)
      .slice(1)
      .do(([id, contents]) =>
        contents
          .split("; ")
          .none((x) =>
            x
              .split(", ")
              .some((x) =>
                x
                  .split(" ")
                  .do(
                    ([n, kind]) =>
                      (kind == "red" && +n > 12) ||
                      (kind == "green" && +n > 13) ||
                      (kind == "blue" && +n > 14),
                  ),
              ),
          )
          ? id
          : null,
      ),
  )
  .filter((x) => x != null)
  .sum()
  .check(2369)

// p2
input(2023, 2)
  .lines()
  .map((x) =>
    x
      .match(/^Game (\d+): (.+)$/)
      .slice(1)
      .do(([id, contents]) => {
        let r = 0,
          g = 0,
          b = 0

        contents
          .split("; ")
          .forEach((x) =>
            x
              .split(", ")
              .forEach((x) =>
                x
                  .split(" ")
                  .do(
                    ([n, kind]) =>
                      (kind == "red" && (r = r.max(+n))) ||
                      (kind == "green" && (g = g.max(+n))) ||
                      (kind == "blue" && (b = b.max(+n))),
                  ),
              ),
          )

        return r * g * b
      }),
  )
  .sum()
  .check(66363)

import "../util.js"

const g = input(2023, 3).grid()

const data = g.flatMap((row, j) =>
  row
    .map((x, i) => [x, i])
    .filter(([x, i]) => x.is(/\d/) && !row[i - 1]?.is(/\d/))
    .map(([x, i]) => {
      let a = i
      while (row[i + 1]?.is(/\d/)) {
        i++
      }
      return [j, a, i]
    }),
)

data
  .filter(([r, a, b]) =>
    ri(a - 1, b + 1)
      .by(ri(r - 1, r + 1))
      .some((x) => g[x[1]]?.[x[0]]?.is(/[^0-9.]/)),
  )
  .map(([r, a, b]) => +g[r].slice(a, b + 1).join(""))
  .sum()
  .check(527144) // part 1

{
  function expand(p) {
    if (!p.v?.is(/\d/)) {
      return null
    }
    let a = pt(p.x, p.y, undefined, p.g)
    let b = pt(p.x, p.y, undefined, p.g)
    while (a.l().v?.is(/\d/)) {
      a = a.l()
    }
    while (b.r().v?.is(/\d/)) {
      b = b.r()
    }
    return [a.x, b.x, +p.g[p.i].slice(a.x, b.x + 1).join("")]
  }

  const gs = input(2023, 3)
    .grid()
    .k()
    .filter((pt) => pt.v.is(/[^\d.]/))
    .toArray()
    .sum((pt) => {
      const t = expand(pt.t())
      const b = expand(pt.b())
      const l = expand(pt.l())
      const r = expand(pt.r())
      const lt = t && t[0] < pt.x ? null : expand(pt.lt())
      const lb = b && b[0] < pt.x ? null : expand(pt.lb())
      const rt =
        (t && t[1] > pt.x) || (lt && lt[1] > pt.x) ? null : expand(pt.rt())
      const rb =
        (b && b[1] > pt.x) || (lb && lb[1] > pt.x) ? null : expand(pt.rb())
      const a = [t, b, l, r, lt, lb, rt, rb].filter((x) => x !== null)
      if (a.length != 2) return 0
      if (a[0][2] == a[1][2])
        a.log(
          pt,
          input(2023, 3)
            .grid()
            [pt.i].slice((pt.j - 5).clamp(0, 100), (pt.j + 5).clamp(0, 100))
            .join(""),
        )
      return a[0][2] * a[1][2]
    })

  gs.check(81463996) // part 2
}

import "../util.js"

function go(input, part) {
  // same on both
  const g = input.grid()
  const output = g.map((r) => r.map((x) => 0))
  const chars = input
    .trim()
    .match(/[^.\s]/g)
    .unique()
  for (const char of chars) {
    const poss = g
      .k()
      .filter((x) => x.v == char)
      .toArray()
    for (let i = 0; i < poss.length; i++) {
      for (let j = i + 1; j < poss.length; j++) {
        const a = poss[i]
        const b = poss[j]
        if (part == 1) {
          const c = pt(b.x + (b.x - a.x), b.y + (b.y - a.y))
          const d = pt(a.x + (a.x - b.x), a.y + (a.y - b.y))
          if (g.has(c)) {
            output[c.i][c.j] = true
          }
          if (g.has(d)) {
            output[d.i][d.j] = true
          }
        } else {
          for (const [ax, bx] of [
            [a, b],
            [b, a],
          ]) {
            let n = 0
            while (true) {
              const c = pt(bx.x + n * (bx.x - ax.x), bx.y + n * (bx.y - ax.y))
              if (g.has(c)) {
                output[c.i][c.j] = true
              } else break
              n++
            }
          }
        }
      }
    }
  }

  // same on both:
  return output.sum((x) => x.count((x) => x == true))
}

go(input(2024, 8), 1).check(390)
go(input(2024, 8), 2).check(1246)

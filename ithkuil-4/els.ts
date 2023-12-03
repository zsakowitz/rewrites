// const source = ["2x+1", "x+y", "2y+1", "x-2", "y-6", "9"]
const source = ["2+2x", "x+y-1", "2y-1", "x+1", "y", "3"]

// (x-1)^2 + (y-3)^2 - 1 = 0
// x^2 - 2x + 1 + y^2 - 6y + 9 - 1 = 0
// 1(xx) + 0(xy) + 1(yy) + -2(x) + -6(y) + 9 = 0
// 1+2x,

const els = source.map((a, ai) => [a, ai] as const)

const result = els
  .flatMap(([a, ai]) =>
    els
      .map(([b, bi]) => {
        if (ai == bi) {
          return undefined
        }

        return `${a}=${b} \\left \\{${source
          .map((source) => `${a} \\le ${source}`)
          .join("\\right \\} \\left \\{")} \\right \\}`
      })
      .filter((x) => x),
  )
  .filter((x) => x)

copy(result.join("\n"))

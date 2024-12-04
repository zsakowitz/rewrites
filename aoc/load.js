import "./util.js"

const [year, day] = today()

await Promise.all([
  ...ri(2015, year - 1)
    .by(ri(1, 25))
    .map(([x, y]) => input(x, y)),
  ...ri(1, day).map((x) => input(year, x)),
])

import "./util.js"

await Promise.all([
  ...ri(2015, 2023)
    .by(ri(1, 25))
    .map(([x, y]) => input(x, y)),
  input(2024, 1),
  input(2024, 2),
  input(2024, 3),
])

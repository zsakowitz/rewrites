import "../util.js"

input(2022, 25)
  .lines()
  .map((x) => x.trim())
  .sum((row) => row.nb("=-012", -2))
  .check(36251175625102)
  .nbal("=-012")
  .check("20===-20-020=0001-02", "YESIMSURE") // part 1

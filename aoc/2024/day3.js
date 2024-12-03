import "../util.js"

// part 1
input`2024/in3.txt`
  .matchAll(/mul\((\d+),(\d+)\)/g)
  .sum((x) => x[1] * x[2])
  .check(175615763)

// part 2
input`2024/in3.txt`
  .replace(/don't\(\).*?(do\(\)|$)/gs, "Q")
  .matchAll(/mul\((\d+),(\d+)\)/g)
  .sum((x) => x[1] * x[2])
  .check(74361272)

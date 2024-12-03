// part 1
{
  input.matchAll(/mul\((\d+),(\d+)\)/g).sum((x) => x[1] * x[2])
}

// part 2
{
  input
    .wo(/don't\(\).*do\(\)/gs)
    .matchAll(/mul\((\d+),(\d+)\)/g)
    .sum((x) => x[1] * x[2])
}

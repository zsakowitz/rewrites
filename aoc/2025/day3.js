// part 1
{
  input
    .matchAll(/mul\((\d+),(\d+)\)/g)
    .map((x) => +x[1] * +x[2])
    .reduce((a, b) => a + b)
}

// part 2
{
  let on = true
  input
    .matchAll(/mul\((\d+),(\d+)\)|do\(\)|don't\(\)/g)
    .map((x) => {
      if (x[0].startsWith("don't")) {
        on = false
        return 0
      } // this was just x.startsWith initially cuz im dumb
      if (x[0].startsWith("do")) {
        on = true
        return 0
      }
      console.log(+x[1] * +x[2]) // this was giving NaN so that's why its console.logged
      if (on) return +x[1] * +x[2]
      else return 0
    })
    .reduce((a, b) => a + b)
}

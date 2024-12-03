// actual submission
{
  const a = input`2024/in2.txt`
    .split("\n")
    .map((x) => x.split(" ").map((x) => +x))

  function ok(row) {
    if (row.length == 0) return false
    return (
      row.slice(0, -1).every((a, i) => {
        let x = a - row[i + 1]
        return x == 1 || x == 2 || x == 3
      }) ||
      row.slice(0, -1).every((a, i) => {
        let x = a - row[i + 1]
        return x == -1 || x == -2 || x == -3
      })
    )
  }
  a.map(
    (row) => ok(row),
    // uncomment for part 2: || row.map((x,i)=>{
    //    const next=row.slice()
    //    next.splice(i,1)
    //    return ok(next)
    // })
  ).filter((x) => x)
  console.log(a.length)
  // read off .length property from console
}

// using utils
{
  // part 1
  input
    .lines()
    .sws()
    .num()
    .count((row) => row.sd().everyany(ri(1, 3), ri(-3, -1)))

  // part 2
  input
    .lines()
    .sws()
    .num()
    .count(
      (row) =>
        row.sd().everyany(ri(1, 3), ri(-3, -1)) ||
        row.idxs().some((i) => row.wo(i).sd().everyany(ri(1, 3), ri(-3, -1))),
    )
}

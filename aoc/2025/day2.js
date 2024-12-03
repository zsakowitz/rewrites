const a = input.split("\n").map((x) => x.split(" ").map((x) => +x))
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
// read off .length property from console

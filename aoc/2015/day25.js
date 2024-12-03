import "../util.js"

input`2015/in25.txt`
  .match(/\d+/g)
  .num()
  .do((x) => pt(x[1], x[0]).idxbrbrbr())
  .do((x) => ri(2, x))
  .reduce((c) => (c * 252533) % 33554393, 20151125)
  .check(2650453)

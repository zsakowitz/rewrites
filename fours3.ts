function partitions(parts: number, total: number): number[][] {
  if (parts == 1) {
    return [[total]]
  }

  if (parts == 2) {
    // prettier-ignore
    switch (total) {
      case 2: return [[1,1]]
      case 3: return [[1,2],[2,1]]
      case 4: return [[1,3],[2,2],[3,1]]
    }
  }

  throw new Error("Invalid partition.")
}

type Op = (...args: number[]) => number | false
const ops: Op[] = [(a, b) => a + b, (a, b) => a - b]

// prettier-ignore
const finals: number[][] = [
  [],
  [   4.,    .4                     ],
  [  44.,   4.4,   .44              ],
  [ 444.,  44.4,  4.44,  .444       ],
  [4444., 444.4, 44.44, 4.444, .4444],
]

function go(fours: number, depth: number): number[] {}

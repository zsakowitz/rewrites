import { Crate } from "./citrus"

const N = 4
const crate = new Crate(new Uint8Array(N ** 2), N)
let k = 0
const max = 3 ** ((N - 2) ** 2) // hardcoded 3 for states
console.time()
for (let n = 0; n < max; n++) {
  for (let r = 0; r < N - 2; r++) {
    for (let c = 0; c < N - 2; c++) {
      crate.data[N * (r + 1) + (c + 1)] =
        Math.floor(n / 3 ** ((N - 2) * r + c)) % 3
    }
  }

  for (let a = 0; a < N; a++) {
    for (let b = 0; b < N; b++) {
      for (let c = 0; c < N; c++) {
        for (let d = 0; d < N; d++) {
          const c1 = a ? a - 1 : -1 //                 top edge    (except tr)
          const c2 = b ? b + N * (N - 1) : -1 //       bottom edge (except bl)
          const c3 = c ? N * c : -1 //                 left edge   (except tl)
          const c4 = d ? N * (d - 1) + (N - 1) : -1 // right edge  (except br)

          if (c1 != -1) crate.data[c1] = 1
          if (c2 != -1) crate.data[c2] = 1
          if (c3 != -1) crate.data[c3] = 1
          if (c4 != -1) crate.data[c4] = 1

          k += crate.isValid() ? 1 : 0

          if (c1 != -1) crate.data[c1] = 0
          if (c2 != -1) crate.data[c2] = 0
          if (c3 != -1) crate.data[c3] = 0
          if (c4 != -1) crate.data[c4] = 0
        }
      }
    }
  }
}
console.timeEnd()
console.log(k)
// 2 =>   0.05ms
// 3 =>   0.92ms
// 4 =>   2.97ms

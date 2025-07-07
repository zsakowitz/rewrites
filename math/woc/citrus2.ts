import { Crate } from "./citrus"

const N = 4
const crate = new Crate(new Uint8Array(N ** 2), N)
let k = 0
const max = 3 ** ((N - 2) ** 2) // hardcoded 3 for states
console.time()
for (let n = 0; n < max; n++) {
  for (let r = 0; r < N - 2; r++) {
    for (let c = 0; c < N - 2; c++) {
      crate.data[N * r + c] = Math.floor(n / N ** (N * r + c)) % N
    }
  }

  k += crate.isValid() ? 1 : 0
}
console.timeEnd()
console.log(k)
// 2 => 0.07ms
// 3 => 4ms

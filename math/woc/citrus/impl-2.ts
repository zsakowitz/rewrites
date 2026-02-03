import { Crate } from "./impl-1"

const N = 5
const crate = new Crate(new Uint8Array(N ** 2), N)
let k = 0
const kcol: number[] = Array(N).fill(0)
const max = 3 ** ((N - 2) ** 2) // hardcoded 3 for states
console.time()
for (let n = 0; n < max; n++) {
    crate.data.fill(0)

    for (let r = 0; r < N - 2; r++) {
        for (let c = 0; c < N - 2; c++) {
            const cidx = N * (r + 1) + (c + 1)
            const cval = Math.floor(n / 3 ** ((N - 2) * r + c)) % 3
            crate.data[cidx] = cval
        }
    }

    if (crate.hasConsecutiveRed()) {
        continue
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

                    if (crate.isValid()) {
                        k++
                        const col = c1 == -1 ? c4 : c1
                        kcol[col] ??= 0
                        kcol[col]!++
                    }

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
// console.log(k)
console.log(kcol[1])
// 2 =>  0ms
// 3 =>  0ms
// 4 =>  3ms
// 5 => 90ms

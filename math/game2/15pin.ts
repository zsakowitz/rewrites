import { mex, type NimValue } from "./nim"

/**
 * 15-bit pin code. Pins are:
 *
 *         0
 *        1 2
 *       3 4 5
 *      6 7 8 9
 *     0 1 2 3 4 // add 10 to each
 */
type PinCode = number

type Jump = [src: PinCode, mid: PinCode, dst: PinCode]

const JUMPS_RAW = [
  [0, 1, 3],
  [0, 2, 5],
  [1, 3, 6],
  [1, 4, 8],
  [2, 4, 7],
  [2, 5, 9],
  [3, 6, 10],
  [3, 7, 12],
  [4, 7, 11],
  [4, 8, 13],
  [5, 8, 12],
  [5, 9, 14],
  [3, 4, 5],
  [6, 7, 8],
  [7, 8, 9],
  [10, 11, 12],
  [11, 12, 13],
  [12, 13, 14],
].map((x) => x.map((el) => 1 << (14 - el)) as Jump)

/** Map from pincode to appropriate nimber. */
const cache = new Map<PinCode, NimValue>()

function check(code: PinCode): NimValue {
  if (cache.has(code)) {
    return cache.get(code)!
  }

  const els: NimValue[] = []
  for (const [src, mid, dst] of JUMPS_RAW) {
    if (code & src && code & mid && !(code & dst)) {
      els.push(check(code ^ src ^ mid ^ dst))
    }
    if (code & dst && code & mid && !(code & src)) {
      els.push(check(code ^ src ^ mid ^ dst))
    }
  }
  const ret = mex(els)
  cache.set(code, ret)
  return ret
}

const INIT = 0x7fff
function checkInit(): NimValue {
  if (cache.has(INIT)) {
    return cache.get(INIT)!
  }
  const ret = mex(Array.from({ length: 15 }, (_, i) => check(INIT ^ (1 << i))))
  cache.set(INIT, ret)
  return ret
}

function logPos(code: PinCode) {
  const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o] = code
    .toString(2)
    .padStart(15, "0")
  return `    ${a}
   ${b} ${c}
  ${d} ${e} ${f}
 ${g} ${h} ${i} ${j}
${k} ${l} ${m} ${n} ${o}`
}

function log(code: PinCode) {
  return `${logPos(code)} = *${check(code)}`
}

const ALL = Array.from({ length: INIT }, (_, i) => [i, check(i)] as const)
ALL.push([INIT, checkInit()])

console.log(ALL.map(([k, v]) => log(k)).join("\n\n"))

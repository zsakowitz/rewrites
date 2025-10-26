import type { Nimber } from "../game2/nim"

function evil(a: Nimber): boolean {
  let c = false
  for (let i = 0; i < 16; i++) {
    c = c !== !!(a & (1 << i))
  }
  return !c
}

function uprod(a: Nimber, b: Nimber): Nimber {
  let c = 0
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const I = 1 << i
      const J = 1 << j
      if (!(a & I && b & J)) {
        continue
      }
      if (i < j) {
        c ^= (evil(I) ? 0 : J) + Math.floor(I / 2)
      } else if (i > j) {
        c ^= (evil(J) ? 0 : I) + Math.floor(J / 2)
      } else {
        c ^= Math.ceil(I / 2)
      }
    }
  }
  return c
}

console.log(
  Array.from({ length: 256 }, (_, i) =>
    Array.from({ length: 256 }, (_, j) => uprod(i, j)).join("\t"),
  ).join("\n"),
)

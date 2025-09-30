import { Path, tex } from "../object"

export function xor() {
  const TEX = tex(256, 256, (ctx) => {
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        ctx.beginPath()
        ctx.rect(i, j, 1, 1)
        const r = (360 / 256) * (i ^ j)
        const g = 0
        const b = 0
        ctx.fillStyle = `hsl(${r} 100% 50%)`
        ctx.fill()
      }
    }
  })
  return new Path().fn((ctx) => {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(TEX, 0, 0, 1, 1)
  })
}

export const B = "#3C82F5"
export const R = "#EF4345"
export const G = "#17A34A"

const x = 100 * Math.SQRT1_2

function branch1(base: Path) {
  base.ground()
  const A = base.fork(-x)
  A.fork(x)
  A.fork(-x)
  const B = A.fork(0).fork(0)
  B.fork(-x)
  B.fork(0).fork(x)
  base.fork(20)
  const C = base.fork(90).fork(0)
  C.fork(0)
  C.fork(x).fork(x).fork(-x).fork(x)
}

function branch2(base: Path) {
  base.ground()
  base.fork(0)
  base.fork(-x).fork(0)
  base.fork(x).fork(0).fork(0)
}

function branch3(base: Path) {
  base.ground()
  const LIMIT = 600
  const FACTOR = 2 / 3
  let height = LIMIT * (1 - FACTOR)
  let color = R
  for (let i = 0; i < 40; i++) {
    base = base.fork(0, -height).stroke((color = color == R ? B : R))
    height *= FACTOR
  }
}

function branch4(base: Path) {
  const root = base
  const LIMIT = 600
  const FACTOR = 2 / 3
  let height = LIMIT * (1 - FACTOR)
  let color = R
  base = base.moveBy(0, -LIMIT)
  for (let i = 0; i < 40; i++) {
    base = base.fork(0, height).stroke((color = color == R ? B : R))
    height *= FACTOR
  }
  root.ground()
}

export function branches() {
  const base = new Path()
  base.stroke(G)

  branch1(base.forkBy(0, 0))
  branch2(base.forkBy(-300, 200))
  branch3(base.forkBy(300, 200))
  branch4(base.forkBy(450, 200))

  return base
}

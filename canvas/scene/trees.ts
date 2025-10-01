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
export const L = "#404a59"

const x = 100 * Math.SQRT1_2

function* limitSeq(x0: number, x1: number, first: number) {
  let base = 1
  for (let i = 0; i < 100; i++) {
    yield x0 + (x1 - x0) * base
    base *= 1 - first
  }
}

function* diffSeq(x0: number, x1: number, first: number) {
  let last = x1
  let base = 1
  for (let i = 0; i < 1000; i++) {
    base *= 1 - first
    yield last - (x0 + (x1 - x0) * base)
    last = x0 + (x1 - x0) * base
  }
}

function branch1(base: Path) {
  base.ground()
  const A = base.branch(-x)
  A.branch(x)
  A.branch(-x)
  const B = A.branch(0).branch(0)
  B.branch(-x)
  B.branch(0).branch(x)
  base.branch(20)
  const C = base.branch(90).branch(0)
  C.branch(0)
  C.branch(x).branch(x).branch(-x).branch(x)
}

function branch2(base: Path) {
  base.ground()
  base.branch(0)
  base.branch(-x).branch(0)
  base.branch(x).branch(0).branch(0)
}

function branch9(base: Path) {
  base.ground()
  base.branch(0)
  base.branch(-x).branch(0)
}

function branch7(base: Path) {
  base.ground()
  base.branch(0)
  base.branch(-x).branch(0).branch(0)
  base.branch(x).branch(0).branch(0).branch(0)
}

function branch8(base: Path) {
  base.ground()
  base.branch(0).branch(0).branch(0).branch(0).branch(0).branch(0)
  base.branch(-x).branch(0).branch(0)
  base.branch(x).branch(0).branch(0).branch(0).branch(0)
}

function branch3(base: Path) {
  base.ground()
  const LIMIT = 600
  const FACTOR = 2 / 3
  let height = LIMIT * (1 - FACTOR)
  let color = R
  for (let i = 0; i < 40; i++) {
    base = base.branch(0, -height).stroke((color = color == R ? B : R))
    height *= FACTOR
  }
}

function branch4(base: Path) {
  const root = base
  let color = R
  base = base.forkBy(0, -599.999)
  for (const height of diffSeq(0, 599, 1 / 3)) {
    base = base.branch(0, height).stroke((color = color == R ? B : R))
  }
  root.ground()
}

function branch5(base: Path) {
  base = base.ground().stroke(B).branch(0)
  for (const el of limitSeq(Math.PI / 2, -Math.PI / 2, 1 - Math.SQRT1_2)) {
    base.branch(100 * Math.sin(el)).stroke(R)
  }
}

function branch6(base: Path) {
  base = base.ground().stroke(B).branch(0)
  for (const el of diffSeq(0, -300, 0.2)) {
    base = base.branch(0, el).stroke(R)
  }
}

export function branches() {
  const base = new Path()
  base.translate(960, 540)
  base.stroke(G)

  branch1(base.forkBy(0, 0))
  branch7(base.forkBy(400, 100))
  branch8(base.forkBy(-350, 300))
  branch2(base.forkBy(100, 400))
  branch9(base.forkBy(-100, 200))
  branch3(base.forkBy(900, 200))
  branch4(base.forkBy(1050, 200))
  branch5(base.forkBy(300, 1100))
  branch6(base.forkBy(150, 1100))

  const X = base.forkBy(-800, 0).ground()
  X.branch(0).branch(80).stroke(B)
  X.branch(-x)

  const Y = base.forkBy(-800, 300).ground()
  Y.branch(0).stroke(B)
  Y.branch(x).stroke(R).branch(0)

  return base
}

export function grid() {
  const rect = new Path().lineWidth(1).stroke("#959fad")
  for (let i = -10; i < 10; i++) {
    const x1 = 1920 * i - 10
    const y1 = 1080 * i - 10
    const x2 = 1920 * i + 10
    const y2 = 1080 * i + 10
    rect.path().moveTo(x1, -1e6).lineTo(x1, 1e6)
    rect.path().moveTo(x2, -1e6).lineTo(x2, 1e6)
    rect.path().moveTo(-1e6, y1).lineTo(1e6, y1)
    rect.path().moveTo(-1e6, y2).lineTo(1e6, y2)
  }
  return rect
}

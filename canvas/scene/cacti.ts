import { B, G, R } from "../core/colors"
import { Path } from "../core/object"
import { diffSeq, limitSeq } from "../core/seq"

const x = 100 * Math.SQRT1_2

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

export function cacti() {
  const base = new Path()
  base.translate(960, 540)
  base.stroke(G)

  branch1(base.forkBy(0, 0))
  branch7(base.forkBy(600, 100))
  branch8(base.forkBy(-750, 300))
  branch2(base.forkBy(100, 400))
  branch9(base.forkBy(-300, 200))
  base.forkBy(550, 450).ground().branch(0)
  // branch3(base.forkBy(900, 200))
  // branch4(base.forkBy(1050, 200))
  // branch5(base.forkBy(300, 1100))
  // branch6(base.forkBy(150, 1100))

  // const X = base.forkBy(-800, 0).ground()
  // X.branch(0).branch(80).stroke(B)
  // X.branch(-x)
  //
  // const Y = base.forkBy(-800, 300).ground()
  // Y.branch(0).stroke(B)
  // Y.branch(x).stroke(R).branch(0)

  return base
}

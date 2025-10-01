import { B, G, R } from "../core/colors"
import { Path } from "../core/object"

export function flowerbed() {
  const base = new Path().by(0.5, 0.5).stroke(G)

  base.ground().branch(0).petal(60, B)
  base.branch(-60)

  {
    const a = base.forkBy(300, -200).ground()
    a.branch(-60)
    const A = a.branch(0)
    A.petal(60, B)
    A.petal(-60, B)
    A.petal(0, R)
  }

  return base
}

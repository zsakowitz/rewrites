import { B, G } from "../core/colors"
import { Path } from "../core/object"

export function flowerbed() {
  const base = new Path().by(0.5, 0.5)
  const T = base.ground().stroke(G).branch(0)
  T.petal(60).stroke(B)
  T.node()
  base.branch(-60)
  return base
}

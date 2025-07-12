import { Any } from "./any"
import { Dyadic } from "./dyadic"
import { Empty } from "./empty"
import { Int } from "./int"

export function fromConst(x: number, digits = 16) {
  const intPart = Math.floor(x)
  x -= intPart
  const int = new Int(intPart)

  let ret = 0
  let exp = 0
  for (let i = 0; i < digits && x != 0; i++) {
    exp++
    const f = Math.floor(2 * x)
    ret = 2 * ret + f
    x = 2 * x - f
  }
  const dyadic = new Dyadic(ret, exp)

  if (intPart) {
    if (dyadic.size) {
      return new Any(int, dyadic)
    } else {
      return int
    }
  } else {
    if (dyadic.size) {
      return dyadic
    } else {
      return new Empty()
    }
  }
}

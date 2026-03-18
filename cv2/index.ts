import { Axes } from "./2d-object/axes"
import { Axes2 } from "./2d-object/axes2"
import { XorPattern } from "./2d-object/misc"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 5, sy: 5, tx: 0, ty: 2 })
document.body.appendChild(cv.el)

cv.push(new XorPattern())
cv.push(new Axes())
cv.push(new Axes2())

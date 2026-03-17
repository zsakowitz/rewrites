import { Canvas2 } from "./2d/canvas"
import { Axes } from "./2d/object-types"

const cv = new Canvas2({ sx: 1, sy: 1, tx: 0, ty: 0 })
document.body.appendChild(cv.el)

cv.push(new Axes())

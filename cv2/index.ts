import { Axes } from "./2d-object/axes"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 1, sy: 1, tx: 0, ty: 0 })
document.getElementById("main")!.appendChild(cv.el)

cv.push(new Axes())

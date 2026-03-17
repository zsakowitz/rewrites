import { Axes, AxisLabels } from "./2d-object/axes"
import { XorPattern } from "./2d-object/misc"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 0 })
document.getElementById("main")!.appendChild(cv.el)

cv.push(new XorPattern())
cv.push(new Axes())
cv.push(new AxisLabels())

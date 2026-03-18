import { Grid } from "./2d-object/grid"
import { XorPattern } from "./2d-object/misc"
import { Plot } from "./2d-object/plot"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 80.398236, sy: 80.398236, tx: 20, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())
cv.push(new XorPattern())
cv.push(new Plot((x) => -Math.tan(x)))

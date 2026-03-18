import { Grid } from "./2d-object/grid"
import { XorPattern } from "./2d-object/misc"
import { PlotImplicit } from "./2d-object/plot-implicit"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())
cv.push(new XorPattern())
cv.push(new PlotImplicit((x, y) => Math.sin(x * y) - Math.cos(y)))

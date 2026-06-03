import { Grid } from "./2d-object/grid"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 1.0e7, sy: 1.0e7, tx: 1.3e7, ty: 0.4e7 })

document.body.appendChild(cv.el)

cv.push(new Grid())

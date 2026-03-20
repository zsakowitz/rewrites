import { ForceGraphLib } from "./2d-object/force-graph-2"
import { Grid } from "./2d-object/grid"
import { Canvas2 } from "./2d/canvas"
import { createGraph } from "./tbd/fair-shares-unequal-pairs"

const cv = new Canvas2({ sx: 20, sy: 20, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())

const g = new ForceGraphLib(createGraph(9))
cv.push(g)
g.fdg.onEngineTick(() => cv.redraw())

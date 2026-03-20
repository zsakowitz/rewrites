import { ForceGraph } from "./2d-object/force-graph"
import { ForceGraphLib } from "./2d-object/force-graph-2"
import { Grid } from "./2d-object/grid"
import { Canvas2 } from "./2d/canvas"
import "./tbd/fair-shares-unequal-pairs"
import { createGraph } from "./tbd/fair-shares-unequal-pairs"

const cv = new Canvas2({ sx: 20, sy: 20, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())

// const g = new ForceGraph(createGraph(6))
// cv.push(g)
cv.push(new ForceGraphLib(createGraph(9)))

// let time = performance.now()

requestAnimationFrame(function f(d) {
    requestAnimationFrame(f)
    // g.update((Date.now() - time) / 1000)
    // g.update((d - time) / 500)
    // time = d
    cv.redraw()
})

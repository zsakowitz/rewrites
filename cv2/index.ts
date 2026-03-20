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

let fpsElement = document.getElementById("fps")!

let then = Date.now() / 1000 // get time in seconds

let render = function () {
    let now = Date.now() / 1000 // get time in seconds

    // compute time since last frame
    let elapsedTime = now - then
    then = now

    // compute fps
    let fps = 1 / elapsedTime
    fpsElement.innerText = fps.toFixed(2)

    requestAnimationFrame(render)
}
render()

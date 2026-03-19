import { ForceGraph } from "./2d-object/force-graph"
import { Grid } from "./2d-object/grid"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())

const fdg = new ForceGraph()
fdg.nodes.push({ pos: [1, 2], label: "0" })
fdg.nodes.push({ pos: [3, -4], label: "1" })
fdg.nodes.push({ pos: [-2, 3], label: "2" })
fdg.edges.push([0, 1])
fdg.edges.push([1, 2])
cv.push(fdg)

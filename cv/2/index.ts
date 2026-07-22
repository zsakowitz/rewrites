import { generateChopsticks } from "../../chopsticks"
import { ForceGraphLib } from "./2d-object/force-graph-2"
import { Grid } from "./2d-object/grid"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 20, sy: 20, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())

cv.push(new ForceGraphLib(generateChopsticks(5)))

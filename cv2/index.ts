import { drawCircle, drawLine, drawPoint } from "./2d-object/geo"
import { Grid } from "./2d-object/grid"
import { XorPattern } from "./2d-object/misc"
import { Canvas2 } from "./2d/canvas"
import type { Vec2 } from "./2d/vec"

const cv = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())
cv.push(new XorPattern())

let p1: Vec2 = [0, 0]

cv.pushFn(() => {
    drawPoint(cv, p1)
    drawCircle(cv, [4, 5], 2)
    drawLine(cv, p1, [4, 5])
})

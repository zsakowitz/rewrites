import { drawCircle, drawLine } from "./2d-object/geo"
import { GeoPoint } from "./2d-object/geo-point"
import { Grid } from "./2d-object/grid"
import { XorPattern } from "./2d-object/misc"
import { Canvas2 } from "./2d/canvas"

const cv = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())
cv.push(new XorPattern())
cv.push(new GeoPoint())

cv.pushFn(() => {
    drawCircle(cv, [4, 5], 2)
    drawLine(cv, [8, 9], [4, 5])
})

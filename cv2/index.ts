import { ForceGraph } from "./2d-object/force-graph"
import { drawCircle, drawLine, drawPoint } from "./2d-object/geo"
import { GeoPoint } from "./2d-object/geo-point"
import { Grid } from "./2d-object/grid"
import { XorPattern } from "./2d-object/misc"
import { Canvas2 } from "./2d/canvas"
import { SizePoint } from "./tbd/dcg"
import { intersection, perpendicularbisector } from "./tbd/geometry"

const cv = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 0 })

document.body.appendChild(cv.el)

cv.push(new Grid())
cv.push(new XorPattern())

const A = new GeoPoint()
const B = new GeoPoint()
const C = new GeoPoint()

cv.pushFn(() => {
    const pAB = perpendicularbisector([A.pos, B.pos])
    const pAC = perpendicularbisector([A.pos, C.pos])
    const pBC = perpendicularbisector([B.pos, C.pos])
    drawLine(cv, pAB)
    drawLine(cv, pAC)
    drawLine(cv, pBC)
    const O = intersection(pAB, pAC)
    drawPoint(cv, O, SizePoint, 0)
    drawCircle(cv, O, Math.hypot(O[0] - A.pos[0], O[1] - A.pos[1]))
})

A.pos = [2, 3]
B.pos = [4, -5]
C.pos = [0, 1]
cv.push(A)
cv.push(B)
cv.push(C)

const fdg = new ForceGraph()
fdg.nodes.push({ pos: [1, 2], label: "0" })
fdg.nodes.push({ pos: [3, -4], label: "1" })
fdg.nodes.push({ pos: [-2, 3], label: "2" })
fdg.edges.push([0, 1])
fdg.edges.push([1, 2])
cv.push(fdg)

import { Canvas2 } from "./2d/canvas"
import { Oklch, XorPattern } from "./2d/object-types"

const cv = new Canvas2({ sx: 1, sy: 1, tx: 0, ty: 0 })

document.body.appendChild(cv.el)
cv.el.style =
    "position:fixed;inset:0;width:100vw;height:100vh;touch-action:none"

cv.push(new XorPattern(1, 0.3, 0, -1))
cv.push(new XorPattern(0.2, 0.7, 0, 0))
cv.push(new XorPattern(1, 0.7, -1, -1))
cv.push(new XorPattern(0.2, 0.3, -1, 0))
cv.push(new Oklch(0.2, 0, 1))
cv.push(new Oklch(0.3, -1, 1))

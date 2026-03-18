import { Axes2 } from "./2d-object/axes2"
import { XorPattern } from "./2d-object/misc"
import { Canvas2 } from "./2d/canvas"

const cv1 = new Canvas2({ sx: 10, sy: 10, tx: 0, ty: 2 })
// const cv2 = new Canvas2({ sx: 9.5, sy: 9.5, tx: 0, ty: 2 })

document.body.appendChild(cv1.el)
// document.body.appendChild(cv2.el)

cv1.push(new XorPattern())
cv1.push(new Axes2())

// cv2.push(new XorPattern())
// cv2.push(new Axes2())

window.addEventListener("keydown", (ev) => {
    if (ev.key == "k") {
        cv1.zoom([0, 0], 1.01)
        // cv2.zoom([0, 0], 1.01)
    }

    if (ev.key == "l") {
        cv1.zoom([0, 0], 1 / 1.01)
        // cv2.zoom([0, 0], 1 / 1.01)
    }

    cv1.redraw()
    // cv2.redraw()
})

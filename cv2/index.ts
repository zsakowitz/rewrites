import { Canvas2, type CanvasArgs } from "./2d/canvas"
import { Position, type PositionArgs } from "./2d/position"
import { apply2 } from "./2d/tform"

const events: CanvasArgs & PositionArgs = {
    onSceneMovement: draw,
    onCanvasUpdate: draw,
}

const cv = new Canvas2(events)
const { el, ctx } = cv
document.body.appendChild(el)
el.style = "position:fixed;inset:0;width:100vw;height:100vh;touch-action:none"

const mv = new Position(events, el, { sx: 10, sy: 10, tx: 0, ty: 0 })

function draw() {
    const { lo } = mv

    cv.reset()
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
            ctx.fillStyle = `rgb(${(i ^ j) * 16}, ${(i & j) * 16}, ${(i | j) * 16})`

            const [x, y] = apply2(lo, [i, j])
            ctx.fillRect(x, y, lo.sx, -lo.sy)
        }
    }
}

el.addEventListener("wheel", mv, { passive: false })
el.addEventListener("pointerdown", mv, { passive: true })
el.addEventListener("pointermove", mv, { passive: true })
el.addEventListener("pointerup", mv, { passive: true })
el.addEventListener("pointercancel", mv, { passive: true })

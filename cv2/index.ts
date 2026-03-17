import { Canvas2, type CanvasArgs } from "./2d/canvas"
import { apply2 } from "./2d/tform"

const events: CanvasArgs = {
    onCanvasUpdate: draw,
}

const cv = new Canvas2(events, {
    sx: 16,
    sy: 16,
    tx: 0,
    ty: 0,
})

const { el, ctx } = cv
document.body.appendChild(el)
el.style = "position:fixed;inset:0;width:100vw;height:100vh;touch-action:none"

function draw() {
    const { tlo: lo } = cv
    cv.reset()

    // const [x, y] = apply2(tlo, [0, 0])
    // const t = ctx.getTransform()
    // ctx.transform(tlo.sx, 0, 0, -tlo.sy, tlo.tx, tlo.ty)
    // ctx.font = "1px sans-serif"
    // ctx.fillText("hello world!", 0, 0)
    // ctx.setTransform(t)

    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
            ctx.fillStyle = `rgb(${(i ^ j) * 16}, ${(i & j) * 16}, ${(i | j) * 16})`

            const [x, y] = apply2(lo, [i, j])
            ctx.fillRect(x, y, lo.sx, lo.sy)
        }
    }
}

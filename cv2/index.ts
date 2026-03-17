import { Canvas2 } from "./2d/canvas"
import { apply2 } from "./2d/tform"

const cv = new Canvas2({ sx: 16, sy: 16, tx: 0, ty: 0 })

const { ctx } = cv
document.body.appendChild(cv.el)
cv.el.style =
    "position:fixed;inset:0;width:100vw;height:100vh;touch-action:none"

cv.pushf(({ tlo }) => {
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
            ctx.fillStyle = rgb(i / 16, j / 16, 0)
            const [x, y] = apply2(tlo, [i, j])
            ctx.fillRect(x, y, tlo.sx, tlo.sy)
        }
    }
})

function rgb(r: number, g: number, b: number) {
    return (
        "#"
        + Math.round(r * 255)
            .toString(16)
            .padStart(2, "0")
        + Math.round(g * 255)
            .toString(16)
            .padStart(2, "0")
        + Math.round(b * 255)
            .toString(16)
            .padStart(2, "0")
    )
}

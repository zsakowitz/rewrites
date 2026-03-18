import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

export class Axes2 extends Object2 {
    draw(cv: Canvas2): void {
        cv.ctx.fillStyle = "black"
        cv.ctx.strokeStyle = "white"
        cv.ctx.font = "12px Symbola"
        cv.ctx.lineWidth = 4

        drawXLines(cv)
        drawYLines(cv)
    }
}

function drawXLines({ height, pixelWidth, ctx, width, tol, tlo }: Canvas2) {
    const [dx, tx, mx] = spacing(pixelWidth)
    const xmin = Math.floor(apply2x(tol, 0) / dx)
    const xmax = Math.ceil(apply2x(tol, width) / dx)

    for (let x = xmin; x <= xmax; x++) {
        const ox = apply2x(tlo, x * dx)

        for (const [multiplier, alpha] of mx) {
            if (x % multiplier == 0) {
                ctx.globalAlpha = alpha
                ctx.fillRect(ox, 0, 1, Math.ceil(height))
                break
            }
        }
    }

    const tmin = Math.floor(apply2x(tol, 0) / tx)
    const tmax = Math.ceil(apply2x(tol, width) / tx)
    const oy = apply2y(tlo, 0)
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    for (let x = tmin; x <= tmax; x++) {
        const lx = x * tx
        const ox = apply2x(tlo, x * tx)

        const label = (lx < 0 ? "−" : "") + Math.abs(lx).toFixed(2)
        ctx.globalAlpha = 0.9
        ctx.strokeText(label, ox, oy + 4)
        ctx.globalAlpha = 1
        ctx.fillText(label, ox, oy + 4)
    }
}

function drawYLines({ height, pixelHeight, ctx, width, tol, tlo }: Canvas2) {
    const [dy, ty, my] = spacing(-pixelHeight)
    const ymin = Math.floor(apply2y(tol, height) / dy)
    const ymax = Math.ceil(apply2y(tol, 0) / dy)

    for (let y = ymin; y <= ymax; y++) {
        const oy = apply2y(tlo, y * dy)

        for (const [multiplier, alpha] of my) {
            if (y % multiplier == 0) {
                ctx.globalAlpha = alpha
                ctx.fillRect(0, oy, Math.ceil(width), 1)
                break
            }
        }
    }

    const tmin = Math.floor(apply2y(tol, height) / ty)
    const tmax = Math.ceil(apply2y(tol, 0) / ty)
    const ox = apply2x(tlo, 0)
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    for (let y = tmin; y <= tmax; y++) {
        const ly = y * ty
        const oy = apply2y(tlo, y * ty)

        const label = (ly < 0 ? "−" : "") + Math.abs(ly).toFixed(2)
        ctx.globalAlpha = 0.9
        ctx.strokeText(label, ox - 4, oy)
        ctx.globalAlpha = 1
        ctx.fillText(label, ox - 4, oy)
    }
}

function spacing(
    pixelSize: number,
): [space: number, text: number, [multiplier: number, alpha: number][]] {
    const log = Math.log10(pixelSize * 4)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 1)
    const diff = log - exp

    const FST: [number, number][] = [
        [50, 1],
        [25, lerp(diff, 0, 0.5, 0.1, 1)],
        [5, lerp(diff, 0, 0.5, 0.1, 1)],
        [1, lerp(diff, 0, 0.5, 0, 0.1)],
    ]

    const SND: [number, number][] = [
        [10, 1],
        [2, lerp(diff, 0.5, 1, 0.1, 0.1)],
        [1, lerp(diff, 0.5, 1, 0, 0.05)],
    ]

    return diff < 1 / 2 ?
            [pow, pow * 5, FST]
        :   [pow * 5, diff < 3 / 4 ? pow * 10 : pow * 20, SND]
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) * (y0 - y1) + y1
}

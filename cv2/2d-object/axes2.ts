import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

export class Axes2 extends Object2 {
    draw(cv: Canvas2): void {
        cv.ctx.fillStyle = "black"
        drawXAxis(cv)
        drawYAxis(cv)
    }
}

function drawXAxis({ height, pixelWidth, ctx, width, tol, tlo }: Canvas2) {
    const [dx, mx] = spacing(pixelWidth)
    const xmin = Math.floor(apply2x(tol, 0) / dx)
    const xmax = Math.ceil(apply2x(tol, width) / dx)

    for (let x = xmin; x <= xmax; x++) {
        const ox = apply2x(tlo, x * dx)

        for (const [multiplier, alpha] of mx) {
            if (x % multiplier == 0) {
                ctx.globalAlpha = alpha
                ctx.fillRect(Math.round(ox), 0, 1, Math.ceil(height))
                break
            }
        }
    }
}

function drawYAxis({ height, pixelHeight, ctx, width, tol, tlo }: Canvas2) {
    const [dy, my] = spacing(-pixelHeight)
    const ymin = Math.floor(apply2y(tol, height) / dy)
    const ymax = Math.ceil(apply2y(tol, 0) / dy)

    for (let y = ymin; y <= ymax; y++) {
        const oy = apply2y(tlo, y * dy)

        for (const [multiplier, alpha] of my) {
            if (y % multiplier == 0) {
                ctx.globalAlpha = alpha
                ctx.fillRect(0, Math.round(oy), Math.ceil(width), 1)
                break
            }
        }
    }
}

function spacing(
    pixelSize: number,
): [space: number, [multiplier: number, alpha: number][]] {
    const log = Math.log10(pixelSize * 4)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 1)
    const diff = log - exp

    const FST: [number, number][] = [
        [25, 1],
        [5, lerp(diff, 0, 0.5, 0.2, 1)],
        [1, lerp(diff, 0, 0.5, 0, 0.2)],
    ]

    const SND: [number, number][] = [
        [10, 1],
        [5, lerp(diff, 0.5, 1, 0, 1)],
        [2, 0.2],
        [1, lerp(diff, 0.5, 1, 0, 0.2)],
    ]

    return diff < 1 / 2 ? [pow, FST] : [pow * 5, SND]
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) * (y0 - y1) + y1
}

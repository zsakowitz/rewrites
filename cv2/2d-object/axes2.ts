import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

export class Axes2 extends Object2 {
    draw({
        height,
        pixelWidth,
        pixelHeight,
        ctx,
        width,
        tol,
        tlo,
    }: Canvas2): void {
        ctx.lineWidth = 0.8

        const [dx, mx] = spacing(pixelWidth)
        const imin = Math.floor(apply2x(tol, 0) / dx)
        const imax = Math.ceil(apply2x(tol, width) / dx)

        // if (imax - imin >= 1e3) {
        // return
        // }

        for (let i = imin; i <= imax; i++) {
            const ox = apply2x(tlo, i * dx)

            for (const [multiplier, alpha] of mx) {
                if (i % multiplier == 0) {
                    ctx.beginPath()
                    ctx.globalAlpha = alpha
                    ctx.moveTo(ox, 0)
                    ctx.lineTo(ox, height)
                    ctx.stroke()
                    break
                }
            }
        }

        const [dy, my] = spacing(-pixelHeight)
        const ymin = Math.floor(apply2y(tol, height) / dy)
        const ymax = Math.ceil(apply2y(tol, 0) / dy)
        console.log(ymin, ymax, dy)

        for (let y = ymin; y <= ymax; y++) {
            const oy = apply2y(tlo, y * dy)

            for (const [multiplier, alpha] of my) {
                if (y % multiplier == 0) {
                    ctx.beginPath()
                    ctx.globalAlpha = alpha
                    ctx.moveTo(0, oy)
                    ctx.lineTo(width, oy)
                    ctx.stroke()
                    break
                }
            }
        }
    }
}

function spacing(
    pixelSize: number,
): [space: number, [multiplier: number, alpha: number][]] {
    const log = Math.log10(pixelSize * 2)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 1)
    const diff = log - exp

    const RED: [number, number][] = [
        [10, 1],
        [5, 0.5],
        [1, lerp(diff, 0, 0.2)],
    ]

    const GREEN: [number, number][] = [
        [10, 1],
        [2, lerp(diff, 0.2, 1)],
        [1, lerp(diff, 0, 0.5)],
    ]

    const BLUE: [number, number][] = [
        [10, 1],
        [5, lerp(diff, 0.5, 1)],
        [1, 0.2],
    ]

    return (
        diff < 1 / 3 ? [pow, RED]
        : diff < 2 / 3 ? [pow * 5, GREEN]
        : [pow * 10, BLUE]
    )
}

function lerp(x: number, y0: number, y1: number) {
    return ((x % 0.33333333333) / 0.33333333) * (y0 - y1) + y1
}

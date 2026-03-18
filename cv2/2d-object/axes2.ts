import { di } from "../../cv/debug"
import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2y } from "../2d/tform"

export class Axes2 extends Object2 {
    draw({ height, pixelHeight, ctx, width, tol, tlo }: Canvas2): void {
        const [dy, my] = spacing(-pixelHeight)
        di.write`${dy}`
        const ymin = Math.floor(apply2y(tol, height) / dy)
        const ymax = Math.ceil(apply2y(tol, 0) / dy)

        for (let y = ymin; y <= ymax; y++) {
            const oy = apply2y(tlo, y * dy)

            for (const [multiplier, alpha] of my) {
                if (y % multiplier == 0) {
                    ctx.fillStyle = `rgb(${255 * (1 - alpha)}, ${255 * (1 - alpha)}, ${255 * (1 - alpha)})`
                    ctx.fillRect(0, Math.round(oy), Math.round(width), 1)
                    break
                }
            }
        }
    }
}

function spacing(
    pixelSize: number,
): [space: number, [multiplier: number, alpha: number][]] {
    const log = Math.log10(pixelSize * 3)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 1)
    const diff = log - exp

    const RED: [number, number][] = [
        [10, 1],
        [5, 0.3],
        [1, lerp(diff, 0, 0.2)],
    ]

    const GREEN: [number, number][] = [
        [10, 1],
        [5, 1],
        [1, lerp(diff, 0, 0.5)],
    ]

    const BLUE: [number, number][] = [
        [10, 1],
        [5, lerp(diff, 0.5, 1)],
        [1, 0.3],
    ]

    return (
        diff < 1 / 3 ? [pow, RED]
        : diff < 2 / 3 ? [pow * 5, GREEN]
        : [pow * 9.99, BLUE]
    )
}

function lerp(x: number, y0: number, y1: number) {
    return ((x % 0.33333333333) / 0.33333333) * (y0 - y1) + y1
}

// Basically, two scales at work:
// Major every 10, minor every 5
// Major every 5, minor every 1

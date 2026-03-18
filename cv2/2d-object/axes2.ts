import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2y } from "../2d/tform"

export class Axes2 extends Object2 {
    draw({
        height,
        pixelWidth: pixelWidthBase,
        ctx,
        width,
        tol,
        tlo,
    }: Canvas2): void {
        const dh = 1

        ctx.fillStyle = "black"
        ctx.font = "2px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.strokeStyle = "black"
        ctx.lineWidth = 1

        for (let h = 0; h < height / dh; h++) {
            const scale = 2 ** apply2y(tol, h * dh)
            const pixelWidth = pixelWidthBase * scale
            const [diff, ms] = spacing(pixelWidth)

            ctx.fillStyle =
                diff < 0.333 ? "red"
                : diff < 0.666 ? "green"
                : "blue"
            ctx.fillText(
                `${pixelWidth.toFixed(4)} ${diff}`,
                width / 2,
                (h + 0.5) * dh,
            )

            for (const el of ms) {
                lines(h, (el[0] * tlo.sx) / scale, el[1])
            }
        }

        function lines(h: number, ox: number, alpha: number) {
            const path = new Path2D()
            const hmin = h * dh
            const hmax = (h + 1) * dh

            if (width / ox > 1000) return

            for (
                let i = width / 2 - Math.ceil(width / ox) * ox;
                i < width;
                i += ox
            ) {
                path.moveTo(Math.round(i), Math.round(hmin))
                path.lineTo(Math.round(i), Math.round(hmax))
            }

            if (alpha == 1) {
                ctx.strokeStyle = "black"
            } else {
                ctx.strokeStyle = `hsl(${Math.round(alpha * 360)}deg ${
                    alpha > 0.5 ? 100 - (alpha - 0.5) * 200 : 100
                }% 50%)`
            }
            // ctx.strokeStyle = `rgb(${255 * (1 - alpha)} ${255 * (1 - alpha)} ${255 * (1 - alpha)})`
            ctx.stroke(path)
        }
    }
}

function spacing(
    pixelSize: number,
): [diff: number, [size: number, alpha: number][]] {
    const log = Math.log10(pixelSize * 3)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 2)
    const diff = log - exp

    const RED: [number, number][] = [
        [pow / 10, lerp(diff, 0, 0.2)],
        [pow / 2, 0.5],
        [pow, 1],
    ]

    const GREEN: [number, number][] = [
        [pow / 2, lerp(diff, 0, 0.5)],
        [pow, lerp(diff, 0.2, 1)],
        [pow * 5, lerp(diff, 0.5, 1)],
        [pow * 10, 1],
    ]

    const BLUE: [number, number][] = [
        [pow, 0.2],
        [5 * pow, 0.5],
        [10 * pow, 1],
    ]

    return [
        diff,
        diff < 1 / 3 ? RED
        : diff < 2 / 3 ? GREEN
        : BLUE,
    ]
}

function lerp(x: number, y0: number, y1: number) {
    return ((x % 0.33333333333) / 0.33333333) * (y0 - y1) + y1
}

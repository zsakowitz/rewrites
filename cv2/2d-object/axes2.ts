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
        const dh = 2

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

            // ctx.strokeStyle = `hsl(${Math.round(alpha * 360)}deg 100% 50%)`
            ctx.strokeStyle = `rgb(${255 * (1 - alpha)} ${255 * (1 - alpha)} ${255 * (1 - alpha)})`
            ctx.stroke(path)
        }
    }
}

function spacing(
    pixelSize: number,
): [diff: number, [size: number, alpha: number][]] {
    const log = Math.log10(pixelSize * 4)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 2)
    const diff = log - exp

    return [
        diff,
        diff < 0.333 ?
            [
                [pow / 10, lerp(diff, 0, 0.333, 0.2, 0)],
                [pow / 2, lerp3(diff, 0, 0.333, 1, 0.2)],
                [pow, 1],
            ]
        : diff < 0.666 ?
            [
                [pow / 2, lerp(diff, 0.333, 0.666, 0.2, 0)],
                [pow, 1],
            ]
        :   [
                [pow, lerp2(diff, 0.666, 1, 1, 0.2)],
                [pow * 5, 1],
            ],
    ]
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) * (y1 - y0) + y0
}

function lerp2(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) ** 0.5 * (y1 - y0) + y0
}

function lerp3(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) ** 0.001 * (y1 - y0) + y0
}

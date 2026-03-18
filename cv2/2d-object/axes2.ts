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
        const dh = 40

        ctx.fillStyle = "black"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.strokeStyle = "black"
        ctx.lineWidth = 1

        for (let h = 0; h < height / dh; h++) {
            const scale = 2 ** apply2y(tol, h * dh)
            const pixelWidth = pixelWidthBase * scale
            const ms = spacing(pixelWidth)

            ctx.fillText(
                `${pixelWidth.toFixed(4)} ${ms.major}`,
                width / 2,
                (h + 0.5) * dh,
            )

            lines(h, ms.minor * tlo.sx, 0.3)
            lines(h, ms.major * tlo.sx, 1)
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
                path.moveTo(i, hmin)
                path.lineTo(i, hmax)
            }

            ctx.globalAlpha = alpha
            ctx.stroke(path)
        }
    }
}

function spacing(pixelSize: number) {
    const log = Math.log10(pixelSize)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 2)
    const diff = log - exp

    return (
        diff < 0.15 ? { major: pow, minor: pow / 5 / 2 }
        : diff < 0.5 ? { major: pow * 2, minor: pow / 2 }
        : diff < 0.8 ? { major: pow * 5, minor: pow }
        : { major: pow * 10, minor: (pow * 2) / 2 }
    )
}

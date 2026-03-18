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
    }: Canvas2): void {
        const dh = 10

        ctx.fillStyle = "black"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        for (let h = 0; h < height / dh; h++) {
            const hmin = h * dh
            const hmax = (h + 1) * dh

            const inchWidth = 96 * pixelWidthBase * 1.05 ** apply2y(tol, h * dh)
            const logInchWidth = Math.floor(Math.log(inchWidth))
            const logRatio = Math.log(inchWidth) - logInchWidth

            const label = `${logRatio.toFixed(4)}`
            ctx.fillText(label, width / 2, (hmin + hmax) / 2)
        }
    }
}

function pow10Exponent(n: number): number {
    return Math.floor(Math.log10(n))
}

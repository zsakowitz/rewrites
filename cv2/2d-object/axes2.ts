import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

export class Axes2 extends Object2 {
    draw({
        height,
        pixelWidth: pixelWidthBase,
        ctx,
        width,
        tol,
        tlo,
    }: Canvas2): void {
        const dh = 5

        ctx.fillStyle = "black"
        ctx.font = "5px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.strokeStyle = "black"

        for (let h = 0; h < height / dh; h++) {
            const inchWidth = 96 * pixelWidthBase * 2 ** apply2y(tol, h * dh)
            const logInchWidth = Math.floor(Math.log10(inchWidth))
            const floorInchWidth = 10 ** logInchWidth
            const logRatio = Math.log10(inchWidth) - logInchWidth

            if (logRatio <= 0.1) {
                lines(h, 5 * floorInchWidth, "red")
            } else if (logRatio <= 0.2) {
                lines(h, 5 * floorInchWidth, "blue")
            } else if (logRatio <= 0.3) {
                lines(h, 5 * floorInchWidth, "green")
            } else if (logRatio <= 0.4) {
                lines(h, 5 * floorInchWidth, "yellow")
            } else if (logRatio <= 0.5) {
                lines(h, 5 * floorInchWidth, "purple")
            } else if (logRatio <= 0.6) {
                lines(h, 5 * floorInchWidth, "lime")
            } else if (logRatio <= 0.7) {
                lines(h, 5 * floorInchWidth, "orange")
            } else if (logRatio <= 0.8) {
                lines(h, 5 * floorInchWidth, "magenta")
            } else if (logRatio <= 0.9) {
                lines(h, 5 * floorInchWidth, "pink")
            } else {
                lines(h, 5 * floorInchWidth, "teal")
            }

            const label = `${logRatio.toFixed(4)} ${apply2y(tol, h * dh)}`
            ctx.fillText(label, width / 2, (h + 0.5) * dh)
        }

        function lines(h: number, dx: number, color: string) {
            const path = new Path2D()

            const xmin = Math.floor(apply2x(tol, 0) / dx)
            const xmax = Math.ceil(apply2x(tol, width) / dx)

            for (let i = xmin; i <= xmax; i++) {
                const x = apply2x(tlo, i * dx)
                path.moveTo(x, h * dh)
                path.lineTo(x, (h + 1) * dh)
            }

            ctx.strokeStyle = color
            ctx.stroke(path)
        }
    }
}

function pow10Exponent(n: number): number {
    return Math.floor(Math.log10(n))
}

import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2, apply2x } from "../2d/tform"

const THEME_MAIN_AXIS_WIDTH = 1.5
const THEME_MAJOR_LINE_ALPHA = 0.3
const THEME_MINOR_LINE_ALPHA = 0.1

const THEME_AXIS_NUMBER_SIZE = 0.875
const THEME_AXIS_NUMBER_STROKE_COLOR = "white"
const THEME_AXIS_NUMBER_STROKE_WIDTH = 4
const THEME_AXIS_NUMBER_ONSCREEN = "black"
const THEME_AXIS_NUMBER_OFFSCREEN = "#8e8e8e"
const THEME_AXIS_NUMBER_NEGATIVE_X_OFFSET = -2.5
const THEME_AXIS_STROKE = "black"

const MAX_GRIDLINES_MAJOR = 200
const MAX_GRIDLINES_MINOR = MAX_GRIDLINES_MAJOR * 5

export class Axes extends Object2 {
    draw({ ctx, tlo, width, height }: Canvas2): void {
        const ZERO = apply2(tlo, [0, 0])
        const y = ZERO[1]
        const x = ZERO[0]

        ctx.lineCap = "round"
        ctx.lineWidth = THEME_MAIN_AXIS_WIDTH
        ctx.strokeStyle = THEME_AXIS_STROKE
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
    }
}

export class AxisLabels extends Object2 {
    draw(cv: Canvas2): void {
        const { ctx, tlo, tol, width, height } = cv
        ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN
        ctx.font = `${THEME_AXIS_NUMBER_SIZE * 16}px Symbola`
        ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR
        ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH
        ctx.textAlign = "center"
        ctx.textBaseline = "top"

        const hMax = Math.ceil(height / 10)
        for (let h = 0; h <= hMax; h++) {
            const [dx, xMajorsEvery, xMaxorsEvery, minorOpacity] = gridlineSize(
                cv.pixelWidth * 1.1 ** (h - hMax / 2),
            )
            const xmin = Math.floor(apply2x(tol, 0) / dx)
            const xmax = Math.ceil(apply2x(tol, width) / dx)

            const pathMinor = new Path2D()
            const pathMajor = new Path2D()
            const pathMaxor = new Path2D()

            for (let i = xmin; i <= xmax; i++) {
                const x = i * dx
                let [ox, oy] = apply2(tlo, [x, 0])

                if (i % xMaxorsEvery == 0) {
                    pathMaxor.moveTo(ox, h * 10)
                    pathMaxor.lineTo(ox, (h + 1) * 10)
                } else if (i % xMajorsEvery == 0) {
                    pathMajor.moveTo(ox, h * 10)
                    pathMajor.lineTo(ox, (h + 1) * 10)
                } else {
                    pathMinor.moveTo(ox, h * 10)
                    pathMinor.lineTo(ox, (h + 1) * 10)
                }
            }

            ctx.strokeStyle = THEME_AXIS_STROKE
            ctx.lineWidth = 1

            ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA * minorOpacity
            ctx.stroke(pathMinor)

            ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
            ctx.stroke(pathMajor)

            ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
            ctx.stroke(pathMaxor)
        }

        ctx.globalAlpha = 1
    }
}

const LOG2 = Math.log10(2)
const LOG5 = Math.log10(5)

function roundDownToNearestPowerOfTen(x: number): number {
    return 10 ** Math.floor(Math.log10(x))
}

function gridlineSize(
    pixelWidth: number,
): [
    spaceBetweenLines: number,
    majorsEvery: number,
    maxorsEvery: number,
    minorOpacity: number,
] {
    const inchWidth = pixelWidth * 96

    const pow10 = roundDownToNearestPowerOfTen(inchWidth)
    const ratio = inchWidth / pow10

    return (
        // ratio < 2 ? [pow10 / 2, 2, 4, lerp(ratio, 1, 2, 1, 0)]
        ratio < 5 ?
                [pow10, 2, 10, lerp(ratio, 1, 5, 1, 0)]
            :   [pow10 * 2, 0, 5, lerp(ratio, 5, 10, 1, 0)]
    )
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    return Math.max(0, Math.min(1, (x - x0) / (x1 - x0))) * (y1 - y0) + y0
}

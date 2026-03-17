import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2 } from "../2d/tform"

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
        const y = Math.round(ZERO[1] * devicePixelRatio) / devicePixelRatio
        const x = Math.round(ZERO[0] * devicePixelRatio) / devicePixelRatio

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

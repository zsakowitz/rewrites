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
    draw({ ctx, tlo }: Canvas2): void {
        ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN
        ctx.font = `${THEME_AXIS_NUMBER_SIZE * 16}px sans-serif`
        ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR
        ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH

        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        for (let x = -10; x <= 10; x += 2) {
            if (x == 0) continue

            const [ox, oy] = apply2(tlo, [x, 0])

            const label = x < 0 ? "−" + -x : "" + x

            ctx.strokeText(label, ox, oy + 4)
            ctx.fillText(label, ox, oy + 4)
        }

        ctx.textAlign = "right"
        ctx.textBaseline = "middle"
        for (let y = -10; y <= 10; y += 2) {
            if (y == 0) continue

            const [ox, oy] = apply2(tlo, [0, y])

            const label = y < 0 ? "−" + -y : "" + y

            ctx.strokeText(label, ox - 4, oy)
            ctx.fillText(label, ox - 4, oy)
        }
    }
}

export class Gridlines extends Object2 {}

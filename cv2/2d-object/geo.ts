import {
    ColorBlue,
    ColorGreen,
    ColorPurple,
    OpacityPointHalo,
    SizeLine,
    SizePointHaloWide,
} from "../../cv/dcg"
import type { Canvas2 } from "../2d/canvas"
import { apply2 } from "../2d/tform"
import type { Vec2 } from "../2d/vec"

export function drawPoint(
    { ctx, tlo }: Canvas2,
    lpos: Vec2,
    innerSize: number,
) {
    const [ox, oy] = apply2(tlo, lpos)
    ctx.fillStyle = ColorPurple

    ctx.beginPath()
    ctx.ellipse(ox, oy, innerSize, innerSize, 0, 0, 2 * Math.PI)
    ctx.fill()

    ctx.beginPath()
    ctx.globalAlpha = OpacityPointHalo
    ctx.ellipse(ox, oy, SizePointHaloWide, SizePointHaloWide, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.globalAlpha = 1
}

export function drawCircle(
    { ctx, tlo }: Canvas2,
    center: Vec2,
    radius: number,
) {
    const [ox, oy] = apply2(tlo, center)

    ctx.strokeStyle = ColorGreen
    ctx.lineWidth = SizeLine
    ctx.beginPath()
    ctx.ellipse(
        ox,
        oy,
        Math.abs(radius) * tlo.sx,
        Math.abs(radius) * -tlo.sy,
        0,
        0,
        2 * Math.PI,
    )
    ctx.stroke()
}

export function drawLine(
    { ctx, tlo, height, width }: Canvas2,
    p1: Vec2,
    p2: Vec2,
): void {
    const [x1, y1] = apply2(tlo, p1)
    const [x2, y2] = apply2(tlo, p2)

    if (x1 == x2 && y1 == y2) {
        return
    }

    ctx.strokeStyle = ColorBlue
    ctx.lineWidth = SizeLine
    ctx.lineCap = "round"
    ctx.beginPath()

    if (x1 == x2) {
        ctx.moveTo(x1, -3)
        ctx.lineTo(x1, height + 3)
    } else {
        ctx.moveTo(-3, extendX(x1, y1, x2, y2, -3))
        ctx.lineTo(width + 3, extendX(x1, y1, x2, y2, width + 3))
    }

    ctx.stroke()
}

function extendX(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    targetX: number,
): number {
    return (targetX - x1) * ((y2 - y1) / (x2 - x1)) + y1
}

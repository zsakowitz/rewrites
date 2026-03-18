import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"
import type { Vec2 } from "../2d/vec"

export class Plot extends Object2 {
    #fn

    constructor(f: (x: number) => number) {
        super()
        this.#fn = f
    }

    draw({ ctx, tlo, tol, width }: Canvas2): void {
        const fn = this.#fn

        const at: (ox: number) => Vec2 = (ox) => [
            ox,
            apply2y(tlo, fn(apply2x(tol, ox))),
        ]

        ctx.strokeStyle = "#2d70b3"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.globalAlpha = 0.8

        const path = new Path2D()
        path.moveTo(-3, apply2y(tlo, fn(apply2x(tol, -3))))
        drawCurve(path, at, at(-3), at(width + 3), 1)
        ctx.stroke(path)
    }
}

function drawCurve(
    path: Path2D,
    pointAt: (ox: number) => Vec2,
    ol: Vec2,
    or: Vec2,
    oxMinDiff: number,
) {
    const odiff = Math.hypot(ol[0] - or[0], ol[1] - or[1])

    if (odiff <= Math.min(1, or[0] - ol[0])) {
        path.lineTo(or[0], or[1])
        return
    }

    if (or[0] - ol[0] < oxMinDiff) {
        path.lineTo(or[0], or[1])
        return
    }

    const om = pointAt((ol[0] + or[0]) / 2)
    drawCurve(path, pointAt, ol, om, oxMinDiff)
    drawCurve(path, pointAt, om, or, oxMinDiff)
}

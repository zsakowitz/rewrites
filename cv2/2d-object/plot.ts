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

    draw({ ctx, tlo, tol, width, height }: Canvas2): void {
        const fn = this.#fn

        const pointAt = (ox: number): Vec2 => {
            const oy = apply2y(tlo, fn(apply2x(tol, ox)))
            return [ox, oy]
        }

        ctx.strokeStyle = "black"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        draw(ctx, pointAt, pointAt(-3), pointAt(width + 3), height, 0)
        ctx.stroke()
    }
}

function draw(
    ctx: CanvasRenderingContext2D,
    pointAt: (ox: number) => Vec2,
    ol: Vec2,
    or: Vec2,
    ymin: number,
    ymax: number,
) {
    if (
        or[0] - ol[0] < 1
        && Math.abs(or[1] - ol[1]) < 2 / Math.sqrt(or[0] - ol[0])
    ) {
        ctx.lineTo(or[0], or[1])
        return
    }

    if (or[0] - ol[0] > 0.1) {
        const om = pointAt((ol[0] + or[0]) / 2)
        draw(ctx, pointAt, ol, om, ymin, ymax)
        draw(ctx, pointAt, om, or, ymin, ymax)
        return
    }

    if (!isFinite(or[1])) {
        ctx.stroke()
        ctx.beginPath()
        return
    }

    const dprev = Math.abs(ol[1] - pointAt(2 * ol[1] - or[1])[1])
    const dself = Math.abs(or[1] - ol[1])
    const dnext = Math.abs(or[1] - pointAt(2 * or[1] - ol[1])[1])

    if (or[1] - ol[1] < -10 && dself > dprev && dself > dnext) {
        ctx.lineTo(ol[0], ymin)
        ctx.moveTo(or[0], ymax)
        ctx.lineTo(or[0], or[1])
        return
    }

    if (or[1] - ol[1] > 10 && dself > dprev && dself > dnext) {
        ctx.lineTo(ol[0], ymax)
        ctx.moveTo(or[0], ymin)
        ctx.lineTo(or[0], or[1])
        return
    }

    // if (dself < 1) {
    ctx.lineTo(or[0], or[1])
    // } else {
    // ctx.moveTo(or[0], or[1])
    // }
}

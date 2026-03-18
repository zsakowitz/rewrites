import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y, type Tform2 } from "../2d/tform"
import type { Vec2 } from "../2d/vec"

export class Plot extends Object2 {
    #fn

    constructor(f: (x: number) => number) {
        super()
        this.#fn = f
    }

    draw({ ctx, tlo, tol, width }: Canvas2): void {
        const fn = this.#fn

        ctx.strokeStyle = "#2d70b3"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        const dox = 0.25
        ctx.beginPath()
        ctx.moveTo(0, apply2y(tlo, fn(apply2x(tol, 0))))
        for (let ox1 = 0; ox1 < width; ox1 += dox) {
            const lx1 = apply2x(tol, ox1)
            const oy1 = apply2y(tlo, fn(lx1))

            const lx2 = apply2x(tol, ox1 + dox)
            const oy2 = apply2y(tlo, fn(lx2))

            draw(ctx, fn, tlo, tol, [ox1, oy1], [ox1 + dox, oy2], 0)
        }
        ctx.stroke()
    }
}

function draw(
    ctx: CanvasRenderingContext2D,
    f: (lx: number) => number,
    tlo: Tform2,
    tol: Tform2,
    o1: Vec2,
    o2: Vec2,
    fuel: number,
) {
    if (Math.hypot(o1[0] - o2[0], o1[1] - o2[1]) <= 1.8 ** fuel) {
        ctx.lineTo(o2[0], o2[1])
    } else if (fuel < 8) {
        const omx = (o1[0] + o2[0]) / 2
        const omy = apply2y(tlo, f(apply2x(tol, omx)))
        draw(ctx, f, tlo, tol, o1, [omx, omy], fuel + 1)
        draw(ctx, f, tlo, tol, [omx, omy], o2, fuel + 1)
    } else {
        ctx.moveTo(o2[0], o2[1])
    }
}

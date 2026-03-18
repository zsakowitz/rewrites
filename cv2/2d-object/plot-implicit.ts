import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

export class PlotImplicit extends Object2 {
    #f

    constructor(f: (x: number, y: number) => number) {
        super()
        this.#f = f
    }

    draw({ ctx, width, height, tol }: Canvas2): void {
        const f = this.#f
        const dox = 32
        const doy = 32

        ctx.strokeStyle = "black"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()

        ctx.beginPath()
        for (let ox = 0; ox < width; ox += dox) {
            for (let oy = 0; oy < height; oy += doy) {
                draw(ctx, valueAt, ox, ox + dox, oy, oy + doy)
            }
        }
        ctx.stroke()

        function valueAt(ox: number, oy: number): number {
            return f(apply2x(tol, ox), apply2y(tol, oy))
        }
    }
}

function draw(
    ctx: CanvasRenderingContext2D,
    valueAt: (ox: number, oy: number) => number,
    xl: number,
    xr: number,
    yt: number,
    yb: number,
) {
    const xm = (xl + xr) / 2
    const ym = (yt + yb) / 2

    const ltRaw = valueAt(xl, yt)

    const lt = ltRaw * (ltRaw > 0 ? 1 : -1)
    const lb = valueAt(xl, yb) * (ltRaw > 0 ? 1 : -1)
    const rt = valueAt(xr, yt) * (ltRaw > 0 ? 1 : -1)
    const rb = valueAt(xr, yb) * (ltRaw > 0 ? 1 : -1)

    const LB = lb > 0
    const RT = rt > 0
    const RB = rb > 0

    if (LB && RT && RB && xr - xl < 16) {
        return
    }

    if (xr - xl > 16) {
        draw(ctx, valueAt, xl, xm, yt, ym)
        draw(ctx, valueAt, xl, xm, ym, yb)
        draw(ctx, valueAt, xm, xr, yt, ym)
        draw(ctx, valueAt, xm, xr, ym, yb)
        return
    }

    if (LB) {
        if (RT) {
            if (RB) {
                // + +
                // + +
            } else {
                // + +
                // + -
                ctx.moveTo(xm, yb)
                ctx.lineTo(xr, ym)
            }
        } else {
            if (RB) {
                // + -
                // + +
                ctx.moveTo(map(lt / (lt - rt), xr, xl), yt)
                ctx.lineTo(xr, map(rt / (rt - rb), yb, yt))
            } else {
                // + -
                // + -
                ctx.moveTo(map(lt / (lt - rt), xr, xl), yt)
                ctx.lineTo(map(lb / (lb - rb), xr, xl), yb)
            }
        }
    } else {
        if (RT) {
            if (RB) {
                // + +
                // - +
                ctx.moveTo(xl, map(lt / (lt - lb), yb, yt))
                ctx.lineTo(map(lb / (lb - rb), xr, xl), yb)
            } else {
                // + +
                // - -
                ctx.moveTo(xl, map(lt / (lt - lb), yb, yt))
                ctx.lineTo(xr, map(rt / (rt - rb), yb, yt))
            }
        } else {
            if (RB) {
                // + -
                // - +
                // ctx.moveTo()
                // ctx.lineTo()
                // TODO: saddle point
            } else {
                // + -
                // - -
                ctx.moveTo(xl, ym)
                ctx.lineTo(xm, yt)
            }
        }
    }
}

function map(t: number, v0: number, v1: number) {
    return t * (v0 - v1) + v1
}

import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

// #8e8e8e for offscreen numbers,
// -2.5 as offset for negative coords

export class Grid extends Object2 {
    draw(cv: Canvas2): void {
        cv.ctx.fillStyle = "black"
        cv.ctx.strokeStyle = "white"
        cv.ctx.font = "12px Symbola"
        cv.ctx.lineWidth = 4

        drawXLines(cv)
        drawYLines(cv)
    }
}

function toFixed(n: number, digits: number): string {
    const sign = n < 0 ? "−" : ""
    n = Math.abs(n)

    if (digits < 0) {
        return sign + n.toFixed(-digits)
    }

    if (n < 1e6) {
        return sign + Math.round(n)
    }

    n = Math.round(n)

    // TODO: 5e+18 next to 1.0e+19 is weird
    const str = n.toExponential()
    const expIndex = str.indexOf("e")
    if (expIndex == -1) return str

    return (
        (+str.slice(0, expIndex)).toFixed(
            Math.max(0, Math.floor(Math.log10(n)) - digits),
        )
        + "×10"
        + str.slice(expIndex + 2).replace(/\d/g, (x) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+x]!)
    )
}

function drawXLines({ height, pixelWidth, ctx, width, tol, tlo }: Canvas2) {
    const [dx, tx, tr, mx] = spacing(pixelWidth)
    const xmin = Math.floor(apply2x(tol, 0) / dx)
    const xmax = Math.ceil(apply2x(tol, width) / dx)

    for (let x = xmin; x <= xmax; x++) {
        const ox = apply2x(tlo, x * dx)

        for (const [multiplier, alpha] of mx) {
            if (x % multiplier == 0) {
                ctx.globalAlpha = alpha
                ctx.fillRect(ox, 0, 1, Math.ceil(height))
                break
            }
        }
    }

    const tmin = Math.floor(apply2x(tol, 0) / tx)
    const tmax = Math.ceil(apply2x(tol, width) / tx)
    const oy = apply2y(tlo, 0)
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    for (let x = tmin; x <= tmax; x++) {
        const lx = x * tx
        const label = toFixed(lx, tr)
        const ox = apply2x(tlo, x * tx) + (label.startsWith("−") ? -3.5 : 0)

        ctx.globalAlpha = 0.9
        ctx.strokeText(label, ox, oy + 4)
        ctx.globalAlpha = 1
        ctx.fillText(label, ox, oy + 4)
    }
}

function drawYLines({ height, pixelHeight, ctx, width, tol, tlo }: Canvas2) {
    const [dy, ty, tr, my] = spacing(-pixelHeight)
    const ymin = Math.floor(apply2y(tol, height) / dy)
    const ymax = Math.ceil(apply2y(tol, 0) / dy)

    for (let y = ymin; y <= ymax; y++) {
        const oy = apply2y(tlo, y * dy)

        for (const [multiplier, alpha] of my) {
            if (y % multiplier == 0) {
                ctx.globalAlpha = alpha
                ctx.fillRect(0, oy, Math.ceil(width), 1)
                break
            }
        }
    }

    const tmin = Math.floor(apply2y(tol, height) / ty)
    const tmax = Math.ceil(apply2y(tol, 0) / ty)
    const ox = apply2x(tlo, 0)
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    for (let y = tmin; y <= tmax; y++) {
        const ly = y * ty
        const oy = apply2y(tlo, y * ty)

        const label = toFixed(ly, tr)
        ctx.globalAlpha = 0.9
        ctx.strokeText(label, ox - 4, oy)
        ctx.globalAlpha = 1
        ctx.fillText(label, ox - 4, oy)
    }
}

function spacing(
    pixelSize: number,
): [
    space: number,
    text: number,
    textRound: number,
    [multiplier: number, alpha: number][],
] {
    const log = Math.log10(pixelSize * 4)
    const exp = Math.floor(log)
    const pow = 10 ** (exp + 1)
    const diff = log - exp

    const FST: [number, number][] = [
        [50, 0.3],
        [5, lerp(diff, 0, 0.5, 0.05, 0.3)],
        [1, lerp(diff, 0, 0.5, 0, 0.1)],
    ]

    const SND: [number, number][] = [
        [10, 0.3],
        [2, lerp(diff, 0.5, 1, 0.1, 0.1)],
        [1, lerp(diff, 0.5, 1, 0, 0.05)],
    ]

    return diff < 1 / 2 ?
            [pow, pow * 5, exp + 1, FST]
        :   [pow * 5, diff < 3 / 4 ? pow * 10 : pow * 20, exp + 2, SND]
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) * (y0 - y1) + y1
}

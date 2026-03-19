import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2x, apply2y } from "../2d/tform"

// TODO: 4 doesn't render. 4.0 and -4 are fine though

const FONT = 14

export class Grid extends Object2 {
    draw(cv: Canvas2): void {
        cv.ctx.fillStyle = "black"
        cv.ctx.strokeStyle = "white"
        cv.ctx.font = `${FONT}px Symbola`
        cv.ctx.lineWidth = 4

        drawXLines(cv)
        drawYLines(cv)

        cv.ctx.globalAlpha = 1
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
        + "ᴇ"
        + str.slice(expIndex + 2)
        //+ "×10"
        //+ str.slice(expIndex + 2).replace(/\d/g, (x) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+x]!)
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
                ctx.globalAlpha = x == 0 ? 1 : alpha
                ctx.fillRect(ox, 0, 1, Math.ceil(height))
                break
            }
        }
    }

    const tmin = Math.ceil(apply2x(tol, 0) / tx - 0.05)
    const tmax = Math.floor(apply2x(tol, width) / tx + 0.05)
    const oyRaw = apply2y(tlo, 0)
    const oy =
        oyRaw < 0 ? 4
        : oyRaw + FONT + 8 > height ? height - FONT - 4
        : oyRaw + 4
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.globalAlpha = 1

    for (let x = tmin; x <= tmax; x++) {
        if (x == 0) continue

        const lx = x * tx
        const label = toFixed(lx, tr)
        const ox = apply2x(tlo, x * tx) + (label.startsWith("−") ? -3.5 : 0)
        const w = ctx.measureText(label).width / 2
        const oxActual =
            ox + w + 4 > width ? width - 4 - w
            : ox - w < 4 ? 4 + w
            : ox

        ctx.strokeText(label, oxActual, oy)
        ctx.fillText(label, oxActual, oy)
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
                ctx.globalAlpha = y == 0 ? 1 : alpha
                ctx.fillRect(0, oy, Math.ceil(width), 1)
                break
            }
        }
    }

    const tmin = Math.floor(apply2y(tol, height) / ty) - 1
    const tmax = Math.ceil(apply2y(tol, 0) / ty) + 1
    const oxRaw = apply2x(tlo, 0)
    const ox = oxRaw > width ? width - 4 : oxRaw - 4
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.globalAlpha = 1

    for (let y = tmin; y <= tmax; y++) {
        if (y == 0) continue

        const ly = y * ty
        const oy = apply2y(tlo, y * ty)

        const label = toFixed(ly, tr)
        const { width } = ctx.measureText(label)
        const oxActual = ox - width < 4 ? 4 + width : ox

        ctx.strokeText(label, oxActual, oy)
        ctx.fillText(label, oxActual, oy)
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
            [
                pow,
                diff < 1 / 4 ? pow * 5 : pow * 10,
                diff < 1 / 4 ? exp + 1 : exp + 2,
                FST,
            ]
        :   [pow * 5, diff < 3 / 4 ? pow * 10 : pow * 50, exp + 2, SND]
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    return ((x - x0) / (x1 - x0)) * (y0 - y1) + y1
}

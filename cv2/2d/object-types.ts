import type { Canvas2 } from "./canvas"
import { Object2 } from "./object"
import { apply2 } from "./tform"

export class ByDrawFn extends Object2 {
    constructor(readonly draw: (cv: Canvas2) => void) {
        super()
    }

    visible = true
}

export class XorPattern extends Object2 {
    #bitmap

    constructor(
        l = 0.7,
        c = 1,
        readonly x = 0,
        readonly y = 0,
    ) {
        super()

        const cv = new OffscreenCanvas(256, 256)
        const ctx = cv.getContext("2d")!

        for (let i = 0; i < 256; i++) {
            for (let j = 0; j < 256; j++) {
                ctx.fillStyle = `oklch(${l} ${c} ${(360 / 256) * (i ^ j)})`
                ctx.fillRect(i, j, 1, 1)
            }
        }

        this.#bitmap = cv.transferToImageBitmap()
    }

    draw(cv: Canvas2): void {
        const [x, y] = apply2(cv.tlo, [this.x, this.y])
        cv.ctx.imageSmoothingEnabled = false
        cv.ctx.drawImage(this.#bitmap, x, y, cv.tlo.sx, -cv.tlo.sy)
    }
}

export class Oklch extends Object2 {
    #bitmap

    constructor(
        c: number,
        readonly x = 0,
        readonly y = 0,
    ) {
        super()

        const cv = new OffscreenCanvas(256, 256)
        const ctx = cv.getContext("2d")!

        for (let i = 0; i < 256; i++) {
            for (let j = 0; j < 256; j++) {
                const l = j / 256
                const h = i * (360 / 256)
                ctx.fillStyle = `oklch(${l} ${c} ${h})`
                ctx.fillRect(i, j, 1, 1)
            }
        }

        this.#bitmap = cv.transferToImageBitmap()
    }

    draw(cv: Canvas2): void {
        const [x, y] = apply2(cv.tlo, [this.x, this.y])
        cv.ctx.imageSmoothingEnabled = false
        cv.ctx.drawImage(this.#bitmap, x, y, cv.tlo.sx, -cv.tlo.sy)
    }
}

export class Axes extends Object2 {
    draw({ ctx, tlo, width, height }: Canvas2): void {
        const ZERO = apply2(tlo, [0, 0])
        const x = Math.round(ZERO[0])
        const y = Math.round(ZERO[1])

        ctx.lineCap = "round"
        ctx.lineWidth = 1.6
        ctx.strokeStyle = "black"
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
    }
}

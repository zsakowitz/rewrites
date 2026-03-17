import type { Canvas2 } from "./canvas"
import { apply2 } from "./tform"

export interface Object2 {
    visible: boolean
    draw(cv: Canvas2): void
}

export class ByDrawFn implements Object2 {
    constructor(readonly draw: (cv: Canvas2) => void) {}

    visible = true
}

export class XorPattern implements Object2 {
    #bitmap

    constructor(
        l = 0.7,
        c = 1,
        readonly x = 0,
        readonly y = 0,
    ) {
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

    visible = true

    draw(cv: Canvas2): void {
        const [x, y] = apply2(cv.tlo, [this.x, this.y])
        cv.ctx.imageSmoothingEnabled = false
        cv.ctx.drawImage(this.#bitmap, x, y, cv.tlo.sx, -cv.tlo.sy)
    }
}

export class Oklch implements Object2 {
    #bitmap

    constructor(
        c: number,
        readonly x = 0,
        readonly y = 0,
    ) {
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

    visible = true

    draw(cv: Canvas2): void {
        const [x, y] = apply2(cv.tlo, [this.x, this.y])
        cv.ctx.imageSmoothingEnabled = false
        cv.ctx.drawImage(this.#bitmap, x, y, cv.tlo.sx, -cv.tlo.sy)
    }
}

import type { Tform2 } from "./tform"

export interface CanvasArgs {
    /**
     * Called when the canvas resizes, has its context restored, or becomes
     * initialized.
     */
    onCanvasUpdate(): void
}

interface TouchPointer {
    down: boolean
    moved: boolean

    // first known pointer location, in unit space
    readonly ox: number
    readonly oy: number

    // last known pointer location, in unit space
    x: number
    y: number
}

function adjust1(
    { sx, sy, tx, ty }: Tform2,
    { ox, oy, x, y }: TouchPointer,
): Tform2 {
    return {
        sx,
        sy,
        tx: (x - ox) * sx + tx,
        ty: (y - oy) * sy + ty,
    }
}

export class Canvas2 {
    readonly el = document.createElement("canvas")
    readonly ctx = this.el.getContext("2d")!

    #ow = 0
    #oh = 0
    #ev

    constructor(ev: CanvasArgs) {
        this.#ev = ev

        const { el, ctx } = this

        if (!ctx) {
            throw new Error("Failed to initialize canvas.")
        }

        new ResizeObserver(([e]) => {
            el.width = (this.#ow = e!.contentRect.width) * devicePixelRatio
            el.height = (this.#oh = e!.contentRect.height) * devicePixelRatio
            this.#redraw()
        }).observe(el)

        el.addEventListener("contextrestored", () => {
            this.#redraw()
        })
    }

    reset() {
        this.ctx.reset()
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    #redraw() {
        this.reset()
        this.#ev.onCanvasUpdate()
    }
}

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
    #ul0

    constructor(ev: CanvasArgs, ul: Tform2) {
        this.#ev = ev
        this.#ul0 = ul

        const { el, ctx } = this

        if (!ctx) {
            throw new Error("Failed to initialize canvas.")
        }

        new ResizeObserver(([e]) => {
            el.width = (this.#ow = e!.contentRect.width) * devicePixelRatio
            el.height = (this.#oh = e!.contentRect.height) * devicePixelRatio
            this.#redraw()
        }).observe(el)

        el.addEventListener("contextrestored", this, { passive: true })
        el.addEventListener("wheel", this, { passive: false })
        el.addEventListener("pointerenter", this, { passive: true })
        el.addEventListener("pointerdown", this, { passive: true })
        el.addEventListener("pointermove", this, { passive: true })
        el.addEventListener("pointerup", this, { passive: true })
        el.addEventListener("pointercancel", this, { passive: true })
        el.addEventListener("pointerleave", this, { passive: true })
    }

    handleEvent(ev: Event) {
        switch (ev.type) {
            case "contextrestored":
                this.#redraw()
                break

            case "wheel":
                break

            case "pointerenter":
                break

            case "pointerdown":
                break

            case "pointermove":
                break

            case "pointerup":
                break

            case "pointercancel":
                break

            case "pointerleave":
                break
        }
    }

    get ul(): Tform2 {
        return this.#ul0
    }

    get lo(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const ul = this.ul

        const sx = oh / ul.sx / 2
        const tx = ow / 2 - ul.tx * sx

        const sy = -oh / 2 / ul.sy
        const ty = oh / 2 - ul.ty * sy

        return { sx, sy, tx, ty }
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

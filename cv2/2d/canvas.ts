import { apply2, inverse2, type Tform2 } from "./tform"

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

    #ul0: Tform2
    #ul: Tform2
    #touches = new Map<number, TouchPointer>()

    constructor(ev: CanvasArgs, ul: Tform2) {
        this.#ev = ev
        this.#ul = this.#ul0 = ul

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
        if (ev.type == "contextrestored") {
            this.#redraw()
            return
        }

        if (ev.type == "wheel") {
            const { ctrlKey, metaKey, deltaX, deltaY } = ev as WheelEvent

            // ambiguous how to handle, so we just drop it
            if (ctrlKey && metaKey) return

            ev.preventDefault()

            // if zooming or panning the screen via touches, ignore wheel events to avoid conflicts
            if (this.#touches.size) return

            const { sx, sy, tx, ty } = this.#ul0

            // plain pan gesture
            if (!(ctrlKey || metaKey)) {
                this.#ul = this.#ul0 = {
                    sx,
                    sy,
                    tx: tx + 2 * (deltaX / this.#oh) * sx,
                    ty: ty - 2 * (deltaY / this.#oh) * sy,
                }
                this.#redraw()
                return
            }

            return
        }

        const { pointerId, offsetX, offsetY } = ev as PointerEvent
        const [x, y] = apply2(this.tou, [offsetX, offsetY])

        switch (ev.type) {
            case "pointerenter":
                break

            case "pointerdown": {
                this.#touches.set(pointerId, {
                    down: true,
                    moved: false,
                    ox: x,
                    oy: y,
                    x,
                    y,
                })

                break
            }

            case "pointermove": {
                const tp = this.#touches.get(pointerId)
                if (!tp) return

                tp.x = x
                tp.y = y

                break
            }

            case "pointerup":
                this.#touches.delete(pointerId)
                break

            case "pointercancel":
                this.#touches.delete(pointerId)
                break

            case "pointerleave":
                break
        }

        this.#updateUl()
        this.#redraw()
    }

    // Transformations between various coordinate spaces.

    get tul(): Tform2 {
        return this.#ul
    }

    get tlu(): Tform2 {
        return inverse2(this.tul)
    }

    get tlo(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const ul = this.tul

        const sx = oh / ul.sx / 2
        const tx = ow / 2 - ul.tx * sx

        const sy = -oh / 2 / ul.sy
        const ty = oh / 2 - ul.ty * sy

        return { sx, sy, tx, ty }
    }

    get tol(): Tform2 {
        return inverse2(this.tlo)
    }

    get tuo(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh

        return {
            sx: oh / 2,
            sy: oh / 2,
            tx: ow / 2,
            ty: oh / 2,
        }
    }

    get tou(): Tform2 {
        return inverse2(this.tuo)
    }

    reset() {
        this.ctx.reset()
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    #updateUl() {}

    #redraw() {
        this.reset()
        this.#ev.onCanvasUpdate()
    }
}

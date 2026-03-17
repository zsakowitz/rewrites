import type { Object2 } from "./object"
import { apply2, inverse2, type Tform2 } from "./tform"

interface TouchPointer {
    // first known pointer location, in unit space
    readonly ox: number
    readonly oy: number

    // last known pointer location, in unit space
    x: number
    y: number
}

export class Canvas2 {
    readonly el = document.createElement("canvas")
    readonly ctx = this.el.getContext("2d", { alpha: false })!

    #ow = 0
    #oh = 0

    get width() {
        return this.#ow
    }

    get height() {
        return this.#oh
    }

    #ul0: Tform2
    #ul: Tform2
    #touches = new Map<number, TouchPointer>()
    #touchesMoved = false
    #scene: Object2[] = []

    constructor(ul: Tform2) {
        this.#ul = this.#ul0 = ul

        const { el: el, ctx } = this

        if (!ctx) {
            throw new Error("Failed to initialize canvas.")
        }

        new ResizeObserver(([e]) => {
            el.width = (this.#ow = e!.contentRect.width) * devicePixelRatio
            el.height = (this.#oh = e!.contentRect.height) * devicePixelRatio
            this.redraw()
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

    push(object: Object2) {
        this.#scene.push(object)
    }

    handleEvent(ev: Event) {
        if (ev.type == "contextrestored") {
            this.redraw()
            return
        }

        if (ev.type == "wheel") {
            const { ctrlKey, metaKey } = ev as WheelEvent

            // ambiguous how to handle, so we just drop it
            if (ctrlKey && metaKey) return

            ev.preventDefault()

            // if zooming or panning the screen via touches, ignore wheel events to avoid conflicts
            if (this.#touches.size) return

            // plain pan gesture
            if (ctrlKey || metaKey) {
                this.#handleWheelZoom(ev as WheelEvent)
            } else {
                this.#handleWheelMove(ev as WheelEvent)
            }

            this.redraw()
            return
        }

        const { pointerId, offsetX, offsetY } = ev as PointerEvent
        const [x, y] = apply2(this.tou, [offsetX, offsetY])

        switch (ev.type) {
            case "pointerenter":
                break

            case "pointerdown": {
                this.el.setPointerCapture(pointerId)
                if (this.#touchesMoved) return
                if (this.#touches.size >= 2) return

                this.#touches.set(pointerId, {
                    ox: x,
                    oy: y,
                    x,
                    y,
                })

                this.#updateUl()
                break
            }

            case "pointermove": {
                const tp = this.#touches.get(pointerId)
                if (!tp) return

                tp.x = x
                tp.y = y

                if (
                    !this.#touchesMoved
                    && Math.hypot(x - tp.ox, y - tp.oy) > 16 / this.#oh
                ) {
                    this.#touchesMoved = true
                }

                this.#updateUl()
                break
            }

            case "pointerup":
            case "pointercancel":
                this.#updateUl()
                if (ev.type == "pointerup") {
                    this.#ul0 = this.#ul
                } else {
                    this.#ul = this.#ul0
                }
                this.#touchesMoved = false
                this.#touches.clear()
                break

            case "pointerleave":
                break
        }

        this.redraw()
    }

    #handleWheelMove(ev: WheelEvent) {
        const { sx, sy, tx, ty } = this.#ul0

        this.#ul = this.#ul0 = {
            sx,
            sy,
            tx: tx + 2 * (ev.deltaX / this.#ow) * sx,
            ty: ty - 2 * (ev.deltaY / this.#ow) * sy,
        }
    }

    #handleWheelZoom(ev: WheelEvent) {
        const { sx, sy, tx, ty } = this.#ul0

        const dy = Math.sign(ev.deltaY) * Math.sqrt(Math.abs(ev.deltaY))

        const ds =
            ev.deltaMode == 2 ? 2 ** ev.deltaY
            : ev.deltaMode == 1 ? 1.1 ** ev.deltaY
            : 1.03 ** dy // 1 + dy * 0.03

        // TODO:
        // keep pointer in same position after zooming
        const px = ev.offsetX * (2 / this.#ow) - 1
        const py = -(ev.offsetY - this.#oh / 2) * (2 / this.#ow)

        this.#ul = this.#ul0 = {
            sx: sx * ds,
            sy: sy * ds,
            tx: tx + px * sx * (1 - ds),
            ty: ty + py * sy * (1 - ds),
        }
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

        const sx = ow / ul.sx / 2
        const tx = ow / 2 - ul.tx * sx

        const sy = -ow / 2 / ul.sy
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
            sx: ow / 2,
            sy: ow / 2,
            tx: ow / 2,
            ty: oh / 2,
        }
    }

    get tou(): Tform2 {
        return inverse2(this.tuo)
    }

    reset() {
        this.ctx.reset()
        this.ctx.fillStyle = "#ffffff"
        this.ctx.fillRect(0, 0, this.el.width, this.el.height)
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    #updateUl() {
        const [a, b] = this.#touches.values()

        if (!a) {
            this.#ul = this.#ul0
            return
        }

        const { sx, sy, tx, ty } = this.#ul0

        if (b) {
            const scale =
                Math.hypot(a.ox - b.ox, a.oy - b.oy)
                / Math.hypot(a.x - b.x, a.y - b.y)

            this.#ul = {
                sx: sx * scale,
                sy: sy * scale,
                tx: tx + (sx * (a.ox + b.ox - (a.x + b.x) * scale)) / 2,
                ty: ty - (sy * (a.oy + b.oy - (a.y + b.y) * scale)) / 2,
            }

            return
        }

        this.#ul = {
            sx,
            sy,
            tx: tx - (a.x - a.ox) * sx,
            ty: ty + (a.y - a.oy) * sy,
        }
    }

    redraw() {
        this.reset()

        const scene = this.#scene
        for (let i = 0; i < scene.length; i++) {
            const obj = scene[i]!

            if (obj.visible) {
                scene[i]!.draw(this)
            }
        }
    }
}

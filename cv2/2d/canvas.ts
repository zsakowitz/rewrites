import { FromFn } from "../2d-object/from-fn"
import type { Object2, PEvent } from "./object"
import { apply2, inverse2, type Tform2 } from "./tform"
import type { Vec2 } from "./vec"

interface TouchPointer {
    // first known pointer location, in unit space
    readonly ox: number
    readonly oy: number

    // last known pointer location, in unit space
    x: number
    y: number
}

interface ObjectPointer {
    p0: Vec2 // first known pointer location, in unit space
    p1: Vec2 // last known pointer location, in unit space

    target: Object2
    active: boolean
    size: 1 | 2
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
    #objects = new Map<number, ObjectPointer>()
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

        el.addEventListener("contextmenu", this, { passive: false })
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

    pushFn(draw: (cv: Canvas2) => void) {
        this.push(new FromFn(draw))
    }

    #target(
        event: PEvent,
    ):
        | [isNew: boolean, didAnyChange: boolean, target: ObjectPointer]
        | [isNew: false, didAnyChange: boolean, target: undefined] {
        const { pointerId } = event

        const prev = this.#objects.get(pointerId)
        if (prev?.active) return [false, false, prev]

        const next = this.#scene.findLast((obj) => obj.includes?.(event))
        if (prev?.target == next) return [false, false, prev]

        if (prev) {
            this.#objects.delete(pointerId)
            prev.target.onPointerLeave?.(event)
        }

        if (!next) {
            return [false, true, void 0]
        }

        const target: ObjectPointer = {
            p0: prev?.p0 ?? event.unit,
            p1: event.unit,
            target: next,
            active: false,
            size: event.size,
        }
        this.#objects.set(pointerId, target)
        return [true, true, target]
    }

    // return `true` if we want this to be handled as a touch event
    // TODO: if two fingers on screen pan, we want to pan/zoom screen instead of handling objects
    #handlePointerEvent(raw: PointerEvent): void {
        const { pointerId, offsetX, offsetY } = raw

        if (this.#touches.has(pointerId)) {
            if (this.#handleMovement(raw)) {
                this.redraw()
            }
            return
        }

        const event: PEvent = {
            cv: this,
            pointerId,
            offset: [offsetX, offsetY],
            unit: apply2(this.tou, [offsetX, offsetY]),
            size: raw.pointerType == "touch" ? 2 : 1,
        }

        const [isNew, didAnyChange, target] = this.#target(event)
        if (target == null) {
            if (this.#handleMovement(raw) || didAnyChange) {
                this.redraw()
            }
            return
        }

        target.p1 = event.unit

        switch (raw.type) {
            case "pointerenter":
                if (isNew) target.target.onPointerEnter?.(event)
                break

            case "pointerdown":
                this.el.setPointerCapture(pointerId)
                if (isNew) target.target.onPointerEnter?.(event)
                target.active = true
                target.target.onPointerDown?.(event)
                break

            case "pointermove":
                if (isNew) target.target.onPointerEnter?.(event)
                else target.target.onPointerMove?.(event)
                break

            case "pointerup":
            case "pointercancel": {
                if (isNew) {
                    target.target.onPointerEnter?.(event)
                } else if (raw.type == "pointerup") {
                    target.target.onPointerUp?.(event)
                } else {
                    target.target.onPointerCancel?.(event)
                }

                target.active = false

                if (raw.type == "pointerup") {
                    const [isNew, , target] = this.#target(event)
                    if (isNew) {
                        target.target.onPointerEnter?.(event)
                    }
                }

                break
            }

            case "pointerleave":
                // Firefox dispatches `pointerleave` even for captured pointers; we ignore those here.
                if (target.active) return

                this.#objects.delete(pointerId)
                if (!isNew) target.target.onPointerLeave?.(event)
                break
        }

        this.redraw()
    }

    // returns `true` if any state changed
    #handleMovement(ev: PointerEvent): boolean {
        const { pointerId, offsetX, offsetY } = ev
        const [x, y] = apply2(this.tou, [offsetX, offsetY])

        switch (ev.type) {
            case "pointerenter":
                break

            case "pointerdown": {
                this.el.setPointerCapture(pointerId)
                if (this.#touchesMoved) return false
                if (this.#touches.size >= 2) return false

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
                if (!tp) return false

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

        this.#updatePointers()
        return true
    }

    handleEvent(ev: Event) {
        if (ev.type == "contextmenu") {
            ev.preventDefault()
            return
        }

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

            this.#updatePointers()
            this.redraw()
            return
        }

        this.#handlePointerEvent(ev as PointerEvent)
    }

    #updatePointers() {
        for (const [pointerId, el] of Array.from(this.#objects)) {
            const offset = apply2(this.tuo, el.p1)

            const event: PEvent = {
                cv: this,
                pointerId,
                offset,
                unit: el.p1,
                size: el.size,
            }

            const [isNew, , target] = this.#target(event)

            if (isNew) {
                target.target.onPointerEnter?.(event)
            } else {
                target?.target.onPointerMove?.(event)
            }
        }
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

    zoom(l: Vec2, ds: number) {
        const { sx, sy, tx, ty } = this.#ul0

        if (
            sy * ds < 1e-5 * Math.max(1e-200, Math.abs(ty))
            || sx * ds < 1e-5 * Math.max(1e-200, Math.abs(tx))
            || sy * ds > 1e300
            || sx * ds > 1e300
        ) {
            return
        }

        // TODO:
        // keep pointer in same position after zooming
        const [px, py] = apply2(this.tlu, l)

        this.#ul = this.#ul0 = {
            sx: sx * ds,
            sy: sy * ds,
            tx: tx + px * sx * (1 - ds),
            ty: ty + py * sy * (1 - ds),
        }
    }

    #handleWheelZoom(ev: WheelEvent) {
        const dy = Math.sign(ev.deltaY) * Math.sqrt(Math.abs(ev.deltaY))

        const ds =
            ev.deltaMode == 2 ? 2 ** ev.deltaY
            : ev.deltaMode == 1 ? 1.1 ** ev.deltaY
            : 1.03 ** dy // 1 + dy * 0.03

        this.zoom(apply2(this.tol, [ev.offsetX, ev.offsetY]), ds)
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

    /** Width of one offset space pixel, measured in local space. */
    get pixelWidth(): number {
        return this.tol.sx
    }

    /** Height of one offset space pixel, measured in local space. */
    get pixelHeight(): number {
        return this.tol.sy
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
                this.ctx.globalAlpha = 1
                scene[i]!.draw(this)
            }
        }
    }
}

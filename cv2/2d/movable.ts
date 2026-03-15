import type { Tform2 } from "./tform"

interface Pointer {
    down: boolean
    moved: boolean

    // Original coordinates
    ox: number
    oy: number

    // Last known coordinates
    x: number
    y: number
}

export class Movable {
    #ow = 0 // offset width of reference element
    #oh = 0 // offset height of reference element

    /**
     * Transformation from unit space to local space, not including the effects
     * of currently active touch pointers.
     */
    #ul0: Tform2

    /**
     * Transformation from unit space to local space, including the effects of
     * currently active touch pointers.
     */
    get ul() {
        return this.#ul0
    }

    /** @param tf Transformation from unit space to local space. */
    constructor(el: HTMLElement, tf: Tform2) {
        new ResizeObserver(([e]) => {
            this.#ow = e!.contentRect.width
            this.#oh = e!.contentRect.height
        }).observe(el, { box: "device-pixel-content-box" })

        this.#ul0 = tf
    }

    /** Converts from local space to offset space. */
    get lo(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const { sx, sy, tx, ty } = this.ul

        const SX = oh / sx / 2
        const TX = ow / 2 - tx * SX

        const SY = -oh / 2 / sy
        const TY = oh / 2 - ty * SY

        return { sx: SX, sy: SY, tx: TX, ty: TY }
    }

    /** Converts from offset space to local space. */
    get ol(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const { sx, sy, tx, ty } = this.ul

        return {
            sx: (2 * sx) / oh,
            sy: -(2 * sy) / oh,
            tx: tx - (ow / oh) * sx,
            ty: sy + ty,
        }
    }

    /** Returns `true` if the event was handled. */
    handleEvent(ev: PointerEvent | WheelEvent): boolean {
        if (ev.type == "mousemove" || ev.type == "wheel") {
            if (ev.ctrlKey && ev.metaKey) {
                return false
            }

            ev.preventDefault()
            if (ev.ctrlKey || ev.metaKey) {
                this.#onwheelZoom(ev as WheelEvent)
            } else {
                this.#onwheelMove(ev as WheelEvent)
            }
            return true
        }

        return false
    }

    #onwheelZoom(ev: WheelEvent) {
        const { sx, sy, tx, ty } = this.#ul0

        const ds =
            ev.deltaMode == 2 ? 2 ** ev.deltaY
            : ev.deltaMode == 1 ? 1.1 ** ev.deltaY
            : 1.01 ** ev.deltaY // 1 + Math.sign(ev.deltaY) * Math.sqrt(Math.abs(ev.deltaY)) * 0.03

        // keep pointer in same position after zooming
        const px = (2 * ev.offsetX - this.#ow) / this.#oh
        const py = 1 - (2 * ev.offsetY) / this.#oh

        this.#ul0 = {
            sx: sx * ds,
            sy: sy * ds,
            tx: tx + px * sx * (1 - ds),
            ty: ty + py * sy * (1 - ds),
        }
    }

    #onwheelMove(ev: WheelEvent) {
        const wx =
            (ev.deltaMode == 2 ? this.#ow
            : ev.deltaMode == 1 ? 16
            : 1) * ev.deltaX

        const wy =
            (ev.deltaMode == 2 ? this.#oh
            : ev.deltaMode == 1 ? 16
            : 1) * ev.deltaY

        const tf = this.#ul0
        const dx = (wx / this.#oh) * 3 * tf.sx
        const dy = -(wy / this.#oh) * 3 * tf.sy

        this.#ul0 = {
            sx: tf.sx,
            sy: tf.sy,
            tx: tf.tx + dx,
            ty: tf.ty + dy,
        }
    }

    #pointers = new Map<number, Pointer>()

    #onpointerdown(ev: PointerEvent): boolean {
        const [a, b] = this.#pointers.values()

        // We can only handle two pointers, so ignore any more.
        if (b) return true

        // If one finger moved significantly, ignore any further touches.
        if (a?.moved) return true

        // If a pointer is put down after being pulled up, ignore it.
        if (this.#pointers.has(ev.pointerId)) return true

        this.#pointers.set(ev.pointerId, {
            down: true,
            moved: false,
            ox: ev.offsetX,
            oy: ev.offsetY,
            x: ev.offsetX,
            y: ev.offsetY,
        })

        return true
    }

    #onpointermove(ev: PointerEvent): boolean {
        const ptr = this.#pointers.get(ev.pointerId)
        if (!ptr) return false

        // If we released this pointer, ignore any further movement.
        if (!ptr.down) return true

        ptr.x = ev.offsetX
        ptr.y = ev.offsetY

        if (!ptr.moved && Math.hypot(ptr.x - ptr.ox, ptr.y - ptr.oy) > 8) {
            ptr.moved = true
        }

        return true
    }

    #onpointerfinish(ev: PointerEvent): boolean {
        const ptr = this.#pointers.get(ev.pointerId)
        if (!ptr) return false

        // If any pointer is cancelled, stop tracking the rest.
        if (ev.type == "pointercancel") {
            this.#pointers.clear()
            return true
        }

        ptr.x = ev.offsetX
        ptr.y = ev.offsetY
        ptr.down = false

        let areAllReleased = true
        for (const v of this.#pointers.values()) {
            if (v.down) {
                areAllReleased = false
                break
            }
        }
        if (areAllReleased) {
            this.#ul0 = this.ul // Set the new permanent position.
            this.#pointers.clear()
        }

        return true
    }
}

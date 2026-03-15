import type { Tform2 } from "./tform"

export class Movable {
    #ow = 0 // offset width of reference element
    #oh = 0 // offset height of reference element

    #touches = new Map<number, Touch>()

    /**
     * Transformation from unit space to local space, not including the effects
     * of currently active touch pointers.
     */
    #ul: Tform2

    /**
     * Transformation from unit space to local space, including the effects of
     * currently active touch pointers.
     */
    get ul() {
        return this.#ul
    }

    /** @param tf Transformation from unit space to local space. */
    constructor(el: HTMLElement, tf: Tform2) {
        new ResizeObserver(([e]) => {
            this.#ow = e!.contentRect.width
            this.#oh = e!.contentRect.height
        }).observe(el, { box: "device-pixel-content-box" })

        this.#ul = tf
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
                this.#onwheel_zoom(ev as WheelEvent)
            } else {
                this.#onwheel_move(ev as WheelEvent)
            }
            return true
        }

        return false
    }

    #onwheel_zoom(ev: WheelEvent) {
        const { sx, sy, tx, ty } = this.#ul

        const ds =
            ev.deltaMode == 2 ? 2 ** ev.deltaY
            : ev.deltaMode == 1 ? 1.1 ** ev.deltaY
            : 1.01 ** ev.deltaY // 1 + Math.sign(ev.deltaY) * Math.sqrt(Math.abs(ev.deltaY)) * 0.03

        // keep pointer in same position after zooming
        const px = (2 * ev.offsetX - this.#ow) / this.#oh
        const py = 1 - (2 * ev.offsetY) / this.#oh

        this.#ul = {
            sx: sx * ds,
            sy: sy * ds,
            tx: tx + px * sx * (1 - ds),
            ty: ty + py * sy * (1 - ds),
        }
    }

    #onwheel_move(ev: WheelEvent) {
        const wx =
            (ev.deltaMode == 2 ? this.#ow
            : ev.deltaMode == 1 ? 16
            : 1) * ev.deltaX

        const wy =
            (ev.deltaMode == 2 ? this.#oh
            : ev.deltaMode == 1 ? 16
            : 1) * ev.deltaY

        const tf = this.#ul
        const dx = (wx / this.#oh) * 3 * tf.sx
        const dy = -(wy / this.#oh) * 3 * tf.sy

        this.#ul = {
            sx: tf.sx,
            sy: tf.sy,
            tx: tf.tx + dx,
            ty: tf.ty + dy,
        }
    }
}
